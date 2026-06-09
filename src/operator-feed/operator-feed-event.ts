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
