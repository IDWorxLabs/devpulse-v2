/**
 * Founder Inbox Foundation — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export type FounderInboxFeedStage =
  | 'Inbox Entry Created'
  | 'Inbox Entry Visible'
  | 'Inbox Entry Read'
  | 'Inbox Entry Acknowledged'
  | 'Inbox Entry Archived'
  | 'Inbox Entry Restored'
  | 'Inbox Entry Failed';

export function publishFounderInboxFeedStage(
  stage: FounderInboxFeedStage,
  query: string,
  inboxEntryId?: string | null,
): void {
  publishOperatorFeedStage(stage as OperatorFeedStage, 'founder_inbox_foundation', {
    query,
    summary: inboxEntryId ? `inboxEntryId=${inboxEntryId}` : undefined,
  });
}

export function publishFounderInboxFeedStages(
  query: string,
  ready: boolean,
  inboxEntryId?: string | null,
  blocked = false,
): void {
  publishFounderInboxFeedStage('Inbox Entry Created', query, inboxEntryId);

  if (ready) {
    publishFounderInboxFeedStage('Inbox Entry Visible', query, inboxEntryId);
    publishFounderInboxFeedStage('Inbox Entry Read', query, inboxEntryId);
    publishFounderInboxFeedStage('Inbox Entry Acknowledged', query, inboxEntryId);
  } else if (blocked) {
    publishFounderInboxFeedStage('Inbox Entry Failed', query, inboxEntryId);
  } else {
    publishFounderInboxFeedStage('Inbox Entry Failed', query, inboxEntryId);
  }
}

export function publishFounderInboxLifecycleStage(
  stage: 'Inbox Entry Archived' | 'Inbox Entry Restored',
  query: string,
  inboxEntryId?: string | null,
): void {
  publishFounderInboxFeedStage(stage, query, inboxEntryId);
}
