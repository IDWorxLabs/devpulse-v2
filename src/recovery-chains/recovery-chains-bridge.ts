/**
 * Recovery chains governance bridge — gathers Phase 6 stack context without duplicating systems.
 */

import { buildRealityChainFromSystems } from '../execution-reality-validation/index.js';
import {
  getDevPulseV2ExecutionEvidenceLedger,
  EVIDENCE_LEDGER_OWNER_MODULE,
} from '../execution-evidence-ledger/index.js';
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
import type { RecoveryChainGovernanceContext } from './types.js';
import { DEPENDENCY_SYSTEMS } from './types.js';

export function buildGovernanceContextFromSystems(packageId: string): RecoveryChainGovernanceContext {
  const realityChain = buildRealityChainFromSystems(packageId);

  const realityResults = getDevPulseV2ExecutionRealityValidation()
    .getResults()
    .filter((r) => r.packageId === packageId);
  const realityResult =
    realityResults.length > 0 ? realityResults[realityResults.length - 1] : null;

  const ledgerRecords = getDevPulseV2ExecutionEvidenceLedger().findByPackageId(packageId);
  const ledgerRecord = ledgerRecords.length > 0 ? ledgerRecords[ledgerRecords.length - 1] : null;

  return {
    packageId,
    runtimeRecord: realityChain.runtimeRecord,
    verificationResult: realityChain.verificationResult,
    recoveryRecord: realityChain.recoveryRecord,
    approvalRecord: realityChain.approvalRecord,
    realityResult,
    ledgerRecord,
  };
}

export function assertRecoveryChainsDependenciesPresent(): boolean {
  return (
    getDevPulseV2Owner('recovery_execution_engine').ownerModule === RECOVERY_EXECUTION_OWNER_MODULE &&
    getDevPulseV2Owner('founder_approval_execution_gate').ownerModule === APPROVAL_GATE_OWNER_MODULE &&
    getDevPulseV2Owner('execution_reality_validation').ownerModule === REALITY_VALIDATION_OWNER_MODULE &&
    getDevPulseV2Owner('execution_evidence_ledger').ownerModule === EVIDENCE_LEDGER_OWNER_MODULE
  );
}

export function getRecoveryChainsDependencySummary(): string {
  return DEPENDENCY_SYSTEMS.map((id) => `${id}@${getDevPulseV2Owner(id).phase}`).join(' → ');
}
