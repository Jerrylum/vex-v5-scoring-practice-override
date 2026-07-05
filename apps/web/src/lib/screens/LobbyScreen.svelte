<script lang="ts">
	import RoomQrCode from '$lib/components/RoomQrCode.svelte';
	import { generateScenario, scenarioToSnapshot } from '$lib/ScenarioGenerator';
	import { roomSession } from '$lib/multiplayer/roomSession.svelte';
	import { randomMasterSeed } from '$lib/utils';

	interface Props {
		roomId?: string | null;
		onStartGame: () => void;
		onLeave: () => void;
	}

	let { roomId = null, onStartGame, onLeave }: Props = $props();

	let isBusy = $state(false);
	let statusMessage = $state<string | null>(null);

	const roomLink = $derived(roomSession.getRoomLink());

	$effect(() => {
		if (roomSession.phase === 'scoring') {
			onStartGame();
		}
	});

	async function handleCreateRoom() {
		if (isBusy) return;
		isBusy = true;
		statusMessage = null;
		roomSession.setError(null);

		try {
			const difficulty = 'medium' as const;
			const scenario = scenarioToSnapshot(generateScenario({ difficulty, masterSeed: randomMasterSeed() }), difficulty);
			await roomSession.createRoom(difficulty, scenario);
			statusMessage = 'Room created. Share the link with other referees.';
		} catch (error) {
			console.error('Failed to create room:', error);
			roomSession.setError(error instanceof Error ? error.message : 'Failed to create room');
		} finally {
			isBusy = false;
		}
	}

	async function handleRejoinRoom() {
		if (isBusy || !roomId) return;
		isBusy = true;
		statusMessage = null;
		roomSession.setError(null);

		try {
			await roomSession.rejoinRoom(roomId);
			statusMessage = 'Rejoined room.';
		} catch (error) {
			console.error('Failed to rejoin room:', error);
			roomSession.setError(error instanceof Error ? error.message : 'Failed to rejoin room');
		} finally {
			isBusy = false;
		}
	}

	async function handleCopyLink() {
		const link = roomSession.getRoomLink();
		if (!link) return;

		try {
			await navigator.clipboard.writeText(link);
			statusMessage = 'Room link copied.';
		} catch {
			statusMessage = 'Could not copy link.';
		}
	}

	async function handleStartScoring() {
		if (!roomSession.isHost || isBusy) return;
		isBusy = true;
		try {
			await roomSession.startScoring();
		} catch (error) {
			console.error('Failed to start scoring:', error);
			roomSession.setError(error instanceof Error ? error.message : 'Failed to start scoring');
		} finally {
			isBusy = false;
		}
	}

	const connectionLabel = $derived(
		roomSession.connectionState === 'connected'
			? 'Connected'
			: roomSession.connectionState === 'connecting'
				? 'Connecting…'
				: roomSession.connectionState === 'reconnecting'
					? 'Reconnecting…'
					: roomSession.connectionState === 'error'
						? 'Connection error'
						: 'Offline'
	);

	let autoConnectAttempted = $state(false);

	$effect(() => {
		if (roomSession.kit || isBusy || autoConnectAttempted) return;
		autoConnectAttempted = true;
		if (roomId) {
			void handleRejoinRoom();
		} else {
			void handleCreateRoom();
		}
	});
</script>

<div class="relative z-10 flex h-screen w-screen flex-col items-center justify-center bg-black px-6 text-[#CDD7E1]">
	<div class="w-full max-w-md">
		<h1 class="mb-2 text-2xl font-bold text-white">Multiplayer Room</h1>
		<p class="mb-6 text-sm text-gray-400">{connectionLabel}</p>

		{#if !roomSession.kit && isBusy}
			<p class="text-center text-sm text-gray-400">{roomId ? 'Rejoining room…' : 'Creating room…'}</p>
		{/if}

		{#if roomSession.kit}
			<button type="button" class="mb-3 cursor-pointer text-sm text-gray-400 hover:text-white" onclick={onLeave}>← Leave</button>

			<div class="mb-4 rounded-lg border border-gray-800 bg-[#141414] p-4">
				<p class="mb-1 text-xs tracking-wide text-gray-500 uppercase">Room ID</p>
				<p class="mb-4 font-mono text-xs break-all text-gray-300">{roomSession.roomId}</p>

				{#if roomLink}
					<div class="mb-4 flex justify-center">
						<RoomQrCode url={roomLink} />
					</div>
				{/if}

				<button
					type="button"
					class="mb-4 w-full cursor-pointer rounded-full border border-gray-600 px-4 py-2 text-xs font-semibold hover:bg-gray-800"
					onclick={handleCopyLink}
				>
					Copy room link
				</button>

				<p class="mb-2 text-xs tracking-wide text-gray-500 uppercase">Participants ({roomSession.roomState?.participants.length ?? 0})</p>
				<ul class="space-y-1 text-sm">
					{#each roomSession.roomState?.participants ?? [] as participant (participant.clientId)}
						<li class="flex items-center justify-between rounded px-2 py-1 hover:bg-black/40">
							<span>
								{participant.displayName}
								{#if participant.clientId === roomSession.clientId}
									<span class="text-gray-500"> (You)</span>
								{/if}
							</span>
							{#if participant.clientId === roomSession.roomState?.hostClientId}
								<span class="text-xs text-[#007fff]">Host</span>
							{/if}
						</li>
					{/each}
				</ul>
			</div>

			{#if roomSession.isHost && roomSession.phase === 'lobby'}
				<button
					type="button"
					class="w-full cursor-pointer rounded-full bg-[#007fff] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0066cc] disabled:cursor-not-allowed disabled:opacity-50"
					disabled={isBusy}
					onclick={handleStartScoring}
				>
					{isBusy ? 'Starting…' : 'Start scoring'}
				</button>
			{:else if !roomSession.isHost && roomSession.phase === 'lobby'}
				<p class="text-center text-sm text-gray-400">Waiting for host to start scoring…</p>
			{/if}
		{/if}

		{#if roomSession.error}
			<p class="mt-4 text-sm text-red-400">{roomSession.error}</p>
		{/if}
		{#if statusMessage}
			<p class="mt-4 text-sm text-green-400">{statusMessage}</p>
		{/if}
	</div>
</div>
