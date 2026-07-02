<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Scene } from '$lib/Scene';
	import { GENERATOR_VERSION } from '$lib/generatorVersion';
	import { emptyScenarioScoring, type QuadrantGoalPairScoring, type ScenarioScoring } from '$lib/Scoring';
	import type { Scenario } from '$lib/Scenario';
	import { generateScenario, GeneratorVersionMismatchError, type GenerateScenarioOptions, type Level } from '$lib/ScenarioGenerator';
	import {
		buildScenarioShareUrl,
		parseScenarioLink,
		scenarioLinkParamsFromProvenance,
		type ScenarioLinkParseOutcome
	} from '$lib/scenarioLink';
	import { randomMasterSeed } from '$lib/utils';

	let currentScene: Scene | null = null;
	let currentDifficulty = $state<Level>('medium');
	let currentSeed = $state<number | null>(null);
	let linkMessage = $state<string | null>(null);
	let isLoading = $state(true);
	let isReloading = $state(false);
	let loadingMessage = $state('Loading scene...');
	let isPanelCollapsed = $state(false);

	let actualCounts = $state<ScenarioScoring>(emptyScenarioScoring());
	let midfieldCounts = $state({ red: 0, blue: 0 });

	const quadrantPanels = [
		{ key: 'redQuadrantOne', label: 'Red Quadrant One' },
		{ key: 'redQuadrantTwo', label: 'Red Quadrant Two' },
		{ key: 'blueQuadrantOne', label: 'Blue Quadrant One' },
		{ key: 'blueQuadrantTwo', label: 'Blue Quadrant Two' }
	] as const;

	function getQuadrantScoring(key: (typeof quadrantPanels)[number]['key']): QuadrantGoalPairScoring | undefined {
		return actualCounts[key];
	}

	function togglePanel() {
		isPanelCollapsed = !isPanelCollapsed;
		setTimeout(() => {
			if (currentScene) {
				currentScene.resize();
			}
		}, 350);
	}

	function resolveGenerateOptions(linkOutcome: ScenarioLinkParseOutcome): GenerateScenarioOptions {
		if (linkOutcome.ok) {
			currentDifficulty = linkOutcome.params.difficulty;
			return {
				difficulty: linkOutcome.params.difficulty,
				masterSeed: linkOutcome.params.masterSeed,
				generatorVersion: linkOutcome.params.generatorVersion
			};
		}

		if (linkOutcome.error === 'version_mismatch') {
			linkMessage = `This link uses an older scenario format (v${GENERATOR_VERSION} required). Starting a new scenario.`;
		}

		return {
			difficulty: currentDifficulty,
			masterSeed: randomMasterSeed()
		};
	}

	async function applyScenario(scenario: Scenario, scene: Scene) {
		for (const structure of scenario.structures) {
			await structure.visualize(scene);
		}

		actualCounts = scenario.calculateScoring();
		midfieldCounts = scenario.robots.getMidfieldCounts();
		currentSeed = scenario.provenance?.masterSeed ?? null;

		if (scenario.provenance) {
			updateShareUrl(scenario, currentDifficulty);
		}
	}

	function updateShareUrl(scenario: Scenario, difficulty: Level) {
		if (!scenario.provenance) return;

		const shareUrl = buildScenarioShareUrl(
			window.location.origin + window.location.pathname,
			scenarioLinkParamsFromProvenance(scenario.provenance, difficulty)
		);
		const path = shareUrl.slice(window.location.origin.length);
		goto(path, { replaceState: true, keepFocus: true, noScroll: true });
	}

	async function generateNewScenario(scene: Scene, linkOutcome: ScenarioLinkParseOutcome) {
		const options = resolveGenerateOptions(linkOutcome);

		try {
			const scenario = generateScenario(options);
			await applyScenario(scenario, scene);
		} catch (error) {
			if (error instanceof GeneratorVersionMismatchError) {
				linkMessage = `This link uses an older scenario format (v${GENERATOR_VERSION} required). Starting a new scenario.`;
				const scenario = generateScenario({ difficulty: currentDifficulty, masterSeed: randomMasterSeed() });
				await applyScenario(scenario, scene);
				return;
			}
			throw error;
		}
	}

	async function reloadScenario() {
		if (!currentScene || isReloading) return;

		isReloading = true;
		linkMessage = null;

		try {
			currentScene.clearScoringObjects();
			await generateNewScenario(currentScene, { ok: false, error: 'missing_token' });
		} catch (error) {
			console.error('Failed to reload scenario:', error);
		} finally {
			isReloading = false;
		}
	}

	async function copyShareLink() {
		if (currentSeed === null) return;

		const shareUrl = buildScenarioShareUrl(window.location.origin + window.location.pathname, {
			generatorVersion: GENERATOR_VERSION,
			masterSeed: currentSeed,
			difficulty: currentDifficulty
		});

		try {
			await navigator.clipboard.writeText(shareUrl);
			linkMessage = 'Link copied to clipboard.';
		} catch (error) {
			console.error('Failed to copy share link:', error);
			linkMessage = 'Could not copy link.';
		}
	}

	onMount(() => {
		const init = async () => {
			try {
				currentScene = new Scene('container');
				await currentScene.initialize();

				const linkOutcome = parseScenarioLink(new URLSearchParams(window.location.search));
				await generateNewScenario(currentScene, linkOutcome);

				isLoading = false;
			} catch (error) {
				console.error('Failed to initialize scene:', error);
				loadingMessage = 'Failed to load scene';
			}
		};
		init();
	});
