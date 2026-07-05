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
