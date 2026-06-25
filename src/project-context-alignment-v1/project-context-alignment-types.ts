/**
 * Project Context Alignment Guard V1 — types.
 */

export const PROJECT_CONTEXT_ALIGNMENT_PASS_TOKEN = 'PROJECT_CONTEXT_ALIGNMENT_V1_PASS' as const;

export type ProjectContextAlignmentVerdict =
  | 'ALIGNED'
  | 'POSSIBLY_MISPLACED'
  | 'DEFINITELY_MISPLACED'
  | 'BELONGS_TO_EXISTING_PROJECT'
  | 'NEW_PROJECT_SUGGESTED';

export type ProjectContextSuggestedAction =
  | 'NONE'
  | 'SWITCH_PROJECT'
  | 'CREATE_NEW_PROJECT'
  | 'CONFIRM_CONTINUE';

export type ProjectContextProfileConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ProjectContextMetadata {
  readOnly: true;
  projectId: string;
  name: string;
  domain: string;
  appType: string;
  keywords: string[];
  profile: string | null;
  lastBuildIntentSummary: string | null;
  profileConfidence: ProjectContextProfileConfidence;
  updatedAt: string;
}

export interface ProjectContextAlignmentAction {
  readOnly: true;
  type: 'switch_project' | 'create_project' | 'continue_anyway';
  label: string;
  projectId?: string;
  projectName?: string;
}

export interface ProjectContextAlignmentInput {
  prompt: string;
  activeProjectId?: string | null;
  activeProjectName?: string | null;
  confirmProjectContextAlignment?: boolean;
  rootDir?: string;
}

export interface ProjectContextAlignmentResult {
  readOnly: true;
  verdict: ProjectContextAlignmentVerdict;
  blocksExecution: boolean;
  activeProjectId: string | null;
  activeProjectName: string | null;
  promptDomain: string;
  activeProjectDomain: string;
  reason: string;
  suggestedProjectId: string | null;
  suggestedProjectName: string | null;
  suggestedAction: ProjectContextSuggestedAction;
  proposedNewProjectName: string | null;
  actions: ProjectContextAlignmentAction[];
  alignmentScore: number;
}

export interface PromptDomainSignals {
  readOnly: true;
  domainIds: string[];
  domainLabel: string;
  keywords: string[];
  profile: string | null;
  appType: string | null;
  proposedProjectName: string | null;
}
