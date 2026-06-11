/**
 * Verification Results Visibility Authority — founder-visible test report.
 * Uses Live Preview Reality and Running Application Visibility as inputs.
 */

import type { FounderTestV4Report } from '../founder-testing-mode/founder-testing-v4-types.js';
import type { ProductWorkspaceSnapshot } from '../../server/product-workspace-snapshot.js';
import type {
  FixPriority,
  VerificationBlockers,
  VerificationCategory,
  VerificationCategoryGroup,
  VerificationCheckResult,
  VerificationCheckStatus,
  VerificationFeedEvent,
  VerificationFixItem,
  VerificationResultsState,
  VerificationResultsSummary,
  VerificationResultsVisibilityAssessment,
} from './verification-results-visibility-types.js';

const STATE_LABELS: Record<VerificationResultsState, string> = {
  NO_VERIFICATION_RUN: 'No verification run yet',
  VERIFICATION_RUNNING: 'Verification running',
  VERIFICATION_PARTIAL: 'Verification partial',
  VERIFICATION_BLOCKED: 'Verification blocked',
  VERIFICATION_FAILED: 'Verification failed',
  VERIFICATION_WARNINGS: 'Verification passed with warnings',
  VERIFICATION_READY: 'Verification ready for review',
  VERIFICATION_LAUNCH_READY: 'Verification launch ready',
};

const ALL_CATEGORIES: VerificationCategory[] = [
  'Preview',
  'Running Application',
  'Project Memory',
  'Command Center',
  'Verification',
  'Build Output',
  'UX / Navigation',
  'Launch Readiness',
];

function emptyBlockers(): VerificationBlockers {
  return { testing: false, demo: false, beta: false, launch: false };
}

function check(
  category: VerificationCategory,
  checkName: string,
  status: VerificationCheckStatus,
  meaning: string,
  evidence: string,
  recommendedAction: string,
  priority: FixPriority,
  blocks: VerificationBlockers,
): VerificationCheckResult {
  return { category, checkName, status, meaning, evidence, recommendedAction, priority, blocks };
}

function statusFromPass(passed: boolean, blocked = false): VerificationCheckStatus {
  if (blocked) return 'BLOCKED';
  return passed ? 'PASS' : 'FAIL';
}

