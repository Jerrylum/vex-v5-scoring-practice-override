import type { ScenarioScoring } from './Scoring';
import type { MidfieldStructure } from './structure/MidfieldStructure';
import type { RobotsStructure } from './structure/RobotsStructure';

export class Scenario {
	constructor(
		public readonly robots: RobotsStructure,
		public readonly midfield: MidfieldStructure,
		public readonly masterSeed: number
	) {}

	get structures() {
		return [this.robots, this.midfield];
	}

	calculateScoring(): ScenarioScoring {
		const midfieldCounts = this.robots.getMidfieldCounts();
		const context = { midfieldCounts };

		return {
			structures: [this.robots.getScoring(), this.midfield.getScoring(context)]
		};
	}
}
