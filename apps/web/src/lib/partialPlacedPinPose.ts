import * as THREE from 'three';
import type { PartialCoverPose } from '@vex-v5-override/protocol';

/** Container rotation for a partial-placed pin (matches GoalStackVisualization). */
export function partialPlacedPinContainerRotation(pose: PartialCoverPose, isFlipped: boolean): THREE.Euler {
	return new THREE.Euler(isFlipped ? Math.PI + pose.tiltRad : pose.tiltRad, pose.rotationY, 0, 'YXZ');
}

/**
 * Horizontal unit vector the pin leans toward after container rotation.
 * Uses container euler only — PinObject's internal model flip must not invert this.
 * Field north is -Z, south is +Z.
 */
export function partialPlacedPinLeanDirectionXZ(
	pose: PartialCoverPose,
	isFlipped: boolean
): { x: number; z: number } {
	const axis = new THREE.Vector3(0, 1, 0).applyEuler(partialPlacedPinContainerRotation(pose, isFlipped));
	const length = Math.hypot(axis.x, axis.z);
	if (length < 1e-6) {
		return { x: 0, z: 0 };
	}
	return { x: axis.x / length, z: axis.z / length };
}

/** Raise/tilt the pin and shift its base opposite the lean (positive backoffMm). */
export function applyPartialPlacedPinPose(
	position: THREE.Vector3,
	pose: PartialCoverPose,
	isFlipped: boolean,
	backoffMm: number
): THREE.Euler {
	position.y += pose.offsetY;

	const lean = partialPlacedPinLeanDirectionXZ(pose, isFlipped);
	position.x -= lean.x * backoffMm;
	position.z -= lean.z * backoffMm;

	return partialPlacedPinContainerRotation(pose, isFlipped);
}