function buildChecksFromV4Report(report: FounderTestV4Report): VerificationCheckResult[] {
  const pr = report.previewReality;
  const ra = report.runningAppVisibility;
  const pm = report.projectMemoryReality;
  const vr = report.verificationReality;
  const v3 = report.v3;
  const lr = report.launchReadinessReality;

  const previewBlocked = pr.state === 'NO_PREVIEW';
  const checks: VerificationCheckResult[] = [
    check(
      'Preview',
      'Preview can be opened',
      statusFromPass(pr.existsPass, previewBlocked),
      previewBlocked
        ? 'No preview is available to validate.'
        : pr.existsPass
          ? 'Preview can be opened from the Live Preview surface.'
          : 'Preview path exists but cannot be opened reliably.',
      `Preview state: ${pr.state}`,
      pr.recommendedActions[0] ?? 'Open Live Preview and confirm preview URL.',
      previewBlocked ? 'HIGH' : pr.existsPass ? 'LOW' : 'HIGH',
      { testing: !pr.existsPass, demo: !pr.existsPass, beta: !pr.validationReadyPass, launch: !pr.validationReadyPass },
    ),
    check(
      'Preview',
      'Preview loads content',
      statusFromPass(pr.loadsPass, previewBlocked),
      pr.loadsPass ? 'Preview content renders.' : 'Preview has not proven rendered content.',
      pr.problems[0] ?? `Load reality: ${pr.loadsPass}`,
      'Refresh preview and confirm application content is visible.',
      pr.loadsPass ? 'LOW' : 'HIGH',
      { testing: !pr.loadsPass, demo: !pr.loadsPass, beta: true, launch: true },
    ),
    check(
      'Preview',
      'Preview validation ready',
      pr.validationReadyPass ? 'PASS' : pr.state === 'PREVIEW_DEGRADED' ? 'WARNING' : 'FAIL',
      pr.validationReadyPass
        ? 'Preview is ready for founder validation.'
        : 'Preview exists but is not validation-ready.',
      pr.summaryLines.join('; ') || pr.state,
      pr.recommendedActions[0] ?? 'Run Founder Testing after preview is interactive and current.',
      pr.validationReadyPass ? 'LOW' : 'CRITICAL',
      { testing: !pr.validationReadyPass, demo: !pr.validationReadyPass, beta: true, launch: true },
    ),
    check(
      'Running Application',
      'Active application identifiable',
      statusFromPass(ra.identifiablePass, ra.outputState === 'NO_RUNNING_APP'),
      ra.identifiablePass
        ? 'Founder can tell what application is running.'
        : 'Running application target is unclear.',
      `${ra.runningAppTitle} (${ra.outputState})`,
      ra.recommendedAction,
      ra.identifiablePass ? 'LOW' : 'HIGH',
      { testing: !ra.identifiablePass, demo: true, beta: true, launch: false },
    ),
    check(
      'Running Application',
      'Output test readiness',
      ra.readyForTestingPass
        ? 'PASS'
        : ra.testReadiness === 'TESTABLE_WITH_WARNINGS'
          ? 'WARNING'
          : ra.outputState === 'NO_RUNNING_APP'
            ? 'BLOCKED'
            : 'FAIL',
      ra.testReadinessReason,
      `Alignment: ${ra.requestAlignment}; testing: ${ra.testReadiness}`,
      ra.recommendedAction,
      ra.readyForTestingPass ? 'LOW' : 'HIGH',
      {
        testing: !ra.readyForTestingPass,
        demo: ra.degradedDetected || ra.staleDetected,
        beta: !ra.readyForTestingPass,
        launch: !ra.readyForTestingPass,
      },
    ),
    check(
      'Build Output',
      'Build output visible',
      statusFromPass(ra.buildOutputVisiblePass, ra.outputState === 'NO_RUNNING_APP'),
      ra.buildOutputVisiblePass
        ? 'Build/output context is visible to founders.'
        : 'Build output is hidden or too vague.',
      ra.warnings[0] ?? ra.outputState,
      'Open Live Preview and review Build Output panel.',
      ra.buildOutputVisiblePass ? 'LOW' : 'MEDIUM',
      { testing: false, demo: !ra.buildOutputVisiblePass, beta: false, launch: false },
    ),
    check(
      'Project Memory',
      'Project context retained',
      statusFromPass(pm.retainsContext),
      pm.retainsContext
        ? 'Project Memory retains project context.'
        : 'Project Memory does not yet retain enough context.',
      `Memory score: ${pm.score}/100`,
      'Populate Project Memory via Command Center.',
      pm.retainsContext ? 'LOW' : 'MEDIUM',
      { testing: false, demo: false, beta: !pm.retainsContext, launch: true },
    ),
    check(
      'Command Center',
      'Product identity alignment',
      v3.v2.readinessReality.visionAlignment >= 70 ? 'PASS' : v3.v2.readinessReality.visionAlignment >= 50 ? 'WARNING' : 'FAIL',
      'Command Center answers as AiDevEngine product assistant.',
      `Vision alignment: ${v3.v2.readinessReality.visionAlignment}/100`,
      'Ask identity prompts and confirm product-first responses.',
      v3.v2.readinessReality.visionAlignment >= 70 ? 'LOW' : 'HIGH',
      { testing: false, demo: v3.v2.readinessReality.visionAlignment < 50, beta: true, launch: true },
    ),
    check(
      'Verification',
      'Verification path exists',
      statusFromPass(vr.pathExists),
      vr.pathExists
        ? 'Verification surface and scripts are available.'
        : 'Verification workflow is not fully surfaced.',
      `Verification score: ${vr.score}/100; path exists: ${vr.pathExists}`,
      'Open Verification and run Founder Testing.',
      vr.pathExists ? 'LOW' : 'HIGH',
      { testing: !vr.pathExists, demo: false, beta: true, launch: true },
    ),
    check(
      'UX / Navigation',
      'Human patience and clarity',
      v3.launchReadiness.humanSuccessRate >= 70
        ? 'PASS'
        : v3.launchReadiness.humanSuccessRate >= 55
          ? 'WARNING'
          : 'FAIL',
      'Navigation and loading states are understandable for founders.',
      `Human success rate: ${v3.launchReadiness.humanSuccessRate}/100`,
      'Review Live Preview and Project Intelligence clarity.',
      v3.launchReadiness.humanSuccessRate >= 70 ? 'LOW' : 'MEDIUM',
      { testing: false, demo: v3.launchReadiness.humanSuccessRate < 55, beta: true, launch: false },
    ),
    check(
      'Launch Readiness',
      'Launch readiness reality',
      lr.launchReadinessRealityScore >= 75
        ? 'PASS'
        : lr.launchReadinessRealityScore >= 55
          ? 'WARNING'
          : 'FAIL',
      'Overall launch readiness based on execution, product, and human signals.',
      `Launch readiness: ${lr.launchReadinessRealityScore}/100; verdict: ${report.verdict}`,
      report.recommendedFixOrder[0] ?? 'Address top product risks before launch.',
      lr.launchReadinessRealityScore >= 75 ? 'LOW' : 'CRITICAL',
      { testing: false, demo: false, beta: lr.launchReadinessRealityScore < 55, launch: lr.launchReadinessRealityScore < 75 },
    ),
  ];

  if (ra.staleDetected) {
    checks.push(
      check(
        'Running Application',
        'Output freshness',
        'FAIL',
        'Running application may be stale versus latest project state.',
        ra.alignmentReason,
        'Restart preview or rebuild project.',
        'HIGH',
        { testing: true, demo: true, beta: true, launch: true },
      ),
    );
  }

  if (ra.degradedDetected) {
    checks.push(
      check(
        'Preview',
        'Preview usability',
        'WARNING',
        'Preview is degraded — usability issues detected.',
        pr.problems.join('; ') || pr.state,
        'Refresh preview and resolve interaction issues.',
        'HIGH',
        { testing: true, demo: true, beta: true, launch: true },
      ),
    );
  }

  return checks;
}

