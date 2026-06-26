/**
 * Incremental Autonomous Builder Era 3 Phase 4 — shared validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectFounderLaunchEvidence } from '../../src/autonomous-founder-launch-authority/founder-evidence-collector.js';
import { getDevPulseV2Owner } from '../../src/foundation/ownership-registry.js';
import {
  INCREMENTAL_AUTONOMOUS_BUILDER_PASS_TOKEN,
  INCREMENTAL_AUTONOMOUS_BUILDER_OWNER_MODULE,
  assessIncrementalBuildReadiness,
  buildIncrementalBuildPlan,
  buildLaunchIncrementalBuildEvidence,
  getDevPulseV2IncrementalAutonomousBuilder,
  getFeatureCommitLog,
  getOrderingRules,
  getResumableSliceId,
  isIncrementalBuildReadyForGeneration,
  loadBuildState,
  orderFeatureSlices,
  planFeatureSlices,
  resetIncrementalAutonomousBuilderModuleForTests,
  runIncrementalBuildPipeline,
} from '../../src/incremental-autonomous-builder/index.js';
import { runCapabilityPlanningPipeline } from '../../src/capability-planning-engine/index.js';
import { runIntentUnderstandingEngine } from '../../src/intent-understanding-engine/index.js';
import { runPromptFaithfulnessEngineV2 } from '../../src/prompt-faithfulness-engine-v2/index.js';
import { resolvePromptFaithfulBuildPlan } from '../../src/prompt-faithful-generation/index.js';
import { EXPENSE_PROMPT, LISA_PROMPT } from './prompt-faithfulness-v2-validation.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/incremental-autonomous-builder');

export const REQUIRED_FILES = [
  'incremental-builder-types.ts',
  'incremental-builder-registry.ts',
  'incremental-build-plan.ts',
  'feature-slice-planner.ts',
  'feature-dependency-ordering.ts',
  'architecture-skeleton-builder.ts',
  'feature-slice-generator.ts',
  'feature-slice-validator.ts',
  'feature-repair-planner.ts',
  'feature-stabilization-gate.ts',
  'feature-commit-log.ts',
  'feature-regression-guard.ts',
  'build-state-store.ts',
  'incremental-build-orchestrator.ts',
  'incremental-build-report-builder.ts',
  'incremental-build-history.ts',
  'incremental-build-readiness.ts',
  'whole-app-assembly.ts',
  'index.ts',
];

export interface ValidationCheck {
  section: string;
  name: string;
  passed: boolean;
  detail: string;
}

function pipelineInput(rawPrompt: string) {
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
  return {
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
  };
}

export function runIncrementalBuilderValidation(sections?: string[]): {
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

  resetIncrementalAutonomousBuilderModuleForTests();

  if (include('incremental-autonomous-builder') || include('all')) {
    for (const file of REQUIRED_FILES) {
      assert('incremental-autonomous-builder', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
    }
    const authority = getDevPulseV2IncrementalAutonomousBuilder();
    assert(
      'incremental-autonomous-builder',
      'pass token',
      authority.passToken === INCREMENTAL_AUTONOMOUS_BUILDER_PASS_TOKEN,
      authority.passToken,
    );
    assert(
      'incremental-autonomous-builder',
      'owner module',
      authority.ownerModule === INCREMENTAL_AUTONOMOUS_BUILDER_OWNER_MODULE,
      authority.ownerModule,
    );
    const owner = getDevPulseV2Owner('incremental_autonomous_builder');
    assert('incremental-autonomous-builder', 'ownership', owner.ownerModule === INCREMENTAL_AUTONOMOUS_BUILDER_OWNER_MODULE, owner.ownerModule);
    assert('incremental-autonomous-builder', 'ordering rules', getOrderingRules().length >= 8, String(getOrderingRules().length));
  }

  if (include('incremental-build-plan') || include('all')) {
    const input = pipelineInput(LISA_PROMPT);
    const plan = buildIncrementalBuildPlan(input);
    assert('incremental-build-plan', 'build id', plan.buildId.startsWith('incr-build-'), plan.buildId);
    assert('incremental-build-plan', 'contract id', plan.promptContractId.length > 0, plan.promptContractId);
    assert('incremental-build-plan', 'feature slices', plan.featureSlices.length >= 7, String(plan.featureSlices.length));
    assert('incremental-build-plan', 'whole app plan', plan.wholeAppValidationPlan.length >= 5, String(plan.wholeAppValidationPlan.length));
  }

  if (include('feature-slice-planning') || include('all')) {
    const lisaSlices = planFeatureSlices(pipelineInput(LISA_PROMPT));
    assert('feature-slice-planning', 'LISA slices', lisaSlices.length >= 7, String(lisaSlices.length));
    assert(
      'feature-slice-planning',
      'blink slice',
      lisaSlices.some((s) => /blink/i.test(s.name)),
      lisaSlices.map((s) => s.name).join(', '),
    );
    assert(
      'feature-slice-planning',
      'accessibility slice',
      lisaSlices.some((s) => /accessibility/i.test(s.name)),
      'a11y',
    );

    const expenseSlices = planFeatureSlices(pipelineInput(EXPENSE_PROMPT));
    assert('feature-slice-planning', 'expense slices', expenseSlices.length >= 8, String(expenseSlices.length));
    assert(
      'feature-slice-planning',
      'data model',
      expenseSlices.some((s) => /data model/i.test(s.name)),
      expenseSlices.map((s) => s.name).join(', '),
    );
    assert(
      'feature-slice-planning',
      'export slice',
      expenseSlices.some((s) => /export/i.test(s.name)),
      'export',
    );
  }

  if (include('feature-dependency-ordering') || include('all')) {
    const input = pipelineInput(EXPENSE_PROMPT);
    const slices = planFeatureSlices(input);
    const ordering = orderFeatureSlices(slices);
    const names = ordering.orderedSliceIds.map((id) => slices.find((s) => s.sliceId === id)?.name ?? id);
    const dataModelIndex = names.findIndex((n) => /data model/i.test(n));
    const createIndex = names.findIndex((n) => /^create expense/i.test(n));
    const exportIndex = names.findIndex((n) => /export/i.test(n));
    const reportsIndex = names.findIndex((n) => /report/i.test(n));
    assert('feature-dependency-ordering', 'data model first', dataModelIndex === 0, names.join(' -> '));
    assert('feature-dependency-ordering', 'create after model', createIndex > dataModelIndex, names.join(' -> '));
    assert('feature-dependency-ordering', 'export after reports', exportIndex > reportsIndex, names.join(' -> '));
    assert('feature-dependency-ordering', 'no cycles', ordering.circularDependencies.length === 0, String(ordering.circularDependencies.length));
  }

  if (include('architecture-skeleton-builder') || include('all')) {
    const input = pipelineInput(LISA_PROMPT);
    const readiness = assessIncrementalBuildReadiness(input);
    assert('architecture-skeleton-builder', 'skeleton compiles', readiness.skeleton.compiles, String(readiness.skeleton.compiles));
    assert('architecture-skeleton-builder', 'routing shell', readiness.skeleton.routingShell.length >= 2, String(readiness.skeleton.routingShell.length));
    assert('architecture-skeleton-builder', 'manifest anchors', readiness.skeleton.manifestAnchors.length >= 1, 'anchors');
  }

  if (include('feature-slice-generation') || include('all')) {
    const pipeline = runIncrementalBuildPipeline(pipelineInput(LISA_PROMPT));
    assert('feature-slice-generation', 'generations', pipeline.generationResults.length >= 7, String(pipeline.generationResults.length));
    assert(
      'feature-slice-generation',
      'traceability',
      pipeline.generationResults.every((g) => g.traceabilityComplete),
      'traceability',
    );
  }

  if (include('feature-slice-validation') || include('all')) {
    const pipeline = runIncrementalBuildPipeline(pipelineInput(LISA_PROMPT));
    assert('feature-slice-validation', 'validations', pipeline.validationResults.length >= 7, String(pipeline.validationResults.length));
    assert(
      'feature-slice-validation',
      'stable validations',
      pipeline.validationResults.filter((v) => v.passed).length >= 7,
      String(pipeline.validationResults.filter((v) => v.passed).length),
    );
  }

  if (include('feature-repair-planning') || include('all')) {
    const input = pipelineInput(EXPENSE_PROMPT);
    const pipeline = runIncrementalBuildPipeline({
      ...input,
      simulateFailingSliceName: 'Create Expense',
    });
    assert('feature-repair-planning', 'repair plans', pipeline.repairPlans.length >= 1, String(pipeline.repairPlans.length));
    assert(
      'feature-repair-planning',
      'targeted repair',
      pipeline.repairPlans.every((p) => p.preserveFaithfulness && p.preserveValidatedBehavior),
      'targeted',
    );
    assert(
      'feature-repair-planning',
      'stabilized after repair',
      pipeline.permissionVerdict === 'READY_FOR_ASSEMBLY',
      pipeline.permissionVerdict,
    );
  }

  if (include('feature-stabilization-gate') || include('all')) {
    const pipeline = runIncrementalBuildPipeline(pipelineInput(EXPENSE_PROMPT));
    assert(
      'feature-stabilization-gate',
      'all stable',
      pipeline.stabilizationResults.every((s) => s.status === 'STABLE'),
      pipeline.stabilizationResults.map((s) => s.status).join(', '),
    );
  }

  if (include('feature-commit-log') || include('all')) {
    runIncrementalBuildPipeline(pipelineInput(LISA_PROMPT));
    const log = getFeatureCommitLog();
    assert('feature-commit-log', 'commits recorded', log.length >= 7, String(log.length));
    assert('feature-commit-log', 'rollback snapshots', log.every((c) => c.rollbackSnapshotId.length > 0), 'rollback');
  }

  if (include('feature-regression-guard') || include('all')) {
    const input = pipelineInput(EXPENSE_PROMPT);
    const pipeline = runIncrementalBuildPipeline({
      ...input,
      simulateRegressionSliceName: 'Create Expense',
    });
    assert('feature-regression-guard', 'guards run', pipeline.regressionGuards.length >= 1, String(pipeline.regressionGuards.length));
    assert(
      'feature-regression-guard',
      'guards pass after repair',
      pipeline.regressionGuards.every((g) => g.passed),
      String(pipeline.regressionGuards.filter((g) => !g.passed).length),
    );
    assert(
      'feature-regression-guard',
      'assembly after regression',
      pipeline.permissionVerdict === 'READY_FOR_ASSEMBLY',
      pipeline.permissionVerdict,
    );
  }

  if (include('build-state-store') || include('all')) {
    const input = pipelineInput(LISA_PROMPT);
    const pipeline = runIncrementalBuildPipeline({ ...input, resumeFromBuildId: 'interrupted-build-4' });
    const state = loadBuildState(pipeline.buildPlan.buildId);
    assert('build-state-store', 'state saved', state !== null, 'state');
    assert('build-state-store', 'completed features', (state?.completedSliceIds.length ?? 0) >= 7, String(state?.completedSliceIds.length));
    assert(
      'build-state-store',
      'resumable boundary',
      getResumableSliceId(state!, pipeline.orderedSliceIds) === null,
      'complete',
    );
  }

  if (include('whole-app-assembly') || include('all')) {
    const pipeline = runIncrementalBuildPipeline(pipelineInput(EXPENSE_PROMPT));
    assert('whole-app-assembly', 'assembly passed', pipeline.wholeAppAssembly.passed, pipeline.wholeAppAssembly.blockedReason ?? 'pass');
    assert(
      'whole-app-assembly',
      'all features stable',
      pipeline.wholeAppAssembly.stableFeatureCount === pipeline.buildPlan.featureSlices.length,
      `${pipeline.wholeAppAssembly.stableFeatureCount}/${pipeline.buildPlan.featureSlices.length}`,
    );
  }

  if (include('incremental-build-launch-integration') || include('all')) {
    const buildPlan = resolvePromptFaithfulBuildPlan(LISA_PROMPT);
    assert('incremental-build-launch-integration', 'readiness wired', buildPlan.incrementalBuild.ready, buildPlan.incrementalBuild.blockedReason ?? 'ready');
    assert(
      'incremental-build-launch-integration',
      'fourth gate',
      buildPlan.readyForGeneration ===
        (buildPlan.intentUnderstanding.readyForGeneration &&
          buildPlan.promptFaithfulness.readyForGeneration &&
          buildPlan.incrementalBuild.ready),
      String(buildPlan.readyForGeneration),
    );

    const founderEvidence = collectFounderLaunchEvidence({ productPrompt: LISA_PROMPT });
    assert(
      'incremental-build-launch-integration',
      'AFLA source',
      founderEvidence.incrementalBuild?.available === true,
      founderEvidence.incrementalBuild?.sourceName ?? 'missing',
    );

    const pipeline = runIncrementalBuildPipeline(pipelineInput(LISA_PROMPT));
    const launchEvidence = buildLaunchIncrementalBuildEvidence(pipeline);
    assert('incremental-build-launch-integration', 'launch evidence', launchEvidence.plannedCount >= 7, String(launchEvidence.plannedCount));

    const promptFaithfulSource = readFileSync(join(ROOT, 'src/prompt-faithful-generation/index.ts'), 'utf8');
    assert(
      'incremental-build-launch-integration',
      'pipeline wired',
      promptFaithfulSource.includes('assessIncrementalBuildReadiness'),
      'wired',
    );

    const orchestrator = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
    assert(
      'incremental-build-launch-integration',
      'orchestrator wired',
      orchestrator.includes('runIncrementalBuildPipeline'),
      'orchestrator',
    );

    const verdict = readFileSync(join(ROOT, 'src/autonomous-founder-launch-authority/founder-verdict-engine.ts'), 'utf8');
    assert(
      'incremental-build-launch-integration',
      'verdict blocks incremental',
      verdict.includes('Incremental Build incomplete'),
      'verdict',
    );
  }

  return { checks, allPassed: checks.every((c) => c.passed) };
}

export function printIncrementalBuilderValidationResults(checks: ValidationCheck[], title: string): void {
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
  console.log(`\n${INCREMENTAL_AUTONOMOUS_BUILDER_PASS_TOKEN}`);
}
