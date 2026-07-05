<script lang="ts">
	import CounterCard from './CounterCard.svelte';
	import type { MidfieldCounts, PinHalfCounts, ScenarioScoring } from '$lib/Scoring';
	import type { UserScenarioScoring } from '$lib/userScoring';

	interface Props {
		userScoring: UserScenarioScoring;
		actualCounts: ScenarioScoring;
		midfieldCounts: MidfieldCounts;
		showAnswer: boolean;
		onUpdate: (userScoring: UserScenarioScoring) => void;
	}

	let { userScoring, actualCounts, midfieldCounts, showAnswer, onUpdate }: Props = $props();

	function incrementGoal(field: keyof PinHalfCounts) {
		onUpdate({
			...userScoring,
			midfieldGoal: {
				...userScoring.midfieldGoal,
				[field]: userScoring.midfieldGoal[field] + 1
			}
		});
	}

	function decrementGoal(field: keyof PinHalfCounts) {
		if (userScoring.midfieldGoal[field] > 0) {
			onUpdate({
				...userScoring,
				midfieldGoal: {
					...userScoring.midfieldGoal,
					[field]: userScoring.midfieldGoal[field] - 1
				}
			});
		}
	}

	function incrementRobot(alliance: 'red' | 'blue') {
		onUpdate({
			...userScoring,
			midfieldRobots: {
				...userScoring.midfieldRobots,
				[alliance]: userScoring.midfieldRobots[alliance] + 1
			}
		});
	}

	function decrementRobot(alliance: 'red' | 'blue') {
		if (userScoring.midfieldRobots[alliance] > 0) {
			onUpdate({
				...userScoring,
				midfieldRobots: {
					...userScoring.midfieldRobots,
					[alliance]: userScoring.midfieldRobots[alliance] - 1
				}
			});
		}
	}
</script>

<div class="space-y-4">
	<div>
		<h3 class="mb-2 text-center text-xs font-bold tracking-wide text-gray-400 uppercase">Center Goal</h3>
		<div class="space-y-3">
			<CounterCard
				title="Red Pins"
				color="red"
				value={userScoring.midfieldGoal.red}
				onIncrement={() => incrementGoal('red')}
				onDecrement={() => decrementGoal('red')}
				correctValue={actualCounts.midfieldGoal.visible.red}
				{showAnswer}
				compact
			/>
			<CounterCard
				title="Blue"
				color="blue"
				value={userScoring.midfieldGoal.blue}
				onIncrement={() => incrementGoal('blue')}
				onDecrement={() => decrementGoal('blue')}
				correctValue={actualCounts.midfieldGoal.visible.blue}
				{showAnswer}
				compact
			/>
			<CounterCard
				title="Yellow"
				color="yellow"
				value={userScoring.midfieldGoal.yellow}
				onIncrement={() => incrementGoal('yellow')}
				onDecrement={() => decrementGoal('yellow')}
				correctValue={actualCounts.midfieldGoal.visible.yellow}
				{showAnswer}
				compact
			/>
		</div>
	</div>

	<div>
		<h3 class="mb-2 text-center text-xs font-bold tracking-wide text-gray-400 uppercase">Robots in Midfield</h3>
		<div class="space-y-3">
			<CounterCard
				title="Red"
				color="red"
				value={userScoring.midfieldRobots.red}
				onIncrement={() => incrementRobot('red')}
				onDecrement={() => decrementRobot('red')}
				correctValue={midfieldCounts.red}
				{showAnswer}
				compact
			/>
			<CounterCard
				title="Blue"
				color="blue"
				value={userScoring.midfieldRobots.blue}
				onIncrement={() => incrementRobot('blue')}
				onDecrement={() => decrementRobot('blue')}
				correctValue={midfieldCounts.blue}
				{showAnswer}
				compact
			/>
		</div>
	</div>
</div>
