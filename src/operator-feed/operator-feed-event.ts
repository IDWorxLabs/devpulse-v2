/**
 * Operator Feed event factory — creates visibility-only feed events.
 */

import type {
  OperatorFeedConfidence,
  OperatorFeedEvent,
  OperatorFeedEventStatus,
  OperatorFeedStage,
} from './operator-feed-types.js';

let eventCounter = 0;

function nextEventId(): string {
  eventCounter += 1;
  return `ofeed-${eventCounter.toString().padStart(4, '0')}`;
}

const STAGE_SUMMARIES: Record<OperatorFeedStage, string> = {
  'Loading Context': 'Loading intelligence context for the current query.',
  'Reading Shared Memory': 'Recalling relevant shared memory facts.',
  'Reading Project Understanding': 'Reading project profile and fact inventory.',
  'Reading Project Facts': 'Gathering project facts from Project Understanding.',
  'Reading Vault Facts': 'Reading supplemental vault facts read-only.',
  'Reading Vault Intelligence': 'Loading Project Vault Intelligence context.',
  'Reading Dependency Intelligence': 'Analyzing dependency graph and blockers.',
  'Reading Workspace Intelligence': 'Resolving workspace ownership and boundaries.',
  'Reading History Intelligence': 'Reading project history and recent changes.',
  'Reading Summaries': 'Compressing intelligence sources into summaries.',
  'Reading Portfolio Intelligence': 'Aggregating multi-project portfolio context.',
  'Loading Portfolio': 'Initializing portfolio visibility context.',
  'Reading Project Inventory': 'Reading portfolio project inventory.',
  'Computing Health': 'Computing portfolio health across projects.',
  'Generating Portfolio Summary': 'Generating portfolio advisory summary.',
  'Evaluating Risks': 'Evaluating risk facts for advisory recommendation.',
  'Generating Recommendation': 'Generating advisory recommendation.',
  'Generating Project Answer': 'Composing project understanding answer.',
  'Generating Response': 'Composing final intelligence response.',
  'Response Ready': 'Visibility timeline complete — response ready.',
  'Action Identified': 'Action candidate identified for visibility review.',
  'Action Evaluated': 'Action status, priority, and blockers evaluated.',
  'Action Recommended': 'Action marked as recommended — visibility only, not executed.',
  'Action Deferred': 'Action deferred per governance gates — visibility only.',
  'Action Blocked': 'Action blocked — execution not permitted.',
  'Action Completed': 'Action visibility marked complete — no execution performed.',
  'Reasoning Started': 'Structured reasoning visibility started — no chain-of-thought exposed.',
  'Evidence Collected': 'Evidence gathered from consulted intelligence systems.',
  'Risks Evaluated': 'Visible risk findings evaluated for advisory reasoning.',
  'Blockers Evaluated': 'Blockers evaluated for advisory visibility across reasoning and progress.',
  'Confidence Calculated': 'Confidence basis calculated from structured evidence.',
  'Reasoning Ready': 'Reasoning visibility complete — structured summary ready.',
  'Progress Evaluation Started': 'Progress evaluation started — visibility only.',
  'Milestones Evaluated': 'Milestones evaluated across portfolio projects.',
  'Progress Calculated': 'Completion percentage calculated from intelligence sources.',
  'Progress Ready': 'Progress visibility complete — advisory summary ready.',
  'Failure Detected': 'Failure detection started — visibility only, no auto-fix.',
  'Failure Evaluated': 'Visible failures evaluated across intelligence sources.',
  'Severity Calculated': 'Failure severity classified for advisory visibility.',
  'Impact Evaluated': 'Affected systems and blocked capabilities evaluated.',
  'Next Step Generated': 'Advisory next step generated — visibility only, not executed.',
  'Failure Ready': 'Failure visibility complete — structured summary ready.',
  'Learning Analysis Started': 'Learning analysis started — visibility only, no self-learning.',
  'Patterns Evaluated': 'Observed patterns evaluated across intelligence sources.',
  'Failures Evaluated': 'Recurring failure patterns evaluated for learning visibility.',
  'Recommendations Evaluated': 'Recurring recommendation patterns evaluated for learning visibility.',
  'Learning Ready': 'Learning visibility complete — observed lessons ready.',
  'Execution Evaluation Started': 'Execution runtime foundation evaluation started — readiness only.',
  'Readiness Evaluation': 'Execution readiness evaluated from intelligence sources.',
  'Dependency Check': 'Dependency prerequisites checked for execution readiness.',
  'Safety Check': 'Execution safety boundary evaluated — no real execution.',
  'Execution Readiness Ready': 'Execution readiness advisory complete — simulation only.',
  'Build Task Planning Started': 'Build task runtime foundation planning started — no execution.',
  'Task Request Parsed': 'Build task request parsed into planning scope.',
  'Dependencies Resolved': 'Build task dependencies resolved from intelligence sources.',
  'Safety Gates Evaluated': 'Build task safety gates evaluated — planning only.',
  'Verification Plan Created': 'Build task verification plan created — proof criteria advisory.',
  'Build Task Plan Ready': 'Build task plan ready — simulation only, execution blocked.',
  'Code Generation Planning Started': 'Code generation runtime foundation planning started — proposal only.',
  'Generation Request Parsed': 'Code generation request parsed into proposal scope.',
  'Artifact Proposals Created': 'In-memory code artifact proposals created — no disk writes.',
  'Change Proposals Created': 'File change proposals created — not applied to project source.',
  'Generation Risks Evaluated': 'Code generation risks evaluated before any future generation.',
  'Validation Plan Created': 'Code generation validation plan created — proof criteria advisory.',
  'Code Generation Plan Ready': 'Code generation plan ready — simulation only, no file writes.',
  'Testing Planning Started': 'Testing runtime foundation planning started — no test execution.',
  'Testing Request Parsed': 'Testing request parsed into planning scope.',
  'Test Cases Created': 'Test cases modeled — simulation only, no test files written.',
  'Evidence Requirements Created': 'Evidence requirements defined — proof criteria advisory.',
  'Test Risks Evaluated': 'Testing risks evaluated before any future test execution.',
  'Simulated Results Created': 'Simulated pass/fail results created — no commands run.',
  'Testing Plan Ready': 'Testing plan ready — simulation only, execution blocked.',
  'Auto Fix Planning Started': 'Auto-fix runtime foundation planning started — no fix application.',
  'Failure Analysis Complete': 'Failure records analyzed for fix planning — advisory only.',
  'Fix Proposals Created': 'Fix proposals created — not applied to project.',
  'Alternatives Evaluated': 'Alternative fixes ranked — simulation only.',
  'Rollback Plan Created': 'Rollback plan created — prerequisites advisory.',
  'Auto Fix Plan Ready': 'Auto-fix plan ready — simulation only, no files modified.',
  'Runtime Verification Started': 'Runtime verification layer started — no runtime actions.',
  'Verification Evidence Collected': 'Verification evidence collected from Phase 14 runtime chain.',
  'Verification Gaps Evaluated': 'Verification gaps evaluated — advisory only.',
  'Trust Assessment Calculated': 'Runtime chain trust assessment calculated — simulation only.',
  'Verification Score Calculated': 'Composite verification score calculated — no execution.',
  'Runtime Verification Report Ready': 'Runtime verification report ready — verification only.',
};

export function createOperatorFeedEvent(
  stage: OperatorFeedStage,
  sourceSystem: string,
  timestamp: number,
  opts: {
    status?: OperatorFeedEventStatus;
    confidence?: OperatorFeedConfidence;
    relatedProject?: string | null;
    relatedWorkspace?: string | null;
    summary?: string;
  } = {},
): OperatorFeedEvent {
  return {
    eventId: nextEventId(),
    timestamp,
    sourceSystem,
    stage,
    status: opts.status ?? 'COMPLETE',
    summary: opts.summary ?? STAGE_SUMMARIES[stage],
    confidence: opts.confidence ?? 'HIGH',
    relatedProject: opts.relatedProject ?? null,
    relatedWorkspace: opts.relatedWorkspace ?? null,
    visibilityOnly: true,
  };
}

export function resetOperatorFeedEventCounterForTests(): void {
  eventCounter = 0;
}
