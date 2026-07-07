import { z } from 'zod';
import { GENERATOR_VERSION, SNAPSHOT_VERSION } from './constants';

export const PinTypeSchema = z.enum(['redBlue', 'redYellow', 'blueYellow', 'yellowYellow']);
export type PinType = z.infer<typeof PinTypeSchema>;

export const LevelSchema = z.enum(['easy', 'medium', 'hard']);
export type Level = z.infer<typeof LevelSchema>;

export const ToggleColorSchema = z.enum(['red', 'blue', 'yellow']);
export type ToggleColor = z.infer<typeof ToggleColorSchema>;

export const QuadrantIdSchema = z.enum(['redQuadrantOne', 'redQuadrantTwo', 'blueQuadrantOne', 'blueQuadrantTwo']);
export type QuadrantId = z.infer<typeof QuadrantIdSchema>;

export const RobotsCaseTypeSchema = z.enum(['none', 'clawbotOnField']);
export type RobotsCaseType = z.infer<typeof RobotsCaseTypeSchema>;

export const MidfieldCaseTypeSchema = z.enum(['oneYY', 'shortStack', 'tallStack']);
export type MidfieldCaseType = z.infer<typeof MidfieldCaseTypeSchema>;

export const QuadrantCaseTypeSchema = z.enum(['noPin', 'shortStack', 'mediumStack', 'hardStack']);
export type QuadrantCaseType = z.infer<typeof QuadrantCaseTypeSchema>;

export const RobotPlacementSchema = z.object({
	alliance: z.enum(['red', 'blue']),
	slot: z.union([z.literal(0), z.literal(1)]),
	x: z.number(),
	z: z.number(),
	rotationY: z.number()
});
export type RobotPlacement = z.infer<typeof RobotPlacementSchema>;

export const PartialCoverPoseSchema = z.object({
	offsetY: z.number(),
	tiltRad: z.number(),
	rotationY: z.number()
});
export type PartialCoverPose = z.infer<typeof PartialCoverPoseSchema>;

export const StackItemSchema = z.discriminatedUnion('kind', [
	z.object({
		kind: z.literal('pin'),
		pinType: PinTypeSchema,
		isFlipped: z.boolean(),
		partialPlaced: PartialCoverPoseSchema.optional()
	}),
	z.object({
		kind: z.literal('cup'),
		isFlipped: z.boolean(), // Upside opaque, bottom transparent
		partialCover: PartialCoverPoseSchema.optional()
	})
]);
export type StackItem = z.infer<typeof StackItemSchema>;

export const RobotsSnapshotSchema = z.object({
	caseType: RobotsCaseTypeSchema,
	placements: z.array(RobotPlacementSchema).optional()
});
export type RobotsSnapshot = z.infer<typeof RobotsSnapshotSchema>;

export const MidfieldSnapshotSchema = z.object({
	caseType: MidfieldCaseTypeSchema,
	stack: z.array(StackItemSchema)
});
export type MidfieldSnapshot = z.infer<typeof MidfieldSnapshotSchema>;

export const QuadrantSnapshotSchema = z.object({
	quadrantId: QuadrantIdSchema,
	caseType: QuadrantCaseTypeSchema,
	toggleColor: ToggleColorSchema,
	allianceStack: z.array(StackItemSchema),
	neutralStack: z.array(StackItemSchema)
});
export type QuadrantSnapshot = z.infer<typeof QuadrantSnapshotSchema>;

export const ScatteredPlacementSchema = z.discriminatedUnion('kind', [
	z.object({
		kind: z.literal('pin'),
		pinType: PinTypeSchema,
		isFlipped: z.boolean(),
		x: z.number(),
		z: z.number(),
		rotationZ: z.number()
	}),
	z.object({
		kind: z.literal('cup'),
		isFlipped: z.boolean(),
		x: z.number(),
		z: z.number(),
		rotationZ: z.number()
	})
]);
export type ScatteredPlacement = z.infer<typeof ScatteredPlacementSchema>;

export const RemainingItemsSnapshotSchema = z.object({
	items: z.array(ScatteredPlacementSchema)
});
export type RemainingItemsSnapshot = z.infer<typeof RemainingItemsSnapshotSchema>;

export const ScenarioSnapshotSchema = z.object({
	version: z.literal(SNAPSHOT_VERSION),
	difficulty: LevelSchema,
	robots: RobotsSnapshotSchema,
	midfield: MidfieldSnapshotSchema,
	redQuadrantOne: QuadrantSnapshotSchema,
	redQuadrantTwo: QuadrantSnapshotSchema,
	blueQuadrantOne: QuadrantSnapshotSchema,
	blueQuadrantTwo: QuadrantSnapshotSchema,
	remainingItems: RemainingItemsSnapshotSchema
});
export type ScenarioSnapshot = z.infer<typeof ScenarioSnapshotSchema>;

export const ScenarioProvenanceSchema = z.object({
	generatorVersion: z.number().int(),
	masterSeed: z.number().int(),
	robotsSeed: z.number().int(),
	midfieldSeed: z.number().int(),
	redQuadrantOneSeed: z.number().int(),
	redQuadrantTwoSeed: z.number().int(),
	blueQuadrantOneSeed: z.number().int(),
	blueQuadrantTwoSeed: z.number().int(),
	remainingItemsSeed: z.number().int()
});
export type ScenarioProvenance = z.infer<typeof ScenarioProvenanceSchema>;

export const ScenarioLinkParamsSchema = z.object({
	generatorVersion: z.number().int(),
	masterSeed: z.number().int(),
	difficulty: LevelSchema
});
export type ScenarioLinkParams = z.infer<typeof ScenarioLinkParamsSchema>;

export function parseScenarioSnapshot(input: unknown): ScenarioSnapshot {
	return ScenarioSnapshotSchema.parse(input);
}

export function parseScenarioLinkParams(input: unknown): ScenarioLinkParams {
	return ScenarioLinkParamsSchema.parse(input);
}

/** Current generator version constant for link validation. */
export { GENERATOR_VERSION, SNAPSHOT_VERSION };
