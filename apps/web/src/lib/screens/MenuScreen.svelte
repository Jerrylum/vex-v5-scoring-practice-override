<script lang="ts">
	interface Props {
		onSingleplayer: () => void;
		onMultiplayer: () => void;
		onSettings: () => void;
	}

	let { onSingleplayer, onMultiplayer, onSettings }: Props = $props();
</script>

<div class="relative z-10 flex h-screen w-screen flex-col items-center justify-center px-6 text-[#CDD7E1]">
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
			class="cursor-pointer rounded-full border border-[#007fff] bg-[#141414]/90 px-6 py-3 text-sm font-semibold text-[#CDD7E1] transition-colors hover:bg-[#1a1a1a]"
			onclick={onMultiplayer}
		>
			Multiplayer
		</button>
		<button
			type="button"
			class="cursor-pointer rounded-full border border-[#dde7ee] bg-black/30 px-6 py-3 text-sm font-semibold text-[#CDD7E1] backdrop-blur-sm transition-colors hover:bg-[#141414]/80"
			onclick={onSettings}
		>
			Settings
		</button>
	</div>
</div>
