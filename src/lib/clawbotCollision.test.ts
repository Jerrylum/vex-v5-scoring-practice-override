import { describe, expect, it } from 'vitest';
import { ROBOT_SIZE, isRobotInMidfield } from './fieldConstants';
import { clawbotOverlapsMidfield, transformClawbotFootprint } from './clawbotCollision';
import { CLAWBOT_FOOTPRINT_MAX_RING_VERTICES, CLAWBOT_LOCAL_FOOTPRINT } from './generated/clawbotFootprint';
import { ClawbotOnFieldCase } from './structure/RobotsStructure';
import type { RobotPlacement } from './ScenarioSnapshot';

function footprintPoints() {
	return CLAWBOT_LOCAL_FOOTPRINT.flat(2);
}

function bounds(points: number[][]) {
	const xs = points.map((point) => point[0]!);
	const zs = points.map((point) => point[1]!);
	return {
		minX: Math.min(...xs),
		maxX: Math.max(...xs),
		minZ: Math.min(...zs),
		maxZ: Math.max(...zs)
	};
}

describe('clawbot collision footprint', () => {
	it('provides a compact generated footprint', () => {
		expect(CLAWBOT_LOCAL_FOOTPRINT.length).toBeGreaterThan(0);
		const rings = CLAWBOT_LOCAL_FOOTPRINT.flat(1);
		const vertexCount = footprintPoints().length;

		expect(vertexCount).toBeGreaterThan(80);
		expect(vertexCount).toBeLessThanOrEqual(CLAWBOT_FOOTPRINT_MAX_RING_VERTICES + 1);
		for (const ring of rings) {
			expect(ring.length).toBeLessThanOrEqual(CLAWBOT_FOOTPRINT_MAX_RING_VERTICES + 1);
			expect(ring[0]).toEqual(ring.at(-1));
		}
	});

	it('detects obvious midfield overlap and non-overlap', () => {
		expect(clawbotOverlapsMidfield(0, 0, 0)).toBe(true);
		expect(clawbotOverlapsMidfield(0, 1100, 0)).toBe(false);
	});

	it('transforms the local footprint with robot placement coordinates', () => {
		const localBounds = bounds(footprintPoints());
		const transformed = transformClawbotFootprint(100, 200, Math.PI / 2);
		const transformedBounds = bounds(transformed.flat(2));

		expect(transformedBounds.minX).toBeCloseTo(100 + localBounds.minZ);
		expect(transformedBounds.maxX).toBeCloseTo(100 + localBounds.maxZ);
		expect(transformedBounds.minZ).toBeCloseTo(200 - localBounds.maxX);
		expect(transformedBounds.maxZ).toBeCloseTo(200 - localBounds.minX);
	});

	it('counts overlap from the generated footprint where the generic square misses midfield', () => {
		const x = -12;
		const z = -845;
		const rotationY = 0;

		expect(isRobotInMidfield(x, z, ROBOT_SIZE, rotationY)).toBe(false);
		expect(clawbotOverlapsMidfield(x, z, rotationY)).toBe(true);
	});

	it('falls back when polygon clipping cannot complete a detailed boundary intersection', () => {
		expect(() => clawbotOverlapsMidfield(407.5, 0, Math.PI / 2)).not.toThrow();
		expect(clawbotOverlapsMidfield(407.5, 0, Math.PI / 2)).toBe(true);
	});
});

describe('ClawbotOnFieldCase.getMidfieldCounts', () => {
	it('counts red and blue clawbots from serialized placements', () => {
		const placements: RobotPlacement[] = [
			{ alliance: 'red', slot: 0, x: 0, z: 0, rotationY: 0 },
			{ alliance: 'red', slot: 1, x: 0, z: 1200, rotationY: 0 },
			{ alliance: 'blue', slot: 0, x: -12, z: -845, rotationY: 0 },
			{ alliance: 'blue', slot: 1, x: 1400, z: 1400, rotationY: Math.PI / 2 }
		];

		expect(new ClawbotOnFieldCase(placements).getMidfieldCounts()).toEqual({ red: 1, blue: 1 });
	});
});
