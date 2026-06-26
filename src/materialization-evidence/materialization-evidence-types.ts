/**
 * Materialization Evidence Completion V1 — types for forensic workspace audit.
 */

export const MATERIALIZATION_EVIDENCE_COMPLETION_V1_PASS_TOKEN =
  'MATERIALIZATION_EVIDENCE_COMPLETION_V1_PASS';

export type GeneratedFileCategory =
  | 'Component'
  | 'Page'
  | 'Feature'
  | 'Service'
  | 'Model'
  | 'Asset'
  | 'Config'
  | 'Style'
  | 'Route'
  | 'Provider'
  | 'Hook'
  | 'Utility'
  | 'Validation'
  | 'Test'
  | 'Theme';

export interface GeneratedFileInventoryEntry {
  path: string;
  size: number;
  extension: string;
  lines: number;
  category: GeneratedFileCategory;
  hash: string;
}

export interface MaterializationRuntimeTimings {
  planningDurationMs: number;
  materializationDurationMs: number;
  fileGenerationDurationMs: number;
  validationDurationMs: number;
  manifestWriteDurationMs: number;
  npmInstallDurationMs: number;
  npmBuildDurationMs: number;
  previewDurationMs: number;
  generationDurationMs: number;
}

export interface WorkspaceDiscoveryResult {
  readOnly: true;
  files: GeneratedFileInventoryEntry[];
  directories: string[];
  workspaceSizeBytes: number;
  largestFile: GeneratedFileInventoryEntry | null;
  smallestFile: GeneratedFileInventoryEntry | null;
  averageFileSizeBytes: number;
  totalLinesGenerated: number;
  generatedComponentsCount: number;
  generatedPagesCount: number;
  generatedFeatureModulesCount: number;
  generatedRoutesCount: number;
  generatedServicesCount: number;
  generatedModelsCount: number;
  generatedAssetsCount: number;
  generatedStylesCount: number;
  generatedTestsCount: number;
  generatedFilesCount: number;
  generatedDirectoriesCount: number;
}

export interface MaterializationHashBundle {
  workspaceHash: string;
  manifestHash: string;
  materializationHash: string;
}

export interface MaterializationEvidenceCompletionInput {
  workspaceDir: string;
  prompt: string;
  projectId: string;
  projectName: string;
  buildRunId: string;
  selectedProfile: string;
  expectedAppType: string;
  promptSummary: string;
  confidence: string;
  featureModules: string[];
  routes: string[];
  fallbackUsed: boolean;
  validation: {
    passed: boolean;
    blueprintShellPresent: boolean;
    featureModulesPresent: boolean;
    promptSpecificTermsPresent: boolean;
    warnings: string[];
    errors: string[];
  };
  timings: MaterializationRuntimeTimings;
  promptFaithfulness?: import('../prompt-faithful-generation/prompt-faithful-generation-types.js').PromptFaithfulnessManifestFields;
}

export interface MaterializationEvidenceCompletionResult {
  readOnly: true;
  manifestWritten: boolean;
  manifestPath: string;
  manifest: import('../universal-prompt-to-app-materialization/generated-app-manifest.js').GeneratedAppManifest;
  discovery: WorkspaceDiscoveryResult;
  hashes: MaterializationHashBundle;
  manifestWriteDurationMs: number;
}

export interface FounderTestMaterializationEvidenceAssessment {
  readOnly: true;
  manifestPresent: boolean;
  manifestComplete: boolean;
  generatedFilesCount: number;
  generatedRoutesCount: number;
  generatedFeatureModulesCount: number;
  totalLinesGenerated: number;
  workspaceSizeBytes: number;
  workspaceHash: string | null;
  materializationHash: string | null;
  validationStatus: string | null;
  timingEvidencePresent: boolean;
  placeholderFieldsRemaining: string[];
}
