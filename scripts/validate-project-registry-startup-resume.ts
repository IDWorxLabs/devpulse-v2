/**
 * Project Registry Startup Hydration + Resume State — validation suite.
 */

import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import {
  getProjectRegistryHydrationSnapshot,
  isProjectRegistryHydrationReady,
  PROJECT_REGISTRY_HYDRATION_TARGET_MS,
  PROJECT_REGISTRY_STARTUP_HYDRATION_PASS_TOKEN,
  resetProjectRegistryStartupHydrationForTests,
  runProjectRegistryStartupHydration,
} from '../src/project-registry-startup-hydration/index.js';
import {
  invalidateProjectRegistryV1Cache,
  resetProjectRegistryV1ForTests,
  writeProjectRegistryV1ForTests,
} from '../src/project-registry-v1/index.js';
import {
  deriveProjectBuildState,
  PROJECT_RESUME_STATE_PASS_TOKEN,
  routeDuplicateProjectResume,
} from '../src/project-resume-state/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';
import {
  resetGeneratedDevServerManagerForTests,
  resetOnePromptLivePreviewForTests,
  settleEventLoop,
} from '../src/one-prompt-live-preview/index.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';

export const PROJECT_REGISTRY_STARTUP_RESUME_PASS_TOKEN =
  'PROJECT_REGISTRY_STARTUP_RESUME_V1_PASS' as const;

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const APP_JS = join(ROOT, 'public/founder-reality/app.js');

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(section: string, name: string, condition: boolean, detail: string): void {
  results.push({ name: `[${section}] ${name}`, passed: condition, detail });
}

async function resetModules(): Promise<void> {
  resetOnePromptLivePreviewForTests();
  await resetGeneratedDevServerManagerForTests();
  resetPreviewSessionManagerForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetDevPulseV2AiDevEngineAuthorityForTests();
  resetProjectRegistryV1ForTests();
  resetProjectRegistryStartupHydrationForTests();
}

