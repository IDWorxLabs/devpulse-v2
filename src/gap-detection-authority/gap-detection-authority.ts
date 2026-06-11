/**
 * Gap Detection Authority — deterministic missing-capability evaluation.
 */

import { createHash } from 'node:crypto';
import type { FounderTestV4ReportWithUserSuccess } from '../founder-testing-mode/founder-testing-v4-types.js';
import {
  GAP_DETECTION_BLOCK_SCORE,
  GAP_DETECTION_CACHE_KEY_PREFIX,
  GAP_HIGH_COUNT_BLOCK_THRESHOLD,
  MAX_DETECTED_GAPS,
  MAX_GAP_RECOMMENDATIONS,
} from './gap-detection-bounds.js';
import { recordGapDetectionAssessment } from './gap-detection-history.js';
import { buildGapDetectionReportMarkdown } from './gap-detection-report-builder.js';
import type {
  GapCategory,
  GapDetectionAssessment,
  GapDetectionFinding,
  GapDetectionReadinessState,
  GapImpact,
  GapSeverity,
} from './gap-detection-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function makeFinding(input: {
  id: string;
  category: GapCategory;
  title: string;
  description: string;
  severity: GapSeverity;
  impact: GapImpact;
  evidence: string[];
  recommendations: string[];
}): GapDetectionFinding {
  return {
    ...input,
    evidence: input.evidence.slice(0, 6),
    recommendations: input.recommendations.slice(0, 3),
  };
}

function detectCapabilityGaps(report: FounderTestV4ReportWithUserSuccess): GapDetectionFinding[] {
  const gaps: GapDetectionFinding[] = [];
  const fulfillment = report.promiseFulfillment;
  const buildGoal = report.userSuccessAuthority.scenarioResults.find((scenario) => scenario.id === 'build-goal');

  for (const assessment of fulfillment.promiseAssessments.filter(
    (item) => item.status === 'UNPROVEN' || item.status === 'CONTRADICTED',
  )) {
    if (assessment.promiseId === 'software-creation' || assessment.promiseId === 'helps-create-applications') {
      gaps.push(
        makeFinding({
          id: `capability-${assessment.promiseId}`,
          category: 'CAPABILITY_GAPS',
          title: 'Missing builder capability',
          description: `The product claims "${assessment.promise}" but authority evidence shows ${assessment.status}.`,
          severity: assessment.status === 'CONTRADICTED' ? 'CRITICAL' : 'HIGH',
          impact: 'PRODUCT',
          evidence: [...assessment.supportingEvidence, ...assessment.contradictoryEvidence],
          recommendations: assessment.recommendations,
        }),
      );
    }
  }

  if (buildGoal && !buildGoal.passed) {
    gaps.push(
      makeFinding({
        id: 'capability-build-progress',
        category: 'CAPABILITY_GAPS',
        title: 'Missing connected build capability',
        description: 'Users cannot make meaningful software-creation progress with current bounded execution paths.',
        severity: 'HIGH',
        impact: 'USER_SUCCESS',
        evidence: buildGoal.findings,
        recommendations: buildGoal.recommendations,
      }),
    );
  }

  if (!report.autonomousBuilderReality.canExecuteBuilds) {
    gaps.push(
      makeFinding({
        id: 'capability-runtime-execution',
        category: 'CAPABILITY_GAPS',
        title: 'Missing runtime build capability',
        description: 'Bounded build execution is not connected, so creation workflows cannot complete end-to-end.',
        severity: 'HIGH',
        impact: 'PRODUCT',
        evidence: [
          `Founder Testing: can execute builds — ${report.autonomousBuilderReality.canExecuteBuilds ? 'Yes' : 'No'}`,
          `Founder Testing: autonomous builder score — ${report.autonomousBuilderReality.score}/100`,
        ],
        recommendations: ['Connect bounded build execution before treating software creation as available.'],
      }),
    );
  }

  return gaps;
}

