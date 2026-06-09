/**
 * Founder Notification Runtime Foundation — context aggregation (read-only metadata).
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readSystemSummariesForFounderNotification } from './read-cache.js';
import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { getRuntime } from '../cloud-runtime/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getMobileCommandSession } from '../mobile-command-runtime/index.js';
import { getMobileChatSession } from '../mobile-chat-runtime/index.js';
import { getMobilePreviewSession } from '../mobile-preview-runtime/index.js';
import { getMobileApprovalSession } from '../mobile-approval-runtime/index.js';
import { getCrossDeviceSession } from '../cross-device-runtime/index.js';
import { getStoredNotification, storeNotification } from './founder-notification-store.js';
import { recordNotificationHistoryEntry } from './founder-notification-history.js';
import type { NotificationContext } from './founder-notification-types.js';

export function buildDefaultNotificationContext(input: {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  approvalId: string;
  previewId: string;
  commandSessionId: string;
  chatSessionId: string;
  crossDeviceSessionId: string;
  operatorFeedEventId?: string;
}): NotificationContext {
  return {
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    approvalId: input.approvalId,
    previewId: input.previewId,
    commandSessionId: input.commandSessionId,
    chatSessionId: input.chatSessionId,
    crossDeviceSessionId: input.crossDeviceSessionId,
    operatorFeedEventId: input.operatorFeedEventId ?? 'devpulse_v2_operator_feed_foundation',
  };
}

export function refreshNotificationContext(notificationId: string): NotificationContext | null {
  const notification = getStoredNotification(notificationId);
  if (!notification) return null;

  const ctx = buildDefaultNotificationContext({
    ...notification.notificationContext,
    operatorFeedEventId: notification.notificationContext.operatorFeedEventId,
  });

  storeNotification({
    ...notification,
    notificationContext: ctx,
    updatedAt: Date.now(),
  });

  recordNotificationHistoryEntry({
    notificationId,
    category: 'CONTEXT',
    summary: `Context refreshed for ${notificationId}`,
    scopeUsed: notificationId,
  });

  return ctx;
}

export function getNotificationContextById(notificationId: string): NotificationContext | null {
  return getStoredNotification(notificationId)?.notificationContext ?? null;
}

export function validateNotificationContext(context: NotificationContext): string[] {
  const issues: string[] = [];
  if (!context.projectId?.trim()) issues.push('Missing projectId');
  if (!context.crossDeviceSessionId?.trim()) issues.push('Missing crossDeviceSessionId');
  return issues;
}

export function detectNotificationContextMismatch(notificationId: string): boolean {
  const notification = getStoredNotification(notificationId);
  if (!notification) return true;

  const ctx = notification.notificationContext;
  const command = getMobileCommandSession(ctx.commandSessionId);
  const chat = getMobileChatSession(ctx.chatSessionId);
  const preview = getMobilePreviewSession(ctx.previewId);
  const approval = getMobileApprovalSession(ctx.approvalId);
  const runtime = getRuntime(ctx.runtimeId);
  const workspace = getWorkspace(ctx.workspaceId);
  const build = getPersistentBuild(ctx.persistentBuildId);
  const crossDevice = getCrossDeviceSession(ctx.crossDeviceSessionId);
  const vault = getDevPulseV2ProjectVaultAuthority();
  const feedDiag = getOperatorFeedDiagnostics();
  readSystemSummariesForFounderNotification();

  if (!command || !chat || !preview || !approval || !runtime || !workspace || !build || !crossDevice) {
    return true;
  }
  if (command.mobileCommandOwner.projectId !== ctx.projectId) return true;
  if (crossDevice.crossDeviceOwner.projectId !== ctx.projectId) return true;
  if (!vault.listProjects().some((p) => p.projectId === ctx.projectId)) return true;
  if (!feedDiag.operatorFeedActive && ctx.operatorFeedEventId) return false;
  return false;
}
