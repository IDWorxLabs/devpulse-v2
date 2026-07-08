/**
 * Engineering Intelligence Runtime V1 — public API and orchestration.
 */

import type { AeeEvidenceResult, AeeStage } from '../autonomous-engineering-executive/aee-types.js';
import type { FeatureModuleCandidate, PromptBoundedModulePlan } from '../prompt-bounded-materialization/prompt-bounded-materialization-types.js';
import { buildDefinitionFromModulePlan } from '../prompt-bounded-materialization/prompt-bounded-module-resolver.js';
import { moduleIdToDisplayName } from '../universal-prompt-to-app-materialization/modular-feature-module-generator.js';
import type { ProfileFeatureDefinition } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import { dedupeModuleIds } from '../prompt-faithful-generation/prompt-module-name-normalizer.js';
import { classifyProductDomain, detectProfileDomainMismatch } from './product-domain-classifier.js';
import { synthesizeEngineeringFeatureContract } from './module-contract-synthesizer.js';
import { checkPromptToFeatureFidelity } from './prompt-to-feature-fidelity-checker.js';
import { buildEngineeringIntelligenceReport } from './engineering-intelligence-report.js';
import { resetFeatureGapRepairPlannerForTests } from './feature-gap-repair-planner.js';
import { resetEngineeringIntelligenceReportForTests } from './engineering-intelligence-report.js';
import {
  shouldRunMissingCapabilityRuntime,
  runMissingCapabilityRepairLoop,
} from './missing-capability-runtime.js';
import type {
  EngineeringIntelligenceAeeEvidenceInput,
  EngineeringIntelligencePlanningInput,
  EngineeringIntelligencePlanningResult,
  EngineeringIntelligenceReport,
  MissingCapabilityRuntimeInput,
  MissingCapabilityRuntimeResult,
} from './engineering-intelligence-types.js';
import {
  ENGINEERING_INTELLIGENCE_OWNER_MODULE,
  ENGINEERING_INTELLIGENCE_RUNTIME_V1_PASS_TOKEN,
} from './engineering-intelligence-types.js';

export {
  ENGINEERING_INTELLIGENCE_RUNTIME_V1_PASS_TOKEN,
  ENGINEERING_INTELLIGENCE_OWNER_MODULE,
  MAX_MISSING_CAPABILITY_REPAIR_ATTEMPTS,
} from './engineering-intelligence-types.js';

export type {
  ProductDomain,
  RequiredCapability,
  EngineeringFeatureContract,
  ProfileDomainMismatch,
  EngineeringIntelligencePlanningInput,
  EngineeringIntelligencePlanningResult,
  PromptToFeatureFidelityResult,
  FeatureGapRepairPlan,
  MissingCapabilityRuntimeInput,
  MissingCapabilityRuntimeResult,
  EngineeringIntelligenceReport,
  ModuleContractStatus,
  ProductFidelityVerdict,
} from './engineering-intelligence-types.js';

export { classifyProductDomain, detectProfileDomainMismatch, domainExpectsRichProductModules } from './product-domain-classifier.js';
export { extractRequiredCapabilities, listCapabilityModuleIds } from './capability-extraction-engine.js';
export {
  synthesizeEngineeringFeatureContract,
  contractRequiresProductModules,
  isGenericOnlyModuleSet,
  missingContractModules,
  capabilitiesMissingFromModules,
} from './module-contract-synthesizer.js';
export { checkPromptToFeatureFidelity } from './prompt-to-feature-fidelity-checker.js';
export { planFeatureGapRepair, resetFeatureGapRepairPlannerForTests } from './feature-gap-repair-planner.js';
export {
  runMissingCapabilityRepairLoop,
  shouldRunMissingCapabilityRuntime,
} from './missing-capability-runtime.js';
export {
  buildEngineeringIntelligenceReport,
  formatEngineeringIntelligenceReportMarkdown,
  resetEngineeringIntelligenceReportForTests,
} from './engineering-intelligence-report.js';
export {
  ENGINEERING_INTELLIGENCE_VALIDATION_MATRIX,
  moduleHintsPresent,
  domainMatchesExpected,
  sourceContainsAppSpecificHardcoding,
  RICH_PRODUCT_PROMPT_WITHOUT_AUTH,
  GENERIC_COLLAPSE_MODULE_PLAN,
} from './engineering-intelligence-validator.js';

