/**
 * Workspace Isolation Expansion — workspace coordination.
 */

import type { RegisterWorkspaceInput, WorkspaceRecord } from './workspace-isolation-types.js';
import { registerWorkspace, updateWorkspaceRecord, getWorkspaceRecord } from './workspace-registry.js';
import { assignWorkspaceOwner } from './workspace-ownership-manager.js';
import { createWorkspaceBoundary } from './workspace-boundary-manager.js';
import { evaluateWorkspacePolicy } from './workspace-policy-engine.js';
import { validateWorkspaceIsolation } from './workspace-isolation-validator.js';
import { detectWorkspaceViolations } from './workspace-violation-detector.js';
import { generateWorkspaceBoundaryReport } from './workspace-boundary-reporting.js';

export interface CoordinateWorkspaceResult {
  record: WorkspaceRecord;
  isolation: ReturnType<typeof validateWorkspaceIsolation>;
  policy: ReturnType<typeof evaluateWorkspacePolicy>;
  violations: ReturnType<typeof detectWorkspaceViolations>;
  report: ReturnType<typeof generateWorkspaceBoundaryReport>;
}

export function coordinateWorkspace(input: RegisterWorkspaceInput): CoordinateWorkspaceResult {
  const record = registerWorkspace(input);

  const ownership = assignWorkspaceOwner(input.workspaceId, input.ownerProjectId);
  if (!ownership.ok) {
    throw new Error(ownership.error);
  }

  createWorkspaceBoundary(input.workspaceId, input.ownerProjectId);

  const isolation = validateWorkspaceIsolation(input.workspaceId, input.ownerProjectId);
  if (isolation.status === 'ISOLATION_VIOLATION') {
    const updated: WorkspaceRecord = {
      ...record,
      isolationStatus: 'ISOLATION_VIOLATION',
      updatedAt: Date.now(),
    };
    updateWorkspaceRecord(updated);
  }

  const policy = evaluateWorkspacePolicy(input.workspaceId, input.ownerProjectId);
  const violations = detectWorkspaceViolations(input.workspaceId);
  const report = generateWorkspaceBoundaryReport(input.workspaceId, input.ownerProjectId);

  const finalRecord = getWorkspaceRecord(input.workspaceId) ?? record;

  return {
    record: finalRecord,
    isolation,
    policy,
    violations,
    report,
  };
}
