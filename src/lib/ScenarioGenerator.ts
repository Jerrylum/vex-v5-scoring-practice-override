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
	ALL_QUADRANTS,
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
	RobotsOnFieldCase,
	RobotsStructure
} from './structure';
import { ALL_QUADRANT_PIN_TYPES, type QuadrantDefinition, type QuadrantId } from './structure/QuadrantDefinition';
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

type StackJobId = 'midfield' | `${QuadrantId}Alliance` | `${QuadrantId}Neutral`;

interface StackJob {
	id: StackJobId;
	targetLength: number;
	requiresYYBase: boolean;
	allowedPinTypes: PinType[];
	seed: number;
}

interface QuadrantStacks {
	alliance: StackItem[];
	neutral: StackItem[];
}

interface GeneratedStacks {
	midfield: StackItem[];
	quadrants: Record<QuadrantId, QuadrantStacks>;
}

interface QuadrantSeeds {
	redQuadrantOneSeed: number;
	redQuadrantTwoSeed: number;
	blueQuadrantOneSeed: number;
	blueQuadrantTwoSeed: number;
}

function deriveSeeds(masterSeed: number): {
	robotsSeed: number;
	midfieldSeed: number;
	stackShuffleSeed: number;
	planningSeed: number;
	quadrantSeeds: QuadrantSeeds;
} {
	const random = mulberry32(masterSeed);
	const robotsSeed = Math.floor(random() * 1e9);
	const midfieldSeed = Math.floor(random() * 1e9);
	const redQuadrantOneSeed = Math.floor(random() * 1e9);
	const stackShuffleSeed = Math.floor(random() * 1e9);
	const planningSeed = Math.floor(random() * 1e9);
	const redQuadrantTwoSeed = Math.floor(random() * 1e9);
	const blueQuadrantOneSeed = Math.floor(random() * 1e9);
	const blueQuadrantTwoSeed = Math.floor(random() * 1e9);

	return {
		robotsSeed,
		midfieldSeed,
		stackShuffleSeed,
		planningSeed,
		quadrantSeeds: {
			redQuadrantOneSeed,
			redQuadrantTwoSeed,
			blueQuadrantOneSeed,
			blueQuadrantTwoSeed
		}
	};
}

