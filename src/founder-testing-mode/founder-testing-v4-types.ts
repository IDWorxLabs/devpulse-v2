/**
 * AiDevEngine Founder Testing Mode V4 — report types.
 */

import type { ChangeIntelligenceVisibilityAssessment } from '../change-intelligence-visibility/change-intelligence-visibility-types.js';
import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { FounderSensemakingAssessment } from '../founder-sensemaking-engine/founder-sensemaking-types.js';
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

export interface FounderSensemakingVisibility {
  score: number;
  coherenceScore: number;
  findingsVisiblePass: boolean;
  contradictionsVisiblePass: boolean;
  trustRisksVisiblePass: boolean;
  upgradesVisiblePass: boolean;
  scoresExplainedPass: boolean;
  noFalseContradictionsPass: boolean;
  findingCount: number;
  contradictionCount: number;
  trustRiskCount: number;
  upgradeCount: number;
}

export interface FounderInteractionSimulationVisibility {
  score: number;
  interactionScore: number;
  scenariosRun: number;
  scenariosPassed: number;
  modalCloseRegressionPass: boolean;
  commandCenterReadableAfterClosePass: boolean;
  copyReportAvailablePass: boolean;
  sendInputUsableAfterClosePass: boolean;
  failureCount: number;
  blockedWorkflowCount: number;
}

