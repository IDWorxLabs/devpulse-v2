/**
 * Autonomous Repair Loop — decision engine and assessment authority.
 */

import { createHash } from 'node:crypto';
import {
  AUTONOMOUS_REPAIR_LOOP_CACHE_KEY_PREFIX,
  AUTONOMOUS_REPAIR_LOOP_OWNER_MODULE,
  AUTONOMOUS_REPAIR_LOOP_PASS_TOKEN,
  AUTONOMOUS_REPAIR_LOOP_PHASE,
  MAX_ESCALATION_SUGGESTIONS,
  MAX_REPAIR_LOOP_ATTEMPTS,
  REPAIR_LOOP_CORE_QUESTION,
} from './autonomous-repair-loop-registry.js';
import { buildRepairLoopInputSnapshot } from './autonomous-repair-loop-orchestrator.js';
import {
  buildAutonomousRepairLoopRecursionFallback,
  runWithAuthorityGuard,
} from '../authority-recursion-guard/index.js';
import { recordAutonomousRepairLoopAssessment, resetAutonomousRepairLoopHistoryForTests } from './autonomous-repair-loop-history.js';
import { resetFounderAcceptanceGateModuleForTests } from '../founder-acceptance-gate/index.js';
import { buildAutonomousRepairLoopReportMarkdown } from './autonomous-repair-loop-report-builder.js';
import type {
  AssessAutonomousRepairLoopInput,
  AutonomousRepairLoopAssessment,
  AutonomousRepairLoopReport,
  RepairLoopAction,
  RepairLoopAttempt,
  RepairLoopDecision,
  RepairLoopEscalationGuidance,
  RepairLoopInputSnapshot,
  RepairLoopState,
} from './autonomous-repair-loop-types.js';

