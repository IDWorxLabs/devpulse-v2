/**
 * Privacy Hardening — privacy compliance readiness analyzer.
 * Readiness only — no legal advice or legal claims.
 */

import type { ComplianceReadinessAnalysis, PrivacyHardeningInput } from './privacy-hardening-types.js';
import { getCachedComplianceReadinessAnalysis, setCachedComplianceReadinessAnalysis } from './privacy-hardening-cache.js';

let complianceReadinessAnalysisCount = 0;

export function analyzeComplianceReadiness(input: PrivacyHardeningInput): ComplianceReadinessAnalysis {
  const cacheKey = [
    input.missingPrivacyPolicyReadiness,
    input.missingAppStorePrivacyLabels,
    input.missingAccountDeletionWorkflow,
    input.missingAiUsageDisclosure,
  ].join('|');

  const cached = getCachedComplianceReadinessAnalysis(cacheKey);
  if (cached) return cached;

  complianceReadinessAnalysisCount += 1;
  const complianceGaps: string[] = [];
  const recommendedFutureDisclosures: string[] = [];
  let penalty = 0;

  const gaps: Array<[boolean | undefined, string, string]> = [
    [input.missingPrivacyPolicyReadiness, 'privacy_policy', 'Prepare privacy policy before commercial launch'],
    [input.missingDataCollectionDisclosure, 'data_collection_disclosure', 'Document what data is collected and why'],
    [input.missingAppStorePrivacyLabels, 'app_store_privacy_labels', 'Prepare App Store privacy label metadata'],
    [input.missingPlayStoreDataSafety, 'play_store_data_safety', 'Prepare Play Store Data Safety section'],
    [input.missingAccountDeletionWorkflow, 'account_deletion_workflow', 'Design account deletion workflow'],
    [input.missingDataExportWorkflow, 'data_export_workflow', 'Design user data export workflow'],
    [input.missingDataDeletionWorkflow, 'data_deletion_workflow', 'Design user data deletion workflow'],
    [input.missingUserConsentModel, 'user_consent_model', 'Define user consent model for data processing'],
    [input.missingAnalyticsDisclosure, 'analytics_disclosure', 'Disclose analytics collection practices'],
    [input.missingCrashReportingDisclosure, 'crash_reporting_disclosure', 'Disclose crash reporting data practices'],
    [input.missingAiUsageDisclosure, 'ai_usage_disclosure', 'Disclose AI processing of user data'],
    [input.missingCloudProcessingDisclosure, 'cloud_processing_disclosure', 'Disclose cloud processing of user data'],
    [input.missingBillingPaymentDisclosure, 'billing_payment_disclosure', 'Disclose billing and payment data handling'],
  ];

  for (const [flag, gap, recommendation] of gaps) {
    if (flag === true) {
      complianceGaps.push(gap);
      recommendedFutureDisclosures.push(recommendation);
      penalty += 6;
    }
  }

  const complianceReadinessScore = Math.max(0, Math.min(100, Math.round(88 - penalty)));

  const result: ComplianceReadinessAnalysis = {
    complianceReadinessScore,
    complianceGaps,
    recommendedFutureDisclosures,
  };

  setCachedComplianceReadinessAnalysis(cacheKey, result);
  return result;
}

export function getComplianceReadinessAnalysisCount(): number {
  return complianceReadinessAnalysisCount;
}

export function resetPrivacyComplianceReadinessAnalyzerForTests(): void {
  complianceReadinessAnalysisCount = 0;
}
