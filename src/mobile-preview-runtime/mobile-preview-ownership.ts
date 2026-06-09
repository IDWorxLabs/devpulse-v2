/**
 * Mobile Preview Runtime Foundation — ownership tracking.
 */

import { recordMobilePreviewHistoryEntry } from './mobile-preview-history.js';
import type { MobilePreviewOwnership } from './mobile-preview-types.js';
import { MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-preview-types.js';

export function buildMobilePreviewOwnership(input: {
  projectId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  createdBy?: string;
}): MobilePreviewOwnership {
  return {
    ownerModule: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
    ownerDomain: 'mobile_preview_runtime_foundation',
    createdBy: input.createdBy ?? MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
    projectId: input.projectId,
    mobileCommandSessionId: input.mobileCommandSessionId,
    mobileChatSessionId: input.mobileChatSessionId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    mobilePreviewSessionId: null,
    mobilePreviewAuthority: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
    creationTimestamp: Date.now(),
  };
}

export function recordMobilePreviewOwnershipHistory(mobilePreviewId: string, summary: string): void {
  recordMobilePreviewHistoryEntry({
    mobilePreviewId,
    category: 'OWNERSHIP',
    summary,
    scopeUsed: mobilePreviewId,
  });
}

export function updateMobilePreviewSessionOwnership(
  ownership: MobilePreviewOwnership,
  sessionId: string,
): MobilePreviewOwnership {
  return { ...ownership, mobilePreviewSessionId: sessionId };
}
