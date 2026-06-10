/**
 * Unified Trust Runtime — trust authority builder.
 */

import type { NormalizedTrustSignal, TrustSourceId, UnifiedTrustAuthority } from './trust-runtime-types.js';
import {
  computeAggregateConfidence,
  computeAggregateRisk,
  computeAggregateTrustLevel,
  resolveTrustState,
} from './trust-state-manager.js';
import { getCachedAuthority, setCachedAuthority } from './trust-runtime-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

const VERIFICATION_SOURCES: TrustSourceId[] = [
  'AUTONOMOUS_VERIFICATION',
  'VERIFICATION_STRATEGY_CORE',
  'VERIFICATION_INTELLIGENCE',
  'VERIFICATION_INTEGRATION',
  'MULTI_PROJECT_VERIFICATION',
];

const COMPLETION_SOURCES: TrustSourceId[] = [
  'AUTONOMOUS_COMPLETION_ENGINE',
  'AUTONOMOUS_TESTING',
  'AUTONOMOUS_FIXING',
];

const GOVERNANCE_SOURCES: TrustSourceId[] = [
  'SELF_EVOLUTION_GOVERNANCE',
  'WORLD2',
  'TRUST_ENGINE',
];

function computeReadiness(signals: NormalizedTrustSignal[], sources: TrustSourceId[]): number {
  const relevant = signals.filter((s) => sources.includes(s.source));
  if (relevant.length === 0) return 0;
  const avg = relevant.reduce((sum, s) => sum + s.confidence - s.risk * 0.3, 0) / relevant.length;
  return Math.max(0, Math.min(100, Math.round(avg)));
}

export function buildUnifiedTrustAuthority(
  requestId: string,
  signals: NormalizedTrustSignal[],
): UnifiedTrustAuthority {
  const cacheKey = [requestId, signals.map((s) => `${s.source}:${s.trustContribution}`).join(',')].join('|');
  const cached = getCachedAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const overallTrustLevel = computeAggregateTrustLevel(signals);
  const confidence = computeAggregateConfidence(signals);
  const risk = computeAggregateRisk(signals);
  const trustState = resolveTrustState(signals, overallTrustLevel);
  const participatingSources = [...new Set(signals.map((s) => s.source))];

  const authority: UnifiedTrustAuthority = {
    authorityId: `trust-authority-${authorityCounter}`,
    trustState,
    overallTrustLevel,
    confidence,
    risk,
    verificationReadiness: computeReadiness(signals, VERIFICATION_SOURCES),
    completionReadiness: computeReadiness(signals, COMPLETION_SOURCES),
    governanceReadiness: computeReadiness(signals, GOVERNANCE_SOURCES),
    signalCount: signals.length,
    participatingSources,
    createdAt: Date.now(),
  };

  setCachedAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetTrustAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
