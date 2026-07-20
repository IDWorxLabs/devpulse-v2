/**
 * Minimal Builder Test Console V1 — fresh project/session bootstrap and response shaping.
 */

import { executeFastProjectCreate } from '../fast-project-create-v1/index.js';
import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';
import {
  deriveProjectNameFromPrompt,
} from '../project-session-continuity-v1/index.js';
import type { BootstrapProjectSessionResult } from '../project-session-continuity-v1/project-session-build-bridge.js';
import { updateProjectSessionRecord } from '../project-session-continuity-v1/project-session-store.js';
import type { MinimalBuilderTestConsoleBuildResponse } from './minimal-builder-test-console-types.js';
import { MINIMAL_BUILDER_TEST_CONSOLE_CONTRACT_VERSION } from './minimal-builder-test-console-types.js';

export function resolveBuilderTestPrompt(body: Record<string, unknown>): string {
  for (const field of ['prompt', 'message'] as const) {
    const raw = body[field];
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim();
    }
  }
  return '';
}

export function resolveBuilderTestProjectName(body: Record<string, unknown>, prompt: string): string {
  // A product identity explicitly declared in the current prompt is authoritative for a fresh
  // build. A populated project-name field may be residue from the previous test.
  if (/\b(?:called|named)\s+/i.test(prompt)) {
    const promptName = deriveProjectNameFromPrompt(prompt);
    if (promptName && promptName !== 'New Project') return promptName;
  }
  for (const field of ['projectName', 'name', 'requestedName'] as const) {
    const raw = body[field];
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim();
    }
  }
  return deriveProjectNameFromPrompt(prompt) || 'BuilderTest';
}

export function bootstrapFreshProjectForBuilderTest(input: {
  rawPrompt: string;
  projectName?: string | null;
  rootDir?: string;
}): BootstrapProjectSessionResult {
  const trimmedPrompt = input.rawPrompt.trim();
  if (!trimmedPrompt) {
    throw new Error('prompt is required for builder test bootstrap');
  }

  const requestedName =
    (/\b(?:called|named)\s+/i.test(trimmedPrompt)
      ? deriveProjectNameFromPrompt(trimmedPrompt)
      : input.projectName?.trim()) ||
    deriveProjectNameFromPrompt(trimmedPrompt) ||
    'BuilderTest';

  const fresh = executeFastProjectCreate({
    name: requestedName,
    confirmFreshCopy: true,
    summary: trimmedPrompt.slice(0, 160),
    rootDir: input.rootDir,
  });

  if (!fresh.ok) {
    throw new Error(fresh.error ?? 'Could not create fresh builder test project');
  }

  updateProjectSessionRecord(
    fresh.projectId,
    fresh.activeSessionId,
    { currentPrompt: trimmedPrompt, projectName: fresh.projectName },
    input.rootDir,
  );

  return {
    readOnly: true,
    projectId: fresh.projectId,
    sessionId: fresh.activeSessionId,
    projectName: fresh.projectName,
    createdProject: true,
    createdSession: true,
  };
}

function resolvePreviewMissingReason(build: OnePromptLivePreviewBuildResult): string | null {
  if (build.previewUrl) return null;
  if (build.failureReason?.trim()) return build.failureReason.trim();
  if (build.previewContract?.gateBlocker?.trim()) return build.previewContract.gateBlocker.trim();
  if (build.livePreviewGate?.blockers?.length) return build.livePreviewGate.blockers[0] ?? null;
  if (build.livePreviewGate?.recommendedNextStep?.trim()) {
    return build.livePreviewGate.recommendedNextStep.trim();
  }
  if (build.previewStatus === 'DEGRADED' && build.diagnosticPreviewUrl) {
    return 'Preview gate degraded — diagnostic URL only, not launch-ready preview';
  }
  if (!build.npmBuildOk) return 'npm run build did not pass — preview was not attempted';
  if (!build.npmInstallOk) return 'npm install did not pass — build spine blocked before preview';
  return 'Preview URL not available after build';
}

export function composeMinimalBuilderTestConsoleResponse(input: {
  sessionBootstrap: BootstrapProjectSessionResult;
  build: OnePromptLivePreviewBuildResult;
  envelope?: Record<string, unknown>;
}): MinimalBuilderTestConsoleBuildResponse {
  const build = input.build;
  const envelope = input.envelope ?? {};
  const rawResponse = {
    ...envelope,
    projectId: input.sessionBootstrap.projectId,
    sessionId: input.sessionBootstrap.sessionId,
    projectName: input.sessionBootstrap.projectName,
    buildRunId: build.buildId,
    status: build.status,
    npmInstallOk: build.npmInstallOk,
    npmBuildOk: build.npmBuildOk,
    previewUrl: build.previewUrl,
    previewMissingReason: resolvePreviewMissingReason(build),
    aeeDecision: build.aeeExecutiveDecision ?? null,
    aeeStage: build.aeeExecutiveDecision?.stage ?? null,
    aelOutcome: build.aelFinalOutcome ?? null,
    finalReport: build.aeeFinalReport ?? build.aelReport ?? null,
    build,
  };

  return {
    ok: build.status === 'READY',
    contractVersion: MINIMAL_BUILDER_TEST_CONSOLE_CONTRACT_VERSION,
    forceFreshProject: true,
    projectId: input.sessionBootstrap.projectId,
    sessionId: input.sessionBootstrap.sessionId,
    projectName: input.sessionBootstrap.projectName,
    buildRunId: build.buildId,
    status: build.status,
    npmInstallOk: build.npmInstallOk,
    npmBuildOk: build.npmBuildOk,
    previewUrl: build.previewUrl,
    previewMissingReason: resolvePreviewMissingReason(build),
    aeeDecision: build.aeeExecutiveDecision ?? null,
    aeeStage: build.aeeExecutiveDecision?.stage ?? null,
    aelOutcome: build.aelFinalOutcome ?? null,
    finalReport: build.aeeFinalReport ?? build.aelReport ?? null,
    createdProject: input.sessionBootstrap.createdProject,
    createdSession: input.sessionBootstrap.createdSession,
    build,
    rawResponse,
  };
}
