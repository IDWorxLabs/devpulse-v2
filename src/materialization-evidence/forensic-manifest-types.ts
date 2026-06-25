/**
 * Failed Build Forensic Manifest V1 — lifecycle types.
 */

export const FAILED_BUILD_FORENSIC_MANIFEST_V1_PASS_TOKEN =
  'FAILED_BUILD_FORENSIC_MANIFEST_V1_PASS';

export type ForensicManifestStatus = 'IN_PROGRESS' | 'PASS' | 'FAIL' | 'PARTIAL' | 'ABORTED';

export type ForensicBuildStage =
  | 'STARTED'
  | 'PROMPT_RECEIVED'
  | 'PROFILE_SELECTED'
  | 'PLANNING'
  | 'WORKSPACE_CREATED'
  | 'MATERIALIZATION'
  | 'MATERIALIZATION_VALIDATION'
  | 'NPM_INSTALL'
  | 'NPM_BUILD'
  | 'PREVIEW'
  | 'FINAL_VALIDATION'
  | 'COMPLETE';

export interface ForensicManifestStageRecord {
  stage: ForensicBuildStage;
  status: ForensicManifestStatus;
  timestamp: string;
  durationMs: number;
  warnings: string[];
  errors: string[];
  generatedFilesCount: number;
  generatedDirectoriesCount: number;
}

export interface ForensicCommandFailure {
  failedCommand: string;
  exitCode: number | null;
  stderrPreview: string | null;
  stdoutPreview: string | null;
  failureMessage: string;
  errorCode: string | null;
  stackPreview: string | null;
}

export interface ForensicManifestFailureInput {
  failureStage: ForensicBuildStage;
  failureReason: string;
  failureMessage?: string;
  errorCode?: string | null;
  stackPreview?: string | null;
  lastSuccessfulStage?: ForensicBuildStage | null;
  commandFailure?: ForensicCommandFailure | null;
  warnings?: string[];
  errors?: string[];
  status?: 'FAIL' | 'PARTIAL' | 'ABORTED';
}

export interface ForensicManifestInitializeInput {
  workspaceDir: string;
  workspacePath: string;
  projectId: string;
  projectName: string;
  buildRunId: string;
  prompt: string;
  selectedProfile: string;
  expectedAppType: string;
  promptSummary: string;
  confidence: string;
  featureModules: string[];
  routes: string[];
  fallbackUsed?: boolean;
}

export interface ForensicManifestStageUpdate {
  stage: ForensicBuildStage;
  status?: ForensicManifestStatus;
  durationMs?: number;
  warnings?: string[];
  errors?: string[];
  timingsPatch?: Partial<{
    planningDurationMs: number;
    materializationDurationMs: number;
    fileGenerationDurationMs: number;
    validationDurationMs: number;
    npmInstallDurationMs: number;
    npmBuildDurationMs: number;
    previewDurationMs: number;
    generationDurationMs: number;
  }>;
  selectedProfile?: string;
  confidence?: string;
}
