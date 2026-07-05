import { describe, expect, it } from 'vitest';
import { ScenarioSnapshotSchema, SNAPSHOT_VERSION, StackItemSchema, parseScenarioSnapshot } from './scenario';

const minimalSnapshot = {
	version: SNAPSHOT_VERSION,
	difficulty: 'easy' as const,
	robots: { caseType: 'none' as const },
	midfield: { caseType: 'oneYY' as const, stack: [] },
	redQuadrantOne: {
		quadrantId: 'redQuadrantOne' as const,
		caseType: 'noPin' as const,
		toggleColor: 'yellow' as const,
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
		toggleColor: 'yellow' as const,
		allianceStack: [],
		neutralStack: []
	},
	remainingItems: { items: [] }
};

describe('ScenarioSnapshotSchema', () => {
	it('parses a valid minimal snapshot', () => {
		expect(ScenarioSnapshotSchema.parse(minimalSnapshot)).toEqual(minimalSnapshot);
	});

	it('rejects invalid version', () => {
		expect(() => ScenarioSnapshotSchema.parse({ ...minimalSnapshot, version: 5 })).toThrow();
	});

	it('parseScenarioSnapshot helper matches schema', () => {
		expect(parseScenarioSnapshot(minimalSnapshot)).toEqual(minimalSnapshot);
	});
});

describe('StackItemSchema', () => {
	it('parses pin and cup items', () => {
		expect(StackItemSchema.parse({ kind: 'pin', pinType: 'redBlue', isFlipped: false })).toEqual({
			kind: 'pin',
			pinType: 'redBlue',
			isFlipped: false
		});
		expect(StackItemSchema.parse({ kind: 'cup', isFlipped: true })).toEqual({
			kind: 'cup',
			isFlipped: true
		});
	});

	it('rejects malformed stack items', () => {
		expect(() => StackItemSchema.parse({ kind: 'pin', isFlipped: false })).toThrow();
		expect(() => StackItemSchema.parse({ kind: 'unknown', isFlipped: false })).toThrow();
	});
});
