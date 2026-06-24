/**
 * Mobile Runtime Validation at Scale V1 — types.
 */

export type MobileRuntimeProfileId =
  | 'ANDROID_PHONE'
  | 'ANDROID_TABLET'
  | 'IPHONE'
  | 'IPAD';

export interface MobileRuntimeProof {
  readOnly: true;
  profile: string;
  productName: string;
  runtimeProfile: MobileRuntimeProfileId;
  viewport: { width: number; height: number };
  buildSuccess: boolean;
  previewSuccess: boolean;
  applicationLoads: boolean;
  navigationProof: boolean;
  interactionProof: boolean;
  workflowProof: boolean;
  performanceSummary: {
    readOnly: true;
    initialRenderMs: number;
    navigationResponseMs: number;
    interactionReadinessMs: number;
  };
  passed: boolean;
  workspacePath: string;
  executionContext: 'RBEP' | 'WORLD2';
}

export interface TouchInteractionAssessment {
  readOnly: true;
  generatedAt: string;
  overallScore: number;
  tapTargetsAccessible: boolean;
  menusUsable: boolean;
  buttonsClickable: boolean;
  navigationDrawerFunctional: boolean;
  scrollingFunctional: boolean;
  formsUsable: boolean;
  categoryScores: readonly {
    profile: string;
    score: number;
    findings: readonly string[];
  }[];
}

export interface MobileNavigationAssessment {
  readOnly: true;
  generatedAt: string;
  overallScore: number;
  hiddenNavigationRisk: boolean;
  unreachableScreensRisk: boolean;
  overflowIssues: boolean;
  viewportClippingRisk: boolean;
  brokenLayoutsRisk: boolean;
  categoryScores: readonly {
    profile: string;
    score: number;
    findings: readonly string[];
  }[];
}

export interface MobilePerformanceSummary {
  readOnly: true;
  generatedAt: string;
  averageInitialRenderMs: number;
  averageNavigationResponseMs: number;
  averageInteractionReadinessMs: number;
  categoriesMeasured: number;
}

export interface MobileCategoryResult {
  readOnly: true;
  profile: string;
  productName: string;
  mobileRuntimeProven: boolean;
  profilesValidated: readonly MobileRuntimeProfileId[];
  proofs: readonly MobileRuntimeProof[];
}

export interface MobileWorld2Result {
  readOnly: true;
  worldId: string;
  profile: string;
  productName: string;
  mobileRuntimeProven: boolean;
  workspacePath: string;
}

export interface MobileVerificationEvidence {
  readOnly: true;
  mobileCategoriesProven: number;
  mobileCategoriesRequired: number;
  mobileCoveragePercent: number;
  verificationConfidenceBoost: number;
  source: 'Mobile Runtime Validation at Scale V1';
}

export interface MobileProductCoverage {
  readOnly: true;
  desktopOnlyAssumptions: readonly string[];
  navigationIssues: readonly string[];
  workflowAccessibilityIssues: readonly string[];
  mobileProductReadinessScore: number;
}

export interface MobileRuntimeValidationAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'Mobile Runtime Validation at Scale V1';
  passToken: string;
  version: 'V1';
  generatedAt: string;
  categoriesValidated: number;
  categoriesMobileProven: number;
  mobilePassRate: number;
  runtimeProfilesValidated: readonly MobileRuntimeProfileId[];
  touchInteractionScore: number;
  navigationScore: number;
  performanceScore: number;
  world2MobileExecutions: number;
  mobileProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  categoryResults: readonly MobileCategoryResult[];
  touchInteractionAssessment: TouchInteractionAssessment;
  mobileNavigationAssessment: MobileNavigationAssessment;
  mobilePerformanceSummary: MobilePerformanceSummary;
  world2Results: readonly MobileWorld2Result[];
  mobileVerificationEvidence: MobileVerificationEvidence;
  mobileProductCoverage: MobileProductCoverage;
}
