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
