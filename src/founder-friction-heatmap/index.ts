export {
  FOUNDER_FRICTION_HEATMAP_PASS_TOKEN,
  FOUNDER_FRICTION_HEATMAP_OWNER_MODULE,
  MAX_FRICTION_HOTSPOTS,
  MAX_FRICTION_DEAD_ENDS,
  MAX_FRICTION_RANKINGS,
  MAX_FRICTION_SCENARIOS,
  MAX_FRICTION_UX_IMPROVEMENTS,
} from './founder-friction-heatmap-bounds.js';

export type {
  FrictionCategory,
  FrictionLevel,
  ExplanationDependency,
  FrictionCategoryScore,
  FrictionHotspot,
  FrictionDeadEnd,
  FrictionExplanationScreen,
  FrictionHeatmapScenarioResult,
  FounderFrictionHeatmapSummary,
  FounderFrictionHeatmapAssessment,
  FounderFrictionHeatmapShellSources,
  AssessFounderFrictionHeatmapInput,
  FounderFrictionHeatmapVisibility,
} from './founder-friction-heatmap-types.js';

export {
  assessFounderFrictionHeatmap,
  evaluateFounderFrictionHeatmapVisibility,
  founderFrictionHeatmapResolved,
} from './founder-friction-heatmap-authority.js';
