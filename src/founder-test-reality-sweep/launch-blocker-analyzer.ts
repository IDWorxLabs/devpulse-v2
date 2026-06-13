/**
 * Founder Test Reality Sweep — launch blocker analysis.
 * Brutally honest: penalties from real blockers, no roadmap credit.
 */

import {
  MAX_COMPETITIVE_GAPS,
  MAX_LAUNCH_BLOCKERS,
  MAX_LAUNCH_RISKS,
  MAX_LAUNCH_STRENGTHS,
  MAX_LAUNCH_WARNINGS,
  MAX_MISSING_CAPABILITIES,
  MAX_NEXT_BUILD_ITEMS,
  MAX_RECOMMENDED_LAUNCH_WORK,
  MAX_TOP_BLOCKERS,
  MAX_TOP_MISSING,
  MAX_TOP_STRENGTHS,
  REALITY_SWEEP_CATEGORY_LABELS,
  SEVERITY_IMPACT_RANK,
  SEVERITY_READINESS_PENALTY,
} from './founder-test-reality-sweep-registry.js';
import type {
  CompetitiveGapEntry,
  FounderLaunchVerdict,
  FounderTestRealitySweepInputSnapshot,
  LaunchBlockerEntry,
  LaunchBlockerSeverity,
  LaunchRecommendation,
  LaunchRiskEntry,
  LaunchStrengthEntry,
  LaunchWarningEntry,
  MissingCapabilityEntry,
  RealitySweepCategory,
  RealitySweepCategoryScore,
  RecommendedLaunchWorkEntry,
} from './founder-test-reality-sweep-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function dedupeStrings(items: string[]): string[] {
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

