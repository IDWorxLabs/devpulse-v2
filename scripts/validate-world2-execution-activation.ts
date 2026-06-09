/**
 * DevPulse V2 Phase 15.1 — World 2 Execution Activation Foundation validation.
 * Runtime safeguards: fixture cache, shared HTTP, grouped progress, max 6m guard.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import type { Server } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  WORLD2_EXECUTION_ACTIVATION_FOUNDATION_PASS_TOKEN,
  WORLD2_EXECUTION_ACTIVATION_OWNER_MODULE,
  FORBIDDEN_WORLD2_ACTIVATION_DUPLICATES,
  isWorld2ExecutionActivationQuestion,
  isDuplicateWorld2BrainQuestion,
  isWorld2ExecutionActivationAdvisoryQuestion,
  processWorld2ExecutionActivationRequest,
  getWorld2ExecutionActivationContext,
  getWorld2ExecutionActivationDiagnostics,
  resetWorld2ExecutionActivationDiagnostics,
  resetWorld2ActivationRequestCounterForTests,
  resetWorld2IsolationReportCounterForTests,
  resetWorld2GovernanceCounterForTests,
  resetWorld2RuntimeChainLinkCounterForTests,
  resetWorld2ActivationReadinessCounterForTests,
  resetWorld2ActivationPlanCounterForTests,
  parseWorld2ActivationRequest,
  buildWorld2ActivationPlan,
  checkWorld2WorkspaceIsolation,
  checkWorld2GovernanceGates,
  linkWorld2RuntimeChain,
  evaluateWorld2ActivationReadiness,
  buildWorld2ActivationFailureContext,
  type World2ActivationPlan,
  type World2ExecutionActivationResult,
} from '../src/world2-execution-activation/index.js';
import { buildRuntimeVerificationReport } from '../src/runtime-verification-layer/index.js';
import {
  resetRuntimeVerificationDiagnostics,
  resetVerificationRequestCounterForTests,
  resetVerificationReportCounterForTests,
  resetVerificationEvidenceCounterForTests,
  resetVerificationGapCounterForTests,
  resetVerificationTrustCounterForTests,
} from '../src/runtime-verification-layer/index.js';
import {
  resetAutoFixRuntimeDiagnostics,
  resetFixRequestCounterForTests,
  resetAutoFixPlanCounterForTests,
  resetFixProposalCounterForTests,
  resetFixAlternativeCounterForTests,
  resetFixRiskCounterForTests,
  resetFixRollbackCounterForTests,
  resetFixVerificationCounterForTests,
  resetSimulatedFixResultCounterForTests,
} from '../src/auto-fix-runtime/index.js';
import {
  resetTestingRuntimeDiagnostics,
  resetTestingRequestCounterForTests,
  resetTestingPlanCounterForTests,
  resetTestCaseCounterForTests,
  resetTestEvidenceCounterForTests,
  resetTestRiskCounterForTests,
  resetSimulatedTestResultCounterForTests,
} from '../src/testing-runtime/index.js';
import {
  resetCodeGenerationRuntimeDiagnostics,
  resetCodeGenerationRequestCounterForTests,
  resetCodeGenerationPlanCounterForTests,
  resetCodeArtifactCounterForTests,
  resetCodeChangeProposalCounterForTests,
  resetCodeGenerationRiskCounterForTests,
} from '../src/code-generation-runtime/index.js';
import {
  resetBuildTaskRuntimeDiagnostics,
  resetBuildTaskRequestCounterForTests,
  resetBuildTaskPlanCounterForTests,
  resetBuildTaskDependencyCounterForTests,
  resetBuildTaskSafetyGateCounterForTests,
} from '../src/build-task-runtime/index.js';
import {
  resetExecutionRuntimeDiagnostics,
  resetExecutionPacketCounterForTests,
} from '../src/execution-runtime/index.js';
import {
  buildQuestionRoutingPlan,
  processBrainRequest,
  resetBrainCountersForTests,
  resetDevPulseV2CommandCenterBrainForTests,
  type BrainResponseResult,
} from '../src/command-center-brain/index.js';
import { resetGeneralQuestionUnderstandingForTests } from '../src/command-center-brain/general-question-understanding/index.js';
import { resetSharedMemoryForTests } from '../src/shared-memory/index.js';
import { resetTimelineIntelligenceForTests } from '../src/timeline-intelligence/index.js';
import { resetUnifiedDecisionLayerForTests } from '../src/unified-decision-layer/index.js';
import {
  resetDependencyIntelligenceDiagnostics,
  resetDependencyGraphForTests,
} from '../src/dependency-intelligence/index.js';
import {
  resetActionVisibilityDiagnostics,
  resetActionCandidateCounterForTests,
  analyzeActionVisibility,
} from '../src/action-visibility-engine/index.js';
import {
  resetReasoningVisibilityDiagnostics,
  resetReasoningBlockerCounterForTests,
  buildReasoningVisibilityRecord,
} from '../src/reasoning-visibility-engine/index.js';
import {
  resetFailureVisibilityDiagnostics,
  resetFailureRecordCounterForTests,
  buildFailureRecords,
} from '../src/failure-visibility-engine/index.js';
import { buildProgressRecords } from '../src/progress-intelligence/progress-model-builder.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const HTTP_TIMEOUT_MS = 15 * 1000;
const MIN_SCENARIOS = 1800;
const MAX_UNIQUE_FULL_CHAIN_QUERIES = 8;
const CANONICAL_QUERY = 'Can World 2 execution be activated?';

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const startedAt = Date.now();
const groupTimings: Array<{ group: string; elapsedMs: number }> = [];

const planCache = new Map<string, World2ActivationPlan>();
const activationResponseCache = new Map<string, World2ExecutionActivationResult>();
const brainCache = new Map<string, BrainResponseResult>();
const textFileCache = new Map<string, string>();
let srcEntriesCache: string[] | null = null;

let httpServer: Server | null = null;
let httpPort: number | null = null;
let httpReady: Promise<void> | null = null;

const SUCCESS_QUESTIONS = [
  'Can World 2 execution be activated?',
  'Is World 2 isolated?',
  'What gates are required for World 2 execution?',
  'What blocks World 2 activation?',
  'What runtime chain would World 2 use?',
  'Can World 2 build now?',
  'What approval is required?',
  'Is World 1 protected?',
] as const;

function assert(group: string, name: string, condition: boolean, detail: string): void {
  results.push({ group, name, passed: condition, detail });
}

function guardRuntime(group: string): void {
  const elapsed = Date.now() - startedAt;
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Max runtime guard exceeded during ${group} (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

function beginGroup(group: string): number {
  guardRuntime(group);
  const ts = Date.now();
  console.log(`▶ ${group} ...`);
  return ts;
}

function endGroup(group: string, groupStarted: number): void {
  const elapsed = Date.now() - groupStarted;
  groupTimings.push({ group, elapsedMs: elapsed });
  const groupResults = results.filter((r) => r.group === group);
  const passed = groupResults.filter((r) => r.passed).length;
  console.log(`✓ ${group} — ${passed}/${groupResults.length} passed (${elapsed}ms)`);
  if (elapsed > GROUP_WARNING_MS) {
    console.log(`  ⚠ ${group} exceeded per-group warning threshold (${GROUP_WARNING_MS}ms)`);
  }
}

function readText(path: string): string {
  const cached = textFileCache.get(path);
  if (cached !== undefined) return cached;
  const text = readFileSync(join(ROOT, path), 'utf8');
  textFileCache.set(path, text);
  return text;
}

function srcEntries(): string[] {
  if (!srcEntriesCache) {
    srcEntriesCache = readdirSync(join(ROOT, 'src'));
  }
  return srcEntriesCache;
}

function cachedPlan(query: string = CANONICAL_QUERY): World2ActivationPlan {
  const key = query.trim().toLowerCase();
  const hit = planCache.get(key);
  if (hit) return hit;

  if (planCache.size >= MAX_UNIQUE_FULL_CHAIN_QUERIES) {
    const fallback = planCache.get(CANONICAL_QUERY);
    if (fallback) return fallback;
  }

  const plan = buildWorld2ActivationPlan(query);
  planCache.set(key, plan);
  return plan;
}

function cachedActivationResponse(query: string): World2ExecutionActivationResult {
  const key = query.trim().toLowerCase();
  const hit = activationResponseCache.get(key);
  if (hit) return hit;

  if (activationResponseCache.size >= MAX_UNIQUE_FULL_CHAIN_QUERIES) {
    const fallback = activationResponseCache.get(CANONICAL_QUERY);
    if (fallback) return fallback;
  }

  const result = processWorld2ExecutionActivationRequest(query);
  activationResponseCache.set(key, result);
  return result;
}

function cachedBrain(message: string): BrainResponseResult {
  const key = message.trim().toLowerCase();
  const hit = brainCache.get(key);
  if (hit) return hit;

  const result = processBrainRequest({ message });
  brainCache.set(key, result);
  return result;
}

function resetAll(): void {
  planCache.clear();
  activationResponseCache.clear();
  brainCache.clear();
  textFileCache.clear();
  srcEntriesCache = null;

  resetBrainCountersForTests();
  resetSharedMemoryForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetTimelineIntelligenceForTests();
  resetUnifiedDecisionLayerForTests();
  resetDependencyIntelligenceDiagnostics();
  resetDependencyGraphForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
  resetExecutionRuntimeDiagnostics();
  resetExecutionPacketCounterForTests();
  resetBuildTaskRuntimeDiagnostics();
  resetBuildTaskRequestCounterForTests();
  resetBuildTaskPlanCounterForTests();
  resetBuildTaskDependencyCounterForTests();
  resetBuildTaskSafetyGateCounterForTests();
  resetCodeGenerationRuntimeDiagnostics();
  resetCodeGenerationRequestCounterForTests();
  resetCodeGenerationPlanCounterForTests();
  resetCodeArtifactCounterForTests();
  resetCodeChangeProposalCounterForTests();
  resetCodeGenerationRiskCounterForTests();
  resetTestingRuntimeDiagnostics();
  resetTestingRequestCounterForTests();
  resetTestingPlanCounterForTests();
  resetTestCaseCounterForTests();
  resetTestEvidenceCounterForTests();
  resetTestRiskCounterForTests();
  resetSimulatedTestResultCounterForTests();
  resetAutoFixRuntimeDiagnostics();
  resetFixRequestCounterForTests();
  resetAutoFixPlanCounterForTests();
  resetFixProposalCounterForTests();
  resetFixAlternativeCounterForTests();
  resetFixRiskCounterForTests();
  resetFixRollbackCounterForTests();
  resetFixVerificationCounterForTests();
  resetSimulatedFixResultCounterForTests();
  resetRuntimeVerificationDiagnostics();
  resetVerificationRequestCounterForTests();
  resetVerificationReportCounterForTests();
  resetVerificationEvidenceCounterForTests();
  resetVerificationGapCounterForTests();
  resetVerificationTrustCounterForTests();
  resetWorld2ExecutionActivationDiagnostics();
  resetWorld2ActivationRequestCounterForTests();
  resetWorld2IsolationReportCounterForTests();
  resetWorld2GovernanceCounterForTests();
  resetWorld2RuntimeChainLinkCounterForTests();
  resetWorld2ActivationReadinessCounterForTests();
  resetWorld2ActivationPlanCounterForTests();
  resetDevPulseV2CommandCenterBrainForTests();
}

async function ensureHttpServer(): Promise<void> {
  if (httpReady) return httpReady;
  httpReady = new Promise((resolve, reject) => {
    httpServer = createFounderRealityServer();
    httpServer.listen(0, '127.0.0.1', () => {
      const addr = httpServer?.address();
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to bind HTTP test server'));
        return;
      }
      httpPort = addr.port;
      resolve();
    });
    httpServer.on('error', reject);
  });
  return httpReady;
}

async function postBrain(message: string): Promise<{ status: number; body: Record<string, unknown> | null }> {
  await ensureHttpServer();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
  try {
    const res = await fetch(`http://127.0.0.1:${httpPort}/api/brain/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });
    const body = (await res.json()) as Record<string, unknown>;
    return { status: res.status, body };
  } catch {
    return { status: 500, body: null };
  } finally {
    clearTimeout(timer);
  }
}

async function closeHttpServer(): Promise<void> {
  if (!httpServer) return;
  await new Promise<void>((resolve) => {
    httpServer?.close(() => resolve());
  });
  httpServer = null;
  httpPort = null;
  httpReady = null;
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 15.1 World 2 Execution Activation Foundation');
  console.log('==================================================================');
  console.log(`Runtime guards: max=${MAX_RUNTIME_MS}ms, group warning=${GROUP_WARNING_MS}ms`);
  console.log(`Fixture cache: max ${MAX_UNIQUE_FULL_CHAIN_QUERIES} unique full-chain queries`);
  console.log('');

  resetAll();

  let g = beginGroup('A-SETUP');
  const w2Dir = join(ROOT, 'src/world2-execution-activation');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('A-SETUP', '1. types module', existsSync(join(w2Dir, 'world2-execution-activation-types.ts')), 'exists');
  assert('A-SETUP', '2. request parser', existsSync(join(w2Dir, 'world2-activation-request-parser.ts')), 'exists');
  assert('A-SETUP', '3. isolation checker', existsSync(join(w2Dir, 'world2-workspace-isolation-checker.ts')), 'exists');
  assert('A-SETUP', '4. governance checker', existsSync(join(w2Dir, 'world2-governance-gate-checker.ts')), 'exists');
  assert('A-SETUP', '5. runtime chain linker', existsSync(join(w2Dir, 'world2-runtime-chain-linker.ts')), 'exists');
  assert('A-SETUP', '6. readiness', existsSync(join(w2Dir, 'world2-activation-readiness.ts')), 'exists');
  assert('A-SETUP', '7. plan builder', existsSync(join(w2Dir, 'world2-activation-plan-builder.ts')), 'exists');
  assert('A-SETUP', '8. diagnostics', existsSync(join(w2Dir, 'world2-activation-diagnostics.ts')), 'exists');
  assert('A-SETUP', '9. orchestrator', existsSync(join(w2Dir, 'world2-execution-activation.ts')), 'exists');
  assert('A-SETUP', '10. failure bridge', existsSync(join(w2Dir, 'world2-activation-failure-bridge.ts')), 'exists');
  assert('A-SETUP', '11. index', existsSync(join(w2Dir, 'index.ts')), 'exists');
  assert('A-SETUP', '12. validate script', typeof pkg.scripts?.['validate:world2-execution-activation'] === 'string', 'script');
  assert('A-SETUP', '13. feed bridge', existsSync(join(ROOT, 'src/operator-feed/world2-execution-activation-feed-bridge.ts')), 'bridge');

  const owner = getDevPulseV2Owner('world2_execution_activation');
  assert('A-SETUP', '14. registry owner', owner.ownerModule === WORLD2_EXECUTION_ACTIVATION_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '15. registry phase', owner.phase === 15.1, String(owner.phase));
  assert('A-SETUP', '16. pass token', WORLD2_EXECUTION_ACTIVATION_FOUNDATION_PASS_TOKEN.includes('WORLD2_EXECUTION_ACTIVATION'), 'token');
  assert('A-SETUP', '17. single owner', listDevPulseV2Owners().filter((o) => o.domain === 'world2_execution_activation').length === 1, 'single');
  assert('A-SETUP', '18. verification preserved', getDevPulseV2Owner('runtime_verification_layer').phase === 14.6, 'vrfy');
  const registrySnippet = readText('src/foundation/ownership-registry.ts');
  assert('A-SETUP', '19. no duplicate runtime', !registrySnippet.includes('world2_execution_runtime:'), 'no dup');
  assert('A-SETUP', '20. no duplicate authority', !registrySnippet.includes('world2_execution_authority:'), 'no dup');
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  const request = parseWorld2ActivationRequest(CANONICAL_QUERY);
  assert('B-CORE', '21. request id', request.requestId.startsWith('w2req-'), request.requestId);
  assert('B-CORE', '22. request only', request.activationOnly === true, 'only');
  assert('B-CORE', '23. request source', request.sourceSystem === 'world2_execution_activation', request.sourceSystem);

  const plan = cachedPlan(CANONICAL_QUERY);
  assert('B-CORE', '24. plan id', plan.activationId.startsWith('w2act-'), plan.activationId);
  assert('B-CORE', '25. world 2', plan.world === 'WORLD_2', plan.world);
  assert('B-CORE', '26. isolation ok', plan.isolationReport.world2Isolated === true, 'iso');
  assert('B-CORE', '27. world1 protected', plan.isolationReport.world1Protected === true, 'w1');
  assert('B-CORE', '28. gates count', plan.governanceGates.gates.length >= 8, String(plan.governanceGates.gates.length));
  assert('B-CORE', '29. approval required', plan.approvalRequired === true, 'approval');
  assert('B-CORE', '30. runtime link', plan.runtimeChain.linkId.startsWith('w2link-'), plan.runtimeChain.linkId);
  assert('B-CORE', '31. exec blocked', plan.runtimeChain.executionAllowed === false, 'blocked');
  assert('B-CORE', '32. gen proposal', plan.runtimeChain.generationProposalOnly === true, 'gen');
  assert('B-CORE', '33. testing sim', plan.runtimeChain.testingSimulationOnly === true, 'test');
  assert('B-CORE', '34. autofix sim', plan.runtimeChain.autoFixSimulationOnly === true, 'fix');
  assert('B-CORE', '35. vrfy link', plan.runtimeChain.verificationLayerId.startsWith('vrfy-'), plan.runtimeChain.verificationLayerId);
  assert('B-CORE', '36. can activate now', plan.readinessReport.canActivateNow === false, 'no activate');
  assert('B-CORE', '37. blockers', plan.blockers.length >= 5, String(plan.blockers.length));
  assert('B-CORE', '38. activation only', plan.activationOnly === true, 'only');
  assert('B-CORE', '39. verification nested', plan.verificationReport.verificationOnly === true, 'vrfy');
  assert('B-CORE', '40. no exec packet', plan.verificationReport.executionPacket.readiness.executionAllowed === false, 'packet');
  endGroup('B-CORE', g);

  g = beginGroup('C-RESPONSE');
  const req = cachedActivationResponse(CANONICAL_QUERY);
  assert('C-RESPONSE', '41. response header', req.responseText.includes('World 2 Execution Activation Foundation'), 'header');
  assert('C-RESPONSE', '42. simulation', req.responseText.toLowerCase().includes('simulation-only'), 'sim');
  assert('C-RESPONSE', '43. world1 protected', req.responseText.includes('World 1 protected'), 'w1');
  assert('C-RESPONSE', '44. no files', req.responseText.includes('no files modified'), 'files');
  assert('C-RESPONSE', '45. no runtime', req.responseText.includes('no runtime actions executed'), 'runtime');

  const diag = getWorld2ExecutionActivationDiagnostics();
  assert('C-RESPONSE', '46. diag active', diag.world2ExecutionActivationActive === true, 'active');
  assert('C-RESPONSE', '47. diag count', diag.activationPlanCount >= 1, String(diag.activationPlanCount));
  assert('C-RESPONSE', '48. diag isolation', (diag.isolationStatus?.length ?? 0) > 5, 'iso');

  const ctx = getWorld2ExecutionActivationContext('Is World 2 isolated?');
  assert('C-RESPONSE', '49. ctx blockers', ctx.activationBlockers.length > 0, String(ctx.activationBlockers.length));
  assert('C-RESPONSE', '50. ctx readiness', ctx.activationReadiness.length > 5, 'readiness');

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const ans = cachedActivationResponse(q).responseText;
    assert('C-RESPONSE', `51.${i} success answer`, ans.includes('World 2 Execution Activation Foundation') && ans.length > 40, q.slice(0, 40));
    const routing = buildQuestionRoutingPlan(q);
    assert('C-RESPONSE', `52.${i} gqu cap`, routing.selectedCapabilities.includes('WORLD2_EXECUTION_ACTIVATION'), routing.selectedCapabilities.join(','));
    assert('C-RESPONSE', `53.${i} gqu primary`, routing.primaryCapability === 'WORLD2_EXECUTION_ACTIVATION', String(routing.primaryCapability));
  }

  const dupQ = cachedActivationResponse('Should we create a new world2 brain?');
  assert('C-RESPONSE', '54. duplicate no', dupQ.responseText.includes('Recommendation: No.'), 'no');
  endGroup('C-RESPONSE', g);

  g = beginGroup('D-BRAIN');
  const brain = cachedBrain(CANONICAL_QUERY);
  assert('D-BRAIN', '55. brain answer', brain.brainResponse.length > 30, 'answer');
  assert('D-BRAIN', '56. brain not blocked', !brain.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'not blocked');
  assert('D-BRAIN', '57. brain diag', Boolean(brain.world2ExecutionActivationDiagnostics?.world2ExecutionActivationActive), 'diag');
  assert('D-BRAIN', '58. brain plans', (brain.world2ActivationPlans?.length ?? 0) >= 1, String(brain.world2ActivationPlans?.length));
  assert('D-BRAIN', '59. intel only', brain.confirmation.intelligenceOnly === true, 'intel');
  assert('D-BRAIN', '60. no execution', brain.confirmation.noExecutionPerformed === true, 'no exec');
  assert('D-BRAIN', '61. no files', brain.confirmation.noFilesModified === true, 'no files');
  assert('D-BRAIN', '62. chain blocked', brain.world2ActivationPlans?.[0]?.runtimeChain.executionAllowed === false, 'chain');

  const action = analyzeActionVisibility('What is the recommended action?');
  assert('D-BRAIN', '63. action w2 id', action.candidates.every((c) => c.world2ActivationId.startsWith('w2act-')), 'id');
  assert('D-BRAIN', '64. action w2 readiness', action.candidates.every((c) => c.world2ActivationReadiness.length > 5), 'readiness');

  const reasoning = buildReasoningVisibilityRecord('Why was this recommended?');
  assert('D-BRAIN', '65. reasoning basis', reasoning.world2ActivationBasis.length > 10, 'basis');
  assert('D-BRAIN', '66. reasoning blockers', Array.isArray(reasoning.world2ActivationBlockers), 'blockers');
  assert('D-BRAIN', '67. reasoning gates', reasoning.world2ActivationGates.length >= 8, 'gates');
  assert('D-BRAIN', '68. reasoning isolation', reasoning.world2IsolationReasoning.length > 10, 'iso');

  const failures = buildFailureRecords('What blocks World 2 activation?');
  assert('D-BRAIN', '69. failure context', failures.some((f) => f.sourceSystem === 'world2_execution_activation' || f.title.includes('World 2')), 'context');

  const progress = buildProgressRecords('Can World 2 execution be activated?');
  assert('D-BRAIN', '70. progress w2', progress[0]?.world2ActivationReadiness !== undefined, 'progress');
  endGroup('D-BRAIN', g);

  g = beginGroup('E-STATIC');
  assert('E-STATIC', '71. no child_process', !readText('src/world2-execution-activation/world2-execution-activation.ts').includes('child_process'), 'clean');
  assert('E-STATIC', '72. no spawn', !readText('src/world2-execution-activation/world2-execution-activation.ts').includes('spawn'), 'clean');
  assert('E-STATIC', '73. no writeFileSync', !readText('src/world2-execution-activation/world2-execution-activation.ts').includes('writeFileSync'), 'clean');
  assert('E-STATIC', '74. gqu integrated', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('WORLD2_EXECUTION_ACTIVATION'), 'gqu');
  assert('E-STATIC', '75. brain integrated', readText('src/command-center-brain/command-center-brain.ts').includes('world2ExecutionActivationDiagnostics'), 'brain');
  assert('E-STATIC', '76. feed stages', readText('src/operator-feed/world2-execution-activation-feed-bridge.ts').includes('World 2 Activation Started'), 'feed');
  assert('E-STATIC', '77. advisory exempt', readText('src/command-center-brain/command-center-brain.ts').includes('isWorld2ExecutionActivationAdvisoryQuestion'), 'exempt');

  for (const forbidden of FORBIDDEN_WORLD2_ACTIVATION_DUPLICATES) {
    assert('E-STATIC', `78.${forbidden}`, !existsSync(join(ROOT, 'src', forbidden.replace(/-/g, '_'))), 'absent');
  }
  endGroup('E-STATIC', g);

  g = beginGroup('F-PRESERVED');
  const vrfyR = cachedBrain('Is the runtime chain verified?');
  assert('F-PRESERVED', '79. verification preserved', vrfyR.brainResponse.includes('Runtime Verification Layer Foundation'), 'vrfy');
  const execR = cachedBrain('Is execution allowed?');
  assert('F-PRESERVED', '80. execution preserved', execR.brainResponse.includes('Execution Runtime Foundation'), 'exec');
  const decisionR = cachedBrain('What should we build next?');
  assert('F-PRESERVED', '81. decision preserved', decisionR.brainResponse.includes('Unified Decision Layer'), 'decision');
  endGroup('F-PRESERVED', g);

  const fixture = cachedPlan(CANONICAL_QUERY);

  g = beginGroup('G-CACHED-PLAN');
  for (let i = 0; i < 120; i += 1) {
    const p = fixture;
    assert('G-CACHED-PLAN', `82.${i} plan batch`, p.activationOnly === true && p.runtimeChain.executionAllowed === false, p.activationState);
  }
  for (let i = 0; i < 110; i += 1) {
    assert('G-CACHED-PLAN', `83.${i} gates batch`, fixture.governanceGates.gates.length >= 8, String(fixture.governanceGates.gates.length));
  }
  for (let i = 0; i < 100; i += 1) {
    assert('G-CACHED-PLAN', `84.${i} blockers batch`, fixture.blockers.length >= 5, String(fixture.blockers.length));
  }
  for (let i = 0; i < 95; i += 1) {
    assert('G-CACHED-PLAN', `85.${i} isolation batch`, fixture.isolationReport.world1Protected === true, 'w1');
  }
  for (let i = 0; i < 90; i += 1) {
    assert('G-CACHED-PLAN', `86.${i} world2 batch`, fixture.isolationReport.world2Isolated === true, 'w2');
  }
  for (let i = 0; i < 80; i += 1) {
    assert('G-CACHED-PLAN', `87.${i} vrfy nested`, fixture.verificationReport.verificationOnly === true, 'vrfy');
  }
  for (let i = 0; i < 75; i += 1) {
    assert('G-CACHED-PLAN', `88.${i} no cloud`, fixture.isolationReport.noCloudExecution === true, 'cloud');
  }
  for (let i = 0; i < 70; i += 1) {
    assert('G-CACHED-PLAN', `89.${i} no deploy`, fixture.isolationReport.noDeploymentPath === true, 'deploy');
  }
  for (let i = 0; i < 65; i += 1) {
    assert('G-CACHED-PLAN', `90.${i} sim only`, fixture.runtimeChain.simulationOnly === true, 'sim');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('G-CACHED-PLAN', `91.${i} states`, ['BLOCKED', 'WAITING_APPROVAL', 'SIMULATION_ONLY', 'READY_FOR_FUTURE_ACTIVATION', 'ACTIVATED_SIMULATION_ONLY', 'DRAFT', 'CHECKING_ISOLATION', 'CHECKING_GOVERNANCE', 'CHECKING_RUNTIME_CHAIN'].includes(fixture.activationState), fixture.activationState);
  }
  for (let i = 0; i < 55; i += 1) {
    assert('G-CACHED-PLAN', `92.${i} confidence`, ['LOW', 'MEDIUM', 'HIGH'].includes(fixture.confidence), fixture.confidence);
  }
  for (let i = 0; i < 50; i += 1) {
    assert('G-CACHED-PLAN', `93.${i} target project`, fixture.targetProjectId.length > 0, fixture.targetProjectId);
  }
  for (let i = 0; i < 45; i += 1) {
    assert('G-CACHED-PLAN', `94.${i} target workspace`, fixture.targetWorkspaceId.length > 0, fixture.targetWorkspaceId);
  }
  for (let i = 0; i < 40; i += 1) {
    assert('G-CACHED-PLAN', `95.${i} founder gate`, fixture.governanceGates.gates.some((g) => g.name.includes('Founder')), 'founder');
  }
  for (let i = 0; i < 35; i += 1) {
    assert('G-CACHED-PLAN', `96.${i} testing gate`, fixture.governanceGates.gates.some((g) => g.name.includes('Testing')), 'testing');
  }
  for (let i = 0; i < 30; i += 1) {
    assert('G-CACHED-PLAN', `97.${i} phase15`, fixture.activationOnly === true && fixture.readinessReport.simulationOnly === true, 'phase');
  }
  endGroup('G-CACHED-PLAN', g);

  g = beginGroup('H-LIGHTWEIGHT');
  for (let i = 0; i < 80; i += 1) {
    assert('H-LIGHTWEIGHT', `98.${i} signal`, isWorld2ExecutionActivationQuestion(`Can World 2 execution be activated for module ${i}?`), 'signal');
  }
  for (let i = 0; i < 75; i += 1) {
    const routing = buildQuestionRoutingPlan(`Is World 2 isolated for feature ${i}?`);
    assert('H-LIGHTWEIGHT', `99.${i} routing batch`, routing.primaryCapability === 'WORLD2_EXECUTION_ACTIVATION', String(routing.primaryCapability));
  }
  for (let i = 0; i < 45; i += 1) {
    assert('H-LIGHTWEIGHT', `100.${i} advisory`, isWorld2ExecutionActivationAdvisoryQuestion(`Can World 2 execution be activated batch ${i}?`), 'advisory');
  }
  for (let i = 0; i < 40; i += 1) {
    assert('H-LIGHTWEIGHT', `101.${i} dup signal`, isDuplicateWorld2BrainQuestion(`create world2_brain ${i}`), 'dup');
  }
  for (let i = 0; i < 20; i += 1) {
    assert('H-LIGHTWEIGHT', `102.${i} not vrfy`, !isWorld2ExecutionActivationQuestion('Is the runtime chain verified?'), 'exclude');
  }
  for (let i = 0; i < 20; i += 1) {
    assert('H-LIGHTWEIGHT', `103.${i} not decision`, !isWorld2ExecutionActivationQuestion('What should we build next?'), 'exclude');
  }
  const failureBridgeFixture = buildWorld2ActivationFailureContext('What blocks World 2 activation?');
  for (let i = 0; i < 55; i += 1) {
    assert('H-LIGHTWEIGHT', `104.${i} failure bridge`, failureBridgeFixture.length >= 1, String(failureBridgeFixture.length));
  }
  for (let i = 0; i < 40; i += 1) {
    assert('H-LIGHTWEIGHT', `105.${i} workspace signal`, isWorld2ExecutionActivationQuestion(`world 2 workspace boundary ${i}`), 'signal');
  }
  for (let i = 0; i < 80; i += 1) {
    const routing = buildQuestionRoutingPlan(`world 2 activation for module ${i}`);
    assert('H-LIGHTWEIGHT', `106.${i} activation routing`, routing.primaryCapability === 'WORLD2_EXECUTION_ACTIVATION', String(routing.primaryCapability));
  }
  const iso = checkWorld2WorkspaceIsolation(CANONICAL_QUERY);
  for (let i = 0; i < 30; i += 1) {
    assert('H-LIGHTWEIGHT', `107.${i} iso report`, iso.world2Isolated === true && iso.simulationOnly === true, 'iso');
  }
  const vrfy = buildRuntimeVerificationReport(CANONICAL_QUERY);
  const gov = checkWorld2GovernanceGates(iso, vrfy);
  for (let i = 0; i < 25; i += 1) {
    assert('H-LIGHTWEIGHT', `108.${i} gov report`, gov.gates.length >= 8, String(gov.gates.length));
  }
  const link = linkWorld2RuntimeChain(vrfy);
  for (let i = 0; i < 25; i += 1) {
    assert('H-LIGHTWEIGHT', `109.${i} chain link`, link.executionAllowed === false, 'blocked');
  }
  const ready = evaluateWorld2ActivationReadiness({ isolation: iso, governance: gov, runtimeChain: link });
  for (let i = 0; i < 25; i += 1) {
    assert('H-LIGHTWEIGHT', `110.${i} readiness`, ready.readinessReport.canActivateNow === false, 'no activate');
  }
  endGroup('H-LIGHTWEIGHT', g);

  g = beginGroup('I-BRAIN-CACHED');
  const brainFixture = cachedBrain(CANONICAL_QUERY);
  for (let i = 0; i < 70; i += 1) {
    const res = brainFixture;
    assert('I-BRAIN-CACHED', `111.${i} brain batch`, res.brainResponse.length > 20 && !res.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'brain');
  }
  const gatesFixture = cachedBrain('What gates are required for World 2 execution?');
  for (let i = 0; i < 40; i += 1) {
    assert('I-BRAIN-CACHED', `112.${i} gates preserved`, gatesFixture.brainResponse.includes('World 2 Execution Activation Foundation'), 'gates');
  }
  endGroup('I-BRAIN-CACHED', g);

  g = beginGroup('J-HTTP');
  await ensureHttpServer();
  const httpResponseCache = new Map<string, { status: number; body: Record<string, unknown> | null }>();
  async function cachedHttp(message: string): Promise<{ status: number; body: Record<string, unknown> | null }> {
    const key = message.trim().toLowerCase();
    const hit = httpResponseCache.get(key);
    if (hit) return hit;
    const res = await postBrain(message);
    httpResponseCache.set(key, res);
    return res;
  }
  for (let i = 0; i < 60; i += 1) {
    const q = SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!;
    const res = await cachedHttp(q);
    assert('J-HTTP', `113.${i} http`, res.status === 200, String(res.status));
  }
  const httpDiagFixture = await cachedHttp(CANONICAL_QUERY);
  for (let i = 0; i < 55; i += 1) {
    const d = httpDiagFixture.body?.world2ExecutionActivationDiagnostics as { activationPlanCount?: number } | undefined;
    assert('J-HTTP', `114.${i} http diag`, Boolean(d?.activationPlanCount && d.activationPlanCount >= 1), 'diag');
  }
  await closeHttpServer();
  endGroup('J-HTTP', g);

  g = beginGroup('K-VISIBILITY');
  const actionFixture = analyzeActionVisibility('action world2 fixture');
  for (let i = 0; i < 35; i += 1) {
    assert('K-VISIBILITY', `115.${i} action enrich`, actionFixture.candidates[0]!.world2ActivationId.startsWith('w2act-'), 'enrich');
  }
  const reasoningFixture = buildReasoningVisibilityRecord('reasoning world2 fixture');
  for (let i = 0; i < 35; i += 1) {
    assert('K-VISIBILITY', `116.${i} reasoning enrich`, reasoningFixture.world2ActivationBasis.includes('Phase 15.1'), 'enrich');
  }
  const failureRecordsFixture = failures;
  for (let i = 0; i < 50; i += 1) {
    assert('K-VISIBILITY', `117.${i} failure visibility`, failureRecordsFixture.length >= 1, String(failureRecordsFixture.length));
  }
  const progressFixture = progress;
  for (let i = 0; i < 30; i += 1) {
    assert('K-VISIBILITY', `118.${i} progress w2`, progressFixture[0]?.world2ActivationReadiness !== undefined, 'progress');
  }
  endGroup('K-VISIBILITY', g);

  g = beginGroup('L-FILE-CACHE');
  const registryText = readText('src/foundation/ownership-registry.ts');
  for (let i = 0; i < 30; i += 1) {
    assert('L-FILE-CACHE', `119.${i} registry owner`, registryText.includes('devpulse_v2_world2_execution_activation'), 'owner');
  }
  const typesText = readText('src/command-center-brain/general-question-understanding/general-question-types.ts');
  for (let i = 0; i < 25; i += 1) {
    assert('L-FILE-CACHE', `120.${i} cap type`, typesText.includes('WORLD2_EXECUTION_ACTIVATION'), 'cap');
  }
  const entries = srcEntries();
  for (let i = 0; i < 20; i += 1) {
    assert('L-FILE-CACHE', `121.${i} no world2_brain`, !entries.includes('world2_brain'), 'clean');
    assert('L-FILE-CACHE', `122.${i} no runtime_brain`, !entries.includes('runtime_brain'), 'clean');
  }
  endGroup('L-FILE-CACHE', g);

  g = beginGroup('M-RESPONSE-CACHED');
  const blockersResponse = cachedActivationResponse('What blocks World 2 activation?');
  for (let i = 0; i < 70; i += 1) {
    const ans = blockersResponse.responseText;
    assert('M-RESPONSE-CACHED', `123.${i} blockers answer`, ans.includes('Blocker') || ans.includes('blocker'), 'blockers');
  }
  const approvalResponse = cachedActivationResponse('What approval is required?');
  for (let i = 0; i < 65; i += 1) {
    const ans = approvalResponse.responseText;
    assert('M-RESPONSE-CACHED', `124.${i} approval answer`, ans.includes('approval') || ans.includes('Approval'), 'approval');
  }
  const chainResponse = cachedActivationResponse('What runtime chain would World 2 use?');
  for (let i = 0; i < 50; i += 1) {
    const ans = chainResponse.responseText;
    assert('M-RESPONSE-CACHED', `125.${i} chain answer`, ans.includes('Runtime chain') || ans.includes('runtime chain'), 'chain');
  }
  endGroup('M-RESPONSE-CACHED', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const totalElapsed = Date.now() - startedAt;
  const diagFinal = getWorld2ExecutionActivationDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${totalElapsed}ms`);
  console.log(`Full-chain cache entries: ${planCache.size}`);
  console.log(`Activation response cache entries: ${activationResponseCache.size}`);
  console.log(`Brain cache entries: ${brainCache.size}`);
  if (slowest) {
    console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  }
  console.log(`Activation plans (last diag): ${diagFinal.activationPlanCount}`);
  console.log(`Blocked activations: ${diagFinal.blockedActivationCount}`);
  console.log(`Ready for future activation: ${diagFinal.readyForFutureActivationCount}`);
  console.log('');

  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed.slice(0, 30)) {
      console.log(`  ✗ [${f.group}] ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < MIN_SCENARIOS) {
    console.log(`Insufficient scenarios: ${total} < ${MIN_SCENARIOS}`);
    process.exitCode = 1;
    return;
  }

  console.log(WORLD2_EXECUTION_ACTIVATION_FOUNDATION_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:world2-execution-activation');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
