import { mergeNestedPatch, type JoiningKit, type RoomPhase, type RoomState, type ScenarioSnapshot, type ScoringPatch, type ScoringUpdateEvent } from '@vex-v5-override/protocol';
import type { ConnectionState } from '@vex-v5-override/wrpc/client';
import { setOnRoomStateUpdateHandler, setOnScoringPatchHandler } from './client-router';
import {
	connectRoom,
	createConnectionParams,
	getConnectionState,
	getRoomRpcClient,
	resetRoomClient,
	setConnectionStateListener,
	type RoomConnectionParams
} from './roomClient';
import { buildRoomUrl, clearRoomUrl, generateUUID, setRoomUrl } from './identity';
import { createDebouncedScoringPatchUpdate, shouldApplyRemoteRevision } from './roomSync';

/**
 * Client-side multiplayer session: room kit, connection state, and sync to the worker.
 *
 * wrpc only reconnects the WebSocket — it does not re-run joinRoom or refresh room state.
 * The server also removes a client from participants on disconnect. Recovery is handled here:
 * - resyncAfterReconnect: had a kit, transport dropped, wrpc came back → joinRoom for fresh snapshot
 * - completePendingHandshake: join/create never finished (e.g. server down on first load) → retry mutation
 */
class RoomSessionStore {
	kit = $state<JoiningKit | null>(null);
	connectionState = $state<ConnectionState>('offline');
	error = $state<string | null>(null);
	clientId = $state<string | null>(null);
	/** True while applying a server broadcast; blocks outbound scoring to avoid echo loops. */
	syncingFromServer = $state(false);
	lastAppliedRevision = $state(-1);

	private wasConnectedOnce = false;
	/** Set on reconnecting; cleared when resyncAfterReconnect runs on the next connected. */
	private pendingRoomResync = false;
	/**
	 * Connection params from an in-flight join/create. Kept when the handshake mutation fails so
	 * completePendingHandshake can retry after wrpc connects — roomId getter is null until kit exists.
	 */
	private pendingConnectionParams: RoomConnectionParams | null = null;
	private pendingCreateScenario: ScenarioSnapshot | null = null;
	/** Prevents completePendingHandshake from racing joinRoom/createRoom on the same connected event. */
	private handshakeInFlight = false;
	private resyncInFlight = false;
	/** User clicked Leave; suppresses auto re-join if wrpc fires connected during teardown. */
	private intentionalDisconnect = false;
	private scoringUpdate = createDebouncedScoringPatchUpdate((patch) => this.updateScoringPatch(patch));

	constructor() {
		setConnectionStateListener((state) => {
			this.connectionState = state;
			if (state === 'connected') {
				if (!this.intentionalDisconnect) {
					// Prefer resync when we already had a room; otherwise finish a never-completed handshake.
					if (this.pendingRoomResync && this.roomId) {
						void this.resyncAfterReconnect();
					} else if (this.pendingConnectionParams && !this.kit && !this.handshakeInFlight) {
						void this.completePendingHandshake();
					}
				}
				this.wasConnectedOnce = true;
			} else if (
				state === 'reconnecting' &&
				this.wasConnectedOnce &&
				// roomId is from kit; pendingConnectionParams covers the "server down on first join" case.
				(this.roomId || this.pendingConnectionParams) &&
				!this.intentionalDisconnect
			) {
				this.pendingRoomResync = true;
			}
		});
		setOnRoomStateUpdateHandler((state) => this.applyRemoteState(state));
		setOnScoringPatchHandler((event) => this.applyScoringPatch(event));
	}

	get roomState(): RoomState | null {
		return this.kit?.state ?? null;
	}

	get roomId(): string | null {
		return this.kit?.room.roomId ?? null;
	}

	get phase(): RoomPhase | null {
		return this.kit?.state.phase ?? null;
	}

	setError(message: string | null): void {
		this.error = message;
	}

	clearError(): void {
		this.error = null;
	}

	applyRemoteState(state: RoomState): void {
		if (!this.kit || !shouldApplyRemoteRevision(state.revision, this.lastAppliedRevision)) return;

		// Full state replaces scoring — drop all unsent local patches.
		this.scoringUpdate.cancel();
		this.lastAppliedRevision = state.revision;
		this.syncingFromServer = true;
		this.kit = { ...this.kit, state };
		queueMicrotask(() => {
			this.syncingFromServer = false;
		});
	}

	applyScoringPatch(event: ScoringUpdateEvent): void {
		if (!this.kit || !shouldApplyRemoteRevision(event.revision, this.lastAppliedRevision)) return;

		this.scoringUpdate.removeOverlapping(event.patch);
		this.lastAppliedRevision = event.revision;
		this.syncingFromServer = true;
		this.kit = {
			...this.kit,
			state: {
				...this.kit.state,
				revision: event.revision,
				scoring: mergeNestedPatch(this.kit.state.scoring, event.patch)
			}
		};
		queueMicrotask(() => {
			this.syncingFromServer = false;
		});
	}

	private applyKit(kit: JoiningKit, roomId: string, clientId: string): void {
		this.kit = kit;
		this.clientId = clientId;
		this.lastAppliedRevision = kit.state.revision;
		this.pendingConnectionParams = null;
		this.pendingCreateScenario = null;
		setRoomUrl(roomId);
	}

	scheduleScoringPatch(patch: ScoringPatch): void {
		if (this.syncingFromServer || !this.kit || this.connectionState !== 'connected') return;
		this.scoringUpdate.schedule(patch);
	}

