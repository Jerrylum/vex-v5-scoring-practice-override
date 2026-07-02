import * as THREE from 'three';
import { ModelLoader } from './ModelLoader';
import {
	Field,
	GameObject,
	PinObject,
	CupObject,
	RobotObject,
	ClawbotObject,
	ToggleObject,
	pinDisplayName,
	pinModelPath,
	CUP_MODEL,
	TOGGLE_MODEL,
	CLAWBOT_MODEL,
	LICENSE_PLATE_MODEL,
	type PinType
} from './GameObject';
import { Renderer } from './Renderer';
import { FT } from './utils';
import type { ToggleId } from './structure/QuadrantDefinition';

export class Scene {
	private renderer: Renderer;
	private modelLoader: ModelLoader;
	private field: Field | null = null;
	private northToggle: ToggleObject | null = null;
	private eastToggle: ToggleObject | null = null;
	private southToggle: ToggleObject | null = null;
	private westToggle: ToggleObject | null = null;
	private fieldElements: GameObject[] = [];
	private scoringObjects: GameObject[] = [];
	private pinCounters: Record<PinType, number> = {
		redBlue: 0,
		redYellow: 0,
		blueYellow: 0,
		yellowYellow: 0
	};
	private cupCounter = 0;
	private robotCounter = 0;

	constructor(containerId: string) {
		this.renderer = new Renderer(containerId);
		this.modelLoader = new ModelLoader();
	}

	public resize(): void {
		this.renderer.resize();
	}

	public async initialize(): Promise<void> {
		await this.preloadGameObjects();
		await this.loadField();

		const loadingElement = document.getElementById('loading');
		if (loadingElement) {
			loadingElement.style.display = 'none';
		}

		console.log('Scene initialized successfully');
	}

	private async loadField(): Promise<void> {
		this.field = await this.addField();
		this.northToggle = await this.addToggle('blue', new THREE.Vector3(0, 353, FT * -6 + 14));
		this.eastToggle = await this.addToggle('blue', new THREE.Vector3(FT * 6 - 14, 353, 0), new THREE.Euler(0, -Math.PI / 2, 0));
		this.southToggle = await this.addToggle('red', new THREE.Vector3(0, 353, FT * 6 - 14), new THREE.Euler(0, Math.PI, 0));
		this.westToggle = await this.addToggle('red', new THREE.Vector3(FT * -6 + 14, 353, 0), new THREE.Euler(0, Math.PI / 2, 0));

		const maxDim = 3600;

		this.renderer.setCameraView(new THREE.Vector3(0, 1800, 3600), new THREE.Vector3(0, 0, 0));

		this.renderer.camera.near = maxDim * 0.01;
		this.renderer.camera.far = maxDim * 10;
		this.renderer.camera.updateProjectionMatrix();

		console.log('Field setup complete');
	}

	private async preloadGameObjects(): Promise<void> {
		await Promise.all([
			this.modelLoader.loadModel('/V5RC-Override-H2H-_-FieldElements.glb', 'Field'),
			this.modelLoader.loadModel(TOGGLE_MODEL, 'Toggle'),
			this.modelLoader.loadModel(CUP_MODEL, 'Cup'),
			this.modelLoader.loadModel(CLAWBOT_MODEL, 'Clawbot'),
			this.modelLoader.loadModel(LICENSE_PLATE_MODEL, 'LicensePlate'),
			...Object.entries(pinModelPath).map(([pinType, path]) => this.modelLoader.loadModel(path, pinDisplayName(pinType as PinType)))
		]);

		console.log('All game object models preloaded');
	}

	public async addField(position: THREE.Vector3 = new THREE.Vector3(0, 0, 0)): Promise<Field> {
		const model = await this.modelLoader.loadModel('/V5RC-Override-H2H-_-FieldElements.glb', 'Field');
		const field = new Field(model);
		field.setPosition(position);

		this.renderer.scene.add(field.getObject());
		this.field = field;

		console.log('Added field at', position);
		return field;
	}

	private async addPin(
		pinType: PinType,
		position: THREE.Vector3,
		isFlipped = false,
		rotation: THREE.Euler = new THREE.Euler(0, 0, 0)
	): Promise<PinObject> {
		const model = await this.modelLoader.loadModel(pinModelPath[pinType], pinDisplayName(pinType));

		const instanceId = this.pinCounters[pinType]++;
		const pin = new PinObject(model, pinType, instanceId, isFlipped);
		pin.setPosition(position);
		pin.setRotation(rotation);

		this.renderer.scene.add(pin.getObject());
		this.scoringObjects.push(pin);

		console.log(`Added ${pinDisplayName(pinType)} at`, position);
		return pin;
	}

	public addRedBluePin(position: THREE.Vector3, isFlipped = false, rotation: THREE.Euler = new THREE.Euler(0, 0, 0)): Promise<PinObject> {
		return this.addPin('redBlue', position, isFlipped, rotation);
	}

