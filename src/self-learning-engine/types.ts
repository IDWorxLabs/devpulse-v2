/** DevPulse V2 Phase 9.3 Self-Learning Engine Foundation — types. */

export type LearningSourceSystem =
  | 'WORLD2_LEARNING_LOOP'
  | 'MISSING_CAPABILITY_DETECTOR'
  | 'SAFE_CAPABILITY_ACQUISITION'
  | 'COMPLETION_VERIFIER'
  | 'SIMULATION_RUNTIME'
  | 'CONTROLLED_EXECUTION_BRIDGE'
  | 'MOBILE_COMMAND'
  | 'MOBILE_CHAT'
  | 'MOBILE_LIVE_PREVIEW'
  | 'MOBILE_APPROVAL_FLOW'
  | 'CROSS_DEVICE_CONTINUITY'
  | 'GOVERNANCE_STACK'
  | 'UNKNOWN';

export type LearningEventType =
  | 'SUCCESS_OUTCOME'
  | 'FAILURE_OUTCOME'
  | 'WARNING_OUTCOME'
  | 'CAPABILITY_GAP_FOUND'
  | 'CAPABILITY_ACQUISITION_PLANNED'
  | 'VERIFICATION_PASSED'
  | 'VERIFICATION_FAILED'
  | 'SIMULATION_PASSED'
  | 'SIMULATION_FAILED'
  | 'APPROVAL_APPROVED'
  | 'APPROVAL_REJECTED'
  | 'APPROVAL_DEFERRED'
  | 'MOBILE_COMMAND_SUCCESS'
  | 'MOBILE_COMMAND_BLOCKED'
  | 'ARCHITECTURE_PATTERN_FOUND'
  | 'GOVERNANCE_PATTERN_FOUND'
  | 'UNKNOWN';

export type LearningCategory =
  | 'SUCCESS_PATTERN'
  | 'FAILURE_PATTERN'
  | 'WARNING_PATTERN'
  | 'CAPABILITY_PATTERN'
  | 'ACQUISITION_PATTERN'
  | 'GOVERNANCE_PATTERN'
  | 'MOBILE_PATTERN'
  | 'ARCHITECTURE_PATTERN'
  | 'VERIFICATION_PATTERN'
  | 'APPROVAL_PATTERN'
  | 'SIMULATION_PATTERN'
  | 'UNKNOWN';

export type SelfLearningState =
  | 'LEARNING_EVENT_RECEIVED'
  | 'SOURCE_VALIDATED'
  | 'EVIDENCE_EVALUATED'
  | 'EVENT_CLASSIFIED'
  | 'PATTERNS_EXTRACTED'
  | 'LESSON_GENERATED'
  | 'FUTURE_GUIDANCE_CREATED'
  | 'LEARNING_RECORD_READY'
  | 'LEARNING_BLOCKED';

export type LearningConfidence = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export type GuidanceType =
  | 'RECOMMENDATION'
  | 'WARNING'
  | 'BEST_PRACTICE'
  | 'AVOIDANCE_RULE'
  | 'CHECKPOINT_SUGGESTION'
  | 'CAPABILITY_SUGGESTION'
  | 'GOVERNANCE_SUGGESTION';

export type GuidanceStatus = 'DRAFT' | 'READY' | 'BLOCKED';

export type GovernanceStatus = 'PASS' | 'FAIL' | 'PENDING' | 'UNKNOWN';

export type AuthStatus = 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'PENDING' | 'UNKNOWN';

export interface GateRecord {
  gateId: string;
  gateType: string;
  status: 'OPEN' | 'CLOSED' | 'REQUIRED';
  description: string;
}

export interface LearningEventInput {
  learningEventId?: string;
  workspaceId: string;
  projectId: string;
  sourceSystem: LearningSourceSystem;
  sourceId: string;
  eventType: LearningEventType;
  eventSummary: string;
  eventOutcome?: string;
  evidenceRefs?: string[];
  capabilityGapId?: string;
  acquisitionPlanId?: string;
  verificationId?: string;
  simulationId?: string;
  approvalRequestId?: string;
  mobileSessionId?: string;
  cloudSessionId?: string;
  confidenceInput?: LearningConfidence;
  timestamp: number;
  authStatus: AuthStatus;
  governanceStatus: GovernanceStatus;
  targetWorkspaceId?: string;
  targetProjectId?: string;
}

export interface ExtractedPattern {
  patternId: string;
  patternKey: string;
  category: LearningCategory;
  description: string;
  sourceSystem: LearningSourceSystem;
}

export interface FutureGuidance {
  guidanceId: string;
  learningEventId: string;
  guidanceType: GuidanceType;
  guidanceSummary: string;
  appliesToSystems: string[];
  confidenceScore: LearningConfidence;
  requiresHumanReview: boolean;
  status: GuidanceStatus;
}

