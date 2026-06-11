/**
 * Customer Journey Simulation Authority — simulates customer adoption journeys from existing reality signals.
 */

import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type {
  SensemakingFinding,
  SensemakingFindingType,
} from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import {
  MAX_ADOPTION_BLOCKERS,
  MAX_CUSTOMER_FINDINGS,
  MAX_CUSTOMER_JOURNEYS,
  MAX_CUSTOMER_PERSONAS,
  MAX_CUSTOMER_SCENARIOS,
} from './customer-journey-simulation-bounds.js';
import type {
  AssessCustomerJourneySimulationInput,
  CustomerFindingType,
  CustomerJourneyCategory,
  CustomerJourneyFeedEvent,
  CustomerJourneyFinding,
  CustomerJourneyScenarioResult,
  CustomerJourneyShellSources,
  CustomerJourneySimulationAssessment,
  CustomerJourneySimulationVisibility,
  CustomerJourneySubscores,
  CustomerPersonaId,
  CustomerPersonaResult,
  CustomerSeverity,
  EnrichedCustomerJourneyAssessments,
} from './customer-journey-simulation-types.js';

const ARCH_LEAK = /\b(ownership registry|devpulse_v2|chain-of-thought|inner monologue|validator script)\b/i;

const SEVERITY_PENALTY: Record<CustomerSeverity, number> = {
  CRITICAL: 20,
  HIGH: 12,
  MEDIUM: 7,
  LOW: 3,
};

let findingIdCounter = 0;

