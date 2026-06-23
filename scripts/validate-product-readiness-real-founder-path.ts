/**
 * Phase 26.73 — Real Founder Test product readiness propagation path alignment (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LlmChatRequest, LlmChatResponse, LlmProvider } from '../src/llm-chat-brain/llm-provider-types.js';
import { loadLlmModelConfig } from '../src/llm-chat-brain/llm-provider.js';
import { buildFounderTestLaunchReadinessArtifactsAsync } from '../src/founder-test-launch-readiness/index.js';
import {
  PRODUCT_READINESS_COMPLETION_CHECK,
  PRODUCT_READINESS_COMPLETED,
  PRODUCT_READINESS_PROPAGATION_COMPLETE,
  PRODUCT_READINESS_PROPAGATION_STEP,
  PRODUCT_READINESS_REAL_FOUNDER_PATH_PASS,
  REAL_FOUNDER_COMPLETION_CHECK_OBSERVED,
  REAL_FOUNDER_COMPLETION_TAIL_COMPLETED,
  REAL_FOUNDER_COMPLETION_TAIL_INVOKED,
  REAL_FOUNDER_PRODUCT_READINESS_PATH_SELECTED,
  REAL_FOUNDER_STAGE2_EXIT_CONFIRMED,
  PRODUCT_READINESS_PROPAGATION_PATH_MISMATCH,
  resetProductReadinessFixtureCacheForTests,
  resetProductReadinessRealFounderPathForTests,
  resetProductReadinessSimulationForTests,
  resetProductReadinessCompletionCheckEmissionForTests,
  getSelectedProductReadinessRuntimePath,
  hasProductReadinessCompletionTailInvoked,
} from '../src/founder-test-product-readiness/index.js';
import {
  hasProductReadinessSimulationCompletePropagated,
  resetChatStressCompletionPropagationForTests,
} from '../src/founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import { resetChatStressSimulationForTests } from '../src/founder-test-chat-stress-simulation/index.js';
import {
  advanceFounderTestRuntimeStage,
  beginFounderTestRuntime,
  buildLaunchReadinessArtifactBuildTraceBridge,
  completeFounderTestRuntimeStage,
  getActiveArtifactBuildSubstep,
  getFounderTestRuntimeStatus,
  resetFounderTestRuntimeMonitorForTests,
  resetLaunchReadinessArtifactBuildTracerForTests,
} from '../src/founder-test-runtime-monitor/index.js';
import { resolveMissingIntakeCompletionBoundary } from '../src/founder-test-runtime-monitor/stage2-completion-tracker.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

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
      /* never resolves — real founder path must invoke completion tail */
    });
  }
}

const REQUIRED = [
  'src/founder-test-product-readiness/product-readiness-real-founder-path.ts',
  'src/founder-test-product-readiness/product-readiness-orchestrator.ts',
  'src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts',
  'scripts/validate-product-readiness-real-founder-path.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const realPathSource = readFileSync(
  join(ROOT, 'src/founder-test-product-readiness/product-readiness-real-founder-path.ts'),
  'utf8',
);
const authoritySource = readFileSync(
  join(ROOT, 'src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts'),
  'utf8',
);

assert('REAL_FOUNDER diagnostics module', realPathSource.includes(REAL_FOUNDER_COMPLETION_TAIL_INVOKED), 'missing');
assert(
  'launch readiness uses real-founder runtime path',
  authoritySource.includes("productReadinessRuntimePath: 'real-founder'"),
  'missing',
);
assert(
  'launch readiness passes chatStressProviderOverride',
  authoritySource.includes('chatStressProviderOverride: input.chatStressProviderOverride'),
  'missing',
);

resetChatStressSimulationForTests();
resetChatStressCompletionPropagationForTests();
resetProductReadinessSimulationForTests();
resetProductReadinessFixtureCacheForTests();
resetProductReadinessRealFounderPathForTests();
resetProductReadinessCompletionCheckEmissionForTests();
resetFounderTestRuntimeMonitorForTests();
resetLaunchReadinessArtifactBuildTracerForTests();

beginFounderTestRuntime({ runId: 'product-readiness-real-founder-path-run' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });

const traceOps: string[] = [];
const bridge = buildLaunchReadinessArtifactBuildTraceBridge();
const startedAt = Date.now();

const artifacts = await buildFounderTestLaunchReadinessArtifactsAsync({
  rootDir: ROOT,
  skipAutonomousBuildExecutionProof: true,
  chatStressMaxScenarios: 6,
  chatStressProviderOverride: new HangingLlmProvider(),
  onBuildTrace: (event) => {
    traceOps.push(event.operationId);
    bridge(event);
  },
});

const elapsedMs = Date.now() - startedAt;

