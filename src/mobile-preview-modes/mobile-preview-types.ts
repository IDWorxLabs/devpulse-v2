/**
 * Mobile Preview Modes — foundation types (V1).
 * Read-only device preview intelligence — no emulators or runtime execution.
 */

import type { RequirementCompletenessAnalysis } from '../requirement-completeness-intelligence/requirement-completeness-types.js';
import type { VisualReferenceAnalysis } from '../visual-reference-intelligence/visual-reference-types.js';

export type DeviceProfileId =
  | 'ANDROID_PHONE_SMALL'
  | 'ANDROID_PHONE_MEDIUM'
  | 'ANDROID_PHONE_LARGE'
  | 'IPHONE_SMALL'
  | 'IPHONE_STANDARD'
  | 'IPHONE_PRO_MAX'
  | 'ANDROID_TABLET'
  | 'IPAD'
  | 'DESKTOP_STANDARD'
  | 'DESKTOP_WIDE';

export type DeviceCategory = 'ANDROID_PHONE' | 'IPHONE' | 'TABLET' | 'DESKTOP';

export type MobilePreviewReadiness =
  | 'NOT_READY'
  | 'HIGH_RISK'
  | 'READY_WITH_ADJUSTMENTS'
  | 'READY_FOR_PREVIEW';

export type PreviewReadinessCategory =
  | 'NOT_READY'
  | 'HIGH_RISK'
  | 'READY_WITH_ADJUSTMENTS'
  | 'READY_FOR_PREVIEW';

export type ResponsiveRiskType =
  | 'OVERFLOW_RISK'
  | 'NAVIGATION_CROWDING'
  | 'TOUCH_TARGET_ISSUE'
  | 'MODAL_SIZE_ISSUE'
  | 'DASHBOARD_DENSITY_ISSUE';

export type ResponsiveRiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface DeviceProfile {
  readOnly: true;
  profileId: DeviceProfileId;
  category: DeviceCategory;
  label: string;
  viewportWidth: number;
  viewportHeight: number;
  pixelDensity: number;
  touchTargetMinDp: number;
}

export interface ProjectUnderstandingSnapshot {
  readOnly: true;
  productType: string | null;
  platformTargets: readonly string[];
  keyWorkflows: readonly string[];
  featureInventory: readonly string[];
  confidenceScore: number;
}

export interface PreviewLayoutBehavior {
  readOnly: true;
  profileId: DeviceProfileId;
  likelyLayoutBehavior: string;
  navigationBehavior: string;
  screenFit: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  contentDensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  confidence: number;
  evidence: readonly string[];
}

export interface ResponsiveRiskItem {
  readOnly: true;
  riskType: ResponsiveRiskType;
  severity: ResponsiveRiskSeverity;
  profileId: DeviceProfileId | 'ALL';
  description: string;
  evidence: readonly string[];
}

export interface ResponsiveRiskAnalysis {
  readOnly: true;
  risks: readonly ResponsiveRiskItem[];
  overallRiskLevel: ResponsiveRiskSeverity;
  riskCount: number;
}

export interface DeviceCompatibilityResult {
  readOnly: true;
  category: DeviceCategory;
  deviceCompatibilityScore: number;
  profileScores: readonly {
    profileId: DeviceProfileId;
    score: number;
    summary: string;
  }[];
}

export interface MobileNavigationReview {
  readOnly: true;
  bottomNavigationPresent: boolean;
  sideNavigationPresent: boolean;
  tabStructureDetected: boolean;
  menuComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  discoverability: 'POOR' | 'FAIR' | 'GOOD';
  navigationUsabilityScore: number;
  findings: readonly string[];
  evidence: readonly string[];
}

export interface DeviceRecommendation {
  readOnly: true;
  recommendationId: string;
  title: string;
  rationale: string;
  targetCategories: readonly DeviceCategory[];
  expectedImpact: string;
  confidence: number;
  evidence: readonly string[];
}

export interface MobilePreviewAnalysis {
  readOnly: true;
  analysisId: string;
  analyzedAt: string;
  sourceViewportWidth: number | null;
  sourceViewportHeight: number | null;
  deviceProfilesAnalyzed: readonly DeviceProfileId[];
  previewLayoutBehaviors: readonly PreviewLayoutBehavior[];
  responsiveRiskAnalysis: ResponsiveRiskAnalysis;
  deviceCompatibility: readonly DeviceCompatibilityResult[];
  navigationReview: MobileNavigationReview;
  previewReadinessScore: number;
  previewReadinessCategory: PreviewReadinessCategory;
  mobilePreviewReadiness: MobilePreviewReadiness;
  deviceRecommendations: readonly DeviceRecommendation[];
  confidenceScore: number;
}

export interface MobilePreviewHistoryEntry {
  analysisId: string;
  timestamp: string;
  previewReadinessScore: number;
  mobilePreviewReadiness: MobilePreviewReadiness;
  navigationUsabilityScore: number;
  riskCount: number;
}

export interface MobilePreviewModesReport {
  readOnly: true;
  generatedAt: string;
  totalAnalyses: number;
  latestAnalysis: MobilePreviewAnalysis | null;
  historySummary: {
    totalAnalyses: number;
    averagePreviewReadinessScore: number;
    averageNavigationUsabilityScore: number;
    readyForPreviewCount: number;
  };
}

export interface AnalyzeMobilePreviewInput {
  visualReferenceAnalysis?: VisualReferenceAnalysis | null;
  requirementCompletenessAnalysis?: RequirementCompletenessAnalysis | null;
  projectUnderstanding?: ProjectUnderstandingSnapshot | null;
  /** Explicit layout/flow structures when visual analysis is omitted. */
  uiLayoutStructures?: readonly string[] | null;
  screenFlowStructures?: readonly string[] | null;
  skipHistoryRecording?: boolean;
}

export interface MobilePreviewAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'MOBILE_PREVIEW_MODES_COMPLETE' | 'MOBILE_PREVIEW_MODES_FAILED';
  analysis: MobilePreviewAnalysis | null;
  failureReason: string | null;
}

export interface PreviewEvidenceBundle {
  readOnly: true;
  sourceWidth: number;
  sourceHeight: number;
  sourcePlatform: string;
  layoutRegions: readonly string[];
  components: readonly string[];
  flows: readonly string[];
  screens: readonly string[];
  platformTargets: readonly string[];
  screenCount: number;
  workflowCount: number;
  sources: readonly string[];
}
