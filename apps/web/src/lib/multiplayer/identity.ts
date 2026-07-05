import { generateUUID } from '../utils';

export { generateUUID };

const CLIENT_NAME_SUFFIX_LENGTH = 4;

function randomSuffix(length: number): string {
	const bytes = new Uint8Array(Math.ceil(length / 2));
	if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
		crypto.getRandomValues(bytes);
	} else {
		for (let i = 0; i < bytes.length; i++) {
			bytes[i] = Math.floor(Math.random() * 256);
		}
	}
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
		.join('')
		.slice(0, length);
}

function getDeviceBaseName(): string {
	const ua = navigator.userAgent;
	if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
	if (/Android/.test(ua)) return 'Android';
	if (/Mac/.test(ua)) return 'Mac';
	if (/Windows/.test(ua)) return 'Windows';
	return 'Referee';
}

/** Auto-generated per-tab client label, e.g. Mac-7f3a. */
export function generateClientName(): string {
	return `${getDeviceBaseName()}-${randomSuffix(CLIENT_NAME_SUFFIX_LENGTH)}`;
}

export function buildRoomUrl(roomId: string): string {
	const url = new URL(window.location.origin + window.location.pathname);
	url.searchParams.delete('s');
	url.searchParams.set('roomId', roomId);
	return url.toString();
}

export function setRoomUrl(roomId: string): void {
	const url = new URL(window.location.href);
	url.searchParams.delete('s');
	url.searchParams.set('roomId', roomId);
	window.history.replaceState({}, '', url.pathname + url.search);
}

export function clearRoomUrl(): void {
	const url = new URL(window.location.href);
	url.searchParams.delete('roomId');
	const next = url.searchParams.toString();
	window.history.replaceState({}, '', next ? `${url.pathname}?${next}` : url.pathname);
}

export function parseRoomIdFromUrl(searchParams: URLSearchParams): string | null {
	const roomId = searchParams.get('roomId');
	if (!roomId) return null;
	return roomId;
}
