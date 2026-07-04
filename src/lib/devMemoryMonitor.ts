import type { WebGLRenderer } from 'three';

export interface DevMemorySnapshot {
	timestamp: string;
	jsHeapUsedMb: string | null;
	jsHeapTotalMb: string | null;
	jsHeapLimitMb: string | null;
	geometries: number;
	textures: number;
	drawCalls: number;
	triangles: number;
	points: number;
	lines: number;
}

interface PerformanceMemory {
	usedJSHeapSize: number;
	totalJSHeapSize: number;
	jsHeapSizeLimit: number;
}

function formatMb(bytes: number): string {
	return (bytes / 1048576).toFixed(1);
}

function readJsHeap(): Pick<DevMemorySnapshot, 'jsHeapUsedMb' | 'jsHeapTotalMb' | 'jsHeapLimitMb'> {
	const memory = (performance as Performance & { memory?: PerformanceMemory }).memory;
	if (!memory) {
		return { jsHeapUsedMb: null, jsHeapTotalMb: null, jsHeapLimitMb: null };
	}

	return {
		jsHeapUsedMb: formatMb(memory.usedJSHeapSize),
		jsHeapTotalMb: formatMb(memory.totalJSHeapSize),
		jsHeapLimitMb: formatMb(memory.jsHeapSizeLimit)
	};
}

export function collectDevMemorySnapshot(webglRenderer: WebGLRenderer): DevMemorySnapshot {
	const { memory, render } = webglRenderer.info;

	return {
		timestamp: new Date().toLocaleTimeString(),
		...readJsHeap(),
		geometries: memory.geometries,
		textures: memory.textures,
		drawCalls: render.calls,
		triangles: render.triangles,
		points: render.points,
		lines: render.lines
	};
}

export function formatDevMemorySnapshot(snapshot: DevMemorySnapshot): string {
	const heap =
		snapshot.jsHeapUsedMb !== null
			? `JS ${snapshot.jsHeapUsedMb}/${snapshot.jsHeapTotalMb} MB (limit ${snapshot.jsHeapLimitMb})`
			: 'JS heap n/a (Chrome/Edge only)';

	return `[${snapshot.timestamp}] ${heap} | geo ${snapshot.geometries} tex ${snapshot.textures} | draws ${snapshot.drawCalls} tris ${snapshot.triangles}`;
}

export function logDevMemorySnapshot(snapshot: DevMemorySnapshot): void {
	console.log('[dev-memory]', formatDevMemorySnapshot(snapshot));
}
