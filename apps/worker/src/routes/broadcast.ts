import type { RoomState } from '@vex-v5-override/protocol';
import type { Network, WRPCRequest } from '@vex-v5-override/wrpc/server';

/** Broadcast full room state to all connected clients. */
export function broadcastRoomState(network: Network, state: RoomState): void {
	const request: WRPCRequest = {
		kind: 'request',
		id: crypto.randomUUID(),
		type: 'mutation',
		path: 'onRoomStateUpdate',
		input: state
	};
	void network.broadcast(request);
}