let lastPlanningResult: EngineeringIntelligencePlanningResult | null = null;
let lastReport: EngineeringIntelligenceReport | null = null;

export function resetEngineeringIntelligenceRuntimeForTests(): void {
  lastPlanningResult = null;
  lastReport = null;
  resetFeatureGapRepairPlannerForTests();
  resetEngineeringIntelligenceReportForTests();
}

export function getLastEngineeringIntelligencePlanningResult(): EngineeringIntelligencePlanningResult | null {
  return lastPlanningResult;
}

export function getLastEngineeringIntelligenceReport(): EngineeringIntelligenceReport | null {
  return lastReport;
}

function buildAugmentedCandidate(moduleId: string, contractReason: string): FeatureModuleCandidate {
  return {
    readOnly: true,
    moduleId,
    normalizedName: moduleId,
    displayName: moduleIdToDisplayName(moduleId),
    origin: 'CAPABILITY_REQUIRED',
    sourceEvidence: [`Engineering Intelligence contract: ${contractReason}`],
    requirementIds: [`ei:${moduleId}`],
    capabilityIds: [`cap:${moduleId}`],
    confidence: 0.92,
    reasonIncluded: 'Required by Engineering Intelligence product contract.',
    classification: 'FEATURE_MODULE',
    sourceLayer: 'engineering_intelligence_runtime',
  };
}

export function augmentModulePlanWithEngineeringContract(input: {
  modulePlan: PromptBoundedModulePlan;
  contract: ReturnType<typeof synthesizeEngineeringFeatureContract>;
  profileDefinition: ProfileFeatureDefinition;
}): { plan: PromptBoundedModulePlan; definition: ProfileFeatureDefinition } {
  const existingIds = new Set(input.modulePlan.approvedModuleIds);
  const addedCandidates: FeatureModuleCandidate[] = [];

  for (const moduleId of input.contract.requiredModules) {
    if (existingIds.has(moduleId)) continue;
    addedCandidates.push(buildAugmentedCandidate(moduleId, input.contract.reasoning));
    existingIds.add(moduleId);
  }

  const approvedModules = [...input.modulePlan.approvedModules, ...addedCandidates];
  const approvedModuleIds = dedupeModuleIds(approvedModules.map((m) => m.moduleId));
  const routes = approvedModuleIds.map((moduleId) => (moduleId === 'auth' ? '/' : `/${moduleId}`));

  const plan: PromptBoundedModulePlan = {
    ...input.modulePlan,
    approvedModules,
    approvedModuleIds,
    routes,
    passedPreGenerationGuard:
      input.modulePlan.passedPreGenerationGuard ||
      (approvedModuleIds.length > 0 &&
        !approvedModuleIds.every((id) => ['dashboard', 'settings'].includes(id))),
    contaminationDetected:
      input.modulePlan.contaminationDetected ||
      (approvedModuleIds.every((id) => ['dashboard', 'settings', 'persistence'].includes(id)) &&
        input.contract.requiredModules.length >= 3),
    contaminationReasons:
      input.modulePlan.contaminationDetected
        ? input.modulePlan.contaminationReasons
        : approvedModuleIds.every((id) => ['dashboard', 'settings'].includes(id))
          ? ['Engineering Intelligence detected generic module collapse.']
          : input.modulePlan.contaminationReasons,
  };

  const definition = buildDefinitionFromModulePlan(input.profileDefinition, plan);
  return { plan, definition };
}

export function runEngineeringIntelligencePlanning(
  input: EngineeringIntelligencePlanningInput,
): EngineeringIntelligencePlanningResult {
  const contract = synthesizeEngineeringFeatureContract({
    rawPrompt: input.rawPrompt,
    extractionRequiredModules: input.extractionRequiredModules,
  });

  const classification = classifyProductDomain(input.rawPrompt);
  const profileMismatch = detectProfileDomainMismatch({
    rawPrompt: input.rawPrompt,
    selectedProfile: input.selectedProfile,
    classification,
  });

  const planningFidelity = checkPromptToFeatureFidelity({
    rawPrompt: input.rawPrompt,
    generatedModules: input.approvedModuleIds,
    approvedModuleIds: input.approvedModuleIds,
    selectedProfile: input.selectedProfile,
    contract,
  });

  const result: EngineeringIntelligencePlanningResult = {
    readOnly: true,
    contract,
    profileMismatch,
    augmentedModulePlan: null,
    augmentedDefinition: null,
    planningPassed: planningFidelity.passed || planningFidelity.verdict === 'REPAIR',
    productFidelityScore: planningFidelity.productFidelityScore,
  };

  lastPlanningResult = result;
  return result;
}

