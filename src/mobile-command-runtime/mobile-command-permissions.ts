/**
 * Mobile Command Runtime Foundation — permissions metadata (no execution).
 */

import { getStoredMobileCommandSession, storeMobileCommandSession } from './mobile-command-store.js';
import { recordMobileCommandHistoryEntry } from './mobile-command-history.js';
import type { MobileCommandPermissions } from './mobile-command-types.js';

export function buildDefaultMobileCommandPermissions(
  mobileCommandType = 'GENERAL_MOBILE_COMMAND',
): MobileCommandPermissions {
  return {
    allowedMobileActions: ['view_status', 'view_context', 'view_diagnostics'],
    blockedMobileActions: ['execute_build', 'apply_changes', 'restart_workers'],
    requiresApprovalActions: ['approve_recovery_plan', 'approve_verification'],
    desktopOnlyActions: ['large_refactor', 'full_system_evolution'],
    cloudAllowedActions: ['view_cloud_runtime', 'view_workspace', 'view_build_state'],
    mobilePreviewAllowed: mobileCommandType !== 'FOUNDER_MOBILE_COMMAND',
    mobilePreviewBlockedReason: mobileCommandType === 'FOUNDER_MOBILE_COMMAND' ? 'Founder-only command surface' : null,
    largeSystemDesktopRecommended: true,
    founderOnlyActions: ['archive_project', 'override_governance'],
  };
}

export function updateMobileCommandPermissions(
  mobileCommandId: string,
  updates: Partial<MobileCommandPermissions>,
): MobileCommandPermissions | null {
  const session = getStoredMobileCommandSession(mobileCommandId);
  if (!session) return null;

  const permissions: MobileCommandPermissions = { ...session.mobileCommandPermissions, ...updates };
  storeMobileCommandSession({ ...session, mobileCommandPermissions: permissions, updatedAt: Date.now() });

  recordMobileCommandHistoryEntry({
    mobileCommandId,
    category: 'PERMISSION',
    summary: `Permissions updated: allowed=${permissions.allowedMobileActions.length} blocked=${permissions.blockedMobileActions.length}`,
    scopeUsed: mobileCommandId,
  });

  return permissions;
}

export function getMobileCommandPermissions(mobileCommandId: string): MobileCommandPermissions | null {
  return getStoredMobileCommandSession(mobileCommandId)?.mobileCommandPermissions ?? null;
}

export function validateMobileCommandPermissions(permissions: MobileCommandPermissions): string[] {
  const issues: string[] = [];
  if (!permissions.mobilePreviewAllowed && !permissions.mobilePreviewBlockedReason?.trim()) {
    issues.push('Mobile preview blocked without reason');
  }
  if (permissions.largeSystemDesktopRecommended && permissions.desktopOnlyActions.length === 0) {
    issues.push('Desktop recommendation missing desktop-only actions');
  }
  return issues;
}
