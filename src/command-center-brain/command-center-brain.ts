/**
 * DevPulse V2 Unified Command Center Brain — Phase 11.1+.
 * Local intelligence orchestration. Thinks — does NOT execute.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { classifyBrainRequest, classificationKey } from './brain-request-classifier.js';
import { getBrainRoadmapContext, roadmapContextKey } from './brain-roadmap-awareness.js';
import {
  assertBrainNotSecondCentralBrain,
  assertDistinctFromCentralBrain,
  findSystemByKeyword,
  getCommandCenterAwareSystems,
  systemsAwarenessKey,
} from './brain-system-awareness.js';
import {
  generateBlockedResponse,
  generateBrainResponse,
  responseKey,
} from './brain-response-generator.js';
import {
  buildCrossSystemSnapshot,
  crossSystemAwarenessKey,
  isCrossSystemCategory,
  processCrossSystemAwareness,
} from './cross-system-awareness/index.js';
import { buildCrossSystemRoutingReport } from './cross-system-awareness/runtime-verification/index.js';
import {
  formatMemoryRecallResponse,
  processMemoryForRequest,
  recallRelevantMemories,
  resetSharedMemoryForTests,
  sharedMemoryKey,
} from '../shared-memory/index.js';
import {
  getProjectUnderstandingDiagnostics,
  getProjectVaultIntelligenceDiagnostics,
  processProjectUnderstandingRequest,
  projectUnderstandingKey,
  resetProjectUnderstandingForTests,
} from '../project-understanding/index.js';
import {
  projectVaultIntelligenceKey,
  resetProjectVaultIntelligenceDiagnostics,
  resetProjectVaultIntelligenceBridgeForTests,
} from '../project-vault-intelligence/index.js';
import {
  dependencyIntelligenceKey,
  getDependencyIntelligenceDiagnostics,
  resetDependencyIntelligenceDiagnostics,
  resetDependencyGraphForTests,
} from '../dependency-intelligence/index.js';
import {
  getWorkspaceIntelligenceDiagnostics,
  resetWorkspaceIntelligenceDiagnostics,
  resetWorkspaceRiskCounterForTests,
  resetWorkspaceSnapshotForTests,
  workspaceIntelligenceKey,
} from '../workspace-intelligence/index.js';
import {
  getProjectHistoryIntelligenceDiagnostics,
  projectHistoryIntelligenceKey,
  resetHistoryEventReaderForTests,
  resetProjectHistoryIntelligenceDiagnostics,
  resetProjectHistorySnapshotForTests,
} from '../project-history-intelligence/index.js';
import {
  getProjectSummarizationDiagnostics,
  projectSummarizationKey,
  resetExecutiveSummaryCounterForTests,
  resetProjectHealthCounterForTests,
  resetProjectStatusCounterForTests,
  resetProjectSummarizationDiagnostics,
  resetTechnicalSummaryCounterForTests,
} from '../project-summarization-engine/index.js';
import {
  getPortfolioIntelligenceDiagnostics,
  portfolioIntelligenceKey,
  resetPortfolioComparisonCounterForTests,
  resetPortfolioIntelligenceDiagnostics,
  resetPortfolioPriorityCounterForTests,
  resetPortfolioRiskCounterForTests,
  resetPortfolioSummaryCounterForTests,
} from '../portfolio-intelligence/index.js';
import type { PortfolioIntelligenceDiagnostics } from '../portfolio-intelligence/portfolio-intelligence-types.js';
import {
  buildOperatorFeedVisibility,
  getOperatorFeedDiagnostics,
  operatorFeedFoundationKey,
  resetOperatorFeedDiagnostics,
  resetOperatorFeedEventCounterForTests,
  resetOperatorFeedTimelineCounterForTests,
} from '../operator-feed/index.js';
import type { OperatorFeedDiagnostics } from '../operator-feed/operator-feed-types.js';
import {
  getActionVisibilityContext,
  getActionVisibilityDiagnostics,
  actionVisibilityKey,
  resetActionVisibilityDiagnostics,
  resetActionCandidateCounterForTests,
} from '../action-visibility-engine/index.js';
import type { ActionVisibilityDiagnostics, ActionVisibilityRecord } from '../action-visibility-engine/action-visibility-types.js';
import {
  getReasoningVisibilityContext,
  getReasoningVisibilityDiagnostics,
  reasoningVisibilityKey,
  resetReasoningVisibilityDiagnostics,
  resetReasoningEvidenceCounterForTests,
  resetReasoningSourceCounterForTests,
  resetReasoningRiskCounterForTests,
  resetReasoningBlockerCounterForTests,
  resetReasoningVisibilityCounterForTests,
} from '../reasoning-visibility-engine/index.js';
import type { ReasoningVisibilityDiagnostics, ReasoningVisibilityRecord } from '../reasoning-visibility-engine/reasoning-visibility-types.js';
import {
  getProgressIntelligenceContext,
  getProgressIntelligenceDiagnostics,
  progressIntelligenceKey,
  resetProgressIntelligenceDiagnostics,
  resetProgressRecordCounterForTests,
  resetProgressMilestoneCounterForTests,
  resetProgressBlockerCounterForTests,
  resetProgressStatusCounterForTests,
} from '../progress-intelligence/index.js';
import type { ProgressIntelligenceDiagnostics, ProgressRecord } from '../progress-intelligence/progress-intelligence-types.js';
import {
  getFailureVisibilityContext,
  getFailureVisibilityDiagnostics,
  failureVisibilityKey,
  resetFailureVisibilityDiagnostics,
  resetFailureRecordCounterForTests,
  resetFailureImpactCounterForTests,
  resetFailureDependencyCounterForTests,
} from '../failure-visibility-engine/index.js';
import type { FailureVisibilityDiagnostics, FailureRecord } from '../failure-visibility-engine/failure-visibility-types.js';
import {
  getLearningVisibilityContext,
  getLearningVisibilityDiagnostics,
  learningVisibilityKey,
  resetLearningVisibilityDiagnostics,
  resetLearningBlockerCounterForTests,
  resetLearningFailureCounterForTests,
  resetLearningRecommendationCounterForTests,
  resetLearningPatternCounterForTests,
  resetLearningMemoryCounterForTests,
} from '../learning-visibility-engine/index.js';
import type { LearningVisibilityDiagnostics, LearningRecord } from '../learning-visibility-engine/learning-visibility-types.js';
import {
  getExecutionRuntimeContext,
  getExecutionRuntimeDiagnostics,
  executionRuntimeKey,
  resetExecutionRuntimeDiagnostics,
  resetExecutionPacketCounterForTests,
} from '../execution-runtime/index.js';
import { isExecutionReadinessAdvisoryQuestion } from '../execution-runtime/execution-runtime-types.js';
import type {
  ExecutionRuntimeDiagnostics,
  ExecutionPacket,
} from '../execution-runtime/execution-runtime-types.js';
import {
  getBuildTaskRuntimeContext,
  getBuildTaskRuntimeDiagnostics,
  buildTaskRuntimeKey,
  resetBuildTaskRuntimeDiagnostics,
  resetBuildTaskRequestCounterForTests,
  resetBuildTaskPlanCounterForTests,
  resetBuildTaskDependencyCounterForTests,
  resetBuildTaskSafetyGateCounterForTests,
} from '../build-task-runtime/index.js';
import { isBuildTaskPlanningAdvisoryQuestion } from '../build-task-runtime/build-task-runtime-types.js';
import type {
  BuildTaskRuntimeDiagnostics,
  BuildTaskPlan,
} from '../build-task-runtime/build-task-runtime-types.js';
import {
  getCodeGenerationRuntimeContext,
  getCodeGenerationRuntimeDiagnostics,
  codeGenerationRuntimeKey,
  resetCodeGenerationRuntimeDiagnostics,
  resetCodeGenerationRequestCounterForTests,
  resetCodeGenerationPlanCounterForTests,
  resetCodeArtifactCounterForTests,
  resetCodeChangeProposalCounterForTests,
  resetCodeGenerationRiskCounterForTests,
} from '../code-generation-runtime/index.js';
import { isCodeGenerationPlanningAdvisoryQuestion } from '../code-generation-runtime/code-generation-runtime-types.js';
import type {
  CodeGenerationRuntimeDiagnostics,
  CodeGenerationPlan,
} from '../code-generation-runtime/code-generation-runtime-types.js';
import {
  getTestingRuntimeContext,
  getTestingRuntimeDiagnostics,
  testingRuntimeKey,
  resetTestingRuntimeDiagnostics,
  resetTestingRequestCounterForTests,
  resetTestingPlanCounterForTests,
  resetTestCaseCounterForTests,
  resetTestEvidenceCounterForTests,
  resetTestRiskCounterForTests,
  resetSimulatedTestResultCounterForTests,
} from '../testing-runtime/index.js';
import { isTestingPlanningAdvisoryQuestion } from '../testing-runtime/testing-runtime-types.js';
import type {
  TestingRuntimeDiagnostics,
  TestingPlan,
} from '../testing-runtime/testing-runtime-types.js';
import {
  getAutoFixRuntimeContext,
  getAutoFixRuntimeDiagnostics,
  autoFixRuntimeKey,
  resetAutoFixRuntimeDiagnostics,
  resetFixRequestCounterForTests,
  resetAutoFixPlanCounterForTests,
  resetFixProposalCounterForTests,
  resetFixAlternativeCounterForTests,
  resetFixRiskCounterForTests,
  resetFixRollbackCounterForTests,
  resetFixVerificationCounterForTests,
  resetSimulatedFixResultCounterForTests,
} from '../auto-fix-runtime/index.js';
import { isAutoFixPlanningAdvisoryQuestion } from '../auto-fix-runtime/auto-fix-runtime-types.js';
import type {
  AutoFixRuntimeDiagnostics,
  AutoFixPlan,
} from '../auto-fix-runtime/auto-fix-runtime-types.js';
import {
  getRuntimeVerificationContext,
  getRuntimeVerificationDiagnostics,
  runtimeVerificationKey,
  resetRuntimeVerificationDiagnostics,
  resetVerificationRequestCounterForTests,
  resetVerificationReportCounterForTests,
  resetVerificationEvidenceCounterForTests,
  resetVerificationGapCounterForTests,
  resetVerificationTrustCounterForTests,
} from '../runtime-verification-layer/index.js';
import { isRuntimeVerificationAdvisoryQuestion } from '../runtime-verification-layer/runtime-verification-types.js';
import type {
  RuntimeVerificationDiagnostics,
  RuntimeVerificationReport,
} from '../runtime-verification-layer/runtime-verification-types.js';
import {
  getTimelineIntelligenceDiagnostics,
  resetTimelineIntelligenceForTests,
  timelineIntelligenceKey,
} from '../timeline-intelligence/index.js';
import {
  getUnifiedDecisionLayerDiagnostics,
  resetUnifiedDecisionLayerForTests,
  unifiedDecisionLayerKey,
} from '../unified-decision-layer/index.js';
import {
  executeGeneralQuestionRouting,
  generalQuestionUnderstandingKey,
  getLastGeneralQuestionDiagnostics,
  isPlanningNotImpactQuestion,
  resetGeneralQuestionUnderstandingForTests,
  shouldGeneralRouterOwnRequest,
  understandGeneralQuestion,
} from './general-question-understanding/index.js';
import type {
  BrainPipelineStage,
  BrainRequestCategory,
  BrainRequestInput,
  BrainClassification,
  BrainResponseResult,
  CrossSystemDiagnostics,
  GeneralQuestionRoutingDiagnostics,
  TimelineIntelligenceDiagnostics,
  UnifiedDecisionLayerDiagnostics,
  ProjectVaultIntelligenceDiagnostics,
  DependencyIntelligenceDiagnostics,
  WorkspaceIntelligenceDiagnostics,
  ProjectHistoryIntelligenceDiagnostics,
  ProjectSummarizationDiagnostics,
  OperatorFeedEvent,
  OperatorFeedEventType,
  QuestionRoutingPlan,
} from './brain-types.js';
import {
  BRAIN_PIPELINE_SEQUENCE,
  CODE_GEN_BLOCKED_PATTERNS,
  COMMAND_CENTER_BRAIN_OWNER_MODULE,
  COMMAND_CENTER_BRAIN_PASS_TOKEN,
  CROSS_SYSTEM_FEED_DEPENDENCY,
  CROSS_SYSTEM_FEED_IMPACT,
  CROSS_SYSTEM_FEED_RELATIONSHIP,
  DUPLICATE_BRAIN_PATTERNS,
  EXECUTION_BLOCKED_PATTERNS,
  FILE_MOD_BLOCKED_PATTERNS,
  OPERATOR_FEED_EVENT_SEQUENCE,
  PROJECT_UNDERSTANDING_FEED,
  GENERAL_QUESTION_UNDERSTANDING_FEED,
  TIMELINE_INTELLIGENCE_FEED,
  UNIFIED_DECISION_LAYER_FEED,
  SHARED_MEMORY_OPERATOR_FEED_STAGES,
  withSharedMemoryFeedStages,
  nextBrainResponseId,
} from './brain-types.js';

let lastCrossSystemDiagnostics: CrossSystemDiagnostics = {
  relationshipCount: 0,
  dependencyCount: 0,
  impactAnalysisAvailable: true,
  lastRelationshipQuery: null,
  lastDependencyQuery: null,
  lastImpactQuery: null,
  lastQueryType: null,
  lastAnalyzerUsed: null,
  lastRoutingResult: null,
};

function getForbiddenPatterns(): string[] {
  return [
    'fs' + '.writeFileSync',
    'fs' + '.rmSync',
    'child' + '_process',
    'exec' + '(',
    'spawn' + '(',
    'eval' + '(',
  ];
}

function detectBlockedIntent(message: string): string | null {
  if (
    isExecutionReadinessAdvisoryQuestion(message) ||
    isBuildTaskPlanningAdvisoryQuestion(message) ||
    isCodeGenerationPlanningAdvisoryQuestion(message) ||
    isTestingPlanningAdvisoryQuestion(message) ||
    isAutoFixPlanningAdvisoryQuestion(message) ||
    isRuntimeVerificationAdvisoryQuestion(message)
  ) {
    return null;
  }
  const lower = message.toLowerCase();
  const checks: Array<[readonly string[], string]> = [
    [EXECUTION_BLOCKED_PATTERNS, 'execution requests are blocked — intelligence only'],
    [CODE_GEN_BLOCKED_PATTERNS, 'code generation requests are blocked'],
    [FILE_MOD_BLOCKED_PATTERNS, 'file modification requests are blocked'],
  ];
  for (const [patterns, reason] of checks) {
    for (const pattern of patterns) {
      if (lower.includes(pattern)) return reason;
    }
  }
  return null;
}

const LEGACY_PROJECT_UNDERSTANDING_QUERIES = [
  'what project are we working on',
  'what is missing in this project',
  'what is blocked',
  'what should this project do next',
  'what systems relate to this project',
] as const;

function isLegacyProjectUnderstandingQuery(message: string): boolean {
  const lower = message.toLowerCase().trim().replace(/[?!.]+$/, '');
  return LEGACY_PROJECT_UNDERSTANDING_QUERIES.some((q) => lower === q);
}

function shouldUseGeneralRouter(
  blocked: boolean,
  classification: BrainClassification,
  message: string,
  plan: QuestionRoutingPlan | undefined,
): boolean {
  if (blocked || !plan) return false;
  if (classification.category === 'MEMORY') return false;
  if (classification.category === 'PROJECT_UNDERSTANDING' && isLegacyProjectUnderstandingQuery(message)) {
    return false;
  }
  if (isCrossSystemCategory(classification.category)) {
    if (isPlanningNotImpactQuestion(message)) return shouldGeneralRouterOwnRequest(plan);
    if (
      plan.unavailableCapabilities.length > 0 &&
      (plan.dimensions.includes('DEBUGGING') || plan.dimensions.includes('DEVELOPMENT'))
    ) {
      return shouldGeneralRouterOwnRequest(plan);
    }
    return false;
  }
  return shouldGeneralRouterOwnRequest(plan);
}

function feedSequenceForCategory(
  category: BrainRequestCategory,
  generalRouterOwns: boolean,
  timelineRouterOwns: boolean,
  decisionRouterOwns: boolean,
): readonly OperatorFeedEventType[] {
  if (decisionRouterOwns) return UNIFIED_DECISION_LAYER_FEED;
  if (timelineRouterOwns) return TIMELINE_INTELLIGENCE_FEED;
  if (generalRouterOwns) return GENERAL_QUESTION_UNDERSTANDING_FEED;
  if (category === 'DEPENDENCY') return CROSS_SYSTEM_FEED_DEPENDENCY;
  if (category === 'IMPACT') return CROSS_SYSTEM_FEED_IMPACT;
  if (category === 'RELATIONSHIP') return CROSS_SYSTEM_FEED_RELATIONSHIP;
  if (category === 'PROJECT_UNDERSTANDING') return PROJECT_UNDERSTANDING_FEED;
  return OPERATOR_FEED_EVENT_SEQUENCE;
}

function buildOperatorFeedEvents(
  timestamp: number,
  category: BrainRequestCategory,
  memoryLookup: boolean,
  generalRouterOwns: boolean,
  timelineRouterOwns: boolean,
  decisionRouterOwns: boolean,
): OperatorFeedEvent[] {
  const base = feedSequenceForCategory(category, generalRouterOwns, timelineRouterOwns, decisionRouterOwns);
  const sequence = memoryLookup ? withSharedMemoryFeedStages(base) : base;
  return sequence.map((eventType, index) => ({
    eventId: `feed-${(index + 1).toString().padStart(2, '0')}`,
    eventType,
    timestamp: timestamp + index,
    informationalOnly: true as const,
  }));
}

function buildPipelineStages(
  blocked: boolean,
  memoryChecked: boolean,
  projectChecked: boolean,
  generalChecked: boolean,
): BrainPipelineStage[] {
  if (blocked) return ['BRAIN_REQUEST_RECEIVED', 'BRAIN_REQUEST_BLOCKED'];
  let stages = [...BRAIN_PIPELINE_SEQUENCE];
  if (!memoryChecked) stages = stages.filter((s) => s !== 'SHARED_MEMORY_CHECKED');
  if (!projectChecked) stages = stages.filter((s) => s !== 'PROJECT_UNDERSTANDING_CHECKED');
  if (!generalChecked) stages = stages.filter((s) => s !== 'GENERAL_QUESTION_UNDERSTANDING_CHECKED');
  return stages;
}

function updateCrossSystemDiagnostics(
  message: string,
  category: BrainRequestCategory,
  snapshot: ReturnType<typeof buildCrossSystemSnapshot>,
  routingReport: ReturnType<typeof buildCrossSystemRoutingReport> | undefined,
): CrossSystemDiagnostics {
  const base = buildCrossSystemSnapshot('NONE', null);
  const next: CrossSystemDiagnostics = {
    relationshipCount: snapshot.relationshipCount || base.relationshipCount,
    dependencyCount: snapshot.dependencyCount || base.dependencyCount,
    impactAnalysisAvailable: snapshot.impactAnalysisAvailable,
    lastRelationshipQuery: lastCrossSystemDiagnostics.lastRelationshipQuery,
    lastDependencyQuery: lastCrossSystemDiagnostics.lastDependencyQuery,
    lastImpactQuery: lastCrossSystemDiagnostics.lastImpactQuery,
    lastQueryType: routingReport?.classification ?? category,
    lastAnalyzerUsed: routingReport?.selectedAnalyzer ?? null,
    lastRoutingResult: routingReport?.routingResult ?? null,
  };
  if (category === 'RELATIONSHIP') next.lastRelationshipQuery = message;
  if (category === 'DEPENDENCY') next.lastDependencyQuery = message;
  if (category === 'IMPACT') next.lastImpactQuery = message;
  lastCrossSystemDiagnostics = next;
  return next;
}

export function getLastCrossSystemDiagnostics(): CrossSystemDiagnostics {
  const base = buildCrossSystemSnapshot('NONE', null);
  return {
    ...lastCrossSystemDiagnostics,
    relationshipCount: lastCrossSystemDiagnostics.relationshipCount || base.relationshipCount,
    dependencyCount: lastCrossSystemDiagnostics.dependencyCount || base.dependencyCount,
  };
}

export function resetCrossSystemDiagnosticsForTests(): void {
  lastCrossSystemDiagnostics = {
    relationshipCount: 0,
    dependencyCount: 0,
    impactAnalysisAvailable: true,
    lastRelationshipQuery: null,
    lastDependencyQuery: null,
    lastImpactQuery: null,
    lastQueryType: null,
    lastAnalyzerUsed: null,
    lastRoutingResult: null,
  };
}

export function processBrainRequest(input: BrainRequestInput): BrainResponseResult {
  const timestamp = input.timestamp ?? Date.now();
  const message = input.message?.trim() ?? '';
  const blockedReason = !message ? 'empty message' : detectBlockedIntent(message);
  const blocked = Boolean(blockedReason);

  const classification = blocked
    ? { category: 'GENERAL' as const, confidence: 'LOW' as const, matchedSignals: [], reason: 'blocked' }
    : classifyBrainRequest({ message, timestamp });

  const systems = blocked ? [] : getCommandCenterAwareSystems();
  const referenced = blocked ? [] : findSystemByKeyword(message).map((s) => s.systemId);
  const roadmap = getBrainRoadmapContext();

  const routingPlan: QuestionRoutingPlan | undefined = blocked ? undefined : understandGeneralQuestion(message);
  const useGeneralRouter = shouldUseGeneralRouter(blocked, classification, message, routingPlan);
  const generalRouting =
    routingPlan && useGeneralRouter
      ? executeGeneralQuestionRouting(routingPlan, { message, classification, systems, roadmap })
      : null;
  const generalRouterOwns = Boolean(generalRouting?.ownsResponse);
  const decisionRouterOwns =
    generalRouterOwns && routingPlan?.primaryCapability === 'UNIFIED_DECISION_LAYER';
  const timelineRouterOwns =
    generalRouterOwns &&
    !decisionRouterOwns &&
    routingPlan?.primaryCapability === 'TIMELINE_INTELLIGENCE';

  const memoryContext = blocked ? undefined : processMemoryForRequest(message);
  const isMemoryRecall =
    !blocked && !generalRouterOwns && classification.category === 'MEMORY';
  const isProjectUnderstanding =
    !blocked && !generalRouterOwns && !isMemoryRecall && classification.category === 'PROJECT_UNDERSTANDING';

  let projectUnderstandingResult = null;
  if (isProjectUnderstanding) {
    projectUnderstandingResult = processProjectUnderstandingRequest(message);
  } else if (generalRouterOwns && generalRouting!.usedCapabilities.includes('PROJECT_KNOWLEDGE_REASONING')) {
    projectUnderstandingResult = processProjectUnderstandingRequest(message);
  }

  const isCrossSystem =
    !blocked &&
    !generalRouterOwns &&
    !isMemoryRecall &&
    !isProjectUnderstanding &&
    isCrossSystemCategory(classification.category);
  let crossSystemResult = null;
  if (isCrossSystem) {
    crossSystemResult = processCrossSystemAwareness(
      message,
      classification.category as 'DEPENDENCY' | 'IMPACT' | 'RELATIONSHIP',
    );
  }

  const operatorFeedEvents = blocked
    ? []
    : buildOperatorFeedEvents(
        timestamp,
        classification.category,
        Boolean(memoryContext?.lookupPerformed),
        generalRouterOwns,
        timelineRouterOwns,
        decisionRouterOwns,
      );
  const feedStages = operatorFeedEvents.map((e) => e.eventType);

  const routingReport = isCrossSystem
    ? buildCrossSystemRoutingReport({
        classification,
        category: classification.category,
        operatorFeedStages: feedStages,
        crossSystemResult,
        dependencyAnalysis: crossSystemResult?.dependencyAnalysis ?? null,
        impactAnalysis: crossSystemResult?.impactAnalysis ?? null,
        responseText: crossSystemResult?.responseText ?? '',
        timestamp,
      })
    : undefined;

  const brainResponse = blocked
    ? generateBlockedResponse(blockedReason!)
    : generalRouterOwns
      ? generalRouting!.responseText
      : isMemoryRecall
        ? formatMemoryRecallResponse(message, recallRelevantMemories(message))
        : isProjectUnderstanding
          ? projectUnderstandingResult!.responseText
          : isCrossSystem
            ? crossSystemResult!.responseText
            : generateBrainResponse(message, classification, systems, roadmap);

  const pipelineStages = buildPipelineStages(
    blocked,
    Boolean(memoryContext?.lookupPerformed),
    Boolean(projectUnderstandingResult),
    Boolean(routingPlan),
  );

  const crossSystemDiagnostics = blocked
    ? undefined
    : updateCrossSystemDiagnostics(
        message,
        classification.category,
        crossSystemResult?.snapshot ?? buildCrossSystemSnapshot('NONE', null),
        routingReport,
      );

  const generalQuestionDiagnostics: GeneralQuestionRoutingDiagnostics | undefined = blocked
    ? undefined
    : getLastGeneralQuestionDiagnostics();

  const timelineIntelligenceDiagnostics: TimelineIntelligenceDiagnostics | undefined =
    blocked || !timelineRouterOwns ? undefined : getTimelineIntelligenceDiagnostics();

  const unifiedDecisionLayerDiagnostics: UnifiedDecisionLayerDiagnostics | undefined =
    blocked || !decisionRouterOwns ? undefined : getUnifiedDecisionLayerDiagnostics();

  const vaultDiag = getProjectVaultIntelligenceDiagnostics();
  const projectVaultIntelligenceDiagnostics: ProjectVaultIntelligenceDiagnostics | undefined =
    blocked || !vaultDiag.projectVaultIntelligenceActive ? undefined : vaultDiag;

  const depDiag = getDependencyIntelligenceDiagnostics();
  const dependencyIntelligenceDiagnostics: DependencyIntelligenceDiagnostics | undefined =
    blocked || !depDiag.dependencyIntelligenceActive ? undefined : depDiag;

  const wsDiag = getWorkspaceIntelligenceDiagnostics();
  const workspaceIntelligenceDiagnostics: WorkspaceIntelligenceDiagnostics | undefined =
    blocked || !wsDiag.workspaceIntelligenceActive ? undefined : wsDiag;

  const histDiag = getProjectHistoryIntelligenceDiagnostics();
  const projectHistoryIntelligenceDiagnostics: ProjectHistoryIntelligenceDiagnostics | undefined =
    blocked || !histDiag.projectHistoryIntelligenceActive ? undefined : histDiag;

  const sumDiag = getProjectSummarizationDiagnostics();
  const projectSummarizationDiagnostics: ProjectSummarizationDiagnostics | undefined =
    blocked || !sumDiag.projectSummarizationActive ? undefined : sumDiag;

  const portDiag = getPortfolioIntelligenceDiagnostics();
  const portfolioIntelligenceDiagnostics: PortfolioIntelligenceDiagnostics | undefined =
    blocked || !portDiag.portfolioIntelligenceActive ? undefined : portDiag;

  const operatorFeedTimeline = blocked
    ? undefined
    : buildOperatorFeedVisibility({
        query: message,
        routingPlan,
        memoryLookup: Boolean(memoryContext?.lookupPerformed),
        timestamp,
      });

  const feedFoundationDiag = getOperatorFeedDiagnostics();
  const operatorFeedFoundationDiagnostics: OperatorFeedDiagnostics | undefined =
    blocked || !feedFoundationDiag.operatorFeedActive ? undefined : feedFoundationDiag;

  const actionCtx = blocked ? null : getActionVisibilityContext(message);
  const actionDiag = getActionVisibilityDiagnostics();
  const actionVisibilityDiagnostics: ActionVisibilityDiagnostics | undefined =
    blocked || !actionDiag.actionVisibilityActive ? undefined : actionDiag;
  const actionVisibilityRecords: ActionVisibilityRecord[] | undefined =
    blocked || !actionCtx ? undefined : actionCtx.records;

  const reasoningCtx = blocked ? null : getReasoningVisibilityContext(message);
  const reasoningDiag = getReasoningVisibilityDiagnostics();
  const reasoningVisibilityDiagnostics: ReasoningVisibilityDiagnostics | undefined =
    blocked || !reasoningDiag.reasoningVisibilityActive ? undefined : reasoningDiag;
  const reasoningVisibilityRecords: ReasoningVisibilityRecord[] | undefined =
    blocked || !reasoningCtx ? undefined : reasoningCtx.result.records;

  const progressCtx = blocked ? null : getProgressIntelligenceContext(message);
  const progressDiag = getProgressIntelligenceDiagnostics();
  const progressIntelligenceDiagnostics: ProgressIntelligenceDiagnostics | undefined =
    blocked || !progressDiag.progressIntelligenceActive ? undefined : progressDiag;
  const progressRecords: ProgressRecord[] | undefined =
    blocked || !progressCtx ? undefined : progressCtx.result.analysis.records;

  const failureCtx = blocked ? null : getFailureVisibilityContext(message);
  const failureDiag = getFailureVisibilityDiagnostics();
  const failureVisibilityDiagnostics: FailureVisibilityDiagnostics | undefined =
    blocked || !failureDiag.failureVisibilityActive ? undefined : failureDiag;
  const failureRecords: FailureRecord[] | undefined =
    blocked || !failureCtx ? undefined : failureCtx.result.analysis.records;

  const learningCtx = blocked ? null : getLearningVisibilityContext(message);
  const learningDiag = getLearningVisibilityDiagnostics();
  const learningVisibilityDiagnostics: LearningVisibilityDiagnostics | undefined =
    blocked || !learningDiag.learningVisibilityActive ? undefined : learningDiag;
  const learningRecords: LearningRecord[] | undefined =
    blocked || !learningCtx ? undefined : learningCtx.result.analysis.records;

  const executionCtx = blocked ? null : getExecutionRuntimeContext(message);
  const executionDiag = getExecutionRuntimeDiagnostics();
  const executionRuntimeDiagnostics: ExecutionRuntimeDiagnostics | undefined =
    blocked || !executionDiag.executionRuntimeActive ? undefined : executionDiag;
  const executionPackets: ExecutionPacket[] | undefined =
    blocked || !executionCtx ? undefined : executionCtx.result.packets;

  const buildTaskCtx = blocked ? null : getBuildTaskRuntimeContext(message);
  const buildTaskDiag = getBuildTaskRuntimeDiagnostics();
  const buildTaskRuntimeDiagnostics: BuildTaskRuntimeDiagnostics | undefined =
    blocked || !buildTaskDiag.buildTaskRuntimeActive ? undefined : buildTaskDiag;
  const buildTaskPlans: BuildTaskPlan[] | undefined =
    blocked || !buildTaskCtx ? undefined : [buildTaskCtx.result.plan];

  const codeGenCtx = blocked ? null : getCodeGenerationRuntimeContext(message);
  const codeGenDiag = getCodeGenerationRuntimeDiagnostics();
  const codeGenerationRuntimeDiagnostics: CodeGenerationRuntimeDiagnostics | undefined =
    blocked || !codeGenDiag.codeGenerationRuntimeActive ? undefined : codeGenDiag;
  const codeGenerationPlans: CodeGenerationPlan[] | undefined =
    blocked || !codeGenCtx ? undefined : [codeGenCtx.result.plan];

  const testingCtx = blocked ? null : getTestingRuntimeContext(message);
  const testingDiag = getTestingRuntimeDiagnostics();
  const testingRuntimeDiagnostics: TestingRuntimeDiagnostics | undefined =
    blocked || !testingDiag.testingRuntimeActive ? undefined : testingDiag;
  const testingPlans: TestingPlan[] | undefined =
    blocked || !testingCtx ? undefined : [testingCtx.result.plan];

  const autoFixCtx = blocked ? null : getAutoFixRuntimeContext(message);
  const autoFixDiag = getAutoFixRuntimeDiagnostics();
  const autoFixRuntimeDiagnostics: AutoFixRuntimeDiagnostics | undefined =
    blocked || !autoFixDiag.autoFixRuntimeActive ? undefined : autoFixDiag;
  const autoFixPlans: AutoFixPlan[] | undefined =
    blocked || !autoFixCtx ? undefined : [autoFixCtx.result.plan];

  const verificationCtx = blocked ? null : getRuntimeVerificationContext(message);
  const verificationDiag = getRuntimeVerificationDiagnostics();
  const runtimeVerificationDiagnostics: RuntimeVerificationDiagnostics | undefined =
    blocked || !verificationDiag.runtimeVerificationActive ? undefined : verificationDiag;
  const runtimeVerificationReports: RuntimeVerificationReport[] | undefined =
    blocked || !verificationCtx ? undefined : [verificationCtx.result.report];

  return {
    responseId: nextBrainResponseId(),
    userMessage: message,
    brainResponse,
    category: classification.category,
    classification,
    systemsReferenced: referenced,
    roadmapContext: roadmap,
    crossSystemContext: crossSystemResult?.snapshot,
    crossSystemDiagnostics,
    crossSystemRoutingReport: routingReport,
    sharedMemoryContext: memoryContext,
    projectUnderstandingContext: projectUnderstandingResult?.context,
    projectUnderstandingDiagnostics: blocked
      ? undefined
      : projectUnderstandingResult
        ? getProjectUnderstandingDiagnostics()
        : undefined,
    generalQuestionRoutingPlan: routingPlan,
    generalQuestionDiagnostics,
    timelineIntelligenceDiagnostics,
    unifiedDecisionLayerDiagnostics,
    projectVaultIntelligenceDiagnostics,
    dependencyIntelligenceDiagnostics,
    workspaceIntelligenceDiagnostics,
    projectHistoryIntelligenceDiagnostics,
    projectSummarizationDiagnostics,
    portfolioIntelligenceDiagnostics,
    operatorFeedTimeline,
    operatorFeedFoundationDiagnostics,
    actionVisibilityDiagnostics,
    actionVisibilityRecords,
    reasoningVisibilityDiagnostics,
    reasoningVisibilityRecords,
    progressIntelligenceDiagnostics,
    progressRecords,
    failureVisibilityDiagnostics,
    failureRecords,
    learningVisibilityDiagnostics,
    learningRecords,
    executionRuntimeDiagnostics,
    executionPackets,
    buildTaskRuntimeDiagnostics,
    buildTaskPlans,
    codeGenerationRuntimeDiagnostics,
    codeGenerationPlans,
    testingRuntimeDiagnostics,
    testingPlans,
    autoFixRuntimeDiagnostics,
    autoFixPlans,
    runtimeVerificationDiagnostics,
    runtimeVerificationReports,
    pipelineStages,
    operatorFeedEvents,
    confirmation: {
      intelligenceOnly: true,
      noExecutionPerformed: true,
      noCommandsExecuted: true,
      noFilesModified: true,
      noCodeGenerated: true,
      noDeploymentPerformed: true,
      noAutoFixPerformed: true,
      noRuntimeMutation: true,
      noExternalAiCalls: true,
      noPersistence: true,
      noSystemReplacement: true,
    },
    createdAt: timestamp,
  };
}

export function brainStructuralKey(result: BrainResponseResult): string {
  return [
    result.userMessage.trim().toLowerCase(),
    classificationKey(result.classification),
    responseKey(result.category, result.userMessage),
    systemsAwarenessKey(getCommandCenterAwareSystems()),
    crossSystemAwarenessKey(),
    sharedMemoryKey(),
    projectUnderstandingKey(),
    generalQuestionUnderstandingKey(),
    timelineIntelligenceKey(),
    unifiedDecisionLayerKey(),
    projectVaultIntelligenceKey(),
    dependencyIntelligenceKey(),
    workspaceIntelligenceKey(),
    projectHistoryIntelligenceKey(),
    projectSummarizationKey(),
    portfolioIntelligenceKey(),
    operatorFeedFoundationKey(),
    actionVisibilityKey(),
    reasoningVisibilityKey(),
    progressIntelligenceKey(),
    failureVisibilityKey(),
    learningVisibilityKey(),
    executionRuntimeKey(),
    buildTaskRuntimeKey(),
    codeGenerationRuntimeKey(),
    testingRuntimeKey(),
    autoFixRuntimeKey(),
    runtimeVerificationKey(),
    roadmapContextKey(result.roadmapContext),
    result.pipelineStages.join('→'),
  ].join('|');
}

export function scanBrainModuleForForbiddenPatterns(moduleDir: string): string[] {
  const violations: string[] = [];

  function scanDir(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
        continue;
      }
      if (!entry.name.endsWith('.ts')) continue;
      const content = readFileSync(fullPath, 'utf8');
      for (const pattern of getForbiddenPatterns()) {
        if (content.includes(pattern)) violations.push(`${fullPath}: forbidden "${pattern}"`);
      }
    }
  }

  scanDir(moduleDir);
  return violations;
}

export class DevPulseV2CommandCenterBrain {
  static readonly ownerModule = COMMAND_CENTER_BRAIN_OWNER_MODULE;
  static readonly ownerDomain = 'command_center_brain' as const;
  static readonly passToken = COMMAND_CENTER_BRAIN_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('command_center_brain');
    return owner.ownerModule === COMMAND_CENTER_BRAIN_OWNER_MODULE && owner.phase === 11.1;
  }

  static assertDistinctFromCentralBrain(): boolean {
    return assertDistinctFromCentralBrain() && assertBrainNotSecondCentralBrain();
  }

  static assertNoDuplicateBrain(): boolean {
    const registered = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const brainOwner = getDevPulseV2Owner('command_center_brain').ownerModule;
    return DUPLICATE_BRAIN_PATTERNS.every((pattern) => {
      const normalized = pattern.replace(/\s+/g, '_');
      const competing = [...registered].filter(
        (m) => (m.includes(normalized) || m.includes('command_center_brain')) && m !== brainOwner,
      );
      return competing.length === 0;
    });
  }

  static assertDoesNotExecute(): boolean {
    const brain = new DevPulseV2CommandCenterBrain();
    return (
      typeof (brain as { execute?: unknown }).execute === 'undefined' &&
      typeof (brain as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (brain as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (brain as { deploy?: unknown }).deploy === 'undefined'
    );
  }

  static assertNoForbiddenPatterns(): boolean {
    const moduleDir = join(fileURLToPath(new URL('.', import.meta.url)));
    return scanBrainModuleForForbiddenPatterns(moduleDir).length === 0;
  }

  respond(input: BrainRequestInput): BrainResponseResult {
    return processBrainRequest(input);
  }
}

let singleton: DevPulseV2CommandCenterBrain | null = null;

export function getDevPulseV2CommandCenterBrain(): DevPulseV2CommandCenterBrain {
  if (!singleton) singleton = new DevPulseV2CommandCenterBrain();
  return singleton;
}

export function resetDevPulseV2CommandCenterBrainForTests(): DevPulseV2CommandCenterBrain {
  singleton = new DevPulseV2CommandCenterBrain();
  resetCrossSystemDiagnosticsForTests();
  resetSharedMemoryForTests();
  resetProjectUnderstandingForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetTimelineIntelligenceForTests();
  resetUnifiedDecisionLayerForTests();
  resetProjectVaultIntelligenceDiagnostics();
  resetProjectVaultIntelligenceBridgeForTests();
  resetDependencyIntelligenceDiagnostics();
  resetDependencyGraphForTests();
  resetWorkspaceIntelligenceDiagnostics();
  resetWorkspaceSnapshotForTests();
  resetWorkspaceRiskCounterForTests();
  resetProjectHistoryIntelligenceDiagnostics();
  resetProjectHistorySnapshotForTests();
  resetHistoryEventReaderForTests();
  resetProjectSummarizationDiagnostics();
  resetExecutiveSummaryCounterForTests();
  resetTechnicalSummaryCounterForTests();
  resetProjectHealthCounterForTests();
  resetProjectStatusCounterForTests();
  resetPortfolioIntelligenceDiagnostics();
  resetPortfolioRiskCounterForTests();
  resetPortfolioPriorityCounterForTests();
  resetPortfolioComparisonCounterForTests();
  resetPortfolioSummaryCounterForTests();
  resetOperatorFeedDiagnostics();
  resetOperatorFeedEventCounterForTests();
  resetOperatorFeedTimelineCounterForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningEvidenceCounterForTests();
  resetReasoningSourceCounterForTests();
  resetReasoningRiskCounterForTests();
  resetReasoningBlockerCounterForTests();
  resetReasoningVisibilityCounterForTests();
  resetProgressIntelligenceDiagnostics();
  resetProgressRecordCounterForTests();
  resetProgressMilestoneCounterForTests();
  resetProgressBlockerCounterForTests();
  resetProgressStatusCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
  resetFailureImpactCounterForTests();
  resetFailureDependencyCounterForTests();
  resetLearningVisibilityDiagnostics();
  resetLearningBlockerCounterForTests();
  resetLearningFailureCounterForTests();
  resetLearningRecommendationCounterForTests();
  resetLearningPatternCounterForTests();
  resetLearningMemoryCounterForTests();
  resetExecutionRuntimeDiagnostics();
  resetExecutionPacketCounterForTests();
  resetBuildTaskRuntimeDiagnostics();
  resetBuildTaskRequestCounterForTests();
  resetBuildTaskPlanCounterForTests();
  resetBuildTaskDependencyCounterForTests();
  resetBuildTaskSafetyGateCounterForTests();
  resetCodeGenerationRuntimeDiagnostics();
  resetCodeGenerationRequestCounterForTests();
  resetCodeGenerationPlanCounterForTests();
  resetCodeArtifactCounterForTests();
  resetCodeChangeProposalCounterForTests();
  resetCodeGenerationRiskCounterForTests();
  resetTestingRuntimeDiagnostics();
  resetTestingRequestCounterForTests();
  resetTestingPlanCounterForTests();
  resetTestCaseCounterForTests();
  resetTestEvidenceCounterForTests();
  resetTestRiskCounterForTests();
  resetSimulatedTestResultCounterForTests();
  resetAutoFixRuntimeDiagnostics();
  resetFixRequestCounterForTests();
  resetAutoFixPlanCounterForTests();
  resetFixProposalCounterForTests();
  resetFixAlternativeCounterForTests();
  resetFixRiskCounterForTests();
  resetFixRollbackCounterForTests();
  resetFixVerificationCounterForTests();
  resetSimulatedFixResultCounterForTests();
  resetRuntimeVerificationDiagnostics();
  resetVerificationRequestCounterForTests();
  resetVerificationReportCounterForTests();
  resetVerificationEvidenceCounterForTests();
  resetVerificationGapCounterForTests();
  resetVerificationTrustCounterForTests();
  return singleton;
}

export {
  classificationKey,
  responseKey,
  systemsAwarenessKey,
  roadmapContextKey,
  crossSystemAwarenessKey,
  BRAIN_PIPELINE_SEQUENCE,
  OPERATOR_FEED_EVENT_SEQUENCE,
  CROSS_SYSTEM_FEED_DEPENDENCY,
  CROSS_SYSTEM_FEED_IMPACT,
  CROSS_SYSTEM_FEED_RELATIONSHIP,
  PROJECT_UNDERSTANDING_FEED,
  GENERAL_QUESTION_UNDERSTANDING_FEED,
  TIMELINE_INTELLIGENCE_FEED,
  UNIFIED_DECISION_LAYER_FEED,
  SHARED_MEMORY_OPERATOR_FEED_STAGES,
  withSharedMemoryFeedStages,
  COMMAND_CENTER_BRAIN_OWNER_MODULE,
  COMMAND_CENTER_BRAIN_PASS_TOKEN,
};
