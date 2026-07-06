import { describe, expect, it } from 'vitest';
import { SNAPSHOT_VERSION } from '@vex-v5-override/protocol';
import {
	RoomAlreadyExistsError,
	RoomNotFoundError,
	createRoom,
	joinRoom,
	regenerateScenario,
	removeClient,
	resetScoring,
	setPhase,
	updateScoring,
	type RoomStoreData
} from './room-store';

const clientOneId = '550e8400-e29b-41d4-a716-446655440000';
const clientTwoId = '550e8400-e29b-41d4-a716-446655440001';
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
		const created = createRoom(data, roomId, clientOneId, 'Mac-7f3a', {
			scenario: sampleScenario
		});

		expect(created.state.phase).toBe('lobby');
		expect(created.state.participants).toHaveLength(1);
		expect(created.kit.room.roomId).toBe(roomId);

		data.meta = created.meta;
		data.state = created.state;

		expect(() =>
			createRoom(data, roomId, clientOneId, 'Mac-7f3a', {
				scenario: sampleScenario
			})
		).toThrow(RoomAlreadyExistsError);
	});

	it('does not duplicate participants when the same client joins again', () => {
		const data = emptyStore();
		const created = createRoom(data, roomId, clientOneId, 'Mac-7f3a', {
			scenario: sampleScenario
		});
		data.meta = created.meta;
		data.state = created.state;

		const joined = joinRoom(data, clientOneId, 'Mac-7f3a', {});
		expect(joined.state.participants).toHaveLength(1);
	});

	it('joins a room with a new client each time', () => {
		const data = emptyStore();
		const created = createRoom(data, roomId, clientOneId, 'Mac-7f3a', {
			scenario: sampleScenario
		});
		data.meta = created.meta;
		data.state = created.state;

		const joined = joinRoom(data, clientTwoId, 'Windows-b2c1', {});
		expect(joined.state.participants).toHaveLength(2);

		data.state = joined.state;
		const clientThreeId = '550e8400-e29b-41d4-a716-446655440002';
		const joinedAgain = joinRoom(data, clientThreeId, 'iOS-c4d5', {});
		expect(joinedAgain.state.participants).toHaveLength(3);
	});

	it('removes a disconnected client', () => {
		const data = emptyStore();
		const created = createRoom(data, roomId, clientOneId, 'Mac-7f3a', {
			scenario: sampleScenario
		});
		data.meta = created.meta;
		data.state = created.state;

		const joined = joinRoom(data, clientTwoId, 'Windows-b2c1', {});
		data.state = joined.state;

		const next = removeClient(data, clientTwoId);
		expect(next?.participants).toHaveLength(1);
		expect(next?.revision).toBe(1);
	});

	it('updates scoring with revision bump via patch merge', () => {
		const data = emptyStore();
		const created = createRoom(data, roomId, clientOneId, 'Mac-7f3a', {
			scenario: sampleScenario
		});
		data.meta = created.meta;
		data.state = created.state;

		const next = updateScoring(data, { midfieldGoal: { red: 1 } });
		expect(next.revision).toBe(1);
		expect(next.scoring.midfieldGoal.red).toBe(1);
		expect(next.scoring.midfieldGoal.blue).toBe(0);
	});

	it('merges concurrent quadrant field patches without clobbering other fields', () => {
		const data = emptyStore();
		const created = createRoom(data, roomId, clientOneId, 'Mac-7f3a', {
			scenario: sampleScenario
		});
		data.meta = created.meta;
		data.state = created.state;

		const afterRed = updateScoring(data, { redQuadrantOne: { red: 1 } });
		data.state = afterRed;
		const afterBlue = updateScoring(data, { redQuadrantOne: { blue: 2 } });

		expect(afterBlue.scoring.redQuadrantOne.red).toBe(1);
		expect(afterBlue.scoring.redQuadrantOne.blue).toBe(2);
		expect(afterBlue.revision).toBe(2);
	});

	it('allows any client to change phase and regenerate scenario', () => {
		const data = emptyStore();
		const created = createRoom(data, roomId, clientOneId, 'Mac-7f3a', {
			scenario: sampleScenario
		});
		data.meta = created.meta;
		data.state = created.state;

		const joined = joinRoom(data, clientTwoId, 'Windows-b2c1', {});
		data.state = joined.state;

		const next = setPhase(data, clientTwoId, 'scoring');
		data.state = next;
		expect(next.phase).toBe('scoring');
		expect(next.revision).toBe(1);

		const reset = resetScoring(data, clientTwoId);
		data.state = reset;
		expect(reset.revision).toBe(2);

		const nextScenario = { ...sampleScenario, difficulty: 'hard' as const };
		const regenerated = regenerateScenario(data, clientTwoId, { scenario: nextScenario });
		expect(regenerated.scenario.difficulty).toBe('hard');
		expect(regenerated.revision).toBe(3);
	});

	it('throws when room is missing', () => {
		expect(() => joinRoom({ meta: null, state: null }, clientTwoId, 'Guest', {})).toThrow(RoomNotFoundError);
	});
});
