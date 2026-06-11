/**
 * AiDevEngine Founder Testing Mode V1 — public exports.
 */

export {
  FOUNDER_TESTING_MODE_OWNER_MODULE,
  FOUNDER_TESTING_MODE_PASS_TOKEN,
  FOUNDER_TESTING_MODE_PASS_WITH_LIMITATIONS_TOKEN,
  FOUNDER_TEST_MAX_SCREENS,
  FOUNDER_TEST_MAX_PROMPTS,
  FOUNDER_TEST_MAX_SCREEN_MS,
  FOUNDER_TEST_MAX_TOTAL_MS,
  FOUNDER_TEST_REPORT_TITLE,
} from './founder-testing-bounds.js';

export type {
  FinalVerdict,
  FounderTestCheck,
  FounderTestIssue,
  FounderTestReport,
  FounderTestScores,
  IssueSeverity,
  LiveScreenResultInput,
  PromptTestResult,
  ScreenTestResult,
  VisualUxFinding,
  WorkflowTestResult,
} from './founder-testing-types.js';

export { FOUNDER_TEST_PROMPTS, FOUNDER_TEST_SCREENS } from './founder-testing-nav-spec.js';
export { runBoundedPromptChecks } from './founder-testing-prompt-checker.js';
export { buildFounderTestReportMarkdown, assembleFounderTestReport } from './founder-testing-report-builder.js';
export { computeScores, deriveVerdict, buildRecommendedFixOrder } from './founder-testing-scorer.js';
export {
  checkNavigation,
  checkAllScreensStatic,
  checkWorkflowContinuity,
  checkVisualUx,
} from './founder-testing-screen-checker.js';
export { runFounderTestingMode, type RunFounderTestingModeInput } from './founder-testing-orchestrator.js';

export {
  FOUNDER_TESTING_MODE_V2_OWNER_MODULE,
  FOUNDER_TESTING_MODE_V2_PASS_TOKEN,
  FOUNDER_TESTING_MODE_V2_PASS_WITH_LIMITATIONS_TOKEN,
  FOUNDER_TEST_V2_MAX_SCREENS,
  FOUNDER_TEST_V2_MAX_PROMPTS,
  FOUNDER_TEST_V2_MAX_TOTAL_MS,
  FOUNDER_TEST_V2_REPORT_TITLE,
  FOUNDER_TEST_V2_PROMPTS,
} from './founder-testing-v2-bounds.js';

export type {
  FounderTestV2Report,
  FounderTestV2Verdict,
  ProductReadinessReality,
  FounderApprovalPrediction,
  ConfusionRisk,
  ScreenPurposeResult,
  PromptVisionResult,
  RunFounderTestingModeV2Input,
} from './founder-testing-v2-types.js';

export { assessArchitectureLeakage, type ArchitectureLeakageLevel } from './founder-proxy-architecture-leakage.js';
export {
  assessProjectIntelligenceClarity,
  type ProjectIntelligenceClarityAssessment,
  type ProjectIntelligenceClarityCheck,
} from './project-intelligence-clarity.js';
export {
  scoreVisionAlignment,
  evaluateScreenPurpose,
  detectConfusionRisks,
  evaluatePromptVision,
  predictFounderApproval,
} from './founder-proxy-evaluator.js';
export { runBoundedPromptVisionChecks } from './founder-testing-prompt-vision-checker.js';
export { deriveV2Verdict } from './founder-testing-v2-scorer.js';
export { buildFounderTestV2ReportMarkdown, assembleFounderTestV2Report } from './founder-testing-v2-report-builder.js';
export { runFounderTestingModeV2 } from './founder-testing-v2-orchestrator.js';
export { PRODUCT_VISION_BASELINE } from './founder-testing-vision-baseline.js';

export {
  FOUNDER_TESTING_MODE_V3_OWNER_MODULE,
  FOUNDER_TESTING_MODE_V3_PASS_TOKEN,
  FOUNDER_TESTING_MODE_V3_PASS_WITH_LIMITATIONS_TOKEN,
  FOUNDER_TEST_V3_MAX_PERSONAS,
  FOUNDER_TEST_V3_MAX_PROMPTS,
  FOUNDER_TEST_V3_MAX_SCREENS,
  FOUNDER_TEST_V3_MAX_GOALS,
  FOUNDER_TEST_V3_MAX_TOTAL_MS,
  FOUNDER_TEST_V3_REPORT_TITLE,
  HUMAN_MISTAKE_PROMPTS,
  HUMAN_GOAL_DEFINITIONS,
} from './founder-testing-v3-bounds.js';

