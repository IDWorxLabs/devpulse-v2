/**
 * Execution Risk Detector — identifies execution readiness risks (V1).
 */

import type {
  ExecutionEvidenceSnapshot,
  ExecutionRiskAnalysis,
  ExecutionRiskItem,
  ExecutionRiskSeverity,
  ExecutionRiskType,
} from './execution-readiness-types.js';

let riskCounter = 0;

export function resetExecutionRiskCounterForTests(): void {
  riskCounter = 0;
}

function nextRiskId(): string {
  riskCounter += 1;
  return `exec-risk-${riskCounter}`;
}

function pushRisk(
  risks: ExecutionRiskItem[],
  riskType: ExecutionRiskType,
  severity: ExecutionRiskSeverity,
  description: string,
  sourceAuthority: string,
  evidence: string[],
): void {
  risks.push({
    readOnly: true,
    riskId: nextRiskId(),
    riskType,
    severity,
    description,
    sourceAuthority,
    evidence,
  });
}

function deriveOverallRiskLevel(risks: readonly ExecutionRiskItem[]): ExecutionRiskSeverity {
  if (risks.some((risk) => risk.severity === 'CRITICAL')) return 'CRITICAL';
  if (risks.some((risk) => risk.severity === 'HIGH')) return 'HIGH';
  if (risks.some((risk) => risk.severity === 'MEDIUM')) return 'MEDIUM';
  return 'LOW';
}

