/** DevPulse V2 Phase 11.1+ Unified Command Center Brain — types. */

import type { CrossSystemAwarenessSnapshot } from './cross-system-awareness/relationship-types.js';
import type { SharedMemoryContext } from '../shared-memory/shared-memory-types.js';
import type { ProjectUnderstandingContext, ProjectUnderstandingDiagnostics } from '../project-understanding/project-understanding-types.js';
import type {
  GeneralQuestionRoutingDiagnostics,
  QuestionRoutingPlan,
} from './general-question-understanding/general-question-types.js';
import type { TimelineIntelligenceDiagnostics } from '../timeline-intelligence/timeline-types.js';
import type { UnifiedDecisionLayerDiagnostics } from '../unified-decision-layer/decision-types.js';
import type { ProjectVaultIntelligenceDiagnostics } from '../project-vault-intelligence/project-vault-intelligence-types.js';
import type { DependencyIntelligenceDiagnostics } from '../dependency-intelligence/dependency-intelligence-types.js';
import type { WorkspaceIntelligenceDiagnostics } from '../workspace-intelligence/workspace-intelligence-types.js';
import type { ProjectHistoryIntelligenceDiagnostics } from '../project-history-intelligence/project-history-intelligence-types.js';
import type { ProjectSummarizationDiagnostics } from '../project-summarization-engine/project-summarization-types.js';
import type { PortfolioIntelligenceDiagnostics } from '../portfolio-intelligence/portfolio-intelligence-types.js';
import type {
  OperatorFeedDiagnostics,
  OperatorFeedTimeline,
} from '../operator-feed/operator-feed-types.js';
import type {
  ActionVisibilityDiagnostics,
  ActionVisibilityRecord,
} from '../action-visibility-engine/action-visibility-types.js';
import type {
  ReasoningVisibilityDiagnostics,
  ReasoningVisibilityRecord,
} from '../reasoning-visibility-engine/reasoning-visibility-types.js';
import type {
  ProgressIntelligenceDiagnostics,
  ProgressRecord,
} from '../progress-intelligence/progress-intelligence-types.js';
import type {
  FailureVisibilityDiagnostics,
  FailureRecord,
} from '../failure-visibility-engine/failure-visibility-types.js';
import type {
  LearningVisibilityDiagnostics,
  LearningRecord,
} from '../learning-visibility-engine/learning-visibility-types.js';
import type {
  ExecutionRuntimeDiagnostics,
  ExecutionPacket,
} from '../execution-runtime/execution-runtime-types.js';
import type {
  BuildTaskRuntimeDiagnostics,
  BuildTaskPlan,
} from '../build-task-runtime/build-task-runtime-types.js';
import type {
  CodeGenerationRuntimeDiagnostics,
  CodeGenerationPlan,
} from '../code-generation-runtime/code-generation-runtime-types.js';
import type {
  TestingRuntimeDiagnostics,
  TestingPlan,
} from '../testing-runtime/testing-runtime-types.js';
import type {
  AutoFixRuntimeDiagnostics,
  AutoFixPlan,
} from '../auto-fix-runtime/auto-fix-runtime-types.js';
import type {
  RuntimeVerificationDiagnostics,
  RuntimeVerificationReport,
} from '../runtime-verification-layer/runtime-verification-types.js';

export type { CrossSystemAwarenessSnapshot };
export type { SharedMemoryContext };
export type { ProjectUnderstandingContext, ProjectUnderstandingDiagnostics };
export type { GeneralQuestionRoutingDiagnostics, QuestionRoutingPlan };
export type { TimelineIntelligenceDiagnostics };
export type { UnifiedDecisionLayerDiagnostics };
export type { ProjectVaultIntelligenceDiagnostics };
export type { DependencyIntelligenceDiagnostics };
export type { WorkspaceIntelligenceDiagnostics };
export type { ProjectHistoryIntelligenceDiagnostics };
export type { ProjectSummarizationDiagnostics };
export type { PortfolioIntelligenceDiagnostics };
export type { OperatorFeedTimeline, OperatorFeedDiagnostics };
export type { ActionVisibilityDiagnostics, ActionVisibilityRecord };
export type { ReasoningVisibilityDiagnostics, ReasoningVisibilityRecord };

export type BrainRequestCategory =
  | 'ROADMAP'
  | 'SYSTEM'
  | 'PROJECT'
  | 'ARCHITECTURE'
  | 'RISK'
  | 'STATUS'
  | 'DEPENDENCY'
  | 'IMPACT'
  | 'RELATIONSHIP'
  | 'MEMORY'
  | 'PROJECT_UNDERSTANDING'
  | 'GENERAL';

