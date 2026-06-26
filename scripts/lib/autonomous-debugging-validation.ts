/**
 * Autonomous Debugging Engine Era 3 Phase 9 — shared validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectFounderLaunchEvidence } from '../../src/autonomous-founder-launch-authority/founder-evidence-collector.js';
import {
  analyzePatchSafety,
  analyzeRootCause,
  buildLaunchAutonomousDebuggingEvidence,
  classifyDebuggingFailure,
  evaluateLivePreviewAutonomousDebuggingGate,
  generateRepairPlan,
  getDevPulseV2AutonomousDebuggingEngine,
  intakeFailures,
  isAutonomousDebuggingReadyForPreview,
  normalizeFailures,
  planPatchApplication,
  planPatchScope,
  resetAutonomousDebuggingEngineModuleForTests,
  runAutonomousDebuggingPipeline,
  runRepairLoop,
} from '../../src/autonomous-debugging-engine/index.js';
import { runBehaviorSimulationPipeline } from '../../src/behavior-simulation-engine/index.js';
import { runCapabilityPlanningPipeline } from '../../src/capability-planning-engine/index.js';
import { runIncrementalBuildPipeline } from '../../src/incremental-autonomous-builder/index.js';
import { runIntentUnderstandingEngine } from '../../src/intent-understanding-engine/index.js';
import { runPromptFaithfulnessEngineV2 } from '../../src/prompt-faithfulness-engine-v2/index.js';
import { resolvePromptFaithfulBuildPlan } from '../../src/prompt-faithful-generation/index.js';
import { runInteractionProofPipeline } from '../../src/interaction-proof-engine/index.js';
import { runVirtualUserPipeline } from '../../src/virtual-user-engine/index.js';
import { runVirtualDevicePipeline } from '../../src/virtual-device-laboratory/index.js';
import { EXPENSE_PROMPT } from './prompt-faithfulness-v2-validation.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/autonomous-debugging-engine');

export const REQUIRED_FILES = [
  'autonomous-debugging-types.ts',
  'autonomous-debugging-registry.ts',
  'failure-intake.ts',
  'failure-normalizer.ts',
  'failure-classifier.ts',
  'root-cause-analyzer.ts',
  'responsible-subsystem-resolver.ts',
  'repair-plan-generator.ts',
  'patch-scope-planner.ts',
  'patch-safety-analyzer.ts',
  'patch-application-planner.ts',
  'targeted-validation-planner.ts',
  'repair-execution-simulator.ts',
  'regression-validation-planner.ts',
  'repair-loop-controller.ts',
  'repair-budget-manager.ts',
  'human-review-escalator.ts',
  'autonomous-debugging-authority.ts',
  'autonomous-debugging-report-builder.ts',
  'autonomous-debugging-history.ts',
  'autonomous-debugging-readiness.ts',
  'autonomous-debugging-live-preview-gate.ts',
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
  };
}

export function runAutonomousDebuggingValidation(sections?: string[]): {
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

  resetAutonomousDebuggingEngineModuleForTests();

  if (include('autonomous-debugging-engine') || include('all')) {
    for (const file of REQUIRED_FILES) {
      assert('autonomous-debugging-engine', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
    }
    const authority = getDevPulseV2AutonomousDebuggingEngine();
    assert(
      'autonomous-debugging-engine',
      'pass token',
      authority.passToken === 'AUTONOMOUS_DEBUGGING_ENGINE_V1_PASS',
      authority.passToken,
    );
    assert('autonomous-debugging-engine', 'phase 9', authority.phase === 9, String(authority.phase));
  }

  if (include('failure-intake') || include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const deadInteraction = runInteractionProofPipeline({ ...input, simulateDeadButton: true });
    const intake = intakeFailures({ ...input, interactionProof: deadInteraction });
    assert('failure-intake', 'interaction failure intake', intake.some((r) => r.sourceGate === 'INTERACTION_PROOF'), String(intake.length));
    const dataIntake = intakeFailures({ ...input, simulateDataNotSaved: true });
    assert('failure-intake', 'data failure intake', dataIntake.some((r) => r.failureType === 'DATA_NOT_CHANGED'), 'data');
  }

  if (include('failure-normalization') || include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const deadInteraction = runInteractionProofPipeline({ ...input, simulateDeadButton: true });
    const intake = intakeFailures({ ...input, interactionProof: deadInteraction });
    const normalized = normalizeFailures(intake);
    assert('failure-normalization', 'canonical format', normalized.every((n) => n.id && n.category), String(normalized.length));
  }

  if (include('failure-classification') || include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const deadInteraction = runInteractionProofPipeline({ ...input, simulateDeadButton: true });
    const failure = normalizeFailures(intakeFailures({ ...input, interactionProof: deadInteraction }))[0]!;
    assert(
      'failure-classification',
      'interaction failure',
      classifyDebuggingFailure(failure) === 'INTERACTION_FAILURE',
      classifyDebuggingFailure(failure),
    );
  }

  if (include('root-cause-analysis') || include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const deadInteraction = runInteractionProofPipeline({ ...input, simulateDeadButton: true });
    const failure = normalizeFailures(intakeFailures({ ...input, interactionProof: deadInteraction }))[0]!;
    const rootCause = analyzeRootCause(failure);
    assert('root-cause-analysis', 'handler root cause', /handler/i.test(rootCause.causeSummary), rootCause.causeSummary);
  }

  if (include('responsible-subsystem-resolution') || include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const deadInteraction = runInteractionProofPipeline({ ...input, simulateDeadButton: true });
    const failure = normalizeFailures(intakeFailures({ ...input, interactionProof: deadInteraction }))[0]!;
    const rootCause = analyzeRootCause(failure);
    assert(
      'responsible-subsystem-resolution',
      'subsystem assigned',
      Boolean(rootCause.responsibleSubsystem),
      rootCause.responsibleSubsystem,
    );
  }

  if (include('repair-plan-generation') || include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const deadInteraction = runInteractionProofPipeline({ ...input, simulateDeadButton: true });
    const failure = normalizeFailures(intakeFailures({ ...input, interactionProof: deadInteraction }))[0]!;
    const rootCause = analyzeRootCause(failure);
    const plan = generateRepairPlan({ failure, rootCause });
    assert(
      'repair-plan-generation',
      'handler strategy',
      plan.repairStrategy === 'CONNECT_EXISTING_HANDLER' || plan.repairStrategy === 'ADD_MISSING_HANDLER',
      plan.repairStrategy,
    );
  }

  if (include('patch-scope-planning') || include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const deadInteraction = runInteractionProofPipeline({ ...input, simulateDeadButton: true });
    const failure = normalizeFailures(intakeFailures({ ...input, interactionProof: deadInteraction }))[0]!;
    const plan = generateRepairPlan({ failure, rootCause: analyzeRootCause(failure) });
    const scope = planPatchScope(plan);
    assert('patch-scope-planning', 'narrow scope', scope.targetFiles.length <= 2, String(scope.targetFiles.length));
  }

  if (include('patch-safety-analysis') || include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const failure = normalizeFailures(
      intakeFailures({ ...input, simulatePromptDriftRepair: true }),
    )[0]!;
    const plan = generateRepairPlan({ failure, rootCause: analyzeRootCause(failure) });
    const safety = analyzePatchSafety({ failure, repairPlan: plan, simulatePromptDriftRepair: true });
    assert('patch-safety-analysis', 'prompt drift blocked', !safety.safe, safety.blockedReason ?? 'blocked');
  }

  if (include('patch-application-planning') || include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const deadInteraction = runInteractionProofPipeline({ ...input, simulateDeadButton: true });
    const failure = normalizeFailures(intakeFailures({ ...input, interactionProof: deadInteraction }))[0]!;
    const plan = generateRepairPlan({ failure, rootCause: analyzeRootCause(failure) });
    const patch = planPatchApplication({ repairPlan: plan, patchScope: planPatchScope(plan) });
    assert('patch-application-planning', 'patch plan', patch.filesToModify.length >= 1, String(patch.filesToModify.length));
  }

  if (include('targeted-validation-planning') || include('all')) {
    const orchestrator = readFileSync(join(MODULE_DIR, 'targeted-validation-planner.ts'), 'utf8');
    assert('targeted-validation-planning', 'planner exists', orchestrator.includes('planTargetedValidation'), 'planner');
  }

  if (include('regression-validation-planning') || include('all')) {
    const orchestrator = readFileSync(join(MODULE_DIR, 'regression-validation-planner.ts'), 'utf8');
    assert('regression-validation-planning', 'planner exists', orchestrator.includes('planRegressionValidation'), 'planner');
  }

  if (include('repair-loop-controller') || include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const deadInteraction = runInteractionProofPipeline({ ...input, simulateDeadButton: true });
    const failure = normalizeFailures(intakeFailures({ ...input, interactionProof: deadInteraction }))[0]!;
    const rootCause = analyzeRootCause(failure);
    const plan = generateRepairPlan({ failure, rootCause });
    const loop = runRepairLoop({ failure, repairPlan: plan });
    assert('repair-loop-controller', 'dead button resolved', loop.resolved, String(loop.attempts.length));
  }

  if (include('repair-budget-manager') || include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const failure = normalizeFailures(intakeFailures({ ...input, simulateDataNotSaved: true }))[0]!;
    const plan = generateRepairPlan({ failure, rootCause: analyzeRootCause(failure) });
    const exhausted = runRepairLoop({ failure, repairPlan: plan, simulateRepairExhaustion: true });
    assert(
      'repair-budget-manager',
      'budget exhausted',
      exhausted.escalated && exhausted.humanReview !== null,
      String(exhausted.attempts.length),
    );
  }

  if (include('human-review-escalation') || include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const pipeline = runAutonomousDebuggingPipeline({ ...input, simulatePromptDriftRepair: true });
    assert(
      'human-review-escalation',
      'escalation produced',
      pipeline.humanReview !== null,
      pipeline.permissionVerdict,
    );
  }

  if (include('autonomous-debugging-launch-integration') || include('all')) {
    const buildPlan = resolvePromptFaithfulBuildPlan(EXPENSE_PROMPT);
    assert(
      'autonomous-debugging-launch-integration',
      'ninth gate',
      buildPlan.autonomousDebugging.ready,
      buildPlan.autonomousDebugging.blockedReason ?? 'ready',
    );
    const founder = collectFounderLaunchEvidence({ productPrompt: EXPENSE_PROMPT });
    assert(
      'autonomous-debugging-launch-integration',
      'AFLA source',
      founder.autonomousDebugging?.available === true,
      founder.autonomousDebugging?.sourceName ?? 'missing',
    );
    const pipeline = runAutonomousDebuggingPipeline(eraInput(EXPENSE_PROMPT));
    const evidence = buildLaunchAutonomousDebuggingEvidence(pipeline);
    assert('autonomous-debugging-launch-integration', 'launch evidence', evidence.failureCount >= 0, String(evidence.failureCount));
    const verdict = readFileSync(join(ROOT, 'src/autonomous-founder-launch-authority/founder-verdict-engine.ts'), 'utf8');
    assert('autonomous-debugging-launch-integration', 'verdict blocks', verdict.includes('Autonomous Debugging incomplete'), 'verdict');
  }

  if (include('autonomous-debugging-live-preview-gate') || include('all')) {
    const passPipeline = runAutonomousDebuggingPipeline(eraInput(EXPENSE_PROMPT));
    const gate = evaluateLivePreviewAutonomousDebuggingGate(passPipeline);
    assert('autonomous-debugging-live-preview-gate', 'unlocked on pass', gate.unlocked, String(gate.unlocked));
    assert('autonomous-debugging-live-preview-gate', 'ready for preview', isAutonomousDebuggingReadyForPreview(passPipeline), 'ready');
    const input = eraInput(EXPENSE_PROMPT);
    const deadInteraction = runInteractionProofPipeline({ ...input, simulateDeadButton: true });
    const failPipeline = runAutonomousDebuggingPipeline({ ...input, interactionProof: deadInteraction });
    const failGate = evaluateLivePreviewAutonomousDebuggingGate(failPipeline);
    assert(
      'autonomous-debugging-live-preview-gate',
      'resolved dead button unlocks',
      failGate.unlocked || failPipeline.permissionVerdict === 'READY_FOR_PREVIEW',
      failPipeline.permissionVerdict,
    );
    const orchestrator = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
    assert(
      'autonomous-debugging-live-preview-gate',
      'orchestrator gate',
      orchestrator.includes('evaluateLivePreviewAutonomousDebuggingGate'),
      'orchestrator',
    );
  }

  if (include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const deadInteraction = runInteractionProofPipeline({ ...input, simulateDeadButton: true });
    const deadButton = runAutonomousDebuggingPipeline({ ...input, interactionProof: deadInteraction });
    assert(
      'autonomous-debugging-engine',
      'scenario dead button repair',
      deadButton.repairLoops.some((l) => l.resolved),
      deadButton.permissionVerdict,
    );
    const dataFix = runAutonomousDebuggingPipeline({ ...input, simulateDataNotSaved: true });
    assert(
      'autonomous-debugging-engine',
      'scenario data save repair',
      dataFix.repairLoops.some((l) => l.resolved),
      dataFix.permissionVerdict,
    );
    const clipped = runAutonomousDebuggingPipeline({ ...input, simulateClippedButton: true });
    assert(
      'autonomous-debugging-engine',
      'scenario clipped button repair',
      clipped.repairLoops.some((l) => l.resolved),
      clipped.permissionVerdict,
    );
    const promptBlock = runAutonomousDebuggingPipeline({ ...input, simulatePromptDriftRepair: true });
    assert(
      'autonomous-debugging-engine',
      'scenario prompt drift block',
      promptBlock.humanReview !== null,
      promptBlock.permissionVerdict,
    );
    const exhausted = runAutonomousDebuggingPipeline({ ...input, simulateRepairExhaustion: true, simulateDataNotSaved: true });
    assert(
      'autonomous-debugging-engine',
      'scenario repair exhaustion',
      exhausted.humanReview !== null,
      exhausted.permissionVerdict,
    );
    const regression = runAutonomousDebuggingPipeline({
      ...input,
      simulateDataNotSaved: true,
      simulateRegressionAfterRepair: true,
    });
    assert(
      'autonomous-debugging-engine',
      'scenario regression after repair',
      regression.permissionVerdict !== 'READY_FOR_PREVIEW',
      regression.permissionVerdict,
    );
  }

  const allPassed = checks.every((c) => c.passed);
  return { checks, allPassed };
}

export function printAutonomousDebuggingValidationResults(
  checks: ValidationCheck[],
  label = 'validate:autonomous-debugging-engine',
): void {
  const failed = checks.filter((c) => !c.passed);
  for (const check of checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} [${check.section}] ${check.name}: ${check.detail}`);
  }
  console.log(`\n${label}: ${failed.length ? 'FAILED' : 'PASSED'} (${checks.length} checks, ${failed.length} failed)`);
  if (failed.length) {
    process.exit(1);
  }
  console.log('\nAUTONOMOUS_DEBUGGING_ENGINE_V1_PASS');
}
