/** DevPulse V2 Phase 9.4 Architecture Drift Detection Foundation — types. */

export type DriftAnalysisSource =
  | 'OWNERSHIP_REGISTRY_REVIEW'
  | 'DEPENDENCY_REVIEW'
  | 'SOURCE_OF_TRUTH_REVIEW'
  | 'PHASE_ORDER_REVIEW'
  | 'GOVERNANCE_REVIEW'
  | 'WORLD_BOUNDARY_REVIEW'
  | 'MOBILE_STACK_REVIEW'
  | 'SELF_EVOLUTION_REVIEW'
  | 'EXECUTION_AUTHORITY_REVIEW'
  | 'ARCHITECTURE_CHECKPOINT'
  | 'UNKNOWN';

export type DriftType =
  | 'DUPLICATE_OWNERSHIP_DRIFT'
  | 'DUPLICATE_SOURCE_OF_TRUTH_DRIFT'
  | 'PHASE_ORDER_DRIFT'
  | 'DEPENDENCY_DRIFT'
  | 'GOVERNANCE_BYPASS_DRIFT'
  | 'WORLD_BOUNDARY_DRIFT'
  | 'MOBILE_STACK_DRIFT'
  | 'SELF_EVOLUTION_DRIFT'
  | 'CAPABILITY_ACQUISITION_DRIFT'
  | 'LEARNING_OVERLAP_DRIFT'
  | 'EXECUTION_AUTHORITY_DRIFT'
  | 'UNKNOWN';

export type DriftSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DriftState =
  | 'DRIFT_ANALYSIS_RECEIVED'
  | 'ARCHITECTURE_CONTEXT_VALIDATED'
  | 'EXPECTED_RULES_EVALUATED'
  | 'OBSERVED_SIGNALS_EVALUATED'
  | 'DRIFT_SCAN_COMPLETE'
  | 'DRIFT_CLASSIFIED'
  | 'SEVERITY_SCORED'
  | 'REVIEW_RECOMMENDATION_CREATED'
  | 'DRIFT_REPORT_READY'
  | 'DRIFT_ANALYSIS_BLOCKED';

export type DriftConfidence = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export type OverallDriftRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type GovernanceStatus = 'PASS' | 'FAIL' | 'PENDING' | 'UNKNOWN';

export type AuthStatus = 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'PENDING' | 'UNKNOWN';

export interface GateRecord {
  gateId: string;
  gateType: string;
  status: 'OPEN' | 'CLOSED' | 'REQUIRED';
  description: string;
}

export interface DriftAnalysisInput {
  driftAnalysisId?: string;
  workspaceId: string;
  projectId: string;
  analysisSource: DriftAnalysisSource;
  architectureSnapshotId?: string;
  architectureSnapshotSummary: string;
  expectedArchitectureRules: string[];
  observedArchitectureSignals: string[];
  phaseContext?: string;
  sourceSystem?: string;
  timestamp: number;
  authStatus: AuthStatus;
  governanceStatus: GovernanceStatus;
  targetWorkspaceId?: string;
  targetProjectId?: string;
}

export interface DriftFinding {
  driftFindingId: string;
  driftType: DriftType;
  driftSeverity: DriftSeverity;
  driftReason: string;
  driftEvidence: string[];
  affectedSystems: string[];
  recommendedReview: string;
  recommendedAction: string;
}

export interface DriftConfirmation {
  architectureDriftDetectionOnly: true;
  noExecutionPerformed: true;
  noCommandsExecuted: true;
  noFilesModified: true;
  noCodeGenerated: true;
  noDeploymentPerformed: true;
  noArchitectureModified: true;
  noGovernanceModified: true;
  noOwnershipRegistryModified: true;
  noAutoFixPerformed: true;
}

export interface ArchitectureDriftResult {
  architectureDriftId: string;
  driftAnalysisId: string;
  workspaceId: string;
  projectId: string;
  analysisSource: DriftAnalysisSource;
  driftType: DriftType;
  driftSeverity: DriftSeverity;
  driftConfidence: DriftConfidence;
  driftReason: string;
  driftEvidence: string[];
  affectedSystems: string[];
  recommendedReview: string;
  recommendedAction: string;
  driftState: DriftState;
  overallDriftRisk: OverallDriftRisk;
  driftFindings: DriftFinding[];
  governanceGates: GateRecord[];
  ownershipGates: GateRecord[];
  securityWarnings: string[];
  recommendations: string[];
  confirmation: DriftConfirmation;
  stateSequence: DriftState[];
  createdAt: number;
}

