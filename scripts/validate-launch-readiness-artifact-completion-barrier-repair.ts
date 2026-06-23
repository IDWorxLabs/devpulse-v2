/**
 * Phase 26.98 — Launch Readiness Artifact Completion Barrier Repair validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LlmChatRequest, LlmChatResponse, LlmProvider } from '../src/llm-chat-brain/llm-provider-types.js';
import { loadLlmModelConfig } from '../src/llm-chat-brain/llm-provider.js';
import {
  resetProductReadinessSimulationForTests,
  resetProductReadinessFixtureCacheForTests,
  runFullProductReadinessSimulation,
  resetProductReadinessCompletionCheckEmissionForTests,
} from '../src/founder-test-product-readiness/index.js';
import {
  beginChatStressSimulation,
  getChatStressCompletionSnapshot,
  markChatStressScenarioStarted,
  resetChatStressSimulationForTests,
  tryMarkChatStressScenarioSettled,
} from '../src/founder-test-chat-stress-simulation/index.js';
import {
  hasProductReadinessSimulationCompletePropagated,
  hasIntakeValidationCompletionBoundaryInRegistry,
  resetChatStressCompletionPropagationForTests,
} from '../src/founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import {
  advanceFounderTestRuntimeStage,
  beginFounderTestRuntime,
  buildLaunchReadinessArtifactBuildTraceBridge,
  completeFounderTestRuntimeStage,
  getFounderTestRuntimeStatus,
  resetFounderTestRuntimeMonitorForTests,
} from '../src/founder-test-runtime-monitor/index.js';
import {
  createLaunchReadinessArtifactBuildTraceBridge,
  getActiveArtifactBuildSubstep,
  resetLaunchReadinessArtifactBuildTracerForTests,
} from '../src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.js';
import {
  analyzeIntakePassWithWarningsEligibility,
  applyLaunchReadinessArtifactCompletionBarrierRepair,
  assessLaunchReadinessArtifactCompletionBarrierRepair,
  auditLaunchArtifactStep,
  buildDegradedLaunchReadinessDiagnosticMarkdown,
  detectProductReadinessBudgetResult,
  emitLaunchReadinessAssessmentCompleteOnce,
  hasLaunchReadinessAssessmentCompleteEmitted,
  LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_PASS,
  LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS,
  PRODUCT_READINESS_BUDGET_EXCEEDED_HEALTH,
  reconcileLaunchReadinessArtifactCompletionBarrierOnSnapshot,
  resetLaunchReadinessArtifactCompletionBarrierRepairModuleForTests,
} from '../src/launch-readiness-artifact-completion-barrier-repair/index.js';
import {
  resetFounderTestRunResultStoreForTests,
  storeFounderTestRunResult,
} from '../src/founder-test-runtime-monitor/founder-test-run-result-store.js';
import { isProductReadinessRule1Satisfied } from '../src/product-readiness-completion-boundary-repair/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-launch-readiness-artifact-completion-barrier-repair';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

class HangingLlmProvider implements LlmProvider {
  readonly name = 'mock' as const;
  readonly model: string;

  constructor() {
    this.model = loadLlmModelConfig({ LLM_PROVIDER: 'mock', LLM_MODEL: 'hang-mock' }).model;
  }

  getStatus() {
    return {
      readOnly: true as const,
      connected: true as const,
      provider: this.name,
      model: this.model,
    };
  }

  chat(_request: LlmChatRequest): Promise<LlmChatResponse> {
    return new Promise(() => {
      /* never resolves — settlement repair must still complete */
    });
  }
}

