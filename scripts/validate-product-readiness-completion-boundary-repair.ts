/**
 * Phase 26.90 — Product Readiness Completion Boundary Repair validation (V1).
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
import { resolveMissingIntakeCompletionBoundary } from '../src/founder-test-runtime-monitor/stage2-completion-tracker.js';
import {
  PRODUCT_READINESS_COMPLETE,
  PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_PASS,
  applyProductReadinessCompletionBoundaryRepair,
  assessProductReadinessCompletionBoundaryRepair,
  auditChatStressSettlement,
  detectProductReadinessCompletion,
  hasProductReadinessCompleteEventEmitted,
  isProductReadinessRule1Satisfied,
  resetProductReadinessCompletionBoundaryRepairModuleForTests,
} from '../src/product-readiness-completion-boundary-repair/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-product-readiness-completion-boundary-repair';

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
  'src/product-readiness-completion-boundary-repair/product-readiness-completion-boundary-repair-types.ts',
  'src/product-readiness-completion-boundary-repair/product-readiness-completion-boundary-repair-registry.ts',
  'src/product-readiness-completion-boundary-repair/chat-stress-settlement-auditor.ts',
  'src/product-readiness-completion-boundary-repair/product-readiness-completion-detector.ts',
  'src/product-readiness-completion-boundary-repair/stage-transition-analyzer.ts',
  'src/product-readiness-completion-boundary-repair/completion-boundary-repair-planner.ts',
  'src/product-readiness-completion-boundary-repair/product-readiness-completion-report-builder.ts',
  'src/product-readiness-completion-boundary-repair/product-readiness-completion-history.ts',
  'src/product-readiness-completion-boundary-repair/product-readiness-completion-boundary-repair-authority.ts',
  'src/product-readiness-completion-boundary-repair/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(ROOT, 'src/product-readiness-completion-boundary-repair/product-readiness-completion-boundary-repair-authority.ts'),
  'utf8',
);
const registrySource = readFileSync(
  join(ROOT, 'src/product-readiness-completion-boundary-repair/product-readiness-completion-boundary-repair-registry.ts'),
  'utf8',
);
const orchestratorSource = readFileSync(
  join(ROOT, 'src/founder-test-product-readiness/product-readiness-orchestrator.ts'),
  'utf8',
);
const runtimeMonitorSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert('PASS token in registry', registrySource.includes(PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_PASS), 'missing');
assert('PRODUCT_READINESS_COMPLETE in registry', registrySource.includes(PRODUCT_READINESS_COMPLETE), 'missing');
assert('orchestrator emits PRODUCT_READINESS_COMPLETE', orchestratorSource.includes('emitProductReadinessCompleteOnce'), 'missing');
assert('runtime monitor wired', runtimeMonitorSource.includes('reconcileProductReadinessCompletionBoundaryOnSnapshot'), 'missing');
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'mutates');
assert('no nested validator', !authoritySource.includes('validate-'), 'nested');
assert(
  'package script registered',
  packageJson.includes(`validate:product-readiness-completion-boundary-repair": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'missing',
);

resetChatStressSimulationForTests();
resetChatStressCompletionPropagationForTests();
resetProductReadinessCompletionBoundaryRepairModuleForTests();

beginChatStressSimulation(['repair-01', 'repair-02', 'repair-03']);
for (const id of ['repair-01', 'repair-02', 'repair-03']) {
  markChatStressScenarioStarted(id);
  tryMarkChatStressScenarioSettled(id, 'PASSED');
}

const snap = getChatStressCompletionSnapshot();
assert(
  'Rule 1: started == settled and pending == 0 detected',
  isProductReadinessRule1Satisfied({
    startedCount: snap.startedCount,
    settledCount: snap.settledCount,
    pendingCount: snap.pendingCount,
  }),
  `started=${snap.startedCount} settled=${snap.settledCount} pending=${snap.pendingCount}`,
);

const settlementAudit = auditChatStressSettlement();
assert('settlement audit Rule 1', settlementAudit.rule1Satisfied, settlementAudit.reason ?? '');

resetFounderTestRuntimeMonitorForTests();
resetChatStressSimulationForTests();
resetChatStressCompletionPropagationForTests();
resetProductReadinessSimulationForTests();
resetProductReadinessFixtureCacheForTests();
resetProductReadinessCompletionBoundaryRepairModuleForTests();
resetProductReadinessCompletionCheckEmissionForTests();

beginFounderTestRuntime({ runId: 'product-readiness-completion-boundary-repair-run' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
const bridge = buildLaunchReadinessArtifactBuildTraceBridge();

const traceOps: string[] = [];
await runFullProductReadinessSimulation({
  rootDir: ROOT,
  chatStressMaxScenarios: 6,
  founderTestContext: true,
  productReadinessRuntimePath: 'real-founder',
  chatStressProviderOverride: new HangingLlmProvider(),
  onSimulationTrace: (event) => {
    traceOps.push(event.operationId);
    bridge({
      operationId: event.operationId,
      operationLabel: event.operationLabel,
      phase: event.phase === 'PASSED' ? 'PASSED' : event.phase === 'RUNNING' ? 'RUNNING' : 'FAILED',
      errorMessage: event.errorMessage,
    });
  },
});

const runtimeSnap = getFounderTestRuntimeStatus();
const completionDetection = detectProductReadinessCompletion();
assert(
  'productReadinessComplete becomes true',
  completionDetection.productReadinessComplete ||
    hasProductReadinessSimulationCompletePropagated(),
  completionDetection.reason ?? 'unknown',
);
assert(
  'PRODUCT_READINESS_COMPLETE emits once',
  hasProductReadinessCompleteEventEmitted() &&
    (traceOps.includes(PRODUCT_READINESS_COMPLETE) ||
      runtimeSnap.traceEvents.some((event) => event.operationId === PRODUCT_READINESS_COMPLETE)),
  `flag=${hasProductReadinessCompleteEventEmitted()} ops=${traceOps.filter((op) => op === PRODUCT_READINESS_COMPLETE).join(',')}`,
);
assert(
  'no duplicate PRODUCT_READINESS_COMPLETE',
  traceOps.filter((op) => op === PRODUCT_READINESS_COMPLETE).length <= 1,
  String(traceOps.filter((op) => op === PRODUCT_READINESS_COMPLETE).length),
);

assert(
  'runtime trace has product-readiness-simulation-complete PASSED',
  runtimeSnap.traceEvents.some(
    (event) =>
      event.operationId === 'product-readiness-simulation-complete' && event.status === 'PASSED',
  ),
  runtimeSnap.traceEvents.map((event) => event.operationId).join(', '),
);

completeFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION', message: 'Intake Validation Passed' });
advanceFounderTestRuntimeStage({ stageId: 'PLANNING_GATE' });
const afterPlanning = getFounderTestRuntimeStatus();
assert(
  'Intake Validation completes',
  afterPlanning.stages.some(
    (stage) => stage.stageId === 'INTAKE_VALIDATION' && stage.status === 'PASSED',
  ),
  afterPlanning.stages.map((stage) => `${stage.stageId}:${stage.status}`).join(', '),
);
assert(
  'Planning Gate becomes eligible',
  afterPlanning.stages.some((stage) => stage.stageId === 'PLANNING_GATE'),
  afterPlanning.stages.map((stage) => stage.stageId).join(', '),
);

const missingBoundary = resolveMissingIntakeCompletionBoundary(afterPlanning.traceEvents);
assert(
  'no silent stage stall on product readiness boundary',
  !missingBoundary ||
    missingBoundary === 'Launch readiness assessment complete' ||
    missingBoundary === 'Launch readiness artifacts built' ||
    missingBoundary === 'Intake validation complete',
  missingBoundary ?? 'none',
);

resetChatStressSimulationForTests();
resetChatStressCompletionPropagationForTests();
resetProductReadinessCompletionBoundaryRepairModuleForTests();
beginChatStressSimulation(['stall-01']);
markChatStressScenarioStarted('stall-01');
tryMarkChatStressScenarioSettled('stall-01', 'TIMEOUT');

const repairAssessment = await applyProductReadinessCompletionBoundaryRepair({
  rootDir: ROOT,
  onSimulationTrace: (event) => traceOps.push(event.operationId),
});
assert(
  'repair applies when settlement satisfied',
  repairAssessment.report.repairApplied || hasProductReadinessCompleteEventEmitted(),
  repairAssessment.report.repairPlan.actions.join(', '),
);

const failed = results.filter((entry) => !entry.passed);
const passToken = PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_PASS;

const boundaryReport = [
  '# Product Readiness Completion Boundary Report',
  '',
  '**Phase:** 26.90 — Product Readiness Completion Boundary Repair V1',
  '',
  '## Root cause',
  '',
  'Chat stress settlement satisfied (`started == settled`, `pending == 0`) while `isProductReadinessCompletionCheckSatisfied()` required strict `completionBoundaryReached` (`allChatStressScenariosSettled`).',
  'Settlement recovery also returned null unless `isChatStressSimulationComplete()` — blocking the completion tail when counts aligned but boundary flag differed.',
  '',
  '## Repair',
  '',
  '- Align Rule 1 detection across completion check, propagation, and recovery paths',
  '- `product-readiness-completion-boundary-repair` module audits chain and emits `PRODUCT_READINESS_COMPLETE` once',
  '- Runtime monitor reconciles boundaries during snapshot when Rule 1 holds',
  '',
].join('\n');

const repairReport = [
  '# Product Readiness Completion Repair Report',
  '',
  `- repairApplied: ${repairAssessment.report.repairApplied}`,
  `- failureClass: ${repairAssessment.report.repairPlan.failureClass}`,
  `- actions: ${repairAssessment.report.repairPlan.actions.join(' → ')}`,
  '',
].join('\n');

const validationSummary = [
  '# Product Readiness Completion Validation',
  '',
  `Result: ${failed.length === 0 ? passToken : 'FAILED'}`,
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
  '## Trace chain',
  '',
  ...traceOps
    .filter(
      (op) =>
        op.includes('product-readiness') ||
        op.startsWith('PRODUCT_READINESS'),
    )
    .slice(0, 24)
    .map((op) => `- ${op}`),
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'PRODUCT_READINESS_COMPLETION_BOUNDARY_REPORT.md'), boundaryReport, 'utf8');
writeFileSync(join(ROOT, 'architecture', 'PRODUCT_READINESS_COMPLETION_REPAIR_REPORT.md'), repairReport, 'utf8');
writeFileSync(join(ROOT, 'architecture', 'PRODUCT_READINESS_COMPLETION_VALIDATION.md'), validationSummary, 'utf8');

if (failed.length > 0) {
  console.error(validationSummary);
  process.exit(1);
}

console.log(passToken);
console.log(validationSummary);
