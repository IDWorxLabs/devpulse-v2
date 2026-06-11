/**
 * Change Intelligence Visibility Authority — explains what changed between founder-visible states.
 */

import type {
  ChangeCategory,
  ChangeDirection,
  ChangeEvent,
  ChangeFeedEvent,
  ChangeImpactSummary,
  ChangeIntelligenceSnapshot,
  ChangeIntelligenceVisibilityAssessment,
  ChangeSeverity,
  ChangeTimelineEntry,
} from './change-intelligence-visibility-types.js';

const PREVIEW_RANK: Record<string, number> = {
  NO_PREVIEW: 0,
  PREVIEW_STARTING: 1,
  PREVIEW_LOADING: 2,
  PREVIEW_VISIBLE: 3,
  PREVIEW_INTERACTIVE: 4,
  PREVIEW_STALE: 3,
  PREVIEW_DEGRADED: 2,
  PREVIEW_READY: 5,
};

const OUTPUT_RANK: Record<string, number> = {
  NO_RUNNING_APP: 0,
  OUTPUT_STARTING: 1,
  OUTPUT_VISIBLE: 2,
  OUTPUT_INTERACTIVE: 3,
  OUTPUT_STALE: 2,
  OUTPUT_DEGRADED: 2,
  OUTPUT_READY_FOR_TESTING: 4,
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function pushChange(
  changes: ChangeEvent[],
  input: {
    category: ChangeCategory;
    title: string;
    description: string;
    severity: ChangeSeverity;
    direction: ChangeDirection;
    evidence: string;
    occurredAt: number;
    reviewPriority: number;
  },
): void {
  if (input.direction === 'UNCHANGED') return;
  changes.push(input);
}

function comparePreview(prev: ChangeIntelligenceSnapshot, curr: ChangeIntelligenceSnapshot, at: number, changes: ChangeEvent[]): void {
  if (prev.previewState === curr.previewState) return;
  const prevRank = PREVIEW_RANK[prev.previewState] ?? 0;
  const currRank = PREVIEW_RANK[curr.previewState] ?? 0;
  const improved = currRank > prevRank && curr.previewState !== 'PREVIEW_STALE' && curr.previewState !== 'PREVIEW_DEGRADED';
  const regressed = currRank < prevRank || curr.previewState === 'PREVIEW_DEGRADED' || curr.previewState === 'PREVIEW_STALE';

  pushChange(changes, {
    category: 'Build Changes',
    title: improved ? 'Preview readiness improved' : regressed ? 'Preview readiness decreased' : 'Preview state changed',
    description: `Live Preview moved from ${prev.previewState} to ${curr.previewState}.`,
    severity: regressed ? 'HIGH' : improved ? 'MEDIUM' : 'LOW',
    direction: improved ? 'IMPROVED' : regressed ? 'REGRESSED' : 'NEW',
    evidence: `${prev.previewState} → ${curr.previewState}`,
    occurredAt: at,
    reviewPriority: regressed ? 90 : improved ? 40 : 20,
  });
}

function compareRunningApp(prev: ChangeIntelligenceSnapshot, curr: ChangeIntelligenceSnapshot, at: number, changes: ChangeEvent[]): void {
  if (prev.runningAppState === curr.runningAppState) return;
  const prevRank = OUTPUT_RANK[prev.runningAppState] ?? 0;
  const currRank = OUTPUT_RANK[curr.runningAppState] ?? 0;
  const improved = currRank > prevRank && curr.runningAppState !== 'OUTPUT_STALE' && curr.runningAppState !== 'OUTPUT_DEGRADED';
  const regressed = currRank < prevRank || curr.runningAppState === 'OUTPUT_DEGRADED' || curr.runningAppState === 'OUTPUT_STALE';

  pushChange(changes, {
    category: 'Build Changes',
    title: improved ? 'Running application became more testable' : regressed ? 'Running application degraded' : 'Running application changed',
    description: `Running application moved from ${prev.runningAppState} to ${curr.runningAppState}.`,
    severity: regressed ? 'HIGH' : 'MEDIUM',
    direction: improved ? 'IMPROVED' : regressed ? 'REGRESSED' : 'NEW',
    evidence: `${prev.runningAppState} → ${curr.runningAppState}`,
    occurredAt: at,
    reviewPriority: regressed ? 85 : 45,
  });
}

function compareVerification(prev: ChangeIntelligenceSnapshot, curr: ChangeIntelligenceSnapshot, at: number, changes: ChangeEvent[]): void {
  if (prev.readinessScore !== curr.readinessScore) {
    const improved = curr.readinessScore > prev.readinessScore;
    pushChange(changes, {
      category: 'Verification Changes',
      title: improved ? 'Verification score increased' : 'Verification score decreased',
      description: `Readiness moved from ${prev.readinessScore} to ${curr.readinessScore}.`,
      severity: improved ? 'MEDIUM' : curr.readinessScore < prev.readinessScore - 10 ? 'HIGH' : 'MEDIUM',
      direction: improved ? 'IMPROVED' : 'REGRESSED',
      evidence: `${prev.readinessScore} → ${curr.readinessScore}`,
      occurredAt: at,
      reviewPriority: improved ? 35 : 80,
    });
  }

  if (prev.failCount !== curr.failCount) {
    const improved = curr.failCount < prev.failCount;
    pushChange(changes, {
      category: 'Verification Changes',
      title: improved ? 'Failures resolved' : 'New failures detected',
      description: improved
        ? `${prev.failCount - curr.failCount} failure(s) cleared since last snapshot.`
        : `${curr.failCount - prev.failCount} new failure(s) since last snapshot.`,
      severity: improved ? 'MEDIUM' : 'HIGH',
      direction: improved ? 'IMPROVED' : 'REGRESSED',
      evidence: `Failed checks: ${prev.failCount} → ${curr.failCount}`,
      occurredAt: at,
      reviewPriority: improved ? 30 : 95,
    });
  }

  if (prev.warningCount !== curr.warningCount) {
    const improved = curr.warningCount < prev.warningCount;
    pushChange(changes, {
      category: 'Verification Changes',
      title: improved ? 'Warnings reduced' : 'Warnings increased',
      description: `Warning count moved from ${prev.warningCount} to ${curr.warningCount}.`,
      severity: improved ? 'LOW' : 'MEDIUM',
      direction: improved ? 'IMPROVED' : 'REGRESSED',
      evidence: `Warnings: ${prev.warningCount} → ${curr.warningCount}`,
      occurredAt: at,
      reviewPriority: improved ? 25 : 55,
    });
  }

  if (prev.passCount !== curr.passCount && curr.passCount > prev.passCount) {
    pushChange(changes, {
      category: 'Verification Changes',
      title: 'Verification coverage increased',
      description: `${curr.passCount - prev.passCount} additional check(s) now passing.`,
      severity: 'LOW',
      direction: 'IMPROVED',
      evidence: `Passed checks: ${prev.passCount} → ${curr.passCount}`,
      occurredAt: at,
      reviewPriority: 20,
    });
  }

  if (prev.verificationState !== curr.verificationState) {
    pushChange(changes, {
      category: 'Verification Changes',
      title: 'Verification state changed',
      description: `Verification moved from ${prev.verificationState} to ${curr.verificationState}.`,
      severity: curr.verificationState === 'VERIFICATION_FAILED' ? 'HIGH' : 'MEDIUM',
      direction: curr.verificationState === 'VERIFICATION_FAILED' ? 'REGRESSED' : 'NEW',
      evidence: `${prev.verificationState} → ${curr.verificationState}`,
      occurredAt: at,
      reviewPriority: 70,
    });
  }
}

function compareReadiness(prev: ChangeIntelligenceSnapshot, curr: ChangeIntelligenceSnapshot, at: number, changes: ChangeEvent[]): void {
  if (prev.betaReady !== curr.betaReady) {
    pushChange(changes, {
      category: 'Readiness Changes',
      title: curr.betaReady ? 'Beta readiness increased' : 'Beta readiness decreased',
      description: curr.betaReady ? 'Project is now reasonable for beta review.' : 'Beta confidence is no longer supported.',
      severity: curr.betaReady ? 'MEDIUM' : 'HIGH',
      direction: curr.betaReady ? 'IMPROVED' : 'REGRESSED',
      evidence: `Beta ready: ${prev.betaReady} → ${curr.betaReady}`,
      occurredAt: at,
      reviewPriority: curr.betaReady ? 40 : 88,
    });
  }

  if (prev.launchReady !== curr.launchReady) {
    pushChange(changes, {
      category: 'Readiness Changes',
      title: curr.launchReady ? 'Launch readiness increased' : 'Launch readiness decreased',
      description: curr.launchReady
        ? 'Verification now supports stronger launch/beta confidence.'
        : 'Launch confidence dropped — review before demo or launch.',
      severity: curr.launchReady ? 'MEDIUM' : 'CRITICAL',
      direction: curr.launchReady ? 'IMPROVED' : 'REGRESSED',
      evidence: `Launch ready: ${prev.launchReady} → ${curr.launchReady}`,
      occurredAt: at,
      reviewPriority: curr.launchReady ? 35 : 100,
    });
  }

  if (prev.launchReadinessScore !== curr.launchReadinessScore && curr.launchReadinessScore > 0) {
    const improved = curr.launchReadinessScore > prev.launchReadinessScore;
    pushChange(changes, {
      category: 'Readiness Changes',
      title: improved ? 'Launch readiness score increased' : 'Launch readiness score decreased',
      description: `Launch readiness reality moved from ${prev.launchReadinessScore} to ${curr.launchReadinessScore}.`,
      severity: improved ? 'MEDIUM' : 'HIGH',
      direction: improved ? 'IMPROVED' : 'REGRESSED',
      evidence: `${prev.launchReadinessScore} → ${curr.launchReadinessScore}`,
      occurredAt: at,
      reviewPriority: improved ? 45 : 92,
    });
  }
}

function compareProject(prev: ChangeIntelligenceSnapshot, curr: ChangeIntelligenceSnapshot, at: number, changes: ChangeEvent[]): void {
  if (prev.projectFactCount !== curr.projectFactCount) {
    pushChange(changes, {
      category: 'Project Changes',
      title: curr.projectFactCount > prev.projectFactCount ? 'Project memory updated' : 'Project memory reduced',
      description:
        curr.projectFactCount > prev.projectFactCount
          ? 'New project facts were stored in Project Memory.'
          : 'Project Memory fact count decreased.',
      severity: 'LOW',
      direction: curr.projectFactCount > prev.projectFactCount ? 'NEW' : 'REGRESSED',
      evidence: `Facts: ${prev.projectFactCount} → ${curr.projectFactCount}`,
      occurredAt: at,
      reviewPriority: 15,
    });
  }

  if (prev.projectCount !== curr.projectCount) {
    pushChange(changes, {
      category: 'Project Changes',
      title: 'Project portfolio changed',
      description: `Tracked projects moved from ${prev.projectCount} to ${curr.projectCount}.`,
      severity: 'LOW',
      direction: 'NEW',
      evidence: `Projects: ${prev.projectCount} → ${curr.projectCount}`,
      occurredAt: at,
      reviewPriority: 18,
    });
  }
}

function compareRisk(prev: ChangeIntelligenceSnapshot, curr: ChangeIntelligenceSnapshot, at: number, changes: ChangeEvent[]): void {
  if (prev.topRiskCount !== curr.topRiskCount) {
    const improved = curr.topRiskCount < prev.topRiskCount;
    pushChange(changes, {
      category: 'Risk Changes',
      title: improved ? 'Risk signals reduced' : 'New risk detected',
      description: improved
        ? 'Fewer active warnings/risk signals than the previous snapshot.'
        : 'Additional warnings or risk signals appeared.',
      severity: improved ? 'LOW' : 'HIGH',
      direction: improved ? 'IMPROVED' : 'REGRESSED',
      evidence: `Risk signals: ${prev.topRiskCount} → ${curr.topRiskCount}`,
      occurredAt: at,
      reviewPriority: improved ? 22 : 75,
    });
  }
}

function buildImpactSummary(changes: ChangeEvent[]): ChangeImpactSummary {
  return {
    improvementCount: changes.filter((c) => c.direction === 'IMPROVED').length,
    regressionCount: changes.filter((c) => c.direction === 'REGRESSED').length,
    newCount: changes.filter((c) => c.direction === 'NEW').length,
    informationalCount: changes.filter((c) => c.severity === 'LOW').length,
    unchangedCount: 0,
  };
}

function buildTimeline(changes: ChangeEvent[], snapshots: readonly ChangeIntelligenceSnapshot[]): ChangeTimelineEntry[] {
  const entries: ChangeTimelineEntry[] = changes.map((c) => ({
    timeLabel: formatTime(c.occurredAt),
    occurredAt: c.occurredAt,
    summary: c.title,
    direction: c.direction,
    evidence: c.evidence,
  }));

  for (const snap of snapshots.slice(-4).reverse()) {
    if (snap.label === 'Founder Test completed') {
      entries.push({
        timeLabel: formatTime(snap.capturedAt),
        occurredAt: snap.capturedAt,
        summary: 'Founder Test completed',
        direction: 'NEW',
        evidence: `Verification state: ${snap.verificationState}`,
      });
    }
  }

  return entries
    .sort((a, b) => b.occurredAt - a.occurredAt)
    .slice(0, 8);
}

function buildOperatorFeed(changes: ChangeEvent[], hasHistory: boolean): ChangeFeedEvent[] {
  const events: ChangeFeedEvent[] = [
    {
      section: 'Learning',
      action: 'Reading previous snapshot',
      detail: hasHistory ? 'Comparing latest founder-visible state to prior snapshot.' : 'No prior snapshot available yet.',
      status: hasHistory ? 'Completed' : 'Warning',
    },
    {
      section: 'Verification',
      action: 'Comparing verification results',
      detail: 'Checking pass/fail, warning, and readiness score movement.',
      status: 'Completed',
    },
    {
      section: 'Execution',
      action: 'Comparing build outputs',
      detail: 'Checking preview and running application state movement.',
      status: 'Completed',
    },
    {
      section: 'Approvals',
      action: 'Detecting readiness changes',
      detail: 'Reviewing beta and launch readiness movement.',
      status: 'Completed',
    },
  ];

  const regressions = changes.filter((c) => c.direction === 'REGRESSED');
  const improvements = changes.filter((c) => c.direction === 'IMPROVED');

  if (regressions.length) {
    events.push({
      section: 'Approvals',
      action: 'Detecting regressions',
      detail: `${regressions.length} regression(s) found — ${regressions[0].title}`,
      status: 'Warning',
      evidence: regressions[0].evidence,
    });
  }

  if (improvements.length) {
    events.push({
      section: 'Learning',
      action: 'Detecting improvements',
      detail: `${improvements.length} improvement(s) found — ${improvements[0].title}`,
      status: 'Completed',
      evidence: improvements[0].evidence,
    });
  }

  events.push({
    section: 'Learning',
    action: 'Ranking changes by impact',
    detail: changes.length ? `Top change: ${changes[0].title}` : 'No meaningful changes detected.',
    status: 'Completed',
  });

  events.push({
    section: 'Learning',
    action: 'Preparing founder summary',
    detail: changes.length ? `${improvements.length} improvements, ${regressions.length} regressions` : 'Insufficient history or no differences yet.',
    status: 'Completed',
  });

  return events;
}

export function assessChangeIntelligenceVisibility(
  snapshots: readonly ChangeIntelligenceSnapshot[],
): ChangeIntelligenceVisibilityAssessment {
  if (snapshots.length < 2) {
    return {
      hasSufficientHistory: false,
      historyCount: snapshots.length,
      insufficientHistoryReason:
        'Not enough history yet — run Founder Testing or refresh project surfaces to establish a baseline.',
      recentChanges: [],
      regressions: [],
      improvements: [],
      impactSummary: {
        improvementCount: 0,
        regressionCount: 0,
        newCount: 0,
        informationalCount: 0,
        unchangedCount: 0,
      },
      recommendedReviewOrder: ['Run Founder Testing to create the first baseline snapshot'],
      timeline: snapshots.map((s) => ({
        timeLabel: formatTime(s.capturedAt),
        occurredAt: s.capturedAt,
        summary: s.label,
        direction: 'NEW' as const,
        evidence: s.verificationState,
      })),
      readinessMovementExplanation: null,
      scoreMovementExplanation: null,
      operatorFeedEvents: buildOperatorFeed([], false),
      historyExists: snapshots.length > 0,
      improvementsVisible: true,
      regressionsVisible: true,
      readinessExplained: false,
      scoreExplained: false,
      timelineUnderstandable: snapshots.length > 0,
      recommendationsPrioritized: true,
    };
  }

  const prev = snapshots[snapshots.length - 2];
  const curr = snapshots[snapshots.length - 1];
  const at = curr.capturedAt;
  const changes: ChangeEvent[] = [];

  comparePreview(prev, curr, at, changes);
  compareRunningApp(prev, curr, at, changes);
  compareVerification(prev, curr, at, changes);
  compareReadiness(prev, curr, at, changes);
  compareProject(prev, curr, at, changes);
  compareRisk(prev, curr, at, changes);

  changes.sort((a, b) => b.reviewPriority - a.reviewPriority);

  const regressions = changes.filter((c) => c.direction === 'REGRESSED');
  const improvements = changes.filter((c) => c.direction === 'IMPROVED');
  const impactSummary = buildImpactSummary(changes);

  const readinessMovementExplanation =
    prev.betaReady !== curr.betaReady || prev.launchReady !== curr.launchReady || prev.launchReadinessScore !== curr.launchReadinessScore
      ? `Beta ready ${prev.betaReady ? 'yes' : 'no'} → ${curr.betaReady ? 'yes' : 'no'}; Launch ready ${prev.launchReady ? 'yes' : 'no'} → ${curr.launchReady ? 'yes' : 'no'}.`
      : changes.some((c) => c.category === 'Readiness Changes')
        ? changes.find((c) => c.category === 'Readiness Changes')?.description ?? null
        : 'No meaningful readiness movement since the last snapshot.';

  const scoreMovementExplanation =
    prev.readinessScore !== curr.readinessScore
      ? `Verification readiness score changed from ${prev.readinessScore} to ${curr.readinessScore} after ${curr.label.toLowerCase()}.`
      : 'Verification score unchanged since the last snapshot.';

  const recommendedReviewOrder =
    changes.length > 0
      ? changes.slice(0, 5).map((c) => c.title)
      : ['No meaningful changes — continue current workflow'];

  return {
    hasSufficientHistory: true,
    historyCount: snapshots.length,
    insufficientHistoryReason: null,
    recentChanges: changes,
    regressions,
    improvements,
    impactSummary,
    recommendedReviewOrder,
    timeline: buildTimeline(changes, snapshots),
    readinessMovementExplanation,
    scoreMovementExplanation,
    operatorFeedEvents: buildOperatorFeed(changes, true),
    historyExists: true,
    improvementsVisible: true,
    regressionsVisible: true,
    readinessExplained: readinessMovementExplanation !== 'No meaningful readiness movement since the last snapshot.' || changes.some((c) => c.category === 'Readiness Changes'),
    scoreExplained: prev.readinessScore !== curr.readinessScore,
    timelineUnderstandable: true,
    recommendationsPrioritized: recommendedReviewOrder.length > 0,
  };
}
