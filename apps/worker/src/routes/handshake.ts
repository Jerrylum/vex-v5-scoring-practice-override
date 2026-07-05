import {
	CreateRoomInputSchema,
	JoinRoomInputSchema,
	JoiningKitSchema
} from '@vex-v5-override/protocol';
import type { WRPCRootObject } from '@vex-v5-override/wrpc/server';
import { WRPCError } from '@vex-v5-override/wrpc/server';
import { RoomAlreadyExistsError, RoomNotFoundError, createRoom, joinRoom } from '../room-store';
import type { ServerContext } from '../server-router';
import { broadcastRoomState } from './broadcast';

export function buildHandshakeRoute(w: WRPCRootObject<object, ServerContext, Record<string, never>>) {
	return {
		createRoom: w.procedure
			.input(CreateRoomInputSchema)
			.output(JoiningKitSchema)
			.mutation(async ({ ctx, input, session }) => {
				try {
					const displayName = session.currentClient.deviceName;
					const result = createRoom(
						ctx.store,
						ctx.roomId,
						session.currentClient.clientId,
						displayName,
						input
					);
					ctx.store.meta = result.meta;
					ctx.store.state = result.state;
					await ctx.persist();
					broadcastRoomState(ctx.network, result.state);
					return result.kit;
				} catch (error) {
					if (error instanceof RoomAlreadyExistsError) {
						throw new WRPCError(error.message, 'CONFLICT');
					}
					throw error;
				}
			}),

		joinRoom: w.procedure
			.input(JoinRoomInputSchema)
			.output(JoiningKitSchema)
			.mutation(async ({ ctx, input, session }) => {
				try {
					const displayName = session.currentClient.deviceName;
					const result = joinRoom(ctx.store, session.currentClient.clientId, displayName, input);
					ctx.store.state = result.state;
					await ctx.persist();
					broadcastRoomState(ctx.network, result.state);
					return result.kit;
				} catch (error) {
					if (error instanceof RoomNotFoundError) {
						throw new WRPCError(error.message, 'NOT_FOUND');
					}
					throw error;
				}
			})
	};
}
