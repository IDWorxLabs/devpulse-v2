/**
 * Workflow Alignment Analyzer — cross-source workflow agreement (V1).
 */

import { normalizeWorkflow } from './evidence-normalizer.js';
import type { AlignmentEvidenceBundle, WorkflowAlignmentResult } from './intake-alignment-types.js';

export function analyzeWorkflowAlignment(bundle: AlignmentEvidenceBundle): WorkflowAlignmentResult {
  const normalized = bundle.workflows.map((w) => normalizeWorkflow(w));
  const unique = [...new Set(normalized)];

  let workflowAlignmentScore = unique.length === 0 ? 35 : unique.length === 1 ? 60 : 78;
  if (unique.length >= 3) workflowAlignmentScore = 88;

  const hasAuth = unique.some((w) => w === 'authentication' || w === 'onboarding');
  const hasPayments = unique.some((w) => w === 'checkout' || w === 'ordering');
  if (hasAuth && hasPayments) workflowAlignmentScore = Math.max(workflowAlignmentScore, 85);

  return {
    readOnly: true,
    workflows: unique,
    workflowAlignmentScore,
    evidence: [`WORKFLOWS_${unique.length}`],
  };
}
