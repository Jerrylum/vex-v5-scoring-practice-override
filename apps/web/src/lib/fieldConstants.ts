/**
 * Field geometry, robot footprint math, and placement/overlap helpers.
 *
 * All horizontal coordinates are in millimeters on the XZ plane (Y is up).
 * Robot footprints are 18" squares modeled as oriented boxes; corner math matches
 * Three.js Y-axis rotation on clawbot / footprint containers.
 */
import * as THREE from 'three';
import { FT, ROBOT_MAX_SIZE, TILE } from './utils';

/** Square field size per game spec (mm). */
export const FIELD_SIZE = 3570;
export const FIELD_HALF = FIELD_SIZE / 2;

/** Contact height for pins, cups, and robot floor (mm). */
export const ROBOT_FLOOR_Y = 17.7;

/** 18" robot cube edge length (mm). */
export const ROBOT_SIZE = ROBOT_MAX_SIZE;

/** Vertical spacing between stacked pins/cups in a goal (mm). */
export const PIN_STACK_STEP = 88;

/** PartiallyCoveredCup pose defaults (Q&A 3175 training scenario). */
export const PARTIAL_COVER_OFFSET_Y_MM = 45;
export const PARTIAL_COVER_TILT_RAD = (160 * Math.PI) / 180;
export const PARTIAL_COVER_PROBABILITY = 0.2;

/** PartialPlacedPin pose when hard stacks end in a pin (10% chance). */
export const PARTIAL_PLACED_PIN_OFFSET_Y_MM = 25;
export const PARTIAL_PLACED_PIN_TILT_RAD = (160 * Math.PI) / 180;
/** Horizontal shift opposite pin lean (positive mm); uses container tilt, not model flip. */
export const PARTIAL_PLACED_PIN_BACKOFF_MM = 16;
export const PARTIAL_PLACED_PIN_PROBABILITY = 0.1;

/** Keep-away distance from goal centers and fixed field elements (mm). */
export const EXCLUSION_BUFFER = 200;

/** Pin dimensions per game manual (~3.15" dia × 6.5" tall). */
export const PIN_DIAMETER_MM = 80;
export const PIN_LENGTH_MM = 164.5;

/** Shared dimensions for scattered pins and cups lying on the field (~6.5" × 3.15"). */
export const SCATTERED_OBJECT_DIAMETER_MM = PIN_DIAMETER_MM;
export const SCATTERED_OBJECT_LENGTH_MM = PIN_LENGTH_MM;

/** Circle collision radius for scattered pins/cups lying on their side (rotation.x = 90°). */
export const SCATTERED_PLACEMENT_RADIUS = SCATTERED_OBJECT_LENGTH_MM / 2 + 10;

/** Base position of the first YY pin in the midfield goal stack. */
export const MIDFIELD_GOAL_BASE = new THREE.Vector3(0, 145, 0);

/** Goal and fixed field element centers robots must not overlap (x, z in mm). */
export const EXCLUSION_ZONES: ReadonlyArray<{ x: number; z: number }> = [
	{ x: 0, z: 0 },
	{ x: 2 * TILE, z: 1 * TILE },
	{ x: 1 * TILE, z: 2 * TILE },
	{ x: -1 * TILE, z: 2 * TILE },
	{ x: -2 * TILE, z: 1 * TILE },
	{ x: -2 * TILE, z: -1 * TILE },
	{ x: -1 * TILE, z: -2 * TILE },
	{ x: 1 * TILE, z: -2 * TILE },
	{ x: 2 * TILE, z: -1 * TILE },
	{ x: 6 * FT, z: 5 * FT },
	{ x: -6 * FT, z: 5 * FT },
	{ x: -6 * FT, z: -5 * FT },
	{ x: 6 * FT, z: -5 * FT }
];

/**
 * Midfield diamond vertices in XZ (mm), centered at origin.
 * Matches the yellow debug highlight and SC6 vertical projection.
 */
export const MIDFIELD_POLYGON: ReadonlyArray<{ x: number; z: number }> = [
	{ x: 0, z: -2.005 * FT },
	{ x: 2.005 * FT, z: 0 },
	{ x: 0, z: 2.005 * FT },
	{ x: -2.005 * FT, z: 0 }
];

type Point2D = { x: number; z: number };
type AABB = { minX: number; maxX: number; minZ: number; maxZ: number };

/** Strict center-point test (|dx| < buffer). Used for quick point queries only. */
function isPointInExclusionZone(x: number, z: number): boolean {
	for (const zone of EXCLUSION_ZONES) {
		if (Math.abs(x - zone.x) < EXCLUSION_BUFFER && Math.abs(z - zone.z) < EXCLUSION_BUFFER) {
			return true;
		}
	}
	return false;
}

