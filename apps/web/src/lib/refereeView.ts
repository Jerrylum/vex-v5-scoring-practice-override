import * as THREE from 'three';
import type { ScoringTabId } from './userScoring';

/** Local-only camera/scoring-tab presets per tab (sessionStorage). Not synced to the room. */
export type RefereeViewPreset = 'southWest' | 'southEast' | 'headRef' | 'midfield' | 'observer';

const STORAGE_KEY = 'refereeViewPreset';

export const REFEREE_VIEW_PRESETS: RefereeViewPreset[] = ['headRef', 'southWest', 'southEast', 'midfield', 'observer'];

export const REFEREE_VIEW_LABELS: Record<RefereeViewPreset, string> = {
	headRef: 'Head Ref',
	southWest: 'SW Scorekeeper',
	southEast: 'SE Scorekeeper',
	midfield: 'Midfield',
	observer: 'Observer'
};

export const KEYBOARD_VIEW_SHORTCUTS: { key: string; preset: RefereeViewPreset; label: string }[] = [
	{ key: '1', preset: 'southWest', label: 'SW Referee View' },
	{ key: '2', preset: 'southEast', label: 'SE Referee View' },
	{ key: '3', preset: 'headRef', label: 'Head Referee View' },
	{ key: '4', preset: 'midfield', label: 'Midfield View' },
	{ key: '0', preset: 'observer', label: 'Observer View' }
];

export interface CameraPreset {
	position: THREE.Vector3;
	target: THREE.Vector3;
}

export const CAMERA_PRESETS: Record<RefereeViewPreset, CameraPreset> = {
	headRef: {
		position: new THREE.Vector3(0, 1800, -3600),
		target: new THREE.Vector3(0, 0, 0)
	},
	southWest: {
		position: new THREE.Vector3(-2000, 1000, 2400),
		target: new THREE.Vector3(-1200, 0, 1200)
	},
	southEast: {
		position: new THREE.Vector3(2000, 1000, 2400),
		target: new THREE.Vector3(1200, 0, 1200)
	},
	midfield: {
		position: new THREE.Vector3(0, 1000, 500),
		target: new THREE.Vector3(0, 0, 0)
	},
	observer: {
		position: new THREE.Vector3(0, 1800, 3600),
		target: new THREE.Vector3(0, 0, 0)
	}
};

const VALID_PRESETS = new Set<string>(REFEREE_VIEW_PRESETS);

export function getRefereeViewPreset(): RefereeViewPreset {
	if (typeof sessionStorage === 'undefined') return 'observer';
	const stored = sessionStorage.getItem(STORAGE_KEY);
	if (stored && VALID_PRESETS.has(stored)) {
		return stored as RefereeViewPreset;
	}
	return 'observer';
}

export function setRefereeViewPreset(preset: RefereeViewPreset): void {
	sessionStorage.setItem(STORAGE_KEY, preset);
}

export function defaultTabForPreset(preset: RefereeViewPreset): ScoringTabId {
	switch (preset) {
		case 'southWest':
			return 'redQ1';
		case 'southEast':
			return 'blueQ2';
		case 'midfield':
			return 'midfield';
		default:
			return 'overview';
	}
}

export function shouldCollapsePanelForPreset(_preset: RefereeViewPreset): boolean {
	return false;
}