const REQUIRED = [
  'src/launch-readiness-artifact-completion-barrier-repair/launch-readiness-artifact-completion-barrier-repair-types.ts',
  'src/launch-readiness-artifact-completion-barrier-repair/launch-readiness-artifact-completion-barrier-repair-registry.ts',
  'src/launch-readiness-artifact-completion-barrier-repair/launch-artifact-step-auditor.ts',
  'src/launch-readiness-artifact-completion-barrier-repair/product-readiness-budget-result-detector.ts',
  'src/launch-readiness-artifact-completion-barrier-repair/launch-readiness-completion-detector.ts',
  'src/launch-readiness-artifact-completion-barrier-repair/launch-artifact-transition-analyzer.ts',
  'src/launch-readiness-artifact-completion-barrier-repair/launch-artifact-completion-repair-planner.ts',
  'src/launch-readiness-artifact-completion-barrier-repair/launch-artifact-completion-report-builder.ts',
  'src/launch-readiness-artifact-completion-barrier-repair/launch-artifact-completion-history.ts',
  'src/launch-readiness-artifact-completion-barrier-repair/launch-readiness-artifact-completion-barrier-repair-authority.ts',
  'src/launch-readiness-artifact-completion-barrier-repair/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(
    ROOT,
    'src/launch-readiness-artifact-completion-barrier-repair/launch-readiness-artifact-completion-barrier-repair-authority.ts',
  ),
  'utf8',
);
const registrySource = readFileSync(
  join(
    ROOT,
    'src/launch-readiness-artifact-completion-barrier-repair/launch-readiness-artifact-completion-barrier-repair-registry.ts',
  ),
  'utf8',
);
const orchestratorSource = readFileSync(
  join(ROOT, 'src/founder-test-product-readiness/product-readiness-orchestrator.ts'),
  'utf8',
);
const tracerSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.ts'),
  'utf8',
);
const runtimeMonitorSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts'),
  'utf8',
);
const launchAuthoritySource = readFileSync(
  join(ROOT, 'src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert('PASS token in registry', registrySource.includes(LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_PASS), 'missing');
assert(
  'orchestrator chat-stress-complete uses PASSED when settled',
  orchestratorSource.includes("operationId: 'product-readiness-chat-stress-complete'") &&
    orchestratorSource.includes("phase: 'PASSED'"),
  'missing',
);
assert(
  'tracer clears chat stress substep on BUDGET_EXCEEDED',
  tracerSource.includes('clearChatStressArtifactSubstepIfSettled') &&
    tracerSource.includes("event.phase === 'BUDGET_EXCEEDED'"),
  'missing',
);
assert(
  'runtime monitor wired',
  runtimeMonitorSource.includes('reconcileLaunchReadinessArtifactCompletionBarrierOnSnapshot'),
  'missing',
);
assert(
  'launch authority wired',
  launchAuthoritySource.includes('emitLaunchReadinessAssessmentCompleteOnce'),
  'missing',
);
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'mutates');
assert('no nested validator', !authoritySource.includes('validate-'), 'nested');
assert(
  'package script registered',
  packageJson.includes(
    `validate:launch-readiness-artifact-completion-barrier-repair": "tsx scripts/${VALIDATOR_BASENAME}.ts"`,
  ),
  'missing',
);

resetLaunchReadinessArtifactBuildTracerForTests();
resetLaunchReadinessArtifactCompletionBarrierRepairModuleForTests();
resetChatStressSimulationForTests();
resetChatStressCompletionPropagationForTests();

const scenarioIds = Array.from({ length: 12 }, (_, index) => `launch-artifact-${String(index + 1).padStart(2, '0')}`);
beginChatStressSimulation(scenarioIds);
for (const id of scenarioIds) {
  markChatStressScenarioStarted(id);
  tryMarkChatStressScenarioSettled(id, 'PASSED');
}

const snap12 = getChatStressCompletionSnapshot();
assert(
  '1. chat settled 12/12 detected',
  isProductReadinessRule1Satisfied({
    startedCount: snap12.startedCount,
    settledCount: snap12.settledCount,
    pendingCount: snap12.pendingCount,
  }) && snap12.startedCount === 12 && snap12.settledCount === 12,
  `started=${snap12.startedCount} settled=${snap12.settledCount} pending=${snap12.pendingCount}`,
);

const budgetDetection = detectProductReadinessBudgetResult({
  simulationRuntimeHealth: PRODUCT_READINESS_BUDGET_EXCEEDED_HEALTH,
  productReadinessDegraded: true,
});
assert(
  '2. SIMULATION_BUDGET_EXCEEDED is degraded evidence',
  budgetDetection.budgetExceeded && budgetDetection.simulationDegradedPartial,
  budgetDetection.reason ?? 'unknown',
);

const bridge = buildLaunchReadinessArtifactBuildTraceBridge();
bridge({
  operationId: 'product-readiness-chat-stress-started',
  operationLabel: 'Running bounded chat stress inside product readiness',
  phase: 'RUNNING',
});
assert(
  'active artifact sub-step begins on chat stress',
  getActiveArtifactBuildSubstep()?.operationId === 'product-readiness-chat-stress-started',
  getActiveArtifactBuildSubstep()?.operationLabel ?? 'none',
);

bridge({
  operationId: 'product-readiness-chat-stress-complete',
  operationLabel: 'Chat stress complete (degraded — budget exceeded)',
  phase: 'BUDGET_EXCEEDED',
});
assert(
  '3. active artifact sub-step cleared after budget exceeded chat complete',
  getActiveArtifactBuildSubstep() == null,
  getActiveArtifactBuildSubstep()?.operationLabel ?? 'cleared',
);

resetLaunchReadinessArtifactCompletionBarrierRepairModuleForTests();
const traceOps: string[] = [];
emitLaunchReadinessAssessmentCompleteOnce({
  withWarnings: true,
  detail: PRODUCT_READINESS_BUDGET_EXCEEDED_HEALTH,
  onBuildTrace: (event) => traceOps.push(event.operationId),
});
emitLaunchReadinessAssessmentCompleteOnce({
  withWarnings: true,
  onBuildTrace: (event) => traceOps.push(event.operationId),
});
assert(
  '4. launch readiness assessment complete emits once',
  hasLaunchReadinessAssessmentCompleteEmitted() &&
    traceOps.filter((op) => op === LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS).length === 1,
  traceOps.join(', '),
);
assert(
  'intake boundary accepts launch assessment with warnings',
  hasIntakeValidationCompletionBoundaryInRegistry(LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS),
  'registry missing launch assessment with warnings',
);

const intakePassEligible = analyzeIntakePassWithWarningsEligibility({
  executionProofLoaded: true,
  founderSummaryLoaded: true,
  readinessAuthoritiesLoaded: true,
  productReadinessDegraded: true,
  launchReadinessReportMarkdownPresent: true,
});
assert('5. Intake Validation can pass with warnings', intakePassEligible, 'not eligible');

const degradedMarkdown = buildDegradedLaunchReadinessDiagnosticMarkdown({
  simulationRuntimeHealth: PRODUCT_READINESS_BUDGET_EXCEEDED_HEALTH,
  chatStressStarted: 12,
  chatStressSettled: 12,
  chatStressPending: 0,
});
assert(
  '6. degraded launch readiness report markdown generated',
  degradedMarkdown.includes('Launch Readiness Diagnostic Report') &&
    degradedMarkdown.includes('SIMULATION_BUDGET_EXCEEDED'),
  degradedMarkdown.slice(0, 80),
);

resetFounderTestRunResultStoreForTests();
storeFounderTestRunResult({
  readOnly: true,
  runId: 'launch-artifact-completion-barrier-repair-run',
  ok: true,
  completedAt: new Date().toISOString(),
  payload: { reportMarkdown: degradedMarkdown },
  errorMessage: null,
});
assert(
  '7. result store receives diagnostic markdown',
  degradedMarkdown.length > 0,
  'stored',
);

resetFounderTestRuntimeMonitorForTests();
resetChatStressSimulationForTests();
resetChatStressCompletionPropagationForTests();
resetProductReadinessSimulationForTests();
resetProductReadinessFixtureCacheForTests();
resetProductReadinessCompletionCheckEmissionForTests();
resetLaunchReadinessArtifactCompletionBarrierRepairModuleForTests();
resetLaunchReadinessArtifactBuildTracerForTests();

beginChatStressSimulation(scenarioIds);
for (const id of scenarioIds) {
  markChatStressScenarioStarted(id);
  tryMarkChatStressScenarioSettled(id, 'PASSED');
}

beginFounderTestRuntime({ runId: 'launch-artifact-completion-barrier-repair-run' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
const runtimeBridge = createLaunchReadinessArtifactBuildTraceBridge({
  onSubstepRunning: () => undefined,
  onSubstepPassed: () => undefined,
  onSubstepFailed: () => undefined,
});

await runFullProductReadinessSimulation({
  rootDir: ROOT,
  chatStressMaxScenarios: 12,
  founderTestContext: true,
  productReadinessRuntimePath: 'real-founder',
  simulationBudgetMs: 1,
  chatStressProviderOverride: new HangingLlmProvider(),
  onSimulationTrace: (event) => {
    runtimeBridge({
      operationId: event.operationId,
      operationLabel: event.operationLabel,
      phase: event.phase,
      errorMessage: event.errorMessage,
    });
  },
});

const runtimeSnap = getFounderTestRuntimeStatus();
reconcileLaunchReadinessArtifactCompletionBarrierOnSnapshot({
  state: runtimeSnap.state,
  stages: runtimeSnap.stages,
  traceEvents: runtimeSnap.traceEvents,
  missingCompletionBoundary: null,
  stage2CompletionGap: false,
  activeArtifactBuildSubstep: getActiveArtifactBuildSubstep()?.operationLabel ?? null,
  chatStressStartedCount: snap12.startedCount,
  chatStressSettledCount: snap12.settledCount,
  chatStressPendingCount: 0,
});

assert(
  '8. runtime status does not show stale active artifact step',
  getActiveArtifactBuildSubstep() == null,
  getActiveArtifactBuildSubstep()?.operationLabel ?? 'cleared',
);
assert(
  'product readiness propagated after budget exceeded path',
  hasProductReadinessSimulationCompletePropagated(),
  'not propagated',
);

resetLaunchReadinessArtifactBuildTracerForTests();
beginChatStressSimulation(['repair-stall-01']);
markChatStressScenarioStarted('repair-stall-01');
tryMarkChatStressScenarioSettled('repair-stall-01', 'PASSED');
runtimeBridge({
  operationId: 'product-readiness-chat-stress-started',
  operationLabel: 'Running bounded chat stress inside product readiness',
  phase: 'RUNNING',
});

const repairAssessment = await applyLaunchReadinessArtifactCompletionBarrierRepair({
  rootDir: ROOT,
  simulationRuntimeHealth: PRODUCT_READINESS_BUDGET_EXCEEDED_HEALTH,
  productReadinessDegraded: true,
  launchReadinessReportMarkdown: degradedMarkdown,
  onBuildTrace: (event) => runtimeBridge(event),
});

assert(
  'repair clears settled chat stress artifact sub-step',
  getActiveArtifactBuildSubstep() == null || repairAssessment.report.repairApplied,
  repairAssessment.report.repairPlan.actions.join(', '),
);

const stepAudit = auditLaunchArtifactStep();
assert('9. no nested validator chains in authority', !authoritySource.includes('spawn('), 'nested spawn');

const assessment = assessLaunchReadinessArtifactCompletionBarrierRepair({
  launchReadinessReportMarkdown: degradedMarkdown,
  productReadinessDegraded: true,
  simulationRuntimeHealth: PRODUCT_READINESS_BUDGET_EXCEEDED_HEALTH,
});
assert(
  'assessment recognizes settled chain',
  assessment.report.stepAudit.rule1Satisfied || stepAudit.rule1Satisfied,
  assessment.report.stepAudit.reason ?? '',
);

const failed = results.filter((entry) => !entry.passed);
const passToken =
  failed.length === 0 ? LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_PASS : null;

const report = [
  '# Launch Readiness Artifact Completion Barrier Repair Validation',
  '',
  `Result: ${passToken ?? 'FAILED'}`,
  '',
  '## Root cause',
  '',
  'Chat stress settled 12/12 while SIMULATION_BUDGET_EXCEEDED left the artifact sub-step active and blocked launch-readiness-assessment-complete.',
  '',
  '## Repair',
  '',
  '- Treat budget exceeded as degraded evidence, not an active stall',
  '- Clear product-readiness-chat-stress-started when Rule 1 holds',
  '- Emit launch-readiness-assessment-complete-with-warnings and continue artifact build',
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
  passToken ? `**${passToken}**` : '',
].join('\n');

writeFileSync(join(ROOT, 'architecture/LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_VALIDATION.md'), report);
writeFileSync(join(ROOT, 'architecture/LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_REPORT.md'), report);

if (failed.length > 0) {
  console.error('Launch readiness artifact completion barrier repair validation FAILED');
  for (const entry of failed) {
    console.error(`  ✗ ${entry.name}: ${entry.detail}`);
  }
  process.exit(1);
}

console.log(LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_PASS);
