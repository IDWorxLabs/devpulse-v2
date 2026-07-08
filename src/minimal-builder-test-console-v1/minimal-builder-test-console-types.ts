/**
 * Minimal Builder Test Console V1 — types for Command Center bypass testing.
 */

import type { AeeExecutiveDecisionResult, AeeFinalReport } from '../autonomous-engineering-executive/aee-types.js';
import type { AelFinalOutcome, AelFinalReport } from '../autonomous-engineering-loop/ael-types.js';
import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';

export const MINIMAL_BUILDER_TEST_CONSOLE_V1_PASS_TOKEN = 'MINIMAL_BUILDER_TEST_CONSOLE_V1_PASS';
export const MINIMAL_BUILDER_TEST_CONSOLE_CONTRACT_VERSION = 'MINIMAL_BUILDER_TEST_CONSOLE_V1';
export const MINIMAL_BUILDER_TEST_CONSOLE_ROUTE = '/builder-test';
export const MINIMAL_BUILDER_TEST_CONSOLE_TRACE = 'MINIMAL_BUILDER_TEST_CONSOLE_BUILD_COMPLETE';

export interface MinimalBuilderTestConsoleBuildResponse {
  ok: boolean;
  contractVersion: typeof MINIMAL_BUILDER_TEST_CONSOLE_CONTRACT_VERSION;
  forceFreshProject: true;
  projectId: string;
  sessionId: string;
  projectName: string;
  buildRunId: string;
  status: OnePromptLivePreviewBuildResult['status'];
  npmInstallOk: boolean;
  npmBuildOk: boolean;
  previewUrl: string | null;
  previewMissingReason: string | null;
  aeeDecision: AeeExecutiveDecisionResult | null;
  aeeStage: string | null;
  aelOutcome: AelFinalOutcome | null;
  finalReport: AeeFinalReport | AelFinalReport | null;
  createdProject: boolean;
  createdSession: boolean;
  build: OnePromptLivePreviewBuildResult;
  rawResponse: Record<string, unknown>;
}
