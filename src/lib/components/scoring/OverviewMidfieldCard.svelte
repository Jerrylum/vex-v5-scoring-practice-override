<script lang="ts">
	import OverviewCountRow from './OverviewCountRow.svelte';
	import type { MidfieldCounts, PinHalfCounts } from '$lib/Scoring';

	interface Props {
		goal: PinHalfCounts;
		robots: MidfieldCounts;
	}

	let { goal, robots }: Props = $props();
</script>

<div class="rounded-lg border-2 border-gray-600 bg-[#141414] p-2">
	<div class="border-b border-gray-700 pb-1 text-center text-sm font-bold text-gray-200">Midfield</div>
	<div class="mt-1 grid grid-cols-2 gap-2">
		<div>
			<div class="mb-1 text-center text-xs font-semibold text-gray-400">Center Goal</div>
			<div class="space-y-0.5">
				<OverviewCountRow label="Red" labelClass="text-red-400" value={goal.red} iconColor="red" />
				<OverviewCountRow label="Blue" labelClass="text-blue-400" value={goal.blue} iconColor="blue" />
				<OverviewCountRow label="Yellow" labelClass="text-yellow-400" value={goal.yellow} iconColor="yellow" />
			</div>
		</div>
		<div class="border-l border-gray-700 pl-2">
			<div class="mb-1 text-center text-xs font-semibold text-gray-400">Robots</div>
			<div class="space-y-0.5">
				<OverviewCountRow label="Red" labelClass="text-red-400" value={robots.red} iconColor="red" />
				<OverviewCountRow label="Blue" labelClass="text-blue-400" value={robots.blue} iconColor="blue" />
			</div>
		</div>
	</div>
</div>
