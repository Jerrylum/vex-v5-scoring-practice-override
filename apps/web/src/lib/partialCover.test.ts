import { describe, expect, it } from 'vitest';
import type { StackItem } from '@vex-v5-override/protocol';
import { PARTIAL_COVER_PROBABILITY } from './fieldConstants';
import { maybeApplyPartialCover } from './partialCover';

const flippedTopCupStack: StackItem[] = [
	{ kind: 'pin', pinType: 'redBlue', isFlipped: false },
	{ kind: 'cup', isFlipped: true }
];

describe('maybeApplyPartialCover', () => {
	it('does nothing for non-hard difficulty', () => {
		expect(maybeApplyPartialCover(flippedTopCupStack, 'medium', 123)).toBe(flippedTopCupStack);
	});

	it('does nothing when stack does not end in a flipped cup', () => {
		const stack: StackItem[] = [
			{ kind: 'pin', pinType: 'redBlue', isFlipped: false },
			{ kind: 'cup', isFlipped: false }
		];
		expect(maybeApplyPartialCover(stack, 'hard', 123)).toBe(stack);
	});

	it('does nothing when stack is too short', () => {
		const stack: StackItem[] = [{ kind: 'cup', isFlipped: true }];
		expect(maybeApplyPartialCover(stack, 'hard', 123)).toBe(stack);
	});

	it('is deterministic for a given seed', () => {
		const a = maybeApplyPartialCover(flippedTopCupStack, 'hard', 42_000);
		const b = maybeApplyPartialCover(flippedTopCupStack, 'hard', 42_000);
		expect(a).toEqual(b);
	});

	it('adds partialCover when roll succeeds', () => {
		let applied = false;
		for (let seed = 0; seed < 500; seed++) {
			const result = maybeApplyPartialCover(flippedTopCupStack, 'hard', seed);
			const last = result[result.length - 1];
			if (last?.kind === 'cup' && last.partialCover) {
				applied = true;
				expect(last.partialCover.offsetY).toBe(45);
				expect(last.isFlipped).toBe(true);
				break;
			}
		}
		expect(applied).toBe(true);
	});

	it('applies on roughly 20% of eligible seeds', () => {
		let applied = 0;
		const trials = 2000;
		for (let seed = 0; seed < trials; seed++) {
			const result = maybeApplyPartialCover(flippedTopCupStack, 'hard', seed);
			const last = result[result.length - 1];
			if (last?.kind === 'cup' && last.partialCover) {
				applied++;
			}
		}
		const rate = applied / trials;
		expect(rate).toBeGreaterThan(0.15);
		expect(rate).toBeLessThan(0.25);
		expect(PARTIAL_COVER_PROBABILITY).toBe(0.2);
	});
});
