/** DevPulse V2 Auto-Fix Control Panel — types. */

import type { ChainRiskLevel } from '../recovery-chains/types.js';
import type { FounderApprovalRecord } from '../founder-approval-execution/types.js';
import type { ExecutionRealityResult } from '../execution-reality-validation/types.js';
import type { ExecutionEvidenceLedgerRecord } from '../execution-evidence-ledger/types.js';
import type { RecoveryChain } from '../recovery-chains/types.js';

export type FixType =
  | 'READ_ONLY_FIX'
  | 'CONFIGURATION_FIX'
  | 'RECOVERY_FIX'
  | 'ROLLBACK_FIX'
  | 'AUTONOMY_FIX'
  | 'WORLD2_FIX';

export type AutoFixState =
  | 'FIX_DISCOVERED'
  | 'FIX_CLASSIFIED'
  | 'FIX_PERMISSION_EVALUATED'
  | 'FIX_PENDING'
  | 'FIX_ALLOWED'
  | 'FIX_BLOCKED'
  | 'FIX_REJECTED'
  | 'FIX_RECORD_CREATED';

export type PermissionState = 'ALLOWED' | 'BLOCKED' | 'PENDING_APPROVAL' | 'REJECTED';

export type AutoFixEvidenceSource = 'recovery_chains' | 'approval' | 'reality' | 'ledger';

export interface AutoFixEvidenceLink {
  linkId: string;
  source: AutoFixEvidenceSource;
  referenceId: string;
  systemId: string;
}

export interface AutoFixEvaluationInput {
  packageId: string;
  fixType?: FixType;
  recoveryChain?: RecoveryChain | null;
  approvalRecord?: FounderApprovalRecord | null;
  realityResult?: ExecutionRealityResult | null;
  ledgerRecord?: ExecutionEvidenceLedgerRecord | null;
  world2Related?: boolean;
}

export interface AutoFixPermissionRecord {
  fixId: string;
  packageId: string;
  fixType: FixType;
  permissionState: PermissionState;
  approvalRequired: boolean;
  verificationRequired: boolean;
  riskLevel: ChainRiskLevel;
  evidenceLinks: AutoFixEvidenceLink[];
  stateSequence: AutoFixState[];
  createdAt: number;
  updatedAt: number;
  controlLayerOnlyConfirmed: boolean;
  noFixExecuted: boolean;
}

export interface AutoFixControlPanelState {
  panelId: string;
  fixCount: number;
  allowedCount: number;
  blockedCount: number;
  pendingCount: number;
  rejectedCount: number;
  warnings: string[];
  errors: string[];
}

export interface AutoFixControlReport {
  ownerModule: string;
  fixCount: number;
  latestFix: AutoFixPermissionRecord | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const AUTO_FIX_CONTROL_OWNER_MODULE = 'devpulse_v2_auto_fix_control_panel';
export const AUTO_FIX_CONTROL_PASS_TOKEN = 'DEVPULSE_V2_AUTO_FIX_CONTROL_PANEL_V1_PASS';

export const DEPENDENCY_SYSTEMS = [
  'recovery_chains',
  'founder_approval_execution_gate',
  'execution_reality_validation',
  'execution_evidence_ledger',
] as const;

export const DUPLICATE_SYSTEM_PATTERNS = [
  'auto_fix',
  'auto_repair',
  'auto_correction',
  'self_repair',
  'automatic_fix',
] as const;
