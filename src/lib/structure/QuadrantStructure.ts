import { Structure, ScoringObject } from '../ScoringObject';
import type { Scene } from '../Scene';
import { type ScoringSlice } from '../Scoring';
import type { QuadrantSnapshot, StackItem } from '../ScenarioSnapshot';
import type { QuadrantId } from './QuadrantDefinition';
import { scoreQuadrantGoal } from '../goalScoring';
import type { ToggleColor } from '../Scoring';
import { stackToElements } from '../stackGeneration';
import type { QuadrantDefinition } from './QuadrantDefinition';
import { getQuadrantDefinition } from './QuadrantDefinition';
import { visualizeQuadrantGoals } from './QuadrantStackVisualization';

export class QuadrantStructure extends Structure {
	constructor(
		public readonly definition: QuadrantDefinition,
		public readonly theCase: QuadrantCase
	) {
		super();
	}

	public getElements(): ScoringObject[] {
		return this.theCase.getElements();
	}

	public getScoring(): ScoringSlice {
		return this.theCase.getScoring(this.definition.id);
	}

	public visualize(scene: Scene): Promise<void> {
		return this.theCase.visualize(scene, this.definition);
	}

	public toSnapshot(): QuadrantSnapshot {
		return this.theCase.toSnapshot(this.definition.id);
	}

	public static fromSnapshot(snapshot: QuadrantSnapshot): QuadrantStructure {
		const definition = getQuadrantDefinition(snapshot.quadrantId);
		const { caseType, allianceStack, neutralStack, toggleColor } = snapshot;

		switch (caseType) {
			case 'noPin':
				return new QuadrantStructure(definition, new QuadrantNoPinCase(neutralStack, toggleColor));
			case 'shortStack':
				return new QuadrantStructure(definition, new QuadrantShortStackCase(allianceStack, neutralStack, toggleColor));
			case 'mediumStack':
				return new QuadrantStructure(definition, new QuadrantMediumStackCase(allianceStack, neutralStack, toggleColor));
			case 'hardStack':
				return new QuadrantStructure(definition, new QuadrantHardStackCase(allianceStack, neutralStack, toggleColor));
		}
	}
}

export abstract class QuadrantCase {
	public abstract getAllianceStack(): StackItem[];
	public abstract getNeutralStack(): StackItem[];
	public abstract getToggleColor(): ToggleColor;
	public abstract getElements(): ScoringObject[];
	public abstract getScoring(quadrantId: QuadrantSnapshot['quadrantId']): ScoringSlice;
	public abstract visualize(scene: Scene, definition: QuadrantDefinition): Promise<void>;
	public abstract toSnapshot(quadrantId: QuadrantSnapshot['quadrantId']): QuadrantSnapshot;
}

function scoringFromStacks(
	quadrantId: QuadrantId,
	allianceStack: StackItem[],
	neutralStack: StackItem[],
	toggleColor: ToggleColor
): ScoringSlice {
	const quadrantScoring = {
		allianceGoal: scoreQuadrantGoal(allianceStack, toggleColor),
		neutralGoal: scoreQuadrantGoal(neutralStack, toggleColor),
		toggleColor
	};

	return { [quadrantId]: quadrantScoring };
}

function elementsFromStacks(allianceStack: StackItem[], neutralStack: StackItem[]): ScoringObject[] {
	return [...stackToElements(allianceStack), ...stackToElements(neutralStack)];
}

export class QuadrantNoPinCase extends QuadrantCase {
	constructor(
		private readonly neutralStack: StackItem[],
		private readonly toggleColor: ToggleColor
	) {
		super();
	}

	public getAllianceStack(): StackItem[] {
		return [];
	}

	public getNeutralStack(): StackItem[] {
		return this.neutralStack;
	}

	public getToggleColor(): ToggleColor {
		return this.toggleColor;
	}

	public getElements(): ScoringObject[] {
		return elementsFromStacks(this.getAllianceStack(), this.getNeutralStack());
	}

