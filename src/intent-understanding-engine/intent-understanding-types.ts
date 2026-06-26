/**
 * Intent Understanding Engine V1 — foundational product intelligence types.
 * Planning and understanding only — generation consumes ProductIntelligenceModel, not raw prompts.
 */

import type { MaterializationProfile } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';

export const INTENT_UNDERSTANDING_ENGINE_PASS_TOKEN = 'INTENT_UNDERSTANDING_ENGINE_V1_PASS';
export const INTENT_UNDERSTANDING_ENGINE_OWNER_MODULE = 'devpulse_v2_intent_understanding_engine';
export const DEFAULT_INTENT_CONFIDENCE_THRESHOLD = 0.85;
export const DEFAULT_CATEGORY_CONFIDENCE_THRESHOLD = 0.7;
export const DEFAULT_MAX_INTENT_HISTORY_SIZE = 128;

export type ProductType =
  | 'EXPENSE_TRACKER'
  | 'FINANCE_TRACKER'
  | 'CRM'
  | 'TASK_TRACKER'
  | 'QR_APP'
  | 'INVENTORY'
  | 'BOOKING'
  | 'HABIT_TRACKER'
  | 'PROJECT_MANAGEMENT'
  | 'SCHOOL_MANAGEMENT'
  | 'ASSISTIVE_COMMUNICATION'
  | 'HOSPITAL_SYSTEM'
  | 'CAD_PLATFORM'
  | 'MEDICAL_DEVICE_COMPANION'
  | 'CUSTOM_APPLICATION'
  | 'UNKNOWN';

export type FeaturePriority = 'REQUIRED' | 'OPTIONAL' | 'FUTURE' | 'EXPERIMENTAL' | 'BLOCKED';

export type InteractionMode =
  | 'CLICK'
  | 'TAP'
  | 'GESTURE'
  | 'BLINK'
  | 'EYE_TRACKING'
  | 'KEYBOARD'
  | 'VOICE'
  | 'CAMERA'
  | 'DRAG'
  | 'DROP'
  | 'SWIPE'
  | 'BARCODE_SCAN'
  | 'QR_SCAN'
  | 'SPEECH';

export type PlatformTarget =
  | 'ANDROID'
  | 'IOS'
  | 'DESKTOP'
  | 'TABLET'
  | 'WEB'
  | 'OFFLINE'
  | 'CLOUD'
  | 'HYBRID'
  | 'RESPONSIVE'
  | 'PHONE_FIRST'
  | 'DESKTOP_FIRST';

export type NavigationPattern =
  | 'BOTTOM_NAVIGATION'
  | 'DRAWER'
  | 'SIDEBAR'
  | 'TABS'
  | 'WIZARD'
  | 'SINGLE_SCREEN'
  | 'DASHBOARD'
  | 'NESTED_NAVIGATION';

export type VisualStyle =
  | 'MEDICAL'
  | 'CORPORATE'
  | 'CONSUMER'
  | 'PROFESSIONAL'
  | 'MINIMAL'
  | 'DASHBOARD'
  | 'PHONE_FRAME'
  | 'TABLET_LAYOUT';

export interface UnderstandingEvidence {
  readOnly: true;
  source: string;
  excerpt: string;
  weight: number;
}

export interface ProductIdentityUnderstanding {
  readOnly: true;
  productName: string;
  productType: ProductType;
  industry: string;
  purpose: string;
  primaryObjective: string;
  secondaryObjectives: readonly string[];
  coreValueProposition: string;
  evidence: readonly UnderstandingEvidence[];
}

export interface UserPersona {
  readOnly: true;
  personaId: string;
  role: string;
  description: string;
  goals: readonly string[];
  isPrimary: boolean;
  evidence: readonly UnderstandingEvidence[];
}

export interface UserGoalsUnderstanding {
  readOnly: true;
  openingReason: string;
  accomplishments: readonly string[];
  successCriteria: readonly string[];
  evidence: readonly UnderstandingEvidence[];
}

export interface WorkflowStep {
  readOnly: true;
  stepId: string;
  label: string;
  order: number;
  optional: boolean;
}

export interface UserWorkflowUnderstanding {
  readOnly: true;
  workflowId: string;
  name: string;
  steps: readonly WorkflowStep[];
  evidence: readonly UnderstandingEvidence[];
}

export interface FeatureRequirementUnderstanding {
  readOnly: true;
  featureId: string;
  label: string;
  moduleId: string | null;
  priority: FeaturePriority;
  evidence: readonly UnderstandingEvidence[];
}

export interface InteractionModelUnderstanding {
  readOnly: true;
  modes: readonly InteractionMode[];
  descriptions: readonly string[];
  evidence: readonly UnderstandingEvidence[];
}

export interface PlatformUnderstanding {
  readOnly: true;
  targets: readonly PlatformTarget[];
  primaryTarget: PlatformTarget;
  offlineRequired: boolean;
  cloudRequired: boolean;
  evidence: readonly UnderstandingEvidence[];
}

export interface NavigationUnderstanding {
  readOnly: true;
  patterns: readonly NavigationPattern[];
  primaryPattern: NavigationPattern;
  navigationGraph: readonly { from: string; to: string; trigger: string }[];
  evidence: readonly UnderstandingEvidence[];
}

