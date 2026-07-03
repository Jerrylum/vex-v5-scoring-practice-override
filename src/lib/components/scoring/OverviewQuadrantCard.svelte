<script lang="ts">
	import OverviewCountRow from './OverviewCountRow.svelte';
	import type { ToggleColor } from '$lib/Scoring';

	interface Props {
		title: string;
		titleColor?: 'red' | 'blue' | 'neutral';
		red: number;
		blue: number;
		yellow: number;
		toggleColor: ToggleColor;
	}

	let { title, titleColor = 'neutral', red, blue, yellow, toggleColor }: Props = $props();

	const titleClass = $derived(titleColor === 'red' ? 'text-red-400' : titleColor === 'blue' ? 'text-blue-400' : 'text-gray-200');

	const borderClass = $derived(titleColor === 'red' ? 'border-red-700' : titleColor === 'blue' ? 'border-blue-700' : 'border-gray-700');
</script>

<div class="rounded-lg border-2 bg-[#141414] p-2 {borderClass}">
	<div class="border-b border-gray-700 pb-1 text-center text-sm font-bold {titleClass}">{title}</div>
	<div class="mt-1 space-y-0.5">
		<OverviewCountRow label="Red" labelClass="text-red-400" value={red} iconColor="red" />
		<OverviewCountRow label="Blue" labelClass="text-blue-400" value={blue} iconColor="blue" />
		<OverviewCountRow label="Yellow" labelClass="text-yellow-400" value={yellow} iconColor="yellow" />
		<OverviewCountRow label="Toggle:" labelClass="text-gray-400" iconColor={toggleColor} />
	</div>
</div>
