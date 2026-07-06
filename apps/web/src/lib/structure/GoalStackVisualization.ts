import * as THREE from 'three';
import type { Scene } from '../Scene';
import type { StackItem } from '../ScenarioSnapshot';
import { PIN_STACK_STEP } from '../fieldConstants';
import type { PinType } from '../GameObject';

export async function visualizeGoalStack(scene: Scene, basePosition: THREE.Vector3, stack: StackItem[]): Promise<void> {
	let y = basePosition.y;

	for (let i = 0; i < stack.length; i++) {
		const item = stack[i]!;
		const isLast = i === stack.length - 1;
		const position = new THREE.Vector3(basePosition.x, y, basePosition.z);

		if (item.kind === 'pin') {
			await addPin(scene, item.pinType, position, item.isFlipped);
		} else if (item.partialCover && isLast) {
			position.y += item.partialCover.offsetY;
			// Y before X: rotationY picks azimuth, then tiltRad leans the cup that way.
			const rotation = new THREE.Euler(
				item.isFlipped ? Math.PI + item.partialCover.tiltRad : item.partialCover.tiltRad,
				item.partialCover.rotationY,
				0,
				'YXZ'
			);
			await scene.addCup(position, item.isFlipped, rotation);
		} else {
			await scene.addCup(position, item.isFlipped);
		}

		y += PIN_STACK_STEP;
	}
}

async function addPin(scene: Scene, pinType: PinType, position: THREE.Vector3, isFlipped: boolean): Promise<void> {
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