export function resetCustomerJourneyCounterForTests(): void {
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

function shellCopy(sources: CustomerJourneyShellSources): string {
  return `${sources.html}\n${sources.appJs}`;
}

function pushFinding(
  bucket: CustomerJourneyFinding[],
  seen: Set<string>,
  finding: Omit<CustomerJourneyFinding, 'id'> & { id?: string },
): void {
  const key = `${finding.type}:${finding.whatFails.trim().toLowerCase()}`;
  if (seen.has(key) || bucket.length >= MAX_CUSTOMER_FINDINGS) return;
  if (ARCH_LEAK.test(`${finding.whatFails} ${finding.observedGap} ${finding.recommendedFix}`)) return;
  seen.add(key);
  bucket.push({ ...finding, id: finding.id ?? nextFindingId('customer') });
}

function makeFinding(
  type: CustomerFindingType,
  category: CustomerJourneyCategory,
  severity: CustomerSeverity,
  whatFails: string,
  customerQuestion: string,
  expectedExperience: string,
  observedGap: string,
  whyItMatters: string,
  recommendedFix: string,
  persona?: CustomerPersonaId,
): Omit<CustomerJourneyFinding, 'id'> {
  return {
    type,
    category,
    severity,
    persona,
    whatFails,
    customerQuestion,
    expectedExperience,
    observedGap,
    whyItMatters,
    recommendedFix,
  };
}

function computeSubscores(input: AssessCustomerJourneySimulationInput): CustomerJourneySubscores {
  const {
    shellSources: sources,
    firstTimeUserReality: ft,
    verificationTrustEvidence: trust,
    founderFrictionHeatmap: friction,
    founderInteractionSimulation: interaction,
    previewValidationReady,
    autonomousBuilderConnected,
  } = input;
  const projectMemoryScore = Number.isFinite(input.projectMemoryScore) ? input.projectMemoryScore : 0;
  const interactionScore = Number.isFinite(interaction.interactionScore) ? interaction.interactionScore : 0;
  const trustScoreInput = Number.isFinite(trust.trustScore) ? trust.trustScore : 0;
  const firstTimeScore = Number.isFinite(ft.firstTimeUserScore) ? ft.firstTimeUserScore : 0;
  const frictionScore = Number.isFinite(friction.overallFrictionScore) ? friction.overallFrictionScore : 50;
  const actionPathSteps = Number.isFinite(ft.actionPathStepsVisible) ? ft.actionPathStepsVisible : 0;
  const combined = shellCopy(sources);

  const discovery =
    (ft.productUnderstandingPass ? 35 : 0) +
    (/welcome-product-purpose|Turn detailed product ideas/i.test(combined) ? 25 : 0) +
    (/Why should I care|useful/i.test(combined) ? 0 : 0) +
    (ft.firstTimeUserScore >= 70 ? 25 : firstTimeScore * 0.25) +
    (combined.includes('Describe what you want to build') ? 15 : 0);

  const onboarding =
    (ft.actionPathPass ? 35 : 0) +
    (combined.includes('first-time-founder-path') ? 25 : 0) +
    (ft.workflowClarityPass ? 25 : 0) +
    (interaction.interactionScore >= 70 ? 15 : interactionScore * 0.15);

  const value =
    (previewValidationReady ? 35 : 15) +
    (combined.includes('Live Preview') && combined.includes('interact with and test') ? 25 : 10) +
    (trust.trustPass ? 20 : trustScoreInput * 0.2) +
    (actionPathSteps >= 4 ? 20 : actionPathSteps * 5);

  const trustScore =
    trustScoreInput * 0.45 +
    (verificationTrustPass(trust) ? 25 : 0) +
    (autonomousBuilderConnected ? 15 : 5) +
    (interaction.modalCloseRegressionPass ? 15 : 0);

  const retention =
    (projectMemoryScore * 0.35) +
    (combined.includes('Project Memory') ? 20 : 0) +
    (friction.summary.frictionLevel === 'LOW' ? 25 : friction.summary.frictionLevel === 'MODERATE' ? 15 : 5) +
    (ft.actionPathPass ? 20 : 0);

  const advocacy =
    firstTimeScore * 0.25 +
    (trust.trustPass ? 25 : 0) +
    (interactionScore >= 75 ? 20 : 0) +
    (frictionScore <= 25 ? 20 : frictionScore <= 40 ? 12 : 5) +
    (previewValidationReady ? 10 : 0);

  return {
    discovery: clamp(discovery),
    onboarding: clamp(onboarding),
    value: clamp(value),
    trust: clamp(trustScore),
    retention: clamp(retention),
    advocacy: clamp(advocacy),
  };
}

function verificationTrustPass(
  trust: AssessCustomerJourneySimulationInput['verificationTrustEvidence'],
): boolean {
  return trust.trustPass && !trust.blackBoxRisk;
}

function runJourneyScenario(
  id: string,
  category: CustomerJourneyCategory,
  name: string,
  subscore: number,
  threshold: number,
  passDetail: string,
  failFinding: Omit<CustomerJourneyFinding, 'id'> | null,
  findings: CustomerJourneyFinding[],
  seen: Set<string>,
  scenarios: CustomerJourneyScenarioResult[],
): void {
  const passed = subscore >= threshold;
  if (!passed && failFinding) {
    pushFinding(findings, seen, failFinding);
  }
  scenarios.push({
    id,
    category,
    name,
    passed,
    detail: passed ? passDetail : `${name} — subscore ${subscore}/100 below ${threshold}.`,
  });
}

function evaluatePersonas(
  subscores: CustomerJourneySubscores,
): CustomerPersonaResult[] {
  const personas: CustomerPersonaResult[] = [
    {
      personaId: 'new-customer',
      name: 'New Customer',
      passed: subscores.discovery >= 55 && subscores.onboarding >= 50,
      detail: 'What is this? Why should I care? Why is this useful?',
    },
    {
      personaId: 'returning-customer',
      name: 'Returning Customer',
      passed: subscores.retention >= 50 && subscores.onboarding >= 45,
      detail: 'Can I continue where I left off? Can I accomplish my goal quickly?',
    },
    {
      personaId: 'skeptical-customer',
      name: 'Skeptical Customer',
      passed: subscores.trust >= 55,
      detail: 'Can I trust this? Is this real? Does this actually work?',
    },
    {
      personaId: 'paying-customer',
      name: 'Paying Customer',
      passed: subscores.value >= 55 && subscores.trust >= 50,
      detail: 'Am I receiving value? Would I continue paying?',
    },
    {
      personaId: 'power-user',
      name: 'Power User',
      passed: subscores.value >= 60 && subscores.advocacy >= 50,
      detail: 'Can I achieve advanced outcomes? Will I hit limitations?',
    },
  ];
  return personas.slice(0, MAX_CUSTOMER_PERSONAS);
}

function buildOperatorFeed(
  scenarios: CustomerJourneyScenarioResult[],
  findings: CustomerJourneyFinding[],
): CustomerJourneyFeedEvent[] {
  return [
    {
      section: 'Customer Experience',
      action: 'Simulating customer discovery',
      detail: 'Evaluating value proposition clarity and first impression for new customers.',
      status: scenarios.find((s) => s.id === 'journey-discovery')?.passed ? 'Completed' : 'Warning',
    },
    {
      section: 'Customer Experience',
      action: 'Simulating onboarding journey',
      detail: 'Checking whether a customer can get started with clear first actions.',
      status: scenarios.find((s) => s.id === 'journey-onboarding')?.passed ? 'Completed' : 'Warning',
    },
    {
      section: 'Customer Experience',
      action: 'Evaluating value realization',
      detail: 'Measuring time-to-value signals from preview, workflow, and outcome visibility.',
      status: scenarios.find((s) => s.id === 'journey-value')?.passed ? 'Completed' : 'Warning',
    },
    {
      section: 'Customer Experience',
      action: 'Evaluating customer trust',
      detail: 'Reviewing promise reality, transparency, and verification trust for skeptical customers.',
      status: scenarios.find((s) => s.id === 'journey-trust')?.passed ? 'Completed' : 'Warning',
    },
    {
      section: 'Customer Experience',
      action: 'Evaluating retention potential',
      detail: 'Checking recurring value, stickiness, and workflow continuation signals.',
      status: scenarios.find((s) => s.id === 'journey-retention')?.passed ? 'Completed' : 'Warning',
    },
    {
      section: 'Customer Experience',
      action: 'Ranking adoption blockers',
      detail:
        findings.length > 0
          ? `${findings.length} customer journey issue(s) ranked by adoption impact.`
          : 'No major adoption blockers detected in bounded customer scenarios.',
      status: findings.some((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH') ? 'Blocked' : 'Completed',
    },
  ];
}

function mapCustomerToSensemaking(finding: CustomerJourneyFinding): SensemakingFinding {
  const senseType: SensemakingFindingType =
    finding.type === 'CUSTOMER_TRUST_FAILURE'
      ? 'TRUST_RISK'
      : finding.type === 'ADOPTION_BLOCKER' || finding.type === 'RETENTION_RISK'
        ? 'ADOPTION_RISK'
        : finding.type === 'DISCOVERY_FAILURE' || finding.type === 'ONBOARDING_FAILURE'
          ? 'CONFUSION'
          : finding.type === 'VALUE_REALIZATION_FAILURE'
            ? 'COHERENCE_GAP'
            : 'CONFUSION';

  return {
    id: `customer-sense-${finding.id}`,
    type: senseType,
    severity: finding.severity,
    area: 'Customer Journey',
    whatDoesNotMakeSense: finding.whatFails,
    whyItMatters: finding.whyItMatters,
    recommendedUpgrade: finding.recommendedFix,
    expectedImpact: 'Improves customer adoption, retention, and recommendation likelihood.',
    evidence: finding.customerQuestion,
  };
}

function severityRank(s: CustomerSeverity): number {
  return { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[s];
}

export function assessCustomerJourneySimulation(
  input: AssessCustomerJourneySimulationInput,
): CustomerJourneySimulationAssessment {
  const findings: CustomerJourneyFinding[] = [];
  const seen = new Set<string>();
  const scenarios: CustomerJourneyScenarioResult[] = [];
  const subscores = computeSubscores(input);

  runJourneyScenario(
    'journey-discovery',
    'DISCOVERY',
    'Discovery journey evaluated',
    subscores.discovery,
    55,
    'Value proposition and first impression are understandable to new customers.',
    makeFinding(
      'DISCOVERY_FAILURE',
      'DISCOVERY',
      subscores.discovery < 40 ? 'HIGH' : 'MEDIUM',
      'Customer does not understand why the product matters.',
      'What is this? Why should I care?',
      'Clear value proposition within the first minute.',
      'Welcome and product purpose copy do not quickly answer customer motivation.',
      'Customers bounce before trying the product.',
      'Clarify customer outcome on Command Center welcome and hero copy.',
      'new-customer',
    ),
    findings,
    seen,
    scenarios,
  );

  runJourneyScenario(
    'journey-onboarding',
    'ONBOARDING',
    'Onboarding journey evaluated',
    subscores.onboarding,
    50,
    'Customers can discover a clear first action and onboarding path.',
    makeFinding(
      'ONBOARDING_FAILURE',
      'ONBOARDING',
      subscores.onboarding < 40 ? 'HIGH' : 'MEDIUM',
      'Customer cannot get started easily.',
      'Can a customer get started?',
      'Obvious first action and guided onboarding path.',
      'First customer workflow or action path is not discoverable enough.',
      'Customers stall before experiencing product value.',
      'Improve onboarding flow with visible first steps and guidance.',
      'new-customer',
    ),
    findings,
    seen,
    scenarios,
  );

  runJourneyScenario(
    'journey-value',
    'VALUE',
    'Value realization journey evaluated',
    subscores.value,
    55,
    'Customers can reach value through preview and verification workflows.',
    makeFinding(
      'VALUE_REALIZATION_FAILURE',
      'VALUE',
      'HIGH',
      'Customer cannot experience value quickly.',
      'How quickly does the customer experience value?',
      'Time-to-value through preview, workflow completion, and visible outcomes.',
      'Value realization occurs too late or outcome visibility is weak.',
      'Customers abandon before seeing meaningful results.',
      'Reduce time-to-value with clearer preview and outcome surfaces.',
      'paying-customer',
    ),
    findings,
    seen,
    scenarios,
  );

  runJourneyScenario(
    'journey-trust',
    'TRUST',
    'Customer trust journey evaluated',
    subscores.trust,
    55,
    'Customer trust signals are strong enough for skeptical users.',
    makeFinding(
      'CUSTOMER_TRUST_FAILURE',
      'TRUST',
      'HIGH',
      'Customer trust decreases or remains fragile.',
      'Can I trust this? Does this actually work?',
      'Transparent promises backed by verification evidence.',
      'Trust-forming proof or consistency gaps remain for customers.',
      'Skeptical customers will not adopt or pay.',
      'Strengthen verification trust, promise alignment, and transparency.',
      'skeptical-customer',
    ),
    findings,
    seen,
    scenarios,
  );

  runJourneyScenario(
    'journey-retention',
    'RETENTION',
    'Retention journey evaluated',
    subscores.retention,
    50,
    'Customers have reasons to return and continue workflows.',
    makeFinding(
      'RETENTION_RISK',
      'RETENTION',
      'MEDIUM',
      'No compelling reason to return yet.',
      'Why would they come back?',
      'Recurring value through memory, insights, and continued workflows.',
      'Stickiness and workflow continuation signals are weak.',
      'One-time visitors do not become returning customers.',
      'Improve project continuity, insights value, and ongoing workflow guidance.',
      'returning-customer',
    ),
    findings,
    seen,
    scenarios,
  );

  runJourneyScenario(
    'journey-advocacy',
    'ADVOCACY',
    'Recommendation journey evaluated',
    subscores.advocacy,
    50,
    'Customers would have confidence to recommend the product.',
    makeFinding(
      'ADVOCACY_FAILURE',
      'ADVOCACY',
      'MEDIUM',
      'Customer unlikely to recommend the product yet.',
      'Would they recommend this?',
      'Delight moments, confidence, and differentiation.',
      'Customer journey lacks standout moments or confidence for advocacy.',
      'Word-of-mouth growth remains limited.',
      'Create clearer customer wins and confidence moments before launch.',
      'power-user',
    ),
    findings,
    seen,
    scenarios,
  );

  const boundedScenarios = scenarios.slice(0, MAX_CUSTOMER_JOURNEYS);

  if (findings.some((f) => f.type === 'ONBOARDING_FAILURE' && f.severity !== 'LOW')) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'ADOPTION_BLOCKER',
        'ONBOARDING',
        'HIGH',
        'Customer cannot easily determine next step after onboarding.',
        'What do I do next as a customer?',
        'Clear next step after first customer workflow.',
        'Onboarding ends without an obvious continuation path.',
        'Adoption stalls at the first workflow boundary.',
        'Improve onboarding flow with explicit next-step guidance.',
        'new-customer',
      ),
    );
  }

  if (findings.some((f) => f.type === 'VALUE_REALIZATION_FAILURE')) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'ADOPTION_BLOCKER',
        'VALUE',
        'HIGH',
        'Time-to-value occurs too late for customer adoption.',
        'When do I see value?',
        'Meaningful outcome visible within the first customer session.',
        'Preview and outcome surfaces appear too late in the journey.',
        'Paying customers will not wait for delayed value.',
        'Reduce time-to-value with faster preview and outcome visibility.',
        'paying-customer',
      ),
    );
  }

  if (findings.some((f) => f.type === 'DISCOVERY_FAILURE')) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'ADOPTION_BLOCKER',
        'DISCOVERY',
        'HIGH',
        'Discovery journey confusion blocks meaningful adoption.',
        'Why is this useful to me?',
        'Customer understands product value before committing attention.',
        'Value proposition does not land for new customers.',
        'Discovery failure prevents all downstream adoption.',
        'Clarify customer outcome and usefulness on first entry.',
        'new-customer',
      ),
    );
  }

  const personas = evaluatePersonas(subscores);
  const adoptionBlockers = findings
    .filter((f) => f.type === 'ADOPTION_BLOCKER' || f.severity === 'CRITICAL' || f.severity === 'HIGH')
    .slice(0, MAX_ADOPTION_BLOCKERS);

  const customerJourneyScore = clamp(
    (subscores.discovery +
      subscores.onboarding +
      subscores.value +
      subscores.trust +
      subscores.retention +
      subscores.advocacy) /
      6,
  );

  const strengths: string[] = [];
  if (subscores.discovery >= 70) strengths.push('Value proposition understandable to new customers');
  if (subscores.trust >= 70) strengths.push('Customer trust generally strong');
  if (subscores.onboarding >= 65) strengths.push('Onboarding path discoverable for customers');
  if (subscores.value >= 65) strengths.push('Value realization signals present');
  if (personas.filter((p) => p.passed).length >= 4) strengths.push('Most customer personas pass bounded simulation');

  const weaknesses = findings.slice(0, 5).map((f) => f.whatFails);
  const topAdoptionBlocker = adoptionBlockers[0]?.whatFails ?? null;
  const notReadyForCustomers = customerJourneyScore < 50 || adoptionBlockers.length >= 2;
  const customerReady = !notReadyForCustomers && boundedScenarios.filter((s) => s.passed).length >= 4;

  return {
    customerJourneyScore,
    subscores,
    personas,
    scenarios: boundedScenarios,
    findings,
    adoptionBlockers,
    strengths: strengths.slice(0, 5),
    weaknesses,
    topAdoptionBlocker,
    operatorFeedEvents: buildOperatorFeed(boundedScenarios, findings),
    customerReady,
    notReadyForCustomers,
    findingsGenerated: findings.length > 0,
    insufficientInfo: boundedScenarios.length === 0,
    insufficientInfoReason: boundedScenarios.length === 0 ? 'No customer journey scenarios executed.' : null,
  };
}

