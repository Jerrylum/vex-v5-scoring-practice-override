import type { PinType } from './GameObject';
import type { ToggleColor } from './Scoring';
import type { Level } from './Generator';

export interface RobotPlacement {
	alliance: 'red' | 'blue';
	slot: 0 | 1;
	x: number;
	z: number;
	rotationY: number;
}

export type StackItem = { kind: 'pin'; pinType: PinType; isFlipped: boolean } | { kind: 'cup'; isFlipped: boolean };

/** Wire format: explicit field state for cross-device sync. No seeds. */
export interface RobotsSnapshot {
	caseType: 'none' | 'allOnField';
	placements?: RobotPlacement[];
}

export interface MidfieldSnapshot {
	caseType: 'oneYY' | 'shortStack' | 'tallStack';
	stack: StackItem[];
}

export interface QuadrantSnapshot {
	quadrantId: 'redQuadrantOne';
	caseType: 'noPin' | 'shortStack' | 'mediumStack' | 'hardStack';
	toggleColor: ToggleColor;
	allianceStack: StackItem[];
	neutralStack: StackItem[];
}

export interface ScenarioSnapshot {
	version: 3;
	difficulty: Level;
	robots: RobotsSnapshot;
	midfield: MidfieldSnapshot;
	redQuadrantOne: QuadrantSnapshot;
}

/** Optional generation metadata for debug, export, or seed-based replay — not sent for sync. */
export interface ScenarioProvenance {
	generatorVersion: number;
	masterSeed: number;
	robotsSeed: number;
	midfieldSeed: number;
	redQuadrantOneSeed: number;
}
