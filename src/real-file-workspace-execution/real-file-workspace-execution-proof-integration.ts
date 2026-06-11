/**
 * Real file workspace execution proof integration — 24A / 24B / 24C / 24.5 dashboard (Phase 24D).
 */

import { GENERATED_BUILDER_WORKSPACES_DIR, REAL_FILE_WORKSPACE_EXECUTION_OWNER_MODULE } from './real-file-workspace-execution-bounds.js';
import { getRealFileExecutionEvidenceCount, listRealFileExecutionEvidence } from './real-file-execution-evidence.js';
import { listRealFileWorkspaceExecutionSessions } from './real-file-workspace-execution-session.js';

export interface RealFileWorkspaceExecutionSummary {
  ownerModule: string;
  workspacePathStatus: string;
  productionProtectionStatus: string;
  sessions: {
    count: number;
    latestState: string | null;
    label: string;
  };
  operations: {
    completed: number;
    blocked: number;
    label: string;
  };
  evidence: {
    count: number;
    latestTypes: string[];
    label: string;
  };
  realFileExecutionActive: boolean;
  realityEvidenceLines: string[];
  founderConclusion: string;
}

export function collectRealFileWorkspaceExecutionEvidenceLines(
  realFileExecutionActive = false,
): string[] {
  const sessions = listRealFileWorkspaceExecutionSessions();
  const evidence = listRealFileExecutionEvidence();
  const lines: string[] = [];

  if (sessions.length > 0) {
    lines.push(
      `[OBSERVED] Real file workspace session (${sessions[0].sessionId}) — ${sessions[0].state} at ${sessions[0].workspaceRoot}`,
    );
  }
  const completed = sessions.reduce((sum, s) => sum + s.operationsCompleted, 0);
  if (completed > 0) {
    lines.push(`[OBSERVED] Real file operations completed (${completed}) in isolated generated workspace`);
  }
  if (evidence.some((e) => e.evidenceType === 'FILE_CREATED' || e.evidenceType === 'FILE_MODIFIED')) {
    lines.push('[OBSERVED] Real isolated workspace file evidence produced — not in-memory only');
  }
  lines.push(`[CLAIMED] Production protection active — writes only under ${GENERATED_BUILDER_WORKSPACES_DIR}/`);
  if (realFileExecutionActive) {
    lines.push('[PROVEN] Real file workspace execution connected via observable file evidence');
  } else {
    lines.push('[MISSING] Real file execution pending or incomplete');
  }
  return lines.slice(0, 10);
}

export function getRealFileWorkspaceExecutionSummary(
  realFileExecutionActive = false,
): RealFileWorkspaceExecutionSummary {
  const sessions = listRealFileWorkspaceExecutionSessions();
  const evidence = listRealFileExecutionEvidence();
  const latest = sessions[0] ?? null;
  const completed = sessions.reduce((sum, s) => sum + s.operationsCompleted, 0);
  const blocked = sessions.reduce((sum, s) => sum + s.operationsBlocked, 0);

  return {
    ownerModule: REAL_FILE_WORKSPACE_EXECUTION_OWNER_MODULE,
    workspacePathStatus: latest
      ? `Isolated root ${latest.workspaceRoot}`
      : `Ready under ${GENERATED_BUILDER_WORKSPACES_DIR}/ — no session yet`,
    productionProtectionStatus:
      'DevPulse production workspace writes blocked — generated builder workspaces only',
    sessions: {
      count: sessions.length,
      latestState: latest?.state ?? null,
      label:
        sessions.length > 0
          ? `${sessions.length} real file session(s) — latest ${latest?.state ?? 'UNKNOWN'}`
          : 'No real file sessions yet',
    },
    operations: {
      completed,
      blocked,
      label:
        completed > 0
          ? `${completed} operation(s) completed, ${blocked} blocked`
          : 'No real file operations completed yet',
    },
    evidence: {
      count: evidence.length,
      latestTypes: evidence.slice(0, 6).map((e) => e.evidenceType),
      label:
        evidence.length > 0
          ? `${evidence.length} real file evidence record(s)`
          : 'No real file execution evidence yet',
    },
    realFileExecutionActive,
    realityEvidenceLines: collectRealFileWorkspaceExecutionEvidenceLines(realFileExecutionActive),
    founderConclusion: realFileExecutionActive
      ? 'Real file workspace execution is active — DevPulse can safely create and modify files inside isolated builder workspaces with evidence. Builds, dependency installs, and app launches are not available yet.'
      : 'Real file workspace execution foundation is ready — isolated paths, operation models, and production protection exist. Real file sessions produce evidence under .generated-builder-workspaces/ only.',
  };
}

export function integrateRealFileWorkspaceExecutionWithRealityReporting(realFileExecutionActive = false): {
  builderRealitySignals: string[];
  workflowRealitySignals: string[];
  dashboardSignals: string[];
} {
  const summary = getRealFileWorkspaceExecutionSummary(realFileExecutionActive);
  return {
    builderRealitySignals: summary.realityEvidenceLines,
    workflowRealitySignals: [
      'Real file execution moves from in-memory evidence to isolated workspace file evidence',
      realFileExecutionActive
        ? 'BUILD may advance when real file + build/runtime proof chain completes'
        : 'BUILD bottleneck may remain until build/runtime evidence exists',
    ],
    dashboardSignals: [
      summary.workspacePathStatus,
      summary.sessions.label,
      summary.operations.label,
      summary.productionProtectionStatus,
    ],
  };
}
