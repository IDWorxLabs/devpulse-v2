/**
 * Phase 26 — Real LLM chat orchestrator.
 */



import { buildDevPulseContextPackage } from './devpulse-context-package.js';

import { buildLlmSystemInstructions, buildLlmRepairInstruction } from './llm-system-instructions.js';

import { judgeLlmAnswer } from './llm-answer-judge.js';

import { generateLocalChatFallback } from './local-chat-fallback.js';

import {

  createLlmProvider,

  getLlmProviderStatus,

  loadLlmModelConfig,

  LLM_NOT_CONNECTED_MESSAGE,

} from './llm-provider.js';

import type { LlmChatBrainInput, LlmChatBrainMetadata, LlmChatBrainResponse } from './llm-chat-types.js';

import { metadataFromContextPackage } from './llm-chat-types.js';

import type { DevPulseContextPackage } from './devpulse-context-package.js';

import type { LlmProvider } from './llm-provider-types.js';
import { enhanceChatWithOperationalSelfKnowledge } from '../chat-operational-self-knowledge/index.js';

function buildMetadata(
  base: Partial<LlmChatBrainMetadata> & Pick<LlmChatBrainMetadata, 'usedLlm'>,

  contextPackage?: DevPulseContextPackage,

): LlmChatBrainMetadata {

  const ctx = metadataFromContextPackage(contextPackage);

  return {

    readOnly: true,

    usedLlm: base.usedLlm,

    llmConnected: base.llmConnected ?? false,

    fallbackUsed: base.fallbackUsed ?? false,

    provider: base.provider ?? null,

    model: base.model ?? null,

    contextIncluded: ctx.contextIncluded,

    evidenceIncluded: ctx.evidenceIncluded,

    judgeScore: base.judgeScore ?? null,

    warnings: base.warnings ?? [],

    repaired: base.repaired ?? false,

    repairAttempted: base.repairAttempted ?? false,

    contextSourcesUsed: ctx.contextSourcesUsed,

    lastContextHydration: ctx.lastContextHydration,

    hydratedFactCount: ctx.hydratedFactCount,

    contextConfidence: ctx.contextConfidence,

    identityLoaded: ctx.identityLoaded,

    founderLoaded: ctx.founderLoaded,

    productLoaded: ctx.productLoaded,

    historyLoaded: ctx.historyLoaded,

    selfEvolutionLoaded: ctx.selfEvolutionLoaded,

    identityVersion: ctx.identityVersion,

    founderVersion: ctx.founderVersion,

    productVersion: ctx.productVersion,

    currentProductIdentity: ctx.currentProductIdentity,

    founderIdentity: ctx.founderIdentity,

    companyIdentity: ctx.companyIdentity,

    legacyIdentity: ctx.legacyIdentity,

  };

}



async function callLlmProvider(input: {

  provider: LlmProvider;

  systemInstruction: string;

  userMessage: string;

  previousAnswer?: string;

  repairInstruction?: string;

}): Promise<string> {

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [

    { role: 'system', content: input.systemInstruction },

  ];



  if (input.repairInstruction && input.previousAnswer) {

    messages.push({ role: 'user', content: input.userMessage });

    messages.push({ role: 'assistant', content: input.previousAnswer });

    messages.push({ role: 'user', content: input.repairInstruction });

  } else {

    messages.push({ role: 'user', content: input.userMessage });

  }



  const response = await input.provider.chat({ messages });

  return response.content.trim();

}



