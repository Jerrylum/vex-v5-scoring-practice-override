<script lang="ts">
	interface Props {
		onSingleplayer: () => void;
		onSettings: () => void;
	}

	let { onSingleplayer, onSettings }: Props = $props();
</script>

<div class="relative z-10 flex h-screen w-screen flex-col items-center justify-center bg-black px-6 text-[#CDD7E1]">
	<h1 class="mb-2 text-3xl font-bold text-white">VEX V5 Scoring Practice</h1>
	<p class="mb-10 text-sm text-gray-400">Override — Head-to-Head</p>

	<div class="flex w-full max-w-sm flex-col gap-3">
		<button
			type="button"
			class="cursor-pointer rounded-full bg-[#007fff] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0066cc]"
			onclick={onSingleplayer}
		>
			Singleplayer
		</button>
		<button
			type="button"
			class="cursor-not-allowed rounded-full border border-gray-700 bg-[#141414] px-6 py-3 text-sm font-semibold text-gray-500"
			disabled
			title="Coming soon"
		>
			Multiplayer (coming soon)
		</button>
		<button
			type="button"
			class="cursor-pointer rounded-full border border-[#dde7ee] bg-transparent px-6 py-3 text-sm font-semibold text-[#CDD7E1] transition-colors hover:bg-[#141414]"
			onclick={onSettings}
		>
			Settings
		</button>
	</div>
</div>
