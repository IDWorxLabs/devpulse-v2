/**
 * Autonomous Engineering Loop V1 — main orchestrator.
 * AEL wraps AEE; it does not replace the build spine.
 */

import { initialAelState, isAelTerminalState, resolveNextAelState } from './ael-loop-state-machine.js';
import { collectAelEvidence } from './ael-evidence-collector.js';
import { evaluateAelDecision } from './ael-decision-engine.js';
import { routeAelRepair } from './ael-repair-router.js';
import { evaluateProductReality } from './product-reality-engine.js';
import { runAutonomousFounderLoop } from './autonomous-founder-loop.js';
import {
  buildAelCycleRecord,
  buildAelFinalReport,
  writeAelReportArtifacts,
} from './ael-report-builder.js';
import type {
  AelFinalOutcome,
  AelOrchestratorInput,
  AelOrchestratorResult,
  AelState,
} from './ael-types.js';
import { AEL_MAX_FOUNDER_LOOP_CYCLES } from './ael-types.js';

export function isAelEnabled(): boolean {
  const env = process.env.AIDEVENGINE_AEL_ENABLED;
  if (env === 'false' || env === '0') return false;
  if (env === 'true' || env === '1') return true;
  return process.env.NODE_ENV !== 'production';
}

export async function runAutonomousEngineeringLoop(
  input: AelOrchestratorInput,
): Promise<AelOrchestratorResult> {
  if (!isAelEnabled()) {
    const productReality = evaluateProductReality({
      rawPrompt: input.rawPrompt,
      workspaceDir: input.workspaceDir,
      generatedModules: input.generatedModules,
      approvedModuleIds: input.buildPlan.modulePlan.approvedModuleIds,
    });
    const report = buildAelFinalReport({
      enabled: false,
      initialPrompt: input.rawPrompt,
      domain: productReality.productDomain,
      cyclesExecuted: 0,
      aeeFurthestStage: input.aeeFurthestStage,
      productRealityScore: productReality.productRealityScore,
      founderLoopResult: 'AEL disabled — AEE-only path',
      capabilitiesEvolved: [],
      autofixAttempts: input.autofixAttempts,
      previewRecoveryAttempts: input.previewRecoveryAttempts,
      capabilityEvolutionAttempts: 0,
      finalOutcome: input.npmBuildOk ? 'BUILD_READY_WITH_FEATURE_GAPS' : 'ENGINEERING_LIMIT_REACHED',
      remainingGaps: productReality.launchReadinessBlockers,
      humanReviewRequired: false,
      cycleHistory: [],
    });
    const evidence = collectAelEvidence({
      rawPrompt: input.rawPrompt,
      workspaceDir: input.workspaceDir,
      generatedModules: input.generatedModules,
      approvedModuleIds: input.buildPlan.modulePlan.approvedModuleIds,
      npmInstallOk: input.npmInstallOk,
      npmBuildOk: input.npmBuildOk,
      previewOk: input.previewOk,
      previewDegraded: input.previewDegraded,
      autofixAttempts: input.autofixAttempts,
      capabilityEvolutionAttempts: 0,
      previewRecoveryAttempts: input.previewRecoveryAttempts,
      aeeFurthestStage: input.aeeFurthestStage,
      aeeFinalReport: input.aeeFinalReport,
      engineeringIntelligenceScore: input.engineeringIntelligenceScore,
      productRealityReport: productReality,
    });
    return {
      readOnly: true,
      enabled: false,
      finalState: 'AEL_NOT_STARTED',
      finalOutcome: report.finalOutcome,
      cyclesExecuted: 0,
      report,
      evidence,
      reportPaths: { json: null, markdown: null },
    };
  }

  let state: AelState = initialAelState();
  let cycle = 0;
  let npmBuildOk = input.npmBuildOk;
  let previewOk = input.previewOk;
  let autofixAttempts = input.autofixAttempts;
  let previewRecoveryAttempts = input.previewRecoveryAttempts;
  let capabilityEvolutionAttempts = 0;
  const evolvedModules: string[] = [];
  const cycleHistory: ReturnType<typeof buildAelCycleRecord>[] = [];
  const remainingGaps: string[] = [];
  let humanReviewRequired = false;
  let finalOutcome: AelFinalOutcome = 'ENGINEERING_LIMIT_REACHED';

  let generatedModules = [...input.generatedModules];
  let productReality = evaluateProductReality({
    rawPrompt: input.rawPrompt,
    workspaceDir: input.workspaceDir,
    generatedModules,
    approvedModuleIds: input.buildPlan.modulePlan.approvedModuleIds,
  });

  while (cycle < AEL_MAX_FOUNDER_LOOP_CYCLES && !isAelTerminalState(state)) {
    cycle += 1;
    state = 'AEL_PRODUCT_REALITY_CHECK';
    productReality = evaluateProductReality({
      rawPrompt: input.rawPrompt,
      workspaceDir: input.workspaceDir,
      generatedModules,
      approvedModuleIds: input.buildPlan.modulePlan.approvedModuleIds,
    });

    state = 'AEL_FOUNDER_SIMULATION';
    const founderLoop = runAutonomousFounderLoop({
      rawPrompt: input.rawPrompt,
      workspaceDir: input.workspaceDir,
      projectId: input.projectId,
      productRealityReport: productReality,
      npmBuildOk,
      previewOk,
      cycleBudget: 1,
    });
    const founderReport = founderLoop.cycles[founderLoop.cycles.length - 1] ?? null;

    state = 'AEL_CAPABILITY_GAP_ANALYSIS';
    const evidence = collectAelEvidence({
      rawPrompt: input.rawPrompt,
      workspaceDir: input.workspaceDir,
      generatedModules,
      approvedModuleIds: input.buildPlan.modulePlan.approvedModuleIds,
      npmInstallOk: input.npmInstallOk,
      npmBuildOk,
      previewOk,
      previewDegraded: input.previewDegraded,
      autofixAttempts,
      capabilityEvolutionAttempts,
      previewRecoveryAttempts,
      aeeFurthestStage: input.aeeFurthestStage,
      aeeFinalReport: input.aeeFinalReport,
      engineeringIntelligenceScore: input.engineeringIntelligenceScore,
      productRealityReport: productReality,
      founderLoopReport: founderReport,
      safetyReviewRequired: founderLoop.safetyReviewRequired,
      remainingGaps,
    });

    const decisionResult = evaluateAelDecision(evidence, cycle);
    if (decisionResult.finalOutcome) {
      finalOutcome = decisionResult.finalOutcome;
    }

    cycleHistory.push(
      buildAelCycleRecord({
        cycle,
        state,
        productRealityScore: productReality.productRealityScore,
        founderVerdict: founderReport?.verdict ?? 'unknown',
        decision: decisionResult.decision,
        repairAction: null,
      }),
    );

    if (
      decisionResult.decision === 'DECLARE_LAUNCH_READY' ||
      decisionResult.decision === 'REQUEST_HUMAN_REVIEW' ||
      decisionResult.decision === 'STOP_AT_ENGINEERING_LIMIT'
    ) {
      state = resolveNextAelState({ current: state, decision: decisionResult.decision });
      humanReviewRequired = decisionResult.decision === 'REQUEST_HUMAN_REVIEW';
      break;
    }

    const repair = await routeAelRepair({
      decision: decisionResult.decision,
      rawPrompt: input.rawPrompt,
      workspaceDir: input.workspaceDir,
      projectRootDir: input.projectRootDir,
      workspaceId: input.workspaceId,
      missingCapabilities: productReality.missingCapabilities,
      definition: input.buildPlan.definition,
      existingModules: generatedModules,
      capabilityEvolutionAttempts,
      runAutofix: input.runAutofix,
      runPreviewRecovery: input.runPreviewRecovery,
    });

    const lastCycleIndex = cycleHistory.length - 1;
    cycleHistory[lastCycleIndex] = buildAelCycleRecord({
      cycle,
      state,
      productRealityScore: productReality.productRealityScore,
      founderVerdict: founderReport?.verdict ?? 'unknown',
      decision: decisionResult.decision,
      repairAction: repair.action,
    });
    autofixAttempts += repair.autofixAttemptsDelta;
    previewRecoveryAttempts += repair.previewRecoveryAttemptsDelta;
    if (repair.capabilityEvolutionResult) {
      capabilityEvolutionAttempts += repair.capabilityEvolutionResult.attempts.length;
      evolvedModules.push(...repair.evolvedModules);
      generatedModules = [...new Set([...generatedModules, ...repair.evolvedModules])];
      remainingGaps.push(...repair.capabilityEvolutionResult.remainingGaps);
    }
    npmBuildOk = repair.npmBuildOk && npmBuildOk;
    previewOk = repair.previewOk || previewOk;
    humanReviewRequired = humanReviewRequired || repair.humanReviewRequired;

    if (input.rerunNpmBuild && repair.action === 'RUN_CAPABILITY_EVOLUTION') {
      npmBuildOk = await input.rerunNpmBuild();
    }

    state = 'AEL_REVALIDATION';
  }

  if (!isAelTerminalState(state)) {
    if (npmBuildOk && productReality.productRealityScore >= 70 && !humanReviewRequired) {
      state = 'AEL_LAUNCH_READY';
      finalOutcome = previewOk ? 'LAUNCH_READY' : input.previewDegraded ? 'BUILD_READY_WITH_DEGRADED_PREVIEW' : 'BUILD_READY_WITH_FEATURE_GAPS';
    } else if (humanReviewRequired) {
      state = 'AEL_HUMAN_REVIEW_REQUIRED';
      finalOutcome = 'HUMAN_REVIEW_REQUIRED';
    } else {
      state = 'AEL_ENGINEERING_LIMIT_REACHED';
      finalOutcome = npmBuildOk ? 'BUILD_READY_WITH_FEATURE_GAPS' : 'ENGINEERING_LIMIT_REACHED';
    }
  } else {
    state = state as AelState;
  }

  const report = buildAelFinalReport({
    enabled: true,
    initialPrompt: input.rawPrompt,
    domain: productReality.productDomain,
    cyclesExecuted: cycle,
    aeeFurthestStage: input.aeeFurthestStage,
    productRealityScore: productReality.productRealityScore,
    founderLoopResult: cycleHistory[cycleHistory.length - 1]?.founderVerdict ?? 'not run',
    capabilitiesEvolved: evolvedModules,
    autofixAttempts,
    previewRecoveryAttempts,
    capabilityEvolutionAttempts,
    finalOutcome,
    remainingGaps: [...new Set([...remainingGaps, ...productReality.launchReadinessBlockers])],
    humanReviewRequired,
    cycleHistory,
  });

  const evidence = collectAelEvidence({
    rawPrompt: input.rawPrompt,
    workspaceDir: input.workspaceDir,
    generatedModules,
    approvedModuleIds: input.buildPlan.modulePlan.approvedModuleIds,
    npmInstallOk: input.npmInstallOk,
    npmBuildOk,
    previewOk,
    previewDegraded: input.previewDegraded,
    autofixAttempts,
    capabilityEvolutionAttempts,
    previewRecoveryAttempts,
    aeeFurthestStage: input.aeeFurthestStage,
    aeeFinalReport: input.aeeFinalReport,
    engineeringIntelligenceScore: input.engineeringIntelligenceScore,
    productRealityReport: productReality,
    safetyReviewRequired: humanReviewRequired,
    remainingGaps: report.remainingGaps,
  });

  const reportPaths = writeAelReportArtifacts({
    projectRootDir: input.projectRootDir,
    buildRunId: input.buildRunId,
    report,
  });

  return {
    readOnly: true,
    enabled: true,
    finalState: state,
    finalOutcome,
    cyclesExecuted: cycle,
    report,
    evidence,
    reportPaths,
  };
}
