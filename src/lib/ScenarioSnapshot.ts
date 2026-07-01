import type { PinType } from './GameObject';
import type { Level } from './Generator';

export interface RobotPlacement {
	alliance: 'red' | 'blue';
	slot: 0 | 1;
	x: number;
	z: number;
	rotationY: number;
}

export type StackItem = { kind: 'pin'; pinType: PinType; isFlipped: boolean } | { kind: 'cup'; isFlipped: boolean };

export interface RobotsSnapshot {
	caseType: 'none' | 'allOnField';
	seed: number;
	placements?: RobotPlacement[];
}

export interface MidfieldSnapshot {
	caseType: 'oneYY' | 'shortStack' | 'tallStack';
	seed: number;
	stack: StackItem[];
}

export interface ScenarioSnapshot {
	version: 1;
	difficulty: Level;
	masterSeed: number;
	robots: RobotsSnapshot;
	midfield: MidfieldSnapshot;
}
