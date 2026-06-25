/**
 * Unified Build Conversation Layer V1 — single LLM path for all build outcomes.
 */

import { getBuildIntentRun } from '../build-intent-routing/build-intent-run-store.js';
import {
  createLlmProvider,
  getLlmProviderStatus,
  loadLlmModelConfig,
  toLlmChatBrainDiagnostics,
} from '../llm-chat-brain/index.js';
import type { LlmChatBrainMetadata } from '../llm-chat-brain/llm-chat-types.js';
import { buildDevPulseContextPackage } from '../llm-chat-brain/devpulse-context-package.js';
import { metadataFromContextPackage } from '../llm-chat-brain/llm-chat-types.js';
import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';
import { analyzeBuildProfileClassification } from './build-result-classification-evidence.js';
import {
  buildBuildResultConversationalSystemInstructions,
  buildBuildResultConversationalUserMessage,
  promptUsesStructuredEvidence,
} from './build-result-llm-instructions.js';
import type {
  ApplyBuildResultConversationalInput,
  BuildResultConversationalContext,
} from './build-result-conversational-types.js';
import { BUILD_RESULT_TEMPLATE_FALLBACK_MARKER } from './build-result-conversational-types.js';
import {
  composeProfileMismatchChatResponse,
  hasProfileMismatchEvidence,
} from './build-profile-mismatch-response.js';
import { buildLlmConnectionProof } from '../llm-connection-proof-v1/index.js';
import type { BuildResultLlmResponseSource } from '../llm-connection-proof-v1/index.js';
import { buildUnifiedBuildConversationDiagnostics } from './unified-build-conversation-diagnostics.js';
import { chatContainsMechanicalRuntimeDump } from '../execution-trace/index.js';
import type { ExecutionTraceEvidenceBundle } from '../execution-trace/execution-trace-types.js';

const BUILD_RESULT_LLM_CALL_FUNCTION = 'createLlmProvider(config).chat';

function buildTemplateFallbackBrainResponse(templateFallback: string, reason: string): string {
  return `${BUILD_RESULT_TEMPLATE_FALLBACK_MARKER}\n\n${templateFallback}\n\n_${reason}_`;
}

function resolveDisconnectedFallbackResponse(
  context: BuildResultConversationalContext,
  templateFallback: string,
  reason: string,
): string {
  if (hasProfileMismatchEvidence(context)) {
    return composeProfileMismatchChatResponse(context);
  }
  return buildTemplateFallbackBrainResponse(templateFallback, reason);
}

function buildDisconnectedMetadata(
  reason: string,
  rootDir: string,
  message: string,
): LlmChatBrainMetadata {
  const contextPackage = buildDevPulseContextPackage({ rootDir, message });
  const ctxMeta = metadataFromContextPackage(contextPackage);
  return {
    readOnly: true,
    usedLlm: false,
    llmConnected: false,
    fallbackUsed: true,
    provider: null,
    model: null,
    contextIncluded: ctxMeta.contextIncluded,
    evidenceIncluded: ctxMeta.evidenceIncluded,
    judgeScore: null,
    warnings: [reason, BUILD_RESULT_TEMPLATE_FALLBACK_MARKER],
    repaired: false,
    repairAttempted: false,
    contextSourcesUsed: ctxMeta.contextSourcesUsed,
    lastContextHydration: ctxMeta.lastContextHydration,
    hydratedFactCount: ctxMeta.hydratedFactCount,
    contextConfidence: ctxMeta.contextConfidence,
    identityLoaded: ctxMeta.identityLoaded,
    founderLoaded: ctxMeta.founderLoaded,
    productLoaded: ctxMeta.productLoaded,
    historyLoaded: ctxMeta.historyLoaded,
    selfEvolutionLoaded: ctxMeta.selfEvolutionLoaded,
    identityVersion: ctxMeta.identityVersion,
    founderVersion: ctxMeta.founderVersion,
    productVersion: ctxMeta.productVersion,
    currentProductIdentity: ctxMeta.currentProductIdentity,
    founderIdentity: ctxMeta.founderIdentity,
    companyIdentity: ctxMeta.companyIdentity,
    legacyIdentity: ctxMeta.legacyIdentity,
  };
}

function buildLlmDiagnosticsPayload(input: {
  metadata: LlmChatBrainMetadata;
  unified: ReturnType<typeof buildUnifiedBuildConversationDiagnostics>;
  llmConnectionProof: ReturnType<typeof buildLlmConnectionProof>;
  skippedReason: string | null;
  profileMismatchEvidence: boolean;
}): Record<string, unknown> {
  return {
    ...toLlmChatBrainDiagnostics(input.metadata),
    ...input.unified,
    responseSource: input.unified.responseSource,
    skippedReason: input.skippedReason,
    profileMismatchEvidence: input.profileMismatchEvidence,
    llmConnectionProof: input.llmConnectionProof,
  };
}

