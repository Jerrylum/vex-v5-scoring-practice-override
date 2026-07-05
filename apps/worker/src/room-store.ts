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

function createParticipant(clientId: string, displayName: string): Participant {
	return {
		clientId,
		deviceId: clientId,
		displayName,
		role: null,
		joinedAt: new Date().toISOString()
	};
}

export function createInitialRoomState(displayName: string, scenario: ScenarioSnapshot, clientId: string): RoomState {
	return {
		revision: 0,
		phase: 'lobby',
		scenario,
		scoring: emptyUserScenarioScoring(),
		participants: [createParticipant(clientId, displayName)],
		showAnswer: false
	};
}

export function buildJoiningKit(meta: RoomMeta, state: RoomState): JoiningKit {
	return { room: meta, state };
}

export function bumpRevision(state: RoomState): RoomState {
	return { ...state, revision: state.revision + 1 };
}

export function createRoom(
	data: RoomStoreData,
	roomId: string,
	clientId: string,
	displayName: string,
	input: CreateRoomInput
): { meta: RoomMeta; state: RoomState; kit: JoiningKit } {
	if (data.meta !== null || data.state !== null) {
		throw new RoomAlreadyExistsError();
	}

	const meta = createRoomMeta(roomId);
	const state = createInitialRoomState(displayName, input.scenario, clientId);
	return { meta, state, kit: buildJoiningKit(meta, state) };
}

export function joinRoom(data: RoomStoreData, clientId: string, displayName: string, _input: JoinRoomInput): {
	state: RoomState;
	kit: JoiningKit;
} {
	if (data.meta === null || data.state === null) {
		throw new RoomNotFoundError();
	}

	const state: RoomState = {
		...data.state,
		participants: [...data.state.participants, createParticipant(clientId, displayName)]
	};

	return { state, kit: buildJoiningKit(data.meta, state) };
}

export function removeClient(data: RoomStoreData, clientId: string): RoomState | null {
	if (data.state === null) {
		return null;
	}

	const participants = data.state.participants.filter((p) => p.clientId !== clientId);
	if (participants.length === data.state.participants.length) {
		return data.state;
	}

	return bumpRevision({ ...data.state, participants });
}

export function updateScoring(data: RoomStoreData, scoring: UpdateScoringInput): RoomState {
	if (data.state === null) {
		throw new RoomNotFoundError();
	}

	return bumpRevision({ ...data.state, scoring });
}

export function regenerateScenario(data: RoomStoreData, _clientId: string, input: RegenerateScenarioInput): RoomState {
	if (data.state === null) {
		throw new RoomNotFoundError();
	}

	return bumpRevision({
		...data.state,
		scenario: input.scenario,
		scoring: emptyUserScenarioScoring(),
		showAnswer: false
	});
}

export function resetScoring(data: RoomStoreData, _clientId: string): RoomState {
	if (data.state === null) {
		throw new RoomNotFoundError();
	}

	return bumpRevision({
		...data.state,
		scoring: emptyUserScenarioScoring(),
		showAnswer: false
	});
}

export function setShowAnswer(data: RoomStoreData, _clientId: string, showAnswer: boolean): RoomState {
	if (data.state === null) {
		throw new RoomNotFoundError();
	}

	return bumpRevision({ ...data.state, showAnswer });
}

export function setPhase(data: RoomStoreData, _clientId: string, phase: RoomPhase): RoomState {
	if (data.state === null) {
		throw new RoomNotFoundError();
	}

	return bumpRevision({ ...data.state, phase });
}
