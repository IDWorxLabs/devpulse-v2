/**
 * Founder Testing Mode — product readiness scoring.
 */

import type {
  FinalVerdict,
  FounderTestIssue,
  FounderTestScores,
  IssueSeverity,
  PromptTestResult,
  ScreenTestResult,
  VisualUxFinding,
  WorkflowTestResult,
} from './founder-testing-types.js';

const SEVERITY_DEDUCTIONS: Record<FounderTestIssue['severity'], number> = {
  BLOCKER: 25,
  HIGH: 12,
  MEDIUM: 6,
  LOW: 3,
  POLISH: 1,
};

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function baseFromPassRate(passed: number, total: number): number {
  if (total === 0) return 50;
  return clamp((passed / total) * 100);
}

function applyIssueDeductions(base: number, issues: FounderTestIssue[], screenFilter?: string): number {
  let score = base;
  for (const issue of issues) {
    if (screenFilter && issue.screen !== screenFilter && !issue.screen.includes(screenFilter)) continue;
    score -= SEVERITY_DEDUCTIONS[issue.severity];
  }
  return clamp(score);
}

export function computeScores(input: {
  screenResults: ScreenTestResult[];
  promptResults: PromptTestResult[];
  workflowResults: WorkflowTestResult[];
  visualFindings: VisualUxFinding[];
  issues: FounderTestIssue[];
  liveChecksPassed?: number;
  liveChecksTotal?: number;
}): FounderTestScores {
  const navScreens = input.screenResults;
  const navPassed = navScreens.filter((s) => s.passed).length;
  const navigationClarity = applyIssueDeductions(
    baseFromPassRate(navPassed, navScreens.length),
    input.issues,
    'Navigation',
  );

  const screenCompleteness = applyIssueDeductions(
    baseFromPassRate(navPassed, navScreens.length),
    input.issues,
  );

  const workflowPassed = input.workflowResults.filter((w) => w.passed).length;
  const workflowContinuity = applyIssueDeductions(
    baseFromPassRate(workflowPassed, input.workflowResults.length),
    input.issues,
  );

  const promptPassed = input.promptResults.filter((p) => p.passed).length;
  const promptIntelligence = applyIssueDeductions(
    baseFromPassRate(promptPassed, input.promptResults.length),
    input.issues.filter((i) => i.screen === 'Command Center' || i.screen === 'Prompt Intelligence'),
  );

  const livePreview = input.screenResults.find((s) => s.viewId === 'live-preview');
  const livePreviewReadiness = applyIssueDeductions(
    livePreview?.passed ? 85 : 45,
    input.issues,
    'Live Preview',
  );

  const verification = input.screenResults.find((s) => s.viewId === 'verification');
  const verificationReadiness = applyIssueDeductions(
    verification?.passed ? 82 : 40,
    input.issues,
    'Verification',
  );

  const memory = input.screenResults.find((s) => s.viewId === 'project-memory');
  const projectMemoryUsefulness = applyIssueDeductions(
    memory?.passed ? 80 : 42,
    input.issues,
    'Project Memory',
  );

  const insights = input.screenResults.find((s) => s.viewId === 'project-insights');
  const projectInsightsUsefulness = applyIssueDeductions(
    insights?.passed ? 78 : 35,
    input.issues,
    'Project Insights',
  );

  const polishDeduction = input.visualFindings.reduce((sum, f) => sum + SEVERITY_DEDUCTIONS[f.severity], 0);
  const visualPolish = clamp(88 - polishDeduction);

  const liveBonus =
    input.liveChecksTotal && input.liveChecksTotal > 0
      ? baseFromPassRate(input.liveChecksPassed ?? 0, input.liveChecksTotal)
      : 70;
  const founderConfidence = clamp(
    (navigationClarity +
      screenCompleteness +
      promptIntelligence +
      projectInsightsUsefulness +
      liveBonus) /
      5,
  );

  const overall = clamp(
    (navigationClarity +
      screenCompleteness +
      workflowContinuity +
      promptIntelligence +
      livePreviewReadiness +
      verificationReadiness +
      projectMemoryUsefulness +
      projectInsightsUsefulness +
      visualPolish +
      founderConfidence) /
      10,
  );

  return {
    navigationClarity,
    screenCompleteness,
    workflowContinuity,
    promptIntelligence,
    livePreviewReadiness,
    verificationReadiness,
    projectMemoryUsefulness,
    projectInsightsUsefulness,
    visualPolish,
    founderConfidence,
    overall,
  };
}

export function deriveVerdict(scores: FounderTestScores, issues: FounderTestIssue[]): FinalVerdict {
  if (issues.some((i) => i.severity === 'BLOCKER')) return 'PRODUCT_BLOCKED';
  if (scores.overall < 50) return 'PRODUCT_NOT_READY';
  if (scores.overall < 80 || issues.some((i) => i.severity === 'HIGH')) {
    return 'PRODUCT_READY_WITH_MINOR_POLISH';
  }
  return 'PRODUCT_READY';
}

export function buildRecommendedFixOrder(issues: FounderTestIssue[]): string[] {
  const order: IssueSeverity[] = ['BLOCKER', 'HIGH', 'MEDIUM', 'LOW', 'POLISH'];
  const sorted = [...issues].sort(
    (a, b) => order.indexOf(a.severity) - order.indexOf(b.severity),
  );
  return sorted.slice(0, 12).map((i) => `[${i.severity}] ${i.screen}: ${i.problem}`);
}
