import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { MultiPolygon, Ring } from 'polygon-clipping';

const GLTF_TO_SCENE_SCALE = 1000;
const ROBOT_MAX_SIZE = 18 * 25.4;
const ROBOT_FLOOR_Y = 17.7;
const RASTER_CELL_MM = 2;
const MIN_TRIANGLE_AREA_MM2 = 0.1;
const TARGET_VERTICES_PER_RING = 512;
const CLAWBOT_MODEL = new URL('../static/V5RC-Clawbot.glb', import.meta.url);
const LICENSE_PLATE_MODEL = new URL('../static/V5RC-LicensePlate.glb', import.meta.url);
const DRACO_DECODER_PATH = new URL('../static/draco/gltf/', import.meta.url);
const OUTPUT_PATH = new URL('../src/lib/generated/clawbotFootprint.ts', import.meta.url);

type Point2D = [x: number, z: number];
type Triangle2D = [Point2D, Point2D, Point2D];
type CellKey = `${number},${number}`;
type Edge = { from: CellKey; to: CellKey };

class NodeProgressEvent extends Event {
	public readonly lengthComputable: boolean;
	public readonly loaded: number;
	public readonly total: number;

	public constructor(type: string, init: ProgressEventInit = {}) {
		super(type);
		this.lengthComputable = init.lengthComputable ?? false;
		this.loaded = init.loaded ?? 0;
		this.total = init.total ?? 0;
	}
}

if (typeof globalThis.ProgressEvent === 'undefined') {
	globalThis.ProgressEvent = NodeProgressEvent as typeof ProgressEvent;
}

function pointKey(x: number, z: number): CellKey {
	return `${x},${z}`;
}

function parsePointKey(key: CellKey): { x: number; z: number } {
	const [x, z] = key.split(',').map(Number);
	return { x: x!, z: z! };
}

function cellKey(x: number, z: number): CellKey {
	return pointKey(x, z);
}

async function loadModel(url: URL, loader: GLTFLoader): Promise<THREE.Group> {
	const buffer = await readFile(fileURLToPath(url));
	const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

	return new Promise((resolve, reject) => {
		loader.parse(
			arrayBuffer,
			'',
			(gltf) => {
				gltf.scene.scale.multiplyScalar(GLTF_TO_SCENE_SCALE);
				resolve(gltf.scene);
			},
			reject
		);
	});
}

function prepareClawbotModel(model: THREE.Group): void {
	const box = new THREE.Box3().setFromObject(model);
	const size = new THREE.Vector3();
	box.getSize(size);
	const maxXZ = Math.max(size.x, size.z);
	if (maxXZ > ROBOT_MAX_SIZE) {
		model.scale.multiplyScalar(ROBOT_MAX_SIZE / maxXZ);
	}

	box.setFromObject(model);
	const center = new THREE.Vector3();
	box.getCenter(center);
	model.position.set(-center.x, ROBOT_FLOOR_Y - box.min.y, -center.z);
}

function attachLicensePlates(assembly: THREE.Group, clawbotModel: THREE.Group, licensePlateModel: THREE.Group): void {
	assembly.add(clawbotModel);

	const box = new THREE.Box3().setFromObject(clawbotModel);
	const center = new THREE.Vector3();
	box.getCenter(center);

	const front = licensePlateModel.clone(true);
	front.position.set(center.x - 13, center.y + 30, center.z - 60);
	front.rotation.x = Math.PI / 17;
	front.rotation.y = -Math.PI / 2;
	front.rotation.z = Math.PI / 2;

	const back = licensePlateModel.clone(true);
	back.position.set(center.x + 17, center.y + 30, center.z - 60);
	back.rotation.x = Math.PI / 17;
	back.rotation.y = Math.PI / 2;
	back.rotation.z = Math.PI / 2;

	assembly.add(front, back);
}

function triangleArea([a, b, c]: Triangle2D): number {
	return Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
}

