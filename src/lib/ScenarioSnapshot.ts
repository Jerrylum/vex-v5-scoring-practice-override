import type { PinType } from './GameObject';
import type { ToggleColor } from './Scoring';
import type { Level } from './Generator';
import type { QuadrantId } from './structure/QuadrantDefinition';

export type { QuadrantId };

export interface RobotPlacement {
	alliance: 'red' | 'blue';
	slot: 0 | 1;
	x: number;
	z: number;
	rotationY: number;
}

export type StackItem = { kind: 'pin'; pinType: PinType; isFlipped: boolean } | { kind: 'cup'; isFlipped: boolean };

export interface RobotsSnapshot {
	caseType: 'none' | 'allOnField' | 'clawbotOnField';
	placements?: RobotPlacement[];
}

export interface MidfieldSnapshot {
	caseType: 'oneYY' | 'shortStack' | 'tallStack';
	stack: StackItem[];
}

export interface QuadrantSnapshot {
	quadrantId: QuadrantId;
	caseType: 'noPin' | 'shortStack' | 'mediumStack' | 'hardStack';
	toggleColor: ToggleColor;
	allianceStack: StackItem[];
	neutralStack: StackItem[];
}

export interface ScatteredPinPlacement {
	pinType: PinType;
	isFlipped: boolean;
	x: number;
	z: number;
	rotationZ: number;
}

export interface RemainingPinsSnapshot {
	pins: ScatteredPinPlacement[];
}

export interface ScenarioSnapshot {
	version: 5;
	difficulty: Level;
	robots: RobotsSnapshot;
	midfield: MidfieldSnapshot;
	redQuadrantOne: QuadrantSnapshot;
	redQuadrantTwo: QuadrantSnapshot;
	blueQuadrantOne: QuadrantSnapshot;
	blueQuadrantTwo: QuadrantSnapshot;
	remainingPins: RemainingPinsSnapshot;
}

/** Optional generation metadata for debug, export, or seed-based replay — not sent for sync. */
export interface ScenarioProvenance {
	generatorVersion: number;
	masterSeed: number;
	robotsSeed: number;
	midfieldSeed: number;
	redQuadrantOneSeed: number;
	redQuadrantTwoSeed: number;
	blueQuadrantOneSeed: number;
	blueQuadrantTwoSeed: number;
	remainingPinsSeed: number;
}
