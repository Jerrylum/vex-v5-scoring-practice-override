import type { RoomState, ScoringUpdateEvent } from "@vex-v5-override/protocol";
import type { Network, RouterBroadcastProxy, RouterProxy } from "@vex-v5-override/wrpc/server";
import type { ClientRouter } from "@vex-v5-override/web/src/lib/multiplayer/client-router";

/** Broadcast full room state to all connected clients. */
export function broadcastRoomState(
  broadcast: RouterBroadcastProxy<ClientRouter>,
  state: RoomState,
): void {
  void broadcast.onRoomStateUpdate.mutation(state);
}

/** Broadcast a scoring field patch to all connected clients except the sender. */
export function broadcastScoringPatch(
  network: Network,
  getClient: (clientId: string) => RouterProxy<ClientRouter>,
  excludeClientId: string,
  event: ScoringUpdateEvent,
): void {
  for (const clientId of network.getConnectedClients()) {
    if (clientId === excludeClientId) continue;
    void getClient(clientId).onScoringPatch.mutation(event);
  }
}
