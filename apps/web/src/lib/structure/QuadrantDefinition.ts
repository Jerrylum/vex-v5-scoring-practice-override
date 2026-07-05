import * as THREE from 'three';
import type { PinType } from '../GameObject';
import { TILE } from '../utils';

export type QuadrantId = 'redQuadrantOne' | 'redQuadrantTwo' | 'blueQuadrantOne' | 'blueQuadrantTwo';
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

export const RED_QUADRANT_TWO: QuadrantDefinition = {
	id: 'redQuadrantTwo',
	alliance: 'red',
	toggleId: 'south',
	allianceGoalBase: new THREE.Vector3(TILE * -1, 2, TILE * 2),
	neutralGoalBase: new THREE.Vector3(TILE * 1, 67, TILE * 2),
	allianceAllowedPinTypes: ['redYellow', 'redBlue']
};

export const BLUE_QUADRANT_ONE: QuadrantDefinition = {
	id: 'blueQuadrantOne',
	alliance: 'blue',
	toggleId: 'east',
	allianceGoalBase: new THREE.Vector3(TILE * 2, 2, TILE * -1),
	neutralGoalBase: new THREE.Vector3(TILE * 2, 67, TILE * 1),
	allianceAllowedPinTypes: ['blueYellow', 'redBlue']
};

export const BLUE_QUADRANT_TWO: QuadrantDefinition = {
	id: 'blueQuadrantTwo',
	alliance: 'blue',
	toggleId: 'north',
	allianceGoalBase: new THREE.Vector3(TILE * 1, 2, TILE * -2),
	neutralGoalBase: new THREE.Vector3(TILE * -1, 67, TILE * -2),
	allianceAllowedPinTypes: ['blueYellow', 'redBlue']
};

export const ALL_QUADRANTS: readonly QuadrantDefinition[] = [RED_QUADRANT_ONE, RED_QUADRANT_TWO, BLUE_QUADRANT_ONE, BLUE_QUADRANT_TWO];

export const ALL_QUADRANT_PIN_TYPES: PinType[] = ['redBlue', 'redYellow', 'blueYellow', 'yellowYellow'];

const QUADRANT_BY_ID: Record<QuadrantId, QuadrantDefinition> = {
	redQuadrantOne: RED_QUADRANT_ONE,
	redQuadrantTwo: RED_QUADRANT_TWO,
	blueQuadrantOne: BLUE_QUADRANT_ONE,
	blueQuadrantTwo: BLUE_QUADRANT_TWO
};

export function getQuadrantDefinition(id: QuadrantId): QuadrantDefinition {
	return QUADRANT_BY_ID[id];
}
