/**
 * Universal Workflow Generation Engine V1 — workflow normalization.
 */

import type { RawApprovedWorkflow } from './universal-workflow-types.js';
import type { CbgaCanonicalContractEvidence } from '../contract-bound-generation-authority-v4/contract-bound-generation-types.js';

export interface NormalizedWorkflowShape {
  readonly raw: RawApprovedWorkflow;
  readonly kind: 'linear' | 'branching' | 'approval' | 'form' | 'informational';
  readonly stageLabels: readonly string[];
  readonly hasApprovalBranch: boolean;
  readonly hasSchedulingSemantics: boolean;
}

const SCHEDULING_HINTS = ['schedule', 'reschedule', 'calendar slot', 'time slot'];

export function normalizeApprovedWorkflow(
  raw: RawApprovedWorkflow,
  contract: CbgaCanonicalContractEvidence,
): NormalizedWorkflowShape {
  const lower = raw.label.toLowerCase();
  const hasSchedulingSemantics = SCHEDULING_HINTS.some((h) => lower.includes(h));
  const actionLabels = [...contract.coreActions];
  const hasApprovalBranch =
    actionLabels.some((a) => /approve|accept/i.test(a)) &&
    actionLabels.some((a) => /reject|deny/i.test(a));

  if (/^(about|info|overview|help)/i.test(raw.label)) {
    return { raw, kind: 'informational', stageLabels: [], hasApprovalBranch: false, hasSchedulingSemantics };
  }

  const stageLabels = deriveStageLabels(raw.label, actionLabels);
  const kind = hasApprovalBranch
    ? 'approval'
    : stageLabels.length >= 4
      ? 'form'
      : hasApprovalBranch
        ? 'branching'
        : 'linear';

  return { raw, kind, stageLabels, hasApprovalBranch, hasSchedulingSemantics };
}

function deriveStageLabels(workflowLabel: string, actions: readonly string[]): string[] {
  const ordered: string[] = ['Start'];
  const semanticOrder = [
    { test: /create|add|draft|register|new/i, label: 'Create' },
    { test: /review|qualify|inspect/i, label: 'Review' },
    { test: /submit|send/i, label: 'Submit' },
    { test: /approve|accept/i, label: 'Approve' },
    { test: /reject|deny/i, label: 'Reject' },
    { test: /confirm/i, label: 'Confirm' },
    { test: /complete|finish|close/i, label: 'Complete' },
  ];
  for (const { test, label } of semanticOrder) {
    if (actions.some((a) => test.test(a)) && !ordered.includes(label)) ordered.push(label);
  }
  if (ordered.length === 1) {
    ordered.push(`${workflowLabel} — Step 1`, `${workflowLabel} — Step 2`, 'Complete');
  }
  if (!ordered.includes('Complete')) ordered.push('Complete');
  return ordered;
}

export function normalizeApprovedWorkflows(
  rawWorkflows: readonly RawApprovedWorkflow[],
  contract: CbgaCanonicalContractEvidence,
): NormalizedWorkflowShape[] {
  return rawWorkflows.map((raw) => normalizeApprovedWorkflow(raw, contract));
}
