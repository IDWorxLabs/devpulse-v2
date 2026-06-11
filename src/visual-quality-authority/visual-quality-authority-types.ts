/**
 * Visual Quality Authority — types.
 */

import type { FirstTimeUserRealityAssessment } from '../first-time-user-reality/first-time-user-reality-types.js';
import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { FounderSensemakingAssessment } from '../founder-sensemaking-engine/founder-sensemaking-types.js';

export type VisualFindingType =
  | 'VISUAL_CLUTTER'
  | 'POOR_HIERARCHY'
  | 'WEAK_NAVIGATION'
  | 'MISALIGNED_LAYOUT'
  | 'LOW_PROFESSIONALISM'
  | 'LAUNCH_READINESS_RISK';

export type VisualQualityCategory =
  | 'FIRST_IMPRESSION'
  | 'HIERARCHY'
  | 'NAVIGATION'
  | 'LAYOUT'
  | 'PROFESSIONALISM'
  | 'LAUNCH_APPEARANCE';

export type VisualSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface VisualQualitySubscores {
  firstImpression: number;
  hierarchy: number;
  navigation: number;
  layout: number;
  professionalism: number;
  launchAppearance: number;
}

export interface VisualQualityFinding {
  id: string;
  type: VisualFindingType;
  category: VisualQualityCategory;
  severity: VisualSeverity;
  explanation: string;
  recommendation: string;
  surface?: string;
}

export interface VisualQualityFeedEvent {
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
}

export interface VisualQualityAuthorityAssessment {
  visualQualityScore: number;
  subscores: VisualQualitySubscores;
  findings: VisualQualityFinding[];
  strengths: string[];
  weaknesses: string[];
  trustRisks: string[];
  professionalismRisks: string[];
  launchAppearanceRisks: string[];
  topVisualRisks: VisualQualityFinding[];
  highestSeverityFindings: VisualQualityFinding[];
  launchAppearanceConfidence: number;
  visualSummary: string;
  operatorFeedEvents: VisualQualityFeedEvent[];
  majorVisualRisks: boolean;
  notLaunchReadyAppearance: boolean;
  hierarchyDetectionPass: boolean;
  professionalismDetectionPass: boolean;
  clutterDetectionPass: boolean;
  launchAppearanceDetectionPass: boolean;
  visualTrustDetectionPass: boolean;
  visualQualityPass: boolean;
  insufficientInfo: boolean;
  insufficientInfoReason: string | null;
}

export interface VisualQualityShellSources {
  appJs: string;
  html: string;
  css: string;
}

export interface AssessVisualQualityAuthorityInput {
  shellSources: VisualQualityShellSources;
  firstTimeUserReality?: FirstTimeUserRealityAssessment;
}

export interface EnrichedVisualQualityAssessments {
  founderActionCenter: FounderActionCenterAssessment;
  founderSensemaking: FounderSensemakingAssessment;
}

export interface VisualQualityVisibility {
  score: number;
  visualQualityScore: number;
  launchAppearanceConfidence: number;
  majorVisualRisks: boolean;
  visualQualityPass: boolean;
  findingCount: number;
  criticalCount: number;
}
