/**
 * Reality consistency checker — validates presence of governance layers.
 */

import {
  approvalRequired,
  classifyApprovalRequirement,
} from '../founder-approval-execution/founder-approval-classifier.js';
import type { ExecutionRealityChainInput, LayerStatus } from './types.js';

function layerStatus(present: boolean, detail: string): LayerStatus {
  return { present, detail };
}

export function checkAuthorityLayer(chain: ExecutionRealityChainInput): LayerStatus {
  if (chain.runtimeRecord?.runtimeDecision.finalState === 'REJECTED_INVALID_PACKAGE') {
    return layerStatus(true, 'Authority not required for rejected invalid package');
  }
  const present = chain.authorityDecision !== null;
  return layerStatus(
    present,
    present
      ? `Authority decision ${chain.authorityDecision!.decisionId}`
      : 'Authority decision missing',
  );
}

export function checkRuntimeLayer(chain: ExecutionRealityChainInput): LayerStatus {
  const present = chain.runtimeRecord !== null;
  return layerStatus(
    present,
    present ? `Runtime record ${chain.runtimeRecord!.recordId}` : 'Runtime record missing',
  );
}

export function checkVerificationLayer(chain: ExecutionRealityChainInput): LayerStatus {
  const present = chain.verificationResult !== null;
  return layerStatus(
    present,
    present
      ? `Verification ${chain.verificationResult!.verdict}`
      : 'Verification result missing',
  );
}

export function checkRecoveryLayer(chain: ExecutionRealityChainInput): LayerStatus {
  const present = chain.recoveryRecord !== null;
  return layerStatus(
    present,
    present ? `Recovery plan ${chain.recoveryRecord!.plan.recoveryPlanId}` : 'Recovery plan missing',
  );
}

export function checkApprovalLayer(chain: ExecutionRealityChainInput): LayerStatus {
  const present = chain.approvalRecord !== null;
  return layerStatus(
    present,
    present
      ? `Approval ${chain.approvalRecord!.decision}`
      : 'Approval record missing',
  );
}

export function isRecoveryRequired(chain: ExecutionRealityChainInput): boolean {
  if (!chain.verificationResult) {
    return false;
  }
  if (chain.verificationResult.verdict === 'FAILED') {
    return true;
  }
  if (chain.verificationResult.verdict === 'WARNING') {
    return true;
  }
  if (chain.runtimeRecord?.runtimeDecision.finalState === 'BLOCKED_REQUIRES_GATE') {
    return true;
  }
  const need = chain.recoveryRecord?.plan.recoveryNeed;
  return (
    need === 'FAILED_NEEDS_RECOVERY_PLAN' ||
    need === 'BLOCKED_REQUIRES_FUTURE_GATE' ||
    need === 'WARNING_MONITOR_ONLY'
  );
}

export function isApprovalRequired(chain: ExecutionRealityChainInput): boolean {
  if (chain.recoveryRecord) {
    return approvalRequired(classifyApprovalRequirement(chain.recoveryRecord));
  }
  if (chain.runtimeRecord?.runtimeDecision.finalState === 'BLOCKED_REQUIRES_GATE') {
    return true;
  }
  const classification = chain.authorityDecision?.classification;
  return (
    classification === 'WRITE_OPERATION' ||
    classification === 'PROJECT_MODIFICATION' ||
    classification === 'RECOVERY_ACTION' ||
    classification === 'AUTONOMOUS_ACTION'
  );
}

export function isRecoveryNotNeeded(chain: ExecutionRealityChainInput): boolean {
  const need = chain.recoveryRecord?.plan.recoveryNeed;
  if (need === 'NO_RECOVERY_REQUIRED') {
    return true;
  }
  if (
    need === 'BLOCKED_REQUIRES_FUTURE_GATE' ||
    need === 'FAILED_NEEDS_RECOVERY_PLAN' ||
    need === 'WARNING_MONITOR_ONLY'
  ) {
    return false;
  }
  return (
    chain.verificationResult?.verdict === 'TRUSTED' &&
    chain.runtimeRecord?.runtimeDecision.finalState === 'ACCEPTED_READ_ONLY'
  );
}