export function applyEngineeringIntelligenceToBuildPlan(input: {
  rawPrompt: string;
  selectedProfile: string;
  modulePlan: PromptBoundedModulePlan;
  profileDefinition: ProfileFeatureDefinition;
  extractionRequiredModules: readonly string[];
}): {
  planning: EngineeringIntelligencePlanningResult;
  modulePlan: PromptBoundedModulePlan;
  definition: ProfileFeatureDefinition;
} {
  const planning = runEngineeringIntelligencePlanning({
    rawPrompt: input.rawPrompt,
    selectedProfile: input.selectedProfile,
    extractionRequiredModules: input.extractionRequiredModules,
    approvedModuleIds: input.modulePlan.approvedModuleIds,
  });

  const missingProductModules = planning.contract.requiredModules.filter(
    (moduleId) => !input.modulePlan.approvedModuleIds.includes(moduleId),
  );
  const genericCollapse =
    input.modulePlan.approvedModuleIds.length > 0 &&
    input.modulePlan.approvedModuleIds.every((id) =>
      ['dashboard', 'settings', 'persistence', 'auth', 'navigation-router'].includes(id),
    );

  const shouldAugment = missingProductModules.length > 0 && (genericCollapse || missingProductModules.length >= 2);

  if (!shouldAugment) {
    return {
      planning,
      modulePlan: input.modulePlan,
      definition: buildDefinitionFromModulePlan(input.profileDefinition, input.modulePlan),
    };
  }

  const augmented = augmentModulePlanWithEngineeringContract({
    modulePlan: input.modulePlan,
    contract: planning.contract,
    profileDefinition: input.profileDefinition,
  });

  const updatedPlanning: EngineeringIntelligencePlanningResult = {
    ...planning,
    augmentedModulePlan: augmented.plan,
    augmentedDefinition: augmented.definition,
    planningPassed: true,
  };

  lastPlanningResult = updatedPlanning;

  return {
    planning: updatedPlanning,
    modulePlan: augmented.plan,
    definition: augmented.definition,
  };
}

export async function runEngineeringIntelligencePostWorkspace(input: {
  rawPrompt: string;
  workspaceDir: string;
  projectRootDir: string;
  workspaceId: string;
  selectedProfile: string;
  buildPlanDefinition: ProfileFeatureDefinition;
  approvedModuleIds: readonly string[];
  generatedModules: readonly string[];
  contract: ReturnType<typeof synthesizeEngineeringFeatureContract>;
  profileMismatch: import('./engineering-intelligence-types.js').ProfileDomainMismatch | null;
  productIntelligenceModel: MissingCapabilityRuntimeInput['productIntelligenceModel'];
  promptFaithfulness: MissingCapabilityRuntimeInput['promptFaithfulness'];
  capabilityPlanning: MissingCapabilityRuntimeInput['capabilityPlanning'];
  rerunBuild?: MissingCapabilityRuntimeInput['rerunBuild'];
}): Promise<{
  fidelity: ReturnType<typeof checkPromptToFeatureFidelity>;
  repairResult: MissingCapabilityRuntimeResult | null;
  report: EngineeringIntelligenceReport;
}> {
  let fidelity = checkPromptToFeatureFidelity({
    rawPrompt: input.rawPrompt,
    workspaceDir: input.workspaceDir,
    generatedModules: input.generatedModules,
    approvedModuleIds: input.approvedModuleIds,
    selectedProfile: input.selectedProfile,
    contract: input.contract,
  });

  let repairResult: MissingCapabilityRuntimeResult | null = null;
  if (shouldRunMissingCapabilityRuntime(fidelity)) {
    repairResult = await runMissingCapabilityRepairLoop({
      rawPrompt: input.rawPrompt,
      workspaceDir: input.workspaceDir,
      projectRootDir: input.projectRootDir,
      workspaceId: input.workspaceId,
      buildPlanDefinition: input.buildPlanDefinition,
      approvedModuleIds: input.approvedModuleIds,
      selectedProfile: input.selectedProfile,
      contract: input.contract,
      productIntelligenceModel: input.productIntelligenceModel,
      promptFaithfulness: input.promptFaithfulness,
      capabilityPlanning: input.capabilityPlanning,
      rerunBuild: input.rerunBuild,
    });
    fidelity = repairResult.finalFidelity;
  }

  const report = buildEngineeringIntelligenceReport({
    rawPrompt: input.rawPrompt,
    contract: input.contract,
    selectedProfile: input.selectedProfile,
    profileMismatch: input.profileMismatch,
    generatedModules:
      repairResult && repairResult.repairAttempts.length > 0
        ? dedupeModuleIds([
            ...input.generatedModules,
            ...repairResult.repairAttempts.flatMap((a) => [...a.modulesGenerated]),
          ])
        : input.generatedModules,
    fidelity,
    repairResult,
  });

  lastReport = report;

  return { fidelity, repairResult, report };
}

