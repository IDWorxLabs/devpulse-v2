/**
 * Multi Project Verification Orchestration — capacity evaluation.
 */

import type {
  VerificationCapacityEvaluation,
  VerificationOrchestrationProjectInput,
} from './verification-orchestration-types.js';
import { getRemainingCapacity } from '../resource-allocation/resource-capacity-manager.js';
import { registerAllDefaultResources } from '../resource-allocation/resource-registry.js';
import { listProjectVerifications } from '../multi-project-verification/project-verification-registry.js';

export function evaluateVerificationCapacity(
  projects: VerificationOrchestrationProjectInput[],
  groupSize = 5,
): VerificationCapacityEvaluation {
  registerAllDefaultResources();

  const verificationSlots = getRemainingCapacity('VERIFICATION_SLOT');
  const workspaceSlots = getRemainingCapacity('WORKSPACE_SLOT');
  const world2Slots = getRemainingCapacity('WORLD2_SLOT');

  const verifiedCount = listProjectVerifications().filter((r) => r.status === 'VERIFIED').length;
  const pendingCount = projects.filter((p) => p.verificationStatus !== 'VERIFIED').length;

  const bottlenecks: string[] = [];
  const safeByVerification = Math.max(1, verificationSlots);
  const safeByWorkspace = Math.max(1, workspaceSlots);
  const safeByWorld2 = Math.max(1, world2Slots);

  if (verificationSlots < pendingCount) {
    bottlenecks.push('VERIFICATION_SLOT capacity limited');
  }
  if (workspaceSlots < projects.length) {
    bottlenecks.push('WORKSPACE_SLOT capacity limited');
  }
  if (world2Slots < Math.ceil(projects.length / groupSize)) {
    bottlenecks.push('WORLD2_SLOT capacity limited');
  }
  if (verifiedCount > 0 && pendingCount > verifiedCount * 3) {
    bottlenecks.push('Portfolio verification backlog exceeds safe ratio');
  }

  const safeLimit = Math.min(safeByVerification, safeByWorkspace, safeByWorld2, groupSize);
  const estimatedParallelism = Math.min(
    projects.length,
    safeLimit,
    Math.max(1, Math.min(verificationSlots, workspaceSlots)),
  );

  return {
    estimatedParallelism,
    bottlenecks,
    safeLimit,
  };
}
