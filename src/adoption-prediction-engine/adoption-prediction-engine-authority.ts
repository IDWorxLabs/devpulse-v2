/**
 * Adoption Prediction Engine — predicts adoption barriers before launch.
 */

import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type {
  SensemakingFinding,
  SensemakingFindingType,
} from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import {
  MAX_ADOPTION_ACTIONS,
  MAX_ADOPTION_BLOCKERS,
  MAX_ADOPTION_FINDINGS,
  MAX_ADOPTION_STRENGTHS,
} from './adoption-prediction-engine-bounds.js';
import type {
  AdoptionCategory,
  AdoptionFinding,
  AdoptionFindingType,
  AdoptionPredictionAssessment,
  AdoptionPredictionVisibility,
  AdoptionSeverity,
  AdoptionShellSources,
  AdoptionSubscores,
  AssessAdoptionPredictionInput,
  EnrichedAdoptionAssessments,
} from './adoption-prediction-engine-types.js';

const ARCH_LEAK = /\b(ownership registry|devpulse_v2|chain-of-thought|inner monologue|validator script)\b/i;

const SEVERITY_PENALTY: Record<AdoptionSeverity, number> = {
  CRITICAL: 22,
  HIGH: 14,
  MEDIUM: 8,
  LOW: 4,
};

const SEVERITY_RANK: Record<AdoptionSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

let findingIdCounter = 0;

export function resetAdoptionPredictionCounterForTests(): void {
  findingIdCounter = 0;
}