function detectTrustGaps(report: FounderTestV4ReportWithUserSuccess): GapDetectionFinding[] {
  const gaps: GapDetectionFinding[] = [];
  const trust = report.trustAuthority;
  const skeptical = report.skepticalFounderSimulator;

  for (const failure of trust.criticalTrustFailureDetails) {
    gaps.push(
      makeFinding({
        id: `trust-critical-${gaps.length}`,
        category: 'TRUST_GAPS',
        title: 'Missing trust proof capability',
        description: failure,
        severity: 'CRITICAL',
        impact: 'TRUST',
        evidence: trust.findings.slice(0, 4),
        recommendations: trust.recommendations.slice(0, 2),
      }),
    );
  }

  if (!report.verificationResultsVisibility.evidencePresent) {
    gaps.push(
      makeFinding({
        id: 'trust-evidence-visibility',
        category: 'TRUST_GAPS',
        title: 'Missing evidence visibility',
        description: 'Users cannot inspect verification proof that supports product claims.',
        severity: trust.blocksLaunchReadiness ? 'CRITICAL' : 'HIGH',
        impact: 'TRUST',
        evidence: [
          `Founder Testing: verification evidence present — ${report.verificationResultsVisibility.evidencePresent ? 'Yes' : 'No'}`,
          `Trust Authority: trust score — ${trust.trustScore}/100`,
        ],
        recommendations: ['Expose verification evidence and uncertainty before asking for trust.'],
      }),
    );
  }

  if (skeptical.criticalTrustObjection) {
    gaps.push(
      makeFinding({
        id: 'trust-uncertainty-reporting',
        category: 'TRUST_GAPS',
        title: 'Missing uncertainty reporting',
        description: 'Skeptical founder review detected trust claims without sufficient proof or disclosure.',
        severity: 'CRITICAL',
        impact: 'TRUST',
        evidence: skeptical.objections.slice(0, 4),
        recommendations: skeptical.recommendations.slice(0, 2),
      }),
    );
  }

  return gaps;
}

function detectIntelligenceGaps(report: FounderTestV4ReportWithUserSuccess): GapDetectionFinding[] {
  const gaps: GapDetectionFinding[] = [];
  const chat = report.chatIntelligenceReality;
  const problemGoal = report.userSuccessAuthority.scenarioResults.find(
    (scenario) => scenario.id === 'problem-solving-goal',
  );

  if (chat.blocksLaunchReadiness) {
    gaps.push(
      makeFinding({
        id: 'intelligence-bounded-reality',
        category: 'INTELLIGENCE_GAPS',
        title: 'Missing reliable intelligence capability',
        description: 'Chat intelligence fails bounded reality checks required for useful guidance.',
        severity: 'CRITICAL',
        impact: 'INTELLIGENCE',
        evidence: [
          `Chat Intelligence Reality: score — ${chat.chatIntelligenceScore}/100`,
          `Chat Intelligence Reality: failed scenarios — ${chat.failedScenarios.length}`,
        ],
        recommendations: chat.requiredFixesBeforeLaunch.slice(0, 2),
      }),
    );
  }

  if (chat.failedScenarios.length >= 2) {
    gaps.push(
      makeFinding({
        id: 'intelligence-intent-understanding',
        category: 'INTELLIGENCE_GAPS',
        title: 'Missing intent understanding',
        description: 'Chat fails multiple bounded scenarios, indicating weak intent understanding for users.',
        severity: 'HIGH',
        impact: 'INTELLIGENCE',
        evidence: chat.failedScenarios.slice(0, 3).map((scenario) => `[${scenario.prompt}] ${scenario.whyFailed[0] ?? 'Failed'}`),
        recommendations: chat.requiredFixesBeforeLaunch.slice(0, 2),
      }),
    );
  }

  if (problemGoal && !problemGoal.passed) {
    gaps.push(
      makeFinding({
        id: 'intelligence-actionable-guidance',
        category: 'INTELLIGENCE_GAPS',
        title: 'Missing actionable guidance capability',
        description: 'Users cannot reliably solve problems because intelligence output lacks actionable outcomes.',
        severity: 'HIGH',
        impact: 'USER_SUCCESS',
        evidence: problemGoal.findings,
        recommendations: problemGoal.recommendations,
      }),
    );
  }

  return gaps;
}

