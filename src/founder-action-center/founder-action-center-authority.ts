/**
 * Founder Action Center Authority — converts product state into prioritized next actions.
 */

import type { ChangeIntelligenceVisibilityAssessment } from '../change-intelligence-visibility/change-intelligence-visibility-types.js';
import type { LivePreviewRealityAssessment } from '../live-preview-reality/live-preview-reality-types.js';
import type { RunningApplicationVisibilityAssessment } from '../running-application-visibility/running-application-visibility-types.js';
import type { VerificationResultsVisibilityAssessment } from '../verification-results-visibility/verification-results-visibility-types.js';
import type {
  ActionFeedEvent,
  ActionPriority,
  ActionType,
  FounderAction,
  FounderActionBlocker,
  FounderActionCenterAssessment,
  FounderActionCenterState,
  FounderOpportunity,
  RecommendedNextStep,
} from './founder-action-center-types.js';

const MAX_ACTIONS = 8;
const MAX_BLOCKERS = 5;
const MAX_OPPORTUNITIES = 4;

const PRIORITY_RANK: Record<ActionPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const TECHNICAL_JARGON = /npm run|uvl|ownership registry|devpulse_v2|validator script|chain-of-thought/i;

export interface FounderActionCenterWorkspaceInput {
  projectMemory: {
    vaultState: { projectCount: number; factCount: number };
    nextSuggestedActions: string[];
  };
  livePreview: { reality: LivePreviewRealityAssessment };
  runningApplication: RunningApplicationVisibilityAssessment;
  verificationResults: VerificationResultsVisibilityAssessment;
  changeIntelligence: ChangeIntelligenceVisibilityAssessment;
  verification: { readiness: string; readinessLabel: string };
}

let actionIdCounter = 0;

function nextActionId(prefix: string): string {
  actionIdCounter += 1;
  return `${prefix}-${actionIdCounter}`;
}

function sortActions(actions: FounderAction[]): FounderAction[] {
  return [...actions].sort((a, b) => {
    const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (pr !== 0) return pr;
    return a.title.localeCompare(b.title);
  });
}

function dedupeActions(actions: FounderAction[]): { actions: FounderAction[]; noDuplicates: boolean } {
  const seen = new Set<string>();
  const out: FounderAction[] = [];
  for (const action of sortActions(actions)) {
    const key = action.title.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(action);
    if (out.length >= MAX_ACTIONS) break;
  }
  return { actions: out, noDuplicates: out.length === seen.size };
}

function pushAction(
  bucket: FounderAction[],
  seen: Set<string>,
  action: Omit<FounderAction, 'id'> & { id?: string },
): void {
  const key = action.title.trim().toLowerCase();
  if (seen.has(key) || bucket.length >= MAX_ACTIONS + 4) return;
  seen.add(key);
  bucket.push({ ...action, id: action.id ?? nextActionId('action') });
}

function mapFixType(priority: ActionPriority, title: string): ActionType {
  if (/review|readiness|regression|failure/i.test(title)) return 'REVIEW_ACTION';
  return priority === 'CRITICAL' || priority === 'HIGH' ? 'FIX_ACTION' : 'REVIEW_ACTION';
}

function resolveState(actions: FounderAction[], blockers: FounderActionBlocker[]): FounderActionCenterState {
  if (!actions.length) return 'NO_ACTIONS';
  const executable = actions.some((a) => a.executable && (a.type === 'TEST_ACTION' || a.type === 'FIX_ACTION' || a.type === 'BUILD_ACTION'));
  if (blockers.length > 0 && !executable) return 'ACTIONS_BLOCKED';
  const top = actions[0];
  if (top.type === 'REVIEW_ACTION' || top.type === 'APPROVAL_ACTION') return 'ACTIONS_REQUIRING_REVIEW';
  if (executable) return 'ACTIONS_READY';
  return 'ACTIONS_AVAILABLE';
}

