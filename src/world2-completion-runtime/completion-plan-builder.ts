/**
 * Completion plan builder — assembles completion plan without side effects.
 */

import { evaluateCompletionCriteria } from './completion-criteria-engine.js';
import { buildCompletionEvidence } from './completion-evidence-engine.js';
import { classifyCompletionRisk } from './completion-risk-engine.js';
import {
  buildVerificationRequirements,
  evaluateVerificationSatisfaction,
} from './completion-verification-engine.js';
import { evaluateCompletionGates, validateCompletion } from './completion-validator.js';
import type {
  CompletionPlan,
  CompletionReport,
  CompletionState,
  PrepareCompletionPlanInput,
} from './types.js';

let planCounter = 0;
let reportCounter = 0;

function nextPlanId(): string {
  planCounter += 1;
  return `cmplan-${planCounter.toString().padStart(4, '0')}`;
}

function nextReportId(): string {
  reportCounter += 1;
  return `cmrep-${reportCounter.toString().padStart(4, '0')}`;
}

export function resetCompletionPlanCounterForTests(): void {
  planCounter = 0;
  reportCounter = 0;
}

function resolveState(
  valid: boolean,
  needsApproval: boolean,
  verificationRequired: boolean,
): CompletionState {
  if (!valid) return 'BLOCKED';
  if (verificationRequired) return 'VERIFICATION_REQUIRED';
  if (needsApproval) return 'WAITING_APPROVAL';
  return 'READY_FOR_FUTURE_COMPLETION';
}

export function buildCompletionPlanAndReport(input: PrepareCompletionPlanInput): {
  plan: CompletionPlan | null;
  report: CompletionReport;
} {
  const criteria = evaluateCompletionCriteria(input);
  const evidence = buildCompletionEvidence(input);
  const verificationRequirements = buildVerificationRequirements(input);
  const { unsatisfied: unsatisfiedVerification } = evaluateVerificationSatisfaction(
    verificationRequirements,
    input,
  );
  const riskLevel = classifyCompletionRisk(input, evidence);

  const gateReport = evaluateCompletionGates(input);
  const validation = validateCompletion({
    gateReport,
    evidence,
    unsatisfiedVerification,
    input,
    riskLevel,
  });

  const verificationRequired =
    unsatisfiedVerification.length > 0 ||
    !input.verificationRequirementsMet ||
    !input.runtimeVerificationPassed;

  const needsApproval = !input.founderApprovalRecorded || riskLevel === 'HIGH';

  const state = resolveState(validation.valid, needsApproval, verificationRequired);

  const canBuildPlan =
    input.recoveryPlan !== null &&
    input.rollbackPlan !== null &&
    input.applyPlan !== null &&
    input.executionPacket !== null &&
    input.projectContext !== null;

  const plan: CompletionPlan | null = canBuildPlan
    ? {
        completionPlanId: nextPlanId(),
        projectId: input.applyPlan!.projectId,
        executionPacketId: input.applyPlan!.executionPacketId,
        applyPlanId: input.applyPlan!.applyPlanId,
        rollbackPlanId: input.rollbackPlan!.rollbackPlanId,
        recoveryPlanId: input.recoveryPlan!.recoveryPlanId,
        completionCriteria: criteria,
        completionEvidence: evidence,
        verificationRequirements,
        riskLevel,
        approvalRequirements: validation.approvalRequirements,
        blockedReasons: validation.blockers,
        warnings: validation.warnings,
        completionAllowed: false,
        simulationOnly: true,
        createdAt: Date.now(),
      }
    : null;

  const report: CompletionReport = {
    reportId: nextReportId(),
    state,
    valid: validation.valid && state !== 'BLOCKED',
    summary: validation.valid
      ? `Completion plan prepared — ${criteria.length} criteria, ${evidence.length} evidence records, state ${state}`
      : `Completion blocked — ${validation.blockers.length} blockers`,
    plan,
    gatesEvaluated: gateReport.gates.length,
    gatesPassed: gateReport.gates.filter((g) => g.satisfied).length,
    preparationOnly: true,
  };

  return { plan, report };
}
