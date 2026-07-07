import {
  RegenerateScenarioInputSchema,
  SetPhaseInputSchema,
  SetShowAnswerInputSchema,
  UpdateScoringInputSchema,
} from "@vex-v5-override/protocol";
import type { WRPCRootObject } from "@vex-v5-override/wrpc/server";
import type { ClientRouter } from "@vex-v5-override/web/src/lib/multiplayer/client-router";
import {
  regenerateScenario,
  resetScoring,
  setPhase,
  setShowAnswer,
  updateScoring,
} from "../room-store";
import type { ServerContext } from "../server-router";
import { broadcastRoomState, broadcastScoringPatch } from "./broadcast";

export function buildRoomRoute(
  w: WRPCRootObject<object, ServerContext, Record<string, never>>,
) {
  return {
    updateScoring: w.procedure
      .input(UpdateScoringInputSchema)
      .mutation(async ({ ctx, input, session }) => {
        const next = updateScoring(ctx.store, input);
        ctx.store.state = next;
        await ctx.persist();

        broadcastScoringPatch(
          ctx.network,
          (clientId) => session.getClient<ClientRouter>(clientId),
          session.currentClient.clientId,
          { revision: next.revision, patch: input },
        );
      }),

    regenerateScenario: w.procedure
      .input(RegenerateScenarioInputSchema)
      .mutation(async ({ ctx, input, session }) => {
        const next = regenerateScenario(
          ctx.store,
          session.currentClient.clientId,
          input,
        );
        ctx.store.state = next;
        await ctx.persist();

        broadcastRoomState(session.broadcast<ClientRouter>(), next);
      }),

    resetScoring: w.procedure.mutation(async ({ ctx, session }) => {
      const next = resetScoring(ctx.store, session.currentClient.clientId);
      ctx.store.state = next;
      await ctx.persist();

      broadcastRoomState(session.broadcast<ClientRouter>(), next);
    }),

    setShowAnswer: w.procedure
      .input(SetShowAnswerInputSchema)
      .mutation(async ({ ctx, input, session }) => {
        const next = setShowAnswer(
          ctx.store,
          session.currentClient.clientId,
          input.showAnswer,
        );
        ctx.store.state = next;
        await ctx.persist();

        broadcastRoomState(session.broadcast<ClientRouter>(), next);
      }),

    setPhase: w.procedure
      .input(SetPhaseInputSchema)
      .mutation(async ({ ctx, input, session }) => {
        const next = setPhase(
          ctx.store,
          session.currentClient.clientId,
          input.phase,
        );
        ctx.store.state = next;
        await ctx.persist();

        broadcastRoomState(session.broadcast<ClientRouter>(), next);
      }),
  };
}
