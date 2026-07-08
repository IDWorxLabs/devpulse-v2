/**
 * Autonomous Engineering Orchestrator V1 — the orchestration loop.
 *
 * Build → observe failure → diagnose failure → classify failure → check existing repair
 * capability → apply safe repair if available → re-run only affected stage → if repair
 * capability is missing, identify the missing intelligence → route to missing-capability
 * planning → report the missing capability clearly → continue only when safe.
 *
 * AEO never mutates files, never runs shell commands, and never calls an LLM. It only ever calls
 * back into an optional, caller-provided execution host that the real build orchestrator wires to
 * an already-existing, already-audited repair capability. Without a host, AEO always stops
 * honestly (STOP_SAFE / ROUTE_MISSING_CAPABILITY) instead of pretending a repair ran.
 */

import { diagnoseBuildFailure, selectPrimaryFailureClassification } from './failure-diagnosis-adapter.js';
import type { AeoDiagnosisInput } from './failure-diagnosis-adapter.js';
import { planRepair } from './repair-execution-planner.js';
import { routeMissingCapability } from './missing-capability-router.js';
import { buildAeoPlainEnglishSummary } from './autonomous-engineering-orchestrator-report.js';
import { buildActivationEvidenceFromAeo } from '../engineering-intelligence-activation-authority-v1/activation-evidence.js';
import { runEngineeringIntelligenceActivationAuthority } from '../engineering-intelligence-activation-authority-v1/engineering-intelligence-activation-authority.js';
import type { EiaaActivationReport } from '../engineering-intelligence-activation-authority-v1/engineering-intelligence-activation-types.js';
import {
  AEO_DEFAULT_MAX_CYCLES,
  AUTONOMOUS_ENGINEERING_ORCHESTRATOR_V1_CONTRACT,
} from './autonomous-engineering-orchestrator-types.js';
import type {
  AeoExecutionHost,
  AeoOrchestratorCycleRecord,
  AeoOrchestratorReport,
  AeoOrchestratorState,
  AeoRepairAttemptRecord,
} from './autonomous-engineering-orchestrator-types.js';

export interface AeoOrchestratorInput {
  diagnosisInput: AeoDiagnosisInput;
  host?: AeoExecutionHost;
  maxCycles?: number;
  priorAttemptHistory?: readonly AeoRepairAttemptRecord[];
  productIdentityChangeConfirmed?: boolean;
}

