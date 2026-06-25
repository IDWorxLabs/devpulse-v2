/**
 * Project Isolation Guard V1 — response helpers and event tagging.
 */

import type { OperatorFeedEvent } from '../command-center-brain/brain-types.js';
import type {
  OperatorFeedEventIsolation,
  ProjectIsolationCheckResult,
  ProjectNotificationRecord,
} from './project-isolation-guard-types.js';

export function tagOperatorFeedEventWithProjectId(
  event: OperatorFeedEvent,
  projectId: string | null,
  options?: { scope?: 'PROJECT' | 'GLOBAL' },
): OperatorFeedEvent & { projectId: string | null; scope: 'PROJECT' | 'GLOBAL' } {
  return {
    ...event,
    projectId,
    scope: options?.scope ?? (projectId ? 'PROJECT' : 'GLOBAL'),
  };
}

export function toOperatorFeedEventIsolation(
  event: OperatorFeedEvent & { projectId?: string | null; scope?: string },
): OperatorFeedEventIsolation {
  return {
    projectId: event.projectId ?? null,
    eventType: event.eventType,
    timestamp: event.timestamp,
    details: event.detail ?? event.action ?? '',
    scope: event.scope === 'GLOBAL' ? 'GLOBAL' : 'PROJECT',
  };
}

export function createProjectNotification(input: {
  text: string;
  projectId?: string | null;
  scope?: 'PROJECT' | 'GLOBAL';
}): ProjectNotificationRecord & { id: string; type: string; read: boolean } {
  const scope = input.scope ?? (input.projectId ? 'PROJECT' : 'GLOBAL');
  return {
    id: `notif-${Date.now()}`,
    type: 'simple',
    read: false,
    text: input.text,
    projectId: scope === 'GLOBAL' ? null : (input.projectId ?? null),
    scope,
    timestamp: new Date().toISOString(),
  };
}

export function composeProjectIsolationGuardPayload(input: {
  check: ProjectIsolationCheckResult;
}): Record<string, unknown> {
  return {
    category: 'PROJECT_ISOLATION_GUARD',
    projectIsolation: input.check,
    ok: input.check.verdict === 'ISOLATED',
    message:
      input.check.verdict === 'ISOLATED'
        ? `Project ${input.check.viewerProjectId} is isolated — no cross-project leakage detected.`
        : `Project isolation violation detected for ${input.check.viewerProjectId}.`,
  };
}
