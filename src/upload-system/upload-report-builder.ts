/**
 * Upload System — markdown report builder (V1).
 */

import {
  SECURITY_CHECKS,
  UPLOAD_SYSTEM_PASS_TOKEN,
  UPLOAD_SYSTEM_PHASE,
  UPLOAD_SYSTEM_REPORT_TITLE,
  SUPPORTED_EXTENSIONS,
  VALIDATION_RULES,
  SAFETY_GUARANTEES,
} from './upload-system-registry.js';
import type { UploadSystemReport } from './upload-system-types.js';
import { buildUploadSessionHistorySummary } from './upload-session-history.js';

export function buildUploadSystemReport(): UploadSystemReport {
  const summary = buildUploadSessionHistorySummary();
  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    supportedFileTypes: SUPPORTED_EXTENSIONS,
    validationRules: VALIDATION_RULES,
    securityChecks: SECURITY_CHECKS,
    uploadVerdicts: {
      accepted: summary.acceptedUploads,
      rejected: summary.rejectedUploads,
    },
    historySummary: summary,
  };
}

export function buildUploadSystemReportMarkdown(report?: UploadSystemReport): string {
  const r = report ?? buildUploadSystemReport();
  const lines: string[] = [
    `# ${UPLOAD_SYSTEM_REPORT_TITLE}`,
    '',
    `Generated: ${r.generatedAt}`,
    '',
    '## Phase',
    '',
    UPLOAD_SYSTEM_PHASE,
    '',
    '## Supported File Types',
    '',
    ...r.supportedFileTypes.map((t) => `- .${t}`),
    '',
    '## Validation Rules',
    '',
    ...r.validationRules.map((rule) => `- ${rule}`),
    '',
    '## Security Checks',
    '',
    ...r.securityChecks.map((check) => `- ${check}`),
    '',
    '## Upload Verdicts',
    '',
    `- accepted: ${r.uploadVerdicts.accepted}`,
    `- rejected: ${r.uploadVerdicts.rejected}`,
    '',
    '## History Summary',
    '',
    `- total uploads: ${r.historySummary.totalUploads}`,
    `- accepted: ${r.historySummary.acceptedUploads}`,
    `- rejected: ${r.historySummary.rejectedUploads}`,
    `- images: ${r.historySummary.byCategory.IMAGE}`,
    `- documents: ${r.historySummary.byCategory.DOCUMENT}`,
    `- videos: ${r.historySummary.byCategory.VIDEO}`,
    `- unknown: ${r.historySummary.byCategory.UNKNOWN}`,
    '',
    '## Safety Guarantees',
    '',
    ...SAFETY_GUARANTEES.map((g) => `- ${g}`),
    '',
    '## Pass Token',
    '',
    UPLOAD_SYSTEM_PASS_TOKEN,
  ];

  return lines.join('\n');
}
