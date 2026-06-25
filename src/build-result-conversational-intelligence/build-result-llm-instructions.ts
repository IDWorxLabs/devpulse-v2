/**
 * Unified Build Conversation Layer V1 — LLM instruction builders (structured evidence only).
 */

import { buildLlmSystemInstructions } from '../llm-chat-brain/llm-system-instructions.js';
import { buildDevPulseContextPackage } from '../llm-chat-brain/devpulse-context-package.js';
import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';
import type { BuildResultConversationalContext } from './build-result-conversational-types.js';
import {
  buildBuildResultStructuredEvidence,
  type BuildResultStructuredEvidence,
} from './build-result-structured-evidence.js';

export function buildBuildResultConversationalSystemInstructions(
  context: BuildResultConversationalContext,
  rootDir: string,
): string {
  const baseContext = buildDevPulseContextPackage({ rootDir, message: context.userPrompt });
  const base = buildLlmSystemInstructions(baseContext);

  return [
    base,
    '',
    'Unified build conversation mode:',
    '- The founder just ran an autonomous build. Explain the outcome in natural, founder-friendly language.',
    '- You receive STRUCTURED_BUILD_EVIDENCE (JSON) — use it as facts only, never dump field labels mechanically.',
    '- Do NOT use status-report templates like "Build run:", "Workspace:", or "Profile:" as the main structure.',
    '- Summarize what happened, whether it succeeded/failed/partially succeeded, and recommend one clear next action.',
    '- If profile mismatch evidence exists, explain the mismatch plainly using matchedKeywords and expectedProfile.',
    '- Explain why the selected profile was chosen using the evidence (matched keywords, alignment reason).',
    '- Keep detailed execution logs out of chat — Execution Trace already carries technical runtime evidence.',
    '- Use 2–4 short paragraphs or a concise bullet list.',
    '- Mention Live Preview when previewUrl is available and build succeeded.',
    '- Handle all outcomes uniformly: success, failure, partial build, profile mismatch, blueprint gaps, preview unavailable, fallback profile.',
  ].join('\n');
}

export function buildBuildResultStructuredEvidenceForContext(
  context: BuildResultConversationalContext,
  buildResult: OnePromptLivePreviewBuildResult,
  executionTraceBundle?: import('../execution-trace/execution-trace-types.js').ExecutionTraceEvidenceBundle | null,
): BuildResultStructuredEvidence {
  return buildBuildResultStructuredEvidence(context, buildResult, executionTraceBundle);
}

export function buildBuildResultConversationalUserMessage(
  context: BuildResultConversationalContext,
  buildResult: OnePromptLivePreviewBuildResult,
  executionTraceBundle?: import('../execution-trace/execution-trace-types.js').ExecutionTraceEvidenceBundle | null,
): string {
  const evidence = buildBuildResultStructuredEvidence(context, buildResult, executionTraceBundle);

  return [
    'Write a founder-facing conversational summary of this build completion using the structured evidence below.',
    'Do not copy JSON keys or field labels into the response — translate evidence into natural language.',
    'Ground your summary in executionTraceEvidence and materializationEvidence when present — do not invent runtime facts.',
    '',
    'STRUCTURED_BUILD_EVIDENCE (JSON):',
    JSON.stringify(evidence, null, 2),
  ].join('\n');
}

/** Returns true when the user message uses structured JSON evidence (not mechanical template). */
export function promptUsesStructuredEvidence(userMessage: string): boolean {
  return (
    userMessage.includes('STRUCTURED_BUILD_EVIDENCE (JSON):') &&
    !userMessage.includes('Reference summary (do not copy verbatim') &&
    !userMessage.includes('Build run:')
  );
}
