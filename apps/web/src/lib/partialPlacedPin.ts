import type { Level, StackItem } from '@vex-v5-override/protocol';
import { PARTIAL_PLACED_PIN_OFFSET_Y_MM, PARTIAL_PLACED_PIN_PROBABILITY, PARTIAL_PLACED_PIN_TILT_RAD } from './fieldConstants';
import { mulberry32 } from './utils';

export const PARTIAL_PLACED_PIN_SEED_OFFSET = 9_002;

/** Apply PartialPlacedPin pose when hard difficulty and stack ends in a pin (10% chance). */
export function maybeApplyPartialPlacedPin(stack: StackItem[], difficulty: Level, seed: number): StackItem[] {
	if (difficulty !== 'hard' || stack.length === 0) {
		return stack;
	}

	const last = stack[stack.length - 1];
	if (last?.kind !== 'pin' || last.partialPlaced) {
		return stack;
	}

	const random = mulberry32(seed);
	if (random() >= PARTIAL_PLACED_PIN_PROBABILITY) {
		return stack;
	}

	const rotationRandom = mulberry32(seed + 1);
	const updatedPin: StackItem = {
		kind: 'pin',
		pinType: last.pinType,
		isFlipped: last.isFlipped,
		partialPlaced: {
			offsetY: PARTIAL_PLACED_PIN_OFFSET_Y_MM,
			tiltRad: PARTIAL_PLACED_PIN_TILT_RAD,
			rotationY: rotationRandom() * Math.PI * 2
		}
	};

	return [...stack.slice(0, -1), updatedPin];
}
