/**
 * AiDevEngine Founder Testing Mode V4 — report types.
 */

import type { ChangeIntelligenceVisibilityAssessment } from '../change-intelligence-visibility/change-intelligence-visibility-types.js';
import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { VerificationResultsVisibilityAssessment } from '../verification-results-visibility/verification-results-visibility-types.js';
import type { FounderTestV3Report } from './founder-testing-v3-types.js';
import type { FounderTestIssue } from './founder-testing-types.js';

export type JourneyStageStatus = 'Exists' | 'Partially Exists' | 'Missing';
export type PromiseSupportLevel = 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'NOT_SUPPORTED';
export type RealityGapType =
  | 'FOUNDATION_GAP'
  | 'EXECUTION_GAP'
  | 'WORKFLOW_GAP'
  | 'UX_GAP'
  | 'INTELLIGENCE_GAP'
  | 'LAUNCH_GAP';

export type FounderTestV4Verdict =
  | 'FOUNDATION_ONLY'
  | 'PRODUCT_DIRECTION_VALID'
  | 'EXECUTION_GAPS_PRESENT'
  | 'READY_FOR_INTERNAL_PRODUCT_USE'
  | 'READY_FOR_LIMITED_CUSTOMERS'
  | 'READY_FOR_PUBLIC_BETA'
  | 'READY_FOR_LAUNCH';

export interface CreationJourneyStageResult {
  stage: string;
  status: JourneyStageStatus;
  evidence: string;
}

export interface IdeaToAppResult {
  prompt: string;
  understandsRequest: boolean;
  canCreateProject: boolean;
  canCreateRequirements: boolean;
  canCreatePlan: boolean;
  routesToExecution: boolean;
  routesToVerification: boolean;
  explainsNextSteps: boolean;
  ideaToAppScore: number;
  responsePreview: string;
  issues: string[];
}

export interface AutonomousBuilderReality {
  score: number;
  canPlanWork: boolean;
  canCreateRequirements: boolean;
  canCreateArchitecture: boolean;
  canCreateTasks: boolean;
  canCoordinateSystems: boolean;
  canCreatePreviews: boolean;
  canExecuteBuilds: boolean;
  canVerifyOutputs: boolean;
  honestyNote: string;
}

export interface ProjectMemoryReality {
  score: number;
  retainsContext: boolean;
  recallsRequirements: boolean;
  understandsState: boolean;
  plansFutureWork: boolean;
  referencesVerificationHistory: boolean;
}

export interface ChangeIntelligenceVisibility {
  score: number;
  hasSufficientHistory: boolean;
  historyExistsPass: boolean;
  improvementsVisiblePass: boolean;
  regressionsVisiblePass: boolean;
  readinessExplainedPass: boolean;
  scoreExplainedPass: boolean;
  timelineUnderstandablePass: boolean;
  recommendationsPrioritizedPass: boolean;
  improvementCount: number;
  regressionCount: number;
  recommendedReviewOrder: string[];
}

export interface FounderActionCenterVisibility {
  score: number;
  state: string;
  actionsExistPass: boolean;
  prioritiesVisiblePass: boolean;
  blockersVisiblePass: boolean;
  rationaleVisiblePass: boolean;
  impactVisiblePass: boolean;
  recommendationsActionablePass: boolean;
  noDuplicatesPass: boolean;
  noTechnicalOnlyPass: boolean;
  topActionCount: number;
  blockerCount: number;
  recommendedNextStep: string | null;
}

export interface VerificationResultsVisibility {
  score: number;
  state: string;
  stateExplicitPass: boolean;
  countsVisiblePass: boolean;
  categoriesGroupedPass: boolean;
  evidencePresentPass: boolean;
  nextActionVisiblePass: boolean;
  readinessExplainedPass: boolean;
  noOptimisticReadinessPass: boolean;
  passCount: number;
  failCount: number;
  blockedCount: number;
  warningCount: number;
  betaReady: boolean;
  launchReady: boolean;
  fixesNext: string[];
}