/** Axis-aligned center check (ignores rotation). Prefer {@link isRobotWithinField} for placement. */
export function isWithinField(x: number, z: number, robotSize = ROBOT_SIZE): boolean {
	const half = robotSize / 2;
	return x - half >= -FIELD_HALF && x + half <= FIELD_HALF && z - half >= -FIELD_HALF && z + half <= FIELD_HALF;
}

/** Center-point check (ignores rotation). Prefer {@link isRobotInExclusionZone} for placement. */
export function isInExclusionZone(x: number, z: number): boolean {
	return isPointInExclusionZone(x, z);
}

/**
 * World-space corners of the robot's oriented square footprint.
 * Rotation matches Three.js Y-axis rotation on clawbot containers.
 */
export function getRobotFootprintCorners(x: number, z: number, size: number, rotationY: number): Point2D[] {
	const half = size / 2;
	const cos = Math.cos(rotationY);
	const sin = Math.sin(rotationY);
	const localCorners: Point2D[] = [
		{ x: -half, z: -half },
		{ x: half, z: -half },
		{ x: half, z: half },
		{ x: -half, z: half }
	];
	return localCorners.map((c) => ({
		x: x + c.x * cos + c.z * sin,
		z: z - c.x * sin + c.z * cos
	}));
}

/** True when every footprint corner lies inside the field perimeter. */
export function isRobotWithinField(x: number, z: number, rotationY: number, robotSize = ROBOT_SIZE): boolean {
	const corners = getRobotFootprintCorners(x, z, robotSize, rotationY);
	return corners.every((c) => c.x >= -FIELD_HALF && c.x <= FIELD_HALF && c.z >= -FIELD_HALF && c.z <= FIELD_HALF);
}

/** Axis-aligned keep-away square for one exclusion zone center. Inclusive bounds. */
function getExclusionAABB(zone: Point2D): AABB {
	return {
		minX: zone.x - EXCLUSION_BUFFER,
		maxX: zone.x + EXCLUSION_BUFFER,
		minZ: zone.z - EXCLUSION_BUFFER,
		maxZ: zone.z + EXCLUSION_BUFFER
	};
}

/** Four corners of an AABB in winding order (for edge intersection tests). */
function getAABBCorners(aabb: AABB): Point2D[] {
	return [
		{ x: aabb.minX, z: aabb.minZ },
		{ x: aabb.maxX, z: aabb.minZ },
		{ x: aabb.maxX, z: aabb.maxZ },
		{ x: aabb.minX, z: aabb.maxZ }
	];
}

function aabbOverlap(a: AABB, b: AABB): boolean {
	return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

/** Inverse of {@link getRobotFootprintCorners}: test a world point against the oriented square. */
function isPointInRobotFootprint(px: number, pz: number, centerX: number, centerZ: number, size: number, rotationY: number): boolean {
	const dx = px - centerX;
	const dz = pz - centerZ;
	const cos = Math.cos(rotationY);
	const sin = Math.sin(rotationY);
	const localX = dx * cos - dz * sin;
	const localZ = dx * sin + dz * cos;
	const half = size / 2;
	return Math.abs(localX) <= half && Math.abs(localZ) <= half;
}

function isPointInAABB(px: number, pz: number, aabb: AABB): boolean {
	return px >= aabb.minX && px <= aabb.maxX && pz >= aabb.minZ && pz <= aabb.maxZ;
}

/**
 * Narrow-phase overlap between an oriented robot square and an axis-aligned rectangle.
 *
 * Each test covers a distinct configuration (together they are complete for convex shapes):
 * 1. Robot center inside the rectangle — catches center-on-goal with corners outside buffer
 * 2. Robot corner inside the rectangle — catches tip-in without center inside
 * 3. Rectangle corner inside robot — catches robot swallowing part of the zone
 * 4. Edge intersection — catches grazing contact with no vertices inside either shape
 */
function robotFootprintOverlapsAABB(x: number, z: number, size: number, rotationY: number, corners: Point2D[], aabb: AABB): boolean {
	if (isPointInAABB(x, z, aabb)) {
		return true;
	}
	if (corners.some((c) => isPointInAABB(c.x, c.z, aabb))) {
		return true;
	}
	if (getAABBCorners(aabb).some((c) => isPointInRobotFootprint(c.x, c.z, x, z, size, rotationY))) {
		return true;
	}
	return robotEdgesIntersectPolygon(corners, getAABBCorners(aabb));
}

/**
 * True when the oriented robot footprint overlaps any exclusion zone.
 * Used during robot placement to keep robots away from goals and fixed field elements.
 */
export function isRobotInExclusionZone(x: number, z: number, rotationY: number, robotSize = ROBOT_SIZE): boolean {
	const corners = getRobotFootprintCorners(x, z, robotSize, rotationY);
	const robotAABB = getRobotAABB(x, z, robotSize, rotationY);

	for (const zone of EXCLUSION_ZONES) {
		const ex = getExclusionAABB(zone);
		// Broad-phase: skip when axis-aligned bounds cannot touch.
		if (!aabbOverlap(robotAABB, ex)) {
			continue;
		}
		if (robotFootprintOverlapsAABB(x, z, robotSize, rotationY, corners, ex)) {
			return true;
		}
	}

	return false;
}

/**
 * Max |x| or |z| for robot center so any rotation keeps the full footprint inside the field.
 * Uses half-diagonal because a rotated square extends farthest at 45°.
 */
export function maxRobotCenterOffset(robotSize = ROBOT_SIZE): number {
	const halfDiagonal = (robotSize / 2) * Math.SQRT2;
	return FIELD_HALF - halfDiagonal;
}

/** Ray-cast point-in-polygon test (XZ plane). */
function pointInPolygon(px: number, pz: number, polygon: ReadonlyArray<Point2D>): boolean {
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i].x;
		const zi = polygon[i].z;
		const xj = polygon[j].x;
		const zj = polygon[j].z;
		const intersects = zi > pz !== zj > pz && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi;
		if (intersects) {
			inside = !inside;
		}
	}
	return inside;
}