function stateLabel(state: FounderActionCenterState): string {
  switch (state) {
    case 'NO_ACTIONS':
      return 'No actions identified';
    case 'ACTIONS_BLOCKED':
      return 'Actions blocked';
    case 'ACTIONS_READY':
      return 'Ready to execute';
    case 'ACTIONS_REQUIRING_REVIEW':
      return 'Review required first';
    default:
      return 'Actions available';
  }
}

function buildExecutionImpact(actions: FounderAction[]): string[] {
  const impacts = new Set<string>();
  for (const action of actions.slice(0, 3)) {
    if (action.type === 'TEST_ACTION') impacts.add('Improve confidence in launch readiness');
    if (action.type === 'FIX_ACTION') impacts.add('Reduce verification uncertainty');
    if (action.type === 'REVIEW_ACTION') impacts.add('Surface risks before they block launch');
    if (action.type === 'BUILD_ACTION') impacts.add('Move the product build forward');
    if (action.type === 'APPROVAL_ACTION') impacts.add('Unlock the next launch milestone');
    if (action.expectedImpact) impacts.add(action.expectedImpact);
  }
  return [...impacts].slice(0, 4);
}

function buildOperatorFeed(
  blockers: FounderActionBlocker[],
  topActions: FounderAction[],
  state: FounderActionCenterState,
): ActionFeedEvent[] {
  const events: ActionFeedEvent[] = [
    {
      section: 'Action Planning',
      action: 'Reading project state',
      detail: 'Loaded project memory and workspace context.',
      status: 'Completed',
    },
    {
      section: 'Action Planning',
      action: 'Reading verification results',
      detail: 'Checked latest founder-visible verification state.',
      status: 'Completed',
    },
    {
      section: 'Action Planning',
      action: 'Reading change intelligence',
      detail: 'Compared recent improvements and regressions.',
      status: 'Completed',
    },
    {
      section: 'Action Planning',
      action: 'Detecting blockers',
      detail:
        blockers.length > 0
          ? `${blockers.length} blocker(s) identified.`
          : 'No blocking conditions detected.',
      status: blockers.length > 0 ? 'Warning' : 'Completed',
      evidence: blockers[0]?.evidence,
    },
    {
      section: 'Action Planning',
      action: 'Ranking actions',
      detail: topActions.length
        ? `Top priority: ${topActions[0].title} (${topActions[0].priority}).`
        : 'No ranked actions yet.',
      status: topActions.length ? 'Active' : 'Warning',
      evidence: topActions[0]?.evidence,
    },
    {
      section: 'Action Planning',
      action: 'Calculating impact',
      detail: 'Estimated readiness impact for top recommended actions.',
      status: 'Completed',
    },
    {
      section: 'Action Planning',
      action: 'Preparing founder recommendations',
      detail: 'Composed founder-facing next steps without internal architecture detail.',
      status: 'Completed',
    },
    {
      section: 'Action Planning',
      action: 'Action plan ready',
      detail: `Action center state: ${stateLabel(state)}.`,
      status: state === 'ACTIONS_BLOCKED' ? 'Blocked' : 'Completed',
    },
  ];
  return events;
}

function containsTechnicalJargon(text: string): boolean {
  return TECHNICAL_JARGON.test(text);
}

