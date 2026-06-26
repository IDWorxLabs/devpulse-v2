/**
 * Custom Module Extraction Sanitization + Fallback Module Suppression V1 — validation.
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { materializeGeneratedApplication } from '../src/code-generation-engine/code-generation-engine-authority.js';
import { assessRequirementsToPlanExecutionContract } from '../src/requirements-to-plan-execution-contract/index.js';
import {
  BANNED_FALLBACK_MODULES,
  buildCustomProfileFeatureDefinition,
  buildPromptFaithfulnessTraceEvents,
  extractPromptFeatures,
  LISA_REQUIRED_MODULES,
  moduleIdsInclude,
  resolvePromptFaithfulBuildPlan,
  validatePromptFaithfulness,
  isRejectedNonModulePhrase,
} from '../src/prompt-faithful-generation/index.js';
import { buildPromptFaithfulnessManifestFields } from '../src/prompt-faithful-generation/prompt-faithfulness-manifest.js';
import { calculateMaterializationQualityScore } from '../src/materialization-quality-score/materialization-quality-score-calculator.js';
import { buildInitialGeneratedAppManifest, GENERATED_APP_MANIFEST_FILENAME } from '../src/universal-prompt-to-app-materialization/generated-app-manifest.js';
import { listWorkspaceFeatureModuleIds } from '../src/prompt-faithful-generation/prompt-faithful-materialization-gate.js';

export const CUSTOM_MODULE_EXTRACTION_SANITIZATION_PASS_TOKEN =
  'CUSTOM_MODULE_EXTRACTION_SANITIZATION_V1_PASS';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const LISA_SHORT_PROMPT = `Build LISA — Locked In Syndrome App.

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

const PROJECT_MANAGEMENT_PROMPT =
  'Build a project management web app with projects, tasks, team members, timeline view, and reports.';

const CUSTOM_FARM_PROMPT =
  'Build FarmCrop Planner — a niche crop rotation planner for small farms with fields module, crop-calendar module, soil-notes module, and harvest-forecast module. No generic project management.';

const REJECTED_ADJECTIVE_MODULES = [
  'mobile-first',
  'gaze-friendly',
  'medical-grade',
  'phone-sized',
  'accessibility-first',
];

const LISA_PRODUCT_MODULES = LISA_REQUIRED_MODULES;

function loadLongLisaPrompt(): string {
  const projectPath = join(ROOT, '.aidev-projects/lisa-1782390630682-1/project.json');
  if (existsSync(projectPath)) {
    const project = JSON.parse(readFileSync(projectPath, 'utf8')) as { originalPrompt?: string };
    if (project.originalPrompt) return project.originalPrompt;
  }
  return LISA_SHORT_PROMPT.replace(
    'Required modules:\n*',
    'Required modules:\n  onboarding-calibration\n  eye-tracking-board\n  blink-input-engine\n  gaze-keyboard\n  text-to-speech\n  quick-phrases\n  caregiver-dashboard\n  communication-history\n  accessibility-settings\n  emergency-speech\n\nCreate a history module. speech output module. its own module folder.\n\nRequired modules:\n*',
  );
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

function materializePrompt(prompt: string, workspaceId: string, rootDir: string): string {
  const workspaceDir = join(rootDir, '.generated-builder-workspaces', workspaceId);
  mkdirSync(workspaceDir, { recursive: true });
  const contractAssessment = assessRequirementsToPlanExecutionContract({ rawPrompt: prompt });
  const contract = contractAssessment.report.buildReadyContract;
  if (!contract) throw new Error('No build-ready contract');
  const buildPlan = resolvePromptFaithfulBuildPlan(prompt);
  const engine = materializeGeneratedApplication({
    projectRootDir: rootDir,
    workspaceId,
    contract: { ...contract, contractId: workspaceId },
    rawPrompt: prompt,
    profileOverride: buildPlan.materializationProfile as never,
    faithfulBuildPlan: buildPlan,
  });
  if (!engine.generated) throw new Error(engine.skippedReason ?? 'materialization failed');
  return workspaceDir;
}

async function main(): Promise<void> {
  console.log('');
  console.log('Custom Module Extraction Sanitization V1 — Validation');
  console.log('====================================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  assert(
    '01. package script',
    Boolean(pkg.scripts?.['validate:custom-module-extraction-sanitization']),
    'validate:custom-module-extraction-sanitization',
  );

  const longLisaPrompt = loadLongLisaPrompt();
  const lisaExtraction = extractPromptFeatures(longLisaPrompt);

  assert(
    '02. LISA returns exactly 10 product modules',
    lisaExtraction.requiredModules.length === 10 &&
      LISA_PRODUCT_MODULES.every((m) => moduleIdsInclude(lisaExtraction.requiredModules, m)),
    lisaExtraction.requiredModules.join(', '),
  );

  const expectedInteractions = [
    'blink simulation',
    'gaze selection',
    'phrase selection',
    'speak button',
    'emergency speech',
    'calibration control',
    'settings control',
    'history filter',
  ];
  for (const interaction of expectedInteractions) {
    assert(
      `03.interaction.${interaction.replace(/\s+/g, '-')}`,
      lisaExtraction.requiredInteractions.some((i) => i.includes(interaction)),
      lisaExtraction.requiredInteractions.join(', '),
    );
  }

  assert(
    '04. LISA design requirements recorded separately',
    lisaExtraction.designRequirements.some((r) => /mobile-first|high contrast|phone-sized|large/.test(r)),
    lisaExtraction.designRequirements.join(', '),
  );

  assert(
    '05. LISA platform requirements recorded separately',
    lisaExtraction.platformRequirements.some((r) => /android|mobile-first|phone-sized/.test(r)),
    lisaExtraction.platformRequirements.join(', '),
  );

  assert(
    '06. LISA safety note recorded separately',
    lisaExtraction.safetyNotes.some((n) => /not a certified medical device/i.test(n)),
    lisaExtraction.safetyNotes.join(' '),
  );

  const tmpRoot = join(tmpdir(), `custom-module-sanitize-${Date.now()}`);
  mkdirSync(tmpRoot, { recursive: true });
  const lisaWorkspace = materializePrompt(longLisaPrompt, 'lisa-sanitize-1', tmpRoot);
  const workspaceModules = listWorkspaceFeatureModuleIds(lisaWorkspace);

  const bannedInWorkspace = BANNED_FALLBACK_MODULES.filter((m) => workspaceModules.includes(m));
  assert('07. LISA workspace has no banned fallback modules', bannedInWorkspace.length === 0, bannedInWorkspace.join(', '));

  const adjectiveInWorkspace = workspaceModules.filter((m) => isRejectedNonModulePhrase(m));
  assert(
    '08. LISA workspace has no adjective modules',
    adjectiveInWorkspace.length === 0,
    adjectiveInWorkspace.join(', '),
  );

  for (const moduleId of LISA_PRODUCT_MODULES) {
    assert(
      `09.workspace.${moduleId}`,
      workspaceModules.some((m) => moduleIdsInclude([m], moduleId)),
      workspaceModules.join(', '),
    );
  }

  const lisaPlan = resolvePromptFaithfulBuildPlan(longLisaPrompt);
  const lisaVerdict = validatePromptFaithfulness({
    rawPrompt: longLisaPrompt,
    selectedProfile: String(lisaPlan.materializationProfile),
    generatedModules: workspaceModules,
    workspaceDir: lisaWorkspace,
    definition: lisaPlan.definition,
  });
  assert('10. LISA prompt faithfulness PASS', lisaVerdict.status === 'PASS', lisaVerdict.promptFaithfulnessFailureReasons.join('; ') || lisaVerdict.status);

  const manifestRaw = JSON.parse(
    readFileSync(join(lisaWorkspace, GENERATED_APP_MANIFEST_FILENAME), 'utf8'),
  ) as Record<string, unknown>;
  assert(
    '11. manifest promptDerivedModules equals sanitized modules',
    Array.isArray(manifestRaw.promptDerivedModules) &&
      (manifestRaw.promptDerivedModules as string[]).length === 10,
    String((manifestRaw.promptDerivedModules as string[] | undefined)?.join(', ')),
  );

  const traceEvents = buildPromptFaithfulnessTraceEvents({
    extraction: lisaExtraction,
    guardResult: lisaPlan.guardResult,
    manifestFields: buildPromptFaithfulnessManifestFields({
      rawPrompt: longLisaPrompt,
      selectedProfile: 'GENERIC_CUSTOM_APP_V1',
      generatedModules: workspaceModules,
      guardResult: lisaPlan.guardResult,
      workspaceDir: lisaWorkspace,
    }),
    verdict: lisaVerdict,
  });
  const sanitizedTrace = traceEvents.find((e) => e.eventTitle.includes('Sanitized prompt-derived modules'));
  assert(
    '12. trace shows sanitized module count not raw phrase count',
    Boolean(sanitizedTrace?.metadata?.sanitizedModuleCount === 10) &&
      (sanitizedTrace?.metadata?.rawCandidateCount as number) > 10,
    JSON.stringify(sanitizedTrace?.metadata ?? {}),
  );

  const farmExtraction = extractPromptFeatures(CUSTOM_FARM_PROMPT);
  const farmPlan = resolvePromptFaithfulBuildPlan(CUSTOM_FARM_PROMPT);
  assert(
    '13. generic custom prompt derives product surfaces',
    farmPlan.materializationProfile === 'GENERIC_CUSTOM_APP_V1' &&
      (farmExtraction.requiredModules.some((m) => /crop|field|harvest|soil/.test(m)) ||
        farmPlan.definition.featureModules.some((m) => /crop|field|harvest|soil/.test(m))),
    `${farmPlan.materializationProfile}: ${farmPlan.definition.featureModules.join(', ')}`,
  );

  const taskPlan = resolvePromptFaithfulBuildPlan(TASK_TRACKER_PROMPT);
  assert(
    '14. task tracker prompt still generates task modules',
    taskPlan.materializationProfile === 'TASK_TRACKER_WEB_V1' &&
      taskPlan.definition.featureModules.includes('tasks'),
    taskPlan.definition.featureModules.join(', '),
  );

  const pmPlan = resolvePromptFaithfulBuildPlan(PROJECT_MANAGEMENT_PROMPT);
  assert(
    '15. project management prompt still generates PM modules',
    pmPlan.materializationProfile === 'PROJECT_MANAGEMENT_WEB_V1' &&
      pmPlan.definition.featureModules.includes('projects'),
    pmPlan.definition.featureModules.join(', '),
  );

  const customDefinition = buildCustomProfileFeatureDefinition(lisaExtraction);
  const pmAppended = BANNED_FALLBACK_MODULES.filter((m) => customDefinition.featureModules.includes(m));
  assert(
    '16. GENERIC_CUSTOM_APP_V1 does not append PM fallbacks when custom modules exist',
    pmAppended.length === 0,
    pmAppended.join(', '),
  );

  const passManifest = buildInitialGeneratedAppManifest({
    projectId: 'lisa-sanitize',
    projectName: 'LISA',
    buildRunId: 'test',
    prompt: longLisaPrompt,
    selectedProfile: 'GENERIC_CUSTOM_APP_V1',
    expectedAppType: 'assistive',
    promptSummary: longLisaPrompt.slice(0, 80),
    confidence: 'HIGH',
    featureModules: workspaceModules,
    promptFaithfulness: buildPromptFaithfulnessManifestFields({
      rawPrompt: longLisaPrompt,
      selectedProfile: 'GENERIC_CUSTOM_APP_V1',
      generatedModules: workspaceModules,
      workspaceDir: lisaWorkspace,
    }),
  });
  passManifest.status = 'PASS';
  passManifest.validationStatus = 'PASS';
  passManifest.promptFaithfulnessStatus = 'PASS';
  passManifest.promptFaithfulnessScore = lisaVerdict.score;
  passManifest.generatedFilesCount = 10;
  passManifest.generatedFiles = [];
  passManifest.workspaceHash = 'hash';
  passManifest.materializationHash = 'hash';
  passManifest.completedAt = new Date().toISOString();
  const failManifest = {
    ...passManifest,
    promptFaithfulnessStatus: 'FAIL' as const,
    promptFaithfulnessScore: 0,
    bannedFallbackModulesDetected: ['projects'],
    promptFaithfulnessFailureReasons: ['Banned fallback modules present in workspace: projects'],
  };
  const passScore = calculateMaterializationQualityScore({
    projectRootDir: tmpRoot,
    workspaceDir: lisaWorkspace,
    manifest: passManifest,
  });
  const failScore = calculateMaterializationQualityScore({
    projectRootDir: tmpRoot,
    workspaceDir: lisaWorkspace,
    manifest: failManifest,
  });
  assert(
    '17. quality score not capped by banned fallback modules when clean',
    passScore.overallScore > failScore.overallScore,
    `${passScore.overallScore} vs ${failScore.overallScore}`,
  );

  assert(
    '18. raw extraction count exceeds sanitized for long LISA prompt',
    lisaExtraction.rawExtractedModuleCount > lisaExtraction.sanitizedModuleCount,
    `${lisaExtraction.rawExtractedModuleCount} raw vs ${lisaExtraction.sanitizedModuleCount} sanitized`,
  );

  for (const rejected of REJECTED_ADJECTIVE_MODULES) {
    assert(
      `19.rejected.${rejected}`,
      !lisaExtraction.requiredModules.includes(rejected) &&
        (lisaExtraction.rejectedNonModulePhrases.includes(rejected) || isRejectedNonModulePhrase(rejected)),
      lisaExtraction.requiredModules.join(', '),
    );
  }

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
  console.log(CUSTOM_MODULE_EXTRACTION_SANITIZATION_PASS_TOKEN);
}

void main();
