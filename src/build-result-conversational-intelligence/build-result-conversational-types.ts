/**
 * Build Result Conversational Intelligence V1 — types.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ProfileAlignmentVerdict } from '../build-profile-classification/index.js';
import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';

export const UNIFIED_BUILD_CONVERSATION_LAYER_V1_PASS_TOKEN =
  'UNIFIED_BUILD_CONVERSATION_LAYER_V1_PASS';

export const BUILD_RESULT_CONVERSATIONAL_INTELLIGENCE_V1_PASS_TOKEN =
  'BUILD_RESULT_CONVERSATIONAL_INTELLIGENCE_V1_PASS';

export const BUILD_RESULT_TEMPLATE_FALLBACK_MARKER = '[Template fallback — LLM unavailable]';

export interface BuildProfileClassificationEvidence {
  readOnly: true;
  category: 'BUILD';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  selectedProfile: GeneratedAppProfile | null;
  matchedKeywords: string[];
  matchedSignals: string[];
  reason: string;
  inferredProductIntent: string | null;
  profileMismatchWarnings: string[];
  rejectedProfiles: GeneratedAppProfile[];
  rejectionReasons: string[];
  fallbackReason: string | null;
  alignmentVerdict: ProfileAlignmentVerdict;
  alignmentReason: string;
}

export interface BuildResultConversationalContext {
  readOnly: true;
  userPrompt: string;
  activeProjectId: string;
  activeProjectName: string;
  buildRunId: string;
  selectedProfile: GeneratedAppProfile | null;
  workspacePath: string | null;
  buildStatus: OnePromptLivePreviewBuildResult['status'];
  buildResult: OnePromptLivePreviewBuildResult['buildResult'];
  previewUrl: string | null;
  failureReason: string | null;
  architectureSummary: string | null;
  planTaskCount: number | null;
  buildStage: string | null;
  generatedFilesCount: number | null;
  classification: BuildProfileClassificationEvidence;
  templateFallback: string;
}

export interface ApplyBuildResultConversationalInput {
  message: string;
  payload: Record<string, unknown>;
  buildResult: OnePromptLivePreviewBuildResult;
  rootDir?: string;
}
