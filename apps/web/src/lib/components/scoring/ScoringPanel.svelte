<script lang="ts">
	import LinkIcon from '$lib/components/icons/LinkIcon.svelte';
	import GearIcon from '$lib/components/icons/GearIcon.svelte';
	import MenuIcon from '$lib/components/icons/MenuIcon.svelte';
	import MidfieldTab from './MidfieldTab.svelte';
	import OverviewTab from './OverviewTab.svelte';
	import QuadrantTab from './QuadrantTab.svelte';
	import ScoringTabBar from './ScoringTabBar.svelte';
	import type { Level } from '$lib/ScenarioGenerator';
	import type { MidfieldCounts, ScenarioScoring } from '$lib/Scoring';
	import {
		calculateActualAlliancePoints,
		calculateUserAlliancePoints,
		emptyUserScenarioScoring,
		isUserScoringCorrect,
		QUADRANT_TAB_CONFIG,
		type ScoringTabId,
		type UserScenarioScoring
	} from '$lib/userScoring';

	interface Props {
		userScoring?: UserScenarioScoring;
		actualCounts: ScenarioScoring;
		midfieldCounts: MidfieldCounts;
		currentDifficulty: Level;
		currentSeed: number | null;
		linkMessage: string | null;
		isLoading: boolean;
		isReloading: boolean;
		allowReload?: boolean;
		allowDifficultyChange?: boolean;
		readOnly?: boolean;
		copyLinkDisabled?: boolean;
		shareRoomMode?: boolean;
		showAnswer?: boolean;
		activeTab?: ScoringTabId;
		onShowAnswerChange?: (value: boolean) => void;
		onReload: () => void;
		onCopyLink: () => void;
		onGoToSimulator: () => void;
		onOpenSettings: () => void;
		onOpenPauseMenu: () => void;
		onDifficultyChange?: (next: Level) => boolean | Promise<boolean>;
	}

	let {
		userScoring = $bindable(emptyUserScenarioScoring()),
		actualCounts,
		midfieldCounts,
		currentDifficulty = $bindable('medium' as Level),
		currentSeed,
		linkMessage,
		isLoading,
		isReloading,
		allowReload = true,
		allowDifficultyChange = true,
		readOnly = false,
		copyLinkDisabled = false,
		shareRoomMode = false,
		showAnswer = $bindable(false),
		activeTab = $bindable('overview' as ScoringTabId),
		onShowAnswerChange,
		onReload,
		onCopyLink,
		onGoToSimulator,
		onOpenSettings,
		onOpenPauseMenu,
		onDifficultyChange
	}: Props = $props();

	const userPoints = $derived(calculateUserAlliancePoints(userScoring));
	const actualPoints = $derived(calculateActualAlliancePoints(actualCounts, midfieldCounts));
	const isCorrect = $derived(isUserScoringCorrect(userScoring, actualCounts, midfieldCounts));

	function handleTabChange(tab: ScoringTabId) {
		activeTab = tab;
	}

	function toggleAnswer() {
		const next = !showAnswer;
		showAnswer = next;
		onShowAnswerChange?.(next);
	}

	function updateQuadrant(key: (typeof QUADRANT_TAB_CONFIG)[number]['key'], quadrant: UserScenarioScoring[typeof key]) {
		userScoring = { ...userScoring, [key]: quadrant };
	}

	async function handleDifficultyChange(event: Event) {
		const select = event.currentTarget as HTMLSelectElement;
		const next = select.value as Level;
		if (next === currentDifficulty) return;

		if (onDifficultyChange) {
			const accepted = await onDifficultyChange(next);
			if (!accepted) select.value = currentDifficulty;
			return;
		}

		currentDifficulty = next;
	}
</script>