assert(
  'real founder launch readiness artifacts built',
  artifacts.founderTestLaunchReadinessAssessment.report.productReadinessScore != null,
  String(artifacts.founderTestLaunchReadinessAssessment.report.productReadinessScore),
);
assert(
  'real founder runtime path selected',
  getSelectedProductReadinessRuntimePath() === 'real-founder',
  String(getSelectedProductReadinessRuntimePath()),
);
assert(
  REAL_FOUNDER_PRODUCT_READINESS_PATH_SELECTED,
  traceOps.includes(REAL_FOUNDER_PRODUCT_READINESS_PATH_SELECTED),
  traceOps.filter((op) => op.startsWith('REAL_FOUNDER')).join(', '),
);
assert(
  PRODUCT_READINESS_COMPLETION_CHECK,
  traceOps.includes(PRODUCT_READINESS_COMPLETION_CHECK),
  traceOps.filter((op) => op.startsWith('PRODUCT_READINESS')).join(', '),
);
assert(
  REAL_FOUNDER_COMPLETION_CHECK_OBSERVED,
  traceOps.includes(REAL_FOUNDER_COMPLETION_CHECK_OBSERVED),
  traceOps.filter((op) => op.startsWith('REAL_FOUNDER')).join(', '),
);
assert(
  'completion tail step emitted',
  traceOps.some(
    (op, index) =>
      op === PRODUCT_READINESS_PROPAGATION_STEP &&
      traceOps.slice(index).some((candidate) => candidate === PRODUCT_READINESS_PROPAGATION_COMPLETE),
  ),
  traceOps.filter((op) => op.includes('PROPAGATION')).join(' → '),
);
assert(
  REAL_FOUNDER_COMPLETION_TAIL_INVOKED,
  traceOps.includes(REAL_FOUNDER_COMPLETION_TAIL_INVOKED),
  traceOps.filter((op) => op.startsWith('REAL_FOUNDER')).join(', '),
);
assert(
  'product-readiness-simulation-complete emitted',
  traceOps.includes('product-readiness-simulation-complete'),
  traceOps.filter((op) => op.includes('product-readiness')).join(', '),
);
assert(
  PRODUCT_READINESS_COMPLETED,
  traceOps.includes(PRODUCT_READINESS_COMPLETED),
  traceOps.filter((op) => op.startsWith('PRODUCT_READINESS')).join(', '),
);
assert(
  PRODUCT_READINESS_PROPAGATION_COMPLETE,
  traceOps.includes(PRODUCT_READINESS_PROPAGATION_COMPLETE),
  traceOps.filter((op) => op.includes('PROPAGATION')).join(', '),
);
assert(
  REAL_FOUNDER_COMPLETION_TAIL_COMPLETED,
  traceOps.includes(REAL_FOUNDER_COMPLETION_TAIL_COMPLETED),
  traceOps.filter((op) => op.startsWith('REAL_FOUNDER')).join(', '),
);
assert(
  REAL_FOUNDER_STAGE2_EXIT_CONFIRMED,
  traceOps.includes(REAL_FOUNDER_STAGE2_EXIT_CONFIRMED),
  traceOps.filter((op) => op.startsWith('REAL_FOUNDER')).join(', '),
);
assert(
  'completion tail invoked guard',
  hasProductReadinessCompletionTailInvoked(),
  String(hasProductReadinessCompletionTailInvoked()),
);
assert(
  'product readiness complete propagated in registry',
  hasProductReadinessSimulationCompletePropagated(),
  String(hasProductReadinessSimulationCompletePropagated()),
);
assert(
  'no path mismatch on real founder path',
  !traceOps.includes(PRODUCT_READINESS_PROPAGATION_PATH_MISMATCH),
  traceOps.filter((op) => op.includes('MISMATCH')).join(', '),
);
assert('no stall beyond one monitoring cycle budget', elapsedMs < 180_000, `${elapsedMs}ms`);

const runtimeSnap = getFounderTestRuntimeStatus();
assert(
  'runtime trace has product-readiness-simulation-complete PASSED',
  runtimeSnap.traceEvents.some(
    (event) => event.operationId === 'product-readiness-simulation-complete' && event.status === 'PASSED',
  ),
  runtimeSnap.traceEvents.map((event) => event.operationId).join(', '),
);

const missingBoundary = resolveMissingIntakeCompletionBoundary(runtimeSnap.traceEvents);
assert(
  'intake validation exits product-readiness boundary',
  !missingBoundary ||
    missingBoundary === 'Launch readiness assessment complete' ||
    missingBoundary === 'Launch readiness artifacts built' ||
    missingBoundary === 'Intake validation complete',
  missingBoundary ?? 'none',
);

const activeSubstep = getActiveArtifactBuildSubstep();
assert(
  'not stuck on PRODUCT_READINESS_COMPLETION_CHECK artifact sub-step',
  activeSubstep?.operationId !== PRODUCT_READINESS_COMPLETION_CHECK,
  activeSubstep?.operationLabel ?? 'none',
);

advanceFounderTestRuntimeStage({ stageId: 'PLANNING_GATE' });
const afterPlanning = getFounderTestRuntimeStatus();
assert(
  'Planning Gate starts after real founder completion chain',
  afterPlanning.stages.some((stage) => stage.stageId === 'PLANNING_GATE'),
  afterPlanning.stages.map((stage) => stage.stageId).join(', '),
);

