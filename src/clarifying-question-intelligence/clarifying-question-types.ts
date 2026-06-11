/**
 * Clarifying Question Intelligence — assessment types.
 */

export type ClarifyingQuestionReadinessState =
  | 'FULLY_UNDERSTOOD'
  | 'MOSTLY_UNDERSTOOD'
  | 'CLARIFICATION_REQUIRED'
  | 'CRITICAL_INFORMATION_MISSING'
  | 'CANNOT_PROCEED';

export type RequirementCategoryId =
  | 'PRODUCT_PURPOSE'
  | 'USERS_ROLES'
  | 'AUTHENTICATION'
  | 'UI_BRANDING'
  | 'FEATURES'
  | 'BEHAVIORS'
  | 'PLATFORM'
  | 'DATA_STORAGE'
  | 'PAYMENTS'
  | 'LAUNCH_REQUIREMENTS';

export type ClarifyingQuestionPriority = 'CRITICAL' | 'IMPORTANT' | 'OPTIONAL';

export interface ClarifyingQuestionDefinition {
  question: string;
  whyItMatters: string;
  consequenceIfAssumed: string;
  priority: ClarifyingQuestionPriority;
  category: RequirementCategoryId;
}

export interface RequirementCategoryDefinition {
  id: RequirementCategoryId;
  label: string;
  critical: boolean;
  detectionPatterns: readonly RegExp[];
  sampleQuestion: ClarifyingQuestionDefinition;
}

export interface ClarifyingQuestionAssessment {
  readOnly: true;
  advisoryOnly: true;
  requirementCompletenessScore: number;
  confidenceToProceed: number;
  missingRequirementCount: number;
  criticalMissingRequirementCount: number;
  clarificationRequired: boolean;
  recommendedQuestions: ClarifyingQuestionDefinition[];
  detectedRequirementCategories: RequirementCategoryId[];
  missingRequirementCategories: RequirementCategoryId[];
  assumptionsPrevented: string[];
  readinessState: ClarifyingQuestionReadinessState;
  cacheKey: string;
}
