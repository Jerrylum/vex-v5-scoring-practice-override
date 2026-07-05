export interface ConfirmRequestOptions {
	title: string;
	message: string;
	confirmLabel: string;
	onConfirm: () => void | Promise<void>;
}
