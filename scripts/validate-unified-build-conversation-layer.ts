/**
 * Unified Build Conversation Layer V1 — validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyBuildResultConversationalIntelligence,
  analyzeBuildProfileClassification,
  buildBuildResultConversationalUserMessage,
  composeProfileMismatchChatResponse,
  hasProfileMismatchEvidence,
  promptUsesStructuredEvidence,
  UNIFIED_BUILD_CONVERSATION_LAYER_V1_PASS_TOKEN,
  buildBuildResultConversationalContext,
} from '../src/build-result-conversational-intelligence/index.js';
import { composeOnePromptBuildChatResponse } from '../src/one-prompt-live-preview/one-prompt-build-orchestrator.js';
import { buildOnePromptOperatorFeedEvents } from '../src/one-prompt-live-preview/one-prompt-build-chat-response.js';
import {
  createMockLlmProvider,
  resetLlmProviderForTests,
  setLlmProviderForTests,
} from '../src/llm-chat-brain/index.js';
import type { OnePromptLivePreviewBuildResult } from '../src/one-prompt-live-preview/one-prompt-live-preview-types.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function getDiagnostics(payload: Record<string, unknown>): {
  responseSource?: string;
  fallbackUsed?: boolean;
  llmInvoked?: boolean;
  profileMismatchPassedToLlm?: boolean;
  promptUsedStructuredEvidence?: boolean;
  rawLlmResponsePreview?: string;
  finalResponsePreview?: string;
  fallbackReason?: string | null;
} {
  return (payload.llmChatBrainDiagnostics ?? {}) as Record<string, unknown>;
}

function sampleExpenseMismatch(overrides: Partial<OnePromptLivePreviewBuildResult> = {}): OnePromptLivePreviewBuildResult {
  return {
    readOnly: true,
    buildId: 'build-unified-001',
    projectId: 'proj-expense-001',
    projectName: 'ExpenseTracker',
    status: 'READY',
    prompt: 'Build ExpenseTracker',
    requestType: 'CHAT_BUILD',
    workspaceId: 'proj-expense-001',
    workspacePath: '.generated-builder-workspaces/proj-expense-001',
    generatedProfile: 'CRM_WEB_V1',
    planningProofLevel: 'PARTIAL',
    materializationProofLevel: 'PARTIAL',
    buildResult: 'PASS',
    npmInstallOk: true,
    npmBuildOk: true,
    previewUrl: 'http://127.0.0.1:5173/',
    livePreviewAvailable: true,
    failureReason: null,
    featureSignals: null,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Unified Build Conversation Layer V1 — Validation');
  console.log('================================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const applySource = readFileSync(
    join(ROOT, 'src/build-result-conversational-intelligence/apply-build-result-conversational-intelligence.ts'),
    'utf8',
  );
  const instructionsSource = readFileSync(
    join(ROOT, 'src/build-result-conversational-intelligence/build-result-llm-instructions.ts'),
    'utf8',
  );

  assert(
    '01. package script registered',
    Boolean(pkg.scripts?.['validate:unified-build-conversation-layer']),
    'validate:unified-build-conversation-layer',
  );
  assert(
    '02. unified module exists',
    existsSync(join(ROOT, 'src/unified-build-conversation-layer/index.ts')),
    'src/unified-build-conversation-layer/index.ts',
  );
  assert(
    '03. no profile mismatch LLM bypass in apply layer',
    !applySource.includes('if (shouldUseProfileMismatchChatResponse') &&
      !applySource.includes('PROFILE_MISMATCH_DETERMINISTIC'),
    'single LLM path',
  );
  assert(
    '04. structured evidence module exists',
    existsSync(join(ROOT, 'src/build-result-conversational-intelligence/build-result-structured-evidence.ts')),
    'build-result-structured-evidence.ts',
  );
  assert(
    '05. prompt builder uses structured JSON not template',
    instructionsSource.includes('STRUCTURED_BUILD_EVIDENCE (JSON):') &&
      !instructionsSource.includes('context.templateFallback'),
    'structured JSON only',
  );

  const expensePrompt =
    'Build a modern expense tracking web application called ExpenseTracker with categories, receipts, monthly budgets, and spending reports. Begin build execution now.';
  const buildResult = sampleExpenseMismatch();
  const classification = analyzeBuildProfileClassification(expensePrompt, 'CRM_WEB_V1');
  const templateFallback = composeOnePromptBuildChatResponse(buildResult);
  const context = buildBuildResultConversationalContext({
    message: expensePrompt,
    buildResult,
    templateFallback,
  });

  assert('06. mismatch evidence detected', hasProfileMismatchEvidence(context), 'PROFILE_MISMATCH');
  assert(
    '07. structured user prompt includes alignment verdict',
    (() => {
      const userMessage = buildBuildResultConversationalUserMessage(context, buildResult);
      return (
        promptUsesStructuredEvidence(userMessage) &&
        userMessage.includes('profileAlignmentVerdict') &&
        userMessage.includes('CRM_WEB_V1') &&
        !userMessage.includes('Build run:')
      );
    })(),
    'structured evidence JSON',
  );

  const mismatchLlmResponse =
    'ExpenseTracker finished building, but I selected CRM_WEB_V1 while your prompt clearly describes expense tracking. The matched keywords support an expense app — please review the profile before signing off. Open Live Preview to inspect what was generated.';
  resetLlmProviderForTests();
  setLlmProviderForTests(createMockLlmProvider([mismatchLlmResponse]));

  const payload = {
    brainResponse: templateFallback,
    operatorFeedEvents: buildOnePromptOperatorFeedEvents(buildResult),
    confirmation: { noExternalAiCalls: true },
  };

  const enriched = await applyBuildResultConversationalIntelligence({
    message: expensePrompt,
    payload,
    buildResult,
    rootDir: ROOT,
  });

  const brainResponse = String(enriched.brainResponse ?? '');
  const diag = getDiagnostics(enriched);
  const proof = (enriched.llmChatBrainDiagnostics as { llmConnectionProof?: { llmInvoked?: boolean } })
    .llmConnectionProof;

  assert('08. profile mismatch invokes LLM when available', proof?.llmInvoked === true, String(proof?.llmInvoked));
  assert(
    '09. profileMismatchPassedToLlm true',
    diag.profileMismatchPassedToLlm === true,
    String(diag.profileMismatchPassedToLlm),
  );
  assert(
    '10. promptUsedStructuredEvidence true',
    diag.promptUsedStructuredEvidence === true,
    String(diag.promptUsedStructuredEvidence),
  );
  assert(
    '11. final brainResponse equals raw LLM on success',
    brainResponse === mismatchLlmResponse,
    brainResponse.slice(0, 80),
  );
  assert('12. responseSource LLM on connected mismatch', diag.responseSource === 'LLM', String(diag.responseSource));
  assert('13. fallbackUsed false on LLM success', diag.fallbackUsed === false, String(diag.fallbackUsed));
  assert(
    '14. ExpenseTracker mismatch explained by LLM not deterministic bypass',
    /expense|CRM_WEB_V1|profile/i.test(brainResponse) && brainResponse === mismatchLlmResponse,
    brainResponse.slice(0, 80),
  );
  assert(
    '15. chat response is natural not field dump',
    !brainResponse.includes('Build run:') && !brainResponse.includes('Workspace:'),
    brainResponse.slice(0, 80),
  );
  assert(
    '16. operator feed unchanged and separate',
    Array.isArray(enriched.operatorFeedEvents) &&
      (enriched.operatorFeedEvents as unknown[]).length >= 5 &&
      !brainResponse.includes('Detecting build prompt'),
    String((enriched.operatorFeedEvents as unknown[]).length),
  );
  assert(
    '17. diagnostics previews populated',
    Boolean(diag.rawLlmResponsePreview && diag.finalResponsePreview),
    `${diag.rawLlmResponsePreview?.slice(0, 40)}`,
  );

  resetLlmProviderForTests();
  const disconnected = await applyBuildResultConversationalIntelligence({
    message: expensePrompt,
    payload,
    buildResult,
    rootDir: ROOT,
  });
  const disconnectedDiag = getDiagnostics(disconnected);
  const disconnectedResponse = String(disconnected.brainResponse ?? '');
  const deterministicMismatch = composeProfileMismatchChatResponse(context);

  assert(
    '18. disconnected mismatch uses deterministic fallback only',
    disconnectedDiag.responseSource === 'TEMPLATE_FALLBACK' && disconnectedDiag.fallbackUsed === true,
    String(disconnectedDiag.responseSource),
  );
  assert(
    '19. disconnected mismatch fallback is composeProfileMismatchChatResponse',
    disconnectedResponse === deterministicMismatch,
    disconnectedResponse.slice(0, 80),
  );
  assert(
    '20. disconnected profileMismatchPassedToLlm false',
    disconnectedDiag.profileMismatchPassedToLlm === false,
    String(disconnectedDiag.profileMismatchPassedToLlm),
  );

  resetLlmProviderForTests();

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Unified Build Conversation Layer V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(UNIFIED_BUILD_CONVERSATION_LAYER_V1_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
