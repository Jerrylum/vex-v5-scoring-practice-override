import * as THREE from 'three';
import type { Scene } from '../Scene';
import type { StackItem } from '../ScenarioSnapshot';
import { MIDFIELD_GOAL_BASE, PIN_STACK_STEP } from '../fieldConstants';
import type { PinType } from '../GameObject';

export async function visualizeMidfieldStack(scene: Scene, stack: StackItem[]): Promise<void> {
	const baseX = MIDFIELD_GOAL_BASE.x;
	const baseZ = MIDFIELD_GOAL_BASE.z;
	let y = MIDFIELD_GOAL_BASE.y;

	for (const item of stack) {
		const position = new THREE.Vector3(baseX, y, baseZ);

		if (item.kind === 'pin') {
			await addPin(scene, item.pinType, position, item.isFlipped);
		} else {
			await scene.addCup(position, item.isFlipped);
		}

		y += PIN_STACK_STEP;
	}
}

async function addPin(
	scene: Scene,
	pinType: PinType,
	position: THREE.Vector3,
	isFlipped: boolean
): Promise<void> {
	switch (pinType) {
		case 'redBlue':
			await scene.addRedBluePin(position, isFlipped);
			break;
		case 'redYellow':
			await scene.addRedYellowPin(position, isFlipped);
			break;
		case 'blueYellow':
			await scene.addBlueYellowPin(position, isFlipped);
			break;
		case 'yellowYellow':
			await scene.addYellowYellowPin(position, isFlipped);
			break;
	}
}
