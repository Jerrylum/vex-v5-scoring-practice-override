import { describe, expect, it } from 'vitest';
import { diffSectionPatch, mergeNestedPatch, removeOverlappingPatch } from './patch';

type SampleDoc = {
	sectionA: { x: number; y: number };
	sectionB: { z: number };
};

type SampleDoc2 = {
	sectionA: { x: { a: number; b: number }; y: number };
};

describe('mergeNestedPatch', () => {
	it('merges different fields in the same section without clobbering', () => {
		const base: SampleDoc = { sectionA: { x: 0, y: 0 }, sectionB: { z: 0 } };
		const afterX = mergeNestedPatch(base, { sectionA: { x: 1 } });
		const afterBoth = mergeNestedPatch(afterX, { sectionA: { y: 2 } });

		expect(afterBoth.sectionA).toEqual({ x: 1, y: 2 });
	});

	it('last write wins for the same field', () => {
		const base: SampleDoc = { sectionA: { x: 0, y: 0 }, sectionB: { z: 0 } };
		const first = mergeNestedPatch(base, { sectionA: { x: 1 } });
		const second = mergeNestedPatch(first, { sectionA: { x: 3 } });

		expect(second.sectionA.x).toBe(3);
	});

	it('accumulates partial patches before flush', () => {
		const merged = mergeNestedPatch<SampleDoc>(
			{ sectionA: { x: 1 } },
			{ sectionA: { y: 2 }, sectionB: { z: 1 } }
		);

		expect(merged).toEqual({
			sectionA: { x: 1, y: 2 },
			sectionB: { z: 1 }
		});
	});
});

describe('diffSectionPatch', () => {
	it('returns null when nothing changed', () => {
		const section = { x: 1, y: 2 };
		expect(diffSectionPatch('sectionA', section, section)).toBeNull();
	});

	it('wraps changed fields under the section key', () => {
		expect(diffSectionPatch('sectionA', { x: 0, y: 0 }, { x: 1, y: 0 })).toEqual({
			sectionA: { x: 1 }
		});
	});
});

describe('removeOverlappingPatch', () => {
	it('removes only fields present in the applied patch', () => {
		const pending = {
			sectionA: { x: 2, y: 1 },
			sectionB: { z: 1 }
		};
		const remaining = removeOverlappingPatch<SampleDoc>(pending, { sectionA: { x: 1 } });

		expect(remaining).toEqual({
			sectionA: { y: 1 },
			sectionB: { z: 1 }
		});
	});

	it('returns null when all pending fields were applied remotely', () => {
		const pending = { sectionA: { x: 1 } };
		expect(removeOverlappingPatch<SampleDoc>(pending, { sectionA: { x: 1 } })).toBeNull();
	});
});
