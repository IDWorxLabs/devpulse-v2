/**
 * Autonomous Founder Launch Authority V1 — AutoFix pipeline bridge.
 */

import { buildAutoFixPlan } from '../auto-fix-runtime/auto-fix-plan-builder.js';
import type { FounderRemediationPlan } from './autonomous-founder-launch-authority-types.js';

export interface FounderAutofixDispatchResult {
  readOnly: true;
  dispatched: boolean;
  autofixPlanId: string | null;
  autofixState: string | null;
  issueCount: number;
  detail: string;
}

export function dispatchFounderRemediationToAutofix(
  plan: FounderRemediationPlan,
): FounderAutofixDispatchResult {
  const query = plan.issues
    .filter((issue) => issue.autofixEligible)
    .map((issue) => `[${issue.severity}] ${issue.summary} — ${issue.recommendedFix}`)
    .join('\n');

  if (!query.trim()) {
    return {
      readOnly: true,
      dispatched: false,
      autofixPlanId: null,
      autofixState: null,
      issueCount: plan.issues.length,
      detail: 'No autofix-eligible issues in remediation plan.',
    };
  }

  const autofixPlan = buildAutoFixPlan(
    `FounderRemediationPlan ${plan.planId}: ${query.slice(0, 500)}`,
  );

  return {
    readOnly: true,
    dispatched: true,
    autofixPlanId: autofixPlan.fixId,
    autofixState: autofixPlan.state,
    issueCount: plan.issues.length,
    detail: `Dispatched ${plan.issues.filter((issue) => issue.autofixEligible).length} issue(s) to AutoFix Pipeline.`,
  };
}
