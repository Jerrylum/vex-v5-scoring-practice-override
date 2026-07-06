<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import PauseMenuDialog from '$lib/components/PauseMenuDialog.svelte';
	import ConfirmDialog from '$lib/components/dialog/ConfirmDialog.svelte';
	import RoomShareDialog from '$lib/components/RoomShareDialog.svelte';
	import SettingsDialog from '$lib/components/SettingsDialog.svelte';
	import type { ConfirmRequestOptions } from '$lib/dialog/confirmRequest';
	import GameScreen from '$lib/screens/GameScreen.svelte';
	import LoadingScreen from '$lib/screens/LoadingScreen.svelte';
	import LobbyScreen from '$lib/screens/LobbyScreen.svelte';
	import MenuScreen from '$lib/screens/MenuScreen.svelte';
	import { loadGraphicProfileSetting, resolveGraphicProfile, type GraphicProfileSetting } from '$lib/graphicProfile';
	import { loadScenarioDefaultViewSetting, type ScenarioDefaultViewSetting } from '$lib/scenarioDefaultView';
	import { ModelLoader } from '$lib/ModelLoader';
	import { parseRoomIdFromUrl } from '$lib/multiplayer/identity';
	import { roomSession } from '$lib/multiplayer/roomSession.svelte';
	import { preloadGameAssets } from '$lib/preloadGameAssets';
	import { parseScenarioLink } from '$lib/scenarioLink';

	type AppScreen = 'loading' | 'menu' | 'lobby' | 'game';
	type GameMode = 'singleplayer' | 'multiplayer';
	type AppDialog =
		| 'settings'
		| 'pause'
		| 'share'
		| { type: 'confirm'; content: Pick<ConfirmRequestOptions, 'title' | 'message' | 'confirmLabel'> };

	let screen = $state<AppScreen>('loading');
	let gameMode = $state<GameMode>('singleplayer');
	let lobbyRoomId = $state<string | null>(null);
	let loadingMessage = $state('Loading scene...');
	let openDialog = $state<AppDialog | null>(null);
	let confirmBusy = $state(false);
	let confirmResolver = $state<((accepted: boolean) => void) | null>(null);
	let confirmOnConfirm = $state<(() => void | Promise<void>) | null>(null);
	let graphicProfileSetting = $state<GraphicProfileSetting>('auto');
	let scenarioDefaultViewSetting = $state<ScenarioDefaultViewSetting>(null);
	let modelLoader = $state<ModelLoader | null>(null);
	let initError = $state<string | null>(null);

	function openSettings() {
		dismissConfirm(false);
		openDialog = 'settings';
	}

	function openPauseMenu() {
		dismissConfirm(false);
		openDialog = 'pause';
	}

	function openShareDialog() {
		dismissConfirm(false);
		openDialog = 'share';
	}

	function isConfirmDialog(dialog: AppDialog | null): dialog is Extract<AppDialog, { type: 'confirm' }> {
		return typeof dialog === 'object' && dialog !== null && dialog.type === 'confirm';
	}

	function dismissConfirm(accepted: boolean) {
		confirmResolver?.(accepted);
		confirmResolver = null;
		confirmOnConfirm = null;
		if (isConfirmDialog(openDialog)) {
			openDialog = null;
		}
	}

	function requestConfirm(options: ConfirmRequestOptions): Promise<boolean> {
		dismissConfirm(false);
		return new Promise((resolve) => {
			confirmResolver = resolve;
			confirmOnConfirm = options.onConfirm;
			openDialog = {
				type: 'confirm',
				content: {
					title: options.title,
					message: options.message,
					confirmLabel: options.confirmLabel
				}
			};
		});
	}

	async function handleConfirmDialogConfirm() {
		if (!isConfirmDialog(openDialog)) return;

		const onConfirm = confirmOnConfirm;
		const resolve = confirmResolver;
		confirmOnConfirm = null;
		confirmResolver = null;

		confirmBusy = true;
		try {
			await onConfirm?.();
			openDialog = null;
			resolve?.(true);
		} catch (error) {
			console.error('Confirm action failed:', error);
			openDialog = null;
			resolve?.(false);
		} finally {
			confirmBusy = false;
		}
	}

	function handleConfirmDialogCancel() {
		dismissConfirm(false);
	}

	function closeDialog() {
		if (isConfirmDialog(openDialog)) {
			dismissConfirm(false);
			return;
		}
		openDialog = null;
	}

	function handleProfileChange(setting: GraphicProfileSetting) {
		graphicProfileSetting = setting;
	}

	function handleScenarioDefaultViewChange(setting: ScenarioDefaultViewSetting) {
		scenarioDefaultViewSetting = setting;
	}

	function startSingleplayer() {
		gameMode = 'singleplayer';
		screen = 'game';
	}

	function startMultiplayer() {
		gameMode = 'multiplayer';
		lobbyRoomId = null;
		screen = 'lobby';
	}

	function goToMenu() {
		if (gameMode === 'multiplayer') {
			roomSession.disconnect();
		}
		gameMode = 'singleplayer';
		lobbyRoomId = null;
		closeDialog();
		screen = 'menu';
	}

	function handleBackToMenu() {
		closeDialog();
		goToMenu();
	}

	function startMultiplayerGame() {
		gameMode = 'multiplayer';
		screen = 'game';
	}

	$effect(() => {
		if (!browser) return;

		const inGame = screen === 'game';
		const activeDialog = openDialog;

		function handleEscape(event: KeyboardEvent) {
			if (event.key !== 'Escape') return;

			if (activeDialog) {
				event.preventDefault();
				closeDialog();
				return;
			}
			if (inGame) {
				event.preventDefault();
				openPauseMenu();
			}
		}

		document.addEventListener('keydown', handleEscape, true);
		return () => document.removeEventListener('keydown', handleEscape, true);
	});

	onMount(() => {
		const init = async () => {
			try {
				graphicProfileSetting = loadGraphicProfileSetting();
				scenarioDefaultViewSetting = loadScenarioDefaultViewSetting();
				const profile = resolveGraphicProfile(graphicProfileSetting);
				const loader = new ModelLoader(profile);
				await preloadGameAssets(loader, (message) => {
					loadingMessage = message;
				});
				modelLoader = loader;

				const searchParams = new URLSearchParams(window.location.search);
				const linkOutcome = parseScenarioLink(searchParams);
				const roomId = parseRoomIdFromUrl(searchParams);

				if (linkOutcome.ok) {
					gameMode = 'singleplayer';
					screen = 'game';
				} else if (roomId) {
					gameMode = 'multiplayer';
					lobbyRoomId = roomId;
					screen = 'lobby';
				} else {
					screen = 'menu';
				}
			} catch (error) {
				console.error('Failed to initialize scene:', error);
				initError = 'Failed to load scene';
				loadingMessage = initError;
			}
		};

		init();
	});
