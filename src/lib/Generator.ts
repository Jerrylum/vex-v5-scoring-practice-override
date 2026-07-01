import { mulberry32 } from './utils';

export type Level = 'easy' | 'medium' | 'hard';

export type RobotsCaseType = 'none' | 'allOnField';
export type MidfieldCaseType = 'oneYY' | 'shortStack' | 'tallStack';
export type QuadrantCaseType = 'noPin' | 'shortStack' | 'mediumStack' | 'hardStack';

export function pickRobotsCaseType(level: Level): RobotsCaseType {
	if (level === 'easy') {
		return 'none';
	}
	return 'allOnField';
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