export function buildEngineeringIntelligenceAeeEvidence(
  input: EngineeringIntelligenceAeeEvidenceInput,
): AeeEvidenceResult {
  const { report, fidelity, stage, npmBuildOk, previewOk } = input;
  const featureGapsRemain =
    !fidelity.passed &&
    (report.finalCapabilityCoverage === 'PARTIAL' || report.finalCapabilityCoverage === 'FAILED');

  let recommendation: AeeEvidenceResult['recommendation'] = 'CONTINUE';
  let severity: AeeEvidenceResult['severity'] = 'INFO';
  let reason = `Engineering Intelligence fidelity score ${report.productFidelityScore}/100 — ${report.moduleContractStatus}.`;

  if (featureGapsRemain && fidelity.verdict === 'REPAIR') {
    recommendation = 'REPAIR';
    severity = 'WARNING';
    reason = `Product fidelity requires repair — missing capabilities: ${report.missingCapabilities.map((c) => c.label).join(', ') || 'unknown'}.`;
  } else if (featureGapsRemain && npmBuildOk) {
    recommendation = 'CONTINUE';
    severity = 'WARNING';
    reason = `Build completed with feature gaps — fidelity ${report.productFidelityScore}/100.`;
  } else if (fidelity.passed) {
    recommendation = previewOk || npmBuildOk ? 'CONTINUE' : 'REPAIR';
    severity = 'INFO';
    reason = `Engineering Intelligence product fidelity passed (${report.productFidelityScore}/100).`;
  }

  return {
    readOnly: true,
    authority: 'ENGINEERING_INTELLIGENCE',
    stage,
    severity,
    recommendation,
    confidence: report.productFidelityScore / 100,
    reason,
    evidenceAvailable: [
      'productDomain',
      'requiredCapabilities',
      'productFidelityScore',
      'moduleContractStatus',
      ...(report.missingCapabilityRepairsAttempted > 0 ? ['missingCapabilityRepairAttempts'] : []),
    ],
    evidenceMissing: fidelity.passed
      ? []
      : report.missingCapabilities.map((c) => c.capabilityId),
    canBlockContinuation: false,
    concreteBlocker: false,
    source: 'engineering-intelligence-runtime',
  };
}

export function resolveEngineeringIntelligenceBuildOutcome(input: {
  npmBuildOk: boolean;
  previewOk: boolean;
  fidelityPassed: boolean;
  repairsExhausted: boolean;
}): 'BUILD_COMPLETED_WITH_PREVIEW' | 'BUILD_COMPLETED_WITH_FEATURE_GAPS' | 'BUILD_COMPLETED_WITH_DEGRADED_PREVIEW' {
  if (input.fidelityPassed && input.previewOk) return 'BUILD_COMPLETED_WITH_PREVIEW';
  if (input.npmBuildOk && !input.fidelityPassed) return 'BUILD_COMPLETED_WITH_FEATURE_GAPS';
  if (input.npmBuildOk && input.previewOk) return 'BUILD_COMPLETED_WITH_PREVIEW';
  return 'BUILD_COMPLETED_WITH_DEGRADED_PREVIEW';
}

export function getDevPulseV2EngineeringIntelligenceRuntime(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: ENGINEERING_INTELLIGENCE_OWNER_MODULE,
    passToken: ENGINEERING_INTELLIGENCE_RUNTIME_V1_PASS_TOKEN,
    phase: 13,
  };
}