function mapSeverity(value: string | undefined): LaunchBlockerSeverity {
  if (!value) return 'MEDIUM';
  const upper = value.toUpperCase();
  if (upper === 'CRITICAL' || upper === 'BLOCKER') return 'CRITICAL';
  if (upper === 'HIGH') return 'HIGH';
  if (upper === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
}

function severityFromScore(score: number, criticalThreshold = 40, highThreshold = 55): LaunchBlockerSeverity {
  if (score < criticalThreshold) return 'CRITICAL';
  if (score < highThreshold) return 'HIGH';
  if (score < 70) return 'MEDIUM';
  return 'LOW';
}

let blockerCounter = 0;
let warningCounter = 0;
let strengthCounter = 0;
let capabilityCounter = 0;
let gapCounter = 0;
let riskCounter = 0;
let workCounter = 0;

export function resetLaunchBlockerAnalyzerCountersForTests(): void {
  blockerCounter = 0;
  warningCounter = 0;
  strengthCounter = 0;
  capabilityCounter = 0;
  gapCounter = 0;
  riskCounter = 0;
  workCounter = 0;
}

function nextBlockerId(): string {
  blockerCounter += 1;
  return `launch-blocker-${blockerCounter}`;
}

function nextWarningId(): string {
  warningCounter += 1;
  return `launch-warning-${warningCounter}`;
}

function nextStrengthId(): string {
  strengthCounter += 1;
  return `launch-strength-${strengthCounter}`;
}

function nextCapabilityId(): string {
  capabilityCounter += 1;
  return `missing-capability-${capabilityCounter}`;
}

function nextGapId(): string {
  gapCounter += 1;
  return `competitive-gap-${gapCounter}`;
}

function nextRiskId(): string {
  riskCounter += 1;
  return `launch-risk-${riskCounter}`;
}

function nextWorkId(): string {
  workCounter += 1;
  return `launch-work-${workCounter}`;
}

function pushBlocker(
  blockers: LaunchBlockerEntry[],
  category: RealitySweepCategory,
  severity: LaunchBlockerSeverity,
  title: string,
  explanation: string,
  sourceAuthority: string,
  recommendedAction: string,
): void {
  blockers.push({
    readOnly: true,
    blockerId: nextBlockerId(),
    severity,
    category,
    title,
    explanation,
    sourceAuthority,
    recommendedAction,
    impactRank: SEVERITY_IMPACT_RANK[severity],
  });
}

export function computeCategoryScores(
  snapshot: FounderTestRealitySweepInputSnapshot,
): RealitySweepCategoryScore[] {
  const executionProof = snapshot.founderExecutionProofAssessment?.report;
  const founderTest = snapshot.founderTestAssessment;
  const launchReadiness = snapshot.founderTestLaunchReadinessAssessment?.report;
  const ftu = snapshot.firstTimeUserRealityAssessment;
  const ui = snapshot.uiReviewerAssessment;
  const preview = snapshot.livePreviewRealityAssessment;
  const verification = snapshot.verificationRealityAssessment;
  const interactive = snapshot.interactiveExplanationsEvaluation;
  const competitive = snapshot.competitiveRealityAssessment;
  const council = snapshot.launchCouncilAssessment;

  const executionScore = executionProof
    ? clamp(executionProof.executionCompleteness.overallFounderProofPercent)
    : 0;
  const executionHonest = executionProof?.questionAnswers.founderExecutionProven
    ? executionScore
    : Math.min(executionScore, 45);

  const founderExperienceScore = founderTest ? clamp(founderTest.score.overall) : 0;
  const founderHonest =
    founderTest && (founderTest.verdict === 'BLOCKED' || founderTest.verdict === 'INSUFFICIENT_EVIDENCE')
      ? Math.min(founderExperienceScore, 35)
      : founderExperienceScore;

  const ftuScore = ftu ? clamp(ftu.firstTimeUserScore) : 0;
  const ftuHonest = ftu?.insufficientInfo ? Math.min(ftuScore, 30) : ftuScore;

  const navScore = ui ? clamp(ui.navigationScore) : ftu ? clamp(ftu.categoryScores.navigation) : 0;
  const navHonest =
    ui?.blocksLaunchReadiness || (ftu && !ftu.navigationUnderstandingPass)
      ? Math.min(navScore, 50)
      : navScore;

  const previewScore = preview ? clamp(preview.livePreviewRealityScore) : 0;
  const previewHonest =
    preview && preview.legacyAssessment.state !== 'PREVIEW_READY'
      ? Math.min(previewScore, 48)
      : previewScore;

  const verificationScore = verification ? clamp(verification.verificationRealityScore) : 0;
  const verificationHonest =
    verification && verification.verificationStatus !== 'VERIFICATION_PROVEN'
      ? Math.min(verificationScore, 50)
      : verificationScore;

  const aiScore = interactive ? clamp(interactive.explanationReadiness) : 0;
  const aiHonest =
    interactive && (interactive.state === 'INCOMPLETE' || interactive.state === 'UNKNOWN')
      ? Math.min(aiScore, 40)
      : aiScore;

  const missingCount =
    (founderTest?.missingCapabilities.length ?? 0) +
    (launchReadiness?.topMissingCapabilities.length ?? 0);
  const missingScore = clamp(100 - missingCount * 12);
  const missingHonest = clamp(missingScore - missingCount * 4);

  const councilScore = council ? clamp(council.overallScore) : launchReadiness ? clamp(launchReadiness.founderReadinessScore) : 0;
  const councilHonest =
    council && (council.readinessState === 'BLOCKED' || council.launchBlockerCount > 0)
      ? Math.min(councilScore, 40)
      : councilScore;

  const competitiveScore = competitive ? clamp(competitive.competitiveRealityScore) : 0;
  const competitiveHonest =
    competitive?.majorCompetitiveRisks ? Math.min(competitiveScore, 45) : competitiveScore;

  const categories: RealitySweepCategoryScore[] = [
    {
      readOnly: true,
      category: 'EXECUTION_REALITY',
      label: REALITY_SWEEP_CATEGORY_LABELS.EXECUTION_REALITY,
      score: executionScore,
      honestScore: executionHonest,
      sourceAuthority: 'founder-execution-proof',
      summary: executionProof
        ? `${executionProof.founderExecutionState} at ${executionHonest}%`
        : 'Execution proof not consumed',
      blockersPresent: !executionProof?.questionAnswers.founderExecutionProven,
    },
    {
      readOnly: true,
      category: 'FOUNDER_EXPERIENCE',
      label: REALITY_SWEEP_CATEGORY_LABELS.FOUNDER_EXPERIENCE,
      score: founderExperienceScore,
      honestScore: founderHonest,
      sourceAuthority: 'founder-testing-authority',
      summary: founderTest ? `Founder test ${founderTest.verdict}` : 'Founder test not consumed',
      blockersPresent: (founderTest?.blockers.length ?? 0) > 0,
    },
    {
      readOnly: true,
      category: 'FIRST_TIME_USER_EXPERIENCE',
      label: REALITY_SWEEP_CATEGORY_LABELS.FIRST_TIME_USER_EXPERIENCE,
      score: ftuScore,
      honestScore: ftuHonest,
      sourceAuthority: 'first-time-user-reality',
      summary: ftu
        ? `First-time score ${ftuHonest}/100${ftu.topConfusionRisk ? ` — ${ftu.topConfusionRisk}` : ''}`
        : 'First-time user reality not consumed',
      blockersPresent: (ftu?.findings.filter((f) => f.severity === 'CRITICAL').length ?? 0) > 0,
    },
    {
      readOnly: true,
      category: 'NAVIGATION_REALITY',
      label: REALITY_SWEEP_CATEGORY_LABELS.NAVIGATION_REALITY,
      score: navScore,
      honestScore: navHonest,
      sourceAuthority: 'ui-reviewer-authority',
      summary: ui
        ? `Navigation ${ui.navigationScore}/100 (${ui.readinessState})`
        : ftu
          ? `Navigation proxy ${ftu.categoryScores.navigation}/100`
          : 'Navigation review not consumed',
      blockersPresent: ui?.blocksLaunchReadiness ?? (ftu ? !ftu.navigationUnderstandingPass : true),
    },
    {
      readOnly: true,
      category: 'LIVE_PREVIEW_REALITY',
      label: REALITY_SWEEP_CATEGORY_LABELS.LIVE_PREVIEW_REALITY,
      score: previewScore,
      honestScore: previewHonest,
      sourceAuthority: 'live-preview-reality',
      summary: preview
        ? `${preview.legacyAssessment.state} — ${preview.founderConclusion}`
        : 'Live preview reality not consumed',
      blockersPresent: (preview?.blockers.length ?? 0) > 0,
    },
    {
      readOnly: true,
      category: 'VERIFICATION_REALITY',
      label: REALITY_SWEEP_CATEGORY_LABELS.VERIFICATION_REALITY,
      score: verificationScore,
      honestScore: verificationHonest,
      sourceAuthority: 'verification-reality',
      summary: verification
        ? `${verification.verificationStatus} at ${verificationHonest}/100`
        : 'Verification reality not consumed',
      blockersPresent: (verification?.blockers.filter((b) => b.severity === 'CRITICAL').length ?? 0) > 0,
    },
    {
      readOnly: true,
      category: 'AI_INTERACTION_REALITY',
      label: REALITY_SWEEP_CATEGORY_LABELS.AI_INTERACTION_REALITY,
      score: aiScore,
      honestScore: aiHonest,
      sourceAuthority: 'interactive-explanations',
      summary: interactive
        ? `Explanation state ${interactive.state} (${aiHonest}/100)`
        : 'Interactive explanations not consumed',
      blockersPresent: interactive ? interactive.state === 'INCOMPLETE' || interactive.state === 'UNKNOWN' : true,
    },
    {
      readOnly: true,
      category: 'MISSING_CAPABILITY_REALITY',
      label: REALITY_SWEEP_CATEGORY_LABELS.MISSING_CAPABILITY_REALITY,
      score: missingScore,
      honestScore: missingHonest,
      sourceAuthority: 'founder-testing-authority',
      summary: `${missingCount} missing capabilities detected`,
      blockersPresent: missingCount > 0,
    },
    {
      readOnly: true,
      category: 'LAUNCH_RISK_REALITY',
      label: REALITY_SWEEP_CATEGORY_LABELS.LAUNCH_RISK_REALITY,
      score: councilScore,
      honestScore: councilHonest,
      sourceAuthority: 'launch-council',
      summary: council
        ? `Launch council ${council.readinessState} (${council.launchBlockerCount} blockers)`
        : launchReadiness
          ? `Launch readiness ${launchReadiness.launchReadinessVerdict}`
          : 'Launch risk authorities not consumed',
      blockersPresent: (council?.launchBlockerCount ?? 0) > 0,
    },
    {
      readOnly: true,
      category: 'COMPETITIVE_REALITY',
      label: REALITY_SWEEP_CATEGORY_LABELS.COMPETITIVE_REALITY,
      score: competitiveScore,
      honestScore: competitiveHonest,
      sourceAuthority: 'competitive-reality-engine',
      summary: competitive
        ? `${competitive.competitivePosition} at ${competitiveHonest}/100`
        : 'Competitive reality not consumed',
      blockersPresent: competitive?.majorCompetitiveRisks ?? false,
    },
  ];

  return categories;
}

export function analyzeLaunchBlockers(
  snapshot: FounderTestRealitySweepInputSnapshot,
  categoryScores: RealitySweepCategoryScore[],
): LaunchBlockerEntry[] {
  const blockers: LaunchBlockerEntry[] = [];

  const executionProof = snapshot.founderExecutionProofAssessment?.report;
  if (!executionProof?.questionAnswers.founderExecutionProven) {
    pushBlocker(
      blockers,
      'EXECUTION_REALITY',
      'CRITICAL',
      'Full execution chain not proven',
      executionProof
        ? `Founder execution state: ${executionProof.founderExecutionState}. Missing: ${executionProof.missingProofAreas.join(', ') || 'unknown'}.`
        : 'Founder execution proof not available.',
      'founder-execution-proof',
      'Complete real workspace → build → runtime → preview → verification chain before launch.',
    );
  } else {
    for (const blocker of executionProof.topBlockers.slice(0, 3)) {
      pushBlocker(
        blockers,
        'EXECUTION_REALITY',
        'HIGH',
        'Execution proof blocker',
        blocker,
        'founder-execution-proof',
        executionProof.recommendedNextActions[0] ?? 'Resolve execution proof blockers.',
      );
    }
  }

  const founderTest = snapshot.founderTestAssessment;
  if (founderTest) {
    for (const blocker of founderTest.blockers.slice(0, 4)) {
      pushBlocker(
        blockers,
        'FOUNDER_EXPERIENCE',
        founderTest.verdict === 'BLOCKED' ? 'CRITICAL' : 'HIGH',
        'Founder test blocker',
        blocker,
        'founder-testing-authority',
        founderTest.recommendations[0] ?? 'Resolve founder test blockers.',
      );
    }
  }

  const acceptance = snapshot.founderAcceptanceAssessment;
  if (acceptance?.acceptanceState === 'BLOCKED') {
    pushBlocker(
      blockers,
      'FOUNDER_EXPERIENCE',
      'CRITICAL',
      'Founder acceptance blocked',
      acceptance.reasons.blockingReasons.join('; ') || 'Founder acceptance gate blocked.',
      'founder-acceptance-gate',
      acceptance.reasons.requiredNextActions[0] ?? 'Resolve founder acceptance blockers.',
    );
  }

  const ftu = snapshot.firstTimeUserRealityAssessment;
  if (ftu) {
    for (const finding of ftu.findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').slice(0, 4)) {
      pushBlocker(
        blockers,
        'FIRST_TIME_USER_EXPERIENCE',
        mapSeverity(finding.severity),
        finding.type.replace(/_/g, ' '),
        finding.observedGap,
        'first-time-user-reality',
        finding.recommendedFix,
      );
    }
  }

  const ui = snapshot.uiReviewerAssessment;
  if (ui?.blocksLaunchReadiness) {
    pushBlocker(
      blockers,
      'NAVIGATION_REALITY',
      'CRITICAL',
      'UI blocks launch readiness',
      ui.uiRisks[0] ?? `UI readiness state: ${ui.readinessState}`,
      'ui-reviewer-authority',
      ui.uiRecommendations[0] ?? 'Fix critical UI/navigation failures.',
    );
  } else if (ui && ui.navigationScore < 55) {
    pushBlocker(
      blockers,
      'NAVIGATION_REALITY',
      severityFromScore(ui.navigationScore),
      'Navigation score below launch threshold',
      `Navigation score ${ui.navigationScore}/100.`,
      'ui-reviewer-authority',
      'Improve navigation clarity and discoverability.',
    );
  }

  const preview = snapshot.livePreviewRealityAssessment;
  if (preview) {
    for (const blocker of preview.blockers.slice(0, 4)) {
      pushBlocker(
        blockers,
        'LIVE_PREVIEW_REALITY',
        mapSeverity(blocker.severity),
        'Preview reality blocker',
        blocker.explanation,
        'live-preview-reality',
        blocker.recommendation,
      );
    }
  }

  const verification = snapshot.verificationRealityAssessment;
  if (verification) {
    for (const blocker of verification.blockers.slice(0, 4)) {
      pushBlocker(
        blockers,
        'VERIFICATION_REALITY',
        mapSeverity(blocker.severity),
        'Verification reality blocker',
        blocker.explanation,
        'verification-reality',
        blocker.recommendation,
      );
    }
  }

  const interactive = snapshot.interactiveExplanationsEvaluation;
  if (interactive && (interactive.state === 'INCOMPLETE' || interactive.state === 'UNKNOWN')) {
    pushBlocker(
      blockers,
      'AI_INTERACTION_REALITY',
      interactive.state === 'UNKNOWN' ? 'HIGH' : 'MEDIUM',
      'AI explanations insufficient',
      `Interactive explanation state: ${interactive.state} (${interactive.explanationCoverageScore}/100 coverage).`,
      'interactive-explanations',
      'Improve system/workflow/reasoning explanations so founders understand AiDev responses.',
    );
  }

  const council = snapshot.launchCouncilAssessment;
  if (council && council.readinessState === 'BLOCKED') {
    pushBlocker(
      blockers,
      'LAUNCH_RISK_REALITY',
      'CRITICAL',
      'Launch council blocked',
      council.findings.slice(0, 2).join('; ') || 'Launch council readiness blocked.',
      'launch-council',
      council.recommendations[0] ?? 'Resolve launch council blockers.',
    );
  }

  const competitive = snapshot.competitiveRealityAssessment;
  if (competitive) {
    for (const finding of competitive.findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').slice(0, 3)) {
      pushBlocker(
        blockers,
        'COMPETITIVE_REALITY',
        mapSeverity(finding.severity),
        finding.type.replace(/_/g, ' '),
        finding.explanation,
        'competitive-reality-engine',
        finding.recommendation,
      );
    }
  }

  for (const category of categoryScores.filter((c) => c.honestScore < 45 && c.blockersPresent)) {
    const existing = blockers.some((b) => b.category === category.category);
    if (!existing) {
      pushBlocker(
        blockers,
        category.category,
        'HIGH',
        `${category.label} below launch threshold`,
        category.summary,
        category.sourceAuthority,
        `Raise ${category.label.toLowerCase()} before launch.`,
      );
    }
  }

  return blockers
    .sort((a, b) => a.impactRank - b.impactRank || a.title.localeCompare(b.title))
    .slice(0, MAX_LAUNCH_BLOCKERS);
}

export function analyzeLaunchWarnings(
  snapshot: FounderTestRealitySweepInputSnapshot,
): LaunchWarningEntry[] {
  const warnings: LaunchWarningEntry[] = [];

  const founderTest = snapshot.founderTestAssessment;
  for (const warning of founderTest?.warnings.slice(0, 6) ?? []) {
    warnings.push({
      readOnly: true,
      warningId: nextWarningId(),
      severity: 'MEDIUM',
      category: 'FOUNDER_EXPERIENCE',
      explanation: warning,
      sourceAuthority: 'founder-testing-authority',
    });
  }

  const launchReadiness = snapshot.founderTestLaunchReadinessAssessment?.report;
  for (const warning of launchReadiness?.topWarnings.slice(0, 4) ?? []) {
    warnings.push({
      readOnly: true,
      warningId: nextWarningId(),
      severity: 'MEDIUM',
      category: 'LAUNCH_RISK_REALITY',
      explanation: warning.explanation,
      sourceAuthority: 'founder-test-launch-readiness',
    });
  }

  const executionProof = snapshot.founderExecutionProofAssessment?.report;
  for (const warning of executionProof?.topWarnings.slice(0, 4) ?? []) {
    warnings.push({
      readOnly: true,
      warningId: nextWarningId(),
      severity: 'MEDIUM',
      category: 'EXECUTION_REALITY',
      explanation: warning,
      sourceAuthority: 'founder-execution-proof',
    });
  }

  const ftu = snapshot.firstTimeUserRealityAssessment;
  for (const finding of ftu?.findings.filter((f) => f.severity === 'MEDIUM').slice(0, 4) ?? []) {
    warnings.push({
      readOnly: true,
      warningId: nextWarningId(),
      severity: 'MEDIUM',
      category: 'FIRST_TIME_USER_EXPERIENCE',
      explanation: finding.observedGap,
      sourceAuthority: 'first-time-user-reality',
    });
  }

  return warnings.slice(0, MAX_LAUNCH_WARNINGS);
}

export function analyzeLaunchStrengths(
  snapshot: FounderTestRealitySweepInputSnapshot,
  categoryScores: RealitySweepCategoryScore[],
): LaunchStrengthEntry[] {
  const strengths: LaunchStrengthEntry[] = [];

  for (const category of categoryScores.filter((c) => c.honestScore >= 75 && !c.blockersPresent)) {
    strengths.push({
      readOnly: true,
      strengthId: nextStrengthId(),
      category: category.category,
      explanation: `${category.label} strong at ${category.honestScore}/100 — ${category.summary}`,
      sourceAuthority: category.sourceAuthority,
      evidenceScore: category.honestScore,
    });
  }

  const executionProof = snapshot.founderExecutionProofAssessment?.report;
  for (const evidence of executionProof?.topEvidence.slice(0, 4) ?? []) {
    strengths.push({
      readOnly: true,
      strengthId: nextStrengthId(),
      category: 'EXECUTION_REALITY',
      explanation: evidence,
      sourceAuthority: 'founder-execution-proof',
      evidenceScore: executionProof?.founderExecutionScore ?? 0,
    });
  }

  const ftu = snapshot.firstTimeUserRealityAssessment;
  for (const strength of ftu?.strengths.slice(0, 4) ?? []) {
    strengths.push({
      readOnly: true,
      strengthId: nextStrengthId(),
      category: 'FIRST_TIME_USER_EXPERIENCE',
      explanation: strength,
      sourceAuthority: 'first-time-user-reality',
      evidenceScore: ftu?.firstTimeUserScore ?? 0,
    });
  }

  const competitive = snapshot.competitiveRealityAssessment;
  for (const advantage of competitive?.strongestCompetitiveAdvantages.slice(0, 3) ?? []) {
    strengths.push({
      readOnly: true,
      strengthId: nextStrengthId(),
      category: 'COMPETITIVE_REALITY',
      explanation: advantage,
      sourceAuthority: 'competitive-reality-engine',
      evidenceScore: competitive?.competitiveRealityScore ?? 0,
    });
  }

  return strengths
    .sort((a, b) => b.evidenceScore - a.evidenceScore)
    .slice(0, MAX_LAUNCH_STRENGTHS);
}

export function analyzeMissingCapabilities(
  snapshot: FounderTestRealitySweepInputSnapshot,
): MissingCapabilityEntry[] {
  const entries: MissingCapabilityEntry[] = [];

  const founderTest = snapshot.founderTestAssessment;
  for (const capability of founderTest?.missingCapabilities.slice(0, 8) ?? []) {
    entries.push({
      readOnly: true,
      capabilityId: nextCapabilityId(),
      capability,
      category: 'MISSING_CAPABILITY_REALITY',
      sourceAuthority: 'founder-testing-authority',
      launchImpact: 'HIGH',
    });
  }

  const launchReadiness = snapshot.founderTestLaunchReadinessAssessment?.report;
  for (const capability of launchReadiness?.topMissingCapabilities.slice(0, 6) ?? []) {
    entries.push({
      readOnly: true,
      capabilityId: nextCapabilityId(),
      capability,
      category: 'MISSING_CAPABILITY_REALITY',
      sourceAuthority: 'founder-test-launch-readiness',
      launchImpact: 'MEDIUM',
    });
  }

  const verification = snapshot.verificationRealityAssessment;
  for (const missing of verification?.missingEvidence.slice(0, 4) ?? []) {
    entries.push({
      readOnly: true,
      capabilityId: nextCapabilityId(),
      capability: missing,
      category: 'VERIFICATION_REALITY',
      sourceAuthority: 'verification-reality',
      launchImpact: 'HIGH',
    });
  }

  return dedupeStrings(entries.map((e) => e.capability))
    .map((capability, index) => {
      const source = entries.find((e) => e.capability === capability)!;
      return { ...source, capabilityId: `missing-capability-${index + 1}` };
    })
    .slice(0, MAX_MISSING_CAPABILITIES);
}

export function analyzeCompetitiveGaps(
  snapshot: FounderTestRealitySweepInputSnapshot,
): CompetitiveGapEntry[] {
  const competitive = snapshot.competitiveRealityAssessment;
  if (!competitive) return [];

  const gaps: CompetitiveGapEntry[] = [];
  for (const gap of competitive.competitiveBlindSpots.slice(0, 4)) {
    gaps.push({
      readOnly: true,
      gapId: nextGapId(),
      gap,
      sourceAuthority: 'competitive-reality-engine',
      severity: 'HIGH',
    });
  }
  for (const risk of competitive.highReplacementRisks.slice(0, 4)) {
    gaps.push({
      readOnly: true,
      gapId: nextGapId(),
      gap: risk,
      sourceAuthority: 'competitive-reality-engine',
      severity: 'MEDIUM',
    });
  }
  for (const claim of competitive.unprovenCompetitiveClaims.slice(0, 3)) {
    gaps.push({
      readOnly: true,
      gapId: nextGapId(),
      gap: `Unproven claim: ${claim}`,
      sourceAuthority: 'competitive-reality-engine',
      severity: 'MEDIUM',
    });
  }

  return gaps.slice(0, MAX_COMPETITIVE_GAPS);
}

export function analyzeTopLaunchRisks(
  blockers: LaunchBlockerEntry[],
  snapshot: FounderTestRealitySweepInputSnapshot,
): LaunchRiskEntry[] {
  const risks: LaunchRiskEntry[] = [];

  for (const blocker of blockers.filter((b) => b.severity === 'CRITICAL' || b.severity === 'HIGH').slice(0, 6)) {
    risks.push({
      readOnly: true,
      riskId: nextRiskId(),
      risk: blocker.title,
      category: blocker.category,
      severity: blocker.severity,
      sourceAuthority: blocker.sourceAuthority,
    });
  }

  const competitive = snapshot.competitiveRealityAssessment;
  for (const risk of competitive?.highReplacementRisks.slice(0, 3) ?? []) {
    risks.push({
      readOnly: true,
      riskId: nextRiskId(),
      risk,
      category: 'COMPETITIVE_REALITY',
      severity: 'HIGH',
      sourceAuthority: 'competitive-reality-engine',
    });
  }

  return risks.slice(0, MAX_LAUNCH_RISKS);
}

export function analyzeRecommendedLaunchWork(
  blockers: LaunchBlockerEntry[],
  snapshot: FounderTestRealitySweepInputSnapshot,
): RecommendedLaunchWorkEntry[] {
  const work: RecommendedLaunchWorkEntry[] = [];

  for (const blocker of blockers.slice(0, 8)) {
    work.push({
      readOnly: true,
      workId: nextWorkId(),
      action: blocker.recommendedAction,
      category: blocker.category,
      priorityScore: 100 - blocker.impactRank * 20,
      sourceAuthority: blocker.sourceAuthority,
      founderImpact: blocker.explanation,
    });
  }

  const launchReadiness = snapshot.founderTestLaunchReadinessAssessment?.report;
  for (const action of launchReadiness?.topRecommendedActions.slice(0, 4) ?? []) {
    work.push({
      readOnly: true,
      workId: nextWorkId(),
      action: action.action,
      category: 'LAUNCH_RISK_REALITY',
      priorityScore: action.priorityScore,
      sourceAuthority: action.sourceAuthority,
      founderImpact: action.founderImpact.toString(),
    });
  }

  const executionProof = snapshot.founderExecutionProofAssessment?.report;
  for (const action of executionProof?.recommendedNextActions.slice(0, 3) ?? []) {
    work.push({
      readOnly: true,
      workId: nextWorkId(),
      action,
      category: 'EXECUTION_REALITY',
      priorityScore: 85,
      sourceAuthority: 'founder-execution-proof',
      founderImpact: 'Unblocks execution proof for launch.',
    });
  }

  return work
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, MAX_RECOMMENDED_LAUNCH_WORK);
}

