import { describe, expect, it, vi } from 'vitest';
import { createDebouncedScoringUpdate, shouldApplyRemoteRevision } from './roomSync';
import { emptyUserScenarioScoring } from '@vex-v5-override/protocol';

describe('shouldApplyRemoteRevision', () => {
	it('accepts equal or newer revisions', () => {
		expect(shouldApplyRemoteRevision(5, 5)).toBe(true);
		expect(shouldApplyRemoteRevision(6, 5)).toBe(true);
	});

	it('rejects stale revisions', () => {
		expect(shouldApplyRemoteRevision(4, 5)).toBe(false);
	});
});

describe('createDebouncedScoringUpdate', () => {
	it('debounces flush calls', async () => {
		vi.useFakeTimers();
		const flush = vi.fn().mockResolvedValue(undefined);
		const debounced = createDebouncedScoringUpdate(flush, 200);

		const scoring = { ...emptyUserScenarioScoring(), midfieldGoal: { red: 1, blue: 0, yellow: 0 } };
		debounced.schedule(scoring);
		debounced.schedule({ ...scoring, midfieldGoal: { red: 2, blue: 0, yellow: 0 } });

		expect(flush).not.toHaveBeenCalled();
		vi.advanceTimersByTime(200);
		await Promise.resolve();
		expect(flush).toHaveBeenCalledTimes(1);
		expect(flush).toHaveBeenCalledWith({ ...scoring, midfieldGoal: { red: 2, blue: 0, yellow: 0 } });

		vi.useRealTimers();
	});

	it('flushNow sends pending immediately', async () => {
		const flush = vi.fn().mockResolvedValue(undefined);
		const debounced = createDebouncedScoringUpdate(flush, 200);
		const scoring = emptyUserScenarioScoring();

		debounced.schedule(scoring);
		await debounced.flushNow();

		expect(flush).toHaveBeenCalledWith(scoring);
	});
});
