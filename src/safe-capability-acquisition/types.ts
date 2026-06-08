/** DevPulse V2 Phase 9.2 Safe Capability Acquisition Foundation — types. */

import type { CapabilityType, ConfidenceLevel, GapSeverity, GateRecord } from '../missing-capability-detector/types.js';

export type { GateRecord };

export type AcquisitionMode =
  | 'RESEARCH_ONLY'
  | 'BUILD_INTERNAL_TOOL'
  | 'REQUEST_EXTERNAL_TOOL'
  | 'INSTALL_DEPENDENCY_PROPOSAL'
  | 'CREATE_DIAGNOSTIC_LAYER'
  | 'CREATE_VERIFICATION_LAYER'
  | 'CREATE_SIMULATION_LAYER'
  | 'CREATE_PREVIEW_LAYER'
  | 'CREATE_GOVERNANCE_LAYER'
  | 'DEFER_CAPABILITY'
  | 'UNKNOWN';

export type AcquisitionStrategy =
  | 'DEFER'
  | 'RESEARCH'
  | 'PLAN_INTERNAL_BUILD'
  | 'PLAN_EXTERNAL_TOOL_REVIEW'
  | 'PLAN_DEPENDENCY_REVIEW'
  | 'PLAN_DIAGNOSTIC_LAYER'
  | 'PLAN_VERIFICATION_LAYER'
  | 'PLAN_SIMULATION_LAYER'
  | 'PLAN_PREVIEW_LAYER'
  | 'PLAN_GOVERNANCE_LAYER'
  | 'BLOCKED';

export type AcquisitionState =
  | 'ACQUISITION_REQUEST_RECEIVED'
  | 'CAPABILITY_GAP_VALIDATED'
  | 'GOVERNANCE_VALIDATED'
  | 'ACQUISITION_STRATEGY_CLASSIFIED'
  | 'RISK_CLASSIFIED'
  | 'APPROVAL_REQUIREMENTS_CREATED'
  | 'VERIFICATION_REQUIREMENTS_CREATED'
  | 'ROLLBACK_REQUIREMENTS_CREATED'
  | 'ACQUISITION_PLAN_CREATED'
  | 'ACQUISITION_READY'
  | 'ACQUISITION_BLOCKED';

export type AcquisitionRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AcquisitionReadiness =
  | 'NOT_READY'
  | 'NEEDS_GOVERNANCE'
  | 'NEEDS_APPROVAL'
  | 'NEEDS_RESEARCH'
  | 'READY_FOR_RESEARCH'
  | 'READY_FOR_PLANNED_ACQUISITION'
  | 'BLOCKED';

export type GovernanceStatus = 'PASS' | 'FAIL' | 'PENDING' | 'UNKNOWN';

export type AuthStatus = 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'PENDING' | 'UNKNOWN';

export interface AcquisitionInput {
  acquisitionId?: string;
  capabilityGapId: string;
  analysisId: string;
  workspaceId: string;
  projectId: string;
  capabilityType: CapabilityType;
  capabilityName: string;
  gapSeverity: GapSeverity;
  gapReason: string;
  gapEvidence: string;
  gapImpact: string;
  recommendedCapability: string;
  recommendedAction: string;
  confidenceScore: ConfidenceLevel;
  requestedAcquisitionMode: AcquisitionMode;
  requestedBy: string;
  timestamp: number;
  authStatus: AuthStatus;
  governanceStatus: GovernanceStatus;
  targetWorkspaceId?: string;
  targetProjectId?: string;
}

export interface ApprovalRequirement {
  requirementId: string;
  requirementType: 'FOUNDER_APPROVAL' | 'GOVERNANCE_APPROVAL' | 'RISK_APPROVAL';
  description: string;
  required: boolean;
  riskLevel: AcquisitionRiskLevel;
}

