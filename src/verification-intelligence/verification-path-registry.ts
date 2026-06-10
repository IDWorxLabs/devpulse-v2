/**
 * Verification Intelligence — verification path registry.
 */

import type { VerificationPlanType } from './verification-plan-types.js';

export interface VerificationPathEntry {
  planType: VerificationPlanType;
  description: string;
  targetConfidence: number;
  expectedValidatorGroups: string[];
  estimatedRiskTolerance: number;
}

export const VERIFICATION_PATH_REGISTRY: readonly VerificationPathEntry[] = [
  {
    planType: 'QUICK',
    description: 'Minimum verification cost for low-risk read-only and planning work',
    targetConfidence: 55,
    expectedValidatorGroups: ['UVL'],
    estimatedRiskTolerance: 40,
  },
  {
    planType: 'STANDARD',
    description: 'Balanced confidence for normal feature, UI, and code work',
    targetConfidence: 70,
    expectedValidatorGroups: ['UVL', 'Runtime'],
    estimatedRiskTolerance: 55,
  },
  {
    planType: 'DEEP',
    description: 'Maximum confidence for architecture, brain, routing, and governance changes',
    targetConfidence: 85,
    expectedValidatorGroups: ['Runtime', 'Route Validation', 'Intelligence Validation', 'UVL'],
    estimatedRiskTolerance: 25,
  },
  {
    planType: 'RELEASE',
    description: 'Release confidence for production packaging and deployment preparation',
    targetConfidence: 90,
    expectedValidatorGroups: ['Runtime', 'Release Validation', 'UVL', 'Report Generation'],
    estimatedRiskTolerance: 15,
  },
  {
    planType: 'CLOUD',
    description: 'Runtime confidence for cloud, worker, and remote execution changes',
    targetConfidence: 80,
    expectedValidatorGroups: ['Cloud Validation', 'Runtime', 'UVL'],
    estimatedRiskTolerance: 30,
  },
  {
    planType: 'WORLD2',
    description: 'Autonomous safety for builder, workspace, and project generation',
    targetConfidence: 85,
    expectedValidatorGroups: ['Execution Validation', 'World2 Validation', 'UVL'],
    estimatedRiskTolerance: 20,
  },
  {
    planType: 'TRUST_RECOVERY',
    description: 'Rebuild trust after repeated failures or verification disagreement',
    targetConfidence: 92,
    expectedValidatorGroups: ['Trust Validation', 'Runtime', 'Intelligence Validation', 'UVL', 'Report Generation'],
    estimatedRiskTolerance: 10,
  },
  {
    planType: 'RISK_ESCALATED',
    description: 'Maximize protection when critical subsystems or severe blast radius are touched',
    targetConfidence: 95,
    expectedValidatorGroups: ['Runtime', 'Route Validation', 'Intelligence Validation', 'Execution Validation', 'UVL', 'Report Generation'],
    estimatedRiskTolerance: 5,
  },
] as const;

export function getVerificationPathEntry(
  planType: VerificationPlanType,
): VerificationPathEntry | undefined {
  return VERIFICATION_PATH_REGISTRY.find((e) => e.planType === planType);
}

export function listVerificationPathEntries(): VerificationPathEntry[] {
  return [...VERIFICATION_PATH_REGISTRY];
}