	async flushScoringUpdate(): Promise<void> {
		await this.scoringUpdate.flushNow();
	}

	async createRoom(scenario: ScenarioSnapshot): Promise<void> {
		this.clearError();
		this.intentionalDisconnect = false;

		const roomId = generateUUID();
		await this.runHandshake(connectRoom(createConnectionParams(roomId, 'create')), scenario);
	}

	async joinRoom(roomId: string): Promise<void> {
		this.clearError();
		this.intentionalDisconnect = false;

		await this.runHandshake(connectRoom(createConnectionParams(roomId, 'join')));
	}

	private async runHandshake(connection: RoomConnectionParams, createScenario?: ScenarioSnapshot): Promise<void> {
		// Stash params before mutation so completePendingHandshake can retry if the server is unreachable.
		this.pendingConnectionParams = connection;
		this.pendingCreateScenario = createScenario ?? null;
		this.handshakeInFlight = true;

		try {
			const kit = await this.callHandshakeMutation(connection);
			this.applyKit(kit, connection.roomId, connection.clientId);
		} finally {
			this.handshakeInFlight = false;
		}
	}

	private async callHandshakeMutation(params: RoomConnectionParams): Promise<JoiningKit> {
		if (params.action === 'create') {
			if (!this.pendingCreateScenario) {
				throw new Error('Missing scenario for room creation');
			}
			return this.callMutation(() => getRoomRpcClient().handshake.createRoom.mutation({ scenario: this.pendingCreateScenario! }));
		}

		return this.callJoinMutation();
	}

	private callJoinMutation(): Promise<JoiningKit> {
		return this.callMutation(() => getRoomRpcClient().handshake.joinRoom.mutation({}));
	}

	/**
	 * Finish join/create after wrpc connects when the initial handshake mutation never succeeded.
	 * Uses the same clientId from pendingConnectionParams (wrpc reconnect keeps that id).
	 */
	private async completePendingHandshake(): Promise<void> {
		const params = this.pendingConnectionParams;
		if (!params || this.kit || this.resyncInFlight || this.intentionalDisconnect) return;

		this.resyncInFlight = true;

		try {
			this.clearError();
			const kit = await this.callHandshakeMutation(params);
			this.applyKit(kit, params.roomId, params.clientId);
		} catch (error) {
			console.error('Pending room handshake failed:', error);
		} finally {
			this.resyncInFlight = false;
		}
	}

	/**
	 * Re-join after a transport drop when we already had a kit. Server removes participants on
	 * webSocketClose; joinRoom returns a fresh snapshot and re-adds this tab (idempotent on server).
	 */
	private async resyncAfterReconnect(): Promise<void> {
		const roomId = this.roomId;
		const clientId = this.clientId;
		if (!roomId || !clientId || this.resyncInFlight || this.intentionalDisconnect) return;

		this.resyncInFlight = true;
		this.pendingRoomResync = false;

		try {
			this.clearError();
			const kit = await this.callJoinMutation();
			this.applyKit(kit, roomId, clientId);
		} catch (error) {
			console.error('Room resync after reconnect failed:', error);
		} finally {
			this.resyncInFlight = false;
		}
	}

	private async callMutation<T>(fn: () => Promise<T>): Promise<T> {
		try {
			return await fn();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Room request failed';
			this.setError(message);
			throw error;
		}
	}

	async updateScoringPatch(patch: ScoringPatch): Promise<void> {
		if (this.syncingFromServer || !this.kit || this.connectionState !== 'connected') return;
		await this.callMutation(() => getRoomRpcClient().room.updateScoring.mutation(patch));
	}

	async regenerateScenario(scenario: ScenarioSnapshot): Promise<void> {
		if (!this.kit || this.connectionState !== 'connected') return;
		await this.callMutation(() => getRoomRpcClient().room.regenerateScenario.mutation({ scenario }));
	}

	async resetScoring(): Promise<void> {
		if (!this.kit || this.connectionState !== 'connected') return;
		await this.callMutation(() => getRoomRpcClient().room.resetScoring.mutation());
	}

	async setShowAnswer(showAnswer: boolean): Promise<void> {
		if (!this.kit || this.connectionState !== 'connected') return;
		await this.callMutation(() => getRoomRpcClient().room.setShowAnswer.mutation({ showAnswer }));
	}

	async startScoring(): Promise<void> {
		if (!this.kit || this.connectionState !== 'connected') return;
		await this.callMutation(() => getRoomRpcClient().room.setPhase.mutation({ phase: 'scoring' }));
	}

	getRoomLink(): string | null {
		if (!this.roomId) return null;
		return buildRoomUrl(this.roomId);
	}

	disconnect(): void {
		this.intentionalDisconnect = true;
		// Clear recovery flags before resetRoomClient so a late 'connected' does not re-join.
		this.pendingRoomResync = false;
		this.pendingConnectionParams = null;
		this.pendingCreateScenario = null;
		this.scoringUpdate.cancel();
		setOnRoomStateUpdateHandler(null);
		setOnScoringPatchHandler(null);
		resetRoomClient();
		this.kit = null;
		this.clientId = null;
		this.lastAppliedRevision = -1;
		this.wasConnectedOnce = false;
		this.connectionState = getConnectionState();
		clearRoomUrl();
		setOnRoomStateUpdateHandler((state) => this.applyRemoteState(state));
		setOnScoringPatchHandler((event) => this.applyScoringPatch(event));
	}
}

export const roomSession = new RoomSessionStore();
