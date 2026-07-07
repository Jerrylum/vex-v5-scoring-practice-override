import { mergeNestedPatch, removeOverlappingPatch, type ScoringPatch, type UserScenarioScoring } from '@vex-v5-override/protocol';

/** Ignore stale broadcasts (e.g. out-of-order or duplicate) after we already applied a newer revision. */
export function shouldApplyRemoteRevision(incomingRevision: number, lastAppliedRevision: number): boolean {
	return incomingRevision >= lastAppliedRevision;
}

/** Coalesce rapid scoring patch edits before sending updateScoring notifications to the room. */
export function createDebouncedScoringPatchUpdate(flush: (patch: ScoringPatch) => void, delayMs = 200) {
	let timer: ReturnType<typeof setTimeout> | null = null;
	let pending: ScoringPatch | null = null;

	return {
		schedule(patch: ScoringPatch) {
			pending = pending ? mergeNestedPatch(pending, patch) : patch;
			if (timer !== null) clearTimeout(timer);
			timer = setTimeout(() => {
				timer = null;
				const toFlush = pending;
				pending = null;
				if (toFlush) flush(toFlush);
			}, delayMs);
		},
		flushNow() {
			if (timer !== null) {
				clearTimeout(timer);
				timer = null;
			}
			const toFlush = pending;
			pending = null;
			if (toFlush) flush(toFlush);
		},
		removeOverlapping(applied: ScoringPatch) {
			if (!pending) return;
			pending = removeOverlappingPatch<UserScenarioScoring>(pending, applied);
		},
		cancel() {
			if (timer !== null) clearTimeout(timer);
			timer = null;
			pending = null;
		}
	};
}
