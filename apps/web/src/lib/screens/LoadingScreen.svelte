<script lang="ts">
	interface Props {
		message?: string;
	}

	let { message = 'Loading...' }: Props = $props();
</script>

<div class="relative z-10 flex h-screen w-screen items-center justify-center text-white">
	<div class="mx-auto w-full max-w-md rounded-lg bg-black/50 p-6 text-center backdrop-blur-sm">
		<p class="text-lg">{message}</p>
	</div>
</div>
