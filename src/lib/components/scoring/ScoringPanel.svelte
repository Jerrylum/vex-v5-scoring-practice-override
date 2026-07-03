<script lang="ts">
	import MidfieldTab from './MidfieldTab.svelte';
	import OverviewTab from './OverviewTab.svelte';
	import QuadrantTab from './QuadrantTab.svelte';
	import ScoringTabBar from './ScoringTabBar.svelte';
	import { GENERATOR_VERSION } from '$lib/generatorVersion';
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
		onReload: () => void;
		onCopyLink: () => void;
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
		onReload,
		onCopyLink
	}: Props = $props();

	let activeTab = $state<ScoringTabId>('overview');
	let showAnswer = $state(false);

	const userPoints = $derived(calculateUserAlliancePoints(userScoring));
	const actualPoints = $derived(calculateActualAlliancePoints(actualCounts, midfieldCounts));
	const isCorrect = $derived(isUserScoringCorrect(userScoring, actualCounts, midfieldCounts));

	function handleTabChange(tab: ScoringTabId) {
		activeTab = tab;
	}

	function resetScoring() {
		userScoring = emptyUserScenarioScoring();
		showAnswer = false;
	}

	function toggleAnswer() {
		showAnswer = !showAnswer;
	}

	function updateQuadrant(key: (typeof QUADRANT_TAB_CONFIG)[number]['key'], quadrant: UserScenarioScoring[typeof key]) {
		userScoring = { ...userScoring, [key]: quadrant };
	}
</script>

<div class="flex h-full flex-col bg-[#0a0a0a] text-white">
	<div class="flex-none border-b border-gray-800 p-3">
		<h2 class="text-lg font-bold">Scoring Panel</h2>
		<div class="mt-3 flex gap-2">
			<select
				id="difficulty"
				class="flex-1 cursor-pointer rounded-md border-none bg-[#0076BB] px-3 py-2 text-sm text-white transition-colors hover:bg-[#005a91] disabled:cursor-not-allowed disabled:bg-[#888B95]"
				bind:value={currentDifficulty}
				disabled={isReloading || isLoading}
			>
				<option value="easy">Easy</option>
				<option value="medium">Medium</option>
				<option value="hard">Hard</option>
			</select>
			<button
				type="button"
				class="cursor-pointer rounded-md border-none bg-green-600 px-4 py-2 text-sm text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-[#888B95]"
				onclick={onReload}
				disabled={isReloading || isLoading}
			>
				{isReloading ? '...' : 'New'}
			</button>
		</div>
		<div class="mt-2 space-y-1 text-xs text-gray-400">
			<div class="flex justify-between">
				<span>Seed</span>
				<span class="font-mono text-gray-300">{currentSeed ?? '—'}</span>
			</div>
			<div class="flex justify-between">
				<span>Generator</span>
				<span class="text-gray-300">v{GENERATOR_VERSION}</span>
			</div>
		</div>
		<button
			type="button"
			class="mt-2 w-full cursor-pointer rounded-md border border-gray-700 bg-[#141414] px-3 py-1.5 text-xs text-white hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
			onclick={onCopyLink}
			disabled={currentSeed === null || isLoading || isReloading}
		>
			Copy link
		</button>
		{#if linkMessage}
			<p class="mt-1 text-xs text-gray-400">{linkMessage}</p>
		{/if}
	</div>

	<ScoringTabBar {activeTab} onTabChange={handleTabChange} />

	<div class="flex-1 overflow-y-auto p-2">
		{#if activeTab === 'overview'}
			<OverviewTab {userScoring} />
		{:else if activeTab === 'midfield'}
			<MidfieldTab {userScoring} {actualCounts} {midfieldCounts} {showAnswer} onUpdate={(next) => (userScoring = next)} />
		{:else}
			{#each QUADRANT_TAB_CONFIG as config (config.tabId)}
				{#if activeTab === config.tabId}
					<QuadrantTab
						label={config.label}
						quadrantKey={config.key}
						quadrant={userScoring[config.key]}
						{actualCounts}
						{showAnswer}
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
					class:text-blue-300={!showAnswer}
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
				class="flex-1 cursor-pointer rounded-md bg-[#0076BB] px-3 py-2 text-sm font-semibold transition-colors hover:bg-[#005a91]"
				onclick={toggleAnswer}
			>
				{showAnswer ? 'Hide' : 'Check'}
			</button>
			<button
				type="button"
				class="flex-1 cursor-pointer rounded-md bg-[#888B95] px-3 py-2 text-sm font-semibold transition-colors hover:bg-[#6b6e76]"
				onclick={resetScoring}
			>
				Reset
			</button>
		</div>
	</div>
</div>
