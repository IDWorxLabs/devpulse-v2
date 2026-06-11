/**
 * Digital Founder Board — types.
 */

import type { AdoptionPredictionAssessment } from '../adoption-prediction-engine/adoption-prediction-engine-types.js';
import type { CompetitiveRealityAssessment } from '../competitive-reality-engine/competitive-reality-engine-types.js';
import type { CustomerJourneySimulationAssessment } from '../customer-journey-simulation/customer-journey-simulation-types.js';
import type { FirstTimeUserRealityAssessment } from '../first-time-user-reality/first-time-user-reality-types.js';
import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type {
  DecisionConfidence,
  FounderDecisionOutcome,
  FounderDecisionReadinessAssessment,
} from '../founder-decision-readiness/founder-decision-readiness-types.js';
import type { FounderFrictionHeatmapAssessment } from '../founder-friction-heatmap/founder-friction-heatmap-types.js';
import type { FounderSensemakingAssessment } from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import type { LaunchDaySimulationAssessment } from '../launch-day-simulation-engine/launch-day-simulation-engine-types.js';
import type { ProductEconomicsAssessment } from '../product-economics-engine/product-economics-engine-types.js';
import type { ProductEvolutionAssessment } from '../product-evolution-engine/product-evolution-engine-types.js';
import type { PromiseRealityEngineAssessment } from '../promise-reality-engine/promise-reality-engine-types.js';
import type { VerificationTrustEvidenceAssessment } from '../verification-trust-evidence/verification-trust-evidence-types.js';
import type { VisualQualityAuthorityAssessment } from '../visual-quality-authority/visual-quality-authority-types.js';

export type BoardStatusClassification =
  | 'HEALTHY'
  | 'HEALTHY_WITH_WARNINGS'
  | 'ACTION_REQUIRED'
  | 'CRITICAL_INTERVENTION_REQUIRED';

export interface ExecutiveSummaryPanel {
  founderDecision: FounderDecisionOutcome;
  decisionConfidence: DecisionConfidence;
  whyThisRecommendation: string;
  topNextActions: string[];
}

export interface ProductHealthPanel {
  launchReadiness: number;
  adoptionReadiness: number;
  trustReadiness: number;
  productReadiness: number;
  strategicReadiness: number;
  founderReadiness: number;
}

export interface RiskBoardPanel {
  highestPriorityRisks: string[];
  blockingEvidence: string[];
}

export interface OpportunityBoardPanel {
  quickWins: string[];
  strategicInvestments: string[];
  highestRoiOpportunities: string[];
  recommendedNextInvestments: string[];
}

export interface CompetitivePositionPanel {
  competitiveClassification: string;
  strongestAdvantages: string[];
  replacementRisks: string[];
  strategicDefensibility: string[];
}

export interface TrustValidationPanel {
  verificationTrustScore: number;
  promiseRealityScore: number;
  unprovenClaims: string[];
  contradictedClaims: string[];
  realityConfidence: string;
}

export interface FounderExperiencePanel {
  firstTimeUserScore: number;
  frictionScore: number;
  customerJourneyScore: number;
  launchDayScore: number;
  adoptionPredictionScore: number;
}

export interface RoadmapIntelligencePanel {
  buildNext: string[];
  buildLater: string[];
  doNotBuild: string[];
}

export interface BoardFeedEvent {
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
}

export interface DigitalFounderBoardAssessment {
  boardStatus: BoardStatusClassification;
  executiveSummary: ExecutiveSummaryPanel;
  productHealth: ProductHealthPanel;
  riskBoard: RiskBoardPanel;
  opportunityBoard: OpportunityBoardPanel;
  competitivePosition: CompetitivePositionPanel;
  trustValidation: TrustValidationPanel;
  founderExperience: FounderExperiencePanel;
  roadmapIntelligence: RoadmapIntelligencePanel;
  recommendedActions: string[];
  digitalFounderBoardSummary: string;
  operatorFeedEvents: BoardFeedEvent[];
  majorBoardRisks: boolean;
  digitalFounderBoardPass: boolean;
  executiveSummaryVisibilityPass: boolean;
  decisionVisibilityPass: boolean;
  riskBoardVisibilityPass: boolean;
  opportunityBoardVisibilityPass: boolean;
  roadmapPanelVisibilityPass: boolean;
  trustPanelVisibilityPass: boolean;
  competitivePanelVisibilityPass: boolean;
  boardStatusVisibilityPass: boolean;
  recommendedActionsVisibilityPass: boolean;
  insufficientInfo: boolean;
  insufficientInfoReason: string | null;
}

export interface AssessDigitalFounderBoardInput {
  firstTimeUserReality: FirstTimeUserRealityAssessment;
  verificationTrustEvidence: VerificationTrustEvidenceAssessment;
  founderFrictionHeatmap: FounderFrictionHeatmapAssessment;
  customerJourneySimulation: CustomerJourneySimulationAssessment;
  promiseRealityEngine: PromiseRealityEngineAssessment;
  visualQualityAuthority: VisualQualityAuthorityAssessment;
  launchDaySimulation: LaunchDaySimulationAssessment;
  adoptionPrediction: AdoptionPredictionAssessment;
  productEconomics: ProductEconomicsAssessment;
  productEvolution: ProductEvolutionAssessment;
  competitiveReality: CompetitiveRealityAssessment;
  founderDecisionReadiness: FounderDecisionReadinessAssessment;
  founderActionCenter: FounderActionCenterAssessment;
}

export interface EnrichedBoardAssessments {
  founderSensemaking: FounderSensemakingAssessment;
}

export interface DigitalFounderBoardVisibility {
  score: number;
  boardStatus: BoardStatusClassification;
  majorBoardRisks: boolean;
  digitalFounderBoardPass: boolean;
  panelCount: number;
}