export type {
  FounderTestV3Report,
  FounderTestV3Verdict,
  HumanPersonaSimulation,
  CuriosityPathResult,
  MistakePromptResult,
  PatienceAssessment,
  TrustEvent,
  GoalCompletionResult,
  HumanConfusionFinding,
  LaunchReadinessSignals,
  RunFounderTestingModeV3Input,
  FrustrationRiskLevel,
  ConfusionSeverity,
} from './founder-testing-v3-types.js';

export { DEFAULT_FOUNDER_PREFERENCE_MODEL, type FounderPreferenceModel } from './founder-preference-model.js';
export {
  simulatePersonas,
  simulateCuriosityPaths,
  simulateMistakePrompts,
  assessHumanPatience,
  buildTrustSimulation,
  simulateGoalCompletion,
  detectHumanConfusion,
  computeLaunchReadinessSignals,
} from './human-behavior-simulation-engine.js';
export { deriveV3Verdict } from './founder-testing-v3-scorer.js';
export { buildFounderTestV3ReportMarkdown, assembleFounderTestV3Report } from './founder-testing-v3-report-builder.js';
export { runFounderTestingModeV3 } from './founder-testing-v3-orchestrator.js';

export {
  FOUNDER_TESTING_MODE_V4_OWNER_MODULE,
  FOUNDER_TESTING_MODE_V4_PASS_TOKEN,
  FOUNDER_TESTING_MODE_V4_PASS_WITH_LIMITATIONS_TOKEN,
  FOUNDER_TEST_V4_MAX_PROMPTS,
  FOUNDER_TEST_V4_MAX_SCREENS,
  FOUNDER_TEST_V4_MAX_WORKFLOWS,
  FOUNDER_TEST_V4_MAX_PROMISES,
  FOUNDER_TEST_V4_MAX_TOTAL_MS,
  FOUNDER_TEST_V4_REPORT_TITLE,
  CREATION_JOURNEY_STAGES,
  IDEA_TO_APP_PROMPTS,
} from './founder-testing-v4-bounds.js';

export type {
  FounderTestV4Report,
  FounderTestV4Verdict,
  CreationJourneyStageResult,
  IdeaToAppResult,
  AutonomousBuilderReality,
  ProjectMemoryReality,
  PreviewReality,
  RunningAppVisibility,
  VerificationResultsVisibility,
  ChangeIntelligenceVisibility,
  VerificationReality,
  PromiseRealityEntry,
  RealityGap,
  OutcomeSimulation,
  LaunchReadinessReality,
  RunFounderTestingModeV4Input,
} from './founder-testing-v4-types.js';

export {
  evaluateCreationJourney,
  evaluateIdeaToAppPrompts,
  evaluateAutonomousBuilderReality,
  evaluateProjectMemoryReality,
  evaluatePreviewReality,
  evaluateRunningAppVisibility,
  evaluateVerificationResultsVisibility,
  evaluateChangeIntelligenceVisibility,
  evaluateFounderActionCenterVisibility,
  evaluateVerificationReality,
  buildPromiseRealityMatrix,
  detectRealityGaps,
  simulateFounderOutcome,
  simulateCustomerOutcome,
} from './execution-reality-engine.js';
export { computeLaunchReadinessReality, deriveV4Verdict } from './founder-testing-v4-scorer.js';
export { buildFounderTestV4ReportMarkdown, assembleFounderTestV4Report } from './founder-testing-v4-report-builder.js';
export { runFounderTestingModeV4 } from './founder-testing-v4-orchestrator.js';

export {
  LIVE_PREVIEW_REALITY_PASS_TOKEN,
  assessLivePreviewReality,
  buildLivePreviewRealityInputFromWorkspace,
  type LivePreviewRealityAssessment,
  type LivePreviewRealityState,
} from '../live-preview-reality/index.js';

export {
  CHANGE_INTELLIGENCE_VISIBILITY_PASS_TOKEN,
  assessChangeIntelligenceVisibility,
  type ChangeIntelligenceVisibilityAssessment,
} from '../change-intelligence-visibility/index.js';

export {
  FOUNDER_ACTION_CENTER_PASS_TOKEN,
  assessFounderActionCenter,
  type FounderActionCenterAssessment,
} from '../founder-action-center/index.js';

export {
  VERIFICATION_RESULTS_VISIBILITY_PASS_TOKEN,
  assessVerificationResultsVisibility,
  buildVerificationResultsFromV4Report,
  buildVerificationResultsFromWorkspace,
  type VerificationResultsVisibilityAssessment,
  type VerificationResultsState,
} from '../verification-results-visibility/index.js';

export {
  RUNNING_APPLICATION_VISIBILITY_PASS_TOKEN,
  assessRunningApplicationVisibility,
  assessRunningApplicationVisibilityFromWorkspace,
  type RunningApplicationVisibilityAssessment,
  type RunningAppOutputState,
} from '../running-application-visibility/index.js';
