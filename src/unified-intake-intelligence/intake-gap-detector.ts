/**
 * Intake Gap Detector — missing intake element identification (V1).
 */

import type { ConsolidatedIntakeEvidence, IntakeGap } from './unified-intake-types.js';

export function detectIntakeGaps(evidence: ConsolidatedIntakeEvidence): IntakeGap[] {
  const gaps: IntakeGap[] = [];
  let counter = 0;

  const push = (category: IntakeGap['category'], description: string, gapEvidence: string[]) => {
    counter += 1;
    gaps.push({
      readOnly: true,
      gapId: `intake-gap-${counter}`,
      category,
      description,
      evidence: gapEvidence,
    });
  };

  if (evidence.workflows.length === 0) {
    push('WORKFLOW', 'No workflows identified across intake sources.', ['MISSING_WORKFLOWS']);
  } else if (evidence.screens.length >= 3 && evidence.workflows.length < 2) {
    push('WORKFLOW', 'Multiple screens referenced without enough workflow detail.', ['SPARSE_WORKFLOWS']);
  }

  if (evidence.screens.length === 0) {
    push('SCREEN', 'No screens or pages identified from intake sources.', ['MISSING_SCREENS']);
  }

  if (evidence.userRoles.length === 0) {
    push('ROLE', 'Target user roles are not defined.', ['MISSING_ROLES']);
  }

  if (evidence.integrations.some((i) => /stripe|paypal|payment/i.test(i)) && !evidence.workflows.some((w) => /checkout|billing|payment/i.test(w))) {
    push('INTEGRATION', 'Payment integration mentioned without checkout/billing workflow.', ['PAYMENT_WITHOUT_FLOW']);
  }

  if (evidence.integrations.length === 0 && evidence.activeSources.length >= 2) {
    push('INTEGRATION', 'No integrations captured despite multi-source intake.', ['MISSING_INTEGRATIONS']);
  }

  if (evidence.businessRules.length === 0 && evidence.dataEntities.length >= 2) {
    push('BUSINESS_LOGIC', 'Data entities present without business rules or constraints.', ['MISSING_BUSINESS_LOGIC']);
  }

  if (evidence.authentication.length > 0 && evidence.userRoles.length <= 1) {
    push('ROLE', 'Authentication mentioned without distinct role model.', ['AUTH_WITHOUT_ROLES']);
  }

  if (!evidence.uploadSummary && evidence.activeSources.includes('VISUAL_REFERENCE_INTELLIGENCE') === false) {
    push('SCREEN', 'No visual references or uploads to validate UI intent.', ['MISSING_VISUAL_EVIDENCE']);
  }

  return gaps;
}
