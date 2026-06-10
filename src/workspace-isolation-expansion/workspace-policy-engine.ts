/**
 * Workspace Isolation Expansion — workspace policy evaluation.
 */

import type { WorkspacePolicyDecision } from './workspace-isolation-types.js';
import { getWorkspaceOwner } from './workspace-ownership-manager.js';
import { validateWorkspaceAccess } from './workspace-access-controller.js';
import {
  getCachedPolicyDecision,
  setCachedPolicyDecision,
} from './workspace-cache.js';

export function evaluateWorkspacePolicy(
  workspaceId: string,
  requestingProjectId: string,
): WorkspacePolicyDecision {
  const cacheKey = `${workspaceId}:${requestingProjectId}`;
  const cached = getCachedPolicyDecision(cacheKey);
  if (cached) return cached as WorkspacePolicyDecision;

  const owner = getWorkspaceOwner(workspaceId);
  if (!owner) {
    setCachedPolicyDecision(cacheKey, 'POLICY_DENY');
    return 'POLICY_DENY';
  }

  if (requestingProjectId === owner) {
    setCachedPolicyDecision(cacheKey, 'POLICY_ALLOW');
    return 'POLICY_ALLOW';
  }

  const access = validateWorkspaceAccess(workspaceId, requestingProjectId);
  if (access === 'ACCESS_GRANTED') {
    setCachedPolicyDecision(cacheKey, 'POLICY_ALLOW');
    return 'POLICY_ALLOW';
  }

  if (access === 'ACCESS_REQUIRES_AUTHORIZATION') {
    setCachedPolicyDecision(cacheKey, 'POLICY_ESCALATE');
    return 'POLICY_ESCALATE';
  }

  setCachedPolicyDecision(cacheKey, 'POLICY_DENY');
  return 'POLICY_DENY';
}
