<script lang="ts">
	import Dialog from '$lib/components/dialog/Dialog.svelte';
	import {
		REFEREE_VIEW_LABELS,
		REFEREE_VIEW_PRESETS,
		getRefereeViewPreset,
		type RefereeViewPreset
	} from '$lib/refereeView';

	interface Props {
		open: boolean;
		mode: 'singleplayer' | 'multiplayer';
		onClose: () => void;
		onOpenSettings: () => void;
		onOpenShareDialog?: () => void;
		onBackToMenu: () => void;
		onViewPresetChange?: (preset: RefereeViewPreset) => void;
	}

	let { open, mode, onClose, onOpenSettings, onOpenShareDialog, onBackToMenu, onViewPresetChange }: Props = $props();

	const titleId = 'pause-menu-dialog-title';
	const backLabel = $derived(mode === 'multiplayer' ? 'Leave room' : 'Back to menu');
	let selectedView = $state<RefereeViewPreset>(getRefereeViewPreset());

	$effect(() => {
		if (open) selectedView = getRefereeViewPreset();
	});

	function handleViewChange(preset: RefereeViewPreset) {
		selectedView = preset;
		onViewPresetChange?.(preset);
	}
</script>

<Dialog {open} {onClose} ariaLabelledBy={titleId}>
	<div class="space-y-4">
		<h2 id={titleId} class="text-lg font-bold text-white">Menu</h2>

		<div class="space-y-2">
			<p class="text-xs tracking-wide text-gray-500 uppercase">View preset</p>
			<div class="grid grid-cols-2 gap-2">
				{#each REFEREE_VIEW_PRESETS as preset (preset)}
					<button
						type="button"
						class="cursor-pointer rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors"
						class:border-[#007fff]={selectedView === preset}
						class:bg-[#141414]={selectedView === preset}
						class:border-gray-800={selectedView !== preset}
						class:text-white={selectedView === preset}
						class:text-gray-400={selectedView !== preset}
						onclick={() => handleViewChange(preset)}
					>
						{REFEREE_VIEW_LABELS[preset]}
					</button>
				{/each}
			</div>
		</div>

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
