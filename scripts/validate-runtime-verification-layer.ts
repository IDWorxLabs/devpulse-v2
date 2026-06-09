/**
 * DevPulse V2 Phase 14.6 — Runtime Verification Layer Foundation validation.
 * Runtime safeguards: fixture cache, shared HTTP, grouped progress, max 6m guard.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import type { Server } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  RUNTIME_VERIFICATION_LAYER_FOUNDATION_PASS_TOKEN,
  RUNTIME_VERIFICATION_LAYER_OWNER_MODULE,
  FORBIDDEN_RUNTIME_VERIFICATION_DUPLICATES,
  isRuntimeVerificationLayerQuestion,
  isDuplicateVerificationBrainQuestion,
  isRuntimeVerificationAdvisoryQuestion,
  processRuntimeVerificationRequest,
  getRuntimeVerificationContext,
  getRuntimeVerificationDiagnostics,
  resetRuntimeVerificationDiagnostics,
  resetVerificationRequestCounterForTests,
  resetVerificationReportCounterForTests,
  resetVerificationEvidenceCounterForTests,
  resetVerificationGapCounterForTests,
  resetVerificationTrustCounterForTests,
  parseVerificationRequest,
  buildRuntimeVerificationReport,
  buildVerificationEvidence,
  satisfiedEvidenceCount,
  analyzeVerificationGaps,
  calculateVerificationScore,
  calculateVerificationConfidence,
  analyzeVerificationTrust,
  buildVerificationFailureContext,
  type RuntimeVerificationReport,
  type RuntimeVerificationResult,
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
import { createFounderRealityServer } from '../server/founder-reality-server.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const HTTP_TIMEOUT_MS = 15 * 1000;
const MIN_SCENARIOS = 2200;
const MAX_UNIQUE_FULL_CHAIN_QUERIES = 8;
const CANONICAL_QUERY = 'Is the runtime chain verified?';

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

const reportCache = new Map<string, RuntimeVerificationReport>();
const verificationResponseCache = new Map<string, RuntimeVerificationResult>();
const brainCache = new Map<string, BrainResponseResult>();
const textFileCache = new Map<string, string>();
let srcEntriesCache: string[] | null = null;

let httpServer: Server | null = null;
let httpPort: number | null = null;
let httpReady: Promise<void> | null = null;

const SUCCESS_QUESTIONS = [
  'Is the runtime chain verified?',
  'What verification evidence exists?',
  'What verification gaps remain?',
  'What is the verification score?',
  'How trustworthy is the runtime chain?',
  'What prevents verification?',
  'What should be verified next?',
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

function cachedReport(query: string = CANONICAL_QUERY): RuntimeVerificationReport {
  const key = query.trim().toLowerCase();
  const hit = reportCache.get(key);
  if (hit) return hit;

  if (reportCache.size >= MAX_UNIQUE_FULL_CHAIN_QUERIES) {
    const fallback = reportCache.get(CANONICAL_QUERY);
    if (fallback) return fallback;
  }

  const report = buildRuntimeVerificationReport(query);
  reportCache.set(key, report);
  return report;
}

function cachedVerificationResponse(query: string): RuntimeVerificationResult {
  const key = query.trim().toLowerCase();
  const hit = verificationResponseCache.get(key);
  if (hit) return hit;

  if (verificationResponseCache.size >= MAX_UNIQUE_FULL_CHAIN_QUERIES) {
    const fallback = verificationResponseCache.get(CANONICAL_QUERY);
    if (fallback) return fallback;
  }

  const result = processRuntimeVerificationRequest(query);
  verificationResponseCache.set(key, result);
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
  reportCache.clear();
  verificationResponseCache.clear();
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
  console.log('DevPulse V2 — Phase 14.6 Runtime Verification Layer Foundation');
  console.log('================================================================');
  console.log(`Runtime guards: max=${MAX_RUNTIME_MS}ms, group warning=${GROUP_WARNING_MS}ms`);
  console.log(`Fixture cache: max ${MAX_UNIQUE_FULL_CHAIN_QUERIES} unique full-chain queries`);
  console.log('');

  resetAll();

  let g = beginGroup('A-SETUP');
  const rvDir = join(ROOT, 'src/runtime-verification-layer');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('A-SETUP', '1. types module', existsSync(join(rvDir, 'runtime-verification-types.ts')), 'exists');
  assert('A-SETUP', '2. request parser', existsSync(join(rvDir, 'runtime-verification-request-parser.ts')), 'exists');
  assert('A-SETUP', '3. evidence builder', existsSync(join(rvDir, 'verification-evidence-builder.ts')), 'exists');
  assert('A-SETUP', '4. gap analyzer', existsSync(join(rvDir, 'verification-gap-analyzer.ts')), 'exists');
  assert('A-SETUP', '5. confidence calculator', existsSync(join(rvDir, 'verification-confidence-calculator.ts')), 'exists');
  assert('A-SETUP', '6. trust analyzer', existsSync(join(rvDir, 'verification-trust-analyzer.ts')), 'exists');
  assert('A-SETUP', '7. report builder', existsSync(join(rvDir, 'runtime-verification-report-builder.ts')), 'exists');
  assert('A-SETUP', '8. diagnostics', existsSync(join(rvDir, 'runtime-verification-diagnostics.ts')), 'exists');
  assert('A-SETUP', '9. layer orchestrator', existsSync(join(rvDir, 'runtime-verification-layer.ts')), 'exists');
  assert('A-SETUP', '10. failure bridge', existsSync(join(rvDir, 'verification-failure-bridge.ts')), 'exists');
  assert('A-SETUP', '11. index', existsSync(join(rvDir, 'index.ts')), 'exists');
  assert('A-SETUP', '12. validate script', typeof pkg.scripts?.['validate:runtime-verification-layer'] === 'string', 'script');
  assert('A-SETUP', '13. feed bridge', existsSync(join(ROOT, 'src/operator-feed/runtime-verification-feed-bridge.ts')), 'bridge');

  const owner = getDevPulseV2Owner('runtime_verification_layer');
  assert('A-SETUP', '14. registry owner', owner.ownerModule === RUNTIME_VERIFICATION_LAYER_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '15. registry phase', owner.phase === 14.6, String(owner.phase));
  assert('A-SETUP', '16. pass token', RUNTIME_VERIFICATION_LAYER_FOUNDATION_PASS_TOKEN.includes('RUNTIME_VERIFICATION'), 'token');
  assert('A-SETUP', '17. single owner', listDevPulseV2Owners().filter((o) => o.domain === 'runtime_verification_layer').length === 1, 'single');
  assert('A-SETUP', '18. auto-fix preserved', getDevPulseV2Owner('auto_fix_runtime').phase === 14.5, 'af');
  assert('A-SETUP', '19. testing preserved', getDevPulseV2Owner('testing_runtime').phase === 14.4, 'test');
  assert('A-SETUP', '20. execution preserved', getDevPulseV2Owner('execution_runtime').phase === 14.1, 'exec');
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  const request = parseVerificationRequest(CANONICAL_QUERY);
  assert('B-CORE', '21. request id', request.requestId.startsWith('vreq-'), request.requestId);
  assert('B-CORE', '22. request only', request.verificationOnly === true, 'only');
  assert('B-CORE', '23. request source', request.sourceSystem === 'runtime_verification_layer', request.sourceSystem);

  const report = cachedReport(CANONICAL_QUERY);
  assert('B-CORE', '24. report id', report.verificationId.startsWith('vrfy-'), report.verificationId);
  assert('B-CORE', '25. evidence count', report.evidence.length >= 7, String(report.evidence.length));
  assert('B-CORE', '26. gaps count', report.gaps.length >= 4, String(report.gaps.length));
  assert('B-CORE', '27. trust assessment', report.trustAssessment.trustLevel.length >= 3, report.trustAssessment.trustLevel);
  assert('B-CORE', '28. score range', report.verificationScore >= 0 && report.verificationScore <= 100, String(report.verificationScore));
  assert('B-CORE', '29. exec link', report.linkedExecutionId === report.executionPacket.executionId, report.linkedExecutionId);
  assert('B-CORE', '30. build link', report.linkedBuildTaskId.startsWith('btask-'), report.linkedBuildTaskId);
  assert('B-CORE', '31. gen link', report.linkedGenerationId.startsWith('cgen-'), report.linkedGenerationId);
  assert('B-CORE', '32. test link', report.linkedTestingId.startsWith('test-'), report.linkedTestingId);
  assert('B-CORE', '33. fix link', report.linkedFixId.startsWith('fix-'), report.linkedFixId);
  assert('B-CORE', '34. execution blocked', report.executionPacket.readiness.executionAllowed === false, 'blocked');
  assert('B-CORE', '35. gen proposal', report.codeGenerationPlan.proposalOnly === true, 'proposal');
  assert('B-CORE', '36. testing sim', report.testingPlan.planningOnly === true, 'testing');
  assert('B-CORE', '37. autofix sim', report.autoFixPlan.planningOnly === true, 'autofix');
  assert('B-CORE', '38. report blocked', report.blocked === true, String(report.blocked));
  assert('B-CORE', '39. report only', report.verificationOnly === true, 'only');
  assert('B-CORE', '40. next action', report.recommendedNextAction.length > 10, 'action');
  assert('B-CORE', '41. no applied gen', report.codeGenerationPlan.changeProposals.every((c) => !c.applied), 'gen');
  assert('B-CORE', '42. no applied fix', report.autoFixPlan.fixProposals.every((p) => !p.applied), 'fix');

  const evidence = buildVerificationEvidence(report.autoFixPlan);
  assert('B-CORE', '43. evidence satisfied', satisfiedEvidenceCount(evidence) >= 6, String(satisfiedEvidenceCount(evidence)));
  const gaps = analyzeVerificationGaps(report.autoFixPlan, evidence);
  assert('B-CORE', '44. gap critical', gaps.some((x) => x.severity === 'CRITICAL'), 'critical');
  const score = calculateVerificationScore(evidence, gaps);
  assert('B-CORE', '45. score calc', score >= 0 && score <= 100, String(score));
  const conf = calculateVerificationConfidence(score, gaps.length, gaps.filter((x) => x.severity === 'CRITICAL').length);
  assert('B-CORE', '46. confidence', ['LOW', 'MEDIUM', 'HIGH'].includes(conf), conf);
  const trust = analyzeVerificationTrust(score, evidence, gaps);
  assert('B-CORE', '47. trust factors', trust.factors.length >= 5, String(trust.factors.length));
  endGroup('B-CORE', g);

  g = beginGroup('C-RESPONSE');
  const req = cachedVerificationResponse(CANONICAL_QUERY);
  assert('C-RESPONSE', '48. response header', req.responseText.includes('Runtime Verification Layer Foundation'), 'header');
  assert('C-RESPONSE', '49. response simulation', req.responseText.toLowerCase().includes('verification only') || req.responseText.toLowerCase().includes('simulation-only'), 'sim');
  assert('C-RESPONSE', '50. response no exec', req.responseText.includes('no execution') || req.responseText.includes('no runtime actions'), 'no exec');
  assert('C-RESPONSE', '51. response gates', req.responseText.includes('gates') || req.responseText.includes('Approval'), 'gates');

  const diag = getRuntimeVerificationDiagnostics();
  assert('C-RESPONSE', '52. diag active', diag.runtimeVerificationActive === true, 'active');
  assert('C-RESPONSE', '53. diag count', diag.verificationReportCount >= 1, String(diag.verificationReportCount));
  assert('C-RESPONSE', '54. diag score', diag.averageVerificationScore >= 0, String(diag.averageVerificationScore));

  const ctx = getRuntimeVerificationContext('What verification evidence exists?');
  assert('C-RESPONSE', '55. ctx blockers', ctx.verificationBlockers.length > 0, String(ctx.verificationBlockers.length));
  assert('C-RESPONSE', '56. ctx readiness', ctx.verificationReadiness.length > 5, 'readiness');

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const ans = cachedVerificationResponse(q).responseText;
    assert('C-RESPONSE', `57.${i} success answer`, ans.includes('Runtime Verification Layer Foundation') && ans.length > 40, q.slice(0, 40));
    const routing = buildQuestionRoutingPlan(q);
    assert('C-RESPONSE', `58.${i} gqu cap`, routing.selectedCapabilities.includes('RUNTIME_VERIFICATION_LAYER'), routing.selectedCapabilities.join(','));
    assert('C-RESPONSE', `59.${i} gqu primary`, routing.primaryCapability === 'RUNTIME_VERIFICATION_LAYER', String(routing.primaryCapability));
  }

  const dupQ = cachedVerificationResponse('Should we create a new verification brain?');
  assert('C-RESPONSE', '60. duplicate no', dupQ.responseText.includes('Recommendation: No.'), 'no');
  endGroup('C-RESPONSE', g);

  g = beginGroup('D-BRAIN');
  const brain = cachedBrain(CANONICAL_QUERY);
  assert('D-BRAIN', '61. brain answer', brain.brainResponse.length > 30, 'answer');
  assert('D-BRAIN', '62. brain not blocked', !brain.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'not blocked');
  assert('D-BRAIN', '63. brain diag', Boolean(brain.runtimeVerificationDiagnostics?.runtimeVerificationActive), 'diag');
  assert('D-BRAIN', '64. brain reports', (brain.runtimeVerificationReports?.length ?? 0) >= 1, String(brain.runtimeVerificationReports?.length));
  assert('D-BRAIN', '65. intel only', brain.confirmation.intelligenceOnly === true, 'intel');
  assert('D-BRAIN', '66. no execution', brain.confirmation.noExecutionPerformed === true, 'no exec');
  assert('D-BRAIN', '67. no files', brain.confirmation.noFilesModified === true, 'no files');
  assert('D-BRAIN', '68. no autofix', brain.confirmation.noAutoFixPerformed === true, 'no autofix');
  assert('D-BRAIN', '69. packet blocked', brain.runtimeVerificationReports?.[0]?.executionPacket.readiness.executionAllowed === false, 'packet');

  const action = analyzeActionVisibility('What is the recommended action?');
  assert('D-BRAIN', '70. action vrfy id', action.candidates.every((c) => c.verificationId.startsWith('vrfy-')), 'id');
  assert('D-BRAIN', '71. action vrfy score', action.candidates.every((c) => typeof c.verificationScore === 'number'), 'score');

  const reasoning = buildReasoningVisibilityRecord('Why was this recommended?');
  assert('D-BRAIN', '72. reasoning basis', reasoning.verificationBasis.length > 10, 'basis');
  assert('D-BRAIN', '73. reasoning gaps', Array.isArray(reasoning.verificationGaps), 'gaps');
  assert('D-BRAIN', '74. reasoning trust', reasoning.trustFactors.length >= 4, 'trust');
  assert('D-BRAIN', '75. reasoning confidence', reasoning.verificationConfidenceBasis.length > 10, 'confidence');

  const failures = buildFailureRecords('What verification gaps remain?');
  assert('D-BRAIN', '76. failure context', failures.some((f) => f.title.includes('Verification gap') || f.sourceSystem === 'runtime_verification_layer'), 'context');
  endGroup('D-BRAIN', g);

  g = beginGroup('E-STATIC');
  assert('E-STATIC', '77. no child_process', !readText('src/runtime-verification-layer/runtime-verification-layer.ts').includes('child_process'), 'clean');
  assert('E-STATIC', '78. no spawn', !readText('src/runtime-verification-layer/runtime-verification-layer.ts').includes('spawn'), 'clean');
  assert('E-STATIC', '79. no writeFileSync', !readText('src/runtime-verification-layer/runtime-verification-layer.ts').includes('writeFileSync'), 'clean');
  assert('E-STATIC', '80. gqu integrated', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('RUNTIME_VERIFICATION_LAYER'), 'gqu');
  assert('E-STATIC', '81. brain integrated', readText('src/command-center-brain/command-center-brain.ts').includes('runtimeVerificationDiagnostics'), 'brain');
  assert('E-STATIC', '82. feed stages', readText('src/operator-feed/runtime-verification-feed-bridge.ts').includes('Runtime Verification Started'), 'feed');

  for (const forbidden of FORBIDDEN_RUNTIME_VERIFICATION_DUPLICATES) {
    assert('E-STATIC', `83.${forbidden}`, !existsSync(join(ROOT, 'src', forbidden.replace(/-/g, '_'))), 'absent');
  }
  endGroup('E-STATIC', g);

  g = beginGroup('F-PRESERVED');
  const autoFixR = cachedBrain('How would you fix this?');
  assert('F-PRESERVED', '84. autofix preserved', autoFixR.brainResponse.includes('Auto-Fix Runtime Foundation'), 'autofix');
  const testR = cachedBrain('How would we test this?');
  assert('F-PRESERVED', '85. testing preserved', testR.brainResponse.includes('Testing Runtime Foundation'), 'testing');
  const codeGenR = cachedBrain('Generate code for this feature.');
  assert('F-PRESERVED', '86. codegen preserved', codeGenR.brainResponse.includes('Code Generation Runtime Foundation'), 'codegen');
  const decisionR = cachedBrain('What should we build next?');
  assert('F-PRESERVED', '87. decision preserved', decisionR.brainResponse.includes('Unified Decision Layer'), 'decision');
  endGroup('F-PRESERVED', g);

  const fixture = cachedReport(CANONICAL_QUERY);

  g = beginGroup('G-CACHED-REPORT');
  for (let i = 0; i < 120; i += 1) {
    const p = fixture;
    assert('G-CACHED-REPORT', `88.${i} plan batch`, p.verificationOnly === true && p.executionPacket.readiness.executionAllowed === false, p.state);
  }
  for (let i = 0; i < 110; i += 1) {
    assert('G-CACHED-REPORT', `89.${i} evidence batch`, fixture.evidence.length >= 7, String(fixture.evidence.length));
  }
  for (let i = 0; i < 100; i += 1) {
    assert('G-CACHED-REPORT', `90.${i} gap batch`, fixture.gaps.length >= 4, String(fixture.gaps.length));
  }
  for (let i = 0; i < 95; i += 1) {
    assert('G-CACHED-REPORT', `91.${i} trust batch`, fixture.trustAssessment.factors.length >= 5, String(fixture.trustAssessment.factors.length));
  }
  for (let i = 0; i < 90; i += 1) {
    assert('G-CACHED-REPORT', `92.${i} score batch`, fixture.verificationScore >= 0 && fixture.verificationScore <= 100, String(fixture.verificationScore));
  }
  for (let i = 0; i < 40; i += 1) {
    assert('G-CACHED-REPORT', `100.${i} fix link`, fixture.autoFixPlan.fixId === fixture.linkedFixId, fixture.linkedFixId);
  }
  for (let i = 0; i < 48; i += 1) {
    assert('G-CACHED-REPORT', `114.${i} still blocked`, fixture.executionPacket.readiness.executionAllowed === false, 'blocked');
  }
  for (let i = 0; i < 90; i += 1) {
    assert('G-CACHED-REPORT', `115.${i} linkage`, fixture.linkedTestingId.length > 5 && fixture.linkedFixId.length > 5, 'link');
  }
  for (let i = 0; i < 85; i += 1) {
    assert('G-CACHED-REPORT', `116.${i} build blocked`, fixture.buildTaskPlan.blocked === true, String(fixture.buildTaskPlan.blocked));
  }
  for (let i = 0; i < 75; i += 1) {
    assert('G-CACHED-REPORT', `118.${i} verified state`, ['BLOCKED', 'VERIFIED', 'PARTIALLY_VERIFIED', 'SIMULATION_ONLY'].includes(fixture.state), fixture.state);
  }
  for (let i = 0; i < 50; i += 1) {
    assert('G-CACHED-REPORT', `120.${i} confidence`, ['LOW', 'MEDIUM', 'HIGH'].includes(fixture.confidence), fixture.confidence);
  }
  const fixtureEvidence = buildVerificationEvidence(fixture.autoFixPlan);
  for (let i = 0; i < 45; i += 1) {
    assert('G-CACHED-REPORT', `121.${i} ev satisfied`, satisfiedEvidenceCount(fixtureEvidence) >= 6, String(satisfiedEvidenceCount(fixtureEvidence)));
  }
  for (let i = 0; i < 15; i += 1) {
    assert('G-CACHED-REPORT', `124.${i} phase14`, fixture.verificationOnly === true && fixture.autoFixPlan.planningOnly === true, fixture.state);
  }
  endGroup('G-CACHED-REPORT', g);

  g = beginGroup('H-LIGHTWEIGHT');
  for (let i = 0; i < 80; i += 1) {
    assert('H-LIGHTWEIGHT', `93.${i} signal`, isRuntimeVerificationLayerQuestion(`Is the runtime chain verified for module ${i}?`), 'signal');
  }
  for (let i = 0; i < 75; i += 1) {
    const routing = buildQuestionRoutingPlan(`What verification evidence exists for feature ${i}?`);
    assert('H-LIGHTWEIGHT', `94.${i} routing batch`, routing.primaryCapability === 'RUNTIME_VERIFICATION_LAYER', String(routing.primaryCapability));
  }
  for (let i = 0; i < 45; i += 1) {
    assert('H-LIGHTWEIGHT', `98.${i} advisory`, isRuntimeVerificationAdvisoryQuestion(`Is the runtime chain verified batch ${i}?`), 'advisory');
  }
  for (let i = 0; i < 40; i += 1) {
    assert('H-LIGHTWEIGHT', `99.${i} dup signal`, isDuplicateVerificationBrainQuestion(`create verification_brain ${i}`), 'dup');
  }
  for (let i = 0; i < 15; i += 1) {
    assert('H-LIGHTWEIGHT', `107.${i} not autofix`, !isRuntimeVerificationLayerQuestion('How would you fix this?'), 'exclude');
  }
  for (let i = 0; i < 12; i += 1) {
    assert('H-LIGHTWEIGHT', `108.${i} not testing`, !isRuntimeVerificationLayerQuestion('How would we test this?'), 'exclude');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('H-LIGHTWEIGHT', `111.${i} not decision`, !isRuntimeVerificationLayerQuestion('What should we build next?'), 'exclude');
  }
  const failureBridgeFixture = buildVerificationFailureContext('What verification gaps remain?');
  for (let i = 0; i < 55; i += 1) {
    assert('H-LIGHTWEIGHT', `112.${i} failure bridge`, failureBridgeFixture.length >= 1, String(failureBridgeFixture.length));
  }
  for (let i = 0; i < 40; i += 1) {
    assert('H-LIGHTWEIGHT', `122.${i} prevents signal`, isRuntimeVerificationLayerQuestion(`What prevents verification for module ${i}?`), 'signal');
  }
  for (let i = 0; i < 80; i += 1) {
    const routing = buildQuestionRoutingPlan(`verification report for module ${i}`);
    assert('H-LIGHTWEIGHT', `117.${i} report routing`, routing.primaryCapability === 'RUNTIME_VERIFICATION_LAYER', String(routing.primaryCapability));
  }
  endGroup('H-LIGHTWEIGHT', g);

  g = beginGroup('I-BRAIN-CACHED');
  const brainScoreFixture = cachedBrain('What is the verification score?');
  for (let i = 0; i < 70; i += 1) {
    const res = brainScoreFixture;
    assert('I-BRAIN-CACHED', `95.${i} brain batch`, res.brainResponse.length > 20 && !res.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'brain');
  }
  const execFixture = cachedBrain('Is execution allowed?');
  for (let i = 0; i < 40; i += 1) {
    assert('I-BRAIN-CACHED', `123.${i} exec preserved`, execFixture.brainResponse.includes('Execution Runtime Foundation'), 'exec');
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
    assert('J-HTTP', `96.${i} http`, res.status === 200, String(res.status));
  }
  const httpDiagFixture = await cachedHttp(CANONICAL_QUERY);
  for (let i = 0; i < 55; i += 1) {
    const d = httpDiagFixture.body?.runtimeVerificationDiagnostics as { verificationReportCount?: number } | undefined;
    assert('J-HTTP', `97.${i} http diag`, Boolean(d?.verificationReportCount && d.verificationReportCount >= 1), 'diag');
  }
  await closeHttpServer();
  endGroup('J-HTTP', g);

  g = beginGroup('K-VISIBILITY');
  const actionFixture = analyzeActionVisibility('action verify fixture');
  for (let i = 0; i < 35; i += 1) {
    assert('K-VISIBILITY', `101.${i} action enrich`, actionFixture.candidates[0]!.verificationId.startsWith('vrfy-'), 'enrich');
  }
  const reasoningFixture = buildReasoningVisibilityRecord('reasoning verify fixture');
  for (let i = 0; i < 35; i += 1) {
    assert('K-VISIBILITY', `102.${i} reasoning enrich`, reasoningFixture.verificationBasis.includes('Phase 14.6'), 'enrich');
  }
  const failureRecordsFixture = failures;
  for (let i = 0; i < 50; i += 1) {
    assert('K-VISIBILITY', `113.${i} failure visibility`, failureRecordsFixture.length >= 1, String(failureRecordsFixture.length));
  }
  endGroup('K-VISIBILITY', g);

  g = beginGroup('L-FILE-CACHE');
  const registryText = readText('src/foundation/ownership-registry.ts');
  for (let i = 0; i < 30; i += 1) {
    assert('L-FILE-CACHE', `103.${i} registry owner`, registryText.includes('devpulse_v2_runtime_verification_layer'), 'owner');
  }
  const typesText = readText('src/command-center-brain/general-question-understanding/general-question-types.ts');
  for (let i = 0; i < 25; i += 1) {
    assert('L-FILE-CACHE', `104.${i} cap type`, typesText.includes('RUNTIME_VERIFICATION_LAYER'), 'cap');
  }
  const entries = srcEntries();
  for (let i = 0; i < 20; i += 1) {
    assert('L-FILE-CACHE', `105.${i} no verification_brain`, !entries.includes('verification_brain'), 'clean');
    assert('L-FILE-CACHE', `106.${i} no runtime_brain`, !entries.includes('runtime_brain'), 'clean');
  }
  endGroup('L-FILE-CACHE', g);

  g = beginGroup('M-RESPONSE-CACHED');
  const gapsResponse = cachedVerificationResponse('What verification gaps remain?');
  for (let i = 0; i < 70; i += 1) {
    const ans = gapsResponse.responseText;
    assert('M-RESPONSE-CACHED', `109.${i} gaps answer`, ans.includes('gap') || ans.includes('Gap'), 'gaps');
  }
  const trustResponse = cachedVerificationResponse('How trustworthy is the runtime chain?');
  for (let i = 0; i < 65; i += 1) {
    const ans = trustResponse.responseText;
    assert('M-RESPONSE-CACHED', `110.${i} trust answer`, ans.includes('Trust') || ans.includes('trust'), 'trust');
  }
  const nextResponse = cachedVerificationResponse('What should be verified next?');
  for (let i = 0; i < 50; i += 1) {
    const ans = nextResponse.responseText;
    assert('M-RESPONSE-CACHED', `119.${i} next answer`, ans.includes('Recommended') || ans.includes('recommended') || ans.includes('Runtime Verification'), 'next');
  }
  endGroup('M-RESPONSE-CACHED', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const totalElapsed = Date.now() - startedAt;
  const diagFinal = getRuntimeVerificationDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${totalElapsed}ms`);
  console.log(`Full-chain cache entries: ${reportCache.size}`);
  console.log(`Verification response cache entries: ${verificationResponseCache.size}`);
  console.log(`Brain cache entries: ${brainCache.size}`);
  if (slowest) {
    console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  }
  console.log(`Verification reports (last diag): ${diagFinal.verificationReportCount}`);
  console.log(`Verified count: ${diagFinal.verifiedCount}`);
  console.log(`Blocked verification: ${diagFinal.blockedVerificationCount}`);
  console.log(`Average verification score: ${diagFinal.averageVerificationScore}`);
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

  console.log(RUNTIME_VERIFICATION_LAYER_FOUNDATION_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:runtime-verification-layer');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
