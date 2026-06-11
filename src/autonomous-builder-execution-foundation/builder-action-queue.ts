/**
 * Builder action queue — bounded queue with full audit trail (Phase 24B).
 * Queues planned actions only — validation and dashboard must not execute them.
 */

import { MAX_ACTION_QUEUE_SIZE, MAX_QUEUE_AUDIT_ENTRIES } from './autonomous-builder-execution-foundation-bounds.js';
import type { BuilderAction } from './builder-action-model.js';

export type QueueAuditEventType =
  | 'ENQUEUE'
  | 'DEQUEUE'
  | 'PAUSE'
  | 'RESUME'
  | 'CANCEL'
  | 'REPLAY'
  | 'QUEUE_FULL';

export interface BuilderQueueAuditEntry {
  auditId: string;
  eventType: QueueAuditEventType;
  actionId: string | null;
  detail: string;
  recordedAt: number;
}

const queue: BuilderAction[] = [];
const auditTrail: BuilderQueueAuditEntry[] = [];
let auditCounter = 0;
let paused = false;

export function resetBuilderActionQueueForTests(): void {
  queue.length = 0;
  auditTrail.length = 0;
  auditCounter = 0;
  paused = false;
}

function pushAudit(eventType: QueueAuditEventType, actionId: string | null, detail: string): void {
  auditCounter += 1;
  auditTrail.unshift({
    auditId: `queue-audit-${auditCounter}`,
    eventType,
    actionId,
    detail,
    recordedAt: Date.now(),
  });
  if (auditTrail.length > MAX_QUEUE_AUDIT_ENTRIES) {
    auditTrail.length = MAX_QUEUE_AUDIT_ENTRIES;
  }
}

export function enqueueBuilderAction(action: BuilderAction): { accepted: boolean; action: BuilderAction | null } {
  if (queue.length >= MAX_ACTION_QUEUE_SIZE) {
    pushAudit('QUEUE_FULL', action.actionId, 'Queue at maximum capacity');
    return { accepted: false, action: null };
  }
  queue.push(action);
  pushAudit('ENQUEUE', action.actionId, `${action.actionType} queued for ${action.workspaceId}`);
  return { accepted: true, action };
}

export function dequeueBuilderAction(): BuilderAction | null {
  if (paused || queue.length === 0) return null;
  const action = queue.shift() ?? null;
  if (action) {
    pushAudit('DEQUEUE', action.actionId, `${action.actionType} dequeued`);
  }
  return action;
}

export function pauseBuilderActionQueue(): void {
  paused = true;
  pushAudit('PAUSE', null, 'Action queue paused');
}

export function resumeBuilderActionQueue(): void {
  paused = false;
  pushAudit('RESUME', null, 'Action queue resumed');
}

export function cancelBuilderAction(actionId: string): BuilderAction | null {
  const index = queue.findIndex((a) => a.actionId === actionId);
  if (index < 0) return null;
  const [action] = queue.splice(index, 1);
  const cancelled = { ...action, status: 'CANCELLED' as const, updatedAt: Date.now() };
  pushAudit('CANCEL', actionId, `${action.actionType} cancelled`);
  return cancelled;
}

export function replayBuilderAction(action: BuilderAction): { accepted: boolean; action: BuilderAction | null } {
  const replay = {
    ...action,
    actionId: `${action.actionId}-replay-${Date.now()}`,
    status: 'REPLAY_QUEUED' as const,
    evidenceProduced: [],
    executionResult: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const result = enqueueBuilderAction({ ...replay, status: 'QUEUED' });
  if (result.accepted) {
    pushAudit('REPLAY', action.actionId, `Replay queued as ${result.action?.actionId ?? replay.actionId}`);
  }
  return result;
}

export function getBuilderActionQueueSize(): number {
  return queue.length;
}

export function isBuilderActionQueuePaused(): boolean {
  return paused;
}

export function listQueuedBuilderActions(): BuilderAction[] {
  return [...queue];
}

export function getBuilderQueueAuditTrail(): BuilderQueueAuditEntry[] {
  return [...auditTrail];
}

export function getBuilderQueueAuditCount(): number {
  return auditTrail.length;
}
