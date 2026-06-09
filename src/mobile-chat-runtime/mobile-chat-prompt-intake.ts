/**
 * Mobile Chat Runtime Foundation — prompt intake (metadata only).
 */

import { getStoredMobileChatSession, storeMobileChatSession } from './mobile-chat-store.js';
import { recordMobileChatHistoryEntry } from './mobile-chat-history.js';
import { setMobileChatState } from './mobile-chat-state-manager.js';
import { recordMobileChatLifecycleEvent } from './mobile-chat-lifecycle.js';
import type { MobileChatPrompt } from './mobile-chat-types.js';

let promptCounter = 0;

export function resetMobileChatPromptCounterForTests(): void {
  promptCounter = 0;
}

export function nextMobileChatPromptId(): string {
  promptCounter += 1;
  return `mprompt-${promptCounter.toString().padStart(4, '0')}`;
}

export function intakeMobileChatPrompt(input: {
  mobileChatId: string;
  promptText: string;
  promptType?: string;
  promptSource?: string;
  promptAttachmentsMetadata?: string[];
  voiceInputMetadata?: Record<string, string> | null;
  imageInputMetadata?: Record<string, string> | null;
  videoInputMetadata?: Record<string, string> | null;
}): MobileChatPrompt | null {
  const session = getStoredMobileChatSession(input.mobileChatId);
  if (!session) return null;

  const giantPromptFlag = input.promptText.length > 2000;
  const prompt: MobileChatPrompt = {
    promptId: nextMobileChatPromptId(),
    mobileChatId: input.mobileChatId,
    promptText: input.promptText,
    promptType: input.promptType ?? 'TEXT',
    promptSource: input.promptSource ?? 'MOBILE_CHAT',
    promptTimestamp: Date.now(),
    promptAttachmentsMetadata: input.promptAttachmentsMetadata ?? [],
    voiceInputMetadata: input.voiceInputMetadata ?? null,
    imageInputMetadata: input.imageInputMetadata ?? null,
    videoInputMetadata: input.videoInputMetadata ?? null,
    giantPromptFlag,
    longPromptSummary: giantPromptFlag ? input.promptText.slice(0, 120) + '…' : null,
    projectVisionDetected: input.promptText.toLowerCase().includes('vision') || input.promptText.toLowerCase().includes('roadmap'),
    requestedActionDetected: detectRequestedAction(input.promptText),
  };

  storeMobileChatSession({
    ...session,
    mobileChatPrompts: [...session.mobileChatPrompts, prompt],
    updatedAt: Date.now(),
  });

  recordMobileChatLifecycleEvent(input.mobileChatId, 'MOBILE_CHAT_PROMPT_RECEIVED', `Prompt ${prompt.promptId}`);
  setMobileChatState(input.mobileChatId, 'PROMPT_RECEIVED', true);

  recordMobileChatHistoryEntry({
    mobileChatId: input.mobileChatId,
    category: 'PROMPT',
    summary: `Prompt intake: ${prompt.promptId}${giantPromptFlag ? ' (giant prompt)' : ''}`,
    scopeUsed: prompt.promptId,
  });

  return prompt;
}

function detectRequestedAction(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes('build')) return 'build_request';
  if (lower.includes('verify')) return 'verification_request';
  if (lower.includes('deploy')) return 'deploy_request';
  if (lower.includes('status')) return 'status_request';
  return null;
}

export function getLatestPromptForChat(mobileChatId: string): MobileChatPrompt | null {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session || session.mobileChatPrompts.length === 0) return null;
  return session.mobileChatPrompts[session.mobileChatPrompts.length - 1] ?? null;
}

export function validateMobileChatPrompt(prompt: MobileChatPrompt): string[] {
  const issues: string[] = [];
  if (!prompt.promptText?.trim()) issues.push('Missing prompt text');
  if (prompt.giantPromptFlag && !prompt.longPromptSummary?.trim()) {
    issues.push('Giant prompt flagged without summary');
  }
  return issues;
}