</script>

<svelte:head>
	<title>VEX V5 Scoring Practice — Override</title>
</svelte:head>

<div class="flex h-screen w-screen bg-black">
	<div class="relative h-full flex-1 overflow-hidden">
		<div id="container" class="absolute top-0 left-0 h-full w-full"></div>

		{#if isLoading}
			<div
				class="absolute top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 p-4 text-center text-lg text-white"
				class:text-red-500={loadingMessage.includes('Failed')}
			>
				<div id="loading" class="mx-auto w-full max-w-md rounded-lg bg-black/50 p-4">
					{loadingMessage}
				</div>
			</div>
		{/if}

		{#if isPanelCollapsed}
			<button
				class="absolute right-4 bottom-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#0076BB] text-white shadow-lg hover:bg-[#005a91] md:hidden"
				onclick={togglePanel}
				aria-label="Open scoring panel"
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
				</svg>
			</button>
		{/if}
	</div>

	<div
		class="relative flex h-full flex-col bg-[#1f2937] text-white shadow-2xl transition-all duration-300 max-md:absolute max-md:top-0 max-md:right-0 max-md:z-40"
		class:w-[400px]={!isPanelCollapsed}
		class:w-12={isPanelCollapsed}
		class:max-md:w-full={!isPanelCollapsed}
		class:max-md:hidden={isPanelCollapsed}
	>
		<button
			class="absolute top-4 -left-14 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-md bg-[#374151] text-xl text-white shadow-lg hover:bg-[#4b5563] max-md:hidden"
			onclick={togglePanel}
			aria-label={isPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
		>
			{isPanelCollapsed ? '◀' : '▶'}
		</button>

		{#if !isPanelCollapsed}
			<div class="flex-none border-b border-[#374151] bg-[#111827] p-3">
				<h2 class="text-lg font-bold">Scoring Panel</h2>
			</div>

			<div class="flex-1 overflow-y-auto p-3">
				<div class="mb-4 space-y-2">
					<label class="block text-sm font-medium text-gray-300" for="difficulty">Difficulty</label>
					<select
						id="difficulty"
						class="w-full rounded-md border border-[#374151] bg-[#111827] px-3 py-2 text-white"
						bind:value={currentDifficulty}
					>
						<option value="easy">Easy</option>
						<option value="medium">Medium</option>
						<option value="hard">Hard</option>
					</select>
				</div>

				<button
					class="mb-4 w-full rounded-md bg-[#0076BB] px-4 py-2 font-semibold text-white hover:bg-[#005a91] disabled:opacity-50"
					onclick={reloadScenario}
					disabled={isReloading || isLoading}
				>
					{isReloading ? 'Generating…' : 'New Scenario'}
				</button>

				<div class="mb-4 rounded-md border border-[#374151] bg-[#111827] p-3">
					<h3 class="mb-2 text-sm font-semibold text-gray-300">Scenario</h3>
					<div class="space-y-1 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-400">Seed</span>
							<span class="font-mono">{currentSeed ?? '—'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-400">Generator</span>
							<span>v{GENERATOR_VERSION}</span>
						</div>
					</div>
					<button
						class="mt-3 w-full rounded-md border border-[#374151] bg-[#111827] px-3 py-2 text-sm text-white hover:bg-[#1f2937] disabled:opacity-50"
						onclick={copyShareLink}
						disabled={currentSeed === null || isLoading || isReloading}
					>
						Copy link
					</button>
					{#if linkMessage}
						<p class="mt-2 text-xs text-gray-400">{linkMessage}</p>
					{/if}
				</div>

				<div class="mb-4 rounded-md border border-[#374151] bg-[#111827] p-3">
					<h3 class="mb-2 text-sm font-semibold text-gray-300">Robots in Midfield</h3>
					<div class="flex justify-between text-sm">
						<span class="text-red-400">Red: {midfieldCounts.red}</span>
						<span class="text-blue-400">Blue: {midfieldCounts.blue}</span>
					</div>
				</div>

				<div class="mb-4 rounded-md border border-[#374151] bg-[#111827] p-3">
					<h3 class="mb-2 text-sm font-semibold text-gray-300">Midfield Goal (Actual)</h3>
					<div class="space-y-1 text-sm">
						<div class="flex justify-between">
							<span class="text-red-400">Red Pins</span>
							<span>{actualCounts.midfieldGoal.visible.red}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-blue-400">Blue Pins</span>
							<span>{actualCounts.midfieldGoal.visible.blue}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-yellow-400">Yellow Pins (visible)</span>
							<span>{actualCounts.midfieldGoal.visible.yellow}</span>
						</div>
						<div class="flex justify-between border-t border-[#374151] pt-1">
							<span class="text-gray-400">Yellow Owner</span>
							<span>{actualCounts.midfieldGoal.yellowOwner ?? 'none'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-yellow-400">Yellow Pins (scored)</span>
							<span>{actualCounts.midfieldGoal.scored.yellow}</span>
						</div>
					</div>
				</div>

				{#each quadrantPanels as panel (panel.key)}
					{@const quadrant = getQuadrantScoring(panel.key)}
					{#if quadrant}
						<div class="mb-4 rounded-md border border-[#374151] bg-[#111827] p-3">
							<h3 class="mb-2 text-sm font-semibold text-gray-300">{panel.label} (Actual)</h3>
							<div class="mb-2 text-xs text-gray-400">Toggle: {quadrant.toggleColor}</div>
							<div class="space-y-2 text-sm">
								<div>
									<div class="text-red-300">Alliance Goal</div>
									<div class="flex justify-between">
										<span class="text-red-400">Red</span>
										<span>{quadrant.allianceGoal.visible.red}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-blue-400">Blue</span>
										<span>{quadrant.allianceGoal.visible.blue}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-yellow-400">Yellow (visible)</span>
										<span>{quadrant.allianceGoal.visible.yellow}</span>
									</div>
								</div>
								<div class="border-t border-[#374151] pt-2">
									<div class="text-gray-300">Neutral Goal</div>
									<div class="flex justify-between">
										<span class="text-red-400">Red</span>
										<span>{quadrant.neutralGoal.visible.red}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-blue-400">Blue</span>
										<span>{quadrant.neutralGoal.visible.blue}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-yellow-400">Yellow (visible)</span>
										<span>{quadrant.neutralGoal.visible.yellow}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-yellow-400">Yellow (scored)</span>
										<span>{quadrant.neutralGoal.scored.yellow}</span>
									</div>
								</div>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</div>
