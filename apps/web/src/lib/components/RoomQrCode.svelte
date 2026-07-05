<script lang="ts">
	import QRCode from 'qrcode';

	interface Props {
		url: string;
		size?: number;
	}

	let { url, size = 180 }: Props = $props();

	let dataUrl = $state<string | null>(null);
	let error = $state<string | null>(null);

	$effect(() => {
		let cancelled = false;
		dataUrl = null;
		error = null;

		void QRCode.toDataURL(url, {
			width: size,
			margin: 2,
			color: {
				dark: '#000000',
				light: '#ffffff'
			}
		})
			.then((result) => {
				if (!cancelled) dataUrl = result;
			})
			.catch(() => {
				if (!cancelled) error = 'Could not generate QR code.';
			});

		return () => {
			cancelled = true;
		};
	});
</script>

<div class="flex flex-col items-center">
	{#if dataUrl}
		<div class="rounded-lg bg-white p-3">
			<img src={dataUrl} alt="QR code to join this room" width={size} height={size} class="block" />
		</div>
		<p class="mt-2 text-center text-xs text-gray-500">Scan to join this room</p>
	{:else if error}
		<p class="text-xs text-red-400">{error}</p>
	{:else}
		<div class="rounded-lg bg-white p-3">
			<div class="animate-pulse bg-gray-200" style:width="{size}px" style:height="{size}px" aria-hidden="true"></div>
		</div>
	{/if}
</div>
