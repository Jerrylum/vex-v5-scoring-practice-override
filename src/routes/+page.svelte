<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ScoringPanel from '$lib/components/scoring/ScoringPanel.svelte';
	import { Scene } from '$lib/Scene';
	import { GENERATOR_VERSION } from '$lib/generatorVersion';
	import { emptyScenarioScoring, type ScenarioScoring } from '$lib/Scoring';
	import type { Scenario } from '$lib/Scenario';
	import { generateScenario, GeneratorVersionMismatchError, type GenerateScenarioOptions, type Level } from '$lib/ScenarioGenerator';
	import {
		buildScenarioShareUrl,
		parseScenarioLink,
		scenarioLinkParamsFromProvenance,
		type ScenarioLinkParseOutcome
	} from '$lib/scenarioLink';
	import { emptyUserScenarioScoring, type UserScenarioScoring } from '$lib/userScoring';
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
	let userScoring = $state<UserScenarioScoring>(emptyUserScenarioScoring());

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
		userScoring = emptyUserScenarioScoring();

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
				class="absolute right-4 bottom-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#007fff] text-white shadow-lg hover:bg-[#0066cc] md:hidden"
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
		class="relative flex h-full flex-col bg-[#0a0a0a] text-white shadow-2xl transition-all duration-300 max-md:absolute max-md:top-0 max-md:right-0 max-md:z-40"
		class:w-[440px]={!isPanelCollapsed}
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
			{#key currentSeed}
				<ScoringPanel
					bind:userScoring
					bind:currentDifficulty
					{actualCounts}
					{midfieldCounts}
					{currentSeed}
					{linkMessage}
					{isLoading}
					{isReloading}
					onReload={reloadScenario}
					onCopyLink={copyShareLink}
					onGoToSimulator={togglePanel}
				/>
			{/key}
		{/if}
	</div>
</div>
