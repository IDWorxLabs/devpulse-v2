/**
 * Execution Package Runtime bridge — consumes Phase 6.2 records; does not duplicate runtime.
 */

import { EXECUTION_OWNER_MODULE } from '../execution-authority/types.js';
import {
  getDevPulseV2ExecutionPackageRuntime,
  RUNTIME_OWNER_MODULE,
} from '../execution-runtime/index.js';
import type { RuntimeRecord } from '../execution-runtime/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';

export function getRuntimeRecordForVerification(packageId: string): RuntimeRecord | null {
  return getDevPulseV2ExecutionPackageRuntime().getRecord(packageId);
}

export function assertExecutionRuntimeOwnershipUnchanged(): boolean {
  return getDevPulseV2Owner('execution_package_runtime').ownerModule === RUNTIME_OWNER_MODULE;
}

export function assertExecutionAuthorityDependencyPresent(): boolean {
  return getDevPulseV2Owner('execution_authority').ownerModule === EXECUTION_OWNER_MODULE;
}

export function assertVerificationDoesNotDuplicateRuntime(): boolean {
  const runtime = getDevPulseV2Owner('execution_package_runtime');
  const verification = getDevPulseV2Owner('execution_verification_loop');
  return (
    runtime.ownerModule === RUNTIME_OWNER_MODULE &&
    verification.ownerModule === 'devpulse_v2_execution_verification_loop' &&
    runtime.domain !== verification.domain
  );
}

export function getDependencyChainSummary(): string {
  const authority = getDevPulseV2Owner('execution_authority');
  const runtime = getDevPulseV2Owner('execution_package_runtime');
  const verification = getDevPulseV2Owner('execution_verification_loop');
  return (
    `${authority.domain}@${authority.phase} → ${runtime.domain}@${runtime.phase} → ` +
    `${verification.domain}@${verification.phase}`
  );
}