export type BrainPipelineStage =
  | 'BRAIN_REQUEST_RECEIVED'
  | 'REQUEST_CLASSIFIED'
  | 'SYSTEM_AWARENESS_CHECKED'
  | 'CROSS_SYSTEM_AWARENESS_CHECKED'
  | 'SHARED_MEMORY_CHECKED'
  | 'PROJECT_UNDERSTANDING_CHECKED'
  | 'GENERAL_QUESTION_UNDERSTANDING_CHECKED'
  | 'ROADMAP_AWARENESS_CHECKED'
  | 'RESPONSE_GENERATED'
  | 'BRAIN_RESPONSE_READY'
  | 'BRAIN_REQUEST_BLOCKED';

export type OperatorFeedEventType =
  | 'Classifying Request'
  | 'Loading Memory'
  | 'Searching Memory'
  | 'Memory Context Ready'
  | 'Understanding Project'
  | 'Gathering Facts'
  | 'Evaluating Risks'
  | 'Analyzing Dependencies'
  | 'Generating Conclusions'
  | 'Loading Project Context'
  | 'Analyzing Project Status'
  | 'Checking Project Gaps'
  | 'Checking Project Risks'
  | 'Project Recommendation Ready'
  | 'Checking Systems'
  | 'Checking Roadmap'
  | 'Loading Relationships'
  | 'Checking Dependencies'
  | 'Performing Impact Analysis'
  | 'Generating Response'
  | 'Response Ready'
  | 'Understanding Question'
  | 'Detecting Context Needs'
  | 'Selecting Reasoning Mode'
  | 'Selecting Capabilities'
  | 'Gathering Relevant Facts'
  | 'Composing Answer'
  | 'Loading Timeline Context'
  | 'Analyzing Timeline'
  | 'Checking Milestones'
  | 'Checking Blockers'
  | 'Generating Timeline Conclusions'
  | 'Loading Decision Context'
  | 'Evaluating Options'
  | 'Checking Risks'
  | 'Ranking Priorities'
  | 'Generating Recommendation';

export interface BrainRequestInput {
  message: string;
  timestamp?: number;
}

export interface BrainClassification {
  category: BrainRequestCategory;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  matchedSignals: string[];
  reason: string;
}

export interface BrainSystemRecord {
  systemId: string;
  displayName: string;
  phase: number | string;
  purpose: string;
  status: 'FOUNDATION_COMPLETE' | 'RUNTIME_NOT_CONNECTED' | 'SHELL_ONLY';
  ownerModule: string;
}

export interface BrainRoadmapContext {
  currentPhase: string;
  completedPhases: string[];
  nextPhase: string;
  nextPhaseDescription: string;
  recommendedNextStep: string;
  stackMaturitySummary: string;
}

export type OperatorFeedCardStatus = 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';

export interface OperatorFeedEvent {
  eventId: string;
  eventType: OperatorFeedEventType;
  timestamp: number;
  informationalOnly: true;
  section?: string;
  action?: string;
  detail?: string;
  status?: OperatorFeedCardStatus;
  stepIndex?: number;
  stepTotal?: number;
  evidence?: string;
}

export interface BrainConfirmation {
  intelligenceOnly: true;
  noExecutionPerformed: true;
  noCommandsExecuted: true;
  noFilesModified: true;
  noCodeGenerated: true;
  noDeploymentPerformed: true;
  noAutoFixPerformed: true;
  noRuntimeMutation: true;
  noExternalAiCalls: boolean;
  noPersistence: true;
  noSystemReplacement: true;
}

