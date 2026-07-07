import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { applyPartialPlacedPinPose, partialPlacedPinLeanDirectionXZ } from './partialPlacedPinPose';

const tiltRad = (160 * Math.PI) / 180;

describe('partialPlacedPinLeanDirectionXZ', () => {
	it('leans toward field south (+Z) when not flipped at rotationY=0', () => {
		const lean = partialPlacedPinLeanDirectionXZ({ offsetY: 0, tiltRad, rotationY: 0 }, false);
		expect(lean.x).toBeCloseTo(0, 5);
		expect(lean.z).toBeGreaterThan(0);
	});

	it('leans toward field north (-Z) when flipped at rotationY=0', () => {
		const lean = partialPlacedPinLeanDirectionXZ({ offsetY: 0, tiltRad, rotationY: 0 }, true);
		expect(lean.x).toBeCloseTo(0, 5);
		expect(lean.z).toBeLessThan(0);
	});

	it('leans toward field north (-Z) when not flipped at rotationY=π', () => {
		const lean = partialPlacedPinLeanDirectionXZ({ offsetY: 0, tiltRad, rotationY: Math.PI }, false);
		expect(lean.x).toBeCloseTo(0, 5);
		expect(lean.z).toBeLessThan(0);
	});
});

describe('applyPartialPlacedPinPose', () => {
	it('moves base toward south (+Z) when pin leans north (-Z)', () => {
		const position = new THREE.Vector3(10, 100, -20);
		applyPartialPlacedPinPose(position, { offsetY: 0, tiltRad, rotationY: 0 }, true, 50);
		expect(position.x).toBeCloseTo(10, 5);
		expect(position.z).toBeCloseTo(30, 5);
	});

	it('moves base toward north (-Z) when pin leans south (+Z)', () => {
		const position = new THREE.Vector3(10, 100, 20);
		applyPartialPlacedPinPose(position, { offsetY: 0, tiltRad, rotationY: 0 }, false, 50);
		expect(position.x).toBeCloseTo(10, 5);
		expect(position.z).toBeCloseTo(-30, 5);
	});
});
