import * as THREE from 'three';
import type { PinType } from '../GameObject';
import { TILE } from '../utils';

export type QuadrantId = 'redQuadrantOne';
export type ToggleId = 'west' | 'north' | 'east' | 'south';

export interface QuadrantDefinition {
	id: QuadrantId;
	alliance: 'red' | 'blue';
	toggleId: ToggleId;
	allianceGoalBase: THREE.Vector3;
	neutralGoalBase: THREE.Vector3;
	allianceAllowedPinTypes: PinType[];
}

export const RED_QUADRANT_ONE: QuadrantDefinition = {
	id: 'redQuadrantOne',
	alliance: 'red',
	toggleId: 'west',
	allianceGoalBase: new THREE.Vector3(TILE * -2, 2, TILE * 1),
	neutralGoalBase: new THREE.Vector3(TILE * -2, 67, TILE * -1),
	allianceAllowedPinTypes: ['redYellow', 'redBlue']
};

export const ALL_QUADRANT_PIN_TYPES: PinType[] = ['redBlue', 'redYellow', 'blueYellow', 'yellowYellow'];

export function getQuadrantDefinition(id: QuadrantId): QuadrantDefinition {
	switch (id) {
		case 'redQuadrantOne':
			return RED_QUADRANT_ONE;
	}
}
