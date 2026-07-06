import {
	RegenerateScenarioInputSchema,
	RoomStateSchema,
	SetPhaseInputSchema,
	SetShowAnswerInputSchema,
	UpdateScoringInputSchema
} from '@vex-v5-override/protocol';
import type { WRPCRootObject } from '@vex-v5-override/wrpc/server';
import { WRPCError } from '@vex-v5-override/wrpc/server';
import { RoomNotFoundError, regenerateScenario, resetScoring, setPhase, setShowAnswer, updateScoring } from '../room-store';
import type { ServerContext } from '../server-router';
import { broadcastRoomState, broadcastScoringPatch } from './broadcast';

export function buildRoomRoute(w: WRPCRootObject<object, ServerContext, Record<string, never>>) {
	return {
		updateScoring: w.procedure
			.input(UpdateScoringInputSchema)
			.mutation(async ({ ctx, input }) => {
				try {
					const next = updateScoring(ctx.store, input);
					ctx.store.state = next;
					await ctx.persist();
					broadcastScoringPatch(ctx.network, { revision: next.revision, patch: input });
				} catch (error) {
					if (error instanceof RoomNotFoundError) {
						throw new WRPCError(error.message, 'NOT_FOUND');
					}
					throw error;
				}
			}),

		regenerateScenario: w.procedure
			.input(RegenerateScenarioInputSchema)
			.output(RoomStateSchema)
			.mutation(async ({ ctx, input, session }) => {
				try {
					const next = regenerateScenario(ctx.store, session.currentClient.clientId, input);
					ctx.store.state = next;
					await ctx.persist();
					broadcastRoomState(ctx.network, next);
					return next;
				} catch (error) {
					if (error instanceof RoomNotFoundError) {
						throw new WRPCError(error.message, 'NOT_FOUND');
					}
					throw error;
				}
			}),

		resetScoring: w.procedure.output(RoomStateSchema).mutation(async ({ ctx, session }) => {
			try {
				const next = resetScoring(ctx.store, session.currentClient.clientId);
				ctx.store.state = next;
				await ctx.persist();
				broadcastRoomState(ctx.network, next);
				return next;
			} catch (error) {
				if (error instanceof RoomNotFoundError) {
					throw new WRPCError(error.message, 'NOT_FOUND');
				}
				throw error;
			}
		}),

		setShowAnswer: w.procedure
			.input(SetShowAnswerInputSchema)
			.output(RoomStateSchema)
			.mutation(async ({ ctx, input, session }) => {
				try {
					const next = setShowAnswer(ctx.store, session.currentClient.clientId, input.showAnswer);
					ctx.store.state = next;
					await ctx.persist();
					broadcastRoomState(ctx.network, next);
					return next;
				} catch (error) {
					if (error instanceof RoomNotFoundError) {
						throw new WRPCError(error.message, 'NOT_FOUND');
					}
					throw error;
				}
			}),

		setPhase: w.procedure
			.input(SetPhaseInputSchema)
			.output(RoomStateSchema)
			.mutation(async ({ ctx, input, session }) => {
				try {
					const next = setPhase(ctx.store, session.currentClient.clientId, input.phase);
					ctx.store.state = next;
					await ctx.persist();
					broadcastRoomState(ctx.network, next);
					return next;
				} catch (error) {
					if (error instanceof RoomNotFoundError) {
						throw new WRPCError(error.message, 'NOT_FOUND');
					}
					throw error;
				}
			})
	};
}
