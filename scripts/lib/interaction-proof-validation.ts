/**
 * Interaction Proof Engine Era 3 Phase 8 — shared validation suite.
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
import { runVirtualDevicePipeline } from '../../src/virtual-device-laboratory/index.js';
import {
  buildLaunchInteractionProofEvidence,
  classifyInteractionFailure,
  discoverInteractionSurfaces,
  evaluateLivePreviewInteractionProofGate,
  executeInteractionEvent,
  getDevPulseV2InteractionProofEngine,
  isInteractionProofReadyForPreview,
  mapInteractionIntents,
  proveInteractionDeviceCoverage,
  proveInteractionReachability,
  recommendInteractionRepair,
  resetInteractionProofEngineModuleForTests,
  runInteractionProofPipeline,
  simulateInteractionProofImpactForFeatureSlice,
  verifyInteractionAccessibility,
  verifyInteractionHandler,
} from '../../src/interaction-proof-engine/index.js';
import { buildInteractionInventory } from '../../src/interaction-proof-engine/interaction-inventory-builder.js';
import { EXPENSE_PROMPT, LISA_PROMPT } from './prompt-faithfulness-v2-validation.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/interaction-proof-engine');

export const EXPENSE_RESPONSIVE_PROMPT =
  'Build a business expense tracker with create expense workflow, edit, delete, export, and reporting.';

export const REQUIRED_FILES = [
  'interaction-proof-types.ts',
  'interaction-proof-registry.ts',
  'interaction-surface-discovery.ts',
  'interaction-inventory-builder.ts',
  'interaction-intent-mapper.ts',
  'interaction-reachability-prover.ts',
  'interaction-event-executor.ts',
  'interaction-handler-verifier.ts',
  'interaction-state-effect-verifier.ts',
  'interaction-data-effect-verifier.ts',
  'interaction-ui-effect-verifier.ts',
  'interaction-accessibility-verifier.ts',
  'interaction-device-coverage.ts',
  'interaction-failure-classifier.ts',
  'interaction-repair-recommender.ts',
  'interaction-proof-authority.ts',
  'interaction-proof-report-builder.ts',
  'interaction-proof-history.ts',
  'interaction-proof-readiness.ts',
  'interaction-proof-live-preview-gate.ts',
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
  return {
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
  };
}

export function runInteractionProofValidation(sections?: string[]): {
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

  resetInteractionProofEngineModuleForTests();

  if (include('interaction-proof-engine') || include('all')) {
    for (const file of REQUIRED_FILES) {
      assert('interaction-proof-engine', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
    }
    const authority = getDevPulseV2InteractionProofEngine();
    assert(
      'interaction-proof-engine',
      'pass token',
      authority.passToken === 'INTERACTION_PROOF_ENGINE_V1_PASS',
      authority.passToken,
    );
    assert('interaction-proof-engine', 'phase 8', authority.phase === 8, String(authority.phase));
  }

  if (include('interaction-surface-discovery') || include('all')) {
    const expense = discoverInteractionSurfaces({ rawPrompt: EXPENSE_PROMPT });
    assert(
      'interaction-surface-discovery',
      'save button discovered',
      expense.some((s) => /save expense/i.test(s.label)),
      String(expense.length),
    );
    const lisa = discoverInteractionSurfaces({ rawPrompt: LISA_PROMPT });
    assert(
      'interaction-surface-discovery',
      'emergency phrase discovered',
      lisa.some((s) => /emergency phrase/i.test(s.label)),
      String(lisa.length),
    );
    const unknown = discoverInteractionSurfaces({ rawPrompt: EXPENSE_PROMPT, simulateUnknownInteraction: true });
    assert(
      'interaction-surface-discovery',
      'unknown interaction',
      unknown.some((s) => s.classification === 'UNKNOWN_INTERACTION'),
      'unknown',
    );
  }

  if (include('interaction-inventory-builder') || include('all')) {
    const surfaces = discoverInteractionSurfaces({ rawPrompt: EXPENSE_PROMPT });
    const input = eraInput(EXPENSE_PROMPT);
    const inventory = buildInteractionInventory({
      surfaces,
      behaviorSimulation: input.behaviorSimulation,
      virtualUserSimulation: input.virtualUserSimulation,
      virtualDeviceLaboratory: input.virtualDeviceLaboratory,
    });
    assert(
      'interaction-inventory-builder',
      'inventory complete',
      inventory.length === surfaces.length,
      String(inventory.length),
    );
    assert(
      'interaction-inventory-builder',
      'required classified',
      inventory.some((i) => i.classification === 'REQUIRED_INTERACTION'),
      'required',
    );
  }

  if (include('interaction-intent-mapping') || include('all')) {
    const surfaces = discoverInteractionSurfaces({ rawPrompt: EXPENSE_PROMPT });
    const intents = mapInteractionIntents(surfaces);
    const save = intents.find((m) => m.interactionId === surfaces.find((s) => /save/i.test(s.label))?.interactionId);
    assert('interaction-intent-mapping', 'save mapped', save?.mapped === true, save?.purpose ?? 'none');
    const unknownSurfaces = discoverInteractionSurfaces({ rawPrompt: EXPENSE_PROMPT, simulateUnknownInteraction: true });
    const unknownIntent = mapInteractionIntents(unknownSurfaces).find(
      (m) => m.interactionId === unknownSurfaces.find((s) => s.classification === 'UNKNOWN_INTERACTION')?.interactionId,
    );
    assert('interaction-intent-mapping', 'unknown unmapped', unknownIntent?.mapped === false, unknownIntent?.unmappedReason ?? 'none');
  }

  if (include('interaction-reachability-proof') || include('all')) {
    const input = eraInput(EXPENSE_RESPONSIVE_PROMPT);
    const save = discoverInteractionSurfaces({ rawPrompt: EXPENSE_RESPONSIVE_PROMPT }).find((s) => /save/i.test(s.label))!;
    const reachable = proveInteractionReachability({
      surface: save,
      virtualDeviceLaboratory: input.virtualDeviceLaboratory,
    });
    assert('interaction-reachability-proof', 'save reachable desktop', reachable, String(reachable));
    const phoneFail = proveInteractionReachability({
      surface: discoverInteractionSurfaces({ rawPrompt: EXPENSE_RESPONSIVE_PROMPT }).find((s) => /export/i.test(s.label))!,
      virtualDeviceLaboratory: input.virtualDeviceLaboratory,
      simulateDeviceSpecificFailure: true,
    });
    assert('interaction-reachability-proof', 'export phone fail', !phoneFail, String(phoneFail));
  }

  if (include('interaction-accessibility-proof') || include('all')) {
    const amount = discoverInteractionSurfaces({ rawPrompt: EXPENSE_PROMPT }).find((s) => s.elementType === 'INPUT')!;
    const ok = verifyInteractionAccessibility({ surface: amount });
    assert('interaction-accessibility-proof', 'labeled input passes', ok.passed, String(ok.passed));
    const missing = verifyInteractionAccessibility({ surface: amount, simulateMissingAccessibleName: true });
    assert(
      'interaction-accessibility-proof',
      'missing name fails',
      !missing.passed && !missing.accessibleNameExists,
      String(missing.passed),
    );
  }

  if (include('interaction-event-execution') || include('all')) {
    const save = discoverInteractionSurfaces({ rawPrompt: EXPENSE_PROMPT }).find((s) => /save/i.test(s.label))!;
    const event = executeInteractionEvent({ surface: save });
    assert('interaction-event-execution', 'event fires', event.executionResult, String(event.executionResult));
    const dead = executeInteractionEvent({ surface: save, simulateDeadButton: true });
    assert('interaction-event-execution', 'dead button fails', !dead.executionResult, String(dead.executionResult));
  }

  if (include('interaction-handler-verification') || include('all')) {
    const save = discoverInteractionSurfaces({ rawPrompt: EXPENSE_PROMPT }).find((s) => /save/i.test(s.label))!;
    const event = executeInteractionEvent({ surface: save });
    const handler = verifyInteractionHandler({ surface: save, eventProof: event });
    assert('interaction-handler-verification', 'handler executes', handler.handlerExecuted, String(handler.handlerExecuted));
    const deadEvent = executeInteractionEvent({ surface: save, simulateDeadButton: true });
    const deadHandler = verifyInteractionHandler({ surface: save, eventProof: deadEvent, simulateDeadButton: true });
    assert(
      'interaction-handler-verification',
      'dead handler not bound',
      !deadHandler.handlerBound,
      deadHandler.handlerBound ? 'bound' : 'HANDLER_NOT_BOUND',
    );
  }

  if (include('interaction-state-effect-proof') || include('all')) {
    const pipeline = runInteractionProofPipeline(eraInput(EXPENSE_PROMPT));
    const save = pipeline.proofResults.find((r) => /save/i.test(r.label));
    assert(
      'interaction-state-effect-proof',
      'save state effect',
      save?.effectProof.stateMatched === true,
      String(save?.effectProof.stateMatched),
    );
  }

  if (include('interaction-data-effect-proof') || include('all')) {
    const pipeline = runInteractionProofPipeline(eraInput(EXPENSE_PROMPT));
    const save = pipeline.proofResults.find((r) => /save/i.test(r.label));
    assert(
      'interaction-data-effect-proof',
      'save data effect',
      save?.effectProof.dataMatched === true,
      String(save?.effectProof.dataMatched),
    );
  }

  if (include('interaction-ui-effect-proof') || include('all')) {
    const pipeline = runInteractionProofPipeline(eraInput(EXPENSE_PROMPT));
    const save = pipeline.proofResults.find((r) => /save/i.test(r.label));
    assert(
      'interaction-ui-effect-proof',
      'save ui effect',
      save?.effectProof.uiMatched === true,
      String(save?.effectProof.uiMatched),
    );
  }

  if (include('interaction-device-coverage') || include('all')) {
    const input = eraInput(EXPENSE_RESPONSIVE_PROMPT);
    const exportSurface = discoverInteractionSurfaces({ rawPrompt: EXPENSE_RESPONSIVE_PROMPT }).find((s) =>
      /export/i.test(s.label),
    )!;
    const coverage = proveInteractionDeviceCoverage({
      surface: exportSurface,
      virtualDeviceLaboratory: input.virtualDeviceLaboratory,
      simulateDeviceSpecificFailure: true,
    });
    assert(
      'interaction-device-coverage',
      'phone export failure',
      coverage.some((c) => !c.passed),
      String(coverage.filter((c) => !c.passed).length),
    );
  }

  if (include('interaction-failure-classification') || include('all')) {
    const dead = runInteractionProofPipeline({ ...eraInput(EXPENSE_PROMPT), simulateDeadButton: true });
    const fail = dead.proofResults.find((r) => /save/i.test(r.label));
    assert(
      'interaction-failure-classification',
      'dead button classified',
      fail?.failure?.category === 'HANDLER_NOT_BOUND' || fail?.failure?.category === 'EVENT_NOT_FIRED',
      fail?.failure?.category ?? 'none',
    );
    const unknown = runInteractionProofPipeline({ ...eraInput(EXPENSE_PROMPT), simulateUnknownInteraction: true });
    const unknownFail = unknown.proofResults.find((r) => r.classification === 'UNKNOWN_INTERACTION');
    assert(
      'interaction-failure-classification',
      'unknown classified',
      unknownFail?.failure?.category === 'UNMAPPED_INTERACTION_INTENT',
      unknownFail?.failure?.category ?? 'none',
    );
    if (fail?.failure) {
      const classified = classifyInteractionFailure({
        record: dead.inventory.find((i) => i.interactionId === fail.interactionId)!,
        intent: dead.intentMappings.find((m) => m.interactionId === fail.interactionId)!,
        reachabilityPassed: fail.reachabilityPassed,
        accessibilityProof: fail.accessibilityProof,
        eventProof: fail.eventProof,
        handlerProof: fail.handlerProof,
        effectProof: fail.effectProof,
        deviceCoverage: fail.deviceCoverage,
        passed: false,
      });
      assert('interaction-failure-classification', 'category set', Boolean(classified?.category), classified?.category ?? 'none');
    }
  }

  if (include('interaction-repair-recommendation') || include('all')) {
    const dead = runInteractionProofPipeline({ ...eraInput(EXPENSE_PROMPT), simulateDeadButton: true });
    assert(
      'interaction-repair-recommendation',
      'repair produced',
      dead.proofResults.some((r) => r.repairRecommendation !== null),
      'repair',
    );
    const fail = dead.proofResults.find((r) => r.failure);
    if (fail?.failure) {
      const repair = recommendInteractionRepair(fail.failure);
      assert(
        'interaction-repair-recommendation',
        'validation required',
        repair.validationRequiredAfterRepair.includes('INTERACTION_PROOF'),
        repair.validationRequiredAfterRepair.join(','),
      );
    }
  }

  if (include('interaction-incremental-integration') || include('all')) {
    const stabilization = readFileSync(join(ROOT, 'src/incremental-autonomous-builder/feature-stabilization-gate.ts'), 'utf8');
    assert(
      'interaction-incremental-integration',
      'stabilization wired',
      stabilization.includes('interactionProofPassed'),
      'wired',
    );
    const incr = readFileSync(join(ROOT, 'src/incremental-autonomous-builder/incremental-build-orchestrator.ts'), 'utf8');
    assert(
      'interaction-incremental-integration',
      'orchestrator wired',
      incr.includes('simulateInteractionProofForFeatureSlice') ||
        incr.includes('simulateInteractionProofImpactForFeatureSlice'),
      'orchestrator',
    );
    const input = eraInput(EXPENSE_PROMPT);
    const sliceId = input.incrementalBuild.buildPlan.featureSlices[0]?.sliceId ?? 'slice-1';
    const impact = simulateInteractionProofImpactForFeatureSlice({
      sliceId,
      sliceName: 'expense-create',
      pipelineInput: input,
    });
    assert('interaction-incremental-integration', 'slice impact', typeof impact.passed === 'boolean', String(impact.passed));
  }

  if (include('interaction-launch-integration') || include('all')) {
    const buildPlan = resolvePromptFaithfulBuildPlan(EXPENSE_PROMPT);
    assert(
      'interaction-launch-integration',
      'eighth gate',
      buildPlan.interactionProof.ready,
      buildPlan.interactionProof.blockedReason ?? 'ready',
    );
    const founder = collectFounderLaunchEvidence({ productPrompt: EXPENSE_PROMPT });
    assert(
      'interaction-launch-integration',
      'AFLA source',
      founder.interactionProof?.available === true,
      founder.interactionProof?.sourceName ?? 'missing',
    );
    const pipeline = runInteractionProofPipeline(eraInput(EXPENSE_PROMPT));
    const evidence = buildLaunchInteractionProofEvidence(pipeline);
    assert('interaction-launch-integration', 'launch evidence', evidence.requiredCount >= 1, String(evidence.requiredCount));
    const verdict = readFileSync(join(ROOT, 'src/autonomous-founder-launch-authority/founder-verdict-engine.ts'), 'utf8');
    assert('interaction-launch-integration', 'verdict blocks', verdict.includes('Interaction Proof incomplete'), 'verdict');
  }

  if (include('interaction-live-preview-gate') || include('all')) {
    const passPipeline = runInteractionProofPipeline(eraInput(EXPENSE_PROMPT));
    const gate = evaluateLivePreviewInteractionProofGate(passPipeline);
    assert('interaction-live-preview-gate', 'unlocked on pass', gate.unlocked, String(gate.unlocked));
    assert('interaction-live-preview-gate', 'ready for preview', isInteractionProofReadyForPreview(passPipeline), 'ready');
    const failPipeline = runInteractionProofPipeline({ ...eraInput(EXPENSE_PROMPT), simulateDeadButton: true });
    const failGate = evaluateLivePreviewInteractionProofGate(failPipeline);
    assert('interaction-live-preview-gate', 'blocked on fail', !failGate.unlocked, failGate.blockedReason ?? 'blocked');
    assert('interaction-live-preview-gate', 'failure category', Boolean(failGate.failureCategory), failGate.failureCategory ?? 'none');
    const orchestrator = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
    assert('interaction-live-preview-gate', 'orchestrator gate', orchestrator.includes('evaluateLivePreviewInteractionProofGate'), 'orchestrator');
  }

  if (include('all')) {
    const expensePipeline = runInteractionProofPipeline(eraInput(EXPENSE_PROMPT));
    assert(
      'interaction-proof-engine',
      'scenario expense save pass',
      expensePipeline.proofResults.some((r) => /save/i.test(r.label) && r.passed),
      'save pass',
    );
    const lisaPipeline = runInteractionProofPipeline(eraInput(LISA_PROMPT));
    assert(
      'interaction-proof-engine',
      'scenario LISA emergency pass',
      lisaPipeline.proofResults.some((r) => /emergency/i.test(r.label) && r.passed),
      'emergency pass',
    );
    const missingLabel = runInteractionProofPipeline({
      ...eraInput(EXPENSE_PROMPT),
      simulateMissingAccessibleName: true,
    });
    assert(
      'interaction-proof-engine',
      'scenario missing accessible name',
      missingLabel.proofResults.some((r) => r.failure?.category === 'ACCESSIBLE_NAME_MISSING'),
      'ACCESSIBLE_NAME_MISSING',
    );
    const deviceFail = runInteractionProofPipeline({
      ...eraInput(EXPENSE_RESPONSIVE_PROMPT),
      simulateDeviceSpecificFailure: true,
    });
    assert(
      'interaction-proof-engine',
      'scenario device-specific failure',
      deviceFail.proofResults.some((r) => r.failure?.category === 'DEVICE_SPECIFIC_FAILURE'),
      'DEVICE_SPECIFIC_FAILURE',
    );
  }

  const allPassed = checks.every((c) => c.passed);
  return { checks, allPassed };
}

export function printInteractionProofValidationResults(
  checks: ValidationCheck[],
  label = 'validate:interaction-proof-engine',
): void {
  const failed = checks.filter((c) => !c.passed);
  for (const check of checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} [${check.section}] ${check.name}: ${check.detail}`);
  }
  console.log(`\n${label}: ${failed.length ? 'FAILED' : 'PASSED'} (${checks.length} checks, ${failed.length} failed)`);
  if (failed.length) {
    process.exit(1);
  }
  console.log('\nINTERACTION_PROOF_ENGINE_V1_PASS');
}
