import { z } from 'zod';
import { ScenarioSnapshotSchema } from './scenario';
import { UserScenarioScoringSchema } from './scoring';

export const RefereeRoleSchema = z.enum(['southWest', 'southEast', 'headRef', 'observer']);
export type RefereeRole = z.infer<typeof RefereeRoleSchema>;

export const RoomPhaseSchema = z.enum(['lobby', 'scoring', 'review', 'closed']);
export type RoomPhase = z.infer<typeof RoomPhaseSchema>;

export const RoomActionSchema = z.enum(['create', 'join', 'rejoin']);
export type RoomAction = z.infer<typeof RoomActionSchema>;

export const ParticipantSchema = z.object({
	clientId: z.uuid(),
	deviceId: z.uuid(),
	displayName: z.string().min(1).max(32),
	role: RefereeRoleSchema.nullable(),
	joinedAt: z.string().datetime()
});
export type Participant = z.infer<typeof ParticipantSchema>;

export const RoomMetaSchema = z.object({
	roomId: z.uuid(),
	createdAt: z.string().datetime()
});
export type RoomMeta = z.infer<typeof RoomMetaSchema>;

export const RoomStateSchema = z.object({
	revision: z.number().int().nonnegative(),
	phase: RoomPhaseSchema,
	hostClientId: z.uuid(),
	scenario: ScenarioSnapshotSchema,
	scoring: UserScenarioScoringSchema,
	participants: z.array(ParticipantSchema),
	showAnswer: z.boolean().optional()
});
export type RoomState = z.infer<typeof RoomStateSchema>;

export const JoiningKitSchema = z.object({
	room: RoomMetaSchema,
	state: RoomStateSchema
});
export type JoiningKit = z.infer<typeof JoiningKitSchema>;

export function parseRoomState(input: unknown): RoomState {
	return RoomStateSchema.parse(input);
}

export function parseJoiningKit(input: unknown): JoiningKit {
	return JoiningKitSchema.parse(input);
}

export const ConnectionIntentionSchema = z.object({
	roomId: z.uuid(),
	clientId: z.uuid(),
	deviceId: z.uuid(),
	displayName: z.string().min(1).max(32),
	action: RoomActionSchema
});
export type ConnectionIntention = z.infer<typeof ConnectionIntentionSchema>;

export const CreateRoomInputSchema = z.object({
	scenario: ScenarioSnapshotSchema,
	displayName: z.string().min(1).max(32)
});
export type CreateRoomInput = z.infer<typeof CreateRoomInputSchema>;

export const JoinRoomInputSchema = z.object({
	displayName: z.string().min(1).max(32)
});
export type JoinRoomInput = z.infer<typeof JoinRoomInputSchema>;

export const UpdateScoringInputSchema = UserScenarioScoringSchema;
export type UpdateScoringInput = z.infer<typeof UpdateScoringInputSchema>;

export const RegenerateScenarioInputSchema = z.object({
	scenario: ScenarioSnapshotSchema
});
export type RegenerateScenarioInput = z.infer<typeof RegenerateScenarioInputSchema>;

export const SetShowAnswerInputSchema = z.object({
	showAnswer: z.boolean()
});
export type SetShowAnswerInput = z.infer<typeof SetShowAnswerInputSchema>;

export const SetPhaseInputSchema = z.object({
	phase: RoomPhaseSchema
});
export type SetPhaseInput = z.infer<typeof SetPhaseInputSchema>;

export function parseConnectionIntention(input: unknown): ConnectionIntention {
	return ConnectionIntentionSchema.parse(input);
}
