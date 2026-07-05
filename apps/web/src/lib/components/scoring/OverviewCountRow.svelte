<script lang="ts">
	import PinShapeIcon from './PinShapeIcon.svelte';
	import type { ToggleColor } from '$lib/Scoring';

	interface Props {
		label: string;
		labelClass?: string;
		value?: number;
		iconColor?: ToggleColor;
	}

	let { label, labelClass = 'text-gray-400', value, iconColor }: Props = $props();
</script>

<div class="grid grid-cols-[minmax(0,1fr)_2.5rem_1.25rem] items-center gap-1 px-1">
	<span class="text-sm {labelClass}">{label}</span>
	<span class="text-center text-sm font-semibold text-gray-100">{value ?? ''}</span>
	<div class="flex justify-end">
		{#if iconColor}
			<PinShapeIcon color={iconColor} size={16} />
		{/if}
	</div>
</div>
