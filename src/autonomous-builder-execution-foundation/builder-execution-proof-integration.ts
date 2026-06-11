/**
 * Builder execution proof integration — feeds 24A.1 / 24A.4 / 24A.5 (Phase 24B).
 */

import {
  AUTONOMOUS_BUILDER_EXECUTION_FOUNDATION_OWNER_MODULE,
  FORBIDDEN_EXECUTION_TARGET,
  WORLD2_ISOLATION_RULE,
} from './autonomous-builder-execution-foundation-bounds.js';
import { getBuilderActionQueueSize, getBuilderQueueAuditCount, isBuilderActionQueuePaused, listQueuedBuilderActions } from './builder-action-queue.js';
import {
  getBuilderExecutionEvidenceCount,
  listBuilderExecutionEvidence,
} from './builder-execution-evidence.js';
import { getExecutionPlanCount, listExecutionPlans } from './builder-execution-plan-authority.js';
import {
  getBuilderExecutionWorkspaceCount,
  listBuilderExecutionWorkspaces,
} from './builder-execution-workspace.js';

export interface BuilderExecutionFoundationSummary {
  ownerModule: string;
  foundationReady: boolean;
  executionConnected: boolean;
  world2IsolationRule: string;
  forbiddenTarget: string;
  workspace: {
    count: number;
    latestState: string | null;
    latestId: string | null;
    label: string;
  };
  queue: {
    size: number;
    paused: boolean;
    auditCount: number;
    label: string;
  };
  evidence: {
    count: number;
    latestTypes: string[];
    label: string;
  };
  plan: {
    count: number;
    label: string;
  };
  realityEvidenceLines: string[];
  founderConclusion: string;
}

export function collectBuilderExecutionFoundationEvidenceLines(): string[] {
  const workspaces = listBuilderExecutionWorkspaces();
  const evidence = listBuilderExecutionEvidence();
  const plans = listExecutionPlans();
  const queueSize = getBuilderActionQueueSize();
  const lines: string[] = [];

  if (workspaces.length > 0) {
    lines.push(`[OBSERVED] Execution workspace created (${workspaces[0].workspaceId}) — ${workspaces[0].executionState}`);
  }
  if (plans.length > 0) {
    lines.push(`[OBSERVED] Execution plan generated (${plans[0].planId}) — ${plans[0].executionSteps.length} steps`);
  }
  if (queueSize > 0) {
    lines.push(`[OBSERVED] Execution actions queued (${queueSize}) — planned only, not executed in 24B`);
  }
  if (evidence.length > 0) {
    lines.push(
      `[OBSERVED] Execution evidence produced (${evidence.length}) — ${evidence
        .slice(0, 3)
        .map((e) => e.evidenceType)
        .join(', ')}`,
    );
  }

  lines.push(`[CLAIMED] World 2 isolation active — ${WORLD2_ISOLATION_RULE}`);
  lines.push('[MISSING] Connected autonomous builder execution producing completed build output');

  return lines.slice(0, 12);
}

export function getBuilderExecutionFoundationSummary(): BuilderExecutionFoundationSummary {
  const workspaces = listBuilderExecutionWorkspaces();
  const evidence = listBuilderExecutionEvidence();
  const plans = listExecutionPlans();
  const queueSize = getBuilderActionQueueSize();
  const latestWorkspace = workspaces[0] ?? null;

  const workspaceLabel =
    workspaces.length > 0
      ? `${workspaces.length} isolated workspace(s) — latest ${latestWorkspace?.executionState ?? 'UNKNOWN'}`
      : 'No execution workspace yet — foundation modules ready';

  const queueLabel =
    queueSize > 0
      ? `${queueSize} action(s) queued (planned only)`
      : 'Queue empty — ready for execution actions';

  const evidenceLabel =
    evidence.length > 0
      ? `${evidence.length} evidence record(s) collected`
      : 'No execution evidence recorded yet';

  const planLabel =
    plans.length > 0 ? `${plans.length} execution plan(s) generated` : 'No execution plans generated yet';

  return {
    ownerModule: AUTONOMOUS_BUILDER_EXECUTION_FOUNDATION_OWNER_MODULE,
    foundationReady: true,
    executionConnected: false,
    world2IsolationRule: WORLD2_ISOLATION_RULE,
    forbiddenTarget: FORBIDDEN_EXECUTION_TARGET,
    workspace: {
      count: workspaces.length,
      latestState: latestWorkspace?.executionState ?? null,
      latestId: latestWorkspace?.workspaceId ?? null,
      label: workspaceLabel,
    },
    queue: {
      size: queueSize,
      paused: isBuilderActionQueuePaused(),
      auditCount: getBuilderQueueAuditCount(),
      label: queueLabel,
    },
    evidence: {
      count: evidence.length,
      latestTypes: evidence.slice(0, 5).map((e) => e.evidenceType),
      label: evidenceLabel,
    },
    plan: {
      count: plans.length,
      label: planLabel,
    },
    realityEvidenceLines: collectBuilderExecutionFoundationEvidenceLines(),
    founderConclusion:
      'Structured execution foundation exists — workspaces, plans, actions, and evidence can be represented. DevPulse cannot yet autonomously build software; executionConnected remains false until completed build proof exists.',
  };
}

export function integrateBuilderExecutionFoundationWithRealityReporting(): {
  builderRealitySignals: string[];
  workflowRealitySignals: string[];
  dashboardSignals: string[];
} {
  const summary = getBuilderExecutionFoundationSummary();
  return {
    builderRealitySignals: summary.realityEvidenceLines.filter((l) => l.includes('workspace') || l.includes('plan')),
    workflowRealitySignals: [
      'Execution foundation enables Plan → Tasks → Executable Builder Actions representation',
      'BUILD remains blocked until connected execution produces build output evidence',
    ],
    dashboardSignals: [
      summary.workspace.label,
      summary.queue.label,
      summary.evidence.label,
    ],
  };
}
