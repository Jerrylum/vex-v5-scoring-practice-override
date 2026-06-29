import type { Scene } from './Scene';

export abstract class ScoringObject {
	public robot1Contacted = false;
	public robot2Contacted = false;
}

export abstract class Structure {
	public abstract getElements(): ScoringObject[];
	public abstract visualize(scene: Scene): Promise<void>;
}
