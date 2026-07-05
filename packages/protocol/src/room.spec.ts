import { describe, expect, it } from 'vitest';
import { SNAPSHOT_VERSION } from './constants';
import {
	ConnectionIntentionSchema,
	CreateRoomInputSchema,
	JoinRoomInputSchema,
	JoiningKitSchema,
	RegenerateScenarioInputSchema,
	RoomStateSchema,
	parseConnectionIntention,
	parseJoiningKit,
	parseRoomState
} from './room';
import { emptyUserScenarioScoring } from './scoring';

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

const sampleRoomState = {
	revision: 0,
	phase: 'lobby' as const,
	hostClientId: '550e8400-e29b-41d4-a716-446655440000',
	scenario: sampleScenario,
	scoring: emptyUserScenarioScoring(),
	participants: [
		{
			clientId: '550e8400-e29b-41d4-a716-446655440001',
			deviceId: '550e8400-e29b-41d4-a716-446655440002',
			displayName: 'Ref 1',
			role: 'southWest' as const,
			joinedAt: '2026-07-05T00:00:00.000Z'
		}
	]
};

describe('RoomStateSchema', () => {
	it('parses a sample room state with nested scenario and scoring', () => {
		expect(RoomStateSchema.parse(sampleRoomState)).toEqual(sampleRoomState);
		expect(parseRoomState(sampleRoomState)).toEqual(sampleRoomState);
	});

	it('parses a joining kit', () => {
		const kit = {
			room: {
				roomId: '550e8400-e29b-41d4-a716-446655440010',
				createdAt: '2026-07-05T00:00:00.000Z'
			},
			state: sampleRoomState
		};
		expect(JoiningKitSchema.parse(kit)).toEqual(kit);
		expect(parseJoiningKit(kit)).toEqual(kit);
	});

	it('rejects missing required fields', () => {
		expect(() => RoomStateSchema.parse({ revision: 0 })).toThrow();
	});
});

describe('ConnectionIntentionSchema', () => {
	it('parses ws query params shape', () => {
		const intention = {
			roomId: '550e8400-e29b-41d4-a716-446655440010',
			clientId: '550e8400-e29b-41d4-a716-446655440001',
			deviceId: '550e8400-e29b-41d4-a716-446655440002',
			displayName: 'Ref 1',
			action: 'create' as const
		};
		expect(ConnectionIntentionSchema.parse(intention)).toEqual(intention);
		expect(parseConnectionIntention(intention)).toEqual(intention);
	});
});

describe('room RPC inputs', () => {
	it('parses create, join, and regenerate inputs', () => {
		expect(CreateRoomInputSchema.parse({ scenario: sampleScenario, displayName: 'Host' })).toEqual({
			scenario: sampleScenario,
			displayName: 'Host'
		});
		expect(JoinRoomInputSchema.parse({ displayName: 'Guest' })).toEqual({ displayName: 'Guest' });
		expect(RegenerateScenarioInputSchema.parse({ scenario: sampleScenario })).toEqual({ scenario: sampleScenario });
	});
});
