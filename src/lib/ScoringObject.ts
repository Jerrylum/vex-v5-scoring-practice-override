import type { Scene } from './Scene';
import type { PinType } from './GameObject';
import type { ScenarioContext, ScoringSlice } from './Scoring';

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

export class Cup extends ScoringObject {
	public readonly isFlipped: boolean;

	constructor(isFlipped = false) {
		super();
		this.isFlipped = isFlipped;
	}
}

export class Robot extends ScoringObject {
	constructor(
		public readonly alliance: 'red' | 'blue',
		public readonly slot: 0 | 1,
		public readonly x: number,
		public readonly z: number,
		public readonly rotationY: number
	) {
		super();
	}
}

export abstract class Structure {
	public abstract getElements(): ScoringObject[];
	public abstract visualize(scene: Scene): Promise<void>;
	public abstract getScoring(context?: ScenarioContext): ScoringSlice;
}
