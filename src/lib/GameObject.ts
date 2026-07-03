import * as THREE from 'three';
import { ROBOT_FLOOR_Y } from './fieldConstants';
import { CLAWBOT_LOCAL_FOOTPRINT } from './generated/clawbotFootprint';
import { ROBOT_MAX_SIZE } from './utils';

export type PinType = 'redBlue' | 'redYellow' | 'blueYellow' | 'yellowYellow';

export const pinModelPath: Record<PinType, string> = {
	redBlue: '/V5RC-Override-H2H-_-RedBluePin.glb',
	redYellow: '/V5RC-Override-H2H-_-RedYellowPin.glb',
	blueYellow: '/V5RC-Override-H2H-_-BlueYellowPin.glb',
	yellowYellow: '/V5RC-Override-H2H-_-YellowYellowPin.glb'
};

const PIN_DISPLAY_NAMES: Record<PinType, string> = {
	redBlue: 'RedBluePin',
	redYellow: 'RedYellowPin',
	blueYellow: 'BlueYellowPin',
	yellowYellow: 'YellowYellowPin'
};

export function pinDisplayName(pinType: PinType): string {
	return PIN_DISPLAY_NAMES[pinType];
}

export const CUP_MODEL = '/V5RC-Override-H2H-_-Cup.glb';
export const TOGGLE_MODEL = '/V5RC-Override-H2H-_-Toggle.glb';
export const CLAWBOT_MODEL = '/V5RC-Clawbot.glb';
export const LICENSE_PLATE_MODEL = '/V5RC-LicensePlate.glb';

export abstract class GameObject {
	protected container: THREE.Group;
	protected model: THREE.Group;

	constructor(model: THREE.Group, name: string) {
		this.model = model;
		this.container = new THREE.Group();
		this.container.name = name;
		this.container.add(this.model);
	}

	public getObject(): THREE.Group {
		return this.container;
	}

	public setPosition(position: THREE.Vector3): void {
		this.container.position.copy(position);
	}

	public setRotation(rotation: THREE.Euler): void {
		this.container.rotation.copy(rotation);
	}

	public getPosition(): THREE.Vector3 {
		return this.container.position.clone();
	}

	public getRotation(): THREE.Euler {
		return this.container.rotation.clone();
	}

	protected prepareModel(): void {
		const box = new THREE.Box3().setFromObject(this.model);
		const rotatedCenter = new THREE.Vector3();
		box.getCenter(rotatedCenter);

		this.model.position.x = -rotatedCenter.x;
		this.model.position.y = -box.min.y;
		this.model.position.z = -rotatedCenter.z;
	}
}

export class PinObject extends GameObject {
	public readonly pinType: PinType;
	public readonly isFlipped: boolean;

	constructor(model: THREE.Group, pinType: PinType, instanceId: number, isFlipped = false) {
		super(model, `${pinDisplayName(pinType)}_${instanceId}`);
		this.pinType = pinType;
		this.isFlipped = isFlipped;
		this.prepareModel();
	}

	protected override prepareModel(): void {
		this.model.position.y = -17.7;
		this.model.rotation.x = this.isFlipped ? Math.PI : 0;
		super.prepareModel();
	}
}

export class CupObject extends GameObject {
	public readonly isFlipped: boolean;

	constructor(model: THREE.Group, instanceId: number, isFlipped = false) {
		super(model, `Cup_${instanceId}`);
		this.isFlipped = isFlipped;
		this.prepareModel();
	}

	protected override prepareModel(): void {
		this.model.position.y = -17.7;
		this.model.rotation.x = this.isFlipped ? Math.PI : 0;
		super.prepareModel();
	}
}

const ALLIANCE_COLORS = {
	red: 0xd50032,
	blue: 0x00a4e0
} as const;

function allianceColor(alliance: 'red' | 'blue'): number {
	return ALLIANCE_COLORS[alliance];
}

function createRobotFootprintGroup(alliance: 'red' | 'blue'): THREE.Group {
	const size = ROBOT_MAX_SIZE;
	const color = allianceColor(alliance);
	const geometry = new THREE.BoxGeometry(size, size, size);
	const material = new THREE.MeshStandardMaterial({
		color,
		transparent: true,
		opacity: 0.35,
		depthWrite: false
	});
	const mesh = new THREE.Mesh(geometry, material);
	mesh.position.y = ROBOT_FLOOR_Y + size / 2;

	const edges = new THREE.EdgesGeometry(geometry);
	const outline = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color }));
	outline.position.copy(mesh.position);

	const group = new THREE.Group();
	group.add(mesh, outline);
	return group;
}

type FootprintRing = ReadonlyArray<readonly [x: number, z: number]>;

function drawFootprintRingPath(path: THREE.Path, ring: FootprintRing): void {
	const first = ring[0];
	if (!first) {
		return;
	}

	path.moveTo(first[0], -first[1]);
	for (let i = 1; i < ring.length; i++) {
		const point = ring[i]!;
		path.lineTo(point[0], -point[1]);
	}
	path.closePath();
}

function ringToShapePath(ring: FootprintRing): THREE.Path {
	const path = new THREE.Path();
	drawFootprintRingPath(path, ring);
	return path;
}

function ringToLineLoop(ring: FootprintRing, y: number, color: number): THREE.Line {
	const points = ring.map(([x, z]) => new THREE.Vector3(x, y, z));
	return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color }));
}