export function evaluateCustomerJourneySimulationVisibility(
  assessment: CustomerJourneySimulationAssessment,
): CustomerJourneySimulationVisibility {
  const sub = assessment.subscores;
  const checks = [
    assessment.scenarios.length >= 6,
    assessment.personas.length >= 5,
    assessment.adoptionBlockers.length >= 0,
    assessment.operatorFeedEvents.length >= 5,
    !assessment.notReadyForCustomers || assessment.findings.length > 0,
  ];

  return {
    score: clamp((checks.filter(Boolean).length / checks.length) * 100),
    customerJourneyScore: assessment.customerJourneyScore,
    customerReady: assessment.customerReady,
    notReadyForCustomers: assessment.notReadyForCustomers,
    discoveryPass: sub.discovery >= 55,
    onboardingPass: sub.onboarding >= 50,
    valuePass: sub.value >= 55,
    trustPass: sub.trust >= 55,
    retentionPass: sub.retention >= 50,
    advocacyPass: sub.advocacy >= 50,
    adoptionBlockerCount: assessment.adoptionBlockers.length,
    personaPassCount: assessment.personas.filter((p) => p.passed).length,
  };
}

function mergeSensemaking(
  base: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  customer: CustomerJourneySimulationAssessment,
): import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment {
  const extraFindings = customer.findings.map(mapCustomerToSensemaking);
  const mergedFindings = [...extraFindings, ...base.findings]
    .sort((a, b) => severityRank(a.severity as CustomerSeverity) - severityRank(b.severity as CustomerSeverity))
    .slice(0, 12);

  const penalty = customer.findings.reduce((sum, f) => sum + SEVERITY_PENALTY[f.severity], 0);

  return {
    ...base,
    founderSensemakingScore: clamp(base.founderSensemakingScore - Math.round(penalty * 0.3)),
    productCoherenceScore: clamp(base.productCoherenceScore - Math.round(penalty * 0.35)),
    findings: mergedFindings,
    topConfusionRisks: mergedFindings.filter((f) => f.type === 'CONFUSION').slice(0, 4),
    topTrustRisks: mergedFindings.filter((f) => f.type === 'TRUST_RISK' || f.type === 'ADOPTION_RISK').slice(0, 4),
    confusionRisksDetected: mergedFindings.some((f) => f.type === 'CONFUSION') || base.confusionRisksDetected,
    trustRisksDetected: mergedFindings.some((f) => f.type === 'TRUST_RISK' || f.type === 'ADOPTION_RISK') || base.trustRisksDetected,
    findingsGenerated: mergedFindings.length > 0,
    operatorFeedEvents: [...customer.operatorFeedEvents.slice(0, 3), ...base.operatorFeedEvents].slice(0, 12),
  };
}

