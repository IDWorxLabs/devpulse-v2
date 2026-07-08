/**
 * Project Resume State — explicit build lifecycle states for incomplete projects.
 */

export type ProjectBuildState =
  | 'COMPLETE'
  | 'LAUNCH_READY'
  | 'NEEDS_WORK'
  | 'FAILED'
  | 'PARTIAL'
  | 'REPAIRABLE'
  | 'RESUMABLE'
  | 'STALE'
  | 'DUPLICATE_RISK';

export type ProjectResumePrimaryAction =
  | 'RESUME_BUILD'
  | 'REPAIR_BUILD'
  | 'CONTINUE_FROM_PROMPT'
  | 'START_FRESH_COPY'
  | 'ARCHIVE_FAILED_ATTEMPT';

export const PROJECT_RESUME_STATE_PASS_TOKEN = 'PROJECT_RESUME_STATE_V1_PASS' as const;

export interface ProjectBuildStateEvidence {
  readOnly: true;
  materializationQualityVerdict: string | null;
  materializationQualityScore: number | null;
  workspaceRealityStatus: string | null;
  featureContractRealityStatus: string | null;
  lastSuccessfulBuildRunId: string | null;
  lastFailedBuildRunId: string | null;
  failureReason: string | null;
  featureModuleCount: number | null;
  generatedFileCount: number | null;
  hasOriginalPrompt: boolean;
  lastStableBuildBoundary: string | null;
}

export interface ProjectBuildStateResult {
  readOnly: true;
  projectId: string;
  projectName: string;
  buildState: ProjectBuildState;
  resumable: boolean;
  repairable: boolean;
  duplicateRisk: boolean;
  bannerMessage: string;
  primaryActions: readonly ProjectResumePrimaryAction[];
  evidence: ProjectBuildStateEvidence;
  originalPrompt: string | null;
  promptHash: string | null;
}

export interface DuplicateProjectResumeInput {
  rawPrompt: string;
  projectId?: string | null;
  projectName?: string | null;
  rootDir?: string;
  confirmResume?: boolean;
  confirmFreshCopy?: boolean;
}

export interface DuplicateProjectResumeResult {
  readOnly: true;
  shouldBlock: boolean;
  resumingExistingProject: boolean;
  resumingProjectId: string | null;
  resumingProjectName: string | null;
  effectivePrompt: string | null;
  promptSource: 'USER' | 'STORED' | 'NONE';
  reason: string;
  buildState: ProjectBuildState | null;
  duplicateMatchType: 'NONE' | 'SAME_NAME' | 'SAME_PROMPT_HASH' | 'SIMILAR_DOMAIN' | 'OVERLAPPING_CONTRACT';
}

export interface ProjectResumePlan {
  readOnly: true;
  projectId: string;
  projectName: string;
  buildState: ProjectBuildState;
  effectivePrompt: string;
  promptSource: 'USER' | 'STORED';
  resumeFromBuildRunId: string | null;
  lastStableBuildBoundary: string | null;
  failureReason: string | null;
  primaryAction: ProjectResumePrimaryAction;
}