export function assessFounderActionCenter(
  workspace: FounderActionCenterWorkspaceInput,
): FounderActionCenterAssessment {
  const actions: FounderAction[] = [];
  const blockers: FounderActionBlocker[] = [];
  const opportunities: FounderOpportunity[] = [];
  const seen = new Set<string>();

  const preview = workspace.livePreview.reality;
  const running = workspace.runningApplication;
  const verification = workspace.verificationResults;
  const change = workspace.changeIntelligence;
  const memory = workspace.projectMemory;

  if (!preview.validationReady && preview.state !== 'NO_PREVIEW') {
    blockers.push({
      title: 'Preview not validation-ready',
      impact: 'Prevents reliable testing and lowers verification confidence.',
      evidence: preview.validationReadyReason || preview.problems[0] || preview.displayLabel,
    });
    pushAction(actions, seen, {
      type: 'FIX_ACTION',
      priority: 'HIGH',
      title: 'Resolve degraded preview',
      rationale: 'The live preview is not validation-ready, so testing results may be unreliable.',
      expectedImpact: 'Restore a testable preview surface for founder verification.',
      evidence: preview.validationReadyReason || preview.problems.join('; ') || preview.displayLabel,
      executable: true,
    });
  }

  if (preview.state === 'PREVIEW_DEGRADED' || preview.state === 'PREVIEW_STALE') {
    pushAction(actions, seen, {
      type: 'FIX_ACTION',
      priority: 'HIGH',
      title: preview.state === 'PREVIEW_STALE' ? 'Refresh stale preview' : 'Recover degraded preview',
      rationale: preview.summaryLines[0] ?? 'Preview quality is below testing standards.',
      expectedImpact: 'Improve preview reliability before the next test run.',
      evidence: preview.problems[0] ?? preview.displayLabel,
      executable: true,
    });
  }

  if (preview.state === 'NO_PREVIEW') {
    pushAction(actions, seen, {
      type: 'BUILD_ACTION',
      priority: 'MEDIUM',
      title: 'Start live preview',
      rationale: 'No preview is running yet, so you cannot see or test the application output.',
      expectedImpact: 'Make the build visible and testable.',
      evidence: preview.displayLabel,
      executable: true,
    });
  }

  if (running.testReadiness === 'NOT_TESTABLE' || running.degradedDetected || running.staleDetected) {
    if (running.testReadiness === 'NOT_TESTABLE') {
      blockers.push({
        title: 'Running application not testable',
        impact: 'Blocks meaningful founder testing until output is aligned.',
        evidence: running.testReadinessReason,
      });
    }
    pushAction(actions, seen, {
      type: 'FIX_ACTION',
      priority: running.degradedDetected || running.staleDetected ? 'HIGH' : 'MEDIUM',
      title: 'Validate running application',
      rationale: running.testReadinessReason || running.recommendedAction,
      expectedImpact: 'Align build output with what you asked to build.',
      evidence: running.alignmentReason || running.recommendedAction,
      executable: running.outputState !== 'NO_RUNNING_APP',
      blockedReason: running.outputState === 'NO_RUNNING_APP' ? 'No running application output yet.' : undefined,
    });
  }

  if (
    verification.state === 'NO_VERIFICATION_RUN' ||
    verification.state === 'VERIFICATION_PARTIAL' ||
    !verification.summary.lastRunLabel
  ) {
    pushAction(actions, seen, {
      type: 'TEST_ACTION',
      priority: 'HIGH',
      title: 'Run Founder Testing',
      rationale:
        verification.state === 'NO_VERIFICATION_RUN'
          ? 'Verification results are missing and current readiness is unknown.'
          : 'Verification results are outdated or incomplete.',
      expectedImpact: 'Improve confidence in launch readiness.',
      evidence: verification.summary.lastRunLabel ?? verification.stateLabel,
      executable: true,
    });
  }

  if (verification.state === 'VERIFICATION_FAILED' || verification.state === 'VERIFICATION_BLOCKED') {
    pushAction(actions, seen, {
      type: 'REVIEW_ACTION',
      priority: 'CRITICAL',
      title: 'Review verification failures',
      rationale: 'Latest verification did not pass — unresolved issues need founder review.',
      expectedImpact: 'Identify what is blocking beta or launch readiness.',
      evidence: `State: ${verification.state}; failed ${verification.summary.failCount}, blocked ${verification.summary.blockedCount}`,
      executable: true,
    });
  }

  for (const fix of verification.fixesNext.slice(0, 3)) {
    pushAction(actions, seen, {
      type: mapFixType(fix.priority, fix.title),
      priority: fix.priority,
      title: fix.title,
      rationale: fix.recommendedAction,
      expectedImpact: `Addresses ${fix.blocksLabel.toLowerCase()}.`,
      evidence: fix.evidence,
      executable: fix.priority !== 'LOW',
    });
  }

  if (verification.state === 'VERIFICATION_WARNINGS') {
    pushAction(actions, seen, {
      type: 'REVIEW_ACTION',
      priority: 'MEDIUM',
      title: 'Review verification warnings',
      rationale: 'Warnings may not block launch yet but can hide regressions.',
      expectedImpact: 'Reduce launch risk before approval.',
      evidence: `${verification.summary.warningCount} warning(s) in latest results`,
      executable: true,
    });
  }

  for (const regression of change.regressions.slice(0, 2)) {
    pushAction(actions, seen, {
      type: 'REVIEW_ACTION',
      priority: regression.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      title: `Review regression: ${regression.title}`,
      rationale: regression.description,
      expectedImpact: 'Prevent readiness from dropping further.',
      evidence: regression.evidence,
      executable: true,
    });
  }

  if (change.readinessMovementExplanation && change.impactSummary.regressionCount > 0) {
    pushAction(actions, seen, {
      type: 'REVIEW_ACTION',
      priority: 'HIGH',
      title: 'Review readiness changes',
      rationale: change.readinessMovementExplanation,
      expectedImpact: 'Understand why launch confidence changed.',
      evidence: change.readinessMovementExplanation,
      executable: true,
    });
  }

  if (verification.launchReady) {
    pushAction(actions, seen, {
      type: 'APPROVAL_ACTION',
      priority: 'HIGH',
      title: 'Approve release review',
      rationale: verification.launchReadyReason,
      expectedImpact: 'Move toward a controlled launch decision.',
      evidence: `Readiness score ${verification.summary.readinessScore}/100`,
      executable: true,
    });
  } else if (verification.betaReady) {
    pushAction(actions, seen, {
      type: 'APPROVAL_ACTION',
      priority: 'MEDIUM',
      title: 'Approve beta review',
      rationale: verification.betaReadyReason,
      expectedImpact: 'Validate the product with limited customers.',
      evidence: `Readiness score ${verification.summary.readinessScore}/100`,
      executable: true,
    });
  }

  for (const improvement of change.improvements.slice(0, 2)) {
    opportunities.push({
      title: improvement.title,
      detail: improvement.description,
      evidence: improvement.evidence,
    });
  }

  if (verification.summary.readinessScore >= 75 && verification.state === 'VERIFICATION_READY') {
    opportunities.push({
      title: 'Verification score is strong',
      detail: 'Latest results show solid readiness — consider a beta review if risks are acceptable.',
      evidence: `Readiness ${verification.summary.readinessScore}/100`,
    });
  }

  if (change.impactSummary.improvementCount > change.impactSummary.regressionCount) {
    opportunities.push({
      title: 'Recent improvements outweigh regressions',
      detail: 'Change intelligence shows more improvements than regressions since the last snapshot.',
      evidence: `${change.impactSummary.improvementCount} improvements vs ${change.impactSummary.regressionCount} regressions`,
    });
  }

  if (memory.vaultState.projectCount === 0) {
    pushAction(actions, seen, {
      type: 'BUILD_ACTION',
      priority: 'HIGH',
      title: 'Create your first project',
      rationale: 'No project is active yet, so AiDevEngine has limited context to act on.',
      expectedImpact: 'Enable planning, preview, and verification workflows.',
      evidence: 'Project count: 0',
      executable: true,
    });
  }

  for (const suggestion of memory.nextSuggestedActions.slice(0, 2)) {
    const lower = suggestion.toLowerCase();
    const type: ActionType = /test|verify|validate/.test(lower)
      ? 'TEST_ACTION'
      : /review|check/.test(lower)
        ? 'REVIEW_ACTION'
        : /build|implement|create|continue/.test(lower)
          ? 'BUILD_ACTION'
          : 'INFORMATION_ACTION';
    pushAction(actions, seen, {
      type,
      priority: 'MEDIUM',
      title: suggestion.length > 72 ? `${suggestion.slice(0, 69)}…` : suggestion,
      rationale: 'Suggested from current project memory context.',
      expectedImpact: 'Keeps project momentum aligned with known requirements.',
      evidence: `Project facts: ${memory.vaultState.factCount}`,
      executable: type !== 'INFORMATION_ACTION',
    });
  }

  if (change.hasSufficientHistory && change.recentChanges.length > 0) {
    pushAction(actions, seen, {
      type: 'INFORMATION_ACTION',
      priority: 'LOW',
      title: 'Read latest change summary',
      rationale: 'Recent product changes may affect what you should prioritize next.',
      expectedImpact: 'Better context for review and approval decisions.',
      evidence: change.recentChanges[0]?.title ?? 'Recent changes available',
      executable: true,
    });
  }

  if (!actions.length && !blockers.length) {
    return {
      state: 'NO_ACTIONS',
      stateLabel: stateLabel('NO_ACTIONS'),
      recommendedNextStep: null,
      topActions: [],
      blockers: [],
      opportunities: opportunities.slice(0, MAX_OPPORTUNITIES),
      executionImpact: [],
      insufficientInfo: true,
      insufficientInfoReason:
        'Not enough product state is available yet to recommend specific next actions. Run Founder Testing and open Live Preview first.',
      operatorFeedEvents: buildOperatorFeed([], [], 'NO_ACTIONS'),
      actionsGenerated: false,
      prioritiesVisible: false,
      blockersVisible: false,
      rationaleVisible: false,
      impactVisible: false,
      recommendationsActionable: false,
      noDuplicates: true,
      noTechnicalOnly: true,
    };
  }

  const { actions: topActions, noDuplicates } = dedupeActions(actions);
  const state = resolveState(topActions, blockers.slice(0, MAX_BLOCKERS));
  const top = topActions[0] ?? null;

  const recommendedNextStep: RecommendedNextStep | null = top
    ? {
        priority: top.priority,
        title: top.title,
        type: top.type,
        reason: top.rationale,
        expectedImpact: top.expectedImpact,
        evidence: top.evidence,
      }
    : null;

  const executionImpact = buildExecutionImpact(topActions);
  const trimmedBlockers = blockers.slice(0, MAX_BLOCKERS);
  const trimmedOpportunities = opportunities.slice(0, MAX_OPPORTUNITIES);

  const noTechnicalOnly = topActions.every(
    (a) =>
      !containsTechnicalJargon(a.title) &&
      !containsTechnicalJargon(a.rationale) &&
      !containsTechnicalJargon(a.evidence),
  );

  return {
    state,
    stateLabel: stateLabel(state),
    recommendedNextStep,
    topActions,
    blockers: trimmedBlockers,
    opportunities: trimmedOpportunities,
    executionImpact,
    insufficientInfo: false,
    insufficientInfoReason: null,
    operatorFeedEvents: buildOperatorFeed(trimmedBlockers, topActions, state),
    actionsGenerated: topActions.length > 0,
    prioritiesVisible: topActions.every((a) => Boolean(a.priority)),
    blockersVisible: trimmedBlockers.length === 0 || trimmedBlockers.every((b) => Boolean(b.impact)),
    rationaleVisible: topActions.every((a) => Boolean(a.rationale)),
    impactVisible: executionImpact.length > 0 || Boolean(recommendedNextStep?.expectedImpact),
    recommendationsActionable: topActions.some((a) => a.executable),
    noDuplicates,
    noTechnicalOnly,
  };
}

export function resetFounderActionCenterCounterForTests(): void {
  actionIdCounter = 0;
}
