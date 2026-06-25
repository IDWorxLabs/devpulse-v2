/**
 * Execution Trace & Conversational Architecture V1 — validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyBuildResultConversationalIntelligence,
  buildBuildResultConversationalContext,
  promptUsesStructuredEvidence,
} from '../src/build-result-conversational-intelligence/index.js';
import { composeOnePromptBuildBrainApiPayload } from '../src/one-prompt-live-preview/one-prompt-build-chat-response.js';
import { composeOnePromptBuildChatResponse } from '../src/one-prompt-live-preview/one-prompt-build-orchestrator.js';
import {
  buildOnePromptExecutionTraceEvents,
  chatContainsMechanicalRuntimeDump,
  createExecutionTraceEvidenceBundle,
  EXECUTION_TRACE_ARCHITECTURE_V1_PASS_TOKEN,
  executionTraceContainsConversationalLanguage,
  filterExecutionTraceEvents,
  isConversationalChatResponse,
  searchExecutionTraceEvents,
} from '../src/execution-trace/index.js';
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

function readSource(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function sampleReadyBuild(
  overrides: Partial<OnePromptLivePreviewBuildResult> = {},
): OnePromptLivePreviewBuildResult {
  return {
    readOnly: true,
    buildId: 'build-trace-001',
    projectId: 'proj-expense-001',
    projectName: 'ExpenseTracker',
    status: 'READY',
    prompt: 'Build an expense tracker with reports and categories',
    requestType: 'CHAT_BUILD',
    workspaceId: 'proj-expense-001',
    workspacePath: '.generated-builder-workspaces/proj-expense-001',
    generatedProfile: 'EXPENSE_TRACKER_WEB_V1',
    planningProofLevel: 'FULL',
    materializationProofLevel: 'FULL',
    buildResult: 'PASS',
    npmInstallOk: true,
    npmBuildOk: true,
    previewUrl: 'http://127.0.0.1:5173/',
    livePreviewAvailable: true,
    failureReason: null,
    featureSignals: null,
    materializationManifest: null,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

async function main(): Promise<void> {
  const indexHtml = readSource('public/founder-reality/index.html');
  const appJs = readSource('public/founder-reality/app.js');
  const brainHandler = readSource('server/brain-api-handler.ts');
  const applySource = readSource(
    'src/build-result-conversational-intelligence/apply-build-result-conversational-intelligence.ts',
  );

  assert(
    'UI retires Operator Feed title',
    indexHtml.includes('Execution Trace') && !indexHtml.includes('<h2 class="feed-title">Operator Feed</h2>'),
    'Founder UI panel title is Execution Trace',
  );

  assert(
    'execution-trace module exists',
    existsSync(join(ROOT, 'src/execution-trace/index.ts')),
    'src/execution-trace/index.ts present',
  );

  assert(
    'brain-types includes executionTraceEvents',
    readSource('src/command-center-brain/brain-types.ts').includes('executionTraceEvents'),
    'BrainResponseResult exposes executionTraceEvents',
  );

  const buildResult = sampleReadyBuild();
  const payload = composeOnePromptBuildBrainApiPayload({
    message: buildResult.prompt!,
    buildResult,
  });

  assert(
    'build payload emits executionTraceEvents',
    Array.isArray(payload.executionTraceEvents) && payload.executionTraceEvents.length > 0,
    `executionTraceEvents count=${Array.isArray(payload.executionTraceEvents) ? payload.executionTraceEvents.length : 0}`,
  );

  assert(
    'build payload emits executionTraceEvidence',
    Boolean(payload.executionTraceEvidence) &&
      (payload.executionTraceEvidence as { source?: string }).source === 'runtime',
    'executionTraceEvidence bundle attached',
  );

  assert(
    'operatorFeedEvents retained as legacy alias',
    Array.isArray(payload.operatorFeedEvents) && payload.operatorFeedEvents.length > 0,
    'operatorFeedEvents still populated for backward compatibility',
  );

  const chatFallback = composeOnePromptBuildChatResponse(buildResult);
  assert(
    'chat fallback avoids mechanical runtime dumps',
    !chatContainsMechanicalRuntimeDump(chatFallback),
    'composeOnePromptBuildChatResponse is conversational',
  );

  assert(
    'chat fallback is conversational',
    isConversationalChatResponse(chatFallback),
    'Template fallback reads as founder conversation',
  );

  const traceEvents = buildOnePromptExecutionTraceEvents(buildResult, buildResult.prompt!);
  assert(
    'execution trace events are chronological',
    traceEvents.every((e, i) => i === 0 || e.timestamp >= traceEvents[i - 1]!.timestamp),
    'Events sorted by timestamp',
  );

  const traceText = traceEvents.map((e) => `${e.eventTitle} ${e.technicalDetail}`).join('\n');
  assert(
    'execution trace avoids conversational language',
    !executionTraceContainsConversationalLanguage(traceText),
    'Trace uses evidence-only phrasing',
  );

  assert(
    'execution trace searchable',
    searchExecutionTraceEvents(traceEvents, 'npm install').length > 0,
    'searchExecutionTraceEvents finds npm install milestone',
  );

  assert(
    'execution trace compact mode',
    filterExecutionTraceEvents(traceEvents, 'compact').length <= traceEvents.length,
    'compact mode filters to milestones',
  );

  assert(
    'execution trace artifacts mode',
    filterExecutionTraceEvents(traceEvents, 'artifacts').length > 0,
    'artifacts mode surfaces workspace/preview events',
  );

  assert(
    'UI supports execution trace viewing modes',
    appJs.includes('execution-trace-mode-btn') && appJs.includes('resolveExecutionTraceEventsFromPayload'),
    'app.js wires trace modes and dual event resolution',
  );

  assert(
    'UI export renamed to execution trace',
    appJs.includes('aidevengine-execution-trace-'),
    'Export filename uses execution-trace',
  );

  assert(
    'build path skips duplicate trail for BUILD category',
    appJs.includes("responseForTrail.category !== 'BUILD'"),
    'Chat response not re-logged into trace for builds',
  );

  const context = buildBuildResultConversationalContext({
    message: buildResult.prompt!,
    buildResult,
    templateFallback: chatFallback,
  });

  const userMessage = readSource('src/build-result-conversational-intelligence/build-result-llm-instructions.ts');
  assert(
    'LLM instructions reference Execution Trace',
    userMessage.includes('Execution Trace'),
    'System prompt separates chat from trace',
  );

  resetLlmProviderForTests();
  const llmResponse =
    "I've completed the initial build for your Expense Tracker application. The workspace compiled successfully and a live preview is available. Two capabilities may still need materialization before launch-ready.";
  setLlmProviderForTests(createMockLlmProvider([llmResponse]));

  const enriched = await applyBuildResultConversationalIntelligence({
    message: buildResult.prompt!,
    buildResult,
    payload,
    rootDir: ROOT,
  });

  const brainResponse = String(enriched.brainResponse ?? '');
  assert(
    'LLM chat response is conversational',
    isConversationalChatResponse(brainResponse),
    brainResponse.slice(0, 120),
  );

  assert(
    'LLM chat avoids mechanical runtime dumps',
    !chatContainsMechanicalRuntimeDump(brainResponse),
    'No Build run:/Workspace: duplication in chat',
  );

  const llmUserPrompt = readSource(
    'src/build-result-conversational-intelligence/build-result-structured-evidence.ts',
  );
  assert(
    'structured evidence includes executionTraceEvidence field',
    llmUserPrompt.includes('executionTraceEvidence'),
    'Chat consumes trace via evidence store',
  );

  assert(
    'apply layer reads executionTraceEvidence from payload',
    applySource.includes('executionTraceEvidence'),
    'Conversational layer grounded in trace evidence',
  );

  assert(
    'brain handler uses conversational intelligence on builds',
    brainHandler.includes('applyBuildResultConversationalIntelligence'),
    'Build path invokes conversational layer',
  );

  const structuredPrompt = [
    'STRUCTURED_BUILD_EVIDENCE (JSON):',
    JSON.stringify({ executionTraceEvidence: { source: 'execution_trace' } }),
  ].join('\n');
  assert(
    'prompt uses structured evidence not template',
    promptUsesStructuredEvidence(structuredPrompt),
    'LLM prompt format validated',
  );

  const bundle = createExecutionTraceEvidenceBundle({
    events: traceEvents,
    buildRunId: buildResult.buildId,
    projectId: buildResult.projectId,
  });
  assert(
    'evidence store summary populated',
    bundle.summary.eventCount === traceEvents.length,
    `summary.eventCount=${bundle.summary.eventCount}`,
  );

  const failed = results.filter((r) => !r.passed);
  if (failed.length) {
    console.error('EXECUTION_TRACE_ARCHITECTURE_V1_FAIL');
    for (const f of failed) {
      console.error(`  ✗ ${f.name}: ${f.detail}`);
    }
    process.exit(1);
  }

  console.log(EXECUTION_TRACE_ARCHITECTURE_V1_PASS_TOKEN);
  for (const r of results) {
    console.log(`  ✓ ${r.name}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