export interface BrainResponseResult {
  responseId: string;
  userMessage: string;
  brainResponse: string;
  category: BrainRequestCategory;
  classification: BrainClassification;
  systemsReferenced: string[];
  roadmapContext: BrainRoadmapContext;
  crossSystemContext?: CrossSystemAwarenessSnapshot;
  crossSystemDiagnostics?: CrossSystemDiagnostics;
  crossSystemRoutingReport?: CrossSystemRoutingReport;
  sharedMemoryContext?: SharedMemoryContext;
  projectUnderstandingContext?: ProjectUnderstandingContext;
  projectUnderstandingDiagnostics?: ProjectUnderstandingDiagnostics;
  generalQuestionRoutingPlan?: QuestionRoutingPlan;
  generalQuestionDiagnostics?: GeneralQuestionRoutingDiagnostics;
  timelineIntelligenceDiagnostics?: TimelineIntelligenceDiagnostics;
  unifiedDecisionLayerDiagnostics?: UnifiedDecisionLayerDiagnostics;
  projectVaultIntelligenceDiagnostics?: ProjectVaultIntelligenceDiagnostics;
  dependencyIntelligenceDiagnostics?: DependencyIntelligenceDiagnostics;
  workspaceIntelligenceDiagnostics?: WorkspaceIntelligenceDiagnostics;
  projectHistoryIntelligenceDiagnostics?: ProjectHistoryIntelligenceDiagnostics;
  projectSummarizationDiagnostics?: ProjectSummarizationDiagnostics;
  portfolioIntelligenceDiagnostics?: PortfolioIntelligenceDiagnostics;
  operatorFeedTimeline?: OperatorFeedTimeline;
  operatorFeedFoundationDiagnostics?: OperatorFeedDiagnostics;
  actionVisibilityDiagnostics?: ActionVisibilityDiagnostics;
  actionVisibilityRecords?: ActionVisibilityRecord[];
  reasoningVisibilityDiagnostics?: ReasoningVisibilityDiagnostics;
  reasoningVisibilityRecords?: ReasoningVisibilityRecord[];
  progressIntelligenceDiagnostics?: ProgressIntelligenceDiagnostics;
  progressRecords?: ProgressRecord[];
  failureVisibilityDiagnostics?: FailureVisibilityDiagnostics;
  failureRecords?: FailureRecord[];
  learningVisibilityDiagnostics?: LearningVisibilityDiagnostics;
  learningRecords?: LearningRecord[];
  executionRuntimeDiagnostics?: ExecutionRuntimeDiagnostics;
  executionPackets?: ExecutionPacket[];
  buildTaskRuntimeDiagnostics?: BuildTaskRuntimeDiagnostics;
  buildTaskPlans?: BuildTaskPlan[];
  codeGenerationRuntimeDiagnostics?: CodeGenerationRuntimeDiagnostics;
  codeGenerationPlans?: CodeGenerationPlan[];
  testingRuntimeDiagnostics?: TestingRuntimeDiagnostics;
  testingPlans?: TestingPlan[];
  autoFixRuntimeDiagnostics?: AutoFixRuntimeDiagnostics;
  autoFixPlans?: AutoFixPlan[];
  runtimeVerificationDiagnostics?: RuntimeVerificationDiagnostics;
  runtimeVerificationReports?: RuntimeVerificationReport[];
  world2ExecutionActivationDiagnostics?: import('../world2-execution-activation/world2-execution-activation-types.js').World2ExecutionActivationDiagnostics;
  world2ActivationPlans?: import('../world2-execution-activation/world2-execution-activation-types.js').World2ActivationPlan[];
  builderPacketExecutionDiagnostics?: import('../world2-builder-packet-execution/types.js').BuilderPacketExecutionDiagnostics;
  builderPacketExecutionPackets?: import('../world2-builder-packet-execution/types.js').BuilderPacketExecutionPacket[];
  builderPacketExecutionReports?: import('../world2-builder-packet-execution/types.js').BuilderPacketExecutionReport[];
  controlledApplyRuntimeDiagnostics?: import('../world2-controlled-apply-runtime/types.js').ControlledApplyDiagnostics;
  controlledApplyPlans?: import('../world2-controlled-apply-runtime/types.js').ControlledApplyPlan[];
  controlledApplyReports?: import('../world2-controlled-apply-runtime/types.js').ControlledApplyReport[];
  rollbackRuntimeDiagnostics?: import('../world2-rollback-runtime/types.js').RollbackDiagnostics;
  rollbackPlans?: import('../world2-rollback-runtime/types.js').RollbackPlan[];
  rollbackReports?: import('../world2-rollback-runtime/types.js').RollbackReport[];
  recoveryRuntimeDiagnostics?: import('../world2-recovery-runtime/types.js').RecoveryDiagnostics;
  recoveryPlans?: import('../world2-recovery-runtime/types.js').RecoveryPlan[];
  recoveryReports?: import('../world2-recovery-runtime/types.js').RecoveryReport[];
  completionRuntimeDiagnostics?: import('../world2-completion-runtime/types.js').CompletionDiagnostics;
  completionPlans?: import('../world2-completion-runtime/types.js').CompletionPlan[];
  completionReports?: import('../world2-completion-runtime/types.js').CompletionReport[];
  livePreviewRuntimeDiagnostics?: import('../live-preview-runtime/types.js').PreviewRuntimeDiagnostics;
  previewSessions?: import('../live-preview-runtime/types.js').PreviewSession[];
  previewRuntimeReports?: import('../live-preview-runtime/types.js').PreviewRuntimeReport[];
  previewIntelligenceDiagnostics?: import('../preview-intelligence/types.js').PreviewIntelligenceDiagnostics;
  previewIntelligenceReports?: import('../preview-intelligence/types.js').PreviewIntelligenceReport[];
  selfVisionRuntimeDiagnostics?: import('../self-vision-runtime/types.js').SelfVisionRuntimeDiagnostics;
  selfVisionSessions?: import('../self-vision-runtime/types.js').SelfVisionSession[];
  selfVisionRuntimeReports?: import('../self-vision-runtime/types.js').SelfVisionRuntimeReport[];
  uiInspectionDiagnostics?: import('../ui-inspection-engine/types.js').UiInspectionDiagnostics;
  uiInspectionReports?: import('../ui-inspection-engine/types.js').UiInspectionReport[];
  interactionTestingDiagnostics?: import('../interaction-testing-engine/types.js').InteractionTestingDiagnostics;
  interactionTestingReports?: import('../interaction-testing-engine/types.js').InteractionTestingReport[];
  visualVerificationDiagnostics?: import('../visual-verification-engine/types.js').VisualVerificationDiagnostics;
  visualVerificationReports?: import('../visual-verification-engine/types.js').VisualVerificationReport[];
  verificationRuntimeDiagnostics?: import('../unified-verification-lab/types.js').VerificationRuntimeDiagnostics;
  verificationRuntimeReports?: import('../unified-verification-lab/types.js').VerificationRuntimeReport[];
  verificationRegistryDiagnostics?: import('../verification-registry/types.js').VerificationRegistryDiagnostics;
  verificationRegistryReports?: import('../verification-registry/types.js').VerificationRegistryReport[];
  verificationOrchestratorDiagnostics?: import('../verification-orchestrator/types.js').VerificationOrchestratorDiagnostics;
  verificationOrchestratorReports?: import('../verification-orchestrator/types.js').VerificationOrchestrationReport[];
  verificationEvidenceDiagnostics?: import('../verification-evidence-engine/verification-evidence-types.js').VerificationEvidenceDiagnostics;
  verificationEvidenceReports?: import('../verification-evidence-engine/verification-evidence-types.js').EvidenceSummaryReport[];
  verificationReportingDiagnostics?: import('../verification-reporting-engine/verification-report-types.js').VerificationReportingDiagnostics;
  verificationReportingReports?: import('../verification-reporting-engine/verification-report-types.js').VerificationReport[];
  unifiedVerificationEntryDiagnostics?: import('../unified-verification-entry/unified-verification-types.js').UnifiedVerificationEntryDiagnostics;
  unifiedVerificationResponses?: import('../unified-verification-entry/unified-verification-types.js').VerificationResponse[];
  llmChatBrainDiagnostics?: import('../llm-chat-brain/llm-chat-types.js').LlmChatBrainDiagnostics;
  pipelineStages: BrainPipelineStage[];
  operatorFeedEvents: OperatorFeedEvent[];
  confirmation: BrainConfirmation;
  createdAt: number;
}

