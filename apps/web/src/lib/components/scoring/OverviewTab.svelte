<script lang="ts">
	import OverviewMidfieldCard from './OverviewMidfieldCard.svelte';
	import OverviewQuadrantCard from './OverviewQuadrantCard.svelte';
	import type { UserScenarioScoring } from '$lib/userScoring';

	interface Props {
		userScoring: UserScenarioScoring;
	}

	let { userScoring }: Props = $props();
</script>

<div class="space-y-2">
	<div class="grid grid-cols-2 gap-2">
		<OverviewQuadrantCard
			title="Red Q1"
			titleColor="red"
			red={userScoring.redQuadrantOne.red}
			blue={userScoring.redQuadrantOne.blue}
			yellow={userScoring.redQuadrantOne.yellow}
			toggleColor={userScoring.redQuadrantOne.toggleColor}
		/>
		<OverviewQuadrantCard
			title="Blue Q1"
			titleColor="blue"
			red={userScoring.blueQuadrantOne.red}
			blue={userScoring.blueQuadrantOne.blue}
			yellow={userScoring.blueQuadrantOne.yellow}
			toggleColor={userScoring.blueQuadrantOne.toggleColor}
		/>
	</div>
	<div class="grid grid-cols-2 gap-2">
		<OverviewQuadrantCard
			title="Red Q2"
			titleColor="red"
			red={userScoring.redQuadrantTwo.red}
			blue={userScoring.redQuadrantTwo.blue}
			yellow={userScoring.redQuadrantTwo.yellow}
			toggleColor={userScoring.redQuadrantTwo.toggleColor}
		/>
		<OverviewQuadrantCard
			title="Blue Q2"
			titleColor="blue"
			red={userScoring.blueQuadrantTwo.red}
			blue={userScoring.blueQuadrantTwo.blue}
			yellow={userScoring.blueQuadrantTwo.yellow}
			toggleColor={userScoring.blueQuadrantTwo.toggleColor}
		/>
	</div>
	<OverviewMidfieldCard goal={userScoring.midfieldGoal} robots={userScoring.midfieldRobots} />
</div>
