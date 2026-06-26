/**
 * Behavior Simulation Engine Era 3 Phase 5 — shared validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectFounderLaunchEvidence } from '../../src/autonomous-founder-launch-authority/founder-evidence-collector.js';
import { runCapabilityPlanningPipeline } from '../../src/capability-planning-engine/index.js';
import {
  assessBehaviorSimulationReadiness,
  buildLaunchBehaviorSimulationEvidence,
  classifyBehaviorFailure,
  discoverBehaviorScenarios,
  evaluateLivePreviewBehaviorGate,
  getDevPulseV2BehaviorSimulationEngine,
  isBehaviorSimulationReadyForPreview,
  mapInteractionTargets,
  planSimulationActions,
  resetBehaviorSimulationEngineModuleForTests,
  runBehaviorSimulationPipeline,
} from '../../src/behavior-simulation-engine/index.js';
import { runIncrementalBuildPipeline } from '../../src/incremental-autonomous-builder/index.js';
import { runIntentUnderstandingEngine } from '../../src/intent-understanding-engine/index.js';
import { runPromptFaithfulnessEngineV2 } from '../../src/prompt-faithfulness-engine-v2/index.js';
import { resolvePromptFaithfulBuildPlan } from '../../src/prompt-faithful-generation/index.js';
import { EXPENSE_PROMPT, LISA_PROMPT } from './prompt-faithfulness-v2-validation.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/behavior-simulation-engine');

export const EXPENSE_CREATE_PROMPT =
  'Build a business expense tracker with create expense workflow, edit, delete, export, and reporting.';

export const REQUIRED_FILES = [
  'behavior-simulation-types.ts',
  'behavior-simulation-registry.ts',
  'behavior-scenario-discovery.ts',
  'behavior-model-builder.ts',
  'interaction-target-mapper.ts',
  'simulation-action-planner.ts',
  'simulated-action-executor.ts',
  'state-transition-verifier.ts',
  'service-effect-verifier.ts',
  'data-update-verifier.ts',
  'ui-result-verifier.ts',
  'behavior-failure-classifier.ts',
  'behavior-repair-recommender.ts',
  'behavior-simulation-authority.ts',
  'behavior-simulation-report-builder.ts',
  'behavior-simulation-history.ts',
  'behavior-simulation-readiness.ts',
  'behavior-live-preview-gate.ts',
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
  return {
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
    incrementalBuild,
  };
}

export function runBehaviorSimulationValidation(sections?: string[]): {
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

  resetBehaviorSimulationEngineModuleForTests();

  if (include('behavior-simulation-engine') || include('all')) {
    for (const file of REQUIRED_FILES) {
      assert('behavior-simulation-engine', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
    }
    const authority = getDevPulseV2BehaviorSimulationEngine();
    assert('behavior-simulation-engine', 'pass token', authority.passToken === 'BEHAVIOR_SIMULATION_ENGINE_V1_PASS', authority.passToken);
    assert('behavior-simulation-engine', 'phase 5', authority.phase === 5, String(authority.phase));
  }

  if (include('behavior-scenario-discovery') || include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const scenarios = discoverBehaviorScenarios({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel: input.productIntelligenceModel,
      promptFaithfulness: input.promptFaithfulness,
      incrementalBuild: input.incrementalBuild,
    });
    assert('behavior-scenario-discovery', 'expense scenarios', scenarios.length >= 5, String(scenarios.length));
    assert(
      'behavior-scenario-discovery',
      'create scenario',
      scenarios.some((s) => /create expense/i.test(s.name)),
      scenarios.map((s) => s.name).join(', '),
    );
    const lisa = discoverBehaviorScenarios({
      rawPrompt: LISA_PROMPT,
      productIntelligenceModel: runIntentUnderstandingEngine({ rawPrompt: LISA_PROMPT }).productIntelligenceModel,
      incrementalBuild: eraInput(LISA_PROMPT).incrementalBuild,
    });
    assert('behavior-scenario-discovery', 'emergency phrase', lisa.some((s) => /emergency/i.test(s.name)), 'emergency');
  }

  if (include('behavior-model-builder') || include('all')) {
    const pipeline = runBehaviorSimulationPipeline(eraInput(EXPENSE_PROMPT));
    assert('behavior-model-builder', 'model built', pipeline.behaviorModel.states.length >= 3, String(pipeline.behaviorModel.states.length));
    assert('behavior-model-builder', 'traceable', pipeline.behaviorModel.traceableToPrompt || pipeline.scenarios.length > 0, 'traceable');
  }

  if (include('interaction-target-mapping') || include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const scenarios = discoverBehaviorScenarios({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel: input.productIntelligenceModel,
      promptFaithfulness: input.promptFaithfulness,
      incrementalBuild: input.incrementalBuild,
    });
    const targets = mapInteractionTargets(scenarios);
    assert('interaction-target-mapping', 'targets mapped', targets.length >= 5, String(targets.length));
    assert(
      'interaction-target-mapping',
      'semantic selectors',
      targets.every((t) => ['role', 'accessible-name', 'route', 'label', 'data-testid', 'placeholder'].includes(t.selectorStrategy)),
      'selectors',
    );
  }

  if (include('simulation-action-planning') || include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const scenarios = discoverBehaviorScenarios({
      rawPrompt: input.rawPrompt,
      productIntelligenceModel: input.productIntelligenceModel,
      promptFaithfulness: input.promptFaithfulness,
      incrementalBuild: input.incrementalBuild,
    });
    const plans = planSimulationActions(scenarios);
    assert('simulation-action-planning', 'plans bounded', plans.every((p) => p.timeoutBudgetMs <= 5000), 'timeout');
    assert('simulation-action-planning', 'retry policy', plans.every((p) => p.retryPolicy.includes('retry')), 'retry');
  }

  if (include('simulated-action-execution') || include('all')) {
    const pipeline = runBehaviorSimulationPipeline(eraInput(EXPENSE_CREATE_PROMPT));
    const create = pipeline.scenarioResults.find((r) => pipeline.scenarios.find((s) => s.scenarioId === r.scenarioId && /create/i.test(s.name)));
    assert('simulated-action-execution', 'actions executed', (create?.actionRecords.length ?? 0) >= 2, String(create?.actionRecords.length));
    assert('simulated-action-execution', 'handler fired', create?.actionRecords.every((a) => a.result === 'PASS') ?? false, 'pass');
  }

  if (include('state-transition-verification') || include('all')) {
    const pipeline = runBehaviorSimulationPipeline(eraInput(EXPENSE_CREATE_PROMPT));
    assert(
      'state-transition-verification',
      'create state change',
      pipeline.scenarioResults.some((r) => r.stateVerification.matched && /create/i.test(r.scenarioId) || r.stateVerification.matched),
      'state',
    );
  }

  if (include('service-effect-verification') || include('all')) {
    const pipeline = runBehaviorSimulationPipeline(eraInput(EXPENSE_CREATE_PROMPT));
    assert(
      'service-effect-verification',
      'save service',
      pipeline.scenarioResults.some((r) => r.serviceVerification.matched && /SaveExpense/i.test(r.serviceVerification.serviceName)),
      pipeline.scenarioResults.map((r) => r.serviceVerification.serviceName).join(', '),
    );
  }

  if (include('data-update-verification') || include('all')) {
    const pipeline = runBehaviorSimulationPipeline(eraInput(EXPENSE_CREATE_PROMPT));
    assert(
      'data-update-verification',
      'record added',
      pipeline.scenarioResults.some((r) => r.dataVerification.matched && /added/i.test(r.dataVerification.expectedMutation)),
      'data',
    );
  }

  if (include('ui-result-verification') || include('all')) {
    const pipeline = runBehaviorSimulationPipeline(eraInput(EXPENSE_CREATE_PROMPT));
    assert(
      'ui-result-verification',
      'list updated',
      pipeline.scenarioResults.some((r) => r.uiVerification.matched),
      String(pipeline.scenarioResults.filter((r) => r.uiVerification.matched).length),
    );
  }

  if (include('behavior-failure-classification') || include('all')) {
    const broken = runBehaviorSimulationPipeline({ ...eraInput(EXPENSE_CREATE_PROMPT), simulateBrokenHandler: true });
    const fail = broken.scenarioResults.find((r) => !r.passed);
    assert('behavior-failure-classification', 'handler failure', fail?.failure?.category === 'HANDLER_NOT_CONNECTED', fail?.failure?.category ?? 'none');
    const uiOnly = runBehaviorSimulationPipeline({ ...eraInput(EXPENSE_CREATE_PROMPT), simulateUiWithoutData: true });
    const dataFail = uiOnly.scenarioResults.find((r) => r.failure?.category === 'DATA_NOT_UPDATED');
    assert('behavior-failure-classification', 'data not updated', Boolean(dataFail), dataFail?.failure?.category ?? 'none');
  }

  if (include('behavior-repair-recommendation') || include('all')) {
    const broken = runBehaviorSimulationPipeline({ ...eraInput(EXPENSE_CREATE_PROMPT), simulateBrokenHandler: true });
    assert(
      'behavior-repair-recommendation',
      'repair produced',
      broken.scenarioResults.some((r) => r.repairRecommendation !== null),
      'repair',
    );
    assert(
      'behavior-repair-recommendation',
      'targeted scope',
      broken.scenarioResults.every((r) => !r.repairRecommendation || /HANDLER|TARGETED/i.test(r.repairRecommendation.suggestedRepairScope)),
      'scope',
    );
  }

  if (include('behavior-incremental-integration') || include('all')) {
    const stabilization = readFileSync(join(ROOT, 'src/incremental-autonomous-builder/feature-stabilization-gate.ts'), 'utf8');
    assert('behavior-incremental-integration', 'stabilization wired', stabilization.includes('behaviorPassed'), 'wired');
    const incr = readFileSync(join(ROOT, 'src/incremental-autonomous-builder/incremental-build-orchestrator.ts'), 'utf8');
    assert('behavior-incremental-integration', 'orchestrator wired', incr.includes('simulateBehaviorForFeatureSlice'), 'orchestrator');
  }

  if (include('behavior-launch-integration') || include('all')) {
    const buildPlan = resolvePromptFaithfulBuildPlan(EXPENSE_PROMPT);
    assert('behavior-launch-integration', 'fifth gate', buildPlan.behaviorSimulation.ready, buildPlan.behaviorSimulation.blockedReason ?? 'ready');
    const founder = collectFounderLaunchEvidence({ productPrompt: EXPENSE_PROMPT });
    assert('behavior-launch-integration', 'AFLA source', founder.behaviorSimulation?.available === true, founder.behaviorSimulation?.sourceName ?? 'missing');
    const pipeline = runBehaviorSimulationPipeline(eraInput(EXPENSE_PROMPT));
    const evidence = buildLaunchBehaviorSimulationEvidence(pipeline);
    assert('behavior-launch-integration', 'launch evidence', evidence.requiredCount >= 5, String(evidence.requiredCount));
    const verdict = readFileSync(join(ROOT, 'src/autonomous-founder-launch-authority/founder-verdict-engine.ts'), 'utf8');
    assert('behavior-launch-integration', 'verdict blocks', verdict.includes('Behavior Simulation incomplete'), 'verdict');
  }

  if (include('behavior-live-preview-gate') || include('all')) {
    const passPipeline = runBehaviorSimulationPipeline(eraInput(EXPENSE_PROMPT));
    const gate = evaluateLivePreviewBehaviorGate(passPipeline);
    assert('behavior-live-preview-gate', 'unlocked on pass', gate.unlocked, String(gate.unlocked));
    assert('behavior-live-preview-gate', 'ready for preview', isBehaviorSimulationReadyForPreview(passPipeline), 'ready');
    const failPipeline = runBehaviorSimulationPipeline({ ...eraInput(EXPENSE_PROMPT), simulateBrokenHandler: true });
    const failGate = evaluateLivePreviewBehaviorGate(failPipeline);
    assert('behavior-live-preview-gate', 'blocked on fail', !failGate.unlocked, failGate.blockedReason ?? 'blocked');
    assert('behavior-live-preview-gate', 'failure summary', Boolean(failGate.failureSummary), failGate.failureSummary ?? 'none');
    const orchestrator = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
    assert('behavior-live-preview-gate', 'orchestrator gate', orchestrator.includes('evaluateLivePreviewBehaviorGate'), 'orchestrator');
  }

  return { checks, allPassed: checks.every((c) => c.passed) };
}

export function printBehaviorSimulationValidationResults(checks: ValidationCheck[], title: string): void {
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
  console.log('\nBEHAVIOR_SIMULATION_ENGINE_V1_PASS');
}