async function startTestServer(testRoot: string): Promise<{ server: Server; baseUrl: string }> {
  process.env.AIDEVENGINE_REGISTRY_ROOT = testRoot;
  invalidateProjectRegistryV1Cache();
  const server = createFounderRealityServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to bind test server');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

function seedRegistryWithLisa(testRoot: string, lisaPrompt: string): string {
  const stamp = new Date().toISOString();
  const lisaId = 'lisa-resume-test-1';
  writeProjectRegistryV1ForTests(
    {
      version: 1,
      activeProjectId: lisaId,
      projects: [
        {
          projectId: lisaId,
          name: 'LISA',
          status: 'ACTIVE',
          createdAt: stamp,
          updatedAt: stamp,
          lastActivityAt: stamp,
          summary: 'Assistive communication app',
          materializationQualityVerdict: 'NEEDS_WORK',
          workspaceRealityAuditStatus: 'FAIL',
        },
      ],
    },
    testRoot,
  );

  const projectRoot = join(testRoot, '.aidev-projects', lisaId);
  mkdirSync(join(projectRoot, '.aidev'), { recursive: true });
  mkdirSync(join(projectRoot, 'source', 'src', 'features', 'eye-tracking-board'), {
    recursive: true,
  });
  writeFileSync(
    join(projectRoot, 'project.json'),
    JSON.stringify(
      {
        projectId: lisaId,
        projectName: 'LISA',
        originalPrompt: lisaPrompt,
        status: 'PROMOTED',
        lastBuildRunId: 'one-prompt-build-1',
        lastSuccessfulBuildRunId: 'one-prompt-build-1',
      },
      null,
      2,
    ),
    'utf8',
  );
  writeFileSync(
    join(projectRoot, '.aidev', 'workspace-reality-audit.json'),
    JSON.stringify({ status: 'FAIL', score: 42 }, null, 2),
    'utf8',
  );
  writeFileSync(
    join(projectRoot, '.aidev', 'materialization-quality-score.json'),
    JSON.stringify({ verdict: 'NEEDS_WORK', overallScore: 55 }, null, 2),
    'utf8',
  );
  return lisaId;
}

export async function runProjectRegistryStartupResumeValidation(): Promise<{
  passed: number;
  failed: number;
  results: Check[];
}> {
  await resetModules();
  const appJs = readFileSync(APP_JS, 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('startup-hydration', 'module exists', existsSync(join(ROOT, 'src/project-registry-startup-hydration/index.ts')), 'index.ts');
  assert('startup-hydration', 'resume module exists', existsSync(join(ROOT, 'src/project-resume-state/index.ts')), 'index.ts');
  assert('startup-hydration', 'package script hydration', Boolean(pkg.scripts?.['validate:project-registry-startup-hydration']), 'script');
  assert('startup-hydration', 'package script no-false-error', Boolean(pkg.scripts?.['validate:project-registry-no-false-error']), 'script');
  assert('startup-hydration', 'package script resume', Boolean(pkg.scripts?.['validate:project-resume-state']), 'script');

  const testRoot = mkdtempSync(join(tmpdir(), 'devpulse-registry-startup-'));
  try {
    const lisaPrompt =
      'Build LISA assistive communication app with eye tracking, blink input, and speech output.';
    seedRegistryWithLisa(testRoot, lisaPrompt);

    const started = Date.now();
    const state = runProjectRegistryStartupHydration(testRoot);
    const snapshot = getProjectRegistryHydrationSnapshot();
    const durationMs = Date.now() - started;

    assert('startup-hydration', 'hydration ready', isProjectRegistryHydrationReady(), snapshot.phase);
    assert('startup-hydration', 'phase ready or empty', snapshot.phase === 'READY' || snapshot.phase === 'EMPTY', snapshot.phase);
    assert('startup-hydration', 'registry loaded', state.projects.length >= 1, String(state.projects.length));
    assert('startup-hydration', 'persistent scanned', snapshot.persistentProjectCount >= 1, String(snapshot.persistentProjectCount));
    assert(
      'startup-hydration',
      'within target local',
      durationMs <= PROJECT_REGISTRY_HYDRATION_TARGET_MS * 4,
      `${durationMs}ms`,
    );

    const buildState = deriveProjectBuildState('lisa-resume-test-1', testRoot);
    assert('resume-state', 'lisa resumable', buildState?.resumable === true, buildState?.buildState ?? 'missing');
    assert(
      'resume-state',
      'lisa incomplete banner',
      Boolean(buildState?.bannerMessage?.includes('incomplete')),
      buildState?.bannerMessage ?? '',
    );
    assert(
      'resume-state',
      'resume actions',
      (buildState?.primaryActions.includes('RESUME_BUILD') ?? false) === true,
      (buildState?.primaryActions ?? []).join(','),
    );

    const duplicate = routeDuplicateProjectResume({
      rawPrompt: lisaPrompt,
      rootDir: testRoot,
    });
    assert('duplicate-routing', 'duplicate detected', duplicate.shouldBlock === true, duplicate.reason);
    assert('duplicate-routing', 'routes to lisa', duplicate.resumingProjectId === 'lisa-resume-test-1', duplicate.resumingProjectId ?? 'none');
    assert(
      'duplicate-routing',
      'uses stored prompt',
      duplicate.promptSource === 'USER' || duplicate.promptSource === 'STORED',
      duplicate.promptSource,
    );

    const { server, baseUrl } = await startTestServer(testRoot);
    try {
      const res = await fetch(`${baseUrl}/api/projects/registry`);
      const payload = (await res.json()) as {
        hydrationStatus?: string;
        hydrationReady?: boolean;
        projects?: { items?: Array<{ buildState?: string }> };
      };
      assert('no-false-error', 'registry HTTP 200', res.ok, String(res.status));
      assert(
        'no-false-error',
        'hydration status present',
        payload.hydrationStatus === 'READY' || payload.hydrationStatus === 'EMPTY',
        String(payload.hydrationStatus),
      );
      assert('no-false-error', 'hydrationReady true', payload.hydrationReady === true, String(payload.hydrationReady));
      assert(
        'no-false-error',
        'buildState on items',
        payload.projects?.items?.[0]?.buildState != null,
        payload.projects?.items?.[0]?.buildState ?? 'missing',
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      await settleEventLoop();
    }
  } finally {
    rmSync(testRoot, { recursive: true, force: true });
    delete process.env.AIDEVENGINE_REGISTRY_ROOT;
  }

  assert('no-false-error', 'restoring UI copy', appJs.includes('Restoring project registry'), 'app.js');
  assert('no-false-error', 'empty hydration state', appJs.includes("hydrationState = 'empty'"), 'app.js');
  assert('no-false-error', 'restoring hydration state', appJs.includes("hydrationState = 'restoring'"), 'app.js');
  assert('no-false-error', 'retry attempts increased', appJs.includes('REGISTRY_HYDRATION_RETRY_ATTEMPTS = 5'), 'app.js');
  assert('one-prompt-resume', 'resume build handler', appJs.includes('resumeProjectBuild'), 'app.js');
  assert('one-prompt-resume', 'incomplete banner', appJs.includes('renderIncompleteProjectBanner'), 'app.js');
  assert('one-prompt-resume', 'confirmProjectResume api', existsSync(join(ROOT, 'server/build-from-prompt-handler.ts')), 'handler');

  const duplicateHash = routeDuplicateProjectResume({
    rawPrompt: 'Build expense tracker with categories and reports',
    rootDir: mkdtempSync(join(tmpdir(), 'devpulse-empty-')),
  });
  assert('duplicate-routing', 'no false duplicate on empty', duplicateHash.shouldBlock === false, duplicateHash.reason);

  assert('pass-tokens', 'hydration token', PROJECT_REGISTRY_STARTUP_HYDRATION_PASS_TOKEN.length > 0, PROJECT_REGISTRY_STARTUP_HYDRATION_PASS_TOKEN);
  assert('pass-tokens', 'resume token', PROJECT_RESUME_STATE_PASS_TOKEN.length > 0, PROJECT_RESUME_STATE_PASS_TOKEN);

  const failed = results.filter((check) => !check.passed).length;
  return { passed: results.length - failed, failed, results };
}

async function main(): Promise<void> {
  const summary = await runProjectRegistryStartupResumeValidation();
  for (const check of summary.results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`);
  }
  console.log('');
  console.log(
    `Project Registry Startup + Resume — Validation: ${summary.failed === 0 ? 'PASSED' : 'FAILED'} (${summary.passed + summary.failed} checks, ${summary.failed} failed)`,
  );
  if (summary.failed === 0) {
    console.log('');
    console.log(PROJECT_REGISTRY_STARTUP_RESUME_PASS_TOKEN);
    console.log(PROJECT_REGISTRY_STARTUP_HYDRATION_PASS_TOKEN);
    console.log(PROJECT_RESUME_STATE_PASS_TOKEN);
  }
  process.exit(summary.failed === 0 ? 0 : 1);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
