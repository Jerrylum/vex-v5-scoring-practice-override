<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import PauseMenuDialog from '$lib/components/PauseMenuDialog.svelte';
	import RoomShareDialog from '$lib/components/RoomShareDialog.svelte';
	import SettingsDialog from '$lib/components/SettingsDialog.svelte';
	import GameScreen from '$lib/screens/GameScreen.svelte';
	import LoadingScreen from '$lib/screens/LoadingScreen.svelte';
	import LobbyScreen from '$lib/screens/LobbyScreen.svelte';
	import MenuScreen from '$lib/screens/MenuScreen.svelte';
	import { loadGraphicProfileSetting, resolveGraphicProfile, type GraphicProfileSetting } from '$lib/graphicProfile';
	import { ModelLoader } from '$lib/ModelLoader';
	import { parseRoomIdFromUrl } from '$lib/multiplayer/identity';
	import { roomSession } from '$lib/multiplayer/roomSession.svelte';
	import { preloadGameAssets } from '$lib/preloadGameAssets';
	import { parseScenarioLink } from '$lib/scenarioLink';

	type AppScreen = 'loading' | 'menu' | 'lobby' | 'game';
	type GameMode = 'singleplayer' | 'multiplayer';

	let screen = $state<AppScreen>('loading');
	let gameMode = $state<GameMode>('singleplayer');
	let lobbyRoomId = $state<string | null>(null);
	let loadingMessage = $state('Loading scene...');
	let settingsOpen = $state(false);
	let pauseMenuOpen = $state(false);
	let shareDialogOpen = $state(false);
	let graphicProfileSetting = $state<GraphicProfileSetting>('auto');
	let modelLoader = $state<ModelLoader | null>(null);
	let initError = $state<string | null>(null);

	function openSettings() {
		settingsOpen = true;
	}

	function openPauseMenu() {
		pauseMenuOpen = true;
	}

	function openShareDialog() {
		shareDialogOpen = true;
	}

	function handleProfileChange(setting: GraphicProfileSetting) {
		graphicProfileSetting = setting;
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
		shareDialogOpen = false;
		screen = 'menu';
	}

	function handleBackToMenu() {
		pauseMenuOpen = false;
		goToMenu();
	}

	function startMultiplayerGame() {
		gameMode = 'multiplayer';
		screen = 'game';
	}

	$effect(() => {
		if (!browser) return;

		const inGame = screen === 'game';
		const shareOpen = shareDialogOpen;
		const settings = settingsOpen;
		const pauseOpen = pauseMenuOpen;

		function handleEscape(event: KeyboardEvent) {
			if (event.key !== 'Escape') return;

			if (shareOpen) {
				event.preventDefault();
				shareDialogOpen = false;
				return;
			}
			if (settings) {
				event.preventDefault();
				settingsOpen = false;
				return;
			}
			if (pauseOpen) {
				event.preventDefault();
				pauseMenuOpen = false;
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
		/>
	{/if}
</div>

<PauseMenuDialog
	open={pauseMenuOpen}
	mode={gameMode}
	onClose={() => (pauseMenuOpen = false)}
	onOpenSettings={openSettings}
	onOpenShareDialog={gameMode === 'multiplayer' ? openShareDialog : undefined}
	onBackToMenu={handleBackToMenu}
/>

<RoomShareDialog open={shareDialogOpen} onClose={() => (shareDialogOpen = false)} />

<SettingsDialog
	open={settingsOpen}
	profileSetting={graphicProfileSetting}
	onClose={() => (settingsOpen = false)}
	onChange={handleProfileChange}
/>
