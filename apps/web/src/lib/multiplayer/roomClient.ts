import { createClientManager, type ClientOptions, type ConnectionState } from '@jerrylum/wrpc/client';
import type { ServerRouter } from '@vex-v5-override/worker/src/server-router';
import { clientRouter, type ClientRouter } from './client-router';
import { generateClientName, generateUUID } from './identity';

const isDevelopment = import.meta.env.DEV;

export function getWsUrl(): string {
	if (isDevelopment) {
		return `ws://${window.location.hostname}:8787/ws`;
	}
	return `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
}

export type RoomConnectionAction = 'create' | 'join';

export interface RoomConnectionParams {
	roomId: string;
	clientId: string;
	displayName: string;
	action: RoomConnectionAction;
}

let clientManager = createClientManager<ServerRouter, ClientRouter>(createClientOptions, clientRouter);
let connectionState: ConnectionState = 'offline';
let onConnectionStateChange: ((state: ConnectionState) => void) | null = null;

export function setConnectionStateListener(listener: ((state: ConnectionState) => void) | null): void {
	onConnectionStateChange = listener;
	if (listener) listener(connectionState);
}

export function getConnectionState(): ConnectionState {
	return connectionState;
}

function createClientOptions(): ClientOptions<ClientRouter> {
	const pending = pendingConnection;
	if (!pending) {
		throw new Error('No pending room connection');
	}

	return {
		wsUrl: getWsUrl(),
		roomId: pending.roomId,
		clientId: pending.clientId,
		deviceId: pending.clientId,
		deviceName: pending.displayName,
		onContext: async () => ({}),
		onOpen: () => {},
		onClosed: () => {},
		onConnectionStateChange: (state) => {
			connectionState = state;
			onConnectionStateChange?.(state);
		}
	};
}

/** Params for the next WRPC client; read when createClientOptions runs inside getClient(). */
let pendingConnection: RoomConnectionParams | null = null;

export function resetRoomClient(): void {
	clientManager.resetClient();
	pendingConnection = null;
	connectionState = 'offline';
}

export function getRoomRpcClient(): ReturnType<typeof clientManager.getClient>[1] {
	return clientManager.getClient()[1];
}

export function createConnectionParams(roomId: string, action: RoomConnectionAction): RoomConnectionParams {
	return {
		roomId,
		clientId: generateUUID(),
		displayName: generateClientName(),
		action
	};
}

/** Configure and instantiate the WRPC client. WebSocket open happens on the first RPC call. */
export function connectRoom(params: RoomConnectionParams): RoomConnectionParams {
	pendingConnection = params;
	clientManager.resetClient();
	clientManager.getClient();
	return params;
}
