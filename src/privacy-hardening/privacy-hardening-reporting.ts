/**
 * Privacy Hardening — reporting.
 * Never prints raw private data.
 */

import type {
  PersonalDataSurfaceType,
  PrivacyHardeningEvaluation,
  PrivacyHardeningRecord,
  PrivacyHardeningReport,
  RedactedDisclosureFinding,
} from './privacy-hardening-types.js';
import { getPrivacyHardeningCacheStats } from './privacy-hardening-cache.js';
import { getPrivacyHardeningHistorySize } from './privacy-hardening-history.js';

let reportCount = 0;

export function generatePrivacyHardeningReport(
  record: PrivacyHardeningRecord,
  evaluation: PrivacyHardeningEvaluation,
  personalDataSurfaces: PersonalDataSurfaceType[],
  dataBoundaryGaps: string[],
  retentionGaps: string[],
  disclosureWarnings: string[],
  redactionGaps: string[],
  complianceGaps: string[],
  redactedFindings: RedactedDisclosureFinding[],
  missingSignals: string[],
): PrivacyHardeningReport {
  reportCount += 1;
  const cache = getPrivacyHardeningCacheStats();
  const recommendations: string[] = [];

  if (personalDataSurfaces.length > 0) recommendations.push('Review personal data surfaces and minimize collection');
  if (dataBoundaryGaps.length > 0) recommendations.push('Strengthen project and workspace data boundaries');
  if (retentionGaps.length > 0) recommendations.push('Define retention policies for prompts, logs, and artifacts');
  if (disclosureWarnings.length > 0) recommendations.push('Prevent private data from appearing in reports and notifications');
  if (redactionGaps.length > 0) recommendations.push('Implement redaction across reports, logs, and notifications');
  if (complianceGaps.length > 0) recommendations.push('Prepare compliance disclosures before commercial launch');
  if (redactedFindings.length > 0) recommendations.push('Address redacted disclosure findings before launch');
  if (missingSignals.length > 0) recommendations.push('Collect missing privacy signals before scaling');
  if (evaluation.state === 'PRIVATE' || evaluation.state === 'ACCEPTABLE') {
    recommendations.push('Continue monitoring privacy posture');
  } else {
    recommendations.push('Require privacy review before expansion');
  }

  return {
    privacyScore: record.privacyScore,
    dataBoundaryScore: record.dataBoundaryScore,
    retentionScore: record.retentionScore,
    disclosureRiskScore: record.disclosureRiskScore,
    riskLevel: record.riskLevel,
    state: record.state,
    confidence: record.confidence,
    personalDataSurfaces: [...personalDataSurfaces],
    dataBoundaryGaps: [...dataBoundaryGaps],
    retentionGaps: [...retentionGaps],
    disclosureWarnings: [...disclosureWarnings],
    redactionGaps: [...redactionGaps],
    complianceReadinessGaps: [...complianceGaps],
    redactedFindings: redactedFindings.map((f) => ({
      channel: f.channel,
      dataType: f.dataType,
      redactedPreview: f.redactedPreview,
      severity: f.severity,
      recommendation: f.recommendation,
    })),
    missingSignals: [...missingSignals],
    recommendations: [...new Set(recommendations)],
    evaluation,
    historySize: getPrivacyHardeningHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetPrivacyHardeningReportingForTests(): void {
  reportCount = 0;
}
