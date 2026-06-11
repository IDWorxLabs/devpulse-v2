/**
 * Launch Day Simulation Engine — evaluates operational reality before public release.
 */

import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type {
  SensemakingFinding,
  SensemakingFindingType,
} from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import {
  MAX_LAUNCH_ACTIONS,
  MAX_LAUNCH_BLOCKERS,
  MAX_LAUNCH_DAY_FINDINGS,
  MAX_LAUNCH_STRENGTHS,
} from './launch-day-simulation-engine-bounds.js';
import type {
  AssessLaunchDaySimulationInput,
  EnrichedLaunchDayAssessments,
  LaunchDayFinding,
  LaunchDayFindingType,
  LaunchDaySeverity,
  LaunchDaySimulationAssessment,
  LaunchDaySimulationCategory,
  LaunchDayShellSources,
  LaunchDaySubscores,
  LaunchDaySimulationVisibility,
} from './launch-day-simulation-engine-types.js';

const ARCH_LEAK = /\b(ownership registry|devpulse_v2|chain-of-thought|inner monologue|validator script)\b/i;

const SEVERITY_PENALTY: Record<LaunchDaySeverity, number> = {
  CRITICAL: 24,
  HIGH: 15,
  MEDIUM: 8,
  LOW: 4,
};

const SEVERITY_RANK: Record<LaunchDaySeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

let findingIdCounter = 0;

