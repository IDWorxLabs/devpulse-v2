/**
 * Build Intent Route Parity V1 — shared validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  BUILD_INTENT_ROUTE_PARITY_CHAT_ONLY_PROMPTS,
  BUILD_INTENT_ROUTE_PARITY_V1_CONTRACT_VERSION,
  BUILD_INTENT_ROUTE_PARITY_V1_PASS_TOKEN,
  classifyBuildIntentRequest,
  isBuildIntentClassification,
  isBuildIntentRequest,
} from '../../src/build-intent-routing/index.js';
import { UNIVERSAL_BUILD_PIPELINE_MATRIX } from '../../src/universal-build-pipeline-verification/universal-build-pipeline-matrix.js';
import {
  assertValidatorRuntimeTruth,
  computeSourceFingerprint,
} from '../../src/runtime-truth-authority/index.js';
import { FOUNDER_REALITY_PORT } from '../../server/founder-reality-manifest.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

/** Exact Command Center UI prompt observed falling through to generic chat before parity. */
export const EXPENSE_TRACKER_REAL_UI_PROMPT =
  'Build a modern expense tracking web application called ExpenseTracker with categories, receipts, monthly budgets, and spending reports. Begin build execution now.';

export interface BuildIntentRouteParityCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export function assertBuildIntentRouteParityCheck(
  checks: BuildIntentRouteParityCheck[],
  name: string,
  condition: boolean,
  detail: string,
): void {
  checks.push({ name, passed: condition, detail });
}

export function runBuildIntentRouteParityEngineChecks(checks: BuildIntentRouteParityCheck[]): void {
  assertBuildIntentRouteParityCheck(
    checks,
    'engine.shared classifier module',
    existsSync(join(ROOT, 'src/build-intent-routing/build-intent-route-parity-v1.ts')),
    'build-intent-route-parity-v1.ts',
  );

  const expensePrompt = UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === 'expense-tracker')!.prompt;
  const serverDirect = isBuildIntentRequest(expensePrompt);
  const contract = classifyBuildIntentRequest(expensePrompt);

  assertBuildIntentRouteParityCheck(
    checks,
    'engine.contract matches isBuildIntentRequest',
    contract.isBuildIntent === serverDirect && contract.route === (serverDirect ? 'BUILD_ORCHESTRATION' : 'CHAT_ONLY'),
    `contract=${contract.isBuildIntent} direct=${serverDirect}`,
  );
  assertBuildIntentRouteParityCheck(
    checks,
    'engine.contract version',
    contract.contractVersion === BUILD_INTENT_ROUTE_PARITY_V1_CONTRACT_VERSION,
    contract.contractVersion,
  );
  assertBuildIntentRouteParityCheck(
    checks,
    'engine.real UI expense prompt',
    classifyBuildIntentRequest(EXPENSE_TRACKER_REAL_UI_PROMPT).isBuildIntent,
    'expense UI prompt',
  );
  assertBuildIntentRouteParityCheck(
    checks,
    'engine.isBuildIntentClassification helper',
    isBuildIntentClassification(classifyBuildIntentRequest(expensePrompt)),
    'build prompt',
  );

  for (const prompt of BUILD_INTENT_ROUTE_PARITY_CHAT_ONLY_PROMPTS) {
    const chatClassification = classifyBuildIntentRequest(prompt);
    assertBuildIntentRouteParityCheck(
      checks,
      `engine.chat-only: ${prompt.slice(0, 40)}`,
      chatClassification.isBuildIntent === false && chatClassification.route === 'CHAT_ONLY',
      String(chatClassification.isBuildIntent),
    );
  }

  for (const entry of UNIVERSAL_BUILD_PIPELINE_MATRIX) {
    const matrixClassification = classifyBuildIntentRequest(entry.prompt);
    assertBuildIntentRouteParityCheck(
      checks,
      `engine.matrix build: ${entry.categoryId}`,
      matrixClassification.isBuildIntent === true && matrixClassification.route === 'BUILD_ORCHESTRATION',
      String(matrixClassification.isBuildIntent),
    );
  }
}

export function runBuildIntentRouteParityWiringChecks(checks: BuildIntentRouteParityCheck[]): void {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');
  const browserJs = readFileSync(join(ROOT, 'public/founder-reality/build-intent-route-parity.js'), 'utf8');
  const brainHandler = readFileSync(join(ROOT, 'server/brain-api-handler.ts'), 'utf8');
  const serverJs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');

  assertBuildIntentRouteParityCheck(
    checks,
    'wiring.npm script',
    Boolean(pkg.scripts?.['validate:build-intent-route-parity']),
    'validate:build-intent-route-parity',
  );
  assertBuildIntentRouteParityCheck(
    checks,
    'wiring.browser helper script',
    indexHtml.includes('build-intent-route-parity.js'),
    'index.html script tag',
  );
  assertBuildIntentRouteParityCheck(
    checks,
    'wiring.browser classify API delegate',
    browserJs.includes('classifyBuildIntentRequest') &&
      browserJs.includes('/api/brain/classify-build-intent') &&
      !browserJs.includes('expense track'),
    'no duplicate heuristics',
  );
  assertBuildIntentRouteParityCheck(
    checks,
    'wiring.ui removed local heuristic',
    !appJs.includes('isOnePromptBuildPrompt') && !appJs.includes('function isOnePromptBuildPrompt'),
    'isOnePromptBuildPrompt removed',
  );
  assertBuildIntentRouteParityCheck(
    checks,
    'wiring.ui uses shared bridge',
    appJs.includes('BuildIntentRouteParity') &&
      appJs.includes('classifyBuildIntentRequest') &&
      appJs.includes('isBuildIntentClassification'),
    'RouteParity bridge',
  );
  assertBuildIntentRouteParityCheck(
    checks,
    'wiring.ui build progress on shared classification',
    appJs.includes('startBuildProgressFeedTicker') && appJs.includes('uiBuildIntent'),
    'progress ticker gating',
  );
  assertBuildIntentRouteParityCheck(
    checks,
    'wiring.ui no app-specific build regex',
    !/expense track\|expense tracker\|task tracker\|todo app/i.test(appJs.split('function askBrain')[1] ?? ''),
    'no narrow heuristics in askBrain',
  );
  assertBuildIntentRouteParityCheck(
    checks,
    'wiring.server classify endpoint',
    serverJs.includes('/api/brain/classify-build-intent') &&
      serverJs.includes('handleClassifyBuildIntentRequest'),
    'classify route',
  );
  assertBuildIntentRouteParityCheck(
    checks,
    'wiring.server shared classifier on respond',
    brainHandler.includes('classifyBuildIntentRequest') &&
      brainHandler.includes('buildIntentClassification'),
    'respond classification',
  );
  assertBuildIntentRouteParityCheck(
    checks,
    'wiring.server no duplicate local UI heuristic',
    !brainHandler.includes('isOnePromptBuildPrompt'),
    'server uses contract only',
  );
}

