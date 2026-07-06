<script lang="ts">
	import PinShapeIcon from './PinShapeIcon.svelte';
	import type { ToggleColor } from '$lib/Scoring';

	interface Props {
		value: ToggleColor;
		onChange: (color: ToggleColor) => void;
		correctValue?: ToggleColor | null;
		showAnswer?: boolean;
		disabled?: boolean;
	}

	let { value, onChange, correctValue = null, showAnswer = false, disabled = false }: Props = $props();

	const colors: ToggleColor[] = ['red', 'yellow', 'blue'];
	const isCorrect = $derived(correctValue !== null && value === correctValue);
</script>

<div class="rounded-lg border-2 border-gray-600 bg-[#141414] p-2">
	<div class="mb-2 border-b border-gray-700 pb-2 text-center text-sm font-bold text-gray-300">Toggle</div>
	<div class="flex justify-center">
		<div class="relative">
			<div class="flex items-center gap-4">
				{#each colors as color (color)}
					<button
						type="button"
						class="cursor-pointer rounded p-1 transition-transform hover:scale-110"
						class:cursor-not-allowed={disabled}
						class:opacity-50={disabled}
						onclick={() => onChange(color)}
						{disabled}
						aria-label="Set toggle to {color}"
						aria-pressed={value === color}
					>
						<PinShapeIcon {color} filled={value === color} size={28} />
					</button>
				{/each}
			</div>
			{#if showAnswer && correctValue !== null}
				<span
					class="absolute top-1/2 left-full ml-3 -translate-y-1/2 text-xs whitespace-nowrap"
					class:text-green-400={isCorrect}
					class:text-red-400={!isCorrect}
				>
					Correct: {correctValue}
				</span>
			{/if}
		</div>
	</div>
</div>
