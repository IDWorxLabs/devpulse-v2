/**
 * Virtual Device Laboratory Era 3 Phase 7 — shared validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectFounderLaunchEvidence } from '../../src/autonomous-founder-launch-authority/founder-evidence-collector.js';
import { runBehaviorSimulationPipeline } from '../../src/behavior-simulation-engine/index.js';
import { runCapabilityPlanningPipeline } from '../../src/capability-planning-engine/index.js';
import { runIncrementalBuildPipeline } from '../../src/incremental-autonomous-builder/index.js';
import { runIntentUnderstandingEngine } from '../../src/intent-understanding-engine/index.js';
import { runPromptFaithfulnessEngineV2 } from '../../src/prompt-faithfulness-engine-v2/index.js';
import { resolvePromptFaithfulBuildPlan } from '../../src/prompt-faithful-generation/index.js';
import { runVirtualUserPipeline } from '../../src/virtual-user-engine/index.js';
import {
  buildLaunchVirtualDeviceEvidence,
  discoverDeviceProfiles,
  evaluateLivePreviewVirtualDeviceGate,
  getDevPulseV2VirtualDeviceLaboratory,
  isVirtualDeviceLaboratoryReadyForPreview,
  resetVirtualDeviceLaboratoryModuleForTests,
  runVirtualDevicePipeline,
  simulateVirtualDeviceImpactForFeatureSlice,
} from '../../src/virtual-device-laboratory/index.js';
import { buildDeviceMatrix } from '../../src/virtual-device-laboratory/device-matrix-builder.js';
import { planEnvironmentLaunches } from '../../src/virtual-device-laboratory/environment-launch-planner.js';
import { validateDeviceTheme } from '../../src/virtual-device-laboratory/device-accessibility-scaling.js';
import { classifyDeviceFailure } from '../../src/virtual-device-laboratory/device-failure-classifier.js';
import { recommendDeviceRepair } from '../../src/virtual-device-laboratory/device-repair-recommender.js';
import { EXPENSE_PROMPT, LISA_PROMPT } from './prompt-faithfulness-v2-validation.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/virtual-device-laboratory');

export const EXPENSE_RESPONSIVE_PROMPT =
  'Build a business expense tracker with create expense workflow, edit, delete, export, and reporting.';

export const REQUIRED_FILES = [
  'virtual-device-types.ts',
  'virtual-device-registry.ts',
  'device-profile-discovery.ts',
  'device-matrix-builder.ts',
  'environment-launch-planner.ts',
  'device-render-validator.ts',
  'responsive-layout-validator.ts',
  'device-navigation-validator.ts',
  'device-interaction-reachability.ts',
  'device-accessibility-scaling.ts',
  'device-performance-sampler.ts',
  'device-failure-classifier.ts',
  'device-repair-recommender.ts',
  'virtual-device-authority.ts',
  'virtual-device-report-builder.ts',
  'virtual-device-history.ts',
  'virtual-device-readiness.ts',
  'virtual-device-live-preview-gate.ts',
  'index.ts',
];

export interface ValidationCheck {
  section: string;
  name: string;
  passed: boolean;
  detail: string;
}

function eraInput(rawPrompt: string) {
  const intent = runIntentUnderstandingEngine({ rawPrompt });
  const faithfulness = runPromptFaithfulnessEngineV2(rawPrompt, {
    generatedModules: intent.productIntelligenceModel.architecture.moduleIds,
  });
  const capabilityPlanning = runCapabilityPlanningPipeline({
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    promptFaithfulnessBlocked: !faithfulness.readyForGeneration,
  });
  const incrementalBuild = runIncrementalBuildPipeline({
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
  });
  const behaviorSimulation = runBehaviorSimulationPipeline({
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
    incrementalBuild,
  });
  const virtualUserSimulation = runVirtualUserPipeline({
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
    incrementalBuild,
    behaviorSimulation,
  });
  return {
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
  };
}

export function runVirtualDeviceValidation(sections?: string[]): {
  checks: ValidationCheck[];
  allPassed: boolean;
} {
  const checks: ValidationCheck[] = [];
  const want = sections ? new Set(sections) : null;
  const include = (section: string): boolean => !want || want.has(section) || want.has('all');

  const assert = (section: string, name: string, condition: boolean, detail: string): void => {
    if (!include(section)) return;
    checks.push({ section, name, passed: condition, detail });
  };

  resetVirtualDeviceLaboratoryModuleForTests();

  if (include('virtual-device-laboratory') || include('all')) {
    for (const file of REQUIRED_FILES) {
      assert('virtual-device-laboratory', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
    }
    const authority = getDevPulseV2VirtualDeviceLaboratory();
    assert(
      'virtual-device-laboratory',
      'pass token',
      authority.passToken === 'VIRTUAL_DEVICE_LABORATORY_V1_PASS',
      authority.passToken,
    );
    assert('virtual-device-laboratory', 'phase 7', authority.phase === 7, String(authority.phase));
  }

  if (include('device-profile-discovery') || include('all')) {
    const lisa = discoverDeviceProfiles({ rawPrompt: LISA_PROMPT });
    assert(
      'device-profile-discovery',
      'LISA phone portrait',
      lisa.some((p) => p.deviceType === 'PHONE' && p.orientation === 'PORTRAIT'),
      String(lisa.length),
    );
    assert(
      'device-profile-discovery',
      'high accessibility scaling',
      lisa.some((p) => p.accessibilityScaling >= 1.5),
      'scaling',
    );
    const expense = discoverDeviceProfiles({ rawPrompt: EXPENSE_PROMPT });
    assert(
      'device-profile-discovery',
      'expense multi-device',
      expense.some((p) => p.deviceType === 'DESKTOP') && expense.some((p) => p.deviceType === 'PHONE'),
      String(expense.length),
    );
  }

  if (include('device-matrix-builder') || include('all')) {
    const profiles = discoverDeviceProfiles({ rawPrompt: EXPENSE_PROMPT });
    const matrix = buildDeviceMatrix({ profiles });
    assert('device-matrix-builder', 'bounded matrix', matrix.length <= 12 && matrix.length > 0, String(matrix.length));
    assert('device-matrix-builder', 'light and dark', matrix.some((m) => /LIGHT/i.test(m.reasonIncluded)) && matrix.some((m) => /DARK/i.test(m.reasonIncluded)), 'themes');
  }

  if (include('environment-launch-planning') || include('all')) {
    const profiles = discoverDeviceProfiles({ rawPrompt: LISA_PROMPT });
    const matrix = buildDeviceMatrix({ profiles });
    const plans = planEnvironmentLaunches({ profiles, matrix });
    assert('environment-launch-planning', 'launch plans', plans.length === matrix.length, String(plans.length));
    assert('environment-launch-planning', 'viewport set', plans.every((p) => p.viewport.width > 0), 'viewport');
  }

  if (include('device-render-validation') || include('all')) {
    const pipeline = runVirtualDevicePipeline(eraInput(LISA_PROMPT));
    assert('device-render-validation', 'profiles executed', pipeline.profileResults.length > 0, String(pipeline.profileResults.length));
    assert(
      'device-render-validation',
      'render checks',
      pipeline.profileResults.every((r) => r.renderChecks.some((c) => c.check === 'APP_LOADS' && c.passed)),
      'render',
    );
  }

  if (include('responsive-layout-validation') || include('all')) {
    const pipeline = runVirtualDevicePipeline(eraInput(EXPENSE_RESPONSIVE_PROMPT));
    assert(
      'responsive-layout-validation',
      'responsive checks',
      pipeline.profileResults.some((r) => r.responsiveChecks.some((c) => c.check === 'NO_HORIZONTAL_OVERFLOW' && c.passed)),
      'responsive',
    );
  }

  if (include('device-navigation-validation') || include('all')) {
    const pipeline = runVirtualDevicePipeline(eraInput(EXPENSE_PROMPT));
    assert(
      'device-navigation-validation',
      'navigation checks',
      pipeline.profileResults.some((r) => r.navigationChecks.some((c) => /NAV|ROUTE/i.test(c.check) && c.passed)),
      'navigation',
    );
  }

  if (include('device-interaction-reachability') || include('all')) {
    const pipeline = runVirtualDevicePipeline(eraInput(LISA_PROMPT));
    assert(
      'device-interaction-reachability',
      'emergency reachable',
      pipeline.profileResults.some((r) =>
        r.reachabilityChecks.some((c) => /Emergency/i.test(c.check) && c.passed),
      ),
      'emergency',
    );
    const clipped = runVirtualDevicePipeline({ ...eraInput(EXPENSE_RESPONSIVE_PROMPT), simulateClippedButton: true });
    const clipFail = clipped.profileResults.find((r) => !r.passed);
    assert(
      'device-interaction-reachability',
      'clipped button fails reachability',
      Boolean(clipFail?.failure?.category === 'CLIPPED_CONTROL' || clipFail?.failure?.category === 'UNREACHABLE_ACTION' || clipFail?.failure?.category === 'LAYOUT_OVERFLOW'),
      clipFail?.failure?.category ?? 'none',
    );
  }

  if (include('device-accessibility-scaling') || include('all')) {
    const pipeline = runVirtualDevicePipeline(eraInput(LISA_PROMPT));
    const highScale = pipeline.profileResults.find((r) =>
      r.accessibilityChecks.some((c) => /TOUCH_TARGETS|EMERGENCY/i.test(c.check)),
    );
    assert('device-accessibility-scaling', 'accessibility checks', Boolean(highScale), 'a11y');
  }

  if (include('device-theme-validation') || include('all')) {
    const pipeline = runVirtualDevicePipeline(eraInput(EXPENSE_PROMPT));
    assert(
      'device-theme-validation',
      'theme checks pass',
      pipeline.profileResults.some((r) => r.themeChecks.every((c) => c.passed)),
      'theme',
    );
    const profiles = discoverDeviceProfiles({ rawPrompt: EXPENSE_PROMPT });
    const dark = profiles.find((p) => p.themeMode === 'DARK')!;
    const themeFail = validateDeviceTheme({ profile: dark, simulateThemeContrastFailure: true });
    assert('device-theme-validation', 'contrast failure detected', themeFail.some((c) => !c.passed), 'contrast');
  }

  if (include('device-performance-sampling') || include('all')) {
    const slow = runVirtualDevicePipeline({ ...eraInput(EXPENSE_PROMPT), simulateSlowLowEndRender: true });
    const lowEnd = slow.profileResults.find((r) => r.performance.status === 'WARN' || r.performance.status === 'FAIL');
    assert(
      'device-performance-sampling',
      'low-end warning or fail',
      Boolean(lowEnd),
      lowEnd?.performance.status ?? 'none',
    );
  }

  if (include('device-failure-classification') || include('all')) {
    const clipped = runVirtualDevicePipeline({ ...eraInput(EXPENSE_RESPONSIVE_PROMPT), simulateClippedButton: true });
    const fail = clipped.profileResults.find((r) => r.failure);
    assert('device-failure-classification', 'classified', Boolean(fail?.failure?.category), fail?.failure?.category ?? 'none');
    if (fail?.failure) {
      const classified = classifyDeviceFailure({
        profileId: fail.profileId,
        checks: [...fail.reachabilityChecks, ...fail.responsiveChecks],
        performance: fail.performance,
        passed: false,
      });
      assert('device-failure-classification', 'category set', Boolean(classified?.category), classified?.category ?? 'none');
    }
  }

  if (include('device-repair-recommendation') || include('all')) {
    const clipped = runVirtualDevicePipeline({ ...eraInput(EXPENSE_RESPONSIVE_PROMPT), simulateClippedButton: true });
    assert(
      'device-repair-recommendation',
      'repair produced',
      clipped.profileResults.some((r) => r.repairRecommendation !== null),
      'repair',
    );
    const fail = clipped.profileResults.find((r) => r.failure);
    if (fail?.failure) {
      const repair = recommendDeviceRepair(fail.failure);
      assert(
        'device-repair-recommendation',
        'validation required',
        repair.validationRequiredAfterRepair.includes('VIRTUAL_DEVICE_LABORATORY'),
        repair.validationRequiredAfterRepair.join(','),
      );
    }
  }

  if (include('virtual-device-incremental-integration') || include('all')) {
    const stabilization = readFileSync(join(ROOT, 'src/incremental-autonomous-builder/feature-stabilization-gate.ts'), 'utf8');
    assert('virtual-device-incremental-integration', 'stabilization wired', stabilization.includes('virtualDevicePassed'), 'wired');
    const incr = readFileSync(join(ROOT, 'src/incremental-autonomous-builder/incremental-build-orchestrator.ts'), 'utf8');
    assert('virtual-device-incremental-integration', 'orchestrator wired', incr.includes('simulateVirtualDeviceImpactForFeatureSlice'), 'orchestrator');
    const input = eraInput(EXPENSE_PROMPT);
    const sliceId = input.incrementalBuild.buildPlan.featureSlices[0]?.sliceId ?? 'slice-1';
    const impact = simulateVirtualDeviceImpactForFeatureSlice({
      sliceId,
      sliceName: 'layout-shell',
      pipelineInput: input,
    });
    assert('virtual-device-incremental-integration', 'slice impact', typeof impact.passed === 'boolean', String(impact.passed));
  }

  if (include('virtual-device-launch-integration') || include('all')) {
    const buildPlan = resolvePromptFaithfulBuildPlan(EXPENSE_PROMPT);
    assert('virtual-device-launch-integration', 'seventh gate', buildPlan.virtualDeviceLaboratory.ready, buildPlan.virtualDeviceLaboratory.blockedReason ?? 'ready');
    const founder = collectFounderLaunchEvidence({ productPrompt: EXPENSE_PROMPT });
    assert('virtual-device-launch-integration', 'AFLA source', founder.virtualDeviceLaboratory?.available === true, founder.virtualDeviceLaboratory?.sourceName ?? 'missing');
    const pipeline = runVirtualDevicePipeline(eraInput(EXPENSE_PROMPT));
    const evidence = buildLaunchVirtualDeviceEvidence(pipeline);
    assert('virtual-device-launch-integration', 'launch evidence', evidence.requiredProfileCount >= 4, String(evidence.requiredProfileCount));
    const verdict = readFileSync(join(ROOT, 'src/autonomous-founder-launch-authority/founder-verdict-engine.ts'), 'utf8');
    assert('virtual-device-launch-integration', 'verdict blocks', verdict.includes('Virtual Device Laboratory incomplete'), 'verdict');
  }

  if (include('virtual-device-live-preview-gate') || include('all')) {
    const passPipeline = runVirtualDevicePipeline(eraInput(EXPENSE_PROMPT));
    const gate = evaluateLivePreviewVirtualDeviceGate(passPipeline);
    assert('virtual-device-live-preview-gate', 'unlocked on pass', gate.unlocked, String(gate.unlocked));
    assert('virtual-device-live-preview-gate', 'ready for preview', isVirtualDeviceLaboratoryReadyForPreview(passPipeline), 'ready');
    const failPipeline = runVirtualDevicePipeline({ ...eraInput(EXPENSE_RESPONSIVE_PROMPT), simulateClippedButton: true });
    const failGate = evaluateLivePreviewVirtualDeviceGate(failPipeline);
    assert('virtual-device-live-preview-gate', 'blocked on fail', !failGate.unlocked, failGate.blockedReason ?? 'blocked');
    assert('virtual-device-live-preview-gate', 'failure category', Boolean(failGate.failureCategory), failGate.failureCategory ?? 'none');
    const orchestrator = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
    assert('virtual-device-live-preview-gate', 'orchestrator gate', orchestrator.includes('evaluateLivePreviewVirtualDeviceGate'), 'orchestrator');
  }

  if (include('all')) {
    const lisaPipeline = runVirtualDevicePipeline(eraInput(LISA_PROMPT));
    const a11yProfile = lisaPipeline.profileResults.find((r) =>
      lisaPipeline.profiles.find(
        (p) =>
          p.deviceId === lisaPipeline.matrix.find((m) => m.profileId === r.profileId)?.deviceId &&
          p.accessibilityScaling >= 1.5,
      ),
    );
    assert(
      'virtual-device-laboratory',
      'scenario LISA mobile accessibility',
      Boolean(a11yProfile?.passed),
      a11yProfile?.passed ? 'pass' : 'fail',
    );

    const expensePipeline = runVirtualDevicePipeline(eraInput(EXPENSE_RESPONSIVE_PROMPT));
    assert(
      'virtual-device-laboratory',
      'scenario expense responsive',
      expensePipeline.permissionVerdict === 'READY_FOR_PREVIEW',
      expensePipeline.permissionVerdict,
    );

    const themePipeline = runVirtualDevicePipeline(eraInput(EXPENSE_PROMPT));
    assert(
      'virtual-device-laboratory',
      'scenario dark/light modes',
      themePipeline.matrix.some((m) => /DARK/i.test(m.reasonIncluded)) && themePipeline.matrix.some((m) => /LIGHT/i.test(m.reasonIncluded)),
      'themes',
    );

    const clipped = runVirtualDevicePipeline({ ...eraInput(EXPENSE_RESPONSIVE_PROMPT), simulateClippedButton: true });
    assert(
      'virtual-device-laboratory',
      'scenario clipped button',
      clipped.permissionVerdict === 'BLOCKED',
      clipped.permissionVerdict,
    );

    const firstSweep = runVirtualDevicePipeline(eraInput(EXPENSE_PROMPT));
    const resumeDeviceId = firstSweep.profileResults[1]?.deviceId ?? firstSweep.profileResults[0]?.deviceId ?? null;
    const resumed = runVirtualDevicePipeline({ ...eraInput(EXPENSE_PROMPT), resumeFromProfileId: resumeDeviceId });
    assert(
      'virtual-device-laboratory',
      'scenario resume sweep',
      resumed.wholeAppSweep.resumedFromProfileId === resumeDeviceId &&
        resumed.profileResults.some((r) => r.renderChecks.some((c) => c.check === 'RESUMED')),
      resumed.wholeAppSweep.resumedFromProfileId ?? 'none',
    );
  }

  return { checks, allPassed: checks.every((c) => c.passed) };
}

export function printVirtualDeviceValidationResults(checks: ValidationCheck[], title: string): void {
  const passed = checks.filter((c) => c.passed);
  const failed = checks.filter((c) => !c.passed);
  console.log('');
  console.log(title);
  console.log('='.repeat(title.length));
  console.log(`Passed: ${passed.length}/${checks.length}`);
  if (failed.length) {
    console.log('');
    console.log('FAILED:');
    for (const f of failed) {
      console.log(`  [${f.section}] ${f.name}: ${f.detail}`);
    }
    process.exit(1);
  }
  console.log('\nVIRTUAL_DEVICE_LABORATORY_V1_PASS');
}
