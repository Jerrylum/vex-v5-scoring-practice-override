export {
	getPinHalfColors,
	determineMidfieldYellowOwner,
	determineQuadrantYellowOwner,
	scoreHalves,
	countVisibleStackHalves,
	scoreGoalStack,
	scoreMidfieldStack,
	scoreQuadrantGoal,
	type PinHalfColor,
	type ToggleColor
} from './goalScoring';

/** @deprecated Use countVisibleStackHalves */
export { countVisibleStackHalves as countVisibleMidfieldHalves } from './goalScoring';

/** @deprecated Use scoreHalves */
export { scoreHalves as scoreMidfieldHalves } from './goalScoring';
