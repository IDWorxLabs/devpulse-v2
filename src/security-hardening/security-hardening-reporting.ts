/**
 * Security Hardening — reporting.
 * Never prints raw secrets.
 */

import type {
  RedactedExposureFinding,
  SecurityHardeningEvaluation,
  SecurityHardeningRecord,
  SecurityHardeningReport,
  UnsafeCapabilityType,
} from './security-hardening-types.js';
import { getSecurityHardeningCacheStats } from './security-hardening-cache.js';
import { getSecurityHardeningHistorySize } from './security-hardening-history.js';

let reportCount = 0;

export function generateSecurityHardeningReport(
  record: SecurityHardeningRecord,
  evaluation: SecurityHardeningEvaluation,
  unsafeCapabilities: UnsafeCapabilityType[],
  boundaryWarnings: string[],
  isolationWarnings: string[],
  redactedExposureFindings: RedactedExposureFinding[],
  accessControlGaps: string[],
  missingSignals: string[],
): SecurityHardeningReport {
  reportCount += 1;
  const cache = getSecurityHardeningCacheStats();
  const recommendations: string[] = [];

  if (boundaryWarnings.length > 0) recommendations.push('Strengthen security boundaries before enabling execution paths');
  if (redactedExposureFindings.length > 0) recommendations.push('Rotate exposed secrets and move credentials to secure storage');
  if (unsafeCapabilities.length > 0) recommendations.push(`Gate unsafe capabilities: ${unsafeCapabilities.join(', ')}`);
  if (accessControlGaps.length > 0) recommendations.push('Prepare access control foundations for future sign-in and packages');
  if (isolationWarnings.length > 0) recommendations.push('Improve workspace and World 2 isolation boundaries');
  if (missingSignals.length > 0) recommendations.push('Collect missing security signals before commercial rollout');
  if (evaluation.state === 'SECURE' || evaluation.state === 'ACCEPTABLE') {
    recommendations.push('Continue monitoring security posture');
  } else {
    recommendations.push('Require security review before expansion');
  }

  return {
    securityScore: record.securityScore,
    boundaryScore: record.boundaryScore,
    isolationScore: record.isolationScore,
    exposureScore: record.exposureScore,
    riskLevel: record.riskLevel,
    state: record.state,
    confidence: record.confidence,
    unsafeCapabilities: [...unsafeCapabilities],
    boundaryWarnings: [...boundaryWarnings],
    isolationWarnings: [...isolationWarnings],
    redactedExposureFindings: redactedExposureFindings.map((f) => ({
      filePath: f.filePath,
      riskType: f.riskType,
      redactedPreview: f.redactedPreview,
      severity: f.severity,
      recommendation: f.recommendation,
    })),
    accessControlGaps: [...accessControlGaps],
    missingSignals: [...missingSignals],
    recommendations: [...new Set(recommendations)],
    evaluation,
    historySize: getSecurityHardeningHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetSecurityHardeningReportingForTests(): void {
  reportCount = 0;
}
