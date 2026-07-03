<script lang="ts">
	import type { ToggleColor } from '$lib/Scoring';

	interface Props {
		color: ToggleColor;
		filled?: boolean;
		size?: number;
	}

	let { color, filled = true, size = 20 }: Props = $props();

	const COLORS: Record<ToggleColor, string> = {
		red: '#DC2626',
		blue: '#2563EB',
		yellow: '#EAB308'
	};

	const strokeColor = $derived(COLORS[color]);
	const fillValue = $derived(filled ? strokeColor : 'none');
	const strokeWidth = $derived(filled ? 0 : 2);
</script>

<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" class="inline-block shrink-0">
	{#if color === 'red'}
		<circle cx="12" cy="12" r="9" fill={fillValue} stroke={strokeColor} stroke-width={strokeWidth} />
	{:else if color === 'blue'}
		<rect x="4" y="4" width="16" height="16" rx="3" fill={fillValue} stroke={strokeColor} stroke-width={strokeWidth} />
	{:else}
		<polygon points="12,3 21,12 12,21 3,12" fill={fillValue} stroke={strokeColor} stroke-width={strokeWidth} />
	{/if}
</svg>
