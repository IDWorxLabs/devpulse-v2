/**
 * Capability Planning Engine Era 3 — build-path authority and generation permission gate.
 */

import { analyzeCapabilityGaps, resetCapabilityGapAnalyzerForTests } from './capability-gap-analyzer.js';
import { composeCapabilitiesFromGaps, resetCapabilityCompositionEngineForTests } from './capability-composition-engine.js';
import { discoverRequiredCapabilities, resetCapabilityDiscoveryForTests } from './capability-discovery.js';
import { buildCapabilityDependencyGraph, resetCapabilityDependencyGraphForTests } from './capability-dependency-graph.js';
import { searchExistingCapabilities } from './existing-capability-search.js';
import { planCapabilityGeneration, resetCapabilityGenerationPlannerForTests } from './capability-generation-planner.js';
import { planCapabilityInstallations, resetCapabilityInstallationPlannerForTests } from './capability-installation-planner.js';
import { buildCapabilityPlanningPipelineReport } from './capability-planning-report-builder.js';
import { registerCapabilityRecord, resetCapabilityPlanningRegistryForTests } from './capability-planning-registry.js';
import { analyzeCapabilityReuse } from './capability-reuse-analyzer.js';
import { planCapabilityValidations, resetCapabilityValidationPlannerEra3ForTests } from './capability-validation-planner.js';
import type {
  CapabilityPlanningPipelineInput,
  CapabilityPlanningPipelineResult,
  CapabilityStatus,
  GenerationPermissionVerdict,
  LaunchCapabilityEvidence,
} from './capability-planning-types.js';
import { CAPABILITY_PLANNING_ENGINE_PASS_TOKEN } from './capability-planning-types.js';

let pipelineCounter = 0;
let lastPipelineResult: CapabilityPlanningPipelineResult | null = null;

export function resetCapabilityAuthorityForTests(): void {
  pipelineCounter = 0;
  lastPipelineResult = null;
  resetCapabilityDiscoveryForTests();
  resetCapabilityGapAnalyzerForTests();
  resetCapabilityCompositionEngineForTests();
  resetCapabilityGenerationPlannerForTests();
  resetCapabilityValidationPlannerEra3ForTests();
  resetCapabilityInstallationPlannerForTests();
  resetCapabilityDependencyGraphForTests();
  resetCapabilityPlanningRegistryForTests();
}

export function getLastCapabilityPlanningPipelineResult(): CapabilityPlanningPipelineResult | null {
  return lastPipelineResult;
}

function nextPipelineId(): string {
  pipelineCounter += 1;
  return `cap-pipeline-${pipelineCounter}`;
}

function derivePermissionVerdict(input: {
  promptFaithfulnessBlocked: boolean;
  gaps: ReturnType<typeof analyzeCapabilityGaps>;
  generationPlans: ReturnType<typeof planCapabilityGeneration>;
}): { verdict: GenerationPermissionVerdict; blockedReason: string | null } {
  if (input.promptFaithfulnessBlocked) {
    return {
      verdict: 'BLOCKED',
      blockedReason: 'Prompt Faithfulness contract blocked — capability planning cannot authorize generation.',
    };
  }

  if (input.gaps.some((g) => g.decision === 'BLOCK_BUILD')) {
    return {
      verdict: 'BLOCKED',
      blockedReason: `Blocked capabilities: ${input.gaps.filter((g) => g.decision === 'BLOCK_BUILD').map((g) => g.requiredCapability.name).join(', ')}`,
    };
  }

  if (input.gaps.some((g) => g.decision === 'NEEDS_HUMAN_REVIEW')) {
    return {
      verdict: 'NEEDS_HUMAN_REVIEW',
      blockedReason: `Human review required: ${input.gaps.filter((g) => g.decision === 'NEEDS_HUMAN_REVIEW').map((g) => g.requiredCapability.name).join(', ')}`,
    };
  }

  const unresolved = input.gaps.filter(
    (g) => g.decision === 'GENERATE_MISSING' && g.risk !== 'LOW',
  );
  if (unresolved.length) {
    return {
      verdict: 'NEEDS_CAPABILITY_EVOLUTION',
      blockedReason: `Capability evolution required: ${unresolved.map((g) => g.requiredCapability.name).join(', ')}`,
    };
  }

  const pendingGeneration = input.generationPlans.length > 0;
  const allResolved = input.gaps.every(
    (g) =>
      g.decision === 'REUSE_EXISTING' ||
      g.decision === 'COMPOSE_FROM_EXISTING' ||
      g.decision === 'GENERATE_MISSING',
  );

  if (pendingGeneration && allResolved) {
    return { verdict: 'NEEDS_CAPABILITY_EVOLUTION', blockedReason: null };
  }

  if (allResolved) {
    return { verdict: 'READY_FOR_GENERATION', blockedReason: null };
  }

  return { verdict: 'BLOCKED', blockedReason: 'Unresolved required capabilities remain.' };
}

