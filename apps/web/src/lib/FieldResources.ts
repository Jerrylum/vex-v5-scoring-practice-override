import type { PinType } from './GameObject';
import type { StackItem } from './ScenarioSnapshot';

/** Full-game pin inventory per game manual (includes match loads and preloads). */
export const GAME_PINS: Record<PinType, number> = {
	redBlue: 4,
	redYellow: 20,
	blueYellow: 20,
	yellowYellow: 19
};

/** Total cups available in a match (includes match loads). */
export const GAME_CUPS = 56;

export class FieldResourcePool {
	private pins: Record<PinType, number>;
	private cups: number;

	private constructor(pins: Record<PinType, number>, cups: number) {
		this.pins = { ...pins };
		this.cups = cups;
	}

	public static create(): FieldResourcePool {
		return new FieldResourcePool({ ...GAME_PINS }, GAME_CUPS);
	}

	/** Pick a random available pin from allowed types, consume it, return stack item or null. */
	public takePin(allowed: PinType[], random: () => number): StackItem | null {
		const available = allowed.filter((pinType) => this.pins[pinType] > 0);
		if (available.length === 0) {
			return null;
		}
		const pinType = available[Math.floor(random() * available.length)] ?? null;
		if (!pinType) {
			return null;
		}
		this.pins[pinType]--;
		return { kind: 'pin', pinType, isFlipped: random() < 0.5 };
	}

	/** Consume one cup; flip state is random (scoring/visual only). */
	public takeCup(random: () => number): StackItem | null {
		if (this.cups <= 0) {
			return null;
		}
		this.cups--;
		return { kind: 'cup', isFlipped: random() < 0.5 };
	}

	/** Mandatory YY base for neutral/midfield goals. */
	public takeYellowYellowPin(): StackItem | null {
		if (this.pins.yellowYellow <= 0) {
			return null;
		}
		this.pins.yellowYellow--;
		return { kind: 'pin', pinType: 'yellowYellow', isFlipped: false };
	}

	public getRemainingPins(): Readonly<Record<PinType, number>> {
		return { ...this.pins };
	}

	public getRemainingCups(): number {
		return this.cups;
	}
}
