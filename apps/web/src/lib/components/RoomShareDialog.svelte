<script lang="ts">
	import Dialog from '$lib/components/dialog/Dialog.svelte';
	import RoomQrCode from '$lib/components/RoomQrCode.svelte';
	import { roomSession } from '$lib/multiplayer/roomSession.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	const titleId = 'room-share-dialog-title';
	const roomLink = $derived(roomSession.getRoomLink());
	let copyMessage = $state<string | null>(null);
	let copiedOnOpen = $state(false);

	async function copyLink() {
		if (!roomLink) return;

		try {
			await navigator.clipboard.writeText(roomLink);
			copyMessage = 'Room link copied.';
		} catch {
			copyMessage = 'Could not copy link.';
		}
	}

	$effect(() => {
		if (!open) {
			copiedOnOpen = false;
			copyMessage = null;
			return;
		}

		if (copiedOnOpen || !roomLink) return;
		copiedOnOpen = true;
		void copyLink();
	});
</script>

<Dialog {open} {onClose} ariaLabelledBy={titleId}>
	<div class="space-y-4">
		<h2 id={titleId} class="text-lg font-bold text-white">Share room</h2>

		{#if roomSession.roomId}
			<div>
				<p class="mb-1 text-xs tracking-wide text-gray-500 uppercase">Room ID</p>
				<p class="font-mono text-xs break-all text-gray-300">{roomSession.roomId}</p>
			</div>

			{#if roomLink}
				<div class="flex justify-center">
					<RoomQrCode url={roomLink} />
				</div>
			{/if}

			<p class="text-xs tracking-wide text-gray-500 uppercase">
				Connected ({roomSession.roomState?.participants.length ?? 0})
			</p>
			<ul class="space-y-1 text-sm">
				{#each roomSession.roomState?.participants ?? [] as participant (participant.clientId)}
					<li class="flex items-center justify-between rounded px-2 py-1 hover:bg-[#141414]">
						<span>
							{participant.displayName}
							{#if participant.clientId === roomSession.clientId}
								<span class="text-gray-500"> (You)</span>
							{/if}
						</span>
					</li>
				{/each}
			</ul>

			<button
				type="button"
				class="w-full cursor-pointer rounded-full border border-gray-600 px-4 py-2 text-sm font-semibold hover:bg-gray-800"
				disabled={!roomLink}
				onclick={copyLink}
			>
				Copy room link
			</button>

			{#if copyMessage}
				<p class="text-center text-sm text-green-400">{copyMessage}</p>
			{/if}
		{:else}
			<p class="text-sm text-gray-400">Not connected to a room.</p>
		{/if}

		<div class="flex justify-end pt-1">
			<button
				type="button"
				class="cursor-pointer rounded-full bg-[#32383E] px-4 py-2 text-sm text-[#CDD7E1] hover:bg-[#3d444b]"
				onclick={onClose}
			>
				Close
			</button>
		</div>
	</div>
</Dialog>
