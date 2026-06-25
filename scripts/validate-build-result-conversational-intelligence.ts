/**
 * Build Result Conversational Intelligence V1 — validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeBuildProfileClassification,
  applyBuildResultConversationalIntelligence,
  BUILD_RESULT_CONVERSATIONAL_INTELLIGENCE_V1_PASS_TOKEN,
  BUILD_RESULT_TEMPLATE_FALLBACK_MARKER,
  buildBuildResultConversationalUserMessage,
  buildBuildResultConversationalContext,
  promptUsesStructuredEvidence,
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

function sampleBuildResult(overrides: Partial<OnePromptLivePreviewBuildResult> = {}): OnePromptLivePreviewBuildResult {
  return {
    readOnly: true,
    buildId: 'build-test-001',
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
  console.log('Build Result Conversational Intelligence V1 — Validation');
  console.log('========================================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const brainHandler = readFileSync(join(ROOT, 'server/brain-api-handler.ts'), 'utf8');
  const buildChatResponse = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-chat-response.ts'),
    'utf8',
  );
  const applySource = readFileSync(
    join(ROOT, 'src/build-result-conversational-intelligence/apply-build-result-conversational-intelligence.ts'),
    'utf8',
  );

  assert(
    '01. package script',
    Boolean(pkg.scripts?.['validate:build-result-conversational-intelligence']),
    'validate:build-result-conversational-intelligence',
  );
  assert(
    '02. module exists',
    existsSync(join(ROOT, 'src/build-result-conversational-intelligence/index.ts')),
    'index.ts',
  );
  assert(
    '03. brain handler calls conversational layer',
    brainHandler.includes('applyBuildResultConversationalIntelligence'),
    'applyBuildResultConversationalIntelligence',
  );
  assert(
    '04. build path no longer sends template only',
    brainHandler.includes('enrichedPayload = await applyBuildResultConversationalIntelligence'),
    'enriched payload',
  );
  assert(
    '05. template composer retained as fallback',
    brainHandler.includes('composeOnePromptBuildBrainApiPayload') &&
      typeof composeOnePromptBuildChatResponse === 'function',
    'composeOnePromptBuildChatResponse',
  );
  assert(
    '05b. no profile mismatch LLM bypass',
    !applySource.includes('PROFILE_MISMATCH_DETERMINISTIC'),
    'unified LLM path',
  );

  const expensePrompt =
    'Build a modern expense tracking web application called ExpenseTracker with categories, receipts, monthly budgets, and spending reports. Begin build execution now.';
  const classification = analyzeBuildProfileClassification(expensePrompt, 'CRM_WEB_V1');
  assert(
    '06. classification evidence includes keywords',
    classification.matchedKeywords.length >= 1 || classification.inferredProductIntent === 'expense tracking',
    classification.inferredProductIntent ?? 'none',
  );
  assert(
    '07. profile mismatch warning for ExpenseTracker → CRM',
    classification.profileMismatchWarnings.some((w) => /expense|crm|mismatch/i.test(w)),
    classification.profileMismatchWarnings.join(' | ').slice(0, 80),
  );
  assert(
    '07b. alignment verdict on forced CRM selection',
    classification.alignmentVerdict === 'PROFILE_MISMATCH',
    classification.alignmentVerdict,
  );

  const buildResult = sampleBuildResult();
  const templateFallback = composeOnePromptBuildChatResponse(buildResult);
  const context = buildBuildResultConversationalContext({
    message: expensePrompt,
    buildResult,
    templateFallback,
  });
  const userMessage = buildBuildResultConversationalUserMessage(context, buildResult);

  assert('08. LLM input uses structured evidence', promptUsesStructuredEvidence(userMessage), 'structured');
  assert('09. LLM input includes buildRunId in JSON', userMessage.includes(buildResult.buildId), 'buildRunId');
  assert(
    '10. LLM input includes profile mismatch in JSON',
    userMessage.includes('profileMismatchWarnings'),
    'warnings',
  );
  assert('11. LLM input excludes mechanical template', !userMessage.includes('Build run:'), 'no template dump');
  assert('12. LLM input includes preview URL in JSON', userMessage.includes(buildResult.previewUrl ?? ''), 'preview');

  resetLlmProviderForTests();
  const mockResponse =
    'ExpenseTracker finished building successfully. I routed this as CRM_WEB_V1, which may not match your expense-tracking intent — please review the profile in Autonomous Builder. Open Live Preview to validate the generated app.';
  setLlmProviderForTests(createMockLlmProvider([mockResponse]));

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
  const diagnostics = enriched.llmChatBrainDiagnostics as {
    usedLlm?: boolean;
    fallbackUsed?: boolean;
    responseSource?: string;
    profileMismatchPassedToLlm?: boolean;
    llmConnectionProof?: { llmInvoked?: boolean };
  };

  assert(
    '13. mismatch invokes LLM when connected',
    diagnostics.llmConnectionProof?.llmInvoked === true,
    String(diagnostics.llmConnectionProof?.llmInvoked),
  );
  assert(
    '14. response is natural language not field dump',
    !brainResponse.includes('Build run:') && /ExpenseTracker|CRM_WEB_V1/i.test(brainResponse),
    brainResponse.slice(0, 80),
  );
  assert(
    '15. response equals LLM output on success',
    brainResponse === mockResponse,
    brainResponse.slice(0, 80),
  );
  assert(
    '16. profile mismatch passed to LLM',
    diagnostics.profileMismatchPassedToLlm === true,
    String(diagnostics.profileMismatchPassedToLlm),
  );
  assert(
    '17. operator feed remains detailed and separate',
    Array.isArray(enriched.operatorFeedEvents) &&
      (enriched.operatorFeedEvents as unknown[]).length >= 5 &&
      !brainResponse.includes('Detecting build prompt'),
    String((enriched.operatorFeedEvents as unknown[]).length),
  );

  resetLlmProviderForTests();
  const alignedBuildResult = sampleBuildResult({
    generatedProfile: 'EXPENSE_TRACKER_WEB_V1',
    prompt: expensePrompt,
  });
  const alignedPayload = {
    brainResponse: composeOnePromptBuildChatResponse(alignedBuildResult),
    operatorFeedEvents: buildOnePromptOperatorFeedEvents(alignedBuildResult),
    confirmation: { noExternalAiCalls: true },
  };
  const disconnected = await applyBuildResultConversationalIntelligence({
    message: expensePrompt,
    payload: alignedPayload,
    buildResult: alignedBuildResult,
    rootDir: ROOT,
  });
  const fallbackResponse = String(disconnected.brainResponse ?? '');
  const fallbackDiagnostics = disconnected.llmChatBrainDiagnostics as { fallbackUsed?: boolean };

  assert(
    '18. template fallback when LLM unavailable',
    fallbackResponse.includes(BUILD_RESULT_TEMPLATE_FALLBACK_MARKER),
    BUILD_RESULT_TEMPLATE_FALLBACK_MARKER,
  );
  assert(
    '19. fallback includes original template content',
    fallbackResponse.includes('Build run:') || fallbackResponse.includes('Build execution started'),
    'template preserved',
  );
  assert('20. fallback marked in diagnostics', fallbackDiagnostics.fallbackUsed === true, 'fallbackUsed');

  assert(
    '21. operator feed builder unchanged in build chat module',
    buildChatResponse.includes('buildOnePromptOperatorFeedEvents') &&
      buildChatResponse.includes('Materializing workspace'),
    'feed stages',
  );
  assert(
    '22. buildChatTemplateFallback stored in payload composer',
    buildChatResponse.includes('buildChatTemplateFallback'),
    'template field',
  );

  resetLlmProviderForTests();

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Build Result Conversational Intelligence V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(BUILD_RESULT_CONVERSATIONAL_INTELLIGENCE_V1_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
