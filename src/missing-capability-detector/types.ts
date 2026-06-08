/** DevPulse V2 Phase 9.1 Missing Capability Detector Foundation — types. */

export type AnalysisSource =
  | 'PROJECT_GOAL'
  | 'EXECUTION_PLAN'
  | 'SIMULATION_RESULT'
  | 'VERIFICATION_RESULT'
  | 'LEARNING_RESULT'
  | 'APPROVAL_RESULT'
  | 'MOBILE_REQUEST'
  | 'ARCHITECTURE_REVIEW'
  | 'WORLD2_ANALYSIS'
  | 'UNKNOWN';

export type CapabilityType =
  | 'DIAGNOSTIC_CAPABILITY'
  | 'VERIFICATION_CAPABILITY'
  | 'EXECUTION_CAPABILITY'
  | 'PLANNING_CAPABILITY'
  | 'SIMULATION_CAPABILITY'
  | 'PREVIEW_CAPABILITY'
  | 'GOVERNANCE_CAPABILITY'
  | 'SECURITY_CAPABILITY'
  | 'MOBILE_CAPABILITY'
  | 'PROJECT_INTELLIGENCE_CAPABILITY'
  | 'LEARNING_CAPABILITY'
  | 'ARCHITECTURE_CAPABILITY'
  | 'UNKNOWN';

export type CapabilityGapState =
  | 'ANALYSIS_RECEIVED'
  | 'CONTEXT_EVALUATED'
  | 'CAPABILITY_SCAN_COMPLETE'
  | 'CAPABILITY_GAP_DETECTED'
  | 'CAPABILITY_GAP_CLASSIFIED'
  | 'RECOMMENDATION_GENERATED'
  | 'REPORT_READY'
  | 'ANALYSIS_BLOCKED';

export type GapSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export type WorldTarget = 'WORLD_1' | 'WORLD_2' | 'UNKNOWN';

export interface CapabilityAnalysisInput {
  analysisId: string;
  workspaceId: string;
  projectId: string;
  goalId: string;
  goalSummary: string;
  analysisSource: AnalysisSource;
  analysisContext: string;
  requestedOutcome: string;
  worldTarget: WorldTarget;
  simulationId: string;
  builderId: string;
  verificationId: string;
  learningId: string;
  timestamp: number;
  targetWorkspaceId?: string;
  targetProjectId?: string;
}

export interface GateRecord {
  gateId: string;
  gateType: string;
  status: 'OPEN' | 'CLOSED' | 'REQUIRED';
  description: string;
}

export interface CapabilityGapRecord {
  capabilityGapId: string;
  analysisId: string;
  workspaceId: string;
  projectId: string;
  analysisSource: AnalysisSource;
  capabilityType: CapabilityType;
  capabilityName: string;
  gapSeverity: GapSeverity;
  gapReason: string;
  gapEvidence: string;
  gapImpact: string;
  recommendedCapability: string;
  recommendedAction: string;
  confidenceScore: ConfidenceLevel;
  capabilityGapState: CapabilityGapState;
}

export interface DetectorConfirmation {
  missingCapabilityDetectorOnly: true;
  noExecutionPerformed: true;
  noCommandsExecuted: true;
  noFilesModified: true;
  noCodeGenerated: true;
  noDeploymentPerformed: true;
  noCapabilityAcquisitionPerformed: true;
}

export interface CapabilityGapResult {
  capabilityGapId: string;
  analysisId: string;
  workspaceId: string;
  projectId: string;
  analysisSource: AnalysisSource;
  capabilityType: CapabilityType;
  capabilityName: string;
  gapSeverity: GapSeverity;
  gapReason: string;
  gapEvidence: string;
  gapImpact: string;
  recommendedCapability: string;
  recommendedAction: string;
  confidenceScore: ConfidenceLevel;
  capabilityGapState: CapabilityGapState;
  governanceGates: GateRecord[];
  ownershipGates: GateRecord[];
  securityWarnings: string[];
  recommendations: string[];
  confirmation: DetectorConfirmation;
  stateSequence: CapabilityGapState[];
  detectedGaps: CapabilityGapRecord[];
  createdAt: number;
}

export interface CapabilityGapReportOutput {
  reportId: string;
  analysisId: string;
  workspaceId: string;
  projectId: string;
  analysisSource: AnalysisSource;
  capabilityGapCount: number;
  highSeverityCount: number;
  criticalSeverityCount: number;
  recommendedCapabilityCount: number;
  confidenceScore: ConfidenceLevel;
  topCapabilityGaps: CapabilityGapRecord[];
  recommendationCount: number;
  confirmation: DetectorConfirmation;
}

export interface MissingCapabilityDetectorState {
  foundationId: string;
  analysisCount: number;
  warnings: string[];
  errors: string[];
}

