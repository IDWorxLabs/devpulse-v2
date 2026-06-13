/**
 * Execution Decision Engine — gate decisions and permission matrix (V1).
 */

import { EXECUTION_PERMISSION_THRESHOLDS } from './execution-readiness-registry.js';
import type {
  AssessExecutionReadinessInput,
  ExecutionBlockerSummary,
  ExecutionEvidenceSnapshot,
  ExecutionGateDecision,
  ExecutionGateExplanation,
  ExecutionPermissionResult,
  ExecutionReadinessScoreResult,
  ExecutionRecommendation,
  ExecutionRiskAnalysis,
  ExecutionRiskType,
} from './execution-readiness-types.js';

let recommendationCounter = 0;

export function resetExecutionDecisionCounterForTests(): void {
  recommendationCounter = 0;
}

function nextRecommendationId(): string {
  recommendationCounter += 1;
  return `exec-rec-${recommendationCounter}`;
}

function isFounderSimulationHealthy(verdict: string | null): boolean {
  if (!verdict) return true;
  return (
    verdict === 'READY_FOR_PLANNING' ||
    verdict === 'READY_FOR_ARCHITECTURE' ||
    verdict === 'READY_FOR_BUILD_PLAN' ||
    verdict === 'READY_FOR_EXECUTION_GATE'
  );
}

export function evaluateExecutionPermission(input: {
  snapshot: ExecutionEvidenceSnapshot;
  blockerSummary: ExecutionBlockerSummary;
  proposedDecision: ExecutionGateDecision;
}): ExecutionPermissionResult {
  const planningGateAligned = input.snapshot.planningGateAligned;
  const orchestrationProofSufficient =
    input.snapshot.orchestrationProofScore == null ||
    input.snapshot.orchestrationProofScore >= EXECUTION_PERMISSION_THRESHOLDS.MIN_ORCHESTRATION_PROOF_FOR_EXECUTION;
  const noCriticalBlockers = input.blockerSummary.unresolvedCriticalCount === 0;
  const noReadinessEscalation = input.snapshot.readinessEscalationCount === 0;
  const founderSimulationHealthy = isFounderSimulationHealthy(input.snapshot.founderSimulationVerdict);

  const allowExecutionPermitted =
    planningGateAligned &&
    orchestrationProofSufficient &&
    noCriticalBlockers &&
    noReadinessEscalation &&
    founderSimulationHealthy;

  if (input.proposedDecision !== 'ALLOW_EXECUTION') {
    return {
      readOnly: true,
      permitted: true,
      cappedDecision: input.proposedDecision,
      permissionReason: 'Proposed decision does not require full execution permission.',
      planningGateAligned,
      orchestrationProofSufficient,
      noCriticalBlockers,
      noReadinessEscalation,
      founderSimulationHealthy,
    };
  }

  if (allowExecutionPermitted) {
    return {
      readOnly: true,
      permitted: true,
      cappedDecision: 'ALLOW_EXECUTION',
      permissionReason: 'All execution permission matrix requirements satisfied.',
      planningGateAligned,
      orchestrationProofSufficient,
      noCriticalBlockers,
      noReadinessEscalation,
      founderSimulationHealthy,
    };
  }

  let cappedDecision: ExecutionGateDecision = 'REQUEST_REMEDIATION';
  const reasons: string[] = [];

  if (!planningGateAligned || !noReadinessEscalation) reasons.push('planning gate alignment invalid');
  if (!orchestrationProofSufficient) reasons.push('orchestration proof below threshold');
  if (!noCriticalBlockers) reasons.push('critical blockers unresolved');
  if (!founderSimulationHealthy) reasons.push('founder simulation unhealthy');

  if (
    input.snapshot.orchestrationProofScore != null &&
    input.snapshot.orchestrationProofScore >= 70 &&
    noCriticalBlockers &&
    founderSimulationHealthy
  ) {
    cappedDecision = 'ALLOW_EXECUTION_PREPARATION';
  }

  return {
    readOnly: true,
    permitted: false,
    cappedDecision,
    permissionReason: `ALLOW_EXECUTION blocked: ${reasons.join('; ')}.`,
    planningGateAligned,
    orchestrationProofSufficient,
    noCriticalBlockers,
    noReadinessEscalation,
    founderSimulationHealthy,
  };
}

