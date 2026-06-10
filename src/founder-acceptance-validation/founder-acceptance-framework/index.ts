/**
 * Founder Acceptance Framework — public exports.
 */

import { resetFounderAcceptanceRegistryForTests } from './founder-acceptance-registry.js';
import { resetFounderAcceptanceCacheForTests } from './founder-acceptance-cache.js';
import { resetFounderAcceptanceDimensionsForTests } from './founder-acceptance-dimensions.js';
import { resetFounderAcceptanceCriteriaRegistryForTests } from './founder-acceptance-criteria-registry.js';
import { resetFounderAcceptanceCategoryBuilderForTests } from './founder-acceptance-category-builder.js';
import { resetFounderAcceptanceEvidenceModelForTests } from './founder-acceptance-evidence-model.js';
import { resetFounderAcceptanceScoringModelForTests } from './founder-acceptance-scoring-model.js';
import { resetFounderAcceptanceReportModelForTests } from './founder-acceptance-report-model.js';
import { resetFounderAcceptanceAuthorityBuilderForTests } from './founder-acceptance-authority-builder.js';
import { resetFounderAcceptanceEvaluatorForTests } from './founder-acceptance-evaluator.js';
import { resetFounderAcceptanceHistoryForTests } from './bounded-history.js';
import { resetFounderAcceptanceFrameworkOrchestrationForTests } from './founder-acceptance-framework.js';

export {
  FOUNDER_ACCEPTANCE_FRAMEWORK_PASS_TOKEN,
  FOUNDER_ACCEPTANCE_FRAMEWORK_PASS,
  FOUNDER_ACCEPTANCE_OWNER_MODULE,
  DEFAULT_MAX_FOUNDER_ACCEPTANCE_HISTORY_SIZE,
  MAX_CRITERIA_PER_GROUP,
  MAX_CATEGORIES,
  DIMENSION_REGISTRY_PASS,
  CRITERIA_REGISTRY_PASS,
  CATEGORY_REGISTRY_PASS,
  EVIDENCE_MODEL_PASS,
  SCORING_MODEL_PASS,
  REPORT_MODEL_PASS,
  AUTHORITY_PASS,
  ROADMAP_PASS,
  FOUNDER_ACCEPTANCE_QUESTION_SIGNALS,
  isFounderAcceptanceFrameworkQuestion,
  clampWeight,
} from './founder-acceptance-types.js';

export type {
  FounderAcceptanceDimensionId,
  CriteriaGroupId,
  AcceptanceCategoryId,
  FutureEvidenceSourceId,
  FrameworkCompleteness,
  FounderAcceptanceDimension,
  DimensionRegistry,
  AcceptanceCriterion,
  CriteriaGroup,
  CriteriaRegistry,
  FounderAcceptanceCategory,
  CategoryRegistry,
  FounderAcceptanceEvidenceSlot,
  FounderAcceptanceEvidenceModel,
  DimensionScoreSlot,
  CategoryScoreSlot,
  FounderAcceptanceScoreModel,
  FounderAcceptanceReportModel,
  FutureIntegrationPhase,
  FounderAcceptanceFutureRoadmap,
  FounderAcceptanceFrameworkAuthority,
  FounderAcceptanceFramework,
  FounderAcceptanceFrameworkResult,
  FounderAcceptanceRecord,
  FounderAcceptanceFrameworkInput,
  FounderAcceptanceFrameworkBundle,
  FounderAcceptanceRuntimeReport,
} from './founder-acceptance-types.js';

export { getFounderAcceptanceCacheStats, resetFounderAcceptanceCacheForTests } from './founder-acceptance-cache.js';

export {
  registerFounderAcceptanceRecord,
  getFounderAcceptanceRecord,
  lookupFounderAcceptanceByProjectId,
  listFounderAcceptanceRecords,
  getFounderAcceptanceRecordCount,
  resetFounderAcceptanceRegistryForTests,
} from './founder-acceptance-registry.js';

export {
  buildDimensionRegistry,
  listFounderAcceptanceDimensionIds,
  getDimensionRegistryBuilds,
  resetFounderAcceptanceDimensionsForTests,
} from './founder-acceptance-dimensions.js';

export {
  buildCriteriaRegistry,
  getCriteriaRegistryBuilds,
  resetFounderAcceptanceCriteriaRegistryForTests,
} from './founder-acceptance-criteria-registry.js';

export {
  buildCategoryRegistry,
  getCategoryBuilds,
  resetFounderAcceptanceCategoryBuilderForTests,
} from './founder-acceptance-category-builder.js';

export {
  buildFounderAcceptanceEvidenceModel,
  getEvidenceModelBuilds,
  resetFounderAcceptanceEvidenceModelForTests,
} from './founder-acceptance-evidence-model.js';

export {
  buildFounderAcceptanceScoreModel,
  getScoringModelBuilds,
  resetFounderAcceptanceScoringModelForTests,
} from './founder-acceptance-scoring-model.js';

export {
  buildFounderAcceptanceReportModel,
  getReportModelBuilds,
  resetFounderAcceptanceReportModelForTests,
} from './founder-acceptance-report-model.js';

export {
  buildFounderAcceptanceFutureRoadmap,
  buildFounderAcceptanceFrameworkAuthority,
  getAuthorityBuilds,
  getRoadmapBuilds,
  resetFounderAcceptanceAuthorityBuilderForTests,
} from './founder-acceptance-authority-builder.js';

export {
  evaluateFounderAcceptanceFramework,
  getEvaluationCount,
  resetFounderAcceptanceEvaluatorForTests,
} from './founder-acceptance-evaluator.js';

export {
  recordFounderAcceptanceHistory,
  getFounderAcceptanceHistory,
  getFounderAcceptanceHistorySize,
  clearFounderAcceptanceHistory,
  resetFounderAcceptanceHistoryForTests,
} from './bounded-history.js';

export {
  getDevPulseV2FounderAcceptanceFramework,
  registerFounderAcceptanceFrameworkWithSurface,
  registerFounderAcceptanceFrameworkWithFoundation,
  registerFounderAcceptanceFrameworkWithCapabilityRegistry,
  registerFounderAcceptanceFrameworkWithFindPanel,
  registerFounderAcceptanceFrameworkWithUvl,
  registerFounderAcceptanceFrameworkWithProductRealityChain,
  buildFounderAcceptanceFramework,
  getFounderAcceptanceFrameworkRuntimeReport,
} from './founder-acceptance-framework.js';

export type { FounderAcceptanceSurfaceSnapshot } from './founder-acceptance-framework.js';

export function resetFounderAcceptanceFrameworkForTests(): void {
  resetFounderAcceptanceRegistryForTests();
  resetFounderAcceptanceCacheForTests();
  resetFounderAcceptanceDimensionsForTests();
  resetFounderAcceptanceCriteriaRegistryForTests();
  resetFounderAcceptanceCategoryBuilderForTests();
  resetFounderAcceptanceEvidenceModelForTests();
  resetFounderAcceptanceScoringModelForTests();
  resetFounderAcceptanceReportModelForTests();
  resetFounderAcceptanceAuthorityBuilderForTests();
  resetFounderAcceptanceEvaluatorForTests();
  resetFounderAcceptanceHistoryForTests();
  resetFounderAcceptanceFrameworkOrchestrationForTests();
}
