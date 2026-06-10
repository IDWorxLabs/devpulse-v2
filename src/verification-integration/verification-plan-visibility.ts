/**
 * Verification Integration — visibility models for read-only consumers.
 */

import type { VerificationPlan } from '../verification-intelligence/verification-plan-types.js';
import type {
  VerificationReadinessModel,
  VerificationVisibilityModel,
} from './verification-integration-types.js';
import { getVerificationRegistrySize } from './verification-plan-registration.js';

export function getVerificationVisibilityModel(
  plan: VerificationPlan | null,
  readiness: VerificationReadinessModel | null,
): VerificationVisibilityModel {
  return {
    latestPlanId: plan?.id ?? null,
    activeStrategy: plan?.strategy ?? null,
    planType: plan?.type ?? null,
    confidence: plan?.confidence ?? 0,
    riskScore: plan?.riskScore ?? 0,
    readinessState: readiness?.state ?? 'NEEDS_REVIEW',
    registrySize: getVerificationRegistrySize(),
    generatedAt: Date.now(),
  };
}