export async function generateLlmBackedChatResponseAsync(

  input: LlmChatBrainInput,

): Promise<LlmChatBrainResponse> {

  const message = input.message?.trim() ?? '';

  const rootDir = input.rootDir ?? process.cwd();

  const config = loadLlmModelConfig();

  const provider = input.providerOverride ?? createLlmProvider(config);

  const status = provider.getStatus();

  const contextPackage = buildDevPulseContextPackage({ rootDir, message });

  const systemInstruction = buildLlmSystemInstructions(contextPackage);

  const ctxMeta = metadataFromContextPackage(contextPackage);



  if (!status.connected) {

    const fallback = generateLocalChatFallback({

      message,

      draftResponse: input.draftResponse,

      rootDir,

      timestamp: input.timestamp,

      reason: status.connected ? 'LLM unavailable' : ('reason' in status ? status.reason : 'LLM not connected'),

    });

    return {

      readOnly: true,

      finalAnswer: fallback.finalAnswer,

      metadata: buildMetadata({ ...fallback.metadata, usedLlm: false }, contextPackage),

      contextPackage,

    };

  }



  try {

    let answer = await callLlmProvider({ provider, systemInstruction, userMessage: message });

    let judgement = judgeLlmAnswer({

      userMessage: message,

      answer,

      contextIncluded: ctxMeta.contextIncluded,

      evidenceIncluded: ctxMeta.evidenceIncluded,

    });



    let repaired = false;

    let repairAttempted = false;



    if (!judgement.passed) {

      repairAttempted = true;

      const failedAnswer = answer;

      const repairInstruction = buildLlmRepairInstruction({

        userMessage: message,

        failedAnswer,

        failureReasons: judgement.failureReasons,

      });

      answer = await callLlmProvider({

        provider,

        systemInstruction,

        userMessage: message,

        previousAnswer: failedAnswer,

        repairInstruction,

      });

      repaired = true;

      judgement = judgeLlmAnswer({

        userMessage: message,

        answer,

        contextIncluded: ctxMeta.contextIncluded,

        evidenceIncluded: ctxMeta.evidenceIncluded,

      });

    }



    if (!judgement.passed) {
      const operational = enhanceChatWithOperationalSelfKnowledge({
        message,
        draftAnswer: answer,
        rootDir,
        forceLivePath: true,
        forceSnapshotRefresh: true,
      });

      if (operational.usedOperationalSelfKnowledge) {
        return {
          readOnly: true,
          finalAnswer: operational.finalAnswer,
          metadata: buildMetadata(
            {
              usedLlm: true,
              llmConnected: true,
              fallbackUsed: false,
              provider: provider.name,
              model: provider.model,
              judgeScore: judgement.score,
              warnings: [
                ...judgement.failureReasons,
                `Operational self-knowledge override (${operational.questionKind})`,
              ],
              repairAttempted,
              repaired,
            },
            contextPackage,
          ),
          judgement,
          contextPackage,
        };
      }

      const fallback = generateLocalChatFallback({

        message,

        draftResponse: answer,

        rootDir,

        timestamp: input.timestamp,

        reason: `LLM answer failed judge (${judgement.failureReasons.join('; ')})`,

        mode: 'judge-failure',

      });

      return {

        readOnly: true,

        finalAnswer: fallback.finalAnswer,

        metadata: buildMetadata(

          {

            usedLlm: false,

            llmConnected: true,

            fallbackUsed: true,

            provider: provider.name,

            model: provider.model,

            judgeScore: judgement.score,

            warnings: [...fallback.metadata.warnings, ...judgement.failureReasons],

            repairAttempted,

            repaired: true,

          },

          contextPackage,

        ),

        judgement,

        contextPackage,

      };

    }



    const operational = enhanceChatWithOperationalSelfKnowledge({
      message,
      draftAnswer: answer,
      rootDir,
      forceLivePath: true,
      forceSnapshotRefresh: true,
    });
    const finalAnswer = operational.usedOperationalSelfKnowledge
      ? operational.finalAnswer
      : answer;

    return {

      readOnly: true,

      finalAnswer,

      metadata: buildMetadata(

        {

          usedLlm: true,

          llmConnected: true,

          fallbackUsed: false,

          provider: provider.name,

          model: provider.model,

          judgeScore: judgement.score,

          warnings: operational.usedOperationalSelfKnowledge
            ? [...judgement.failureReasons, `Operational self-knowledge enriched (${operational.questionKind})`]
            : judgement.failureReasons,

          repaired,

          repairAttempted,

        },

        contextPackage,

      ),

      judgement,

      contextPackage,

    };

  } catch (error) {

    const reason = error instanceof Error ? error.message : 'LLM call failed';

    const fallback = generateLocalChatFallback({

      message,

      draftResponse: input.draftResponse,

      rootDir,

      timestamp: input.timestamp,

      reason,

    });

    return {

      readOnly: true,

      finalAnswer: fallback.finalAnswer,

      metadata: buildMetadata(

        { ...fallback.metadata, usedLlm: false, warnings: [...fallback.metadata.warnings, reason] },

        contextPackage,

      ),

      contextPackage,

    };

  }

}



/** Sync path: local fallback when LLM disconnected; defers live LLM call to async route when connected. */

export function generateLlmBackedChatResponse(input: LlmChatBrainInput): LlmChatBrainResponse {

  const message = input.message?.trim() ?? '';

  const rootDir = input.rootDir ?? process.cwd();

  const config = loadLlmModelConfig();

  const status = input.providerOverride?.getStatus() ?? getLlmProviderStatus(config);

  const contextPackage = buildDevPulseContextPackage({ rootDir, message });



  if (status.connected && !input.providerOverride) {

    return {

      readOnly: true,

      finalAnswer: (input.draftResponse ?? '').trim(),

      metadata: buildMetadata(

        {

          usedLlm: false,

          llmConnected: true,

          fallbackUsed: false,

          provider: status.provider,

          model: status.model,

          judgeScore: null,

          warnings: ['LLM connected — async brain route will generate the live answer'],

          repaired: false,

          repairAttempted: false,

        },

        contextPackage,

      ),

      contextPackage,

    };

  }



  if (!status.connected) {

    const fallback = generateLocalChatFallback({

      message,

      draftResponse: input.draftResponse,

      rootDir,

      timestamp: input.timestamp,

      reason: 'reason' in status ? status.reason : LLM_NOT_CONNECTED_MESSAGE,

      mode: 'disconnected',

    });

    return {

      readOnly: true,

      finalAnswer: fallback.finalAnswer,

      metadata: buildMetadata({ ...fallback.metadata, usedLlm: false }, contextPackage),

      contextPackage,

    };

  }



  return {

    readOnly: true,

    finalAnswer: input.draftResponse ?? '',

    metadata: buildMetadata(

      {

        usedLlm: false,

        llmConnected: true,

        fallbackUsed: true,

        provider: status.provider,

        model: status.model,

        warnings: ['Use generateLlmBackedChatResponseAsync for live provider calls'],

      },

      contextPackage,

    ),

    contextPackage,

  };

}



export { getLlmProviderStatus, loadLlmModelConfig, LLM_NOT_CONNECTED_MESSAGE };

