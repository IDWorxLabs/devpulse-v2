/**
 * Founder Sensemaking Authority — detects confusion, contradictions, and coherence gaps.
 */

import type { ChangeIntelligenceVisibilityAssessment } from '../change-intelligence-visibility/change-intelligence-visibility-types.js';
import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { LivePreviewRealityAssessment } from '../live-preview-reality/live-preview-reality-types.js';
import type { RunningApplicationVisibilityAssessment } from '../running-application-visibility/running-application-visibility-types.js';
import type { VerificationResultsVisibilityAssessment } from '../verification-results-visibility/verification-results-visibility-types.js';
import { verificationTrustEvidenceResolved } from '../verification-trust-evidence/index.js';
import { founderFrictionHeatmapResolved } from '../founder-friction-heatmap/index.js';
import { assessProjectIntelligenceClarity } from '../founder-testing-mode/project-intelligence-clarity.js';
import type { LaunchReadinessReality } from '../founder-testing-mode/founder-testing-v4-types.js';
import type {
  FounderSensemakingAssessment,
  SensemakingFeedEvent,
  SensemakingFinding,
  SensemakingFindingType,
  SensemakingSeverity,
  SensemakingUpgrade,
} from './founder-sensemaking-types.js';

const MAX_FINDINGS = 12;
const MAX_UPGRADES = 8;
const ARCH_LEAK = /\b(ownership registry|devpulse_v2|chain-of-thought|inner monologue|validator script)\b/i;

const SEVERITY_PENALTY: Record<SensemakingSeverity, number> = {
  CRITICAL: 18,
  HIGH: 12,
  MEDIUM: 7,
  LOW: 3,
};

const NAV_OVERLAP_PAIRS: ReadonlyArray<{ a: string; b: string; detail: string }> = [
  {
    a: 'Projects',
    b: 'Project Insights',
    detail: 'Both surfaces summarize project status — founders may not know which to open first.',
  },
  {
    a: 'Live Preview',
    b: 'Running Application',
    detail: 'Preview and running application both describe what is executing — labels may blur.',
  },
  {
    a: 'Verification',
    b: 'System Diagnostics',
    detail: 'Verification and diagnostics can feel like the same troubleshooting destination.',
  },
  {
    a: 'Action Center',
    b: 'Project Insights',
    detail: 'Recommended actions appear in both Action Center and Insights — guidance may duplicate.',
  },
];

let findingIdCounter = 0;

function nextFindingId(prefix: string): string {
  findingIdCounter += 1;
  return `${prefix}-${findingIdCounter}`;
}

