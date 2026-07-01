/** One inch in scene units (millimeters). */
export const IN = 25.4;

/** One foot in scene units (millimeters). */
export const FT = 12 * IN;

/** One tile in scene units (millimeters). */
export const TILE = 598.156;

/** Maximum Robot starting size per <SG1>. */
export const ROBOT_MAX_SIZE = 18 * IN;

export function mulberry32(seed: number) {
	return function () {
		// debugger;
		let t = (seed += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