async function startTestServer(testRoot: string): Promise<{ server: Server; baseUrl: string }> {
  process.env.AIDEVENGINE_REGISTRY_ROOT = testRoot;
  const { createFounderRealityServer } = await import('../../server/founder-reality-server.js');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to bind test server');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

export async function runBuildIntentRouteParityLiveChecks(
  checks: BuildIntentRouteParityCheck[],
): Promise<void> {
  const TEST_ROOT = mkdtempSync(join(tmpdir(), 'devpulse-build-intent-parity-'));
  const { server, baseUrl } = await startTestServer(TEST_ROOT);

  try {
    for (const entry of UNIVERSAL_BUILD_PIPELINE_MATRIX) {
      const direct = classifyBuildIntentRequest(entry.prompt);
      const res = await fetch(`${baseUrl}/api/brain/classify-build-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: entry.prompt }),
      });
      const apiJson = (await res.json()) as {
        isBuildIntent?: boolean;
        route?: string;
        contractVersion?: string;
      };
      assertBuildIntentRouteParityCheck(
        checks,
        `live.api parity: ${entry.categoryId}`,
        res.status === 200 &&
          apiJson.contractVersion === BUILD_INTENT_ROUTE_PARITY_V1_CONTRACT_VERSION &&
          apiJson.isBuildIntent === direct.isBuildIntent &&
          apiJson.route === direct.route,
        `api=${apiJson.isBuildIntent} direct=${direct.isBuildIntent}`,
      );
    }

    for (const prompt of BUILD_INTENT_ROUTE_PARITY_CHAT_ONLY_PROMPTS) {
      const res = await fetch(`${baseUrl}/api/brain/classify-build-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });
      const apiJson = (await res.json()) as { isBuildIntent?: boolean; route?: string };
      assertBuildIntentRouteParityCheck(
        checks,
        `live.api chat-only: ${prompt.slice(0, 36)}`,
        res.status === 200 && apiJson.isBuildIntent === false && apiJson.route === 'CHAT_ONLY',
        String(apiJson.isBuildIntent),
      );
    }

    const uiPrompt = EXPENSE_TRACKER_REAL_UI_PROMPT;
    const classifyRes = await fetch(`${baseUrl}/api/brain/classify-build-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: uiPrompt }),
    });
    const classifyJson = (await classifyRes.json()) as { isBuildIntent?: boolean };
    assertBuildIntentRouteParityCheck(
      checks,
      'live.ui expense prompt classified as build',
      classifyJson.isBuildIntent === true,
      String(classifyJson.isBuildIntent),
    );

    const productionParity = await assertValidatorRuntimeTruth({
      runtimeMode: 'PRODUCTION_LOCALHOST',
      productionPort: FOUNDER_REALITY_PORT,
      expectedSourceFingerprint: computeSourceFingerprint(ROOT),
      requireProductionParity: true,
      productionLivenessOnly: true,
      requiredRoutes: [{ path: '/api/brain/classify-build-intent', method: 'POST' }],
      requiredCapabilities: ['buildIntentClassification', 'runtimeTruth'],
    });
    assertBuildIntentRouteParityCheck(
      checks,
      'live.production localhost:4321 parity',
      productionParity.ok,
      productionParity.errors[0] ?? 'production runtime matches disk',
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    delete process.env.AIDEVENGINE_REGISTRY_ROOT;
    rmSync(TEST_ROOT, { recursive: true, force: true });
  }
}

export async function runBuildIntentRouteParityValidation(): Promise<{
  checks: BuildIntentRouteParityCheck[];
  allPassed: boolean;
}> {
  const checks: BuildIntentRouteParityCheck[] = [];
  runBuildIntentRouteParityEngineChecks(checks);
  runBuildIntentRouteParityWiringChecks(checks);
  await runBuildIntentRouteParityLiveChecks(checks);
  return {
    checks,
    allPassed: checks.every((check) => check.passed),
  };
}

export function printBuildIntentRouteParityResults(checks: BuildIntentRouteParityCheck[]): number {
  let passed = 0;
  for (const check of checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`);
    if (check.passed) passed += 1;
  }
  console.log('');
  console.log(`${passed}/${checks.length} checks passed`);
  return passed;
}

export { BUILD_INTENT_ROUTE_PARITY_V1_PASS_TOKEN };