/** Axis-aligned bounds of a polygon (for broad-phase culling). */
function getPolygonAABB(polygon: ReadonlyArray<Point2D>): AABB {
	let minX = Infinity;
	let maxX = -Infinity;
	let minZ = Infinity;
	let maxZ = -Infinity;
	for (const v of polygon) {
		minX = Math.min(minX, v.x);
		maxX = Math.max(maxX, v.x);
		minZ = Math.min(minZ, v.z);
		maxZ = Math.max(maxZ, v.z);
	}
	return { minX, maxX, minZ, maxZ };
}

function getRobotAABB(x: number, z: number, size: number, rotationY: number): AABB {
	const corners = getRobotFootprintCorners(x, z, size, rotationY);
	return {
		minX: Math.min(...corners.map((c) => c.x)),
		maxX: Math.max(...corners.map((c) => c.x)),
		minZ: Math.min(...corners.map((c) => c.z)),
		maxZ: Math.max(...corners.map((c) => c.z))
	};
}

function cross2d(ox: number, oz: number, ax: number, az: number, bx: number, bz: number): number {
	return (ax - ox) * (bz - oz) - (az - oz) * (bx - ox);
}

/** True when two line segments properly intersect (excluding collinear edge cases). */
function segmentsIntersect(a1: Point2D, a2: Point2D, b1: Point2D, b2: Point2D): boolean {
	const d1 = cross2d(a1.x, a1.z, a2.x, a2.z, b1.x, b1.z);
	const d2 = cross2d(a1.x, a1.z, a2.x, a2.z, b2.x, b2.z);
	const d3 = cross2d(b1.x, b1.z, b2.x, b2.z, a1.x, a1.z);
	const d4 = cross2d(b1.x, b1.z, b2.x, b2.z, a2.x, a2.z);
	return d1 * d2 < 0 && d3 * d4 < 0;
}

