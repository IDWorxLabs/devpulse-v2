/**
 * Founder Guides — public exports.
 */

import { resetFounderGuidesRegistryForTests } from './founder-guides-registry.js';
import { resetFounderGuidesCacheForTests } from './founder-guides-cache.js';
import { resetRoadmapGuideAnalyzerForTests } from './roadmap-guide-analyzer.js';
import { resetCheckpointGuideAnalyzerForTests } from './checkpoint-guide-analyzer.js';
import { resetSystemNavigationGuideAnalyzerForTests } from './system-navigation-guide-analyzer.js';
import { resetModificationSafetyGuideAnalyzerForTests } from './modification-safety-guide-analyzer.js';
import { resetEvolutionGuideAnalyzerForTests } from './evolution-guide-analyzer.js';
import { resetFounderGuidesAuthorityBuilderForTests } from './founder-guides-authority-builder.js';
import { resetFounderGuidesEvaluatorForTests } from './founder-guides-evaluator.js';
import { resetFounderGuidesHistoryForTests } from './founder-guides-history.js';
import { resetFounderGuidesReportingForTests } from './founder-guides-reporting.js';
import { resetFounderGuidesOrchestrationForTests } from './founder-guides.js';

export {
  FOUNDER_GUIDES_PASS_TOKEN,
  FOUNDER_GUIDES_OWNER_MODULE,
  DEFAULT_MAX_FOUNDER_GUIDES_HISTORY_SIZE,
  FOUNDER_GUIDES_QUESTION_SIGNALS,
  isFounderGuidesQuestion,
  resolveFounderGuideCompletenessLevel,
  resolveFounderGuideState,
} from './founder-guides-types.js';

export type {
  FounderGuideCompletenessLevel,
  FounderGuideState,
  FounderGuideRecord,
  RoadmapGuideAnalysis,
  CheckpointGuideAnalysis,
  SystemNavigationGuideAnalysis,
  ModificationSafetyGuideAnalysis,
  EvolutionGuideAnalysis,
  UnifiedFounderGuidesAuthority,
  FounderGuidesEvaluation,
  FounderGuidesHistoryEntry,
  FounderGuidesReport,
  FounderGuidesInput,
  FounderGuidesResult,
  FounderGuidesRuntimeReport,
} from './founder-guides-types.js';

export { getFounderGuidesCacheStats, resetFounderGuidesCacheForTests } from './founder-guides-cache.js';

export {
  registerFounderGuideRecord,
  getFounderGuideRecord,
  lookupGuideByProjectId,
  lookupGuideByWorkspaceId,
  lookupGuideByCompletenessLevel,
  lookupGuideByState,
  listFounderGuideRecords,
  getFounderGuideRecordCount,
  resetFounderGuidesRegistryForTests,
} from './founder-guides-registry.js';

export {
  analyzeRoadmapGuide,
  getRoadmapAnalysisCount,
  resetRoadmapGuideAnalyzerForTests,
} from './roadmap-guide-analyzer.js';

export type { RoadmapGuideSnapshot } from './roadmap-guide-analyzer.js';

export {
  analyzeCheckpointGuide,
  getCheckpointAnalysisCount,
  listBaseCheckpoints,
  resetCheckpointGuideAnalyzerForTests,
} from './checkpoint-guide-analyzer.js';

export type { CheckpointGuideSnapshot } from './checkpoint-guide-analyzer.js';

export {
  analyzeSystemNavigationGuide,
  getNavigationAnalysisCount,
  resetSystemNavigationGuideAnalyzerForTests,
} from './system-navigation-guide-analyzer.js';

export type { SystemNavigationGuideSnapshot } from './system-navigation-guide-analyzer.js';

export {
  analyzeModificationSafetyGuide,
  getSafetyAnalysisCount,
  listProtectedAreas,
  resetModificationSafetyGuideAnalyzerForTests,
} from './modification-safety-guide-analyzer.js';

export type { ModificationSafetyGuideSnapshot } from './modification-safety-guide-analyzer.js';

export {
  analyzeEvolutionGuide,
  getEvolutionAnalysisCount,
  listEvolutionAreas,
  resetEvolutionGuideAnalyzerForTests,
} from './evolution-guide-analyzer.js';

export type { EvolutionGuideSnapshot } from './evolution-guide-analyzer.js';

export {
  buildUnifiedFounderGuidesAuthority,
  getAuthorityBuildCount,
  resetFounderGuidesAuthorityBuilderForTests,
} from './founder-guides-authority-builder.js';

export {
  evaluateFounderGuides,
  getEvaluationCount,
  resetFounderGuidesEvaluatorForTests,
} from './founder-guides-evaluator.js';

export {
  recordFounderGuidesHistory,
  getFounderGuidesHistory,
  getFounderGuidesHistorySize,
  clearFounderGuidesHistory,
  resetFounderGuidesHistoryForTests,
} from './founder-guides-history.js';

export {
  generateFounderGuidesReport,
  getReportCount,
  resetFounderGuidesReportingForTests,
} from './founder-guides-reporting.js';

export {
  getDevPulseV2FounderGuides,
  registerFounderGuidesWithCentralBrain,
  registerFounderGuidesWithSelfDocumentation,
  registerFounderGuidesWithFoundation,
  registerFounderGuidesWithCapabilityRegistry,
  registerFounderGuidesWithFindPanel,
  registerFounderGuidesWithUvl,
  registerFounderGuidesWithRoadmap,
  registerFounderGuidesWithUnifiedTrustScore,
  registerFounderGuidesWithTrustEngineCheckpoint,
  registerFounderGuidesWithProductHardeningCheckpoint,
  registerFounderGuidesWithWorld2,
  registerFounderGuidesWithSelfEvolutionGovernance,
  registerFounderGuidesWithMissingCapabilityEscalation,
  evaluateFounderGuidesEngine,
  getFounderGuidesRuntimeReport,
} from './founder-guides.js';

export type { FounderGuidesSystemSnapshot } from './founder-guides.js';

export function resetFounderGuidesForTests(): void {
  resetFounderGuidesRegistryForTests();
  resetFounderGuidesCacheForTests();
  resetRoadmapGuideAnalyzerForTests();
  resetCheckpointGuideAnalyzerForTests();
  resetSystemNavigationGuideAnalyzerForTests();
  resetModificationSafetyGuideAnalyzerForTests();
  resetEvolutionGuideAnalyzerForTests();
  resetFounderGuidesAuthorityBuilderForTests();
  resetFounderGuidesEvaluatorForTests();
  resetFounderGuidesHistoryForTests();
  resetFounderGuidesReportingForTests();
  resetFounderGuidesOrchestrationForTests();
}
