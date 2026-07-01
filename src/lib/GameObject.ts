import * as THREE from 'three';

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
	constructor(model: THREE.Group, instanceId: number) {
		super(model, `Cup_${instanceId}`);
		this.prepareModel();
	}

	protected override prepareModel(): void {
		this.model.position.y = -17.7;
		super.prepareModel();
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
