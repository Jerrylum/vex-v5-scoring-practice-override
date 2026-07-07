import { describe, expect, it } from 'vitest';
import type { StackItem } from '@vex-v5-override/protocol';
import { PARTIAL_PLACED_PIN_OFFSET_Y_MM, PARTIAL_PLACED_PIN_PROBABILITY } from './fieldConstants';
import { maybeApplyPartialPlacedPin } from './partialPlacedPin';

const topPinStack: StackItem[] = [
	{ kind: 'pin', pinType: 'redBlue', isFlipped: false },
	{ kind: 'cup', isFlipped: false },
	{ kind: 'pin', pinType: 'redYellow', isFlipped: true }
];

describe('maybeApplyPartialPlacedPin', () => {
	it('does nothing for non-hard difficulty', () => {
		expect(maybeApplyPartialPlacedPin(topPinStack, 'medium', 123)).toBe(topPinStack);
	});

	it('does nothing when stack does not end in a pin', () => {
		const stack: StackItem[] = [
			{ kind: 'pin', pinType: 'redBlue', isFlipped: false },
			{ kind: 'cup', isFlipped: true }
		];
		expect(maybeApplyPartialPlacedPin(stack, 'hard', 123)).toBe(stack);
	});

	it('does nothing when stack is empty', () => {
		expect(maybeApplyPartialPlacedPin([], 'hard', 123)).toEqual([]);
	});

	it('is deterministic for a given seed', () => {
		const a = maybeApplyPartialPlacedPin(topPinStack, 'hard', 42_000);
		const b = maybeApplyPartialPlacedPin(topPinStack, 'hard', 42_000);
		expect(a).toEqual(b);
	});

	it('adds partialPlaced when roll succeeds', () => {
		let applied = false;
		for (let seed = 0; seed < 500; seed++) {
			const result = maybeApplyPartialPlacedPin(topPinStack, 'hard', seed);
			const last = result[result.length - 1];
			if (last?.kind === 'pin' && last.partialPlaced) {
				applied = true;
				expect(last.partialPlaced.offsetY).toBe(PARTIAL_PLACED_PIN_OFFSET_Y_MM);
				expect(last.pinType).toBe('redYellow');
				expect(last.isFlipped).toBe(true);
				break;
			}
		}
		expect(applied).toBe(true);
	});

	it('applies on roughly 10% of eligible seeds', () => {
		let applied = 0;
		const trials = 5000;
		for (let seed = 0; seed < trials; seed++) {
			const result = maybeApplyPartialPlacedPin(topPinStack, 'hard', seed);
			const last = result[result.length - 1];
			if (last?.kind === 'pin' && last.partialPlaced) {
				applied++;
			}
		}
		const rate = applied / trials;
		expect(rate).toBeGreaterThan(0.07);
		expect(rate).toBeLessThan(0.13);
		expect(PARTIAL_PLACED_PIN_PROBABILITY).toBe(0.1);
	});
});
