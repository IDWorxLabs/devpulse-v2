/**
 * Controlled builder execution proof integration — 24A.1 / 24A.4 / 24A.5 (Phase 24C).
 */

import {
  CONTROLLED_BUILDER_EXECUTION_ENGINE_OWNER_MODULE,
  FUTURE_MOBILE_BUILD_SESSION_TYPES,
} from './controlled-builder-execution-engine-bounds.js';
import { getBuilderExecutionAuditCount } from './builder-execution-audit-trail.js';
import { listControlledExecutionEvidence } from './builder-execution-evidence-collector.js';
import { listBuilderExecutionSessions } from './builder-execution-session.js';
import { verifyWorkspaceIsolation } from './workspace-isolation-authority.js';

export interface ControlledBuilderExecutionSummary {
  ownerModule: string;
  executionConnected: boolean;
  sessions: {
    count: number;
    latestState: string | null;
    latestId: string | null;
    label: string;
  };
  actions: {
    completed: number;
    label: string;
  };
  evidence: {
    count: number;
    latestTypes: string[];
    label: string;
  };
  state: {
    label: string;
    readiness: string;
  };
  isolation: {
    status: string;
    label: string;
  };
  realityEvidenceLines: string[];
  founderConclusion: string;
}

export function collectControlledBuilderExecutionEvidenceLines(
  executionConnected = false,
): string[] {
  const sessions = listBuilderExecutionSessions();
  const evidence = listControlledExecutionEvidence();
  const lines: string[] = [];

  if (sessions.length > 0) {
    lines.push(
      `[OBSERVED] Execution session exists (${sessions[0].sessionId}) — state ${sessions[0].state}`,
    );
  }
  const completedActions = sessions
    .filter((s) => s.state === 'COMPLETED')
    .reduce((sum, s) => sum + s.actionCount, 0);
  if (completedActions > 0) {
    lines.push(`[OBSERVED] Execution actions completed (${completedActions}) in isolated workspace`);
  }
  if (evidence.length > 0) {
    lines.push(
      `[OBSERVED] Execution evidence produced (${evidence.length}) — ${evidence
        .slice(0, 4)
        .map((e) => e.evidenceType)
        .join(', ')}`,
    );
  }
  if (sessions[0]) {
    const isolation = verifyWorkspaceIsolation({ workspaceId: sessions[0].workspaceId });
    lines.push(`[${isolation.result === 'WORKSPACE_ISOLATION_PASS' ? 'OBSERVED' : 'MISSING'}] Workspace isolation status — ${isolation.result}`);
  }

  if (executionConnected) {
    lines.push('[PROVEN] Controlled builder execution connected via observable session evidence');
  } else {
    lines.push('[MISSING] executionConnected remains false until controlled session completes with evidence');
  }

  lines.push(
    `[CLAIMED] Mobile build session extension points reserved — ${FUTURE_MOBILE_BUILD_SESSION_TYPES.slice(0, 3).join(', ')}`,
  );

  return lines.slice(0, 12);
}

export function getControlledBuilderExecutionSummary(
  executionConnected = false,
): ControlledBuilderExecutionSummary {
  const sessions = listBuilderExecutionSessions();
  const evidence = listControlledExecutionEvidence();
  const latest = sessions[0] ?? null;
  const completedActions = sessions
    .filter((s) => s.state === 'COMPLETED')
    .reduce((sum, s) => sum + s.actionCount, 0);
  const isolation = latest
    ? verifyWorkspaceIsolation({ workspaceId: latest.workspaceId })
    : null;

  const sessionLabel =
    sessions.length > 0
      ? `${sessions.length} session(s) — latest ${latest?.state ?? 'UNKNOWN'}`
      : 'No execution sessions yet';

  const actionLabel =
    completedActions > 0
      ? `${completedActions} approved action(s) completed in isolated workspace`
      : 'No controlled actions completed yet';

  const evidenceLabel =
    evidence.length > 0
      ? `${evidence.length} evidence record(s) — audit trail ${getBuilderExecutionAuditCount()}`
      : 'No controlled execution evidence yet';

  const stateLabel = executionConnected
    ? 'Controlled execution connected — evidence-backed session completed'
    : 'Controlled execution foundation active — session evidence pending or incomplete';

  const readiness = executionConnected ? 'CONTROLLED_EXECUTION_READY' : 'CONTROLLED_EXECUTION_BLOCKED';

  const isolationLabel = isolation
    ? `${isolation.result} — ${isolation.reason}`
    : 'No workspace to verify';

  return {
    ownerModule: CONTROLLED_BUILDER_EXECUTION_ENGINE_OWNER_MODULE,
    executionConnected,
    sessions: {
      count: sessions.length,
      latestState: latest?.state ?? null,
      latestId: latest?.sessionId ?? null,
      label: sessionLabel,
    },
    actions: {
      completed: completedActions,
      label: actionLabel,
    },
    evidence: {
      count: evidence.length,
      latestTypes: evidence.slice(0, 6).map((e) => e.evidenceType),
      label: evidenceLabel,
    },
    state: {
      label: stateLabel,
      readiness,
    },
    isolation: {
      status: isolation?.result ?? 'WORKSPACE_ISOLATION_FAIL',
      label: isolationLabel,
    },
    realityEvidenceLines: collectControlledBuilderExecutionEvidenceLines(executionConnected),
    founderConclusion: executionConnected
      ? 'Controlled builder execution is connected — approved actions ran inside an isolated workspace with automatic evidence and audit trail. DevPulse still cannot autonomously build complete software.'
      : 'Controlled builder execution engine is ready — sessions, approved actions, evidence, and audit trails are supported. executionConnected becomes true only when a controlled session completes with observable evidence.',
  };
}

export function integrateControlledBuilderExecutionWithRealityReporting(executionConnected = false): {
  builderRealitySignals: string[];
  workflowRealitySignals: string[];
  dashboardSignals: string[];
} {
  const summary = getControlledBuilderExecutionSummary(executionConnected);
  return {
    builderRealitySignals: summary.realityEvidenceLines.filter(
      (l) => l.includes('session') || l.includes('action') || l.includes('evidence'),
    ),
    workflowRealitySignals: [
      'Controlled execution enables Plan → Tasks → Executable Builder Actions → Evidence',
      executionConnected
        ? 'BUILD may advance when executionConnected=true via controlled session proof'
        : 'BUILD remains blocked until controlled session evidence connects execution',
    ],
    dashboardSignals: [
      summary.sessions.label,
      summary.actions.label,
      summary.evidence.label,
      summary.isolation.label,
    ],
  };
}