<div class="scoring-panel-no-select flex h-full flex-col bg-[#0a0a0a] text-[#CDD7E1]">
	<div class="flex-none border-b border-gray-800 p-3">
		<div class="flex items-center justify-between gap-2">
			<h2 class="text-lg font-bold text-[#CDD7E1]">Scoring Panel</h2>
			<div class="flex items-center gap-2">
				<button
					type="button"
					class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#dde7ee] bg-transparent text-[#007fff] transition-colors hover:bg-[#141414]"
					onclick={onOpenPauseMenu}
					aria-label="Open menu"
					title="Menu (Esc)"
				>
					<MenuIcon size={14} />
				</button>
				<button
					type="button"
					class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#dde7ee] bg-transparent text-[#007fff] transition-colors hover:bg-[#141414] disabled:cursor-not-allowed disabled:opacity-50"
					onclick={onCopyLink}
					disabled={copyLinkDisabled || isLoading || isReloading}
					aria-label={shareRoomMode ? 'Share room' : 'Copy link'}
					title={linkMessage ?? (shareRoomMode ? 'Share room' : 'Copy link')}
				>
					<LinkIcon size={14} />
				</button>
				<button
					type="button"
					class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#dde7ee] bg-transparent text-[#007fff] transition-colors hover:bg-[#141414]"
					onclick={onOpenSettings}
					aria-label="Settings"
					title="Settings"
				>
					<GearIcon size={14} />
				</button>
			</div>
		</div>

		{#if linkMessage}
			<p class="mt-1 text-xs text-[#007fff]">{linkMessage}</p>
		{/if}

		<div class="mt-3 flex gap-2">
			<div class="relative flex-1">
				<select
					id="difficulty"
					class="w-full cursor-pointer appearance-none rounded-full border border-[#dde7ee] bg-transparent py-2 pr-9 pl-3 text-sm text-[#CDD7E1] outline-none focus:border-[#007fff] disabled:cursor-not-allowed disabled:opacity-50"
					value={currentDifficulty}
					onchange={handleDifficultyChange}
					disabled={!allowDifficultyChange || isReloading || isLoading || readOnly}
				>
					<option value="easy">Easy</option>
					<option value="medium">Medium</option>
					<option value="hard">Hard</option>
				</select>
				<svg
					class="pointer-events-none absolute top-1/2 right-3.5 h-3.5 w-3.5 -translate-y-1/2 text-[#CDD7E1]"
					viewBox="0 0 20 20"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						fill-rule="evenodd"
						d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<button
				type="button"
				class="cursor-pointer rounded-full bg-[#32383E] px-4 py-2 text-sm text-[#CDD7E1] transition-colors hover:bg-[#3d444b] disabled:cursor-not-allowed disabled:opacity-50"
				onclick={onReload}
				disabled={!allowReload || isReloading || isLoading}
			>
				{isReloading ? '...' : 'New'}
			</button>
		</div>
	</div>

	<ScoringTabBar {activeTab} onTabChange={handleTabChange} />

	<div class="scoring-panel-scroll flex-1 overflow-y-auto p-2">
		{#if activeTab === 'overview'}
			<OverviewTab {userScoring} />
		{:else if activeTab === 'midfield'}
			<MidfieldTab {userScoring} {actualCounts} {midfieldCounts} {showAnswer} {readOnly} onUpdate={(next) => (userScoring = next)} />
		{:else}
			{#each QUADRANT_TAB_CONFIG as config (config.tabId)}
				{#if activeTab === config.tabId}
					<QuadrantTab
						label={config.label}
						quadrantKey={config.key}
						quadrant={userScoring[config.key]}
						{actualCounts}
						{showAnswer}
						{readOnly}
						onUpdate={(next) => updateQuadrant(config.key, next)}
					/>
				{/if}
			{/each}
		{/if}
	</div>

	<div class="flex-none border-t border-gray-800 p-3">
		<div class="mb-3 text-center">
			<div class="flex justify-center gap-4 text-lg font-bold">
				<span class:text-green-400={showAnswer && isCorrect} class:text-red-400={showAnswer && !isCorrect} class:text-red-300={!showAnswer}>
					Red: {userPoints.red}
				</span>
				<span
					class:text-green-400={showAnswer && isCorrect}
					class:text-red-400={showAnswer && !isCorrect}
					class:text-[#007fff]={!showAnswer}
				>
					Blue: {userPoints.blue}
				</span>
			</div>
			{#if showAnswer}
				<div class="mt-1 text-sm">
					{#if isCorrect}
						<span class="font-semibold text-green-400">Correct!</span>
					{:else}
						<span class="font-semibold text-red-400">Incorrect</span>
						<div class="mt-1 text-xs text-gray-500">
							Actual: Red {actualPoints.red} / Blue {actualPoints.blue}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<div class="flex gap-2">
			<button
				type="button"
				class="flex-1 cursor-pointer rounded-full bg-[#32383E] px-3 py-2 text-sm font-semibold text-[#CDD7E1] transition-colors hover:bg-[#3d444b] disabled:cursor-not-allowed disabled:opacity-50"
				onclick={toggleAnswer}
				disabled={readOnly}
			>
				{showAnswer ? 'Hide' : 'Check'}
			</button>
			<button
				type="button"
				class="flex-1 cursor-pointer rounded-full border border-[#dde7ee] bg-transparent px-3 py-2 text-sm font-semibold text-[#CDD7E1] transition-colors hover:bg-[#141414]"
				onclick={onGoToSimulator}
			>
				Go to simulator
			</button>
		</div>
	</div>
</div>
