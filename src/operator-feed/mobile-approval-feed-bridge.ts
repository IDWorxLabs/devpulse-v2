/**
 * Mobile Approval Runtime Foundation — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export type MobileApprovalFeedStage =
  | 'Mobile Approval Session Created'
  | 'Approval Request Registered'
  | 'Waiting For Decision'
  | 'Decision Recorded'
  | 'Approval Approved'
  | 'Approval Rejected'
  | 'Approval Completed'
  | 'Approval Failed'
  | 'Approval Archived';

export function publishMobileApprovalFeedStage(
  stage: MobileApprovalFeedStage,
  query: string,
  mobileApprovalId?: string | null,
): void {
  publishOperatorFeedStage(stage as OperatorFeedStage, 'mobile_approval_runtime_foundation', {
    query,
    summary: mobileApprovalId ? `mobileApprovalId=${mobileApprovalId}` : undefined,
  });
}

export function publishMobileApprovalFeedStages(
  query: string,
  ready: boolean,
  mobileApprovalId?: string | null,
  blocked = false,
  rejected = false,
): void {
  publishMobileApprovalFeedStage('Mobile Approval Session Created', query, mobileApprovalId);

  if (ready) {
    publishMobileApprovalFeedStage('Approval Request Registered', query, mobileApprovalId);
    publishMobileApprovalFeedStage('Waiting For Decision', query, mobileApprovalId);
    publishMobileApprovalFeedStage('Decision Recorded', query, mobileApprovalId);
    if (rejected) {
      publishMobileApprovalFeedStage('Approval Rejected', query, mobileApprovalId);
    } else {
      publishMobileApprovalFeedStage('Approval Approved', query, mobileApprovalId);
    }
    publishMobileApprovalFeedStage('Approval Completed', query, mobileApprovalId);
  } else if (blocked) {
    publishMobileApprovalFeedStage('Approval Failed', query, mobileApprovalId);
  } else {
    publishMobileApprovalFeedStage('Approval Failed', query, mobileApprovalId);
  }
}

export function publishMobileApprovalLifecycleStage(
  stage: 'Approval Archived',
  query: string,
  mobileApprovalId?: string | null,
): void {
  publishMobileApprovalFeedStage(stage, query, mobileApprovalId);
}