export interface CrossSystemDiagnostics {
  relationshipCount: number;
  dependencyCount: number;
  impactAnalysisAvailable: boolean;
  lastRelationshipQuery: string | null;
  lastDependencyQuery: string | null;
  lastImpactQuery: string | null;
  lastQueryType: string | null;
  lastAnalyzerUsed: string | null;
  lastRoutingResult: string | null;
}

export interface CrossSystemRoutingReport {
  classification: BrainRequestCategory;
  selectedAnalyzer: 'relationship_engine' | 'dependency_analyzer' | 'impact_analyzer' | 'none';
  analyzerExecuted: boolean;
  responseSource: 'relationship_engine' | 'dependency_analyzer' | 'impact_analyzer' | 'fallback' | 'none';
  operatorFeedStages: OperatorFeedEventType[];
  routingResult: 'routed' | 'fallback_blocked';
  timestamp: number;
}

export const COMMAND_CENTER_BRAIN_OWNER_MODULE = 'devpulse_v2_command_center_brain';
export const COMMAND_CENTER_BRAIN_PASS_TOKEN = 'DEVPULSE_V2_UNIFIED_COMMAND_CENTER_BRAIN_FOUNDATION_V1_PASS';

export const BRAIN_REQUEST_CATEGORIES: readonly BrainRequestCategory[] = [
  'ROADMAP',
  'SYSTEM',
  'PROJECT',
  'ARCHITECTURE',
  'RISK',
  'STATUS',
  'DEPENDENCY',
  'IMPACT',
  'RELATIONSHIP',
  'MEMORY',
  'PROJECT_UNDERSTANDING',
  'GENERAL',
] as const;

