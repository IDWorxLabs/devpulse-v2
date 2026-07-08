/**
 * Workspace Materialization Stabilizer V1 — orchestrator.
 *
 * Runs immediately after materialization completes and BEFORE npm install / npm build / preview
 * begin. Audits the generated workspace, applies minimal repairs where safe, and returns a
 * normalized status plus a plain-English summary. Never attempts to regenerate the whole
 * application, never touches unrelated files, never hides a real failure behind a fake repair.
 */

import type {
  WorkspaceMaterializationAuditInput,
  WorkspaceMaterializationReport,
  WorkspaceMaterializationStatus,
} from './workspace-materialization-types.js';
import { WORKSPACE_MATERIALIZATION_STABILIZER_V1_CONTRACT } from './workspace-materialization-types.js';
import { auditWorkspaceMaterialization } from './workspace-materialization-auditor.js';
import { applyRepairs } from './workspace-materialization-repair.js';
import { buildWorkspaceMaterializationSummary } from './workspace-materialization-report.js';
import { readManifest } from './workspace-materialization-validator.js';

function deriveStatus(input: {
  corrupted: boolean;
  hadFindings: boolean;
  blockingRemains: boolean;
  repairableRemains: boolean;
}): WorkspaceMaterializationStatus {
  if (input.corrupted) return 'WORKSPACE_CORRUPTED';
  if (input.blockingRemains) return 'WORKSPACE_BLOCKED';
  if (!input.hadFindings) return 'WORKSPACE_COMPLETE';
  if (input.repairableRemains) return 'WORKSPACE_INCOMPLETE';
  return 'WORKSPACE_REPAIRED';
}

export function stabilizeWorkspaceMaterialization(
  input: WorkspaceMaterializationAuditInput,
): WorkspaceMaterializationReport {
  const startedAt = Date.now();
  const evidence = auditWorkspaceMaterialization(input);

  if (evidence.corrupted) {
    const status: WorkspaceMaterializationStatus = 'WORKSPACE_CORRUPTED';
    return {
      readOnly: true,
      contractVersion: WORKSPACE_MATERIALIZATION_STABILIZER_V1_CONTRACT,
      status,
      evidence,
      repairActions: [],
      summary: buildWorkspaceMaterializationSummary(status, evidence, []),
      durationMs: Date.now() - startedAt,
    };
  }

  if (evidence.findings.length === 0) {
    const status: WorkspaceMaterializationStatus = 'WORKSPACE_COMPLETE';
    return {
      readOnly: true,
      contractVersion: WORKSPACE_MATERIALIZATION_STABILIZER_V1_CONTRACT,
      status,
      evidence,
      repairActions: [],
      summary: buildWorkspaceMaterializationSummary(status, evidence, []),
      durationMs: Date.now() - startedAt,
    };
  }

  const manifestResult = readManifest(input.workspaceDir);
  const { repairActions, remainingFindings } = applyRepairs(
    input.workspaceDir,
    evidence.findings,
    evidence.featureModules,
    manifestResult.manifest,
  );

  const blockingRemains = remainingFindings.some((f) => f.severity === 'BLOCKING');
  const repairableRemains = remainingFindings.some((f) => f.severity === 'REPAIRABLE');

  const status = deriveStatus({
    corrupted: false,
    hadFindings: true,
    blockingRemains,
    repairableRemains,
  });

  return {
    readOnly: true,
    contractVersion: WORKSPACE_MATERIALIZATION_STABILIZER_V1_CONTRACT,
    status,
    evidence,
    repairActions,
    summary: buildWorkspaceMaterializationSummary(status, evidence, repairActions),
    durationMs: Date.now() - startedAt,
  };
}
