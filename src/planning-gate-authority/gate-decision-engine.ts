/**
 * Gate Decision Engine — planning gate decision and clarification questions (V1).
 */

import type { AssessPlanningGateInput } from './planning-gate-types.js';
import type {
  EvidenceSufficiencyResult,
  PlanningGateAnalysis,
  PlanningGateDecision,
  PlanningGateExplanation,
  PlanningGateQuestion,
  PlanningReadinessResult,
  PlanningRiskAnalysis,
  PlanningGateEvidenceSnapshot,
} from './planning-gate-types.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function derivePlanningGateDecision(input: {
  planningReadiness: PlanningReadinessResult;
  planningRiskAnalysis: PlanningRiskAnalysis;
  evidenceSufficiency: EvidenceSufficiencyResult;
  snapshot: PlanningGateEvidenceSnapshot;
}): PlanningGateDecision {
  const { planningReadiness, planningRiskAnalysis, evidenceSufficiency, snapshot } = input;
  const criticalRisks = planningRiskAnalysis.risks.filter((r) => r.severity === 'CRITICAL').length;
  const highRisks = planningRiskAnalysis.risks.filter((r) => r.severity === 'HIGH').length;

  if (
    planningReadiness.planningReadinessScore < 40 ||
    evidenceSufficiency.evidenceSufficiencyScore < 35 ||
    snapshot.intakeReadinessScore < 30
  ) {
    return 'REJECT_PLANNING';
  }

  if (
    criticalRisks > 0 ||
    planningReadiness.planningReadinessCategory === 'NEEDS_CLARIFICATION' ||
    snapshot.conflictCount > 0
  ) {
    return 'REQUEST_CLARIFICATION';
  }

  if (
    planningReadiness.planningReadinessScore >= 90 &&
    highRisks === 0 &&
    planningReadiness.planningReadinessCategory === 'READY_FOR_PLANNING' &&
    snapshot.conflictCount === 0
  ) {
    return 'ALLOW_FULL_PLANNING';
  }

  if (planningReadiness.planningReadinessScore >= 70) {
    return 'ALLOW_LIMITED_PLANNING';
  }

  return 'REQUEST_CLARIFICATION';
}

export function buildPlanningGateExplanation(input: {
  snapshot: PlanningGateEvidenceSnapshot;
  planningRiskAnalysis: PlanningRiskAnalysis;
  planningReadiness: PlanningReadinessResult;
  decision: PlanningGateDecision;
  gateInput: AssessPlanningGateInput;
}): PlanningGateExplanation {
  const missingInformation: string[] = [];
  for (const risk of input.planningRiskAnalysis.risks.filter((r) => r.severity === 'CRITICAL' || r.severity === 'HIGH')) {
    missingInformation.push(risk.description);
  }
  for (const q of input.gateInput.unifiedIntakeAnalysis?.intakeRecommendations.filter((r) => r.priority === 'CRITICAL') ?? []) {
    missingInformation.push(q.title);
  }

  let confidence = clamp(
    input.snapshot.intakeConfidence * 0.4 +
      input.planningReadiness.planningReadinessScore * 0.35 +
      (input.snapshot.completenessScore ?? 50) * 0.25,
  );
  confidence -= input.planningRiskAnalysis.risks.filter((r) => r.severity === 'CRITICAL').length * 10;

  const summaryByDecision: Record<PlanningGateDecision, string> = {
    REJECT_PLANNING: 'Insufficient evidence exists to begin planning safely.',
    REQUEST_CLARIFICATION: 'Planning is blocked until critical intake ambiguities are resolved.',
    ALLOW_LIMITED_PLANNING: 'Limited planning may proceed with explicit gap tracking and founder review.',
    ALLOW_FULL_PLANNING: 'Evidence supports full planning with acceptable risk and coverage.',
  };

  return {
    readOnly: true,
    evidenceUsed: input.snapshot.sources,
    risksFound: input.planningRiskAnalysis.risks.map((r) => `${r.riskType}: ${r.description}`),
    missingInformation,
    confidence: clamp(confidence),
    summary: summaryByDecision[input.decision],
  };
}

