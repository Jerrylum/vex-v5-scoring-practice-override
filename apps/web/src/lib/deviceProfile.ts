/** Heuristic for phones/tablets where WebGL memory and fill-rate are limited. */
export function isMobileGpu(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}

	const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
	const noHover = window.matchMedia('(hover: none)').matches;
	const smallScreen = window.matchMedia('(max-width: 768px)').matches;
	const touchPoints = navigator.maxTouchPoints > 0;

	return (coarsePointer && noHover) || (smallScreen && touchPoints);
}
