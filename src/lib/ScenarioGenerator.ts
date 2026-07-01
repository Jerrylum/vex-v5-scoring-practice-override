import type { Level, MidfieldCaseType, QuadrantCaseType } from './Generator';
import {
	pickMidfieldCaseTypeSeeded,
	pickQuadrantCaseType,
	pickRobotsCaseType,
	pickShortStackLengthSeeded,
	pickTallStackLengthSeeded
} from './Generator';
import { FieldResourcePool } from './FieldResources';
import { GENERATOR_VERSION } from './generatorVersion';
import { Scenario } from './Scenario';
import type { ScenarioSnapshot, ScenarioProvenance } from './ScenarioSnapshot';
import type { ToggleColor } from './Scoring';
import { ALL_PIN_TYPES, generateGoalStack, pickStackLengthSeeded, shuffleSeeded, type StackLengthRange } from './stackGeneration';
import { mulberry32 } from './utils';
import {
	generateRobotPlacements,
	MidfieldOneYYPinCase,
	MidfieldShortStackPinCase,
	MidfieldStructure,
	MidfieldTallStackPinCase,
	NoRobotCase,
	QuadrantHardStackCase,
	QuadrantMediumStackCase,
	QuadrantNoPinCase,
	QuadrantShortStackCase,
	QuadrantStructure,
	RED_QUADRANT_ONE,
	RobotsOnFieldCase,
	RobotsStructure
} from './structure';
import { ALL_QUADRANT_PIN_TYPES } from './structure/QuadrantDefinition';
import type { PinType } from './GameObject';
import type { StackItem } from './ScenarioSnapshot';

export type { Level };

export interface GenerateScenarioOptions {
	difficulty: Level;
	masterSeed: number;
	generatorVersion?: number;
}

export class GeneratorVersionMismatchError extends Error {
	constructor(
		public readonly expected: number,
		public readonly received: number
	) {
		super(`Generator version mismatch: expected ${expected}, got ${received}`);
		this.name = 'GeneratorVersionMismatchError';
	}
}

const MAX_ROBOT_ATTEMPTS = 10;

type StackJobId = 'midfield' | 'redQuadrantOneAlliance' | 'redQuadrantOneNeutral';

interface StackJob {
	id: StackJobId;
	targetLength: number;
	requiresYYBase: boolean;
	allowedPinTypes: PinType[];
	seed: number;
}

interface GeneratedStacks {
	midfield: StackItem[];
	redQuadrantOneAlliance: StackItem[];
	redQuadrantOneNeutral: StackItem[];
}

function deriveSeeds(masterSeed: number): {
	robotsSeed: number;
	midfieldSeed: number;
	redQuadrantOneSeed: number;
	stackShuffleSeed: number;
	planningSeed: number;
} {
	const random = mulberry32(masterSeed);
	return {
		robotsSeed: Math.floor(random() * 1e9),
		midfieldSeed: Math.floor(random() * 1e9),
		redQuadrantOneSeed: Math.floor(random() * 1e9),
		stackShuffleSeed: Math.floor(random() * 1e9),
		planningSeed: Math.floor(random() * 1e9)
	};
}

function pickToggleColor(seed: number): ToggleColor {
	const random = mulberry32(seed);
	const roll = random();
	if (roll < 1 / 3) {
		return 'red';
	}
	if (roll < 2 / 3) {
		return 'blue';
	}
	return 'yellow';
}

function buildRobotsStructure(caseType: ReturnType<typeof pickRobotsCaseType>, seed: number): RobotsStructure {
	if (caseType === 'none') {
		return new RobotsStructure(new NoRobotCase());
	}

	for (let attempt = 0; attempt < MAX_ROBOT_ATTEMPTS; attempt++) {
		try {
			const placements = generateRobotPlacements(seed + attempt);
			return new RobotsStructure(new RobotsOnFieldCase(placements));
		} catch {
			// retry with offset seed
		}
	}

	throw new Error('Failed to generate robot placements after maximum attempts');
}

function quadrantCaseToRange(caseType: QuadrantCaseType): StackLengthRange {
	switch (caseType) {
		case 'shortStack':
			return 'short';
		case 'mediumStack':
			return 'medium';
		case 'hardStack':
			return 'hard';
		case 'noPin':
			return 'short';
	}
}

function getMidfieldTarget(caseType: MidfieldCaseType, planningSeed: number): number {
	switch (caseType) {
		case 'oneYY':
			return 1;
		case 'shortStack':
			return pickShortStackLengthSeeded(planningSeed + 1);
		case 'tallStack':
			return pickTallStackLengthSeeded(planningSeed + 2);
	}
}

function classifyMidfieldCase(stackLength: number): MidfieldCaseType {
	if (stackLength <= 1) {
		return 'oneYY';
	}
	if (stackLength <= 7) {
		return 'shortStack';
	}
	return 'tallStack';
}

function classifyQuadrantCase(allianceLen: number, neutralLen: number): QuadrantCaseType {
	const size = Math.max(allianceLen, neutralLen);
	if (size <= 1) {
		return 'noPin';
	}
	if (size <= 5) {
		return 'shortStack';
	}
	if (size <= 10) {
		return 'mediumStack';
	}
	return 'hardStack';
}

