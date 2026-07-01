/** Visible pin-half counts (what a referee counts from the stack). */
export interface PinHalfCounts {
	red: number;
	blue: number;
	yellow: number;
}

/** Alliance that owns yellow pins per <SC5>/<SC6>, or null when tied / unowned. */
export type YellowOwner = 'red' | 'blue' | null;

export type ToggleColor = 'red' | 'blue' | 'yellow';

export interface GoalScoring {
	/** Visible halves in the goal (cup opacity and flip applied). */
	visible: PinHalfCounts;
	/** Alliance that owns yellow pins in this goal, if applicable. */
	yellowOwner: YellowOwner;
	/** Point-relevant halves: yellow counts only when {@link yellowOwner} is set. */
	scored: PinHalfCounts;
}

/** @deprecated Use GoalScoring */
export type MidfieldGoalScoring = GoalScoring;

export interface QuadrantGoalPairScoring {
	allianceGoal: GoalScoring;
	neutralGoal: GoalScoring;
	toggleColor: ToggleColor;
}

export interface StructureScoring {
	midfieldGoal: GoalScoring;
	redQuadrantOne?: QuadrantGoalPairScoring;
}

export interface ScenarioScoring {
	structures: StructureScoring[];
}

export interface MidfieldCounts {
	red: number;
	blue: number;
}

export interface ScenarioContext {
	midfieldCounts: MidfieldCounts;
}

export function emptyPinHalfCounts(): PinHalfCounts {
	return { red: 0, blue: 0, yellow: 0 };
}

export function emptyGoalScoring(): GoalScoring {
	return {
		visible: emptyPinHalfCounts(),
		yellowOwner: null,
		scored: emptyPinHalfCounts()
	};
}

/** @deprecated Use emptyGoalScoring */
export const emptyMidfieldGoalScoring = emptyGoalScoring;

export function emptyStructureScoring(): StructureScoring {
	return { midfieldGoal: emptyGoalScoring() };
}

function addPinHalfCounts(a: PinHalfCounts, b: PinHalfCounts): PinHalfCounts {
	return {
		red: a.red + b.red,
		blue: a.blue + b.blue,
		yellow: a.yellow + b.yellow
	};
}

function mergeYellowOwner(a: YellowOwner, b: YellowOwner): YellowOwner {
	return b ?? a;
}

function mergeGoalScoring(a: GoalScoring, b: GoalScoring): GoalScoring {
	return {
		visible: addPinHalfCounts(a.visible, b.visible),
		yellowOwner: mergeYellowOwner(a.yellowOwner, b.yellowOwner),
		scored: addPinHalfCounts(a.scored, b.scored)
	};
}

function mergeQuadrantGoalPair(
	a: QuadrantGoalPairScoring | undefined,
	b: QuadrantGoalPairScoring | undefined
): QuadrantGoalPairScoring | undefined {
	if (!a) {
		return b;
	}
	if (!b) {
		return a;
	}
	return {
		allianceGoal: mergeGoalScoring(a.allianceGoal, b.allianceGoal),
		neutralGoal: mergeGoalScoring(a.neutralGoal, b.neutralGoal),
		toggleColor: b.toggleColor
	};
}

export function aggregateStructureScorings(structures: StructureScoring[]): StructureScoring {
	return structures.reduce(
		(total, scoring) => ({
			midfieldGoal: mergeGoalScoring(total.midfieldGoal, scoring.midfieldGoal),
			redQuadrantOne: mergeQuadrantGoalPair(total.redQuadrantOne, scoring.redQuadrantOne)
		}),
		emptyStructureScoring()
	);
}