export function buildBuildResultConversationalContext(input: {
  message: string;
  buildResult: OnePromptLivePreviewBuildResult;
  templateFallback: string;
}): BuildResultConversationalContext {
  const buildRun = getBuildIntentRun(input.buildResult.buildId);

  const classification = analyzeBuildProfileClassification(
    input.message,
    input.buildResult.generatedProfile,
  );

  return {
    readOnly: true,
    userPrompt: input.message,
    activeProjectId: input.buildResult.projectId,
    activeProjectName: input.buildResult.projectName,
    buildRunId: input.buildResult.buildId,
    selectedProfile: input.buildResult.generatedProfile,
    workspacePath: input.buildResult.workspacePath,
    buildStatus: input.buildResult.status,
    buildResult: input.buildResult.buildResult,
    previewUrl: input.buildResult.previewUrl,
    failureReason: input.buildResult.failureReason,
    architectureSummary: buildRun?.architectureSummary ?? null,
    planTaskCount: buildRun?.planTaskCount ?? null,
    buildStage: buildRun?.stage ?? null,
    generatedFilesCount:
      input.buildResult.materializationManifest?.generatedFilesCount ??
      input.buildResult.materializationManifest?.generatedFiles.length ??
      null,
    classification,
    templateFallback: input.templateFallback,
  };
}

