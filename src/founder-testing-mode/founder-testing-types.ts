/**
 * AiDevEngine Founder Testing Mode V1 — report types.
 */

export type IssueSeverity = 'BLOCKER' | 'HIGH' | 'MEDIUM' | 'LOW' | 'POLISH';

export type FinalVerdict =
  | 'PRODUCT_READY'
  | 'PRODUCT_READY_WITH_MINOR_POLISH'
  | 'PRODUCT_NOT_READY'
  | 'PRODUCT_BLOCKED';

export interface FounderTestCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface FounderTestIssue {
  severity: IssueSeverity;
  screen: string;
  problem: string;
  userImpact: string;
  likelyCause: string;
  recommendedFix: string;
  copyPasteFixPrompt?: string;
}

export interface ScreenTestResult {
  screen: string;
  viewId: string;
  passed: boolean;
  durationMs: number;
  checks: FounderTestCheck[];
}

export interface LiveScreenResultInput {
  screen: string;
  viewId: string;
  passed: boolean;
  checks: FounderTestCheck[];
}

export interface PromptTestResult {
  prompt: string;
  passed: boolean;
  responsePreview: string;
  issues: string[];
  checks: FounderTestCheck[];
}

export interface WorkflowTestResult {
  name: string;
  passed: boolean;
  detail: string;
}

export interface VisualUxFinding {
  screen: string;
  finding: string;
  severity: IssueSeverity;
}

export interface FounderTestScores {
  navigationClarity: number;
  screenCompleteness: number;
  workflowContinuity: number;
  promptIntelligence: number;
  livePreviewReadiness: number;
  verificationReadiness: number;
  projectMemoryUsefulness: number;
  projectInsightsUsefulness: number;
  visualPolish: number;
  founderConfidence: number;
  overall: number;
}

export interface FounderTestReport {
  reportId: string;
  generatedAt: number;
  durationMs: number;
  readOnly: true;
  mode: 'founder-testing-v1';
  scores: FounderTestScores;
  verdict: FinalVerdict;
  issues: FounderTestIssue[];
  passed: string[];
  screenResults: ScreenTestResult[];
  promptResults: PromptTestResult[];
  workflowResults: WorkflowTestResult[];
  visualFindings: VisualUxFinding[];
  recommendedFixOrder: string[];
  reportMarkdown: string;
}