export async function runAutonomousEngineeringOrchestrator(
  input: AeoOrchestratorInput,
): Promise<AeoOrchestratorReport> {
  const maxCycles = Math.max(1, Math.min(input.maxCycles ?? AEO_DEFAULT_MAX_CYCLES, AEO_DEFAULT_MAX_CYCLES));
  const attemptHistory: AeoRepairAttemptRecord[] = [...(input.priorAttemptHistory ?? [])];
  const cycles: AeoOrchestratorCycleRecord[] = [];

  let finalState: AeoOrchestratorState = 'STOP_SAFE';
  let humanReviewReason: string | null = null;
  let buildRecovered = false;
  let repairResult: 'REPAIRED' | 'NOT_APPLIED' | 'FAILED' | null = null;
  let lastCycle: AeoOrchestratorCycleRecord | null = null;

  for (let cycle = 1; cycle <= maxCycles; cycle += 1) {
    const statesVisited: AeoOrchestratorState[] = ['OBSERVE_BUILD_RESULT', 'DIAGNOSE_FAILURE'];

    const classifications = diagnoseBuildFailure(input.diagnosisInput);
    const classification = selectPrimaryFailureClassification(classifications);

    statesVisited.push('MATCH_REPAIR_CAPABILITY', 'PLAN_REPAIR');
    const repairPlan = planRepair({
      classification,
      attemptHistory,
      productIdentityChangeConfirmed: input.productIdentityChangeConfirmed,
    });

    let applied = false;
    let applyDetail: string | null = null;
    let revalidatePassed: boolean | null = null;

    if (repairPlan.decision === 'RUN_TARGETED_REPAIR') {
      statesVisited.push('APPLY_REPAIR');

      if (!input.host?.applyRepair) {
        applyDetail = `Production-wired repair capability ${repairPlan.matchedCapability?.displayName ?? 'unknown'} was identified, but no execution host was connected at this call site — AEO never applies a repair without a real host.`;
        attemptHistory.push({
          readOnly: true,
          cycle,
          failureClass: classification.failureClass,
          capabilityId: repairPlan.matchedCapability?.capabilityId ?? null,
          decision: repairPlan.decision,
          applied: false,
          succeeded: false,
          detail: applyDetail,
          atMs: Date.now(),
        });
        statesVisited.push('STOP_SAFE');
        finalState = 'STOP_SAFE';
        repairResult = 'NOT_APPLIED';
        lastCycle = { readOnly: true, cycle, statesVisited, classification, repairPlan, applied: false, applyDetail, revalidatePassed: null };
        cycles.push(lastCycle);
        break;
      }

      const applyResult = await input.host.applyRepair(repairPlan);
      applied = applyResult.applied;
      applyDetail = applyResult.detail;

      attemptHistory.push({
        readOnly: true,
        cycle,
        failureClass: classification.failureClass,
        capabilityId: repairPlan.matchedCapability?.capabilityId ?? null,
        decision: repairPlan.decision,
        applied,
        succeeded: false,
        detail: applyDetail,
        atMs: Date.now(),
      });

      if (!applied) {
        statesVisited.push('STOP_SAFE');
        finalState = 'STOP_SAFE';
        repairResult = 'FAILED';
        lastCycle = { readOnly: true, cycle, statesVisited, classification, repairPlan, applied, applyDetail, revalidatePassed: null };
        cycles.push(lastCycle);
        break;
      }

      statesVisited.push('REVALIDATE_REPAIR');
      if (!input.host.revalidate) {
        humanReviewReason = `${repairPlan.matchedCapability?.displayName ?? 'The repair'} was applied, but no revalidation host was provided to confirm the build actually recovered. AEO never marks success without evidence.`;
        statesVisited.push('HUMAN_REVIEW_REQUIRED');
        finalState = 'HUMAN_REVIEW_REQUIRED';
        repairResult = 'NOT_APPLIED';
        lastCycle = { readOnly: true, cycle, statesVisited, classification, repairPlan, applied, applyDetail, revalidatePassed: null };
        cycles.push(lastCycle);
        break;
      }

      const revalidateResult = await input.host.revalidate();
      revalidatePassed = revalidateResult.passed;
      attemptHistory[attemptHistory.length - 1] = {
        ...attemptHistory[attemptHistory.length - 1],
        succeeded: revalidatePassed,
        detail: `${applyDetail} Revalidation: ${revalidateResult.detail}`,
      };

      if (revalidatePassed) {
        statesVisited.push('BUILD_RECOVERED');
        finalState = 'BUILD_RECOVERED';
        buildRecovered = true;
        repairResult = 'REPAIRED';
        lastCycle = { readOnly: true, cycle, statesVisited, classification, repairPlan, applied, applyDetail, revalidatePassed };
        cycles.push(lastCycle);
        break;
      }

      statesVisited.push('RETRY_AFFECTED_STAGE');
      lastCycle = { readOnly: true, cycle, statesVisited, classification, repairPlan, applied, applyDetail, revalidatePassed };
      cycles.push(lastCycle);
      repairResult = 'FAILED';
      // Loop continues (bounded by maxCycles and by the planner's own maxAttempts-per-capability
      // check) — never re-runs the same exhausted repair forever.
      continue;
    }

    // Every REFUSE_* decision routes to missing-capability planning and stops safely (or requires
    // human review when the refusal was specifically about product-identity risk).
    statesVisited.push('ROUTE_MISSING_CAPABILITY');
    attemptHistory.push({
      readOnly: true,
      cycle,
      failureClass: classification.failureClass,
      capabilityId: repairPlan.matchedCapability?.capabilityId ?? null,
      decision: repairPlan.decision,
      applied: false,
      succeeded: false,
      detail: repairPlan.reason,
      atMs: Date.now(),
    });
    repairResult = 'NOT_APPLIED';

    if (repairPlan.decision === 'REFUSE_MAY_CHANGE_PRODUCT_IDENTITY') {
      humanReviewReason = repairPlan.reason;
      statesVisited.push('HUMAN_REVIEW_REQUIRED');
      finalState = 'HUMAN_REVIEW_REQUIRED';
    } else {
      statesVisited.push('STOP_SAFE');
      finalState = 'STOP_SAFE';
    }

    lastCycle = { readOnly: true, cycle, statesVisited, classification, repairPlan, applied: false, applyDetail: null, revalidatePassed: null };
    cycles.push(lastCycle);
    break;
  }

  // Ran out of cycles while still retrying (never broke out via BUILD_RECOVERED, STOP_SAFE, or
  // HUMAN_REVIEW_REQUIRED) — stop honestly instead of retrying indefinitely. This is the loop's
  // own bound on top of the planner's per-capability maxAttempts, so AEO can never spin forever
  // even if a capability's maxAttempts were misconfigured above AEO_DEFAULT_MAX_CYCLES.
  if (lastCycle && lastCycle.statesVisited[lastCycle.statesVisited.length - 1] === 'RETRY_AFFECTED_STAGE') {
    const cappedCycle: AeoOrchestratorCycleRecord = {
      ...lastCycle,
      statesVisited: [...lastCycle.statesVisited, 'STOP_SAFE'],
    };
    cycles[cycles.length - 1] = cappedCycle;
    lastCycle = cappedCycle;
    finalState = 'STOP_SAFE';
    humanReviewReason = `AEO reached its maximum repair cycles (${maxCycles}) without confirming the build recovered — stopping safely instead of retrying indefinitely.`;
  }

  if (!lastCycle) {
    // Defensive fallback — the loop always runs at least once, but keep this branch honest rather
    // than throwing, in case maxCycles is misconfigured to 0 by a caller.
    const classifications = diagnoseBuildFailure(input.diagnosisInput);
    const classification = selectPrimaryFailureClassification(classifications);
    const repairPlan = planRepair({ classification, attemptHistory, productIdentityChangeConfirmed: input.productIdentityChangeConfirmed });
    lastCycle = {
      readOnly: true,
      cycle: 0,
      statesVisited: ['OBSERVE_BUILD_RESULT', 'STOP_SAFE'],
      classification,
      repairPlan,
      applied: false,
      applyDetail: null,
      revalidatePassed: null,
    };
    cycles.push(lastCycle);
  }

  // Missing-capability routing only applies when no safe repair capability could be matched at
  // all (a REFUSE_* decision). When the planner found a safe, production-wired capability
  // (RUN_TARGETED_REPAIR) but this call site simply has no execution channel wired to it yet,
  // that is an integration gap, not a missing capability — the two must never be conflated.
  const missingCapability =
    lastCycle.repairPlan.decision === 'RUN_TARGETED_REPAIR'
      ? null
      : routeMissingCapability(lastCycle.classification.failureClass, lastCycle.repairPlan);

  // New flow when a missing capability was routed:
  //   Missing capability -> Engineering Intelligence Activation Authority ->
  //     ALLOW -> invoke Engineering Intelligence Runtime (if a host is connected)
  //     DENY -> STOP_SAFE (unchanged)
  //     REQUIRE_HUMAN_REVIEW -> STOP (HUMAN_REVIEW_REQUIRED)
  // EIAA never generates a capability itself — it only authorizes the runtime invocation, and even
  // when it allows activation AEO never installs anything automatically.
  let engineeringIntelligenceActivation: EiaaActivationReport | null = null;
  let engineeringIntelligenceInvoked = false;
  let engineeringIntelligenceInvocationDetail: string | null = null;

  if (missingCapability) {
    const priorFinalState = finalState;
    const evidence = buildActivationEvidenceFromAeo({
      classification: lastCycle.classification,
      repairPlan: lastCycle.repairPlan,
      missingCapability,
      repairAttemptHistory: attemptHistory,
    });
    engineeringIntelligenceActivation = runEngineeringIntelligenceActivationAuthority({ evidence });

    const updatedStatesVisited: AeoOrchestratorState[] = [...lastCycle.statesVisited, 'ACTIVATE_ENGINEERING_INTELLIGENCE'];

    if (engineeringIntelligenceActivation.decision === 'ALLOW_ENGINEERING_INTELLIGENCE') {
      if (priorFinalState === 'HUMAN_REVIEW_REQUIRED') {
        engineeringIntelligenceInvocationDetail =
          'Engineering Intelligence Runtime activation was allowed by EIAA, but AEO already requires human review for this cycle (e.g. a product-identity-risk refusal) — the runtime was not invoked.';
      } else if (input.host?.invokeEngineeringIntelligenceRuntime && engineeringIntelligenceActivation.runtimeRequest) {
        const invocationResult = await input.host.invokeEngineeringIntelligenceRuntime(
          engineeringIntelligenceActivation.runtimeRequest,
        );
        engineeringIntelligenceInvoked = invocationResult.invoked;
        engineeringIntelligenceInvocationDetail = invocationResult.detail;
        updatedStatesVisited.push('ENGINEERING_INTELLIGENCE_RUNTIME_INVOKED');
      } else {
        engineeringIntelligenceInvocationDetail =
          'Engineering Intelligence Runtime activation was allowed by EIAA, but no execution host was connected at this call site — the runtime was not invoked. Generation remains gated until a host is wired, and any generated output must still be separately validated before installation.';
      }
    } else if (engineeringIntelligenceActivation.decision === 'REQUIRE_HUMAN_REVIEW') {
      engineeringIntelligenceInvocationDetail = engineeringIntelligenceActivation.reason;
      if (priorFinalState !== 'HUMAN_REVIEW_REQUIRED') {
        updatedStatesVisited.push('HUMAN_REVIEW_REQUIRED');
        finalState = 'HUMAN_REVIEW_REQUIRED';
        humanReviewReason = engineeringIntelligenceActivation.reason;
      }
    } else {
      engineeringIntelligenceInvocationDetail = engineeringIntelligenceActivation.reason;
    }

    lastCycle = { ...lastCycle, statesVisited: updatedStatesVisited };
    cycles[cycles.length - 1] = lastCycle;
  }

  const plainEnglishSummary = buildAeoPlainEnglishSummary({
    classification: lastCycle.classification,
    repairPlan: lastCycle.repairPlan,
    missingCapability,
    repairResult,
    applied: lastCycle.applied,
    engineeringIntelligenceActivationDecision: engineeringIntelligenceActivation?.decision ?? null,
    engineeringIntelligenceInvoked,
  });

  const report: AeoOrchestratorReport = {
    readOnly: true,
    contractVersion: AUTONOMOUS_ENGINEERING_ORCHESTRATOR_V1_CONTRACT,
    finalState,
    cycles,
    classification: lastCycle.classification,
    matchedCapabilityId: lastCycle.repairPlan.matchedCapability?.capabilityId ?? null,
    repairWasProductionWired: lastCycle.repairPlan.matchedCapability?.wiringStatus === 'PRODUCTION_WIRED',
    repairWasSafeToAutoRun: lastCycle.repairPlan.matchedCapability?.safeToRunAutomatically ?? false,
    repairPlan: lastCycle.repairPlan,
    repairAttemptHistory: attemptHistory,
    retryStage: lastCycle.repairPlan.targetStage,
    repairResult,
    missingCapability,
    recommendedNextMilestone: missingCapability?.recommendedNextMilestonePromptSummary ?? null,
    engineeringIntelligenceActivation,
    engineeringIntelligenceInvoked,
    engineeringIntelligenceInvocationDetail,
    humanReviewReason,
    buildRecovered,
    plainEnglishSummary,
    generatedAt: new Date().toISOString(),
  };

  return report;
}
