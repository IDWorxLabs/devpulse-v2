/**
 * AEE Preview Recovery Loop V1 — regression validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBehaviorSimulationPipeline } from '../src/behavior-simulation-engine/index.js';
import { runCapabilityPlanningPipeline } from '../src/capability-planning-engine/index.js';
import { runIncrementalBuildPipeline } from '../src/incremental-autonomous-builder/index.js';
import { runInteractionProofPipeline } from '../src/interaction-proof-engine/index.js';
import { runLaunchReadinessAuthorityPipeline } from '../src/launch-readiness-authority-v2/index.js';
import { evaluateLivePreviewGateForOrchestrator } from '../src/live-preview-gate/live-preview-orchestrator-bridge.js';
import { runAutonomousDebuggingPipeline } from '../src/autonomous-debugging-engine/index.js';
import { runContinuousImprovementPipeline } from '../src/continuous-product-improvement-engine/index.js';
import { runVirtualDevicePipeline } from '../src/virtual-device-laboratory/index.js';
import { runVirtualUserPipeline } from '../src/virtual-user-engine/index.js';
import {
  AEE_PREVIEW_RECOVERY_LOOP_V1_PASS_TOKEN,
  AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS,
  detectMissingCapabilityRecoveryRequired,
  evaluateAeeExecutiveDecision,
  isPreviewRecoveryEligible,
  runAeePreviewRecoveryLoop,
} from '../src/autonomous-engineering-executive/index.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { UNIVERSAL_BUILD_PIPELINE_MATRIX } from '../src/universal-build-pipeline-verification/universal-build-pipeline-matrix.js';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function buildPipelinesForPrompt(rawPrompt: string) {
  const buildPlan = resolvePromptFaithfulBuildPlan(rawPrompt);
  const eraBase = {
    rawPrompt,
    productIntelligenceModel: buildPlan.productIntelligenceModel,
    promptFaithfulness: buildPlan.promptFaithfulness,
    capabilityPlanning: buildPlan.capabilityPlanning,
  };
  const incrementalBuild = runIncrementalBuildPipeline(eraBase);
  const behaviorSimulation = runBehaviorSimulationPipeline({ ...eraBase, incrementalBuild });
  const virtualUserSimulation = runVirtualUserPipeline({
    ...eraBase,
    incrementalBuild,
    behaviorSimulation,
  });
  const virtualDeviceLaboratory = runVirtualDevicePipeline({
    ...eraBase,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
  });
  const interactionProof = runInteractionProofPipeline({
    ...eraBase,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
    simulateDeadButton: true,
  });
  const autonomousDebugging = runAutonomousDebuggingPipeline({
    ...eraBase,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
    interactionProof,
  });
  const continuousImprovement = runContinuousImprovementPipeline({
    ...eraBase,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
    interactionProof,
    autonomousDebugging,
  });
  const launchReadiness = runLaunchReadinessAuthorityPipeline({
    rawPrompt,
    productIntelligenceModel: buildPlan.productIntelligenceModel,
    promptFaithfulness: buildPlan.promptFaithfulness,
    capabilityPlanning: buildPlan.capabilityPlanning,
    incrementalBuild,
    behaviorSimulation,
    virtualUserSimulation,
    virtualDeviceLaboratory,
    interactionProof,
    autonomousDebugging,
    continuousImprovement,
  });

  return {
    buildPlan,
    pipelines: {
      productIntelligenceModel: buildPlan.productIntelligenceModel,
      promptFaithfulness: buildPlan.promptFaithfulness,
      capabilityPlanning: buildPlan.capabilityPlanning,
      incrementalBuild,
      behaviorSimulation,
      virtualUserSimulation,
      virtualDeviceLaboratory,
      interactionProof,
      autonomousDebugging,
      continuousImprovement,
      launchReadiness,
    },
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('AEE Preview Recovery Loop V1 — Validation');
  console.log('==========================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const orchestrator = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  const decisionEngine = readFileSync(
    join(ROOT, 'src/autonomous-engineering-executive/aee-decision-engine.ts'),
    'utf8',
  );

  assert(
    '01. package script',
    Boolean(pkg.scripts?.['validate:aee-preview-recovery-loop']),
    'script',
  );
  assert(
    '02. recovery loop module',
    existsSync(join(ROOT, 'src/autonomous-engineering-executive/aee-preview-recovery-loop.ts')),
    'module',
  );
  assert('03. orchestrator wires recovery loop', orchestrator.includes('runAeePreviewRecoveryLoop'), 'wired');
  assert(
    '04. decision engine preview recovery',
    decisionEngine.includes('previewRecoveryAttempts'),
    'decision engine',
  );
  assert(
    '05. orchestrator degraded success path',
    orchestrator.includes("previewState: livePreviewAvailable ? 'PREVIEW_READY' : 'PREVIEW_BLOCKED'"),
    'degraded session',
  );
  assert(
    '06. not LISA-only module name',
    !readFileSync(join(ROOT, 'src/autonomous-engineering-executive/aee-preview-recovery-loop.ts'), 'utf8').includes(
      'LISA',
    ),
    'generic module',
  );

  const categories = UNIVERSAL_BUILD_PIPELINE_MATRIX.filter(
    (entry) => !entry.isLisaRegression && entry.categoryId !== 'lisa-assistive-regression',
  ).slice(0, 4);

  for (const entry of categories) {
    assert(
      `07.${entry.categoryId} preview recovery eligible after build pass`,
      isPreviewRecoveryEligible({ npmBuildOk: true, livePreviewAvailable: false, devServerRunning: true }),
      entry.categoryId,
    );
  }

  const recipeEntry =
    UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === 'recipe-planner') ??
    categories[0]!;
  const { buildPlan, pipelines } = buildPipelinesForPrompt(recipeEntry.prompt);
  const gateBridge = evaluateLivePreviewGateForOrchestrator({
    rawPrompt: recipeEntry.prompt,
    previewUrl: 'http://127.0.0.1:5173',
    generationComplete: true,
    ...pipelines,
  });

  assert(
    '08. locked gate fixture',
    !gateBridge.livePreviewAvailable,
    gateBridge.gateSummary.slice(0, 80),
  );

  const recovery = await runAeePreviewRecoveryLoop({
    rawPrompt: recipeEntry.prompt,
    projectId: 'aee-preview-recovery-validation',
    workspaceDir: join(ROOT, '.generated-builder-workspaces', 'aee-preview-recovery-validation'),
    npmBuildOk: true,
    devServerUrl: 'http://127.0.0.1:5173',
    gateBridge,
    pipelines,
    maxAttempts: AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS,
    simulatePreviewRecoveryRepair: true,
  });

  assert('09. recovery attempts bounded', recovery.attempts.length <= AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS, String(recovery.attempts.length));
  assert(
    '10. recovery runs autonomous debugging',
    recovery.attempts.some((attempt) => attempt.phases.includes('AUTONOMOUS_DEBUGGING')),
    'debugging phase',
  );
  assert(
    '11. recovery reevaluates gate',
    recovery.attempts.some((attempt) => attempt.phases.includes('GATE_REEVALUATION')),
    'gate phase',
  );
  assert('12. recovery summary present', recovery.summary.includes('AEE_PREVIEW_RECOVERY_LOOP_V1'), recovery.summary);

  const capabilityDetect = detectMissingCapabilityRecoveryRequired({
    gateBlockedBy: 'CAPABILITY_PLANNING',
    capabilityPlanningVerdict: buildPlan.capabilityPlanning.permissionVerdict,
    failureReason: gateBridge.failureReason,
  });
  assert('13. capability detection', capabilityDetect, 'capability planning');

  const previewDecision = evaluateAeeExecutiveDecision({
    workspaceDir: join(ROOT, '.generated-builder-workspaces', 'aee-preview-recovery-validation'),
    buildPlan,
    rawPrompt: recipeEntry.prompt,
    projectId: 'aee-preview-recovery-validation',
    projectName: 'Preview Recovery Validation',
    aseBlockers: [],
    aseMaterializationAuthorized: true,
    manifestFaithfulness: { status: 'PASS', score: 92 },
    generatedFileCount: 48,
    npmInstallOk: true,
    npmBuildOk: true,
    previewOk: false,
    previewDegraded: true,
    previewRecoveryAttempts: 0,
  });
  assert(
    '14. AEE REPAIR decision after build pass preview lock',
    previewDecision.decision === 'REPAIR',
    previewDecision.decision,
  );
  assert(
    '15. exhausted recovery does not require manual debugging string in summary',
    !recovery.summary.includes('Run Autonomous Debugging'),
    recovery.summary.slice(0, 80),
  );

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  for (const r of results) {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name} — ${r.detail}`);
  }
  console.log('');
  console.log(`${passed}/${total} checks passed`);
  if (passed === total) {
    console.log(AEE_PREVIEW_RECOVERY_LOOP_V1_PASS_TOKEN);
    process.exit(0);
  }
  process.exit(1);
}

void main();
