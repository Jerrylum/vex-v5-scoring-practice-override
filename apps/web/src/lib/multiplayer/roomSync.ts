import type { UserScenarioScoring } from '@vex-v5-override/protocol';

/** Ignore stale broadcasts (e.g. out-of-order or duplicate) after we already applied a newer revision. */
export function shouldApplyRemoteRevision(incomingRevision: number, lastAppliedRevision: number): boolean {
	return incomingRevision >= lastAppliedRevision;
}

/** Coalesce rapid scoring edits before sending updateScoring mutations to the room. */
export function createDebouncedScoringUpdate(
	flush: (scoring: UserScenarioScoring) => Promise<void>,
	delayMs = 200
) {
	let timer: ReturnType<typeof setTimeout> | null = null;
	let pending: UserScenarioScoring | null = null;

	return {
		schedule(scoring: UserScenarioScoring) {
			pending = scoring;
			if (timer !== null) clearTimeout(timer);
			timer = setTimeout(() => {
				timer = null;
				const toFlush = pending;
				pending = null;
				if (toFlush) void flush(toFlush);
			}, delayMs);
		},
		async flushNow() {
			if (timer !== null) {
				clearTimeout(timer);
				timer = null;
			}
			const toFlush = pending;
			pending = null;
			if (toFlush) await flush(toFlush);
		},
		cancel() {
			if (timer !== null) clearTimeout(timer);
			timer = null;
			pending = null;
		}
	};
}
