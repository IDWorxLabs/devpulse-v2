/**
 * Recovery Execution bridge — consumes Phase 6.4 recovery plans.
 */

import { EXECUTION_OWNER_MODULE } from '../execution-authority/types.js';
import { RUNTIME_OWNER_MODULE } from '../execution-runtime/types.js';
import { VERIFICATION_OWNER_MODULE } from '../execution-verification/types.js';
import {
  getDevPulseV2RecoveryExecutionEngine,
  RECOVERY_EXECUTION_OWNER_MODULE,
} from '../recovery-execution/index.js';
import type { RecoveryRecord } from '../recovery-execution/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';

export function getRecoveryRecordForApproval(recoveryPlanId: string): RecoveryRecord | null {
  const records = getDevPulseV2RecoveryExecutionEngine().getRecords();
  const match = records.find((r) => r.plan.recoveryPlanId === recoveryPlanId);
  return match ?? null;
}

export function getRecoveryRecordByPackageId(packageId: string): RecoveryRecord | null {
  const records = getDevPulseV2RecoveryExecutionEngine().getRecords();
  const matches = records.filter((r) => r.plan.packageId === packageId);
  return matches.length > 0 ? matches[matches.length - 1] : null;
}

export function assertRecoveryExecutionDependency(): boolean {
  return getDevPulseV2Owner('recovery_execution_engine').ownerModule === RECOVERY_EXECUTION_OWNER_MODULE;
}

export function assertExecutionStackDependencies(): boolean {
  return (
    getDevPulseV2Owner('execution_authority').ownerModule === EXECUTION_OWNER_MODULE &&
    getDevPulseV2Owner('execution_package_runtime').ownerModule === RUNTIME_OWNER_MODULE &&
    getDevPulseV2Owner('execution_verification_loop').ownerModule === VERIFICATION_OWNER_MODULE &&
    assertRecoveryExecutionDependency()
  );
}

export function getApprovalDependencyChainSummary(): string {
  const authority = getDevPulseV2Owner('execution_authority');
  const runtime = getDevPulseV2Owner('execution_package_runtime');
  const verification = getDevPulseV2Owner('execution_verification_loop');
  const recovery = getDevPulseV2Owner('recovery_execution_engine');
  const approval = getDevPulseV2Owner('founder_approval_execution_gate');
  return (
    `${authority.domain}@${authority.phase} → ${runtime.domain}@${runtime.phase} → ` +
    `${verification.domain}@${verification.phase} → ${recovery.domain}@${recovery.phase} → ` +
    `${approval.domain}@${approval.phase}`
  );
}
