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

/** Full scenario answer key — one field per scoring region on the field. */
export interface ScenarioScoring {
	midfieldGoal: GoalScoring;
	redQuadrantOne?: QuadrantGoalPairScoring;
	redQuadrantTwo?: QuadrantGoalPairScoring;
	blueQuadrantOne?: QuadrantGoalPairScoring;
	blueQuadrantTwo?: QuadrantGoalPairScoring;
}

/** Partial scoring returned by a single structure. */
export type ScoringSlice = Partial<ScenarioScoring>;

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

export function emptyScenarioScoring(): ScenarioScoring {
	return { midfieldGoal: emptyGoalScoring() };
}

export function mergeScoringSlices(...slices: ScoringSlice[]): ScenarioScoring {
	return slices.reduce<ScenarioScoring>((total, slice) => ({ ...total, ...slice }), emptyScenarioScoring());
}
