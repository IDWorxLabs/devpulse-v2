/**
 * Founder Notification Runtime Foundation — Project Vault bridge.
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getStoredNotification, listStoredNotifications, storeNotification } from './founder-notification-store.js';
import { recordNotificationHistoryEntry } from './founder-notification-history.js';
import type { FounderNotification, NotificationProjectVaultLink } from './founder-notification-types.js';
import { FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE } from './founder-notification-types.js';

export function linkNotificationToProjectVault(
  notificationId: string,
  vaultProjectId: string,
): NotificationProjectVaultLink | null {
  const notification = getStoredNotification(notificationId);
  if (!notification) return null;

  const vault = getDevPulseV2ProjectVaultAuthority();
  const project = vault.listProjects().find((p) => p.projectId === vaultProjectId);
  const mismatch = !project || project.projectId !== notification.notificationOwnership.projectId;

  const link: NotificationProjectVaultLink = {
    vaultProjectId,
    linkedAt: Date.now(),
    linkAuthority: FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeNotification({
    ...notification,
    notificationProjectVaultLink: link,
    updatedAt: Date.now(),
  });

  recordNotificationHistoryEntry({
    notificationId,
    category: 'PROJECT_VAULT',
    summary: `Linked to project vault ${vaultProjectId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: vaultProjectId,
  });

  return link;
}

export function getProjectVaultForNotification(notificationId: string): string | null {
  return getStoredNotification(notificationId)?.notificationProjectVaultLink.vaultProjectId ?? null;
}

export function listNotificationsByProjectVault(vaultProjectId: string): FounderNotification[] {
  return listStoredNotifications().filter(
    (n) => n.notificationProjectVaultLink.vaultProjectId === vaultProjectId,
  );
}

export function detectNotificationProjectVaultMismatch(notificationId: string): boolean {
  const notification = getStoredNotification(notificationId);
  if (!notification) return true;
  const vault = getDevPulseV2ProjectVaultAuthority();
  const project = vault.listProjects().find(
    (p) => p.projectId === notification.notificationProjectVaultLink.vaultProjectId,
  );
  if (!project) return true;
  return (
    project.projectId !== notification.notificationOwnership.projectId ||
    notification.notificationProjectVaultLink.mismatchDetected
  );
}
