/**
 * Build Plan Builder — evidence bundle and plan assembly (V1).
 */

import { analyzeDependencies } from './dependency-analyzer.js';
import { generateMilestones } from './milestone-generator.js';
import { sequencePhases } from './phase-sequencer.js';
import { detectBuildPlanRisks, prioritizeBuildOrder } from './risk-aware-prioritizer.js';
import { validateBuildPlan } from './build-plan-validator.js';
import type { BuildPlan, GenerateBuildPlanInput, BuildPlanEvidenceBundle } from './build-plan-types.js';
import { ALLOWED_ARCHITECTURE_READINESS_FOR_BUILD } from './build-plan-registry.js';

export function buildBuildPlanEvidenceBundle(
  input: GenerateBuildPlanInput,
): BuildPlanEvidenceBundle | null {
  const arch = input.architectureBrief;
  const planning = input.planningBrief;
  if (!arch) return null;

  const screens = planning?.screenInventory.map((s) => s.name) ?? [];
  const workflows = planning?.workflowInventory.map((w) => w.name) ?? [];

  const sources = [
    'ARCHITECTURE_BRIEF',
    planning ? 'PLANNING_BRIEF' : null,
    input.unifiedIntakeAnalysis ? 'UNIFIED_INTAKE_INTELLIGENCE' : null,
    input.requirementCompletenessAnalysis ? 'REQUIREMENT_COMPLETENESS_INTELLIGENCE' : null,
    ...arch.evidenceSources,
  ].filter(Boolean) as string[];

  const knownGaps = [
    ...(planning?.knownGaps.map((g) => g.description) ?? []),
    ...arch.architectureRiskAnalysis.risks.map((r) => r.description),
  ];

  return {
    readOnly: true,
    sources: [...new Set(sources)],
    productType: arch.systemOverview.productType,
    productName: planning?.projectSummary.productName ?? null,
    objective: arch.systemOverview.objective,
    platforms: arch.systemOverview.platforms,
    screens,
    workflows,
    userRoles: [...arch.securitySummary.userRoles],
    integrations: arch.integrationSummary.integrations.map((i) => i.name),
    entities: arch.dataModelSummary.entities.map((e) => e.name),
    hasAuth: arch.securitySummary.authentication.length > 0,
    hasBackgroundJobs: arch.backendSummary.backgroundJobs,
    hasWorkflowOrchestration: arch.backendSummary.workflowOrchestration,
    architectureRisks: arch.architectureRiskAnalysis.risks.map((r) => r.description),
    knownGaps,
    architectureReadiness: arch.architectureBriefReadiness,
  };
}

export function summarizeBuildProject(bundle: BuildPlanEvidenceBundle): import('./build-plan-types.js').BuildPlanProjectSummary {
  const screenCount = bundle.screens.length;
  const workflowCount = bundle.workflows.length;
  const integrationCount = bundle.integrations.length;

  let scope = 'Initial product scope';
  if (screenCount >= 5 && workflowCount >= 4) scope = 'Multi-screen product with complex workflows';
  else if (screenCount >= 3) scope = 'Multi-screen product with core user journeys';

  const complexityScore =
    screenCount * 3 + workflowCount * 5 + integrationCount * 4 + bundle.entities.length * 2;
  let complexity: import('./build-plan-types.js').BuildComplexityCategory = 'LOW';
  if (complexityScore >= 80) complexity = 'EXTREME';
  else if (complexityScore >= 55) complexity = 'HIGH';
  else if (complexityScore >= 30) complexity = 'MEDIUM';

  return {
    readOnly: true,
    product: bundle.productName ?? bundle.productType,
    platforms: bundle.platforms,
    scope,
    complexity,
  };
}

let planCounter = 0;

export function resetBuildPlanCounterForTests(): void {
  planCounter = 0;
}

function nextPlanId(): string {
  planCounter += 1;
  return `build-plan-${planCounter}`;
}

function isArchitectureReadinessAllowed(readiness: string): boolean {
  return ALLOWED_ARCHITECTURE_READINESS_FOR_BUILD.includes(
    readiness as (typeof ALLOWED_ARCHITECTURE_READINESS_FOR_BUILD)[number],
  );
}

export function buildBuildPlan(input: GenerateBuildPlanInput): BuildPlan | null {
  const arch = input.architectureBrief;
  if (!arch || !isArchitectureReadinessAllowed(arch.architectureBriefReadiness)) return null;

  const bundle = buildBuildPlanEvidenceBundle(input);
  if (!bundle) return null;

  const milestones = generateMilestones(bundle);
  const phases = sequencePhases(milestones);
  const dependencyMap = analyzeDependencies(phases);
  const buildPlanRisks = detectBuildPlanRisks(bundle);
  const buildPriorityOrder = prioritizeBuildOrder({ bundle, phases, risks: buildPlanRisks });

  const projectSummary = summarizeBuildProject(bundle);

  const draft: Omit<
    BuildPlan,
    'buildComplexityScore' | 'buildComplexityCategory' | 'buildPlanReadiness' | 'buildPlanConfidence'
  > = {
    readOnly: true,
    planId: nextPlanId(),
    generatedAt: new Date().toISOString(),
    architectureBriefId: arch.briefId,
    projectSummary,
    milestones,
    phases,
    dependencyMap,
    buildPriorityOrder,
    buildPlanRisks,
    buildComplexityScore: 0,
    buildComplexityCategory: 'LOW',
    buildPlanReadiness: 'NOT_READY',
    buildPlanConfidence: 0,
    evidenceSources: bundle.sources,
  };

  const validation = validateBuildPlan({
    plan: draft as BuildPlan,
    architectureReadiness: arch.architectureBriefReadiness,
    architectureConfidence: arch.architectureBriefConfidence,
    gateDecision: input.planningGateAnalysis?.planningGateDecision ?? null,
  });

  return {
    ...draft,
    projectSummary: { ...projectSummary, complexity: validation.buildComplexityCategory },
    buildComplexityScore: validation.buildComplexityScore,
    buildComplexityCategory: validation.buildComplexityCategory,
    buildPlanReadiness: validation.buildPlanReadiness,
    buildPlanConfidence: validation.buildPlanConfidence,
  };
}
