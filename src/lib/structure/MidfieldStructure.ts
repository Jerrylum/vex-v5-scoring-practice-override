import { Pin, Cup, Structure, ScoringObject } from '../ScoringObject';
import type { Scene } from '../Scene';
import { type ScenarioContext, type StructureScoring } from '../Scoring';
import type { MidfieldSnapshot, StackItem } from '../ScenarioSnapshot';
import type { PinType } from '../GameObject';
import { scoreMidfieldStack } from '../midfieldScoring';
import { mulberry32 } from '../utils';
import { visualizeMidfieldStack } from './MidfieldStackVisualization';

const ALL_PIN_TYPES: PinType[] = ['redBlue', 'redYellow', 'blueYellow', 'yellowYellow'];

export class MidfieldStructure extends Structure {
	public readonly theCase: MidfieldCase;
	public readonly randomSeed: number;

	constructor(theCase: MidfieldCase, randomSeed: number) {
		super();
		this.theCase = theCase;
		this.randomSeed = randomSeed;
	}

	public getElements(): ScoringObject[] {
		return this.theCase.getElements();
	}

	public getScoring(context?: ScenarioContext): StructureScoring {
		if (!context) {
			throw new Error('MidfieldStructure.getScoring requires ScenarioContext');
		}
		return this.theCase.getScoring(context);
	}

	public visualize(scene: Scene): Promise<void> {
		return this.theCase.visualize(scene);
	}

	public toSnapshot(): MidfieldSnapshot {
		return this.theCase.toSnapshot(this.randomSeed);
	}

	public static fromSnapshot(snapshot: MidfieldSnapshot): MidfieldStructure {
		const stack = snapshot.stack;
		switch (snapshot.caseType) {
			case 'oneYY':
				return new MidfieldStructure(new MidfieldOneYYPinCase(), snapshot.seed);
			case 'shortStack':
				return new MidfieldStructure(new MidfieldShortStackPinCase(stack), snapshot.seed);
			case 'tallStack':
				return new MidfieldStructure(new MidfieldTallStackPinCase(stack), snapshot.seed);
		}
	}
}

export abstract class MidfieldCase {
	public abstract getStack(): StackItem[];
	public abstract getElements(): ScoringObject[];
	public abstract getScoring(context: ScenarioContext): StructureScoring;
	public abstract visualize(scene: Scene): Promise<void>;
	public abstract toSnapshot(seed: number): MidfieldSnapshot;
}

function baseYYStack(): StackItem[] {
	return [{ kind: 'pin', pinType: 'yellowYellow', isFlipped: false }];
}

export function generateMidfieldStack(seed: number, totalItems: number): StackItem[] {
	if (totalItems < 1 || totalItems > 14) {
		throw new Error(`Invalid midfield stack length: ${totalItems}`);
	}

	const stack: StackItem[] = [{ kind: 'pin', pinType: 'yellowYellow', isFlipped: false }];
	const random = mulberry32(seed);

	for (let i = 1; i < totalItems; i++) {
		if (i % 2 === 1) {
			stack.push({ kind: 'cup', isFlipped: random() < 0.5 });
		} else {
			const pinType = ALL_PIN_TYPES[Math.floor(random() * ALL_PIN_TYPES.length)];
			stack.push({ kind: 'pin', pinType, isFlipped: random() < 0.5 });
		}
	}

	return stack;
}

function stackToElements(stack: StackItem[]): ScoringObject[] {
	return stack.map((item) => {
		if (item.kind === 'pin') {
			return new Pin(item.pinType, item.isFlipped);
		}
		return new Cup(item.isFlipped);
	});
}

function scoringFromStack(stack: StackItem[], context: ScenarioContext): StructureScoring {
	return {
		midfieldGoal: scoreMidfieldStack(stack, context.midfieldCounts)
	};
}

export class MidfieldOneYYPinCase extends MidfieldCase {
	public getStack(): StackItem[] {
		return baseYYStack();
	}

	public getElements(): ScoringObject[] {
		return stackToElements(this.getStack());
	}

	public getScoring(context: ScenarioContext): StructureScoring {
		return scoringFromStack(this.getStack(), context);
	}

	public async visualize(scene: Scene): Promise<void> {
		await visualizeMidfieldStack(scene, this.getStack());
	}

	public toSnapshot(seed: number): MidfieldSnapshot {
		return { caseType: 'oneYY', seed, stack: this.getStack() };
	}
}

export class MidfieldShortStackPinCase extends MidfieldCase {
	constructor(public readonly stack: StackItem[]) {
		super();
		const len = stack.length;
		if (len < 2 || len > 7) {
			throw new Error(`MidfieldShortStackPinCase requires 2–7 items, got ${len}`);
		}
	}

	public getStack(): StackItem[] {
		return this.stack;
	}

	public getElements(): ScoringObject[] {
		return stackToElements(this.stack);
	}

	public getScoring(context: ScenarioContext): StructureScoring {
		return scoringFromStack(this.stack, context);
	}

	public async visualize(scene: Scene): Promise<void> {
		await visualizeMidfieldStack(scene, this.stack);
	}

	public toSnapshot(seed: number): MidfieldSnapshot {
		return { caseType: 'shortStack', seed, stack: this.stack };
	}
}

export class MidfieldTallStackPinCase extends MidfieldCase {
	constructor(public readonly stack: StackItem[]) {
		super();
		const len = stack.length;
		if (len < 8 || len > 14) {
			throw new Error(`MidfieldTallStackPinCase requires 8–14 items, got ${len}`);
		}
	}

	public getStack(): StackItem[] {
		return this.stack;
	}

	public getElements(): ScoringObject[] {
		return stackToElements(this.stack);
	}

	public getScoring(context: ScenarioContext): StructureScoring {
		return scoringFromStack(this.stack, context);
	}

	public async visualize(scene: Scene): Promise<void> {
		await visualizeMidfieldStack(scene, this.stack);
	}

	public toSnapshot(seed: number): MidfieldSnapshot {
		return { caseType: 'tallStack', seed, stack: this.stack };
	}
}
