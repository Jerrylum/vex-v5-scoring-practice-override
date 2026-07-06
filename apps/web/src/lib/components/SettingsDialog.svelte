<script lang="ts">
	import Dialog from '$lib/components/dialog/Dialog.svelte';
	import {
		GRAPHIC_PROFILE_LABELS,
		resolveGraphicProfile,
		saveGraphicProfileSetting,
		type GraphicProfileSetting
	} from '$lib/graphicProfile';
	import { saveScenarioDefaultViewSetting, SCENARIO_DEFAULT_VIEW_OPTIONS, type ScenarioDefaultViewSetting } from '$lib/scenarioDefaultView';

	type SettingsCategory = 'graphics' | 'camera';

	interface Props {
		open: boolean;
		profileSetting: GraphicProfileSetting;
		scenarioDefaultViewSetting: ScenarioDefaultViewSetting;
		onClose: () => void;
		onChange: (setting: GraphicProfileSetting) => void;
		onScenarioDefaultViewChange: (setting: ScenarioDefaultViewSetting) => void;
	}

	let { open, profileSetting, scenarioDefaultViewSetting, onClose, onChange, onScenarioDefaultViewChange }: Props = $props();

	const titleId = 'settings-dialog-title';

	const categories: { id: SettingsCategory; label: string }[] = [
		{ id: 'graphics', label: 'Graphics' },
		{ id: 'camera', label: 'Camera' }
	];

	const graphicOptions: GraphicProfileSetting[] = ['auto', 'performance', 'balance', 'bestQuality'];

	let activeCategory = $state<SettingsCategory>('graphics');

	function selectGraphicSetting(value: GraphicProfileSetting) {
		saveGraphicProfileSetting(value);
		onChange(value);
	}

	function selectScenarioDefaultView(value: ScenarioDefaultViewSetting) {
		saveScenarioDefaultViewSetting(value);
		onScenarioDefaultViewChange(value);
	}

	function scenarioDefaultViewKey(value: ScenarioDefaultViewSetting): string {
		return value ?? 'none';
	}
</script>

<Dialog {open} {onClose} ariaLabelledBy={titleId} contentClass="max-w-2xl!">
	<div class="flex min-h-[320px] flex-col">
		<h2 id={titleId} class="mb-4 text-lg font-bold text-white">Settings</h2>

		<div class="flex min-h-0 flex-1 gap-4">
			<nav class="flex w-36 shrink-0 flex-col gap-1" aria-label="Settings categories">
				{#each categories as category (category.id)}
					<button
						type="button"
						class="cursor-pointer rounded-r-md border-l-2 border-transparent px-3 py-2 text-left text-sm font-medium transition-colors"
						class:border-[#007fff]={activeCategory === category.id}
						class:bg-[#141414]={activeCategory === category.id}
						class:text-white={activeCategory === category.id}
						class:text-gray-400={activeCategory !== category.id}
						class:hover:bg-[#141414]={activeCategory !== category.id}
						class:hover:text-gray-200={activeCategory !== category.id}
						aria-current={activeCategory === category.id ? 'page' : undefined}
						onclick={() => (activeCategory = category.id)}
					>
						{category.label}
					</button>
				{/each}
			</nav>

			<div class="min-w-0 flex-1 border-l border-gray-800 pl-4">
				{#if activeCategory === 'graphics'}
					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-[#CDD7E1]">Graphics</h3>
						<fieldset class="space-y-2">
							<legend class="sr-only">Graphics quality</legend>
							{#each graphicOptions as option (option)}
								<label class="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-800 px-3 py-2 hover:bg-[#141414]">
									<input
										type="radio"
										name="graphic-profile"
										value={option}
										checked={profileSetting === option}
										class="mt-1"
										onchange={() => selectGraphicSetting(option)}
									/>
									<span class="text-sm font-medium text-[#CDD7E1]">{GRAPHIC_PROFILE_LABELS[option]}</span>
								</label>
							{/each}
						</fieldset>
						<p class="text-xs text-gray-400">
							Active: {GRAPHIC_PROFILE_LABELS[resolveGraphicProfile(profileSetting)]}
						</p>
						<p class="text-xs text-gray-500">Graphics changes apply on the next game load.</p>
					</div>
				{:else if activeCategory === 'camera'}
					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-[#CDD7E1]">Camera</h3>
						<p class="text-xs text-gray-500">Default view applied whenever the scenario changes.</p>
						<fieldset class="space-y-2">
							<legend class="sr-only">Default camera on scenario change</legend>
							{#each SCENARIO_DEFAULT_VIEW_OPTIONS as option (scenarioDefaultViewKey(option.value))}
								<label class="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-800 px-3 py-2 hover:bg-[#141414]">
									<input
										type="radio"
										name="scenario-default-view"
										value={scenarioDefaultViewKey(option.value)}
										checked={scenarioDefaultViewSetting === option.value}
										class="mt-1"
										onchange={() => selectScenarioDefaultView(option.value)}
									/>
									<span class="text-sm font-medium text-[#CDD7E1]">{option.label}</span>
								</label>
							{/each}
						</fieldset>
					</div>
				{/if}
			</div>
		</div>

		<div class="mt-4 flex justify-end border-t border-gray-800 pt-4">
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
