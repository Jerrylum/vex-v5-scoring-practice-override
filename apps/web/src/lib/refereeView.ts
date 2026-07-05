import * as THREE from 'three';
import type { ScoringTabId } from './userScoring';

export type RefereeViewPreset = 'southWest' | 'southEast' | 'headRef' | 'observer';

const STORAGE_KEY = 'refereeViewPreset';

export const REFEREE_VIEW_PRESETS: RefereeViewPreset[] = ['headRef', 'southWest', 'southEast', 'observer'];

export const REFEREE_VIEW_LABELS: Record<RefereeViewPreset, string> = {
	headRef: 'Head Ref',
	southWest: 'SW Scorekeeper',
	southEast: 'SE Scorekeeper',
	observer: 'Observer'
};

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
	observer: {
		position: new THREE.Vector3(0, 1800, 3600),
		target: new THREE.Vector3(0, 0, 0)
	}
};

export function getRefereeViewPreset(): RefereeViewPreset {
	if (typeof sessionStorage === 'undefined') return 'observer';
	const stored = sessionStorage.getItem(STORAGE_KEY);
	if (stored === 'southWest' || stored === 'southEast' || stored === 'headRef' || stored === 'observer') {
		return stored;
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
		default:
			return 'overview';
	}
}

export function shouldCollapsePanelForPreset(_preset: RefereeViewPreset): boolean {
	return false;
}
