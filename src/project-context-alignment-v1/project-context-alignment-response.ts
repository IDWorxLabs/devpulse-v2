/**
 * Compose Command Center responses for project context alignment guard.
 */

import type { OperatorFeedEvent } from '../command-center-brain/brain-types.js';
import { BUILD_FROM_PROMPT_API_PATH } from '../one-prompt-live-preview/one-prompt-live-preview-registry.js';
import { listMultiProjectWorkspaces } from '../one-prompt-live-preview/workspace-tab-registry.js';
import { tagOperatorFeedEventWithProjectId } from '../project-isolation-guard-v1/index.js';
import type { ProjectContextAlignmentResult } from './project-context-alignment-types.js';

export function composeProjectContextAlignmentBrainResponse(
  alignment: ProjectContextAlignmentResult,
): string {
  const lines = [
    `Active project: ${alignment.activeProjectName ?? 'none'}`,
    '',
    alignment.reason,
    '',
    `Prompt domain: ${alignment.promptDomain}`,
    `Active project domain: ${alignment.activeProjectDomain}`,
  ];

  if (alignment.suggestedProjectName) {
    lines.push('', `Suggested project: ${alignment.suggestedProjectName}`);
  }
  if (alignment.proposedNewProjectName && alignment.verdict !== 'BELONGS_TO_EXISTING_PROJECT') {
    lines.push('', `Suggested new project name: ${alignment.proposedNewProjectName}`);
  }
  if (alignment.verdict === 'POSSIBLY_MISPLACED') {
    lines.push('', 'Choose an action below, or confirm to continue in the current project.');
  } else {
    lines.push('', 'Build execution was not started.');
  }

  return lines.join('\n');
}

export function buildProjectContextAlignmentFeedEvents(
  alignment: ProjectContextAlignmentResult,
): OperatorFeedEvent[] {
  return [
    tagOperatorFeedEventWithProjectId(
      {
        eventId: `alignment-${Date.now()}`,
        eventType: 'Checking Blockers',
        timestamp: Date.now(),
        informationalOnly: true,
        section: 'Build',
        action: 'Project context alignment guard',
        detail: alignment.reason,
        status: 'Blocked',
        stepIndex: 1,
        stepTotal: 1,
        evidence: alignment.verdict,
      },
      alignment.activeProjectId,
      { scope: 'PROJECT' },
    ),
  ];
}

export function composeProjectContextAlignmentBrainApiPayload(input: {
  message: string;
  alignment: ProjectContextAlignmentResult;
}): Record<string, unknown> {
  const brainResponse = composeProjectContextAlignmentBrainResponse(input.alignment);
  return {
    responseId: `brain-alignment-${Date.now()}`,
    userMessage: input.message,
    brainResponse,
    category: 'PROJECT_CONTEXT_ALIGNMENT',
    activeProjectId: input.alignment.activeProjectId,
    multiProjectWorkspaces: listMultiProjectWorkspaces(),
    projectContextAlignment: input.alignment,
    classification: {
      category: 'PROJECT_CONTEXT_ALIGNMENT',
      confidence: 'HIGH',
      matchedSignals: [input.alignment.verdict, input.alignment.promptDomain],
      reason: 'Build prompt blocked by project context alignment guard',
    },
    operatorFeedEvents: buildProjectContextAlignmentFeedEvents(input.alignment),
    llmChatBrainDiagnostics: {
      llmConnected: false,
      usedLlm: false,
      skippedReason: 'Project context alignment guard — build execution not started',
    },
    confirmation: {
      intelligenceOnly: true,
      noExecutionPerformed: true,
      noCommandsExecuted: true,
      noFilesModified: true,
      noCodeGenerated: true,
      noDeploymentPerformed: true,
      noAutoFixPerformed: true,
      noRuntimeMutation: true,
      noExternalAiCalls: true,
      noPersistence: false,
      noSystemReplacement: true,
    },
  };
}

export function composeProjectContextAlignmentBuildFromPromptPayload(input: {
  prompt: string;
  alignment: ProjectContextAlignmentResult;
}): Record<string, unknown> {
  const message = composeProjectContextAlignmentBrainResponse(input.alignment);
  return {
    ok: false,
    endpoint: BUILD_FROM_PROMPT_API_PATH,
    category: 'PROJECT_CONTEXT_ALIGNMENT',
    activeProjectId: input.alignment.activeProjectId,
    prompt: input.prompt,
    message,
    brainResponse: message,
    projectContextAlignment: input.alignment,
    multiProjectWorkspaces: listMultiProjectWorkspaces(),
    confirmation: {
      intelligenceOnly: true,
      noExecutionPerformed: true,
      noCommandsExecuted: true,
      noFilesModified: true,
      noCodeGenerated: true,
      noDeploymentPerformed: true,
      noAutoFixPerformed: true,
      noRuntimeMutation: true,
      noExternalAiCalls: true,
      noPersistence: true,
      noSystemReplacement: true,
    },
  };
}
