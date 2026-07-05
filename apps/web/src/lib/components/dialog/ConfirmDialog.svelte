<script lang="ts">
	import Dialog from './Dialog.svelte';

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

	// Unique id so multiple confirm dialogs never share an aria-labelledby target.
	const titleId = `confirm-dialog-title-${crypto.randomUUID()}`;

	const CONFIRM_TONE_CLASS: Record<ConfirmTone, string> = {
		danger: 'border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-red-700 hover:text-white',
		primary: 'btn-primary'
	};
</script>

<Dialog {open} onClose={onCancel} ariaLabelledBy={titleId} contentClass="max-w-md">
	<div class="space-y-3">
		<h3 id={titleId} class="text-base font-semibold">{title}</h3>
		{#if message}
			<p class="text-sm whitespace-pre-line text-gray-600">{message}</p>
		{/if}
		<div class="flex items-center justify-end gap-2 pt-1">
			<button type="button" class="btn" disabled={busy} onclick={onCancel}>
				{cancelLabel ?? 'Cancel'}
			</button>
			<button type="button" class={['btn', CONFIRM_TONE_CLASS[tone]]} disabled={busy} onclick={onConfirm}>
				{confirmLabel ?? 'Confirm'}
			</button>
		</div>
	</div>
</Dialog>