export const BRAIN_PIPELINE_SEQUENCE: readonly BrainPipelineStage[] = [
  'BRAIN_REQUEST_RECEIVED',
  'REQUEST_CLASSIFIED',
  'SYSTEM_AWARENESS_CHECKED',
  'CROSS_SYSTEM_AWARENESS_CHECKED',
  'SHARED_MEMORY_CHECKED',
  'PROJECT_UNDERSTANDING_CHECKED',
  'GENERAL_QUESTION_UNDERSTANDING_CHECKED',
  'ROADMAP_AWARENESS_CHECKED',
  'RESPONSE_GENERATED',
  'BRAIN_RESPONSE_READY',
] as const;

export const SHARED_MEMORY_OPERATOR_FEED_STAGES: readonly OperatorFeedEventType[] = [
  'Loading Memory',
  'Searching Memory',
  'Memory Context Ready',
] as const;

export function withSharedMemoryFeedStages(
  sequence: readonly OperatorFeedEventType[],
): OperatorFeedEventType[] {
  const classifyIndex = sequence.indexOf('Classifying Request');
  const insertAt = classifyIndex >= 0 ? classifyIndex + 1 : 0;
  return [
    ...sequence.slice(0, insertAt),
    ...SHARED_MEMORY_OPERATOR_FEED_STAGES,
    ...sequence.slice(insertAt),
  ];
}

export const PROJECT_UNDERSTANDING_FEED: readonly OperatorFeedEventType[] = [
  'Classifying Request',
  'Understanding Project',
  'Gathering Facts',
  'Evaluating Risks',
  'Analyzing Dependencies',
  'Generating Conclusions',
  'Generating Response',
  'Response Ready',
] as const;

export const OPERATOR_FEED_EVENT_SEQUENCE: readonly OperatorFeedEventType[] = [
  'Classifying Request',
  'Checking Systems',
  'Checking Roadmap',
  'Generating Response',
  'Response Ready',
] as const;

export const CROSS_SYSTEM_FEED_DEPENDENCY: readonly OperatorFeedEventType[] = [
  'Classifying Request',
  'Loading Relationships',
  'Checking Dependencies',
  'Generating Response',
  'Response Ready',
] as const;

export const CROSS_SYSTEM_FEED_IMPACT: readonly OperatorFeedEventType[] = [
  'Classifying Request',
  'Loading Relationships',
  'Performing Impact Analysis',
  'Generating Response',
  'Response Ready',
] as const;

export const CROSS_SYSTEM_FEED_RELATIONSHIP: readonly OperatorFeedEventType[] = [
  'Classifying Request',
  'Loading Relationships',
  'Generating Response',
  'Response Ready',
] as const;

export const GENERAL_QUESTION_UNDERSTANDING_FEED: readonly OperatorFeedEventType[] = [
  'Understanding Question',
  'Detecting Context Needs',
  'Selecting Reasoning Mode',
  'Selecting Capabilities',
  'Gathering Relevant Facts',
  'Composing Answer',
  'Response Ready',
] as const;

export const TIMELINE_INTELLIGENCE_FEED: readonly OperatorFeedEventType[] = [
  'Loading Timeline Context',
  'Analyzing Timeline',
  'Checking Milestones',
  'Checking Blockers',
  'Generating Timeline Conclusions',
  'Response Ready',
] as const;

export const UNIFIED_DECISION_LAYER_FEED: readonly OperatorFeedEventType[] = [
  'Loading Decision Context',
  'Evaluating Options',
  'Checking Risks',
  'Checking Blockers',
  'Ranking Priorities',
  'Generating Recommendation',
  'Response Ready',
] as const;

export const DUPLICATE_BRAIN_PATTERNS = [
  'command_center_brain',
  'unified_command_center_brain',
  'brain_core',
  'command_center_intelligence',
] as const;

export const EXECUTION_BLOCKED_PATTERNS = ['execute', 'run command', 'deploy now', 'auto-fix', 'auto fix'] as const;
export const CODE_GEN_BLOCKED_PATTERNS = ['generate code', 'write code', 'create files'] as const;
export const FILE_MOD_BLOCKED_PATTERNS = ['modify file', 'write file', 'delete file'] as const;

let responseCounter = 0;

export function nextBrainResponseId(): string {
  responseCounter += 1;
  return `brain-resp-${responseCounter.toString().padStart(4, '0')}`;
}

export function resetBrainCountersForTests(): void {
  responseCounter = 0;
}
