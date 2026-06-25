/**
 * LLM Connection Proof V1 — validation for build-result chat LLM wiring.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyBuildResultConversationalIntelligence,
  BUILD_RESULT_TEMPLATE_FALLBACK_MARKER,
} from '../src/build-result-conversational-intelligence/index.js';
import { composeOnePromptBuildChatResponse } from '../src/one-prompt-live-preview/one-prompt-build-orchestrator.js';
import { buildOnePromptOperatorFeedEvents } from '../src/one-prompt-live-preview/one-prompt-build-chat-response.js';
import {
  createMockLlmProvider,
  resetLlmProviderForTests,
  setLlmProviderForTests,
} from '../src/llm-chat-brain/index.js';
import {
  LLM_CONNECTION_PROOF_V1_PASS_TOKEN,
  auditLlmConnectionProof,
  type BuildResultLlmConnectionProof,
} from '../src/llm-connection-proof-v1/index.js';
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

function getProof(payload: Record<string, unknown>): BuildResultLlmConnectionProof {
  const diagnostics = payload.llmChatBrainDiagnostics as { llmConnectionProof?: BuildResultLlmConnectionProof };
  if (!diagnostics?.llmConnectionProof) {
    throw new Error('llmConnectionProof diagnostics missing from payload');
  }
  return diagnostics.llmConnectionProof;
}

function sampleBuildResult(overrides: Partial<OnePromptLivePreviewBuildResult> = {}): OnePromptLivePreviewBuildResult {
  return {
    readOnly: true,
    buildId: 'build-llm-proof-001',
    projectId: 'proj-task-001',
    projectName: 'TaskFlow',
    status: 'READY',
    prompt: 'Build TaskFlow',
    requestType: 'CHAT_BUILD',
    workspaceId: 'proj-task-001',
    workspacePath: '.generated-builder-workspaces/proj-task-001',
    generatedProfile: 'TASK_TRACKER_WEB_V1',
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
  console.log('LLM Connection Proof V1 — Validation');
  console.log('====================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const applySource = readFileSync(
    join(ROOT, 'src/build-result-conversational-intelligence/apply-build-result-conversational-intelligence.ts'),
    'utf8',
  );
  const brainHandler = readFileSync(join(ROOT, 'server/brain-api-handler.ts'), 'utf8');

  assert(
    '01. package script registered',
    Boolean(pkg.scripts?.['validate:llm-connection-proof']),
    'validate:llm-connection-proof',
  );
  assert(
    '02. proof module exists',
    existsSync(join(ROOT, 'src/llm-connection-proof-v1/index.ts')),
    'src/llm-connection-proof-v1/index.ts',
  );
  assert(
    '03. apply layer calls provider.chat',
    applySource.includes('provider.chat(') && applySource.includes('llmConnectionProof'),
    'provider.chat + llmConnectionProof',
  );
  assert(
    '04. brain handler wires build conversational layer',
    brainHandler.includes('applyBuildResultConversationalIntelligence'),
    'applyBuildResultConversationalIntelligence',
  );

  const alignedPrompt =
    'Build a modern task management web application called TaskFlow with projects, due dates, and team assignments. Begin build execution now.';
  const buildResult = sampleBuildResult();
  const templateFallback = composeOnePromptBuildChatResponse(buildResult);

  assert(
    '05. template has mechanical markers (control baseline)',
    templateFallback.includes('Build run:') && templateFallback.includes('Workspace:'),
    templateFallback.slice(0, 60),
  );

  const controlledLlmResponse =
    'LLM_CONNECTION_PROOF_MARKER: TaskFlow build completed successfully. Open Live Preview to walk through task boards and due-date flows — this is a founder-friendly summary, not a status dump.';
  resetLlmProviderForTests();
  setLlmProviderForTests(createMockLlmProvider([controlledLlmResponse]));

  const connectedPayload = {
    brainResponse: templateFallback,
    operatorFeedEvents: buildOnePromptOperatorFeedEvents(buildResult),
    confirmation: { noExternalAiCalls: true },
  };

  const connected = await applyBuildResultConversationalIntelligence({
    message: alignedPrompt,
    payload: connectedPayload,
    buildResult,
    rootDir: ROOT,
  });

  const connectedProof = getProof(connected);
  const connectedAudit = auditLlmConnectionProof(connectedProof);
  const connectedDiagnostics = connected.llmChatBrainDiagnostics as {
    usedLlm?: boolean;
    fallbackUsed?: boolean;
    responseSource?: string;
  };

  assert(
    '06. LLM invoked on aligned build path',
    connectedProof.llmInvoked === true,
    String(connectedProof.llmInvoked),
  );
  assert(
    '07. llmCallFunction exposed',
    connectedProof.llmCallFunction === 'createLlmProvider(config).chat',
    String(connectedProof.llmCallFunction),
  );
  assert(
    '08. system prompt captured',
    Boolean(connectedProof.systemPrompt && connectedProof.systemPrompt.includes('Unified build conversation mode')),
    connectedProof.systemPrompt?.slice(0, 80) ?? 'missing',
  );
  assert(
    '09. user prompt captured',
    Boolean(connectedProof.userPrompt && connectedProof.userPrompt.includes('TaskFlow')),
    connectedProof.userPrompt?.slice(0, 80) ?? 'missing',
  );
  assert(
    '10. raw LLM response captured',
    connectedProof.rawLlmResponse === controlledLlmResponse,
    connectedProof.rawLlmResponse?.slice(0, 80) ?? 'missing',
  );
  assert(
    '11. raw LLM differs from template',
    connectedProof.rawDiffersFromTemplate === true,
    String(connectedProof.rawDiffersFromTemplate),
  );
  assert(
    '12. final brainResponse equals raw LLM',
    String(connected.brainResponse) === controlledLlmResponse && connectedProof.finalEqualsRawLlm === true,
    String(connected.brainResponse).slice(0, 80),
  );
  assert(
    '13. fallbackUsed false when LLM connected',
    connectedDiagnostics.fallbackUsed === false && connectedProof.fallbackUsed === false,
    String(connectedDiagnostics.fallbackUsed),
  );
  assert(
    '14. responseSource LLM',
    connectedDiagnostics.responseSource === 'LLM' && connectedProof.responseSource === 'LLM',
    String(connectedDiagnostics.responseSource),
  );
  assert(
    '15. connected audit verdict',
    connectedAudit.verdict === 'LLM_CONNECTED',
    connectedAudit.verdict,
  );

  resetLlmProviderForTests();
  const expensePrompt =
    'Build a modern expense tracking web application called ExpenseTracker with categories, receipts, monthly budgets, and spending reports. Begin build execution now.';
  const mismatchBuildResult = sampleBuildResult({
    buildId: 'build-llm-proof-mismatch',
    projectId: 'proj-expense-001',
    projectName: 'ExpenseTracker',
    generatedProfile: 'CRM_WEB_V1',
  });
  const mismatchTemplate = composeOnePromptBuildChatResponse(mismatchBuildResult);
  const mismatchLlmResponse =
    'ExpenseTracker build completed under CRM_WEB_V1, but your prompt describes expense tracking — review the profile mismatch before signing off.';
  setLlmProviderForTests(createMockLlmProvider([mismatchLlmResponse]));
  const mismatchPayload = {
    brainResponse: mismatchTemplate,
    operatorFeedEvents: buildOnePromptOperatorFeedEvents(mismatchBuildResult),
    confirmation: { noExternalAiCalls: true },
  };
  const mismatchResult = await applyBuildResultConversationalIntelligence({
    message: expensePrompt,
    payload: mismatchPayload,
    buildResult: mismatchBuildResult,
    rootDir: ROOT,
  });
  const mismatchProof = getProof(mismatchResult);
  const mismatchDiag = mismatchResult.llmChatBrainDiagnostics as {
    profileMismatchPassedToLlm?: boolean;
    promptUsedStructuredEvidence?: boolean;
  };

  assert(
    '15b. profile mismatch invokes LLM when connected',
    mismatchProof.llmInvoked === true,
    String(mismatchProof.llmInvoked),
  );
  assert(
    '15c. mismatch final equals LLM response',
    String(mismatchResult.brainResponse) === mismatchLlmResponse,
    String(mismatchResult.brainResponse).slice(0, 80),
  );
  assert(
    '15d. profileMismatchPassedToLlm true',
    mismatchDiag.profileMismatchPassedToLlm === true,
    String(mismatchDiag.profileMismatchPassedToLlm),
  );
  assert(
    '15e. structured evidence in mismatch prompt',
    mismatchDiag.promptUsedStructuredEvidence === true &&
      Boolean(mismatchProof.userPrompt && !mismatchProof.userPrompt.includes('Build run:')),
    'structured',
  );

  resetLlmProviderForTests();
  const disconnected = await applyBuildResultConversationalIntelligence({
    message: alignedPrompt,
    payload: connectedPayload,
    buildResult,
    rootDir: ROOT,
  });
  const disconnectedProof = getProof(disconnected);
  const disconnectedDiagnostics = disconnected.llmChatBrainDiagnostics as {
    fallbackUsed?: boolean;
    responseSource?: string;
  };

  assert(
    '16. LLM not invoked when disconnected',
    disconnectedProof.llmInvoked === false,
    String(disconnectedProof.llmInvoked),
  );
  assert(
    '17. fallbackUsed true when disconnected',
    disconnectedDiagnostics.fallbackUsed === true && disconnectedProof.fallbackUsed === true,
    String(disconnectedDiagnostics.fallbackUsed),
  );
  assert(
    '18. responseSource TEMPLATE_FALLBACK when disconnected',
    disconnectedDiagnostics.responseSource === 'TEMPLATE_FALLBACK' &&
      disconnectedProof.responseSource === 'TEMPLATE_FALLBACK',
    String(disconnectedDiagnostics.responseSource),
  );
  assert(
    '19. disconnected response includes fallback marker',
    String(disconnected.brainResponse).includes(BUILD_RESULT_TEMPLATE_FALLBACK_MARKER),
    BUILD_RESULT_TEMPLATE_FALLBACK_MARKER,
  );
  assert(
    '20. disconnected audit verdict',
    auditLlmConnectionProof(disconnectedProof).verdict === 'LLM_NOT_CONNECTED',
    auditLlmConnectionProof(disconnectedProof).verdict,
  );

  resetLlmProviderForTests();
  const errorProvider = createMockLlmProvider([]);
  errorProvider.chat = async () => {
    throw new Error('LLM_CONNECTION_PROOF_FORCED_ERROR');
  };
  setLlmProviderForTests(errorProvider);

  const errorResult = await applyBuildResultConversationalIntelligence({
    message: alignedPrompt,
    payload: connectedPayload,
    buildResult,
    rootDir: ROOT,
  });
  const errorProof = getProof(errorResult);

  assert(
    '21. LLM invoked before error fallback',
    errorProof.llmInvoked === true,
    String(errorProof.llmInvoked),
  );
  assert(
    '22. responseSource ERROR_FALLBACK on LLM failure',
    errorProof.responseSource === 'ERROR_FALLBACK',
    errorProof.responseSource,
  );
  assert(
    '23. error fallback uses template marker',
    String(errorResult.brainResponse).includes(BUILD_RESULT_TEMPLATE_FALLBACK_MARKER),
    BUILD_RESULT_TEMPLATE_FALLBACK_MARKER,
  );

  resetLlmProviderForTests();
  setLlmProviderForTests(
    createMockLlmProvider([
      [
        'Build execution started for project "TaskFlow" — TASK_TRACKER_WEB_V1 materialization complete.',
        '',
        'Build run: build-llm-proof-001',
        'Project: proj-task-001',
        'Workspace: .generated-builder-workspaces/proj-task-001',
        'Profile: TASK_TRACKER_WEB_V1',
      ].join('\n'),
    ]),
  );

  const mechanical = await applyBuildResultConversationalIntelligence({
    message: alignedPrompt,
    payload: connectedPayload,
    buildResult,
    rootDir: ROOT,
  });
  const mechanicalProof = getProof(mechanical);
  const mechanicalAudit = auditLlmConnectionProof(mechanicalProof);

  assert(
    '24. mechanical LLM output still reaches chat (no silent template swap)',
    mechanicalProof.finalEqualsRawLlm === true,
    String(mechanicalProof.finalEqualsRawLlm),
  );
  assert(
    '25. mechanical LLM flagged as prompt constrained',
    mechanicalAudit.verdict === 'LLM_CONNECTED_BUT_PROMPT_TOO_CONSTRAINED',
    mechanicalAudit.verdict,
  );

  resetLlmProviderForTests();

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');
  console.log(`Connected-path audit: ${connectedAudit.verdict} — ${connectedAudit.verdictRationale}`);
  console.log(`Evidence: ${connectedAudit.evidence.join(' | ')}`);
  console.log('');

  if (failed.length > 0) {
    console.error(`LLM Connection Proof V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(LLM_CONNECTION_PROOF_V1_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