function cross(origin: Point2D, a: Point2D, b: Point2D): number {
	return (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0]);
}

function pointInTriangle(point: Point2D, [a, b, c]: Triangle2D): boolean {
	const d1 = cross(point, a, b);
	const d2 = cross(point, b, c);
	const d3 = cross(point, c, a);
	const hasNegative = d1 < 0 || d2 < 0 || d3 < 0;
	const hasPositive = d1 > 0 || d2 > 0 || d3 > 0;
	return !(hasNegative && hasPositive);
}

function pointInCell([x, z]: Point2D, cellX: number, cellZ: number): boolean {
	const minX = cellX * RASTER_CELL_MM;
	const minZ = cellZ * RASTER_CELL_MM;
	return x >= minX && x <= minX + RASTER_CELL_MM && z >= minZ && z <= minZ + RASTER_CELL_MM;
}

function segmentsIntersect(a1: Point2D, a2: Point2D, b1: Point2D, b2: Point2D): boolean {
	const d1 = cross(a1, a2, b1);
	const d2 = cross(a1, a2, b2);
	const d3 = cross(b1, b2, a1);
	const d4 = cross(b1, b2, a2);
	return d1 * d2 <= 0 && d3 * d4 <= 0;
}

function triangleIntersectsCell(triangle: Triangle2D, cellX: number, cellZ: number): boolean {
	const minX = cellX * RASTER_CELL_MM;
	const minZ = cellZ * RASTER_CELL_MM;
	const maxX = minX + RASTER_CELL_MM;
	const maxZ = minZ + RASTER_CELL_MM;
	const corners: Point2D[] = [
		[minX, minZ],
		[maxX, minZ],
		[maxX, maxZ],
		[minX, maxZ]
	];

	if (triangle.some((point) => pointInCell(point, cellX, cellZ))) {
		return true;
	}
	if (corners.some((point) => pointInTriangle(point, triangle))) {
		return true;
	}

	const triangleEdges = [
		[triangle[0], triangle[1]],
		[triangle[1], triangle[2]],
		[triangle[2], triangle[0]]
	] as const;
	const cellEdges = [
		[corners[0], corners[1]],
		[corners[1], corners[2]],
		[corners[2], corners[3]],
		[corners[3], corners[0]]
	] as const;

	return triangleEdges.some(([a, b]) => cellEdges.some(([c, d]) => segmentsIntersect(a, b, c, d)));
}

function collectXZTriangles(assembly: THREE.Group): Triangle2D[] {
	assembly.updateWorldMatrix(true, true);
	const assemblyInverse = new THREE.Matrix4().copy(assembly.matrixWorld).invert();
	const vertex = new THREE.Vector3();
	const triangles: Triangle2D[] = [];

	assembly.traverse((child) => {
		if (!(child instanceof THREE.Mesh) || !child.geometry) {
			return;
		}

		const position = child.geometry.attributes.position;
		if (!position) {
			return;
		}

		child.updateWorldMatrix(true, false);
		const localMatrix = new THREE.Matrix4().multiplyMatrices(assemblyInverse, child.matrixWorld);
		const toLocalPoint = (index: number): Point2D => {
			vertex.fromBufferAttribute(position, index);
			vertex.applyMatrix4(localMatrix);
			return [vertex.x, vertex.z];
		};

		const index = child.geometry.index;
		if (index) {
			for (let i = 0; i < index.count; i += 3) {
				triangles.push([toLocalPoint(index.getX(i)), toLocalPoint(index.getX(i + 1)), toLocalPoint(index.getX(i + 2))]);
			}
			return;
		}

		for (let i = 0; i < position.count; i += 3) {
			triangles.push([toLocalPoint(i), toLocalPoint(i + 1), toLocalPoint(i + 2)]);
		}
	});

	return triangles.filter((triangle) => triangleArea(triangle) >= MIN_TRIANGLE_AREA_MM2);
}

