import { REFEREE_VIEW_PRESETS, type RefereeViewPreset } from './refereeView';

export type ScenarioDefaultViewSetting = RefereeViewPreset | null;

const STORAGE_KEY = 'vex-v5-scenario-default-view';
const NONE_VALUE = 'none';

const VALID_PRESET_VALUES = new Set<string>(REFEREE_VIEW_PRESETS);

export const SCENARIO_DEFAULT_VIEW_LABELS: Record<RefereeViewPreset | 'none', string> = {
	none: 'None — keep current view',
	southWest: 'SW Referee View',
	southEast: 'SE Referee View',
	headRef: 'Head Referee View',
	midfield: 'Midfield View',
	observer: 'Observer View'
};

export const SCENARIO_DEFAULT_VIEW_OPTIONS: { value: ScenarioDefaultViewSetting; label: string }[] = [
	{ value: null, label: SCENARIO_DEFAULT_VIEW_LABELS.none },
	...REFEREE_VIEW_PRESETS.map((preset) => ({
		value: preset,
		label: SCENARIO_DEFAULT_VIEW_LABELS[preset]
	}))
];

export function loadScenarioDefaultViewSetting(): ScenarioDefaultViewSetting {
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === NONE_VALUE || stored === null) {
			return null;
		}
		if (VALID_PRESET_VALUES.has(stored)) {
			return stored as RefereeViewPreset;
		}
	} catch {
		// ignore storage errors
	}

	return null;
}

export function saveScenarioDefaultViewSetting(value: ScenarioDefaultViewSetting): void {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(STORAGE_KEY, value === null ? NONE_VALUE : value);
	} catch {
		// ignore storage errors
	}
}
