import {
	CLAWBOT_MODEL,
	CUP_MODEL,
	FIELD_ELEMENTS_MODEL,
	FIELD_PERIMETER_MODEL,
	LICENSE_PLATE_MODEL,
	pinDisplayName,
	pinModelPath,
	TOGGLE_MODEL,
	type PinType
} from './GameObject';
import { ModelLoader, type LoadingProgressCallback } from './ModelLoader';

export async function preloadGameAssets(loader: ModelLoader, onProgress?: LoadingProgressCallback): Promise<void> {
	loader.setProgressCallback(onProgress ?? null);

	await Promise.all([
		loader.loadModel(FIELD_PERIMETER_MODEL, 'FieldPerimeter'),
		loader.loadModel(FIELD_ELEMENTS_MODEL, 'FieldElements'),
		loader.loadModel(TOGGLE_MODEL, 'Toggle'),
		loader.loadModel(CUP_MODEL, 'Cup'),
		loader.loadModel(LICENSE_PLATE_MODEL, 'LicensePlate'),
		...Object.entries(pinModelPath).map(([pinType, path]) => loader.loadModel(path, pinDisplayName(pinType as PinType)))
	]);

	if (loader.graphicProfile !== 'performance') {
		await loader.loadModel(CLAWBOT_MODEL, 'Clawbot');
	}

	console.log('All game object models preloaded');
}
