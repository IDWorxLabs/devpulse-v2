/**
 * Reality bridge — gathers Phase 6 governance chain inputs without duplicating systems.
 */

import { EXECUTION_OWNER_MODULE } from '../execution-authority/types.js';
import {
  getDevPulseV2ExecutionPackageRuntime,
  RUNTIME_OWNER_MODULE,
} from '../execution-runtime/index.js';
import {
  getDevPulseV2ExecutionVerificationLoop,
  VERIFICATION_OWNER_MODULE,
} from '../execution-verification/index.js';
import {
  getDevPulseV2RecoveryExecutionEngine,
  RECOVERY_EXECUTION_OWNER_MODULE,
} from '../recovery-execution/index.js';
import {
  getDevPulseV2FounderApprovalExecutionGate,
  APPROVAL_GATE_OWNER_MODULE,
} from '../founder-approval-execution/index.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import type { ExecutionRealityChainInput } from './types.js';

export function buildRealityChainFromSystems(packageId: string): ExecutionRealityChainInput {
  const runtimeRecord = getDevPulseV2ExecutionPackageRuntime().getRecord(packageId);

  const verificationResults = getDevPulseV2ExecutionVerificationLoop()
    .getResults()
    .filter((r) => r.packageId === packageId);
  const verificationResult =
    verificationResults.length > 0 ? verificationResults[verificationResults.length - 1] : null;

  const recoveryRecords = getDevPulseV2RecoveryExecutionEngine()
    .getRecords()
    .filter((r) => r.plan.packageId === packageId);
  const recoveryRecord =
    recoveryRecords.length > 0 ? recoveryRecords[recoveryRecords.length - 1] : null;

  const approvalRecords = getDevPulseV2FounderApprovalExecutionGate()
    .listRecords()
    .filter((r) => r.packageId === packageId);
  const approvalRecord =
    approvalRecords.length > 0 ? approvalRecords[approvalRecords.length - 1] : null;

  const authorityDecision =
    runtimeRecord?.authorityDecision ??
    verificationResult?.authorityDecision ??
    null;

  return {
    packageId,
    authorityDecision,
    runtimeRecord,
    verificationResult,
    recoveryRecord,
    approvalRecord,
  };
}

export function assertPhase6DependenciesPresent(): boolean {
  return (
    getDevPulseV2Owner('execution_authority').ownerModule === EXECUTION_OWNER_MODULE &&
    getDevPulseV2Owner('execution_package_runtime').ownerModule === RUNTIME_OWNER_MODULE &&
    getDevPulseV2Owner('execution_verification_loop').ownerModule === VERIFICATION_OWNER_MODULE &&
    getDevPulseV2Owner('recovery_execution_engine').ownerModule === RECOVERY_EXECUTION_OWNER_MODULE &&
    getDevPulseV2Owner('founder_approval_execution_gate').ownerModule === APPROVAL_GATE_OWNER_MODULE
  );
}

export function getRealityDependencyChainSummary(): string {
  const parts = DEPENDENCY_PHASES.map(
    (d) => `${d.id}@${getDevPulseV2Owner(d.domain).phase}`,
  );
  parts.push(`execution_reality_validation@${getDevPulseV2Owner('execution_reality_validation').phase}`);
  return parts.join(' → ');
}

const DEPENDENCY_PHASES = [
  { id: 'execution_authority', domain: 'execution_authority' as const },
  { id: 'execution_package_runtime', domain: 'execution_package_runtime' as const },
  { id: 'execution_verification_loop', domain: 'execution_verification_loop' as const },
  { id: 'recovery_execution_engine', domain: 'recovery_execution_engine' as const },
  { id: 'founder_approval_execution_gate', domain: 'founder_approval_execution_gate' as const },
];
