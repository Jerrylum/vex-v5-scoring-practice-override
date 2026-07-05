<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ChevronLeftIcon from '$lib/components/icons/ChevronLeftIcon.svelte';
	import ChevronRightIcon from '$lib/components/icons/ChevronRightIcon.svelte';
	import ScoringPanel from '$lib/components/scoring/ScoringPanel.svelte';
	import type { ModelLoader } from '$lib/ModelLoader';
	import { roomSession } from '$lib/multiplayer/roomSession.svelte';
	import { Scene } from '$lib/Scene';
	import { GENERATOR_VERSION } from '$lib/generatorVersion';
	import { emptyScenarioScoring, type ScenarioScoring } from '$lib/Scoring';
	import type { Scenario } from '$lib/Scenario';
	import {
		generateScenario,
		GeneratorVersionMismatchError,
		scenarioFromSnapshot,
		scenarioToSnapshot,
		type GenerateScenarioOptions,
		type Level
	} from '$lib/ScenarioGenerator';
	import {
		buildScenarioShareUrl,
		parseScenarioLink,
		scenarioLinkParamsFromProvenance,
		type ScenarioLinkParseOutcome
	} from '$lib/scenarioLink';
	import { emptyUserScenarioScoring, type UserScenarioScoring } from '$lib/userScoring';
	import type { ScenarioSnapshot } from '@vex-v5-override/protocol';
	import { randomMasterSeed } from '$lib/utils';

	interface Props {
		modelLoader: ModelLoader;
		mode?: 'singleplayer' | 'multiplayer';
		onOpenSettings: () => void;
		onOpenPauseMenu: () => void;
		onOpenShareDialog: () => void;
	}

	let {
		modelLoader,
		mode = 'singleplayer',
		onOpenSettings,
		onOpenPauseMenu,
		onOpenShareDialog
	}: Props = $props();

	const isMultiplayer = $derived(mode === 'multiplayer');

	let scene = $state<Scene | null>(null);
	let sceneContainer = $state<HTMLElement | null>(null);
	let gameRoot = $state<HTMLElement | null>(null);

	let currentDifficulty = $state<Level>('medium');
	let currentSeed = $state<number | null>(null);
	let scenarioRevision = $state(0);
	let linkMessage = $state<string | null>(null);
	let isLoading = $state(true);
	let isReloading = $state(false);
	let isPanelCollapsed = $state(false);

	let actualCounts = $state<ScenarioScoring>(emptyScenarioScoring());
	let midfieldCounts = $state({ red: 0, blue: 0 });
	let userScoring = $state<UserScenarioScoring>(emptyUserScenarioScoring());
	let showAnswer = $state(false);
	let applyingRemoteState = false;

	function togglePanel() {
		isPanelCollapsed = !isPanelCollapsed;
	}

	function focusGameRoot() {
		gameRoot?.focus({ preventScroll: true });
	}

	$effect(() => {
		const container = sceneContainer;
		const activeScene = scene;
		if (!container || !activeScene) return;

		const observer = new ResizeObserver(() => {
			activeScene.resize();
		});
		observer.observe(container);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (!isMultiplayer || !roomSession.roomState || applyingRemoteState) return;

		const remoteScoring = roomSession.roomState.scoring;
		if (JSON.stringify(remoteScoring) !== JSON.stringify(userScoring)) {
			applyingRemoteState = true;
			userScoring = $state.snapshot(remoteScoring) as UserScenarioScoring;
			queueMicrotask(() => {
				applyingRemoteState = false;
			});
		}

		showAnswer = roomSession.roomState.showAnswer ?? false;
	});

	$effect(() => {
		if (
			!isMultiplayer ||
			applyingRemoteState ||
			roomSession.syncingFromServer ||
			!roomSession.roomState ||
			roomSession.connectionState !== 'connected'
		)
			return;
		if (JSON.stringify(userScoring) === JSON.stringify(roomSession.roomState.scoring)) return;
		void roomSession.updateScoring(userScoring);
	});

	$effect(() => {
		if (!isMultiplayer || !roomSession.roomState || !scene) return;

		const remoteRevision = roomSession.roomState.revision;
		if (remoteRevision === scenarioRevision) return;

		scenarioRevision = remoteRevision;
		void reloadFromRoomState(scene, roomSession.roomState);
	});

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

	async function applyScenario(activeScene: Scene, scenario: Scenario, options?: { resetScoring?: boolean; updateUrl?: boolean }) {
		for (const structure of scenario.structures) {
			await structure.visualize(activeScene);
		}

		actualCounts = scenario.calculateScoring();
		midfieldCounts = scenario.robots.getMidfieldCounts();
		currentSeed = scenario.provenance?.masterSeed ?? null;

		if (options?.resetScoring !== false && !isMultiplayer) {
			userScoring = emptyUserScenarioScoring();
		}

		if (!isMultiplayer && options?.updateUrl !== false && scenario.provenance) {
			updateShareUrl(scenario, currentDifficulty);
		}
	}

	async function applySnapshot(activeScene: Scene, difficulty: Level, snapshot: ScenarioSnapshot) {
		activeScene.clearScoringObjects();
		currentDifficulty = difficulty;
		const scenario = scenarioFromSnapshot($state.snapshot(snapshot) as ScenarioSnapshot);
		await applyScenario(activeScene, scenario, { resetScoring: false, updateUrl: false });
	}

	async function reloadFromRoomState(activeScene: Scene, state: NonNullable<typeof roomSession.roomState>) {
		isReloading = true;
		try {
			await applySnapshot(activeScene, state.scenario.difficulty, state.scenario);
			applyingRemoteState = true;
			userScoring = $state.snapshot(state.scoring) as UserScenarioScoring;
			showAnswer = state.showAnswer ?? false;
			queueMicrotask(() => {
				applyingRemoteState = false;
			});
		} catch (error) {
			console.error('Failed to apply room scenario:', error);
		} finally {
			isReloading = false;
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

	async function generateNewScenario(activeScene: Scene, linkOutcome: ScenarioLinkParseOutcome) {
		const options = resolveGenerateOptions(linkOutcome);

		try {
			const scenario = generateScenario(options);
			await applyScenario(activeScene, scenario);
		} catch (error) {
			if (error instanceof GeneratorVersionMismatchError) {
				linkMessage = `This link uses an older scenario format (v${GENERATOR_VERSION} required). Starting a new scenario.`;
				const scenario = generateScenario({ difficulty: currentDifficulty, masterSeed: randomMasterSeed() });
				await applyScenario(activeScene, scenario);
				return;
			}
			throw error;
		}
	}

	async function reloadScenario() {
		if (isReloading || !scene) return;

		isReloading = true;
		linkMessage = null;

		try {
			if (isMultiplayer) {
				if (!roomSession.isHost) return;
				const scenario = scenarioToSnapshot(
					generateScenario({ difficulty: currentDifficulty, masterSeed: randomMasterSeed() }),
					currentDifficulty
				);
				await roomSession.regenerateScenario(scenario);
				return;
			}

			scene.clearScoringObjects();
			await generateNewScenario(scene, { ok: false, error: 'missing_token' });
		} catch (error) {
			console.error('Failed to reload scenario:', error);
		} finally {
			isReloading = false;
		}
	}

	async function handleShareLink() {
		if (isMultiplayer) {
			onOpenShareDialog();
			return;
		}

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

	async function handleShowAnswerChange(next: boolean) {
		showAnswer = next;
		if (isMultiplayer && roomSession.isHost) {
			await roomSession.setShowAnswer(next);
		}
	}

	onMount(() => {
		const init = async () => {
			if (!sceneContainer) return;

			try {
				const activeScene = new Scene(sceneContainer, modelLoader);
				await activeScene.initialize();
				scene = activeScene;
				activeScene.resize();

				if (isMultiplayer && roomSession.roomState) {
					scenarioRevision = roomSession.roomState.revision;
					await reloadFromRoomState(activeScene, roomSession.roomState);
				} else {
					const linkOutcome = parseScenarioLink(new URLSearchParams(window.location.search));
					await generateNewScenario(activeScene, linkOutcome);
				}

				isLoading = false;
			} catch (error) {
				console.error('Failed to load scenario:', error);
				isLoading = false;
			}
		};
		init();
		focusGameRoot();
	});
</script>

<div
	bind:this={gameRoot}
	tabindex="-1"
	class="pointer-events-none relative z-10 flex h-screen w-screen outline-none"
>
	<div class="relative h-full min-w-0 flex-1 overflow-hidden">
		<div bind:this={sceneContainer} class="pointer-events-auto absolute inset-0" onpointerdown={focusGameRoot}></div>

		{#if isPanelCollapsed}
			<button
				class="pointer-events-auto absolute right-4 bottom-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#007fff] text-white shadow-lg hover:bg-[#0066cc]"
				onclick={togglePanel}
				aria-label="Expand scoring panel"
				title="Expand scoring panel"
			>
				<ChevronLeftIcon size={20} />
			</button>
		{:else}
			<button
				class="pointer-events-auto absolute right-4 bottom-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#374151] text-white shadow-lg hover:bg-[#4b5563] max-md:hidden"
				onclick={togglePanel}
				aria-label="Collapse scoring panel"
				title="Collapse scoring panel"
			>
				<ChevronRightIcon size={20} />
			</button>
		{/if}
	</div>

	<div
		class="pointer-events-auto relative flex h-full w-[440px] flex-col overflow-hidden bg-[#0a0a0a] text-white shadow-2xl max-md:absolute max-md:inset-0 max-md:z-40 max-md:w-full"
		class:hidden={isPanelCollapsed}
		aria-hidden={isPanelCollapsed}
	>
		<div class="flex h-full w-full flex-col">
			{#key isMultiplayer ? scenarioRevision : currentSeed}
				<ScoringPanel
					bind:userScoring
					bind:currentDifficulty
					bind:showAnswer
					{actualCounts}
					{midfieldCounts}
					currentSeed={isMultiplayer ? scenarioRevision : currentSeed}
					{linkMessage}
					{isLoading}
					{isReloading}
					allowReload={!isMultiplayer || roomSession.isHost}
					allowDifficultyChange={!isMultiplayer || roomSession.isHost}
					copyLinkDisabled={isMultiplayer ? !roomSession.roomId : currentSeed === null}
					shareRoomMode={isMultiplayer}
					onShowAnswerChange={handleShowAnswerChange}
					onReload={reloadScenario}
					onCopyLink={handleShareLink}
					onGoToSimulator={togglePanel}
					{onOpenSettings}
					{onOpenPauseMenu}
				/>
			{/key}
		</div>
	</div>
</div>
