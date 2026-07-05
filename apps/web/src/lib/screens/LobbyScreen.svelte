<script lang="ts">
	import type { Level } from '@vex-v5-override/protocol';
	import { generateScenario, scenarioToSnapshot } from '$lib/ScenarioGenerator';
	import { roomSession } from '$lib/multiplayer/roomSession.svelte';
	import { randomMasterSeed } from '$lib/utils';

	interface Props {
		mode: 'create' | 'join';
		roomId?: string | null;
		onBack: () => void;
		onStartGame: () => void;
	}

	let { mode, roomId = null, onBack, onStartGame }: Props = $props();

	let difficulty = $state<Level>('medium');
	let isBusy = $state(false);
	let statusMessage = $state<string | null>(null);
	let joinRoomId = $state('');

	$effect(() => {
		if (roomId) joinRoomId = roomId;
	});

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
			const scenario = scenarioToSnapshot(
				generateScenario({ difficulty, masterSeed: randomMasterSeed() }),
				difficulty
			);
			await roomSession.createRoom(difficulty, scenario);
			statusMessage = 'Room created. Share the link with other referees.';
		} catch (error) {
			console.error('Failed to create room:', error);
			roomSession.setError(error instanceof Error ? error.message : 'Failed to create room');
		} finally {
			isBusy = false;
		}
	}

	async function handleJoinRoom() {
		if (isBusy || !joinRoomId.trim()) return;
		isBusy = true;
		statusMessage = null;
		roomSession.setError(null);

		try {
			await roomSession.joinRoom(joinRoomId.trim());
			statusMessage = 'Joined room.';
		} catch (error) {
			console.error('Failed to join room:', error);
			roomSession.setError(error instanceof Error ? error.message : 'Failed to join room');
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

	async function handleNewScenario() {
		if (!roomSession.isHost || isBusy) return;
		isBusy = true;
		try {
			const scenario = scenarioToSnapshot(
				generateScenario({ difficulty, masterSeed: randomMasterSeed() }),
				difficulty
			);
			await roomSession.regenerateScenario(scenario);
			statusMessage = 'Scenario updated for all participants.';
		} catch (error) {
			console.error('Failed to update scenario:', error);
			roomSession.setError(error instanceof Error ? error.message : 'Failed to update scenario');
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

	let autoRejoinAttempted = $state(false);

	$effect(() => {
		if (!roomId || roomSession.kit || isBusy || autoRejoinAttempted) return;
		autoRejoinAttempted = true;
		joinRoomId = roomId;
		void handleRejoinRoom();
	});

	async function handleRejoinRoom() {
		if (isBusy || !joinRoomId.trim()) return;
		isBusy = true;
		statusMessage = null;
		roomSession.setError(null);

		try {
			await roomSession.rejoinRoom(joinRoomId.trim());
			statusMessage = 'Rejoined room.';
		} catch (error) {
			console.error('Failed to rejoin room:', error);
			roomSession.setError(error instanceof Error ? error.message : 'Failed to rejoin room');
		} finally {
			isBusy = false;
		}
	}
</script>

<div class="relative z-10 flex h-screen w-screen flex-col items-center justify-center bg-black px-6 text-[#CDD7E1]">
	<div class="w-full max-w-md">
		<button type="button" class="mb-6 text-sm text-gray-400 hover:text-white" onclick={onBack}>← Back</button>

		<h1 class="mb-2 text-2xl font-bold text-white">Multiplayer Room</h1>
		<p class="mb-6 text-sm text-gray-400">{connectionLabel}</p>

		<label class="mb-4 block">
			<span class="mb-1 block text-xs uppercase tracking-wide text-gray-500">Display name</span>
			<input
				type="text"
				class="w-full rounded-lg border border-gray-700 bg-[#141414] px-3 py-2 text-white"
				bind:value={roomSession.displayName}
				maxlength="32"
				disabled={isBusy || roomSession.kit !== null}
			/>
		</label>

		{#if mode === 'join' && !roomSession.kit}
			<label class="mb-4 block">
				<span class="mb-1 block text-xs uppercase tracking-wide text-gray-500">Room ID</span>
				<input
					type="text"
					class="w-full rounded-lg border border-gray-700 bg-[#141414] px-3 py-2 font-mono text-sm text-white"
					bind:value={joinRoomId}
					placeholder="Paste room UUID from host"
					disabled={isBusy}
				/>
			</label>
			<button
				type="button"
				class="mb-4 w-full cursor-pointer rounded-full bg-[#007fff] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0066cc] disabled:cursor-not-allowed disabled:opacity-50"
				disabled={isBusy || !joinRoomId.trim()}
				onclick={handleJoinRoom}
			>
				{isBusy ? 'Joining…' : 'Join room'}
			</button>
		{:else if mode === 'create' && !roomSession.kit}
			<label class="mb-4 block">
				<span class="mb-1 block text-xs uppercase tracking-wide text-gray-500">Difficulty</span>
				<select
					class="w-full rounded-lg border border-gray-700 bg-[#141414] px-3 py-2 text-white"
					bind:value={difficulty}
					disabled={isBusy}
				>
					<option value="easy">Easy</option>
					<option value="medium">Medium</option>
					<option value="hard">Hard</option>
				</select>
			</label>
			<button
				type="button"
				class="mb-4 w-full cursor-pointer rounded-full bg-[#007fff] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0066cc] disabled:cursor-not-allowed disabled:opacity-50"
				disabled={isBusy}
				onclick={handleCreateRoom}
			>
				{isBusy ? 'Creating…' : 'Create room'}
			</button>
		{/if}

		{#if roomSession.kit}
			<div class="mb-4 rounded-lg border border-gray-800 bg-[#141414] p-4">
				<p class="mb-1 text-xs uppercase tracking-wide text-gray-500">Room ID</p>
				<p class="mb-3 break-all font-mono text-xs text-gray-300">{roomSession.roomId}</p>

				{#if roomSession.isHost}
					<div class="mb-3 flex flex-wrap gap-2">
						<button
							type="button"
							class="cursor-pointer rounded-full border border-gray-600 px-4 py-2 text-xs font-semibold hover:bg-gray-800"
							onclick={handleCopyLink}
						>
							Copy room link
						</button>
						<button
							type="button"
							class="cursor-pointer rounded-full border border-gray-600 px-4 py-2 text-xs font-semibold hover:bg-gray-800 disabled:opacity-50"
							disabled={isBusy}
							onclick={handleNewScenario}
						>
							New scenario
						</button>
					</div>
					<label class="mb-3 block">
						<span class="mb-1 block text-xs uppercase tracking-wide text-gray-500">Scenario difficulty</span>
						<select
							class="w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white"
							bind:value={difficulty}
							disabled={isBusy}
						>
							<option value="easy">Easy</option>
							<option value="medium">Medium</option>
							<option value="hard">Hard</option>
						</select>
					</label>
				{:else}
					<button
						type="button"
						class="mb-3 cursor-pointer rounded-full border border-gray-600 px-4 py-2 text-xs font-semibold hover:bg-gray-800"
						onclick={handleCopyLink}
					>
						Copy room link
					</button>
				{/if}

				<p class="mb-2 text-xs uppercase tracking-wide text-gray-500">Participants ({roomSession.roomState?.participants.length ?? 0})</p>
				<ul class="space-y-1 text-sm">
					{#each roomSession.roomState?.participants ?? [] as participant (participant.clientId)}
						<li class="flex items-center justify-between rounded px-2 py-1 hover:bg-black/40">
							<span>{participant.displayName}</span>
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
