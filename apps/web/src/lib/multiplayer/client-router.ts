import { RoomStateSchema, ScoringUpdateEventSchema, type RoomState, type ScoringUpdateEvent } from '@vex-v5-override/protocol';
import { initWRPC } from '@vex-v5-override/wrpc/client';

const w = initWRPC.createClient();

let onRoomStateUpdateHandler: ((state: RoomState) => void) | null = null;
let onScoringPatchHandler: ((event: ScoringUpdateEvent) => void) | null = null;

export function setOnRoomStateUpdateHandler(handler: ((state: RoomState) => void) | null): void {
	onRoomStateUpdateHandler = handler;
}

export function setOnScoringPatchHandler(handler: ((event: ScoringUpdateEvent) => void) | null): void {
	onScoringPatchHandler = handler;
}

export const clientRouter = w.router({
	onRoomStateUpdate: w.procedure.input(RoomStateSchema).mutation(async ({ input }) => {
		onRoomStateUpdateHandler?.(input);
	}),
	onScoringPatch: w.procedure.input(ScoringUpdateEventSchema).mutation(async ({ input }) => {
		onScoringPatchHandler?.(input);
	})
});

export type ClientRouter = typeof clientRouter;
