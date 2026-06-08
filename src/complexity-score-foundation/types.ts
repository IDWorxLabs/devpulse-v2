/** DevPulse V2 Phase 9.5 Complexity Score Foundation — types. */

export type ComplexityAnalysisSource =
  | 'SYSTEM_REVIEW'
  | 'MODULE_REVIEW'
  | 'DEPENDENCY_REVIEW'
  | 'WORKFLOW_REVIEW'
  | 'PHASE_REVIEW'
  | 'MOBILE_STACK_REVIEW'
  | 'WORLD2_STACK_REVIEW'
  | 'SELF_EVOLUTION_REVIEW'
  | 'ARCHITECTURE_DRIFT_REVIEW'
  | 'CAPABILITY_REVIEW'
  | 'GOVERNANCE_REVIEW'
  | 'UNKNOWN';

export type SystemArea =
  | 'FOUNDATION'
  | 'GOVERNANCE'
  | 'WORLD2'
  | 'MOBILE_REMOTE_CONTROL'
  | 'SELF_EVOLUTION'
  | 'EXECUTION'
  | 'PROJECT_WORKSPACE'
  | 'CAPABILITY_LAYER'
  | 'ARCHITECTURE'
  | 'UNKNOWN';

export type ComplexityFactorType =
  | 'MODULE_COUNT'
  | 'DEPENDENCY_COUNT'
  | 'OWNERSHIP_DENSITY'
  | 'SOURCE_OF_TRUTH_COUNT'
  | 'DRIFT_FINDING_COUNT'
  | 'WORKFLOW_STEP_COUNT'
  | 'APPROVAL_GATE_COUNT'
  | 'VERIFICATION_GATE_COUNT'
  | 'ROLLBACK_GATE_COUNT'
  | 'CROSS_DEVICE_CONTEXT_COUNT'
  | 'CAPABILITY_GAP_COUNT'
  | 'LEARNING_RECORD_COUNT'
  | 'UNKNOWN';

export type ComplexityState =
  | 'COMPLEXITY_ANALYSIS_RECEIVED'
  | 'SYSTEM_CONTEXT_VALIDATED'
  | 'COMPLEXITY_SIGNALS_EVALUATED'
  | 'FACTOR_SCORES_CREATED'
  | 'COMPLEXITY_SCORE_CREATED'
  | 'RISK_BAND_CREATED'
  | 'PRESSURE_INTERPRETED'
  | 'REVIEW_RECOMMENDATION_CREATED'
  | 'COMPLEXITY_REPORT_READY'
  | 'COMPLEXITY_ANALYSIS_BLOCKED';

export type ComplexityRiskBand = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ComplexityConfidence = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export type GovernanceStatus = 'PASS' | 'FAIL' | 'PENDING' | 'UNKNOWN';

export type AuthStatus = 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'PENDING' | 'UNKNOWN';

export interface GateRecord {
  gateId: string;
  gateType: string;
  status: 'OPEN' | 'CLOSED' | 'REQUIRED';
  description: string;
}

export interface ComplexityAnalysisInput {
  complexityAnalysisId?: string;
  workspaceId: string;
  projectId: string;
  analysisSource: ComplexityAnalysisSource;
  systemArea: SystemArea;
  systemSnapshotId?: string;
  systemSnapshotSummary: string;
  complexitySignals: string[];
  driftSignals?: string[];
  dependencySignals?: string[];
  ownershipSignals?: string[];
  moduleSignals?: string[];
  workflowSignals?: string[];
  phaseContext?: string;
  sourceSystem?: string;
  timestamp: number;
  authStatus: AuthStatus;
  governanceStatus: GovernanceStatus;
  targetWorkspaceId?: string;
  targetProjectId?: string;
}

export interface FactorScore {
  factorId: string;
  factorType: ComplexityFactorType;
  factorValue: number;
  factorWeight: number;
  factorScore: number;
  factorReason: string;
}

