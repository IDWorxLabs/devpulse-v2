/**
 * Engineering Reality Authority V1 — types.
 */

export type SecurityVerdict =
  | 'SECURITY_EXCELLENT'
  | 'SECURITY_GOOD'
  | 'SECURITY_ACCEPTABLE'
  | 'SECURITY_FAIL';

export type PerformanceVerdict =
  | 'PERFORMANCE_EXCELLENT'
  | 'PERFORMANCE_GOOD'
  | 'PERFORMANCE_ACCEPTABLE'
  | 'PERFORMANCE_FAIL';

export type AccessibilityVerdict =
  | 'ACCESSIBILITY_EXCELLENT'
  | 'ACCESSIBILITY_GOOD'
  | 'ACCESSIBILITY_ACCEPTABLE'
  | 'ACCESSIBILITY_FAIL';

export type EngineeringRealityVerdict =
  | 'ENGINEERING_EXCELLENT'
  | 'ENGINEERING_GOOD'
  | 'ENGINEERING_ACCEPTABLE'
  | 'ENGINEERING_NEEDS_IMPROVEMENT'
  | 'ENGINEERING_FAIL';

export interface EngineeringRealityCheck {
  id: string;
  category: 'security' | 'performance' | 'accessibility' | 'build';
  label: string;
  passed: boolean;
  detail: string;
  critical: boolean;
}

export interface EngineeringBuildAnalysis {
  passed: boolean;
  exitCode: number;
  outputBytes: number;
  warnings: string[];
  detail: string;
}

export interface EngineeringLoadAnalysis {
  launchMs: number;
  shellMs: number;
  navigationMs: number;
  detail: string;
}

export interface EngineeringRuntimeHealth {
  consoleErrors: string[];
  consoleWarnings: string[];
  detail: string;
}

export interface EngineeringSecurityAnalysis {
  verdict: SecurityVerdict;
  score: number;
  criticalFindings: string[];
  warnings: string[];
  recommendations: string[];
}

export interface EngineeringPerformanceAnalysis {
  verdict: PerformanceVerdict;
  score: number;
  loadTimeAnalysis: EngineeringLoadAnalysis;
  interactionAnalysis: string;
  runtimeHealth: EngineeringRuntimeHealth;
}

export interface EngineeringAccessibilityAnalysis {
  verdict: AccessibilityVerdict;
  score: number;
  findings: string[];
  recommendations: string[];
}

export interface EngineeringRealityScores {
  securityScore: number;
  performanceScore: number;
  accessibilityScore: number;
  overallEngineeringScore: number;
}

export interface EngineeringRealityAssessment {
  readOnly: true;
  passed: boolean;
  verdict: EngineeringRealityVerdict;
  passToken: string;
  scores: EngineeringRealityScores;
  security: EngineeringSecurityAnalysis;
  performance: EngineeringPerformanceAnalysis;
  accessibility: EngineeringAccessibilityAnalysis;
  checks: EngineeringRealityCheck[];
  failedChecks: EngineeringRealityCheck[];
  buildAnalysis: EngineeringBuildAnalysis;
  blocksLaunchReadiness: boolean;
  blocksLaunchReadinessReason: string | null;
  previewUrl: string;
  contractId: string;
  productName: string;
  generatedAt: string;
  reportMarkdown: string;
}

export interface RunEngineeringRealityValidationInput {
  previewUrl: string;
  workspaceDir: string;
  contractId: string;
  productName: string;
  navLabel: string;
}
