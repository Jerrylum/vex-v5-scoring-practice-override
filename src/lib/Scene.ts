import * as THREE from 'three';
import { ModelLoader } from './ModelLoader';
import { Field, GameObject, ScoringElementObject } from './GameObject';
import { Renderer } from './Renderer';

export class Scene {
	private renderer: Renderer;
	private modelLoader: ModelLoader;
	private field: Field | null = null;
	private scoringObjects: GameObject[] = [];
	private scoringObjectCounter = 0;

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

		const maxDim = 1600;

		this.renderer.setCameraView(new THREE.Vector3(0, 1600, 1600), new THREE.Vector3(0, 0, 0));

		this.renderer.camera.near = maxDim * 0.01;
		this.renderer.camera.far = maxDim * 10;
		this.renderer.camera.updateProjectionMatrix();

		console.log('Field setup complete');
	}

	private async preloadGameObjects(): Promise<void> {
		// Scoring object and field element models will be preloaded here when available
		console.log('Game object preload ready');
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

	public async addScoringObject(
		modelPath: string,
		name: string,
		position: THREE.Vector3,
		rotation: THREE.Euler = new THREE.Euler(0, 0, 0)
	): Promise<ScoringElementObject> {
		const model = await this.modelLoader.loadModel(modelPath, name);

		const instanceId = this.scoringObjectCounter++;
		const scoringObject = new ScoringElementObject(model, `${name}_${instanceId}`);
		scoringObject.setPosition(position);
		scoringObject.setRotation(rotation);

		this.renderer.scene.add(scoringObject.getObject());
		this.scoringObjects.push(scoringObject);

		console.log(`Added ${name} at`, position);
		return scoringObject;
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
		this.scoringObjectCounter = 0;
	}

	public getScoringObjects(): GameObject[] {
		return [...this.scoringObjects];
	}
}
