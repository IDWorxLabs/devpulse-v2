/**
 * Self Vision session registry — ownership, preview linkage, observation metadata.
 */

import { capabilitiesForTargetType } from './types.js';
import { SELF_VISION_RUNTIME_OWNER_MODULE } from './types.js';
import type { ObservationState, SelfVisionSession, CapturePlanItem, ObservationCapabilityType } from './types.js';
import type { PreviewTargetType } from '../live-preview-runtime/types.js';

let sessionCounter = 0;
const sessions = new Map<string, SelfVisionSession>();
const sessionKeys = new Set<string>();

function nextSessionId(): string {
  sessionCounter += 1;
  return `svsess-${sessionCounter.toString().padStart(4, '0')}`;
}

function sessionKey(projectId: string, workspaceId: string, previewSessionId: string): string {
  return `${projectId}|${workspaceId}|${previewSessionId}`;
}

export function resetSelfVisionSessionRegistryForTests(): void {
  sessionCounter = 0;
  sessions.clear();
  sessionKeys.clear();
}

export function createSelfVisionSession(opts: {
  previewSessionId: string;
  projectId: string;
  workspaceId: string;
  targetType: PreviewTargetType;
  capturePlan: CapturePlanItem[];
  observationState?: ObservationState;
  warnings?: string[];
  blockedReasons?: string[];
  allowDuplicate?: boolean;
}): { session: SelfVisionSession | null; duplicate: boolean } {
  const key = sessionKey(opts.projectId, opts.workspaceId, opts.previewSessionId);
  if (sessionKeys.has(key) && !opts.allowDuplicate) {
    return { session: null, duplicate: true };
  }

  const capabilities: ObservationCapabilityType[] = capabilitiesForTargetType(opts.targetType);
  const session: SelfVisionSession = {
    selfVisionSessionId: nextSessionId(),
    previewSessionId: opts.previewSessionId,
    projectId: opts.projectId,
    workspaceId: opts.workspaceId,
    targetType: opts.targetType,
    observationState: opts.observationState ?? 'DISCOVERED',
    capturePlan: opts.capturePlan,
    observationCapabilities: capabilities,
    warnings: opts.warnings ?? [],
    blockedReasons: opts.blockedReasons ?? [],
    createdAt: Date.now(),
  };

  sessions.set(session.selfVisionSessionId, session);
  sessionKeys.add(key);
  return { session, duplicate: false };
}

export function getSelfVisionSession(sessionId: string): SelfVisionSession | null {
  return sessions.get(sessionId) ?? null;
}

export function getSelfVisionSessionByPreview(previewSessionId: string): SelfVisionSession | null {
  for (const session of sessions.values()) {
    if (session.previewSessionId === previewSessionId) return session;
  }
  return null;
}

export function listSelfVisionSessions(): SelfVisionSession[] {
  return [...sessions.values()];
}

export function hasSelfVisionSession(
  projectId: string,
  workspaceId: string,
  previewSessionId: string,
): boolean {
  return sessionKeys.has(sessionKey(projectId, workspaceId, previewSessionId));
}

export function getSelfVisionOwnerModule(): string {
  return SELF_VISION_RUNTIME_OWNER_MODULE;
}
