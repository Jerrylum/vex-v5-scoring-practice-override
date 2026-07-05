import type { JoiningKit, RoomPhase, RoomState, ScenarioSnapshot } from '@vex-v5-override/protocol';
import type { ConnectionState } from '@vex-v5-override/wrpc/client';
import { setOnRoomStateUpdateHandler } from './client-router';
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
import { createDebouncedScoringUpdate, shouldApplyRemoteRevision } from './roomSync';

class RoomSessionStore {
	kit = $state<JoiningKit | null>(null);
	connectionState = $state<ConnectionState>('offline');
	error = $state<string | null>(null);
	clientId = $state<string | null>(null);
	syncingFromServer = $state(false);
	lastAppliedRevision = $state(-1);

	private wasConnectedOnce = false;
	private pendingRoomResync = false;
	private pendingConnectionParams: RoomConnectionParams | null = null;
	private pendingCreateScenario: ScenarioSnapshot | null = null;
	private handshakeInFlight = false;
	private resyncInFlight = false;
	private intentionalDisconnect = false;
	private scoringUpdate = createDebouncedScoringUpdate((scoring) => this.updateScoring(scoring));

	constructor() {
		setConnectionStateListener((state) => {
			this.connectionState = state;
			if (state === 'connected') {
				if (!this.intentionalDisconnect) {
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
				(this.roomId || this.pendingConnectionParams) &&
				!this.intentionalDisconnect
			) {
				this.pendingRoomResync = true;
			}
		});
		setOnRoomStateUpdateHandler((state) => this.applyRemoteState(state));
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

		this.scoringUpdate.cancel();
		this.lastAppliedRevision = state.revision;
		this.syncingFromServer = true;
		this.kit = { ...this.kit, state };
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

	scheduleScoringUpdate(scoring: RoomState['scoring']): void {
		if (this.syncingFromServer || !this.kit || this.connectionState !== 'connected') return;
		this.scoringUpdate.schedule(scoring);
	}

	async flushScoringUpdate(): Promise<void> {
		await this.scoringUpdate.flushNow();
	}

	async createRoom(scenario: ScenarioSnapshot): Promise<void> {
		this.clearError();
		this.intentionalDisconnect = false;

		const roomId = generateUUID();
		const connection = await connectRoom(createConnectionParams(roomId, 'create'));
		this.pendingConnectionParams = connection;
		this.pendingCreateScenario = scenario;
		this.handshakeInFlight = true;

		try {
			const kit = await this.callMutation(() => getRoomRpcClient().handshake.createRoom.mutation({ scenario }));
			this.applyKit(kit, roomId, connection.clientId);
		} finally {
			this.handshakeInFlight = false;
		}
	}

	async joinRoom(roomId: string): Promise<void> {
		this.clearError();
		this.intentionalDisconnect = false;

		const connection = await connectRoom(createConnectionParams(roomId, 'join'));
		this.pendingConnectionParams = connection;
		this.pendingCreateScenario = null;
		this.handshakeInFlight = true;

		try {
			const kit = await this.callMutation(() => getRoomRpcClient().handshake.joinRoom.mutation({}));
			this.applyKit(kit, roomId, connection.clientId);
		} finally {
			this.handshakeInFlight = false;
		}
	}

	private async completePendingHandshake(): Promise<void> {
		const params = this.pendingConnectionParams;
		if (!params || this.kit || this.resyncInFlight || this.intentionalDisconnect) return;

		this.resyncInFlight = true;

		try {
			this.clearError();
			const kit =
				params.action === 'create'
					? await this.callMutation(() => {
							if (!this.pendingCreateScenario) {
								throw new Error('Missing scenario for room creation');
							}
							return getRoomRpcClient().handshake.createRoom.mutation({ scenario: this.pendingCreateScenario });
						})
					: await this.callMutation(() => getRoomRpcClient().handshake.joinRoom.mutation({}));
			this.applyKit(kit, params.roomId, params.clientId);
		} catch (error) {
			console.error('Pending room handshake failed:', error);
		} finally {
			this.resyncInFlight = false;
		}
	}

	private async resyncAfterReconnect(): Promise<void> {
		const roomId = this.roomId;
		const clientId = this.clientId;
		if (!roomId || !clientId || this.resyncInFlight || this.intentionalDisconnect) return;

		this.resyncInFlight = true;
		this.pendingRoomResync = false;

		try {
			this.clearError();
			const kit = await this.callMutation(() => getRoomRpcClient().handshake.joinRoom.mutation({}));
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

	async updateScoring(scoring: RoomState['scoring']): Promise<void> {
		if (this.syncingFromServer || !this.kit || this.connectionState !== 'connected') return;
		const next = await this.callMutation(() => getRoomRpcClient().room.updateScoring.mutation(scoring));
		this.applyRemoteState(next);
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
		this.pendingRoomResync = false;
		this.pendingConnectionParams = null;
		this.pendingCreateScenario = null;
		this.scoringUpdate.cancel();
		setOnRoomStateUpdateHandler(null);
		resetRoomClient();
		this.kit = null;
		this.clientId = null;
		this.lastAppliedRevision = -1;
		this.wasConnectedOnce = false;
		this.connectionState = getConnectionState();
		clearRoomUrl();
		setOnRoomStateUpdateHandler((state) => this.applyRemoteState(state));
	}
}

export const roomSession = new RoomSessionStore();