const RISK_QUESTIONS: Record<string, { question: string; category: string; priority: PlanningGateQuestion['priority'] }> = {
  PLATFORM_AMBIGUITY: {
    question: 'Which platform should be treated as the primary launch target for initial planning?',
    category: 'PLATFORM',
    priority: 'CRITICAL',
  },
  WORKFLOW_AMBIGUITY: {
    question: 'Can you define the step-by-step workflows connecting the referenced screens?',
    category: 'WORKFLOW',
    priority: 'HIGH',
  },
  ROLE_AMBIGUITY: {
    question: 'Which user roles exist and what permissions should each role have?',
    category: 'ROLES',
    priority: 'CRITICAL',
  },
  INTEGRATION_AMBIGUITY: {
    question: 'What checkout or billing workflow should occur when payment integrations are used?',
    category: 'INTEGRATIONS',
    priority: 'HIGH',
  },
  CONFLICTING_EVIDENCE: {
    question: 'Can you reconcile conflicting intake evidence from typed prompt, voice, and visual sources?',
    category: 'EVIDENCE',
    priority: 'CRITICAL',
  },
  MISSING_REQUIREMENTS: {
    question: 'What additional requirements must be captured before planning can proceed?',
    category: 'REQUIREMENTS',
    priority: 'HIGH',
  },
};

export function generatePlanningGateQuestions(input: {
  planningRiskAnalysis: PlanningRiskAnalysis;
  gateInput: AssessPlanningGateInput;
  decision: PlanningGateDecision;
}): PlanningGateQuestion[] {
  const questions: PlanningGateQuestion[] = [];
  let counter = 0;
  const seen = new Set<string>();

  const push = (question: string, category: string, priority: PlanningGateQuestion['priority'], evidence: string[]) => {
    const key = question.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    counter += 1;
    questions.push({ readOnly: true, questionId: `gate-q-${counter}`, question, category, priority, evidence });
  };

  for (const risk of input.planningRiskAnalysis.risks) {
    const template = RISK_QUESTIONS[risk.riskType];
    if (template) {
      push(template.question, template.category, template.priority, [risk.riskId, ...risk.evidence]);
    }
  }

  for (const q of input.gateInput.unifiedIntakeAnalysis?.intakeRecommendations ?? []) {
    if (q.priority === 'CRITICAL' || q.priority === 'HIGH') {
      push(q.title, 'INTAKE', q.priority, [...q.evidence]);
    }
  }

  for (const q of input.gateInput.requirementCompletenessAnalysis?.clarifyingQuestions ?? []) {
    if (q.priority === 'CRITICAL' || q.priority === 'HIGH') {
      push(q.question, q.category, q.priority, [...q.evidence]);
    }
  }

  if (input.decision === 'REJECT_PLANNING' && questions.length === 0) {
    push(
      'Can you provide initial product requirements via prompt, voice note, or visual references?',
      'INTAKE',
      'CRITICAL',
      ['INSUFFICIENT_EVIDENCE'],
    );
  }

  if (questions.length === 0 && input.decision !== 'ALLOW_FULL_PLANNING') {
    push(
      'Are there launch constraints or compliance requirements that must be included before planning?',
      'SCOPE',
      'MEDIUM',
      ['DEFAULT_CLARIFICATION'],
    );
  }

  const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return questions.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 10);
}

export function determineSafeToPlan(decision: PlanningGateDecision, confidence: number): boolean {
  return (
    (decision === 'ALLOW_FULL_PLANNING' || decision === 'ALLOW_LIMITED_PLANNING') && confidence >= 55
  );
}

export function composePlanningGateAnalysis(input: {
  analysisId: string;
  analyzedAt: string;
  snapshot: PlanningGateEvidenceSnapshot;
  evidenceSufficiency: EvidenceSufficiencyResult;
  planningRiskAnalysis: PlanningRiskAnalysis;
  planningReadiness: PlanningReadinessResult;
  gateInput: AssessPlanningGateInput;
}): PlanningGateAnalysis {
  const planningGateDecision = derivePlanningGateDecision({
    planningReadiness: input.planningReadiness,
    planningRiskAnalysis: input.planningRiskAnalysis,
    evidenceSufficiency: input.evidenceSufficiency,
    snapshot: input.snapshot,
  });

  const planningGateExplanation = buildPlanningGateExplanation({
    snapshot: input.snapshot,
    planningRiskAnalysis: input.planningRiskAnalysis,
    planningReadiness: input.planningReadiness,
    decision: planningGateDecision,
    gateInput: input.gateInput,
  });

  const planningGateQuestions = generatePlanningGateQuestions({
    planningRiskAnalysis: input.planningRiskAnalysis,
    gateInput: input.gateInput,
    decision: planningGateDecision,
  });

  const safeToPlan = determineSafeToPlan(planningGateDecision, planningGateExplanation.confidence);

  return {
    readOnly: true,
    analysisId: input.analysisId,
    analyzedAt: input.analyzedAt,
    evidenceSufficiency: input.evidenceSufficiency,
    planningRiskAnalysis: input.planningRiskAnalysis,
    planningReadiness: input.planningReadiness,
    planningGateDecision,
    planningGateExplanation,
    planningGateQuestions,
    safeToPlan,
  };
}
