import type { JoiningKit, Level, RoomPhase, RoomState, ScenarioSnapshot } from '@vex-v5-override/protocol';
import type { ConnectionState } from '@vex-v5-override/wrpc/client';
import { setOnRoomStateUpdateHandler } from './client-router';
import { connectRoom, getConnectionState, getRoomRpcClient, resetRoomClient, setConnectionStateListener } from './roomClient';
import { buildRoomUrl, clearRoomUrl, generateUUID, getDefaultDisplayName, getOrCreateClientId, saveDisplayName, setRoomUrl } from './identity';

class RoomSessionStore {
	kit = $state<JoiningKit | null>(null);
	connectionState = $state<ConnectionState>('offline');
	error = $state<string | null>(null);
	displayName = $state(getDefaultDisplayName());
	isHost = $state(false);
	syncingFromServer = $state(false);

	constructor() {
		setConnectionStateListener((state) => {
			this.connectionState = state;
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

	get clientId(): string {
		return getOrCreateClientId();
	}

	setError(message: string | null): void {
		this.error = message;
	}

	applyRemoteState(state: RoomState): void {
		if (!this.kit) return;

		this.syncingFromServer = true;
		this.kit = { ...this.kit, state };
		this.isHost = state.hostClientId === this.clientId;
		queueMicrotask(() => {
			this.syncingFromServer = false;
		});
	}

	async createRoom(difficulty: Level, scenario: ScenarioSnapshot): Promise<void> {
		this.error = null;
		saveDisplayName(this.displayName);

		const roomId = generateUUID();
		await connectRoom({ roomId, displayName: this.displayName, action: 'create' });

		const kit = await getRoomRpcClient().handshake.createRoom.mutation({
			scenario,
			displayName: this.displayName
		});

		this.kit = kit;
		this.isHost = true;
		setRoomUrl(roomId);
	}

	async joinRoom(roomId: string): Promise<void> {
		this.error = null;
		saveDisplayName(this.displayName);

		await connectRoom({ roomId, displayName: this.displayName, action: 'join' });

		const kit = await getRoomRpcClient().handshake.joinRoom.mutation({
			displayName: this.displayName
		});

		this.kit = kit;
		this.isHost = kit.state.hostClientId === this.clientId;
		setRoomUrl(roomId);
	}

	async rejoinRoom(roomId: string): Promise<void> {
		this.error = null;
		saveDisplayName(this.displayName);
		await connectRoom({ roomId, displayName: this.displayName, action: 'rejoin' });

		const kit = await getRoomRpcClient().handshake.joinRoom.mutation({
			displayName: this.displayName
		});

		this.kit = kit;
		this.isHost = kit.state.hostClientId === this.clientId;
		setRoomUrl(roomId);
	}

	async updateScoring(scoring: RoomState['scoring']): Promise<void> {
		if (this.syncingFromServer || !this.kit || this.connectionState !== 'connected') return;
		await getRoomRpcClient().room.updateScoring.mutation(scoring);
	}

	async regenerateScenario(scenario: ScenarioSnapshot): Promise<void> {
		if (!this.isHost || !this.kit || this.connectionState !== 'connected') return;
		await getRoomRpcClient().room.regenerateScenario.mutation({ scenario });
	}

	async resetScoring(): Promise<void> {
		if (!this.isHost) return;
		await getRoomRpcClient().room.resetScoring.mutation();
	}

	async setShowAnswer(showAnswer: boolean): Promise<void> {
		if (!this.isHost) return;
		await getRoomRpcClient().room.setShowAnswer.mutation({ showAnswer });
	}

	async startScoring(): Promise<void> {
		if (!this.isHost) return;
		await getRoomRpcClient().room.setPhase.mutation({ phase: 'scoring' });
	}

	getRoomLink(): string | null {
		if (!this.roomId) return null;
		return buildRoomUrl(this.roomId);
	}

	disconnect(): void {
		setOnRoomStateUpdateHandler(null);
		resetRoomClient();
		this.kit = null;
		this.isHost = false;
		this.connectionState = getConnectionState();
		clearRoomUrl();
		setOnRoomStateUpdateHandler((state) => this.applyRemoteState(state));
	}
}

export const roomSession = new RoomSessionStore();
