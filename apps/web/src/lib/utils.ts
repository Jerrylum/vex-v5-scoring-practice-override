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

/** Picks a new scenario master seed — only call at the UI / session boundary. */
export function randomMasterSeed(): number {
	return Math.floor(Math.random() * 1e9);
}

function fillRandomBytes(bytes: Uint8Array): void {
	if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
		crypto.getRandomValues(bytes);
		return;
	}
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Math.floor(Math.random() * 256);
	}
}

/** UUID v4. Falls back when randomUUID is unavailable (e.g. HTTP on a LAN IP, not localhost). */
export function generateUUID(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}

	const bytes = new Uint8Array(16);
	fillRandomBytes(bytes);
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
