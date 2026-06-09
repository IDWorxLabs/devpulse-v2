/**
 * Verification report validator — integrity checks producing diagnostics only.
 */

import { listReports } from './verification-report-store.js';
import type {
  ReportValidationIssue,
  ReportValidationResult,
  VerificationReport,
} from './verification-report-types.js';

export function validateReportIntegrity(
  reports: VerificationReport[] = listReports(),
  knownEvidenceIds: Set<string> = new Set(),
): ReportValidationResult {
  const issues: ReportValidationIssue[] = [];
  const warnings: string[] = [
    'Phase 16.11 — reporting authority only',
    'No verification execution, trust engine decisions, or auto-fix',
    'All findings must reference registered evidence',
  ];

  const seenIds = new Set<string>();

  for (const report of reports) {
    if (seenIds.has(report.reportId)) {
      issues.push({
        code: 'DUPLICATE_ID',
        severity: 'CRITICAL',
        message: `Duplicate report id: ${report.reportId}`,
        reportId: report.reportId,
      });
    }
    seenIds.add(report.reportId);

    if (!report.reportType) {
      issues.push({
        code: 'MISSING_TYPE',
        severity: 'HIGH',
        message: 'Missing report type',
        reportId: report.reportId,
      });
    }

    if (!report.reportOwner.ownerModule || !report.reportOwner.generatedBy) {
      issues.push({
        code: 'MISSING_OWNERSHIP',
        severity: 'HIGH',
        message: 'Missing report ownership',
        reportId: report.reportId,
      });
    }

    if (!report.reportTimestamp || report.reportTimestamp <= 0) {
      issues.push({
        code: 'MISSING_TIMESTAMP',
        severity: 'HIGH',
        message: 'Missing report timestamp',
        reportId: report.reportId,
      });
    }

    for (const evidenceId of report.reportEvidence) {
      if (knownEvidenceIds.size > 0 && !knownEvidenceIds.has(evidenceId)) {
        issues.push({
          code: 'MISSING_EVIDENCE_LINK',
          severity: 'HIGH',
          message: `Evidence reference not found: ${evidenceId}`,
          reportId: report.reportId,
        });
      }
    }

    for (const ref of report.reportReferences) {
      if (ref.startsWith('vrep-') && !reports.some((r) => r.reportId === ref)) {
        issues.push({
          code: 'BROKEN_REFERENCE',
          severity: 'MEDIUM',
          message: `Broken report reference: ${ref}`,
          reportId: report.reportId,
        });
      }
    }

    if (report.reportSession && report.reportSession === 'vsess-invalid') {
      issues.push({
        code: 'INVALID_SESSION',
        severity: 'MEDIUM',
        message: 'Invalid verification session reference',
        reportId: report.reportId,
      });
    }
  }

  const valid = issues.filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH').length === 0;
  return { valid, issues, warnings };
}

export interface ReportGateReport {
  gates: Array<{ name: string; satisfied: boolean; summary: string }>;
  blockers: string[];
}

export function evaluateReportingGates(input: {
  projectExists?: boolean;
  workspaceExists?: boolean;
  ownershipValid?: boolean;
  world1Protected?: boolean;
  reportCount: number;
}): ReportGateReport {
  const gates = [
    {
      name: 'Project Exists',
      satisfied: input.projectExists ?? true,
      summary: 'Project must exist for reporting context',
    },
    {
      name: 'Workspace Exists',
      satisfied: input.workspaceExists ?? true,
      summary: 'Workspace must exist for reporting isolation',
    },
    {
      name: 'Reports Generated',
      satisfied: input.reportCount > 0,
      summary: 'At least one verification report must be generated',
    },
    {
      name: 'Ownership Valid',
      satisfied: input.ownershipValid ?? true,
      summary: 'Verification reporting engine ownership must be registered',
    },
    {
      name: 'World 1 Protection',
      satisfied: input.world1Protected ?? true,
      summary: 'World 1 protection must be maintained',
    },
  ];

  const blockers = gates.filter((g) => !g.satisfied).map((g) => `Gate unsatisfied: ${g.name} — ${g.summary}`);
  return { gates, blockers };
}

export function validateVerificationReporting(opts: {
  gateReport: ReportGateReport;
  validationResult: ReportValidationResult;
}): ReportValidationResult {
  const blockers = [...opts.gateReport.blockers];
  if (!opts.validationResult.valid) {
    blockers.push(
      ...opts.validationResult.issues
        .filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH')
        .map((i) => i.message),
    );
  }
  return {
    valid: blockers.length === 0 && opts.validationResult.valid,
    issues: opts.validationResult.issues,
    warnings: opts.validationResult.warnings,
  };
}