	public getScoring(quadrantId: QuadrantSnapshot['quadrantId']): ScoringSlice {
		return scoringFromStacks(quadrantId, this.getAllianceStack(), this.getNeutralStack(), this.toggleColor);
	}

	public async visualize(scene: Scene, definition: QuadrantDefinition): Promise<void> {
		await visualizeQuadrantGoals(scene, definition, this.getAllianceStack(), this.getNeutralStack(), this.toggleColor);
	}

	public toSnapshot(quadrantId: QuadrantSnapshot['quadrantId']): QuadrantSnapshot {
		return {
			quadrantId,
			caseType: 'noPin',
			toggleColor: this.toggleColor,
			allianceStack: this.getAllianceStack(),
			neutralStack: this.getNeutralStack()
		};
	}
}

abstract class QuadrantStackCase extends QuadrantCase {
	constructor(
		protected readonly allianceStack: StackItem[],
		protected readonly neutralStack: StackItem[],
		protected readonly toggleColor: ToggleColor
	) {
		super();
	}

	public getAllianceStack(): StackItem[] {
		return this.allianceStack;
	}

	public getNeutralStack(): StackItem[] {
		return this.neutralStack;
	}

	public getToggleColor(): ToggleColor {
		return this.toggleColor;
	}

	public getElements(): ScoringObject[] {
		return elementsFromStacks(this.allianceStack, this.neutralStack);
	}

	public getScoring(quadrantId: QuadrantSnapshot['quadrantId']): ScoringSlice {
		return scoringFromStacks(quadrantId, this.allianceStack, this.neutralStack, this.toggleColor);
	}

	public async visualize(scene: Scene, definition: QuadrantDefinition): Promise<void> {
		await visualizeQuadrantGoals(scene, definition, this.allianceStack, this.neutralStack, this.toggleColor);
	}

	protected abstract getCaseType(): QuadrantSnapshot['caseType'];

	public toSnapshot(quadrantId: QuadrantSnapshot['quadrantId']): QuadrantSnapshot {
		return {
			quadrantId,
			caseType: this.getCaseType(),
			toggleColor: this.toggleColor,
			allianceStack: this.allianceStack,
			neutralStack: this.neutralStack
		};
	}
}

export class QuadrantShortStackCase extends QuadrantStackCase {
	constructor(allianceStack: StackItem[], neutralStack: StackItem[], toggleColor: ToggleColor) {
		super(allianceStack, neutralStack, toggleColor);
		validateQuadrantStacks(allianceStack, neutralStack, 5);
	}

	protected getCaseType(): QuadrantSnapshot['caseType'] {
		return 'shortStack';
	}
}

export class QuadrantMediumStackCase extends QuadrantStackCase {
	constructor(allianceStack: StackItem[], neutralStack: StackItem[], toggleColor: ToggleColor) {
		super(allianceStack, neutralStack, toggleColor);
		validateQuadrantStacks(allianceStack, neutralStack, 10);
	}

	protected getCaseType(): QuadrantSnapshot['caseType'] {
		return 'mediumStack';
	}
}

export class QuadrantHardStackCase extends QuadrantStackCase {
	constructor(allianceStack: StackItem[], neutralStack: StackItem[], toggleColor: ToggleColor) {
		super(allianceStack, neutralStack, toggleColor);
		validateQuadrantStacks(allianceStack, neutralStack, 14);
	}

	protected getCaseType(): QuadrantSnapshot['caseType'] {
		return 'hardStack';
	}
}

/** Alliance: 0..max (no preplaced pin). Neutral: 0..max (YY base when non-empty). */
function validateQuadrantStacks(allianceStack: StackItem[], neutralStack: StackItem[], max: number): void {
	if (allianceStack.length > max) {
		throw new Error(`Quadrant alliance stack exceeds max ${max}, got ${allianceStack.length}`);
	}
	if (neutralStack.length > max) {
		throw new Error(`Quadrant neutral stack exceeds max ${max}, got ${neutralStack.length}`);
	}
}
