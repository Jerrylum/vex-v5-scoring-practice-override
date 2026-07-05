import { describe, expect, it } from 'vitest';
import { SNAPSHOT_VERSION } from '@vex-v5-override/protocol';
import {
	NotHostError,
	RoomAlreadyExistsError,
	RoomNotFoundError,
	createRoom,
	joinRoom,
	regenerateScenario,
	resetScoring,
	setPhase,
	updateScoring,
	type RoomStoreData
} from './room-store';

const hostClientId = '550e8400-e29b-41d4-a716-446655440000';
const guestClientId = '550e8400-e29b-41d4-a716-446655440001';
const hostDeviceId = '550e8400-e29b-41d4-a716-446655440010';
const guestDeviceId = '550e8400-e29b-41d4-a716-446655440011';
const roomId = '550e8400-e29b-41d4-a716-446655440020';

const sampleScenario = {
	version: SNAPSHOT_VERSION,
	difficulty: 'medium' as const,
	robots: { caseType: 'clawbotOnField' as const, placements: [] },
	midfield: { caseType: 'shortStack' as const, stack: [] },
	redQuadrantOne: {
		quadrantId: 'redQuadrantOne' as const,
		caseType: 'shortStack' as const,
		toggleColor: 'red' as const,
		allianceStack: [],
		neutralStack: []
	},
	redQuadrantTwo: {
		quadrantId: 'redQuadrantTwo' as const,
		caseType: 'noPin' as const,
		toggleColor: 'yellow' as const,
		allianceStack: [],
		neutralStack: []
	},
	blueQuadrantOne: {
		quadrantId: 'blueQuadrantOne' as const,
		caseType: 'noPin' as const,
		toggleColor: 'yellow' as const,
		allianceStack: [],
		neutralStack: []
	},
	blueQuadrantTwo: {
		quadrantId: 'blueQuadrantTwo' as const,
		caseType: 'noPin' as const,
		toggleColor: 'blue' as const,
		allianceStack: [],
		neutralStack: []
	},
	remainingItems: { items: [] }
};

function emptyStore(): RoomStoreData {
	return { meta: null, state: null };
}

describe('room-store', () => {
	it('creates a room and rejects duplicate create', () => {
		const data = emptyStore();
		const created = createRoom(data, roomId, hostClientId, hostDeviceId, {
			scenario: sampleScenario,
			displayName: 'Host'
		});

		expect(created.state.phase).toBe('lobby');
		expect(created.state.hostClientId).toBe(hostClientId);
		expect(created.kit.room.roomId).toBe(roomId);

		data.meta = created.meta;
		data.state = created.state;

		expect(() =>
			createRoom(data, roomId, hostClientId, hostDeviceId, {
				scenario: sampleScenario,
				displayName: 'Host'
			})
		).toThrow(RoomAlreadyExistsError);
	});

	it('joins a room and rejoins an existing participant', () => {
		const data = emptyStore();
		const created = createRoom(data, roomId, hostClientId, hostDeviceId, {
			scenario: sampleScenario,
			displayName: 'Host'
		});
		data.meta = created.meta;
		data.state = created.state;

		const joined = joinRoom(data, guestClientId, guestDeviceId, { displayName: 'Guest' });
		expect(joined.state.participants).toHaveLength(2);

		data.state = joined.state;
		const rejoined = joinRoom(data, guestClientId, guestDeviceId, { displayName: 'Guest Renamed' });
		expect(rejoined.state.participants).toHaveLength(2);
		expect(rejoined.state.participants[1]?.displayName).toBe('Guest Renamed');
	});

	it('updates scoring with revision bump', () => {
		const data = emptyStore();
		const created = createRoom(data, roomId, hostClientId, hostDeviceId, {
			scenario: sampleScenario,
			displayName: 'Host'
		});
		data.meta = created.meta;
		data.state = created.state;

		const scoring = { ...created.state.scoring, midfieldGoal: { red: 1, blue: 0, yellow: 0 } };
		const next = updateScoring(data, scoring);
		expect(next.revision).toBe(1);
		expect(next.scoring.midfieldGoal.red).toBe(1);
	});

	it('restricts host-only actions', () => {
		const data = emptyStore();
		const created = createRoom(data, roomId, hostClientId, hostDeviceId, {
			scenario: sampleScenario,
			displayName: 'Host'
		});
		data.meta = created.meta;
		data.state = created.state;

		expect(() => resetScoring(data, guestClientId)).toThrow(NotHostError);
		expect(() => setPhase(data, guestClientId, 'scoring')).toThrow(NotHostError);

		const next = setPhase(data, hostClientId, 'scoring');
		expect(next.phase).toBe('scoring');
		expect(next.revision).toBe(1);
	});

	it('regenerates scenario and resets scoring for host', () => {
		const data = emptyStore();
		const created = createRoom(data, roomId, hostClientId, hostDeviceId, {
			scenario: sampleScenario,
			displayName: 'Host'
		});
		data.meta = created.meta;
		data.state = {
			...created.state,
			scoring: {
				...created.state.scoring,
				midfieldGoal: { red: 2, blue: 0, yellow: 0 }
			}
		};

		const nextScenario = { ...sampleScenario, difficulty: 'hard' as const };
		const next = regenerateScenario(data, hostClientId, { scenario: nextScenario });
		expect(next.scenario.difficulty).toBe('hard');
		expect(next.scoring.midfieldGoal.red).toBe(0);
		expect(next.revision).toBe(1);
	});

	it('throws when room is missing', () => {
		expect(() => joinRoom({ meta: null, state: null }, guestClientId, guestDeviceId, { displayName: 'Guest' })).toThrow(
			RoomNotFoundError
		);
	});
});
