/**
 * ASE Enforcement Engine — public authority API.
 */

import { runAutonomousSoftwareEngineeringPipeline } from '../autonomous-software-engineering-engine/ase-authority.js';
import type { AutonomousSoftwareEngineeringPipelineInput } from '../autonomous-software-engineering-engine/ase-types.js';
import type {
  AutonomousEngineeringInput,
  AutonomousEngineeringResult,
  EngineeringDecision,
} from './ase-enforcement-engine-types.js';
import { aggregateEngineeringEvidence } from './engineering-evidence-aggregator.js';
import { evaluateEngineeringDecision } from './engineering-decision-engine.js';
import { evaluateEngineeringGoal } from './engineering-goal-evaluator.js';
import {
  authorizeMaterialization,
  completeEngineeringAction,
  getAuthorizedActionLog,
  requestEngineeringAction,
  resetEngineeringActionAuthorityForTests,
  setLastEngineeringDecision,
} from './engineering-action-authority.js';
import { discoverEngineeringState } from './engineering-state-discovery.js';
import { resetEngineeringExecutionMonitorForTests } from './engineering-execution-monitor.js';
import { attemptEngineeringRecovery } from '../autonomous-recovery-authority/index.js';
import { routeEngineeringRecovery } from './engineering-recovery-router.js';

let lastResult: AutonomousEngineeringResult | null = null;

export function resetEngineeringAuthorityForTests(): void {
  lastResult = null;
  resetEngineeringActionAuthorityForTests();
  resetEngineeringExecutionMonitorForTests();
}

export function getEngineeringState(): AutonomousEngineeringResult['engineeringState'] {
  return lastResult?.engineeringState ?? 'NOT_STARTED';
}

export function getEngineeringGoal(): AutonomousEngineeringResult['engineeringGoal'] {
  return lastResult?.engineeringGoal ?? 'UNDERSTAND_PRODUCT_INTENT';
}

export function getLastAutonomousEngineeringResult(): AutonomousEngineeringResult | null {
  return lastResult;
}

function toPipelineInput(input: AutonomousEngineeringInput): AutonomousSoftwareEngineeringPipelineInput {
  return {
    rawPrompt: input.rawPrompt,
    projectId: input.projectId,
    projectRootDir: input.projectRootDir,
    workspaceDir: input.workspaceDir,
    previewUrl: input.previewUrl ?? null,
    productIntelligenceModel: input.productIntelligenceModel,
    promptFaithfulness: input.promptFaithfulness,
    capabilityPlanning: input.capabilityPlanning,
    simulateDeadButton: input.simulateDeadButton,
    simulateHumanReviewPayment: input.simulateHumanReviewPayment,
    simulateUnresolvedCapability: input.simulateUnresolvedCapability,
  };
}

