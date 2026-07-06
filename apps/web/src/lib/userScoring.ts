import type { QuadrantId } from './structure/QuadrantDefinition';
import type { MidfieldCounts, PinHalfCounts, QuadrantGoalPairScoring, ScenarioScoring, ToggleColor } from './Scoring';
import { emptyPinHalfCounts } from './Scoring';
import { emptyUserScenarioScoring, type UserQuadrantScoring, type UserScenarioScoring } from '@vex-v5-override/protocol';

export type { UserQuadrantScoring, UserScenarioScoring };
export { emptyUserScenarioScoring };

export type ScoringTabId = 'overview' | 'redQ1' | 'redQ2' | 'blueQ1' | 'blueQ2' | 'midfield';

export type QuadrantKey = keyof Pick<UserScenarioScoring, 'redQuadrantOne' | 'redQuadrantTwo' | 'blueQuadrantOne' | 'blueQuadrantTwo'>;

export const QUADRANT_TAB_CONFIG: {
	tabId: Exclude<ScoringTabId, 'overview' | 'midfield'>;
	key: QuadrantKey;
	label: string;
	alliance: 'red' | 'blue';
}[] = [
	{ tabId: 'redQ1', key: 'redQuadrantOne', label: 'Red Q1', alliance: 'red' },
	{ tabId: 'redQ2', key: 'redQuadrantTwo', label: 'Red Q2', alliance: 'red' },
	{ tabId: 'blueQ1', key: 'blueQuadrantOne', label: 'Blue Q1', alliance: 'blue' },
	{ tabId: 'blueQ2', key: 'blueQuadrantTwo', label: 'Blue Q2', alliance: 'blue' }
];

const QUADRANT_KEY_BY_ID: Record<QuadrantId, QuadrantKey> = {
	redQuadrantOne: 'redQuadrantOne',
	redQuadrantTwo: 'redQuadrantTwo',
	blueQuadrantOne: 'blueQuadrantOne',
	blueQuadrantTwo: 'blueQuadrantTwo'
};

/** Points per scored pin half per the game manual scoring table. */
export const PIN_HALF_POINTS = {
	red: 5,
	blue: 5,
	yellow: 10
} as const;

export const MIDFIELD_ROBOT_POINTS = 8;

/** Visible pin-half totals for a quadrant (what referees count on the panel). */
export function aggregateQuadrantVisible(quadrant: QuadrantGoalPairScoring): PinHalfCounts {
	return {
		red: quadrant.allianceGoal.visible.red + quadrant.neutralGoal.visible.red,
		blue: quadrant.allianceGoal.visible.blue + quadrant.neutralGoal.visible.blue,
		yellow: quadrant.allianceGoal.visible.yellow + quadrant.neutralGoal.visible.yellow
	};
}

/** @deprecated Use aggregateQuadrantVisible */
export const aggregateQuadrantActual = aggregateQuadrantVisible;

export function getActualQuadrantCounts(actual: ScenarioScoring, key: QuadrantKey): PinHalfCounts | null {
	const quadrant = actual[key];
	if (!quadrant) return null;
	return aggregateQuadrantVisible(quadrant);
}

export function getActualToggleColor(actual: ScenarioScoring, key: QuadrantKey): ToggleColor | null {
	return actual[key]?.toggleColor ?? null;
}

function yellowOwnerFromToggle(toggleColor: ToggleColor): 'red' | 'blue' | null {
	if (toggleColor === 'red') return 'red';
	if (toggleColor === 'blue') return 'blue';
	return null;
}

function yellowOwnerFromMidfieldRobots(robots: MidfieldCounts): 'red' | 'blue' | null {
	if (robots.red > robots.blue) return 'red';
	if (robots.blue > robots.red) return 'blue';
	return null;
}

function scoreYellowHalves(count: number, owner: 'red' | 'blue' | null): { red: number; blue: number } {
	if (owner === null || count === 0) {
		return { red: 0, blue: 0 };
	}
	const points = count * PIN_HALF_POINTS.yellow;
	return owner === 'red' ? { red: points, blue: 0 } : { red: 0, blue: points };
}