export function computeHonestLaunchReadinessPercent(
  categoryScores: RealitySweepCategoryScore[],
  blockers: LaunchBlockerEntry[],
): number {
  if (categoryScores.length === 0) return 0;

  const honestScores = categoryScores.map((c) => c.honestScore);
  const minCategory = Math.min(...honestScores);
  const avgHonest = honestScores.reduce((sum, v) => sum + v, 0) / honestScores.length;

  let base = clamp(minCategory * 0.55 + avgHonest * 0.45);

  for (const blocker of blockers) {
    base -= SEVERITY_READINESS_PENALTY[blocker.severity];
  }

  const criticalCount = blockers.filter((b) => b.severity === 'CRITICAL').length;
  if (criticalCount > 0) {
    base = Math.min(base, 55 - criticalCount * 8);
  }

  return clamp(base);
}

export function deriveFounderLaunchVerdict(
  launchReadinessPercent: number,
  blockers: LaunchBlockerEntry[],
  snapshot: FounderTestRealitySweepInputSnapshot,
): FounderLaunchVerdict {
  const missingCount = snapshot.missingAuthorities.length;
  const consumedCount = REQUIRED_CONSUMED_COUNT - missingCount;

  if (consumedCount < 4) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  const criticalBlockers = blockers.filter((b) => b.severity === 'CRITICAL');
  if (
    criticalBlockers.length > 0 ||
    snapshot.founderAcceptanceAssessment?.acceptanceState === 'BLOCKED' ||
    snapshot.launchCouncilAssessment?.readinessState === 'BLOCKED'
  ) {
    return 'BLOCK_LAUNCH';
  }

  if (launchReadinessPercent >= 82 && blockers.filter((b) => b.severity === 'HIGH').length === 0) {
    return 'READY_TO_LAUNCH';
  }

  if (launchReadinessPercent >= 68 && criticalBlockers.length === 0) {
    return 'READY_WITH_WARNINGS';
  }

  return 'NOT_READY_TO_LAUNCH';
}