export interface RunningAppVisibility {
  score: number;
  outputState: string;
  identifiablePass: boolean;
  outputStateExplicitPass: boolean;
  buildOutputVisiblePass: boolean;
  alignmentHonestPass: boolean;
  testReadinessExplicitPass: boolean;
  staleDetected: boolean;
  degradedDetected: boolean;
  readyForTestingPass: boolean;
  runningAppTitle: string;
  requestAlignment: string;
  testReadiness: string;
  alignmentReason: string;
  testReadinessReason: string;
  recommendedAction: string;
  warnings: string[];
}

export interface PreviewReality {
  score: number;
  state: string;
  existsPass: boolean;
  loadsPass: boolean;
  interactivePass: boolean;
  currentPass: boolean;
  validationReadyPass: boolean;
  problems: string[];
  recommendedActions: string[];
  summaryLines: string[];
  falsePositiveReadiness: boolean;
  launchPathExists: boolean;
  stateUnderstandable: boolean;
  readinessVisible: boolean;
  connectedToLifecycle: boolean;
}

export interface VerificationReality {
  score: number;
  pathExists: boolean;
  resultsUnderstandable: boolean;
  actionsProvided: boolean;
  launchReadinessSupported: boolean;
}

export interface RealityGap {
  gapType: RealityGapType;
  promise: string;
  reality: string;
  detail: string;
}

export interface PromiseRealityEntry {
  promiseId: string;
  label: string;
  support: PromiseSupportLevel;
  evidence: string;
}

export interface OutcomeSimulation {
  persona: 'Founder' | 'Customer';
  goal: string;
  whatHappensToday: string;
  succeeds: string[];
  fails: string[];
  requiresManualWork: string[];
  missing: string[];
  valueDelivered: boolean;
}

export interface LaunchReadinessReality {
  technicalReadiness: number;
  productReadiness: number;
  humanReadiness: number;
  executionReadiness: number;
  promiseAlignment: number;
  launchReadinessRealityScore: number;
}

export interface FounderTestV4Report {
  reportId: string;
  generatedAt: number;
  durationMs: number;
  readOnly: true;
  mode: 'founder-testing-v4';
  v3: FounderTestV3Report;
  creationJourneyScore: number;
  creationJourney: CreationJourneyStageResult[];
  ideaToAppScore: number;
  ideaToAppResults: IdeaToAppResult[];
  autonomousBuilderReality: AutonomousBuilderReality;
  projectMemoryReality: ProjectMemoryReality;
  previewReality: PreviewReality;
  runningAppVisibility: RunningAppVisibility;
  verificationResultsVisibility: VerificationResultsVisibilityAssessment;
  verificationResultsVisibilityScore: VerificationResultsVisibility;
  changeIntelligenceVisibility: ChangeIntelligenceVisibilityAssessment;
  changeIntelligenceVisibilityScore: ChangeIntelligenceVisibility;
  founderActionCenter: FounderActionCenterAssessment;
  founderActionCenterVisibilityScore: FounderActionCenterVisibility;
  verificationReality: VerificationReality;
  promiseMatrix: PromiseRealityEntry[];
  realityGaps: RealityGap[];
  founderOutcome: OutcomeSimulation;
  customerOutcome: OutcomeSimulation;
  launchReadinessReality: LaunchReadinessReality;
  topProductRisks: string[];
  topLaunchRisks: string[];
  verdict: FounderTestV4Verdict;
  issues: FounderTestIssue[];
  recommendedFixOrder: string[];
  copyPasteFixPrompts: string[];
  reportMarkdown: string;
}

export interface RunFounderTestingModeV4Input {
  rootDir?: string;
  validatorScripts?: string[];
  liveResults?: import('./founder-testing-types.js').LiveScreenResultInput[];
  liveSection?: string;
}
