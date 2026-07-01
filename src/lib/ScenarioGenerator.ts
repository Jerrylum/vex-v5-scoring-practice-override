import type { Level } from './Generator';
import { pickMidfieldCaseType, pickRobotsCaseType, pickShortStackLength, pickTallStackLength } from './Generator';
import { Scenario } from './Scenario';
import type { ScenarioSnapshot } from './ScenarioSnapshot';
import {
	generateMidfieldStack,
	generateRobotPlacements,
	MidfieldOneYYPinCase,
	MidfieldShortStackPinCase,
	MidfieldStructure,
	MidfieldTallStackPinCase,
	NoRobotCase,
	RobotsOnFieldCase,
	RobotsStructure
} from './structure';
import { mulberry32 } from './utils';

export type { Level };

const MAX_ROBOT_ATTEMPTS = 10;

function deriveSeeds(masterSeed: number): { robotsSeed: number; midfieldSeed: number } {
	const random = mulberry32(masterSeed);
	return {
		robotsSeed: Math.floor(random() * 1e9),
		midfieldSeed: Math.floor(random() * 1e9)
	};
}

function buildRobotsStructure(caseType: ReturnType<typeof pickRobotsCaseType>, seed: number): RobotsStructure {
	if (caseType === 'none') {
		return new RobotsStructure(new NoRobotCase(), seed);
	}

	for (let attempt = 0; attempt < MAX_ROBOT_ATTEMPTS; attempt++) {
		try {
			const placements = generateRobotPlacements(seed + attempt);
			return new RobotsStructure(new RobotsOnFieldCase(placements), seed);
		} catch {
			// retry with offset seed
		}
	}

	throw new Error('Failed to generate robot placements after maximum attempts');
}

function buildMidfieldStructure(caseType: ReturnType<typeof pickMidfieldCaseType>, seed: number): MidfieldStructure {
	switch (caseType) {
		case 'oneYY':
			return new MidfieldStructure(new MidfieldOneYYPinCase(), seed);
		case 'shortStack': {
			const length = pickShortStackLength();
			const stack = generateMidfieldStack(seed, length);
			return new MidfieldStructure(new MidfieldShortStackPinCase(stack), seed);
		}
		case 'tallStack': {
			const length = pickTallStackLength();
			const stack = generateMidfieldStack(seed, length);
			return new MidfieldStructure(new MidfieldTallStackPinCase(stack), seed);
		}
	}
}

export function generateScenario(difficulty: Level, masterSeed?: number): Scenario {
	const seed = masterSeed ?? Math.floor(Math.random() * 1e9);
	const { robotsSeed, midfieldSeed } = deriveSeeds(seed);

	const robotsCaseType = pickRobotsCaseType(difficulty);
	const midfieldCaseType = pickMidfieldCaseType(difficulty);

	const robots = buildRobotsStructure(robotsCaseType, robotsSeed);
	const midfield = buildMidfieldStructure(midfieldCaseType, midfieldSeed);

	return new Scenario(robots, midfield, seed);
}

export function scenarioToSnapshot(scenario: Scenario, difficulty: Level): ScenarioSnapshot {
	return {
		version: 1,
		difficulty,
		masterSeed: scenario.masterSeed,
		robots: scenario.robots.toSnapshot(),
		midfield: scenario.midfield.toSnapshot()
	};
}

export function scenarioFromSnapshot(snapshot: ScenarioSnapshot): Scenario {
	const robots = RobotsStructure.fromSnapshot(snapshot.robots);
	const midfield = MidfieldStructure.fromSnapshot(snapshot.midfield);
	return new Scenario(robots, midfield, snapshot.masterSeed);
}
