/**
 * Autonomous Engineering Executive V1 — decision engine.
 * Sole authority for CONTINUE | REPAIR | RETRY | ROLLBACK | PREVIEW | STOP.
 */

import { existsSync } from 'node:fs';
import type {
  AeeBuildOutcome,
  AeeDecision,
  AeeExecutiveDecisionInput,
  AeeExecutiveDecisionResult,
  AeeStage,
} from './aee-types.js';
import { AEE_OVERRIDE_ASE_DENIAL_EVENT } from './aee-types.js';
import { normalizeAuthorityEvidenceBundle } from './aee-evidence-normalizer.js';
import {
  evaluateAeeContinuationPolicy,
  workspaceProvenFaithfulnessOverride,
} from './aee-continuation-policy.js';
import {
  aeeForbidsPlanningFailedAfterWorkspace,
  isAfterWorkspaceReady,
} from './aee-state-machine.js';
import { AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS } from './aee-preview-recovery-loop-types.js';
import { isPromptFaithfulnessPassedForContinuation } from '../universal-build-pipeline-verification/build-continuation-policy.js';
import { workspaceHasGeneratedFeatureModules } from '../feature-contract-reality/index.js';

export const AEE_REPAIR_BUDGET = 3;
export const AEE_RETRY_BUDGET = 2;

export function resolveAeeBuildOutcome(input: {
  workspaceExists: boolean;
  materialized: boolean;
  npmInstallOk: boolean;
  npmBuildOk: boolean;
  previewOk: boolean;
  previewDegraded: boolean;
  repairAttempts: number;
  concreteBlocker: boolean;
  featureGapsRemain?: boolean;
}): AeeBuildOutcome {
  if (!input.workspaceExists || !input.materialized) {
    return 'BUILD_STOPPED_BEFORE_WORKSPACE';
  }
  if (input.concreteBlocker && input.repairAttempts >= AEE_REPAIR_BUDGET) {
    return 'BUILD_STOPPED_AFTER_REPAIR_EXHAUSTED';
  }
  if (input.concreteBlocker) {
    return 'BUILD_STOPPED_FOR_CONCRETE_BLOCKER';
  }
  if (input.npmBuildOk && input.featureGapsRemain) {
    return 'BUILD_COMPLETED_WITH_FEATURE_GAPS';
  }
  if (input.previewOk) {
    return 'BUILD_COMPLETED_WITH_PREVIEW';
  }
  if (input.previewDegraded || (input.npmBuildOk && !input.previewOk)) {
    return 'BUILD_COMPLETED_WITH_DEGRADED_PREVIEW';
  }
  if (input.npmInstallOk || input.npmBuildOk) {
    return 'BUILD_COMPLETED_WITH_BUILD_ERRORS';
  }
  return 'BUILD_STOPPED_BEFORE_WORKSPACE';
}

function inferStage(input: AeeExecutiveDecisionInput): AeeStage {
  if (input.previewOk) return 'FINAL_REPORT';
  if (input.npmBuildOk) return 'PREVIEWING';
  if (input.npmInstallOk) return 'BUILDING';
  if (input.generatedFileCount && input.generatedFileCount > 0) return 'WORKSPACE_READY';
  if (existsSync(input.workspaceDir) && workspaceHasGeneratedFeatureModules(input.workspaceDir)) {
    return 'WORKSPACE_READY';
  }
  if (input.buildPlan.readyForGeneration) return 'PLANNING';
  return 'UNDERSTOOD';
}

