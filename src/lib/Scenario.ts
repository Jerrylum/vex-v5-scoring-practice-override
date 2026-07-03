import { mergeScoringSlices, type ScenarioScoring } from './Scoring';
import type { ScenarioProvenance } from './ScenarioSnapshot';
import type { MidfieldStructure } from './structure/MidfieldStructure';
import type { QuadrantStructure } from './structure/QuadrantStructure';
import type { RemainingPinsStructure } from './structure/RemainingPinsStructure';
import type { RobotsStructure } from './structure/RobotsStructure';

export class Scenario {
	constructor(
		public readonly robots: RobotsStructure,
		public readonly midfield: MidfieldStructure,
		public readonly redQuadrantOne: QuadrantStructure,
		public readonly redQuadrantTwo: QuadrantStructure,
		public readonly blueQuadrantOne: QuadrantStructure,
		public readonly blueQuadrantTwo: QuadrantStructure,
		public readonly remainingPins: RemainingPinsStructure,
		public readonly provenance: ScenarioProvenance | null = null
	) {}

	get structures() {
		return [
			this.robots,
			this.midfield,
			this.redQuadrantOne,
			this.redQuadrantTwo,
			this.blueQuadrantOne,
			this.blueQuadrantTwo,
			this.remainingPins
		];
	}

	calculateScoring(): ScenarioScoring {
		const midfieldCounts = this.robots.getMidfieldCounts();
		const context = { midfieldCounts };

		return mergeScoringSlices(
			this.robots.getScoring(),
			this.midfield.getScoring(context),
			this.redQuadrantOne.getScoring(),
			this.redQuadrantTwo.getScoring(),
			this.blueQuadrantOne.getScoring(),
			this.blueQuadrantTwo.getScoring()
		);
	}
}