const REQUIRED_CONSUMED_COUNT = 11;

export function deriveLaunchRecommendation(verdict: FounderLaunchVerdict): LaunchRecommendation {
  switch (verdict) {
    case 'READY_TO_LAUNCH':
      return 'RECOMMEND_LAUNCH';
    case 'READY_WITH_WARNINGS':
      return 'RECOMMEND_LAUNCH_WITH_WARNINGS';
    case 'BLOCK_LAUNCH':
      return 'BLOCK_LAUNCH';
    case 'INSUFFICIENT_EVIDENCE':
      return 'INSUFFICIENT_EVIDENCE';
    default:
      return 'DO_NOT_RECOMMEND_LAUNCH';
  }
}

export function rankTopBlockers(blockers: LaunchBlockerEntry[]): LaunchBlockerEntry[] {
  return [...blockers].slice(0, MAX_TOP_BLOCKERS);
}

export function rankTopStrengths(strengths: LaunchStrengthEntry[]): LaunchStrengthEntry[] {
  return [...strengths].slice(0, MAX_TOP_STRENGTHS);
}

export function rankTopMissingCapabilities(
  capabilities: MissingCapabilityEntry[],
): MissingCapabilityEntry[] {
  return [...capabilities].slice(0, MAX_TOP_MISSING);
}

export function rankMostImportantNextBuildItems(
  work: RecommendedLaunchWorkEntry[],
): RecommendedLaunchWorkEntry[] {
  return [...work].slice(0, MAX_NEXT_BUILD_ITEMS);
}