export interface LearningRecord {
  recordId: string;
  learningEventId: string;
  sourceSystem: LearningSourceSystem;
  eventType: LearningEventType;
  learningCategory: LearningCategory;
  lessonSummary: string;
  evidenceRefs: string[];
  confidenceScore: LearningConfidence;
  futureGuidance: FutureGuidance[];
  reusablePatternKey: string;
  createdAt: number;
}

export interface SelfLearningConfirmation {
  selfLearningFoundationOnly: true;
  noExecutionPerformed: true;
  noCommandsExecuted: true;
  noFilesModified: true;
  noCodeGenerated: true;
  noDeploymentPerformed: true;
  noModelTrainingPerformed: true;
  noAutomaticBehaviorChangePerformed: true;
}

export interface SelfLearningResult {
  selfLearningRecordId: string;
  learningEventId: string;
  workspaceId: string;
  projectId: string;
  sourceSystem: LearningSourceSystem;
  sourceId: string;
  eventType: LearningEventType;
  learningCategory: LearningCategory;
  learningState: SelfLearningState;
  lessonSummary: string;
  lessonEvidence: string[];
  extractedPatterns: ExtractedPattern[];
  futureGuidance: FutureGuidance[];
  confidenceScore: LearningConfidence;
  governanceGates: GateRecord[];
  ownershipGates: GateRecord[];
  securityWarnings: string[];
  recommendations: string[];
  confirmation: SelfLearningConfirmation;
  learningRecord: LearningRecord;
  stateSequence: SelfLearningState[];
  createdAt: number;
}

export interface SelfLearningReportOutput {
  selfLearningRecordId: string;
  learningEventId: string;
  workspaceId: string;
  projectId: string;
  sourceSystem: LearningSourceSystem;
  sourceId: string;
  eventType: LearningEventType;
  learningCategory: LearningCategory;
  learningState: SelfLearningState;
  confidenceScore: LearningConfidence;
  extractedPatternCount: number;
  futureGuidanceCount: number;
  governanceGateCount: number;
  ownershipGateCount: number;
  securityWarningCount: number;
  recommendationCount: number;
  confirmation: SelfLearningConfirmation;
}

