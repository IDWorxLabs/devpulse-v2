/**
 * Universal Feature Contract Intelligence V1 — types.
 */

export type UniversalFeatureRealityVerdict =
  | 'FEATURE_REALITY_EXCELLENT'
  | 'FEATURE_REALITY_GOOD'
  | 'FEATURE_REALITY_ACCEPTABLE'
  | 'FEATURE_REALITY_NEEDS_IMPROVEMENT'
  | 'FEATURE_REALITY_FAIL';

export type UniversalAppProfile =
  | 'TASK_TRACKER_WEB_V1'
  | 'CRM_WEB_V1'
  | 'INVENTORY_WEB_V1'
  | 'SCHOOL_MANAGEMENT_WEB_V1'
  | 'PROJECT_MANAGEMENT_WEB_V1'
  | 'EXPENSE_TRACKER_WEB_V1'
  | 'FINANCE_TRACKER_WEB_V1'
  | 'QR_APP'
  | 'BOOKING_WEB_V1'
  | 'HABIT_TRACKER_WEB_V1'
  | 'ASSISTIVE_COMMUNICATION_APP_V1'
  | 'GENERIC_CUSTOM_APP_V1';

export interface UniversalFeatureEntity {
  id: string;
  label: string;
  pluralLabel: string;
  navLabel: string;
  slug: string;
  storageKey: string;
  primary: boolean;
}

export type UniversalFeatureActionVerb =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'search'
  | 'assign'
  | 'approve'
  | 'complete';

export interface UniversalFeatureAction {
  id: string;
  entityId: string;
  verb: UniversalFeatureActionVerb;
  label: string;
  required: boolean;
}

export interface UniversalFeatureRule {
  id: string;
  entityId: string | null;
  label: string;
  required: boolean;
}

export interface UniversalFeatureWorkflow {
  id: string;
  entityId: string | null;
  label: string;
  stages: string[];
  required: boolean;
}

export interface UniversalFeatureOutcome {
  id: string;
  entityId: string | null;
  label: string;
  required: boolean;
}

export interface UniversalFeatureContract {
  contractVersion: '1.0';
  contractId: string;
  productProfile: UniversalAppProfile;
  productName: string;
  generatedAt: string;
  sourcePrompt: string;
  entities: UniversalFeatureEntity[];
  actions: UniversalFeatureAction[];
  rules: UniversalFeatureRule[];
  workflows: UniversalFeatureWorkflow[];
  outcomes: UniversalFeatureOutcome[];
}

export interface BuildUniversalFeatureContractInput {
  contractId: string;
  rawPrompt: string;
  profile?: UniversalAppProfile;
  requirements?: readonly string[];
  clarifyingAnswers?: readonly string[];
}

export type FeatureValidationStepKind =
  | 'discover'
  | 'create'
  | 'edit'
  | 'delete'
  | 'search'
  | 'complete'
  | 'persistence-route'
  | 'persistence-reload'
  | 'recovery'
  | 'ux-feedback'
  | 'ux-actionable';

export interface FeatureRealityValidationStep {
  id: string;
  kind: FeatureValidationStepKind;
  entityId: string;
  actionId: string | null;
  label: string;
  critical: boolean;
  selectors: Record<string, string>;
  sampleText: string;
  editedText?: string;
}

export interface FeatureRealityValidationPlan {
  planVersion: '1.0';
  contractId: string;
  productProfile: UniversalAppProfile;
  primaryEntityId: string;
  navLabel: string;
  featureRootSelector: string;
  storageKey: string;
  steps: FeatureRealityValidationStep[];
}

export interface UniversalFeatureRealityCheck {
  id: string;
  category: string;
  entityId: string | null;
  actionId: string | null;
  label: string;
  passed: boolean;
  detail: string;
  critical: boolean;
}

export interface UniversalFeatureRealityScores {
  contractCompletenessScore: number;
  featureCoverageScore: number;
  executionScore: number;
  workflowScore: number;
  persistenceScore: number;
  overallFeatureRealityScore: number;
}

export interface UniversalFeatureContractAssessment {
  readOnly: true;
  passed: boolean;
  verdict: UniversalFeatureRealityVerdict;
  passToken: string;
  scores: UniversalFeatureRealityScores;
  contract: UniversalFeatureContract;
  plan: FeatureRealityValidationPlan;
  checks: UniversalFeatureRealityCheck[];
  failedChecks: UniversalFeatureRealityCheck[];
  blocksLaunchReadiness: boolean;
  blocksLaunchReadinessReason: string | null;
  previewUrl: string;
  contractId: string;
  generatedAt: string;
  reportMarkdown: string;
}

export interface UniversalFeatureContractSuiteResult {
  readOnly: true;
  passed: boolean;
  passToken: string;
  appResults: Array<{
    productProfile: UniversalAppProfile;
    productName: string;
    passed: boolean;
    overallScore: number;
    verdict: UniversalFeatureRealityVerdict;
  }>;
  generatedAt: string;
}

export interface RunUniversalFeatureValidationInput {
  previewUrl: string;
  contract: UniversalFeatureContract;
}
