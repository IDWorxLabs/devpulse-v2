/**
 * Verification Integration — snapshot system.
 */

import type { VerificationStrategyDecision } from '../verification-strategy-core/verification-strategy-types.js';
import type { VerificationPlan } from '../verification-intelligence/verification-plan-types.js';
import type {
  VerificationIntegrationSnapshot,
  VerificationPlanReport,
  VerificationReadinessModel,
  VerificationVisibilityModel,
} from './verification-integration-types.js';
import { listAllVerificationPlans } from './verification-plan-registration.js';

let snapshotCount = 0;

export interface VerificationFullSnapshot {
  snapshotId: string;
  strategy: VerificationStrategyDecision;
  plan: VerificationPlan;
  readiness: VerificationReadinessModel;
  visibility: VerificationVisibilityModel;
  report: VerificationPlanReport;
  generatedAt: number;
}

export function createVerificationSnapshot(
  strategy: VerificationStrategyDecision,
  plan: VerificationPlan,
  readiness: VerificationReadinessModel,
  visibility: VerificationVisibilityModel,
  report: VerificationPlanReport,
): VerificationFullSnapshot {
  snapshotCount += 1;
  return {
    snapshotId: `vsnap-${snapshotCount}-${Date.now()}`,
    strategy,
    plan,
    readiness,
    visibility,
    report,
    generatedAt: Date.now(),
  };
}

export function createVerificationIntegrationSnapshot(): VerificationIntegrationSnapshot {
  snapshotCount += 1;
  return {
    snapshotId: `vint-snap-${snapshotCount}`,
    records: listAllVerificationPlans(),
    generatedAt: Date.now(),
  };
}

export function getVerificationSnapshotCount(): number {
  return snapshotCount;
}

export function resetVerificationSnapshotForTests(): void {
  snapshotCount = 0;
}