function mergeActionCenter(
  base: FounderActionCenterAssessment,
  customer: CustomerJourneySimulationAssessment,
): FounderActionCenterAssessment {
  const actions = [...base.topActions];
  const seen = new Set(actions.map((a) => a.title.trim().toLowerCase()));

  const actionTemplates: ReadonlyArray<{ match: CustomerFindingType; title: string; reason: string }> = [
    { match: 'ONBOARDING_FAILURE', title: 'Improve onboarding flow', reason: 'Customer onboarding failure detected.' },
    { match: 'VALUE_REALIZATION_FAILURE', title: 'Reduce time-to-value', reason: 'Value realization occurs too late.' },
    { match: 'DISCOVERY_FAILURE', title: 'Clarify customer outcome', reason: 'Discovery journey confusion detected.' },
    { match: 'ADOPTION_BLOCKER', title: 'Remove adoption blocker', reason: 'Customer adoption blocker detected.' },
    { match: 'CUSTOMER_TRUST_FAILURE', title: 'Strengthen customer trust proof', reason: 'Customer trust journey failure detected.' },
  ];

  for (const finding of customer.adoptionBlockers.length
    ? customer.adoptionBlockers
    : customer.findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH')) {
    const template = actionTemplates.find((t) => t.match === finding.type);
    const title = template ? `[HIGH] ${template.title}` : `[HIGH] ${finding.recommendedFix.slice(0, 48)}`;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    actions.unshift({
      id: nextFindingId('customer-action'),
      type: 'FIX_ACTION',
      priority: finding.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      title: title.length > 96 ? `${title.slice(0, 93)}…` : title,
      rationale: template?.reason ?? finding.whyItMatters,
      expectedImpact: 'Improves customer adoption and retention before launch.',
      evidence: finding.customerQuestion,
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
    operatorFeedEvents: [...customer.operatorFeedEvents.slice(0, 2), ...base.operatorFeedEvents].slice(0, 12),
  };
}

export function enrichAssessmentsWithCustomerJourney(
  founderActionCenter: FounderActionCenterAssessment,
  founderSensemaking: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  customer: CustomerJourneySimulationAssessment,
): EnrichedCustomerJourneyAssessments {
  return {
    founderActionCenter: mergeActionCenter(founderActionCenter, customer),
    founderSensemaking: mergeSensemaking(founderSensemaking, customer),
  };
}
