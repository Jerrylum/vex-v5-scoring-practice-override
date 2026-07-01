import { Structure, ScoringObject } from '../ScoringObject';
import type { Scene } from '../Scene';
import { type ScenarioContext, type StructureScoring } from '../Scoring';
import type { MidfieldSnapshot, StackItem } from '../ScenarioSnapshot';
import { scoreMidfieldStack } from '../goalScoring';
import { stackToElements } from '../stackGeneration';
import { visualizeGoalStack } from './GoalStackVisualization';
import { MIDFIELD_GOAL_BASE } from '../fieldConstants';

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
				return new MidfieldStructure(new MidfieldOneYYPinCase(stack), snapshot.seed);
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

function scoringFromStack(stack: StackItem[], context: ScenarioContext): StructureScoring {
	return {
		midfieldGoal: scoreMidfieldStack(stack, context.midfieldCounts)
	};
}

export class MidfieldOneYYPinCase extends MidfieldCase {
	constructor(private readonly stack: StackItem[]) {
		super();
		if (stack.length > 1) {
			throw new Error(`MidfieldOneYYPinCase allows at most 1 item, got ${stack.length}`);
		}
	}

	public getStack(): StackItem[] {
		return this.stack;
	}

	public getElements(): ScoringObject[] {
		return stackToElements(this.getStack());
	}

	public getScoring(context: ScenarioContext): StructureScoring {
		return scoringFromStack(this.getStack(), context);
	}

	public async visualize(scene: Scene): Promise<void> {
		await visualizeGoalStack(scene, MIDFIELD_GOAL_BASE, this.getStack());
	}

	public toSnapshot(seed: number): MidfieldSnapshot {
		return { caseType: 'oneYY', seed, stack: this.getStack() };
	}
}

export class MidfieldShortStackPinCase extends MidfieldCase {
	constructor(public readonly stack: StackItem[]) {
		super();
		if (stack.length > 7) {
			throw new Error(`MidfieldShortStackPinCase exceeds max 7 items, got ${stack.length}`);
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
		await visualizeGoalStack(scene, MIDFIELD_GOAL_BASE, this.stack);
	}

	public toSnapshot(seed: number): MidfieldSnapshot {
		return { caseType: 'shortStack', seed, stack: this.stack };
	}
}

export class MidfieldTallStackPinCase extends MidfieldCase {
	constructor(public readonly stack: StackItem[]) {
		super();
		if (stack.length > 14) {
			throw new Error(`MidfieldTallStackPinCase exceeds max 14 items, got ${stack.length}`);
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
		await visualizeGoalStack(scene, MIDFIELD_GOAL_BASE, this.stack);
	}

	public toSnapshot(seed: number): MidfieldSnapshot {
		return { caseType: 'tallStack', seed, stack: this.stack };
	}
}