export interface ArchitectureDriftReportOutput {
  reportId: string;
  driftAnalysisId: string;
  architectureDriftId: string;
  workspaceId: string;
  projectId: string;
  analysisSource: DriftAnalysisSource;
  driftType: DriftType;
  driftSeverity: DriftSeverity;
  driftConfidence: DriftConfidence;
  overallDriftRisk: OverallDriftRisk;
  driftCount: number;
  highSeverityCount: number;
  criticalSeverityCount: number;
  affectedSystemCount: number;
  reviewRecommendationCount: number;
  governanceGateCount: number;
  ownershipGateCount: number;
  securityWarningCount: number;
  recommendationCount: number;
  topDrifts: DriftFinding[];
  confirmation: DriftConfirmation;
}

export interface ArchitectureDriftReport {
  ownerModule: string;
  reportId: string;
  driftAnalysisId: string;
  architectureDriftId: string;
  workspaceId: string;
  projectId: string;
  analysisSource: DriftAnalysisSource;
  driftType: DriftType;
  driftSeverity: DriftSeverity;
  driftConfidence: DriftConfidence;
  overallDriftRisk: OverallDriftRisk;
  driftCount: number;
  highSeverityCount: number;
  criticalSeverityCount: number;
  affectedSystemCount: number;
  reviewRecommendationCount: number;
  governanceGateCount: number;
  ownershipGateCount: number;
  securityWarningCount: number;
  recommendationCount: number;
  topDrifts: DriftFinding[];
  confirmation: DriftConfirmation;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface ArchitectureDriftDetectionState {
  foundationId: string;
  analysisCount: number;
  warnings: string[];
  errors: string[];
}

export const ARCHITECTURE_DRIFT_DETECTION_OWNER_MODULE = 'devpulse_v2_architecture_drift_detection';
export const ARCHITECTURE_DRIFT_DETECTION_PASS_TOKEN =
  'DEVPULSE_V2_ARCHITECTURE_DRIFT_DETECTION_FOUNDATION_V1_PASS';

export const DRIFT_STATE_SEQUENCE: readonly DriftState[] = [
  'DRIFT_ANALYSIS_RECEIVED',
  'ARCHITECTURE_CONTEXT_VALIDATED',
  'EXPECTED_RULES_EVALUATED',
  'OBSERVED_SIGNALS_EVALUATED',
  'DRIFT_SCAN_COMPLETE',
  'DRIFT_CLASSIFIED',
  'SEVERITY_SCORED',
  'REVIEW_RECOMMENDATION_CREATED',
  'DRIFT_REPORT_READY',
] as const;

export const KNOWN_ANALYSIS_SOURCES: readonly DriftAnalysisSource[] = [
  'OWNERSHIP_REGISTRY_REVIEW',
  'DEPENDENCY_REVIEW',
  'SOURCE_OF_TRUTH_REVIEW',
  'PHASE_ORDER_REVIEW',
  'GOVERNANCE_REVIEW',
  'WORLD_BOUNDARY_REVIEW',
  'MOBILE_STACK_REVIEW',
  'SELF_EVOLUTION_REVIEW',
  'EXECUTION_AUTHORITY_REVIEW',
  'ARCHITECTURE_CHECKPOINT',
] as const;

export const KNOWN_DRIFT_TYPES: readonly DriftType[] = [
  'DUPLICATE_OWNERSHIP_DRIFT',
  'DUPLICATE_SOURCE_OF_TRUTH_DRIFT',
  'PHASE_ORDER_DRIFT',
  'DEPENDENCY_DRIFT',
  'GOVERNANCE_BYPASS_DRIFT',
  'WORLD_BOUNDARY_DRIFT',
  'MOBILE_STACK_DRIFT',
  'SELF_EVOLUTION_DRIFT',
  'CAPABILITY_ACQUISITION_DRIFT',
  'LEARNING_OVERLAP_DRIFT',
  'EXECUTION_AUTHORITY_DRIFT',
] as const;

export const DRIFT_SEVERITY_LEVELS: readonly DriftSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const DRIFT_CONFIDENCE_LEVELS: readonly DriftConfidence[] = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'] as const;

export const OVERALL_DRIFT_RISK_LEVELS: readonly OverallDriftRisk[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const SIGNAL_TO_DRIFT_TYPE: ReadonlyArray<{ patterns: readonly string[]; driftType: DriftType; defaultSeverity: DriftSeverity }> = [
  { patterns: ['duplicate ownership', 'competing owner', 'two owners'], driftType: 'DUPLICATE_OWNERSHIP_DRIFT', defaultSeverity: 'CRITICAL' },
  { patterns: ['duplicate source of truth', 'competing truth', 'truth source conflict'], driftType: 'DUPLICATE_SOURCE_OF_TRUTH_DRIFT', defaultSeverity: 'CRITICAL' },
  { patterns: ['phase order', 'wrong phase', 'future phase built early'], driftType: 'PHASE_ORDER_DRIFT', defaultSeverity: 'HIGH' },
  { patterns: ['bypass dependency', 'missing upstream', 'dependency skip'], driftType: 'DEPENDENCY_DRIFT', defaultSeverity: 'HIGH' },
  { patterns: ['governance bypass', 'skip approval', 'skip verification', 'skip evidence'], driftType: 'GOVERNANCE_BYPASS_DRIFT', defaultSeverity: 'CRITICAL' },
  { patterns: ['world1 modification', 'world boundary blur', 'world2 isolation breach'], driftType: 'WORLD_BOUNDARY_DRIFT', defaultSeverity: 'CRITICAL' },
  { patterns: ['mobile executor', 'mobile executes', 'mobile runs commands'], driftType: 'MOBILE_STACK_DRIFT', defaultSeverity: 'HIGH' },
  { patterns: ['auto-fix drift', 'modify behavior', 'auto-change behavior'], driftType: 'SELF_EVOLUTION_DRIFT', defaultSeverity: 'HIGH' },
  { patterns: ['acquire capability', 'install directly', 'download tool'], driftType: 'CAPABILITY_ACQUISITION_DRIFT', defaultSeverity: 'HIGH' },
  { patterns: ['duplicate learning', 'fork world2_learning', 'learning overlap'], driftType: 'LEARNING_OVERLAP_DRIFT', defaultSeverity: 'MEDIUM' },
  { patterns: ['claims execution', 'execution authority claim', 'non-execution executes'], driftType: 'EXECUTION_AUTHORITY_DRIFT', defaultSeverity: 'CRITICAL' },
];

export const EXECUTION_BLOCKED_PATTERNS = ['execute', 'run command', 'self execute'] as const;
export const CODE_GEN_BLOCKED_PATTERNS = ['generate code', 'write code'] as const;
export const FILE_MOD_BLOCKED_PATTERNS = ['modify file', 'write file', 'delete file'] as const;
export const DEPLOY_BLOCKED_PATTERNS = ['deploy', 'publish'] as const;
export const AUTO_FIX_BLOCKED_PATTERNS = ['auto-fix drift', 'auto fix drift', 'automatic repair'] as const;
export const ARCHITECTURE_MOD_BLOCKED_PATTERNS = ['modify architecture', 'refactor architecture'] as const;
export const GOVERNANCE_MUTATION_BLOCKED_PATTERNS = ['mutate governance', 'modify governance'] as const;
export const REGISTRY_MUTATION_BLOCKED_PATTERNS = ['update ownership registry', 'mutate registry', 'change ownership registry'] as const;

export const DEPENDENCY_SYSTEMS = [
  'missing_capability_detector',
  'safe_capability_acquisition',
  'self_learning_engine',
  'world2_learning_loop',
  'controlled_execution_bridge',
  'mobile_command_foundation',
  'mobile_chat_interface',
  'mobile_live_preview_foundation',
  'mobile_approval_flow_foundation',
  'cross_device_continuity_foundation',
  'execution_evidence_ledger',
  'verification_gated_apply',
  'founder_approval_execution_gate',
  'execution_authority',
] as const;

export const DUPLICATE_PATTERNS = [
  'architecture_drift_detection',
  'architecture drift',
  'architecture drift detector',
  'drift detection engine',
  'drift scanner',
  'architecture guardrail detector',
  'source truth drift detector',
] as const;

export const PROTECTED_DOMAINS = [
  'world2_learning_loop',
  'self_learning_engine',
  'missing_capability_detector',
  'safe_capability_acquisition',
  'controlled_execution_bridge',
  'execution_authority',
  'chat_authority',
  'verification_gated_apply',
] as const;

let driftAnalysisCounter = 0;
let driftIdCounter = 0;
let findingCounter = 0;

export function nextDriftAnalysisId(): string {
  driftAnalysisCounter += 1;
  return `drift-ana-${driftAnalysisCounter.toString().padStart(4, '0')}`;
}

export function nextArchitectureDriftId(): string {
  driftIdCounter += 1;
  return `drift-${driftIdCounter.toString().padStart(4, '0')}`;
}

export function nextDriftFindingId(): string {
  findingCounter += 1;
  return `drift-find-${findingCounter.toString().padStart(4, '0')}`;
}

export function resetDriftCountersForTests(): void {
  driftAnalysisCounter = 0;
  driftIdCounter = 0;
  findingCounter = 0;
}