export function calculateUserAlliancePoints(user: UserScenarioScoring): { red: number; blue: number } {
	let red = 0;
	let blue = 0;

	for (const { key } of QUADRANT_TAB_CONFIG) {
		const quadrant = user[key];
		red += quadrant.red * PIN_HALF_POINTS.red;
		blue += quadrant.blue * PIN_HALF_POINTS.blue;

		const yellowOwner = yellowOwnerFromToggle(quadrant.toggleColor);
		const yellowPoints = scoreYellowHalves(quadrant.yellow, yellowOwner);
		red += yellowPoints.red;
		blue += yellowPoints.blue;
	}

	red += user.midfieldGoal.red * PIN_HALF_POINTS.red;
	blue += user.midfieldGoal.blue * PIN_HALF_POINTS.blue;

	const midfieldYellowOwner = yellowOwnerFromMidfieldRobots(user.midfieldRobots);
	const midfieldYellowPoints = scoreYellowHalves(user.midfieldGoal.yellow, midfieldYellowOwner);
	red += midfieldYellowPoints.red;
	blue += midfieldYellowPoints.blue;

	red += user.midfieldRobots.red * MIDFIELD_ROBOT_POINTS;
	blue += user.midfieldRobots.blue * MIDFIELD_ROBOT_POINTS;

	return { red, blue };
}

function addScoredGoalPoints(
	goal: QuadrantGoalPairScoring['allianceGoal'],
	yellowOwner: 'red' | 'blue' | null,
	points: { red: number; blue: number }
): void {
	points.red += goal.scored.red * PIN_HALF_POINTS.red;
	points.blue += goal.scored.blue * PIN_HALF_POINTS.blue;

	const yellowPoints = scoreYellowHalves(goal.scored.yellow, yellowOwner);
	points.red += yellowPoints.red;
	points.blue += yellowPoints.blue;
}

/** Point totals from the scenario answer key (scored halves + ownership). */
export function calculateActualAlliancePoints(actual: ScenarioScoring, midfieldRobots: MidfieldCounts): { red: number; blue: number } {
	const points = { red: 0, blue: 0 };

	for (const { key } of QUADRANT_TAB_CONFIG) {
		const quadrant = actual[key];
		if (!quadrant) continue;

		const yellowOwner = yellowOwnerFromToggle(quadrant.toggleColor);
		addScoredGoalPoints(quadrant.allianceGoal, yellowOwner, points);
		addScoredGoalPoints(quadrant.neutralGoal, yellowOwner, points);
	}

	addScoredGoalPoints(actual.midfieldGoal, yellowOwnerFromMidfieldRobots(midfieldRobots), points);

	points.red += midfieldRobots.red * MIDFIELD_ROBOT_POINTS;
	points.blue += midfieldRobots.blue * MIDFIELD_ROBOT_POINTS;

	return points;
}

function pinCountsMatch(a: PinHalfCounts, b: PinHalfCounts): boolean {
	return a.red === b.red && a.blue === b.blue && a.yellow === b.yellow;
}

function quadrantMatches(user: UserQuadrantScoring, actual: QuadrantGoalPairScoring | undefined): boolean {
	if (!actual) {
		return user.red === 0 && user.blue === 0 && user.yellow === 0 && user.toggleColor === 'yellow';
	}
	return pinCountsMatch(user, aggregateQuadrantVisible(actual)) && user.toggleColor === actual.toggleColor;
}

/** Either tab order matches actual Q1/Q2, or the two tabs are swapped. */
function allianceQuadrantsCorrect(
	userOne: UserQuadrantScoring,
	userTwo: UserQuadrantScoring,
	actualOne: QuadrantGoalPairScoring | undefined,
	actualTwo: QuadrantGoalPairScoring | undefined
): boolean {
	return (
		(quadrantMatches(userOne, actualOne) && quadrantMatches(userTwo, actualTwo)) ||
		(quadrantMatches(userTwo, actualOne) && quadrantMatches(userOne, actualTwo))
	);
}

function midfieldMatches(user: UserScenarioScoring, actual: ScenarioScoring, midfieldRobots: MidfieldCounts): boolean {
	if (!pinCountsMatch(user.midfieldGoal, actual.midfieldGoal.visible)) {
		return false;
	}
	return user.midfieldRobots.red === midfieldRobots.red && user.midfieldRobots.blue === midfieldRobots.blue;
}

export function isUserScoringCorrect(user: UserScenarioScoring, actual: ScenarioScoring, midfieldRobots: MidfieldCounts): boolean {
	if (!midfieldMatches(user, actual, midfieldRobots)) {
		return false;
	}

	return (
		allianceQuadrantsCorrect(user.redQuadrantOne, user.redQuadrantTwo, actual.redQuadrantOne, actual.redQuadrantTwo) &&
		allianceQuadrantsCorrect(user.blueQuadrantOne, user.blueQuadrantTwo, actual.blueQuadrantOne, actual.blueQuadrantTwo)
	);
}

export function quadrantKeyFromId(id: QuadrantId): QuadrantKey {
	return QUADRANT_KEY_BY_ID[id];
}
