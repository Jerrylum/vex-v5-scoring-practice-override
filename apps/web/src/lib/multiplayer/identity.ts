const CLIENT_ID_KEY = 'vex-v5-override:clientId';
const DEVICE_ID_KEY = 'vex-v5-override:deviceId';
const DISPLAY_NAME_KEY = 'vex-v5-override:displayName';

export function generateUUID(): string {
	return crypto.randomUUID();
}

export function getOrCreateClientId(): string {
	return getOrCreateStoredId(CLIENT_ID_KEY);
}

export function getOrCreateDeviceId(): string {
	return getOrCreateStoredId(DEVICE_ID_KEY);
}

function getOrCreateStoredId(key: string): string {
	try {
		const existing = localStorage.getItem(key);
		if (existing) return existing;
		const id = generateUUID();
		localStorage.setItem(key, id);
		return id;
	} catch {
		return generateUUID();
	}
}

export function getDefaultDisplayName(): string {
	try {
		const saved = localStorage.getItem(DISPLAY_NAME_KEY);
		if (saved) return saved;
	} catch {
		// ignore
	}

	const ua = navigator.userAgent;
	if (/iPhone|iPad|iPod/.test(ua)) return 'iOS Device';
	if (/Android/.test(ua)) return 'Android Device';
	if (/Mac/.test(ua)) return 'Mac';
	if (/Windows/.test(ua)) return 'Windows PC';
	return 'Referee';
}

export function saveDisplayName(name: string): void {
	try {
		localStorage.setItem(DISPLAY_NAME_KEY, name);
	} catch {
		// ignore
	}
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
