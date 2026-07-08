/**
 * Build Intent Classification Recovery V1 — validation suite.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BUILD_INTENT_CLASSIFICATION_RECOVERY_V1_PASS_TOKEN,
  classifyBuildIntentWithRecovery,
} from '../src/build-intent-classification-recovery-v1/index.js';
import { classifyBuildIntentRequest } from '../src/build-intent-routing/index.js';
import { classifyBrainRequest } from '../src/command-center-brain/brain-request-classifier.js';
import { generateBrainResponse } from '../src/command-center-brain/brain-response-generator.js';
import { getBrainRoadmapContext } from '../src/command-center-brain/brain-roadmap-awareness.js';
import {
  assessProjectContextAlignment,
  extractGenericBuildTargetName,
  upsertProjectContextMetadata,
} from '../src/project-context-alignment-v1/index.js';
import { deriveProjectNameFromPrompt } from '../src/project-session-continuity-v1/index.js';
import {
  invalidateProjectRegistryV1Cache,
  writeProjectRegistryV1ForTests,
} from '../src/project-registry-v1/index.js';
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
import { finishValidator, startFounderRealityValidatorServer } from './lib/validator-clean-exit.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const LISA_LIKE_PROMPT =
  'Build the full LISA project end to end — an assistive communication web application for non-verbal users with eye-tracking input, caregiver dashboard, emergency speech, and communication history. Generate architecture, plan, tasks, and begin build execution.';

const EXPENSE_MISPLACED_PROMPT =
  'Build a modern expense tracking web application with categories, receipts, monthly budgets, and spending reports. Generate architecture, plan, tasks, and begin build execution.';

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
  resetProjectRegistryV1ForTests();
}

function expectBuild(prompt: string): void {
  const recovery = classifyBuildIntentWithRecovery(prompt);
  const shared = classifyBuildIntentRequest(prompt);
  const brain = classifyBrainRequest({ message: prompt });
  assert(
    `BUILD recovery — ${prompt.slice(0, 48)}`,
    recovery.buildIntentDetected && recovery.requestCategory === 'BUILD' && recovery.confidence === 'HIGH',
    JSON.stringify(recovery),
  );
  assert(
    `BUILD shared classifier — ${prompt.slice(0, 48)}`,
    shared.isBuildIntent && shared.requestCategory === 'BUILD' && shared.buildIntentDetected,
    JSON.stringify(shared),
  );
  assert(
    `BUILD brain classifier — ${prompt.slice(0, 48)}`,
    brain.category === 'BUILD',
    JSON.stringify(brain),
  );
  assert(
    `BUILD signals recorded — ${prompt.slice(0, 48)}`,
    shared.matchedBuildSignals.length > 0,
    shared.matchedBuildSignals.join(', '),
  );
}

async function main(): Promise<void> {
  let closeTestServer: (() => Promise<void>) | null = null;
  const testRoot = mkdtempSync(join(tmpdir(), 'build-intent-recovery-'));

  try {
    console.log('');
    console.log('Build Intent Classification Recovery V1 — Validation');
    console.log('===================================================');
    console.log('');

    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    const detectorTs = readFileSync(join(ROOT, 'src/build-intent-routing/build-intent-detector.ts'), 'utf8');
    const classifierTs = readFileSync(join(ROOT, 'src/command-center-brain/brain-request-classifier.ts'), 'utf8');
    const handlerTs = readFileSync(join(ROOT, 'server/brain-api-handler.ts'), 'utf8');
    const bridgeTs = readFileSync(join(ROOT, 'src/chat-to-build-execution-bridge-v1/bridge-authority.ts'), 'utf8');

    assert('01. package script', Boolean(pkg.scripts?.['validate:build-intent-classification-recovery']), 'package.json');
    assert('02. recovery module exists', existsSync(join(ROOT, 'src/build-intent-classification-recovery-v1/index.ts')), 'module');
    assert('03. recovery runs before legacy', detectorTs.includes('classifyBuildIntentWithRecovery'), 'detector');
    assert('04. no minimum length gate', !detectorTs.includes('normalized.length < 20'), 'detector length');
    assert('05. brain classifier uses recovery first', classifierTs.includes('classifyBuildIntentWithRecovery'), 'brain classifier');
    assert('06. handler recovery safety net', handlerTs.includes('BUILD_INTENT_CLASSIFICATION_RECOVERY_V1'), 'handler');
    assert('07. bridge records matchedBuildSignals', bridgeTs.includes('matchedBuildSignals'), 'bridge');

    const helloRecovery = classifyBuildIntentWithRecovery('hello');
    const helloShared = classifyBuildIntentRequest('hello');
    assert('08. hello = GENERAL recovery', helloRecovery.requestCategory === 'GENERAL', JSON.stringify(helloRecovery));
    assert('09. hello = not build', !helloShared.isBuildIntent, JSON.stringify(helloShared));

    expectBuild('Build a calculator app.');
    expectBuild('Create an expense tracker app.');
    expectBuild('Build the full LISA project end to end with assistive communication and eye-tracking.');
    expectBuild('build a website');
    expectBuild('create a mobile app');
    expectBuild('generate a todo app');
    expectBuild('implement this feature');
    expectBuild('finish this project');
    expectBuild('rebuild this app');

    const lisaRecovery = classifyBuildIntentWithRecovery(LISA_LIKE_PROMPT);
    assert(
      '10. LISA assistive signals',
      lisaRecovery.assistiveSignals.length >= 2,
      lisaRecovery.assistiveSignals.join(', '),
    );
    assert('11. LISA = BUILD', lisaRecovery.buildIntentDetected, JSON.stringify(lisaRecovery));

    const calcBrain = classifyBrainRequest({ message: 'Build a calculator app.' });
    const calcResponse = generateBrainResponse('Build a calculator app.', calcBrain, [], getBrainRoadmapContext());
    assert(
      '12. no generic welcome for build prompt',
      !calcResponse.toLowerCase().includes('welcome to the command center'),
      calcResponse.slice(0, 120),
    );
    assert('13. build brain response mentions orchestration', calcResponse.includes('build orchestration'), calcResponse.slice(0, 120));

    const noActiveAlignment = assessProjectContextAlignment({
      prompt: 'Build a calculator app.',
      activeProjectId: null,
      rootDir: testRoot,
    });
    assert(
      '13a. no active project alignment not blocked',
      !noActiveAlignment.blocksExecution && noActiveAlignment.verdict === 'ALIGNED',
      JSON.stringify({ verdict: noActiveAlignment.verdict, blocks: noActiveAlignment.blocksExecution }),
    );
    assert(
      '13b. generic app name from prompt',
      extractGenericBuildTargetName('Build a calculator app.') === 'Calculator App',
      extractGenericBuildTargetName('Build a calculator app.') ?? 'null',
    );
    assert(
      '13c. derive project name from prompt',
      deriveProjectNameFromPrompt('Build a calculator app.') === 'Calculator App',
      deriveProjectNameFromPrompt('Build a calculator app.'),
    );

    await resetModules();
    const boot = await startFounderRealityValidatorServer(testRoot);
    closeTestServer = boot.close;
    const baseUrl = boot.baseUrl;

    const calcRes = await fetch(`${baseUrl}/api/brain/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Build a calculator app.',
        chatExecutionAuditId: `bir-calc-${Date.now()}`,
      }),
    });
    const calcBody = (await calcRes.json()) as {
      category?: string;
      brainResponse?: string;
      chatToBuildExecutionBridge?: { kind?: string };
      buildIntentClassification?: {
        requestCategory?: string;
        route?: string;
        matchedBuildSignals?: string[];
      };
    };
    await settleEventLoop();

    assert('14. calculator API 200', calcRes.status === 200, `status=${calcRes.status}`);
    assert(
      '15. calculator not PROJECT_CONTEXT_ALIGNMENT',
      calcBody.category !== 'PROJECT_CONTEXT_ALIGNMENT',
      calcBody.category ?? 'missing',
    );
    assert(
      '16. calculator bridge not ALIGNMENT_REQUIRED',
      calcBody.chatToBuildExecutionBridge?.kind !== 'ALIGNMENT_REQUIRED',
      calcBody.chatToBuildExecutionBridge?.kind ?? 'missing',
    );
    assert(
      '17. calculator build route BUILD_ORCHESTRATION',
      calcBody.buildIntentClassification?.route === 'BUILD_ORCHESTRATION',
      JSON.stringify(calcBody.buildIntentClassification),
    );
    assert(
      '18. calculator buildIntentClassification BUILD',
      calcBody.buildIntentClassification?.requestCategory === 'BUILD',
      JSON.stringify(calcBody.buildIntentClassification),
    );
    assert(
      '19. calculator matched build signals in classification',
      (calcBody.buildIntentClassification?.matchedBuildSignals?.length ?? 0) > 0,
      (calcBody.buildIntentClassification?.matchedBuildSignals ?? []).join(', '),
    );
    assert(
      '20. calculator not generic welcome',
      !String(calcBody.brainResponse ?? '').toLowerCase().includes('welcome to the command center'),
      String(calcBody.brainResponse ?? '').slice(0, 100),
    );

    const classifyRes = await fetch(`${baseUrl}/api/brain/classify-build-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Build a calculator app.' }),
    });
    const classifyBody = (await classifyRes.json()) as {
      requestCategory?: string;
      matchedBuildSignals?: string[];
    };
    assert('21. classify API BUILD', classifyBody.requestCategory === 'BUILD', JSON.stringify(classifyBody));
    assert(
      '22. classify API signals',
      (classifyBody.matchedBuildSignals?.length ?? 0) > 0,
      (classifyBody.matchedBuildSignals ?? []).join(', '),
    );

    const stamp = new Date().toISOString();
    writeProjectRegistryV1ForTests(
      {
        version: 1,
        activeProjectId: 'lisa-alignment-test-1',
        projects: [
          {
            projectId: 'lisa-alignment-test-1',
            name: 'LISA',
            status: 'ACTIVE',
            createdAt: stamp,
            updatedAt: stamp,
            lastActivityAt: stamp,
            summary: 'Assistive communication project',
          },
        ],
      },
      testRoot,
    );
    upsertProjectContextMetadata(
      {
        projectId: 'lisa-alignment-test-1',
        name: 'LISA',
        prompt: LISA_LIKE_PROMPT,
        profileConfidence: 'HIGH',
      },
      testRoot,
    );
    invalidateProjectRegistryV1Cache();

    const lisaMisplacedRes = await fetch(`${baseUrl}/api/brain/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: EXPENSE_MISPLACED_PROMPT,
        activeProjectId: 'lisa-alignment-test-1',
        projectName: 'LISA',
        chatExecutionAuditId: `bir-lisa-mis-${Date.now()}`,
      }),
    });
    const lisaMisplacedBody = (await lisaMisplacedRes.json()) as {
      category?: string;
      brainResponse?: string;
      chatToBuildExecutionBridge?: { kind?: string };
    };
    await settleEventLoop();

    assert('23. LISA active unrelated build blocked', lisaMisplacedRes.status === 200, `status=${lisaMisplacedRes.status}`);
    assert(
      '24. LISA active expense prompt PROJECT_CONTEXT_ALIGNMENT',
      lisaMisplacedBody.category === 'PROJECT_CONTEXT_ALIGNMENT',
      lisaMisplacedBody.category ?? 'missing',
    );
    assert(
      '25. LISA active alignment guard kind',
      lisaMisplacedBody.chatToBuildExecutionBridge?.kind === 'ALIGNMENT_REQUIRED',
      lisaMisplacedBody.chatToBuildExecutionBridge?.kind ?? 'missing',
    );
    assert(
      '26. LISA misplaced not generic welcome',
      !String(lisaMisplacedBody.brainResponse ?? '').toLowerCase().includes('welcome to the command center'),
      String(lisaMisplacedBody.brainResponse ?? '').slice(0, 100),
    );
  } finally {
    if (closeTestServer) await closeTestServer();
    rmSync(testRoot, { recursive: true, force: true });
    delete process.env.AIDEVENGINE_REGISTRY_ROOT;
  }

  console.log('');
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}`);
    if (!check.passed) console.log(`       ${check.detail}`);
  }

  const failed = results.filter((check) => !check.passed);
  console.log('');
  console.log(`${results.length - failed.length}/${results.length} checks passed`);
  console.log('');

  if (failed.length === 0) {
    console.log(BUILD_INTENT_CLASSIFICATION_RECOVERY_V1_PASS_TOKEN);
    await finishValidator(0);
  } else {
    await finishValidator(1);
  }
}

main().catch(async (err) => {
  console.error(err);
  await finishValidator(1);
});
