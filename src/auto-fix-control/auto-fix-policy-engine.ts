/**
 * Auto-fix policy engine — evaluates permission state from fix type.
 * Control layer only. No fix execution.
 */

import type { AutoFixState, FixType, PermissionState } from './types.js';

export interface PolicyEvaluation {
  permissionState: PermissionState;
  approvalRequired: boolean;
  verificationRequired: boolean;
}

export function evaluateFixPolicy(fixType: FixType): PolicyEvaluation {
  switch (fixType) {
    case 'READ_ONLY_FIX':
      return {
        permissionState: 'ALLOWED',
        approvalRequired: false,
        verificationRequired: false,
      };
    case 'CONFIGURATION_FIX':
    case 'RECOVERY_FIX':
    case 'ROLLBACK_FIX':
      return {
        permissionState: 'PENDING_APPROVAL',
        approvalRequired: true,
        verificationRequired: true,
      };
    case 'AUTONOMY_FIX':
    case 'WORLD2_FIX':
      return {
        permissionState: 'BLOCKED',
        approvalRequired: true,
        verificationRequired: true,
      };
    default:
      return {
        permissionState: 'BLOCKED',
        approvalRequired: true,
        verificationRequired: true,
      };
  }
}

export function permissionToOutcomeState(permission: PermissionState): AutoFixState {
  switch (permission) {
    case 'ALLOWED':
      return 'FIX_ALLOWED';
    case 'BLOCKED':
      return 'FIX_BLOCKED';
    case 'PENDING_APPROVAL':
      return 'FIX_PENDING';
    case 'REJECTED':
      return 'FIX_REJECTED';
    default:
      return 'FIX_BLOCKED';
  }
}

export function buildFixStateSequence(permissionState: PermissionState): AutoFixState[] {
  const outcome = permissionToOutcomeState(permissionState);
  return [
    'FIX_DISCOVERED',
    'FIX_CLASSIFIED',
    'FIX_PERMISSION_EVALUATED',
    outcome,
    'FIX_RECORD_CREATED',
  ];
}
