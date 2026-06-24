/**
 * Product Architect Intelligence V1 — types.
 */

export type ProductArchitectDomain =
  | 'CRM'
  | 'MARKETPLACE'
  | 'INVENTORY'
  | 'SCHOOL_MANAGEMENT'
  | 'HEALTHCARE'
  | 'FINANCE'
  | 'BOOKING'
  | 'RESTAURANT_POS'
  | 'PROJECT_MANAGEMENT'
  | 'HR'
  | 'COMMUNITY_PLATFORM'
  | 'LEARNING_PLATFORM'
  | 'GENERIC';

export type ProductGapCategory =
  | 'Missing Screens'
  | 'Missing Workflows'
  | 'Missing Roles'
  | 'Missing Permissions'
  | 'Missing Notifications'
  | 'Missing Reporting'
  | 'Missing Administration'
  | 'Missing Monetization';

export type ProductGapSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type ProductReadinessLabel =
  | 'Architecturally Complete'
  | 'Launch Ready'
  | 'Needs Product Refinement'
  | 'Architecturally Incomplete';

export type ProductArchitectureRootCause =
  | 'Poor Requirements'
  | 'Poor Planning'
  | 'Poor Generation'
  | 'Mixed'
  | 'Unknown';

export interface ProductScreenExpectation {
  readOnly: true;
  label: string;
  detectionPatterns: readonly RegExp[];
  critical: boolean;
}

export interface ProductWorkflowExpectation {
  readOnly: true;
  label: string;
  steps: readonly { label: string; detectionPatterns: readonly RegExp[] }[];
  critical: boolean;
}

export interface ProductJourneyExpectation {
  readOnly: true;
  journeyType: 'First-Time User Journey' | 'Returning User Journey' | 'Power User Journey' | 'Admin Journey';
  requiredActions: readonly { label: string; detectionPatterns: readonly RegExp[] }[];
}

export interface ProductPatternDefinition {
  readOnly: true;
  domain: ProductArchitectDomain;
  label: string;
  detectionPatterns: readonly RegExp[];
  expectedScreens: readonly ProductScreenExpectation[];
  expectedWorkflows: readonly ProductWorkflowExpectation[];
  expectedJourneys: readonly ProductJourneyExpectation[];
  expectedRoles: readonly string[];
  gapCategories: readonly ProductGapCategory[];
}

export interface MissingScreenFinding {
  readOnly: true;
  screen: string;
  severity: ProductGapSeverity;
  flag: string;
  critical: boolean;
}

export interface WorkflowCompletenessFinding {
  readOnly: true;
  workflow: string;
  complete: boolean;
  missingSteps: readonly string[];
  severity: ProductGapSeverity;
}

export interface UserJourneyFinding {
  readOnly: true;
  journeyType: ProductJourneyExpectation['journeyType'];
  complete: boolean;
  deadEnds: readonly string[];
  missingActions: readonly string[];
  confusingNavigation: readonly string[];
  broken: boolean;
}

export interface ProductGapFinding {
  readOnly: true;
  category: ProductGapCategory;
  severity: ProductGapSeverity;
  summary: string;
  detail: string;
}

export interface ProductGapReport {
  readOnly: true;
  gaps: readonly ProductGapFinding[];
  criticalGapCount: number;
  warningGapCount: number;
  infoGapCount: number;
  gapSummary: readonly string[];
}

export interface ProductArchitectureScores {
  readOnly: true;
  productCompletenessScore: number;
  workflowCompletenessScore: number;
  screenCoverageScore: number;
  userJourneyScore: number;
  architectureScore: number;
  overallProductScore: number;
  productReadinessScore: number;
  readinessLabel: ProductReadinessLabel;
}

export interface ProductArchitectureCqiContext {
  readOnly: true;
  requirementConfidenceScore: number;
  criticalRequirementGapCount: number;
  coverageMatrixSummary: readonly string[];
  rootCause: ProductArchitectureRootCause;
  rootCauseDetail: string;
}

export interface ProductArchitectureAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'Product Architect Intelligence';
  profile: string;
  productName: string;
  productPrompt: string;
  productDomain: ProductArchitectDomain;
  scores: ProductArchitectureScores;
  missingScreens: readonly MissingScreenFinding[];
  workflowAnalysis: readonly WorkflowCompletenessFinding[];
  journeyAnalysis: readonly UserJourneyFinding[];
  gapReport: ProductGapReport;
  cqiContext: ProductArchitectureCqiContext | null;
  architecturallyComplete: boolean;
  launchReadyFromProductArchitecture: boolean;
  recommendations: readonly string[];
  generatedAt: string;
}

export interface AssessProductArchitectureInput {
  profile?: string;
  productPrompt?: string;
  productName?: string;
  observedEvidence?: string;
  projectRootDir?: string | null;
  workspaceDir?: string | null;
}

export interface ProductArchitectIntelligenceHistoryEntry {
  readOnly: true;
  runId: string;
  profile: string;
  productName: string;
  productDomain: ProductArchitectDomain;
  productReadinessScore: number;
  readinessLabel: ProductReadinessLabel;
  criticalGapCount: number;
  timestamp: string;
}
