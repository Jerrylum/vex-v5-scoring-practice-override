import { isMobileGpu } from './deviceProfile';

export type GraphicProfile = 'performance' | 'balance' | 'bestQuality';
export type GraphicProfileSetting = GraphicProfile | 'auto';

const STORAGE_KEY = 'vex-v5-graphic-profile';

const VALID_SETTINGS: GraphicProfileSetting[] = ['auto', 'performance', 'balance', 'bestQuality'];

export function loadGraphicProfileSetting(): GraphicProfileSetting {
	if (typeof window === 'undefined') {
		return 'auto';
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored && VALID_SETTINGS.includes(stored as GraphicProfileSetting)) {
			return stored as GraphicProfileSetting;
		}
	} catch {
		// ignore storage errors
	}

	return 'auto';
}

export function saveGraphicProfileSetting(value: GraphicProfileSetting): void {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(STORAGE_KEY, value);
	} catch {
		// ignore storage errors
	}
}

export function resolveGraphicProfile(setting: GraphicProfileSetting): GraphicProfile {
	if (setting !== 'auto') {
		return setting;
	}

	return isMobileGpu() ? 'performance' : 'bestQuality';
}

export const GRAPHIC_PROFILE_LABELS: Record<GraphicProfileSetting, string> = {
	auto: 'Auto (recommended)',
	performance: 'Performance',
	balance: 'Balance',
	bestQuality: 'Best Quality'
};
