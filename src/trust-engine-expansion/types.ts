/** DevPulse V2 Phase 10.2 Trust Engine Expansion Foundation — types. */

export type TrustAssessmentSource =
  | 'PROJECT_COMPLETION'
  | 'VERIFICATION_RESULT'
  | 'MOBILE_APPROVAL'
  | 'WORLD2_COMPLETION'
  | 'CONTROLLED_EXECUTION'
  | 'EXPERIENCE_LAYER'
  | 'SELF_EVOLUTION'
  | 'FOUNDER_REVIEW'
  | 'UNKNOWN';

export type TrustAssessmentTarget =
  | 'PROJECT'
  | 'PLAN'
  | 'SIMULATION'
  | 'BUILDER_PACKET'
  | 'COMPLETION_RESULT'
  | 'APPROVAL_DECISION'
  | 'MOBILE_COMMAND'
  | 'SELF_EVOLUTION_RECOMMENDATION'
  | 'UNKNOWN';

export type TrustFactorType =
  | 'EVIDENCE_QUALITY'
  | 'VERIFICATION_STRENGTH'
  | 'COMPLETION_CONFIDENCE'
  | 'REALITY_ALIGNMENT'
  | 'GOVERNANCE_ALIGNMENT'
  | 'PREDICTION_RISK'
  | 'COMPLEXITY_RISK'
  | 'DRIFT_RISK'
  | 'LEARNING_SUPPORT'
  | 'CAPABILITY_COVERAGE';

export type TrustState =
  | 'TRUST_ASSESSMENT_RECEIVED'
  | 'TRUST_CONTEXT_VALIDATED'
  | 'TRUST_SIGNALS_EVALUATED'
  | 'TRUST_FACTORS_SCORED'
  | 'TRUST_SCORE_CREATED'
  | 'TRUST_WARNINGS_CREATED'
  | 'TRUST_RECOMMENDATIONS_CREATED'
  | 'TRUST_REPORT_READY'
  | 'TRUST_ASSESSMENT_BLOCKED';

export type TrustLevel = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export type TrustRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type GovernanceStatus = 'PASS' | 'FAIL' | 'PENDING' | 'UNKNOWN';

export type AuthStatus = 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'PENDING' | 'UNKNOWN';

export interface GateRecord {
  gateId: string;
  gateType: string;
  status: 'OPEN' | 'CLOSED' | 'REQUIRED';
  description: string;
}

export interface TrustAssessmentInput {
  trustAssessmentId?: string;
  workspaceId: string;
  projectId: string;
  assessmentSource: TrustAssessmentSource;
  assessmentTarget: TrustAssessmentTarget;
  targetId: string;
  evidenceSignals?: string[];
  verificationSignals?: string[];
  completionSignals?: string[];
  realitySignals?: string[];
  governanceSignals?: string[];
  predictionSignals?: string[];
  complexitySignals?: string[];
  driftSignals?: string[];
  learningSignals?: string[];
  timestamp: number;
  authStatus: AuthStatus;
  governanceStatus: GovernanceStatus;
  targetWorkspaceId?: string;
  targetProjectId?: string;
}

export interface TrustFactorScore {
  factorId: string;
  factorType: TrustFactorType;
  factorScore: number;
  factorWeight: number;
  factorReason: string;
  sourceSignalCount: number;
}

export interface TrustConfirmation {
  trustAggregationOnly: true;
  noExecutionPerformed: true;
  noCommandsExecuted: true;
  noFilesModified: true;
  noCodeGenerated: true;
  noDeploymentPerformed: true;
  noAutoFixPerformed: true;
  noVerificationSystemReplaced: true;
  noEvidenceLedgerReplaced: true;
  noGovernanceSystemReplaced: true;
  noOwnershipRegistryModified: true;
}

export interface TrustAssessmentResult {
  trustScoreId: string;
  trustAssessmentId: string;
  workspaceId: string;
  projectId: string;
  assessmentSource: TrustAssessmentSource;
  assessmentTarget: TrustAssessmentTarget;
  targetId: string;
  trustScore: number;
  trustLevel: TrustLevel;
  trustRiskLevel: TrustRiskLevel;
  trustReasons: string[];
  trustWarnings: string[];
  trustRecommendations: string[];
  factorScores: TrustFactorScore[];
  governanceGates: GateRecord[];
  ownershipGates: GateRecord[];
  securityWarnings: string[];
  confirmation: TrustConfirmation;
  trustState: TrustState;
  stateSequence: TrustState[];
  sourceSystems: string[];
  createdAt: number;
}