function detectReadinessGaps(report: FounderTestV4ReportWithUserSuccess): GapDetectionFinding[] {
  const gaps: GapDetectionFinding[] = [];
  const launchPromise = report.promiseFulfillment.promiseAssessments.find(
    (assessment) => assessment.promiseId === 'launch-confidence',
  );
  const launchGoal = report.userSuccessAuthority.scenarioResults.find((scenario) => scenario.id === 'launch-goal');
  const launchAwareness = report.selfAwarenessAuthority.scenarioResults.find(
    (scenario) => scenario.id === 'launch-awareness',
  );

  if (launchPromise?.status === 'CONTRADICTED') {
    gaps.push(
      makeFinding({
        id: 'readiness-launch-proof',
        category: 'READINESS_GAPS',
        title: 'Missing launch readiness proof',
        description: 'Launch-ready claims are contradicted by authority evidence.',
        severity: 'CRITICAL',
        impact: 'LAUNCH',
        evidence: [...launchPromise.supportingEvidence, ...launchPromise.contradictoryEvidence],
        recommendations: launchPromise.recommendations,
      }),
    );
  }

  if (!report.verificationResultsVisibility.readinessExplained) {
    gaps.push(
      makeFinding({
        id: 'readiness-explanation',
        category: 'READINESS_GAPS',
        title: 'Missing readiness explanation capability',
        description: 'Launch readiness cannot be evaluated because readiness is not explained with evidence.',
        severity: 'HIGH',
        impact: 'READINESS',
        evidence: [
          `Founder Testing: readiness explained — ${report.verificationResultsVisibility.readinessExplained ? 'Yes' : 'No'}`,
          `Founder Testing: verdict — ${report.verdict}`,
        ],
        recommendations: report.recommendedFixOrder.slice(0, 2),
      }),
    );
  }

  if ((launchGoal && !launchGoal.passed) || (launchAwareness && !launchAwareness.passed)) {
    gaps.push(
      makeFinding({
        id: 'readiness-blocker-visibility',
        category: 'READINESS_GAPS',
        title: 'Missing launch blocker visibility',
        description: 'Users and founders cannot clearly see what still blocks launch readiness.',
        severity: 'HIGH',
        impact: 'LAUNCH',
        evidence: [
          ...(launchGoal?.findings ?? []),
          ...(launchAwareness?.findings ?? []),
        ],
        recommendations: report.recommendedFixOrder.slice(0, 3),
      }),
    );
  }

  return gaps;
}