export interface VerificationRequirement {
  requirementId: string;
  requirementType: 'VERIFICATION_GATE' | 'ARCHITECTURE_REVIEW' | 'GOVERNANCE_REVIEW';
  description: string;
  required: boolean;
}

export interface RollbackRequirement {
  requirementId: string;
  requirementType: 'ROLLBACK_PLAN' | 'ARCHITECTURE_ROLLBACK' | 'GOVERNANCE_ROLLBACK';
  description: string;
  required: boolean;
}

export interface ResearchRequestPacket {
  researchRequestId: string;
  capabilityGapId: string;
  capabilityName: string;
  researchQuestion: string;
  researchScope: string;
  riskLevel: AcquisitionRiskLevel;
  requiresApproval: boolean;
  status: 'DRAFT' | 'READY' | 'BLOCKED';
}

export interface BuildRequestPacket {
  buildRequestId: string;
  capabilityGapId: string;
  capabilityName: string;
  proposedLayerType: string;
  proposedOwner: string;
  proposedPhase: string;
  requiresApproval: boolean;
  requiresVerification: boolean;
  requiresRollback: boolean;
  status: 'DRAFT' | 'READY' | 'BLOCKED';
}

export interface DeferRecord {
  deferRecordId: string;
  capabilityGapId: string;
  capabilityName: string;
  deferReason: string;
  recommendedRevisitTrigger: string;
  status: 'ACTIVE' | 'PENDING_REVIEW';
}

export interface AcquisitionConfirmation {
  safeCapabilityAcquisitionOnly: true;
  noExecutionPerformed: true;
  noCommandsExecuted: true;
  noFilesModified: true;
  noCodeGenerated: true;
  noDeploymentPerformed: true;
  noToolDownloaded: true;
  noDependencyInstalled: true;
  noCapabilityAcquired: true;
}

export interface AcquisitionPlanResult {
  acquisitionPlanId: string;
  acquisitionId: string;
  capabilityGapId: string;
  analysisId: string;
  workspaceId: string;
  projectId: string;
  capabilityType: CapabilityType;
  capabilityName: string;
  acquisitionMode: AcquisitionMode;
  acquisitionStrategy: AcquisitionStrategy;
  acquisitionState: AcquisitionState;
  acquisitionReadiness: AcquisitionReadiness;
  riskLevel: AcquisitionRiskLevel;
  approvalRequirements: ApprovalRequirement[];
  verificationRequirements: VerificationRequirement[];
  rollbackRequirements: RollbackRequirement[];
  researchRequestPacket: ResearchRequestPacket | null;
  buildRequestPacket: BuildRequestPacket | null;
  deferRecord: DeferRecord | null;
  governanceGates: GateRecord[];
  ownershipGates: GateRecord[];
  securityWarnings: string[];
  recommendations: string[];
  confirmation: AcquisitionConfirmation;
  stateSequence: AcquisitionState[];
  createdAt: number;
}

export interface SafeAcquisitionReportOutput {
  reportId: string;
  acquisitionPlanId: string;
  acquisitionId: string;
  capabilityGapId: string;
  analysisId: string;
  workspaceId: string;
  projectId: string;
  capabilityType: CapabilityType;
  capabilityName: string;
  acquisitionMode: AcquisitionMode;
  acquisitionStrategy: AcquisitionStrategy;
  acquisitionState: AcquisitionState;
  acquisitionReadiness: AcquisitionReadiness;
  riskLevel: AcquisitionRiskLevel;
  approvalRequirementCount: number;
  verificationRequirementCount: number;
  rollbackRequirementCount: number;
  researchRequestId: string;
  buildRequestId: string;
  deferRecordId: string;
  governanceGateCount: number;
  ownershipGateCount: number;
  securityWarningCount: number;
  recommendationCount: number;
  confirmation: AcquisitionConfirmation;
}

