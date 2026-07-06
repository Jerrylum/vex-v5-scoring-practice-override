<script lang="ts">
	import Dialog from '$lib/components/dialog/Dialog.svelte';

	interface Props {
		open: boolean;
		mode: 'singleplayer' | 'multiplayer';
		onClose: () => void;
		onOpenSettings: () => void;
		onOpenShareDialog?: () => void;
		onBackToMenu: () => void;
	}

	let { open, mode, onClose, onOpenSettings, onOpenShareDialog, onBackToMenu }: Props = $props();

	const titleId = 'pause-menu-dialog-title';
	const backLabel = $derived(mode === 'multiplayer' ? 'Leave room' : 'Back to menu');
</script>

<Dialog {open} {onClose} ariaLabelledBy={titleId}>
	<div class="space-y-4">
		<h2 id={titleId} class="text-lg font-bold text-white">Menu</h2>

		<div class="space-y-2">
			<button
				type="button"
				class="w-full cursor-pointer rounded-lg border border-gray-800 px-4 py-3 text-left text-sm font-medium text-white hover:bg-[#141414]"
				onclick={onOpenSettings}
			>
				Settings
			</button>

			{#if mode === 'multiplayer' && onOpenShareDialog}
				<button
					type="button"
					class="w-full cursor-pointer rounded-lg border border-gray-800 px-4 py-3 text-left text-sm font-medium text-white hover:bg-[#141414]"
					onclick={onOpenShareDialog}
				>
					Share room
				</button>
			{/if}

			<button
				type="button"
				class="w-full cursor-pointer rounded-lg border border-gray-800 px-4 py-3 text-left text-sm font-medium text-white hover:bg-[#141414]"
				onclick={onBackToMenu}
			>
				{backLabel}
			</button>
		</div>

		<p class="pt-1 text-center text-xs text-gray-500">Esc resume · [ toggles controls</p>
	</div>
</Dialog>
