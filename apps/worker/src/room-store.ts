import type {
	CreateRoomInput,
	JoinRoomInput,
	JoiningKit,
	Participant,
	RegenerateScenarioInput,
	RoomMeta,
	RoomPhase,
	RoomState,
	ScenarioSnapshot,
	UpdateScoringInput
} from '@vex-v5-override/protocol';
import { emptyUserScenarioScoring } from '@vex-v5-override/protocol';

export class RoomNotFoundError extends Error {
	constructor() {
		super('Room not found');
		this.name = 'RoomNotFoundError';
	}
}

export class RoomAlreadyExistsError extends Error {
	constructor() {
		super('Room already exists');
		this.name = 'RoomAlreadyExistsError';
	}
}

export class NotHostError extends Error {
	constructor() {
		super('Only the host can perform this action');
		this.name = 'NotHostError';
	}
}

export interface RoomStoreData {
	meta: RoomMeta | null;
	state: RoomState | null;
}

export function createRoomMeta(roomId: string): RoomMeta {
	return {
		roomId,
		createdAt: new Date().toISOString()
	};
}

function createParticipant(clientId: string, deviceId: string, displayName: string): Participant {
	return {
		clientId,
		deviceId,
		displayName,
		role: null,
		joinedAt: new Date().toISOString()
	};
}

export function createInitialRoomState(
	hostClientId: string,
	deviceId: string,
	displayName: string,
	scenario: ScenarioSnapshot
): RoomState {
	return {
		revision: 0,
		phase: 'lobby',
		hostClientId,
		scenario,
		scoring: emptyUserScenarioScoring(),
		participants: [createParticipant(hostClientId, deviceId, displayName)],
		showAnswer: false
	};
}

export function buildJoiningKit(meta: RoomMeta, state: RoomState): JoiningKit {
	return { room: meta, state };
}

export function assertHost(state: RoomState, clientId: string): void {
	if (state.hostClientId !== clientId) {
		throw new NotHostError();
	}
}

export function bumpRevision(state: RoomState): RoomState {
	return { ...state, revision: state.revision + 1 };
}

export function createRoom(
	data: RoomStoreData,
	roomId: string,
	clientId: string,
	deviceId: string,
	input: CreateRoomInput
): { meta: RoomMeta; state: RoomState; kit: JoiningKit } {
	if (data.meta !== null || data.state !== null) {
		throw new RoomAlreadyExistsError();
	}

	const meta = createRoomMeta(roomId);
	const state = createInitialRoomState(clientId, deviceId, input.displayName, input.scenario);
	return { meta, state, kit: buildJoiningKit(meta, state) };
}

export function joinRoom(
	data: RoomStoreData,
	clientId: string,
	deviceId: string,
	input: JoinRoomInput
): { state: RoomState; kit: JoiningKit } {
	if (data.meta === null || data.state === null) {
		throw new RoomNotFoundError();
	}

	const existing = data.state.participants.find((p) => p.clientId === clientId);
	let state: RoomState;

	if (existing) {
		state = {
			...data.state,
			participants: data.state.participants.map((p) =>
				p.clientId === clientId ? { ...p, displayName: input.displayName, deviceId } : p
			)
		};
	} else {
		state = {
			...data.state,
			participants: [...data.state.participants, createParticipant(clientId, deviceId, input.displayName)]
		};
	}

	return { state, kit: buildJoiningKit(data.meta, state) };
}

export function updateScoring(data: RoomStoreData, scoring: UpdateScoringInput): RoomState {
	if (data.state === null) {
		throw new RoomNotFoundError();
	}

	return bumpRevision({ ...data.state, scoring });
}

export function regenerateScenario(data: RoomStoreData, clientId: string, input: RegenerateScenarioInput): RoomState {
	if (data.state === null) {
		throw new RoomNotFoundError();
	}

	assertHost(data.state, clientId);

	return bumpRevision({
		...data.state,
		scenario: input.scenario,
		scoring: emptyUserScenarioScoring(),
		showAnswer: false
	});
}

export function resetScoring(data: RoomStoreData, clientId: string): RoomState {
	if (data.state === null) {
		throw new RoomNotFoundError();
	}

	assertHost(data.state, clientId);

	return bumpRevision({
		...data.state,
		scoring: emptyUserScenarioScoring(),
		showAnswer: false
	});
}

export function setShowAnswer(data: RoomStoreData, clientId: string, showAnswer: boolean): RoomState {
	if (data.state === null) {
		throw new RoomNotFoundError();
	}

	assertHost(data.state, clientId);

	return bumpRevision({ ...data.state, showAnswer });
}

export function setPhase(data: RoomStoreData, clientId: string, phase: RoomPhase): RoomState {
	if (data.state === null) {
		throw new RoomNotFoundError();
	}

	assertHost(data.state, clientId);

	return bumpRevision({ ...data.state, phase });
}
