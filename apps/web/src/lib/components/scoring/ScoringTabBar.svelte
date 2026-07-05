<script lang="ts">
	import type { ScoringTabId } from '$lib/userScoring';

	interface Tab {
		id: ScoringTabId;
		label: string;
		accent?: 'red' | 'blue' | 'neutral';
	}

	interface Props {
		activeTab: ScoringTabId;
		onTabChange: (tab: ScoringTabId) => void;
	}

	let { activeTab, onTabChange }: Props = $props();

	const tabs: Tab[] = [
		{ id: 'overview', label: 'Overview', accent: 'neutral' },
		{ id: 'redQ1', label: 'Red Q1', accent: 'red' },
		{ id: 'redQ2', label: 'Red Q2', accent: 'red' },
		{ id: 'blueQ1', label: 'Blue Q1', accent: 'blue' },
		{ id: 'blueQ2', label: 'Blue Q2', accent: 'blue' },
		{ id: 'midfield', label: 'Midfield', accent: 'neutral' }
	];

	function tabClass(tab: Tab, isActive: boolean): string {
		if (isActive) {
			if (tab.accent === 'red') return 'bg-red-600 text-white';
			if (tab.accent === 'blue') return 'bg-blue-600 text-white';
			return 'bg-gray-600 text-white';
		}
		if (tab.accent === 'red') return 'text-red-400 hover:bg-[#1a1a1a]';
		if (tab.accent === 'blue') return 'text-blue-400 hover:bg-[#1a1a1a]';
		return 'text-gray-300 hover:bg-[#1a1a1a]';
	}
</script>

<div class="flex flex-wrap gap-1 border-b border-gray-800 bg-[#0a0a0a] px-1 py-1">
	{#each tabs as tab (tab.id)}
		<button
			type="button"
			class="cursor-pointer rounded px-2 py-1 text-xs font-semibold transition-colors {tabClass(tab, activeTab === tab.id)}"
			onclick={() => onTabChange(tab.id)}
		>
			{tab.label}
		</button>
	{/each}
</div>
