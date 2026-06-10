/**
 * Privacy Hardening — disclosure risk analyzer.
 * Never prints raw private data.
 */

import type {
  DisclosureChannelType,
  DisclosureRiskAnalysis,
  PrivacyHardeningInput,
  PrivacyRiskLevel,
  RedactedDisclosureFinding,
} from './privacy-hardening-types.js';
import { redactPrivateData, resolvePrivacyRiskLevel } from './privacy-hardening-types.js';
import { getCachedDisclosureAnalysis, setCachedDisclosureAnalysis } from './privacy-hardening-cache.js';

let disclosureAnalysisCount = 0;

interface PrivateDataPattern {
  channel: DisclosureChannelType;
  pattern: RegExp;
  dataType: string;
  severity: PrivacyRiskLevel;
  recommendation: string;
}

const PRIVATE_PATTERNS: PrivateDataPattern[] = [
  { channel: 'logs', pattern: /@[a-z0-9._%+-]+\.[a-z]{2,}/i, dataType: 'email', severity: 'HIGH', recommendation: 'Redact emails from logs' },
  { channel: 'logs', pattern: /\+?\d[\d\s().-]{8,}\d/, dataType: 'phone', severity: 'HIGH', recommendation: 'Redact phone numbers from logs' },
  { channel: 'error_messages', pattern: /passport[:\s]+[A-Z0-9]{6,}/i, dataType: 'id_document', severity: 'CRITICAL', recommendation: 'Never include ID values in error messages' },
  { channel: 'validation_reports', pattern: /\d+\s+[A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd)/i, dataType: 'address', severity: 'HIGH', recommendation: 'Redact addresses from validation reports' },
  { channel: 'operator_feed', pattern: /tok_[A-Za-z0-9]{16,}/, dataType: 'token', severity: 'CRITICAL', recommendation: 'Redact tokens from operator feed entries' },
  { channel: 'notification_vault', pattern: /package[=:]\s*['"]?pro_[a-z0-9]+/i, dataType: 'billing_package', severity: 'MEDIUM', recommendation: 'Avoid billing identifiers in notifications' },
];

export function analyzeDisclosureRisk(input: PrivacyHardeningInput): DisclosureRiskAnalysis {
  const contentKey = (input.scanContent ?? []).join('|').slice(0, 120);
  const cacheKey = [
    contentKey,
    input.uvlReportDisclosureRisk,
    input.operatorFeedDisclosureRisk,
    input.logDisclosureRisk,
  ].join('::');

  const cached = getCachedDisclosureAnalysis(cacheKey);
  if (cached) return cached;

  disclosureAnalysisCount += 1;
  const disclosureWarnings: string[] = [];
  const redactedDisclosureFindings: RedactedDisclosureFinding[] = [];
  let penalty = 0;

  const channelFlags: Array<[boolean | undefined, DisclosureChannelType, string]> = [
    [input.uvlReportDisclosureRisk, 'uvl_reports', 'uvl_report_disclosure_risk'],
    [input.validationReportDisclosureRisk, 'validation_reports', 'validation_report_disclosure_risk'],
    [input.operatorFeedDisclosureRisk, 'operator_feed', 'operator_feed_disclosure_risk'],
    [input.notificationVaultDisclosureRisk, 'notification_vault', 'notification_vault_disclosure_risk'],
    [input.copiedReportDisclosureRisk, 'copied_reports', 'copied_report_disclosure_risk'],
    [input.exportedProjectDisclosureRisk, 'exported_projects', 'exported_project_disclosure_risk'],
    [input.screenshotDisclosureRisk, 'screenshots', 'screenshot_disclosure_risk'],
    [input.mobileNotificationDisclosureRisk, 'mobile_notifications', 'mobile_notification_disclosure_risk'],
    [input.logDisclosureRisk, 'logs', 'log_disclosure_risk'],
    [input.errorMessageDisclosureRisk, 'error_messages', 'error_message_disclosure_risk'],
    [input.debugOutputDisclosureRisk, 'debugging_output', 'debug_output_disclosure_risk'],
    [input.launchDemoDisclosureRisk, 'launch_demo_workflows', 'launch_demo_disclosure_risk'],
    [input.supportBundleDisclosureRisk, 'support_debug_bundles', 'support_bundle_disclosure_risk'],
  ];

  for (const [flag, , warning] of channelFlags) {
    if (flag === true) {
      disclosureWarnings.push(warning);
      penalty += 6;
    }
  }

  for (let i = 0; i < (input.scanContent ?? []).length; i++) {
    const content = input.scanContent![i];
    for (const { channel, pattern, dataType, severity, recommendation } of PRIVATE_PATTERNS) {
      const match = content.match(pattern);
      if (!match) continue;
      const raw = match[0];
      redactedDisclosureFindings.push({
        channel,
        dataType,
        redactedPreview: redactPrivateData(raw),
        severity,
        recommendation,
      });
      disclosureWarnings.push(`${channel}_${dataType}_disclosure_risk`);
      penalty += 10;
    }
  }

  const disclosureRiskScore = Math.max(0, Math.min(100, Math.round(94 - penalty)));

  const result: DisclosureRiskAnalysis = {
    disclosureRiskScore,
    disclosureRiskLevel: resolvePrivacyRiskLevel(disclosureRiskScore),
    disclosureWarnings: [...new Set(disclosureWarnings)],
    redactedDisclosureFindings,
  };

  setCachedDisclosureAnalysis(cacheKey, result);
  return result;
}

export function getDisclosureAnalysisCount(): number {
  return disclosureAnalysisCount;
}

export function resetDisclosureRiskAnalyzerForTests(): void {
  disclosureAnalysisCount = 0;
}
