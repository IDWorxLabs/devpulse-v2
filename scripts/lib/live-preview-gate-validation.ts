/**
 * Live Preview Gate — shared validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAutonomousDebuggingPipeline } from '../../src/autonomous-debugging-engine/index.js';
import { runBehaviorSimulationPipeline } from '../../src/behavior-simulation-engine/index.js';
import { runCapabilityPlanningPipeline } from '../../src/capability-planning-engine/index.js';
import { runIncrementalBuildPipeline } from '../../src/incremental-autonomous-builder/index.js';
import { runIntentUnderstandingEngine } from '../../src/intent-understanding-engine/index.js';
import { runPromptFaithfulnessEngineV2 } from '../../src/prompt-faithfulness-engine-v2/index.js';
import { runInteractionProofPipeline } from '../../src/interaction-proof-engine/index.js';
import { runContinuousImprovementPipeline } from '../../src/continuous-product-improvement-engine/index.js';
import { runVirtualUserPipeline } from '../../src/virtual-user-engine/index.js';
import { runVirtualDevicePipeline } from '../../src/virtual-device-laboratory/index.js';
import { runLaunchReadinessAuthorityPipeline } from '../../src/launch-readiness-authority-v2/index.js';
import {
  buildLivePreviewStatusCard,
  collectLivePreviewEvidence,
  evaluateLivePreviewGate,
  evaluateLivePreviewGateForOrchestrator,
  evaluateLivePreviewGates,
  explainLivePreviewBlocker,
  getDevPulseV2LivePreviewGate,
  getLatestLivePreviewTransition,
  getLivePreviewGatePassToken,
  isLivePreviewGateUnlocked,
  mapUnlockVerdict,
  resolveLaunchReadinessForGate,
  resolveLivePreviewLockState,
  resetLivePreviewGateModuleForTests,
} from '../../src/live-preview-gate/index.js';
import { EXPENSE_PROMPT } from './prompt-faithfulness-v2-validation.js';
import { PAYMENT_PROMPT } from './launch-readiness-authority-v2-validation.js';

export const EXPENSE_CREATE_PROMPT =
  'Build a business expense tracker with create expense workflow, edit, delete, export, and reporting.';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/live-preview-gate');

export const REQUIRED_FILES = [
  'live-preview-gate-types.ts',
  'live-preview-gate-registry.ts',
  'live-preview-evidence-collector.ts',
  'live-preview-gate-evaluator.ts',
  'live-preview-lock-state.ts',
  'live-preview-unlock-authority.ts',
  'live-preview-blocker-explainer.ts',
  'live-preview-status-card.ts',
  'live-preview-transition-log.ts',
  'live-preview-report-builder.ts',
  'live-preview-history.ts',
  'live-preview-orchestrator-bridge.ts',
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
  const continuousImprovement = runContinuousImprovementPipeline({
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
  });
  const launchReadiness = runLaunchReadinessAuthorityPipeline({
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
    continuousImprovement,
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
    continuousImprovement,
    launchReadiness,
  };
}

export function runLivePreviewGateValidation(sections?: string[]): {
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

  resetLivePreviewGateModuleForTests();

  if (include('live-preview-gate') || include('all')) {
    for (const file of REQUIRED_FILES) {
      assert('live-preview-gate', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
    }
    const registry = getDevPulseV2LivePreviewGate();
    assert('live-preview-gate', 'pass token', registry.passToken === 'LIVE_PREVIEW_GATE_V1_PASS', registry.passToken);
    assert('live-preview-gate', 'phase 13', registry.phase === 13, String(registry.phase));
    assert(
      'live-preview-gate',
      'pass token helper',
      getLivePreviewGatePassToken() === 'LIVE_PREVIEW_GATE_V1_PASS',
      getLivePreviewGatePassToken(),
    );
  }

  if (include('live-preview-evidence-collection') || include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const launch = resolveLaunchReadinessForGate({ rawPrompt: EXPENSE_PROMPT, ...input });
    const evidence = collectLivePreviewEvidence({ gateInput: { rawPrompt: EXPENSE_PROMPT, ...input }, launchReadiness: launch });
    assert(
      'live-preview-evidence-collection',
      'sources collected',
      evidence.items.length >= 18,
      String(evidence.items.length),
    );
    assert(
      'live-preview-evidence-collection',
      'launch authority evidence',
      evidence.items.some((i) => i.source === 'LAUNCH_READINESS_AUTHORITY_V2'),
      'launch',
    );
    assert(
      'live-preview-evidence-collection',
      'traceability links',
      evidence.items.every((i) => i.traceabilityLinks.length >= 0),
      'links',
    );
  }

  if (include('live-preview-gate-evaluation') || include('all')) {
    const ready = evaluateLivePreviewGate({ rawPrompt: EXPENSE_PROMPT, generationComplete: true, previewUrl: 'http://localhost:5173' });
    assert(
      'live-preview-gate-evaluation',
      'expense unlock',
      ready.unlockVerdict === 'PREVIEW_UNLOCKED',
      ready.unlockVerdict,
    );
    const blocked = evaluateLivePreviewGate({
      rawPrompt: EXPENSE_CREATE_PROMPT,
      generationComplete: true,
      simulateBehaviorFailure: true,
    });
    assert(
      'live-preview-gate-evaluation',
      'behavior failure locked',
      blocked.unlockVerdict === 'PREVIEW_LOCKED_AUTONOMOUS_REPAIR',
      blocked.unlockVerdict,
    );
  }

  if (include('live-preview-lock-state') || include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const launch = resolveLaunchReadinessForGate({ rawPrompt: EXPENSE_PROMPT, ...input });
    const evidence = collectLivePreviewEvidence({ gateInput: { rawPrompt: EXPENSE_PROMPT }, launchReadiness: launch });
    const evaluation = evaluateLivePreviewGates(evidence);
    const verdict = mapUnlockVerdict({ evaluation, launchReadiness: launch, evidenceIncomplete: false });
    const state = resolveLivePreviewLockState({
      generationComplete: true,
      evaluation,
      launchReadiness: launch,
      unlockVerdict: verdict,
      previousLockState: null,
      isRegressionRelock: false,
    });
    assert('live-preview-lock-state', 'ready state', state === 'UNLOCKED_PREVIEW_READY', state);
  }

  if (include('live-preview-unlock-authority') || include('all')) {
    const ready = evaluateLivePreviewGate({ rawPrompt: EXPENSE_PROMPT, generationComplete: true });
    assert(
      'live-preview-unlock-authority',
      'decision id',
      ready.unlockDecision.decisionId.length > 0,
      ready.unlockDecision.decisionId,
    );
    assert(
      'live-preview-unlock-authority',
      'preview available',
      ready.isPreviewAvailable && isLivePreviewGateUnlocked(ready),
      String(ready.isPreviewAvailable),
    );
  }

  if (include('live-preview-blocker-explanation') || include('all')) {
    const blocked = evaluateLivePreviewGate({
      rawPrompt: EXPENSE_CREATE_PROMPT,
      generationComplete: true,
      simulateBehaviorFailure: true,
    });
    assert(
      'live-preview-blocker-explanation',
      'not vague',
      blocked.blockerExplanation.summary.length > 30 &&
        !/^preview unavailable\.?$/i.test(blocked.blockerExplanation.summary),
      blocked.blockerExplanation.summary.slice(0, 80),
    );
    assert(
      'live-preview-blocker-explanation',
      'next action',
      blocked.blockerExplanation.nextSystemAction.length > 10,
      blocked.blockerExplanation.nextSystemAction,
    );
  }

  if (include('live-preview-status-card') || include('all')) {
    const ready = evaluateLivePreviewGate({ rawPrompt: EXPENSE_PROMPT, generationComplete: true });
    assert(
      'live-preview-status-card',
      'status card',
      ready.statusCard.passedGates.length >= 10,
      String(ready.statusCard.passedGates.length),
    );
    assert(
      'live-preview-status-card',
      'launch verdict on card',
      ready.statusCard.launchReadinessVerdict === 'LAUNCH_READY',
      ready.statusCard.launchReadinessVerdict,
    );
    const card = buildLivePreviewStatusCard({
      lockState: ready.state,
      unlockVerdict: ready.unlockVerdict,
      evaluation: evaluateLivePreviewGates(ready.evidenceSummary),
      launchReadiness: resolveLaunchReadinessForGate({ rawPrompt: EXPENSE_PROMPT, launchReadiness: undefined }),
      recommendedNextStep: ready.recommendedNextStep,
    });
    assert('live-preview-status-card', 'progress', card.overallProgress > 0, String(card.overallProgress));
  }

  if (include('live-preview-transition-log') || include('all')) {
    resetLivePreviewGateModuleForTests();
    evaluateLivePreviewGate({ rawPrompt: EXPENSE_PROMPT, generationComplete: true });
    evaluateLivePreviewGate({
      rawPrompt: EXPENSE_CREATE_PROMPT,
      generationComplete: true,
      simulateBehaviorFailure: true,
      previousLockState: 'UNLOCKED_PREVIEW_READY',
    });
    const latest = getLatestLivePreviewTransition();
    assert('live-preview-transition-log', 'transition recorded', Boolean(latest), latest?.transitionId ?? 'missing');
  }

  if (include('live-preview-orchestrator-bridge') || include('all')) {
    const input = eraInput(EXPENSE_PROMPT);
    const bridge = evaluateLivePreviewGateForOrchestrator({
      ...input,
      previewUrl: 'http://localhost:5173',
      generationComplete: true,
    });
    assert(
      'live-preview-orchestrator-bridge',
      'orchestrator unlocked',
      bridge.livePreviewAvailable,
      bridge.gate.unlockVerdict,
    );
    const orchestrator = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
    assert(
      'live-preview-orchestrator-bridge',
      'orchestrator integrated',
      orchestrator.includes('evaluateLivePreviewGateForOrchestrator'),
      'integrated',
    );
  }

  if (include('live-preview-founder-integration') || include('all')) {
    const ready = evaluateLivePreviewGate({ rawPrompt: EXPENSE_PROMPT, generationComplete: true });
    const founder = ready.evidenceSummary.items.find((i) => i.source === 'FOUNDER_TEST');
    assert('live-preview-founder-integration', 'founder evidence', Boolean(founder), founder?.sourceName ?? 'missing');
    assert(
      'live-preview-founder-integration',
      'founder cannot unlock alone',
      ready.unlockVerdict === 'PREVIEW_UNLOCKED' || !ready.isPreviewAvailable,
      ready.unlockVerdict,
    );
    const registry = readFileSync(join(MODULE_DIR, 'live-preview-gate-registry.ts'), 'utf8');
    assert(
      'live-preview-founder-integration',
      'founder registration',
      registry.includes('registerLivePreviewGateWithFounderTest'),
      'registry',
    );
  }

  if (include('live-preview-uvl-integration') || include('all')) {
    const ready = evaluateLivePreviewGate({ rawPrompt: EXPENSE_PROMPT, generationComplete: true });
    const uvl = ready.evidenceSummary.items.find((i) => i.source === 'UVL');
    assert('live-preview-uvl-integration', 'uvl evidence', Boolean(uvl), uvl?.sourceName ?? 'missing');
    const registry = readFileSync(join(MODULE_DIR, 'live-preview-gate-registry.ts'), 'utf8');
    assert(
      'live-preview-uvl-integration',
      'uvl registration',
      registry.includes('registerLivePreviewGateWithUvl'),
      'registry',
    );
  }

  if (include('live-preview-limited-mode') || include('all')) {
    const limited = evaluateLivePreviewGate({
      rawPrompt: PAYMENT_PROMPT,
      generationComplete: true,
      allowLimitedPreviewWhenSafe: true,
    });
    assert(
      'live-preview-limited-mode',
      'human review locked by default',
      limited.state === 'LOCKED_HUMAN_REVIEW_REQUIRED' || limited.isLimitedPreview,
      limited.state,
    );
  }

  if (include('live-preview-regression-relock') || include('all')) {
    resetLivePreviewGateModuleForTests();
    evaluateLivePreviewGate({
      rawPrompt: EXPENSE_PROMPT,
      generationComplete: true,
      previewUrl: 'http://localhost:5173',
    });
    const relock = evaluateLivePreviewGate({
      rawPrompt: EXPENSE_PROMPT,
      generationComplete: true,
      previousLockState: 'UNLOCKED_PREVIEW_READY',
      simulateInteractionProofRegression: true,
    });
    assert(
      'live-preview-regression-relock',
      'relocked',
      relock.state === 'LOCKED_AUTONOMOUS_REPAIR' && !relock.isPreviewAvailable,
      relock.state,
    );
    const transition = getLatestLivePreviewTransition();
    assert(
      'live-preview-regression-relock',
      'transition reason',
      Boolean(transition && transition.previousState === 'UNLOCKED_PREVIEW_READY'),
      transition?.reason.slice(0, 60) ?? 'missing',
    );
  }

  if (include('live-preview-api-contract') || include('all')) {
    const ready = evaluateLivePreviewGate({
      rawPrompt: EXPENSE_PROMPT,
      generationComplete: true,
      previewUrl: 'http://localhost:5173',
    });
    assert('live-preview-api-contract', 'state', Boolean(ready.state), ready.state);
    assert('live-preview-api-contract', 'unlockVerdict', Boolean(ready.unlockVerdict), ready.unlockVerdict);
    assert('live-preview-api-contract', 'statusCard', Boolean(ready.statusCard), 'card');
    assert('live-preview-api-contract', 'transitionLog', Array.isArray(ready.transitionLog), 'log');
    assert('live-preview-api-contract', 'evidenceSummary', Boolean(ready.evidenceSummary), 'evidence');
    assert('live-preview-api-contract', 'blockerExplanation', Boolean(ready.blockerExplanation.summary), 'explain');
    const types = readFileSync(join(MODULE_DIR, 'live-preview-gate-types.ts'), 'utf8');
    assert('live-preview-api-contract', 'result type', types.includes('LivePreviewGateResult'), 'type');
  }

  if (include('all')) {
    const ready = evaluateLivePreviewGate({
      rawPrompt: EXPENSE_PROMPT,
      generationComplete: true,
      previewUrl: 'http://localhost:5173',
    });
    assert(
      'live-preview-gate',
      'scenario fully ready',
      ready.unlockVerdict === 'PREVIEW_UNLOCKED' &&
        ready.state === 'UNLOCKED_PREVIEW_READY' &&
        ready.isPreviewAvailable,
      ready.unlockVerdict,
    );

    const behaviorFailure = evaluateLivePreviewGate({
      rawPrompt: EXPENSE_CREATE_PROMPT,
      generationComplete: true,
      simulateBehaviorFailure: true,
    });
    assert(
      'live-preview-gate',
      'scenario behavior failure',
      behaviorFailure.state === 'LOCKED_AUTONOMOUS_REPAIR' && !behaviorFailure.isPreviewAvailable,
      behaviorFailure.state,
    );

    const capabilityEvolution = evaluateLivePreviewGate({
      rawPrompt: EXPENSE_PROMPT,
      generationComplete: true,
      simulateUnresolvedCapability: true,
    });
    assert(
      'live-preview-gate',
      'scenario capability evolution',
      capabilityEvolution.state === 'LOCKED_CAPABILITY_EVOLUTION',
      capabilityEvolution.state,
    );

    const humanReview = evaluateLivePreviewGate({ rawPrompt: PAYMENT_PROMPT, generationComplete: true });
    assert(
      'live-preview-gate',
      'scenario human review',
      humanReview.state === 'LOCKED_HUMAN_REVIEW_REQUIRED',
      humanReview.state,
    );

    const evidenceIncomplete = evaluateLivePreviewGate({
      rawPrompt: EXPENSE_PROMPT,
      generationComplete: true,
      simulateMissingExecutionTraceEvidence: true,
    });
    assert(
      'live-preview-gate',
      'scenario evidence incomplete',
      evidenceIncomplete.unlockVerdict === 'PREVIEW_LOCKED_EVIDENCE_INCOMPLETE' && !evidenceIncomplete.isPreviewAvailable,
      evidenceIncomplete.unlockVerdict,
    );

    const explanation = explainLivePreviewBlocker({
      lockState: behaviorFailure.state,
      unlockVerdict: behaviorFailure.unlockVerdict,
      evaluation: evaluateLivePreviewGates(behaviorFailure.evidenceSummary),
      evidence: behaviorFailure.evidenceSummary,
      launchReadiness: resolveLaunchReadinessForGate({
        rawPrompt: EXPENSE_CREATE_PROMPT,
        simulateBehaviorFailure: true,
      }),
    });
    assert(
      'live-preview-gate',
      'blocker explanation quality',
      explanation.summary.length > 20,
      explanation.summary.slice(0, 60),
    );
  }

  const allPassed = checks.every((c) => c.passed);
  return { checks, allPassed };
}

export function printLivePreviewGateValidationResults(
  checks: ValidationCheck[],
  label = 'validate:live-preview-gate',
): void {
  const failed = checks.filter((c) => !c.passed);
  for (const check of checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} [${check.section}] ${check.name}: ${check.detail}`);
  }
  console.log(`\n${label}: ${failed.length ? 'FAILED' : 'PASSED'} (${checks.length} checks, ${failed.length} failed)`);
  if (failed.length) {
    process.exit(1);
  }
  console.log('\nLIVE_PREVIEW_GATE_V1_PASS');
}