function rasterizeTriangles(triangles: ReadonlyArray<Triangle2D>): Set<CellKey> {
	const occupied = new Set<CellKey>();

	for (const triangle of triangles) {
		const minX = Math.floor(Math.min(...triangle.map((point) => point[0])) / RASTER_CELL_MM);
		const maxX = Math.floor(Math.max(...triangle.map((point) => point[0])) / RASTER_CELL_MM);
		const minZ = Math.floor(Math.min(...triangle.map((point) => point[1])) / RASTER_CELL_MM);
		const maxZ = Math.floor(Math.max(...triangle.map((point) => point[1])) / RASTER_CELL_MM);

		for (let x = minX; x <= maxX; x++) {
			for (let z = minZ; z <= maxZ; z++) {
				if (triangleIntersectsCell(triangle, x, z)) {
					occupied.add(cellKey(x, z));
				}
			}
		}
	}

	return occupied;
}

function boundaryEdges(occupied: ReadonlySet<CellKey>): Edge[] {
	const edges: Edge[] = [];
	const has = (x: number, z: number) => occupied.has(cellKey(x, z));

	for (const key of occupied) {
		const { x, z } = parsePointKey(key);
		if (!has(x, z - 1)) {
			edges.push({ from: pointKey(x, z), to: pointKey(x + 1, z) });
		}
		if (!has(x + 1, z)) {
			edges.push({ from: pointKey(x + 1, z), to: pointKey(x + 1, z + 1) });
		}
		if (!has(x, z + 1)) {
			edges.push({ from: pointKey(x + 1, z + 1), to: pointKey(x, z + 1) });
		}
		if (!has(x - 1, z)) {
			edges.push({ from: pointKey(x, z + 1), to: pointKey(x, z) });
		}
	}

	return edges;
}

function traceRings(edges: ReadonlyArray<Edge>): Ring[] {
	const byStart = new Map<CellKey, CellKey[]>();
	for (const edge of edges) {
		const next = byStart.get(edge.from) ?? [];
		next.push(edge.to);
		byStart.set(edge.from, next);
	}

	const rings: Ring[] = [];
	for (const edge of edges) {
		const ringKeys: CellKey[] = [];
		let current = edge.from;
		let next = edge.to;

		while (true) {
			ringKeys.push(current);
			const options = byStart.get(current);
			if (!options || options.length === 0) {
				break;
			}

			const optionIndex = options.indexOf(next);
			if (optionIndex === -1) {
				break;
			}
			options.splice(optionIndex, 1);

			current = next;
			if (current === edge.from) {
				break;
			}

			const nextOptions = byStart.get(current);
			if (!nextOptions || nextOptions.length === 0) {
				break;
			}
			next = nextOptions[0]!;
		}

		if (ringKeys.length >= 3 && current === edge.from) {
			const ring = ringKeys.map((key) => {
				const point = parsePointKey(key);
				return [point.x * RASTER_CELL_MM, point.z * RASTER_CELL_MM] satisfies Point2D;
			});
			rings.push(closeRing(removeCollinearPoints(ring)));
		}
	}

	return rings.filter((ring) => ring.length >= 4);
}

function closeRing(ring: Ring): Ring {
	const first = ring[0];
	const last = ring[ring.length - 1];
	if (!first || !last || (first[0] === last[0] && first[1] === last[1])) {
		return ring;
	}
	return [...ring, first];
}

function openRing(ring: Ring): Ring {
	const first = ring[0];
	const last = ring[ring.length - 1];
	if (first && last && first[0] === last[0] && first[1] === last[1]) {
		return ring.slice(0, -1);
	}
	return ring;
}

function removeCollinearPoints(ring: Ring): Ring {
	const open = openRing(ring);
	return open.filter((point, index) => {
		const prev = open[(index - 1 + open.length) % open.length]!;
		const next = open[(index + 1) % open.length]!;
		return cross(prev, point, next) !== 0;
	});
}

