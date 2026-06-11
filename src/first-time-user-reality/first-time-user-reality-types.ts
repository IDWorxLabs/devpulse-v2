/**
 * First-Time User Reality Engine — types.
 */

import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { FounderSensemakingAssessment } from '../founder-sensemaking-engine/founder-sensemaking-types.js';

export type FirstTimeFindingType =
  | 'FIRST_TIME_CONFUSION'
  | 'PURPOSE_UNCLEAR'
  | 'WORKFLOW_UNKNOWN'
  | 'TRUST_FORMATION_FAILURE'
  | 'COGNITIVE_OVERLOAD'
  | 'DISCOVERABILITY_FAILURE';

export type FirstTimeRealityCategory =
  | 'PRODUCT_UNDERSTANDING'
  | 'NAVIGATION_UNDERSTANDING'
  | 'SCREEN_PURPOSE'
  | 'WORKFLOW_UNDERSTANDING'
  | 'TRUST_FORMATION'
  | 'COGNITIVE_LOAD';

export type FirstTimeSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface FirstTimeUserFinding {
  id: string;
  type: FirstTimeFindingType;
  category: FirstTimeRealityCategory;
  severity: FirstTimeSeverity;
  whatConfuses: string;
  firstTimeQuestion: string;
  expectedClarity: string;
  observedGap: string;
  whyItMatters: string;
  recommendedFix: string;
  screen?: string;
}

export interface FirstTimeScreenPurposeResult {
  screen: string;
  viewId: string;
  purposeClear: boolean;
  detail: string;
}

export interface FirstTimeScenarioResult {
  id: string;
  category: FirstTimeRealityCategory;
  name: string;
  passed: boolean;
  detail: string;
}

export interface FirstTimeFeedEvent {
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
}

export interface FirstTimeUserCategoryScores {
  understanding: number;
  navigation: number;
  workflow: number;
  trust: number;
  simplicity: number;
}

export interface FirstTimeUserRealityAssessment {
  firstTimeUserScore: number;
  categoryScores: FirstTimeUserCategoryScores;
  scenarios: FirstTimeScenarioResult[];
  screenPurposeResults: FirstTimeScreenPurposeResult[];
  findings: FirstTimeUserFinding[];
  strengths: string[];
  weaknesses: string[];
  topConfusionRisk: string | null;
  recommendedFixes: string[];
  operatorFeedEvents: FirstTimeFeedEvent[];
  productUnderstandingPass: boolean;
  navigationUnderstandingPass: boolean;
  workflowClarityPass: boolean;
  trustFormationPass: boolean;
  cognitiveLoadPass: boolean;
  actionPathPass: boolean;
  actionPathStepsVisible: number;
  actionPathScenariosPassed: number;
  findingsGenerated: boolean;
  insufficientInfo: boolean;
  insufficientInfoReason: string | null;
}

export interface FirstTimeUserShellSources {
  appJs: string;
  html: string;
  css: string;
}

export interface AssessFirstTimeUserRealityInput {
  shellSources: FirstTimeUserShellSources;
}

export interface EnrichedFirstTimeAssessments {
  founderActionCenter: FounderActionCenterAssessment;
  founderSensemaking: FounderSensemakingAssessment;
}