export function runCapabilityPlanningPipeline(
  input: CapabilityPlanningPipelineInput,
): CapabilityPlanningPipelineResult {
  const requiredCapabilities = discoverRequiredCapabilities({
    rawPrompt: input.rawPrompt,
    productIntelligenceModel: input.productIntelligenceModel,
    promptFaithfulness: input.promptFaithfulness,
  });

  const searchResults = searchExistingCapabilities(requiredCapabilities);
  const gaps = analyzeCapabilityGaps(searchResults);
  const compositions = composeCapabilitiesFromGaps(gaps);
  const generationPlans = planCapabilityGeneration(gaps);
  const validationPlans = planCapabilityValidations({ searchResults, compositions, generationPlans });
  const installationPlans = planCapabilityInstallations({ generationPlans, compositions });
  const dependencyGraph = buildCapabilityDependencyGraph({ gaps, generationPlans });

  for (const gen of generationPlans) {
    const slug = gen.capabilityName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    registerCapabilityRecord({
      readOnly: true,
      capabilityId: `cap-gen-${slug}`,
      name: gen.capabilityName,
      version: '0.1.0',
      status: 'GENERATED_PENDING_VALIDATION' as CapabilityStatus,
      source: 'capability-generation-planner',
      ownerModule: 'devpulse_v2_capability_planning_engine',
      supportedRequirementCategories: ['FUNCTIONAL'],
      supportedProductDomains: ['CUSTOM_APPLICATION'],
      supportedPlatforms: ['WEB'],
      dependencies: gen.dependencies,
      interfaces: gen.expectedInterfaces,
      validationCoverage: gen.requiredValidators,
      riskLevel: gen.riskLevel,
      reuseConfidence: 0.6,
      lastValidationStatus: 'PENDING',
      description: gen.reasonRequired,
      sourceModule: gen.requiredFiles[0] ?? 'generated',
    });
  }

  const { verdict, blockedReason } = derivePermissionVerdict({
    promptFaithfulnessBlocked: input.promptFaithfulnessBlocked ?? input.promptFaithfulness?.readyForGeneration === false,
    gaps,
    generationPlans,
  });

  const result: CapabilityPlanningPipelineResult = {
    readOnly: true,
    pipelineId: nextPipelineId(),
    rawPrompt: input.rawPrompt,
    requiredCapabilities,
    searchResults,
    gaps,
    compositions,
    generationPlans,
    validationPlans,
    installationPlans,
    dependencyGraph,
    permissionVerdict: verdict,
    blockedReason,
    reportMarkdown: '',
    completedAt: Date.now(),
  };

  result.reportMarkdown = buildCapabilityPlanningPipelineReport(result);
  lastPipelineResult = result;
  return result;
}

export function isCapabilityPlanningReadyForGeneration(
  result: CapabilityPlanningPipelineResult,
): boolean {
  return (
    result.permissionVerdict === 'READY_FOR_GENERATION' ||
    (result.permissionVerdict === 'NEEDS_CAPABILITY_EVOLUTION' && result.generationPlans.every((p) => p.riskLevel === 'LOW'))
  );
}

export function buildLaunchCapabilityEvidence(
  result: CapabilityPlanningPipelineResult,
): LaunchCapabilityEvidence {
  const reuse = analyzeCapabilityReuse(result.searchResults, result.gaps);
  const blockers: string[] = [];
  if (result.blockedReason) blockers.push(result.blockedReason);
  if (result.permissionVerdict === 'BLOCKED') blockers.push('Capability planning blocked');
  if (result.permissionVerdict === 'NEEDS_HUMAN_REVIEW') blockers.push('Human review required for capabilities');

  return {
    readOnly: true,
    requiredCount: result.requiredCapabilities.length,
    reusedCount: reuse.reuseCount,
    composedCount: reuse.composeCount,
    generatedCount: reuse.generateCount,
    validatedCount: result.validationPlans.length,
    humanReviewCount: reuse.humanReviewCount,
    blockedCount: reuse.blockedCount,
    permissionVerdict: result.permissionVerdict,
    blockers,
  };
}

export function registerCapabilityPlanningWithLaunchAuthority(): { passToken: string; readOnly: true } {
  return { passToken: CAPABILITY_PLANNING_ENGINE_PASS_TOKEN, readOnly: true };
}

export function registerCapabilityPlanningWithIntentUnderstanding(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}

export function registerCapabilityPlanningWithPromptFaithfulness(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}
