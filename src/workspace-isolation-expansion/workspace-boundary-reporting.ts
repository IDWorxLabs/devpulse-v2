/**
 * Workspace Isolation Expansion — workspace boundary reporting.
 */

import type { WorkspaceBoundaryReport, WorkspacePolicyDecision } from './workspace-isolation-types.js';
import { getWorkspaceRecord } from './workspace-registry.js';
import { getWorkspaceBoundary } from './workspace-boundary-manager.js';
import { getWorkspaceOwner } from './workspace-ownership-manager.js';
import { detectWorkspaceViolations } from './workspace-violation-detector.js';
import { evaluateWorkspacePolicy } from './workspace-policy-engine.js';
import { validateWorkspaceIsolation } from './workspace-isolation-validator.js';

let reportCounter = 0;

export function generateWorkspaceBoundaryReport(
  workspaceId: string,
  requestingProjectId?: string,
): WorkspaceBoundaryReport | undefined {
  const record = getWorkspaceRecord(workspaceId);
  if (!record) return undefined;

  reportCounter += 1;

  const boundary = getWorkspaceBoundary(workspaceId);
  const owner = getWorkspaceOwner(workspaceId) ?? record.ownerProjectId;
  const violations = detectWorkspaceViolations(workspaceId, requestingProjectId);
  const isolation = validateWorkspaceIsolation(workspaceId, requestingProjectId);

  const policyDecisions: WorkspacePolicyDecision[] = [];
  if (requestingProjectId) {
    policyDecisions.push(evaluateWorkspacePolicy(workspaceId, requestingProjectId));
  }
  policyDecisions.push(evaluateWorkspacePolicy(workspaceId, owner));

  const recommendations: string[] = [];
  if (violations.length > 0) {
    recommendations.push(...violations.map((v) => v.recommendedAction));
  } else {
    recommendations.push('Workspace isolation healthy');
  }

  return {
    reportId: `workspace-report-${reportCounter}`,
    workspaceId,
    ownerProjectId: owner,
    state: record.state,
    isolationStatus: isolation.status,
    authorizedAccess: boundary?.permittedAccess ?? [owner],
    violations,
    policyDecisions: [...new Set(policyDecisions)],
    recommendations,
    generatedAt: Date.now(),
  };
}

export function resetWorkspaceReportCounterForTests(): void {
  reportCounter = 0;
}