export interface TrustEngineReportOutput {
  reportId: string;
  trustScoreId: string;
  trustAssessmentId: string;
  workspaceId: string;
  projectId: string;
  assessmentSource: TrustAssessmentSource;
  assessmentTarget: TrustAssessmentTarget;
  targetId: string;
  trustScore: number;
  trustLevel: TrustLevel;
  trustRiskLevel: TrustRiskLevel;
  factorCount: number;
  warningCount: number;
  recommendationCount: number;
  governanceGateCount: number;
  ownershipGateCount: number;
  securityWarningCount: number;
  confirmation: TrustConfirmation;
}

export interface TrustEngineReport {
  ownerModule: string;
  reportId: string;
  trustScoreId: string;
  trustAssessmentId: string;
  workspaceId: string;
  projectId: string;
  assessmentSource: TrustAssessmentSource;
  assessmentTarget: TrustAssessmentTarget;
  targetId: string;
  trustScore: number;
  trustLevel: TrustLevel;
  trustRiskLevel: TrustRiskLevel;
  factorCount: number;
  warningCount: number;
  recommendationCount: number;
  governanceGateCount: number;
  ownershipGateCount: number;
  securityWarningCount: number;
  confirmation: TrustConfirmation;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface TrustEngineExpansionState {
  foundationId: string;
  assessmentCount: number;
  warnings: string[];
  errors: string[];
}

export const TRUST_ENGINE_EXPANSION_OWNER_MODULE = 'devpulse_v2_trust_engine_expansion';
export const TRUST_ENGINE_EXPANSION_PASS_TOKEN = 'DEVPULSE_V2_TRUST_ENGINE_EXPANSION_FOUNDATION_V1_PASS';

export const TRUST_STATE_SEQUENCE: readonly TrustState[] = [
  'TRUST_ASSESSMENT_RECEIVED',
  'TRUST_CONTEXT_VALIDATED',
  'TRUST_SIGNALS_EVALUATED',
  'TRUST_FACTORS_SCORED',
  'TRUST_SCORE_CREATED',
  'TRUST_WARNINGS_CREATED',
  'TRUST_RECOMMENDATIONS_CREATED',
  'TRUST_REPORT_READY',
] as const;

export const KNOWN_ASSESSMENT_SOURCES: readonly TrustAssessmentSource[] = [
  'PROJECT_COMPLETION',
  'VERIFICATION_RESULT',
  'MOBILE_APPROVAL',
  'WORLD2_COMPLETION',
  'CONTROLLED_EXECUTION',
  'EXPERIENCE_LAYER',
  'SELF_EVOLUTION',
  'FOUNDER_REVIEW',
] as const;

export const KNOWN_ASSESSMENT_TARGETS: readonly TrustAssessmentTarget[] = [
  'PROJECT',
  'PLAN',
  'SIMULATION',
  'BUILDER_PACKET',
  'COMPLETION_RESULT',
  'APPROVAL_DECISION',
  'MOBILE_COMMAND',
  'SELF_EVOLUTION_RECOMMENDATION',
] as const;

export const KNOWN_TRUST_FACTORS: readonly TrustFactorType[] = [
  'EVIDENCE_QUALITY',
  'VERIFICATION_STRENGTH',
  'COMPLETION_CONFIDENCE',
  'REALITY_ALIGNMENT',
  'GOVERNANCE_ALIGNMENT',
  'PREDICTION_RISK',
  'COMPLEXITY_RISK',
  'DRIFT_RISK',
  'LEARNING_SUPPORT',
  'CAPABILITY_COVERAGE',
] as const;

export const POSITIVE_TRUST_FACTORS: readonly TrustFactorType[] = [
  'EVIDENCE_QUALITY',
  'VERIFICATION_STRENGTH',
  'COMPLETION_CONFIDENCE',
  'REALITY_ALIGNMENT',
  'GOVERNANCE_ALIGNMENT',
  'LEARNING_SUPPORT',
  'CAPABILITY_COVERAGE',
] as const;

export const RISK_TRUST_FACTORS: readonly TrustFactorType[] = [
  'PREDICTION_RISK',
  'COMPLEXITY_RISK',
  'DRIFT_RISK',
] as const;

export const TRUST_FACTOR_WEIGHTS: Record<TrustFactorType, number> = {
  EVIDENCE_QUALITY: 0.15,
  VERIFICATION_STRENGTH: 0.15,
  COMPLETION_CONFIDENCE: 0.12,
  REALITY_ALIGNMENT: 0.12,
  GOVERNANCE_ALIGNMENT: 0.12,
  PREDICTION_RISK: 0.1,
  COMPLEXITY_RISK: 0.08,
  DRIFT_RISK: 0.08,
  LEARNING_SUPPORT: 0.04,
  CAPABILITY_COVERAGE: 0.04,
};

export const TRUST_LEVEL_THRESHOLDS: readonly { min: number; level: TrustLevel }[] = [
  { min: 85, level: 'VERY_HIGH' },
  { min: 65, level: 'HIGH' },
  { min: 40, level: 'MEDIUM' },
  { min: 20, level: 'LOW' },
  { min: 0, level: 'VERY_LOW' },
];

export const SIGNAL_PATTERNS: Array<{ factorType: TrustFactorType; patterns: string[]; sourceSystem?: string }> = [
  { factorType: 'EVIDENCE_QUALITY', patterns: ['evidence', 'ledger', 'evidence_registry'], sourceSystem: 'execution_evidence_ledger' },
  { factorType: 'VERIFICATION_STRENGTH', patterns: ['verification', 'gated apply', 'verification_gated'], sourceSystem: 'verification_gated_apply' },
  { factorType: 'COMPLETION_CONFIDENCE', patterns: ['completion', 'complete', 'completion_verifier'], sourceSystem: 'world2_completion_verifier' },
  { factorType: 'REALITY_ALIGNMENT', patterns: ['reality', 'reality_validation', 'reality alignment'], sourceSystem: 'execution_reality_validation' },
  { factorType: 'GOVERNANCE_ALIGNMENT', patterns: ['governance', 'approval', 'founder_approval'], sourceSystem: 'founder_approval_execution_gate' },
  { factorType: 'PREDICTION_RISK', patterns: ['prediction', 'future_problem', 'forecast risk'], sourceSystem: 'future_problem_prediction' },
  { factorType: 'COMPLEXITY_RISK', patterns: ['complexity', 'complexity_score'], sourceSystem: 'complexity_score_foundation' },
  { factorType: 'DRIFT_RISK', patterns: ['drift', 'architecture_drift'], sourceSystem: 'architecture_drift_detection' },
  { factorType: 'LEARNING_SUPPORT', patterns: ['learning', 'self_learning', 'lesson'], sourceSystem: 'self_learning_engine' },
  { factorType: 'CAPABILITY_COVERAGE', patterns: ['capability', 'missing_capability', 'safe_capability'], sourceSystem: 'missing_capability_detector' },
];

export const DEPENDENCY_SYSTEMS = [
  'experience_layer_foundation',
  'world2_completion_verifier',
  'execution_evidence_ledger',
  'execution_reality_validation',
  'verification_gated_apply',
  'future_problem_prediction',
  'complexity_score_foundation',
  'architecture_drift_detection',
  'self_learning_engine',
  'missing_capability_detector',
  'safe_capability_acquisition',
  'controlled_execution_bridge',
  'mobile_approval_flow_foundation',
  'execution_authority',
  'founder_approval_execution_gate',
] as const;

export const DUPLICATE_PATTERNS = [
  'trust_engine_expansion',
  'unified_trust_score',
  'trust_score_engine',
  'trust_report_engine',
  'verification_trust_engine',
  'evidence_trust_engine',
] as const;

export const EXECUTION_BLOCKED_PATTERNS = ['execute', 'run command', 'self execute'] as const;
export const CODE_GEN_BLOCKED_PATTERNS = ['generate code', 'write code'] as const;
export const FILE_MOD_BLOCKED_PATTERNS = ['modify file', 'write file', 'delete file'] as const;
export const DEPLOY_BLOCKED_PATTERNS = ['deploy', 'deployment'] as const;
export const AUTO_FIX_BLOCKED_PATTERNS = ['auto-fix', 'auto fix', 'autofix'] as const;
export const GOVERNANCE_MUTATION_BLOCKED_PATTERNS = ['mutate governance', 'modify governance'] as const;
export const REGISTRY_MUTATION_BLOCKED_PATTERNS = ['update ownership registry', 'mutate registry'] as const;
export const REPLACEMENT_BLOCKED_PATTERNS = [
  'replace verification',
  'replace evidence ledger',
  'replace governance',
  'replace completion verifier',
] as const;

let trustAssessmentCounter = 0;
let trustScoreCounter = 0;
let factorCounter = 0;

export function nextTrustAssessmentId(): string {
  trustAssessmentCounter += 1;
  return `trust-assess-${trustAssessmentCounter.toString().padStart(4, '0')}`;
}

export function nextTrustScoreId(): string {
  trustScoreCounter += 1;
  return `trust-score-${trustScoreCounter.toString().padStart(4, '0')}`;
}

export function nextFactorId(): string {
  factorCounter += 1;
  return `trust-factor-${factorCounter.toString().padStart(4, '0')}`;
}

export function resetTrustCountersForTests(): void {
  trustAssessmentCounter = 0;
  trustScoreCounter = 0;
  factorCounter = 0;
}
