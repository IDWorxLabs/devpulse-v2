/**
 * Verification report store — in-memory reporting authority runtime.
 */

import type { ReportType, VerificationReport } from './verification-report-types.js';

const reports = new Map<string, VerificationReport>();
const reportTypes = new Set<string>();

let reportCounter = 0;

export function resetVerificationReportStoreForTests(): void {
  reports.clear();
  reportTypes.clear();
  reportCounter = 0;
}

export function nextReportId(): string {
  reportCounter += 1;
  return `vrep-${reportCounter.toString().padStart(4, '0')}`;
}

export interface RegisterReportResult {
  ok: boolean;
  report: VerificationReport | null;
  duplicate: boolean;
  error: string | null;
}

export function registerReport(report: VerificationReport): RegisterReportResult {
  if (reports.has(report.reportId)) {
    return { ok: false, report: null, duplicate: true, error: 'Duplicate report id rejected' };
  }
  reports.set(report.reportId, report);
  reportTypes.add(report.reportType);
  return { ok: true, report, duplicate: false, error: null };
}

export function getReport(reportId: string): VerificationReport | null {
  return reports.get(reportId) ?? null;
}

export function listReports(): VerificationReport[] {
  return [...reports.values()];
}

export function listReportsBySession(sessionId: string): VerificationReport[] {
  return listReports().filter(
    (r) => r.reportSession === sessionId || r.reportOwner.verificationSession === sessionId,
  );
}

export function listReportsByProject(projectId: string): VerificationReport[] {
  return listReports().filter((r) => r.reportOwner.projectId === projectId);
}

export function listReportsByWorkspace(workspaceId: string): VerificationReport[] {
  return listReports().filter((r) => r.reportOwner.workspaceId === workspaceId);
}

export function listReportsByType(reportType: ReportType): VerificationReport[] {
  return listReports().filter((r) => r.reportType === reportType);
}

export function updateReport(report: VerificationReport): VerificationReport | null {
  if (!reports.has(report.reportId)) return null;
  reports.set(report.reportId, report);
  return report;
}

export function listRegisteredReportTypes(): string[] {
  return [...reportTypes];
}
