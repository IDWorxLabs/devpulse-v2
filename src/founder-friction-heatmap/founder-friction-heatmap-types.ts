/**
 * Founder Friction Heatmap Engine — types.
 */

import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { FirstTimeUserRealityAssessment } from '../first-time-user-reality/first-time-user-reality-types.js';
import type { FounderSensemakingAssessment } from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import type { VerificationResultsVisibilityAssessment } from '../verification-results-visibility/verification-results-visibility-types.js';
import type { VerificationTrustEvidenceAssessment } from '../verification-trust-evidence/verification-trust-evidence-types.js';

export type FrictionCategory =
  | 'Navigation'
  | 'Understanding'
  | 'Workflow'
  | 'Verification'
  | 'Decision';

export type FrictionLevel = 'LOW' | 'MODERATE' | 'HIGH';

export type ExplanationDependency = 'Requires Explanation' | 'Self-Explanatory';

export interface FrictionCategoryScore {
  category: FrictionCategory;
  score: number;
  detail: string;
}

export interface FrictionHotspot {
  id: string;
  concept: string;
  screen?: string;
  workflow?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  detail: string;
}

export interface FrictionDeadEnd {
  id: string;
  screen: string;
  detail: string;
  recommendedFix: string;
}

export interface FrictionExplanationScreen {
  screen: string;
  dependency: ExplanationDependency;
  detail: string;
}

export interface FrictionHeatmapScenarioResult {
  id: string;
  name: string;
  passed: boolean;
  detail: string;
}

export interface FounderFrictionHeatmapSummary {
  frictionLevel: FrictionLevel;
  mostLikelyAbandonmentPoint: string;
  mostLikelyConfusionPoint: string;
  mostSuccessfulJourney: string;
  recommendedUxImprovements: string[];
}

export interface FounderFrictionHeatmapAssessment {
  overallFrictionScore: number;
  categoryScores: FrictionCategoryScore[];
  highestFrictionAreas: string[];
  confusionHotspots: FrictionHotspot[];
  deadEndFindings: FrictionDeadEnd[];
  explanationDependency: FrictionExplanationScreen[];
  summary: FounderFrictionHeatmapSummary;
  scenarios: FrictionHeatmapScenarioResult[];
  heatmapPass: boolean;
  frictionVisible: boolean;
  rankingsGenerated: boolean;
  deadEndsDetected: boolean;
  abandonmentRiskDetected: boolean;
}

export interface FounderFrictionHeatmapShellSources {
  html: string;
  appJs: string;
}

export interface AssessFounderFrictionHeatmapInput {
  shellSources: FounderFrictionHeatmapShellSources;
  firstTimeUserReality: FirstTimeUserRealityAssessment;
  verificationTrustEvidence: VerificationTrustEvidenceAssessment;
  founderSensemaking: FounderSensemakingAssessment;
  founderActionCenter: FounderActionCenterAssessment;
  verificationResults: VerificationResultsVisibilityAssessment;
}

export interface FounderFrictionHeatmapVisibility {
  score: number;
  overallFrictionScore: number;
  heatmapPass: boolean;
  frictionVisible: boolean;
  rankingsGenerated: boolean;
  deadEndsDetected: boolean;
  abandonmentRiskDetected: boolean;
  scenarioPassCount: number;
  hotspotCount: number;
}
