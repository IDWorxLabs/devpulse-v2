/**
 * Product Economics Engine — types.
 */

import type { AdoptionPredictionAssessment } from '../adoption-prediction-engine/adoption-prediction-engine-types.js';
import type { CustomerJourneySimulationAssessment } from '../customer-journey-simulation/customer-journey-simulation-types.js';
import type { FirstTimeUserRealityAssessment } from '../first-time-user-reality/first-time-user-reality-types.js';
import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { FounderFrictionHeatmapAssessment } from '../founder-friction-heatmap/founder-friction-heatmap-types.js';
import type { FounderSensemakingAssessment } from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import type { LaunchDaySimulationAssessment } from '../launch-day-simulation-engine/launch-day-simulation-engine-types.js';
import type { PromiseRealityEngineAssessment } from '../promise-reality-engine/promise-reality-engine-types.js';

export type EconomicsFindingType =
  | 'LOW_USER_VALUE'
  | 'HIGH_BUILD_COST'
  | 'HIGH_MAINTENANCE_COST'
  | 'LOW_ADOPTION_IMPACT'
  | 'LOW_STRATEGIC_VALUE'
  | 'NEGATIVE_ROI'
  | 'ECONOMIC_RISK';

export type EconomicsCategory =
  | 'USER_VALUE'
  | 'FOUNDER_VALUE'
  | 'BUILD_COST'
  | 'MAINTENANCE_COST'
  | 'ADOPTION_IMPACT'
  | 'STRATEGIC_VALUE';

export type EconomicsSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RoiClassification = 'BUILD_NOW' | 'BUILD_LATER' | 'EXPERIMENT_FIRST' | 'DO_NOT_BUILD';

export interface EconomicsSubscores {
  userValue: number;
  founderValue: number;
  buildCost: number;
  maintenanceCost: number;
  adoptionImpact: number;
  strategicValue: number;
}

export interface EconomicsFinding {
  id: string;
  type: EconomicsFindingType;
  category: EconomicsCategory;
  severity: EconomicsSeverity;
  explanation: string;
  recommendation: string;
  featureId?: string;
}

export interface FeatureEconomicsEvaluation {
  id: string;
  name: string;
  subscores: EconomicsSubscores;
  netValueScore: number;
  productEconomicsScore: number;
  roiClassification: RoiClassification;
  explanation: string;
  recommendation: string;
}

export interface EconomicsFeedEvent {
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
}

export interface ProductEconomicsAssessment {
  productEconomicsScore: number;
  subscores: EconomicsSubscores;
  findings: EconomicsFinding[];
  featureEvaluations: FeatureEconomicsEvaluation[];
  highestRoiOpportunities: string[];
  lowestRoiOpportunities: string[];
  economicRisks: string[];
  strategicInvestments: string[];
  deferredOpportunities: string[];
  productEconomicsSummary: string;
  operatorFeedEvents: EconomicsFeedEvent[];
  majorEconomicRisks: boolean;
  productEconomicsPass: boolean;
  roiClassificationVisibilityPass: boolean;
  costVisibilityPass: boolean;
  valueVisibilityPass: boolean;
  strategicAlignmentVisibilityPass: boolean;
  economicRiskVisibilityPass: boolean;
  insufficientInfo: boolean;
  insufficientInfoReason: string | null;
}

export interface EconomicsShellSources {
  appJs: string;
  html: string;
  css: string;
}

export interface AssessProductEconomicsInput {
  shellSources: EconomicsShellSources;
  firstTimeUserReality: FirstTimeUserRealityAssessment;
  customerJourneySimulation: CustomerJourneySimulationAssessment;
  launchDaySimulation: LaunchDaySimulationAssessment;
  adoptionPrediction: AdoptionPredictionAssessment;
  founderFrictionHeatmap: FounderFrictionHeatmapAssessment;
  promiseRealityEngine?: PromiseRealityEngineAssessment;
  validatorScriptCount?: number;
}

export interface EnrichedEconomicsAssessments {
  founderActionCenter: FounderActionCenterAssessment;
  founderSensemaking: FounderSensemakingAssessment;
}

export interface ProductEconomicsVisibility {
  score: number;
  productEconomicsScore: number;
  majorEconomicRisks: boolean;
  productEconomicsPass: boolean;
  buildNowCount: number;
  doNotBuildCount: number;
}
