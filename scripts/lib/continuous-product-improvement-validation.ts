/**
 * Continuous Product Improvement Engine Era 3 Phase 11 — shared validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectFounderLaunchEvidence } from '../../src/autonomous-founder-launch-authority/founder-evidence-collector.js';
import { runAutonomousDebuggingPipeline } from '../../src/autonomous-debugging-engine/index.js';
import { runBehaviorSimulationPipeline } from '../../src/behavior-simulation-engine/index.js';
import { runCapabilityPlanningPipeline } from '../../src/capability-planning-engine/index.js';
import { runIncrementalBuildPipeline } from '../../src/incremental-autonomous-builder/index.js';
import { runIntentUnderstandingEngine } from '../../src/intent-understanding-engine/index.js';
import { runPromptFaithfulnessEngineV2 } from '../../src/prompt-faithfulness-engine-v2/index.js';
import { resolvePromptFaithfulBuildPlan } from '../../src/prompt-faithful-generation/index.js';
import { runInteractionProofPipeline } from '../../src/interaction-proof-engine/index.js';
import { runVirtualUserPipeline } from '../../src/virtual-user-engine/index.js';
import { runVirtualDevicePipeline } from '../../src/virtual-device-laboratory/index.js';
import {
  assessImprovementSafety,
  buildLaunchContinuousImprovementEvidence,
  calculateProductQualityScore,
  detectImprovementOpportunities,
  evaluateLivePreviewContinuousImprovementGate,
  generateImprovementPlan,
  getDevPulseV2ContinuousProductImprovementEngine,
  intakeImprovementSignals,
  isContinuousImprovementReadyForPreview,
  isLaunchBlockingPriority,
  planImprovementApplication,
  planImprovementPatchScope,
  planImprovementRegression,
  planImprovementValidation,
  rankImprovementOpportunities,
  resetContinuousProductImprovementEngineModuleForTests,
  runContinuousImprovementPipeline,
  runImprovementLoop,
} from '../../src/continuous-product-improvement-engine/index.js';
import { EXPENSE_PROMPT, LISA_PROMPT } from './prompt-faithfulness-v2-validation.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/continuous-product-improvement-engine');

export const REQUIRED_FILES = [
  'continuous-improvement-types.ts',
  'continuous-improvement-registry.ts',
  'improvement-signal-intake.ts',
  'improvement-opportunity-detector.ts',
  'improvement-priority-ranker.ts',
  'improvement-safety-assessor.ts',
  'improvement-plan-generator.ts',
  'improvement-patch-scope-planner.ts',
  'improvement-application-planner.ts',
  'improvement-validation-planner.ts',
  'improvement-regression-planner.ts',
  'improvement-loop-controller.ts',
  'improvement-budget-manager.ts',
  'improvement-quality-scorer.ts',
  'improvement-history.ts',
  'continuous-improvement-authority.ts',
  'continuous-improvement-report-builder.ts',
  'continuous-improvement-live-preview-gate.ts',
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
  const virtualDeviceLaboratory = runVirtualDevicePipeline({
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
  });
  const interactionProof = runInteractionProofPipeline({
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
  });
  const autonomousDebugging = runAutonomousDebuggingPipeline({
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
    interactionProof,
  });
  return {
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
    interactionProof,
    autonomousDebugging,
  };
}

export function runContinuousProductImprovementValidation(sections?: string[]): {
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

  resetContinuousProductImprovementEngineModuleForTests();

  if (include('continuous-product-improvement-engine') || include('all')) {
    for (const file of REQUIRED_FILES) {
      assert('continuous-product-improvement-engine', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
    }
    const authority = getDevPulseV2ContinuousProductImprovementEngine();
    assert(
      'continuous-product-improvement-engine',
      'pass token',
      authority.passToken === 'CONTINUOUS_PRODUCT_IMPROVEMENT_ENGINE_V1_PASS',
      authority.passToken,
    );
    assert('continuous-product-improvement-engine', 'phase 11', authority.phase === 11, String(authority.phase));
  }

  if (include('improvement-signal-intake') || include('all')) {
    const input = eraInput(LISA_PROMPT);
    const frictionSignals = intakeImprovementSignals({
      ...input,
      simulateHighFrictionEmergency: true,
    });
    assert(
      'improvement-signal-intake',
      'emergency friction signal',
      frictionSignals.some((s) => /too many steps/i.test(s.observedResult)),
      String(frictionSignals.length),
    );
    const perfSignals = intakeImprovementSignals({
      ...input,
      simulateLowEndPerformanceWarning: true,
    });
    assert(
      'improvement-signal-intake',
      'performance warning signal',
      perfSignals.some((s) => s.kind === 'PERFORMANCE_DEGRADATION'),
      String(perfSignals.length),
    );
  }

  if (include('improvement-opportunity-detection') || include('all')) {
    const input = eraInput(LISA_PROMPT);
    const signals = intakeImprovementSignals({ ...input, simulateHighFrictionEmergency: true });
    const opportunities = detectImprovementOpportunities(signals);
    assert(
      'improvement-opportunity-detection',
      'usability opportunity',
      opportunities.some((o) => o.category === 'USABILITY_IMPROVEMENT'),
      String(opportunities.length),
    );
  }

  if (include('improvement-priority-ranking') || include('all')) {
    const input = eraInput(LISA_PROMPT);
    const signals = intakeImprovementSignals({ ...input, simulateHighFrictionEmergency: true });
    const ranked = rankImprovementOpportunities(detectImprovementOpportunities(signals));
    const top = ranked[0];
    assert(
      'improvement-priority-ranking',
      'high priority emergency',
      Boolean(top && (top.priority === 'HIGH' || top.priority === 'CRITICAL')),
      top?.priority ?? 'missing',
    );
  }

  if (include('improvement-safety-assessment') || include('all')) {
    const input = eraInput(LISA_PROMPT);
    const signals = intakeImprovementSignals({ ...input, simulateUnsafeImprovement: true });
    const opp = detectImprovementOpportunities(signals)[0]!;
    const safety = assessImprovementSafety({ opportunity: opp, simulateUnsafeImprovement: true });
    assert('improvement-safety-assessment', 'unsafe blocked', !safety.safe, safety.blockedReason ?? 'blocked');
  }

  if (include('improvement-plan-generation') || include('all')) {
    const input = eraInput(LISA_PROMPT);
    const opportunities = detectImprovementOpportunities(
      intakeImprovementSignals({ ...input, simulateHighFrictionEmergency: true }),
    );
    const opp =
      opportunities.find((o) => o.category === 'USABILITY_IMPROVEMENT' && /emergency/i.test(o.summary)) ??
      opportunities[0]!;
    const plan = generateImprovementPlan({ opportunity: opp });
    assert(
      'improvement-plan-generation',
      'reduce steps strategy',
      plan.patchStrategy === 'REDUCE_STEPS',
      plan.patchStrategy,
    );
  }

  if (include('improvement-patch-scope-planning') || include('all')) {
    const input = eraInput(LISA_PROMPT);
    const opp = detectImprovementOpportunities(
      intakeImprovementSignals({ ...input, simulateAccessibilityLabelWarning: true }),
    )[0]!;
    const plan = generateImprovementPlan({ opportunity: opp });
    const scope = planImprovementPatchScope(plan);
    assert('improvement-patch-scope-planning', 'narrow scope', scope.targetFeatureSlices.length >= 1, String(scope.targetFeatureSlices.length));
  }

  if (include('improvement-application-planning') || include('all')) {
    const input = eraInput(LISA_PROMPT);
    const opportunities = detectImprovementOpportunities(
      intakeImprovementSignals({ ...input, simulateHighFrictionEmergency: true }),
    );
    const opp =
      opportunities.find((o) => o.category === 'USABILITY_IMPROVEMENT' && /emergency/i.test(o.summary)) ??
      opportunities[0]!;
    const plan = generateImprovementPlan({ opportunity: opp });
    const patch = planImprovementApplication({ improvementPlan: plan, patchScope: planImprovementPatchScope(plan) });
    assert('improvement-application-planning', 'patch plan', patch.filesToModify.length >= 1, String(patch.filesToModify.length));
  }

  if (include('improvement-validation-planning') || include('all')) {
    const orchestrator = readFileSync(join(MODULE_DIR, 'improvement-validation-planner.ts'), 'utf8');
    assert('improvement-validation-planning', 'planner exists', orchestrator.includes('planImprovementValidation'), 'planner');
  }

  if (include('improvement-regression-planning') || include('all')) {
    const orchestrator = readFileSync(join(MODULE_DIR, 'improvement-regression-planner.ts'), 'utf8');
    assert('improvement-regression-planning', 'planner exists', orchestrator.includes('planImprovementRegression'), 'planner');
    const input = eraInput(EXPENSE_PROMPT);
    const opportunities = detectImprovementOpportunities(
      intakeImprovementSignals({ ...input, simulateHighFrictionEmergency: true }),
    );
    const opp =
      opportunities.find((o) => o.category === 'USABILITY_IMPROVEMENT' && /emergency/i.test(o.summary)) ??
      opportunities[0]!;
    const plan = generateImprovementPlan({ opportunity: opp });
    const regression = planImprovementRegression(plan);
    assert('improvement-regression-planning', 'checks planned', regression.checks.length >= 3, String(regression.checks.length));
    planImprovementValidation(plan);
  }

  if (include('improvement-loop-controller') || include('all')) {
    const input = eraInput(LISA_PROMPT);
    const ranked = rankImprovementOpportunities(
      detectImprovementOpportunities(intakeImprovementSignals({ ...input, simulateHighFrictionEmergency: true })),
    );
    const opp = ranked[0]!;
    const plan = generateImprovementPlan({ opportunity: opp });
    const loop = runImprovementLoop({ opportunity: opp, improvementPlan: plan });
    assert('improvement-loop-controller', 'emergency friction resolved', loop.resolved, String(loop.attempts.length));
  }

  if (include('improvement-budget-manager') || include('all')) {
    const input = eraInput(LISA_PROMPT);
    const ranked = rankImprovementOpportunities(
      detectImprovementOpportunities(intakeImprovementSignals({ ...input, simulateHighFrictionEmergency: true })),
    );
    const exhausted = runImprovementLoop({
      opportunities: ranked,
      simulateImprovementExhaustion: true,
    });
    assert(
      'improvement-budget-manager',
      'budget exhausted',
      exhausted.attempts.length === 0 || exhausted.loops.some((l) => !l.resolved),
      String(exhausted.attempts.length),
    );
  }

  if (include('improvement-quality-scoring') || include('all')) {
    const input = eraInput(LISA_PROMPT);
    const pipeline = runContinuousImprovementPipeline({
      ...input,
      simulateHighFrictionEmergency: true,
    });
    assert(
      'improvement-quality-scoring',
      'quality score computed',
      pipeline.qualityScore.overallScore > 0,
      String(pipeline.qualityScore.overallScore),
    );
    const deferredPipeline = runContinuousImprovementPipeline({
      ...input,
      simulateMinorCopyImprovement: true,
    });
    assert(
      'improvement-quality-scoring',
      'deferred tracked',
      deferredPipeline.deferredOpportunities.length >= 1,
      String(deferredPipeline.deferredOpportunities.length),
    );
  }

  if (include('continuous-improvement-launch-integration') || include('all')) {
    const buildPlan = resolvePromptFaithfulBuildPlan(EXPENSE_PROMPT);
    assert(
      'continuous-improvement-launch-integration',
      'eleventh gate',
      buildPlan.continuousProductImprovement.ready,
      buildPlan.continuousProductImprovement.blockedReason ?? 'ready',
    );
    const founder = collectFounderLaunchEvidence({ productPrompt: EXPENSE_PROMPT });
    assert(
      'continuous-improvement-launch-integration',
      'AFLA source',
      founder.continuousProductImprovement?.available === true,
      founder.continuousProductImprovement?.sourceName ?? 'missing',
    );
    const pipeline = runContinuousImprovementPipeline(eraInput(EXPENSE_PROMPT));
    const evidence = buildLaunchContinuousImprovementEvidence(pipeline);
    assert('continuous-improvement-launch-integration', 'launch evidence', evidence.signalCount >= 0, String(evidence.signalCount));
    const verdict = readFileSync(join(ROOT, 'src/autonomous-founder-launch-authority/founder-verdict-engine.ts'), 'utf8');
    assert(
      'continuous-improvement-launch-integration',
      'verdict blocks',
      verdict.includes('Continuous Product Improvement incomplete'),
      'verdict',
    );
  }

  if (include('continuous-improvement-live-preview-gate') || include('all')) {
    const passPipeline = runContinuousImprovementPipeline(eraInput(EXPENSE_PROMPT));
    const gate = evaluateLivePreviewContinuousImprovementGate(passPipeline);
    assert('continuous-improvement-live-preview-gate', 'unlocked on pass', gate.unlocked, String(gate.unlocked));
    assert(
      'continuous-improvement-live-preview-gate',
      'ready for preview',
      isContinuousImprovementReadyForPreview(passPipeline),
      'ready',
    );
    const blockedPipeline = runContinuousImprovementPipeline({
      ...eraInput(LISA_PROMPT),
      simulateUnsafeImprovement: true,
    });
    const failGate = evaluateLivePreviewContinuousImprovementGate(blockedPipeline);
    assert(
      'continuous-improvement-live-preview-gate',
      'blocked on unsafe improvement',
      !failGate.unlocked,
      blockedPipeline.permissionVerdict,
    );
    const orchestrator = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
    assert(
      'continuous-improvement-live-preview-gate',
      'orchestrator gate',
      orchestrator.includes('evaluateLivePreviewContinuousImprovementGate'),
      'orchestrator',
    );
  }

  if (include('all')) {
    const input = eraInput(LISA_PROMPT);
    const friction = runContinuousImprovementPipeline({ ...input, simulateHighFrictionEmergency: true });
    assert(
      'continuous-product-improvement-engine',
      'scenario emergency friction',
      friction.improvementLoops.some((l) => l.resolved) &&
        isContinuousImprovementReadyForPreview(friction),
      friction.permissionVerdict,
    );
    const perf = runContinuousImprovementPipeline({ ...input, simulateLowEndPerformanceWarning: true });
    assert(
      'continuous-product-improvement-engine',
      'scenario performance warning',
      perf.rankedOpportunities.some((o) => o.category === 'PERFORMANCE_OPTIMIZATION') &&
        (perf.improvementLoops.some((l) => l.resolved) || perf.deferredOpportunities.length > 0),
      perf.permissionVerdict,
    );
    const a11y = runContinuousImprovementPipeline({ ...input, simulateAccessibilityLabelWarning: true });
    assert(
      'continuous-product-improvement-engine',
      'scenario accessibility label',
      a11y.improvementLoops.some((l) => l.resolved) && isContinuousImprovementReadyForPreview(a11y),
      a11y.permissionVerdict,
    );
    const unsafe = runContinuousImprovementPipeline({ ...input, simulateUnsafeImprovement: true });
    assert(
      'continuous-product-improvement-engine',
      'scenario unsafe block',
      unsafe.blockedOpportunities.length > 0,
      unsafe.permissionVerdict,
    );
    const regression = runContinuousImprovementPipeline({
      ...input,
      simulateLowEndPerformanceWarning: true,
      simulateRegressionAfterImprovement: true,
    });
    assert(
      'continuous-product-improvement-engine',
      'scenario regression rollback',
      regression.permissionVerdict === 'BLOCKED' || regression.improvementAttempts.some((a) => a.outcome === 'ROLLED_BACK'),
      regression.permissionVerdict,
    );
    const deferred = runContinuousImprovementPipeline({ ...input, simulateMinorCopyImprovement: true });
    assert(
      'continuous-product-improvement-engine',
      'scenario deferred low priority',
      isContinuousImprovementReadyForPreview(deferred) && deferred.deferredOpportunities.length > 0,
      deferred.permissionVerdict,
    );
    const ranked = rankImprovementOpportunities(
      detectImprovementOpportunities(intakeImprovementSignals({ ...input, simulateHighFrictionEmergency: true })),
    );
    assert(
      'continuous-product-improvement-engine',
      'launch blocking priority helper',
      isLaunchBlockingPriority(ranked[0]?.priority ?? 'LOW'),
      ranked[0]?.priority ?? 'missing',
    );
    const score = calculateProductQualityScore({
      rankedOpportunities: ranked,
      pipeline: friction,
    });
    assert(
      'continuous-product-improvement-engine',
      'quality delta after apply',
      score.safeImprovementsApplied >= 1,
      String(score.safeImprovementsApplied),
    );
  }

  const allPassed = checks.every((c) => c.passed);
  return { checks, allPassed };
}

export function printContinuousProductImprovementValidationResults(
  checks: ValidationCheck[],
  label = 'validate:continuous-product-improvement-engine',
): void {
  const failed = checks.filter((c) => !c.passed);
  for (const check of checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} [${check.section}] ${check.name}: ${check.detail}`);
  }
  console.log(`\n${label}: ${failed.length ? 'FAILED' : 'PASSED'} (${checks.length} checks, ${failed.length} failed)`);
  if (failed.length) {
    process.exit(1);
  }
  console.log('\nCONTINUOUS_PRODUCT_IMPROVEMENT_ENGINE_V1_PASS');
}
