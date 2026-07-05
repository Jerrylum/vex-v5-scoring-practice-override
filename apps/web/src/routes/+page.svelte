<script lang="ts">
	import { onMount } from 'svelte';
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
	type LobbyMode = 'create' | 'join';

	let screen = $state<AppScreen>('loading');
	let gameMode = $state<GameMode>('singleplayer');
	let lobbyMode = $state<LobbyMode>('create');
	let lobbyRoomId = $state<string | null>(null);
	let loadingMessage = $state('Loading scene...');
	let settingsOpen = $state(false);
	let graphicProfileSetting = $state<GraphicProfileSetting>('auto');
	let modelLoader = $state<ModelLoader | null>(null);
	let initError = $state<string | null>(null);

	function openSettings() {
		settingsOpen = true;
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
		lobbyMode = 'create';
		lobbyRoomId = null;
		screen = 'lobby';
	}

	function goToMenu() {
		if (gameMode === 'multiplayer') {
			roomSession.disconnect();
		}
		gameMode = 'singleplayer';
		screen = 'menu';
	}

	function startMultiplayerGame() {
		gameMode = 'multiplayer';
		screen = 'game';
	}

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
					lobbyMode = 'join';
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
		<LobbyScreen mode={lobbyMode} roomId={lobbyRoomId} onBack={goToMenu} onStartGame={startMultiplayerGame} />
	{:else if screen === 'game' && modelLoader}
		<GameScreen {modelLoader} mode={gameMode} onOpenSettings={openSettings} />
	{/if}
</div>

<SettingsDialog
	open={settingsOpen}
	profileSetting={graphicProfileSetting}
	onClose={() => (settingsOpen = false)}
	onChange={handleProfileChange}
/>
