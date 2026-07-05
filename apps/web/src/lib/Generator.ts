import * as THREE from 'three';
import { mulberry32 } from './utils';
import type { Level } from '@vex-v5-override/protocol';

export type { Level };

export type RobotsCaseType = 'none' | 'clawbotOnField';
export type MidfieldCaseType = 'oneYY' | 'shortStack' | 'tallStack';
export type QuadrantCaseType = 'noPin' | 'shortStack' | 'mediumStack' | 'hardStack';

export function pickRobotsCaseType(level: Level): RobotsCaseType {
	if (level === 'easy') {
		return 'none';
	}
	return 'clawbotOnField';
}

export function pickMidfieldCaseTypeSeeded(level: Level, seed: number): MidfieldCaseType {
	if (level === 'easy') {
		return 'oneYY';
	}
	if (level === 'medium') {
		const roll = mulberry32(seed)();
		return roll < 0.5 ? 'oneYY' : 'shortStack';
	}
	return 'tallStack';
}

export function pickQuadrantCaseType(level: Level): QuadrantCaseType {
	if (level === 'easy') {
		return 'shortStack';
	}
	if (level === 'medium') {
		return 'mediumStack';
	}
	return 'hardStack';
}

export function pickShortStackLengthSeeded(seed: number): number {
	return 2 + Math.floor(mulberry32(seed)() * 6);
}

export function pickTallStackLengthSeeded(seed: number): number {
	return 8 + Math.floor(mulberry32(seed)() * 6);
}

/** Easy: 0%; medium and hard: 100% of remaining pool pins and cups scattered on the field. */
export function shouldScatterRemainingItems(level: Level): boolean {
	return level !== 'easy';
}