export function deriveExecutionGateDecision(input: {
  snapshot: ExecutionEvidenceSnapshot;
  riskAnalysis: ExecutionRiskAnalysis;
  blockerSummary: ExecutionBlockerSummary;
  readinessScore: ExecutionReadinessScoreResult;
}): ExecutionGateDecision {
  if (
    input.snapshot.planningGateDecision === 'REJECT_PLANNING' ||
    input.riskAnalysis.criticalRiskCount >= 2 ||
    input.blockerSummary.unresolvedCriticalCount >= 2 ||
    (input.snapshot.orchestrationProofScore != null && input.snapshot.orchestrationProofScore < 40) ||
    input.snapshot.founderSimulationVerdict === 'NOT_READY'
  ) {
    return 'REJECT_EXECUTION';
  }

  if (
    input.blockerSummary.unresolvedCriticalCount >= 1 ||
    input.riskAnalysis.criticalRiskCount >= 1 ||
    !input.snapshot.planningGateAligned ||
    input.readinessScore.executionReadinessCategory === 'NOT_READY'
  ) {
    return 'REQUEST_REMEDIATION';
  }

  if (
    input.readinessScore.executionReadinessCategory === 'EXECUTION_READY' &&
    input.blockerSummary.unresolvedCount === 0 &&
    input.riskAnalysis.riskCount === 0
  ) {
    return 'ALLOW_EXECUTION';
  }

  if (
    input.readinessScore.executionReadinessCategory === 'EXECUTION_READY' ||
    input.readinessScore.executionReadinessCategory === 'EXECUTION_CANDIDATE'
  ) {
    return input.blockerSummary.unresolvedCount <= 2 && input.riskAnalysis.overallRiskLevel !== 'HIGH'
      ? 'ALLOW_EXECUTION_PREPARATION'
      : 'REQUEST_REMEDIATION';
  }

  if (
    input.readinessScore.executionReadinessCategory === 'NEEDS_WORK' &&
    input.snapshot.orchestrationProofScore != null &&
    input.snapshot.orchestrationProofScore >= 60
  ) {
    return 'REQUEST_REMEDIATION';
  }

  return 'REJECT_EXECUTION';
}

export function buildExecutionGateExplanation(input: {
  snapshot: ExecutionEvidenceSnapshot;
  riskAnalysis: ExecutionRiskAnalysis;
  blockerSummary: ExecutionBlockerSummary;
  readinessScore: ExecutionReadinessScoreResult;
  decision: ExecutionGateDecision;
  gateInput: AssessExecutionReadinessInput;
}): ExecutionGateExplanation {
  const evidenceUsed = [...input.snapshot.sources];
  const blockersSummary = input.blockerSummary.blockers
    .filter((blocker) => !blocker.resolved)
    .slice(0, 6)
    .map((blocker) => `[${blocker.priority}] ${blocker.title}`);
  const risksFound = input.riskAnalysis.risks.slice(0, 6).map((risk) => risk.description);
  const proofFindings: string[] = [];

  if (input.snapshot.orchestrationProofScore != null) {
    proofFindings.push(`Orchestration proof score: ${input.snapshot.orchestrationProofScore}/100`);
  }
  if (input.snapshot.orchestrationProofCategory) {
    proofFindings.push(`Proof category: ${input.snapshot.orchestrationProofCategory}`);
  }
  if (input.snapshot.informationLossCount > 0) {
    proofFindings.push(`Information losses: ${input.snapshot.informationLossCount}`);
  }
  if (input.snapshot.readinessEscalationCount > 0) {
    proofFindings.push(`Readiness escalations: ${input.snapshot.readinessEscalationCount}`);
  }

  const readinessReasoning =
    input.readinessScore.executionReadinessCategory === 'EXECUTION_READY'
      ? 'Chain evidence supports proceeding toward execution planning.'
      : input.readinessScore.executionReadinessCategory === 'EXECUTION_CANDIDATE'
        ? 'Project is an execution candidate but requires minor remediation before full execution approval.'
        : input.readinessScore.executionReadinessCategory === 'NEEDS_WORK'
          ? 'Material gaps remain — remediation recommended before execution preparation.'
          : 'Project is not ready for execution — resolve critical blockers first.';

  const summary =
    input.decision === 'ALLOW_EXECUTION'
      ? 'Execution planning is justified based on consolidated chain evidence.'
      : input.decision === 'ALLOW_EXECUTION_PREPARATION'
        ? 'Execution preparation may proceed with documented minor blockers.'
        : input.decision === 'REQUEST_REMEDIATION'
          ? 'Remediation required before execution can be safely considered.'
          : 'Execution rejected — critical planning or orchestration failures block progress.';

  return {
    readOnly: true,
    evidenceUsed,
    blockersSummary,
    risksFound,
    proofFindings,
    readinessReasoning,
    confidence: input.snapshot.averageConfidence,
    summary,
  };
}

