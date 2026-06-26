/**
 * Missing Capability Evolution Engine — main authority and orchestrator.
 */

import { runCapabilityPlanningPipeline } from '../capability-planning-engine/capability-authority.js';
import { planCapabilityDesign, resetCapabilityDesignPlannerForTests } from './capability-design-planner.js';
import { designCapabilityInterface } from './capability-interface-designer.js';
import { planCapabilityImplementation } from './capability-implementation-planner.js';
import { executeCapabilityInstallation, resetCapabilityInstallationExecutorForTests } from './capability-installation-executor.js';
import { recordCapabilityEvolutionHistory } from './capability-evolution-history.js';
import {
  createEvolutionLoopBudget,
  escalateEvolutionToHumanReview,
  isEvolutionBudgetExhausted,
  recordEvolutionAttempt,
  resetCapabilityEvolutionLoopControllerForTests,
} from './capability-evolution-loop-controller.js';
import { buildMissingCapabilityEvolutionReport } from './capability-evolution-report-builder.js';
import { updateCapabilityRegistry } from './capability-registry-updater.js';
import {
  checkCapabilityReuse,
  indexCapabilityForReuse,
  preventDuplicateEvolution,
} from './capability-reuse-indexer.js';
import { planCapabilityTestFixtures } from './capability-test-fixture-planner.js';
import { isValidationInstallable, runCapabilityValidation } from './capability-validation-runner.js';
import { designCapabilityValidators } from './capability-validator-designer.js';
import { generateCapabilityWorkspace } from './capability-workspace-generator.js';
import {
  assessEvolutionSafety,
  isSafeToEvolve,
  resetEvolutionSafetyAssessorForTests,
} from './evolution-safety-assessor.js';
import { hasRequirementEvidence, intakeMissingCapabilities, resetMissingCapabilityIntakeForTests } from './missing-capability-intake.js';
import { resetMissingCapabilityEvolutionRegistryForTests, findExistingEvolvedCapability } from './missing-capability-evolution-registry.js';
import type {
  EvolutionVerdict,
  LaunchMissingCapabilityEvolutionEvidence,
  MissingCapabilityEvolutionPipelineInput,
  MissingCapabilityEvolutionPipelineResult,
} from './missing-capability-evolution-types.js';
import { MISSING_CAPABILITY_EVOLUTION_ENGINE_PASS_TOKEN } from './missing-capability-evolution-types.js';

let pipelineCounter = 0;
let lastPipelineResult: MissingCapabilityEvolutionPipelineResult | null = null;

export function resetMissingCapabilityEvolutionAuthorityForTests(): void {
  pipelineCounter = 0;
  lastPipelineResult = null;
  resetMissingCapabilityIntakeForTests();
  resetEvolutionSafetyAssessorForTests();
  resetCapabilityDesignPlannerForTests();
  resetCapabilityInstallationExecutorForTests();
  resetCapabilityEvolutionLoopControllerForTests();
  resetMissingCapabilityEvolutionRegistryForTests();
}

export function getLastMissingCapabilityEvolutionPipelineResult(): MissingCapabilityEvolutionPipelineResult | null {
  return lastPipelineResult;
}

function nextPipelineId(): string {
  pipelineCounter += 1;
  return `evo-pipeline-${pipelineCounter}`;
}

function derivePermissionVerdict(input: {
  intakeCount: number;
  blockedReason: string | null;
  humanReview: MissingCapabilityEvolutionPipelineResult['humanReview'];
  installedCount: number;
  reusedCount: number;
  unsafeBlocked: boolean;
  insufficientEvidence: boolean;
  planningRerunPass: boolean;
}): { verdict: EvolutionVerdict; blockedReason: string | null } {
  if (input.insufficientEvidence) {
    return { verdict: 'INSUFFICIENT_EVIDENCE', blockedReason: input.blockedReason };
  }
  if (input.unsafeBlocked || input.humanReview) {
    return {
      verdict: input.humanReview ? 'NEEDS_HUMAN_REVIEW' : 'EVOLUTION_BLOCKED',
      blockedReason: input.blockedReason,
    };
  }
  if (input.intakeCount === 0) {
    return { verdict: 'EVOLUTION_PASS', blockedReason: null };
  }
  if ((input.installedCount > 0 || input.reusedCount > 0) && input.planningRerunPass) {
    return { verdict: 'EVOLUTION_PASS', blockedReason: null };
  }
  if (input.blockedReason) {
    return { verdict: 'EVOLUTION_BLOCKED', blockedReason: input.blockedReason };
  }
  return { verdict: 'IN_PROGRESS', blockedReason: 'Evolution incomplete' };
}