function ringArea(ring: Ring): number {
	const open = openRing(ring);
	let area = 0;
	for (let i = 0; i < open.length; i++) {
		const current = open[i]!;
		const next = open[(i + 1) % open.length]!;
		area += current[0] * next[1] - next[0] * current[1];
	}
	return area / 2;
}

function triangleSimplificationArea(ring: Ring, index: number): number {
	const prev = ring[(index - 1 + ring.length) % ring.length]!;
	const point = ring[index]!;
	const next = ring[(index + 1) % ring.length]!;
	return Math.abs(cross(prev, point, next)) / 2;
}

function simplifyRing(ring: Ring): Ring {
	const simplified = openRing(removeCollinearPoints(ring));
	while (simplified.length > TARGET_VERTICES_PER_RING) {
		let removeIndex = 0;
		let smallestArea = Infinity;
		for (let i = 0; i < simplified.length; i++) {
			const area = triangleSimplificationArea(simplified, i);
			if (area < smallestArea) {
				smallestArea = area;
				removeIndex = i;
			}
		}
		simplified.splice(removeIndex, 1);
	}
	return closeRing(simplified);
}

function ringsToDetailedFootprint(rings: Ring[]): MultiPolygon {
	const largestRing = [...rings].sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)))[0];
	if (!largestRing) {
		return [];
	}

	const outline = simplifyRing(largestRing);
	return outline.length >= 4 ? [[outline]] : [];
}

function serializeFootprint(footprint: MultiPolygon): string {
	return (
		`// Generated by scripts/generate-clawbot-footprint.ts. Do not edit by hand.\n` +
		`import type { MultiPolygon } from 'polygon-clipping';\n\n` +
		`export const CLAWBOT_FOOTPRINT_RASTER_CELL_MM = ${RASTER_CELL_MM};\n` +
		`export const CLAWBOT_FOOTPRINT_MAX_RING_VERTICES = ${TARGET_VERTICES_PER_RING};\n\n` +
		`export const CLAWBOT_LOCAL_FOOTPRINT: MultiPolygon = ${JSON.stringify(footprint, null, '\t')};\n`
	);
}

async function main(): Promise<void> {
	const dracoLoader = new DRACOLoader();
	dracoLoader.setDecoderPath(pathToFileURL(fileURLToPath(DRACO_DECODER_PATH)).href + '/');

	const loader = new GLTFLoader();
	loader.setDRACOLoader(dracoLoader);

	const [clawbotModel, licensePlateModel] = await Promise.all([loadModel(CLAWBOT_MODEL, loader), loadModel(LICENSE_PLATE_MODEL, loader)]);
	const assembly = new THREE.Group();
	prepareClawbotModel(clawbotModel);
	attachLicensePlates(assembly, clawbotModel, licensePlateModel);

	const triangles = collectXZTriangles(assembly);
	const occupied = rasterizeTriangles(triangles);
	const rings = traceRings(boundaryEdges(occupied));
	const footprint = ringsToDetailedFootprint(rings);

	const ringCount = footprint.reduce((sum, polygon) => sum + polygon.length, 0);
	const vertexCount = footprint.reduce((sum, polygon) => sum + polygon.reduce((innerSum, ring) => innerSum + ring.length, 0), 0);
	console.log(`Collected ${triangles.length.toLocaleString()} projected triangles`);
	console.log(`Rasterized ${occupied.size.toLocaleString()} occupied ${RASTER_CELL_MM}mm cells`);
	console.log(`Traced ${rings.length} raster ring(s)`);
	console.log(`Generated ${footprint.length} detailed polygon(s), ${ringCount} ring(s), ${vertexCount} vertices`);

	const outputFile = fileURLToPath(OUTPUT_PATH);
	await mkdir(dirname(outputFile), { recursive: true });
	await writeFile(outputFile, serializeFootprint(footprint));
	dracoLoader.dispose();
}

await main();