export interface CapabilityGapReport {
  ownerModule: string;
  reportId: string;
  analysisId: string;
  workspaceId: string;
  projectId: string;
  analysisSource: AnalysisSource;
  capabilityGapCount: number;
  highSeverityCount: number;
  criticalSeverityCount: number;
  recommendedCapabilityCount: number;
  confidenceScore: ConfidenceLevel;
  topCapabilityGapCount: number;
  recommendationCount: number;
  governanceGateCount: number;
  ownershipGateCount: number;
  securityWarningCount: number;
  confirmation: DetectorConfirmation;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const MISSING_CAPABILITY_DETECTOR_OWNER_MODULE = 'devpulse_v2_missing_capability_detector';
export const MISSING_CAPABILITY_DETECTOR_PASS_TOKEN =
  'DEVPULSE_V2_MISSING_CAPABILITY_DETECTOR_FOUNDATION_V1_PASS';

export const GAP_STATE_SEQUENCE: readonly CapabilityGapState[] = [
  'ANALYSIS_RECEIVED',
  'CONTEXT_EVALUATED',
  'CAPABILITY_SCAN_COMPLETE',
  'CAPABILITY_GAP_DETECTED',
  'CAPABILITY_GAP_CLASSIFIED',
  'RECOMMENDATION_GENERATED',
  'REPORT_READY',
] as const;

export const KNOWN_ANALYSIS_SOURCES: readonly AnalysisSource[] = [
  'PROJECT_GOAL',
  'EXECUTION_PLAN',
  'SIMULATION_RESULT',
  'VERIFICATION_RESULT',
  'LEARNING_RESULT',
  'APPROVAL_RESULT',
  'MOBILE_REQUEST',
  'ARCHITECTURE_REVIEW',
  'WORLD2_ANALYSIS',
] as const;

export const KNOWN_CAPABILITY_TYPES: readonly CapabilityType[] = [
  'DIAGNOSTIC_CAPABILITY',
  'VERIFICATION_CAPABILITY',
  'EXECUTION_CAPABILITY',
  'PLANNING_CAPABILITY',
  'SIMULATION_CAPABILITY',
  'PREVIEW_CAPABILITY',
  'GOVERNANCE_CAPABILITY',
  'SECURITY_CAPABILITY',
  'MOBILE_CAPABILITY',
  'PROJECT_INTELLIGENCE_CAPABILITY',
  'LEARNING_CAPABILITY',
  'ARCHITECTURE_CAPABILITY',
] as const;

export const GAP_SEVERITY_LEVELS: readonly GapSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const CONFIDENCE_LEVELS: readonly ConfidenceLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'] as const;

export const EXECUTION_BLOCKED_PATTERNS = ['execute', 'run command', 'self execute'] as const;

export const FILE_MOD_BLOCKED_PATTERNS = ['modify file', 'write file', 'delete file'] as const;

export const CODE_GEN_BLOCKED_PATTERNS = ['generate code', 'write code'] as const;

export const DEPLOY_BLOCKED_PATTERNS = ['deploy', 'publish'] as const;

export const ACQUISITION_BLOCKED_PATTERNS = [
  'acquire capability',
  'install tool',
  'download tool',
  'self-install',
  'build capability',
] as const;

export const DEPENDENCY_SYSTEMS = [
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
] as const;

export const DUPLICATE_PATTERNS = [
  'missing_capability_detector',
  'capability_gap_detector',
  'capability_gap_analysis',
  'capability_detection_engine',
  'capability_gap_registry',
  'missing_system_detector',
  'missing_tool_detector',
] as const;

export const SOURCE_CAPABILITY_MAP: Record<AnalysisSource, CapabilityType[]> = {
  PROJECT_GOAL: ['PLANNING_CAPABILITY', 'PROJECT_INTELLIGENCE_CAPABILITY'],
  EXECUTION_PLAN: ['EXECUTION_CAPABILITY', 'PLANNING_CAPABILITY'],
  SIMULATION_RESULT: ['SIMULATION_CAPABILITY', 'DIAGNOSTIC_CAPABILITY'],
  VERIFICATION_RESULT: ['VERIFICATION_CAPABILITY', 'DIAGNOSTIC_CAPABILITY'],
  LEARNING_RESULT: ['LEARNING_CAPABILITY', 'PROJECT_INTELLIGENCE_CAPABILITY'],
  APPROVAL_RESULT: ['GOVERNANCE_CAPABILITY', 'SECURITY_CAPABILITY'],
  MOBILE_REQUEST: ['MOBILE_CAPABILITY', 'PREVIEW_CAPABILITY'],
  ARCHITECTURE_REVIEW: ['ARCHITECTURE_CAPABILITY', 'GOVERNANCE_CAPABILITY'],
  WORLD2_ANALYSIS: ['PLANNING_CAPABILITY', 'SIMULATION_CAPABILITY', 'EXECUTION_CAPABILITY'],
  UNKNOWN: [],
};