export function evaluateAeeExecutiveDecision(
  input: AeeExecutiveDecisionInput,
): AeeExecutiveDecisionResult {
  const stage = inferStage(input);
  const faithfulnessPassed =
    isPromptFaithfulnessPassedForContinuation(
      input.buildPlan.promptFaithfulness,
      input.manifestFaithfulness,
    ) || workspaceProvenFaithfulnessOverride(input);

  const evidence = normalizeAuthorityEvidenceBundle({
    ...input,
    stage,
    faithfulnessPassed,
  });

  const continuation = evaluateAeeContinuationPolicy({
    workspaceDir: input.workspaceDir,
    buildPlan: input.buildPlan,
    blockers: input.aseBlockers,
    featureRealityStatus: input.featureRealityStatus,
    manifestFaithfulness: input.manifestFaithfulness,
  });

  const concreteEvidence = evidence.filter((e) => e.concreteBlocker);
  const hasGeneratedSource = workspaceHasGeneratedFeatureModules(input.workspaceDir);
  const aseMaterializationIncomplete =
    !input.aseMaterializationAuthorized || input.aseMaterializationExecuted === false;
  const canOverrideAseDenial =
    continuation.shouldContinueToBuild &&
    (hasGeneratedSource || continuation.shouldMaterializeFirst);

  let decision: AeeDecision = 'CONTINUE';
  let overrideEvent: string | null = null;
  let reasoning = continuation.continuationReason ?? 'AEE default forward continuation.';
  const overriddenBlockers: string[] = [];
  const respectedBlockers: string[] = [];

  if (!faithfulnessPassed) {
    decision = 'STOP';
    reasoning = 'Prompt is invalid or faithfulness did not pass — concrete pre-workspace blocker.';
    respectedBlockers.push(...input.aseBlockers);
  } else if (
    input.npmBuildOk === true &&
    input.previewOk === false &&
    input.previewDegraded === true
  ) {
    decision = 'CONTINUE';
    reasoning =
      'npm install/build passed — AEE preview contract applies; degraded preview is not project failure.';
  } else if (
    input.npmBuildOk === true &&
    input.previewOk === false &&
    (input.previewRecoveryAttempts ?? 0) < AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS
  ) {
    decision = 'REPAIR';
    reasoning =
      'Build succeeded but preview is locked/degraded — AEE preview recovery loop (debugging, capability detection, retry).';
  } else if (!continuation.workspaceExists && !input.buildPlan.readyForGeneration) {
    decision = 'STOP';
    reasoning = 'Workspace cannot be created — concrete blocker.';
    respectedBlockers.push(...input.aseBlockers);
  } else if (aseMaterializationIncomplete && canOverrideAseDenial) {
    decision = 'CONTINUE';
    overrideEvent = AEE_OVERRIDE_ASE_DENIAL_EVENT;
    overriddenBlockers.push(...input.aseBlockers);
    reasoning =
      continuation.continuationReason ??
      (continuation.shouldMaterializeFirst
        ? 'AEE overrides ASE denial — materializing workspace then continuing build spine.'
        : 'AEE overrides ASE denial — workspace evidence supports continuation.');
  } else if (aseMaterializationIncomplete && !continuation.shouldContinueToBuild) {
    if (concreteEvidence.length > 0) {
      decision = 'STOP';
      reasoning = `Concrete blocker: ${concreteEvidence.map((e) => e.reason).join('; ')}`;
      respectedBlockers.push(...input.aseBlockers);
    } else {
      decision = 'STOP';
      reasoning = continuation.continuationReason ?? 'AEE stopped — continuation conditions not met.';
      respectedBlockers.push(...input.aseBlockers);
    }
  } else if (
    input.npmInstallOk === true &&
    input.npmBuildOk === false &&
    (input.repairAttempts ?? 0) < AEE_REPAIR_BUDGET
  ) {
    const buildFailure = input.aseBlockers.find((b) =>
      /npm build|typescript|import|export|route wiring|compile|autofix/i.test(b),
    );
    decision = 'REPAIR';
    reasoning = buildFailure
      ? `Repairable build issue: ${buildFailure}`
      : 'npm run build failed — AEE bounded build AutoFix repair loop.';
  } else if (
    input.previewOk === false &&
    input.npmBuildOk === true &&
    (input.retryAttempts ?? 0) < AEE_RETRY_BUDGET
  ) {
    const retryable = input.aseBlockers.find((b) =>
      /timeout|port conflict|transient|stale health/i.test(b),
    );
    if (retryable) {
      decision = 'RETRY';
      reasoning = `Retryable preview issue: ${retryable}`;
    } else if (input.npmBuildOk) {
      decision = 'PREVIEW';
      reasoning = 'Build succeeded — AEE directs preview attempt.';
    }
  } else if (
    input.npmBuildOk === true &&
    input.previewOk === false &&
    (input.previewDegraded === true || (input.previewRecoveryAttempts ?? 0) > 0)
  ) {
    decision = 'CONTINUE';
    reasoning =
      'npm install/build passed; preview is degraded after bounded recovery — build treated as completed.';
  } else if (input.npmBuildOk && !input.previewOk) {
    decision = 'PREVIEW';
    reasoning = 'Build succeeded — proceeding to preview.';
  }

  const shouldContinueToBuild =
    decision === 'CONTINUE' ||
    decision === 'REPAIR' ||
    decision === 'RETRY' ||
    decision === 'PREVIEW' ||
    (continuation.shouldContinueToBuild && decision !== 'STOP');

  const shouldMaterializeFirst =
    shouldContinueToBuild && continuation.shouldMaterializeFirst;

  const concreteBlocker = decision === 'STOP' && concreteEvidence.length > 0 && !(input.npmBuildOk && input.npmInstallOk);
  const outcome = resolveAeeBuildOutcome({
    workspaceExists: continuation.workspaceExists,
    materialized: hasGeneratedSource,
    npmInstallOk: input.npmInstallOk ?? false,
    npmBuildOk: input.npmBuildOk ?? false,
    previewOk: input.previewOk ?? false,
    previewDegraded: input.previewDegraded ?? false,
    repairAttempts: input.repairAttempts ?? 0,
    concreteBlocker,
    featureGapsRemain:
      input.engineeringIntelligenceFidelityPassed === false && input.npmBuildOk === true,
  });

  const furthestStageReached: AeeStage =
    input.previewOk === true
      ? 'FINAL_REPORT'
      : input.npmBuildOk === true
        ? 'PREVIEWING'
        : input.npmInstallOk === true
          ? 'BUILDING'
          : hasGeneratedSource
            ? 'WORKSPACE_READY'
            : stage;

  if (
    aeeForbidsPlanningFailedAfterWorkspace(furthestStageReached, hasGeneratedSource, 'PLANNING_FAILED')
  ) {
    reasoning = `${reasoning} AEE forbids PLANNING_FAILED after workspace evidence exists.`;
  }

  return {
    readOnly: true,
    decision,
    stage: isAfterWorkspaceReady(furthestStageReached) ? furthestStageReached : stage,
    outcome: input.npmBuildOk && input.npmInstallOk ? outcome : decision === 'STOP' ? outcome : null,
    shouldContinueToBuild,
    shouldMaterializeFirst,
    overrideEvent,
    overriddenBlockers,
    respectedBlockers,
    evidence,
    reasoning,
    furthestStageReached,
    repairAttempts: input.repairAttempts ?? 0,
    retryAttempts: input.retryAttempts ?? 0,
    previewRecoveryAttempts: input.previewRecoveryAttempts ?? 0,
  };
}

export function aeeDecisionAllowsForward(decision: AeeDecision): boolean {
  return decision !== 'STOP' && decision !== 'ROLLBACK';
}
