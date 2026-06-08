/**
 * Evidence reality bridge — gathers Phase 6.1–6.6 evidence sources without duplicating systems.
 */

import { EXECUTION_OWNER_MODULE, getDevPulseV2ExecutionAuthority } from '../execution-authority/index.js';
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
import {
  getDevPulseV2ExecutionRealityValidation,
  REALITY_VALIDATION_OWNER_MODULE,
} from '../execution-reality-validation/index.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import type { EvidenceChainInput } from './types.js';
import { DEPENDENCY_SYSTEMS } from './types.js';

export function buildEvidenceChainFromSystems(packageId: string): EvidenceChainInput {
  const authorityId = getDevPulseV2ExecutionAuthority().getAuthorityState().authorityId;

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

  const realityResults = getDevPulseV2ExecutionRealityValidation()
    .getResults()
    .filter((r) => r.packageId === packageId);
  const realityResult =
    realityResults.length > 0 ? realityResults[realityResults.length - 1] : null;

  const authorityDecision =
    runtimeRecord?.authorityDecision ?? verificationResult?.authorityDecision ?? null;

  return {
    packageId,
    authorityId,
    authorityDecisionId: authorityDecision?.decisionId ?? null,
    runtimeRecordId: runtimeRecord?.recordId ?? null,
    verificationId: verificationResult?.verificationId ?? null,
    recoveryPlanId: recoveryRecord?.plan.recoveryPlanId ?? null,
    recoveryRecordId: recoveryRecord?.recordId ?? null,
    approvalRequestId: approvalRecord?.approvalRequestId ?? null,
    runtimeDecision: runtimeRecord?.runtimeDecision.finalState ?? null,
    verificationVerdict: verificationResult?.verdict ?? null,
    recoveryNeed: recoveryRecord?.plan.recoveryNeed ?? null,
    approvalDecision: approvalRecord?.decision ?? null,
    realityValidationId: realityResult?.realityValidationId ?? null,
    realityVerdict: realityResult?.verdict ?? null,
    confidence: realityResult?.confidence ?? null,
    chainComplete: realityResult?.chainComplete ?? false,
    contradictions: realityResult?.contradictions.map((c) => ({ ...c })) ?? [],
  };
}

export function assertPhase67DependenciesPresent(): boolean {
  return (
    getDevPulseV2Owner('execution_authority').ownerModule === EXECUTION_OWNER_MODULE &&
    getDevPulseV2Owner('execution_package_runtime').ownerModule === RUNTIME_OWNER_MODULE &&
    getDevPulseV2Owner('execution_verification_loop').ownerModule === VERIFICATION_OWNER_MODULE &&
    getDevPulseV2Owner('recovery_execution_engine').ownerModule === RECOVERY_EXECUTION_OWNER_MODULE &&
    getDevPulseV2Owner('founder_approval_execution_gate').ownerModule === APPROVAL_GATE_OWNER_MODULE &&
    getDevPulseV2Owner('execution_reality_validation').ownerModule === REALITY_VALIDATION_OWNER_MODULE
  );
}

export function getEvidenceDependencyChainSummary(): string {
  const parts = DEPENDENCY_SYSTEMS.map(
    (id) => `${id}@${getDevPulseV2Owner(id).phase}`,
  );
  parts.push(`execution_evidence_ledger@${getDevPulseV2Owner('execution_evidence_ledger').phase}`);
  return parts.join(' → ');
}