export function detectExecutionRisks(snapshot: ExecutionEvidenceSnapshot): ExecutionRiskAnalysis {
  const risks: ExecutionRiskItem[] = [];

  if (snapshot.planningGateDecision === 'REJECT_PLANNING') {
    pushRisk(
      risks,
      'PLANNING_GATE_REJECTION',
      'CRITICAL',
      'Planning Gate rejected planning — execution is not justified.',
      'PLANNING_GATE_AUTHORITY',
      [`GATE_${snapshot.planningGateDecision}`],
    );
  }

  if (!snapshot.planningGateAligned) {
    pushRisk(
      risks,
      'READINESS_ESCALATION',
      'CRITICAL',
      'Downstream readiness exceeds Planning Gate permission — alignment invalid.',
      'PLANNING_GATE_AUTHORITY',
      [`ESCALATION_COUNT_${snapshot.readinessEscalationCount}`],
    );
  }

  if (snapshot.readinessEscalationCount > 0) {
    pushRisk(
      risks,
      'READINESS_ESCALATION',
      'HIGH',
      `${snapshot.readinessEscalationCount} readiness escalation(s) detected across the chain.`,
      'CROSS_SYSTEM_ORCHESTRATION_PROOF',
      [`ESCALATIONS_${snapshot.readinessEscalationCount}`],
    );
  }

  if (
    snapshot.orchestrationProofScore != null &&
    snapshot.orchestrationProofScore < 40
  ) {
    pushRisk(
      risks,
      'ORCHESTRATION_FAILURE',
      'CRITICAL',
      `Orchestration proof score ${snapshot.orchestrationProofScore}/100 indicates a broken chain.`,
      'CROSS_SYSTEM_ORCHESTRATION_PROOF',
      [`PROOF_SCORE_${snapshot.orchestrationProofScore}`],
    );
  } else if (
    snapshot.orchestrationProofScore != null &&
    snapshot.orchestrationProofScore < 70
  ) {
    pushRisk(
      risks,
      'ORCHESTRATION_FAILURE',
      'HIGH',
      `Orchestration proof score ${snapshot.orchestrationProofScore}/100 is below consistency threshold.`,
      'CROSS_SYSTEM_ORCHESTRATION_PROOF',
      [`PROOF_SCORE_${snapshot.orchestrationProofScore}`],
    );
  }

  if (snapshot.orchestrationFailureCount >= 3) {
    pushRisk(
      risks,
      'ORCHESTRATION_FAILURE',
      'HIGH',
      `${snapshot.orchestrationFailureCount} orchestration failures detected.`,
      'CROSS_SYSTEM_ORCHESTRATION_PROOF',
      [`FAILURES_${snapshot.orchestrationFailureCount}`],
    );
  }

  if (snapshot.informationLossCount > 0) {
    pushRisk(
      risks,
      'PLANNING_INCONSISTENCY',
      snapshot.informationLossCount >= 3 ? 'HIGH' : 'MEDIUM',
      `${snapshot.informationLossCount} information loss(es) across the authority chain.`,
      'CROSS_SYSTEM_ORCHESTRATION_PROOF',
      [`LOSSES_${snapshot.informationLossCount}`],
    );
  }

  const planningSignal = snapshot.readinessSignals.find((s) => s.authorityId === 'PLANNING_BRIEF_GENERATOR');
  const architectureSignal = snapshot.readinessSignals.find((s) => s.authorityId === 'ARCHITECTURE_BRIEF_GENERATOR');
  const buildPlanSignal = snapshot.readinessSignals.find((s) => s.authorityId === 'BUILD_PLAN_GENERATOR');

  if (
    planningSignal?.reached &&
    architectureSignal?.reached &&
    planningSignal.readiness === 'NOT_READY' &&
    architectureSignal.readiness !== 'NOT_READY'
  ) {
    pushRisk(
      risks,
      'PLANNING_INCONSISTENCY',
      'HIGH',
      'Architecture brief readiness exceeds planning brief readiness without gate approval.',
      'ARCHITECTURE_BRIEF_GENERATOR',
      [`PLANNING_${planningSignal.readiness}`, `ARCH_${architectureSignal.readiness}`],
    );
  }

  if (
    architectureSignal?.reached &&
    buildPlanSignal?.reached &&
    architectureSignal.readiness === 'NOT_READY' &&
    buildPlanSignal.readiness === 'READY_FOR_EXECUTION_PLANNING'
  ) {
    pushRisk(
      risks,
      'BUILD_PLAN_INCONSISTENCY',
      'HIGH',
      'Build plan claims execution planning readiness while architecture is not ready.',
      'BUILD_PLAN_GENERATOR',
      [`ARCH_${architectureSignal.readiness}`, `BUILD_${buildPlanSignal.readiness}`],
    );
  }

  if (snapshot.clarificationRequestCount >= 3) {
    pushRisk(
      risks,
      'UNRESOLVED_CRITICAL_GAP',
      'HIGH',
      `${snapshot.clarificationRequestCount} unresolved clarification requests remain.`,
      'PLANNING_GATE_AUTHORITY',
      [`CLARIFICATIONS_${snapshot.clarificationRequestCount}`],
    );
  }

  if (snapshot.knownGapCount >= 5) {
    pushRisk(
      risks,
      'UNRESOLVED_CRITICAL_GAP',
      'MEDIUM',
      `${snapshot.knownGapCount} known requirement gaps remain unresolved.`,
      'PLANNING_BRIEF_GENERATOR',
      [`GAPS_${snapshot.knownGapCount}`],
    );
  }

  if (
    snapshot.founderSimulationVerdict === 'NOT_READY' ||
    snapshot.founderSimulationVerdict === 'NEEDS_CLARIFICATION'
  ) {
    pushRisk(
      risks,
      'SIMULATION_UNHEALTHY',
      snapshot.founderSimulationVerdict === 'NOT_READY' ? 'CRITICAL' : 'HIGH',
      `Founder simulation verdict ${snapshot.founderSimulationVerdict} — execution not justified.`,
      'FOUNDER_SIMULATION_ENGINE',
      [`VERDICT_${snapshot.founderSimulationVerdict}`],
    );
  }

  const confidences = snapshot.readinessSignals
    .map((signal) => signal.confidence)
    .filter((value): value is number => value != null);
  if (confidences.length >= 2) {
    const maxConf = Math.max(...confidences);
    const minConf = Math.min(...confidences);
    if (maxConf - minConf >= 35) {
      pushRisk(
        risks,
        'CONFIDENCE_INSTABILITY',
        'MEDIUM',
        `Confidence spread ${maxConf - minConf} points across authorities indicates instability.`,
        'CROSS_SYSTEM_ORCHESTRATION_PROOF',
        [`MAX_${maxConf}`, `MIN_${minConf}`],
      );
    }
  }

  const criticalRiskCount = risks.filter((risk) => risk.severity === 'CRITICAL').length;

  return {
    readOnly: true,
    risks,
    overallRiskLevel: deriveOverallRiskLevel(risks),
    riskCount: risks.length,
    criticalRiskCount,
  };
}