function buildNotRunChecks(): VerificationCheckResult[] {
  return ALL_CATEGORIES.map((category) =>
    check(
      category,
      `${category} checks`,
      'NOT_RUN',
      'Founder Testing has not run yet for this area.',
      'No verification run recorded.',
      'Run Founder Testing to evaluate this area.',
      'LOW',
      emptyBlockers(),
    ),
  );
}

function groupCategories(checks: VerificationCheckResult[]): VerificationCategoryGroup[] {
  return ALL_CATEGORIES.map((category) => {
    const catChecks = checks.filter((c) => c.category === category);
    return {
      category,
      checks: catChecks,
      passCount: catChecks.filter((c) => c.status === 'PASS').length,
      failCount: catChecks.filter((c) => c.status === 'FAIL').length,
      blockedCount: catChecks.filter((c) => c.status === 'BLOCKED').length,
      warningCount: catChecks.filter((c) => c.status === 'WARNING').length,
    };
  }).filter((g) => g.checks.length > 0);
}

function summarizeChecks(
  checks: VerificationCheckResult[],
  input: {
    founderTestRan: boolean;
    founderTestRunning: boolean;
    lastRunLabel: string | null;
    lastRunTimestamp: number | null;
    overallVerdict: string | null;
    readinessScore: number | null;
  },
): VerificationResultsSummary {
  return {
    overallVerdict: input.overallVerdict ?? (input.founderTestRan ? 'Founder Testing V4' : 'No run'),
    readinessScore: input.readinessScore ?? 0,
    passCount: checks.filter((c) => c.status === 'PASS').length,
    failCount: checks.filter((c) => c.status === 'FAIL').length,
    blockedCount: checks.filter((c) => c.status === 'BLOCKED').length,
    warningCount: checks.filter((c) => c.status === 'WARNING').length,
    notRunCount: checks.filter((c) => c.status === 'NOT_RUN').length,
    lastRunLabel: input.lastRunLabel,
    lastRunTimestamp: input.lastRunTimestamp,
  };
}