export function runMissingCapabilityEvolutionPipeline(
  input: MissingCapabilityEvolutionPipelineInput,
): MissingCapabilityEvolutionPipelineResult {
  const budget = createEvolutionLoopBudget();
  const intakeItems = intakeMissingCapabilities(input);

  const designs: MissingCapabilityEvolutionPipelineResult['designs'] = [];
  const interfaceDesigns: MissingCapabilityEvolutionPipelineResult['interfaceDesigns'] = [];
  const implementationPlans: MissingCapabilityEvolutionPipelineResult['implementationPlans'] = [];
  const validatorDesigns: MissingCapabilityEvolutionPipelineResult['validatorDesigns'] = [];
  const fixturePlans: MissingCapabilityEvolutionPipelineResult['fixturePlans'] = [];
  const workspaceArtifacts: MissingCapabilityEvolutionPipelineResult['workspaceArtifacts'] = [];
  const validationEvidence: MissingCapabilityEvolutionPipelineResult['validationEvidence'] = [];
  const installationResults: MissingCapabilityEvolutionPipelineResult['installationResults'] = [];
  const registryRecords: MissingCapabilityEvolutionPipelineResult['registryRecords'] = [];
  const reuseIndexEntries: MissingCapabilityEvolutionPipelineResult['reuseIndexEntries'] = [];
  const evolutionAttempts: MissingCapabilityEvolutionPipelineResult['evolutionAttempts'] = [];
  const reusedCapabilityIds: string[] = [];

  const safetyAssessments = intakeItems.map(assessEvolutionSafety);

  let blockedReason: string | null = null;
  let humanReview: MissingCapabilityEvolutionPipelineResult['humanReview'] = null;
  let insufficientEvidence = false;
  let unsafeBlocked = false;
  let validationFailures = 0;
  let generatedFiles = 0;

  if (input.promptFaithfulnessBlocked) {
    blockedReason = 'Prompt Faithfulness blocked — evolution cannot proceed without faithful prompt contract.';
    unsafeBlocked = true;
  }

  for (let i = 0; i < intakeItems.length; i++) {
    const item = intakeItems[i]!;
    const safety = safetyAssessments[i]!;

    if (!hasRequirementEvidence(item) && item.blockingGate !== 'AUTONOMOUS_DEBUGGING') {
      insufficientEvidence = true;
      blockedReason = blockedReason ?? 'Missing requirement evidence — evolution blocked';
      evolutionAttempts.push(
        recordEvolutionAttempt({
          capabilityId: item.missingCapabilityId,
          attemptNumber: 1,
          outcome: 'BLOCKED',
          reason: 'INSUFFICIENT_EVIDENCE',
        }),
      );
      continue;
    }

    if (safety.verdict === 'INSUFFICIENT_EVIDENCE') {
      insufficientEvidence = true;
      blockedReason = blockedReason ?? safety.blockedReason;
      continue;
    }

    if (safety.verdict === 'BLOCKED_UNSAFE') {
      unsafeBlocked = true;
      blockedReason = blockedReason ?? safety.blockedReason;
      evolutionAttempts.push(
        recordEvolutionAttempt({
          capabilityId: item.missingCapabilityId,
          attemptNumber: 1,
          outcome: 'BLOCKED',
          reason: safety.blockedReason ?? 'BLOCKED_UNSAFE',
        }),
      );
      continue;
    }

    if (safety.verdict === 'NEEDS_HUMAN_REVIEW') {
      humanReview = escalateEvolutionToHumanReview({
        item,
        attempts: evolutionAttempts,
        remainingGap: safety.blockedReason ?? 'High-risk capability requires human review',
        safetyVerdict: safety.verdict,
      });
      blockedReason = blockedReason ?? safety.humanReviewReason ?? safety.blockedReason;
      continue;
    }

    const reuseCheck = checkCapabilityReuse(item.capabilityName);
    if (reuseCheck.existing || preventDuplicateEvolution(item.capabilityName)) {
      const existing = reuseCheck.existing ?? findExistingEvolvedCapability(item.capabilityName);
      if (existing) {
        reusedCapabilityIds.push(existing.capabilityId);
        evolutionAttempts.push(
          recordEvolutionAttempt({
            capabilityId: existing.capabilityId,
            attemptNumber: 1,
            outcome: 'REUSED',
            reason: reuseCheck.reuseReason ?? 'Duplicate evolution prevented — reusing validated capability',
          }),
        );
        continue;
      }
    }

    if (!isSafeToEvolve(safety)) {
      continue;
    }

    const design = planCapabilityDesign({ item, safety });
    const interfaceDesign = designCapabilityInterface(design);
    const implementationPlan = planCapabilityImplementation({ design, interfaceDesign });
    const validatorDesign = designCapabilityValidators(design);
    const fixturePlan = planCapabilityTestFixtures(design);
    const workspace = generateCapabilityWorkspace({
      design,
      implementationPlan,
      validatorDesign,
      fixturePlan,
    });
    generatedFiles += implementationPlan.filesToCreate.length;

    const validation = runCapabilityValidation({
      design,
      validatorDesign,
      workspace,
      simulateValidationFailure: input.simulateValidationFailure,
    });

    designs.push(design);
    interfaceDesigns.push(interfaceDesign);
    implementationPlans.push(implementationPlan);
    validatorDesigns.push(validatorDesign);
    fixturePlans.push(fixturePlan);
    workspaceArtifacts.push(workspace);
    validationEvidence.push(validation);

    if (!isValidationInstallable(validation)) {
      validationFailures += 1;
      const installation = executeCapabilityInstallation({
        design,
        implementationPlan,
        workspace,
        validation,
      });
      installationResults.push(installation);
      evolutionAttempts.push(
        recordEvolutionAttempt({
          capabilityId: design.capabilityId,
          attemptNumber: 1,
          outcome: 'ROLLED_BACK',
          reason: installation.failureReason ?? 'Validation failed',
        }),
      );
      blockedReason = blockedReason ?? installation.failureReason;
      continue;
    }

    const installation = executeCapabilityInstallation({
      design,
      implementationPlan,
      workspace,
      validation,
    });
    installationResults.push(installation);

    if (!installation.installed) {
      evolutionAttempts.push(
        recordEvolutionAttempt({
          capabilityId: design.capabilityId,
          attemptNumber: 1,
          outcome: 'ROLLED_BACK',
          reason: installation.failureReason ?? 'Installation failed',
        }),
      );
      blockedReason = blockedReason ?? installation.failureReason;
      continue;
    }

    const record = updateCapabilityRegistry({ design, safety, validation, installation });
    if (record) {
      registryRecords.push(record);
      reuseIndexEntries.push(indexCapabilityForReuse({ design, validation, record }));
      evolutionAttempts.push(
        recordEvolutionAttempt({
          capabilityId: design.capabilityId,
          attemptNumber: 1,
          outcome: 'SUCCESS',
          reason: 'Capability evolved, validated, installed, and registered',
        }),
      );
    }
  }

  if (
    isEvolutionBudgetExhausted({
      budget,
      attempts: evolutionAttempts,
      generatedFiles,
      validationFailures,
    }) &&
    !registryRecords.length &&
    !reusedCapabilityIds.length
  ) {
    humanReview =
      humanReview ??
      escalateEvolutionToHumanReview({
        item: intakeItems[0] ?? {
          readOnly: true,
          missingCapabilityId: 'unknown',
          capabilityName: 'unknown',
          reasonRequired: '',
          sourceRequirementIds: [],
          sourcePromptEvidence: [],
          affectedFeatureSlices: [],
          affectedBehaviorScenarios: [],
          affectedVirtualUsers: [],
          affectedDeviceProfiles: [],
          affectedInteractions: [],
          expectedInterfaces: [],
          requiredValidation: [],
          riskHints: [],
          blockingGate: 'CAPABILITY_PLANNING',
        },
        attempts: evolutionAttempts,
        remainingGap: blockedReason ?? 'Evolution budget exhausted',
        safetyVerdict: safetyAssessments[0]?.verdict ?? 'NEEDS_HUMAN_REVIEW',
      });
  }

  let capabilityPlanningRerunPass = intakeItems.length === 0;
  let buildResumeGate: string | null = null;

  if (registryRecords.length > 0 || reusedCapabilityIds.length > 0) {
    const rerun = runCapabilityPlanningPipeline({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel: input.productIntelligenceModel,
      promptFaithfulness: input.promptFaithfulness,
      promptFaithfulnessBlocked: input.promptFaithfulnessBlocked,
    });
    capabilityPlanningRerunPass =
      rerun.permissionVerdict === 'READY_FOR_GENERATION' ||
      rerun.permissionVerdict === 'NEEDS_CAPABILITY_EVOLUTION';
    buildResumeGate = capabilityPlanningRerunPass ? 'INCREMENTAL_BUILD' : null;
  }

  const { verdict, blockedReason: derivedBlocked } = derivePermissionVerdict({
    intakeCount: intakeItems.length,
    blockedReason,
    humanReview,
    installedCount: registryRecords.length,
    reusedCount: reusedCapabilityIds.length,
    unsafeBlocked,
    insufficientEvidence,
    planningRerunPass: capabilityPlanningRerunPass,
  });

  const result: MissingCapabilityEvolutionPipelineResult = {
    readOnly: true,
    pipelineId: nextPipelineId(),
    rawPrompt: input.rawPrompt,
    intakeItems,
    safetyAssessments,
    designs,
    interfaceDesigns,
    implementationPlans,
    validatorDesigns,
    fixturePlans,
    workspaceArtifacts,
    validationEvidence,
    installationResults,
    registryRecords,
    reuseIndexEntries,
    evolutionAttempts,
    reusedCapabilityIds,
    humanReview,
    permissionVerdict: verdict,
    blockedReason: derivedBlocked,
    capabilityPlanningRerunPass,
    buildResumeGate,
    reportMarkdown: '',
    completedAt: Date.now(),
  };

  result.reportMarkdown = buildMissingCapabilityEvolutionReport(result);
  recordCapabilityEvolutionHistory(result);
  lastPipelineResult = result;
  return result;
}

