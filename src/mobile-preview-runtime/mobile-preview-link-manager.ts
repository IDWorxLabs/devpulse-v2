/**
 * Mobile Preview Runtime Foundation — preview link metadata (no streaming or rendering).
 */

import {
  getStoredMobilePreviewSession,
  storeMobilePreviewSession,
  nextMobilePreviewLinkId,
  storeMobilePreviewLink,
  getStoredMobilePreviewLink,
  listStoredMobilePreviewLinks,
  listStoredMobilePreviewLinksForSession,
  listStoredMobilePreviewSessions,
  resetMobilePreviewLinkCounterForTests,
} from './mobile-preview-store.js';
import { recordMobilePreviewHistoryEntry } from './mobile-preview-history.js';
import type { MobilePreviewLink } from './mobile-preview-types.js';
import { MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-preview-types.js';

export { resetMobilePreviewLinkCounterForTests };

export function registerPreviewLink(input: {
  mobilePreviewId: string;
  urlMetadata: string;
  linkType: string;
  previewTarget?: string;
  previewType?: string;
}): MobilePreviewLink | null {
  const session = getStoredMobilePreviewSession(input.mobilePreviewId);
  if (!session) return null;
  if (!input.urlMetadata?.trim()) return null;
  if (!input.linkType?.trim()) return null;

  const owner = session.mobilePreviewOwner;
  const link: MobilePreviewLink = {
    linkId: nextMobilePreviewLinkId(),
    mobilePreviewId: input.mobilePreviewId,
    projectId: owner.projectId,
    workspaceId: owner.workspaceId,
    persistentBuildId: owner.persistentBuildId,
    linkType: input.linkType,
    urlMetadata: input.urlMetadata.trim(),
    previewTarget: input.previewTarget ?? 'GENERAL_PREVIEW_TARGET',
    previewType: input.previewType ?? 'METADATA_ONLY',
    linkUrl: input.urlMetadata.trim(),
    linkAuthority: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
    registeredAt: Date.now(),
    metadataOnly: true,
  };

  storeMobilePreviewLink(link);
  storeMobilePreviewSession({
    ...session,
    mobilePreviewLinks: [...session.mobilePreviewLinks, link],
    updatedAt: Date.now(),
  });

  recordMobilePreviewHistoryEntry({
    mobilePreviewId: input.mobilePreviewId,
    category: 'PREVIEW_LINK',
    summary: `Preview link registered: ${link.linkType} — ${link.urlMetadata}`,
    scopeUsed: link.linkId,
  });

  return link;
}

export function getPreviewLink(linkId: string): MobilePreviewLink | null {
  return getStoredMobilePreviewLink(linkId);
}

export function listPreviewLinks(mobilePreviewId?: string): MobilePreviewLink[] {
  if (mobilePreviewId) return listStoredMobilePreviewLinksForSession(mobilePreviewId);
  return listStoredMobilePreviewLinks();
}

export function listPreviewLinksByProject(projectId: string): MobilePreviewLink[] {
  return listStoredMobilePreviewLinks().filter((link) => link.projectId === projectId);
}

export function listPreviewLinksByWorkspace(workspaceId: string): MobilePreviewLink[] {
  return listStoredMobilePreviewLinks().filter((link) => link.workspaceId === workspaceId);
}

export function listPreviewLinksByBuild(persistentBuildId: string): MobilePreviewLink[] {
  return listStoredMobilePreviewLinks().filter((link) => link.persistentBuildId === persistentBuildId);
}

export function listPreviewLinksForRegisteredSessions(): MobilePreviewLink[] {
  const sessionIds = new Set(listStoredMobilePreviewSessions().map((s) => s.mobilePreviewId));
  return listStoredMobilePreviewLinks().filter((link) => sessionIds.has(link.mobilePreviewId));
}
