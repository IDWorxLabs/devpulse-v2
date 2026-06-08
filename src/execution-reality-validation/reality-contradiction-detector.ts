/**
 * Reality contradiction detector — finds governance chain inconsistencies.
 */

import type { ExecutionRealityChainInput, RealityContradiction } from './types.js';
import {
  isApprovalRequired,
  isRecoveryNotNeeded,
  isRecoveryRequired,
} from './reality-consistency-checker.js';

function critical(code: RealityContradiction['code'], message: string): RealityContradiction {
  return { code, severity: 'CRITICAL', message };
}

function warning(code: RealityContradiction['code'], message: string): RealityContradiction {
  return { code, severity: 'WARNING', message };
}

export function detectRealityContradictions(chain: ExecutionRealityChainInput): RealityContradiction[] {
  const contradictions: RealityContradiction[] = [];
  const rejected = chain.runtimeRecord?.runtimeDecision.finalState === 'REJECTED_INVALID_PACKAGE';

  if (!rejected && !chain.authorityDecision) {
    contradictions.push(critical('authority_missing', 'Authority decision missing for structurally valid package'));
  }

  if (!chain.runtimeRecord) {
    contradictions.push(critical('runtime_missing', 'Runtime record missing'));
  }

  if (!chain.verificationResult) {
    contradictions.push(critical('verification_missing', 'Verification result missing'));
  }

  if (isRecoveryRequired(chain) && !chain.recoveryRecord) {
    contradictions.push(critical('recovery_missing_when_required', 'Recovery plan required but missing'));
  }

  if (isApprovalRequired(chain) && !chain.approvalRecord) {
    contradictions.push(critical('required_approval_missing', 'Founder approval required but missing'));
  }

  if (
    chain.runtimeRecord?.runtimeDecision.accepted === true &&
    chain.authorityDecision?.allowed === false
  ) {
    contradictions.push(
      critical(
        'runtime_allowed_authority_blocked',
        'Runtime allowed operation while Execution Authority blocked',
      ),
    );
  }

  if (chain.verificationResult?.verdict === 'TRUSTED' && !chain.authorityDecision && !rejected) {
    contradictions.push(
      critical(
        'trusted_verification_authority_missing',
        'Verification TRUSTED while authority decision missing',
      ),
    );
  }

  if (chain.verificationResult?.verdict === 'TRUSTED' && !chain.runtimeRecord) {
    contradictions.push(
      critical(
        'trusted_verification_runtime_missing',
        'Verification TRUSTED while runtime record missing',
      ),
    );
  }

  if (
    chain.approvalRecord?.decision === 'APPROVED' &&
    chain.approvalRecord.approvalRequirement === 'NO_APPROVAL_REQUIRED'
  ) {
    contradictions.push(
      warning(
        'approval_approved_when_not_required',
        'Approval marked APPROVED when no approval was required',
      ),
    );
  }

  if (chain.recoveryRecord && isRecoveryNotNeeded(chain)) {
    contradictions.push(
      warning(
        'recovery_exists_when_not_needed',
        'Recovery plan exists when recovery was not required',
      ),
    );
  }

  return contradictions;
}

export function hasCriticalContradictions(contradictions: RealityContradiction[]): boolean {
  return contradictions.some((c) => c.severity === 'CRITICAL');
}

export function hasWarningContradictions(contradictions: RealityContradiction[]): boolean {
  return contradictions.some((c) => c.severity === 'WARNING');
}
