/**
 * Workspace boundary rules — cross-workspace and World 1 protection rules.
 */

import type { Workspace, WorkspaceBoundaryCheck, WorkspaceCommunicationType } from './types.js';
import { WORLD1_PROTECTED_DOMAINS } from './types.js';

const ALLOWED_COMMUNICATION: WorkspaceCommunicationType[] = [
  'RECOMMENDATION',
  'PLAN',
  'STATUS',
  'RISK_REPORT',
];

const BLOCKED_COMMUNICATION: WorkspaceCommunicationType[] = [
  'DIRECT_WORLD1_MODIFICATION',
  'GOVERNANCE_BYPASS',
  'WORKSPACE_TAKEOVER',
];

export function isCommunicationAllowed(type: WorkspaceCommunicationType): boolean {
  return ALLOWED_COMMUNICATION.includes(type);
}

export function isCommunicationBlocked(type: WorkspaceCommunicationType): boolean {
  return BLOCKED_COMMUNICATION.includes(type);
}

export function checkCrossWorkspaceAccess(
  actorWorkspaceId: string,
  targetWorkspace: Workspace | null,
): WorkspaceBoundaryCheck {
  if (!targetWorkspace) {
    return { allowed: false, verdict: 'BOUNDARY_VIOLATION', reason: 'Target workspace not found' };
  }
  if (actorWorkspaceId !== targetWorkspace.workspaceId) {
    return {
      allowed: false,
      verdict: 'BOUNDARY_VIOLATION',
      reason: `Workspace ${actorWorkspaceId} may not access workspace ${targetWorkspace.workspaceId}`,
    };
  }
  return { allowed: true, verdict: 'ISOLATED', reason: 'Same-workspace access permitted' };
}

export function checkWorld1ModificationAttempt(targetDomain: string): WorkspaceBoundaryCheck {
  if ((WORLD1_PROTECTED_DOMAINS as readonly string[]).includes(targetDomain)) {
    return {
      allowed: false,
      verdict: 'WORLD1_PROTECTED',
      reason: `World 2 may not modify World 1 domain: ${targetDomain}`,
    };
  }
  return { allowed: true, verdict: 'ISOLATED', reason: 'Target is not a protected World 1 domain' };
}

export function checkWorkspaceTakeover(
  actorWorkspaceId: string,
  targetWorkspaceId: string,
): WorkspaceBoundaryCheck {
  if (actorWorkspaceId !== targetWorkspaceId) {
    return {
      allowed: false,
      verdict: 'BOUNDARY_VIOLATION',
      reason: 'Workspace takeover blocked — ownership boundaries enforced',
    };
  }
  return { allowed: true, verdict: 'ISOLATED', reason: 'Same workspace ownership confirmed' };
}

export function boundaryOutputKey(
  actorId: string,
  targetId: string,
  type: WorkspaceCommunicationType,
): string {
  return `${actorId}|${targetId}|${type}|${isCommunicationAllowed(type)}|${actorId === targetId}`;
}
