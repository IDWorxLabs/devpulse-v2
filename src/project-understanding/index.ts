export {
  PROJECT_UNDERSTANDING_ENGINE_PASS_TOKEN,
  PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE,
  DUPLICATE_PROJECT_UNDERSTANDING_PATTERNS,
  PROJECT_UNDERSTANDING_FEED_STAGES,
  type ProjectProfile,
  type ProjectStatus,
  type ProjectStatusSummary,
  type ProjectGapAnalysis,
  type ProjectRiskAnalysis,
  type ProjectNextStepRecommendation,
  type ProjectUnderstandingContext,
  type ProjectUnderstandingDiagnostics,
} from './project-understanding-types.js';

export {
  PROJECT_KNOWLEDGE_REASONING_PASS_TOKEN,
  ProjectKnowledgeModel,
  getProjectKnowledgeModel,
  resetProjectKnowledgeModelForTests,
  resetProjectFactIdCounterForTests,
  nextProjectFactId,
  type ProjectFact,
  type ProjectFactCategory,
  type ProjectBroadIntent,
  type ProjectKnowledgeSnapshot,
  type ProjectReasoningContext,
  type ReasoningResult,
} from './project-knowledge-model.js';

export { collectProjectFacts } from './project-fact-collector.js';
export { resolveProjectIntent, intentKey } from './project-intent-resolver.js';
export { reasonOverProjectFacts } from './project-reasoning-engine.js';
export { composeProjectAnswer, answerFromReasoning } from './project-answer-composer.js';

export {
  getCurrentProjectProfile,
  resetProjectProfileForTests,
  profileKey,
} from './project-profile-store.js';

export { summarizeProjectStatus, formatProjectStatusResponse } from './project-status-model.js';
export { analyzeProjectGaps, formatProjectGapsResponse, formatCompletedMilestonesResponse } from './project-gap-analyzer.js';
export { analyzeProjectRisks, formatProjectRisksResponse, formatBlockedItemsResponse } from './project-risk-analyzer.js';
export { recommendProjectNextStep, formatProjectNextStepResponse } from './project-next-step-analyzer.js';

export {
  buildProjectUnderstandingContext,
  answerProjectQuestion,
  answerProjectQuestionWithTrace,
  processProjectUnderstanding,
} from './project-understanding-engine.js';

export {
  ensureProjectUnderstandingObservation,
  resetProjectUnderstandingForTests,
  processProjectUnderstandingRequest,
  getProjectUnderstandingDiagnostics,
  projectUnderstandingKey,
  DevPulseV2ProjectUnderstandingEngine,
  getDevPulseV2ProjectUnderstandingEngine,
} from './project-understanding-runtime.js';
