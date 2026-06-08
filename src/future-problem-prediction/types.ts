/** DevPulse V2 Phase 9.6 Future Problem Prediction Foundation — types. */

export type PredictionAnalysisSource =
  | 'SYSTEM_REVIEW'
  | 'MODULE_REVIEW'
  | 'DEPENDENCY_REVIEW'
  | 'WORKFLOW_REVIEW'
  | 'PHASE_REVIEW'
  | 'MOBILE_STACK_REVIEW'
  | 'WORLD2_STACK_REVIEW'
  | 'SELF_EVOLUTION_REVIEW'
  | 'ARCHITECTURE_REVIEW'
  | 'COMPLEXITY_REVIEW'
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

export type PredictionType =
  | 'DEPENDENCY_FAILURE_RISK'
  | 'ARCHITECTURE_FAILURE_RISK'
  | 'COMPLEXITY_FAILURE_RISK'
  | 'GOVERNANCE_FAILURE_RISK'
  | 'OWNERSHIP_CONFLICT_RISK'
  | 'SOURCE_OF_TRUTH_CONFLICT_RISK'
  | 'MOBILE_STACK_RISK'
  | 'WORLD2_RISK'
  | 'SELF_EVOLUTION_RISK'
  | 'CAPABILITY_ACQUISITION_RISK'
  | 'EXECUTION_AUTHORITY_RISK'
  | 'SCALING_RISK'
  | 'WORKFLOW_BOTTLENECK_RISK'
  | 'ARCHITECTURE_DRIFT_RISK'
  | 'UNKNOWN';

export type PredictionState =
  | 'PREDICTION_RECEIVED'
  | 'SYSTEM_CONTEXT_VALIDATED'
  | 'SIGNALS_EVALUATED'
  | 'RISK_FORECAST_CREATED'
  | 'PROBLEM_PREDICTED'
  | 'CONFIDENCE_SCORED'
  | 'PREVENTION_RECOMMENDATION_CREATED'
  | 'PREDICTION_REPORT_READY'
  | 'PREDICTION_BLOCKED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export type OverallFutureRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ForecastTimeframe = 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';

export type GovernanceStatus = 'PASS' | 'FAIL' | 'PENDING' | 'UNKNOWN';

export type AuthStatus = 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'PENDING' | 'UNKNOWN';

export interface GateRecord {
  gateId: string;
  gateType: string;
  status: 'OPEN' | 'CLOSED' | 'REQUIRED';
  description: string;
}

export interface PredictionAnalysisInput {
  predictionAnalysisId?: string;
  workspaceId: string;
  projectId: string;
  analysisSource: PredictionAnalysisSource;
  systemArea: SystemArea;
  systemSnapshotId?: string;
  systemSnapshotSummary: string;
  complexitySignals?: string[];
  driftSignals?: string[];
  learningSignals?: string[];
  capabilitySignals?: string[];
  dependencySignals?: string[];
  workflowSignals?: string[];
  predictionContext?: string;
  phaseContext?: string;
  sourceSystem?: string;
  timestamp: number;
  authStatus: AuthStatus;
  governanceStatus: GovernanceStatus;
  targetWorkspaceId?: string;
  targetProjectId?: string;
}

export interface RiskForecast {
  forecastId: string;
  predictionType: PredictionType;
  riskLevel: RiskLevel;
  forecastTimeframe: ForecastTimeframe;
  forecastReason: string;
  signalStrength: number;
}

export interface ProblemPrediction {
  predictionId: string;
  predictionType: PredictionType;
  riskLevel: RiskLevel;
  confidenceLevel: ConfidenceLevel;
  predictionReason: string;
  predictionEvidence: string[];
  forecastTimeframe: ForecastTimeframe;
}

