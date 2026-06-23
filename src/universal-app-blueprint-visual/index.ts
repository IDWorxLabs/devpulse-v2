/**
 * Universal App Blueprint Visual Validation Authority V1 — public API.
 */

export {
  UNIVERSAL_APP_BLUEPRINT_VISUAL_V1_PASS_TOKEN,
  UNIVERSAL_APP_BLUEPRINT_VISUAL_OWNER_MODULE,
  UNIVERSAL_APP_BLUEPRINT_VISUAL_PHASE,
  BLUEPRINT_VISUAL_MIN_LAUNCH_SCORE,
  VIEWPORTS,
} from './universal-app-blueprint-visual-registry.js';

export type {
  BlueprintVisualVerdict,
  BlueprintVisualCheck,
  BlueprintVisualScores,
  BlueprintVisualAssessment,
  RunBlueprintVisualValidationInput,
} from './universal-app-blueprint-visual-types.js';

export {
  computeBlueprintVisualScores,
  deriveBlueprintVisualVerdict,
  resolveBlueprintVisualLaunchBlock,
  buildBlueprintVisualAssessment,
} from './universal-app-blueprint-visual-scoring.js';

export {
  runUniversalAppBlueprintVisualValidation,
  getLastBlueprintVisualAssessment,
  resetBlueprintVisualAssessmentForTests,
} from './universal-app-blueprint-visual-authority.js';

export { formatBlueprintVisualReportMarkdown } from './universal-app-blueprint-visual-report.js';

export {
  mapUniversalAppBlueprintVisualLaunchCouncilAuthority,
  resolveBlueprintVisualValidationReady,
} from './universal-app-blueprint-visual-integration.js';
