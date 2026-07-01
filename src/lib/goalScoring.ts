import type { MidfieldCounts, PinHalfCounts, ToggleColor, YellowOwner } from './Scoring';
import type { StackItem } from './ScenarioSnapshot';
import type { PinType } from './GameObject';

export type PinHalfColor = 'red' | 'blue' | 'yellow';
export type { ToggleColor } from './Scoring';

/** [bottom, top] — pin names read top-first: redBlue = top red, bottom blue. */
const PIN_HALF_COLORS: Record<PinType, [PinHalfColor, PinHalfColor]> = {
	redBlue: ['blue', 'red'],
	redYellow: ['yellow', 'red'],
	blueYellow: ['yellow', 'blue'],
	yellowYellow: ['yellow', 'yellow']
};

export function getPinHalfColors(pinType: PinType, isFlipped: boolean): [PinHalfColor, PinHalfColor] {
	const [bottom, top] = PIN_HALF_COLORS[pinType];
	return isFlipped ? [top, bottom] : [bottom, top];
}

/** Midfield yellow ownership from end-of-match robot counts (<SC6>). */
export function determineMidfieldYellowOwner(counts: MidfieldCounts): YellowOwner {
	if (counts.red > counts.blue) {
		return 'red';
	}
	if (counts.blue > counts.red) {
		return 'blue';
	}
	return null;
}

/** Quadrant yellow ownership from toggle color (<SC5>). */
export function determineQuadrantYellowOwner(toggleColor: ToggleColor): YellowOwner {
	if (toggleColor === 'red' || toggleColor === 'blue') {
		return toggleColor;
	}
	return null;
}

/** Apply ownership: yellow halves score only when an alliance owns them. */
export function scoreHalves(visible: PinHalfCounts, yellowOwner: YellowOwner): PinHalfCounts {
	return {
		red: visible.red,
		blue: visible.blue,
		yellow: yellowOwner !== null ? visible.yellow : 0
	};
}

/** Count every visible pin half in a stack (no ownership gate). */
export function countVisibleStackHalves(stack: StackItem[]): PinHalfCounts {
	const result = { red: 0, blue: 0, yellow: 0 };

	for (let i = 0; i < stack.length; i++) {
		const item = stack[i];
		if (item.kind !== 'pin') {
			continue;
		}

		const [bottomColor, topColor] = getPinHalfColors(item.pinType, item.isFlipped);
		const isBasePin = i === 0;
		const itemBelow = i > 0 ? stack[i - 1] : null;
		const itemAbove = i < stack.length - 1 ? stack[i + 1] : null;

		if (!isBasePin && itemBelow?.kind === 'cup') {
			const bottomVisible = itemBelow.isFlipped;
			if (bottomVisible) {
				countVisibleHalf(bottomColor, result);
			}
		}

		if (itemAbove?.kind === 'cup') {
			const topVisible = !itemAbove.isFlipped;
			if (topVisible) {
				countVisibleHalf(topColor, result);
			}
		} else {
			countVisibleHalf(topColor, result);
		}
	}

	return result;
}

export function scoreGoalStack(
	stack: StackItem[],
	yellowOwner: YellowOwner
): { visible: PinHalfCounts; yellowOwner: YellowOwner; scored: PinHalfCounts } {
	const visible = countVisibleStackHalves(stack);
	const scored = scoreHalves(visible, yellowOwner);
	return { visible, yellowOwner, scored };
}

/** Full midfield goal scoring: visible counts, ownership, and scored counts. */
export function scoreMidfieldStack(
	stack: StackItem[],
	midfieldCounts: MidfieldCounts
): { visible: PinHalfCounts; yellowOwner: YellowOwner; scored: PinHalfCounts } {
	const yellowOwner = determineMidfieldYellowOwner(midfieldCounts);
	return scoreGoalStack(stack, yellowOwner);
}

/** Quadrant goal scoring using toggle color for yellow ownership. */
export function scoreQuadrantGoal(
	stack: StackItem[],
	toggleColor: ToggleColor
): { visible: PinHalfCounts; yellowOwner: YellowOwner; scored: PinHalfCounts } {
	const yellowOwner = determineQuadrantYellowOwner(toggleColor);
	return scoreGoalStack(stack, yellowOwner);
}

function countVisibleHalf(color: PinHalfColor, result: PinHalfCounts): void {
	if (color === 'red') {
		result.red++;
	} else if (color === 'blue') {
		result.blue++;
	} else {
		result.yellow++;
	}
}
