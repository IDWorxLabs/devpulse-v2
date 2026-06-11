/**
 * AiDevEngine Founder Testing Mode V2 — report types.
 */

import type { ArchitectureLeakageLevel } from './founder-proxy-architecture-leakage.js';
import type {
  FounderTestIssue,
  FounderTestReport,
  LiveScreenResultInput,
  ScreenTestResult,
  WorkflowTestResult,
} from './founder-testing-types.js';

export type FounderTestV2Verdict =
  | 'TECHNICALLY_READY_PRODUCT_NOT_READY'
  | 'PRODUCT_USABLE_NEEDS_POLISH'
  | 'VISION_MISALIGNED'
  | 'FOUNDER_APPROVAL_RECOMMENDED'
  | 'LAUNCH_CANDIDATE';

export interface ProductReadinessReality {
  technicalReadiness: number;
  productReadiness: number;
  founderReadiness: number;
  customerReadiness: number;
  visionAlignment: number;
}

export interface FounderApprovalPrediction {
  likelihood: number;
  reasoning: string;
}

export interface ConfusionRisk {
  screens: string;
  risk: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ScreenPurposeResult {
  screen: string;
  viewId: string;
  whatIsClear: boolean;
  whyCareClear: boolean;
  nextActionClear: boolean;
  visionAlignment: number;
  usefulness: number;
  founderExpectationAlignment: number;
  architectureLeakage: ArchitectureLeakageLevel;
  issues: string[];
}

export interface PromptVisionResult {
  prompt: string;
  responsePreview: string;
  visionAlignment: number;
  usefulness: number;
  clarity: number;
  actionability: number;
  nextStepQuality: number;
  architectureLeakage: ArchitectureLeakageLevel;
  leakageFindings: string[];
  passed: boolean;
  issues: string[];
}

export interface FounderTestV2Report {
  reportId: string;
  generatedAt: number;
  durationMs: number;
  readOnly: true;
  mode: 'founder-testing-v2';
  v1: FounderTestReport;
  readinessReality: ProductReadinessReality;
  founderApproval: FounderApprovalPrediction;
  understandabilityScore: number;
  confusionRisks: ConfusionRisk[];
  screenPurposeResults: ScreenPurposeResult[];
  promptVisionResults: PromptVisionResult[];
  architectureLeakageSummary: ArchitectureLeakageLevel;
  topFounderConcerns: string[];
  verdict: FounderTestV2Verdict;
  issues: FounderTestIssue[];
  recommendedFixOrder: string[];
  copyPasteFixPrompts: string[];
  reportMarkdown: string;
}

export interface RunFounderTestingModeV2Input {
  rootDir?: string;
  validatorScripts?: string[];
  liveResults?: LiveScreenResultInput[];
  liveSection?: string;
}

export interface FounderProxyScreenContext {
  screen: string;
  viewId: string;
  surfaceText: string;
}
