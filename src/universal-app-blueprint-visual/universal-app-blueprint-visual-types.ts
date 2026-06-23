/**
 * Universal App Blueprint Visual Validation Authority V1 — types.
 */

export type BlueprintVisualVerdict =
  | 'BLUEPRINT_EXCELLENT'
  | 'BLUEPRINT_GOOD'
  | 'BLUEPRINT_ACCEPTABLE'
  | 'BLUEPRINT_NEEDS_IMPROVEMENT'
  | 'BLUEPRINT_FAIL';

export interface BlueprintVisualCheck {
  id: string;
  category: string;
  label: string;
  passed: boolean;
  detail: string;
  critical: boolean;
}

export interface BlueprintVisualScores {
  visualStructureScore: number;
  navigationScore: number;
  responsivenessScore: number;
  accessibilityScore: number;
  userExperienceScore: number;
  overallBlueprintScore: number;
}

export interface BlueprintVisualAssessment {
  readOnly: true;
  passed: boolean;
  verdict: BlueprintVisualVerdict;
  passToken: string;
  scores: BlueprintVisualScores;
  checks: BlueprintVisualCheck[];
  failedChecks: BlueprintVisualCheck[];
  blocksLaunchReadiness: boolean;
  blocksLaunchReadinessReason: string | null;
  previewUrl: string;
  viewportEvidence: string[];
  generatedAt: string;
  reportMarkdown: string;
}

export interface RunBlueprintVisualValidationInput {
  previewUrl: string;
  appName?: string;
  coreNavLabel?: string;
  timeoutMs?: number;
}
