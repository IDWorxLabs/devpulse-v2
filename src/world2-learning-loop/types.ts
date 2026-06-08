/** DevPulse V2 World 2 Learning Loop Foundation — types. */

import type { CompletionConfidence, CompletionStatus } from '../world2-completion-verifier/types.js';
import type {
  EvidenceResult,
  GovernanceResult,
  IntegrityResult,
  RiskControlResult,
  RollbackResult,
  VerificationResultItem,
} from '../world2-completion-verifier/types.js';

export type LearningState =
  | 'LEARNING_REQUEST_RECEIVED'
  | 'OWNERSHIP_VALIDATED'
  | 'PROJECT_DATA_ANALYZED'
  | 'SUCCESS_PATTERNS_IDENTIFIED'
  | 'FAILURE_PATTERNS_IDENTIFIED'
  | 'WARNING_PATTERNS_IDENTIFIED'
  | 'RECOMMENDATIONS_CREATED'
  | 'LESSONS_COMPILED'
  | 'LEARNING_READY';

export type LearningConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface LearnedPattern {
  patternId: string;
  patternType: string;
  description: string;
  source: string;
}

export interface LearningInput {
  workspaceId: string;
  projectId: string;
  planId: string;
  simulationId: string;
  builderId: string;
  verificationId: string;
  completionStatus: CompletionStatus;
  completionConfidence: CompletionConfidence;
  verificationResults: VerificationResultItem[];
  riskControlResults: RiskControlResult[];
  rollbackResults: RollbackResult[];
  workspaceIntegrityResults: IntegrityResult[];
  governanceResults: GovernanceResult[];
  evidenceResults: EvidenceResult[];
  recommendations: string[];
  outcomes: string[];
  observations: string[];
  warnings: string[];
}

export interface LearningConfirmation {
  learningOnlyFoundation: true;
  noExecutionPerformed: true;
  noFilesModified: true;
  noCodeGenerated: true;
}

export interface LearningResult {
  learningId: string;
  workspaceId: string;
  projectId: string;
  planId: string;
  simulationId: string;
  builderId: string;
  verificationId: string;
  lessonCount: number;
  successPatterns: LearnedPattern[];
  failurePatterns: LearnedPattern[];
  warningPatterns: LearnedPattern[];
  recommendationPatterns: LearnedPattern[];
  verificationPatterns: LearnedPattern[];
  riskPatterns: LearnedPattern[];
  rollbackPatterns: LearnedPattern[];
  governancePatterns: LearnedPattern[];
  workspacePatterns: LearnedPattern[];
  futureRecommendations: string[];
  learningConfidence: LearningConfidence;
  confirmation: LearningConfirmation;
  stateSequence: LearningState[];
  createdAt: number;
}

export interface World2LearningLoopState {
  loopId: string;
  learningCount: number;
  warnings: string[];
  errors: string[];
}

export interface World2LearningReport {
  ownerModule: string;
  learningId: string;
  workspaceId: string;
  projectId: string;
  planId: string;
  lessonCount: number;
  successPatternCount: number;
  failurePatternCount: number;
  warningPatternCount: number;
  recommendationPatternCount: number;
  verificationPatternCount: number;
  riskPatternCount: number;
  rollbackPatternCount: number;
  governancePatternCount: number;
  workspacePatternCount: number;
  futureRecommendationCount: number;
  learningConfidence: LearningConfidence;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const WORLD2_LEARNING_LOOP_OWNER_MODULE = 'devpulse_v2_world2_learning_loop';
export const WORLD2_LEARNING_LOOP_PASS_TOKEN =
  'DEVPULSE_V2_WORLD2_LEARNING_LOOP_FOUNDATION_V1_PASS';

export const LEARNING_STATE_SEQUENCE: readonly LearningState[] = [
  'LEARNING_REQUEST_RECEIVED',
  'OWNERSHIP_VALIDATED',
  'PROJECT_DATA_ANALYZED',
  'SUCCESS_PATTERNS_IDENTIFIED',
  'FAILURE_PATTERNS_IDENTIFIED',
  'WARNING_PATTERNS_IDENTIFIED',
  'RECOMMENDATIONS_CREATED',
  'LESSONS_COMPILED',
  'LEARNING_READY',
] as const;

export const DEPENDENCY_SYSTEMS = [
  'world2_workspace_foundation',
  'world2_execution_planner',
  'world2_simulation_runtime',
  'world2_autonomous_builder',
  'world2_completion_verifier',
  'execution_evidence_ledger',
  'verification_gated_apply',
] as const;

export const DUPLICATE_PATTERNS = [
  'world2_learning_loop',
  'learning_loop',
  'project_learning',
  'world2_memory',
  'lessons_learned',
  'adaptive_intelligence',
  'project_intelligence_memory',
] as const;

export const WORLD1_PROTECTED_DOMAINS = [
  'law_enforcement',
  'foundation_enforcement',
  'execution_authority',
  'execution_reality_validation',
  'execution_evidence_ledger',
  'recovery_chains',
  'verification_gated_apply',
] as const;

export const LEARNING_CONFIDENCE_LEVELS: readonly LearningConfidence[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
] as const;
