/**
 * Clarifying Question Intelligence Maturity V1 — types.
 */

export type CqiProductDomain =
  | 'CRM'
  | 'MARKETPLACE'
  | 'INVENTORY'
  | 'SCHOOL_MANAGEMENT'
  | 'PROJECT_MANAGEMENT'
  | 'BOOKING_PLATFORM'
  | 'RESTAURANT_POS'
  | 'LEARNING_PLATFORM'
  | 'GENERIC';

export type RequirementGapCategory =
  | 'Business'
  | 'Users'
  | 'Roles'
  | 'Permissions'
  | 'Workflows'
  | 'Data'
  | 'Files'
  | 'Notifications'
  | 'Integrations'
  | 'AI'
  | 'Monetization'
  | 'Deployment';

export type RequirementCoverageStatus = 'Complete' | 'Partial' | 'Missing';

export type RequirementGapSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface RequirementGap {
  readOnly: true;
  category: RequirementGapCategory;
  gapId: string;
  summary: string;
  severity: RequirementGapSeverity;
  critical: boolean;
}

export interface RequirementCoverageRow {
  category: RequirementGapCategory;
  status: RequirementCoverageStatus;
  score: number;
}

export interface CqiAdaptiveQuestion {
  readOnly: true;
  question: string;
  whyItMatters: string;
  category: RequirementGapCategory;
  domain: CqiProductDomain;
  priority: 'CRITICAL' | 'IMPORTANT' | 'OPTIONAL';
}

export interface CqiMaturityAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'Clarifying Question Intelligence';
  productDomain: CqiProductDomain;
  userPrompt: string;
  requirementConfidenceScore: number;
  categoryScores: Readonly<Record<RequirementGapCategory, number>>;
  coverageMatrix: readonly RequirementCoverageRow[];
  gaps: readonly RequirementGap[];
  gapSummary: readonly string[];
  openQuestions: readonly CqiAdaptiveQuestion[];
  resolvedQuestions: readonly string[];
  criticalGapCount: number;
  questioningRequired: boolean;
  canProceedToPlanning: boolean;
  stopQuestioningReason: string;
  generatedAt: string;
}

export interface AssessCqiMaturityInput {
  userPrompt: string;
  requestId?: string;
  projectId?: string;
  supplementalEvidence?: string;
  resolvedAnswers?: readonly string[];
}