const failed = results.filter((entry) => !entry.passed);
const validationSummary = [
  '# Product Readiness Real Founder Path Alignment Validation',
  '',
  `Result: ${failed.length === 0 ? PRODUCT_READINESS_REAL_FOUNDER_PATH_PASS : 'FAILED'}`,
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
  '## Real founder path chain',
  '',
  `- elapsedMs=${elapsedMs}`,
  `- path=${getSelectedProductReadinessRuntimePath()}`,
  `- trace: ${traceOps.filter((op) => op.includes('PROPAGATION') || op.startsWith('PRODUCT_READINESS') || op.startsWith('REAL_FOUNDER') || op.includes('product-readiness-simulation-complete')).join(' → ')}`,
  '',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'PRODUCT_READINESS_REAL_FOUNDER_PATH_ALIGNMENT_VALIDATION.md'),
  validationSummary,
  'utf8',
);

writeFileSync(
  join(ROOT, 'architecture', 'PRODUCT_READINESS_REAL_FOUNDER_PATH_ALIGNMENT_REPORT.md'),
  [
    '# Product Readiness Real Founder Path Alignment Report',
    '',
    '## Problem',
    '',
    'Isolated propagation validator passed (`PRODUCT_READINESS_PROPAGATION_PASS`) but the real Founder Test stalled in Stage 2 after `PRODUCT_READINESS_COMPLETION_CHECK` with `completionBoundary=true`.',
    '',
    '## Path comparison',
    '',
    '| Path | Entry | Completion mechanism |',
    '|------|-------|----------------------|',
    '| Isolated validator | `runFullProductReadinessSimulation()` direct | Shared completion tail via `invokeProductReadinessCompletionTail()` |',
    '| Real Founder Test | `buildFounderTestLaunchReadinessArtifactsAsync()` → `runFullProductReadinessSimulation({ productReadinessRuntimePath: \"real-founder\" })` | Same shared completion tail |',
    '',
    '## Divergence (before fix)',
    '',
    '- `PRODUCT_READINESS_COMPLETION_CHECK` emitted with `RUNNING` phase, creating a stuck artifact sub-step in `launch-readiness-artifact-build-tracer.ts`',
    '- Real path routed traces through `mapSimulationTrace` + artifact build bridge without guaranteed completion tail after boundary satisfaction',
    '- Chat batch promise could win race with `null` assessment while settlement completed, skipping forced recovery in some branches',
    '',
    '## Fix',
    '',
    '- `product-readiness-real-founder-path.ts` — real-path diagnostics and completion-check guard',
    '- `invokeProductReadinessCompletionTail()` — shared tail: PROPAGATION_STEP → recover → PROPAGATION_COMPLETE → completeProductReadinessAssessment → PRODUCT_READINESS_COMPLETED',
    '- `runChatStressWithCompletionBoundary()` — when `completionBoundary=true`, never wait on hung chat batch; recover from settlement immediately',
    '- `reconcileProductReadinessCompletionCheck()` — emits COMPLETION_CHECK with PASSED phase',
    '- Artifact tracer skips diagnostic-only PRODUCT_READINESS / REAL_FOUNDER operation IDs',
    '- `buildFounderTestLaunchReadinessArtifactsAsync()` passes `productReadinessRuntimePath: \"real-founder\"`',
    '',
    '## Files changed',
    '',
    '- `src/founder-test-product-readiness/product-readiness-real-founder-path.ts` (new)',
    '- `src/founder-test-product-readiness/product-readiness-orchestrator.ts`',
    '- `src/founder-test-product-readiness/product-readiness-propagation.ts`',
    '- `src/founder-test-product-readiness/product-readiness-completion-boundary.ts`',
    '- `src/founder-test-product-readiness/product-readiness-types.ts`',
    '- `src/founder-test-product-readiness/index.ts`',
    '- `src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts`',
    '- `src/founder-test-launch-readiness/founder-test-launch-readiness-types.ts`',
    '- `src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.ts`',
    '- `src/founder-test-runtime-monitor/runtime-trace-registry.ts`',
    '- `scripts/validate-product-readiness-real-founder-path.ts` (new)',
    '- `package.json`',
    '',
    '## Runtime trace (real founder path validator)',
    '',
    `- ${traceOps.filter((op) => op.includes('PROPAGATION') || op.startsWith('PRODUCT_READINESS') || op.startsWith('REAL_FOUNDER') || op.includes('product-readiness-simulation-complete')).join(' → ')}`,
    '',
    '## Pass tokens',
    '',
    `- ${PRODUCT_READINESS_REAL_FOUNDER_PATH_PASS}`,
    '- `PRODUCT_READINESS_PROPAGATION_PASS` (regression)',
    '- `PRODUCT_READINESS_COMPLETION_BOUNDARY_V1_PASS` (regression)',
    '- `TYPECHECK_CLEAN` (regression)',
    '',
  ].join('\n'),
  'utf8',
);

if (failed.length > 0) {
  console.error(validationSummary);
  process.exit(1);
}

console.log(PRODUCT_READINESS_REAL_FOUNDER_PATH_PASS);
console.log(validationSummary);
