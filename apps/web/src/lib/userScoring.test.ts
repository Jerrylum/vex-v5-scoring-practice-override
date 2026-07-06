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
	it('returns true when midfield fields match and quadrants align with actual or swapped within alliance', () => {
		const actual = emptyScenarioScoring();
		actual.redQuadrantOne = {
			allianceGoal: {
				...emptyGoalScoring(),
				visible: { red: 2, blue: 0, yellow: 1 },
				scored: { red: 2, blue: 0, yellow: 1 }
			},
			neutralGoal: {
				...emptyGoalScoring(),
				visible: { red: 1, blue: 1, yellow: 0 },
				scored: { red: 1, blue: 1, yellow: 0 }
			},
			toggleColor: 'blue'
		};
		actual.midfieldGoal.visible = { red: 0, blue: 2, yellow: 3 };
		actual.midfieldGoal.scored = { red: 0, blue: 2, yellow: 3 };

		const user = emptyUserScenarioScoring();
		user.redQuadrantOne = { red: 3, blue: 1, yellow: 1, toggleColor: 'blue' };
		user.midfieldGoal = { red: 0, blue: 2, yellow: 3 };
		user.midfieldRobots = { red: 2, blue: 1 };

		expect(isUserScoringCorrect(user, actual, { red: 2, blue: 1 })).toBe(true);
		expect(calculateUserAlliancePoints(user)).toEqual(calculateActualAlliancePoints(actual, { red: 2, blue: 1 }));
	});

	it('returns true when quadrant counts are swapped between tabs but totals match', () => {
		const actual = emptyScenarioScoring();
		actual.redQuadrantOne = {
			allianceGoal: {
				...emptyGoalScoring(),
				visible: { red: 2, blue: 0, yellow: 0 },
				scored: { red: 2, blue: 0, yellow: 0 }
			},
			neutralGoal: { ...emptyGoalScoring(), visible: { red: 0, blue: 0, yellow: 0 }, scored: { red: 0, blue: 0, yellow: 0 } },
			toggleColor: 'red'
		};
		actual.redQuadrantTwo = {
			allianceGoal: {
				...emptyGoalScoring(),
				visible: { red: 0, blue: 0, yellow: 1 },
				scored: { red: 0, blue: 0, yellow: 1 }
			},
			neutralGoal: { ...emptyGoalScoring(), visible: { red: 0, blue: 0, yellow: 0 }, scored: { red: 0, blue: 0, yellow: 0 } },
			toggleColor: 'red'
		};

		const user = emptyUserScenarioScoring();
		// Swap red Q1 and red Q2 entries
		user.redQuadrantOne = { red: 0, blue: 0, yellow: 1, toggleColor: 'red' };
		user.redQuadrantTwo = { red: 2, blue: 0, yellow: 0, toggleColor: 'red' };

		expect(isUserScoringCorrect(user, actual, { red: 0, blue: 0 })).toBe(true);
	});

	it('returns false when red quadrant counts are wrong even if alliance point totals match', () => {
		const actual = emptyScenarioScoring();
		actual.redQuadrantOne = {
			allianceGoal: {
				...emptyGoalScoring(),
				visible: { red: 2, blue: 0, yellow: 0 },
				scored: { red: 2, blue: 0, yellow: 0 }
			},
			neutralGoal: { ...emptyGoalScoring(), visible: { red: 0, blue: 0, yellow: 0 }, scored: { red: 0, blue: 0, yellow: 0 } },
			toggleColor: 'yellow'
		};
		actual.redQuadrantTwo = {
			allianceGoal: {
				...emptyGoalScoring(),
				visible: { red: 0, blue: 0, yellow: 0 },
				scored: { red: 0, blue: 0, yellow: 0 }
			},
			neutralGoal: { ...emptyGoalScoring(), visible: { red: 0, blue: 0, yellow: 0 }, scored: { red: 0, blue: 0, yellow: 0 } },
			toggleColor: 'yellow'
		};

		const user = emptyUserScenarioScoring();
		// Same red pin total (2) split differently — no valid Q1/Q2 permutation
		user.redQuadrantOne = { red: 1, blue: 0, yellow: 0, toggleColor: 'yellow' };
		user.redQuadrantTwo = { red: 1, blue: 0, yellow: 0, toggleColor: 'yellow' };

		expect(calculateUserAlliancePoints(user).red).toBe(calculateActualAlliancePoints(actual, { red: 0, blue: 0 }).red);
		expect(isUserScoringCorrect(user, actual, { red: 0, blue: 0 })).toBe(false);
	});

	it('returns false when alliance point totals do not match', () => {
		const actual = emptyScenarioScoring();
		actual.redQuadrantOne = {
			allianceGoal: {
				...emptyGoalScoring(),
				visible: { red: 2, blue: 0, yellow: 0 },
				scored: { red: 2, blue: 0, yellow: 0 }
			},
			neutralGoal: { ...emptyGoalScoring(), visible: { red: 0, blue: 0, yellow: 0 }, scored: { red: 0, blue: 0, yellow: 0 } },
			toggleColor: 'yellow'
		};

		const user = emptyUserScenarioScoring();
		user.redQuadrantOne = { red: 1, blue: 0, yellow: 0, toggleColor: 'yellow' };

		expect(isUserScoringCorrect(user, actual, { red: 0, blue: 0 })).toBe(false);
	});

	it('returns false when midfield counts do not match even if quadrant totals are correct', () => {
		const actual = emptyScenarioScoring();
		actual.redQuadrantOne = {
			allianceGoal: {
				...emptyGoalScoring(),
				visible: { red: 1, blue: 0, yellow: 0 },
				scored: { red: 1, blue: 0, yellow: 0 }
			},
			neutralGoal: { ...emptyGoalScoring(), visible: { red: 0, blue: 0, yellow: 0 }, scored: { red: 0, blue: 0, yellow: 0 } },
			toggleColor: 'yellow'
		};
		actual.midfieldGoal.visible = { red: 0, blue: 0, yellow: 0 };
		actual.midfieldGoal.scored = { red: 0, blue: 0, yellow: 0 };

		const user = emptyUserScenarioScoring();
		user.redQuadrantOne = { red: 1, blue: 0, yellow: 0, toggleColor: 'yellow' };
		user.midfieldGoal = { red: 1, blue: 0, yellow: 0 };

		expect(isUserScoringCorrect(user, actual, { red: 0, blue: 0 })).toBe(false);
	});
});
