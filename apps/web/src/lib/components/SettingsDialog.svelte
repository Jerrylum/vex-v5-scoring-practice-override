<script lang="ts">
	import Dialog from '$lib/components/dialog/Dialog.svelte';
	import {
		GRAPHIC_PROFILE_LABELS,
		resolveGraphicProfile,
		saveGraphicProfileSetting,
		type GraphicProfileSetting
	} from '$lib/graphicProfile';

	interface Props {
		open: boolean;
		profileSetting: GraphicProfileSetting;
		onClose: () => void;
		onChange: (setting: GraphicProfileSetting) => void;
	}

	let { open, profileSetting, onClose, onChange }: Props = $props();

	const titleId = 'settings-dialog-title';

	const options: GraphicProfileSetting[] = ['auto', 'performance', 'balance', 'bestQuality'];

	function selectSetting(value: GraphicProfileSetting) {
		saveGraphicProfileSetting(value);
		onChange(value);
	}
</script>

<Dialog {open} {onClose} ariaLabelledBy={titleId}>
	<div class="space-y-4">
		<h2 id={titleId} class="text-lg font-bold text-white">Settings</h2>

		<fieldset class="space-y-2">
			<legend class="mb-2 text-sm font-semibold text-[#CDD7E1]">Graphics</legend>
			{#each options as option (option)}
				<label class="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-800 px-3 py-2 hover:bg-[#141414]">
					<input
						type="radio"
						name="graphic-profile"
						value={option}
						checked={profileSetting === option}
						class="mt-1"
						onchange={() => selectSetting(option)}
					/>
					<span>
						<span class="block text-sm font-medium text-[#CDD7E1]">{GRAPHIC_PROFILE_LABELS[option]}</span>
					</span>
				</label>
			{/each}
		</fieldset>

		<p class="text-xs text-gray-400">
			Active: {GRAPHIC_PROFILE_LABELS[resolveGraphicProfile(profileSetting)]}
		</p>
		<p class="text-xs text-gray-500">Graphics changes apply on the next game load.</p>

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
