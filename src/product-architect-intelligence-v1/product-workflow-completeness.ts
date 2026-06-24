/**
 * Product Architect Intelligence V1 — workflow completeness analysis.
 */

import { matchesAnyPattern, resolveProductPattern } from './product-pattern-registry.js';
import type {
  ProductArchitectDomain,
  ProductGapSeverity,
  WorkflowCompletenessFinding,
} from './product-architect-intelligence-types.js';

export function analyzeWorkflowCompleteness(input: {
  evidenceText: string;
  domain: ProductArchitectDomain;
}): WorkflowCompletenessFinding[] {
  const pattern = resolveProductPattern(input.domain);
  if (!pattern) return [];

  return pattern.expectedWorkflows.map((workflowDef) => {
    const missingSteps = workflowDef.steps
      .filter((step) => !matchesAnyPattern(input.evidenceText, step.detectionPatterns))
      .map((step) => step.label);

    const complete = missingSteps.length === 0;
    let severity: ProductGapSeverity = 'INFO';
    if (!complete && workflowDef.critical) {
      severity = missingSteps.length >= workflowDef.steps.length - 1 ? 'CRITICAL' : 'WARNING';
    } else if (!complete) {
      severity = 'WARNING';
    }

    return {
      readOnly: true,
      workflow: workflowDef.label,
      complete,
      missingSteps,
      severity,
    };
  });
}
