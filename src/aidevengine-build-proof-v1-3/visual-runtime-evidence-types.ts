/**
 * AIDEVENGINE_BUILD_PROOF_V1_3 — bounded visual/runtime evidence types.
 */

export type VisualRuntimeCheckCategory = 'static-artifact' | 'runtime-ui' | 'viewport';

export interface VisualRuntimeCheck {
  readOnly: true;
  id: string;
  label: string;
  category: VisualRuntimeCheckCategory;
  passed: boolean;
  detail: string;
  critical: boolean;
}

export interface VisualRuntimeEvidence {
  readOnly: true;
  generatedAt: string;
  workspacePath: string | null;
  previewArtifactPath: string | null;
  previewUrl: string | null;
  staticArtifactInspectionCompleted: boolean;
  playwrightSupported: boolean;
  playwrightUnsupportedReason: string | null;
  devServerOk: boolean;
  checks: readonly VisualRuntimeCheck[];
  viewportEvidence: readonly string[];
  passedCount: number;
  totalCount: number;
  boundedRuntimePassed: boolean;
}

export interface AuthorityPrerequisiteEntry {
  readOnly: true;
  authority: string;
  evidenceSource: string;
  consumed: boolean;
  score: number | null;
  verdict: string | null;
  missingFields: readonly string[];
  detail: string;
}

export interface AuthorityPrerequisiteMap {
  readOnly: true;
  generatedAt: string;
  entries: readonly AuthorityPrerequisiteEntry[];
}