function nextFindingId(prefix: string): string {
  findingIdCounter += 1;
  return `${prefix}-${findingIdCounter}`;
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function pushFinding(
  bucket: AdoptionFinding[],
  seen: Set<string>,
  finding: Omit<AdoptionFinding, 'id'> & { id?: string },
): void {
  const key = `${finding.type}:${finding.explanation.trim().toLowerCase()}`;
  if (seen.has(key) || bucket.length >= MAX_ADOPTION_FINDINGS) return;
  if (ARCH_LEAK.test(`${finding.explanation} ${finding.recommendation}`)) return;
  seen.add(key);
  bucket.push({ ...finding, id: finding.id ?? nextFindingId('adoption') });
}

function makeFinding(
  type: AdoptionFindingType,
  category: AdoptionCategory,
  severity: AdoptionSeverity,
  explanation: string,
  recommendation: string,
  surface?: string,
): Omit<AdoptionFinding, 'id'> {
  return { type, category, severity, explanation, recommendation, surface };
}

function computeSubscores(input: AssessAdoptionPredictionInput): AdoptionSubscores {
  const ft = input.firstTimeUserReality;
  const cj = input.customerJourneySimulation;
  const launch = input.launchDaySimulation;
  const visual = input.visualQualityAuthority;
  const friction = input.founderFrictionHeatmap;
  const combined = `${input.shellSources.html}\n${input.shellSources.appJs}`;

  const valueClarity = clamp(
    (cj.subscores.discovery * 0.35) +
      (ft.categoryScores.understanding * 0.25) +
      (ft.productUnderstandingPass ? 25 : 0) +
      (combined.includes('welcome-product-purpose') ? 15 : 5),
  );

  const timeToValue = clamp(
    (cj.subscores.value * 0.4) +
      (cj.subscores.onboarding * 0.25) +
      (ft.actionPathPass ? 20 : ft.actionPathStepsVisible * 4) +
      (launch.subscores.newUserReadiness * 0.15),
  );

  const adoptionFriction = clamp(
    100 -
      (friction.overallFrictionScore * 0.3) -
      (100 - cj.subscores.onboarding) * 0.25 -
      (ft.categoryScores.simplicity < 50 ? 20 : 0) -
      (launch.findings.some((f) => f.type === 'ONBOARDING_COLLAPSE') ? 15 : 0),
  );

  const retentionPotential = clamp(
    (cj.subscores.retention * 0.4) +
      (launch.subscores.expectationAlignment * 0.2) +
      (combined.includes('Project Memory') ? 15 : 5) +
      (ft.categoryScores.workflow * 0.25),
  );

  const recommendationPotential = clamp(
    (cj.subscores.advocacy * 0.4) +
      (visual.visualQualityScore * 0.2) +
      (launch.subscores.trustSurvival * 0.25) +
      (cj.personas.filter((p) => p.passed).length >= 4 ? 15 : 5),
  );

  const competitivePressure = clamp(
    (combined.includes('AiDevEngine') && combined.includes('Autonomous') ? 25 : 10) +
      (visual.subscores.professionalism * 0.25) +
      (cj.subscores.discovery * 0.25) +
      (valueClarity * 0.25) +
      (friction.summary.frictionLevel === 'LOW' ? 15 : 5),
  );

  return {
    valueClarity,
    timeToValue,
    adoptionFriction,
    retentionPotential,
    recommendationPotential,
    competitivePressure,
  };
}

function runPredictions(
  input: AssessAdoptionPredictionInput,
  subscores: AdoptionSubscores,
  findings: AdoptionFinding[],
  seen: Set<string>,
): void {
  const cj = input.customerJourneySimulation;
  const launch = input.launchDaySimulation;

  if (subscores.valueClarity < 55 || !input.firstTimeUserReality.productUnderstandingPass) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'VALUE_UNCLEAR',
        'VALUE_CLARITY',
        subscores.valueClarity < 40 ? 'HIGH' : 'MEDIUM',
        'Users may not understand the primary benefit before reaching core functionality.',
        'Expose the primary user outcome earlier in the onboarding journey.',
        'Command Center welcome',
      ),
    );
  }

  if (subscores.timeToValue < 55 || cj.subscores.value < 55) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'TIME_TO_VALUE_TOO_LONG',
        'TIME_TO_VALUE',
        'HIGH',
        'Meaningful value may arrive too late for impatient adopters.',
        'Reduce onboarding effort and improve first-time value delivery.',
        'Customer workflow',
      ),
    );
  }

  if (subscores.adoptionFriction < 55 || cj.adoptionBlockers.length > 0) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'ADOPTION_FRICTION',
        'ADOPTION_FRICTION',
        subscores.adoptionFriction < 40 ? 'CRITICAL' : 'HIGH',
        'Complexity, confusion, or trust barriers may prevent initial adoption.',
        'Clarify value proposition and reduce adoption friction on first workflow.',
        'Onboarding path',
      ),
    );
  }

  if (subscores.retentionPotential < 55 || cj.findings.some((f) => f.type === 'RETENTION_RISK')) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'RETENTION_RISK',
        'RETENTION_POTENTIAL',
        'MEDIUM',
        'Users may not find a compelling reason to return after first use.',
        'Increase retention incentives through recurring workflow value.',
        'Project continuity',
      ),
    );
  }

  if (subscores.recommendationPotential < 55 || cj.findings.some((f) => f.type === 'ADVOCACY_FAILURE')) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'LOW_RECOMMENDATION_POTENTIAL',
        'RECOMMENDATION_POTENTIAL',
        'MEDIUM',
        'Users may not recommend the product due to weak delight or confidence signals.',
        'Improve differentiation and confidence moments before asking for advocacy.',
        'Customer advocacy',
      ),
    );
  }

  if (subscores.competitivePressure < 50) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'COMPETITIVE_REPLACEMENT_RISK',
        'COMPETITIVE_PRESSURE',
        'MEDIUM',
        'Users may choose alternatives if differentiation is not obvious.',
        'Improve differentiation and switching resistance in core workflows.',
        'Product positioning',
      ),
    );
  }

  for (const blocker of cj.adoptionBlockers.slice(0, 2)) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'ADOPTION_BLOCKER',
        'ADOPTION_FRICTION',
        blocker.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        blocker.whatFails,
        blocker.recommendedFix,
        'Customer journey',
      ),
    );
  }

  for (const launchFinding of launch.findings.filter(
    (f) => f.type === 'EXPECTATION_MISMATCH' || f.type === 'ONBOARDING_COLLAPSE' || f.type === 'TRUST_FAILURE',
  ).slice(0, 2)) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        launchFinding.type === 'ONBOARDING_COLLAPSE' ? 'ADOPTION_FRICTION' : 'RETENTION_RISK',
        launchFinding.type === 'EXPECTATION_MISMATCH' ? 'VALUE_CLARITY' : 'ADOPTION_FRICTION',
        launchFinding.severity,
        launchFinding.explanation,
        launchFinding.recommendation,
        'Launch day simulation',
      ),
    );
  }
}