export interface AccessibilityUnderstanding {
  readOnly: true;
  requirements: readonly string[];
  wcagLevel: string | null;
  motorAccessibility: boolean;
  screenReaderSupport: boolean;
  highContrast: boolean;
  largeText: boolean;
  eyeTrackingSupport: boolean;
  voiceSupport: boolean;
  medicalAccessibility: boolean;
  mandatoryConstraints: readonly string[];
  evidence: readonly UnderstandingEvidence[];
}

export interface DataEntityUnderstanding {
  readOnly: true;
  entityId: string;
  label: string;
  pluralLabel: string;
  operations: readonly ('CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'SEARCH' | 'FILTER' | 'SORT')[];
}

export interface DataModelUnderstanding {
  readOnly: true;
  entities: readonly DataEntityUnderstanding[];
  relationships: readonly { fromEntityId: string; toEntityId: string; type: string }[];
  historyRequired: boolean;
  storageType: string;
  synchronizationRequired: boolean;
  cachingRequired: boolean;
  evidence: readonly UnderstandingEvidence[];
}

export interface BehaviorStep {
  readOnly: true;
  stepId: string;
  trigger: string;
  action: string;
  outcome: string;
  order: number;
}

export interface BehaviorModelUnderstanding {
  readOnly: true;
  behaviors: readonly BehaviorStep[];
  primaryFlow: readonly string[];
  evidence: readonly UnderstandingEvidence[];
}

export interface VisualDesignUnderstanding {
  readOnly: true;
  styles: readonly VisualStyle[];
  colorRequirements: readonly string[];
  layoutRequirements: readonly string[];
  spacingRequirements: readonly string[];
  brandingNotes: readonly string[];
  evidence: readonly UnderstandingEvidence[];
}

export interface SafetyUnderstanding {
  readOnly: true;
  warnings: readonly string[];
  disclaimers: readonly string[];
  medicalLimitations: readonly string[];
  privacyRequirements: readonly string[];
  securityRequirements: readonly string[];
  complianceNotes: readonly string[];
  riskStatements: readonly string[];
  evidence: readonly UnderstandingEvidence[];
}

export interface PerformanceUnderstanding {
  readOnly: true;
  realTimeRequired: boolean;
  offlineRequired: boolean;
  largeDatasetSupport: boolean;
  lowLatencyRequired: boolean;
  fastStartupRequired: boolean;
  memoryLimits: readonly string[];
  deviceLimits: readonly string[];
  evidence: readonly UnderstandingEvidence[];
}

export interface SuccessCriteriaUnderstanding {
  readOnly: true;
  completionCriteria: readonly string[];
  generationStopCriteria: readonly string[];
  launchApprovalCriteria: readonly string[];
  evidence: readonly UnderstandingEvidence[];
}

export interface ArchitectureHintUnderstanding {
  readOnly: true;
  suggestedProfile: MaterializationProfile | null;
  suggestedGeneratedProfile: GeneratedAppProfile | null;
  moduleIds: readonly string[];
  routes: readonly string[];
  evidence: readonly UnderstandingEvidence[];
}

export interface CategoryConfidence {
  readOnly: true;
  category: string;
  score: number;
  evidenceCount: number;
  meetsThreshold: boolean;
}

export interface IntentConfidenceReport {
  readOnly: true;
  categories: readonly CategoryConfidence[];
  overallConfidence: number;
  meetsOverallThreshold: boolean;
  thresholdUsed: number;
  categoryThresholdUsed: number;
}

export interface ProductIntelligenceModel {
  readOnly: true;
  modelId: string;
  sourcePromptHash: string;
  createdAt: number;
  product: ProductIdentityUnderstanding;
  users: readonly UserPersona[];
  goals: UserGoalsUnderstanding;
  features: readonly FeatureRequirementUnderstanding[];
  workflows: readonly UserWorkflowUnderstanding[];
  interactions: InteractionModelUnderstanding;
  navigation: NavigationUnderstanding;
  accessibility: AccessibilityUnderstanding;
  architecture: ArchitectureHintUnderstanding;
  behavior: BehaviorModelUnderstanding;
  platform: PlatformUnderstanding;
  dataModel: DataModelUnderstanding;
  visualDesign: VisualDesignUnderstanding;
  safety: SafetyUnderstanding;
  performance: PerformanceUnderstanding;
  successCriteria: SuccessCriteriaUnderstanding;
  confidence: IntentConfidenceReport;
}

export interface IntentUnderstandingInput {
  rawPrompt: string;
  confidenceThreshold?: number;
  categoryThreshold?: number;
  understandingId?: string;
}

export interface IntentUnderstandingResult {
  readOnly: true;
  understandingId: string;
  rawPrompt: string;
  productIntelligenceModel: ProductIntelligenceModel;
  readyForGeneration: boolean;
  blockedReason: string | null;
  traceEventCount: number;
  reportMarkdown: string;
  completedAt: number;
}

export interface IntentHistoryEntry {
  readOnly: true;
  historyId: string;
  understandingId: string;
  productName: string;
  productType: ProductType;
  overallConfidence: number;
  readyForGeneration: boolean;
  recordedAt: number;
}

export interface IntentUnderstandingRuntimeReport {
  understandingsCompleted: number;
  modelsBuilt: number;
  generationBlocked: number;
  averageConfidence: number;
  historySize: number;
}