function resolveState(
  summary: VerificationResultsSummary,
  founderTestRan: boolean,
  founderTestRunning: boolean,
  verdict: string | null,
): VerificationResultsState {
  if (founderTestRunning) return 'VERIFICATION_RUNNING';
  if (!founderTestRan) return 'NO_VERIFICATION_RUN';
  if (summary.notRunCount > 0 && summary.passCount === 0) return 'VERIFICATION_PARTIAL';
  if (summary.blockedCount > 0 && summary.failCount === 0 && summary.passCount === 0) return 'VERIFICATION_BLOCKED';
  if (summary.failCount > 0) return 'VERIFICATION_FAILED';
  if (summary.notRunCount > 0) return 'VERIFICATION_PARTIAL';
  if (summary.warningCount > 0 && summary.failCount === 0) return 'VERIFICATION_WARNINGS';
  if (
    summary.readinessScore >= 80 &&
    (verdict === 'READY_FOR_LAUNCH' || verdict === 'READY_FOR_PUBLIC_BETA')
  ) {
    return 'VERIFICATION_LAUNCH_READY';
  }
  if (summary.passCount > 0 && summary.failCount === 0 && summary.blockedCount === 0) {
    return 'VERIFICATION_READY';
  }
  return 'VERIFICATION_PARTIAL';
}

function buildFixes(checks: VerificationCheckResult[]): VerificationFixItem[] {
  const actionable = checks.filter((c) => c.status === 'FAIL' || c.status === 'BLOCKED' || c.status === 'WARNING');
  const order: FixPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  return actionable
    .sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority))
    .slice(0, 8)
    .map((c) => ({
      title: c.checkName,
      priority: c.priority,
      blocksLabel: [
        c.blocks.testing ? 'testing' : '',
        c.blocks.demo ? 'demo' : '',
        c.blocks.beta ? 'beta confidence' : '',
        c.blocks.launch ? 'launch' : '',
      ]
        .filter(Boolean)
        .join(', ') || 'review',
      recommendedAction: c.recommendedAction,
      evidence: c.evidence,
    }));
}

function buildOperatorFeed(
  state: VerificationResultsState,
  summary: VerificationResultsSummary,
  fixes: VerificationFixItem[],
): VerificationFeedEvent[] {
  const events: VerificationFeedEvent[] = [
    {
      section: 'Verification',
      action: 'Preparing verification report',
      detail: 'Building founder-visible verification results from latest checks.',
      status: 'Completed',
    },
    {
      section: 'Verification',
      action: 'Reading latest test results',
      detail: summary.lastRunLabel
        ? `Last run: ${summary.lastRunLabel}`
        : 'No founder verification run recorded yet.',
      status: summary.lastRunLabel ? 'Completed' : 'Warning',
    },
    {
      section: 'Verification',
      action: 'Grouping checks by product area',
      detail: 'Organizing results into Preview, Running Application, Memory, and Launch Readiness.',
      status: 'Completed',
    },
  ];

  if (summary.failCount > 0) {
    events.push({
      section: 'Approvals',
      action: 'Identifying failed checks',
      detail: `${summary.failCount} check(s) failed and need attention.`,
      status: 'Blocked',
    });
  }

  if (summary.blockedCount > 0) {
    events.push({
      section: 'Approvals',
      action: 'Identifying blocked checks',
      detail: `${summary.blockedCount} check(s) blocked because required input or preview was missing.`,
      status: 'Blocked',
    });
  }

  if (summary.warningCount > 0) {
    events.push({
      section: 'Approvals',
      action: 'Identifying warning checks',
      detail: `${summary.warningCount} warning(s) — review recommended before beta or launch.`,
      status: 'Warning',
    });
  }

  if (fixes.length > 0) {
    events.push({
      section: 'Learning',
      action: 'Ranking fix priorities',
      detail: `Top fix: ${fixes[0].title} (${fixes[0].priority})`,
      status: 'Active',
      evidence: fixes[0].evidence,
    });
    events.push({
      section: 'Learning',
      action: 'Preparing next recommended action',
      detail: fixes[0].recommendedAction,
      status: 'Completed',
    });
  }

  events.push({
    section: 'Learning',
    action: 'Verification report ready',
    detail: `Verification state: ${state}`,
    status: state === 'VERIFICATION_FAILED' || state === 'VERIFICATION_BLOCKED' ? 'Blocked' : 'Completed',
  });

  return events;
}

