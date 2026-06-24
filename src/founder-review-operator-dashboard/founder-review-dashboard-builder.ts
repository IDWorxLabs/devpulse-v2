/**
 * Founder Review Operator Dashboard V1 — payload builder.
 * Aggregates Autonomous Founder Launch Authority outputs for operator visibility only.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AutonomousFounderLaunchAssessment } from '../autonomous-founder-launch-authority/autonomous-founder-launch-authority-types.js';
import {
  FOUNDER_LAUNCH_SUITE_APPS,
  FOUNDER_LAUNCH_USER_LABELS,
} from '../autonomous-founder-launch-authority/autonomous-founder-launch-authority-registry.js';
import { getLastAutonomousFounderLaunchAssessment } from '../autonomous-founder-launch-authority/autonomous-founder-launch-orchestrator.js';
import type {
  EvidenceChainRow,
  EvidenceChainStatus,
  FounderReviewDashboardPayload,
  LaunchReadinessPhaseLabel,
  ReviewerPanelRow,
} from './founder-review-dashboard-types.js';
import {
  FOUNDER_REVIEW_OPERATOR_DASHBOARD_OWNER_MODULE,
} from './founder-review-dashboard-types.js';
import {
  deriveReviewTrendDirection,
  listFounderReviewHistory,
  recordFounderReviewInHistory,
} from './founder-review-history.js';

const REVIEWER_TITLES: Record<string, string> = {
  'senior-engineer': 'Senior Engineer Review',
  qa: 'QA Review',
  ux: 'UX Review',
  product: 'Product Review',
  launch: 'Launch Review',
  founder: 'Founder Review',
};

const EVIDENCE_ROWS: readonly { key: keyof AutonomousFounderLaunchAssessment['evidence']; label: string }[] = [
  { key: 'buildReality', label: 'Build Reality' },
  { key: 'blueprintStructure', label: 'Blueprint Structure' },
  { key: 'blueprintVisual', label: 'Blueprint Visual' },
  { key: 'featureReality', label: 'Feature Reality' },
  { key: 'universalFeatureContract', label: 'Universal Feature Contract' },
  { key: 'engineeringReality', label: 'Engineering Reality' },
  { key: 'launchReadiness', label: 'Founder Authority' },
];

function mapUserPhaseToLabel(
  phase: AutonomousFounderLaunchAssessment['userPhase'] | 'WAITING',
): LaunchReadinessPhaseLabel {
  switch (phase) {
    case 'BUILDING':
      return 'Building';
    case 'TESTING':
      return 'Testing';
    case 'FIXING_ISSUES':
      return 'Fixing Issues';
    case 'FINAL_LAUNCH_REVIEW':
      return 'Final Launch Review';
    case 'LAUNCH_READY':
      return 'Launch Ready';
    case 'LAUNCH_NOT_READY':
    default:
      return 'Launch Blocked';
  }
}

function mapEvidenceStatus(source: {
  available: boolean;
  passed: boolean;
}): EvidenceChainStatus {
  if (!source.available) return 'WAITING';
  return source.passed ? 'PASS' : 'FAIL';
}

function buildWaitingEvidenceChain(): EvidenceChainRow[] {
  return EVIDENCE_ROWS.map((row) => ({
    id: row.key,
    label: row.label,
    status: 'WAITING' as EvidenceChainStatus,
    score: 0,
    blockers: [],
    warnings: [],
  }));
}

function buildEvidenceChain(assessment: AutonomousFounderLaunchAssessment): EvidenceChainRow[] {
  return EVIDENCE_ROWS.map((row) => {
    const source = assessment.evidence[row.key];
    return {
      id: row.key,
      label: row.label,
      status: mapEvidenceStatus(source),
      score: source.score,
      blockers: source.blockers.slice(0, 6),
      warnings: source.warnings.slice(0, 6),
    };
  });
}

function buildReviewerPanel(assessment: AutonomousFounderLaunchAssessment): ReviewerPanelRow[] {
  return assessment.reviewers.map((reviewer) => ({
    role: reviewer.role,
    title: REVIEWER_TITLES[reviewer.role] ?? reviewer.reviewerName,
    score: reviewer.score,
    findings: reviewer.findings.slice(0, 8),
    risks: reviewer.risks.slice(0, 8),
    founderConfidence: reviewer.founderConfidence,
  }));
}

function buildBlockersPanel(assessment: AutonomousFounderLaunchAssessment) {
  const criticalBlockers = [
    ...assessment.evidence.missingPrerequisites,
    ...EVIDENCE_ROWS.flatMap((row) => assessment.evidence[row.key].blockers),
    ...(assessment.remediationPlan?.issues ?? [])
      .filter((issue) => issue.severity === 'CRITICAL' || issue.severity === 'HIGH')
      .map((issue) => issue.summary),
  ].slice(0, 12);

  const warnings = EVIDENCE_ROWS.flatMap((row) => assessment.evidence[row.key].warnings).slice(0, 12);

  const recommendations = assessment.reviewers
    .flatMap((reviewer) => reviewer.findings)
    .slice(0, 12);

  return {
    criticalBlockers: [...new Set(criticalBlockers)],
    warnings: [...new Set(warnings)],
    recommendations: [...new Set(recommendations)],
  };
}

function buildAutoFixPanel(assessment: AutonomousFounderLaunchAssessment) {
  const plan = assessment.remediationPlan;
  const queue = (plan?.issues ?? [])
    .filter((issue) => issue.autofixEligible)
    .map((issue) => issue.summary);
  const remaining = (plan?.issues ?? []).map((issue) => issue.summary);
  const resolvedCount = plan ? Math.max(0, plan.retryAttempt) : 0;
  const resolvedIssues =
    resolvedCount > 0
      ? remaining.slice(0, resolvedCount)
      : ([] as string[]);

  return {
    autofixActive: assessment.verdict === 'NEEDS_AUTOFIX',
    queue,
    resolvedIssues,
    remainingIssues: remaining,
    retryCount: plan?.retryAttempt ?? 0,
    maxRetries: plan?.maxRetries ?? 0,
    remediationPlanId: plan?.planId ?? null,
  };
}

function buildReasoningSummary(assessment: AutonomousFounderLaunchAssessment): string {
  const founder = assessment.reviewers.find((reviewer) => reviewer.role === 'founder');
  const confidence = founder?.founderConfidence ?? assessment.scores.founderScore;
  const parts = [
    `Overall founder score ${assessment.scores.overallFounderScore}/100.`,
    `Verdict: ${assessment.verdict.replaceAll('_', ' ')}.`,
    `Founder confidence ${confidence}/100.`,
  ];
  if (assessment.blocksLaunch && assessment.blocksLaunchReason) {
    parts.push(assessment.blocksLaunchReason);
  }
  if (assessment.evidence.missingPrerequisites.length > 0) {
    parts.push(`Missing: ${assessment.evidence.missingPrerequisites.slice(0, 3).join(', ')}.`);
  }
  return parts.join(' ');
}

function buildCopyReportText(payload: Omit<FounderReviewDashboardPayload, 'copyReportText'>): string {
  const evidenceLines = payload.evidenceChain
    .map((row) => `${row.label}: ${row.status} (${row.score}/100)`)
    .join('\n');
  const reviewerLines = payload.reviewerPanel
    .map((row) => `${row.title}: ${row.score}/100`)
    .join('\n');
  const historyLines = payload.history
    .slice(0, 5)
    .map((entry) => `${entry.generatedAt.slice(0, 10)} — ${entry.productName}: ${entry.overallScore}/100 (${entry.verdict})`)
    .join('\n');

  return `# Founder Review Operator Dashboard

Profile: ${payload.productName}
Phase: ${payload.launchReadiness.currentPhase}
Overall Score: ${payload.launchReadiness.overallScore}/100
Verdict: ${payload.founderVerdict.verdict}
Founder Confidence: ${payload.founderVerdict.founderConfidence}/100

## Evidence Chain

${evidenceLines}

## Reviewer Panel

${reviewerLines}

## Score Breakdown

Engineering: ${payload.scoreBreakdown.engineering}
QA: ${payload.scoreBreakdown.qa}
UX: ${payload.scoreBreakdown.ux}
Product: ${payload.scoreBreakdown.product}
Launch: ${payload.scoreBreakdown.launch}
Founder: ${payload.scoreBreakdown.founder}
Overall: ${payload.scoreBreakdown.overall}

## Blockers

Critical: ${payload.blockers.criticalBlockers.join('; ') || 'None'}
Warnings: ${payload.blockers.warnings.join('; ') || 'None'}

## Founder Verdict Reasoning

${payload.founderVerdict.reasoningSummary}

## Recent History

${historyLines || 'No prior reviews recorded.'}

---
Informational only — Autonomous Founder Launch Authority remains the sole launch decision owner.`;
}

function loadCachedAssessment(rootDir: string, profile: string): AutonomousFounderLaunchAssessment | null {
  const path = join(rootDir, '.autonomous-founder-launch-authority', `${profile}-assessment.json`);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as AutonomousFounderLaunchAssessment;
  } catch {
    return null;
  }
}

function resolveSuiteApp(profile: string) {
  return FOUNDER_LAUNCH_SUITE_APPS.find((app) => app.profile === profile) ?? FOUNDER_LAUNCH_SUITE_APPS[0];
}

function buildWaitingPayload(profile: string, productName: string): FounderReviewDashboardPayload {
  const history = listFounderReviewHistory(profile);
  const base = {
    readOnly: true as const,
    informationalOnly: true as const,
    ownerModule: FOUNDER_REVIEW_OPERATOR_DASHBOARD_OWNER_MODULE,
    profile,
    productName,
    launchReadiness: {
      overallScore: 0,
      currentPhase: 'Building' as LaunchReadinessPhaseLabel,
      userPhase: 'WAITING' as const,
      userLabel: FOUNDER_LAUNCH_USER_LABELS.BUILDING,
    },
    evidenceChain: buildWaitingEvidenceChain(),
    reviewerPanel: [],
    scoreBreakdown: {
      engineering: 0,
      qa: 0,
      ux: 0,
      product: 0,
      launch: 0,
      founder: 0,
      overall: 0,
    },
    blockers: {
      criticalBlockers: ['Waiting for Autonomous Founder Launch Authority assessment'],
      warnings: [],
      recommendations: ['Run the launch review pipeline to populate this dashboard'],
    },
    autoFix: {
      autofixActive: false,
      queue: [],
      resolvedIssues: [],
      remainingIssues: [],
      retryCount: 0,
      maxRetries: 0,
      remediationPlanId: null,
    },
    founderVerdict: {
      verdict: 'WAITING' as const,
      founderConfidence: 0,
      reasoningSummary:
        'No founder review assessment is available yet. This dashboard is informational only and does not perform reviews.',
      blocksLaunch: true,
      blocksLaunchReason: 'Assessment not yet available',
    },
    history,
    trendDirection: deriveReviewTrendDirection(history),
    assessmentAvailable: false,
    sourceAssessment: null,
  };

  return {
    ...base,
    copyReportText: buildCopyReportText(base),
  };
}

export function buildFounderReviewPayload(
  rootDir: string,
  profile?: string | null,
): FounderReviewDashboardPayload {
  const suiteApp = resolveSuiteApp(profile ?? FOUNDER_LAUNCH_SUITE_APPS[0].profile);
  const resolvedProfile = profile ?? suiteApp.profile;

  let assessment =
    loadCachedAssessment(rootDir, resolvedProfile) ??
    (getLastAutonomousFounderLaunchAssessment()?.contractId === resolvedProfile ||
    getLastAutonomousFounderLaunchAssessment()?.productName === suiteApp.productName
      ? getLastAutonomousFounderLaunchAssessment()
      : null);

  if (!assessment && !profile) {
    assessment = getLastAutonomousFounderLaunchAssessment();
  }

  if (!assessment) {
    return buildWaitingPayload(resolvedProfile, suiteApp.productName);
  }

  recordFounderReviewInHistory({ profile: resolvedProfile, assessment });
  const history = listFounderReviewHistory(resolvedProfile);
  const founder = assessment.reviewers.find((reviewer) => reviewer.role === 'founder');

  const base = {
    readOnly: true as const,
    informationalOnly: true as const,
    ownerModule: FOUNDER_REVIEW_OPERATOR_DASHBOARD_OWNER_MODULE,
    profile: resolvedProfile,
    productName: assessment.productName ?? suiteApp.productName,
    launchReadiness: {
      overallScore: assessment.scores.overallFounderScore,
      currentPhase: mapUserPhaseToLabel(assessment.userPhase),
      userPhase: assessment.userPhase,
      userLabel: assessment.userLabel,
    },
    evidenceChain: buildEvidenceChain(assessment),
    reviewerPanel: buildReviewerPanel(assessment),
    scoreBreakdown: {
      engineering: assessment.scores.seniorEngineeringScore,
      qa: assessment.scores.qaScore,
      ux: assessment.scores.uxScore,
      product: assessment.scores.productScore,
      launch: assessment.scores.launchScore,
      founder: assessment.scores.founderScore,
      overall: assessment.scores.overallFounderScore,
    },
    blockers: buildBlockersPanel(assessment),
    autoFix: buildAutoFixPanel(assessment),
    founderVerdict: {
      verdict: assessment.verdict,
      founderConfidence: founder?.founderConfidence ?? assessment.scores.founderScore,
      reasoningSummary: buildReasoningSummary(assessment),
      blocksLaunch: assessment.blocksLaunch,
      blocksLaunchReason: assessment.blocksLaunchReason,
    },
    history,
    trendDirection: deriveReviewTrendDirection(history),
    assessmentAvailable: true,
    sourceAssessment: {
      verdict: assessment.verdict,
      generatedAt: assessment.generatedAt,
      productName: assessment.productName,
      contractId: assessment.contractId,
    },
  };

  return {
    ...base,
    copyReportText: buildCopyReportText(base),
  };
}

export function listFounderReviewSuiteProfiles(): readonly string[] {
  return FOUNDER_LAUNCH_SUITE_APPS.map((app) => app.profile);
}
