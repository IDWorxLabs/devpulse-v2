/**
 * Multi Project Verification — record aggregation.
 */

import type {
  ProjectVerificationRecord,
  ProjectVerificationStatus,
  ProjectVerificationInput,
  ProjectVerificationEvidence,
} from './multi-project-verification-types.js';
import { evaluateProjectVerificationReadiness, isVerificationReady } from './project-verification-readiness.js';

export function aggregateProjectVerification(
  input: ProjectVerificationInput,
  evidence: ProjectVerificationEvidence,
  confidence: number,
  riskScore: number,
): ProjectVerificationRecord {
  const status = evaluateProjectVerificationReadiness(input, evidence, confidence, riskScore);

  return {
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    status,
    confidence,
    riskScore,
    readiness: isVerificationReady(status),
    generatedAt: Date.now(),
  };
}

export function getStatusPriority(status: ProjectVerificationStatus): number {
  const order: Record<ProjectVerificationStatus, number> = {
    BLOCKED: 5,
    HIGH_RISK: 4,
    TRUST_RECOVERY_REQUIRED: 3,
    NEEDS_VERIFICATION: 2,
    VERIFIED: 1,
  };
  return order[status];
}
