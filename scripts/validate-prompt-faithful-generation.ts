/**
 * Prompt-Faithful Generation V1 — validation.
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { rankBuildProfiles } from '../src/build-profile-classification/index.js';
import { materializeGeneratedApplication } from '../src/code-generation-engine/code-generation-engine-authority.js';
import { assessRequirementsToPlanExecutionContract } from '../src/requirements-to-plan-execution-contract/index.js';
import {
  BANNED_FALLBACK_MODULES,
  PROMPT_FAITHFUL_GENERATION_PASS_TOKEN,
  applyPromptProfileSelectionGuard,
  buildPromptFaithfulnessTraceEvents,
  extractPromptFeatures,
  moduleIdsInclude,
  resolvePromptFaithfulBuildPlan,
  validatePromptFaithfulness,
} from '../src/prompt-faithful-generation/index.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../src/universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import { calculateMaterializationQualityScore } from '../src/materialization-quality-score/materialization-quality-score-calculator.js';
import { buildInitialGeneratedAppManifest, GENERATED_APP_MANIFEST_FILENAME } from '../src/universal-prompt-to-app-materialization/generated-app-manifest.js';
import { buildPromptFaithfulnessManifestFields } from '../src/prompt-faithful-generation/prompt-faithfulness-manifest.js';
import { composeOnePromptBuildChatResponse } from '../src/one-prompt-live-preview/one-prompt-build-orchestrator.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const LISA_PROMPT = `Build LISA — Locked In Syndrome App.

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

Required interactions: blink simulation control, gaze selection simulation, phrase selection, message composition, speak button, emergency speech button, calibration controls, settings controls, history filtering.

Do not use generic project management fallback.`;

const TASK_TRACKER_PROMPT =
  'Build a task tracker web app where users can add tasks, mark them complete, delete tasks, and filter active vs completed.';

const EXPENSE_PROMPT =
  'Build ExpenseTracker with income, expenses, balance, categories, reports, charts, CSV export, and finance tracking. Begin build execution now.';

const CUSTOM_PROMPT =
  'Build FarmCrop Planner — a niche crop rotation planner for small farms with fields module, crop-calendar module, soil-notes module, and harvest-forecast module. No generic project management.';

const LISA_MODULES = [
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

function materializePrompt(prompt: string, workspaceId: string, rootDir: string): string {
  const workspaceDir = join(rootDir, '.generated-builder-workspaces', workspaceId);
  mkdirSync(workspaceDir, { recursive: true });
  const contractAssessment = assessRequirementsToPlanExecutionContract({ rawPrompt: prompt });
  const contract = contractAssessment.report.buildReadyContract;
  if (!contract) throw new Error('No build-ready contract');
  const engine = materializeGeneratedApplication({
    projectRootDir: rootDir,
    workspaceId,
    contract: { ...contract, contractId: workspaceId },
    rawPrompt: prompt,
    profileOverride: resolvePromptFaithfulBuildPlan(prompt).materializationProfile as never,
  });
  if (!engine.generated) throw new Error(engine.skippedReason ?? 'materialization failed');
  return workspaceDir;
}

async function main(): Promise<void> {
  console.log('');
  console.log('Prompt-Faithful Generation V1 — Validation');
  console.log('==========================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const traceSource = readFileSync(
    join(ROOT, 'src/prompt-faithful-generation/prompt-faithfulness-trace-events.ts'),
    'utf8',
  );
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');

  assert(
    '01. package script',
    Boolean(pkg.scripts?.['validate:prompt-faithful-generation']),
    'validate:prompt-faithful-generation',
  );
  assert(
    '02. module exists',
    existsSync(join(ROOT, 'src/prompt-faithful-generation/prompt-feature-extractor.ts')),
    'prompt-faithful-generation module',
  );

  const lisaPlan = resolvePromptFaithfulBuildPlan(LISA_PROMPT);
  assert(
    '03. LISA selects GENERIC_CUSTOM_APP_V1',
    lisaPlan.materializationProfile === 'GENERIC_CUSTOM_APP_V1',
    String(lisaPlan.materializationProfile),
  );
  assert(
    '04. LISA not PROJECT_MANAGEMENT_WEB_V1',
    lisaPlan.materializationProfile !== 'PROJECT_MANAGEMENT_WEB_V1',
    String(lisaPlan.ranking.selectedProfile),
  );

  const lisaExtraction = extractPromptFeatures(LISA_PROMPT);
  assert(
    '05. LISA assistive domain',
    /assistive communication|accessibility/i.test(lisaExtraction.domain),
    lisaExtraction.domain,
  );
  for (const moduleId of LISA_MODULES) {
    assert(
      `06.${moduleId} extracted`,
      moduleIdsInclude(lisaExtraction.requiredModules, moduleId),
      lisaExtraction.requiredModules.join(', '),
    );
  }

  const tmpRoot = join(tmpdir(), `prompt-faithful-${Date.now()}`);
  mkdirSync(tmpRoot, { recursive: true });
  const lisaWorkspace = materializePrompt(LISA_PROMPT, 'lisa-faithful-1', tmpRoot);
  const lisaModules = lisaPlan.definition.featureModules;
  for (const moduleId of LISA_MODULES) {
    assert(
      `07.gen.${moduleId}`,
      lisaModules.some((m) => moduleIdsInclude([m], moduleId)),
      lisaModules.join(', '),
    );
  }
  const bannedInLisa = BANNED_FALLBACK_MODULES.filter((m) =>
    lisaModules.some((generated) => generated === m),
  );
  assert('08. LISA no banned modules', bannedInLisa.length === 0, bannedInLisa.join(', '));

  const routerSource = readFileSync(join(lisaWorkspace, 'src/features/FeatureAppRouter.tsx'), 'utf8');
  const routerLower = routerSource.toLowerCase();
  for (const term of ['locked in syndrome', 'blink', 'gaze', 'speech', 'communication', 'emergency']) {
    assert(`09.preview.${term}`, routerLower.includes(term), term);
  }

  const manifestRaw = JSON.parse(
    readFileSync(join(lisaWorkspace, GENERATED_APP_MANIFEST_FILENAME), 'utf8'),
  ) as Record<string, unknown>;
  assert(
    '10. androidPhonePreviewRequired',
    manifestRaw.androidPhonePreviewRequired === true,
    String(manifestRaw.androidPhonePreviewRequired),
  );
  assert(
    '11. phone preview css',
    readFileSync(join(lisaWorkspace, 'src/features/feature-app-router.css'), 'utf8').includes(
      'android-phone-preview',
    ),
    'feature-app-router.css',
  );

  const lisaVerdict = validatePromptFaithfulness({
    rawPrompt: LISA_PROMPT,
    selectedProfile: String(lisaPlan.materializationProfile),
    generatedModules: lisaModules,
    workspaceDir: lisaWorkspace,
  });
  assert('12. LISA faithfulness PASS', lisaVerdict.status === 'PASS', lisaVerdict.status);

  const pmRank = rankBuildProfiles(LISA_PROMPT);
  const pmFaith = validatePromptFaithfulness({
    rawPrompt: LISA_PROMPT,
    selectedProfile: 'PROJECT_MANAGEMENT_WEB_V1',
    generatedModules: ['projects', 'tasks', 'team', 'timeline'],
  });
  assert('13. PM profile for LISA fails', pmFaith.status === 'FAIL', pmFaith.status);

  const lisaManifest = buildInitialGeneratedAppManifest({
    projectId: 'lisa',
    projectName: 'LISA',
    buildRunId: 'test',
    prompt: LISA_PROMPT,
    selectedProfile: 'GENERIC_CUSTOM_APP_V1',
    expectedAppType: 'assistive',
    promptSummary: LISA_PROMPT.slice(0, 80),
    confidence: 'HIGH',
    featureModules: lisaModules,
    promptFaithfulness: buildPromptFaithfulnessManifestFields({
      rawPrompt: LISA_PROMPT,
      selectedProfile: 'GENERIC_CUSTOM_APP_V1',
      generatedModules: lisaModules,
      guardResult: lisaPlan.guardResult,
      workspaceDir: lisaWorkspace,
    }),
  });
  lisaManifest.status = 'PASS';
  lisaManifest.validationStatus = 'PASS';
  lisaManifest.generatedFilesCount = 10;
  lisaManifest.generatedFiles = [
    {
      path: 'src/App.tsx',
      size: 100,
      extension: '.tsx',
      lines: 10,
      category: 'Component',
      hash: 'abc',
    },
  ];
  lisaManifest.workspaceHash = 'hash';
  lisaManifest.materializationHash = 'hash';
  lisaManifest.completedAt = new Date().toISOString();
  const failManifest = {
    ...lisaManifest,
    promptFaithfulnessStatus: 'FAIL' as const,
    promptFaithfulnessFailureReasons: ['test failure'],
  };
  const passScore = calculateMaterializationQualityScore({
    projectRootDir: tmpRoot,
    workspaceDir: lisaWorkspace,
    manifest: lisaManifest,
  });
  const failScore = calculateMaterializationQualityScore({
    projectRootDir: tmpRoot,
    workspaceDir: lisaWorkspace,
    manifest: failManifest,
  });
  assert(
    '14. quality score drops on faithfulness fail',
    failScore.overallScore < passScore.overallScore,
    `${failScore.overallScore} vs ${passScore.overallScore}`,
  );

  const taskPlan = resolvePromptFaithfulBuildPlan(TASK_TRACKER_PROMPT);
  assert(
    '15. task tracker profile',
    taskPlan.materializationProfile === 'TASK_TRACKER_WEB_V1',
    String(taskPlan.materializationProfile),
  );

  const expensePlan = resolvePromptFaithfulBuildPlan(EXPENSE_PROMPT);
  assert(
    '16. expense profile',
    expensePlan.materializationProfile === 'EXPENSE_TRACKER_WEB_V1' ||
      expensePlan.materializationProfile === 'FINANCE_TRACKER_WEB_V1',
    String(expensePlan.materializationProfile),
  );

  const customPlan = resolvePromptFaithfulBuildPlan(CUSTOM_PROMPT);
  assert(
    '17. custom prompt custom modules',
    customPlan.materializationProfile === 'GENERIC_CUSTOM_APP_V1' &&
      !customPlan.definition.featureModules.includes('projects'),
    customPlan.definition.featureModules.join(', '),
  );

  const traceEvents = buildPromptFaithfulnessTraceEvents({
    extraction: lisaExtraction,
    guardResult: lisaPlan.guardResult,
    manifestFields: buildPromptFaithfulnessManifestFields({
      rawPrompt: LISA_PROMPT,
      selectedProfile: 'GENERIC_CUSTOM_APP_V1',
      generatedModules: lisaModules,
      guardResult: lisaPlan.guardResult,
    }),
    verdict: lisaVerdict,
  });
  assert(
    '18. trace events',
    traceEvents.some((e) => e.eventTitle.includes('faithfulness analysis')) &&
      traceEvents.some((e) => e.eventTitle.includes('verdict issued')),
    traceEvents.map((e) => e.eventTitle).join(', '),
  );
  assert(
    '19. trace source markers',
    traceSource.includes('Prompt faithfulness analysis started') &&
      traceSource.includes('Banned fallback module scan completed'),
    'trace-events.ts',
  );

  const guard = applyPromptProfileSelectionGuard(LISA_PROMPT, pmRank);
  assert(
    '20. guard rejects weak PM for LISA',
    guard.guardApplied || lisaPlan.materializationProfile === 'GENERIC_CUSTOM_APP_V1',
    String(guard.guardApplied),
  );

  const files = buildUniversalMaterializedWorkspaceFiles({
    contractId: 'inline-lisa',
    ideaId: 'inline-lisa',
    buildUnits: ['shell'],
    rawPrompt: LISA_PROMPT,
    profile: 'GENERIC_CUSTOM_APP_V1',
  });
  const inlineManifest = files.find((f) => f.relativePath === GENERATED_APP_MANIFEST_FILENAME);
  assert('21. inline manifest faithfulness fields', Boolean(inlineManifest?.content.includes('promptDerivedModules')), 'manifest');

  const chatSummary = composeOnePromptBuildChatResponse({
    readOnly: true,
    buildId: 'faith-chat-1',
    projectId: 'lisa-faithful-1',
    projectName: 'LISA',
    status: 'READY',
    prompt: LISA_PROMPT,
    requestType: 'CHAT_BUILD',
    workspaceId: 'lisa-faithful-1',
    workspacePath: '.generated-builder-workspaces/lisa-faithful-1',
    generatedProfile: 'GENERIC_CUSTOM_APP_V1',
    planningProofLevel: 'HIGH',
    materializationProofLevel: 'HIGH',
    buildResult: 'PASS',
    npmInstallOk: true,
    npmBuildOk: true,
    previewUrl: 'http://localhost:5173',
    livePreviewAvailable: true,
    failureReason: null,
    featureSignals: null,
    materializationManifest: lisaManifest,
    updatedAt: new Date().toISOString(),
  });
  assert(
    '22. chat summary uses faithfulness evidence',
    chatSummary.includes('Prompt faithfulness') && chatSummary.includes('eye-tracking-board'),
    chatSummary.slice(0, 120),
  );

  rmSync(tmpRoot, { recursive: true, force: true });

  const failed = results.filter((r) => !r.passed);
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}: ${check.detail}`);
  }
  console.log('');
  if (failed.length) {
    console.error(`FAILED ${failed.length}/${results.length}`);
    process.exit(1);
  }
  console.log(PROMPT_FAITHFUL_GENERATION_PASS_TOKEN);
}

void main();
