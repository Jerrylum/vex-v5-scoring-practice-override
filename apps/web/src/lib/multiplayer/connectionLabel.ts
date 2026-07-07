import type { ConnectionState } from '@jerrylum/wrpc/client';

export function connectionLabelForState(state: ConnectionState): string {
	switch (state) {
		case 'connected':
			return 'Connected';
		case 'connecting':
			return 'Connecting…';
		case 'reconnecting':
			return 'Connection error, retrying in a few seconds…';
		case 'error':
			return 'Connection error';
		default:
			return 'Offline';
	}
}