export interface SafeAcquisitionReport {
  ownerModule: string;
  reportId: string;
  acquisitionPlanId: string;
  acquisitionId: string;
  capabilityGapId: string;
  analysisId: string;
  workspaceId: string;
  projectId: string;
  capabilityType: CapabilityType;
  capabilityName: string;
  acquisitionMode: AcquisitionMode;
  acquisitionStrategy: AcquisitionStrategy;
  acquisitionState: AcquisitionState;
  acquisitionReadiness: AcquisitionReadiness;
  riskLevel: AcquisitionRiskLevel;
  approvalRequirementCount: number;
  verificationRequirementCount: number;
  rollbackRequirementCount: number;
  researchRequestId: string;
  buildRequestId: string;
  deferRecordId: string;
  governanceGateCount: number;
  ownershipGateCount: number;
  securityWarningCount: number;
  recommendationCount: number;
  confirmation: AcquisitionConfirmation;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface SafeCapabilityAcquisitionState {
  foundationId: string;
  acquisitionCount: number;
  warnings: string[];
  errors: string[];
}

export const SAFE_CAPABILITY_ACQUISITION_OWNER_MODULE = 'devpulse_v2_safe_capability_acquisition';
export const SAFE_CAPABILITY_ACQUISITION_PASS_TOKEN =
  'DEVPULSE_V2_SAFE_CAPABILITY_ACQUISITION_FOUNDATION_V1_PASS';

export const ACQUISITION_STATE_SEQUENCE: readonly AcquisitionState[] = [
  'ACQUISITION_REQUEST_RECEIVED',
  'CAPABILITY_GAP_VALIDATED',
  'GOVERNANCE_VALIDATED',
  'ACQUISITION_STRATEGY_CLASSIFIED',
  'RISK_CLASSIFIED',
  'APPROVAL_REQUIREMENTS_CREATED',
  'VERIFICATION_REQUIREMENTS_CREATED',
  'ROLLBACK_REQUIREMENTS_CREATED',
  'ACQUISITION_PLAN_CREATED',
  'ACQUISITION_READY',
] as const;

export const KNOWN_ACQUISITION_MODES: readonly AcquisitionMode[] = [
  'RESEARCH_ONLY',
  'BUILD_INTERNAL_TOOL',
  'REQUEST_EXTERNAL_TOOL',
  'INSTALL_DEPENDENCY_PROPOSAL',
  'CREATE_DIAGNOSTIC_LAYER',
  'CREATE_VERIFICATION_LAYER',
  'CREATE_SIMULATION_LAYER',
  'CREATE_PREVIEW_LAYER',
  'CREATE_GOVERNANCE_LAYER',
  'DEFER_CAPABILITY',
] as const;

export const KNOWN_ACQUISITION_STRATEGIES: readonly AcquisitionStrategy[] = [
  'DEFER',
  'RESEARCH',
  'PLAN_INTERNAL_BUILD',
  'PLAN_EXTERNAL_TOOL_REVIEW',
  'PLAN_DEPENDENCY_REVIEW',
  'PLAN_DIAGNOSTIC_LAYER',
  'PLAN_VERIFICATION_LAYER',
  'PLAN_SIMULATION_LAYER',
  'PLAN_PREVIEW_LAYER',
  'PLAN_GOVERNANCE_LAYER',
] as const;

export const ACQUISITION_RISK_LEVELS: readonly AcquisitionRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const EXECUTION_BLOCKED_PATTERNS = ['execute', 'run command', 'self execute'] as const;
export const INSTALL_BLOCKED_PATTERNS = ['install dependency', 'npm install', 'self-install'] as const;
export const DOWNLOAD_BLOCKED_PATTERNS = ['download tool', 'fetch tool', 'self-download'] as const;
export const CODE_GEN_BLOCKED_PATTERNS = ['generate code', 'write code'] as const;
export const FILE_MOD_BLOCKED_PATTERNS = ['modify file', 'write file', 'delete file'] as const;
export const DEPLOY_BLOCKED_PATTERNS = ['deploy', 'publish'] as const;
export const REGISTRY_MUTATION_BLOCKED_PATTERNS = ['update ownership registry', 'mutate registry', 'change ownership registry'] as const;

export const MODE_TO_STRATEGY: Record<AcquisitionMode, AcquisitionStrategy> = {
  RESEARCH_ONLY: 'RESEARCH',
  BUILD_INTERNAL_TOOL: 'PLAN_INTERNAL_BUILD',
  REQUEST_EXTERNAL_TOOL: 'PLAN_EXTERNAL_TOOL_REVIEW',
  INSTALL_DEPENDENCY_PROPOSAL: 'PLAN_DEPENDENCY_REVIEW',
  CREATE_DIAGNOSTIC_LAYER: 'PLAN_DIAGNOSTIC_LAYER',
  CREATE_VERIFICATION_LAYER: 'PLAN_VERIFICATION_LAYER',
  CREATE_SIMULATION_LAYER: 'PLAN_SIMULATION_LAYER',
  CREATE_PREVIEW_LAYER: 'PLAN_PREVIEW_LAYER',
  CREATE_GOVERNANCE_LAYER: 'PLAN_GOVERNANCE_LAYER',
  DEFER_CAPABILITY: 'DEFER',
  UNKNOWN: 'BLOCKED',
};

export const APPROVAL_REQUIRED_MODES: readonly AcquisitionMode[] = [
  'BUILD_INTERNAL_TOOL',
  'REQUEST_EXTERNAL_TOOL',
  'INSTALL_DEPENDENCY_PROPOSAL',
  'CREATE_DIAGNOSTIC_LAYER',
  'CREATE_VERIFICATION_LAYER',
  'CREATE_SIMULATION_LAYER',
  'CREATE_PREVIEW_LAYER',
  'CREATE_GOVERNANCE_LAYER',
] as const;

export const DEPENDENCY_SYSTEMS = [
  'missing_capability_detector',
  'world2_execution_planner',
  'world2_simulation_runtime',
  'world2_autonomous_builder',
  'world2_completion_verifier',
  'world2_learning_loop',
  'controlled_execution_bridge',
  'mobile_command_foundation',
  'mobile_chat_interface',
  'mobile_live_preview_foundation',
  'mobile_approval_flow_foundation',
  'cross_device_continuity_foundation',
  'execution_evidence_ledger',
  'verification_gated_apply',
  'execution_authority',
  'founder_approval_execution_gate',
] as const;

export const DUPLICATE_PATTERNS = [
  'safe_capability_acquisition',
  'capability_acquisition',
  'capability_acquisition_planner',
  'capability_acquisition_gate',
  'capability_acquisition_strategy',
  'capability_research_planner',
] as const;

let acquisitionCounter = 0;
let planCounter = 0;
let researchCounter = 0;
let buildCounter = 0;
let deferCounter = 0;

export function nextAcquisitionId(): string {
  acquisitionCounter += 1;
  return `acq-${acquisitionCounter.toString().padStart(4, '0')}`;
}

export function nextAcquisitionPlanId(): string {
  planCounter += 1;
  return `acq-plan-${planCounter.toString().padStart(4, '0')}`;
}

export function nextResearchRequestId(): string {
  researchCounter += 1;
  return `research-req-${researchCounter.toString().padStart(4, '0')}`;
}

export function nextBuildRequestId(): string {
  buildCounter += 1;
  return `build-req-${buildCounter.toString().padStart(4, '0')}`;
}

export function nextDeferRecordId(): string {
  deferCounter += 1;
  return `defer-${deferCounter.toString().padStart(4, '0')}`;
}

export function resetAcquisitionCountersForTests(): void {
  acquisitionCounter = 0;
  planCounter = 0;
  researchCounter = 0;
  buildCounter = 0;
  deferCounter = 0;
}