function detectProductGaps(report: FounderTestV4ReportWithUserSuccess): GapDetectionFinding[] {
  const gaps: GapDetectionFinding[] = [];
  const understandingGoal = report.userSuccessAuthority.scenarioResults.find(
    (scenario) => scenario.id === 'understanding-goal',
  );
  const ftu = report.firstTimeUserReality;

  if (!ftu.productUnderstandingPass) {
    gaps.push(
      makeFinding({
        id: 'product-onboarding-clarity',
        category: 'PRODUCT_GAPS',
        title: 'Missing onboarding clarity',
        description: 'First-time users may not understand what the product is or why it exists.',
        severity: 'CRITICAL',
        impact: 'PRODUCT',
        evidence: [
          `Founder Testing: first-time user score — ${ftu.firstTimeUserScore}/100`,
          `User Success Authority: understanding goal passed — ${understandingGoal?.passed ? 'Yes' : 'No'}`,
        ],
        recommendations: ftu.recommendedFixes.slice(0, 2),
      }),
    );
  }

  for (const blocker of report.userSuccessAuthority.blockers.slice(0, 4)) {
    gaps.push(
      makeFinding({
        id: `product-user-blocker-${gaps.length}`,
        category: 'PRODUCT_GAPS',
        title: 'Missing user guidance capability',
        description: blocker,
        severity: 'HIGH',
        impact: 'USER_SUCCESS',
        evidence: report.userSuccessAuthority.findings.slice(0, 3),
        recommendations: report.userSuccessAuthority.recommendations.slice(0, 2),
      }),
    );
  }

  if (report.skepticalFounderSimulator.objections.some((item) => item.toLowerCase().includes('purpose'))) {
    gaps.push(
      makeFinding({
        id: 'product-purpose-clarity',
        category: 'PRODUCT_GAPS',
        title: 'Missing product clarity',
        description: 'Skeptical founder review still questions whether users understand product purpose.',
        severity: 'HIGH',
        impact: 'PRODUCT',
        evidence: report.skepticalFounderSimulator.objections.slice(0, 3),
        recommendations: report.skepticalFounderSimulator.recommendations.slice(0, 2),
      }),
    );
  }

  return gaps;
}

function detectDependencyGaps(report: FounderTestV4ReportWithUserSuccess): GapDetectionFinding[] {
  const gaps: GapDetectionFinding[] = [];
  const typecheck = report.repositoryTypecheckReality;
  const dependencyAwareness = report.selfAwarenessAuthority.scenarioResults.find(
    (scenario) => scenario.id === 'dependency-awareness',
  );

  if (typecheck.readinessState === 'TYPECHECK_NOT_RUN') {
    gaps.push(
      makeFinding({
        id: 'dependency-typecheck-baseline',
        category: 'DEPENDENCY_GAPS',
        title: 'Missing repository integrity dependency',
        description: 'Repository compile integrity baseline is not established for launch confidence.',
        severity: 'CRITICAL',
        impact: 'READINESS',
        evidence: typecheck.founderProofNotes.length
          ? typecheck.founderProofNotes.slice(0, 3)
          : [`Repository Typecheck Reality: readiness state — ${typecheck.readinessState}`],
        recommendations: typecheck.recommendations.slice(0, 2),
      }),
    );
  }

  if (report.verificationResultsVisibility.state === 'NO_VERIFICATION_RUN') {
    gaps.push(
      makeFinding({
        id: 'dependency-verification-system',
        category: 'DEPENDENCY_GAPS',
        title: 'Missing verification dependency',
        description: 'Verification subsystem has not produced visible evidence for downstream authorities.',
        severity: 'HIGH',
        impact: 'READINESS',
        evidence: [
          `Founder Testing: verification state — ${report.verificationResultsVisibility.state}`,
          `Founder Testing: evidence present — ${report.verificationResultsVisibility.evidencePresent ? 'Yes' : 'No'}`,
        ],
        recommendations: ['Establish visible verification output before relying on readiness claims.'],
      }),
    );
  }

  if (dependencyAwareness && !dependencyAwareness.passed) {
    gaps.push(
      makeFinding({
        id: 'dependency-authority-coverage',
        category: 'DEPENDENCY_GAPS',
        title: 'Missing authority dependency coverage',
        description: 'Self-awareness review indicates supporting authority dependencies are not fully established.',
        severity: 'MEDIUM',
        impact: 'READINESS',
        evidence: dependencyAwareness.findings,
        recommendations: dependencyAwareness.recommendations,
      }),
    );
  }

  return gaps;
}

const DETECTORS: Record<GapCategory, (report: FounderTestV4ReportWithUserSuccess) => GapDetectionFinding[]> = {
  CAPABILITY_GAPS: detectCapabilityGaps,
  TRUST_GAPS: detectTrustGaps,
  INTELLIGENCE_GAPS: detectIntelligenceGaps,
  READINESS_GAPS: detectReadinessGaps,
  PRODUCT_GAPS: detectProductGaps,
  DEPENDENCY_GAPS: detectDependencyGaps,
};

