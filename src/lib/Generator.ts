export type Level = 'easy' | 'medium' | 'hard';

export type RobotsCaseType = 'none' | 'allOnField';
export type MidfieldCaseType = 'oneYY' | 'shortStack' | 'tallStack';

export function pickRobotsCaseType(level: Level): RobotsCaseType {
	if (level === 'easy') {
		return 'none';
	}
	return 'allOnField';
}

export function pickMidfieldCaseType(level: Level): MidfieldCaseType {
	const roll = Math.random();
	if (level === 'easy') {
		return 'oneYY';
	}
	if (level === 'medium') {
		return roll < 0.5 ? 'oneYY' : 'shortStack';
	}
	return 'tallStack';
}

export function pickShortStackLength(): number {
	return 2 + Math.floor(Math.random() * 6);
}

export function pickTallStackLength(): number {
	return 8 + Math.floor(Math.random() * 6);
}