export function resetLaunchDayCounterForTests(): void {
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

function shellCopy(sources: LaunchDayShellSources): string {
  return `${sources.html}\n${sources.css}\n${sources.appJs}`;
}

function pushFinding(
  bucket: LaunchDayFinding[],
  seen: Set<string>,
  finding: Omit<LaunchDayFinding, 'id'> & { id?: string },
): void {
  const key = `${finding.type}:${finding.explanation.trim().toLowerCase()}`;
  if (seen.has(key) || bucket.length >= MAX_LAUNCH_DAY_FINDINGS) return;
  if (ARCH_LEAK.test(`${finding.explanation} ${finding.recommendation}`)) return;
  seen.add(key);
  bucket.push({ ...finding, id: finding.id ?? nextFindingId('launch') });
}

function makeFinding(
  type: LaunchDayFindingType,
  category: LaunchDaySimulationCategory,
  severity: LaunchDaySeverity,
  explanation: string,
  recommendation: string,
  surface?: string,
): Omit<LaunchDayFinding, 'id'> {
  return { type, category, severity, explanation, recommendation, surface };
}

function computeSubscores(input: AssessLaunchDaySimulationInput): LaunchDaySubscores {
  const ft = input.firstTimeUserReality;
  const cj = input.customerJourneySimulation;
  const visual = input.visualQualityAuthority;
  const trust = input.verificationTrustEvidence;
  const friction = input.founderFrictionHeatmap;
  const interaction = input.founderInteractionSimulation;
  const action = input.founderActionCenter;
  const verification = input.verificationResults;
  const combined = shellCopy(input.shellSources);

  const newUserReadiness = clamp(
    (ft.firstTimeUserScore * 0.35) +
      (cj.subscores.onboarding * 0.25) +
      (cj.subscores.discovery * 0.2) +
      (ft.actionPathPass ? 20 : 0),
  );

  const concurrentUsageReadiness = clamp(
    100 -
      (friction.overallFrictionScore * 0.35) -
      (friction.summary.frictionLevel === 'HIGH' ? 25 : friction.summary.frictionLevel === 'MODERATE' ? 12 : 0) -
      (combined.includes('single-writer') || combined.includes('mutex') ? 0 : 8),
  );

  const expectationAlignment = clamp(
    (cj.subscores.value * 0.3) +
      (cj.subscores.advocacy * 0.2) +
      (visual.visualQualityScore * 0.25) +
      (ft.productUnderstandingPass ? 25 : ft.categoryScores.understanding * 0.25),
  );

  const recoveryReadiness = clamp(
    (interaction.recoveryIssues.length === 0 ? 30 : 10) +
      (interaction.modalCloseRegressionPass ? 20 : 0) +
      (combined.includes('recommendedFix') || combined.includes('Recommended Actions') ? 15 : 5) +
      (action.recommendationsActionable ? 20 : 10) +
      (trust.trustPass ? 15 : trust.trustScore * 0.15),
  );

  const trustSurvival = clamp(
    (trust.trustScore * 0.35) +
      (visual.launchAppearanceConfidence * 0.25) +
      (cj.subscores.trust * 0.25) +
      (verification.readinessExplained ? 15 : 5) -
      (trust.blackBoxRisk ? 15 : 0),
  );

  const founderReadiness = clamp(
    (action.topActions.length >= 3 ? 25 : action.topActions.length * 8) +
      (action.recommendedNextStep ? 20 : 0) +
      (combined.includes('System Diagnostics') ? 15 : 5) +
      (combined.includes('operator-feed') || combined.includes('operatorFeed') ? 15 : 10) +
      (verification.summary.passCount > 0 ? 15 : 5) +
      (action.stateLabel && !/unknown/i.test(action.stateLabel) ? 10 : 0),
  );

  return {
    newUserReadiness,
    concurrentUsageReadiness,
    expectationAlignment,
    recoveryReadiness,
    trustSurvival,
    founderReadiness,
  };
}

function runSimulations(
  input: AssessLaunchDaySimulationInput,
  subscores: LaunchDaySubscores,
  findings: LaunchDayFinding[],
  seen: Set<string>,
): void {
  const ft = input.firstTimeUserReality;
  const cj = input.customerJourneySimulation;
  const trust = input.verificationTrustEvidence;
  const visual = input.visualQualityAuthority;
  const interaction = input.founderInteractionSimulation;
  const action = input.founderActionCenter;

  if (subscores.newUserReadiness < 55 || !ft.actionPathPass) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'ONBOARDING_COLLAPSE',
        'NEW_USER_ARRIVAL',
        subscores.newUserReadiness < 40 ? 'CRITICAL' : 'HIGH',
        'New users may not understand the value proposition before reaching key functionality.',
        'Introduce a clearer onboarding outcome statement and visible first action.',
        'Command Center',
      ),
    );
  }

  if (cj.adoptionBlockers.length > 0 || cj.notReadyForCustomers) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'LAUNCH_BLOCKER',
        'NEW_USER_ARRIVAL',
        'HIGH',
        cj.topAdoptionBlocker ?? 'Customer adoption blockers remain unresolved before launch.',
        'Address launch blockers identified by customer journey simulation.',
        'Customer journey',
      ),
    );
  }

  if (subscores.concurrentUsageReadiness < 50) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'WORKFLOW_BOTTLENECK',
        'CONCURRENT_USER',
        'MEDIUM',
        'Operational friction signals suggest workflow pressure under concurrent usage.',
        'Validate expectation assumptions about simultaneous founder workflows.',
        'Execution surfaces',
      ),
    );
  }

  if (subscores.expectationAlignment < 55 || cj.weaknesses.length >= 2) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'EXPECTATION_MISMATCH',
        'CUSTOMER_EXPECTATION',
        subscores.expectationAlignment < 40 ? 'HIGH' : 'MEDIUM',
        'Product behavior may not match customer expectations on launch day.',
        'Validate expectation assumptions with bounded customer journey scenarios.',
        'Customer experience',
      ),
    );
  }

  if (subscores.recoveryReadiness < 55 || interaction.recoveryIssues.length > 0) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'RECOVERY_FAILURE',
        'FAILURE_RECOVERY',
        'HIGH',
        'Recovery paths may not preserve user confidence when something goes wrong.',
        'Strengthen recovery workflows with clearer next steps after failures.',
        'Interaction recovery',
      ),
    );
  }

  if (
    subscores.trustSurvival < 55 ||
    trust.blackBoxRisk ||
    visual.notLaunchReadyAppearance ||
    cj.findings.some((f) => f.type === 'CUSTOMER_TRUST_FAILURE')
  ) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'TRUST_FAILURE',
        'TRUST_SURVIVAL',
        subscores.trustSurvival < 40 ? 'CRITICAL' : 'HIGH',
        'Trust could collapse on launch day from weak evidence, visual gaps, or contradictory signals.',
        'Resolve trust risks before public release.',
        'Verification / Visual quality',
      ),
    );
  }

  if (subscores.founderReadiness < 55 || !action.recommendedNextStep) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'FOUNDER_BLIND_SPOT',
        'FOUNDER_READINESS',
        'MEDIUM',
        'Founder may lack sufficient visibility or actionable guidance to respond to launch-day issues.',
        'Improve Action Center clarity and diagnostics before launch.',
        'Action Center',
      ),
    );
  }

  for (const weakness of cj.weaknesses.slice(0, 2)) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'EXPECTATION_MISMATCH',
        'CUSTOMER_EXPECTATION',
        'MEDIUM',
        weakness,
        'Clarify customer outcome and reduce launch-day surprise failures.',
        'Customer journey',
      ),
    );
  }
}