export interface SelfLearningReport {
  ownerModule: string;
  reportId: string;
  selfLearningRecordId: string;
  learningEventId: string;
  workspaceId: string;
  projectId: string;
  sourceSystem: LearningSourceSystem;
  sourceId: string;
  eventType: LearningEventType;
  learningCategory: LearningCategory;
  learningState: SelfLearningState;
  confidenceScore: LearningConfidence;
  extractedPatternCount: number;
  futureGuidanceCount: number;
  governanceGateCount: number;
  ownershipGateCount: number;
  securityWarningCount: number;
  recommendationCount: number;
  confirmation: SelfLearningConfirmation;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface SelfLearningEngineState {
  foundationId: string;
  learningRecordCount: number;
  warnings: string[];
  errors: string[];
}

export const SELF_LEARNING_ENGINE_OWNER_MODULE = 'devpulse_v2_self_learning_engine';
export const SELF_LEARNING_ENGINE_PASS_TOKEN =
  'DEVPULSE_V2_SELF_LEARNING_ENGINE_FOUNDATION_V1_PASS';

export const LEARNING_STATE_SEQUENCE: readonly SelfLearningState[] = [
  'LEARNING_EVENT_RECEIVED',
  'SOURCE_VALIDATED',
  'EVIDENCE_EVALUATED',
  'EVENT_CLASSIFIED',
  'PATTERNS_EXTRACTED',
  'LESSON_GENERATED',
  'FUTURE_GUIDANCE_CREATED',
  'LEARNING_RECORD_READY',
] as const;

export const KNOWN_SOURCE_SYSTEMS: readonly LearningSourceSystem[] = [
  'WORLD2_LEARNING_LOOP',
  'MISSING_CAPABILITY_DETECTOR',
  'SAFE_CAPABILITY_ACQUISITION',
  'COMPLETION_VERIFIER',
  'SIMULATION_RUNTIME',
  'CONTROLLED_EXECUTION_BRIDGE',
  'MOBILE_COMMAND',
  'MOBILE_CHAT',
  'MOBILE_LIVE_PREVIEW',
  'MOBILE_APPROVAL_FLOW',
  'CROSS_DEVICE_CONTINUITY',
  'GOVERNANCE_STACK',
] as const;

export const KNOWN_EVENT_TYPES: readonly LearningEventType[] = [
  'SUCCESS_OUTCOME',
  'FAILURE_OUTCOME',
  'WARNING_OUTCOME',
  'CAPABILITY_GAP_FOUND',
  'CAPABILITY_ACQUISITION_PLANNED',
  'VERIFICATION_PASSED',
  'VERIFICATION_FAILED',
  'SIMULATION_PASSED',
  'SIMULATION_FAILED',
  'APPROVAL_APPROVED',
  'APPROVAL_REJECTED',
  'APPROVAL_DEFERRED',
  'MOBILE_COMMAND_SUCCESS',
  'MOBILE_COMMAND_BLOCKED',
  'ARCHITECTURE_PATTERN_FOUND',
  'GOVERNANCE_PATTERN_FOUND',
] as const;

export const KNOWN_LEARNING_CATEGORIES: readonly LearningCategory[] = [
  'SUCCESS_PATTERN',
  'FAILURE_PATTERN',
  'WARNING_PATTERN',
  'CAPABILITY_PATTERN',
  'ACQUISITION_PATTERN',
  'GOVERNANCE_PATTERN',
  'MOBILE_PATTERN',
  'ARCHITECTURE_PATTERN',
  'VERIFICATION_PATTERN',
  'APPROVAL_PATTERN',
  'SIMULATION_PATTERN',
] as const;

export const LEARNING_CONFIDENCE_LEVELS: readonly LearningConfidence[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'VERY_HIGH',
] as const;

export const GUIDANCE_TYPES: readonly GuidanceType[] = [
  'RECOMMENDATION',
  'WARNING',
  'BEST_PRACTICE',
  'AVOIDANCE_RULE',
  'CHECKPOINT_SUGGESTION',
  'CAPABILITY_SUGGESTION',
  'GOVERNANCE_SUGGESTION',
] as const;

export const EVENT_TYPE_TO_CATEGORY: Record<LearningEventType, LearningCategory> = {
  SUCCESS_OUTCOME: 'SUCCESS_PATTERN',
  FAILURE_OUTCOME: 'FAILURE_PATTERN',
  WARNING_OUTCOME: 'WARNING_PATTERN',
  CAPABILITY_GAP_FOUND: 'CAPABILITY_PATTERN',
  CAPABILITY_ACQUISITION_PLANNED: 'ACQUISITION_PATTERN',
  VERIFICATION_PASSED: 'VERIFICATION_PATTERN',
  VERIFICATION_FAILED: 'VERIFICATION_PATTERN',
  SIMULATION_PASSED: 'SIMULATION_PATTERN',
  SIMULATION_FAILED: 'SIMULATION_PATTERN',
  APPROVAL_APPROVED: 'APPROVAL_PATTERN',
  APPROVAL_REJECTED: 'APPROVAL_PATTERN',
  APPROVAL_DEFERRED: 'APPROVAL_PATTERN',
  MOBILE_COMMAND_SUCCESS: 'MOBILE_PATTERN',
  MOBILE_COMMAND_BLOCKED: 'MOBILE_PATTERN',
  ARCHITECTURE_PATTERN_FOUND: 'ARCHITECTURE_PATTERN',
  GOVERNANCE_PATTERN_FOUND: 'GOVERNANCE_PATTERN',
  UNKNOWN: 'UNKNOWN',
};

export const EXECUTION_BLOCKED_PATTERNS = ['execute', 'run command', 'self execute'] as const;
export const CODE_GEN_BLOCKED_PATTERNS = ['generate code', 'write code'] as const;
export const FILE_MOD_BLOCKED_PATTERNS = ['modify file', 'write file', 'delete file'] as const;
export const DEPLOY_BLOCKED_PATTERNS = ['deploy', 'publish'] as const;
export const MODEL_TRAINING_BLOCKED_PATTERNS = ['train model', 'model training', 'online learning'] as const;
export const AUTO_BEHAVIOR_BLOCKED_PATTERNS = ['auto-change behavior', 'automatic behavior change', 'auto-apply'] as const;
export const REGISTRY_MUTATION_BLOCKED_PATTERNS = ['update ownership registry', 'mutate registry', 'change ownership registry'] as const;
export const GOVERNANCE_MUTATION_BLOCKED_PATTERNS = ['mutate governance', 'modify governance'] as const;

export const DEPENDENCY_SYSTEMS = [
  'world2_learning_loop',
  'missing_capability_detector',
  'safe_capability_acquisition',
  'world2_completion_verifier',
  'world2_simulation_runtime',
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
  'self_learning_engine',
  'self learning engine',
  'learning engine',
  'self evolution learning',
  'adaptive learning',
  'reusable learning records',
  'future guidance engine',
] as const;

let learningEventCounter = 0;
let recordCounter = 0;
let patternCounter = 0;
let guidanceCounter = 0;

export function nextLearningEventId(): string {
  learningEventCounter += 1;
  return `learn-evt-${learningEventCounter.toString().padStart(4, '0')}`;
}

export function nextSelfLearningRecordId(): string {
  recordCounter += 1;
  return `learn-rec-${recordCounter.toString().padStart(4, '0')}`;
}

export function nextPatternId(): string {
  patternCounter += 1;
  return `pattern-${patternCounter.toString().padStart(4, '0')}`;
}

export function nextGuidanceId(): string {
  guidanceCounter += 1;
  return `guidance-${guidanceCounter.toString().padStart(4, '0')}`;
}

export function resetLearningCountersForTests(): void {
  learningEventCounter = 0;
  recordCounter = 0;
  patternCounter = 0;
  guidanceCounter = 0;
}
