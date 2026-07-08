/**
 * Build Intent Routing V1 — expense tracker and general build prompts must start real build runs.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  BUILD_INTENT_ROUTING_HEALTH_MARKER,
  BUILD_INTENT_ROUTING_PASS_TOKEN,
  getBuildIntentRun,
  isBuildIntentRequest,
  listBuildIntentRuns,
  resetBuildIntentRunsForTests,
  resolveBuildIntentProfile,
} from '../src/build-intent-routing/index.js';
import {
  resetGeneratedDevServerManagerForTests,
  resetOnePromptLivePreviewForTests,
  settleEventLoop,
} from '../src/one-prompt-live-preview/index.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import { resetProjectRegistryV1ForTests } from '../src/project-registry-v1/index.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const EXPENSE_TRACKER_PROMPT =
  'Build a modern expense tracking web application with categories, receipts, monthly budgets, and spending reports. Generate architecture, plan, tasks, and begin build execution.';

/** Exact Command Center UI prompt observed falling through to generic chat. */
const EXPENSE_TRACKER_REAL_UI_PROMPT =
  'Build a modern expense tracking web application called ExpenseTracker with categories, receipts, monthly budgets, and spending reports. Begin build execution now.';

/** Mirrors public/founder-reality/app.js askBrain() POST body shape. */
function buildCommandCenterBrainPayload(input: {
  message: string;
  activeProjectId?: string | null;
  projectName?: string;
  confirmProjectContextAlignment?: boolean;
}): Record<string, unknown> {
  return {
    message: input.message,
    timestamp: Date.now(),
    activeProjectId: input.activeProjectId ?? null,
    projectName: input.projectName ?? 'New Project',
    confirmProjectContextAlignment: input.confirmProjectContextAlignment === true,
  };
}

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

async function resetModules(): Promise<void> {
  resetOnePromptLivePreviewForTests();
  await resetGeneratedDevServerManagerForTests();
  resetPreviewSessionManagerForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetDevPulseV2AiDevEngineAuthorityForTests();
}

