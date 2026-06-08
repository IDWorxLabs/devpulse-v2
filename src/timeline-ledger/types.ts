/** DevPulse V2 Timeline / Event Ledger — types. */

export type TimelineEventSource =
  | 'FOUNDATION'
  | 'TASK_GOVERNOR'
  | 'SHELL'
  | 'CHAT'
  | 'INLINE_OPERATOR_FEED'
  | 'BROWSER_VERIFICATION'
  | 'TRUST_ENGINE'
  | 'PROJECT_VAULT'
  | 'EVIDENCE_REGISTRY';

export type TimelineEventCategory =
  | 'SYSTEM'
  | 'USER'
  | 'VERIFICATION'
  | 'TRUST'
  | 'PROJECT'
  | 'EVIDENCE';

export type TimelineEventStatus = 'INFO' | 'PASS' | 'WARN' | 'FAIL';

export interface TimelineEvent {
  eventId: string;
  createdAt: number;
  source: TimelineEventSource;
  category: TimelineEventCategory;
  title: string;
  summary: string;
  relatedEvidenceIds: string[];
  relatedProjectId?: string;
  relatedRecordId?: string;
  status: TimelineEventStatus;
  warnings: string[];
  errors: string[];
}

export type TimelineEventInput = Omit<TimelineEvent, 'eventId' | 'createdAt'> & {
  eventId?: string;
  createdAt?: number;
};

export interface LedgerSnapshot {
  snapshotId: string;
  capturedAt: number;
  eventCount: number;
  events: TimelineEvent[];
}

export interface LedgerState {
  ledgerId: string;
  eventCount: number;
  snapshotCount: number;
  warnings: string[];
  errors: string[];
}

export interface TimelineLedgerReport {
  ownerModule: string;
  totalEvents: number;
  eventsBySource: Partial<Record<TimelineEventSource, number>>;
  eventsByCategory: Partial<Record<TimelineEventCategory, number>>;
  latestEvent: string | null;
  snapshotCount: number;
  warnings: string[];
  errors: string[];
  recommendation: string;
  summary: string;
}

export type ProjectTimelineEventKind =
  | 'project_created'
  | 'project_updated'
  | 'snapshot_created';

export const LEDGER_OWNER_MODULE = 'devpulse_v2_timeline_ledger_authority';
export const LEDGER_PASS_TOKEN = 'DEVPULSE_V2_TIMELINE_LEDGER_FOUNDATION_V1_PASS';