function calculateGapDetectionScore(findings: GapDetectionFinding[]): number {
  let score = 100;
  for (const gap of findings) {
    switch (gap.severity) {
      case 'CRITICAL':
        score -= 18;
        break;
      case 'HIGH':
        score -= 10;
        break;
      case 'MEDIUM':
        score -= 5;
        break;
      case 'LOW':
        score -= 2;
        break;
    }
  }
  return clamp(score);
}

function deriveReadinessState(
  gapDetectionScore: number,
  criticalGapCount: number,
  highGapCount: number,
  blocksLaunchReadiness: boolean,
): GapDetectionReadinessState {
  if (blocksLaunchReadiness) return 'BLOCKED';
  if (criticalGapCount === 0 && highGapCount <= 1 && gapDetectionScore >= 75) return 'NO_CRITICAL_GAPS';
  if (criticalGapCount === 0 && gapDetectionScore >= 60) return 'GAPS_PRESENT';
  return 'HIGH_RISK_GAPS';
}

function buildCacheKey(findings: GapDetectionFinding[]): string {
  const digest = findings
    .map((gap) => `${gap.id}:${gap.severity}:${gap.impact}`)
    .join('|');
  return `${GAP_DETECTION_CACHE_KEY_PREFIX}:${createHash('sha256').update(digest).digest('hex').slice(0, 16)}`;
}

function dedupeFindings(findings: GapDetectionFinding[]): GapDetectionFinding[] {
  const seen = new Set<string>();
  const unique: GapDetectionFinding[] = [];
  for (const gap of findings) {
    const key = `${gap.category}:${gap.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(gap);
  }
  return unique.slice(0, MAX_DETECTED_GAPS);
}

export function assessGapDetectionAuthority(report: FounderTestV4ReportWithUserSuccess): GapDetectionAssessment {
  const detectedGaps = dedupeFindings(
    (Object.keys(DETECTORS) as GapCategory[]).flatMap((category) => DETECTORS[category](report)),
  );
  const criticalGapCount = detectedGaps.filter((gap) => gap.severity === 'CRITICAL').length;
  const highGapCount = detectedGaps.filter((gap) => gap.severity === 'HIGH').length;
  const gapDetectionScore = calculateGapDetectionScore(detectedGaps);
  const blocksLaunchReadiness =
    criticalGapCount > 0 || highGapCount > GAP_HIGH_COUNT_BLOCK_THRESHOLD || gapDetectionScore < GAP_DETECTION_BLOCK_SCORE;
  const readinessState = deriveReadinessState(gapDetectionScore, criticalGapCount, highGapCount, blocksLaunchReadiness);
  const recommendations = [
    ...new Set(detectedGaps.flatMap((gap) => gap.recommendations)),
  ].slice(0, MAX_GAP_RECOMMENDATIONS);

  const assessment: GapDetectionAssessment = {
    readOnly: true,
    gapDetectionScore,
    totalGaps: detectedGaps.length,
    criticalGapCount,
    highGapCount,
    blocksLaunchReadiness,
    readinessState,
    detectedGaps,
    recommendations,
    cacheKey: buildCacheKey(detectedGaps),
  };

  recordGapDetectionAssessment(assessment);
  return assessment;
}

export function buildGapDetectionAuthorityArtifacts(
  report: FounderTestV4ReportWithUserSuccess,
): {
  gapDetectionAuthority: GapDetectionAssessment;
  gapDetectionAuthorityReportMarkdown: string;
} {
  const gapDetectionAuthority = assessGapDetectionAuthority(report);
  return {
    gapDetectionAuthority,
    gapDetectionAuthorityReportMarkdown: buildGapDetectionReportMarkdown(
      gapDetectionAuthority,
      report.generatedAt,
    ),
  };
}