/** Test whether any edge of the robot square crosses any edge of a polygon. */
function robotEdgesIntersectPolygon(corners: ReadonlyArray<Point2D>, polygon: ReadonlyArray<Point2D>): boolean {
	for (let i = 0; i < corners.length; i++) {
		const a1 = corners[i];
		const a2 = corners[(i + 1) % corners.length];
		for (let j = 0; j < polygon.length; j++) {
			const b1 = polygon[j];
			const b2 = polygon[(j + 1) % polygon.length];
			if (segmentsIntersect(a1, a2, b1, b2)) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Narrow-phase overlap between oriented robot square and midfield diamond.
 * Same four-case pattern as {@link robotFootprintOverlapsAABB}, but against a convex polygon.
 */
function robotFootprintOverlapsMidfield(x: number, z: number, size: number, rotationY: number, corners: Point2D[]): boolean {
	if (pointInPolygon(x, z, MIDFIELD_POLYGON)) {
		return true;
	}
	if (corners.some((c) => pointInPolygon(c.x, c.z, MIDFIELD_POLYGON))) {
		return true;
	}
	if (MIDFIELD_POLYGON.some((v) => isPointInRobotFootprint(v.x, v.z, x, z, size, rotationY))) {
		return true;
	}
	return robotEdgesIntersectPolygon(corners, MIDFIELD_POLYGON);
}

/**
 * True when any part of the robot overlaps the midfield vertical projection (<SC6>).
 * Used for yellow-pin ownership via {@link RobotsStructure.getMidfieldCounts}.
 */
export function isRobotInMidfield(x: number, z: number, size: number, rotationY: number): boolean {
	const corners = getRobotFootprintCorners(x, z, size, rotationY);
	const robotAABB = getRobotAABB(x, z, size, rotationY);
	const midfieldAABB = getPolygonAABB(MIDFIELD_POLYGON);

	if (!aabbOverlap(robotAABB, midfieldAABB)) {
		return false;
	}

	return robotFootprintOverlapsMidfield(x, z, size, rotationY, corners);
}

/** True when a scattered pin/cup circular footprint fits fully inside the field perimeter. */
export function isScatteredObjectWithinField(x: number, z: number, radius = SCATTERED_PLACEMENT_RADIUS): boolean {
	return x - radius >= -FIELD_HALF && x + radius <= FIELD_HALF && z - radius >= -FIELD_HALF && z + radius <= FIELD_HALF;
}

/** True when a scattered pin/cup overlaps any exclusion zone (conservative AABB test). */
export function isScatteredObjectInExclusionZone(x: number, z: number, radius = SCATTERED_PLACEMENT_RADIUS): boolean {
	for (const zone of EXCLUSION_ZONES) {
		if (Math.abs(x - zone.x) < EXCLUSION_BUFFER + radius && Math.abs(z - zone.z) < EXCLUSION_BUFFER + radius) {
			return true;
		}
	}
	return false;
}

/** Max |x| or |z| for object center so the lying footprint stays inside the field at any rotationZ. */
export function maxScatteredCenterOffset(objectDiameter = SCATTERED_PLACEMENT_RADIUS * 2): number {
	return maxRobotCenterOffset(objectDiameter);
}

/**
 * Convert a lying pin/cup field center (x, z) to container position.
 * PinObject/CupObject anchor the vertical bottom at container origin; scattered objects rotate
 * rotation.x = 90° so that anchor becomes one end, not the geometric center.
 */
export function scatteredObjectContainerPosition(centerX: number, centerZ: number, rotationZ: number): THREE.Vector3 {
	const centerOffset = new THREE.Vector3(0, SCATTERED_OBJECT_LENGTH_MM / 2, 0);
	centerOffset.applyEuler(new THREE.Euler(Math.PI / 2, 0, rotationZ, 'XYZ'));
	return new THREE.Vector3(centerX - centerOffset.x, ROBOT_FLOOR_Y + SCATTERED_OBJECT_DIAMETER_MM / 2, centerZ - centerOffset.z);
}

export function scatteredObjectContainerRotation(rotationZ: number): THREE.Euler {
	return new THREE.Euler(Math.PI / 2, 0, rotationZ, 'XYZ');
}

/** True when two scattered pin/cup footprints overlap. */
export function scatteredObjectsOverlap(x1: number, z1: number, x2: number, z2: number, radius = SCATTERED_PLACEMENT_RADIUS): boolean {
	const dx = x1 - x2;
	const dz = z1 - z2;
	const minDistance = radius * 2;
	return dx * dx + dz * dz < minDistance * minDistance;
}

/** True when a scattered pin/cup overlaps any robot footprint. */
export function scatteredObjectOverlapsAnyRobot(
	x: number,
	z: number,
	robots: ReadonlyArray<{ x: number; z: number; rotationY: number }>,
	objectSize = SCATTERED_PLACEMENT_RADIUS * 2
): boolean {
	return robots.some((robot) => robotsOverlap(x, z, robot.x, robot.z, objectSize, 0, robot.rotationY));
}

/** Broad-phase overlap of two robot footprints (axis-aligned bounds of oriented squares). */
export function robotsOverlap(
	x1: number,
	z1: number,
	x2: number,
	z2: number,
	size: number,
	rotationY1: number,
	rotationY2: number
): boolean {
	const a = getRobotAABB(x1, z1, size, rotationY1);
	const b = getRobotAABB(x2, z2, size, rotationY2);
	return aabbOverlap(a, b);
}