function readinessFlags(state: VerificationResultsState, summary: VerificationResultsSummary, verdict: string | null) {
  const reviewReady =
    state === 'VERIFICATION_READY' ||
    state === 'VERIFICATION_WARNINGS' ||
    state === 'VERIFICATION_LAUNCH_READY';
  const betaReady =
    (state === 'VERIFICATION_READY' || state === 'VERIFICATION_WARNINGS' || state === 'VERIFICATION_LAUNCH_READY') &&
    summary.failCount === 0 &&
    summary.blockedCount === 0 &&
    summary.readinessScore >= 55;
  const launchReady =
    state === 'VERIFICATION_LAUNCH_READY' ||
    (betaReady && summary.readinessScore >= 75 && (verdict === 'READY_FOR_LAUNCH' || verdict === 'READY_FOR_PUBLIC_BETA'));

  return {
    reviewReady,
    betaReady,
    launchReady,
    betaReadyReason: betaReady
      ? 'Core checks passed or warn only; readiness score supports beta review.'
      : summary.failCount > 0
        ? 'Failed checks must be addressed before beta confidence.'
        : 'Run Founder Testing and resolve warnings before beta.',
    launchReadyReason: launchReady
      ? 'Launch readiness score and verdict support launch/beta confidence.'
      : 'Launch requires higher readiness and fewer blocking issues.',
  };
}

export function assessVerificationResultsVisibility(input: {
  founderTestRan: boolean;
  founderTestRunning?: boolean;
  lastRunLabel?: string | null;
  lastRunTimestamp?: number | null;
  overallVerdict?: string | null;
  readinessScore?: number | null;
  checks: VerificationCheckResult[];
}): VerificationResultsVisibilityAssessment {
  const founderTestRunning = input.founderTestRunning ?? false;
  const summary = summarizeChecks(input.checks, {
    founderTestRan: input.founderTestRan,
    founderTestRunning,
    lastRunLabel: input.lastRunLabel ?? null,
    lastRunTimestamp: input.lastRunTimestamp ?? null,
    overallVerdict: input.overallVerdict ?? null,
    readinessScore: input.readinessScore ?? null,
  });
  const state = resolveState(summary, input.founderTestRan, founderTestRunning, input.overallVerdict ?? null);
  const categories = groupCategories(input.checks);
  const fixesNext = buildFixes(input.checks);
  const readiness = readinessFlags(state, summary, input.overallVerdict ?? null);

  return {
    state,
    stateLabel: STATE_LABELS[state],
    summary,
    categories,
    fixesNext,
    betaReady: readiness.betaReady,
    launchReady: readiness.launchReady,
    reviewReady: readiness.reviewReady,
    betaReadyReason: readiness.betaReadyReason,
    launchReadyReason: readiness.launchReadyReason,
    operatorFeedEvents: buildOperatorFeed(state, summary, fixesNext),
    stateExplicit: true,
    countsVisible: true,
    categoriesGrouped: categories.length > 0,
    evidencePresent: input.checks.some((c) => c.evidence && c.evidence !== 'No verification run recorded.'),
    nextActionVisible: fixesNext.length > 0 || !input.founderTestRan,
    readinessExplained: input.founderTestRan,
    optimisticReadiness: input.founderTestRan && summary.readinessScore >= 70 && summary.failCount > 0,
  };
}

export function buildVerificationResultsFromV4Report(report: FounderTestV4Report): VerificationResultsVisibilityAssessment {
  const checks = buildChecksFromV4Report(report);
  return assessVerificationResultsVisibility({
    founderTestRan: true,
    lastRunLabel: 'Founder Testing V4',
    lastRunTimestamp: report.generatedAt,
    overallVerdict: report.verdict,
    readinessScore: report.launchReadinessReality.launchReadinessRealityScore,
    checks,
  });
}

export function buildVerificationResultsFromWorkspace(
  workspace: ProductWorkspaceSnapshot,
): VerificationResultsVisibilityAssessment {
  return assessVerificationResultsVisibility({
    founderTestRan: false,
    checks: buildNotRunChecks(),
  });
}

export function buildVerificationResultsRunning(): VerificationResultsVisibilityAssessment {
  return assessVerificationResultsVisibility({
    founderTestRan: false,
    founderTestRunning: true,
    checks: buildNotRunChecks().map((c) => ({
      ...c,
      meaning: 'Founder Testing is running — results will appear when complete.',
      status: 'NOT_RUN' as const,
    })),
  });
}
