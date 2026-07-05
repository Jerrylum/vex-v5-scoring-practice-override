<script lang="ts">
	import { onMount } from 'svelte';
	import SettingsDialog from '$lib/components/SettingsDialog.svelte';
	import GameScreen from '$lib/screens/GameScreen.svelte';
	import LoadingScreen from '$lib/screens/LoadingScreen.svelte';
	import MenuScreen from '$lib/screens/MenuScreen.svelte';
	import { loadGraphicProfileSetting, resolveGraphicProfile, type GraphicProfileSetting } from '$lib/graphicProfile';
	import { ModelLoader } from '$lib/ModelLoader';
	import { preloadGameAssets } from '$lib/preloadGameAssets';
	import { parseScenarioLink } from '$lib/scenarioLink';

	type AppScreen = 'loading' | 'menu' | 'game';

	let screen = $state<AppScreen>('loading');
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

				const linkOutcome = parseScenarioLink(new URLSearchParams(window.location.search));
				screen = linkOutcome.ok ? 'game' : 'menu';
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
		<MenuScreen onSingleplayer={startSingleplayer} onSettings={openSettings} />
	{:else if screen === 'game' && modelLoader}
		<GameScreen {modelLoader} onOpenSettings={openSettings} />
	{/if}
</div>

<SettingsDialog
	open={settingsOpen}
	profileSetting={graphicProfileSetting}
	onClose={() => (settingsOpen = false)}
	onChange={handleProfileChange}
/>
