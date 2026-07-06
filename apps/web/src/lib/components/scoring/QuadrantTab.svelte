<script lang="ts">
	import CounterCard from './CounterCard.svelte';
	import ToggleSelector from './ToggleSelector.svelte';
	import type { UserQuadrantScoring } from '$lib/userScoring';
	import { MAX_SCORING_COUNT } from '@vex-v5-override/protocol';

	interface Props {
		label: string;
		quadrant: UserQuadrantScoring;
		readOnly?: boolean;
		onUpdate: (quadrant: UserQuadrantScoring) => void;
	}

	let { label, quadrant, readOnly = false, onUpdate }: Props = $props();

	function increment(field: 'red' | 'blue' | 'yellow') {
		if (quadrant[field] >= MAX_SCORING_COUNT) return;
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
		disabled={readOnly}
	/>
	<CounterCard
		title="Blue Pins"
		color="blue"
		value={quadrant.blue}
		onIncrement={() => increment('blue')}
		onDecrement={() => decrement('blue')}
		disabled={readOnly}
	/>
	<CounterCard
		title="Yellow Pins"
		color="yellow"
		value={quadrant.yellow}
		onIncrement={() => increment('yellow')}
		onDecrement={() => decrement('yellow')}
		disabled={readOnly}
	/>
	<ToggleSelector
		value={quadrant.toggleColor}
		onChange={(toggleColor) => onUpdate({ ...quadrant, toggleColor })}
		disabled={readOnly}
	/>
</div>
