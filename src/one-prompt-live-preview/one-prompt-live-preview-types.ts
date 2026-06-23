/**
 * One-Prompt Live Preview — types.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';

export type OnePromptBuildStatus = 'IDLE' | 'BUILDING' | 'READY' | 'FAILED';

export interface OnePromptLivePreviewBuildInput {
  rawPrompt: string;
  projectRootDir: string;
  source?: 'api' | 'chat' | 'validator';
  projectId?: string;
  projectName?: string;
}

export interface OnePromptLivePreviewBuildResult {
  readOnly: true;
  buildId: string;
  projectId: string;
  projectName: string;
  status: OnePromptBuildStatus;
  prompt: string;
  requestType: 'BUILD_FROM_PROMPT' | 'CHAT_BUILD';
  workspaceId: string | null;
  workspacePath: string | null;
  generatedProfile: GeneratedAppProfile | null;
  planningProofLevel: string | null;
  materializationProofLevel: string | null;
  buildResult: 'PASS' | 'FAIL' | null;
  npmInstallOk: boolean;
  npmBuildOk: boolean;
  previewUrl: string | null;
  livePreviewAvailable: boolean;
  failureReason: string | null;
  featureSignals: {
    addTask: boolean;
    markComplete: boolean;
    deleteTask: boolean;
    filter: boolean;
    activeCount: boolean;
    reactMount: boolean;
  } | null;
  updatedAt: string;
}

export interface OnePromptLivePreviewPublicState {
  status: OnePromptBuildStatus;
  projectId: string | null;
  projectName: string | null;
  workspaceId: string | null;
  workspacePath: string | null;
  generatedProfile: GeneratedAppProfile | null;
  buildResult: 'PASS' | 'FAIL' | null;
  previewUrl: string | null;
  failureReason: string | null;
  buildStatusLabel: string;
  connected: boolean;
}
