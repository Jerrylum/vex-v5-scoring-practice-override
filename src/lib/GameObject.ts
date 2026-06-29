import * as THREE from 'three';

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

export class ScoringElementObject extends GameObject {
	constructor(model: THREE.Group, name: string) {
		super(model, name);
		this.prepareModel();
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