function buildStackJobs(
	midfieldCaseType: MidfieldCaseType,
	quadrantCaseType: QuadrantCaseType,
	midfieldSeed: number,
	redQuadrantOneSeed: number,
	planningSeed: number
): StackJob[] {
	const quadrantRange = quadrantCaseToRange(quadrantCaseType);

	return [
		{
			id: 'midfield',
			targetLength: getMidfieldTarget(midfieldCaseType, planningSeed),
			requiresYYBase: true,
			allowedPinTypes: ALL_PIN_TYPES,
			seed: midfieldSeed
		},
		{
			id: 'redQuadrantOneAlliance',
			targetLength: pickStackLengthSeeded(quadrantRange, redQuadrantOneSeed + 1),
			requiresYYBase: false,
			allowedPinTypes: RED_QUADRANT_ONE.allianceAllowedPinTypes,
			seed: redQuadrantOneSeed + 3
		},
		{
			id: 'redQuadrantOneNeutral',
			targetLength: pickStackLengthSeeded(quadrantRange, redQuadrantOneSeed + 2),
			requiresYYBase: true,
			allowedPinTypes: ALL_QUADRANT_PIN_TYPES,
			seed: redQuadrantOneSeed + 4
		}
	];
}

function generateScenarioStacks(pool: FieldResourcePool, jobs: StackJob[]): GeneratedStacks {
	const stacks: GeneratedStacks = {
		midfield: [],
		redQuadrantOneAlliance: [],
		redQuadrantOneNeutral: []
	};

	for (const job of jobs) {
		const random = mulberry32(job.seed);
		const stack = generateGoalStack({
			targetLength: job.targetLength,
			requiresYYBase: job.requiresYYBase,
			allowedPinTypes: job.allowedPinTypes,
			pool,
			random
		});

		switch (job.id) {
			case 'midfield':
				stacks.midfield = stack;
				break;
			case 'redQuadrantOneAlliance':
				stacks.redQuadrantOneAlliance = stack;
				break;
			case 'redQuadrantOneNeutral':
				stacks.redQuadrantOneNeutral = stack;
				break;
		}
	}

	return stacks;
}

function buildMidfieldStructure(stack: StackItem[]): MidfieldStructure {
	const caseType = classifyMidfieldCase(stack.length);

	switch (caseType) {
		case 'oneYY':
			return new MidfieldStructure(new MidfieldOneYYPinCase(stack));
		case 'shortStack':
			return new MidfieldStructure(new MidfieldShortStackPinCase(stack));
		case 'tallStack':
			return new MidfieldStructure(new MidfieldTallStackPinCase(stack));
	}
}

function buildRedQuadrantOneStructure(allianceStack: StackItem[], neutralStack: StackItem[], seed: number): QuadrantStructure {
	const toggleColor = pickToggleColor(seed);
	const definition = RED_QUADRANT_ONE;
	const caseType = classifyQuadrantCase(allianceStack.length, neutralStack.length);

	switch (caseType) {
		case 'noPin':
			return new QuadrantStructure(definition, new QuadrantNoPinCase(neutralStack, toggleColor));
		case 'shortStack':
			return new QuadrantStructure(definition, new QuadrantShortStackCase(allianceStack, neutralStack, toggleColor));
		case 'mediumStack':
			return new QuadrantStructure(definition, new QuadrantMediumStackCase(allianceStack, neutralStack, toggleColor));
		case 'hardStack':
			return new QuadrantStructure(definition, new QuadrantHardStackCase(allianceStack, neutralStack, toggleColor));
	}
}

export function generateScenario(options: GenerateScenarioOptions): Scenario {
	const { difficulty, masterSeed } = options;
	const generatorVersion = options.generatorVersion ?? GENERATOR_VERSION;

	if (generatorVersion !== GENERATOR_VERSION) {
		throw new GeneratorVersionMismatchError(GENERATOR_VERSION, generatorVersion);
	}

	const { robotsSeed, midfieldSeed, redQuadrantOneSeed, stackShuffleSeed, planningSeed } = deriveSeeds(masterSeed);
	const pool = FieldResourcePool.create();

	const robotsCaseType = pickRobotsCaseType(difficulty);
	const midfieldCaseType = pickMidfieldCaseTypeSeeded(difficulty, planningSeed);
	const quadrantCaseType = pickQuadrantCaseType(difficulty);

	const jobs = shuffleSeeded(
		buildStackJobs(midfieldCaseType, quadrantCaseType, midfieldSeed, redQuadrantOneSeed, planningSeed),
		stackShuffleSeed
	);
	const stacks = generateScenarioStacks(pool, jobs);

	const robots = buildRobotsStructure(robotsCaseType, robotsSeed);
	const midfield = buildMidfieldStructure(stacks.midfield);
	const redQuadrantOne = buildRedQuadrantOneStructure(stacks.redQuadrantOneAlliance, stacks.redQuadrantOneNeutral, redQuadrantOneSeed);

	return new Scenario(robots, midfield, redQuadrantOne, {
		generatorVersion: GENERATOR_VERSION,
		masterSeed,
		robotsSeed,
		midfieldSeed,
		redQuadrantOneSeed
	});
}

/** Wire payload for cross-device sync — explicit field state only. */
export function scenarioToSnapshot(scenario: Scenario, difficulty: Level): ScenarioSnapshot {
	return {
		version: 3,
		difficulty,
		robots: scenario.robots.toSnapshot(),
		midfield: scenario.midfield.toSnapshot(),
		redQuadrantOne: scenario.redQuadrantOne.toSnapshot()
	};
}

/** Generation metadata for debug, export, or seed-based replay — not required for sync. */
export function scenarioToProvenance(scenario: Scenario): ScenarioProvenance | null {
	return scenario.provenance;
}

export function scenarioFromSnapshot(snapshot: ScenarioSnapshot, provenance?: ScenarioProvenance): Scenario {
	const robots = RobotsStructure.fromSnapshot(snapshot.robots);
	const midfield = MidfieldStructure.fromSnapshot(snapshot.midfield);
	const redQuadrantOne = QuadrantStructure.fromSnapshot(snapshot.redQuadrantOne);
	return new Scenario(robots, midfield, redQuadrantOne, provenance ?? null);
}
