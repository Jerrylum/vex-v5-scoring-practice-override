/** Two-level object: top-level sections with flat field records. */
export type NestedRecord = Record<string, Record<string, unknown>>;

export type SectionedPatch<T extends NestedRecord> = {
	[K in keyof T]?: Partial<T[K]>;
};

/** Shallow diff of flat field changes between two section snapshots. */
export function diffShallow<T extends Record<string, unknown>>(previous: T, next: T): Partial<T> | null {
	const partial: Partial<T> = {};
	for (const key of Object.keys(next) as (keyof T)[]) {
		if (previous[key] !== next[key]) {
			partial[key] = next[key];
		}
	}
	return Object.keys(partial).length > 0 ? partial : null;
}

/** Wrap a section diff as a single-key nested patch. */
export function diffSectionPatch<T extends NestedRecord, K extends keyof T>(key: K, previous: T[K], next: T[K]): SectionedPatch<T> | null {
	const partial = diffShallow(previous, next);
	return partial ? ({ [key]: partial } as SectionedPatch<T>) : null;
}

/**
 * Merge a sectioned patch into a full or partial base document.
 * Each section is shallow-merged; unset sections are left unchanged.
 */
export function mergeNestedPatch<T extends NestedRecord>(base: T, patch: SectionedPatch<T>): T;
export function mergeNestedPatch<T extends NestedRecord>(base: SectionedPatch<T>, patch: SectionedPatch<T>): SectionedPatch<T>;
export function mergeNestedPatch<T extends NestedRecord>(base: T | SectionedPatch<T>, patch: SectionedPatch<T>): T | SectionedPatch<T> {
	const result = { ...base };

	for (const key of Object.keys(patch) as (keyof T)[]) {
		const sectionPatch = patch[key];
		if (sectionPatch === undefined) continue;

		const baseSection = result[key];
		result[key] = baseSection ? ({ ...baseSection, ...sectionPatch } as T[typeof key]) : (sectionPatch as T[typeof key]);
	}

	return result;
}

/** Drop pending section fields that were superseded by a remote patch. */
export function removeOverlappingPatch<T extends NestedRecord>(
	pending: SectionedPatch<T>,
	applied: SectionedPatch<T>
): SectionedPatch<T> | null {
	const result: SectionedPatch<T> = { ...pending };
	let hasContent = false;

	for (const key of Object.keys(result) as (keyof T)[]) {
		const pendingSection = result[key];
		if (!pendingSection) continue;

		const appliedSection = applied[key];
		if (!appliedSection) {
			hasContent = true;
			continue;
		}

		const nextSection = { ...pendingSection } as Record<string, unknown>;
		for (const field of Object.keys(appliedSection)) {
			delete nextSection[field];
		}

		if (Object.keys(nextSection).length === 0) {
			delete result[key];
		} else {
			result[key] = nextSection as SectionedPatch<T>[typeof key];
			hasContent = true;
		}
	}

	return hasContent ? result : null;
}
