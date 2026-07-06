import { z } from 'zod';
import { ToggleColorSchema } from './scenario';

const countSchema = z.number().int().min(0).max(100);

export const PinHalfCountsSchema = z.object({
	red: countSchema,
	blue: countSchema,
	yellow: countSchema
});
export type PinHalfCounts = z.infer<typeof PinHalfCountsSchema>;

export const MidfieldCountsSchema = z.object({
	red: countSchema,
	blue: countSchema
});
export type MidfieldCounts = z.infer<typeof MidfieldCountsSchema>;

export const UserQuadrantScoringSchema = z.object({
	red: countSchema,
	blue: countSchema,
	yellow: countSchema,
	toggleColor: ToggleColorSchema
});
export type UserQuadrantScoring = z.infer<typeof UserQuadrantScoringSchema>;

export const UserScenarioScoringSchema = z.object({
	redQuadrantOne: UserQuadrantScoringSchema,
	redQuadrantTwo: UserQuadrantScoringSchema,
	blueQuadrantOne: UserQuadrantScoringSchema,
	blueQuadrantTwo: UserQuadrantScoringSchema,
	midfieldGoal: PinHalfCountsSchema,
	midfieldRobots: MidfieldCountsSchema
});
export type UserScenarioScoring = z.infer<typeof UserScenarioScoringSchema>;

function emptyUserQuadrantScoring(): UserQuadrantScoring {
	return { red: 0, blue: 0, yellow: 0, toggleColor: 'yellow' };
}

export function emptyUserScenarioScoring(): UserScenarioScoring {
	return {
		redQuadrantOne: emptyUserQuadrantScoring(),
		redQuadrantTwo: emptyUserQuadrantScoring(),
		blueQuadrantOne: emptyUserQuadrantScoring(),
		blueQuadrantTwo: emptyUserQuadrantScoring(),
		midfieldGoal: { red: 0, blue: 0, yellow: 0 },
		midfieldRobots: { red: 0, blue: 0 }
	};
}

export function parseUserScenarioScoring(input: unknown): UserScenarioScoring {
	return UserScenarioScoringSchema.parse(input);
}

const UserQuadrantScoringPatchSchema = UserQuadrantScoringSchema.partial();
const PinHalfCountsPatchSchema = PinHalfCountsSchema.partial();
const MidfieldCountsPatchSchema = MidfieldCountsSchema.partial();

export const ScoringPatchSchema = z
	.object({
		redQuadrantOne: UserQuadrantScoringPatchSchema.optional(),
		redQuadrantTwo: UserQuadrantScoringPatchSchema.optional(),
		blueQuadrantOne: UserQuadrantScoringPatchSchema.optional(),
		blueQuadrantTwo: UserQuadrantScoringPatchSchema.optional(),
		midfieldGoal: PinHalfCountsPatchSchema.optional(),
		midfieldRobots: MidfieldCountsPatchSchema.optional()
	})
	.refine((patch) => Object.values(patch).some((section) => section !== undefined), {
		message: 'Scoring patch must include at least one field'
	});
export type ScoringPatch = z.infer<typeof ScoringPatchSchema>;

export const ScoringUpdateEventSchema = z.object({
	revision: z.number().int().nonnegative(),
	patch: ScoringPatchSchema
});
export type ScoringUpdateEvent = z.infer<typeof ScoringUpdateEventSchema>;

export const SCORING_SECTION_KEYS = [
	'redQuadrantOne',
	'redQuadrantTwo',
	'blueQuadrantOne',
	'blueQuadrantTwo',
	'midfieldGoal',
	'midfieldRobots'
] as const satisfies readonly (keyof UserScenarioScoring)[];

export function mergeScoringPatch(current: UserScenarioScoring, patch: ScoringPatch): UserScenarioScoring {
	return {
		redQuadrantOne: patch.redQuadrantOne
			? { ...current.redQuadrantOne, ...patch.redQuadrantOne }
			: current.redQuadrantOne,
		redQuadrantTwo: patch.redQuadrantTwo
			? { ...current.redQuadrantTwo, ...patch.redQuadrantTwo }
			: current.redQuadrantTwo,
		blueQuadrantOne: patch.blueQuadrantOne
			? { ...current.blueQuadrantOne, ...patch.blueQuadrantOne }
			: current.blueQuadrantOne,
		blueQuadrantTwo: patch.blueQuadrantTwo
			? { ...current.blueQuadrantTwo, ...patch.blueQuadrantTwo }
			: current.blueQuadrantTwo,
		midfieldGoal: patch.midfieldGoal ? { ...current.midfieldGoal, ...patch.midfieldGoal } : current.midfieldGoal,
		midfieldRobots: patch.midfieldRobots
			? { ...current.midfieldRobots, ...patch.midfieldRobots }
			: current.midfieldRobots
	};
}

export function mergeScoringPatches(base: ScoringPatch, incoming: ScoringPatch): ScoringPatch {
	const merged: ScoringPatch = { ...base };

	for (const key of SCORING_SECTION_KEYS) {
		const incomingSection = incoming[key];
		if (incomingSection === undefined) continue;

		const baseSection = merged[key];
		merged[key] = baseSection ? ({ ...baseSection, ...incomingSection } as ScoringPatch[typeof key]) : incomingSection;
	}

	return merged;
}

/** Drop pending fields superseded by a remote patch (keeps unrelated local edits). */
export function removeOverlappingFromPatch(pending: ScoringPatch, applied: ScoringPatch): ScoringPatch | null {
	const result: ScoringPatch = { ...pending };
	let hasContent = false;

	for (const key of SCORING_SECTION_KEYS) {
		const pendingSection = result[key];
		const appliedSection = applied[key];

		if (!pendingSection) continue;

		if (!appliedSection) {
			hasContent = true;
			continue;
		}

		const nextSection = { ...pendingSection } as Record<string, unknown>;
		for (const field of Object.keys(appliedSection)) {
			delete nextSection[field];
		}

		if (Object.keys(nextSection).length === 0) {
			delete result[key];
		} else {
			result[key] = nextSection as ScoringPatch[typeof key];
			hasContent = true;
		}
	}

	return hasContent ? result : null;
}

function diffRecordPatch<T extends Record<string, unknown>>(previous: T, next: T): Partial<T> | null {
	const partial: Partial<T> = {};
	for (const key of Object.keys(next) as (keyof T)[]) {
		if (previous[key] !== next[key]) {
			partial[key] = next[key];
		}
	}
	return Object.keys(partial).length > 0 ? partial : null;
}

export function diffQuadrantSectionPatch(
	key: 'redQuadrantOne' | 'redQuadrantTwo' | 'blueQuadrantOne' | 'blueQuadrantTwo',
	previous: UserQuadrantScoring,
	next: UserQuadrantScoring
): ScoringPatch | null {
	const partial = diffRecordPatch(previous, next);
	return partial ? { [key]: partial } : null;
}

export function diffMidfieldGoalPatch(previous: PinHalfCounts, next: PinHalfCounts): ScoringPatch | null {
	const partial = diffRecordPatch(previous, next);
	return partial ? { midfieldGoal: partial } : null;
}

export function diffMidfieldRobotsPatch(previous: MidfieldCounts, next: MidfieldCounts): ScoringPatch | null {
	const partial = diffRecordPatch(previous, next);
	return partial ? { midfieldRobots: partial } : null;
}
