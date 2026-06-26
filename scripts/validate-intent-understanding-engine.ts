/**
 * Phase 1 — Intent Understanding Engine V1 validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  INTENT_UNDERSTANDING_ENGINE_OWNER_MODULE,
  INTENT_UNDERSTANDING_ENGINE_PASS_TOKEN,
  assertGenerationUsesProductIntelligenceModel,
  buildIntentUnderstandingTraceEvents,
  getActiveProductIntelligenceModel,
  getDevPulseV2IntentUnderstandingEngine,
  getIntentHistorySize,
  registerIntentUnderstandingWithAiDevEngine,
  registerIntentUnderstandingWithArchitecturePlanning,
  registerIntentUnderstandingWithAutoFix,
  registerIntentUnderstandingWithBlueprintGeneration,
  registerIntentUnderstandingWithCapabilityPlanning,
  registerIntentUnderstandingWithExecutionTrace,
  registerIntentUnderstandingWithFeatureContracts,
  registerIntentUnderstandingWithFounderTest,
  registerIntentUnderstandingWithLaunchAuthority,
  registerIntentUnderstandingWithMaterializationQuality,
  registerIntentUnderstandingWithPromptFaithfulness,
  registerIntentUnderstandingWithRequirementsToPlan,
  registerIntentUnderstandingWithUniversalProductionProof,
  registerIntentUnderstandingWithUniversalPromptToApp,
  registerIntentUnderstandingWithUvl,
  registerIntentUnderstandingWithWorkspaceReality,
  resetIntentUnderstandingEngineModuleForTests,
  runIntentUnderstandingEngine,
} from '../src/intent-understanding-engine/index.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { buildOnePromptExecutionTraceEvents } from '../src/execution-trace/build-execution-trace-events.js';
import type { OnePromptLivePreviewBuildResult } from '../src/one-prompt-live-preview/one-prompt-live-preview-types.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/intent-understanding-engine');

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

Accessibility-first design with high contrast, large touch targets, gaze-friendly UI, and medical assistive accessibility.

Do not use generic project management fallback.`;

const EXPENSE_PROMPT =
  'Build ExpenseTracker with income, expenses, balance, categories, reports, charts, CSV export, and finance tracking.';

const REQUIRED_FILES = [
  'intent-understanding-types.ts',
  'intent-understanding-engine.ts',
  'product-model-builder.ts',
  'user-persona-extractor.ts',
  'workflow-extractor.ts',
  'interaction-model-builder.ts',
  'platform-understanding.ts',
  'navigation-understanding.ts',
  'accessibility-understanding.ts',
  'behavior-understanding.ts',
  'domain-understanding.ts',
  'requirement-understanding.ts',
  'intent-confidence.ts',
  'intent-report-builder.ts',
  'intent-history.ts',
  'intent-trace-events.ts',
  'index.ts',
];

const TRACE_EVENT_TITLES = [
  'Intent Understanding Started',
  'Domain Understood',
  'Users Identified',
  'Workflows Built',
  'Interactions Identified',
  'Accessibility Requirements Extracted',
  'Behavior Model Completed',
  'Product Intelligence Model Built',
  'Intent Confidence Calculated',
  'Intent Understanding Complete',
];

interface Check {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(group: string, name: string, condition: boolean, detail: string): void {
  results.push({ group, name, passed: condition, detail });
}

function failAndExit(): never {
  console.log('');
  console.log('INTENT UNDERSTANDING ENGINE VALIDATION — FAILED');
  for (const r of results.filter((x) => !x.passed)) {
    console.log(`  FAIL [${r.group}] ${r.name}: ${r.detail}`);
  }
  process.exit(1);
}

function main(): void {
  console.log('');
  console.log('Intent Understanding Engine V1 — Validation');
  console.log('=========================================');
  console.log('');

  resetIntentUnderstandingEngineModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert('A-FILES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }

  const authority = getDevPulseV2IntentUnderstandingEngine();
  assert(
    'B-AUTHORITY',
    'pass token',
    authority.passToken === INTENT_UNDERSTANDING_ENGINE_PASS_TOKEN,
    authority.passToken,
  );
  assert(
    'B-AUTHORITY',
    'owner module',
    authority.ownerModule === INTENT_UNDERSTANDING_ENGINE_OWNER_MODULE,
    authority.ownerModule,
  );
  assert(
    'B-AUTHORITY',
    'understanding before generation',
    authority.understandingBeforeGeneration === true,
    String(authority.understandingBeforeGeneration),
  );

  const owner = getDevPulseV2Owner('intent_understanding_engine');
  assert(
    'B-AUTHORITY',
    'ownership registry',
    owner.ownerModule === INTENT_UNDERSTANDING_ENGINE_OWNER_MODULE,
    owner.ownerModule,
  );

  const lisaResult = runIntentUnderstandingEngine({ rawPrompt: LISA_PROMPT });
  const pim = lisaResult.productIntelligenceModel;

  assert('C-LISA', 'product identity extracted', pim.product.productName.length > 0, pim.product.productName);
  assert(
    'C-LISA',
    'assistive product type',
    pim.product.productType === 'ASSISTIVE_COMMUNICATION',
    pim.product.productType,
  );
  assert('C-LISA', 'user personas extracted', pim.users.length >= 2, String(pim.users.length));
  assert('C-LISA', 'primary user identified', pim.users.some((u) => u.isPrimary), 'primary persona');
  assert('C-LISA', 'workflows generated', pim.workflows.length >= 1, String(pim.workflows.length));
  assert('C-LISA', 'workflow steps', (pim.workflows[0]?.steps.length ?? 0) >= 4, String(pim.workflows[0]?.steps.length));
  assert('C-LISA', 'navigation understood', pim.navigation.patterns.length >= 1, pim.navigation.primaryPattern);
  assert(
    'C-LISA',
    'accessibility captured',
    pim.accessibility.mandatoryConstraints.length >= 3,
    String(pim.accessibility.mandatoryConstraints.length),
  );
  assert('C-LISA', 'platform understood', pim.platform.targets.length >= 1, pim.platform.primaryTarget);
  assert('C-LISA', 'behavior model created', pim.behavior.behaviors.length >= 3, String(pim.behavior.behaviors.length));
  assert('C-LISA', 'confidence calculated', pim.confidence.overallConfidence > 0.8, String(pim.confidence.overallConfidence));
  assert('C-LISA', 'ready for generation', lisaResult.readyForGeneration, lisaResult.blockedReason ?? 'ready');
  assert('C-LISA', 'PIM produced', Boolean(pim.modelId), pim.modelId);

  const traceEvents = buildIntentUnderstandingTraceEvents(pim);
  for (const title of TRACE_EVENT_TITLES) {
    assert(
      'D-TRACE',
      `trace: ${title}`,
      traceEvents.some((e) => e.eventTitle === title),
      title,
    );
  }

  const expenseResult = runIntentUnderstandingEngine({ rawPrompt: EXPENSE_PROMPT });
  assert(
    'E-EXPENSE',
    'expense tracker type',
    expenseResult.productIntelligenceModel.product.productType === 'EXPENSE_TRACKER',
    expenseResult.productIntelligenceModel.product.productType,
  );
  assert('E-EXPENSE', 'expense ready', expenseResult.readyForGeneration, expenseResult.blockedReason ?? 'ready');

  resetIntentUnderstandingEngineModuleForTests();
  const buildPlan = resolvePromptFaithfulBuildPlan(LISA_PROMPT);
  assert(
    'F-INTEGRATION',
    'build plan includes PIM',
    Boolean(buildPlan.productIntelligenceModel?.modelId),
    buildPlan.productIntelligenceModel?.modelId ?? 'missing',
  );
  assert(
    'F-INTEGRATION',
    'build plan ready flag',
    buildPlan.readyForGeneration === true,
    String(buildPlan.readyForGeneration),
  );
  assert(
    'F-INTEGRATION',
    'active PIM stored',
    assertGenerationUsesProductIntelligenceModel(),
    'active model set',
  );
  assert(
    'F-INTEGRATION',
    'PIM modules drive definition',
    buildPlan.definition.featureModules.length >= 10,
    buildPlan.definition.featureModules.join(', '),
  );

  const promptFaithfulSource = readFileSync(
    join(ROOT, 'src/prompt-faithful-generation/index.ts'),
    'utf8',
  );
  assert(
    'F-INTEGRATION',
    'resolvePromptFaithfulBuildPlan uses intent engine',
    promptFaithfulSource.includes('runIntentUnderstandingEngine'),
    'import wired',
  );
  assert(
    'F-INTEGRATION',
    'no raw-prompt-only build plan return',
    promptFaithfulSource.includes('productIntelligenceModel'),
    'PIM on build plan',
  );

  const orchestratorSource = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  assert(
    'F-INTEGRATION',
    'orchestrator gates on readyForGeneration',
    orchestratorSource.includes('!buildPlan.readyForGeneration'),
    'generation gate',
  );
  assert(
    'F-INTEGRATION',
    'orchestrator INTENT_UNDERSTANDING failure stage',
    orchestratorSource.includes('INTENT_UNDERSTANDING'),
    'failure stage',
  );

  const traceSource = readFileSync(join(ROOT, 'src/execution-trace/build-execution-trace-events.ts'), 'utf8');
  assert(
    'F-INTEGRATION',
    'execution trace imports intent engine',
    traceSource.includes('buildIntentUnderstandingTraceEvents'),
    'trace wired',
  );

  const mockResult: OnePromptLivePreviewBuildResult = {
    readOnly: true,
    buildId: 'intent-validate-build',
    projectId: 'intent-validate-project',
    projectName: 'Intent Validate',
    status: 'READY',
    prompt: LISA_PROMPT,
    requestType: 'BUILD_FROM_PROMPT',
    workspaceId: 'intent-validate-project',
    workspacePath: '.generated-builder-workspaces/intent-validate-project',
    generatedProfile: 'GENERIC_CUSTOM_APP_V1',
    planningProofLevel: 'PROVEN',
    materializationProofLevel: 'PROVEN',
    buildResult: 'PASS',
    npmInstallOk: true,
    npmBuildOk: true,
    previewUrl: 'http://localhost:5173',
    updatedAt: new Date().toISOString(),
    featureSignals: {
      addTask: false,
      markComplete: false,
      deleteTask: false,
      filter: false,
      activeCount: false,
      reactMount: true,
    },
  };
  const buildTrace = buildOnePromptExecutionTraceEvents(mockResult, LISA_PROMPT);
  assert(
    'F-INTEGRATION',
    'build trace emits intent events',
    buildTrace.some((e) => e.component === 'intent_understanding_engine'),
    'intent trace in build path',
  );

  assert('G-BRIDGES', 'aidev engine bridge', registerIntentUnderstandingWithAiDevEngine().readOnly === true, 'ok');
  assert('G-BRIDGES', 'requirements bridge', registerIntentUnderstandingWithRequirementsToPlan().readOnly === true, 'ok');
  assert('G-BRIDGES', 'capability planning bridge', registerIntentUnderstandingWithCapabilityPlanning().readOnly === true, 'ok');
  assert('G-BRIDGES', 'prompt faithfulness bridge', registerIntentUnderstandingWithPromptFaithfulness().connected === true, 'ok');
  assert('G-BRIDGES', 'feature contracts bridge', registerIntentUnderstandingWithFeatureContracts().usesProductModel === true, 'ok');
  assert('G-BRIDGES', 'founder test bridge', registerIntentUnderstandingWithFounderTest().usesProductModel === true, 'ok');
  assert('G-BRIDGES', 'execution trace bridge', registerIntentUnderstandingWithExecutionTrace().traceEventTypes === 11, 'ok');
  assert('G-BRIDGES', 'launch authority bridge', registerIntentUnderstandingWithLaunchAuthority().usesProductModel === true, 'ok');
  assert('G-BRIDGES', 'universal production proof bridge', registerIntentUnderstandingWithUniversalProductionProof().usesProductModel === true, 'ok');
  assert('G-BRIDGES', 'materialization quality bridge', registerIntentUnderstandingWithMaterializationQuality().usesProductModel === true, 'ok');
  assert('G-BRIDGES', 'workspace reality bridge', registerIntentUnderstandingWithWorkspaceReality().usesProductModel === true, 'ok');
  assert('G-BRIDGES', 'uvl bridge', registerIntentUnderstandingWithUvl().passToken === INTENT_UNDERSTANDING_ENGINE_PASS_TOKEN, 'ok');
  assert('G-BRIDGES', 'autofix bridge', registerIntentUnderstandingWithAutoFix().usesProductModel === true, 'ok');
  assert('G-BRIDGES', 'blueprint bridge', registerIntentUnderstandingWithBlueprintGeneration().usesProductModel === true, 'ok');
  assert('G-BRIDGES', 'architecture bridge', registerIntentUnderstandingWithArchitecturePlanning().usesProductModel === true, 'ok');
  assert('G-BRIDGES', 'universal prompt bridge', registerIntentUnderstandingWithUniversalPromptToApp().usesProductModel === true, 'ok');

  assert('H-HISTORY', 'history recorded', getIntentHistorySize() >= 1, String(getIntentHistorySize()));
  assert('H-HISTORY', 'active model retrievable', getActiveProductIntelligenceModel() !== null, 'active');

  const failed = results.filter((r) => !r.passed);
  const passed = results.filter((r) => r.passed);

  console.log(`Passed: ${passed.length}/${results.length}`);
  for (const r of passed.slice(0, 8)) {
    console.log(`  PASS [${r.group}] ${r.name}`);
  }
  if (passed.length > 8) {
    console.log(`  ... and ${passed.length - 8} more`);
  }

  if (failed.length) {
    failAndExit();
  }

  console.log('');
  console.log(INTENT_UNDERSTANDING_ENGINE_PASS_TOKEN);
}

main();
