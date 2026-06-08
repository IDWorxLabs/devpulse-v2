/**
 * Execution Verification bridge — consumes Phase 6.3 results; does not duplicate verification loop.
 */

import { EXECUTION_OWNER_MODULE } from '../execution-authority/types.js';
import { RUNTIME_OWNER_MODULE } from '../execution-runtime/types.js';
import {
  getDevPulseV2ExecutionVerificationLoop,
  VERIFICATION_OWNER_MODULE,
} from '../execution-verification/index.js';
import type { ExecutionVerificationResult } from '../execution-verification/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';

export function getVerificationResultForRecovery(
  packageId: string,
): ExecutionVerificationResult | null {
  const results = getDevPulseV2ExecutionVerificationLoop().getResults();
  const matches = results.filter((r) => r.packageId === packageId);
  return matches.length > 0 ? matches[matches.length - 1] : null;
}

export function getVerificationResultById(
  verificationId: string,
): ExecutionVerificationResult | null {
  const results = getDevPulseV2ExecutionVerificationLoop().getResults();
  return results.find((r) => r.verificationId === verificationId) ?? null;
}

export function assertVerificationLoopDependency(): boolean {
  return getDevPulseV2Owner('execution_verification_loop').ownerModule === VERIFICATION_OWNER_MODULE;
}

export function assertExecutionAuthorityDependency(): boolean {
  return getDevPulseV2Owner('execution_authority').ownerModule === EXECUTION_OWNER_MODULE;
}

export function assertExecutionRuntimeDependency(): boolean {
  return getDevPulseV2Owner('execution_package_runtime').ownerModule === RUNTIME_OWNER_MODULE;
}

export function assertRecoveryDoesNotDuplicateVerification(): boolean {
  const verification = getDevPulseV2Owner('execution_verification_loop');
  const recovery = getDevPulseV2Owner('recovery_execution_engine');
  return verification.domain !== recovery.domain;
}

export function getRecoveryDependencyChainSummary(): string {
  const authority = getDevPulseV2Owner('execution_authority');
  const runtime = getDevPulseV2Owner('execution_package_runtime');
  const verification = getDevPulseV2Owner('execution_verification_loop');
  const recovery = getDevPulseV2Owner('recovery_execution_engine');
  return (
    `${authority.domain}@${authority.phase} → ${runtime.domain}@${runtime.phase} → ` +
    `${verification.domain}@${verification.phase} → ${recovery.domain}@${recovery.phase}`
  );
}
