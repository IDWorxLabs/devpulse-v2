/**
 * Evidence validator — integrity checks producing diagnostics only.
 */

import { validateOwnershipPresent } from './verification-evidence-ownership.js';
import { detectBrokenLineageReferences } from './verification-evidence-lineage.js';
import { listEvidence } from './verification-evidence-store.js';
import type {
  EvidenceRecord,
  EvidenceValidationIssue,
  EvidenceValidationResult,
} from './verification-evidence-types.js';

export function validateEvidenceIntegrity(records: EvidenceRecord[] = listEvidence()): EvidenceValidationResult {
  const issues: EvidenceValidationIssue[] = [];
  const warnings: string[] = [
    'Phase 16.10 — evidence authority layer only',
    'No verification execution, trust engine decisions, or auto-fix',
    'No provider execution or evidence invention outside registry',
  ];

  const seenIds = new Set<string>();

  for (const record of records) {
    if (seenIds.has(record.evidenceId)) {
      issues.push({
        code: 'DUPLICATE_ID',
        severity: 'CRITICAL',
        message: `Duplicate evidence id: ${record.evidenceId}`,
        evidenceId: record.evidenceId,
      });
    }
    seenIds.add(record.evidenceId);

    if (!record.evidenceType) {
      issues.push({
        code: 'MISSING_TYPE',
        severity: 'HIGH',
        message: 'Missing evidence type',
        evidenceId: record.evidenceId,
      });
    }

    if (!record.evidenceTimestamp || record.evidenceTimestamp <= 0) {
      issues.push({
        code: 'MISSING_TIMESTAMP',
        severity: 'HIGH',
        message: 'Missing or invalid evidence timestamp',
        evidenceId: record.evidenceId,
      });
    }

    const ownershipIssue = validateOwnershipPresent(record);
    if (ownershipIssue) {
      issues.push({
        code: 'MISSING_OWNERSHIP',
        severity: 'HIGH',
        message: ownershipIssue,
        evidenceId: record.evidenceId,
      });
    }
  }

  for (const broken of detectBrokenLineageReferences(records)) {
    issues.push({
      code: 'BROKEN_LINEAGE',
      severity: 'MEDIUM',
      message: `Broken lineage reference: ${broken.missingRef}`,
      evidenceId: broken.evidenceId,
    });
  }

  for (const record of records) {
    for (const dep of record.evidenceDependencies) {
      if (!seenIds.has(dep) && !records.some((r) => r.evidenceId === dep)) {
        issues.push({
          code: 'INVALID_REFERENCE',
          severity: 'MEDIUM',
          message: `Invalid dependency reference: ${dep}`,
          evidenceId: record.evidenceId,
        });
      }
    }
    for (const rel of record.evidenceRelationships) {
      if (!records.some((r) => r.evidenceId === rel)) {
        issues.push({
          code: 'INVALID_REFERENCE',
          severity: 'LOW',
          message: `Invalid relationship reference: ${rel}`,
          evidenceId: record.evidenceId,
        });
      }
    }
  }

  const valid = issues.filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH').length === 0;
  return { valid, issues, warnings };
}

export interface EvidenceGateReport {
  gates: Array<{ name: string; satisfied: boolean; summary: string }>;
  blockers: string[];
}

export function evaluateEvidenceGates(
  input: {
    projectExists?: boolean;
    workspaceExists?: boolean;
    ownershipValid?: boolean;
    world1Protected?: boolean;
    evidenceCount: number;
  },
): EvidenceGateReport {
  const gates = [
    {
      name: 'Project Exists',
      satisfied: input.projectExists ?? true,
      summary: 'Project must exist for evidence context',
    },
    {
      name: 'Workspace Exists',
      satisfied: input.workspaceExists ?? true,
      summary: 'Workspace must exist for evidence isolation',
    },
    {
      name: 'Evidence Registered',
      satisfied: input.evidenceCount > 0,
      summary: 'At least one evidence record must be registered',
    },
    {
      name: 'Ownership Valid',
      satisfied: input.ownershipValid ?? true,
      summary: 'Verification evidence engine ownership must be registered',
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

export function validateVerificationEvidence(opts: {
  gateReport: EvidenceGateReport;
  validationResult: EvidenceValidationResult;
}): EvidenceValidationResult {
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
