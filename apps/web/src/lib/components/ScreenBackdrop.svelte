<script lang="ts">
	import background from '$lib/assets/background.jpg';

	interface Props {
		overlayClass?: string;
	}

	let { overlayClass = 'bg-black/40' }: Props = $props();
</script>

<div class="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
	<img src={background} alt="" class="h-full w-full object-cover" />
	<div class="absolute inset-0 {overlayClass}"></div>
</div>
