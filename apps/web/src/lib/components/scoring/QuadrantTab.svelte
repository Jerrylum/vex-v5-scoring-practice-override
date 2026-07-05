<script lang="ts">
	import CounterCard from './CounterCard.svelte';
	import ToggleSelector from './ToggleSelector.svelte';
	import type { ScenarioScoring } from '$lib/Scoring';
	import { getActualQuadrantCounts, getActualToggleColor, type QuadrantKey, type UserQuadrantScoring } from '$lib/userScoring';

	interface Props {
		label: string;
		quadrantKey: QuadrantKey;
		quadrant: UserQuadrantScoring;
		actualCounts: ScenarioScoring;
		showAnswer: boolean;
		readOnly?: boolean;
		onUpdate: (quadrant: UserQuadrantScoring) => void;
	}

	let { label, quadrantKey, quadrant, actualCounts, showAnswer, readOnly = false, onUpdate }: Props = $props();

	const actualPinCounts = $derived(getActualQuadrantCounts(actualCounts, quadrantKey));
	const actualToggle = $derived(getActualToggleColor(actualCounts, quadrantKey));

	function increment(field: 'red' | 'blue' | 'yellow') {
		onUpdate({ ...quadrant, [field]: quadrant[field] + 1 });
	}

	function decrement(field: 'red' | 'blue' | 'yellow') {
		if (quadrant[field] > 0) {
			onUpdate({ ...quadrant, [field]: quadrant[field] - 1 });
		}
	}
</script>

<div class="space-y-3">
	<h3 class="text-center text-sm font-bold text-gray-300">{label}</h3>
	<CounterCard
		title="Red Pins"
		color="red"
		value={quadrant.red}
		onIncrement={() => increment('red')}
		onDecrement={() => decrement('red')}
		correctValue={actualPinCounts?.red ?? null}
		{showAnswer}
		disabled={readOnly}
	/>
	<CounterCard
		title="Blue Pins"
		color="blue"
		value={quadrant.blue}
		onIncrement={() => increment('blue')}
		onDecrement={() => decrement('blue')}
		correctValue={actualPinCounts?.blue ?? null}
		{showAnswer}
		disabled={readOnly}
	/>
	<CounterCard
		title="Yellow Pins"
		color="yellow"
		value={quadrant.yellow}
		onIncrement={() => increment('yellow')}
		onDecrement={() => decrement('yellow')}
		correctValue={actualPinCounts?.yellow ?? null}
		{showAnswer}
		disabled={readOnly}
	/>
	<ToggleSelector
		value={quadrant.toggleColor}
		onChange={(toggleColor) => onUpdate({ ...quadrant, toggleColor })}
		correctValue={actualToggle}
		{showAnswer}
		disabled={readOnly}
	/>
</div>
