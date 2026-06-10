/**
 * Autonomous Verification — decision registry metadata.
 */

import type { VerificationDecision } from './autonomous-verification-types.js';

export interface VerificationDecisionEntry {
  decision: VerificationDecision;
  description: string;
  confidenceRequirement: number;
  trustRequirement: number;
  riskTolerance: number;
}

export const VERIFICATION_DECISION_REGISTRY: readonly VerificationDecisionEntry[] = [
  { decision: 'VERIFIED', description: 'Sufficient evidence and acceptable trust/risk', confidenceRequirement: 70, trustRequirement: 65, riskTolerance: 35 },
  { decision: 'NEEDS_FIXING', description: 'Failure evidence requires repair before verification', confidenceRequirement: 45, trustRequirement: 40, riskTolerance: 55 },
  { decision: 'NEEDS_TESTING', description: 'Testing coverage or validation evidence insufficient', confidenceRequirement: 50, trustRequirement: 45, riskTolerance: 50 },
  { decision: 'TRUST_RECOVERY_REQUIRED', description: 'Trust degraded or confidence collapsed', confidenceRequirement: 60, trustRequirement: 70, riskTolerance: 20 },
  { decision: 'FOUNDER_REVIEW', description: 'Governance boundary or excessive uncertainty', confidenceRequirement: 75, trustRequirement: 70, riskTolerance: 15 },
  { decision: 'BLOCKED', description: 'Insufficient evidence or missing dependencies', confidenceRequirement: 0, trustRequirement: 0, riskTolerance: 0 },
] as const;

export function getVerificationDecisionEntry(decision: VerificationDecision): VerificationDecisionEntry | undefined {
  return VERIFICATION_DECISION_REGISTRY.find((e) => e.decision === decision);
}

export function listVerificationDecisionEntries(): VerificationDecisionEntry[] {
  return [...VERIFICATION_DECISION_REGISTRY];
}