export interface ComplexityConfirmation {
  complexityScoringOnly: true;
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

export interface ComplexityScoreResult {
  complexityScoreId: string;
  complexityAnalysisId: string;
  workspaceId: string;
  projectId: string;
  analysisSource: ComplexityAnalysisSource;
  systemArea: SystemArea;
  complexityScore: number;
  riskBand: ComplexityRiskBand;
  confidenceScore: ComplexityConfidence;
  complexityReasons: string[];
  topComplexityFactors: FactorScore[];
  factorScores: FactorScore[];
  pressureInterpretation: string;
  reviewRecommendation: string;
  affectedSystems: string[];
  complexityState: ComplexityState;
  governanceGates: GateRecord[];
  ownershipGates: GateRecord[];
  securityWarnings: string[];
  recommendations: string[];
  confirmation: ComplexityConfirmation;
  stateSequence: ComplexityState[];
  createdAt: number;
}

export interface ComplexityScoreReportOutput {
  reportId: string;
  complexityScoreId: string;
  complexityAnalysisId: string;
  workspaceId: string;
  projectId: string;
  analysisSource: ComplexityAnalysisSource;
  systemArea: SystemArea;
  complexityScore: number;
  riskBand: ComplexityRiskBand;
  confidenceScore: ComplexityConfidence;
  factorCount: number;
  highFactorCount: number;
  criticalFactorCount: number;
  affectedSystemCount: number;
  reviewRecommendationCount: number;
  governanceGateCount: number;
  ownershipGateCount: number;
  securityWarningCount: number;
  recommendationCount: number;
  confirmation: ComplexityConfirmation;
}

export interface ComplexityScoreReport {
  ownerModule: string;
  reportId: string;
  complexityScoreId: string;
  complexityAnalysisId: string;
  workspaceId: string;
  projectId: string;
  analysisSource: ComplexityAnalysisSource;
  systemArea: SystemArea;
  complexityScore: number;
  riskBand: ComplexityRiskBand;
  confidenceScore: ComplexityConfidence;
  factorCount: number;
  highFactorCount: number;
  criticalFactorCount: number;
  affectedSystemCount: number;
  reviewRecommendationCount: number;
  governanceGateCount: number;
  ownershipGateCount: number;
  securityWarningCount: number;
  recommendationCount: number;
  confirmation: ComplexityConfirmation;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface ComplexityScoreFoundationState {
  foundationId: string;
  analysisCount: number;
  warnings: string[];
  errors: string[];
}

export const COMPLEXITY_SCORE_FOUNDATION_OWNER_MODULE = 'devpulse_v2_complexity_score_foundation';
export const COMPLEXITY_SCORE_FOUNDATION_PASS_TOKEN =
  'DEVPULSE_V2_COMPLEXITY_SCORE_FOUNDATION_V1_PASS';

export const COMPLEXITY_STATE_SEQUENCE: readonly ComplexityState[] = [
  'COMPLEXITY_ANALYSIS_RECEIVED',
  'SYSTEM_CONTEXT_VALIDATED',
  'COMPLEXITY_SIGNALS_EVALUATED',
  'FACTOR_SCORES_CREATED',
  'COMPLEXITY_SCORE_CREATED',
  'RISK_BAND_CREATED',
  'PRESSURE_INTERPRETED',
  'REVIEW_RECOMMENDATION_CREATED',
  'COMPLEXITY_REPORT_READY',
] as const;

export const KNOWN_ANALYSIS_SOURCES: readonly ComplexityAnalysisSource[] = [
  'SYSTEM_REVIEW',
  'MODULE_REVIEW',
  'DEPENDENCY_REVIEW',
  'WORKFLOW_REVIEW',
  'PHASE_REVIEW',
  'MOBILE_STACK_REVIEW',
  'WORLD2_STACK_REVIEW',
  'SELF_EVOLUTION_REVIEW',
  'ARCHITECTURE_DRIFT_REVIEW',
  'CAPABILITY_REVIEW',
  'GOVERNANCE_REVIEW',
] as const;

export const KNOWN_SYSTEM_AREAS: readonly SystemArea[] = [
  'FOUNDATION',
  'GOVERNANCE',
  'WORLD2',
  'MOBILE_REMOTE_CONTROL',
  'SELF_EVOLUTION',
  'EXECUTION',
  'PROJECT_WORKSPACE',
  'CAPABILITY_LAYER',
  'ARCHITECTURE',
] as const;

export const KNOWN_COMPLEXITY_FACTORS: readonly ComplexityFactorType[] = [
  'MODULE_COUNT',
  'DEPENDENCY_COUNT',
  'OWNERSHIP_DENSITY',
  'SOURCE_OF_TRUTH_COUNT',
  'DRIFT_FINDING_COUNT',
  'WORKFLOW_STEP_COUNT',
  'APPROVAL_GATE_COUNT',
  'VERIFICATION_GATE_COUNT',
  'ROLLBACK_GATE_COUNT',
  'CROSS_DEVICE_CONTEXT_COUNT',
  'CAPABILITY_GAP_COUNT',
  'LEARNING_RECORD_COUNT',
] as const;

export const COMPLEXITY_RISK_BANDS: readonly ComplexityRiskBand[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const COMPLEXITY_CONFIDENCE_LEVELS: readonly ComplexityConfidence[] = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'] as const;

export const RISK_BAND_THRESHOLDS: Readonly<Record<ComplexityRiskBand, { min: number; max: number }>> = {
  LOW: { min: 0, max: 24 },
  MEDIUM: { min: 25, max: 49 },
  HIGH: { min: 50, max: 74 },
  CRITICAL: { min: 75, max: 100 },
};

export const FACTOR_WEIGHTS: Readonly<Record<ComplexityFactorType, number>> = {
  MODULE_COUNT: 0.08,
  DEPENDENCY_COUNT: 0.1,
  OWNERSHIP_DENSITY: 0.09,
  SOURCE_OF_TRUTH_COUNT: 0.09,
  DRIFT_FINDING_COUNT: 0.12,
  WORKFLOW_STEP_COUNT: 0.07,
  APPROVAL_GATE_COUNT: 0.08,
  VERIFICATION_GATE_COUNT: 0.08,
  ROLLBACK_GATE_COUNT: 0.07,
  CROSS_DEVICE_CONTEXT_COUNT: 0.06,
  CAPABILITY_GAP_COUNT: 0.08,
  LEARNING_RECORD_COUNT: 0.08,
  UNKNOWN: 0.05,
};

export const SIGNAL_PATTERNS: ReadonlyArray<{ patterns: readonly string[]; factorType: ComplexityFactorType }> = [
  { patterns: ['module count', 'modules:', 'module complexity'], factorType: 'MODULE_COUNT' },
  { patterns: ['dependency count', 'dependencies:', 'dependency complexity'], factorType: 'DEPENDENCY_COUNT' },
  { patterns: ['ownership density', 'owners overlap', 'ownership complexity'], factorType: 'OWNERSHIP_DENSITY' },
  { patterns: ['source of truth', 'truth source', 'source-of-truth'], factorType: 'SOURCE_OF_TRUTH_COUNT' },
  { patterns: ['drift finding', 'drift count', 'architecture drift'], factorType: 'DRIFT_FINDING_COUNT' },
  { patterns: ['workflow step', 'workflow complexity', 'workflow count'], factorType: 'WORKFLOW_STEP_COUNT' },
  { patterns: ['approval gate', 'approval count', 'approval complexity'], factorType: 'APPROVAL_GATE_COUNT' },
  { patterns: ['verification gate', 'verification count'], factorType: 'VERIFICATION_GATE_COUNT' },
  { patterns: ['rollback gate', 'rollback count'], factorType: 'ROLLBACK_GATE_COUNT' },
  { patterns: ['cross-device', 'cross device context', 'device continuity'], factorType: 'CROSS_DEVICE_CONTEXT_COUNT' },
  { patterns: ['capability gap', 'missing capability', 'capability count'], factorType: 'CAPABILITY_GAP_COUNT' },
  { patterns: ['learning record', 'learning pressure', 'learning count'], factorType: 'LEARNING_RECORD_COUNT' },
];

export const EXECUTION_BLOCKED_PATTERNS = ['execute', 'run command', 'self execute'] as const;
export const CODE_GEN_BLOCKED_PATTERNS = ['generate code', 'write code'] as const;
export const FILE_MOD_BLOCKED_PATTERNS = ['modify file', 'write file', 'delete file'] as const;
export const DEPLOY_BLOCKED_PATTERNS = ['deploy', 'publish'] as const;
export const AUTO_FIX_BLOCKED_PATTERNS = ['auto-fix complexity', 'auto fix complexity', 'automatic repair'] as const;
export const ARCHITECTURE_MOD_BLOCKED_PATTERNS = ['modify architecture', 'refactor architecture'] as const;
export const GOVERNANCE_MUTATION_BLOCKED_PATTERNS = ['mutate governance', 'modify governance'] as const;
export const REGISTRY_MUTATION_BLOCKED_PATTERNS = ['update ownership registry', 'mutate registry', 'change ownership registry'] as const;

export const DEPENDENCY_SYSTEMS = [
  'architecture_drift_detection',
  'self_learning_engine',
  'missing_capability_detector',
  'safe_capability_acquisition',
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
  'complexity_score',
  'complexity scoring',
  'complexity score foundation',
  'complexity pressure score',
  'system complexity score',
  'architecture complexity score',
  'complexity risk engine',
] as const;

let analysisCounter = 0;
let scoreCounter = 0;
let factorCounter = 0;

export function nextComplexityAnalysisId(): string {
  analysisCounter += 1;
  return `cx-ana-${analysisCounter.toString().padStart(4, '0')}`;
}

export function nextComplexityScoreId(): string {
  scoreCounter += 1;
  return `cx-score-${scoreCounter.toString().padStart(4, '0')}`;
}

export function nextFactorId(): string {
  factorCounter += 1;
  return `factor-${factorCounter.toString().padStart(4, '0')}`;
}

export function resetComplexityCountersForTests(): void {
  analysisCounter = 0;
  scoreCounter = 0;
  factorCounter = 0;
}
