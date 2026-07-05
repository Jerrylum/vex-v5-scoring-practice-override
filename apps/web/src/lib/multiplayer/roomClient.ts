import { ConnectionCloseCode, createClientManager, type ClientOptions, type ConnectionState } from '@vex-v5-override/wrpc/client';
import type { ServerRouter } from '@vex-v5-override/worker/src/server-router';
import { clientRouter, type ClientRouter } from './client-router';
import { getOrCreateClientId, getOrCreateDeviceId } from './identity';

const isDevelopment = import.meta.env.DEV;

export function getWsUrl(): string {
	if (isDevelopment) {
		return `ws://${window.location.hostname}:8787/ws`;
	}
	return `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
}

export type RoomConnectionAction = 'create' | 'join' | 'rejoin';

export interface RoomConnectionParams {
	roomId: string;
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
		clientId: getOrCreateClientId(),
		deviceId: getOrCreateDeviceId(),
		deviceName: pending.displayName,
		action: pending.action,
		onContext: async () => ({}),
		onOpen: () => {},
		onClosed: (code) => {
			if (code === ConnectionCloseCode.KICKED) {
				import('./roomSession.svelte').then(({ roomSession }) => {
					roomSession.setError('You were removed from the room.');
				});
			}
		},
		onConnectionStateChange: (state) => {
			connectionState = state;
			onConnectionStateChange?.(state);
		}
	};
}

let pendingConnection: RoomConnectionParams | null = null;

export function resetRoomClient(): void {
	clientManager.resetClient();
	pendingConnection = null;
	connectionState = 'offline';
}

export function prepareConnection(params: RoomConnectionParams): void {
	pendingConnection = params;
	clientManager.resetClient();
}

export function getRoomRpcClient(): ReturnType<typeof clientManager.getClient>[1] {
	return clientManager.getClient()[1];
}

export async function connectRoom(params: RoomConnectionParams): Promise<void> {
	prepareConnection(params);
	clientManager.getClient();
}
