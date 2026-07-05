<!-- Font Awesome Free 6.7.2 – chevron-left (solid). License: CC BY 4.0 -->
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
		d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 214.6 182.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"
	/>
</svg>
