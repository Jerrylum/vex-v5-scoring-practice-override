import type { MidfieldCounts, PinHalfCounts, YellowOwner } from './Scoring';
import type { StackItem } from './ScenarioSnapshot';
import type { PinType } from './GameObject';

export type PinHalfColor = 'red' | 'blue' | 'yellow';

const PIN_HALF_COLORS: Record<PinType, [PinHalfColor, PinHalfColor]> = {
	redBlue: ['red', 'blue'],
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

/** Apply <SC5> ownership: yellow halves score only when an alliance owns them. */
export function scoreMidfieldHalves(visible: PinHalfCounts, yellowOwner: YellowOwner): PinHalfCounts {
	return {
		red: visible.red,
		blue: visible.blue,
		yellow: yellowOwner !== null ? visible.yellow : 0
	};
}

/** Count every visible pin half in a midfield stack (no ownership gate). */
export function countVisibleMidfieldHalves(stack: StackItem[]): PinHalfCounts {
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

/** Full midfield goal scoring: visible counts, ownership, and scored counts. */
export function scoreMidfieldStack(
	stack: StackItem[],
	midfieldCounts: MidfieldCounts
): { visible: PinHalfCounts; yellowOwner: YellowOwner; scored: PinHalfCounts } {
	const visible = countVisibleMidfieldHalves(stack);
	const yellowOwner = determineMidfieldYellowOwner(midfieldCounts);
	const scored = scoreMidfieldHalves(visible, yellowOwner);
	return { visible, yellowOwner, scored };
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
