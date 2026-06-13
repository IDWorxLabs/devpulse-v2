/**
 * Planning Brief Builder — assembles structured planning brief (V1).
 */

import {
  buildPlanningBriefEvidenceBundle,
  summarizePlatformTargets,
  summarizeProjectScope,
} from './project-scope-summarizer.js';
import { buildKnownGaps, summarizeBusinessRules, summarizeIntegrations, summarizeUserRoles } from './requirement-summary-builder.js';
import { buildScreenInventory } from './screen-inventory-builder.js';
import type { GeneratePlanningBriefInput, PlanningBrief } from './planning-brief-types.js';
import { validatePlanningBrief } from './planning-brief-validator.js';
import { summarizeWorkflows } from './workflow-summarizer.js';

let briefCounter = 0;

export function resetPlanningBriefCounterForTests(): void {
  briefCounter = 0;
}

function nextBriefId(): string {
  briefCounter += 1;
  return `planning-brief-${briefCounter}`;
}

export function buildPlanningBrief(input: GeneratePlanningBriefInput): PlanningBrief | null {
  const gate = input.planningGateAnalysis;
  if (!gate || gate.planningGateDecision === 'REJECT_PLANNING') return null;

  const bundle = buildPlanningBriefEvidenceBundle(input);
  if (!bundle) return null;

  const screenInventory = buildScreenInventory(bundle);
  const workflowInventory = summarizeWorkflows(bundle);
  const knownGaps = buildKnownGaps({ gateInput: input, bundle });

  const draft: Omit<PlanningBrief, 'planningBriefConfidence' | 'planningBriefQuality' | 'planningBriefReadiness'> = {
    readOnly: true,
    briefId: nextBriefId(),
    generatedAt: new Date().toISOString(),
    projectSummary: summarizeProjectScope(bundle),
    platformTargets: summarizePlatformTargets(bundle),
    screenInventory,
    workflowInventory,
    userRoles: summarizeUserRoles(bundle),
    businessRules: summarizeBusinessRules(bundle),
    integrations: summarizeIntegrations(bundle),
    knownGaps,
    evidenceSources: bundle.sources,
    planningBriefConfidence: 0,
    planningBriefQuality: 'INSUFFICIENT',
    planningBriefReadiness: 'NOT_READY',
  };

  const validation = validatePlanningBrief({
    brief: draft as PlanningBrief,
    gateDecision: gate.planningGateDecision,
    gateConfidence: gate.planningGateExplanation.confidence,
    intakeConfidence: input.unifiedIntakeAnalysis?.unifiedIntakeConfidence ?? 0,
  });

  return {
    ...draft,
    planningBriefConfidence: validation.planningBriefConfidence,
    planningBriefQuality: validation.planningBriefQuality,
    planningBriefReadiness: validation.planningBriefReadiness,
  };
}
