/**
 * Capability Research Engine — public exports.
 */

import { resetCapabilityResearchRegistryForTests } from './capability-research-registry.js';
import { resetCapabilityResearchCacheForTests } from './capability-research-cache.js';
import { resetDomainClassifierForTests } from './capability-domain-classifier.js';
import { resetEvidenceAnalyzerForTests } from './capability-evidence-analyzer.js';
import { resetSimilarityAnalyzerForTests } from './capability-similarity-analyzer.js';
import { resetRootCauseResearcherForTests } from './capability-root-cause-researcher.js';
import { resetResearchDecisionEngineForTests } from './capability-research-decision-engine.js';
import { resetCapabilityResearchHistoryForTests } from './capability-research-history.js';
import { resetCapabilityResearchReportCounterForTests } from './capability-research-reporting.js';
import { resetCapabilityResearchEngineForTests } from './capability-research-engine.js';
import { resetMissingCapabilityEscalationModuleForTests } from '../missing-capability-escalation/index.js';

export {
  CAPABILITY_RESEARCH_ENGINE_PASS_TOKEN,
  CAPABILITY_RESEARCH_ENGINE_OWNER_MODULE,
  DEFAULT_MAX_RESEARCH_HISTORY_SIZE,
  RESEARCH_QUESTION_SIGNALS,
  isCapabilityResearchQuestion,
} from './capability-research-types.js';

export type {
  CapabilityResearchDecision,
  CapabilityDomain,
  CapabilityGapType,
  CapabilityRootCauseType,
  DuplicateRisk,
  CapabilityResearchRecord,
  CapabilityResearchInput,
  DomainClassificationResult,
  CapabilityGapResearchResult,
  CapabilityEvidenceResult,
  CapabilitySimilarityResult,
  CapabilityRootCauseResearchResult,
  CapabilityResearchReport,
  CapabilityResearchHistoryEntry,
  CapabilityResearchRuntimeReport,
} from './capability-research-types.js';

export {
  registerCapabilityResearch,
  getCapabilityResearch,
  listCapabilityResearch,
  listCapabilityResearchByDomain,
  listCapabilityResearchByDecision,
  getCapabilityResearchCount,
  resetCapabilityResearchRegistryForTests,
} from './capability-research-registry.js';

export { classifyCapabilityDomain, getDomainClassificationCount, resetDomainClassifierForTests } from './capability-domain-classifier.js';
export { analyzeCapabilityEvidence, getEvidenceAnalyzedCount, resetEvidenceAnalyzerForTests } from './capability-evidence-analyzer.js';
export { researchCapabilityGap } from './capability-gap-researcher.js';
export { analyzeCapabilitySimilarity, getDuplicateCheckCount, resetSimilarityAnalyzerForTests } from './capability-similarity-analyzer.js';
export { researchCapabilityRootCause, getRootCauseAnalysisCount, resetRootCauseResearcherForTests } from './capability-root-cause-researcher.js';
export { buildCapabilityResearchDecision, getResearchDecisionCount, resetResearchDecisionEngineForTests } from './capability-research-decision-engine.js';
export type { CapabilityResearchDecisionResult } from './capability-research-decision-engine.js';
export {
  recordCapabilityResearchHistory,
  getCapabilityResearchHistory,
  getCapabilityResearchHistorySize,
  resetCapabilityResearchHistoryForTests,
} from './capability-research-history.js';
export { generateCapabilityResearchReport, resetCapabilityResearchReportCounterForTests } from './capability-research-reporting.js';
export { getCapabilityResearchCacheStats, resetCapabilityResearchCacheForTests } from './capability-research-cache.js';

export {
  getDevPulseV2CapabilityResearchEngine,
  registerCapabilityResearchEngineWithCentralBrain,
  registerCapabilityResearchEngineWithProjectVault,
  registerCapabilityResearchEngineWithTrustEngine,
  registerCapabilityResearchEngineWithMissingCapabilityEscalation,
  registerCapabilityResearchEngineWithUvl,
  registerCapabilityResearchEngineWithAutonomousTesting,
  registerCapabilityResearchEngineWithAutonomousFixing,
  registerCapabilityResearchEngineWithAutonomousVerification,
  registerCapabilityResearchEngineWithCompletionEngine,
  registerCapabilityResearchEngineWithMultiProjectMonitoring,
  evaluateCapabilityResearch,
  getCapabilityResearchEngineRuntimeReport,
  resetCapabilityResearchEngineForTests,
} from './capability-research-engine.js';

export type { CapabilityResearchEngineSystemSnapshot } from './capability-research-engine.js';

export function resetCapabilityResearchEngineModuleForTests(): void {
  resetCapabilityResearchRegistryForTests();
  resetCapabilityResearchCacheForTests();
  resetDomainClassifierForTests();
  resetEvidenceAnalyzerForTests();
  resetSimilarityAnalyzerForTests();
  resetRootCauseResearcherForTests();
  resetResearchDecisionEngineForTests();
  resetCapabilityResearchHistoryForTests();
  resetCapabilityResearchReportCounterForTests();
  resetCapabilityResearchEngineForTests();
  resetMissingCapabilityEscalationModuleForTests();
}
