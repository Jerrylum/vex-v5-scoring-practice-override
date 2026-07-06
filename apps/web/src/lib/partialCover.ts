import type { Level, StackItem } from '@vex-v5-override/protocol';
import {
	PARTIAL_COVER_OFFSET_Y_MM,
	PARTIAL_COVER_PROBABILITY,
	PARTIAL_COVER_TILT_RAD
} from './fieldConstants';
import { mulberry32 } from './utils';

export const PARTIAL_COVER_SEED_OFFSET = 9_001;

/** Apply PartiallyCoveredCup pose when hard difficulty and stack ends in a flipped cup (30% chance). */
export function maybeApplyPartialCover(stack: StackItem[], difficulty: Level, seed: number): StackItem[] {
	if (difficulty !== 'hard' || stack.length < 2) {
		return stack;
	}

	const last = stack[stack.length - 1];
	if (last?.kind !== 'cup' || !last.isFlipped || last.partialCover) {
		return stack;
	}

	const random = mulberry32(seed);
	if (random() >= PARTIAL_COVER_PROBABILITY) {
		return stack;
	}

	const rotationRandom = mulberry32(seed + 1);
	const updatedCup: StackItem = {
		kind: 'cup',
		isFlipped: true,
		partialCover: {
			offsetY: PARTIAL_COVER_OFFSET_Y_MM,
			tiltRad: PARTIAL_COVER_TILT_RAD,
			rotationY: rotationRandom() * Math.PI * 2
		}
	};

	return [...stack.slice(0, -1), updatedCup];
}
