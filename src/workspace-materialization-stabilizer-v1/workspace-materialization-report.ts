/**
 * Workspace Materialization Stabilizer V1 — plain-English report builder.
 */

import type {
  WorkspaceMaterializationAuditEvidence,
  WorkspaceMaterializationPlainEnglishSummary,
  WorkspaceMaterializationRepairAction,
  WorkspaceMaterializationStatus,
} from './workspace-materialization-types.js';

function headlineFor(status: WorkspaceMaterializationStatus, repairedCount: number, stillMissingCount: number): string {
  switch (status) {
    case 'WORKSPACE_COMPLETE':
      return 'The generated workspace is complete and internally consistent.';
    case 'WORKSPACE_REPAIRED':
      return `AiDevEngine repaired ${repairedCount} workspace issue${repairedCount === 1 ? '' : 's'} before the build started.`;
    case 'WORKSPACE_INCOMPLETE':
      return `The generated workspace still has ${stillMissingCount} unresolved issue${stillMissingCount === 1 ? '' : 's'} AiDevEngine could not safely repair.`;
    case 'WORKSPACE_CORRUPTED':
      return 'The generated workspace looks corrupted. AiDevEngine did not attempt any repairs.';
    case 'WORKSPACE_BLOCKED':
      return 'The generated workspace is missing critical files AiDevEngine cannot safely reconstruct.';
    default:
      return 'Workspace status is unknown.';
  }
}

function whatToDoNextFor(status: WorkspaceMaterializationStatus): string {
  switch (status) {
    case 'WORKSPACE_COMPLETE':
    case 'WORKSPACE_REPAIRED':
      return 'The workspace is ready — the build will continue automatically.';
    case 'WORKSPACE_INCOMPLETE':
      return 'The build will still be attempted, but these issues may cause it to fail. Consider rebuilding with a more specific prompt.';
    case 'WORKSPACE_CORRUPTED':
      return 'Start a new build. AiDevEngine will not modify a corrupted workspace to avoid hiding the real problem.';
    case 'WORKSPACE_BLOCKED':
      return 'Start a new build so AiDevEngine can materialize a complete workspace from scratch.';
    default:
      return 'Start a new build.';
  }
}

export function buildWorkspaceMaterializationSummary(
  status: WorkspaceMaterializationStatus,
  evidence: WorkspaceMaterializationAuditEvidence,
  repairActions: WorkspaceMaterializationRepairAction[],
): WorkspaceMaterializationPlainEnglishSummary {
  const applied = repairActions.filter((a) => a.applied);
  const unresolved = repairActions.filter((a) => !a.applied);

  if (evidence.corrupted) {
    return {
      readOnly: true,
      headline: headlineFor(status, 0, 0),
      repaired: [],
      stillMissing: evidence.corruptionReasons,
      whatToDoNext: whatToDoNextFor(status),
    };
  }

  const repaired = applied.map((a) => a.description);
  const stillMissing = [
    ...unresolved.map((a) => a.detail),
    ...evidence.findings.filter((f) => f.severity === 'BLOCKING').map((f) => f.message),
  ];

  return {
    readOnly: true,
    headline: headlineFor(status, applied.length, stillMissing.length),
    repaired,
    stillMissing,
    whatToDoNext: whatToDoNextFor(status),
  };
}
