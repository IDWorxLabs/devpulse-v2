/**
 * Privacy Hardening — retention risk analyzer.
 */

import type { PrivacyHardeningInput, RetentionRiskAnalysis } from './privacy-hardening-types.js';
import { resolvePrivacyRiskLevel } from './privacy-hardening-types.js';
import { getCachedRetentionAnalysis, setCachedRetentionAnalysis } from './privacy-hardening-cache.js';

let retentionAnalysisCount = 0;

export function analyzeRetentionRisk(input: PrivacyHardeningInput): RetentionRiskAnalysis {
  const cacheKey = [
    input.promptRetentionRisk,
    input.logRetentionRisk,
    input.operatorFeedRetentionRisk,
    input.futureBillingDataRetentionRisk,
  ].join('|');

  const cached = getCachedRetentionAnalysis(cacheKey);
  if (cached) return cached;

  retentionAnalysisCount += 1;
  const retentionWarnings: string[] = [];
  const retentionGaps: string[] = [];
  let penalty = 0;

  const risks: Array<[boolean | undefined, string, string]> = [
    [input.promptRetentionRisk, 'prompt_retention_risk', 'prompt_retention'],
    [input.reportRetentionRisk, 'report_retention_risk', 'report_retention'],
    [input.logRetentionRisk, 'log_retention_risk', 'log_retention'],
    [input.notificationRetentionRisk, 'notification_retention_risk', 'notification_retention'],
    [input.operatorFeedRetentionRisk, 'operator_feed_retention_risk', 'operator_feed_retention'],
    [input.validationOutputRetentionRisk, 'validation_output_retention_risk', 'validation_output_retention'],
    [input.uploadedFileRetentionRisk, 'uploaded_file_retention_risk', 'uploaded_file_retention'],
    [input.generatedArtifactRetentionRisk, 'generated_artifact_retention_risk', 'generated_artifact_retention'],
    [input.cloudMetadataRetentionRisk, 'cloud_metadata_retention_risk', 'cloud_metadata_retention'],
    [input.mobileCommandHistoryRetentionRisk, 'mobile_command_history_retention_risk', 'mobile_command_history_retention'],
    [input.futureAccountDataRetentionRisk, 'future_account_data_retention_risk', 'future_account_data_retention'],
    [input.futureBillingDataRetentionRisk, 'future_billing_data_retention_risk', 'future_billing_data_retention'],
  ];

  for (const [flag, warning, gap] of risks) {
    if (flag === true) {
      retentionWarnings.push(warning);
      retentionGaps.push(gap);
      penalty += 7;
    }
  }

  const retentionScore = Math.max(0, Math.min(100, Math.round(92 - penalty)));

  const result: RetentionRiskAnalysis = {
    retentionScore,
    retentionRiskLevel: resolvePrivacyRiskLevel(retentionScore),
    retentionWarnings,
    retentionGaps,
  };

  setCachedRetentionAnalysis(cacheKey, result);
  return result;
}

export function getRetentionAnalysisCount(): number {
  return retentionAnalysisCount;
}

export function resetRetentionRiskAnalyzerForTests(): void {
  retentionAnalysisCount = 0;
}
