import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { GAME_PINS } from '../FieldResources';
import {
	isPinInExclusionZone,
	PIN_LENGTH_MM,
	pinOverlapsAnyRobot,
	scatteredPinContainerPosition
} from '../fieldConstants';
import { shouldScatterRemainingPins } from '../Generator';
import { generateScenario, scenarioToSnapshot } from '../ScenarioGenerator';
import {
	collectRemainingPinItems,
	generateScatteredPinPlacements,
	RemainingPinsStructure
} from './RemainingPinsStructure';

describe('scatteredPinContainerPosition', () => {
	it('maps lying-pin center coordinates to bottom-anchored container position', () => {
		const centerX = 500;
		const centerZ = -300;
		const rotationZ = 1.25;
		const container = scatteredPinContainerPosition(centerX, centerZ, rotationZ);
		const centerOffset = new THREE.Vector3(0, PIN_LENGTH_MM / 2, 0);
		centerOffset.applyEuler(new THREE.Euler(Math.PI / 2, 0, rotationZ, 'XYZ'));

		expect(container.x + centerOffset.x).toBeCloseTo(centerX);
		expect(container.z + centerOffset.z).toBeCloseTo(centerZ);
	});
});

describe('shouldScatterRemainingPins', () => {
	it('is disabled for easy and enabled for medium and hard', () => {
		expect(shouldScatterRemainingPins('easy')).toBe(false);
		expect(shouldScatterRemainingPins('medium')).toBe(true);
		expect(shouldScatterRemainingPins('hard')).toBe(true);
	});
});

describe('collectRemainingPinItems', () => {
	it('expands remaining pin counts into stack items', () => {
		const items = collectRemainingPinItems({ redBlue: 2, redYellow: 1, blueYellow: 0, yellowYellow: 3 });
		expect(items).toHaveLength(6);
		expect(items.filter((item) => item.kind === 'pin' && item.pinType === 'redBlue')).toHaveLength(2);
		expect(items.filter((item) => item.kind === 'pin' && item.pinType === 'yellowYellow')).toHaveLength(3);
	});
});

describe('generateScatteredPinPlacements', () => {
	it('places pins away from exclusion zones and robots', () => {
		const pins = collectRemainingPinItems(GAME_PINS);
		const robots = [
			{ alliance: 'red' as const, slot: 0 as const, x: 1200, z: 1200, rotationY: 0 },
			{ alliance: 'red' as const, slot: 1 as const, x: -1200, z: 1200, rotationY: 0.5 },
			{ alliance: 'blue' as const, slot: 0 as const, x: 1200, z: -1200, rotationY: 1 },
			{ alliance: 'blue' as const, slot: 1 as const, x: -1200, z: -1200, rotationY: 1.5 }
		];

		const placements = generateScatteredPinPlacements(pins, robots, 918273645);
		expect(placements.length).toBeGreaterThan(0);

		for (const pin of placements) {
			expect(isPinInExclusionZone(pin.x, pin.z)).toBe(false);
			expect(pinOverlapsAnyRobot(pin.x, pin.z, robots)).toBe(false);
		}
	});

	it('is deterministic for the same seed', () => {
		const pins = collectRemainingPinItems({ redBlue: 4, redYellow: 4, blueYellow: 4, yellowYellow: 4 });
		const first = generateScatteredPinPlacements(pins, [], 12345);
		const second = generateScatteredPinPlacements(pins, [], 12345);
		expect(second).toEqual(first);
	});
});

describe('RemainingPinsStructure snapshot', () => {
	it('round-trips through snapshot', () => {
		const original = new RemainingPinsStructure([
			{ pinType: 'redBlue', isFlipped: false, x: 100, z: -200, rotationZ: 0.25 }
		]);
		const restored = RemainingPinsStructure.fromSnapshot(original.toSnapshot());
		expect(restored.placements).toEqual(original.placements);
	});
});

describe('generateScenario remaining pins', () => {
	it('includes no scattered pins on easy difficulty', () => {
		const snapshot = scenarioToSnapshot(generateScenario({ difficulty: 'easy', masterSeed: 482910374 }), 'easy');
		expect(snapshot.remainingPins.pins).toHaveLength(0);
	});

	it('includes scattered pins on medium difficulty', () => {
		const snapshot = scenarioToSnapshot(generateScenario({ difficulty: 'medium', masterSeed: 482910374 }), 'medium');
		expect(snapshot.remainingPins.pins.length).toBeGreaterThan(0);
	});
});
