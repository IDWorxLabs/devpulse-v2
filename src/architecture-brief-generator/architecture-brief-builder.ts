/**
 * Architecture Brief Builder — evidence bundle and brief assembly (V1).
 */

import { summarizeBackendArchitecture } from './backend-architecture-summarizer.js';
import { summarizeDataModel } from './data-model-summarizer.js';
import { summarizeFrontendArchitecture } from './frontend-architecture-summarizer.js';
import {
  summarizeIntegrationArchitecture,
  summarizeSecurityArchitecture,
} from './integration-architecture-summarizer.js';
import { detectArchitectureRisks } from './architecture-risk-detector.js';
import { validateArchitectureBrief } from './architecture-brief-validator.js';
import type { ArchitectureBrief, GenerateArchitectureBriefInput, ArchitectureEvidenceBundle } from './architecture-brief-types.js';

export function buildArchitectureEvidenceBundle(
  input: GenerateArchitectureBriefInput,
): ArchitectureEvidenceBundle | null {
  const planningBrief = input.planningBrief;
  if (!planningBrief) return null;

  const intake = input.unifiedIntakeAnalysis;
  const completeness = input.requirementCompletenessAnalysis;
  const founder = input.founderContext;

  const dataEntities = new Set<string>();
  const authentication = new Set<string>();
  const notifications = new Set<string>();

  for (const entity of intake?.projectUnderstanding.entities ?? []) dataEntities.add(entity);
  for (const entity of intake?.evidence.dataEntities ?? []) dataEntities.add(entity);
  for (const entity of completeness?.evidence.dataEntities ?? []) dataEntities.add(entity);

  for (const auth of intake?.evidence.authentication ?? []) authentication.add(auth);
  for (const auth of completeness?.evidence.authentication ?? []) authentication.add(auth);

  for (const note of intake?.evidence.notifications ?? []) notifications.add(note);
  for (const note of completeness?.evidence.notifications ?? []) notifications.add(note);

  const scaleExpectations = deriveScaleExpectations({
    productType: planningBrief.projectSummary.productType,
    targetUsers: planningBrief.projectSummary.targetUsers,
    founderConstraints: founder?.constraints ?? [],
    screenCount: planningBrief.screenInventory.length,
    workflowCount: planningBrief.workflowInventory.length,
  });

  const sources = [
    'PLANNING_BRIEF',
    ...planningBrief.evidenceSources,
    intake ? 'UNIFIED_INTAKE_INTELLIGENCE' : null,
    completeness ? 'REQUIREMENT_COMPLETENESS_INTELLIGENCE' : null,
    founder ? 'FOUNDER_CONTEXT' : null,
    input.projectVaultContext?.facts.length ? 'PROJECT_VAULT_CONTEXT' : null,
  ].filter(Boolean) as string[];

  return {
    readOnly: true,
    sources: [...new Set(sources)],
    productType: planningBrief.projectSummary.productType,
    objective: planningBrief.projectSummary.objective,
    platforms: planningBrief.platformTargets,
    targetUsers: planningBrief.projectSummary.targetUsers,
    screens: planningBrief.screenInventory.map((s) => s.name),
    workflows: planningBrief.workflowInventory.map((w) => w.name),
    userRoles: [...planningBrief.userRoles],
    businessRules: [...planningBrief.businessRules],
    integrations: [...planningBrief.integrations],
    dataEntities: [...dataEntities],
    authentication: [...authentication],
    notifications: [...notifications],
    scaleExpectations,
  };
}

function deriveScaleExpectations(input: {
  productType: string;
  targetUsers: readonly string[];
  founderConstraints: readonly string[];
  screenCount: number;
  workflowCount: number;
}): string {
  if (/SAAS|MARKETPLACE|PLATFORM/.test(input.productType)) {
    return 'Multi-tenant SaaS scale with growth-oriented service boundaries.';
  }
  if (input.screenCount >= 5 && input.workflowCount >= 4) {
    return 'Medium-scale product with multiple user journeys and service modules.';
  }
  if (input.founderConstraints.some((c) => /scale|growth|enterprise/i.test(c))) {
    return 'Growth-oriented architecture with explicit scaling considerations.';
  }
  return 'Initial launch scale with modular expansion path.';
}

export function buildSystemOverview(bundle: ArchitectureEvidenceBundle): import('./architecture-brief-types.js').ArchitectureBriefSystemOverview {
  return {
    readOnly: true,
    productType: bundle.productType,
    objective: bundle.objective,
    platforms: bundle.platforms,
    scaleExpectations: bundle.scaleExpectations,
  };
}

let briefCounter = 0;

export function resetArchitectureBriefCounterForTests(): void {
  briefCounter = 0;
}

function nextBriefId(): string {
  briefCounter += 1;
  return `architecture-brief-${briefCounter}`;
}

export function buildArchitectureBrief(input: GenerateArchitectureBriefInput): ArchitectureBrief | null {
  const planningBrief = input.planningBrief;
  const gate = input.planningGateAnalysis;
  if (!planningBrief || !gate) return null;
  if (gate.planningGateDecision !== 'ALLOW_LIMITED_PLANNING' && gate.planningGateDecision !== 'ALLOW_FULL_PLANNING') {
    return null;
  }

  const bundle = buildArchitectureEvidenceBundle(input);
  if (!bundle) return null;

  const architectureRiskAnalysis = detectArchitectureRisks({ bundle, gateInput: input });

  const draft: Omit<
    ArchitectureBrief,
    'architectureBriefConfidence' | 'architectureBriefQuality' | 'architectureBriefReadiness'
  > = {
    readOnly: true,
    briefId: nextBriefId(),
    generatedAt: new Date().toISOString(),
    planningBriefId: planningBrief.briefId,
    systemOverview: buildSystemOverview(bundle),
    frontendSummary: summarizeFrontendArchitecture(bundle),
    backendSummary: summarizeBackendArchitecture(bundle),
    dataModelSummary: summarizeDataModel(bundle),
    integrationSummary: summarizeIntegrationArchitecture(bundle),
    securitySummary: summarizeSecurityArchitecture(bundle),
    architectureRiskAnalysis,
    evidenceSources: bundle.sources,
    architectureBriefConfidence: 0,
    architectureBriefQuality: 'INSUFFICIENT',
    architectureBriefReadiness: 'NOT_READY',
  };

  const validation = validateArchitectureBrief({
    brief: draft as ArchitectureBrief,
    gateDecision: gate.planningGateDecision,
    planningBriefConfidence: planningBrief.planningBriefConfidence,
    gateConfidence: gate.planningGateExplanation.confidence,
  });

  return {
    ...draft,
    architectureBriefConfidence: validation.architectureBriefConfidence,
    architectureBriefQuality: validation.architectureBriefQuality,
    architectureBriefReadiness: validation.architectureBriefReadiness,
  };
}
