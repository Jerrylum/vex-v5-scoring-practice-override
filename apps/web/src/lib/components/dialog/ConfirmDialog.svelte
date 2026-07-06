<script lang="ts">
	import Dialog from './Dialog.svelte';
	import { generateUUID } from '$lib/utils';

	type ConfirmTone = 'danger' | 'primary';

	interface Props {
		open: boolean;
		title: string;
		message?: string;
		confirmLabel?: string;
		cancelLabel?: string;
		/** Visual emphasis of the confirm button. Defaults to "danger". */
		tone?: ConfirmTone;
		busy?: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let { open, title, message = '', confirmLabel, cancelLabel, tone = 'danger', busy = false, onConfirm, onCancel }: Props = $props();

	let confirmButton = $state<HTMLButtonElement | null>(null);

	$effect(() => {
		if (!open || busy) return;
		queueMicrotask(() => confirmButton?.focus());
	});

	// Unique id so multiple confirm dialogs never share an aria-labelledby target.
	const titleId = `confirm-dialog-title-${generateUUID()}`;

	const buttonDisabledClass = 'disabled:cursor-not-allowed disabled:opacity-50';

	const CONFIRM_TONE_CLASS: Record<ConfirmTone, string> = {
		danger: 'cursor-pointer rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 ' + buttonDisabledClass,
		primary: 'cursor-pointer rounded-full bg-[#007fff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0066cc] ' + buttonDisabledClass
	};
</script>

<Dialog {open} onClose={onCancel} ariaLabelledBy={titleId} contentClass="max-w-md!">
	<div class="space-y-4">
		<h2 id={titleId} class="text-lg font-bold text-white">{title}</h2>
		{#if message}
			<p class="text-sm whitespace-pre-line text-gray-400">{message}</p>
		{/if}
		<div class="flex items-center justify-end gap-2 pt-1">
			<button
				type="button"
				class={['cursor-pointer rounded-full bg-[#32383E] px-4 py-2 text-sm text-[#CDD7E1] hover:bg-[#3d444b]', buttonDisabledClass]}
				disabled={busy}
				onclick={onCancel}
			>
				{cancelLabel ?? 'Cancel'}
			</button>
			<button type="button" bind:this={confirmButton} class={CONFIRM_TONE_CLASS[tone]} disabled={busy} onclick={onConfirm}>
				{confirmLabel ?? 'Confirm'}
			</button>
		</div>
	</div>
</Dialog>
