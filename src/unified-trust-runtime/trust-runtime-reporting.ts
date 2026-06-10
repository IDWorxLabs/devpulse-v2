/**
 * Unified Trust Runtime — runtime reporting.
 */

import type { TrustRuntimeEvaluation, TrustRuntimeRecord, TrustRuntimeReport } from './trust-runtime-types.js';
import { getTrustRuntimeCacheStats } from './trust-runtime-cache.js';
import { getTrustRuntimeHistorySize } from './trust-runtime-history.js';

let reportCount = 0;

export function generateTrustRuntimeReport(
  record: TrustRuntimeRecord,
  evaluation: TrustRuntimeEvaluation,
): TrustRuntimeReport {
  reportCount += 1;
  const cache = getTrustRuntimeCacheStats();

  return {
    trustState: record.authority.trustState,
    signalCount: record.authority.signalCount,
    confidence: record.authority.confidence,
    risk: record.authority.risk,
    verificationReadiness: record.authority.verificationReadiness,
    completionReadiness: record.authority.completionReadiness,
    governanceReadiness: record.authority.governanceReadiness,
    participatingSources: [...record.authority.participatingSources],
    historySize: getTrustRuntimeHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    evaluation,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetTrustRuntimeReportingForTests(): void {
  reportCount = 0;
}
