import * as THREE from 'three';
import type { PartialCoverPose } from '@vex-v5-override/protocol';
import type { Scene } from '../Scene';
import type { StackItem } from '../ScenarioSnapshot';
import { PARTIAL_PLACED_PIN_BACKOFF_MM, PIN_STACK_STEP } from '../fieldConstants';
import type { PinType } from '../GameObject';
import { applyPartialPlacedPinPose } from '../partialPlacedPinPose';

function applyPartialCoverPose(position: THREE.Vector3, pose: PartialCoverPose, isFlipped: boolean): THREE.Euler {
	position.y += pose.offsetY;
	return new THREE.Euler(isFlipped ? Math.PI + pose.tiltRad : pose.tiltRad, pose.rotationY, 0, 'YXZ');
}

export async function visualizeGoalStack(scene: Scene, basePosition: THREE.Vector3, stack: StackItem[]): Promise<void> {
	let y = basePosition.y;

	for (let i = 0; i < stack.length; i++) {
		const item = stack[i]!;
		const isLast = i === stack.length - 1;
		const position = new THREE.Vector3(basePosition.x, y, basePosition.z);

		if (item.kind === 'pin') {
			const rotation =
				item.partialPlaced && isLast
					? applyPartialPlacedPinPose(position, item.partialPlaced, item.isFlipped, PARTIAL_PLACED_PIN_BACKOFF_MM)
					: undefined;
			await addPin(scene, item.pinType, position, item.isFlipped, rotation);
		} else if (item.partialCover && isLast) {
			const rotation = applyPartialCoverPose(position, item.partialCover, item.isFlipped);
			await scene.addCup(position, item.isFlipped, rotation);
		} else {
			await scene.addCup(position, item.isFlipped);
		}

		y += PIN_STACK_STEP;
	}
}

async function addPin(scene: Scene, pinType: PinType, position: THREE.Vector3, isFlipped: boolean, rotation?: THREE.Euler): Promise<void> {
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
