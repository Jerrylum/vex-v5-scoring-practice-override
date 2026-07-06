import { describe, expect, it, vi } from 'vitest';
import { createDebouncedScoringPatchUpdate, shouldApplyRemoteRevision } from './roomSync';

describe('shouldApplyRemoteRevision', () => {
	it('accepts equal or newer revisions', () => {
		expect(shouldApplyRemoteRevision(5, 5)).toBe(true);
		expect(shouldApplyRemoteRevision(6, 5)).toBe(true);
	});

	it('rejects stale revisions', () => {
		expect(shouldApplyRemoteRevision(4, 5)).toBe(false);
	});
});

describe('createDebouncedScoringPatchUpdate', () => {
	it('debounces and merges patch flush calls', async () => {
		vi.useFakeTimers();
		const flush = vi.fn().mockResolvedValue(undefined);
		const debounced = createDebouncedScoringPatchUpdate(flush, 200);

		debounced.schedule({ redQuadrantOne: { red: 1 } });
		debounced.schedule({ redQuadrantOne: { blue: 2 } });

		expect(flush).not.toHaveBeenCalled();
		vi.advanceTimersByTime(200);
		await Promise.resolve();
		expect(flush).toHaveBeenCalledTimes(1);
		expect(flush).toHaveBeenCalledWith({ redQuadrantOne: { red: 1, blue: 2 } });

		vi.useRealTimers();
	});

	it('flushNow sends pending immediately', async () => {
		const flush = vi.fn().mockResolvedValue(undefined);
		const debounced = createDebouncedScoringPatchUpdate(flush, 200);

		debounced.schedule({ midfieldGoal: { red: 1 } });
		await debounced.flushNow();

		expect(flush).toHaveBeenCalledWith({ midfieldGoal: { red: 1 } });
	});

	it('removeOverlapping keeps unrelated pending fields', async () => {
		vi.useFakeTimers();
		const flush = vi.fn().mockResolvedValue(undefined);
		const debounced = createDebouncedScoringPatchUpdate(flush, 200);

		debounced.schedule({ redQuadrantOne: { red: 2, blue: 1 } });
		debounced.removeOverlapping({ redQuadrantOne: { red: 1 } });

		vi.advanceTimersByTime(200);
		await Promise.resolve();
		vi.useRealTimers();

		expect(flush).toHaveBeenCalledWith({ redQuadrantOne: { blue: 1 } });
	});
});
