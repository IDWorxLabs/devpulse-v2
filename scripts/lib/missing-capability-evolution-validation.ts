/**
 * Missing Capability Evolution Engine Era 3 Phase 10 — shared validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessEvolutionSafety,
  buildLaunchMissingCapabilityEvolutionEvidence,
  checkCapabilityReuse,
  evaluateLivePreviewMissingCapabilityEvolutionGate,
  executeCapabilityInstallation,
  generateCapabilityWorkspace,
  getDevPulseV2MissingCapabilityEvolutionEngine,
  intakeMissingCapabilities,
  isMissingCapabilityEvolutionComplete,
  isMissingCapabilityEvolutionReadyForPreview,
  isSafeToEvolve,
  planCapabilityDesign,
  planCapabilityImplementation,
  planCapabilityTestFixtures,
  preventDuplicateEvolution,
  registerMissingCapabilityEvolutionEngineWithLaunchAuthority,
  registerMissingCapabilityEvolutionEngineWithMissingCapabilityEscalation,
  resetMissingCapabilityEvolutionEngineModuleForTests,
  runCapabilityValidation,
  runMissingCapabilityEvolutionPipeline,
  designCapabilityInterface,
  designCapabilityValidators,
} from '../../src/missing-capability-evolution-engine/index.js';
import { runCapabilityPlanningPipeline, resetCapabilityPlanningEngineModuleForTests } from '../../src/capability-planning-engine/index.js';
import { runIntentUnderstandingEngine } from '../../src/intent-understanding-engine/index.js';
import { runPromptFaithfulnessEngineV2 } from '../../src/prompt-faithfulness-engine-v2/index.js';
import { getDevPulseV2Owner } from '../../src/foundation/ownership-registry.js';
import {
  CSV_EXPORT_PROMPT,
  PAYMENT_PROMPT,
} from './capability-planning-v3-validation.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/missing-capability-evolution-engine');

export const REQUIRED_FILES = [
  'missing-capability-evolution-types.ts',
  'missing-capability-evolution-registry.ts',
  'missing-capability-intake.ts',
  'evolution-safety-assessor.ts',
  'capability-design-planner.ts',
  'capability-interface-designer.ts',
  'capability-implementation-planner.ts',
  'capability-validator-designer.ts',
  'capability-test-fixture-planner.ts',
  'capability-workspace-generator.ts',
  'capability-validation-runner.ts',
  'capability-installation-executor.ts',
  'capability-registry-updater.ts',
  'capability-reuse-indexer.ts',
  'capability-evolution-loop-controller.ts',
  'capability-evolution-history.ts',
  'capability-evolution-authority.ts',
  'capability-evolution-report-builder.ts',
  'capability-evolution-live-preview-gate.ts',
  'capability-evolution-readiness.ts',
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

export function runMissingCapabilityEvolutionValidation(sections?: string[]): {
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

  resetMissingCapabilityEvolutionEngineModuleForTests();
  resetCapabilityPlanningEngineModuleForTests();

  const freshEvolutionInput = () => {
    resetMissingCapabilityEvolutionEngineModuleForTests();
    resetCapabilityPlanningEngineModuleForTests();
    return pipelineInput(CSV_EXPORT_PROMPT);
  };

  if (include('missing-capability-evolution-engine') || include('all')) {
    for (const file of REQUIRED_FILES) {
      assert('missing-capability-evolution-engine', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
    }
    const authority = getDevPulseV2MissingCapabilityEvolutionEngine();
    assert(
      'missing-capability-evolution-engine',
      'pass token',
      authority.passToken === 'MISSING_CAPABILITY_EVOLUTION_ENGINE_V1_PASS',
      authority.passToken,
    );
    assert('missing-capability-evolution-engine', 'phase 10', authority.phase === 10, String(authority.phase));
  }

  if (include('missing-capability-intake') || include('all')) {
    const input = pipelineInput(CSV_EXPORT_PROMPT);
    const intake = intakeMissingCapabilities(input);
    assert(
      'missing-capability-intake',
      'csv export intake',
      intake.some((i) => /csv/i.test(i.capabilityName)),
      intake.map((i) => i.capabilityName).join(', '),
    );
    assert(
      'missing-capability-intake',
      'requirement evidence',
      intake.every((i) => i.sourcePromptEvidence.length > 0 || i.sourceRequirementIds.length > 0),
      String(intake.length),
    );
  }

  if (include('evolution-safety-assessment') || include('all')) {
    const input = pipelineInput(CSV_EXPORT_PROMPT);
    const intake = intakeMissingCapabilities(input);
    const csvItem = intake.find((i) => /csv/i.test(i.capabilityName))!;
    const safe = assessEvolutionSafety(csvItem);
    assert('evolution-safety-assessment', 'csv safe', safe.verdict === 'SAFE_TO_EVOLVE', safe.verdict);
    const paymentInput = pipelineInput(PAYMENT_PROMPT);
    const paymentIntake = intakeMissingCapabilities(paymentInput);
    const paymentItem = paymentIntake.find((i) => /payment/i.test(i.capabilityName))!;
    const paymentSafety = assessEvolutionSafety(paymentItem);
    assert(
      'evolution-safety-assessment',
      'payment blocked',
      paymentSafety.verdict === 'BLOCKED_UNSAFE' || paymentSafety.verdict === 'NEEDS_HUMAN_REVIEW',
      paymentSafety.verdict,
    );
  }

  if (include('capability-design-planning') || include('all')) {
    const input = pipelineInput(CSV_EXPORT_PROMPT);
    const item = intakeMissingCapabilities(input).find((i) => /csv/i.test(i.capabilityName))!;
    const safety = assessEvolutionSafety(item);
    const design = planCapabilityDesign({ item, safety });
    assert('capability-design-planning', 'design created', design.capabilityId.includes('csv'), design.capabilityId);
  }

  if (include('capability-interface-design') || include('all')) {
    const input = pipelineInput(CSV_EXPORT_PROMPT);
    const item = intakeMissingCapabilities(input).find((i) => /csv/i.test(i.capabilityName))!;
    const design = planCapabilityDesign({ item, safety: assessEvolutionSafety(item) });
    const iface = designCapabilityInterface(design);
    assert('capability-interface-design', 'versioned', iface.version === '1.0.0', iface.version);
    assert('capability-interface-design', 'public functions', iface.publicFunctions.length >= 1, String(iface.publicFunctions.length));
  }

  if (include('capability-implementation-planning') || include('all')) {
    const input = pipelineInput(CSV_EXPORT_PROMPT);
    const item = intakeMissingCapabilities(input).find((i) => /csv/i.test(i.capabilityName))!;
    const design = planCapabilityDesign({ item, safety: assessEvolutionSafety(item) });
    const plan = planCapabilityImplementation({ design, interfaceDesign: designCapabilityInterface(design) });
    assert(
      'capability-implementation-planning',
      'isolated module',
      plan.isolationBoundary.includes('platform-capabilities'),
      plan.isolationBoundary,
    );
  }

  if (include('capability-validator-design') || include('all')) {
    const input = pipelineInput(CSV_EXPORT_PROMPT);
    const item = intakeMissingCapabilities(input).find((i) => /csv/i.test(i.capabilityName))!;
    const design = planCapabilityDesign({ item, safety: assessEvolutionSafety(item) });
    const validators = designCapabilityValidators(design);
    assert('capability-validator-design', 'unit checks', validators.unitChecks.length >= 1, String(validators.unitChecks.length));
  }

  if (include('capability-test-fixture-planning') || include('all')) {
    const input = pipelineInput(CSV_EXPORT_PROMPT);
    const item = intakeMissingCapabilities(input).find((i) => /csv/i.test(i.capabilityName))!;
    const design = planCapabilityDesign({ item, safety: assessEvolutionSafety(item) });
    const fixtures = planCapabilityTestFixtures(design);
    assert('capability-test-fixture-planning', 'happy path', fixtures.happyPath.length >= 1, String(fixtures.happyPath.length));
  }

  if (include('capability-workspace-generation') || include('all')) {
    const input = pipelineInput(CSV_EXPORT_PROMPT);
    const item = intakeMissingCapabilities(input).find((i) => /csv/i.test(i.capabilityName))!;
    const design = planCapabilityDesign({ item, safety: assessEvolutionSafety(item) });
    const impl = planCapabilityImplementation({ design, interfaceDesign: designCapabilityInterface(design) });
    const workspace = generateCapabilityWorkspace({
      design,
      implementationPlan: impl,
      validatorDesign: designCapabilityValidators(design),
      fixturePlan: planCapabilityTestFixtures(design),
    });
    assert('capability-workspace-generation', 'isolated paths', workspace.modulePath.includes('platform-capabilities'), workspace.modulePath);
  }

  if (include('capability-validation-runner') || include('all')) {
    const input = pipelineInput(CSV_EXPORT_PROMPT);
    const item = intakeMissingCapabilities(input).find((i) => /csv/i.test(i.capabilityName))!;
    const design = planCapabilityDesign({ item, safety: assessEvolutionSafety(item) });
    const impl = planCapabilityImplementation({ design, interfaceDesign: designCapabilityInterface(design) });
    const workspace = generateCapabilityWorkspace({
      design,
      implementationPlan: impl,
      validatorDesign: designCapabilityValidators(design),
      fixturePlan: planCapabilityTestFixtures(design),
    });
    const validation = runCapabilityValidation({
      design,
      validatorDesign: designCapabilityValidators(design),
      workspace,
    });
    assert('capability-validation-runner', 'validated', validation.status === 'VALIDATED', validation.status);
  }

  if (include('capability-installation-executor') || include('all')) {
    const input = pipelineInput(CSV_EXPORT_PROMPT);
    const item = intakeMissingCapabilities(input).find((i) => /csv/i.test(i.capabilityName))!;
    const design = planCapabilityDesign({ item, safety: assessEvolutionSafety(item) });
    const impl = planCapabilityImplementation({ design, interfaceDesign: designCapabilityInterface(design) });
    const workspace = generateCapabilityWorkspace({
      design,
      implementationPlan: impl,
      validatorDesign: designCapabilityValidators(design),
      fixturePlan: planCapabilityTestFixtures(design),
    });
    const validation = runCapabilityValidation({
      design,
      validatorDesign: designCapabilityValidators(design),
      workspace,
    });
    const install = executeCapabilityInstallation({ design, implementationPlan: impl, workspace, validation });
    assert('capability-installation-executor', 'installed', install.installed, String(install.installed));
  }

  if (include('capability-registry-updater') || include('all')) {
    const pipeline = runMissingCapabilityEvolutionPipeline(freshEvolutionInput());
    assert(
      'capability-registry-updater',
      'registry updated',
      pipeline.registryRecords.length >= 1,
      String(pipeline.registryRecords.length),
    );
  }

  if (include('capability-reuse-indexing') || include('all')) {
    const first = runMissingCapabilityEvolutionPipeline(freshEvolutionInput());
    assert('capability-reuse-indexing', 'first evolution', first.registryRecords.length >= 1, String(first.registryRecords.length));
    const second = runMissingCapabilityEvolutionPipeline(pipelineInput(CSV_EXPORT_PROMPT));
    assert(
      'capability-reuse-indexing',
      'duplicate prevented',
      second.reusedCapabilityIds.length >= 1 && second.workspaceArtifacts.length === 0,
      `${second.reusedCapabilityIds.length}/${second.workspaceArtifacts.length}`,
    );
    assert(
      'capability-reuse-indexing',
      'reuse index',
      preventDuplicateEvolution('CSV Export'),
      'duplicate blocked',
    );
  }

  if (include('capability-evolution-loop-controller') || include('all')) {
    const orchestrator = readFileSync(join(MODULE_DIR, 'capability-evolution-loop-controller.ts'), 'utf8');
    assert('capability-evolution-loop-controller', 'budget exists', orchestrator.includes('createEvolutionLoopBudget'), 'budget');
  }

  if (include('capability-evolution-launch-integration') || include('all')) {
    const pipeline = runMissingCapabilityEvolutionPipeline(freshEvolutionInput());
    const evidence = buildLaunchMissingCapabilityEvolutionEvidence(pipeline);
    assert('capability-evolution-launch-integration', 'launch evidence', evidence.registeredCount >= 1, String(evidence.registeredCount));
    assert(
      'capability-evolution-launch-integration',
      'launch registration',
      registerMissingCapabilityEvolutionEngineWithLaunchAuthority().readOnly === true,
      'readOnly',
    );
    const owner = getDevPulseV2Owner('missing_capability_evolution_engine');
    assert(
      'capability-evolution-launch-integration',
      'ownership registry',
      owner.ownerModule === 'devpulse_v2_missing_capability_evolution_engine',
      owner.ownerModule,
    );
  }

  if (include('capability-evolution-live-preview-gate') || include('all')) {
    const passPipeline = runMissingCapabilityEvolutionPipeline(freshEvolutionInput());
    const gate = evaluateLivePreviewMissingCapabilityEvolutionGate(passPipeline);
    assert('capability-evolution-live-preview-gate', 'unlocked on pass', gate.unlocked, String(gate.unlocked));
    assert(
      'capability-evolution-live-preview-gate',
      'ready for preview',
      isMissingCapabilityEvolutionReadyForPreview(passPipeline),
      passPipeline.permissionVerdict,
    );
    const paymentPipeline = runMissingCapabilityEvolutionPipeline(pipelineInput(PAYMENT_PROMPT));
    const paymentGate = evaluateLivePreviewMissingCapabilityEvolutionGate(paymentPipeline);
    assert(
      'capability-evolution-live-preview-gate',
      'payment locked',
      !paymentGate.unlocked,
      paymentPipeline.permissionVerdict,
    );
  }

  if (include('all')) {
    const csvPipeline = runMissingCapabilityEvolutionPipeline(freshEvolutionInput());
    assert(
      'missing-capability-evolution-engine',
      'scenario 1 csv export',
      isMissingCapabilityEvolutionComplete(csvPipeline) &&
        csvPipeline.safetyAssessments.some((s) => s.verdict === 'SAFE_TO_EVOLVE') &&
        csvPipeline.registryRecords.length >= 1 &&
        csvPipeline.capabilityPlanningRerunPass,
      csvPipeline.permissionVerdict,
    );

    resetMissingCapabilityEvolutionEngineModuleForTests();
    const paymentPipeline = runMissingCapabilityEvolutionPipeline(pipelineInput(PAYMENT_PROMPT));
    assert(
      'missing-capability-evolution-engine',
      'scenario 2 payment blocked',
      paymentPipeline.permissionVerdict !== 'EVOLUTION_PASS' &&
        paymentPipeline.workspaceArtifacts.length === 0 &&
        paymentPipeline.humanReview !== null || paymentPipeline.blockedReason !== null,
      paymentPipeline.permissionVerdict,
    );

    resetMissingCapabilityEvolutionEngineModuleForTests();
    runMissingCapabilityEvolutionPipeline(pipelineInput(CSV_EXPORT_PROMPT));
    const duplicate = runMissingCapabilityEvolutionPipeline(pipelineInput(CSV_EXPORT_PROMPT));
    assert(
      'missing-capability-evolution-engine',
      'scenario 3 duplicate prevention',
      duplicate.reusedCapabilityIds.length >= 1 && duplicate.designs.length === 0,
      `${duplicate.reusedCapabilityIds.length}/${duplicate.designs.length}`,
    );

    resetMissingCapabilityEvolutionEngineModuleForTests();
    const rollback = runMissingCapabilityEvolutionPipeline({
      ...pipelineInput(CSV_EXPORT_PROMPT),
      simulateValidationFailure: true,
    });
    assert(
      'missing-capability-evolution-engine',
      'scenario 4 validation rollback',
      rollback.installationResults.some((i) => i.rolledBack) &&
        rollback.registryRecords.length === 0 &&
        rollback.permissionVerdict !== 'EVOLUTION_PASS',
      rollback.permissionVerdict,
    );

    resetMissingCapabilityEvolutionEngineModuleForTests();
    resetCapabilityPlanningEngineModuleForTests();
    const debugPipeline = runMissingCapabilityEvolutionPipeline({
      ...freshEvolutionInput(),
      debuggingCapabilityGap: {
        capabilityName: 'CSV Export',
        evidence: 'CAPABILITY_GAP root cause — missing export capability',
      },
    });
    assert(
      'missing-capability-evolution-engine',
      'scenario 5 debugging gap',
      debugPipeline.intakeItems.some((i) => i.blockingGate === 'AUTONOMOUS_DEBUGGING') &&
        isMissingCapabilityEvolutionComplete(debugPipeline),
      debugPipeline.permissionVerdict,
    );

    resetMissingCapabilityEvolutionEngineModuleForTests();
    runMissingCapabilityEvolutionPipeline(pipelineInput(CSV_EXPORT_PROMPT));
    const reuseFuture = runMissingCapabilityEvolutionPipeline(pipelineInput(CSV_EXPORT_PROMPT));
    assert(
      'missing-capability-evolution-engine',
      'scenario 6 reuse future project',
      reuseFuture.reusedCapabilityIds.length >= 1 && reuseFuture.permissionVerdict === 'EVOLUTION_PASS',
      reuseFuture.permissionVerdict,
    );

    assert(
      'missing-capability-evolution-engine',
      'escalation registration',
      registerMissingCapabilityEvolutionEngineWithMissingCapabilityEscalation().readOnly === true,
      'readOnly',
    );
  }

  const allPassed = checks.every((c) => c.passed);
  return { checks, allPassed };
}

export function printMissingCapabilityEvolutionValidationResults(
  checks: ValidationCheck[],
  label = 'validate:missing-capability-evolution-engine',
): void {
  const failed = checks.filter((c) => !c.passed);
  for (const check of checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} [${check.section}] ${check.name}: ${check.detail}`);
  }
  console.log(`\n${label}: ${failed.length ? 'FAILED' : 'PASSED'} (${checks.length} checks, ${failed.length} failed)`);
  if (failed.length) {
    process.exit(1);
  }
  console.log('\nMISSING_CAPABILITY_EVOLUTION_ENGINE_V1_PASS');
}
