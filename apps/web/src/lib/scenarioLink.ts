import type { Level, ScenarioLinkParams } from '@vex-v5-override/protocol';
import { GENERATOR_VERSION } from './generatorVersion';

export type { ScenarioLinkParams };

export type ScenarioLinkParseError = 'missing_token' | 'invalid_token' | 'invalid_difficulty' | 'version_mismatch';

export interface ScenarioLinkParseResult {
	ok: true;
	params: ScenarioLinkParams;
}

export interface ScenarioLinkParseFailure {
	ok: false;
	error: ScenarioLinkParseError;
	token?: string;
}

export type ScenarioLinkParseOutcome = ScenarioLinkParseResult | ScenarioLinkParseFailure;

const TOKEN_BYTE_LENGTH = 6;
const TOKEN_CHAR_LENGTH = 8;

const DIFFICULTY_TO_BYTE: Record<Level, number> = {
	easy: 0,
	medium: 1,
	hard: 2
};

const BYTE_TO_DIFFICULTY: Record<number, Level> = {
	0: 'easy',
	1: 'medium',
	2: 'hard'
};

function bytesToBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(token: string): Uint8Array | null {
	const padded = token.replace(/-/g, '+').replace(/_/g, '/');
	const padLength = (4 - (padded.length % 4)) % 4;
	const base64 = padded + '='.repeat(padLength);

	try {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	} catch {
		return null;
	}
}

export function encodeScenarioToken(params: ScenarioLinkParams): string {
	const bytes = new Uint8Array(TOKEN_BYTE_LENGTH);
	bytes[0] = params.generatorVersion;
	bytes[1] = params.masterSeed & 0xff;
	bytes[2] = (params.masterSeed >> 8) & 0xff;
	bytes[3] = (params.masterSeed >> 16) & 0xff;
	bytes[4] = (params.masterSeed >> 24) & 0xff;
	bytes[5] = DIFFICULTY_TO_BYTE[params.difficulty];

	const token = bytesToBase64Url(bytes);
	console.log('[scenarioLink]', {
		generatorVersion: params.generatorVersion,
		masterSeed: params.masterSeed,
		difficulty: params.difficulty
	});
	return token;
}

export function decodeScenarioToken(token: string): ScenarioLinkParseOutcome {
	if (token.length !== TOKEN_CHAR_LENGTH) {
		console.log('[scenarioLink] invalid token', token);
		return { ok: false, error: 'invalid_token', token };
	}

	const bytes = base64UrlToBytes(token);
	if (!bytes || bytes.length !== TOKEN_BYTE_LENGTH) {
		console.log('[scenarioLink] invalid token', token);
		return { ok: false, error: 'invalid_token', token };
	}

	const generatorVersion = bytes[0]!;
	const masterSeed = bytes[1]! | (bytes[2]! << 8) | (bytes[3]! << 16) | (bytes[4]! << 24);
	const difficulty = BYTE_TO_DIFFICULTY[bytes[5]!];

	if (difficulty === undefined) {
		console.log('[scenarioLink] invalid difficulty byte', bytes[5]);
		return { ok: false, error: 'invalid_difficulty', token };
	}

	if (generatorVersion !== GENERATOR_VERSION) {
		console.log('[scenarioLink] version mismatch', { expected: GENERATOR_VERSION, received: generatorVersion });
		return { ok: false, error: 'version_mismatch', token };
	}

	const params: ScenarioLinkParams = { generatorVersion, masterSeed, difficulty };
	console.log('[scenarioLink]', params);
	return { ok: true, params };
}

export function parseScenarioLink(searchParams: URLSearchParams): ScenarioLinkParseOutcome {
	const token = searchParams.get('s');
	if (!token) {
		return { ok: false, error: 'missing_token' };
	}
	return decodeScenarioToken(token);
}

export function buildScenarioShareUrl(origin: string, params: ScenarioLinkParams): string {
	const token = encodeScenarioToken(params);
	const url = new URL(origin);
	url.search = '';
	url.searchParams.set('s', token);
	return url.toString();
}

export function scenarioLinkParamsFromProvenance(
	provenance: { generatorVersion: number; masterSeed: number },
	difficulty: Level
): ScenarioLinkParams {
	return {
		generatorVersion: provenance.generatorVersion,
		masterSeed: provenance.masterSeed,
		difficulty
	};
}