export async function applyBuildResultConversationalIntelligence(
  input: ApplyBuildResultConversationalInput,
): Promise<Record<string, unknown>> {
  const rootDir = input.rootDir ?? process.cwd();
  const templateFallback = String(input.payload.brainResponse ?? '');
  const context = buildBuildResultConversationalContext({
    message: input.message,
    buildResult: input.buildResult,
    templateFallback,
  });
  const profileMismatchEvidence = hasProfileMismatchEvidence(context);
  const executionTraceEvidence = input.payload.executionTraceEvidence as
    | ExecutionTraceEvidenceBundle
    | undefined;

  const llmStatus = getLlmProviderStatus();
  const basePayload = {
    ...input.payload,
    buildChatTemplateFallback: templateFallback,
    classification: context.classification,
    buildResultConversationalContext: context,
    profileAlignment: {
      verdict: context.classification.alignmentVerdict,
      reason: context.classification.alignmentReason,
      selectedProfile: context.selectedProfile,
      inferredProductIntent: context.classification.inferredProductIntent,
      matchedKeywords: context.classification.matchedKeywords,
      profileMismatchWarnings: context.classification.profileMismatchWarnings,
    },
  };

  const systemInstruction = buildBuildResultConversationalSystemInstructions(context, rootDir);
  const userMessage = buildBuildResultConversationalUserMessage(
    context,
    input.buildResult,
    executionTraceEvidence ?? null,
  );
  const structuredEvidencePrompt = promptUsesStructuredEvidence(userMessage);

  if (!llmStatus.connected) {
    const reason = 'reason' in llmStatus ? llmStatus.reason : 'LLM not connected';
    const fallbackBrainResponse = resolveDisconnectedFallbackResponse(context, templateFallback, reason);
    const responseSource: BuildResultLlmResponseSource = 'TEMPLATE_FALLBACK';
    const llmConnectionProof = buildLlmConnectionProof({
      llmCallFunction: null,
      systemPrompt: systemInstruction,
      userPrompt: userMessage,
      rawLlmResponse: null,
      finalBrainResponse: fallbackBrainResponse,
      fallbackUsed: true,
      responseSource,
      llmInvoked: false,
      templateFallback,
    });
    const unified = buildUnifiedBuildConversationDiagnostics({
      responseSource,
      fallbackUsed: true,
      fallbackReason: reason,
      llmInvoked: false,
      rawLlmResponse: null,
      finalBrainResponse: fallbackBrainResponse,
      profileMismatchPassedToLlm: false,
      promptUsedStructuredEvidence: structuredEvidencePrompt,
    });

    return {
      ...basePayload,
      brainResponse: fallbackBrainResponse,
      llmChatBrainDiagnostics: buildLlmDiagnosticsPayload({
        metadata: buildDisconnectedMetadata(reason, rootDir, input.message),
        unified,
        llmConnectionProof,
        skippedReason: 'Build completion used fallback — LLM unavailable',
        profileMismatchEvidence,
      }),
      confirmation: {
        ...(input.payload.confirmation as Record<string, unknown> | undefined),
        noExternalAiCalls: true,
      },
    };
  }

  try {
    const config = loadLlmModelConfig();
    const provider = createLlmProvider(config);
    const response = await provider.chat({
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userMessage },
      ],
    });

    const rawLlmResponse = response.content.trim();
    const usedEmptyFallback = rawLlmResponse.length === 0;
    const conversationalAnswer = usedEmptyFallback
      ? resolveDisconnectedFallbackResponse(context, templateFallback, 'LLM returned empty content')
      : rawLlmResponse;
    const responseSource: BuildResultLlmResponseSource = usedEmptyFallback
      ? 'TEMPLATE_FALLBACK'
      : 'LLM';

    const llmConnectionProof = buildLlmConnectionProof({
      llmCallFunction: BUILD_RESULT_LLM_CALL_FUNCTION,
      systemPrompt: systemInstruction,
      userPrompt: userMessage,
      rawLlmResponse: usedEmptyFallback ? null : rawLlmResponse,
      finalBrainResponse: conversationalAnswer,
      fallbackUsed: usedEmptyFallback,
      responseSource,
      llmInvoked: true,
      templateFallback,
    });

    const contextPackage = buildDevPulseContextPackage({ rootDir, message: input.message });
    const metadata: LlmChatBrainMetadata = {
      readOnly: true,
      usedLlm: true,
      llmConnected: true,
      fallbackUsed: usedEmptyFallback,
      provider: llmStatus.provider,
      model: llmStatus.model,
      ...metadataFromContextPackage(contextPackage),
      judgeScore: chatContainsMechanicalRuntimeDump(conversationalAnswer) ? 60 : 85,
      warnings: chatContainsMechanicalRuntimeDump(conversationalAnswer)
        ? ['LLM response contained mechanical runtime dump markers — consider review']
        : [],
      repaired: false,
      repairAttempted: false,
    };

    const unified = buildUnifiedBuildConversationDiagnostics({
      responseSource,
      fallbackUsed: usedEmptyFallback,
      fallbackReason: usedEmptyFallback ? 'LLM returned empty content' : null,
      llmInvoked: true,
      rawLlmResponse: usedEmptyFallback ? null : rawLlmResponse,
      finalBrainResponse: conversationalAnswer,
      profileMismatchPassedToLlm: profileMismatchEvidence,
      promptUsedStructuredEvidence: structuredEvidencePrompt,
    });

    return {
      ...basePayload,
      brainResponse: conversationalAnswer,
      llmChatBrainDiagnostics: buildLlmDiagnosticsPayload({
        metadata,
        unified,
        llmConnectionProof,
        skippedReason: usedEmptyFallback ? 'Build completion used fallback — LLM empty response' : null,
        profileMismatchEvidence,
      }),
      confirmation: {
        ...(input.payload.confirmation as Record<string, unknown> | undefined),
        noExternalAiCalls: false,
      },
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'LLM call failed';
    const errorFallbackResponse = resolveDisconnectedFallbackResponse(context, templateFallback, reason);
    const responseSource: BuildResultLlmResponseSource = 'ERROR_FALLBACK';
    const llmConnectionProof = buildLlmConnectionProof({
      llmCallFunction: BUILD_RESULT_LLM_CALL_FUNCTION,
      systemPrompt: systemInstruction,
      userPrompt: userMessage,
      rawLlmResponse: null,
      finalBrainResponse: errorFallbackResponse,
      fallbackUsed: true,
      responseSource,
      llmInvoked: true,
      templateFallback,
    });
    const unified = buildUnifiedBuildConversationDiagnostics({
      responseSource,
      fallbackUsed: true,
      fallbackReason: reason,
      llmInvoked: true,
      rawLlmResponse: null,
      finalBrainResponse: errorFallbackResponse,
      profileMismatchPassedToLlm: profileMismatchEvidence,
      promptUsedStructuredEvidence: structuredEvidencePrompt,
    });

    return {
      ...basePayload,
      brainResponse: errorFallbackResponse,
      llmChatBrainDiagnostics: buildLlmDiagnosticsPayload({
        metadata: buildDisconnectedMetadata(reason, rootDir, input.message),
        unified,
        llmConnectionProof,
        skippedReason: 'Build completion used fallback — LLM call failed',
        profileMismatchEvidence,
      }),
      confirmation: {
        ...(input.payload.confirmation as Record<string, unknown> | undefined),
        noExternalAiCalls: true,
      },
    };
  }
}
