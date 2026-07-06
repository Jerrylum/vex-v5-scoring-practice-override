import { describe, expect, it } from 'vitest';
import { ScenarioSnapshotSchema } from '@vex-v5-override/protocol';
import type { Level } from './Generator';
import { generateScenario, GeneratorVersionMismatchError, scenarioToSnapshot } from './ScenarioGenerator';
import { buildScenarioShareUrl, decodeScenarioToken, encodeScenarioToken, parseScenarioLink } from './scenarioLink';
import { GENERATOR_VERSION } from './generatorVersion';

const LEVELS: Level[] = ['easy', 'medium', 'hard'];

describe('generateScenario determinism', () => {
	for (const difficulty of LEVELS) {
		it(`replays the same snapshot for difficulty=${difficulty}`, () => {
			const seed = 482910374;
			const first = scenarioToSnapshot(generateScenario({ difficulty, masterSeed: seed }), difficulty);
			const second = scenarioToSnapshot(generateScenario({ difficulty, masterSeed: seed }), difficulty);
			expect(second).toEqual(first);
		});
	}

	it('uses clawbotOnField robots case for medium difficulty', () => {
		const snapshot = scenarioToSnapshot(generateScenario({ difficulty: 'medium', masterSeed: 482910374 }), 'medium');
		expect(snapshot.robots.caseType).toBe('clawbotOnField');
	});

	it('uses clawbotOnField robots case for hard difficulty', () => {
		const snapshot = scenarioToSnapshot(generateScenario({ difficulty: 'hard', masterSeed: 482910374 }), 'hard');
		expect(snapshot.robots.caseType).toBe('clawbotOnField');
	});

	it('includes remaining items only for medium and hard', () => {
		const easy = scenarioToSnapshot(generateScenario({ difficulty: 'easy', masterSeed: 482910374 }), 'easy');
		const medium = scenarioToSnapshot(generateScenario({ difficulty: 'medium', masterSeed: 482910374 }), 'medium');
		expect(easy.remainingItems.items).toHaveLength(0);
		expect(medium.remainingItems.items.length).toBeGreaterThan(0);
	});

	it('produces different snapshots for different seeds', () => {
		const difficulty = 'medium';
		const a = scenarioToSnapshot(generateScenario({ difficulty, masterSeed: 111 }), difficulty);
		const b = scenarioToSnapshot(generateScenario({ difficulty, masterSeed: 222 }), difficulty);
		expect(b).not.toEqual(a);
	});

	it('throws on generator version mismatch', () => {
		expect(() => generateScenario({ difficulty: 'medium', masterSeed: 1, generatorVersion: 0 })).toThrow(GeneratorVersionMismatchError);
	});

	it('snapshot output matches protocol ScenarioSnapshotSchema', () => {
		for (const difficulty of LEVELS) {
			const snapshot = scenarioToSnapshot(generateScenario({ difficulty, masterSeed: 482910374 }), difficulty);
			expect(ScenarioSnapshotSchema.parse(snapshot)).toEqual(snapshot);
		}
	});

	it('may include partialCover cups on hard but never on easy or medium', () => {
		const hasPartialCover = (snapshot: ReturnType<typeof scenarioToSnapshot>) => {
			const stacks = [
				snapshot.midfield.stack,
				...[
					snapshot.redQuadrantOne,
					snapshot.redQuadrantTwo,
					snapshot.blueQuadrantOne,
					snapshot.blueQuadrantTwo
				].flatMap((q) => [q.allianceStack, q.neutralStack])
			];
			return stacks.some((stack) =>
				stack.some((item) => item.kind === 'cup' && item.partialCover !== undefined)
			);
		};

		expect(hasPartialCover(scenarioToSnapshot(generateScenario({ difficulty: 'easy', masterSeed: 482910374 }), 'easy'))).toBe(
			false
		);
		expect(hasPartialCover(scenarioToSnapshot(generateScenario({ difficulty: 'medium', masterSeed: 482910374 }), 'medium'))).toBe(
			false
		);

		let foundOnHard = false;
		for (let seed = 0; seed < 200; seed++) {
			if (hasPartialCover(scenarioToSnapshot(generateScenario({ difficulty: 'hard', masterSeed: seed }), 'hard'))) {
				foundOnHard = true;
				break;
			}
		}
		expect(foundOnHard).toBe(true);
	});
});

describe('scenarioLink', () => {
	it('round-trips encode and decode', () => {
		const params = { generatorVersion: GENERATOR_VERSION, masterSeed: 482910374, difficulty: 'medium' as const };
		const token = encodeScenarioToken(params);
		expect(token).toHaveLength(8);

		const decoded = decodeScenarioToken(token);
		expect(decoded).toEqual({ ok: true, params });
	});

	it('round-trips through parseScenarioLink and buildScenarioShareUrl', () => {
		const params = { generatorVersion: GENERATOR_VERSION, masterSeed: 123456789, difficulty: 'hard' as const };
		const url = buildScenarioShareUrl('https://example.com/', params);
		const parsed = parseScenarioLink(new URL(url).searchParams);

		expect(parsed).toEqual({ ok: true, params });
	});

	it('rejects invalid tokens', () => {
		expect(decodeScenarioToken('not-valid')).toEqual({ ok: false, error: 'invalid_token', token: 'not-valid' });
	});

	it('rejects version mismatch in token', () => {
		const token = encodeScenarioToken({ generatorVersion: 99, masterSeed: 1, difficulty: 'easy' });
		expect(decodeScenarioToken(token)).toEqual({ ok: false, error: 'version_mismatch', token });
	});
});
