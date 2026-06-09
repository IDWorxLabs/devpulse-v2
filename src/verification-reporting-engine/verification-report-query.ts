/**
 * Verification report query — filter and search reports.
 */

import {
  listReports,
  listReportsByProject,
  listReportsBySession,
  listReportsByType,
  listReportsByWorkspace,
} from './verification-report-store.js';
import type { ReportType, VerificationReport } from './verification-report-types.js';

export interface ReportQueryCriteria {
  reportType?: ReportType;
  projectId?: string;
  workspaceId?: string;
  sessionId?: string;
  reportStatus?: string;
  generatedBy?: string;
}

export function queryReports(criteria: ReportQueryCriteria): VerificationReport[] {
  let results = listReports();

  if (criteria.projectId) results = listReportsByProject(criteria.projectId);
  else if (criteria.workspaceId) results = listReportsByWorkspace(criteria.workspaceId);
  else if (criteria.sessionId) results = listReportsBySession(criteria.sessionId);
  else if (criteria.reportType) results = listReportsByType(criteria.reportType);

  if (criteria.reportStatus) {
    results = results.filter((r) => r.reportStatus === criteria.reportStatus);
  }
  if (criteria.generatedBy) {
    results = results.filter((r) => r.reportOwner.generatedBy === criteria.generatedBy);
  }

  return results;
}

export function countReportsByType(reports: VerificationReport[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of reports) {
    counts[r.reportType] = (counts[r.reportType] ?? 0) + 1;
  }
  return counts;
}