export interface PredictionConfirmation {
  futurePredictionOnly: true;
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

export interface PredictionResult {
  predictionId: string;
  predictionAnalysisId: string;
  workspaceId: string;
  projectId: string;
  analysisSource: PredictionAnalysisSource;
  systemArea: SystemArea;
  predictionType: PredictionType;
  riskLevel: RiskLevel;
  confidenceLevel: ConfidenceLevel;
  predictionReason: string;
  predictionEvidence: string[];
  affectedSystems: string[];
  forecastTimeframe: ForecastTimeframe;
  preventionRecommendation: string;
  predictionState: PredictionState;
  governanceGates: GateRecord[];
  ownershipGates: GateRecord[];
  securityWarnings: string[];
  recommendations: string[];
  confirmation: PredictionConfirmation;
  stateSequence: PredictionState[];
  predictions: ProblemPrediction[];
  riskForecasts: RiskForecast[];
  overallFutureRisk: OverallFutureRisk;
  topPredictions: ProblemPrediction[];
  createdAt: number;
}

export interface PredictionReportOutput {
  reportId: string;
  predictionAnalysisId: string;
  workspaceId: string;
  projectId: string;
  analysisSource: PredictionAnalysisSource;
  systemArea: SystemArea;
  predictionCount: number;
  highRiskCount: number;
  criticalRiskCount: number;
  affectedSystemCount: number;
  recommendationCount: number;
  overallFutureRisk: OverallFutureRisk;
  confidenceScore: ConfidenceLevel;
  topPredictions: ProblemPrediction[];
  governanceGateCount: number;
  ownershipGateCount: number;
  securityWarningCount: number;
  confirmation: PredictionConfirmation;
}

export interface PredictionReport {
  ownerModule: string;
  reportId: string;
  predictionAnalysisId: string;
  workspaceId: string;
  projectId: string;
  analysisSource: PredictionAnalysisSource;
  systemArea: SystemArea;
  predictionType: PredictionType;
  riskLevel: RiskLevel;
  confidenceLevel: ConfidenceLevel;
  overallFutureRisk: OverallFutureRisk;
  affectedSystemCount: number;
  highRiskCount: number;
  criticalRiskCount: number;
  governanceGateCount: number;
  ownershipGateCount: number;
  securityWarningCount: number;
  recommendationCount: number;
  confirmation: PredictionConfirmation;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface FutureProblemPredictionState {
  foundationId: string;
  analysisCount: number;
  warnings: string[];
  errors: string[];
}

export const FUTURE_PROBLEM_PREDICTION_OWNER_MODULE = 'devpulse_v2_future_problem_prediction';
export const FUTURE_PROBLEM_PREDICTION_PASS_TOKEN =
  'DEVPULSE_V2_FUTURE_PROBLEM_PREDICTION_FOUNDATION_V1_PASS';

export const PREDICTION_STATE_SEQUENCE: readonly PredictionState[] = [
  'PREDICTION_RECEIVED',
  'SYSTEM_CONTEXT_VALIDATED',
  'SIGNALS_EVALUATED',
  'RISK_FORECAST_CREATED',
  'PROBLEM_PREDICTED',
  'CONFIDENCE_SCORED',
  'PREVENTION_RECOMMENDATION_CREATED',
  'PREDICTION_REPORT_READY',
] as const;

export const KNOWN_ANALYSIS_SOURCES: readonly PredictionAnalysisSource[] = [
  'SYSTEM_REVIEW',
  'MODULE_REVIEW',
  'DEPENDENCY_REVIEW',
  'WORKFLOW_REVIEW',
  'PHASE_REVIEW',
  'MOBILE_STACK_REVIEW',
  'WORLD2_STACK_REVIEW',
  'SELF_EVOLUTION_REVIEW',
  'ARCHITECTURE_REVIEW',
  'COMPLEXITY_REVIEW',
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

export const KNOWN_PREDICTION_TYPES: readonly PredictionType[] = [
  'DEPENDENCY_FAILURE_RISK',
  'ARCHITECTURE_FAILURE_RISK',
  'COMPLEXITY_FAILURE_RISK',
  'GOVERNANCE_FAILURE_RISK',
  'OWNERSHIP_CONFLICT_RISK',
  'SOURCE_OF_TRUTH_CONFLICT_RISK',
  'MOBILE_STACK_RISK',
  'WORLD2_RISK',
  'SELF_EVOLUTION_RISK',
  'CAPABILITY_ACQUISITION_RISK',
  'EXECUTION_AUTHORITY_RISK',
  'SCALING_RISK',
  'WORKFLOW_BOTTLENECK_RISK',
  'ARCHITECTURE_DRIFT_RISK',
] as const;

export const RISK_LEVELS: readonly RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const CONFIDENCE_LEVELS: readonly ConfidenceLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'] as const;

export const FORECAST_TIMEFRAMES: readonly ForecastTimeframe[] = [
  'IMMEDIATE',
  'SHORT_TERM',
  'MEDIUM_TERM',
  'LONG_TERM',
] as const;

export const RISK_THRESHOLDS: Readonly<Record<RiskLevel, { min: number; max: number }>> = {
  LOW: { min: 0, max: 24 },
  MEDIUM: { min: 25, max: 49 },
  HIGH: { min: 50, max: 74 },
  CRITICAL: { min: 75, max: 100 },
};

export const PREDICTION_SIGNAL_PATTERNS: ReadonlyArray<{ patterns: readonly string[]; predictionType: PredictionType }> = [
  { patterns: ['dependency density', 'dependency count', 'dependency failure', 'dependencies:'], predictionType: 'DEPENDENCY_FAILURE_RISK' },
  { patterns: ['architecture failure', 'architecture instability', 'architecture breakdown'], predictionType: 'ARCHITECTURE_FAILURE_RISK' },
  { patterns: ['complexity score', 'high complexity', 'complexity failure', 'complexity pressure'], predictionType: 'COMPLEXITY_FAILURE_RISK' },
  { patterns: ['governance pressure', 'governance failure', 'governance overload'], predictionType: 'GOVERNANCE_FAILURE_RISK' },
  { patterns: ['ownership conflict', 'ownership density', 'owners overlap'], predictionType: 'OWNERSHIP_CONFLICT_RISK' },
  { patterns: ['source of truth conflict', 'truth overlap', 'source-of-truth conflict'], predictionType: 'SOURCE_OF_TRUTH_CONFLICT_RISK' },
  { patterns: ['mobile stack', 'mobile complexity', 'mobile drift', 'mobile failure'], predictionType: 'MOBILE_STACK_RISK' },
  { patterns: ['world2 failure', 'world2 complexity', 'world2 learning'], predictionType: 'WORLD2_RISK' },
  { patterns: ['self-evolution failure', 'self evolution risk', 'capability gap repeated'], predictionType: 'SELF_EVOLUTION_RISK' },
  { patterns: ['capability acquisition', 'acquisition failure', 'capability gap'], predictionType: 'CAPABILITY_ACQUISITION_RISK' },
  { patterns: ['execution authority', 'authority overlap', 'authority conflict'], predictionType: 'EXECUTION_AUTHORITY_RISK' },
  { patterns: ['scaling risk', 'increasing complexity', 'scale pressure'], predictionType: 'SCALING_RISK' },
  { patterns: ['workflow bottleneck', 'workflow density', 'workflow step'], predictionType: 'WORKFLOW_BOTTLENECK_RISK' },
  { patterns: ['drift pattern', 'drift finding', 'architecture drift', 'future drift'], predictionType: 'ARCHITECTURE_DRIFT_RISK' },
];

export const EXECUTION_BLOCKED_PATTERNS = ['execute', 'run command', 'self execute'] as const;
export const CODE_GEN_BLOCKED_PATTERNS = ['generate code', 'write code'] as const;
export const FILE_MOD_BLOCKED_PATTERNS = ['modify file', 'write file', 'delete file'] as const;
export const DEPLOY_BLOCKED_PATTERNS = ['deploy', 'publish'] as const;
export const AUTO_FIX_BLOCKED_PATTERNS = ['auto-fix predicted', 'auto fix problem', 'automatic repair'] as const;
export const ARCHITECTURE_MOD_BLOCKED_PATTERNS = ['modify architecture', 'refactor architecture'] as const;
export const GOVERNANCE_MUTATION_BLOCKED_PATTERNS = ['mutate governance', 'modify governance'] as const;
export const REGISTRY_MUTATION_BLOCKED_PATTERNS = ['update ownership registry', 'mutate registry', 'change ownership registry'] as const;

export const DEPENDENCY_SYSTEMS = [
  'architecture_drift_detection',
  'complexity_score_foundation',
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
  'future_problem_prediction',
  'future risk prediction',
  'future failure prediction',
  'prediction engine',
  'failure forecast engine',
  'problem prediction foundation',
  'risk forecast foundation',
] as const;

let analysisCounter = 0;
let predictionCounter = 0;
let forecastCounter = 0;

export function nextPredictionAnalysisId(): string {
  analysisCounter += 1;
  return `pred-ana-${analysisCounter.toString().padStart(4, '0')}`;
}

export function nextPredictionId(): string {
  predictionCounter += 1;
  return `pred-${predictionCounter.toString().padStart(4, '0')}`;
}

export function nextForecastId(): string {
  forecastCounter += 1;
  return `forecast-${forecastCounter.toString().padStart(4, '0')}`;
}

export function resetPredictionCountersForTests(): void {
  analysisCounter = 0;
  predictionCounter = 0;
  forecastCounter = 0;
}
