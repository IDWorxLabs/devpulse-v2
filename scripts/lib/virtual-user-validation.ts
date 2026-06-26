/**
 * Virtual User Engine Era 3 Phase 6 — shared validation suite.
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
import {
  assessVirtualUserReadiness,
  buildLaunchVirtualUserEvidence,
  classifyVirtualUserFailure,
  discoverVirtualUserProfiles,
  evaluateLivePreviewVirtualUserGate,
  extractVirtualUserGoals,
  getDevPulseV2VirtualUserEngine,
  isVirtualUserSimulationReadyForPreview,
  planVirtualUserJourneys,
  resetVirtualUserEngineModuleForTests,
  runVirtualUserPipeline,
  simulateVirtualUserImpactForFeatureSlice,
} from '../../src/virtual-user-engine/index.js';
import { buildVirtualUserPersonas } from '../../src/virtual-user-engine/virtual-user-persona-builder.js';
import { analyzeVirtualUserFriction } from '../../src/virtual-user-engine/virtual-user-friction-analyzer.js';
import { analyzeVirtualUserAccessibility } from '../../src/virtual-user-engine/virtual-user-accessibility-analyzer.js';
import { recommendVirtualUserRepair } from '../../src/virtual-user-engine/virtual-user-repair-recommender.js';
import { verifyVirtualUserGoal } from '../../src/virtual-user-engine/virtual-user-goal-verifier.js';
import { EXPENSE_PROMPT, LISA_PROMPT } from './prompt-faithfulness-v2-validation.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/virtual-user-engine');

export const EXPENSE_OWNER_PROMPT =
  'Build a business expense tracker with create expense workflow, edit, delete, export, and reporting.';

export const REQUIRED_FILES = [
  'virtual-user-types.ts',
  'virtual-user-registry.ts',
  'virtual-user-profile-discovery.ts',
  'virtual-user-persona-builder.ts',
  'virtual-user-goal-extractor.ts',
  'virtual-user-journey-planner.ts',
  'virtual-user-executor.ts',
  'virtual-user-goal-verifier.ts',
  'virtual-user-friction-analyzer.ts',
  'virtual-user-accessibility-analyzer.ts',
  'virtual-user-failure-classifier.ts',
  'virtual-user-repair-recommender.ts',
  'virtual-user-authority.ts',
  'virtual-user-report-builder.ts',
  'virtual-user-history.ts',
  'virtual-user-readiness.ts',
  'virtual-user-live-preview-gate.ts',
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
  return {
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    capabilityPlanning,
    incrementalBuild,
    behaviorSimulation,
  };
}

export function runVirtualUserValidation(sections?: string[]): {
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

  resetVirtualUserEngineModuleForTests();

  if (include('virtual-user-engine') || include('all')) {
    for (const file of REQUIRED_FILES) {
      assert('virtual-user-engine', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
    }
    const authority = getDevPulseV2VirtualUserEngine();
    assert('virtual-user-engine', 'pass token', authority.passToken === 'VIRTUAL_USER_ENGINE_V1_PASS', authority.passToken);
    assert('virtual-user-engine', 'phase 6', authority.phase === 6, String(authority.phase));
  }

  if (include('virtual-user-profile-discovery') || include('all')) {
    const lisa = discoverVirtualUserProfiles({ rawPrompt: LISA_PROMPT });
    assert(
      'virtual-user-profile-discovery',
      'LISA patient',
      lisa.some((u) => /locked-in/i.test(u.role)),
      lisa.map((u) => u.role).join(', '),
    );
    const expense = discoverVirtualUserProfiles({ rawPrompt: EXPENSE_PROMPT });
    assert(
      'virtual-user-profile-discovery',
      'expense owner',
      expense.some((u) => /business owner/i.test(u.role)),
      expense.map((u) => u.role).join(', '),
    );
  }

  if (include('virtual-user-persona-builder') || include('all')) {
    const profiles = discoverVirtualUserProfiles({ rawPrompt: LISA_PROMPT });
    const personas = buildVirtualUserPersonas(profiles);
    const patient = personas.find((p) => p.requiredInputModes.some((m) => /BLINK/i.test(m)));
    assert('virtual-user-persona-builder', 'patient input modes', Boolean(patient), patient?.requiredInputModes.join(', ') ?? 'none');
    assert('virtual-user-persona-builder', 'attention budget', (patient?.attentionBudget ?? 0) <= 6, String(patient?.attentionBudget));
  }

  if (include('virtual-user-goal-extraction') || include('all')) {
    const input = eraInput(LISA_PROMPT);
    const profiles = discoverVirtualUserProfiles({ rawPrompt: input.rawPrompt });
    const goals = extractVirtualUserGoals({
      profiles,
      incrementalBuild: input.incrementalBuild,
      behaviorSimulation: input.behaviorSimulation,
    });
    assert('virtual-user-goal-extraction', 'patient goals', goals.some((g) => /emergency|communicate/i.test(g.description)), String(goals.length));
  }

  if (include('virtual-user-journey-planning') || include('all')) {
    const input = eraInput(EXPENSE_OWNER_PROMPT);
    const profiles = discoverVirtualUserProfiles({ rawPrompt: input.rawPrompt });
    const personas = buildVirtualUserPersonas(profiles);
    const goals = extractVirtualUserGoals({ profiles, incrementalBuild: input.incrementalBuild });
    const journeys = planVirtualUserJourneys({ goals, personas });
    const ownerJourney = journeys.find((j) => {
      const goal = goals.find((g) => g.goalId === j.goalId);
      return goal && /add expense/i.test(goal.description);
    });
    assert(
      'virtual-user-journey-planning',
      'owner full journey',
      Boolean(ownerJourney && ownerJourney.steps.some((s) => /edit/i.test(s)) && ownerJourney.steps.some((s) => /export/i.test(s))),
      ownerJourney?.steps.join(' -> ') ?? 'none',
    );
  }

  if (include('virtual-user-execution') || include('all')) {
    const pipeline = runVirtualUserPipeline(eraInput(LISA_PROMPT));
    assert(
      'virtual-user-execution',
      'journeys executed',
      pipeline.journeyResults.length > 0,
      String(pipeline.journeyResults.length),
    );
    assert(
      'virtual-user-execution',
      'step results recorded',
      pipeline.journeyResults.every((j) => j.stepResults.length > 0),
      'steps',
    );
  }

  if (include('virtual-user-goal-verification') || include('all')) {
    const pipeline = runVirtualUserPipeline(eraInput(LISA_PROMPT));
    const completed = pipeline.journeyResults.filter(
      (j) => j.completionStatus === 'COMPLETED' || j.completionStatus === 'COMPLETED_WITH_FRICTION',
    );
    assert('virtual-user-goal-verification', 'patient journey completes', completed.length > 0, String(completed.length));
    const firstResult = pipeline.journeyResults[0];
    if (firstResult && pipeline.goals[0] && pipeline.journeys[0]) {
      const status = verifyVirtualUserGoal({
        goal: pipeline.goals[0],
        journey: pipeline.journeys[0],
        stepResults: firstResult.stepResults,
        hasBlockingFriction: false,
        hasHighFriction: false,
      });
      assert('virtual-user-goal-verification', 'status enum', /COMPLETED|FAILED|BLOCKED/.test(status), status);
    } else {
      assert('virtual-user-goal-verification', 'status enum', false, 'no journey results');
    }
  }

  if (include('virtual-user-friction-analysis') || include('all')) {
    const tooMany = runVirtualUserPipeline({ ...eraInput(LISA_PROMPT), simulateTooManySteps: true });
    const emergencyFriction = tooMany.journeyResults.flatMap((j) => j.frictionEvents).find((f) => f.category === 'TOO_MANY_STEPS');
    assert(
      'virtual-user-friction-analysis',
      'too many steps',
      emergencyFriction?.severity === 'BLOCKING' || emergencyFriction?.severity === 'HIGH',
      emergencyFriction?.severity ?? 'none',
    );
    const missing = runVirtualUserPipeline({ ...eraInput(EXPENSE_OWNER_PROMPT), simulateMissingConfirmation: true });
    assert(
      'virtual-user-friction-analysis',
      'missing confirmation',
      missing.journeyResults.some((j) => j.frictionEvents.some((f) => f.category === 'NO_CONFIRMATION')),
      'confirmation',
    );
  }

  if (include('virtual-user-accessibility-analysis') || include('all')) {
    const blocked = runVirtualUserPipeline({ ...eraInput(LISA_PROMPT), simulateAccessibilityBlocker: true });
    const a11yFail = blocked.journeyResults.find((j) => j.failure?.category === 'ACCESSIBILITY_BLOCKER');
    assert('virtual-user-accessibility-analysis', 'accessibility blocker', Boolean(a11yFail), a11yFail?.failure?.category ?? 'none');
    const profiles = discoverVirtualUserProfiles({ rawPrompt: LISA_PROMPT });
    const personas = buildVirtualUserPersonas(profiles);
    const patient = personas.find((p) => p.requiredInputModes.some((m) => /BLINK/i.test(m)))!;
    const analysis = analyzeVirtualUserAccessibility({
      persona: patient,
      journey: { readOnly: true, journeyId: 'j1', userId: patient.userId, goalId: 'g1', steps: ['Navigate'], decisionPoints: [], expectedUiStates: [], expectedDataStates: [], expectedServiceEffects: [], accessibilityExpectations: [], maximumStepBudget: 5, maximumTimeBudgetMs: 30000, recoveryRules: [], completionCriteria: [] },
      stepResults: [{ readOnly: true, stepIndex: 0, step: 'Navigate', passed: false, behaviorScenarioId: null, detail: 'blocked' }],
      simulateAccessibilityBlocker: true,
    });
    assert('virtual-user-accessibility-analysis', 'analyzer blocks', !analysis.passed, analysis.blockers.join('; '));
  }

  if (include('virtual-user-failure-classification') || include('all')) {
    const blocked = runVirtualUserPipeline({ ...eraInput(LISA_PROMPT), simulateAccessibilityBlocker: true });
    const fail = blocked.journeyResults.find((j) => j.failure);
    assert('virtual-user-failure-classification', 'classified failure', Boolean(fail?.failure?.category), fail?.failure?.category ?? 'none');
    if (fail?.failure) {
      const classified = classifyVirtualUserFailure({
        goal: blocked.goals.find((g) => g.goalId === fail.goalId)!,
        journey: blocked.journeys.find((j) => j.journeyId === fail.journeyId)!,
        stepResults: fail.stepResults,
        frictionEvents: fail.frictionEvents,
        accessibilityBlockers: ['test'],
        completionStatus: fail.completionStatus,
      });
      assert('virtual-user-failure-classification', 'category set', classified?.category === 'ACCESSIBILITY_BLOCKER', classified?.category ?? 'none');
    }
  }

  if (include('virtual-user-repair-recommendation') || include('all')) {
    const blocked = runVirtualUserPipeline({ ...eraInput(LISA_PROMPT), simulateAccessibilityBlocker: true });
    assert(
      'virtual-user-repair-recommendation',
      'repair produced',
      blocked.journeyResults.some((j) => j.repairRecommendation !== null),
      'repair',
    );
    const fail = blocked.journeyResults.find((j) => j.failure);
    if (fail?.failure) {
      const repair = recommendVirtualUserRepair(fail.failure);
      assert('virtual-user-repair-recommendation', 'validation required', repair.validationRequiredAfterRepair.includes('VIRTUAL_USER_SIMULATION'), repair.validationRequiredAfterRepair.join(','));
    }
  }

  if (include('virtual-user-incremental-integration') || include('all')) {
    const stabilization = readFileSync(join(ROOT, 'src/incremental-autonomous-builder/feature-stabilization-gate.ts'), 'utf8');
    assert('virtual-user-incremental-integration', 'stabilization wired', stabilization.includes('virtualUserPassed'), 'wired');
    const incr = readFileSync(join(ROOT, 'src/incremental-autonomous-builder/incremental-build-orchestrator.ts'), 'utf8');
    assert('virtual-user-incremental-integration', 'orchestrator wired', incr.includes('simulateVirtualUserImpactForFeatureSlice'), 'orchestrator');
    const input = eraInput(EXPENSE_PROMPT);
    const sliceId = input.incrementalBuild.buildPlan.featureSlices[0]?.sliceId ?? 'slice-1';
    const impact = simulateVirtualUserImpactForFeatureSlice({
      sliceId,
      sliceName: 'test-slice',
      pipelineInput: input,
    });
    assert('virtual-user-incremental-integration', 'slice impact returns', typeof impact.passed === 'boolean', String(impact.passed));
  }

  if (include('virtual-user-launch-integration') || include('all')) {
    const buildPlan = resolvePromptFaithfulBuildPlan(EXPENSE_PROMPT);
    assert('virtual-user-launch-integration', 'sixth gate', buildPlan.virtualUserSimulation.ready, buildPlan.virtualUserSimulation.blockedReason ?? 'ready');
    const founder = collectFounderLaunchEvidence({ productPrompt: EXPENSE_PROMPT });
    assert('virtual-user-launch-integration', 'AFLA source', founder.virtualUserSimulation?.available === true, founder.virtualUserSimulation?.sourceName ?? 'missing');
    const pipeline = runVirtualUserPipeline(eraInput(EXPENSE_PROMPT));
    const evidence = buildLaunchVirtualUserEvidence(pipeline);
    assert('virtual-user-launch-integration', 'launch evidence', evidence.userCount >= 2, String(evidence.userCount));
    const verdict = readFileSync(join(ROOT, 'src/autonomous-founder-launch-authority/founder-verdict-engine.ts'), 'utf8');
    assert('virtual-user-launch-integration', 'verdict blocks', verdict.includes('Virtual User Simulation incomplete'), 'verdict');
  }

  if (include('virtual-user-live-preview-gate') || include('all')) {
    const passPipeline = runVirtualUserPipeline(eraInput(EXPENSE_PROMPT));
    const gate = evaluateLivePreviewVirtualUserGate(passPipeline);
    assert('virtual-user-live-preview-gate', 'unlocked on pass', gate.unlocked, String(gate.unlocked));
    assert('virtual-user-live-preview-gate', 'ready for preview', isVirtualUserSimulationReadyForPreview(passPipeline), 'ready');
    const failPipeline = runVirtualUserPipeline({ ...eraInput(LISA_PROMPT), simulateAccessibilityBlocker: true });
    const failGate = evaluateLivePreviewVirtualUserGate(failPipeline);
    assert('virtual-user-live-preview-gate', 'blocked on fail', !failGate.unlocked, failGate.blockedReason ?? 'blocked');
    assert('virtual-user-live-preview-gate', 'failure category', Boolean(failGate.failureCategory), failGate.failureCategory ?? 'none');
    const orchestrator = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
    assert('virtual-user-live-preview-gate', 'orchestrator gate', orchestrator.includes('evaluateLivePreviewVirtualUserGate'), 'orchestrator');
  }

  if (include('all')) {
    const lisaPipeline = runVirtualUserPipeline(eraInput(LISA_PROMPT));
    const patient = lisaPipeline.profiles.find((p) => /locked-in/i.test(p.role));
    const patientJourney = lisaPipeline.journeyResults.find((j) => j.userId === patient?.userId);
    assert('virtual-user-engine', 'scenario LISA patient', Boolean(patient && patientJourney), patientJourney?.completionStatus ?? 'missing');

    const caregiver = lisaPipeline.profiles.find((p) => /caregiver/i.test(p.role));
    const caregiverJourney = lisaPipeline.journeyResults.find((j) => j.userId === caregiver?.userId);
    assert('virtual-user-engine', 'scenario LISA caregiver', Boolean(caregiverJourney), caregiverJourney?.completionStatus ?? 'missing');

    const expensePipeline = runVirtualUserPipeline(eraInput(EXPENSE_OWNER_PROMPT));
    const owner = expensePipeline.profiles.find((p) => /business owner/i.test(p.role));
    const ownerJourney = expensePipeline.journeyResults.find((j) => {
      const goal = expensePipeline.goals.find((g) => g.goalId === j.goalId);
      return j.userId === owner?.userId && goal && /add expense/i.test(goal.description);
    });
    assert(
      'virtual-user-engine',
      'scenario expense owner journey',
      ownerJourney?.completionStatus === 'COMPLETED',
      ownerJourney?.completionStatus ?? 'missing',
    );

    const frictionPipeline = runVirtualUserPipeline({ ...eraInput(LISA_PROMPT), simulateTooManySteps: true });
    assert(
      'virtual-user-engine',
      'scenario too many steps',
      frictionPipeline.permissionVerdict !== 'READY_FOR_PREVIEW',
      frictionPipeline.permissionVerdict,
    );
  }

  return { checks, allPassed: checks.every((c) => c.passed) };
}

export function printVirtualUserValidationResults(checks: ValidationCheck[], title: string): void {
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
  console.log('\nVIRTUAL_USER_ENGINE_V1_PASS');
}