export function generateExecutionRecommendations(input: {
  snapshot: ExecutionEvidenceSnapshot;
  riskAnalysis: ExecutionRiskAnalysis;
  blockerSummary: ExecutionBlockerSummary;
  decision: ExecutionGateDecision;
}): ExecutionRecommendation[] {
  const recommendations: ExecutionRecommendation[] = [];

  const push = (
    title: string,
    rationale: string,
    priority: ExecutionRecommendation['priority'],
    relatedRiskType: ExecutionRiskType | null,
    evidence: string[],
  ) => {
    recommendations.push({
      readOnly: true,
      recommendationId: nextRecommendationId(),
      title,
      rationale,
      priority,
      relatedRiskType,
      evidence,
    });
  };

  if (!input.snapshot.planningGateAligned) {
    push(
      'Align downstream readiness with Planning Gate permissions',
      'Readiness escalation detected — cap downstream authorities to gate permission matrix.',
      'CRITICAL',
      'READINESS_ESCALATION',
      [`ESCALATIONS_${input.snapshot.readinessEscalationCount}`],
    );
  }

  if (
    input.snapshot.orchestrationProofScore != null &&
    input.snapshot.orchestrationProofScore < EXECUTION_PERMISSION_THRESHOLDS.MIN_ORCHESTRATION_PROOF_FOR_EXECUTION
  ) {
    push(
      'Improve orchestration consistency',
      `Proof score ${input.snapshot.orchestrationProofScore}/100 is below execution threshold (${EXECUTION_PERMISSION_THRESHOLDS.MIN_ORCHESTRATION_PROOF_FOR_EXECUTION}).`,
      'HIGH',
      'ORCHESTRATION_FAILURE',
      [`PROOF_${input.snapshot.orchestrationProofScore}`],
    );
  }

  if (input.snapshot.clarificationRequestCount > 0) {
    push(
      'Resolve clarification requests',
      `${input.snapshot.clarificationRequestCount} clarification request(s) remain unresolved.`,
      'HIGH',
      'UNRESOLVED_CRITICAL_GAP',
      [`CLARIFICATIONS_${input.snapshot.clarificationRequestCount}`],
    );
  }

  for (const risk of input.riskAnalysis.risks.filter((r) => r.riskType === 'CONFIDENCE_INSTABILITY')) {
    push(
      'Repair confidence instability',
      risk.description,
      'MEDIUM',
      'CONFIDENCE_INSTABILITY',
      [...risk.evidence],
    );
  }

  if (input.snapshot.informationLossCount > 0) {
    push(
      'Complete missing workflows and evidence propagation',
      `${input.snapshot.informationLossCount} information loss(es) detected across the chain.`,
      'MEDIUM',
      'PLANNING_INCONSISTENCY',
      [`LOSSES_${input.snapshot.informationLossCount}`],
    );
  }

  if (input.blockerSummary.unresolvedCriticalCount > 0) {
    push(
      'Resolve critical execution blockers',
      `${input.blockerSummary.unresolvedCriticalCount} critical blocker(s) must be resolved before execution.`,
      'CRITICAL',
      'UNRESOLVED_HIGH_BLOCKER',
      [`CRITICAL_${input.blockerSummary.unresolvedCriticalCount}`],
    );
  }

  if (input.decision === 'ALLOW_EXECUTION_PREPARATION' && recommendations.length === 0) {
    push(
      'Complete minor remediation before full execution approval',
      'Execution preparation permitted — address remaining low-priority items before ALLOW_EXECUTION.',
      'LOW',
      null,
      ['PREPARATION_PATH'],
    );
  }

  return recommendations.slice(0, 8);
}

