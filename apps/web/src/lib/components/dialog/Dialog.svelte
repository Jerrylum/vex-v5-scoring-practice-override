<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import Portal from 'svelte-portal';
	import { focusTrap } from '$lib/actions/focusTrap';

	interface Props {
		open: boolean;
		onClose: () => void;
		ariaLabelledBy?: string;
		contentClass?: ClassValue;
		children?: Snippet;
	}

	let { open, onClose, ariaLabelledBy, contentClass = '', children }: Props = $props();

	$effect(() => {
		if (!open) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	});
</script>

{#if open}
	<Portal target="body">
		<div
			class="fixed inset-0 z-50 flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby={ariaLabelledBy}
			tabindex="-1"
		>
			<button type="button" class="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-sm" aria-label="Close dialog" onclick={onClose}
			></button>
			<div
				class={[
					'relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-lg border border-gray-800 bg-[#0a0a0a] text-[#CDD7E1] shadow-xl',
					contentClass
				]}
				use:focusTrap
			>
				<div class="scoring-panel-scroll min-h-0 overflow-y-auto p-4">
					{@render children?.()}
				</div>
			</div>
		</div>
	</Portal>
{/if}
