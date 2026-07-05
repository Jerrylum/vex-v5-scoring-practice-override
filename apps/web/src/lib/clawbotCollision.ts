import polygonClipping, { type MultiPolygon, type Polygon, type Ring } from 'polygon-clipping';
import { MIDFIELD_POLYGON } from './fieldConstants';
import { CLAWBOT_LOCAL_FOOTPRINT } from './generated/clawbotFootprint';

const { intersection } = polygonClipping;

export type FootprintPoint = [x: number, z: number];

function transformPoint([localX, localZ]: FootprintPoint, x: number, z: number, rotationY: number): FootprintPoint {
	const cos = Math.cos(rotationY);
	const sin = Math.sin(rotationY);
	return [x + localX * cos + localZ * sin, z - localX * sin + localZ * cos];
}

function transformRing(ring: Ring, x: number, z: number, rotationY: number): Ring {
	return ring.map((point) => transformPoint(point, x, z, rotationY));
}

function transformPolygon(polygon: Polygon, x: number, z: number, rotationY: number): Polygon {
	return polygon.map((ring) => transformRing(ring, x, z, rotationY));
}

export function transformClawbotFootprint(x: number, z: number, rotationY: number): MultiPolygon {
	return CLAWBOT_LOCAL_FOOTPRINT.map((polygon) => transformPolygon(polygon, x, z, rotationY));
}

function midfieldAsPolygon(): Polygon {
	const ring = MIDFIELD_POLYGON.map(({ x, z }) => [x, z] satisfies FootprintPoint);
	return [[...ring, ring[0]!]];
}

function hasArea(multiPolygon: MultiPolygon): boolean {
	return multiPolygon.some((polygon) => polygon.some((ring) => ring.length >= 4));
}

function cross(origin: FootprintPoint, a: FootprintPoint, b: FootprintPoint): number {
	return (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0]);
}

function pointOnSegment(point: FootprintPoint, a: FootprintPoint, b: FootprintPoint): boolean {
	return (
		Math.abs(cross(a, b, point)) < 1e-9 &&
		point[0] >= Math.min(a[0], b[0]) &&
		point[0] <= Math.max(a[0], b[0]) &&
		point[1] >= Math.min(a[1], b[1]) &&
		point[1] <= Math.max(a[1], b[1])
	);
}

function pointInRing(point: FootprintPoint, ring: Ring): boolean {
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const a = ring[i]!;
		const b = ring[j]!;
		if (pointOnSegment(point, a, b)) {
			return true;
		}
		if (a[1] > point[1] !== b[1] > point[1] && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]) {
			inside = !inside;
		}
	}
	return inside;
}

function segmentsIntersect(a1: FootprintPoint, a2: FootprintPoint, b1: FootprintPoint, b2: FootprintPoint): boolean {
	const d1 = cross(a1, a2, b1);
	const d2 = cross(a1, a2, b2);
	const d3 = cross(b1, b2, a1);
	const d4 = cross(b1, b2, a2);

	if (d1 * d2 < 0 && d3 * d4 < 0) {
		return true;
	}
	return pointOnSegment(b1, a1, a2) || pointOnSegment(b2, a1, a2) || pointOnSegment(a1, b1, b2) || pointOnSegment(a2, b1, b2);
}

function ringsOverlap(a: Ring, b: Ring): boolean {
	return (
		a.some((point) => pointInRing(point, b)) ||
		b.some((point) => pointInRing(point, a)) ||
		a.some((a1, i) => b.some((b1, j) => segmentsIntersect(a1, a[(i + 1) % a.length]!, b1, b[(j + 1) % b.length]!)))
	);
}

function footprintOverlapsMidfieldByRings(footprint: MultiPolygon): boolean {
	const midfieldRing = midfieldAsPolygon()[0]!;
	return footprint.some(([outer]) => outer && ringsOverlap(outer, midfieldRing));
}

export function clawbotOverlapsMidfield(x: number, z: number, rotationY: number): boolean {
	const footprint = transformClawbotFootprint(x, z, rotationY);
	try {
		return hasArea(intersection(footprint, midfieldAsPolygon())) || footprintOverlapsMidfieldByRings(footprint);
	} catch {
		return footprintOverlapsMidfieldByRings(footprint);
	}
}
