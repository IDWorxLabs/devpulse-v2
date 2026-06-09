/**
 * Mobile Approval Runtime Foundation — ownership tracking.
 */

import { recordMobileApprovalHistoryEntry } from './mobile-approval-history.js';
import type { MobileApprovalOwnership } from './mobile-approval-types.js';
import { MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-approval-types.js';

export function buildMobileApprovalOwnership(input: {
  projectId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  mobilePreviewSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  mobileApprovalFlowFoundationId?: string;
  createdBy?: string;
}): MobileApprovalOwnership {
  return {
    ownerModule: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    ownerDomain: 'mobile_approval_runtime_foundation',
    createdBy: input.createdBy ?? MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    projectId: input.projectId,
    mobileCommandSessionId: input.mobileCommandSessionId,
    mobileChatSessionId: input.mobileChatSessionId,
    mobilePreviewSessionId: input.mobilePreviewSessionId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    mobileApprovalSessionId: null,
    mobileApprovalFlowFoundationId: input.mobileApprovalFlowFoundationId ?? null,
    mobileApprovalAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    creationTimestamp: Date.now(),
  };
}

export function recordMobileApprovalOwnershipHistory(mobileApprovalId: string, summary: string): void {
  recordMobileApprovalHistoryEntry({
    mobileApprovalId,
    category: 'OWNERSHIP',
    summary,
    scopeUsed: mobileApprovalId,
  });
}

export function updateMobileApprovalSessionOwnership(
  ownership: MobileApprovalOwnership,
  sessionId: string,
): MobileApprovalOwnership {
  return { ...ownership, mobileApprovalSessionId: sessionId };
}
