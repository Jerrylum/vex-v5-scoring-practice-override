import { describe, expect, it } from 'vitest';
import type { Level } from './Generator';
import {
	generateScenario,
	GeneratorVersionMismatchError,
	scenarioToSnapshot
} from './ScenarioGenerator';
import {
	buildScenarioShareUrl,
	decodeScenarioToken,
	encodeScenarioToken,
	parseScenarioLink
} from './scenarioLink';
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

	it('uses allOnField robots case for medium difficulty', () => {
		const snapshot = scenarioToSnapshot(generateScenario({ difficulty: 'medium', masterSeed: 482910374 }), 'medium');
		expect(snapshot.robots.caseType).toBe('allOnField');
	});

	it('uses clawbotOnField robots case for hard difficulty', () => {
		const snapshot = scenarioToSnapshot(generateScenario({ difficulty: 'hard', masterSeed: 482910374 }), 'hard');
		expect(snapshot.robots.caseType).toBe('clawbotOnField');
	});

	it('produces different snapshots for different seeds', () => {
		const difficulty = 'medium';
		const a = scenarioToSnapshot(generateScenario({ difficulty, masterSeed: 111 }), difficulty);
		const b = scenarioToSnapshot(generateScenario({ difficulty, masterSeed: 222 }), difficulty);
		expect(b).not.toEqual(a);
	});

	it('throws on generator version mismatch', () => {
		expect(() => generateScenario({ difficulty: 'medium', masterSeed: 1, generatorVersion: 0 })).toThrow(
			GeneratorVersionMismatchError
		);
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
