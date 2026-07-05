<!-- Font Awesome Free 6.7.2 – chevron-right (solid). License: CC BY 4.0 -->
<script lang="ts">
	interface Props {
		size?: number;
		class?: string;
	}

	let { size = 16, class: className = '' }: Props = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={size} height={size} aria-hidden="true" class={className}>
	<path
		fill="currentColor"
		d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 288 105.4 182.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"
	/>
</svg>