function stableCacheKey(findingId: string, action: RepairLoopAction, state: RepairLoopState): string {
  const digest = createHash('sha256')
    .update([AUTONOMOUS_REPAIR_LOOP_OWNER_MODULE, findingId, action, state].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${AUTONOMOUS_REPAIR_LOOP_CACHE_KEY_PREFIX}:${digest}`;
}

export interface RepairLoopDecisionContext {
  findingPresent: boolean;
  budgetExceeded: boolean;
  priorAttemptCount: number;
  attemptBudget: number;
  executionProofVerdict: RepairLoopInputSnapshot['executionProofVerdict'];
  founderAcceptanceState: RepairLoopInputSnapshot['founderAcceptanceState'];
  regressionPresent: boolean;
  loopRiskPresent: boolean;
}

export function deriveRepairLoopAction(context: RepairLoopDecisionContext): {
  action: RepairLoopAction;
  reason: string;
} {
  if (!context.findingPresent) {
    return { action: 'STOP', reason: 'No finding detected — repair loop remains idle.' };
  }

  if (context.budgetExceeded) {
    return {
      action: 'ESCALATE',
      reason: `Repair attempt budget exceeded (${context.priorAttemptCount}/${context.attemptBudget}).`,
    };
  }

  if (context.founderAcceptanceState === 'BLOCKED') {
    return {
      action: 'ESCALATE',
      reason: 'Founder acceptance gate is BLOCKED — human escalation required.',
    };
  }

  if (context.loopRiskPresent || context.executionProofVerdict === 'LOOP_RISK') {
    return {
      action: 'ESCALATE',
      reason: 'Execution proof reports LOOP_RISK — stop repeating the same fix path.',
    };
  }

  if (context.regressionPresent || context.executionProofVerdict === 'REGRESSION_DETECTED') {
    return {
      action: 'REVERT_FIX',
      reason: 'Execution proof detected regression — revert the claimed fix.',
    };
  }

  if (
    context.executionProofVerdict === 'PROVEN_FIXED' &&
    context.founderAcceptanceState === 'ACCEPTED'
  ) {
    return {
      action: 'ACCEPT_FIX',
      reason: 'Execution proof is PROVEN_FIXED and founder acceptance is ACCEPTED.',
    };
  }

  if (context.executionProofVerdict === 'PARTIALLY_PROVEN') {
    return {
      action: 'RETEST',
      reason: 'Execution proof is PARTIALLY_PROVEN — retest the original failure.',
    };
  }

  if (context.executionProofVerdict === 'NOT_PROVEN') {
    return {
      action: 'APPLY_DIFFERENT_FIX',
      reason: 'Execution proof is NOT_PROVEN — try a different fix path.',
    };
  }

  if (context.executionProofVerdict === 'INSUFFICIENT_EVIDENCE') {
    return {
      action: 'RETRY_FIX',
      reason: 'Execution proof has INSUFFICIENT_EVIDENCE — retry with stronger evidence.',
    };
  }

  return {
    action: 'RETRY_FIX',
    reason: 'Finding detected — retry fix with additional proof collection.',
  };
}

export function deriveRepairLoopState(
  snapshot: RepairLoopInputSnapshot,
  action: RepairLoopAction,
): RepairLoopState {
  if (!snapshot.finding) return 'IDLE';

  switch (action) {
    case 'ACCEPT_FIX':
      return 'ACCEPTED';
    case 'ESCALATE':
      return 'ESCALATED';
    case 'STOP':
      return 'STOPPED';
    case 'REVERT_FIX':
      return 'FAILED';
    case 'RETEST':
      return snapshot.executionProofAssessment ? 'PROOF_PENDING' : 'FINDING_DETECTED';
    case 'APPLY_DIFFERENT_FIX':
      return snapshot.adaptiveAutofixAssessment ? 'FIX_PROPOSED' : 'FINDING_DETECTED';
    case 'RETRY_FIX':
      if (snapshot.founderAcceptanceAssessment && !snapshot.executionProofAssessment) {
        return 'ACCEPTANCE_PENDING';
      }
      if (snapshot.executionProofAssessment) {
        return 'PROOF_COMPLETE';
      }
      if (snapshot.adaptiveAutofixAssessment) {
        return 'FIX_PROPOSED';
      }
      return 'FINDING_DETECTED';
    default:
      return 'FINDING_DETECTED';
  }
}

function buildEscalationGuidance(
  snapshot: RepairLoopInputSnapshot,
  action: RepairLoopAction,
  reason: string,
): RepairLoopEscalationGuidance | null {
  if (action !== 'ESCALATE' && action !== 'STOP' && action !== 'REVERT_FIX') {
    return null;
  }

  const missingCapabilitySuggestions: string[] = [];
  const missingEvidenceSuggestions: string[] = [];
  const diagnosticRecommendations: string[] = [];

  if (snapshot.adaptiveAutofixAssessment) {
    missingCapabilitySuggestions.push(
      ...snapshot.adaptiveAutofixAssessment.missingCapabilities.slice(0, 4),
    );
    for (const recommendation of snapshot.adaptiveAutofixAssessment.recommendations.slice(0, 3)) {
      diagnosticRecommendations.push(recommendation.missingCapability);
    }
  }

  if (snapshot.founderAcceptanceAssessment) {
    missingEvidenceSuggestions.push(
      ...snapshot.founderAcceptanceAssessment.reasons.requiredNextActions.slice(0, 4),
    );
  }

  if (snapshot.founderTestAssessment) {
    missingEvidenceSuggestions.push(
      ...snapshot.founderTestAssessment.missingCapabilities.slice(0, 3),
    );
  }

  if (snapshot.executionProofAssessment) {
    missingEvidenceSuggestions.push(
      ...snapshot.executionProofAssessment.recommendations.slice(0, 3),
    );
  }

  if (snapshot.regressionPresent) {
    diagnosticRecommendations.push('Retest original failure before attempting another fix.');
  }

  if (snapshot.loopRiskPresent) {
    diagnosticRecommendations.push('Require new diagnostic or capability before another AutoFix attempt.');
  }

  if (snapshot.budgetExceeded) {
    diagnosticRecommendations.push('Stop repeating the same repair path — attempt budget exhausted.');
  }

  return {
    whyLoopStopped:
      action === 'STOP'
        ? 'Repair loop stopped because no actionable finding remains.'
        : 'Repair loop stopped because bounded decision rules require escalation or revert.',
    whyEscalationHappened: reason,
    missingCapabilitySuggestions: dedupe(missingCapabilitySuggestions).slice(0, MAX_ESCALATION_SUGGESTIONS),
    missingEvidenceSuggestions: dedupe(missingEvidenceSuggestions).slice(0, MAX_ESCALATION_SUGGESTIONS),
    diagnosticRecommendations: dedupe(diagnosticRecommendations).slice(0, MAX_ESCALATION_SUGGESTIONS),
  };
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
  }
  return out;
}

function buildAttempts(
  input: AssessAutonomousRepairLoopInput,
  snapshot: RepairLoopInputSnapshot,
  action: RepairLoopAction,
): RepairLoopAttempt[] {
  const prior = (input.priorAttempts ?? []).slice(-MAX_REPAIR_LOOP_ATTEMPTS);
  const nextAttempt: RepairLoopAttempt = {
    attemptNumber: snapshot.priorAttemptCount + 1,
    action,
    executionProofVerdict: snapshot.executionProofVerdict,
    founderAcceptanceState: snapshot.founderAcceptanceState,
    recordedAt: new Date().toISOString(),
  };
  return [...prior, nextAttempt].slice(-MAX_REPAIR_LOOP_ATTEMPTS);
}

export function assessAutonomousRepairLoop(
  input: AssessAutonomousRepairLoopInput = {},
): AutonomousRepairLoopAssessment {
  return runWithAuthorityGuard({
    authorityName: 'AUTONOMOUS_REPAIR_LOOP',
    invoke: () => assessAutonomousRepairLoopCore(input),
    onRecursion: buildAutonomousRepairLoopRecursionFallback,
  });
}

function assessAutonomousRepairLoopCore(
  input: AssessAutonomousRepairLoopInput,
): AutonomousRepairLoopAssessment {
  const inputSnapshot = buildRepairLoopInputSnapshot(input);

  const { action, reason } = deriveRepairLoopAction({
    findingPresent: inputSnapshot.finding !== null,
    budgetExceeded: inputSnapshot.budgetExceeded,
    priorAttemptCount: inputSnapshot.priorAttemptCount,
    attemptBudget: inputSnapshot.attemptBudget,
    executionProofVerdict: inputSnapshot.executionProofVerdict,
    founderAcceptanceState: inputSnapshot.founderAcceptanceState,
    regressionPresent: inputSnapshot.regressionPresent,
    loopRiskPresent: inputSnapshot.loopRiskPresent,
  });

  const loopState = deriveRepairLoopState(inputSnapshot, action);
  const escalationGuidance = buildEscalationGuidance(inputSnapshot, action, reason);

  const decision: RepairLoopDecision = {
    recommendedAction: action,
    loopState,
    decisionReason: reason,
    escalationGuidance,
  };

  const assessment: AutonomousRepairLoopAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: REPAIR_LOOP_CORE_QUESTION,
    inputSnapshot,
    decision,
    attempts: buildAttempts(input, inputSnapshot, action),
    cacheKey: stableCacheKey(inputSnapshot.finding?.findingId ?? 'idle', action, loopState),
  };

  recordAutonomousRepairLoopAssessment(assessment);
  return assessment;
}

export function buildAutonomousRepairLoopReport(
  assessment: AutonomousRepairLoopAssessment,
  generatedAt = new Date().toISOString(),
): AutonomousRepairLoopReport {
  return {
    generatedAt,
    phaseName: AUTONOMOUS_REPAIR_LOOP_PHASE,
    purpose:
      'Bounded repair cycle orchestration — recommends actions only, never mutates projects or executes fixes.',
    assessment,
    passToken: AUTONOMOUS_REPAIR_LOOP_PASS_TOKEN,
  };
}

export function buildAutonomousRepairLoopArtifacts(
  input: AssessAutonomousRepairLoopInput = {},
): {
  autonomousRepairLoopAssessment: AutonomousRepairLoopAssessment;
  autonomousRepairLoopReportMarkdown: string;
} {
  const autonomousRepairLoopAssessment = assessAutonomousRepairLoop(input);
  const report = buildAutonomousRepairLoopReport(autonomousRepairLoopAssessment);
  return {
    autonomousRepairLoopAssessment,
    autonomousRepairLoopReportMarkdown: buildAutonomousRepairLoopReportMarkdown(report),
  };
}

export function resetAutonomousRepairLoopModuleForTests(): void {
  resetAutonomousRepairLoopHistoryForTests();
  resetFounderAcceptanceGateModuleForTests();
}
