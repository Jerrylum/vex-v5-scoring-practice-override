import { z } from 'zod';
import { diffSectionPatch } from './patch';
import { ToggleColorSchema } from './scenario';

/** Upper bound for pin/robot count fields in user scoring. */
export const MAX_SCORING_COUNT = 100;

const countSchema = z.number().int().min(0).max(MAX_SCORING_COUNT);

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

export function diffScoringSectionPatch<K extends keyof UserScenarioScoring>(
	key: K,
	previous: UserScenarioScoring[K],
	next: UserScenarioScoring[K]
): ScoringPatch | null {
	return diffSectionPatch(key, previous, next);
}
