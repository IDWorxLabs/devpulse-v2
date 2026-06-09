/**
 * Mobile Approval Runtime Foundation — approval visibility (metadata only).
 */

import { getStoredMobileApprovalSession, storeMobileApprovalSession } from './mobile-approval-store.js';
import { recordMobileApprovalHistoryEntry } from './mobile-approval-history.js';
import type { MobileApprovalVisibility } from './mobile-approval-types.js';

const VALID_VISIBILITY: readonly MobileApprovalVisibility[] = [
  'PRIVATE',
  'PROJECT',
  'WORKSPACE',
  'FOUNDER',
] as const;

export function buildDefaultMobileApprovalVisibility(
  mobileApprovalType = 'GENERAL_APPROVAL',
): MobileApprovalVisibility {
  if (mobileApprovalType === 'FOUNDER_APPROVAL' || mobileApprovalType === 'SELF_EVOLUTION_APPROVAL') {
    return 'FOUNDER';
  }
  if (mobileApprovalType === 'PROJECT_APPROVAL' || mobileApprovalType === 'BUILD_APPROVAL') {
    return 'PROJECT';
  }
  if (mobileApprovalType === 'CLOUD_APPROVAL' || mobileApprovalType === 'WORLD2_APPROVAL') {
    return 'WORKSPACE';
  }
  return 'PROJECT';
}

export function getMobileApprovalVisibility(mobileApprovalId: string): MobileApprovalVisibility | null {
  return getStoredMobileApprovalSession(mobileApprovalId)?.mobileApprovalVisibility ?? null;
}

export function setMobileApprovalVisibility(
  mobileApprovalId: string,
  visibility: MobileApprovalVisibility,
): MobileApprovalVisibility | null {
  const issues = validateMobileApprovalVisibility(visibility);
  if (issues.length > 0) return null;

  const session = getStoredMobileApprovalSession(mobileApprovalId);
  if (!session) return null;

  storeMobileApprovalSession({
    ...session,
    mobileApprovalVisibility: visibility,
    updatedAt: Date.now(),
  });

  recordMobileApprovalHistoryEntry({
    mobileApprovalId,
    category: 'MOBILE_APPROVAL',
    summary: `Approval visibility set to ${visibility}`,
    scopeUsed: mobileApprovalId,
  });

  return visibility;
}

export function validateMobileApprovalVisibility(visibility: MobileApprovalVisibility): string[] {
  const issues: string[] = [];
  if (!VALID_VISIBILITY.includes(visibility)) {
    issues.push(`Invalid approval visibility: ${visibility}`);
  }
  return issues;
}
