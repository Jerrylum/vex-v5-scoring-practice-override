import type { JoiningKit, Level, RoomPhase, RoomState, ScenarioSnapshot } from '@vex-v5-override/protocol';
import type { ConnectionState } from '@vex-v5-override/wrpc/client';
import { setOnRoomStateUpdateHandler } from './client-router';
import {
	connectRoom,
	createConnectionParams,
	getConnectionState,
	getRoomRpcClient,
	resetRoomClient,
	setConnectionStateListener
} from './roomClient';
import { buildRoomUrl, clearRoomUrl, generateUUID, setRoomUrl } from './identity';

class RoomSessionStore {
	kit = $state<JoiningKit | null>(null);
	connectionState = $state<ConnectionState>('offline');
	error = $state<string | null>(null);
	clientId = $state<string | null>(null);
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

	setError(message: string | null): void {
		this.error = message;
	}

	applyRemoteState(state: RoomState): void {
		if (!this.kit) return;

		this.syncingFromServer = true;
		this.kit = { ...this.kit, state };
		queueMicrotask(() => {
			this.syncingFromServer = false;
		});
	}

	async createRoom(difficulty: Level, scenario: ScenarioSnapshot): Promise<void> {
		this.error = null;

		const roomId = generateUUID();
		const connection = await connectRoom(createConnectionParams(roomId, 'create'));
		this.clientId = connection.clientId;

		const kit = await getRoomRpcClient().handshake.createRoom.mutation({ scenario });

		this.kit = kit;
		setRoomUrl(roomId);
	}

	async joinRoom(roomId: string): Promise<void> {
		this.error = null;

		const connection = await connectRoom(createConnectionParams(roomId, 'join'));
		this.clientId = connection.clientId;

		const kit = await getRoomRpcClient().handshake.joinRoom.mutation({});

		this.kit = kit;
		setRoomUrl(roomId);
	}

	async updateScoring(scoring: RoomState['scoring']): Promise<void> {
		if (this.syncingFromServer || !this.kit || this.connectionState !== 'connected') return;
		await getRoomRpcClient().room.updateScoring.mutation(scoring);
	}

	async regenerateScenario(scenario: ScenarioSnapshot): Promise<void> {
		if (!this.kit || this.connectionState !== 'connected') return;
		await getRoomRpcClient().room.regenerateScenario.mutation({ scenario });
	}

	async resetScoring(): Promise<void> {
		if (!this.kit || this.connectionState !== 'connected') return;
		await getRoomRpcClient().room.resetScoring.mutation();
	}

	async setShowAnswer(showAnswer: boolean): Promise<void> {
		if (!this.kit || this.connectionState !== 'connected') return;
		await getRoomRpcClient().room.setShowAnswer.mutation({ showAnswer });
	}

	async startScoring(): Promise<void> {
		if (!this.kit || this.connectionState !== 'connected') return;
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
		this.clientId = null;
		this.connectionState = getConnectionState();
		clearRoomUrl();
		setOnRoomStateUpdateHandler((state) => this.applyRemoteState(state));
	}
}

export const roomSession = new RoomSessionStore();
