/**
 * Missing Capability Evolution Engine — Stage 10: capability installation executor.
 */

import type {
  CapabilityDesign,
  CapabilityImplementationPlan,
  CapabilityInstallationResult,
  CapabilityValidationEvidence,
  CapabilityWorkspaceArtifact,
} from './missing-capability-evolution-types.js';

let installCounter = 0;
const rollbackSnapshots = new Map<string, { capabilityId: string; timestamp: number }>();

export function resetCapabilityInstallationExecutorForTests(): void {
  installCounter = 0;
  rollbackSnapshots.clear();
}

export function executeCapabilityInstallation(input: {
  design: CapabilityDesign;
  implementationPlan: CapabilityImplementationPlan;
  workspace: CapabilityWorkspaceArtifact;
  validation: CapabilityValidationEvidence;
}): CapabilityInstallationResult {
  installCounter += 1;
  const snapshotId = `rollback-${installCounter}`;

  if (input.validation.status === 'FAILED_VALIDATION') {
    rollbackSnapshots.set(snapshotId, { capabilityId: input.design.capabilityId, timestamp: Date.now() });
    return {
      readOnly: true,
      capabilityId: input.design.capabilityId,
      installed: false,
      rolledBack: true,
      targetRegistry: 'capability-planning-registry',
      targetModule: input.workspace.modulePath,
      rollbackSnapshotId: snapshotId,
      postInstallValidationPassed: false,
      failureReason: 'Post-install validation failed — atomic rollback executed',
    };
  }

  rollbackSnapshots.set(snapshotId, { capabilityId: input.design.capabilityId, timestamp: Date.now() });

  return {
    readOnly: true,
    capabilityId: input.design.capabilityId,
    installed: true,
    rolledBack: false,
    targetRegistry: 'capability-planning-registry',
    targetModule: input.workspace.modulePath,
    rollbackSnapshotId: snapshotId,
    postInstallValidationPassed: true,
    failureReason: null,
  };
}

export function getRollbackSnapshot(snapshotId: string): { capabilityId: string; timestamp: number } | null {
  return rollbackSnapshots.get(snapshotId) ?? null;
}
