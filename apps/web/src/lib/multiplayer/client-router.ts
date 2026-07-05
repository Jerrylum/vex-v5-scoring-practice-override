import { RoomStateSchema, type RoomState } from '@vex-v5-override/protocol';
import { initWRPC } from '@vex-v5-override/wrpc/client';

const w = initWRPC.createClient();

let onRoomStateUpdateHandler: ((state: RoomState) => void) | null = null;

export function setOnRoomStateUpdateHandler(handler: ((state: RoomState) => void) | null): void {
	onRoomStateUpdateHandler = handler;
}

export const clientRouter = w.router({
	onRoomStateUpdate: w.procedure.input(RoomStateSchema).mutation(async ({ input }) => {
		onRoomStateUpdateHandler?.(input);
	})
});

export type ClientRouter = typeof clientRouter;
