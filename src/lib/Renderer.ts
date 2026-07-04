import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { GraphicProfile } from './graphicProfile';

function targetPixelRatio(profile: GraphicProfile): number {
	switch (profile) {
		case 'performance':
			return 1;
		case 'balance':
			return Math.min(window.devicePixelRatio, 1.5);
		case 'bestQuality':
			return Math.min(window.devicePixelRatio, 2);
	}
}

function useAntialiasing(profile: GraphicProfile): boolean {
	return profile === 'bestQuality';
}

export class Renderer {
	public scene: THREE.Scene;
	public camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;
	private controls: OrbitControls;
	private container: HTMLElement;
	private pmremGenerator: THREE.PMREMGenerator;
	private readonly graphicProfile: GraphicProfile;

	constructor(containerId: string, graphicProfile: GraphicProfile) {
		this.graphicProfile = graphicProfile;
		this.container = document.getElementById(containerId)!;

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x333333);

		const width = this.container.clientWidth;
		const height = this.container.clientHeight;
		this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
		this.camera.position.set(100, 100, 100);

		this.renderer = new THREE.WebGLRenderer({ antialias: useAntialiasing(graphicProfile) });
		this.renderer.setPixelRatio(targetPixelRatio(graphicProfile));
		this.renderer.setSize(width, height);
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 0.3;
		this.renderer.shadowMap.enabled = false;
		this.container.appendChild(this.renderer.domElement);

		this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
			event.preventDefault();
			console.error('WebGL context lost — scene exceeded GPU memory or the tab was backgrounded.');
		});

		this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
		this.pmremGenerator.compileEquirectangularShader();
		this.setupEnvironment();

		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;
		this.controls.screenSpacePanning = false;
		this.controls.minDistance = 10;
		this.controls.maxDistance = 3600;
		this.controls.maxPolarAngle = Math.PI;

		window.addEventListener('resize', () => this.onWindowResize());

		this.animate();
	}

	private setupEnvironment(): void {
		const environment = new RoomEnvironment();
		const envMap = this.pmremGenerator.fromScene(environment).texture;
		this.scene.environment = envMap;
		environment.removeFromParent();
	}

	public setCameraView(position: THREE.Vector3, target: THREE.Vector3): void {
		this.camera.position.copy(position);
		this.camera.lookAt(target);
		this.controls.target.copy(target);
		this.controls.update();
	}

	private onWindowResize(): void {
		const width = this.container.clientWidth;
		const height = this.container.clientHeight;
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.setPixelRatio(targetPixelRatio(this.graphicProfile));
		this.renderer.setSize(width, height);
	}

	public resize(): void {
		this.onWindowResize();
	}

	public getWebGLRenderer(): THREE.WebGLRenderer {
		return this.renderer;
	}

	private animate(): void {
		requestAnimationFrame(() => this.animate());

		this.controls.update();

		this.renderer.render(this.scene, this.camera);
	}
}