export function resetFounderSensemakingCounterForTests(): void {
  findingIdCounter = 0;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function pushFinding(
  bucket: SensemakingFinding[],
  seen: Set<string>,
  finding: Omit<SensemakingFinding, 'id'> & { id?: string },
): void {
  const key = `${finding.type}:${finding.whatDoesNotMakeSense.trim().toLowerCase()}`;
  if (seen.has(key) || bucket.length >= MAX_FINDINGS) return;
  seen.add(key);
  bucket.push({ ...finding, id: finding.id ?? nextFindingId('sense') });
}

function severityRank(s: SensemakingSeverity): number {
  return { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[s];
}

function sortFindings(findings: SensemakingFinding[]): SensemakingFinding[] {
  return [...findings].sort((a, b) => {
    const sr = severityRank(a.severity) - severityRank(b.severity);
    if (sr !== 0) return sr;
    return a.type.localeCompare(b.type);
  });
}

function buildOperatorFeed(findings: SensemakingFinding[], upgrades: SensemakingUpgrade[]): SensemakingFeedEvent[] {
  const events: SensemakingFeedEvent[] = [
    {
      section: 'Sensemaking',
      action: 'Analyzing founder experience',
      detail: 'Reviewing whether the product story, navigation, and reports make sense together.',
      status: 'Active',
    },
    {
      section: 'Sensemaking',
      action: 'Detecting contradictions',
      detail: 'Comparing readiness signals across Insights, Verification, and Action Center.',
      status: 'Active',
    },
    {
      section: 'Sensemaking',
      action: 'Detecting confusion risks',
      detail: 'Checking terminology, screen purpose, and Memory vs Insights clarity.',
      status: 'Active',
    },
    {
      section: 'Sensemaking',
      action: 'Evaluating trust',
      detail: 'Looking for conflicting scores and unexplained readiness changes.',
      status: 'Active',
    },
    {
      section: 'Sensemaking',
      action: 'Ranking coherence issues',
      detail: `Ranked ${findings.length} coherence finding(s) by founder impact.`,
      status: findings.length ? 'Warning' : 'Completed',
      evidence: findings[0]?.evidence,
    },
    {
      section: 'Sensemaking',
      action: 'Generating upgrade recommendations',
      detail:
        upgrades.length > 0
          ? `Top upgrade: ${upgrades[0].title}`
          : 'No urgent coherence upgrades from current product state.',
      status: upgrades.length ? 'Completed' : 'Completed',
      evidence: upgrades[0]?.detail,
    },
  ];
  return events.slice(0, 8);
}

function computeScores(findings: SensemakingFinding[]): { founderSensemakingScore: number; productCoherenceScore: number } {
  const penalty = findings.reduce((s, f) => s + SEVERITY_PENALTY[f.severity], 0);
  const contradictionPenalty = findings.filter((f) => f.type === 'CONTRADICTION' || f.type === 'PROMISE_CONFLICT').length * 4;
  const founderSensemakingScore = clamp(100 - penalty);
  const productCoherenceScore = clamp(100 - penalty - contradictionPenalty);
  return { founderSensemakingScore, productCoherenceScore };
}

function buildUpgrades(findings: SensemakingFinding[]): SensemakingUpgrade[] {
  const upgrades: SensemakingUpgrade[] = [];
  const seen = new Set<string>();
  for (const f of sortFindings(findings)) {
    const key = f.recommendedUpgrade.trim().toLowerCase();
    if (seen.has(key) || upgrades.length >= MAX_UPGRADES) continue;
    seen.add(key);
    upgrades.push({
      priority: f.severity,
      title: f.recommendedUpgrade,
      detail: f.whatDoesNotMakeSense,
      expectedImpact: f.expectedImpact,
      relatedFindingIds: [f.id],
    });
  }
  return upgrades;
}

function extractNavLabels(html: string): string[] {
  const labels: string[] = [];
  const re = /class="nav-label"[^>]*>([^<]+)</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    labels.push(m[1].trim());
  }
  if (html.includes('Action Center')) labels.push('Action Center');
  if (html.includes('Product Coherence')) labels.push('Product Coherence');
  return labels;
}

export interface FounderSensemakingShellSources {
  appJs: string;
  html: string;
}

export interface FounderSensemakingWorkspaceInput {
  projectMemory: {
    vaultState: { projectCount: number; factCount: number };
    nextSuggestedActions: string[];
  };
  livePreview: { reality: LivePreviewRealityAssessment; statusLabel: string };
  runningApplication: RunningApplicationVisibilityAssessment;
  verificationResults: VerificationResultsVisibilityAssessment;
  changeIntelligence: Pick<ChangeIntelligenceVisibilityAssessment, 'impactSummary'>;
  founderActionCenter: FounderActionCenterAssessment;
  verification: { readiness: string; readinessLabel: string };
  autonomousBuilder: { executionConnected: boolean; readinessLabel: string };
  portfolioInsights: {
    summary: { verificationReady: number; healthy: number; atRisk: number; previewAvailable: number };
    recommendedActions: string[];
  };
  shellSources?: FounderSensemakingShellSources;
}

export interface FounderSensemakingV4Context {
  launchReadinessReality?: LaunchReadinessReality;
  verdict?: string;
  humanReadiness?: number;
  previewRealityScore?: number;
}

export function assessFounderSensemaking(
  input: FounderSensemakingWorkspaceInput,
  v4Context?: FounderSensemakingV4Context,
): FounderSensemakingAssessment {
  const findings: SensemakingFinding[] = [];
  const seen = new Set<string>();
  const { shellSources } = input;

  const add = (
    type: SensemakingFindingType,
    severity: SensemakingSeverity,
    area: string,
    what: string,
    why: string,
    upgrade: string,
    impact: string,
    evidence: string,
  ) => {
    if (ARCH_LEAK.test(`${what} ${why} ${evidence}`)) return;
    pushFinding(findings, seen, {
      type,
      severity,
      area,
      whatDoesNotMakeSense: what,
      whyItMatters: why,
      recommendedUpgrade: upgrade,
      expectedImpact: impact,
      evidence,
    });
  };

  if (shellSources) {
    const clarity = assessProjectIntelligenceClarity(shellSources);
    if (!clarity.passed || clarity.confusionSeverity === 'HIGH' || clarity.confusionSeverity === 'CRITICAL') {
      add(
        'CONFUSION',
        clarity.confusionSeverity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        'UI Sensemaking',
        clarity.issues[0] ?? 'Project Memory and Project Insights may look like the same destination.',
        'Founders cannot explain what each intelligence surface is for within the first minute.',
        'Strengthen Memory vs Insights positioning and cross-links.',
        'Reduces navigation confusion and improves trust in recommendations.',
        clarity.checks.filter((c) => !c.passed).map((c) => c.detail).join('; ') || 'clarity assessment failed',
      );
    } else if (clarity.confusionSeverity === 'MEDIUM') {
      add(
        'CONFUSION',
        'MEDIUM',
        'UI Sensemaking',
        clarity.issues[0] ?? 'Minor clarity gap between Memory and Insights.',
        'Recoverable confusion may still slow first-time founders.',
        'Polish sidebar help and hero cards for Memory and Insights.',
        'Improves explainability without restructuring navigation.',
        clarity.issues.join('; ') || 'medium clarity',
      );
    }

    const navLabels = extractNavLabels(shellSources.html);
    for (const pair of NAV_OVERLAP_PAIRS) {
      if (navLabels.includes(pair.a) && navLabels.includes(pair.b)) {
        add(
          'REDUNDANCY',
          'MEDIUM',
          'Navigation Sensemaking',
          `${pair.a} and ${pair.b} may overlap for founders.`,
          pair.detail,
          `Clarify when to use ${pair.a} vs ${pair.b} in nav help and first-screen copy.`,
          'Founders pick the right surface faster with less duplicate reading.',
          `Nav labels present: ${pair.a}, ${pair.b}`,
        );
      }
    }

    if (
      shellSources.appJs.includes('verification-surface') &&
      shellSources.appJs.includes('System Diagnostics') &&
      !/advanced|internal/i.test(shellSources.html)
    ) {
      add(
        'COHERENCE_GAP',
        'MEDIUM',
        'UI Sensemaking',
        'Verification surface references System Diagnostics without marking it advanced.',
        'Founders may think diagnostics are required for everyday quality checks.',
        'Mark diagnostics as advanced and separate from product verification readiness.',
        'Keeps verification focused on launch confidence, not internal tooling.',
        'System Diagnostics referenced in verification renderer',
      );
    }

    if (!verificationTrustEvidenceResolved('trust-section-visible', shellSources)) {
      add(
        'TRUST_RISK',
        'HIGH',
        'Verification Sensemaking',
        'Verification results may feel like a black box without a Trust & Evidence section.',
        'Founders cannot explain why Verification passed or failed.',
        'Add Verification Trust & Evidence with summary, evidence, scope limits, and next steps.',
        'Improves explainability and launch decision confidence.',
        'verification-trust-evidence section missing from Verification surface',
      );
    } else if (!verificationTrustEvidenceResolved('confidence-explained', shellSources)) {
      add(
        'TRUST_RISK',
        'MEDIUM',
        'Verification Sensemaking',
        'Verification confidence is shown without a plain-language explanation.',
        'Unexplained confidence scores feel arbitrary to first-time founders.',
        'Add Confidence explanation on the Verification Summary card.',
        'Founders can judge how much to trust pass/warn/fail results.',
        'Confidence explanation missing from Verification Trust section',
      );
    } else if (!verificationTrustEvidenceResolved('next-steps-scenario', shellSources)) {
      add(
        'TRUST_RISK',
        'MEDIUM',
        'Verification Sensemaking',
        'Verification completes without clear recommended next steps.',
        'Founders stall after pass/fail without knowing what to do next.',
        'Add pass/warn/fail founder guidance with recommended next steps.',
        'Turns verification into an actionable workflow.',
        'Founder guidance missing after verification run',
      );
    }

    if (!founderFrictionHeatmapResolved('heatmap-visible', shellSources)) {
      add(
        'TRUST_RISK',
        'HIGH',
        'Friction Sensemaking',
        'Founder friction may exist but is not ranked in a heatmap.',
        'Teams cannot see where founders get stuck, confused, or abandon workflows.',
        'Add Founder Friction Heatmap with ranked friction areas and confusion hotspots.',
        'Surfaces UX priorities from existing reality engines without new telemetry.',
        'founder-friction-heatmap section missing from Product Coherence',
      );
    } else if (!founderFrictionHeatmapResolved('ux-improvements', shellSources)) {
      add(
        'COHERENCE_GAP',
        'MEDIUM',
        'Friction Sensemaking',
        'Friction heatmap lacks actionable UX improvement recommendations.',
        'Findings without recommendations are harder to prioritize.',
        'Add Recommended UX Improvements to the heatmap summary.',
        'Connects friction discovery to concrete product fixes.',
        'Recommended UX Improvements missing from heatmap',
      );
    }
  }

  const vr = input.verificationResults;
  const portfolio = input.portfolioInsights;
  const insightsSaysReady = portfolio.summary.verificationReady > 0;
  const verificationSaysReady = vr.betaReady || vr.launchReady;

  if (insightsSaysReady && !verificationSaysReady && vr.state !== 'NO_VERIFICATION_RUN') {
    add(
      'CONTRADICTION',
      'HIGH',
      'Report Consistency',
      'Project Insights highlights verification-ready projects while Verification reports insufficient launch readiness.',
      'Founders receive conflicting guidance about whether the product is beta-ready.',
      'Create a unified readiness explanation that links Insights portfolio counts to Verification results.',
      'Reduces conflicting readiness signals and improves decision confidence.',
      `Insights verificationReady=${portfolio.summary.verificationReady}; Verification betaReady=${vr.betaReady}; launchReady=${vr.launchReady}`,
    );
  }

  if (v4Context?.launchReadinessReality && vr.state !== 'NO_VERIFICATION_RUN') {
    const human = v4Context.launchReadinessReality.humanReadiness;
    const exec = v4Context.launchReadinessReality.executionReadiness;
    if (human >= 75 && exec < 50) {
      add(
        'TRUST_RISK',
        'HIGH',
        'Score Sensemaking',
        `Human readiness (${human}) is strong while execution readiness (${exec}) is weak.`,
        'Founders may trust the product feels ready when execution reality is not connected.',
        'Explain the human vs execution readiness split on Insights and Verification surfaces.',
        'Prevents over-confidence before autonomous execution is wired.',
        `humanReadiness=${human}; executionReadiness=${exec}`,
      );
    }
    if (human < 60 && v4Context.verdict === 'READY_FOR_PUBLIC_BETA') {
      add(
        'CONTRADICTION',
        'CRITICAL',
        'Report Consistency',
        `Founder Testing verdict is ${v4Context.verdict} while human readiness is only ${human}.`,
        'Public beta messaging may outpace actual founder comprehension scores.',
        'Align verdict copy with human readiness thresholds or document why beta is still appropriate.',
        'Protects launch credibility when human scores lag technical scores.',
        `verdict=${v4Context.verdict}; humanReadiness=${human}`,
      );
    }
  }

  if (!input.autonomousBuilder.executionConnected) {
    add(
      'PROMISE_CONFLICT',
      'HIGH',
      'Product Narrative',
      'Product brand promises autonomous development while Autonomous Builder reports execution is not connected.',
      'Founders expect end-to-end autonomous builds but must still drive execution manually.',
      'Keep autonomous promises paired with honest execution-connected status on Builder and Command Center.',
      'Sets accurate expectations and reduces disappointment after onboarding.',
      `executionConnected=false; readinessLabel=${input.autonomousBuilder.readinessLabel}`,
    );
  }

  const fac = input.founderActionCenter;
  if (
    fac.state === 'NO_ACTIONS' &&
    (vr.summary.failCount > 0 || vr.summary.blockedCount > 0) &&
    !fac.insufficientInfo
  ) {
    add(
      'DEAD_END',
      'HIGH',
      'Workflow Sensemaking',
      'Verification reports failures or blockers but Action Center shows no recommended next step.',
      'Founders hit failures without an obvious continuation path.',
      'Surface verification failures as prioritized Action Center items with rationale.',
      'Turns test results into actionable workflow instead of a dead end.',
      `failCount=${vr.summary.failCount}; blockedCount=${vr.summary.blockedCount}; actionCenterState=${fac.state}`,
    );
  }

  if (
    input.livePreview.reality.state === 'NO_PREVIEW' &&
    portfolio.summary.previewAvailable > 0
  ) {
    add(
      'CONTRADICTION',
      'MEDIUM',
      'Report Consistency',
      'Portfolio Insights counts preview-available projects while Live Preview reports no active preview.',
      'Founders may believe a preview is running when none is connected.',
      'Link portfolio preview counts to Live Preview reality state with honest idle messaging.',
      'Aligns portfolio storytelling with runtime preview truth.',
      `previewAvailable=${portfolio.summary.previewAvailable}; previewState=${input.livePreview.reality.state}`,
    );
  }

  const regressionCount = input.changeIntelligence.impactSummary?.regressionCount ?? 0;
  if (regressionCount > 0 && portfolio.summary.healthy > portfolio.summary.atRisk) {
    add(
      'TRUST_RISK',
      'MEDIUM',
      'Report Consistency',
      `Change Intelligence reports ${regressionCount} regression(s) while portfolio health looks predominantly healthy.`,
      'Silent regressions undermine trust in positive health summaries.',
      'Elevate regressions in Insights health narrative and Action Center review queue.',
      'Founders see negative movement before it contradicts launch optimism.',
      `regressions=${regressionCount}; healthy=${portfolio.summary.healthy}`,
    );
  }

  const sorted = sortFindings(findings);
  const upgrades = buildUpgrades(sorted);
  const scores = computeScores(sorted);
  const operatorFeedEvents = buildOperatorFeed(sorted, upgrades);

  const topConfusionRisks = sorted.filter((f) => f.type === 'CONFUSION').slice(0, 4);
  const topContradictions = sorted.filter((f) => f.type === 'CONTRADICTION').slice(0, 4);
  const topTrustRisks = sorted.filter((f) => f.type === 'TRUST_RISK' || f.type === 'PROMISE_CONFLICT').slice(0, 4);

  const hasRealContradictionEvidence = sorted
    .filter((f) => f.type === 'CONTRADICTION')
    .every((f) => f.evidence.includes('=') || f.evidence.length > 12);

  return {
    ...scores,
    findings: sorted,
    topConfusionRisks,
    topContradictions,
    topTrustRisks,
    recommendedUpgrades: upgrades,
    operatorFeedEvents,
    findingsGenerated: sorted.length > 0,
    contradictionsDetected: topContradictions.length > 0,
    confusionRisksDetected: topConfusionRisks.length > 0,
    deadEndsDetected: sorted.some((f) => f.type === 'DEAD_END'),
    trustRisksDetected: topTrustRisks.length > 0,
    upgradesGenerated: upgrades.length > 0,
    scoresExplained:
      sorted.length === 0 ||
      sorted.every((f) => Boolean(f.whyItMatters && f.expectedImpact && f.recommendedUpgrade)),
    noFalseContradictions: hasRealContradictionEvidence || topContradictions.length === 0,
    noArchitectureLeakage: !sorted.some((f) => ARCH_LEAK.test(JSON.stringify(f))),
    insufficientInfo: !input.verificationResults.stateExplicit && sorted.length === 0,
    insufficientInfoReason:
      !input.verificationResults.stateExplicit && sorted.length === 0
        ? 'Verification state not explicit enough for full coherence analysis.'
        : null,
  };
}