function createClawbotFootprintHighlight(alliance: 'red' | 'blue'): THREE.Group {
	const color = allianceColor(alliance);
	const highlightY = ROBOT_FLOOR_Y + 2;
	const group = new THREE.Group();
	group.name = 'ClawbotFootprintHighlight';

	for (const polygon of CLAWBOT_LOCAL_FOOTPRINT) {
		const [outer, ...holes] = polygon;
		if (!outer || outer.length < 4) {
			continue;
		}

		const shape = new THREE.Shape();
		drawFootprintRingPath(shape, outer);
		shape.holes = holes.filter((hole) => hole.length >= 4).map((hole) => ringToShapePath(hole));

		const fillGeometry = new THREE.ShapeGeometry(shape);
		fillGeometry.rotateX(-Math.PI / 2);
		const fill = new THREE.Mesh(
			fillGeometry,
			new THREE.MeshBasicMaterial({
				color,
				transparent: true,
				opacity: 0.4,
				depthWrite: false,
				side: THREE.DoubleSide
			})
		);
		fill.position.y = highlightY;

		group.add(fill, ringToLineLoop(outer, highlightY + 0.5, color));
		for (const hole of holes) {
			if (hole.length >= 4) {
				group.add(ringToLineLoop(hole, highlightY + 0.5, color));
			}
		}
	}

	return group;
}

function prepareClawbotModel(model: THREE.Group): void {
	const box = new THREE.Box3().setFromObject(model);
	const size = new THREE.Vector3();
	box.getSize(size);
	const maxXZ = Math.max(size.x, size.z);
	if (maxXZ > ROBOT_MAX_SIZE) {
		model.scale.multiplyScalar(ROBOT_MAX_SIZE / maxXZ);
	}

	box.setFromObject(model);
	const center = new THREE.Vector3();
	box.getCenter(center);
	model.position.set(-center.x, ROBOT_FLOOR_Y - box.min.y, -center.z);
}

export function applyLicensePlateAllianceColor(model: THREE.Group, alliance: 'red' | 'blue'): void {
	const color = allianceColor(alliance);
	model.traverse((child) => {
		if (child instanceof THREE.Mesh) {
			const materials = Array.isArray(child.material) ? child.material : [child.material];
			const updated = materials.map((material) => {
				if (material.name === 'AnyColor' && material instanceof THREE.MeshStandardMaterial) {
					const copy = material.clone();
					copy.color.setHex(color);
					return copy;
				}
				return material;
			});
			child.material = Array.isArray(child.material) ? updated : updated[0]!;
		}
	});
}

function attachLicensePlate(
	footprintGroup: THREE.Group,
	clawbotModel: THREE.Group,
	licensePlateFront: THREE.Group,
	licensePlateBack: THREE.Group,
	alliance: 'red' | 'blue'
): void {
	applyLicensePlateAllianceColor(licensePlateFront, alliance);
	applyLicensePlateAllianceColor(licensePlateBack, alliance);
	footprintGroup.add(clawbotModel);

	const box = new THREE.Box3().setFromObject(clawbotModel);
	const center = new THREE.Vector3();
	box.getCenter(center);

	licensePlateFront.position.set(center.x - 13, center.y + 30, center.z - 60);
	licensePlateFront.rotation.x = Math.PI / 17;
	licensePlateFront.rotation.y = -Math.PI / 2;
	licensePlateFront.rotation.z = Math.PI / 2;

	licensePlateBack.position.set(center.x + 17, center.y + 30, center.z - 60);
	licensePlateBack.rotation.x = Math.PI / 17;
	licensePlateBack.rotation.y = Math.PI / 2;
	licensePlateBack.rotation.z = Math.PI / 2;

	footprintGroup.add(licensePlateFront);
	footprintGroup.add(licensePlateBack);
}

export class RobotObject extends GameObject {
	public readonly alliance: 'red' | 'blue';

	constructor(alliance: 'red' | 'blue', instanceId: number) {
		super(createRobotFootprintGroup(alliance), `Robot_${alliance}_${instanceId}`);
		this.alliance = alliance;
	}
}

export class ClawbotObject extends GameObject {
	public readonly alliance: 'red' | 'blue';

	constructor(
		alliance: 'red' | 'blue',
		instanceId: number,
		clawbotModel: THREE.Group,
		licensePlateFront: THREE.Group,
		licensePlateBack: THREE.Group
	) {
		const group = new THREE.Group();
		group.add(createClawbotFootprintHighlight(alliance));
		prepareClawbotModel(clawbotModel);
		attachLicensePlate(group, clawbotModel, licensePlateFront, licensePlateBack, alliance);

		super(group, `Clawbot_${alliance}_${instanceId}`);
		this.alliance = alliance;
	}
}

export class ToggleObject extends GameObject {
	public readonly alliance: 'red' | 'blue';

	constructor(model: THREE.Group, alliance: 'red' | 'blue', instanceId: number) {
		super(model, `Toggle_${alliance}_${instanceId}`);
		this.alliance = alliance;
		this.prepareModel();
	}

	protected override prepareModel(): void {
		if (this.alliance === 'red') {
			this.model.rotation.y = Math.PI;
		} else if (this.alliance === 'blue') {
			this.model.rotation.y = 0;
		}
		// super.prepareModel(); // Do not call super.prepareModel() here
	}

	public setColor(color: 'red' | 'blue' | 'yellow'): void {
		const yellowRotation = (Math.PI * 2) / 12;
		const section = (Math.PI * 2) / 3;
		if (color === 'red') {
			this.model.rotation.x = yellowRotation - section * (this.alliance === 'red' ? -1 : 1);
		} else if (color === 'blue') {
			this.model.rotation.x = yellowRotation + section * (this.alliance === 'red' ? -1 : 1);
		} else if (color === 'yellow') {
			this.model.rotation.x = yellowRotation;
		}
	}
}

export class Field extends GameObject {
	constructor(model: THREE.Group) {
		super(model, 'Field');
		this.prepareModel();
	}

	protected override prepareModel(): void {
		this.model.rotation.x = -Math.PI / 2;
		super.prepareModel();
	}
}
