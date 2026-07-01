import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** GLB exports from Blender are in meters; the scene uses millimeters. */
const GLTF_TO_SCENE_SCALE = 1000;

/** Draco decoder WASM/JS served from static/draco/gltf (copied from three.js). */
const DRACO_DECODER_PATH = '/draco/gltf/';

export class ModelLoader {
	private modelCache: Map<string, THREE.Group> = new Map();
	private dracoLoader: DRACOLoader | null = null;
	private gltfLoader: GLTFLoader | null = null;

	private updateLoadingProgress(message: string): void {
		const loadingElement = document.getElementById('loading');
		if (loadingElement) {
			loadingElement.textContent = message;
		}
	}

	private isClearMaterial(material: THREE.Material): boolean {
		return /acrylic|clear|glass|polycarbonate|transparent/i.test(material.name);
	}

	private createClearMaterial(material: THREE.MeshStandardMaterial): THREE.MeshPhysicalMaterial {
		return new THREE.MeshPhysicalMaterial({
			color: material.color,
			metalness: 0,
			roughness: 0.05,
			transmission: 0.85,
			thickness: 0,
			transparent: true,
			opacity: 1,
			side: THREE.DoubleSide,
			depthWrite: false,
			envMapIntensity: 1,
			name: material.name
		});
	}

	private prepareMaterial(material: THREE.Material): THREE.Material {
		if (material instanceof THREE.MeshStandardMaterial && this.isClearMaterial(material)) {
			return this.createClearMaterial(material);
		}

		if (material instanceof THREE.MeshStandardMaterial) {
			material.envMapIntensity = 1;
		}

		return material;
	}

	private prepareMeshes(object: THREE.Group): number {
		let meshCount = 0;

		object.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				meshCount++;

				const materials = Array.isArray(child.material) ? child.material : [child.material];
				const prepared = materials.map((material) => this.prepareMaterial(material));
				child.material = Array.isArray(child.material) ? prepared : prepared[0]!;

				const isClear = prepared.some((material) => this.isClearMaterial(material));
				child.castShadow = !isClear;
				child.receiveShadow = !isClear;

				if (child.geometry) {
					child.geometry.computeBoundingBox();
					child.geometry.computeVertexNormals();
				}
			}
		});

		return meshCount;
	}

	private getGLTFLoader(): GLTFLoader {
		if (!this.gltfLoader) {
			this.dracoLoader = new DRACOLoader();
			this.dracoLoader.setDecoderPath(DRACO_DECODER_PATH);

			this.gltfLoader = new GLTFLoader();
			this.gltfLoader.setDRACOLoader(this.dracoLoader);
		}

		return this.gltfLoader;
	}

	private loadGLB(glbPath: string, onProgress?: (percent: number) => void): Promise<THREE.Group> {
		const loader = this.getGLTFLoader();

		return new Promise((resolve, reject) => {
			loader.load(
				glbPath,
				(gltf) => {
					gltf.scene.scale.multiplyScalar(GLTF_TO_SCENE_SCALE);

					const meshCount = this.prepareMeshes(gltf.scene);

					if (meshCount === 0) {
						reject(new Error('GLB file contains no meshes'));
						return;
					}

					resolve(gltf.scene);
				},
				(progress) => {
					if (progress.total > 0 && onProgress) {
						const percent = (progress.loaded / progress.total) * 100;
						onProgress(percent);
					}
				},
				(error) => {
					reject(error);
				}
			);
		});
	}

	public async loadModel(modelPath: string, modelName: string): Promise<THREE.Group> {
		if (this.modelCache.has(modelPath)) {
			console.log(`Using cached model: ${modelName}`);
			return this.modelCache.get(modelPath)!.clone();
		}

		console.log(`Loading model: ${modelName}`);
		this.updateLoadingProgress(`Loading ${modelName}...`);

		const onProgress = (percent: number) => {
			this.updateLoadingProgress(`Loading ${modelName}... ${percent.toFixed(0)}%`);
		};

		const object = await this.loadGLB(modelPath, onProgress);

		this.modelCache.set(modelPath, object);
		console.log(`Model cached: ${modelName}`);

		return object.clone();
	}

	public clearCache(): void {
		this.modelCache.clear();
		this.dracoLoader?.dispose();
		this.dracoLoader = null;
		this.gltfLoader = null;
	}
}