async function startTestServer(testRoot: string): Promise<{ server: Server; baseUrl: string }> {
  process.env.AIDEVENGINE_REGISTRY_ROOT = testRoot;
  const { createFounderRealityServer } = await import('../server/founder-reality-server.js');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to bind test server');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Build Intent Routing V1 — Validation');
  console.log('======================================');
  console.log('');

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const brainHandler = readFileSync(join(ROOT, 'server/brain-api-handler.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:build-intent-routing']), 'script');
  assert('02. build intent detector', isBuildIntentRequest(EXPENSE_TRACKER_PROMPT), 'expense prompt');
  assert(
    '02b. real UI expense prompt detected',
    isBuildIntentRequest(EXPENSE_TRACKER_REAL_UI_PROMPT),
    'real ui prompt',
  );
  assert(
    '03. expense profile resolved',
    resolveBuildIntentProfile(EXPENSE_TRACKER_PROMPT) === 'EXPENSE_TRACKER_WEB_V1' ||
      resolveBuildIntentProfile(EXPENSE_TRACKER_PROMPT) === 'FINANCE_TRACKER_WEB_V1',
    String(resolveBuildIntentProfile(EXPENSE_TRACKER_PROMPT)),
  );
  assert('04. brain handler routes build intent', brainHandler.includes('classifyBuildIntentRequest'), 'handler');
  assert(
    '05. build path uses conversational intelligence layer',
    brainHandler.includes('applyBuildResultConversationalIntelligence') &&
      brainHandler.indexOf('runOnePromptLivePreviewBuild') <
        brainHandler.indexOf('applyBuildResultConversationalIntelligence'),
    'conversational layer after build',
  );
  assert('06. UI handles BUILD category', appJs.includes("result.category === 'BUILD'"), 'ui build');
  assert('07. UI applies onePromptLivePreview', appJs.includes('applyOnePromptLivePreview'), 'preview sync');
  assert(
    '07b. UI sends activeProjectId + projectName',
    appJs.includes('activeProjectId: activeProjectId') && appJs.includes('projectName: getActiveProjectName()'),
    'ui payload',
  );
  assert(
    '07c. brain handler logs classification',
    brainHandler.includes('BRAIN_BUILD_INTENT_CLASSIFICATION'),
    'server log',
  );
  assert(
    '07d. health exposes buildIntentRouting',
    brainHandler.includes('buildLocalRuntimeHealthPayload'),
    'health',
  );

  const TEST_ROOT = mkdtempSync(join(tmpdir(), 'devpulse-build-intent-test-'));
  resetProjectRegistryV1ForTests(TEST_ROOT);
  resetBuildIntentRunsForTests(TEST_ROOT);
  await resetModules();

  const { server, baseUrl } = await startTestServer(TEST_ROOT);
  try {
    const healthRes = await fetch(`${baseUrl}/api/brain/health`);
    const healthJson = (await healthRes.json()) as {
      buildIntentRouting?: boolean;
      registryLoaded?: boolean;
      runtimeReady?: boolean;
    };
    assert(
      '07e. health buildIntentRouting marker',
      healthJson.buildIntentRouting === BUILD_INTENT_ROUTING_HEALTH_MARKER &&
        healthJson.registryLoaded === true &&
        healthJson.runtimeReady === true,
      String(healthJson.buildIntentRouting),
    );

    const startedAt = Date.now();
    const chatRes = await fetch(`${baseUrl}/api/brain/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        buildCommandCenterBrainPayload({
          message: EXPENSE_TRACKER_REAL_UI_PROMPT,
          activeProjectId: 'expense-tracker-ui-1',
          projectName: 'ExpenseTracker',
        }),
      ),
    });
    const elapsedMs = Date.now() - startedAt;

    assert('08. chat HTTP 200', chatRes.status === 200, String(chatRes.status));
    assert('09. chat responds quickly', elapsedMs < 180_000, `${elapsedMs}ms`);

    const chatJson = (await chatRes.json()) as {
      category?: string;
      brainResponse?: string;
      buildRunId?: string;
      activeProjectId?: string | null;
      buildExecution?: {
        buildRunId?: string;
        status?: string;
        workspacePath?: string | null;
        stage?: string;
      };
      onePromptLivePreview?: {
        buildId?: string;
        projectId?: string;
        status?: string;
        workspacePath?: string | null;
        generatedProfile?: string | null;
        failureReason?: string | null;
      };
      operatorFeedEvents?: unknown[];
      llmChatBrainDiagnostics?: { usedLlm?: boolean };
    };

    const brainResponse = chatJson.brainResponse ?? '';
    assert('10. category BUILD', chatJson.category === 'BUILD', chatJson.category ?? 'none');
    assert(
      '11. not generic refusal',
      !/cannot execute the build directly/i.test(brainResponse) &&
        !/execution chain is not proven/i.test(brainResponse) &&
        !/can't claim full autonomous/i.test(brainResponse),
      brainResponse.slice(0, 120),
    );
    assert(
      '12. build outcome in response',
      /build run:|build execution started|workspace:|preview|expense|profile|template fallback/i.test(
        brainResponse,
      ),
      brainResponse.slice(0, 120),
    );
    assert('13. buildRunId present', Boolean(chatJson.buildRunId), String(chatJson.buildRunId));
    assert(
      '14. activeProjectId linked',
      Boolean(chatJson.activeProjectId && chatJson.onePromptLivePreview?.projectId === chatJson.activeProjectId),
      String(chatJson.activeProjectId),
    );
    assert(
      '14b. buildExecution stage present',
      Boolean(chatJson.buildExecution?.stage),
      String(chatJson.buildExecution?.stage),
    );
    assert(
      '14c. workspace path present',
      Boolean(
        chatJson.buildExecution?.workspacePath || chatJson.onePromptLivePreview?.workspacePath,
      ),
      String(chatJson.buildExecution?.workspacePath ?? chatJson.onePromptLivePreview?.workspacePath),
    );
    assert(
      '15. operator feed events',
      Array.isArray(chatJson.operatorFeedEvents) && chatJson.operatorFeedEvents.length >= 3,
      String(chatJson.operatorFeedEvents?.length ?? 0),
    );
    assert(
      '16. build path LLM diagnostics present',
      chatJson.llmChatBrainDiagnostics?.usedLlm === false ||
        chatJson.llmChatBrainDiagnostics?.usedLlm === true,
      String(chatJson.llmChatBrainDiagnostics?.usedLlm),
    );
    assert(
      '16b. template fallback or LLM conversational path',
      chatJson.llmChatBrainDiagnostics?.usedLlm === true ||
        /template fallback|build run:|build execution started/i.test(brainResponse),
      brainResponse.slice(0, 80),
    );

    const build = chatJson.onePromptLivePreview;
    assert('17. onePromptLivePreview present', Boolean(build), build?.status ?? 'absent');
    assert('18. buildRunId matches build', chatJson.buildRunId === build?.buildId, String(build?.buildId));

    const runsPath = join(TEST_ROOT, '.aidevengine', 'build-intent-runs-v1.json');
    assert('19. execution state persisted', existsSync(runsPath), runsPath);
    const persisted = listBuildIntentRuns(TEST_ROOT);
    assert('20. persisted run for buildRunId', persisted.some((run) => run.buildRunId === chatJson.buildRunId), 'missing');
    const storedRun = chatJson.buildRunId ? getBuildIntentRun(chatJson.buildRunId, TEST_ROOT) : null;
    assert('21. stored run linked to project', storedRun?.projectId === build?.projectId, storedRun?.projectId ?? 'none');

    if (build?.status === 'READY') {
      assert(
        '22. expense profile materialized',
        build.generatedProfile === 'EXPENSE_TRACKER_WEB_V1' ||
          build.generatedProfile === 'FINANCE_TRACKER_WEB_V1',
        build.generatedProfile ?? 'none',
      );
      assert(
        '23. workspace under generated dir',
        Boolean(build.workspacePath?.includes(GENERATED_BUILDER_WORKSPACES_DIR)),
        build.workspacePath ?? 'none',
      );
      assert('24. build execution READY', chatJson.buildExecution?.status === 'READY', build.status);
    } else {
      assert('22. structured failure or building', Boolean(build?.status), build?.status ?? 'none');
      assert(
        '23. workspace queued or created',
        Boolean(build?.workspacePath) || build?.status === 'BUILDING',
        build?.workspacePath ?? build?.status ?? 'none',
      );
      assert(
        '24. failure reason when not READY',
        build?.status === 'BUILDING' || Boolean(build?.failureReason),
        build?.failureReason ?? build?.status ?? 'none',
      );
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    delete process.env.AIDEVENGINE_REGISTRY_ROOT;
    await resetModules();
    await settleEventLoop();
    rmSync(TEST_ROOT, { recursive: true, force: true });
  }

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Build Intent Routing V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(BUILD_INTENT_ROUTING_PASS_TOKEN);
  console.log('Build-intent prompts route into autonomous builder execution.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
