<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ChevronLeftIcon from '$lib/components/icons/ChevronLeftIcon.svelte';
	import ChevronRightIcon from '$lib/components/icons/ChevronRightIcon.svelte';
	import ConnectionLabel from '$lib/components/multiplayer/ConnectionLabel.svelte';
	import ScoringPanel from '$lib/components/scoring/ScoringPanel.svelte';
	import type { ConfirmRequestOptions } from '$lib/dialog/confirmRequest';
	import type { ModelLoader } from '$lib/ModelLoader';
	import { roomSession } from '$lib/multiplayer/roomSession.svelte';
	import {
		defaultTabForPreset,
		getRefereeViewPreset,
		KEYBOARD_VIEW_SHORTCUTS,
		setRefereeViewPreset,
		shouldCollapsePanelForPreset,
		type RefereeViewPreset
	} from '$lib/refereeView';
	import { loadScenarioDefaultViewSetting } from '$lib/scenarioDefaultView';
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
	import type { ScoringTabId } from '$lib/userScoring';
	import type { ScenarioSnapshot, ScoringPatch } from '@vex-v5-override/protocol';
	import { randomMasterSeed } from '$lib/utils';

	interface Props {
		modelLoader: ModelLoader;
		mode?: 'singleplayer' | 'multiplayer';
		onOpenSettings: () => void;
		onOpenPauseMenu: () => void;
		onOpenShareDialog: () => void;
		requestConfirm: (options: ConfirmRequestOptions) => Promise<boolean>;
	}

	let { modelLoader, mode = 'singleplayer', onOpenSettings, onOpenPauseMenu, onOpenShareDialog, requestConfirm }: Props = $props();

	const isMultiplayer = $derived(mode === 'multiplayer');

	let scene = $state<Scene | null>(null);
	let sceneContainer = $state<HTMLElement | null>(null);
	let gameRoot = $state<HTMLElement | null>(null);

	let currentDifficulty = $state<Level>('medium');
	let currentSeed = $state<number | null>(null);
	let scenarioRevision = $state(0);
	let scenarioSyncKey = $state('');
	let linkMessage = $state<string | null>(null);
	let isLoading = $state(true);
	let isReloading = $state(false);
	let isPanelCollapsed = $state(false);

	let actualCounts = $state<ScenarioScoring>(emptyScenarioScoring());
	let midfieldCounts = $state({ red: 0, blue: 0 });
	let userScoring = $state<UserScenarioScoring>(emptyUserScenarioScoring());
	let showAnswer = $state(false);
	let applyingRemoteState = false;
	let lastAppliedScoringRevision = $state(-1);
	let scoringTab = $state<ScoringTabId>(defaultTabForPreset(getRefereeViewPreset()));
	let viewPreset = $state<RefereeViewPreset>(getRefereeViewPreset());
	let showViewControls = $state(false);

	const isScoringConnected = $derived(!isMultiplayer || roomSession.connectionState === 'connected');

	const DIFFICULTY_LABELS: Record<Level, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

	function applyViewPreset(preset: RefereeViewPreset) {
		viewPreset = preset;
		setRefereeViewPreset(preset);
		scoringTab = defaultTabForPreset(preset);
		isPanelCollapsed = shouldCollapsePanelForPreset(preset);
		scene?.applyViewPreset(preset);
	}

	function maybeApplyScenarioDefaultView() {
		const defaultView = loadScenarioDefaultViewSetting();
		if (defaultView !== null) {
			applyViewPreset(defaultView);
		}
	}

	function isEditableKeyTarget(target: EventTarget | null): boolean {
		return target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
	}

	function handleViewKeyboard(event: KeyboardEvent) {
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		if (isEditableKeyTarget(event.target)) return;

		if (event.key === '[') {
			showViewControls = !showViewControls;
			return;
		}

		const shortcut = KEYBOARD_VIEW_SHORTCUTS.find((entry) => entry.key === event.key);
		if (shortcut) {
			applyViewPreset(shortcut.preset);
		}
	}

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

	// Inbound: drive userScoring from room revision, not from diff vs local state (that reverted edits).
	$effect(() => {
		if (!isMultiplayer || !roomSession.roomState) return;

		const revision = roomSession.lastAppliedRevision;
		if (revision === lastAppliedScoringRevision) return;

		const state = roomSession.roomState;
		lastAppliedScoringRevision = revision;
		applyingRemoteState = true;
		userScoring = $state.snapshot(state.scoring) as UserScenarioScoring;
		showAnswer = state.showAnswer ?? false;
		queueMicrotask(() => {
			applyingRemoteState = false;
		});
	});

	function handleScoringPatch(patch: ScoringPatch) {
		if (!isMultiplayer || applyingRemoteState) return;
		roomSession.scheduleScoringPatch(patch);
	}

	function scenarioKeyFromState(state: NonNullable<typeof roomSession.roomState>): string {
		return JSON.stringify(state.scenario);
	}

	// Reload 3D scene only when scenario payload changes — not on every room revision (scoring-only updates).
	$effect(() => {
		if (!isMultiplayer || !roomSession.roomState || !scene) return;

		const key = scenarioKeyFromState(roomSession.roomState);
		if (key === scenarioSyncKey) return;

		scenarioSyncKey = key;
		scenarioRevision = roomSession.roomState.revision;
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

		maybeApplyScenarioDefaultView();
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
			lastAppliedScoringRevision = state.revision;
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

	async function regenerateMultiplayerScenario(difficulty: Level) {
		if (!scene || !isScoringConnected) return;

		const scenario = scenarioToSnapshot(generateScenario({ difficulty, masterSeed: randomMasterSeed() }), difficulty);
		await roomSession.regenerateScenario(scenario);
	}

	function handleMultiplayerDifficultyChange(next: Level): Promise<boolean> {
		return requestConfirm({
			title: 'Change difficulty',
			message: `Change difficulty to ${DIFFICULTY_LABELS[next]} and generate a new scenario for everyone in this room? Scoring will reset.`,
			confirmLabel: 'Continue',
			onConfirm: async () => {
				currentDifficulty = next;
				await executeMultiplayerReload(next);
			}
		});
	}

	async function executeMultiplayerReload(difficulty: Level) {
		isReloading = true;
		linkMessage = null;
		try {
			await regenerateMultiplayerScenario(difficulty);
		} catch (error) {
			console.error('Failed to regenerate scenario:', error);
			throw error;
		} finally {
			isReloading = false;
		}
	}

	async function reloadScenario() {
		if (isReloading || !scene) return;

		if (isMultiplayer) {
			await requestConfirm({
				title: 'New scenario',
				message: 'Generate a new scenario for everyone in this room? Scoring will reset.',
				confirmLabel: 'Generate',
				onConfirm: () => executeMultiplayerReload(currentDifficulty)
			});
			return;
		}

		isReloading = true;
		linkMessage = null;

		try {
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
		if (applyingRemoteState) return;
		showAnswer = next;
		if (isMultiplayer && isScoringConnected) {
			try {
				await roomSession.setShowAnswer(next);
			} catch {
				// roomSession sets error
			}
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
				applyViewPreset(viewPreset);

				if (isMultiplayer && roomSession.roomState) {
					scenarioSyncKey = scenarioKeyFromState(roomSession.roomState);
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

		document.addEventListener('keydown', handleViewKeyboard);
		return () => document.removeEventListener('keydown', handleViewKeyboard);
	});
</script>

<div bind:this={gameRoot} tabindex="-1" class="pointer-events-none relative z-10 flex h-screen w-screen outline-none">
	<div class="relative h-full min-w-0 flex-1 overflow-hidden">
		<div bind:this={sceneContainer} class="pointer-events-auto absolute inset-0" onpointerdown={focusGameRoot}></div>

		{#if isMultiplayer}
			<ConnectionLabel />
		{/if}

		{#if isMultiplayer && roomSession.error}
			<div class="pointer-events-auto absolute top-3 right-3 z-40 max-w-xs rounded-lg bg-red-950 px-3 py-2 text-xs text-red-200">
				{roomSession.error}
				<button type="button" class="ml-2 underline" onclick={() => roomSession.clearError()}>Dismiss</button>
			</div>
		{/if}

		{#if showViewControls}
			<div
				class="pointer-events-none absolute bottom-4 left-4 z-40 rounded-lg border border-gray-800/80 bg-black/70 px-5 py-3 font-mono text-xs text-gray-300 backdrop-blur-sm"
				aria-hidden="true"
			>
				{#each KEYBOARD_VIEW_SHORTCUTS as shortcut (shortcut.key)}
					<div class="flex flex-row gap-4">
						<div class="font-mono font-bold">{shortcut.key}</div>
						<div>{shortcut.label}</div>
					</div>
				{/each}
				<div class="flex flex-row gap-4">
					<div class="font-mono font-bold">[</div>
					<div>hide controls</div>
				</div>
			</div>
		{/if}

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
			{#key isMultiplayer ? scenarioSyncKey : currentSeed}
				<ScoringPanel
					bind:userScoring
					bind:currentDifficulty
					bind:showAnswer
					bind:activeTab={scoringTab}
					{actualCounts}
					{midfieldCounts}
					currentSeed={isMultiplayer ? scenarioRevision : currentSeed}
					linkMessage={roomSession.error ? null : linkMessage}
					{isLoading}
					{isReloading}
					allowReload={isScoringConnected}
					allowDifficultyChange={isScoringConnected}
					readOnly={!isScoringConnected}
					onDifficultyChange={isMultiplayer ? handleMultiplayerDifficultyChange : undefined}
					copyLinkDisabled={isMultiplayer ? !roomSession.roomId : currentSeed === null}
					shareRoomMode={isMultiplayer}
					onShowAnswerChange={handleShowAnswerChange}
					onReload={reloadScenario}
					onCopyLink={handleShareLink}
					onGoToSimulator={togglePanel}
					{onOpenSettings}
					{onOpenPauseMenu}
					onScoringPatch={isMultiplayer ? handleScoringPatch : undefined}
				/>
			{/key}
		</div>
	</div>
</div>