	public addRedYellowPin(position: THREE.Vector3, isFlipped = false, rotation: THREE.Euler = new THREE.Euler(0, 0, 0)): Promise<PinObject> {
		return this.addPin('redYellow', position, isFlipped, rotation);
	}

	public addBlueYellowPin(
		position: THREE.Vector3,
		isFlipped = false,
		rotation: THREE.Euler = new THREE.Euler(0, 0, 0)
	): Promise<PinObject> {
		return this.addPin('blueYellow', position, isFlipped, rotation);
	}

	public addYellowYellowPin(
		position: THREE.Vector3,
		isFlipped = false,
		rotation: THREE.Euler = new THREE.Euler(0, 0, 0)
	): Promise<PinObject> {
		return this.addPin('yellowYellow', position, isFlipped, rotation);
	}

	public async addCup(position: THREE.Vector3, isFlipped = false, rotation: THREE.Euler = new THREE.Euler(0, 0, 0)): Promise<CupObject> {
		const model = await this.modelLoader.loadModel(CUP_MODEL, 'Cup');

		const instanceId = this.cupCounter++;
		const cup = new CupObject(model, instanceId, isFlipped);
		cup.setPosition(position);
		cup.setRotation(rotation);

		this.renderer.scene.add(cup.getObject());
		this.scoringObjects.push(cup);

		console.log('Added Cup at', position);
		return cup;
	}

	public addRobot(alliance: 'red' | 'blue', position: THREE.Vector3, rotationY: number): RobotObject {
		const instanceId = this.robotCounter++;
		const robot = new RobotObject(alliance, instanceId);
		robot.setPosition(position);
		robot.setRotation(new THREE.Euler(0, rotationY, 0));

		this.renderer.scene.add(robot.getObject());
		this.scoringObjects.push(robot);

		console.log(`Added ${alliance} robot at`, position);
		return robot;
	}

	public async addClawbot(alliance: 'red' | 'blue', position: THREE.Vector3, rotationY: number): Promise<ClawbotObject> {
		const instanceId = this.robotCounter++;
		const [clawbotModel, licensePlateFront, licensePlateBack] = await Promise.all([
			this.modelLoader.loadModel(CLAWBOT_MODEL, 'Clawbot'),
			this.modelLoader.loadModel(LICENSE_PLATE_MODEL, 'LicensePlate'),
			this.modelLoader.loadModel(LICENSE_PLATE_MODEL, 'LicensePlate')
		]);
		const clawbot = new ClawbotObject(alliance, instanceId, clawbotModel, licensePlateFront, licensePlateBack);
		clawbot.setPosition(position);
		clawbot.setRotation(new THREE.Euler(0, rotationY, 0));

		this.renderer.scene.add(clawbot.getObject());
		this.scoringObjects.push(clawbot);

		console.log(`Added ${alliance} clawbot at`, position);
		return clawbot;
	}

	private async addToggle(
		alliance: 'red' | 'blue',
		position: THREE.Vector3,
		rotation: THREE.Euler = new THREE.Euler(0, 0, 0)
	): Promise<ToggleObject> {
		const model = await this.modelLoader.loadModel(TOGGLE_MODEL, 'Toggle');

		const instanceId = this.fieldElements.length;
		const toggle = new ToggleObject(model, alliance, instanceId);
		toggle.setPosition(position);
		toggle.setRotation(rotation);
		toggle.setColor('yellow');

		this.renderer.scene.add(toggle.getObject());
		this.fieldElements.push(toggle);

		console.log('Added Toggle at', position);
		return toggle;
	}

	public setToggleColor(toggleId: ToggleId, color: 'red' | 'blue' | 'yellow'): void {
		const toggle = this.getToggleById(toggleId);
		toggle?.setColor(color);
	}

	private getToggleById(toggleId: ToggleId): ToggleObject | null {
		switch (toggleId) {
			case 'north':
				return this.northToggle;
			case 'east':
				return this.eastToggle;
			case 'south':
				return this.southToggle;
			case 'west':
				return this.westToggle;
		}
	}

	public removeScoringObject(gameObject: GameObject): void {
		this.renderer.scene.remove(gameObject.getObject());
		const index = this.scoringObjects.indexOf(gameObject);
		if (index > -1) {
			this.scoringObjects.splice(index, 1);
		}
	}

	public clearScoringObjects(): void {
		this.scoringObjects.forEach((obj) => {
			this.renderer.scene.remove(obj.getObject());
		});
		this.scoringObjects = [];
		this.pinCounters = {
			redBlue: 0,
			redYellow: 0,
			blueYellow: 0,
			yellowYellow: 0
		};
		this.cupCounter = 0;
		this.robotCounter = 0;
	}

	public getScoringObjects(): GameObject[] {
		return [...this.scoringObjects];
	}
}
