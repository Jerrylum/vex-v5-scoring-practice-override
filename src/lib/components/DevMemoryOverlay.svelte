<script lang="ts">
	import { formatDevMemorySnapshot, logDevMemorySnapshot, type DevMemorySnapshot } from '$lib/devMemoryMonitor';
	import type { Scene } from '$lib/Scene';

	interface Props {
		scene: Scene | null;
		intervalMs?: number;
		logToConsole?: boolean;
	}

	let { scene, intervalMs = 1000, logToConsole = false }: Props = $props();

	let snapshot = $state<DevMemorySnapshot | null>(null);

	$effect(() => {
		if (!scene) {
			snapshot = null;
			return;
		}

		function refresh() {
			if (!scene) return;
			snapshot = scene.getDevMemorySnapshot();
			if (logToConsole && snapshot) {
				logDevMemorySnapshot(snapshot);
			}
		}

		refresh();
		const timer = setInterval(refresh, intervalMs);
		return () => clearInterval(timer);
	});
</script>

<div
	class="pointer-events-none fixed top-2 left-2 z-[9999] max-w-[min(100vw-1rem,22rem)] rounded bg-black/80 px-2 py-1.5 font-mono text-[10px] leading-relaxed text-lime-300 shadow-lg"
>
	<div class="text-[9px] uppercase tracking-wide text-lime-400/80">Dev memory (1s)</div>
	{#if snapshot}
		<div>{formatDevMemorySnapshot(snapshot)}</div>
	{:else}
		<div class="text-white/50">Waiting for scene…</div>
	{/if}
	<div class="mt-1 text-[9px] text-white/50">GPU RAM not in JS — use browser Task Manager</div>
</div>
