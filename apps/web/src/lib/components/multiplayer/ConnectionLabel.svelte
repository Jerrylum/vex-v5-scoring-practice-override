<script lang="ts">
	import { connectionLabelForState } from '$lib/multiplayer/connectionLabel';
	import { roomSession } from '$lib/multiplayer/roomSession.svelte';

	const connectionState = $derived(roomSession.connectionState);
	const label = $derived(connectionLabelForState(connectionState));
</script>

<div
	class="pointer-events-none absolute top-3 left-3 z-40 rounded-full px-3 py-1 text-xs font-semibold"
	class:bg-green-900={connectionState === 'connected'}
	class:text-green-200={connectionState === 'connected'}
	class:bg-yellow-900={connectionState === 'reconnecting' || connectionState === 'connecting'}
	class:text-yellow-200={connectionState === 'reconnecting' || connectionState === 'connecting'}
	class:bg-red-900={connectionState === 'error' || connectionState === 'offline'}
	class:text-red-200={connectionState === 'error' || connectionState === 'offline'}
>
	{label}
</div>
