import type { Scene } from './Scene';
import type { PinType } from './GameObject';

export abstract class ScoringObject {
	public robot1Contacted = false;
	public robot2Contacted = false;
}

export class Pin extends ScoringObject {
	public readonly pinType: PinType;
	public readonly isFlipped: boolean;

	constructor(pinType: PinType, isFlipped = false) {
		super();
		this.pinType = pinType;
		this.isFlipped = isFlipped;
	}
}

export class Cup extends ScoringObject {}

export abstract class Structure {
	public abstract getElements(): ScoringObject[];
	public abstract visualize(scene: Scene): Promise<void>;
}