export function runAutonomousEngineering(
  input: AutonomousEngineeringInput,
): AutonomousEngineeringResult {
  const prePipeline = runAutonomousSoftwareEngineeringPipeline(toPipelineInput(input));
  const evidence = aggregateEngineeringEvidence(prePipeline);
  const engineeringState = discoverEngineeringState(prePipeline);
  const engineeringGoal = evaluateEngineeringGoal({
    state: engineeringState,
    evidence,
    materializationExecuted: false,
    simulateHumanReviewPayment: input.simulateHumanReviewPayment,
  });
  const decision = evaluateEngineeringDecision({
    state: engineeringState,
    goal: engineeringGoal,
    evidence,
    materializationExecuted: false,
  });
  setLastEngineeringDecision(decision);

  const materializationAuthorized = input.simulateAseMaterializationDenial
    ? false
    : authorizeMaterialization(decision, evidence.readyForMaterialization);
  const decisions: EngineeringDecision[] = [decision];
  let materializationExecuted = false;

  if (materializationAuthorized && input.host?.executeMaterialization) {
    const auth = requestEngineeringAction({
      actionType: 'MATERIALIZATION',
      reason: 'ASE-authorized materialization execution.',
    });
    if (auth.authorized) {
      const hostResult = input.host.executeMaterialization();
      materializationExecuted = hostResult.ok;
      completeEngineeringAction(
        auth.actionId,
        hostResult.ok,
        hostResult.failureReason ?? 'Materialization completed.',
      );
      if (!hostResult.ok && hostResult.failureReason) {
        const recovery = attemptEngineeringRecovery({
          projectId: input.projectId,
          failureStage: 'MATERIALIZATION',
          failureReason: hostResult.failureReason,
          blockers: [hostResult.failureReason],
          host: {
            regenerateArtifacts: () => {
              const retry = input.host?.executeMaterialization?.();
              return { ok: retry?.ok ?? false, detail: retry?.failureReason ?? 'Materialization retry' };
            },
            replayValidation: input.host?.executeMaterialization
              ? () => {
                  const retry = input.host!.executeMaterialization!();
                  return { ok: retry.ok, detail: retry.failureReason ?? 'Validation replay after recovery' };
                }
              : undefined,
            resumePipeline: () => ({ ok: false, detail: 'Pipeline resume deferred to orchestrator.' }),
          },
        });
        if (recovery.recovered || recovery.continued) {
          const retry = input.host?.executeMaterialization?.();
          if (retry?.ok) {
            materializationExecuted = true;
            completeEngineeringAction(auth.actionId, true, 'Materialization recovered autonomously.');
          }
        }
        const recoveryRoute = routeEngineeringRecovery({
          failedStage: 'INCREMENTAL_BUILD',
          failure: hostResult.failureReason,
          evidenceId: null,
        });
        const recoveryDecision = evaluateEngineeringDecision({
          state: recovery.recovered ? 'GENERATING' : 'FAILED',
          goal: recovery.recovered ? 'GENERATE_APPLICATION' : 'REPAIR_ENGINEERING_FAILURES',
          evidence: {
            ...evidence,
            blockers: recovery.recovered ? [] : [hostResult.failureReason, ...evidence.blockers],
          },
          materializationExecuted: materializationExecuted,
        });
        decisions.push(recoveryDecision);
        setLastEngineeringDecision(recoveryDecision);
      }
    }
  }

  const result: AutonomousEngineeringResult = {
    readOnly: true,
    runId: prePipeline.runId,
    projectId: input.projectId,
    engineeringState,
    engineeringGoal,
    engineeringComplete: false,
    materializationAuthorized,
    materializationExecuted,
    awaitingPreviewUrl: true,
    decisions,
    actions: getAuthorizedActionLog(),
    evidence,
    asePipeline: prePipeline,
    preMaterializationPipeline: prePipeline,
  };

  lastResult = result;
  return result;
}

export function completeAutonomousEngineering(input: {
  partial: AutonomousEngineeringResult;
  previewUrl: string | null;
  projectRootDir: string;
  workspaceDir: string;
  rawPrompt: string;
  projectId: string;
}): AutonomousEngineeringResult {
  const postPipeline = runAutonomousSoftwareEngineeringPipeline({
    rawPrompt: input.rawPrompt,
    projectId: input.projectId,
    projectRootDir: input.projectRootDir,
    workspaceDir: input.workspaceDir,
    previewUrl: input.previewUrl,
    productIntelligenceModel: input.partial.asePipeline.artifacts.productIntelligenceModel,
    promptFaithfulness: input.partial.asePipeline.artifacts.promptFaithfulness,
    capabilityPlanning: input.partial.asePipeline.artifacts.capabilityPlanning,
  });

  const evidence = aggregateEngineeringEvidence(postPipeline);
  const engineeringState = discoverEngineeringState(postPipeline);
  const engineeringGoal = evaluateEngineeringGoal({
    state: engineeringState,
    evidence,
    materializationExecuted: input.partial.materializationExecuted,
  });
  const decision = evaluateEngineeringDecision({
    state: engineeringState,
    goal: engineeringGoal,
    evidence,
    materializationExecuted: input.partial.materializationExecuted,
  });
  setLastEngineeringDecision(decision);

  const engineeringComplete =
    postPipeline.readyForPreview ||
    postPipeline.overallStatus === 'PREVIEW_UNLOCKED' ||
    (evidence.readyForLaunch && input.previewUrl !== null);

  const result: AutonomousEngineeringResult = {
    readOnly: true,
    runId: postPipeline.runId,
    projectId: input.projectId,
    engineeringState,
    engineeringGoal,
    engineeringComplete,
    materializationAuthorized: input.partial.materializationAuthorized,
    materializationExecuted: input.partial.materializationExecuted,
    awaitingPreviewUrl: false,
    decisions: [...input.partial.decisions, decision],
    actions: [...input.partial.actions, ...getAuthorizedActionLog()],
    evidence,
    asePipeline: postPipeline,
    preMaterializationPipeline: input.partial.preMaterializationPipeline,
  };

  lastResult = result;
  return result;
}
