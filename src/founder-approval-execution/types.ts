/** DevPulse V2 Founder Approval Execution Gate — types. */

import type { RecoveryRecord } from '../recovery-execution/types.js';

export type ApprovalState =
  | 'APPROVAL_REQUEST_RECEIVED'
  | 'CONSTITUTION_CHECK_COMPLETED'
  | 'RISK_EVALUATED'
  | 'APPROVAL_REQUIREMENT_DETERMINED'
  | 'APPROVAL_PENDING'
  | 'APPROVAL_GRANTED'
  | 'APPROVAL_DENIED'
  | 'APPROVAL_RECORD_CREATED';

export type ApprovalRequirement =
  | 'NO_APPROVAL_REQUIRED'
  | 'APPROVAL_REQUIRED'
  | 'APPROVAL_REQUIRED_HIGH_RISK'
  | 'APPROVAL_REQUIRED_AUTONOMY'
  | 'APPROVAL_REQUIRED_MODIFICATION'
  | 'APPROVAL_REQUIRED_RECOVERY';

export type FounderRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ApprovalDecisionType = 'PENDING' | 'APPROVED' | 'DENIED';

export type ConstitutionalRule =
  | 'WRITE_OPERATION'
  | 'PROJECT_MODIFICATION'
  | 'RECOVERY_ACTION'
  | 'AUTONOMOUS_ACTION'
  | 'WORLD2_ACTIVITY';

export interface FounderApprovalRequest {
  approvalRequestId: string;
  verificationId: string;
  recoveryPlanId: string;
  packageId: string;
  createdAt: number;
  recoveryRecord: RecoveryRecord;
}

export interface FounderApprovalRecord {
  approvalRequestId: string;
  verificationId: string;
  recoveryPlanId: string;
  packageId: string;
  createdAt: number;
  approvalRequirement: ApprovalRequirement;
  riskLevel: FounderRiskLevel;
  decision: ApprovalDecisionType;
  constitutionalRulesTriggered: ConstitutionalRule[];
  affectedDomains: string[];
  futureGateUnlockedIfApproved?: string;
  stateSequence: ApprovalState[];
  noExecutionOccurred: boolean;
  warnings: string[];
  errors: string[];
}

export interface FounderApprovalGateState {
  gateId: string;
  requestCount: number;
  pendingCount: number;
  approvedCount: number;
  deniedCount: number;
  warnings: string[];
  errors: string[];
}

export interface FounderApprovalReport {
  ownerModule: string;
  requestCount: number;
  latestRecord: FounderApprovalRecord | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const APPROVAL_GATE_OWNER_MODULE = 'devpulse_v2_founder_approval_execution_gate';
export const APPROVAL_GATE_PASS_TOKEN = 'DEVPULSE_V2_FOUNDER_APPROVAL_EXECUTION_GATE_V1_PASS';

export const DEPENDENCY_SYSTEMS = [
  'execution_authority',
  'execution_package_runtime',
  'execution_verification_loop',
  'recovery_execution_engine',
] as const;