export function isMissingCapabilityEvolutionComplete(
  result: MissingCapabilityEvolutionPipelineResult,
): boolean {
  return result.permissionVerdict === 'EVOLUTION_PASS';
}

export function buildLaunchMissingCapabilityEvolutionEvidence(
  result: MissingCapabilityEvolutionPipelineResult,
): LaunchMissingCapabilityEvolutionEvidence {
  const blockers: string[] = [];
  if (result.blockedReason) blockers.push(result.blockedReason);
  if (result.permissionVerdict === 'EVOLUTION_BLOCKED') blockers.push('Capability evolution blocked');
  if (result.permissionVerdict === 'NEEDS_HUMAN_REVIEW') blockers.push('Human review required for capability evolution');

  return {
    readOnly: true,
    missingCount: result.intakeItems.length,
    safeToEvolveCount: result.safetyAssessments.filter((s) => isSafeToEvolve(s)).length,
    blockedCount: result.safetyAssessments.filter(
      (s) => s.verdict === 'BLOCKED_UNSAFE' || s.verdict === 'NEEDS_HUMAN_REVIEW',
    ).length,
    generatedCount: result.workspaceArtifacts.length,
    validatedCount: result.validationEvidence.filter((v) => v.status === 'VALIDATED').length,
    installedCount: result.installationResults.filter((i) => i.installed).length,
    registeredCount: result.registryRecords.length,
    reusedCount: result.reusedCapabilityIds.length,
    humanReviewCount: result.humanReview ? 1 : 0,
    limitedCount: result.registryRecords.filter((r) => r.status === 'EVOLVED_WITH_LIMITATIONS').length,
    permissionVerdict: result.permissionVerdict,
    blockers,
  };
}

export function getMissingCapabilityEvolutionPassToken(): string {
  return MISSING_CAPABILITY_EVOLUTION_ENGINE_PASS_TOKEN;
}

export function registerMissingCapabilityEvolutionWithLaunchAuthority(): { passToken: string; readOnly: true } {
  return { passToken: MISSING_CAPABILITY_EVOLUTION_ENGINE_PASS_TOKEN, readOnly: true };
}
