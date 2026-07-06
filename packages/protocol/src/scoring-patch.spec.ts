import { describe, expect, it } from 'vitest';
import {
	emptyUserScenarioScoring,
	mergeScoringPatch,
	mergeScoringPatches,
	removeOverlappingFromPatch
} from './scoring';

describe('mergeScoringPatch', () => {
	it('merges different fields in the same quadrant without clobbering', () => {
		const current = emptyUserScenarioScoring();
		const afterRed = mergeScoringPatch(current, { redQuadrantOne: { red: 1 } });
		const afterBoth = mergeScoringPatch(afterRed, { redQuadrantOne: { blue: 2 } });

		expect(afterBoth.redQuadrantOne.red).toBe(1);
		expect(afterBoth.redQuadrantOne.blue).toBe(2);
	});

	it('last write wins for the same field', () => {
		const current = emptyUserScenarioScoring();
		const first = mergeScoringPatch(current, { redQuadrantOne: { red: 1 } });
		const second = mergeScoringPatch(first, { redQuadrantOne: { red: 3 } });

		expect(second.redQuadrantOne.red).toBe(3);
	});
});

describe('mergeScoringPatches', () => {
	it('accumulates pending client patches before flush', () => {
		const merged = mergeScoringPatches(
			{ redQuadrantOne: { red: 1 } },
			{ redQuadrantOne: { blue: 2 }, midfieldGoal: { yellow: 1 } }
		);

		expect(merged).toEqual({
			redQuadrantOne: { red: 1, blue: 2 },
			midfieldGoal: { yellow: 1 }
		});
	});
});

describe('removeOverlappingFromPatch', () => {
	it('removes only fields present in the applied patch', () => {
		const pending = {
			redQuadrantOne: { red: 2, blue: 1 },
			midfieldGoal: { yellow: 1 }
		};
		const remaining = removeOverlappingFromPatch(pending, { redQuadrantOne: { red: 1 } });

		expect(remaining).toEqual({
			redQuadrantOne: { blue: 1 },
			midfieldGoal: { yellow: 1 }
		});
	});

	it('returns null when all pending fields were applied remotely', () => {
		const pending = { redQuadrantOne: { red: 1 } };
		expect(removeOverlappingFromPatch(pending, { redQuadrantOne: { red: 1 } })).toBeNull();
	});
});
