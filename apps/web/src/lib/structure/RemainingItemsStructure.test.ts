import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { GAME_CUPS, GAME_PINS } from '../FieldResources';
import {
	isScatteredObjectInExclusionZone,
	PIN_LENGTH_MM,
	scatteredObjectContainerPosition,
	scatteredObjectOverlapsAnyRobot,
	scatteredObjectsOverlap
} from '../fieldConstants';
import { shouldScatterRemainingItems } from '../Generator';
import { generateScenario, scenarioToSnapshot } from '../ScenarioGenerator';
import { collectRemainingItems, generateScatteredPlacements, RemainingItemsStructure } from './RemainingItemsStructure';

describe('scatteredObjectContainerPosition', () => {
	it('maps lying object center coordinates to bottom-anchored container position', () => {
		const centerX = 500;
		const centerZ = -300;
		const rotationZ = 1.25;
		const container = scatteredObjectContainerPosition(centerX, centerZ, rotationZ);
		const centerOffset = new THREE.Vector3(0, PIN_LENGTH_MM / 2, 0);
		centerOffset.applyEuler(new THREE.Euler(Math.PI / 2, 0, rotationZ, 'XYZ'));

		expect(container.x + centerOffset.x).toBeCloseTo(centerX);
		expect(container.z + centerOffset.z).toBeCloseTo(centerZ);
	});
});

describe('shouldScatterRemainingItems', () => {
	it('is disabled for easy and enabled for medium and hard', () => {
		expect(shouldScatterRemainingItems('easy')).toBe(false);
		expect(shouldScatterRemainingItems('medium')).toBe(true);
		expect(shouldScatterRemainingItems('hard')).toBe(true);
	});
});

describe('collectRemainingItems', () => {
	it('expands remaining pin counts into stack items', () => {
		const items = collectRemainingItems({ redBlue: 2, redYellow: 1, blueYellow: 0, yellowYellow: 3 }, 0);
		expect(items).toHaveLength(6);
		expect(items.filter((item) => item.kind === 'pin' && item.pinType === 'redBlue')).toHaveLength(2);
		expect(items.filter((item) => item.kind === 'pin' && item.pinType === 'yellowYellow')).toHaveLength(3);
	});

	it('includes remaining cups', () => {
		const items = collectRemainingItems({ redBlue: 0, redYellow: 0, blueYellow: 0, yellowYellow: 0 }, 5);
		expect(items).toHaveLength(5);
		expect(items.every((item) => item.kind === 'cup')).toBe(true);
	});
});

describe('generateScatteredPlacements', () => {
	it('places items away from exclusion zones and robots', () => {
		const items = collectRemainingItems(GAME_PINS, 8);
		const robots = [
			{ alliance: 'red' as const, slot: 0 as const, x: 1200, z: 1200, rotationY: 0 },
			{ alliance: 'red' as const, slot: 1 as const, x: -1200, z: 1200, rotationY: 0.5 },
			{ alliance: 'blue' as const, slot: 0 as const, x: 1200, z: -1200, rotationY: 1 },
			{ alliance: 'blue' as const, slot: 1 as const, x: -1200, z: -1200, rotationY: 1.5 }
		];

		const placements = generateScatteredPlacements(items, robots, 918273645);
		expect(placements.length).toBeGreaterThan(0);

		for (const item of placements) {
			expect(isScatteredObjectInExclusionZone(item.x, item.z)).toBe(false);
			expect(scatteredObjectOverlapsAnyRobot(item.x, item.z, robots)).toBe(false);
		}

		for (let i = 0; i < placements.length; i++) {
			for (let j = i + 1; j < placements.length; j++) {
				expect(scatteredObjectsOverlap(placements[i]!.x, placements[i]!.z, placements[j]!.x, placements[j]!.z)).toBe(false);
			}
		}
	});

	it('is deterministic for the same seed', () => {
		const items = collectRemainingItems({ redBlue: 4, redYellow: 4, blueYellow: 4, yellowYellow: 4 }, 6);
		const first = generateScatteredPlacements(items, [], 12345);
		const second = generateScatteredPlacements(items, [], 12345);
		expect(second).toEqual(first);
	});
});

describe('RemainingItemsStructure snapshot', () => {
	it('round-trips through snapshot', () => {
		const original = new RemainingItemsStructure([
			{ kind: 'pin', pinType: 'redBlue', isFlipped: false, x: 100, z: -200, rotationZ: 0.25 },
			{ kind: 'cup', isFlipped: true, x: -50, z: 300, rotationZ: 1.5 }
		]);
		const restored = RemainingItemsStructure.fromSnapshot(original.toSnapshot());
		expect(restored.placements).toEqual(original.placements);
	});
});

describe('generateScenario remaining items', () => {
	it('includes no scattered items on easy difficulty', () => {
		const snapshot = scenarioToSnapshot(generateScenario({ difficulty: 'easy', masterSeed: 482910374 }), 'easy');
		expect(snapshot.remainingItems.items).toHaveLength(0);
	});

	it('includes scattered pins and cups on medium difficulty', () => {
		const snapshot = scenarioToSnapshot(generateScenario({ difficulty: 'medium', masterSeed: 482910374 }), 'medium');
		expect(snapshot.remainingItems.items.length).toBeGreaterThan(0);
		expect(snapshot.remainingItems.items.some((item) => item.kind === 'pin')).toBe(true);
		expect(snapshot.remainingItems.items.some((item) => item.kind === 'cup')).toBe(true);
	});
});
