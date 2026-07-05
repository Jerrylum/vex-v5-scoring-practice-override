import type * as THREE from 'three';
import {
	isScatteredObjectInExclusionZone,
	isScatteredObjectWithinField,
	maxScatteredCenterOffset,
	scatteredObjectContainerPosition,
	scatteredObjectContainerRotation,
	scatteredObjectOverlapsAnyRobot,
	scatteredObjectsOverlap
} from '../fieldConstants';
import { Cup, Pin, Structure } from '../ScoringObject';
import type { ScenarioContext, ScoringSlice } from '../Scoring';
import type { RemainingItemsSnapshot, RobotPlacement, ScatteredPlacement, StackItem } from '../ScenarioSnapshot';
import type { Scene } from '../Scene';
import { ALL_PIN_TYPES, shuffleSeeded } from '../stackGeneration';
import { mulberry32 } from '../utils';
import type { PinType } from '$lib/GameObject';

export type { ScatteredPlacement };

const MAX_SCATTER_ATTEMPTS = 50;

export class RemainingItemsStructure extends Structure {
	constructor(public readonly placements: ScatteredPlacement[]) {
		super();
	}

	public static empty(): RemainingItemsStructure {
		return new RemainingItemsStructure([]);
	}

	public getElements() {
		return this.placements.map((p) => (p.kind === 'pin' ? new Pin(p.pinType, p.isFlipped) : new Cup(p.isFlipped)));
	}

	public getScoring(_context?: ScenarioContext): ScoringSlice {
		return {};
	}

	public async visualize(scene: Scene): Promise<void> {
		for (const placement of this.placements) {
			const position = scatteredObjectContainerPosition(placement.x, placement.z, placement.rotationZ);
			const rotation = scatteredObjectContainerRotation(placement.rotationZ);

			if (placement.kind === 'pin') {
				await addScatteredPin(scene, placement.pinType, position, placement.isFlipped, rotation);
			} else {
				await scene.addCup(position, placement.isFlipped, rotation);
			}
		}
	}

	public toSnapshot(): RemainingItemsSnapshot {
		return { items: this.placements.map((p) => ({ ...p })) };
	}

	public static fromSnapshot(snapshot: RemainingItemsSnapshot): RemainingItemsStructure {
		return new RemainingItemsStructure(snapshot.items.map((p) => ({ ...p })));
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

function isValidPlacement(x: number, z: number, placed: ScatteredPlacement[], robots: ReadonlyArray<RobotPlacement>): boolean {
	if (!isScatteredObjectWithinField(x, z)) {
		return false;
	}
	if (isScatteredObjectInExclusionZone(x, z)) {
		return false;
	}
	if (scatteredObjectOverlapsAnyRobot(x, z, robots)) {
		return false;
	}
	return !placed.some((p) => scatteredObjectsOverlap(x, z, p.x, p.z));
}

/** Collect every pin and cup still in the pool after goal stacks are built. */
export function collectRemainingItems(remainingPins: Readonly<Record<PinType, number>>, remainingCups: number): StackItem[] {
	const items: StackItem[] = [];
	for (const pinType of ALL_PIN_TYPES) {
		for (let i = 0; i < remainingPins[pinType]; i++) {
			items.push({ kind: 'pin', pinType, isFlipped: false });
		}
	}
	for (let i = 0; i < remainingCups; i++) {
		items.push({ kind: 'cup', isFlipped: false });
	}
	return items;
}

export function generateScatteredPlacements(items: StackItem[], robots: ReadonlyArray<RobotPlacement>, seed: number): ScatteredPlacement[] {
	if (items.length === 0) {
		return [];
	}

	const random = mulberry32(seed);
	const halfExtent = maxScatteredCenterOffset();
	const shuffled = shuffleSeeded(items, seed);
	const placed: ScatteredPlacement[] = [];

	for (const item of shuffled) {
		let success = false;

		for (let attempt = 0; attempt < MAX_SCATTER_ATTEMPTS; attempt++) {
			const x = (random() * 2 - 1) * halfExtent;
			const z = (random() * 2 - 1) * halfExtent;
			const rotationZ = random() * Math.PI * 2;

			if (!isValidPlacement(x, z, placed, robots)) {
				continue;
			}

			if (item.kind === 'pin') {
				placed.push({
					kind: 'pin',
					pinType: item.pinType,
					isFlipped: item.isFlipped,
					x,
					z,
					rotationZ
				});
			} else {
				placed.push({
					kind: 'cup',
					isFlipped: random() < 0.5,
					x,
					z,
					rotationZ
				});
			}
			success = true;
			break;
		}

		if (!success) {
			const label = item.kind === 'pin' ? item.pinType : 'cup';
			console.warn(`Failed to place remaining ${label} after ${MAX_SCATTER_ATTEMPTS} attempts`);
		}
	}

	return placed;
}
