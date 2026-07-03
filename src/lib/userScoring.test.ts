import { describe, expect, it } from 'vitest';
import { emptyGoalScoring, emptyScenarioScoring } from './Scoring';
import {
	aggregateQuadrantVisible,
	calculateActualAlliancePoints,
	calculateUserAlliancePoints,
	emptyUserScenarioScoring,
	isUserScoringCorrect
} from './userScoring';

describe('aggregateQuadrantVisible', () => {
	it('sums visible halves from alliance and neutral goals', () => {
		const result = aggregateQuadrantVisible({
			allianceGoal: {
				visible: { red: 1, blue: 0, yellow: 2 },
				yellowOwner: 'red',
				scored: { red: 1, blue: 0, yellow: 2 }
			},
			neutralGoal: {
				visible: { red: 0, blue: 1, yellow: 1 },
				yellowOwner: 'red',
				scored: { red: 0, blue: 1, yellow: 1 }
			},
			toggleColor: 'red'
		});

		expect(result).toEqual({ red: 1, blue: 1, yellow: 3 });
	});

	it('can differ from scored when yellow is not owned', () => {
		const result = aggregateQuadrantVisible({
			allianceGoal: {
				visible: { red: 0, blue: 0, yellow: 2 },
				yellowOwner: null,
				scored: { red: 0, blue: 0, yellow: 0 }
			},
			neutralGoal: {
				visible: { red: 0, blue: 0, yellow: 0 },
				yellowOwner: null,
				scored: { red: 0, blue: 0, yellow: 0 }
			},
			toggleColor: 'yellow'
		});

		expect(result).toEqual({ red: 0, blue: 0, yellow: 2 });
	});
});

describe('calculateUserAlliancePoints', () => {
	it('scores yellow in a quadrant when toggle matches an alliance', () => {
		const user = emptyUserScenarioScoring();
		user.redQuadrantOne = { red: 1, blue: 0, yellow: 1, toggleColor: 'red' };

		expect(calculateUserAlliancePoints(user)).toEqual({ red: 15, blue: 0 });
	});

	it('does not score midfield yellow when robot counts tie', () => {
		const user = emptyUserScenarioScoring();
		user.midfieldGoal.yellow = 2;
		user.midfieldRobots = { red: 1, blue: 1 };

		expect(calculateUserAlliancePoints(user)).toEqual({ red: 8, blue: 8 });
	});

	it('awards midfield robot points to each alliance', () => {
		const user = emptyUserScenarioScoring();
		user.midfieldRobots = { red: 2, blue: 1 };

		expect(calculateUserAlliancePoints(user)).toEqual({ red: 16, blue: 8 });
	});
});

describe('isUserScoringCorrect', () => {
	it('returns true when user visible entries match actual visible aggregates', () => {
		const actual = emptyScenarioScoring();
		actual.redQuadrantOne = {
			allianceGoal: {
				...emptyGoalScoring(),
				visible: { red: 2, blue: 0, yellow: 1 },
				scored: { red: 2, blue: 0, yellow: 0 }
			},
			neutralGoal: {
				...emptyGoalScoring(),
				visible: { red: 1, blue: 1, yellow: 0 },
				scored: { red: 1, blue: 1, yellow: 0 }
			},
			toggleColor: 'blue'
		};
		actual.midfieldGoal.visible = { red: 0, blue: 2, yellow: 3 };
		actual.midfieldGoal.scored = { red: 0, blue: 2, yellow: 0 };

		const user = emptyUserScenarioScoring();
		user.redQuadrantOne = { red: 3, blue: 1, yellow: 1, toggleColor: 'blue' };
		user.midfieldGoal = { red: 0, blue: 2, yellow: 3 };
		user.midfieldRobots = { red: 2, blue: 1 };

		expect(isUserScoringCorrect(user, actual, { red: 2, blue: 1 })).toBe(true);
		expect(calculateActualAlliancePoints(actual, { red: 2, blue: 1 })).toEqual({ red: 31, blue: 23 });
	});
});