function getQuadrantSeed(seeds: QuadrantSeeds, id: QuadrantId): number {
	return seeds[`${id}Seed`];
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

function buildQuadrantStackJobs(definition: QuadrantDefinition, quadrantCaseType: QuadrantCaseType, seed: number): StackJob[] {
	const quadrantRange = quadrantCaseToRange(quadrantCaseType);

	return [
		{
			id: `${definition.id}Alliance`,
			targetLength: pickStackLengthSeeded(quadrantRange, seed + 1),
			requiresYYBase: false,
			allowedPinTypes: definition.allianceAllowedPinTypes,
			seed: seed + 3
		},
		{
			id: `${definition.id}Neutral`,
			targetLength: pickStackLengthSeeded(quadrantRange, seed + 2),
			requiresYYBase: true,
			allowedPinTypes: ALL_QUADRANT_PIN_TYPES,
			seed: seed + 4
		}
	];
}

function buildStackJobs(
	midfieldCaseType: MidfieldCaseType,
	quadrantCaseType: QuadrantCaseType,
	midfieldSeed: number,
	quadrantSeeds: QuadrantSeeds,
	planningSeed: number
): StackJob[] {
	const jobs: StackJob[] = [
		{
			id: 'midfield',
			targetLength: getMidfieldTarget(midfieldCaseType, planningSeed),
			requiresYYBase: true,
			allowedPinTypes: ALL_PIN_TYPES,
			seed: midfieldSeed
		}
	];

	for (const definition of ALL_QUADRANTS) {
		jobs.push(...buildQuadrantStackJobs(definition, quadrantCaseType, getQuadrantSeed(quadrantSeeds, definition.id)));
	}

	return jobs;
}

function emptyQuadrantStacks(): Record<QuadrantId, QuadrantStacks> {
	return {
		redQuadrantOne: { alliance: [], neutral: [] },
		redQuadrantTwo: { alliance: [], neutral: [] },
		blueQuadrantOne: { alliance: [], neutral: [] },
		blueQuadrantTwo: { alliance: [], neutral: [] }
	};
}

function generateScenarioStacks(pool: FieldResourcePool, jobs: StackJob[]): GeneratedStacks {
	const stacks: GeneratedStacks = {
		midfield: [],
		quadrants: emptyQuadrantStacks()
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

		if (job.id === 'midfield') {
			stacks.midfield = stack;
			continue;
		}

		const match = job.id.match(/^(redQuadrantOne|redQuadrantTwo|blueQuadrantOne|blueQuadrantTwo)(Alliance|Neutral)$/);
		if (!match) {
			throw new Error(`Unknown stack job id: ${job.id}`);
		}

		const quadrantId = match[1] as QuadrantId;
		const goal = match[2] === 'Alliance' ? 'alliance' : 'neutral';
		stacks.quadrants[quadrantId][goal] = stack;
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

function buildQuadrantStructure(
	definition: QuadrantDefinition,
	allianceStack: StackItem[],
	neutralStack: StackItem[],
	seed: number
): QuadrantStructure {
	const toggleColor = pickToggleColor(seed);
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

function buildQuadrantStructures(stacks: GeneratedStacks, quadrantSeeds: QuadrantSeeds): Record<QuadrantId, QuadrantStructure> {
	const structures = {} as Record<QuadrantId, QuadrantStructure>;

	for (const definition of ALL_QUADRANTS) {
		const quadrantStacks = stacks.quadrants[definition.id];
		structures[definition.id] = buildQuadrantStructure(
			definition,
			quadrantStacks.alliance,
			quadrantStacks.neutral,
			getQuadrantSeed(quadrantSeeds, definition.id)
		);
	}

	return structures;
}

export function generateScenario(options: GenerateScenarioOptions): Scenario {
	const { difficulty, masterSeed } = options;
	const generatorVersion = options.generatorVersion ?? GENERATOR_VERSION;

	if (generatorVersion !== GENERATOR_VERSION) {
		throw new GeneratorVersionMismatchError(GENERATOR_VERSION, generatorVersion);
	}

	const { robotsSeed, midfieldSeed, stackShuffleSeed, planningSeed, quadrantSeeds } = deriveSeeds(masterSeed);
	const pool = FieldResourcePool.create();

	const robotsCaseType = pickRobotsCaseType(difficulty);
	const midfieldCaseType = pickMidfieldCaseTypeSeeded(difficulty, planningSeed);
	const quadrantCaseType = pickQuadrantCaseType(difficulty);

	const jobs = shuffleSeeded(
		buildStackJobs(midfieldCaseType, quadrantCaseType, midfieldSeed, quadrantSeeds, planningSeed),
		stackShuffleSeed
	);
	const stacks = generateScenarioStacks(pool, jobs);

	const robots = buildRobotsStructure(robotsCaseType, robotsSeed);
	const midfield = buildMidfieldStructure(stacks.midfield);
	const quadrants = buildQuadrantStructures(stacks, quadrantSeeds);

	return new Scenario(
		robots,
		midfield,
		quadrants.redQuadrantOne,
		quadrants.redQuadrantTwo,
		quadrants.blueQuadrantOne,
		quadrants.blueQuadrantTwo,
		{
			generatorVersion: GENERATOR_VERSION,
			masterSeed,
			robotsSeed,
			midfieldSeed,
			...quadrantSeeds
		}
	);
}

/** Wire payload for cross-device sync — explicit field state only. */
export function scenarioToSnapshot(scenario: Scenario, difficulty: Level): ScenarioSnapshot {
	return {
		version: 4,
		difficulty,
		robots: scenario.robots.toSnapshot(),
		midfield: scenario.midfield.toSnapshot(),
		redQuadrantOne: scenario.redQuadrantOne.toSnapshot(),
		redQuadrantTwo: scenario.redQuadrantTwo.toSnapshot(),
		blueQuadrantOne: scenario.blueQuadrantOne.toSnapshot(),
		blueQuadrantTwo: scenario.blueQuadrantTwo.toSnapshot()
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
	const redQuadrantTwo = QuadrantStructure.fromSnapshot(snapshot.redQuadrantTwo);
	const blueQuadrantOne = QuadrantStructure.fromSnapshot(snapshot.blueQuadrantOne);
	const blueQuadrantTwo = QuadrantStructure.fromSnapshot(snapshot.blueQuadrantTwo);
	return new Scenario(robots, midfield, redQuadrantOne, redQuadrantTwo, blueQuadrantOne, blueQuadrantTwo, provenance ?? null);
}
