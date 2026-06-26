/**
 * Live Prompt-Faithful Build Path V1 — validates /api/build/from-prompt orchestration path.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  resetOnePromptLivePreviewForTests,
} from '../src/one-prompt-live-preview/index.js';
import { buildOnePromptExecutionTraceEvents } from '../src/execution-trace/index.js';
import { runOnePromptLivePreviewBuild } from '../src/one-prompt-live-preview/one-prompt-build-orchestrator.js';
import { resetGeneratedDevServerManagerForTests } from '../src/one-prompt-live-preview/generated-dev-server-manager.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import {
  BANNED_FALLBACK_MODULES,
  listWorkspaceFeatureModuleIds,
  moduleIdsInclude,
} from '../src/prompt-faithful-generation/index.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';

export const LIVE_PROMPT_FAITHFUL_BUILD_PATH_PASS_TOKEN = 'LIVE_PROMPT_FAITHFUL_BUILD_PATH_V1_PASS';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const LISA_LIVE_PROMPT = `Build LISA — Locked In Syndrome App.

An assistive communication app for locked-in syndrome users that converts eye movement, gaze, and blinks into speech.

Mobile-first Android phone preview required.

Required modules:
* onboarding-calibration
* eye-tracking-board
* blink-input-engine
* gaze-keyboard
* text-to-speech
* quick-phrases
* caregiver-dashboard
* communication-history
* accessibility-settings
* emergency-speech

Do not use generic project management fallback. Generate architecture, plan, tasks, and begin build execution now.`;

const LISA_REQUIRED_MODULES = [
  'eye-tracking-board',
  'blink-input-engine',
  'gaze-keyboard',
  'text-to-speech',
  'quick-phrases',
  'caregiver-dashboard',
  'communication-history',
  'accessibility-settings',
  'emergency-speech',
];

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

async function main(): Promise<void> {
  console.log('');
  console.log('Live Prompt-Faithful Build Path V1 — Validation');
  console.log('==============================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const orchestratorSource = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  const handlerSource = readFileSync(join(ROOT, 'server/build-from-prompt-handler.ts'), 'utf8');

  assert(
    '01. package script',
    Boolean(pkg.scripts?.['validate:live-prompt-faithful-build-path']),
    'validate:live-prompt-faithful-build-path',
  );
  assert(
    '02. api routes to orchestrator',
    handlerSource.includes('runOnePromptLivePreviewBuild'),
    'build-from-prompt-handler.ts',
  );
  assert(
    '03. orchestrator uses faithful build plan first',
    orchestratorSource.includes('resolvePromptFaithfulBuildPlan(prompt)') &&
      orchestratorSource.includes('faithfulBuildPlan: buildPlan'),
    'orchestrator wiring',
  );
  assert(
    '04. orchestrator enforces faithfulness gate',
    orchestratorSource.includes('enforcePromptFaithfulMaterialization'),
    'faithfulness gate',
  );

  await resetModules();

  const projectId = `lisa-live-path-${Date.now()}`;
  const build = await runOnePromptLivePreviewBuild({
    rawPrompt: LISA_LIVE_PROMPT,
    projectRootDir: ROOT,
    source: 'validator',
    projectId,
    projectName: 'LISA',
  });

  const workspaceDir = join(ROOT, GENERATED_BUILDER_WORKSPACES_DIR, projectId);
  const modules = listWorkspaceFeatureModuleIds(workspaceDir);
  const manifest = (build.materializationManifest ?? {}) as Record<string, unknown>;

  assert('05. live build READY', build.status === 'READY', build.status);
  assert(
    '06. live profile GENERIC_CUSTOM_APP_V1',
    build.generatedProfile === 'GENERIC_CUSTOM_APP_V1',
    String(build.generatedProfile),
  );
  assert(
    '07. live profile not PROJECT_MANAGEMENT_WEB_V1',
    build.generatedProfile !== 'PROJECT_MANAGEMENT_WEB_V1',
    String(build.generatedProfile),
  );

  for (const moduleId of LISA_REQUIRED_MODULES) {
    assert(
      `08.module.${moduleId}`,
      modules.some((generated) => moduleIdsInclude([generated], moduleId)),
      modules.join(', '),
    );
  }

  const banned = BANNED_FALLBACK_MODULES.filter((name) => modules.includes(name));
  assert('09. no banned fallback modules', banned.length === 0, banned.join(', '));
  assert(
    '10. no projects module',
    !modules.includes('projects'),
    modules.join(', '),
  );
  assert('11. no tasks module', !modules.includes('tasks'), modules.join(', '));
  assert('12. no team module', !modules.includes('team'), modules.join(', '));
  assert('13. no timeline module', !modules.includes('timeline'), modules.join(', '));

  const routerPath = join(workspaceDir, 'src/features/FeatureAppRouter.tsx');
  if (existsSync(routerPath)) {
    const router = readFileSync(routerPath, 'utf8').toLowerCase();
    assert('14. preview communication board', router.includes('communication'), 'router');
    assert('15. preview blink/gaze/speech', router.includes('blink') && router.includes('gaze') && router.includes('speech'), 'router');
    assert('16. preview emergency', router.includes('emergency'), 'router');
  } else {
    assert('14. router exists', false, 'missing FeatureAppRouter.tsx');
  }

  assert(
    '17. manifest androidPhonePreviewRequired',
    manifest.androidPhonePreviewRequired === true,
    String(manifest.androidPhonePreviewRequired),
  );
  assert(
    '18. manifest promptFaithfulness PASS',
    manifest.promptFaithfulnessStatus === 'PASS',
    String(manifest.promptFaithfulnessStatus),
  );

  const traceEvents = buildOnePromptExecutionTraceEvents(build, build.prompt);
  const traceTitles = traceEvents.map((event) => event.eventTitle);
  const requiredTrace = [
    'Prompt faithfulness analysis started',
    'Prompt-derived modules extracted',
    'Custom feature contract built',
    'Prompt-faithful modules generated',
    'Prompt faithfulness verdict issued',
  ];
  for (const title of requiredTrace) {
    assert(`19.trace.${title}`, traceTitles.some((entry) => entry.includes(title)), traceTitles.join(' | '));
  }
  assert(
    '20. trace weak fallback rejected or guard evidence',
    traceTitles.some((entry) => entry.includes('Weak fallback profile rejected')) ||
      build.generatedProfile === 'GENERIC_CUSTOM_APP_V1',
    traceTitles.join(' | '),
  );

  const failed = results.filter((entry) => !entry.passed);
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}: ${check.detail}`);
  }
  console.log('');
  if (failed.length) {
    console.error(`FAILED ${failed.length}/${results.length}`);
    process.exit(1);
  }
  console.log(LIVE_PROMPT_FAITHFUL_BUILD_PATH_PASS_TOKEN);
}

void main();
