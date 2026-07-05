const FOCUSABLE = [
	'a[href]',
	'area[href]',
	'button:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])',
	'[contenteditable="true"]'
].join(', ');

/**
 * Svelte action that traps keyboard focus within a container.
 *
 * On mount the first focusable element receives focus. Tab / Shift+Tab wrap
 * around so focus never leaves the node. When the node is destroyed, focus is
 * restored to whatever element was focused before the trap took over.
 */
export function focusTrap(node: HTMLElement) {
	function isVisible(el: HTMLElement): boolean {
		const style = window.getComputedStyle(el);
		return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0 && el.offsetHeight > 0;
	}

	function getFocusable(): HTMLElement[] {
		return [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(isVisible);
	}

	function focusFirst() {
		getFocusable()[0]?.focus();
	}

	function focusLast() {
		const focusable = getFocusable();
		focusable[focusable.length - 1]?.focus();
	}

	// Remember what had focus before the trap took over, so we can restore it later.
	const previouslyFocused = document.activeElement as HTMLElement | null;

	focusFirst();

	function handleTabKeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;

		const focusable = getFocusable();
		if (!focusable.length) {
			e.preventDefault();
			node.focus();
			return;
		}

		const activeElement = document.activeElement as HTMLElement | null;
		const focusIsInsideTrap = activeElement ? node.contains(activeElement) : false;
		const firstEl = focusable[0];
		const lastEl = focusable[focusable.length - 1];

		// If focus somehow escaped outside the trap, immediately redirect it based
		// on tab direction. This closes a leak where tabbing can continue behind
		// the dialog until focus naturally comes back.
		if (!focusIsInsideTrap) {
			e.preventDefault();
			if (e.shiftKey) focusLast();
			else focusFirst();
			return;
		}

		if (e.shiftKey) {
			if (document.activeElement === firstEl) {
				e.preventDefault();
				lastEl.focus();
			}
		} else {
			if (document.activeElement === lastEl) {
				e.preventDefault();
				firstEl.focus();
			}
		}
	}

	function handleFocusIn(e: FocusEvent) {
		const target = e.target as Node | null;
		if (target && !node.contains(target)) {
			focusFirst();
		}
	}

	// Use capture-phase document listeners so tab navigation is trapped even
	// when focus starts outside of the dialog node.
	document.addEventListener('keydown', handleTabKeydown, true);
	document.addEventListener('focusin', handleFocusIn, true);

	return {
		destroy() {
			document.removeEventListener('keydown', handleTabKeydown, true);
			document.removeEventListener('focusin', handleFocusIn, true);
			if (previouslyFocused && previouslyFocused.isConnected && typeof previouslyFocused.focus === 'function') {
				previouslyFocused.focus();
			}
		}
	};
}
