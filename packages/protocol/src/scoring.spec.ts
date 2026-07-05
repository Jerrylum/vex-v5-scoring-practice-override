import { describe, expect, it } from 'vitest';
import { UserScenarioScoringSchema, emptyUserScenarioScoring, parseUserScenarioScoring } from './scoring';

describe('UserScenarioScoringSchema', () => {
	it('parses emptyUserScenarioScoring()', () => {
		const empty = emptyUserScenarioScoring();
		expect(UserScenarioScoringSchema.parse(empty)).toEqual(empty);
		expect(parseUserScenarioScoring(empty)).toEqual(empty);
	});

	it('rejects negative counts', () => {
		const invalid = {
			...emptyUserScenarioScoring(),
			redQuadrantOne: { red: -1, blue: 0, yellow: 0, toggleColor: 'yellow' as const }
		};
		expect(() => UserScenarioScoringSchema.parse(invalid)).toThrow();
	});

	it('rejects counts above max', () => {
		const invalid = {
			...emptyUserScenarioScoring(),
			midfieldGoal: { red: 101, blue: 0, yellow: 0 }
		};
		expect(() => UserScenarioScoringSchema.parse(invalid)).toThrow();
	});
});