export interface FirstTimeUserRealityVisibility {
  score: number;
  firstTimeUserScore: number;
  understandingScore: number;
  navigationScore: number;
  workflowScore: number;
  trustScore: number;
  simplicityScore: number;
  screenPurposeChecks: number;
  screenPurposePassCount: number;
  productUnderstandingPass: boolean;
  navigationUnderstandingPass: boolean;
  workflowClarityPass: boolean;
  trustFormationPass: boolean;
  cognitiveLoadPass: boolean;
  findingCount: number;
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

export interface ChatIntelligenceRealityVisibility {
  score: number;
  chatLaunchVerdict: import('../chat-intelligence-reality/chat-intelligence-reality-types.js').ChatLaunchVerdict;
  blocksLaunchReadiness: boolean;
  scenariosPassed: number;
  scenariosRun: number;
  failedScenarioCount: number;
  requiredFixesBeforeLaunch: string[];
  selfEvolutionTriggered: boolean;
}

export interface RepositoryTypecheckRealityVisibility {
  score: number;
  readinessState: import('../repository-typecheck-reality/repository-typecheck-reality-types.js').RepositoryTypecheckReadinessState;
  typecheckClean: boolean;
  blocksLaunchReadiness: boolean;
  errorCount: number;
  warningCount: number;
  findingCount: number;
  recommendations: string[];
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
  founderSensemaking: FounderSensemakingAssessment;
  founderSensemakingVisibilityScore: FounderSensemakingVisibility;
  founderInteractionSimulation: import('../founder-interaction-simulation/founder-interaction-simulation-types.js').FounderInteractionSimulationAssessment;
  founderInteractionSimulationScore: FounderInteractionSimulationVisibility;
  firstTimeUserReality: import('../first-time-user-reality/first-time-user-reality-types.js').FirstTimeUserRealityAssessment;
  firstTimeUserRealityScore: FirstTimeUserRealityVisibility;
  verificationTrustEvidence: import('../verification-trust-evidence/verification-trust-evidence-types.js').VerificationTrustEvidenceAssessment;
  verificationTrustEvidenceScore: import('../verification-trust-evidence/verification-trust-evidence-types.js').VerificationTrustEvidenceVisibility;
  founderFrictionHeatmap: import('../founder-friction-heatmap/founder-friction-heatmap-types.js').FounderFrictionHeatmapAssessment;
  founderFrictionHeatmapScore: import('../founder-friction-heatmap/founder-friction-heatmap-types.js').FounderFrictionHeatmapVisibility;
  customerJourneySimulation: import('../customer-journey-simulation/customer-journey-simulation-types.js').CustomerJourneySimulationAssessment;
  customerJourneySimulationScore: import('../customer-journey-simulation/customer-journey-simulation-types.js').CustomerJourneySimulationVisibility;
  promiseRealityEngine: import('../promise-reality-engine/promise-reality-engine-types.js').PromiseRealityEngineAssessment;
  promiseRealityEngineScore: import('../promise-reality-engine/promise-reality-engine-types.js').PromiseRealityVisibility;
  visualQualityAuthority: import('../visual-quality-authority/visual-quality-authority-types.js').VisualQualityAuthorityAssessment;
  visualQualityAuthorityScore: import('../visual-quality-authority/visual-quality-authority-types.js').VisualQualityVisibility;
  launchDaySimulation: import('../launch-day-simulation-engine/launch-day-simulation-engine-types.js').LaunchDaySimulationAssessment;
  launchDaySimulationScore: import('../launch-day-simulation-engine/launch-day-simulation-engine-types.js').LaunchDaySimulationVisibility;
  adoptionPrediction: import('../adoption-prediction-engine/adoption-prediction-engine-types.js').AdoptionPredictionAssessment;
  adoptionPredictionScore: import('../adoption-prediction-engine/adoption-prediction-engine-types.js').AdoptionPredictionVisibility;
  productEconomics: import('../product-economics-engine/product-economics-engine-types.js').ProductEconomicsAssessment;
  productEconomicsScore: import('../product-economics-engine/product-economics-engine-types.js').ProductEconomicsVisibility;
  productEvolution: import('../product-evolution-engine/product-evolution-engine-types.js').ProductEvolutionAssessment;
  productEvolutionScore: import('../product-evolution-engine/product-evolution-engine-types.js').ProductEvolutionVisibility;
  competitiveReality: import('../competitive-reality-engine/competitive-reality-engine-types.js').CompetitiveRealityAssessment;
  competitiveRealityScore: import('../competitive-reality-engine/competitive-reality-engine-types.js').CompetitiveRealityVisibility;
  founderDecisionReadiness: import('../founder-decision-readiness/founder-decision-readiness-types.js').FounderDecisionReadinessAssessment;
  founderDecisionReadinessScore: import('../founder-decision-readiness/founder-decision-readiness-types.js').FounderDecisionReadinessVisibility;
  digitalFounderBoard: import('../digital-founder-board/digital-founder-board-types.js').DigitalFounderBoardAssessment;
  digitalFounderBoardScore: import('../digital-founder-board/digital-founder-board-types.js').DigitalFounderBoardVisibility;
  verificationReality: VerificationReality;
  promiseMatrix: PromiseRealityEntry[];
  realityGaps: RealityGap[];
  founderOutcome: OutcomeSimulation;
  customerOutcome: OutcomeSimulation;
  launchReadinessReality: LaunchReadinessReality;
  chatIntelligenceReality: import('../chat-intelligence-reality/chat-intelligence-reality-types.js').ChatIntelligenceRealityAssessment;
  chatIntelligenceRealityScore: ChatIntelligenceRealityVisibility;
  repositoryTypecheckReality: import('../repository-typecheck-reality/repository-typecheck-reality-types.js').RepositoryTypecheckAssessment;
  repositoryTypecheckRealityScore: RepositoryTypecheckRealityVisibility;
  skepticalFounderSimulator: import('../skeptical-founder-simulator/skeptical-founder-types.js').SkepticalFounderAssessment;
  skepticalFounderReportMarkdown: string;
  promiseFulfillment: import('../promise-fulfillment-authority/promise-fulfillment-types.js').PromiseFulfillmentAssessment;
  promiseFulfillmentReportMarkdown: string;
  trustAuthority: import('../trust-authority/trust-authority-types.js').TrustAssessment;
  trustAuthorityReportMarkdown: string;
  selfAwarenessAuthority: import('../self-awareness-authority/self-awareness-types.js').SelfAwarenessAssessment;
  selfAwarenessAuthorityReportMarkdown: string;
  userSuccessAuthority: import('../user-success-authority/user-success-types.js').UserSuccessAssessment;
  userSuccessAuthorityReportMarkdown: string;
  gapDetectionAuthority: import('../gap-detection-authority/gap-detection-types.js').GapDetectionAssessment;
  gapDetectionAuthorityReportMarkdown: string;
  selfEvolutionAuthority: import('../self-evolution-authority/self-evolution-types.js').SelfEvolutionAssessment;
  selfEvolutionAuthorityReportMarkdown: string;
  unknownDiscoveryAuthority: import('../unknown-discovery-authority/unknown-discovery-types.js').UnknownDiscoveryAssessment;
  unknownDiscoveryAuthorityReportMarkdown: string;
  firstTimeUserRealityAuthority: import('../first-time-user-reality-authority/first-time-user-reality-types.js').FirstTimeUserRealityAssessment;
  firstTimeUserRealityAuthorityReportMarkdown: string;
  customerValueAuthority: import('../customer-value-authority/customer-value-types.js').CustomerValueAssessment;
  customerValueAuthorityReportMarkdown: string;
  competitiveRealityAuthority: import('../competitive-reality-authority/competitive-reality-types.js').CompetitiveRealityAssessment;
  competitiveRealityAuthorityReportMarkdown: string;
  realityProofAuthority: import('../reality-proof-authority/reality-proof-types.js').RealityProofAssessment;
  realityProofAuthorityReportMarkdown: string;
  realUserRealityAuthority: import('../real-user-reality-authority/real-user-reality-types.js').RealUserRealityAssessment;
  realUserRealityAuthorityReportMarkdown: string;
  adoptionPredictionAuthority: import('../adoption-prediction-authority/adoption-prediction-types.js').AdoptionPredictionAssessment;
  adoptionPredictionAuthorityReportMarkdown: string;
  launchReadinessAuthority: import('../launch-readiness-authority/launch-readiness-types.js').LaunchReadinessAuthorityAssessment;
  launchReadinessAuthorityReportMarkdown: string;
  uiReviewerAuthority: import('../ui-reviewer-authority/ui-reviewer-types.js').UIReviewerAssessment;
  uiReviewerAuthorityReportMarkdown: string;
  clarifyingQuestionIntelligence: import('../clarifying-question-intelligence/clarifying-question-types.js').ClarifyingQuestionAssessment;
  clarifyingQuestionIntelligenceReportMarkdown: string;
  launchCouncil: import('../launch-council/launch-council-types.js').LaunchCouncilAssessment;
  launchCouncilReport: import('../launch-council/launch-council-types.js').LaunchCouncilReport;
  launchCouncilReportMarkdown: string;
  launchCouncilFinalization: import('../launch-council-finalization/launch-council-finalization-types.js').LaunchCouncilFinalizationAssessment;
  launchCouncilFinalizationReportMarkdown: string;
  launchVerdictGovernance: import('../launch-verdict-governance/launch-verdict-governance-types.js').LaunchVerdictGovernanceAssessment;
  launchVerdictGovernanceReportMarkdown: string;
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
  repositoryTypecheckReality?: import('../repository-typecheck-reality/repository-typecheck-reality-types.js').RepositoryTypecheckAssessment;
}

export type FounderTestV4ReportCore = Omit<
  FounderTestV4Report,
  | 'reportMarkdown'
  | 'skepticalFounderSimulator'
  | 'skepticalFounderReportMarkdown'
  | 'promiseFulfillment'
  | 'promiseFulfillmentReportMarkdown'
  | 'trustAuthority'
  | 'trustAuthorityReportMarkdown'
  | 'selfAwarenessAuthority'
  | 'selfAwarenessAuthorityReportMarkdown'
  | 'userSuccessAuthority'
  | 'userSuccessAuthorityReportMarkdown'
  | 'gapDetectionAuthority'
  | 'gapDetectionAuthorityReportMarkdown'
  | 'selfEvolutionAuthority'
  | 'selfEvolutionAuthorityReportMarkdown'
  | 'unknownDiscoveryAuthority'
  | 'unknownDiscoveryAuthorityReportMarkdown'
  | 'firstTimeUserRealityAuthority'
  | 'firstTimeUserRealityAuthorityReportMarkdown'
  | 'customerValueAuthority'
  | 'customerValueAuthorityReportMarkdown'
  | 'competitiveRealityAuthority'
  | 'competitiveRealityAuthorityReportMarkdown'
  | 'realityProofAuthority'
  | 'realityProofAuthorityReportMarkdown'
  | 'realUserRealityAuthority'
  | 'realUserRealityAuthorityReportMarkdown'
  | 'adoptionPredictionAuthority'
  | 'adoptionPredictionAuthorityReportMarkdown'
  | 'launchReadinessAuthority'
  | 'launchReadinessAuthorityReportMarkdown'
  | 'uiReviewerAuthority'
  | 'uiReviewerAuthorityReportMarkdown'
  | 'clarifyingQuestionIntelligence'
  | 'clarifyingQuestionIntelligenceReportMarkdown'
  | 'launchCouncil'
  | 'launchCouncilReport'
  | 'launchCouncilReportMarkdown'
  | 'launchCouncilFinalization'
  | 'launchCouncilFinalizationReportMarkdown'
  | 'launchVerdictGovernance'
  | 'launchVerdictGovernanceReportMarkdown'
>;

/** Founder test core enriched with skeptical simulator artifacts for promise fulfillment input. */
export type FounderTestV4ReportWithSkeptical = FounderTestV4ReportCore &
  Pick<FounderTestV4Report, 'skepticalFounderSimulator' | 'skepticalFounderReportMarkdown'>;

/** Founder test core enriched with skeptical and promise artifacts for trust authority input. */
export type FounderTestV4ReportWithPromise = FounderTestV4ReportWithSkeptical &
  Pick<FounderTestV4Report, 'promiseFulfillment' | 'promiseFulfillmentReportMarkdown'>;

/** Founder test core enriched with skeptical, promise, and trust artifacts for self-awareness input. */
export type FounderTestV4ReportWithTrust = FounderTestV4ReportWithPromise &
  Pick<FounderTestV4Report, 'trustAuthority' | 'trustAuthorityReportMarkdown'>;

/** Founder test core enriched through self-awareness for user success input. */
export type FounderTestV4ReportWithSelfAwareness = FounderTestV4ReportWithTrust &
  Pick<FounderTestV4Report, 'selfAwarenessAuthority' | 'selfAwarenessAuthorityReportMarkdown'>;

/** Founder test core enriched through user success for gap detection input. */
export type FounderTestV4ReportWithUserSuccess = FounderTestV4ReportWithSelfAwareness &
  Pick<FounderTestV4Report, 'userSuccessAuthority' | 'userSuccessAuthorityReportMarkdown'>;

/** Founder test core enriched through gap detection for self-evolution input. */
export type FounderTestV4ReportWithGapDetection = FounderTestV4ReportWithUserSuccess &
  Pick<FounderTestV4Report, 'gapDetectionAuthority' | 'gapDetectionAuthorityReportMarkdown'>;

/** Founder test core enriched through self-evolution for unknown discovery input. */
export type FounderTestV4ReportWithSelfEvolution = FounderTestV4ReportWithGapDetection &
  Pick<FounderTestV4Report, 'selfEvolutionAuthority' | 'selfEvolutionAuthorityReportMarkdown'>;

/** Founder test core enriched through unknown discovery for first-time user reality input. */
export type FounderTestV4ReportWithUnknownDiscovery = FounderTestV4ReportWithSelfEvolution &
  Pick<FounderTestV4Report, 'unknownDiscoveryAuthority' | 'unknownDiscoveryAuthorityReportMarkdown'>;

/** Founder test core enriched through first-time user reality for customer value input. */
export type FounderTestV4ReportWithFirstTimeUser = FounderTestV4ReportWithUnknownDiscovery &
  Pick<FounderTestV4Report, 'firstTimeUserRealityAuthority' | 'firstTimeUserRealityAuthorityReportMarkdown'>;

/** Founder test core enriched through customer value for competitive reality input. */
export type FounderTestV4ReportWithCustomerValue = FounderTestV4ReportWithFirstTimeUser &
  Pick<FounderTestV4Report, 'customerValueAuthority' | 'customerValueAuthorityReportMarkdown'>;

/** Founder test core enriched through competitive reality for reality-proof input. */
export type FounderTestV4ReportWithCompetitiveReality = FounderTestV4ReportWithCustomerValue &
  Pick<FounderTestV4Report, 'competitiveRealityAuthority' | 'competitiveRealityAuthorityReportMarkdown'>;

/** Founder test core enriched through reality proof for real user reality input. */
export type FounderTestV4ReportWithRealityProof = FounderTestV4ReportWithCompetitiveReality &
  Pick<FounderTestV4Report, 'realityProofAuthority' | 'realityProofAuthorityReportMarkdown'>;

/** Founder test core enriched through real user reality for adoption prediction input. */
export type FounderTestV4ReportWithRealUserReality = FounderTestV4ReportWithRealityProof &
  Pick<FounderTestV4Report, 'realUserRealityAuthority' | 'realUserRealityAuthorityReportMarkdown'>;

/** Founder test core enriched through adoption prediction for launch readiness input. */
export type FounderTestV4ReportWithAdoptionPrediction = FounderTestV4ReportWithRealUserReality &
  Pick<FounderTestV4Report, 'adoptionPredictionAuthority' | 'adoptionPredictionAuthorityReportMarkdown'>;

/** Founder test core enriched through launch readiness before UI reviewer assembly. */
export type FounderTestV4ReportForLaunchCouncil = FounderTestV4ReportWithAdoptionPrediction &
  Pick<FounderTestV4Report, 'launchReadinessAuthority' | 'launchReadinessAuthorityReportMarkdown'>;

/** Founder test core enriched through UI reviewer before clarifying question assembly. */
export type FounderTestV4ReportWithUiReviewer = FounderTestV4ReportForLaunchCouncil &
  Pick<FounderTestV4Report, 'uiReviewerAuthority' | 'uiReviewerAuthorityReportMarkdown'>;

/** Founder test core enriched through clarifying question intelligence before Launch Council assembly. */
export type FounderTestV4ReportWithClarifyingQuestion = FounderTestV4ReportWithUiReviewer &
  Pick<
    FounderTestV4Report,
    'clarifyingQuestionIntelligence' | 'clarifyingQuestionIntelligenceReportMarkdown'
  >;

/** Founder test core enriched through launch council before finalization assembly. */
export type FounderTestV4ReportWithLaunchCouncil = FounderTestV4ReportWithClarifyingQuestion &
  Pick<
    FounderTestV4Report,
    'launchCouncil' | 'launchCouncilReport' | 'launchCouncilReportMarkdown'
  >;

/** Founder test core enriched through launch council finalization before verdict governance. */
export type FounderTestV4ReportWithLaunchCouncilFinalization = FounderTestV4ReportWithLaunchCouncil &
  Pick<
    FounderTestV4Report,
    'launchCouncilFinalization' | 'launchCouncilFinalizationReportMarkdown'
  >;
