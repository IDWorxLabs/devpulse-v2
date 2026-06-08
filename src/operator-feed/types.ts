/** DevPulse V2 Inline Operator Feed — types. */

export type FeedStage =
  | 'RECEIVED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'ANSWER_READY'
  | 'COMPLETE'
  | 'ERROR';

export type FeedEventStatus = 'PENDING' | 'ACTIVE' | 'DONE' | 'ERROR';

export interface InlineOperatorFeedEvent {
  eventId: string;
  turnId: string;
  createdAt: number;
  stage: FeedStage;
  visibleText: string;
  status: FeedEventStatus;
  warnings: string[];
  errors: string[];
}

export type InlineOperatorFeedStatus = 'IDLE' | 'ACTIVE' | 'ERROR';

export interface DevPulseV2InlineOperatorFeedState {
  feedId: string;
  startedAt: number;
  status: InlineOperatorFeedStatus;
  events: InlineOperatorFeedEvent[];
  warnings: string[];
  errors: string[];
}

export interface FeedGovernorUsage {
  tasksScheduled: number;
  p1Tasks: number;
  p3Tasks: number;
  p4Tasks: number;
  usedTaskGovernor: boolean;
}

export interface InlineOperatorFeedReport {
  feedAuthorityOwner: string;
  totalEvents: number;
  latestTurnId: string | null;
  latestStage: FeedStage | null;
  visibleEventTextPresent: boolean;
  attachedToChatAuthority: boolean;
  warnings: string[];
  errors: string[];
  recommendation: string;
  summary: string;
  governorUsage: FeedGovernorUsage;
}

export const FEED_OWNER_MODULE = 'devpulse_v2_inline_operator_feed_authority';
export const FEED_PASS_TOKEN = 'DEVPULSE_V2_INLINE_OPERATOR_FEED_FOUNDATION_V1_PASS';

export const FOUNDATION_FEED_STAGES: ReadonlyArray<{
  stage: FeedStage;
  visibleText: string;
  finalStatus: FeedEventStatus;
}> = [
  { stage: 'RECEIVED', visibleText: 'Message received.', finalStatus: 'DONE' },
  { stage: 'QUEUED', visibleText: 'Chat Authority queued the response.', finalStatus: 'DONE' },
  { stage: 'PROCESSING', visibleText: 'Preparing visible answer.', finalStatus: 'DONE' },
  { stage: 'ANSWER_READY', visibleText: 'Visible answer is ready.', finalStatus: 'DONE' },
  { stage: 'COMPLETE', visibleText: 'Turn complete.', finalStatus: 'DONE' },
];