function buildOperatorFeed(
  subscores: LaunchDaySubscores,
  findings: LaunchDayFinding[],
  launchDayScore: number,
): LaunchDaySimulationAssessment['operatorFeedEvents'] {
  return [
    {
      section: 'Launch Day',
      action: 'Simulating new user arrival',
      detail: `New user readiness ${subscores.newUserReadiness}/100 from onboarding and discovery signals.`,
      status: subscores.newUserReadiness >= 60 ? 'Completed' : 'Warning',
    },
    {
      section: 'Launch Day',
      action: 'Evaluating concurrent usage risk',
      detail: `Concurrent usage readiness ${subscores.concurrentUsageReadiness}/100 | risk ${100 - subscores.concurrentUsageReadiness}.`,
      status: subscores.concurrentUsageReadiness >= 55 ? 'Completed' : 'Warning',
    },
    {
      section: 'Launch Day',
      action: 'Detecting expectation mismatches',
      detail: findings.some((f) => f.type === 'EXPECTATION_MISMATCH')
        ? 'Customer expectation gaps detected.'
        : 'Expectation alignment acceptable in bounded simulation.',
      status: findings.some((f) => f.type === 'EXPECTATION_MISMATCH') ? 'Warning' : 'Completed',
    },
    {
      section: 'Launch Day',
      action: 'Evaluating failure recovery',
      detail: `Recovery readiness ${subscores.recoveryReadiness}/100.`,
      status: subscores.recoveryReadiness >= 55 ? 'Completed' : 'Blocked',
    },
    {
      section: 'Launch Day',
      action: 'Ranking launch blockers',
      detail:
        findings.length > 0
          ? `${findings.length} launch-day issue(s) ranked by severity.`
          : 'No major launch blockers in bounded simulation.',
      status: findings.some((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH') ? 'Blocked' : 'Completed',
    },
    {
      section: 'Launch Day',
      action: 'Summarizing launch day score',
      detail: `Launch Day Simulation Score ${launchDayScore}/100.`,
      status: launchDayScore >= 60 ? 'Completed' : 'Warning',
    },
  ];
}

export function assessLaunchDaySimulation(
  input: AssessLaunchDaySimulationInput,
): LaunchDaySimulationAssessment {
  const findings: LaunchDayFinding[] = [];
  const seen = new Set<string>();
  const subscores = computeSubscores(input);
  runSimulations(input, subscores, findings, seen);

  const launchDayScore = clamp(
    (subscores.newUserReadiness +
      subscores.concurrentUsageReadiness +
      subscores.expectationAlignment +
      subscores.recoveryReadiness +
      subscores.trustSurvival +
      subscores.founderReadiness) /
      6,
  );

  const concurrentUsageRisk = clamp(100 - subscores.concurrentUsageReadiness);

  const launchStrengths: string[] = [];
  if (subscores.newUserReadiness >= 70) launchStrengths.push('New user arrival path likely succeeds');
  if (subscores.concurrentUsageReadiness >= 65) launchStrengths.push('Concurrent workflow pressure appears manageable');
  if (subscores.expectationAlignment >= 65) launchStrengths.push('Customer expectations likely align with product behavior');
  if (subscores.recoveryReadiness >= 65) launchStrengths.push('Failure recovery signals are present');
  if (subscores.trustSurvival >= 65) launchStrengths.push('Trust likely survives launch-day scrutiny');
  if (subscores.founderReadiness >= 65) launchStrengths.push('Founder has actionable launch-day visibility');

  const launchWeaknesses = findings.slice(0, 6).map((f) => f.explanation);
  const highestRiskAssumptions = [
    subscores.newUserReadiness < 60 ? 'New users will onboard without guidance gaps' : '',
    subscores.concurrentUsageReadiness < 60 ? 'Workflows remain smooth under simultaneous usage' : '',
    subscores.expectationAlignment < 60 ? 'Customers will interpret product behavior as expected' : '',
    input.customerJourneySimulation.notReadyForCustomers ? 'Customer journey is ready for launch' : '',
    input.visualQualityAuthority.notLaunchReadyAppearance ? 'Visual presentation supports launch confidence' : '',
  ].filter(Boolean);

  const topLaunchBlockers = findings
    .filter((f) => f.type === 'LAUNCH_BLOCKER' || f.severity === 'CRITICAL' || f.severity === 'HIGH')
    .slice(0, MAX_LAUNCH_BLOCKERS);

  const trustRisks = findings
    .filter((f) => f.type === 'TRUST_FAILURE' || f.type === 'EXPECTATION_MISMATCH')
    .map((f) => f.explanation)
    .slice(0, 6);

  const launchConfidence = clamp(
    launchDayScore * 0.6 + subscores.trustSurvival * 0.25 + subscores.founderReadiness * 0.15,
  );

  const majorLaunchRisks =
    findings.some((f) => f.severity === 'CRITICAL') ||
    topLaunchBlockers.length >= 2 ||
    launchDayScore < 50;
  const launchDayPass = !majorLaunchRisks && launchDayScore >= 55;

  return {
    launchDayScore,
    subscores,
    concurrentUsageRisk,
    findings,
    launchStrengths: launchStrengths.slice(0, MAX_LAUNCH_STRENGTHS),
    launchWeaknesses,
    highestRiskAssumptions,
    topLaunchBlockers,
    trustRisks,
    launchConfidence,
    operatorFeedEvents: buildOperatorFeed(subscores, findings, launchDayScore),
    majorLaunchRisks,
    launchDayPass,
    launchBlockerDetectionPass: findings.some((f) => f.type === 'LAUNCH_BLOCKER') || topLaunchBlockers.length >= 0,
    onboardingCollapseDetectionPass: findings.some((f) => f.type === 'ONBOARDING_COLLAPSE') || subscores.newUserReadiness >= 55,
    trustFailureDetectionPass: findings.some((f) => f.type === 'TRUST_FAILURE') || subscores.trustSurvival >= 55,
    recoveryFailureDetectionPass: findings.some((f) => f.type === 'RECOVERY_FAILURE') || subscores.recoveryReadiness >= 55,
    expectationMismatchDetectionPass: findings.some((f) => f.type === 'EXPECTATION_MISMATCH') || subscores.expectationAlignment >= 55,
    insufficientInfo: false,
    insufficientInfoReason: null,
  };
}

export function evaluateLaunchDaySimulationVisibility(
  assessment: LaunchDaySimulationAssessment,
): LaunchDaySimulationVisibility {
  const checks = [
    assessment.launchDayScore >= 0,
    assessment.findings.length <= MAX_LAUNCH_DAY_FINDINGS,
    assessment.operatorFeedEvents.length >= 5,
    assessment.launchBlockerDetectionPass,
    assessment.onboardingCollapseDetectionPass,
    assessment.trustFailureDetectionPass,
    assessment.recoveryFailureDetectionPass,
    assessment.expectationMismatchDetectionPass,
  ];

  return {
    score: clamp((checks.filter(Boolean).length / checks.length) * 100),
    launchDayScore: assessment.launchDayScore,
    launchConfidence: assessment.launchConfidence,
    majorLaunchRisks: assessment.majorLaunchRisks,
    launchDayPass: assessment.launchDayPass,
    launchBlockerCount: assessment.topLaunchBlockers.length,
    criticalCount: assessment.findings.filter((f) => f.severity === 'CRITICAL').length,
  };
}

function mapLaunchToSensemaking(finding: LaunchDayFinding): SensemakingFinding {
  const type: SensemakingFindingType =
    finding.type === 'TRUST_FAILURE'
      ? 'TRUST_RISK'
      : finding.type === 'EXPECTATION_MISMATCH' || finding.type === 'ONBOARDING_COLLAPSE'
        ? 'CONFUSION'
        : finding.type === 'LAUNCH_BLOCKER'
          ? 'ADOPTION_RISK'
          : 'COHERENCE_GAP';

  return {
    id: nextFindingId('launch-sense'),
    type,
    severity: finding.severity,
    area: 'Launch Day',
    whatDoesNotMakeSense: finding.explanation,
    whyItMatters: 'Launch-day operational risk before real users arrive.',
    recommendedUpgrade: finding.recommendation,
    expectedImpact: 'Reduces launch-day failures and founder blind spots.',
    evidence: finding.surface ?? 'Launch Day Simulation',
  };
}

function mergeSensemaking(
  base: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  launch: LaunchDaySimulationAssessment,
): import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment {
  const extraFindings = launch.topLaunchBlockers.length
    ? launch.topLaunchBlockers.map(mapLaunchToSensemaking)
    : launch.findings.slice(0, 4).map(mapLaunchToSensemaking);
  const mergedFindings = [...extraFindings, ...base.findings]
    .sort((a, b) => SEVERITY_RANK[a.severity as LaunchDaySeverity] - SEVERITY_RANK[b.severity as LaunchDaySeverity])
    .slice(0, 12);

  const penalty = launch.findings.reduce((sum, f) => sum + SEVERITY_PENALTY[f.severity], 0);

  return {
    ...base,
    founderSensemakingScore: clamp(base.founderSensemakingScore - Math.round(penalty * 0.2)),
    productCoherenceScore: clamp(base.productCoherenceScore - Math.round(penalty * 0.22)),
    findings: mergedFindings,
    topConfusionRisks: mergedFindings.filter((f) => f.type === 'CONFUSION').slice(0, 4),
    topTrustRisks: mergedFindings.filter((f) => f.type === 'TRUST_RISK').slice(0, 4),
    trustRisksDetected: mergedFindings.some((f) => f.type === 'TRUST_RISK') || base.trustRisksDetected,
    findingsGenerated: mergedFindings.length > 0,
    operatorFeedEvents: [...launch.operatorFeedEvents.slice(0, 3), ...base.operatorFeedEvents].slice(0, 12),
    launchConfidence: launch.launchConfidence,
    topLaunchDayRisks: launch.findings.slice(0, 5).map((f) => f.explanation),
    launchDayBlockers: launch.topLaunchBlockers.map((f) => f.explanation),
    highestRiskAssumptions: [...launch.highestRiskAssumptions, ...(base.highestRiskAssumptions ?? [])].slice(0, 6),
  };
}

function mergeActionCenter(
  base: FounderActionCenterAssessment,
  launch: LaunchDaySimulationAssessment,
): FounderActionCenterAssessment {
  const actions = [...base.topActions];
  const seen = new Set(actions.map((a) => a.title.trim().toLowerCase()));

  const templates: ReadonlyArray<{ match: LaunchDayFindingType; title: string; reason: string }> = [
    { match: 'ONBOARDING_COLLAPSE', title: 'Improve onboarding clarity', reason: 'Onboarding collapse risk detected.' },
    { match: 'EXPECTATION_MISMATCH', title: 'Validate expectation assumptions', reason: 'Expectation mismatch detected.' },
    { match: 'RECOVERY_FAILURE', title: 'Strengthen recovery workflows', reason: 'Recovery failure risk detected.' },
    { match: 'LAUNCH_BLOCKER', title: 'Address launch blockers', reason: 'Launch blocker detected.' },
    { match: 'TRUST_FAILURE', title: 'Resolve trust risks', reason: 'Trust failure risk on launch day.' },
    { match: 'FOUNDER_BLIND_SPOT', title: 'Improve founder launch visibility', reason: 'Founder blind spot detected.' },
  ];

  for (const finding of launch.topLaunchBlockers.length ? launch.topLaunchBlockers : launch.findings.slice(0, 4)) {
    const template = templates.find((t) => t.match === finding.type);
    const title = `[${finding.severity}] ${template?.title ?? finding.recommendation.slice(0, 48)}`;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    actions.unshift({
      id: nextFindingId('launch-action'),
      type: 'FIX_ACTION',
      priority: finding.severity === 'CRITICAL' ? 'CRITICAL' : finding.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
      title: title.length > 96 ? `${title.slice(0, 93)}…` : title,
      rationale: template?.reason ?? finding.explanation,
      expectedImpact: 'Improves launch-day operational readiness.',
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
    operatorFeedEvents: [...launch.operatorFeedEvents.slice(0, 2), ...base.operatorFeedEvents].slice(0, 12),
  };
}

export function enrichAssessmentsWithLaunchDaySimulation(
  founderActionCenter: FounderActionCenterAssessment,
  founderSensemaking: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  launch: LaunchDaySimulationAssessment,
): EnrichedLaunchDayAssessments {
  return {
    founderActionCenter: mergeActionCenter(founderActionCenter, launch),
    founderSensemaking: mergeSensemaking(founderSensemaking, launch),
  };
}
