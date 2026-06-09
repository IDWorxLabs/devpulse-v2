/**
 * Verification report export — JSON, founder, UVL, and World 2 structured exports.
 */

import type { ReportHistoryEntry, VerificationReport } from './verification-report-types.js';

export interface ReportExportBundle {
  json: string;
  founder: string;
  uvl: string;
  world2: string;
}

export function exportReportsAsJson(reports: VerificationReport[]): string {
  return JSON.stringify(
    {
      exportType: 'VERIFICATION_REPORT_JSON',
      reportCount: reports.length,
      reports: reports.map((r) => ({
        reportId: r.reportId,
        reportType: r.reportType,
        reportStatus: r.reportStatus,
        reportSummary: r.reportSummary,
        reportEvidence: r.reportEvidence,
        reportFindings: r.reportFindings,
        ownerModule: r.reportOwner.ownerModule,
        generatedAt: r.reportOwner.generatedAt,
      })),
      reportingOnly: true,
    },
    null,
    2,
  );
}

export function exportFounderReport(reports: VerificationReport[], authorityId: string): string {
  const founder = reports.find((r) => r.reportType === 'FOUNDER_VERIFICATION_REPORT');
  const summary = reports.find((r) => r.reportType === 'VERIFICATION_SUMMARY_REPORT');
  const lines = [
    'Founder Verification Report Export',
    `Authority: ${authorityId}`,
    '',
    founder?.reportSummary ?? 'No founder report',
    '',
    'Summary:',
    summary?.reportSummary ?? 'No summary',
    '',
    'Key findings:',
    ...(founder?.reportFindings ?? summary?.reportFindings ?? []).slice(0, 6).map((f) => `• ${f}`),
    '',
    'Evidence linked:',
    ...(founder?.reportEvidence ?? []).slice(0, 5).map((e) => `• ${e}`),
    '',
    'Reporting only — no trust scoring, auto-fix, or execution decisions.',
  ];
  return lines.join('\n');
}

export function exportUvlReport(reports: VerificationReport[], sessions: string[]): string {
  const uvl = reports.find((r) => r.reportType === 'UVL_VERIFICATION_REPORT');
  return JSON.stringify(
    {
      exportType: 'UVL_VERIFICATION_EXPORT',
      uvlReportId: uvl?.reportId ?? null,
      summary: uvl?.reportSummary ?? null,
      sessions,
      reportTypes: reports.map((r) => r.reportType),
      evidenceLinked: uvl?.reportEvidence ?? [],
      reportingOnly: true,
    },
    null,
    2,
  );
}

export function exportWorld2Report(reports: VerificationReport[]): string {
  const w2 = reports.find((r) => r.reportType === 'WORLD2_VERIFICATION_REPORT');
  const completion = reports.find((r) => r.reportType === 'COMPLETION_VERIFICATION_REPORT');
  return JSON.stringify(
    {
      exportType: 'WORLD2_VERIFICATION_EXPORT',
      world2ReportId: w2?.reportId ?? null,
      completionReportId: completion?.reportId ?? null,
      summary: w2?.reportSummary ?? null,
      completionCriteria: completion?.reportFindings ?? [],
      evidenceLinked: [...(w2?.reportEvidence ?? []), ...(completion?.reportEvidence ?? [])],
      reportingOnly: true,
    },
    null,
    2,
  );
}

export function buildReportExportBundle(opts: {
  reports: VerificationReport[];
  authorityId: string;
  sessions: string[];
  history: ReportHistoryEntry[];
}): ReportExportBundle {
  return {
    json: exportReportsAsJson(opts.reports),
    founder: exportFounderReport(opts.reports, opts.authorityId),
    uvl: exportUvlReport(opts.reports, opts.sessions),
    world2: exportWorld2Report(opts.reports),
  };
}
