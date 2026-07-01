import type { Scene } from '../Scene';
import type { StackItem } from '../ScenarioSnapshot';
import type { QuadrantDefinition } from './QuadrantDefinition';
import type { ToggleColor } from '../Scoring';
import { visualizeGoalStack } from './GoalStackVisualization';

export async function visualizeQuadrantGoals(
	scene: Scene,
	definition: QuadrantDefinition,
	allianceStack: StackItem[],
	neutralStack: StackItem[],
	toggleColor: ToggleColor
): Promise<void> {
	scene.setToggleColor(definition.toggleId, toggleColor);

	if (allianceStack.length > 0) {
		await visualizeGoalStack(scene, definition.allianceGoalBase, allianceStack);
	}

	if (neutralStack.length > 0) {
		await visualizeGoalStack(scene, definition.neutralGoalBase, neutralStack);
	}
}