</script>

<svelte:head>
	<title>VEX V5 Scoring Practice — Override</title>
</svelte:head>

<div class="relative h-screen w-screen overflow-hidden bg-black">
	{#if screen === 'loading'}
		<LoadingScreen message={loadingMessage} />
	{:else if screen === 'menu'}
		<MenuScreen onSingleplayer={startSingleplayer} onMultiplayer={startMultiplayer} onSettings={openSettings} />
	{:else if screen === 'lobby'}
		<LobbyScreen roomId={lobbyRoomId} onStartGame={startMultiplayerGame} onLeave={goToMenu} />
	{:else if screen === 'game' && modelLoader}
		<GameScreen
			{modelLoader}
			mode={gameMode}
			onOpenSettings={openSettings}
			onOpenPauseMenu={openPauseMenu}
			onOpenShareDialog={openShareDialog}
			{requestConfirm}
		/>
	{/if}
</div>

<PauseMenuDialog
	open={openDialog === 'pause'}
	mode={gameMode}
	onClose={closeDialog}
	onOpenSettings={openSettings}
	onOpenShareDialog={gameMode === 'multiplayer' ? openShareDialog : undefined}
	onBackToMenu={handleBackToMenu}
/>

<RoomShareDialog open={openDialog === 'share'} onClose={closeDialog} />

<SettingsDialog
	open={openDialog === 'settings'}
	profileSetting={graphicProfileSetting}
	scenarioDefaultViewSetting={scenarioDefaultViewSetting}
	onClose={closeDialog}
	onChange={handleProfileChange}
	onScenarioDefaultViewChange={handleScenarioDefaultViewChange}
/>

{#if isConfirmDialog(openDialog)}
	<ConfirmDialog
		open={true}
		title={openDialog.content.title}
		message={openDialog.content.message}
		confirmLabel={openDialog.content.confirmLabel}
		tone="primary"
		busy={confirmBusy}
		onConfirm={handleConfirmDialogConfirm}
		onCancel={handleConfirmDialogCancel}
	/>
{/if}
