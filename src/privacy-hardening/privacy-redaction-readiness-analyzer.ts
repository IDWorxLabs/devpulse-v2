/**
 * Privacy Hardening — privacy redaction readiness analyzer.
 */

import type { PrivacyHardeningInput, RedactionReadinessAnalysis } from './privacy-hardening-types.js';
import { getCachedRedactionReadinessAnalysis, setCachedRedactionReadinessAnalysis } from './privacy-hardening-cache.js';

let redactionReadinessAnalysisCount = 0;

export function analyzeRedactionReadiness(input: PrivacyHardeningInput): RedactionReadinessAnalysis {
  const cacheKey = [
    input.missingSecretRedaction,
    input.missingPersonalDataRedaction,
    input.missingPromptRedaction,
    input.missingReportRedaction,
  ].join('|');

  const cached = getCachedRedactionReadinessAnalysis(cacheKey);
  if (cached) return cached;

  redactionReadinessAnalysisCount += 1;
  const redactionGaps: string[] = [];
  const redactionWarnings: string[] = [];
  let penalty = 0;

  const gaps: Array<[boolean | undefined, string, string]> = [
    [input.missingSecretRedaction, 'secret_redaction', 'missing_secret_redaction'],
    [input.missingPersonalDataRedaction, 'personal_data_redaction', 'missing_personal_data_redaction'],
    [input.missingPromptRedaction, 'prompt_redaction', 'missing_prompt_redaction'],
    [input.missingReportRedaction, 'report_redaction', 'missing_report_redaction'],
    [input.missingLogRedaction, 'log_redaction', 'missing_log_redaction'],
    [input.missingNotificationRedaction, 'notification_redaction', 'missing_notification_redaction'],
    [input.missingCopiedReportRedaction, 'copied_report_redaction', 'missing_copied_report_redaction'],
    [input.missingScreenshotRedaction, 'screenshot_redaction', 'missing_screenshot_redaction'],
    [input.missingSupportBundleRedaction, 'support_bundle_redaction', 'missing_support_bundle_redaction'],
    [input.missingMobileNotificationRedaction, 'mobile_notification_redaction', 'missing_mobile_notification_redaction'],
  ];

  for (const [flag, gap, warning] of gaps) {
    if (flag === true) {
      redactionGaps.push(gap);
      redactionWarnings.push(warning);
      penalty += 8;
    }
  }

  const redactionReadinessScore = Math.max(0, Math.min(100, Math.round(90 - penalty)));

  const result: RedactionReadinessAnalysis = {
    redactionReadinessScore,
    redactionGaps,
    redactionWarnings,
  };

  setCachedRedactionReadinessAnalysis(cacheKey, result);
  return result;
}

export function getRedactionReadinessAnalysisCount(): number {
  return redactionReadinessAnalysisCount;
}

export function resetPrivacyRedactionReadinessAnalyzerForTests(): void {
  redactionReadinessAnalysisCount = 0;
}
