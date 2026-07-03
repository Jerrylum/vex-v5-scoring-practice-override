<script lang="ts">
	import PinShapeIcon from './PinShapeIcon.svelte';
	import type { ToggleColor } from '$lib/Scoring';

	interface Props {
		title: string;
		color: ToggleColor;
		value: number;
		onIncrement: () => void;
		onDecrement: () => void;
		correctValue?: number | null;
		showAnswer?: boolean;
	}

	let { title, color, value, onIncrement, onDecrement, correctValue = null, showAnswer = false }: Props = $props();

	const borderClass = $derived(color === 'red' ? 'border-red-700' : color === 'blue' ? 'border-blue-700' : 'border-yellow-700');

	const titleClass = $derived(color === 'red' ? 'text-red-400' : color === 'blue' ? 'text-blue-400' : 'text-yellow-400');

	const minusClass = $derived(
		color === 'red'
			? 'bg-red-900 text-red-200 hover:bg-red-800'
			: color === 'blue'
				? 'bg-blue-900 text-blue-200 hover:bg-blue-800'
				: 'bg-yellow-900 text-yellow-200 hover:bg-yellow-800'
	);

	const plusClass = $derived(
		color === 'red'
			? 'bg-red-600 text-white hover:bg-red-700'
			: color === 'blue'
				? 'bg-blue-600 text-white hover:bg-blue-700'
				: 'bg-yellow-500 text-white hover:bg-yellow-600'
	);

	const isCorrect = $derived(correctValue !== null && value === correctValue);
</script>

<div class="rounded-lg border-2 bg-[#141414] p-2 {borderClass}">
	<div class="mb-2 flex items-center justify-center gap-2 border-b border-gray-700 pb-2">
		<span class="text-sm font-bold {titleClass}">{title}</span>
		<PinShapeIcon {color} size={18} />
	</div>
	<div class="flex justify-center">
		<div class="relative">
			<div class="flex items-center gap-3">
				<button
					type="button"
					class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-lg font-bold {minusClass}"
					onclick={onDecrement}
					aria-label="Decrease {title}"
				>
					−
				</button>
				<span class="min-w-8 text-center text-2xl font-bold text-gray-100">{value}</span>
				<button
					type="button"
					class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-lg font-bold {plusClass}"
					onclick={onIncrement}
					aria-label="Increase {title}"
				>
					+
				</button>
			</div>
			{#if showAnswer && correctValue !== null}
				<span
					class="absolute top-1/2 left-full ml-5 -translate-y-1/2 text-xs whitespace-nowrap"
					class:text-green-400={isCorrect}
					class:text-red-400={!isCorrect}
				>
					Correct: {correctValue}
				</span>
			{/if}
		</div>
	</div>
</div>
