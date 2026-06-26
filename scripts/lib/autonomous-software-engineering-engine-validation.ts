/**
 * Autonomous Software Engineering Engine — shared validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ASE_STAGE_ORDER,
  AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_V1_PASS_TOKEN,
  appendAseTimelineEvent,
  buildAseGateResults,
  buildAseStatusCard,
  canProceedToStage,
  createAsePipelineState,
  deriveAseOverallStatus,
  getAseAuditLog,
  getAseEvidenceBus,
  getAseTimeline,
  getAutonomousSoftwareEngineeringPassToken,
  getDevPulseV2AutonomousSoftwareEngineeringEngine,
  getLatestAseEvidence,
  getResumeStartStage,
  getStageDefinition,
  planAseRoute,
  publishAseEvidence,
  recordAseAuditDecision,
  resetAutonomousSoftwareEngineeringEngineModuleForTests,
  routeAseCapabilityEvolution,
  routeAseFailure,
  routeAseLaunch,
  routeAseLivePreview,
  routeAseQualityLoop,
  routeAseRepair,
  runAutonomousSoftwareEngineeringPipeline,
  shouldSkipStageForResume,
  toAutonomousSoftwareEngineeringApiResult,
} from '../../src/autonomous-software-engineering-engine/index.js';
import { runCapabilityPlanningPipeline } from '../../src/capability-planning-engine/index.js';
import { runIncrementalBuildPipeline } from '../../src/incremental-autonomous-builder/index.js';
import { runBehaviorSimulationPipeline } from '../../src/behavior-simulation-engine/index.js';
import { runVirtualUserPipeline } from '../../src/virtual-user-engine/index.js';
import { runVirtualDevicePipeline } from '../../src/virtual-device-laboratory/index.js';
import { runIntentUnderstandingEngine } from '../../src/intent-understanding-engine/index.js';
import { runPromptFaithfulnessEngineV2 } from '../../src/prompt-faithfulness-engine-v2/index.js';
import { runAutonomousDebuggingPipeline } from '../../src/autonomous-debugging-engine/index.js';
import { runInteractionProofPipeline } from '../../src/interaction-proof-engine/index.js';
import { runMissingCapabilityEvolutionPipeline } from '../../src/missing-capability-evolution-engine/index.js';
import { getDevPulseV2Owner } from '../../src/foundation/ownership-registry.js';
import { CSV_EXPORT_PROMPT } from './capability-planning-v3-validation.js';
import { EXPENSE_PROMPT } from './prompt-faithfulness-v2-validation.js';
import { PAYMENT_PROMPT } from './launch-readiness-authority-v2-validation.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/autonomous-software-engineering-engine');

export const REQUIRED_FILES = [
  'ase-types.ts',
  'ase-registry.ts',
  'ase-pipeline-state.ts',
  'ase-stage-orchestrator.ts',
  'ase-gate-controller.ts',
  'ase-evidence-bus.ts',
  'ase-route-planner.ts',
  'ase-resume-controller.ts',
  'ase-failure-router.ts',
  'ase-repair-router.ts',
  'ase-capability-evolution-router.ts',
  'ase-quality-loop-router.ts',
  'ase-launch-router.ts',
  'ase-live-preview-router.ts',
  'ase-status-card.ts',
  'ase-timeline-builder.ts',
  'ase-audit-log.ts',
  'ase-report-builder.ts',
  'ase-authority.ts',
  'index.ts',
];

export interface ValidationCheck {
  section: string;
  name: string;
  passed: boolean;
  detail: string;
}

export function runAutonomousSoftwareEngineeringEngineValidation(sections?: string[]): {
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

  resetAutonomousSoftwareEngineeringEngineModuleForTests();

  if (include('autonomous-software-engineering-engine') || include('all')) {
    for (const file of REQUIRED_FILES) {
      assert(
        'autonomous-software-engineering-engine',
        `file ${file}`,
        existsSync(join(MODULE_DIR, file)),
        file,
      );
    }
    const registry = getDevPulseV2AutonomousSoftwareEngineeringEngine();
    assert(
      'autonomous-software-engineering-engine',
      'pass token',
      registry.passToken === AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_V1_PASS_TOKEN,
      registry.passToken,
    );
    assert('autonomous-software-engineering-engine', 'phase 14', registry.phase === 14, String(registry.phase));
    assert(
      'autonomous-software-engineering-engine',
      'pass token helper',
      getAutonomousSoftwareEngineeringPassToken() === AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_V1_PASS_TOKEN,
      getAutonomousSoftwareEngineeringPassToken(),
    );
    const owner = getDevPulseV2Owner('autonomous_software_engineering_engine');
    assert(
      'autonomous-software-engineering-engine',
      'ownership registry',
      owner?.phase === 14,
      owner?.ownerModule ?? 'missing',
    );
  }

  if (include('ase-pipeline-state') || include('all')) {
    const state = createAsePipelineState({ rawPrompt: EXPENSE_PROMPT, projectId: 'proj-1' });
    assert('ase-pipeline-state', 'run id', state.runId.startsWith('ase-run-'), state.runId);
    assert('ase-pipeline-state', 'prompt hash', state.promptHash.length === 16, state.promptHash);
    assert('ase-pipeline-state', 'initial status', state.overallStatus === 'RUNNING', state.overallStatus);
    assert(
      'ase-pipeline-state',
      'stage statuses seeded',
      ASE_STAGE_ORDER.every((s) => state.stageStatuses[s] === 'PENDING'),
      'pending',
    );
    assert(
      'ase-pipeline-state',
      'derive preview unlocked',
      deriveAseOverallStatus({
        launchReady: true,
        previewUnlocked: true,
        humanReview: false,
        blocked: false,
        repairing: false,
        evolving: false,
        improving: false,
      }) === 'PREVIEW_UNLOCKED',
      'PREVIEW_UNLOCKED',
    );
  }

  if (include('ase-stage-orchestrator') || include('all')) {
    const def = getStageDefinition('BEHAVIOR_SIMULATION');
    assert('ase-stage-orchestrator', 'stage definition', def.name.includes('Behavior'), def.name);
    assert(
      'ase-stage-orchestrator',
      'stage order',
      ASE_STAGE_ORDER.length === 13 && ASE_STAGE_ORDER[0] === 'INTENT_UNDERSTANDING',
      String(ASE_STAGE_ORDER.length),
    );
  }

  if (include('ase-gate-controller') || include('all')) {
    const stageResults = new Map<
      import('../../src/autonomous-software-engineering-engine/ase-types.js').AseStageId,
      import('../../src/autonomous-software-engineering-engine/ase-types.js').AseStageResult
    >();
    stageResults.set('INTENT_UNDERSTANDING', {
      readOnly: true,
      stageId: 'INTENT_UNDERSTANDING',
      status: 'PASSED',
      passed: true,
      blockedReason: null,
      evidenceId: 'ev-1',
      recoveryRoute: null,
    });
    const blocked = canProceedToStage('PROMPT_FAITHFULNESS', stageResults);
    assert('ase-gate-controller', 'faithfulness requires intent', blocked.allowed, String(blocked.allowed));
    stageResults.set('PROMPT_FAITHFULNESS', {
      readOnly: true,
      stageId: 'PROMPT_FAITHFULNESS',
      status: 'PASSED',
      passed: true,
      blockedReason: null,
      evidenceId: 'ev-2',
      recoveryRoute: null,
    });
    const allowed = canProceedToStage('CAPABILITY_PLANNING', stageResults);
    assert('ase-gate-controller', 'capability after faithfulness', allowed.allowed, String(allowed.allowed));
    const gates = buildAseGateResults(stageResults);
    assert('ase-gate-controller', 'gate results', gates.length === 13, String(gates.length));
  }

  if (include('ase-evidence-bus') || include('all')) {
    const record = publishAseEvidence({
      sourceStage: 'INTENT_UNDERSTANDING',
      evidenceType: 'TEST',
      status: 'PASS',
      confidence: 0.9,
      affectedRequirements: [],
      affectedFeatures: [],
      affectedCapabilities: [],
      affectedUsers: [],
      affectedDevices: [],
      affectedInteractions: [],
      artifacts: [],
      timestamp: Date.now(),
      blockers: [],
      warnings: [],
      recommendedNextStep: null,
    });
    assert('ase-evidence-bus', 'publish evidence', record.evidenceId.startsWith('ase-evidence-'), record.evidenceId);
    assert('ase-evidence-bus', 'bus length', getAseEvidenceBus().length >= 1, String(getAseEvidenceBus().length));
    assert(
      'ase-evidence-bus',
      'latest evidence',
      getLatestAseEvidence('INTENT_UNDERSTANDING')?.evidenceType === 'TEST',
      'TEST',
    );
  }

  if (include('ase-route-planner') || include('all')) {
    const route = planAseRoute({
      failedStage: 'INTERACTION_PROOF',
      stageResult: {
        readOnly: true,
        stageId: 'INTERACTION_PROOF',
        status: 'FAILED',
        passed: false,
        blockedReason: 'Save button has no handler',
        evidenceId: null,
        recoveryRoute: null,
      },
    });
    assert('ase-route-planner', 'interaction routes debugging', route.destination === 'AUTONOMOUS_DEBUGGING', route.destination);
  }

  if (include('ase-failure-router') || include('all')) {
    const capability = routeAseFailure({
      stageId: 'CAPABILITY_PLANNING',
      failure: 'CSV export capability missing',
      evidenceId: null,
    });
    assert(
      'ase-failure-router',
      'capability gap route',
      capability.destination === 'MISSING_CAPABILITY_EVOLUTION',
      capability.destination,
    );
    const payment = routeAseFailure({
      stageId: 'MISSING_CAPABILITY_EVOLUTION',
      failure: 'Payment capability requires unsafe evolution',
      evidenceId: null,
    });
    assert('ase-failure-router', 'payment human review', payment.destination === 'HUMAN_REVIEW', payment.destination);
  }

  if (include('ase-repair-router') || include('all')) {
    const intent = runIntentUnderstandingEngine({ rawPrompt: EXPENSE_PROMPT });
    const faithfulness = runPromptFaithfulnessEngineV2(EXPENSE_PROMPT, {
      generatedModules: intent.productIntelligenceModel.architecture.moduleIds,
    });
    const capabilityPlanning = runCapabilityPlanningPipeline({
      rawPrompt: EXPENSE_PROMPT,
      productIntelligenceModel: intent.productIntelligenceModel,
      promptFaithfulness: faithfulness,
    });
    const incrementalBuild = runIncrementalBuildPipeline({
      rawPrompt: EXPENSE_PROMPT,
      productIntelligenceModel: intent.productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
    });
    const behaviorSimulation = runBehaviorSimulationPipeline({
      rawPrompt: EXPENSE_PROMPT,
      productIntelligenceModel: intent.productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
      incrementalBuild,
    });
    const virtualUserSimulation = runVirtualUserPipeline({
      rawPrompt: EXPENSE_PROMPT,
      productIntelligenceModel: intent.productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
      incrementalBuild,
      behaviorSimulation,
    });
    const virtualDeviceLaboratory = runVirtualDevicePipeline({
      rawPrompt: EXPENSE_PROMPT,
      productIntelligenceModel: intent.productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
      incrementalBuild,
      behaviorSimulation,
      virtualUserSimulation,
    });
    const interactionProof = runInteractionProofPipeline({
      rawPrompt: EXPENSE_PROMPT,
      productIntelligenceModel: intent.productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
      incrementalBuild,
      behaviorSimulation,
      virtualUserSimulation,
      virtualDeviceLaboratory,
      simulateDeadButton: true,
    });
    const debugging = runAutonomousDebuggingPipeline({
      rawPrompt: EXPENSE_PROMPT,
      productIntelligenceModel: intent.productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
      incrementalBuild,
      behaviorSimulation,
      virtualUserSimulation,
      virtualDeviceLaboratory,
      interactionProof,
    });
    const repair = routeAseRepair({ autonomousDebugging: debugging, failedStage: 'INTERACTION_PROOF' });
    assert('ase-repair-router', 'repair attempted', repair.repairAttempted, String(repair.repairAttempted));
    assert('ase-repair-router', 'bounded loops', repair.bounded, String(repair.bounded));
  }

  if (include('ase-capability-evolution-router') || include('all')) {
    const intent = runIntentUnderstandingEngine({ rawPrompt: CSV_EXPORT_PROMPT });
    const faithfulness = runPromptFaithfulnessEngineV2(CSV_EXPORT_PROMPT, {
      generatedModules: intent.productIntelligenceModel.architecture.moduleIds,
    });
    const capabilityPlanning = runCapabilityPlanningPipeline({
      rawPrompt: CSV_EXPORT_PROMPT,
      productIntelligenceModel: intent.productIntelligenceModel,
      promptFaithfulness: faithfulness,
    });
    const evolution = runMissingCapabilityEvolutionPipeline({
      rawPrompt: CSV_EXPORT_PROMPT,
      productIntelligenceModel: intent.productIntelligenceModel,
      promptFaithfulness: faithfulness,
      capabilityPlanning,
    });
    const route = routeAseCapabilityEvolution({ capabilityPlanning, missingCapabilityEvolution: evolution });
    assert(
      'ase-capability-evolution-router',
      'evolution required for csv',
      route.evolutionRequired || capabilityPlanning.permissionVerdict === 'NEEDS_CAPABILITY_EVOLUTION',
      capabilityPlanning.permissionVerdict,
    );
  }

  if (include('ase-quality-loop-router') || include('all')) {
    const friction = runAutonomousSoftwareEngineeringPipeline({
      rawPrompt: 'Build LISA accessibility communication app with emergency speech.',
      simulateHighFrictionEmergency: true,
    });
    const route = routeAseQualityLoop({ continuousImprovement: friction.artifacts.continuousImprovement });
    assert(
      'ase-quality-loop-router',
      'improvement route',
      route.improvementRequired || friction.improvementLoops > 0,
      String(route.improvementRequired),
    );
  }

  if (include('ase-resume-controller') || include('all')) {
    assert(
      'ase-resume-controller',
      'resume start stage',
      getResumeStartStage('FEATURE_SLICE_STABILIZED') === 'BEHAVIOR_SIMULATION',
      getResumeStartStage('FEATURE_SLICE_STABILIZED'),
    );
    assert(
      'ase-resume-controller',
      'skip before resume',
      shouldSkipStageForResume('INTENT_UNDERSTANDING', 'FEATURE_SLICE_STABILIZED'),
      'skipped',
    );
    assert(
      'ase-resume-controller',
      'run after resume',
      !shouldSkipStageForResume('BEHAVIOR_SIMULATION', 'FEATURE_SLICE_STABILIZED'),
      'not skipped',
    );
  }

  if (include('ase-status-card') || include('all')) {
    const ready = runAutonomousSoftwareEngineeringPipeline({ rawPrompt: EXPENSE_PROMPT, previewUrl: 'http://localhost:5173' });
    const card = buildAseStatusCard({
      pipelineState: ready.pipelineState,
      overallStatus: ready.overallStatus,
      gateResults: ready.gates,
      launchVerdict: ready.launchReadiness.verdict.verdict,
      previewState: ready.livePreviewGate.state,
      nextAction: ready.nextAction,
      blockedGate: null,
      repairStatus: null,
      capabilityEvolutionStatus: null,
      improvementStatus: null,
      risk: 'LOW',
    });
    assert('ase-status-card', 'progress', card.overallProgress > 0, String(card.overallProgress));
    assert('ase-status-card', 'launch verdict', card.launchVerdict.length > 0, card.launchVerdict);
  }

  if (include('ase-timeline') || include('all')) {
    appendAseTimelineEvent({ label: 'Test event', stageId: 'INTENT_UNDERSTANDING' });
    assert('ase-timeline', 'timeline events', getAseTimeline().length >= 1, String(getAseTimeline().length));
  }

  if (include('ase-audit-log') || include('all')) {
    recordAseAuditDecision({
      stage: 'CAPABILITY_PLANNING',
      inputEvidence: ['evidence-1'],
      decision: 'PLAN',
      reason: 'Capability planning completed.',
      confidence: 0.8,
    });
    assert('ase-audit-log', 'audit entries', getAseAuditLog().length >= 1, String(getAseAuditLog().length));
  }

  if (include('ase-orchestrator-integration') || include('all')) {
    const orchestrator = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
    assert(
      'ase-orchestrator-integration',
      'delegates to ASE',
      orchestrator.includes('runAutonomousSoftwareEngineeringPipeline'),
      'ASE integration',
    );
    assert(
      'ase-orchestrator-integration',
      'uses materialization gate',
      orchestrator.includes('readyForMaterialization'),
      'materialization gate',
    );
  }

  if (include('ase-frontend-api-contract') || include('all')) {
    const ready = runAutonomousSoftwareEngineeringPipeline({ rawPrompt: EXPENSE_PROMPT, previewUrl: 'http://localhost:5173' });
    const api = toAutonomousSoftwareEngineeringApiResult(ready);
    assert('ase-frontend-api-contract', 'runId', api.runId === ready.runId, api.runId);
    assert('ase-frontend-api-contract', 'status card', api.statusCard.currentStage.length > 0, api.statusCard.currentStage);
    assert('ase-frontend-api-contract', 'timeline', api.timeline.length > 0, String(api.timeline.length));
    assert('ase-frontend-api-contract', 'gates', api.gates.length === 13, String(api.gates.length));
    assert('ase-frontend-api-contract', 'evidence summary', api.evidenceSummary.length > 0, String(api.evidenceSummary.length));
  }

  if (include('all')) {
    resetAutonomousSoftwareEngineeringEngineModuleForTests();

    const ready = runAutonomousSoftwareEngineeringPipeline({
      rawPrompt: EXPENSE_PROMPT,
      previewUrl: 'http://localhost:5173',
    });
    assert(
      'autonomous-software-engineering-engine',
      'scenario fully ready',
      ready.readyForPreview &&
        ready.launchReadiness.verdict.verdict === 'LAUNCH_READY' &&
        ready.timeline.length > 5 &&
        ready.auditLog.length > 0,
      ready.overallStatus,
    );

    resetAutonomousSoftwareEngineeringEngineModuleForTests();
    const capabilityGap = runAutonomousSoftwareEngineeringPipeline({ rawPrompt: CSV_EXPORT_PROMPT });
    assert(
      'autonomous-software-engineering-engine',
      'scenario capability gap route',
      capabilityGap.pipelineState.capabilityEvolutionLoops > 0 ||
        capabilityGap.timeline.some((e) => e.label.includes('Capability evolved')),
      String(capabilityGap.pipelineState.capabilityEvolutionLoops),
    );

    resetAutonomousSoftwareEngineeringEngineModuleForTests();
    const deadButton = runAutonomousSoftwareEngineeringPipeline({
      rawPrompt: EXPENSE_PROMPT,
      simulateDeadButton: true,
    });
    assert(
      'autonomous-software-engineering-engine',
      'scenario interaction failure route',
      deadButton.pipelineState.repairLoops > 0 &&
        deadButton.timeline.some((e) => e.label.includes('Repair')),
      String(deadButton.pipelineState.repairLoops),
    );

    resetAutonomousSoftwareEngineeringEngineModuleForTests();
    const friction = runAutonomousSoftwareEngineeringPipeline({
      rawPrompt: 'Build LISA accessibility communication app with emergency speech workflow.',
      simulateHighFrictionEmergency: true,
    });
    assert(
      'autonomous-software-engineering-engine',
      'scenario continuous improvement route',
      friction.pipelineState.improvementLoops > 0 ||
        friction.timeline.some((e) => e.label.includes('Improvement')),
      String(friction.pipelineState.improvementLoops),
    );

    resetAutonomousSoftwareEngineeringEngineModuleForTests();
    const humanReview = runAutonomousSoftwareEngineeringPipeline({ rawPrompt: PAYMENT_PROMPT });
    assert(
      'autonomous-software-engineering-engine',
      'scenario human review route',
      !humanReview.readyForPreview &&
        (humanReview.overallStatus === 'HUMAN_REVIEW_REQUIRED' ||
          humanReview.launchReadiness.verdict.verdict === 'NEEDS_HUMAN_REVIEW'),
      humanReview.overallStatus,
    );

    resetAutonomousSoftwareEngineeringEngineModuleForTests();
    const partial = runAutonomousSoftwareEngineeringPipeline({
      rawPrompt: EXPENSE_PROMPT,
      stopAfterStage: 'INCREMENTAL_BUILD',
    });
    const partialTimeline = partial.timeline.length;
    const resumed = runAutonomousSoftwareEngineeringPipeline({
      rawPrompt: EXPENSE_PROMPT,
      resumeState: partial.pipelineState,
      resumeFromBoundary: 'FEATURE_SLICE_STABILIZED',
      productIntelligenceModel: partial.artifacts.productIntelligenceModel,
      promptFaithfulness: partial.artifacts.promptFaithfulness,
      capabilityPlanning: partial.artifacts.capabilityPlanning,
      previewUrl: 'http://localhost:5173',
    });
    assert(
      'autonomous-software-engineering-engine',
      'scenario resume from boundary',
      resumed.timeline.length >= partialTimeline &&
        resumed.pipelineState.stageStatuses.INTENT_UNDERSTANDING !== 'RUNNING' &&
        resumed.readyForPreview,
      String(resumed.timeline.length),
    );

    const launchRoute = routeAseLaunch({ launchReadiness: ready.launchReadiness });
    const previewRoute = routeAseLivePreview({
      launchReadiness: ready.launchReadiness,
      livePreviewGate: ready.livePreviewGate,
    });
    assert(
      'autonomous-software-engineering-engine',
      'launch authority dependency',
      previewRoute.launchAuthorityDecides && previewRoute.previewGateDecides && !previewRoute.bypassAttempted,
      String(previewRoute.previewGateDecides),
    );
    assert(
      'autonomous-software-engineering-engine',
      'pass token emitted',
      getAutonomousSoftwareEngineeringPassToken() === AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_V1_PASS_TOKEN,
      AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_V1_PASS_TOKEN,
    );
  }

  const allPassed = checks.every((c) => c.passed);
  return { checks, allPassed };
}

export function printAutonomousSoftwareEngineeringEngineValidationResults(
  checks: ValidationCheck[],
  label = 'validate:autonomous-software-engineering-engine',
): void {
  const failed = checks.filter((c) => !c.passed);
  for (const check of checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} [${check.section}] ${check.name}: ${check.detail}`);
  }
  console.log(`\n${label}: ${failed.length ? 'FAILED' : 'PASSED'} (${checks.length} checks, ${failed.length} failed)`);
  if (allPassed(checks)) {
    console.log(`\n${AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_V1_PASS_TOKEN}`);
  }
  if (failed.length) {
    process.exit(1);
  }
}

function allPassed(checks: ValidationCheck[]): boolean {
  return checks.every((c) => c.passed);
}
