/**
 * Command Center Chat Execution Audit V1 — in-memory audit trail store.
 */

import type { ChatExecutionAuditTrail } from './audit-types.js';

const trails = new Map<string, ChatExecutionAuditTrail>();
let latestAuditId: string | null = null;

export function storeChatExecutionAuditTrail(trail: ChatExecutionAuditTrail): void {
  trails.set(trail.auditId, trail);
  latestAuditId = trail.auditId;
}

export function getChatExecutionAuditTrail(auditId: string): ChatExecutionAuditTrail | null {
  return trails.get(auditId) ?? null;
}

export function getLatestChatExecutionAuditTrail(): ChatExecutionAuditTrail | null {
  return latestAuditId ? trails.get(latestAuditId) ?? null : null;
}

export function listChatExecutionAuditTrails(): ChatExecutionAuditTrail[] {
  return [...trails.values()].sort((a, b) => b.startedAt - a.startedAt);
}

export function resetChatExecutionAuditStoreForTests(): void {
  trails.clear();
  latestAuditId = null;
}
