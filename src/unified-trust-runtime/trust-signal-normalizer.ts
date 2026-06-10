/**
 * Unified Trust Runtime — trust signal normalizer.
 */

import type {
  NormalizedTrustSignal,
  RawTrustSignalInput,
  TrustSignalStatus,
  TrustSourceId,
} from './trust-runtime-types.js';
import { isKnownTrustSource } from './trust-source-registry.js';
import { getCachedNormalization, setCachedNormalization } from './trust-runtime-cache.js';

let normalizationCount = 0;

const KNOWN_SOURCES: TrustSourceId[] = [
  'AUTONOMOUS_TESTING',
  'AUTONOMOUS_FIXING',
  'AUTONOMOUS_VERIFICATION',
  'AUTONOMOUS_COMPLETION_ENGINE',
  'VERIFICATION_STRATEGY_CORE',
  'VERIFICATION_INTELLIGENCE',
  'VERIFICATION_INTEGRATION',
  'MULTI_PROJECT_VERIFICATION',
  'MULTI_PROJECT_MONITORING',
  'SELF_EVOLUTION_GOVERNANCE',
  'WORLD2',
  'TRUST_ENGINE',
];

function resolveSource(source: string): TrustSourceId {
  if (isKnownTrustSource(source)) return source;
  const upper = source.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  if (isKnownTrustSource(upper)) return upper;
  return 'TRUST_ENGINE';
}

function normalizeStatus(status?: string): TrustSignalStatus {
  if (!status) return 'UNKNOWN';
  const upper = status.toUpperCase();
  if (upper === 'ACTIVE' || upper === 'DEGRADED' || upper === 'RECOVERY' || upper === 'BLOCKED') {
    return upper;
  }
  if (upper.includes('BLOCK')) return 'BLOCKED';
  if (upper.includes('RECOVER')) return 'RECOVERY';
  if (upper.includes('DEGRAD')) return 'DEGRADED';
  return 'UNKNOWN';
}

export function normalizeTrustSignal(input: RawTrustSignalInput): NormalizedTrustSignal {
  const cacheKey = [
    input.source,
    input.confidence ?? 0,
    input.risk ?? 0,
    input.trustContribution ?? 0,
    input.evidenceCount ?? 0,
    input.status ?? '',
  ].join('|');

  const cached = getCachedNormalization(cacheKey);
  if (cached) return cached;

  normalizationCount += 1;

  const source = resolveSource(String(input.source));
  const confidence = Math.max(0, Math.min(100, Math.round(input.confidence ?? 50)));
  const risk = Math.max(0, Math.min(100, Math.round(input.risk ?? 20)));
  const trustContribution = Math.max(0, Math.min(100, Math.round(input.trustContribution ?? confidence - risk)));
  const evidenceCount = Math.max(0, Math.round(input.evidenceCount ?? 0));
  const status = normalizeStatus(input.status);

  const result: NormalizedTrustSignal = {
    source,
    confidence,
    risk,
    trustContribution,
    evidenceCount,
    timestamp: input.timestamp ?? Date.now(),
    status,
  };

  setCachedNormalization(cacheKey, result);
  return result;
}

export function normalizeTrustSignals(inputs: RawTrustSignalInput[]): NormalizedTrustSignal[] {
  return inputs.map(normalizeTrustSignal);
}

export function getNormalizationCount(): number {
  return normalizationCount;
}

export function listKnownTrustSourceIds(): TrustSourceId[] {
  return [...KNOWN_SOURCES];
}

export function resetTrustSignalNormalizerForTests(): void {
  normalizationCount = 0;
}
