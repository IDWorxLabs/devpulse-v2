/**
 * Planning Brief Generator — public API (V1).
 */

export {
  PLANNING_BRIEF_GENERATOR_V1_PASS,
  PLANNING_BRIEF_GENERATOR_OWNER_MODULE,
  PLANNING_BRIEF_GENERATOR_PHASE,
  PLANNING_BRIEF_GENERATOR_REPORT_TITLE,
  MAX_PLANNING_BRIEF_HISTORY,
  PLATFORM_TARGETS,
  PLANNING_BRIEF_QUALITY_LEVELS,
  PLANNING_BRIEF_READINESS_LEVELS,
  SAFETY_GUARANTEES,
} from './planning-brief-registry.js';

export type {
  PlatformTarget,
  PlanningBriefQuality,
  PlanningBriefReadiness,
  PlanningBriefProjectSummary,
  PlanningBriefScreenItem,
  PlanningBriefWorkflowItem,
  PlanningBriefGapItem,
  PlanningBrief,
  PlanningBriefHistoryEntry,
  PlanningBriefGeneratorReport,
  GeneratePlanningBriefInput,
  PlanningBriefGeneration,
  PlanningBriefEvidenceBundle,
} from './planning-brief-types.js';

export {
  resetPlanningBriefHistoryForTests,
  recordPlanningBrief,
  getPlanningBriefHistorySize,
  getPlanningBriefHistory,
  getPlanningBriefs,
  getLatestPlanningBrief,
} from './planning-brief-history.js';

export {
  generatePlanningBrief,
  runPlanningBriefGenerator,
  buildPlanningBriefGeneratorArtifacts,
  resetPlanningBriefGeneratorModuleForTests,
} from './planning-brief-authority.js';

export {
  buildPlanningBriefGeneratorReport,
  buildPlanningBriefGeneratorReportMarkdown,
} from './planning-brief-report-builder.js';

export { buildPlanningBrief, resetPlanningBriefCounterForTests } from './planning-brief-builder.js';
export {
  buildPlanningBriefEvidenceBundle,
  summarizeProjectScope,
  summarizePlatformTargets,
  propagatePlatformTargets,
} from './project-scope-summarizer.js';
export { buildScreenInventory } from './screen-inventory-builder.js';
export { summarizeWorkflows } from './workflow-summarizer.js';
export {
  summarizeUserRoles,
  summarizeBusinessRules,
  summarizeIntegrations,
  buildKnownGaps,
} from './requirement-summary-builder.js';
export {
  validatePlanningBrief,
  isPlanningBriefStructurallyValid,
  mapPlanningBriefQuality,
  mapPlanningBriefReadiness,
} from './planning-brief-validator.js';
