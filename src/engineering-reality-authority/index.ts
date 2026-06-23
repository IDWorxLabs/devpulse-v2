/**
 * Engineering Reality Authority V1 — public exports.
 */

export {
  ENGINEERING_REALITY_V1_PASS_TOKEN,
  ENGINEERING_REALITY_OWNER_MODULE,
  ENGINEERING_REALITY_PHASE,
  ENGINEERING_REALITY_MIN_LAUNCH_SCORE,
  ENGINEERING_SUITE_APPS,
} from './engineering-reality-registry.js';

export type {
  SecurityVerdict,
  PerformanceVerdict,
  AccessibilityVerdict,
  EngineeringRealityVerdict,
  EngineeringRealityCheck,
  EngineeringBuildAnalysis,
  EngineeringLoadAnalysis,
  EngineeringRuntimeHealth,
  EngineeringSecurityAnalysis,
  EngineeringPerformanceAnalysis,
  EngineeringAccessibilityAnalysis,
  EngineeringRealityScores,
  EngineeringRealityAssessment,
  RunEngineeringRealityValidationInput,
} from './engineering-reality-types.js';

export { analyzeEngineeringBuild } from './engineering-build-analyzer.js';
export {
  runEngineeringRuntimeChecks,
  createPlaywrightEngineeringValidationPage,
} from './engineering-reality-runner.js';

export {
  computeEngineeringRealityScores,
  deriveEngineeringRealityVerdict,
  resolveEngineeringLaunchBlock,
  buildEngineeringRealityAssessment,
} from './engineering-reality-scoring.js';

export {
  runEngineeringRealityValidation,
  getLastEngineeringRealityAssessment,
  resetEngineeringRealityAssessmentForTests,
} from './engineering-reality-authority.js';

export { formatEngineeringRealityReportMarkdown } from './engineering-reality-report.js';

export { mapEngineeringRealityLaunchCouncilAuthority } from './engineering-reality-integration.js';
