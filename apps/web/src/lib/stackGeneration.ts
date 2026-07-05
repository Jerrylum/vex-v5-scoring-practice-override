import type { FieldResourcePool } from './FieldResources';
import type { PinType } from './GameObject';
import { Pin, Cup, type ScoringObject } from './ScoringObject';
import type { StackItem } from './ScenarioSnapshot';
import { mulberry32 } from './utils';

export const ALL_PIN_TYPES: PinType[] = ['redBlue', 'redYellow', 'blueYellow', 'yellowYellow'];

export type StackLengthRange = 'short' | 'medium' | 'hard';

export interface StackGenConfig {
	targetLength: number;
	requiresYYBase?: boolean;
	allowedPinTypes: PinType[];
	pool: FieldResourcePool;
	random: () => number;
}

export function pickStackLengthSeeded(range: StackLengthRange, seed: number): number {
	const random = mulberry32(seed);
	switch (range) {
		case 'short':
			return 1 + Math.floor(random() * 5);
		case 'medium':
			return 6 + Math.floor(random() * 5);
		case 'hard':
			return 11 + Math.floor(random() * 4);
	}
}

/** Grow a stack toward targetLength, stopping early when the pool is depleted. */
export function generateGoalStack(config: StackGenConfig): StackItem[] {
	const { targetLength, requiresYYBase, allowedPinTypes, pool, random } = config;

	if (targetLength < 1 || targetLength > 14) {
		throw new Error(`Invalid stack target length: ${targetLength}`);
	}

	const stack: StackItem[] = [];

	if (requiresYYBase) {
		const base = pool.takeYellowYellowPin();
		if (!base) {
			return stack;
		}
		stack.push(base);
	}

	while (stack.length < targetLength) {
		const index = stack.length;
		const item = generateStackItem(index, allowedPinTypes, pool, random);
		if (!item) {
			break;
		}
		stack.push(item);
	}

	return stack;
}

function generateStackItem(index: number, allowedPinTypes: PinType[], pool: FieldResourcePool, random: () => number): StackItem | null {
	if (index % 2 === 1) {
		return pool.takeCup(random);
	}

	return pool.takePin(allowedPinTypes, random);
}

export function stackToElements(stack: StackItem[]): ScoringObject[] {
	return stack.map((item) => {
		if (item.kind === 'pin') {
			return new Pin(item.pinType, item.isFlipped);
		}
		return new Cup(item.isFlipped);
	});
}

export function shuffleSeeded<T>(items: T[], seed: number): T[] {
	const random = mulberry32(seed);
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		const tmp = result[i]!;
		result[i] = result[j]!;
		result[j] = tmp;
	}
	return result;
}
