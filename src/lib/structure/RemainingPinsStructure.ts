import type * as THREE from 'three';
import {
	isPinInExclusionZone,
	isPinWithinField,
	maxPinCenterOffset,
	pinOverlapsAnyRobot,
	scatteredPinContainerPosition,
	scatteredPinContainerRotation,
	scatteredPinsOverlap
} from '../fieldConstants';
import { Pin, Structure } from '../ScoringObject';
import type { ScenarioContext, ScoringSlice } from '../Scoring';
import type { RemainingPinsSnapshot, RobotPlacement, ScatteredPinPlacement, StackItem } from '../ScenarioSnapshot';
import type { Scene } from '../Scene';
import { ALL_PIN_TYPES, shuffleSeeded } from '../stackGeneration';
import { mulberry32 } from '../utils';
import type { PinType } from '$lib/GameObject';

export type { ScatteredPinPlacement };

const MAX_PIN_ATTEMPTS = 50;

export class RemainingPinsStructure extends Structure {
	constructor(public readonly placements: ScatteredPinPlacement[]) {
		super();
	}

	public static empty(): RemainingPinsStructure {
		return new RemainingPinsStructure([]);
	}

	public getElements(): Pin[] {
		return this.placements.map((p) => new Pin(p.pinType, p.isFlipped));
	}

	public getScoring(_context?: ScenarioContext): ScoringSlice {
		return {};
	}

	public async visualize(scene: Scene): Promise<void> {
		for (const placement of this.placements) {
			const position = scatteredPinContainerPosition(placement.x, placement.z, placement.rotationZ);
			const rotation = scatteredPinContainerRotation(placement.rotationZ);
			await addScatteredPin(scene, placement.pinType, position, placement.isFlipped, rotation);
		}
	}

	public toSnapshot(): RemainingPinsSnapshot {
		return { pins: this.placements.map((p) => ({ ...p })) };
	}

	public static fromSnapshot(snapshot: RemainingPinsSnapshot): RemainingPinsStructure {
		return new RemainingPinsStructure(snapshot.pins.map((p) => ({ ...p })));
	}
}

async function addScatteredPin(
	scene: Scene,
	pinType: PinType,
	position: THREE.Vector3,
	isFlipped: boolean,
	rotation: THREE.Euler
): Promise<void> {
	switch (pinType) {
		case 'redBlue':
			await scene.addRedBluePin(position, isFlipped, rotation);
			break;
		case 'redYellow':
			await scene.addRedYellowPin(position, isFlipped, rotation);
			break;
		case 'blueYellow':
			await scene.addBlueYellowPin(position, isFlipped, rotation);
			break;
		case 'yellowYellow':
			await scene.addYellowYellowPin(position, isFlipped, rotation);
			break;
	}
}

function isValidPinPlacement(x: number, z: number, placed: ScatteredPinPlacement[], robots: ReadonlyArray<RobotPlacement>): boolean {
	if (!isPinWithinField(x, z)) {
		return false;
	}
	if (isPinInExclusionZone(x, z)) {
		return false;
	}
	if (pinOverlapsAnyRobot(x, z, robots)) {
		return false;
	}
	return !placed.some((p) => scatteredPinsOverlap(x, z, p.x, p.z));
}

/** Collect every pin still in the pool after goal stacks are built. */
export function collectRemainingPinItems(remaining: Readonly<Record<PinType, number>>): StackItem[] {
	const items: StackItem[] = [];
	for (const pinType of ALL_PIN_TYPES) {
		for (let i = 0; i < remaining[pinType]; i++) {
			items.push({ kind: 'pin', pinType, isFlipped: false });
		}
	}
	return items;
}

export function generateScatteredPinPlacements(
	pins: StackItem[],
	robots: ReadonlyArray<RobotPlacement>,
	seed: number
): ScatteredPinPlacement[] {
	const pinItems = pins.filter((item): item is Extract<StackItem, { kind: 'pin' }> => item.kind === 'pin');
	if (pinItems.length === 0) {
		return [];
	}

	const random = mulberry32(seed);
	const halfExtent = maxPinCenterOffset();
	const shuffled = shuffleSeeded(pinItems, seed);
	const placed: ScatteredPinPlacement[] = [];

	for (const pin of shuffled) {
		let success = false;

		for (let attempt = 0; attempt < MAX_PIN_ATTEMPTS; attempt++) {
			const x = (random() * 2 - 1) * halfExtent;
			const z = (random() * 2 - 1) * halfExtent;
			const rotationZ = random() * Math.PI * 2;

			if (!isValidPinPlacement(x, z, placed, robots)) {
				continue;
			}

			placed.push({
				pinType: pin.pinType,
				isFlipped: pin.isFlipped,
				x,
				z,
				rotationZ
			});
			success = true;
			break;
		}

		if (!success) {
			console.warn(`Failed to place remaining ${pin.pinType} pin after ${MAX_PIN_ATTEMPTS} attempts`);
		}
	}

	return placed;
}