export function deriveNextActions(input: {
  decision: ExecutionGateDecision;
  recommendations: readonly ExecutionRecommendation[];
  blockerSummary: ExecutionBlockerSummary;
}): string[] {
  const actions: string[] = [];

  if (input.decision === 'REJECT_EXECUTION') {
    actions.push('Do not proceed toward execution planning.');
    actions.push('Return to planning gate and resolve critical failures.');
  } else if (input.decision === 'REQUEST_REMEDIATION') {
    actions.push('Execute remediation recommendations before re-assessing execution readiness.');
  } else if (input.decision === 'ALLOW_EXECUTION_PREPARATION') {
    actions.push('Proceed with execution preparation activities only.');
    actions.push('Re-run execution readiness gate after minor blockers are resolved.');
  } else {
    actions.push('Execution planning is authorized — future execution systems may proceed when activated.');
  }

  for (const rec of input.recommendations.slice(0, 3)) {
    actions.push(rec.title);
  }

  if (input.blockerSummary.unresolvedCriticalCount > 0) {
    actions.push(`Resolve ${input.blockerSummary.unresolvedCriticalCount} critical blocker(s) first.`);
  }

  return actions.slice(0, 6);
}

export function composeExecutionReadinessAnalysis(input: {
  analysisId: string;
  analyzedAt: string;
  gateInput: AssessExecutionReadinessInput;
  snapshot: ExecutionEvidenceSnapshot;
  riskAnalysis: ExecutionRiskAnalysis;
  blockerSummary: ExecutionBlockerSummary;
  readinessScore: ExecutionReadinessScoreResult;
}): import('./execution-readiness-types.js').ExecutionReadinessAnalysis {
  const proposedDecision = deriveExecutionGateDecision({
    snapshot: input.snapshot,
    riskAnalysis: input.riskAnalysis,
    blockerSummary: input.blockerSummary,
    readinessScore: input.readinessScore,
  });

  const executionPermission = evaluateExecutionPermission({
    snapshot: input.snapshot,
    blockerSummary: input.blockerSummary,
    proposedDecision,
  });

  const executionGateDecision = executionPermission.cappedDecision;
  const executionGateExplanation = buildExecutionGateExplanation({
    snapshot: input.snapshot,
    riskAnalysis: input.riskAnalysis,
    blockerSummary: input.blockerSummary,
    readinessScore: input.readinessScore,
    decision: executionGateDecision,
    gateInput: input.gateInput,
  });

  const executionRecommendations = generateExecutionRecommendations({
    snapshot: input.snapshot,
    riskAnalysis: input.riskAnalysis,
    blockerSummary: input.blockerSummary,
    decision: executionGateDecision,
  });

  const safeToProceed =
    executionGateDecision === 'ALLOW_EXECUTION' || executionGateDecision === 'ALLOW_EXECUTION_PREPARATION';

  const nextActions = deriveNextActions({
    decision: executionGateDecision,
    recommendations: executionRecommendations,
    blockerSummary: input.blockerSummary,
  });

  return {
    readOnly: true,
    analysisId: input.analysisId,
    analyzedAt: input.analyzedAt,
    evidenceSnapshot: input.snapshot,
    riskAnalysis: input.riskAnalysis,
    blockerSummary: input.blockerSummary,
    readinessScore: input.readinessScore,
    executionGateDecision,
    executionGateExplanation,
    executionPermission,
    executionRecommendations,
    safeToProceed,
    nextActions,
  };
}
