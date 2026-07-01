import * as THREE from 'three';
import { Structure, ScoringObject, Robot } from '../ScoringObject';
import type { Scene } from '../Scene';
import { type MidfieldCounts, type ScenarioContext, type ScoringSlice } from '../Scoring';
import type { RobotsSnapshot, RobotPlacement } from '../ScenarioSnapshot';
import {
	isRobotInExclusionZone,
	isRobotInMidfield,
	isRobotWithinField,
	maxRobotCenterOffset,
	ROBOT_SIZE,
	robotsOverlap
} from '../fieldConstants';
import { mulberry32 } from '../utils';

export class RobotsStructure extends Structure {
	public readonly theCase: RobotsCase;

	constructor(theCase: RobotsCase) {
		super();
		this.theCase = theCase;
	}

	public getElements(): ScoringObject[] {
		return this.theCase.getElements();
	}

	public getScoring(_context?: ScenarioContext): ScoringSlice {
		return this.theCase.getScoring();
	}

	public getMidfieldCounts(): MidfieldCounts {
		return this.theCase.getMidfieldCounts();
	}

	public visualize(scene: Scene): Promise<void> {
		return this.theCase.visualize(scene);
	}

	public toSnapshot(): RobotsSnapshot {
		return this.theCase.toSnapshot();
	}

	public static fromSnapshot(snapshot: RobotsSnapshot): RobotsStructure {
		if (snapshot.caseType === 'none') {
			return new RobotsStructure(new NoRobotCase());
		}
		if (!snapshot.placements || snapshot.placements.length !== 4) {
			throw new Error('RobotsOnFieldCase snapshot requires 4 placements');
		}
		return new RobotsStructure(new RobotsOnFieldCase(snapshot.placements));
	}
}

export abstract class RobotsCase {
	public abstract getElements(): ScoringObject[];
	public abstract getScoring(): ScoringSlice;
	public abstract getMidfieldCounts(): MidfieldCounts;
	public abstract visualize(scene: Scene): Promise<void>;
	public abstract toSnapshot(): RobotsSnapshot;
}

export class NoRobotCase extends RobotsCase {
	public getElements(): ScoringObject[] {
		return [];
	}

	public getScoring(): ScoringSlice {
		return {};
	}

	public getMidfieldCounts(): MidfieldCounts {
		return { red: 0, blue: 0 };
	}

	public async visualize(_scene: Scene): Promise<void> {}

	public toSnapshot(): RobotsSnapshot {
		return { caseType: 'none' };
	}
}

const ROBOT_SLOTS: Array<{ alliance: 'red' | 'blue'; slot: 0 | 1 }> = [
	{ alliance: 'red', slot: 0 },
	{ alliance: 'red', slot: 1 },
	{ alliance: 'blue', slot: 0 },
	{ alliance: 'blue', slot: 1 }
];

export function generateRobotPlacements(seed: number): RobotPlacement[] {
	const random = mulberry32(seed);
	const halfExtent = maxRobotCenterOffset();
	const placements: RobotPlacement[] = [];
	const maxAttempts = 50;

	for (const { alliance, slot } of ROBOT_SLOTS) {
		let placed = false;

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			const x = (random() * 2 - 1) * halfExtent;
			const z = (random() * 2 - 1) * halfExtent;
			const rotationY = random() * Math.PI * 2;

			if (!isRobotWithinField(x, z, rotationY)) {
				continue;
			}
			if (isRobotInExclusionZone(x, z, rotationY)) {
				continue;
			}

			const overlaps = placements.some((p) => robotsOverlap(x, z, p.x, p.z, ROBOT_SIZE, rotationY, p.rotationY));
			if (overlaps) {
				continue;
			}

			placements.push({ alliance, slot, x, z, rotationY });
			placed = true;
			break;
		}

		if (!placed) {
			throw new Error(`Failed to place robot ${alliance} slot ${slot} after ${maxAttempts} attempts`);
		}
	}

	return placements;
}

export class RobotsOnFieldCase extends RobotsCase {
	constructor(public readonly placements: RobotPlacement[]) {
		super();
		if (placements.length !== 4) {
			throw new Error('RobotsOnFieldCase requires exactly 4 robot placements');
		}
	}

	public getElements(): ScoringObject[] {
		return this.placements.map((p) => new Robot(p.alliance, p.slot, p.x, p.z, p.rotationY));
	}

	public getScoring(): ScoringSlice {
		return {};
	}

	public getMidfieldCounts(): MidfieldCounts {
		const counts: MidfieldCounts = { red: 0, blue: 0 };
		for (const p of this.placements) {
			if (isRobotInMidfield(p.x, p.z, ROBOT_SIZE, p.rotationY)) {
				counts[p.alliance]++;
			}
		}
		return counts;
	}

	public async visualize(scene: Scene): Promise<void> {
		await Promise.all(this.placements.map((p) => scene.addRobot(p.alliance, new THREE.Vector3(p.x, 0, p.z), p.rotationY)));
	}

	public toSnapshot(): RobotsSnapshot {
		return { caseType: 'allOnField', placements: this.placements };
	}
}
