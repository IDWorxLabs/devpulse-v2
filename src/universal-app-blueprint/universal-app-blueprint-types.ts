/**
 * AiDevEngine Universal App Blueprint v1.0 — types.
 */

export const UNIVERSAL_APP_BLUEPRINT_VERSION = '1.0' as const;

export interface UniversalBlueprintBuildInput {
  contractId: string;
  ideaId: string;
  buildUnits: string[];
  appName: string;
  tagline: string;
  coreFeatureLabel?: string;
  coreFeatureImportPath?: string;
  coreFeatureComponentName?: string;
}

export interface UniversalBlueprintInspectionResult {
  readOnly: true;
  passed: boolean;
  version: typeof UNIVERSAL_APP_BLUEPRINT_VERSION;
  missingArtifacts: string[];
  missingPatterns: string[];
  checkedArtifacts: number;
}

export interface UniversalBlueprintWorkspaceFile {
  relativePath: string;
  content: string;
}
