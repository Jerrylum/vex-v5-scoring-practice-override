/** Visible pin-half counts (what a referee counts from the stack). */
export interface PinHalfCounts {
	red: number;
	blue: number;
	yellow: number;
}

/** Alliance that owns midfield yellow pins per <SC5>/<SC6>, or null when tied / unowned. */
export type YellowOwner = 'red' | 'blue' | null;

export interface MidfieldGoalScoring {
	/** Visible halves in the goal (cup opacity and flip applied). */
	visible: PinHalfCounts;
	/** Derived from robot midfield counts at end of match. */
	yellowOwner: YellowOwner;
	/** Point-relevant halves: yellow counts only when {@link yellowOwner} is set. */
	scored: PinHalfCounts;
}

export interface StructureScoring {
	midfieldGoal: MidfieldGoalScoring;
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

export function emptyMidfieldGoalScoring(): MidfieldGoalScoring {
	return {
		visible: emptyPinHalfCounts(),
		yellowOwner: null,
		scored: emptyPinHalfCounts()
	};
}

export function emptyStructureScoring(): StructureScoring {
	return { midfieldGoal: emptyMidfieldGoalScoring() };
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

export function aggregateStructureScorings(structures: StructureScoring[]): StructureScoring {
	return structures.reduce(
		(total, scoring) => ({
			midfieldGoal: {
				visible: addPinHalfCounts(total.midfieldGoal.visible, scoring.midfieldGoal.visible),
				yellowOwner: mergeYellowOwner(total.midfieldGoal.yellowOwner, scoring.midfieldGoal.yellowOwner),
				scored: addPinHalfCounts(total.midfieldGoal.scored, scoring.midfieldGoal.scored)
			}
		}),
		emptyStructureScoring()
	);
}
