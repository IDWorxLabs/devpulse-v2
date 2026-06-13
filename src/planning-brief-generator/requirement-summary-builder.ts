/**
 * Requirement Summary Builder — roles, business rules, integrations (V1).
 */

import type { GeneratePlanningBriefInput, PlanningBriefEvidenceBundle } from './planning-brief-types.js';
import type { RequirementCompletenessAnalysis } from '../requirement-completeness-intelligence/requirement-completeness-types.js';

function completenessGapDescriptions(completeness: RequirementCompletenessAnalysis): readonly {
  gapId: string;
  description: string;
  domain: string;
}[] {
  const missing = completeness.missingRequirements as unknown;
  if (Array.isArray(missing)) {
    return missing.map((gap) => ({ gapId: gap.gapId, description: gap.description, domain: gap.domain }));
  }
  const legacy = missing as {
    missingScreens?: readonly string[];
    missingFlows?: readonly string[];
    missingBusinessLogic?: readonly string[];
  };
  const gaps: { gapId: string; description: string; domain: string }[] = [];
  for (const screen of legacy.missingScreens ?? []) {
    gaps.push({ gapId: `screen-${screen}`, description: `Missing screen: ${screen}`, domain: 'UI_REQUIREMENTS' });
  }
  for (const flow of legacy.missingFlows ?? []) {
    gaps.push({ gapId: `flow-${flow}`, description: `Missing workflow: ${flow}`, domain: 'UI_REQUIREMENTS' });
  }
  for (const rule of legacy.missingBusinessLogic ?? []) {
    gaps.push({ gapId: `rule-${rule}`, description: `Missing business logic: ${rule}`, domain: 'BUSINESS_LOGIC' });
  }
  return gaps;
}

export function summarizeUserRoles(bundle: PlanningBriefEvidenceBundle): string[] {
  return [...bundle.userRoles];
}

export function summarizeBusinessRules(bundle: PlanningBriefEvidenceBundle): string[] {
  return [...bundle.businessRules];
}

export function summarizeIntegrations(bundle: PlanningBriefEvidenceBundle): string[] {
  return [...bundle.integrations];
}

export function buildKnownGaps(input: {
  gateInput: GeneratePlanningBriefInput;
  bundle: PlanningBriefEvidenceBundle;
}): import('./planning-brief-types.js').PlanningBriefGapItem[] {
  const gaps: import('./planning-brief-types.js').PlanningBriefGapItem[] = [];
  let counter = 0;

  const push = (
    category: import('./planning-brief-types.js').PlanningBriefGapItem['category'],
    description: string,
    evidence: string[],
  ) => {
    counter += 1;
    gaps.push({ readOnly: true, gapId: `gap-${counter}`, category, description, evidence });
  };

  const intake = input.gateInput.unifiedIntakeAnalysis;
  const completeness = input.gateInput.requirementCompletenessAnalysis;
  const gate = input.gateInput.planningGateAnalysis;

  for (const gap of intake?.intakeGaps ?? []) {
    push('MISSING_REQUIREMENT', gap.description, [gap.gapId, gap.category]);
  }

  if (completeness) {
    for (const gap of completenessGapDescriptions(completeness)) {
      push('MISSING_REQUIREMENT', gap.description, [gap.gapId, gap.domain]);
    }
  }

  for (const conflict of intake?.evidenceConflicts ?? []) {
    push('UNRESOLVED_CONFLICT', conflict.description, [...conflict.conflictingEvidence]);
  }

  for (const question of gate?.planningGateQuestions ?? []) {
    if (question.priority === 'CRITICAL' || question.priority === 'HIGH') {
      push('CLARIFICATION_REQUEST', question.question, [question.questionId, ...question.evidence]);
    }
  }

  if (input.bundle.screens.length === 0) {
    push('MISSING_REQUIREMENT', 'No screens identified in intake evidence.', ['EMPTY_SCREEN_INVENTORY']);
  }
  if (input.bundle.workflows.length === 0) {
    push('MISSING_REQUIREMENT', 'No workflows identified in intake evidence.', ['EMPTY_WORKFLOW_INVENTORY']);
  }

  return gaps;
}