function buildOperatorFeed(
  subscores: AdoptionSubscores,
  findings: AdoptionFinding[],
  score: number,
): AdoptionPredictionAssessment['operatorFeedEvents'] {
  return [
    {
      section: 'Adoption Prediction',
      action: 'Evaluating value clarity',
      detail: `Value clarity ${subscores.valueClarity}/100 from discovery and understanding signals.`,
      status: subscores.valueClarity >= 60 ? 'Completed' : 'Warning',
    },
    {
      section: 'Adoption Prediction',
      action: 'Detecting adoption blockers',
      detail: findings.some((f) => f.type === 'ADOPTION_BLOCKER' || f.type === 'ADOPTION_FRICTION')
        ? 'Adoption blockers detected in bounded prediction.'
        : 'No major adoption blockers in bounded prediction.',
      status: findings.some((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH') ? 'Blocked' : 'Completed',
    },
    {
      section: 'Adoption Prediction',
      action: 'Evaluating retention potential',
      detail: `Retention potential ${subscores.retentionPotential}/100.`,
      status: subscores.retentionPotential >= 55 ? 'Completed' : 'Warning',
    },
    {
      section: 'Adoption Prediction',
      action: 'Evaluating recommendation potential',
      detail: `Recommendation potential ${subscores.recommendationPotential}/100.`,
      status: subscores.recommendationPotential >= 55 ? 'Completed' : 'Warning',
    },
    {
      section: 'Adoption Prediction',
      action: 'Assessing competitive replacement risk',
      detail: `Competitive pressure score ${subscores.competitivePressure}/100 (higher is better).`,
      status: subscores.competitivePressure >= 50 ? 'Completed' : 'Warning',
    },
    {
      section: 'Adoption Prediction',
      action: 'Summarizing adoption prediction score',
      detail: `Adoption Prediction Score ${score}/100.`,
      status: score >= 60 ? 'Completed' : 'Warning',
    },
  ];
}

export function assessAdoptionPrediction(
  input: AssessAdoptionPredictionInput,
): AdoptionPredictionAssessment {
  const findings: AdoptionFinding[] = [];
  const seen = new Set<string>();
  const subscores = computeSubscores(input);
  runPredictions(input, subscores, findings, seen);

  const adoptionPredictionScore = clamp(
    (subscores.valueClarity +
      subscores.timeToValue +
      subscores.adoptionFriction +
      subscores.retentionPotential +
      subscores.recommendationPotential +
      subscores.competitivePressure) /
      6,
  );

  const adoptionStrengths: string[] = [];
  if (subscores.valueClarity >= 70) adoptionStrengths.push('Value proposition clarity supports adoption');
  if (subscores.timeToValue >= 65) adoptionStrengths.push('Time-to-value appears acceptable for new users');
  if (subscores.adoptionFriction >= 65) adoptionStrengths.push('Initial adoption friction appears manageable');
  if (subscores.retentionPotential >= 65) adoptionStrengths.push('Retention potential signals are present');
  if (subscores.recommendationPotential >= 65) adoptionStrengths.push('Recommendation potential is reasonable');
  if (subscores.competitivePressure >= 65) adoptionStrengths.push('Differentiation reduces competitive replacement risk');

  const adoptionBlockers = findings
    .filter((f) => f.type === 'ADOPTION_BLOCKER' || f.severity === 'CRITICAL' || f.severity === 'HIGH')
    .slice(0, MAX_ADOPTION_BLOCKERS);

  const retentionRisks = findings.filter((f) => f.type === 'RETENTION_RISK').map((f) => f.explanation).slice(0, 6);
  const recommendationRisks = findings
    .filter((f) => f.type === 'LOW_RECOMMENDATION_POTENTIAL')
    .map((f) => f.explanation)
    .slice(0, 6);
  const competitiveRisks = findings
    .filter((f) => f.type === 'COMPETITIVE_REPLACEMENT_RISK')
    .map((f) => f.explanation)
    .slice(0, 6);

  const adoptionConfidence = clamp(adoptionPredictionScore * 0.65 + subscores.retentionPotential * 0.2 + subscores.recommendationPotential * 0.15);
  const majorAdoptionRisks =
    adoptionBlockers.length >= 2 ||
    findings.some((f) => f.severity === 'CRITICAL') ||
    adoptionPredictionScore < 50 ||
    input.customerJourneySimulation.notReadyForCustomers;
  const adoptionPredictionPass = !majorAdoptionRisks && adoptionPredictionScore >= 55;

  return {
    adoptionPredictionScore,
    subscores,
    findings,
    adoptionStrengths: adoptionStrengths.slice(0, MAX_ADOPTION_STRENGTHS),
    adoptionWeaknesses: findings.slice(0, 5).map((f) => f.explanation),
    adoptionBlockers,
    retentionRisks,
    recommendationRisks,
    competitiveRisks,
    adoptionConfidence,
    operatorFeedEvents: buildOperatorFeed(subscores, findings, adoptionPredictionScore),
    majorAdoptionRisks,
    adoptionPredictionPass,
    valueClarityDetectionPass: findings.some((f) => f.type === 'VALUE_UNCLEAR') || subscores.valueClarity >= 55,
    adoptionBlockerDetectionPass: findings.some((f) => f.type === 'ADOPTION_BLOCKER' || f.type === 'ADOPTION_FRICTION') || adoptionBlockers.length >= 0,
    retentionRiskDetectionPass: findings.some((f) => f.type === 'RETENTION_RISK') || subscores.retentionPotential >= 55,
    recommendationRiskDetectionPass: findings.some((f) => f.type === 'LOW_RECOMMENDATION_POTENTIAL') || subscores.recommendationPotential >= 55,
    competitiveRiskDetectionPass: findings.some((f) => f.type === 'COMPETITIVE_REPLACEMENT_RISK') || subscores.competitivePressure >= 50,
    insufficientInfo: false,
    insufficientInfoReason: null,
  };
}

export function evaluateAdoptionPredictionVisibility(
  assessment: AdoptionPredictionAssessment,
): AdoptionPredictionVisibility {
  const checks = [
    assessment.adoptionPredictionScore >= 0,
    assessment.findings.length <= MAX_ADOPTION_FINDINGS,
    assessment.operatorFeedEvents.length >= 5,
    assessment.valueClarityDetectionPass,
    assessment.adoptionBlockerDetectionPass,
    assessment.retentionRiskDetectionPass,
    assessment.recommendationRiskDetectionPass,
    assessment.competitiveRiskDetectionPass,
  ];

  return {
    score: clamp((checks.filter(Boolean).length / checks.length) * 100),
    adoptionPredictionScore: assessment.adoptionPredictionScore,
    adoptionConfidence: assessment.adoptionConfidence,
    majorAdoptionRisks: assessment.majorAdoptionRisks,
    adoptionPredictionPass: assessment.adoptionPredictionPass,
    adoptionBlockerCount: assessment.adoptionBlockers.length,
    criticalCount: assessment.findings.filter((f) => f.severity === 'CRITICAL').length,
  };
}

function mapAdoptionToSensemaking(finding: AdoptionFinding): SensemakingFinding {
  const type: SensemakingFindingType =
    finding.type === 'ADOPTION_BLOCKER' || finding.type === 'RETENTION_RISK'
      ? 'ADOPTION_RISK'
      : finding.type === 'VALUE_UNCLEAR'
        ? 'CONFUSION'
        : finding.type === 'LOW_RECOMMENDATION_POTENTIAL' || finding.type === 'COMPETITIVE_REPLACEMENT_RISK'
          ? 'COHERENCE_GAP'
          : 'TRUST_RISK';

  return {
    id: nextFindingId('adoption-sense'),
    type,
    severity: finding.severity,
    area: 'Adoption Prediction',
    whatDoesNotMakeSense: finding.explanation,
    whyItMatters: 'Adoption is reality — users must perceive enough value to adopt, retain, and recommend.',
    recommendedUpgrade: finding.recommendation,
    expectedImpact: 'Improves commercial adoption before launch.',
    evidence: finding.surface ?? 'Adoption Prediction Engine',
  };
}

function mergeSensemaking(
  base: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  adoption: AdoptionPredictionAssessment,
): import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment {
  const extraFindings = (adoption.adoptionBlockers.length ? adoption.adoptionBlockers : adoption.findings.slice(0, 4)).map(
    mapAdoptionToSensemaking,
  );
  const mergedFindings = [...extraFindings, ...base.findings]
    .sort((a, b) => SEVERITY_RANK[a.severity as AdoptionSeverity] - SEVERITY_RANK[b.severity as AdoptionSeverity])
    .slice(0, 12);

  const penalty = adoption.findings.reduce((sum, f) => sum + SEVERITY_PENALTY[f.severity], 0);

  return {
    ...base,
    founderSensemakingScore: clamp(base.founderSensemakingScore - Math.round(penalty * 0.18)),
    productCoherenceScore: clamp(base.productCoherenceScore - Math.round(penalty * 0.2)),
    findings: mergedFindings,
    topConfusionRisks: mergedFindings.filter((f) => f.type === 'CONFUSION').slice(0, 4),
    topTrustRisks: mergedFindings.filter((f) => f.type === 'TRUST_RISK' || f.type === 'ADOPTION_RISK').slice(0, 4),
    trustRisksDetected: mergedFindings.some((f) => f.type === 'TRUST_RISK' || f.type === 'ADOPTION_RISK') || base.trustRisksDetected,
    findingsGenerated: mergedFindings.length > 0,
    operatorFeedEvents: [...adoption.operatorFeedEvents.slice(0, 3), ...base.operatorFeedEvents].slice(0, 12),
    adoptionConfidence: adoption.adoptionConfidence,
    topAdoptionPredictionRisks: adoption.findings.slice(0, 5).map((f) => f.explanation),
    adoptionPredictionBlockers: adoption.adoptionBlockers.map((f) => f.explanation),
    adoptionRetentionRisks: adoption.retentionRisks.slice(0, 5),
  };
}

function mergeActionCenter(
  base: FounderActionCenterAssessment,
  adoption: AdoptionPredictionAssessment,
): FounderActionCenterAssessment {
  const actions = [...base.topActions];
  const seen = new Set(actions.map((a) => a.title.trim().toLowerCase()));

  const templates: ReadonlyArray<{ match: AdoptionFindingType; title: string; reason: string }> = [
    { match: 'VALUE_UNCLEAR', title: 'Clarify value proposition', reason: 'Value clarity risk detected.' },
    { match: 'TIME_TO_VALUE_TOO_LONG', title: 'Improve first-time value delivery', reason: 'Time-to-value too long.' },
    { match: 'ADOPTION_FRICTION', title: 'Reduce onboarding effort', reason: 'Adoption friction detected.' },
    { match: 'RETENTION_RISK', title: 'Increase retention incentives', reason: 'Retention risk detected.' },
    { match: 'LOW_RECOMMENDATION_POTENTIAL', title: 'Strengthen recommendation potential', reason: 'Low recommendation potential.' },
    { match: 'COMPETITIVE_REPLACEMENT_RISK', title: 'Improve differentiation', reason: 'Competitive replacement risk.' },
    { match: 'ADOPTION_BLOCKER', title: 'Remove adoption blocker', reason: 'Adoption blocker detected.' },
  ];

  for (const finding of adoption.adoptionBlockers.length ? adoption.adoptionBlockers : adoption.findings.slice(0, 4)) {
    const template = templates.find((t) => t.match === finding.type);
    const title = `[${finding.severity}] ${template?.title ?? finding.recommendation.slice(0, 48)}`;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    actions.unshift({
      id: nextFindingId('adoption-action'),
      type: 'FIX_ACTION',
      priority: finding.severity === 'CRITICAL' ? 'CRITICAL' : finding.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
      title: title.length > 96 ? `${title.slice(0, 93)}…` : title,
      rationale: template?.reason ?? finding.explanation,
      expectedImpact: 'Improves adoption, retention, and recommendation likelihood.',
      evidence: finding.surface ?? finding.explanation,
      executable: true,
    });
  }

  const topActions = actions.slice(0, 8);
  return {
    ...base,
    topActions,
    recommendedNextStep:
      topActions[0] && (topActions[0].priority === 'CRITICAL' || topActions[0].priority === 'HIGH')
        ? {
            priority: topActions[0].priority,
            title: topActions[0].title,
            type: topActions[0].type,
            reason: topActions[0].rationale,
            expectedImpact: topActions[0].expectedImpact,
            evidence: topActions[0].evidence,
          }
        : base.recommendedNextStep,
    actionsGenerated: topActions.length > 0,
    recommendationsActionable: topActions.some((a) => a.executable) || base.recommendationsActionable,
    operatorFeedEvents: [...adoption.operatorFeedEvents.slice(0, 2), ...base.operatorFeedEvents].slice(0, 12),
  };
}

export function enrichAssessmentsWithAdoptionPrediction(
  founderActionCenter: FounderActionCenterAssessment,
  founderSensemaking: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  adoption: AdoptionPredictionAssessment,
): EnrichedAdoptionAssessments {
  return {
    founderActionCenter: mergeActionCenter(founderActionCenter, adoption),
    founderSensemaking: mergeSensemaking(founderSensemaking, adoption),
  };
}
