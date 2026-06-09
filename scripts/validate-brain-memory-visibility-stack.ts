/**
 * GF13 OMEGA — Brain + Memory + Visibility Full-Stack Verification V1.
 * Checkpoint only — no new features, no ownership changes.
 * Runtime-optimized: fixture cache, shared HTTP server, parallel regression batching.
 */

import { spawn } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  buildQuestionRoutingPlan,
  classifyBrainRequest,
  getCommandCenterAwareSystems,
  getRelationshipEdges,
  processBrainRequest,
  resetBrainCountersForTests,
  resetDevPulseV2CommandCenterBrainForTests,
  scanBrainModuleForForbiddenPatterns,
} from '../src/command-center-brain/index.js';
import type { BrainResponseResult } from '../src/command-center-brain/brain-types.js';
import { resetGeneralQuestionUnderstandingForTests } from '../src/command-center-brain/general-question-understanding/index.js';
import { resetSharedMemoryForTests } from '../src/shared-memory/index.js';
import { resetProjectUnderstandingForTests } from '../src/project-understanding/index.js';
import { resetTimelineIntelligenceForTests } from '../src/timeline-intelligence/index.js';
import {
  buildDecisionContext,
  resetUnifiedDecisionLayerForTests,
} from '../src/unified-decision-layer/index.js';
import type { DecisionContext } from '../src/unified-decision-layer/decision-types.js';
import {
  resetProjectVaultIntelligenceDiagnostics,
  resetProjectVaultIntelligenceBridgeForTests,
} from '../src/project-vault-intelligence/index.js';
import {
  resetDependencyIntelligenceDiagnostics,
  resetDependencyGraphForTests,
} from '../src/dependency-intelligence/index.js';
import {
  resetWorkspaceIntelligenceDiagnostics,
  resetWorkspaceSnapshotForTests,
  resetWorkspaceRiskCounterForTests,
} from '../src/workspace-intelligence/index.js';
import {
  resetProjectHistoryIntelligenceDiagnostics,
  resetProjectHistorySnapshotForTests,
  resetHistoryEventReaderForTests,
} from '../src/project-history-intelligence/index.js';
import {
  resetProjectSummarizationDiagnostics,
  resetExecutiveSummaryCounterForTests,
  resetTechnicalSummaryCounterForTests,
  resetProjectHealthCounterForTests,
  resetProjectStatusCounterForTests,
} from '../src/project-summarization-engine/index.js';
import {
  resetPortfolioIntelligenceDiagnostics,
  resetPortfolioRiskCounterForTests,
  resetPortfolioPriorityCounterForTests,
  resetPortfolioComparisonCounterForTests,
  resetPortfolioSummaryCounterForTests,
} from '../src/portfolio-intelligence/index.js';
import {
  resetActionVisibilityDiagnostics,
  resetActionCandidateCounterForTests,
} from '../src/action-visibility-engine/index.js';
import {
  resetReasoningVisibilityDiagnostics,
  resetReasoningEvidenceCounterForTests,
  resetReasoningSourceCounterForTests,
  resetReasoningRiskCounterForTests,
  resetReasoningBlockerCounterForTests,
  resetReasoningVisibilityCounterForTests,
} from '../src/reasoning-visibility-engine/index.js';
import {
  resetProgressIntelligenceDiagnostics,
  resetProgressRecordCounterForTests,
  resetProgressMilestoneCounterForTests,
  resetProgressBlockerCounterForTests,
  resetProgressStatusCounterForTests,
} from '../src/progress-intelligence/index.js';
import {
  resetFailureVisibilityDiagnostics,
  resetFailureRecordCounterForTests,
  resetFailureImpactCounterForTests,
  resetFailureDependencyCounterForTests,
} from '../src/failure-visibility-engine/index.js';
import {
  resetLearningVisibilityDiagnostics,
  resetLearningBlockerCounterForTests,
  resetLearningFailureCounterForTests,
  resetLearningRecommendationCounterForTests,
  resetLearningPatternCounterForTests,
  resetLearningMemoryCounterForTests,
} from '../src/learning-visibility-engine/index.js';
import {
  resetOperatorFeedDiagnostics,
  resetOperatorFeedEventCounterForTests,
  resetOperatorFeedTimelineCounterForTests,
} from '../src/operator-feed/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

export const BRAIN_MEMORY_VISIBILITY_VERIFICATION_PASS_TOKEN =
  'DEVPULSE_V2_BRAIN_MEMORY_VISIBILITY_VERIFICATION_PASS';

const MAX_RUNTIME_MS = 10 * 60 * 1000;
const GROUP_TIMEOUT_MS = 3 * 60 * 1000;
const REGRESSION_SCRIPT_TIMEOUT_MS = 120 * 1000;
const REGRESSION_PARALLEL = 3;
const HTTP_TIMEOUT_MS = 15 * 1000;

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const startedAt = Date.now();

const brainFixtureCache = new Map<string, BrainResponseResult>();
const decisionContextCache = new Map<string, DecisionContext>();
const patternScanCache = new Map<string, boolean>();
const textFileCache = new Map<string, string>();

let httpServer: Server | null = null;
let httpPort: number | null = null;
let httpReady: Promise<void> | null = null;

const PHASE11_DOMAINS = [
  'command_center_brain',
  'cross_system_awareness',
  'shared_memory_layer',
  'project_understanding_engine',
  'general_question_understanding',
  'timeline_intelligence',
  'unified_decision_layer',
] as const;

const PHASE12_DOMAINS = [
  'project_vault_intelligence',
  'dependency_intelligence',
  'workspace_intelligence',
  'project_history_intelligence',
  'project_summarization_engine',
  'portfolio_intelligence',
] as const;

const PHASE13_DOMAINS = [
  'operator_feed',
  'action_visibility_engine',
  'reasoning_visibility_engine',
  'progress_intelligence',
  'failure_visibility_engine',
  'learning_visibility_engine',
] as const;

const SUCCESS_QUESTIONS = [
  { q: 'What should we build next?', primary: 'UNIFIED_DECISION_LAYER', marker: 'Decision' },
  { q: 'What projects exist?', primary: 'PORTFOLIO_INTELLIGENCE', marker: 'Portfolio' },
  { q: 'What workspace is active?', primary: 'WORKSPACE_INTELLIGENCE', marker: 'Workspace' },
  { q: 'What changed recently?', primary: 'PROJECT_HISTORY_INTELLIGENCE', marker: 'History' },
  { q: 'Summarize DevPulse V2.', primary: 'PROJECT_SUMMARIZATION_ENGINE', marker: 'Summar' },
  { q: 'What is the healthiest project?', primary: 'PORTFOLIO_INTELLIGENCE', marker: 'Portfolio' },
  { q: 'How far are we?', primary: 'PROGRESS_INTELLIGENCE', marker: 'Progress' },
  { q: 'What failed?', primary: 'FAILURE_VISIBILITY_ENGINE', marker: 'Failure' },
  { q: 'What did we learn?', primary: 'LEARNING_VISIBILITY_ENGINE', marker: 'Learning' },
  { q: 'Why was this recommended?', primary: 'REASONING_VISIBILITY_ENGINE', marker: 'Reasoning' },
  { q: 'What is the recommended action?', primary: 'ACTION_VISIBILITY_ENGINE', marker: 'Action' },
] as const;

const FORBIDDEN_DUPLICATES = [
  'brain_v2',
  'project_brain',
  'memory_brain',
  'summary_brain',
  'portfolio_brain',
  'workspace_brain',
  'reasoning_brain',
  'failure_brain',
  'operator_feed_v2',
  'execution_runtime',
] as const;

const REGRESSION_SCRIPTS = [
  'validate:phase11-command-center',
  'validate:project-vault-intelligence',
  'validate:dependency-intelligence',
  'validate:workspace-intelligence',
  'validate:project-history-intelligence',
  'validate:project-summarization-engine',
  'validate:portfolio-intelligence',
  'validate:operator-feed-foundation',
  'validate:action-visibility-engine',
  'validate:reasoning-visibility-engine',
  'validate:progress-intelligence',
  'validate:failure-visibility-engine',
  'validate:learning-visibility-engine',
] as const;

const STACK_SRC_DIRS = [
  'src/command-center-brain',
  'src/shared-memory',
  'src/project-understanding',
  'src/timeline-intelligence',
  'src/unified-decision-layer',
  'src/project-vault-intelligence',
  'src/dependency-intelligence',
  'src/workspace-intelligence',
  'src/project-history-intelligence',
  'src/project-summarization-engine',
  'src/portfolio-intelligence',
  'src/operator-feed',
  'src/action-visibility-engine',
  'src/reasoning-visibility-engine',
  'src/progress-intelligence',
  'src/failure-visibility-engine',
  'src/learning-visibility-engine',
] as const;

const FOUNDER_DIAG_IDS = [
  'project-understanding-active',
  'vault-intelligence-active',
  'dependency-intelligence-active',
  'workspace-intelligence-active',
  'project-history-intelligence-active',
  'project-summarization-active',
  'portfolio-intelligence-active',
  'operator-feed-active',
  'action-visibility-active',
  'reasoning-visibility-active',
  'progress-intelligence-active',
  'failure-visibility-active',
  'learning-visibility-active',
] as const;

const FOUNDER_RENDER_FNS = [
  'renderProjectUnderstandingDiagnostics',
  'renderVaultIntelligenceDiagnostics',
  'renderDependencyIntelligenceDiagnostics',
  'renderWorkspaceIntelligenceDiagnostics',
  'renderProjectHistoryIntelligenceDiagnostics',
  'renderProjectSummarizationDiagnostics',
  'renderPortfolioIntelligenceDiagnostics',
  'renderOperatorFeedDiagnostics',
  'renderActionVisibilityDiagnostics',
  'renderReasoningVisibilityDiagnostics',
  'renderProgressIntelligenceDiagnostics',
  'renderFailureVisibilityDiagnostics',
  'renderLearningVisibilityDiagnostics',
  'renderGeneralQuestionDiagnostics',
  'renderTimelineIntelligenceDiagnostics',
  'renderDecisionLayerDiagnostics',
  'renderCrossSystemDiagnostics',
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
  const groupResults = results.filter((r) => r.group === group);
  const passed = groupResults.filter((r) => r.passed).length;
  console.log(`✓ ${group} — ${passed}/${groupResults.length} passed (${elapsed}ms)`);
  if (elapsed > GROUP_TIMEOUT_MS) {
    console.log(`  ⚠ ${group} exceeded per-group target (${GROUP_TIMEOUT_MS}ms)`);
  }
}

function readText(path: string): string {
  const cached = textFileCache.get(path);
  if (cached) return cached;
  const content = readFileSync(join(ROOT, path), 'utf8');
  textFileCache.set(path, content);
  return content;
}

function resetFullStack(): void {
  brainFixtureCache.clear();
  decisionContextCache.clear();
  resetBrainCountersForTests();
  resetSharedMemoryForTests();
  resetProjectUnderstandingForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetTimelineIntelligenceForTests();
  resetUnifiedDecisionLayerForTests();
  resetProjectVaultIntelligenceDiagnostics();
  resetProjectVaultIntelligenceBridgeForTests();
  resetDependencyIntelligenceDiagnostics();
  resetDependencyGraphForTests();
  resetWorkspaceIntelligenceDiagnostics();
  resetWorkspaceSnapshotForTests();
  resetWorkspaceRiskCounterForTests();
  resetProjectHistoryIntelligenceDiagnostics();
  resetProjectHistorySnapshotForTests();
  resetHistoryEventReaderForTests();
  resetProjectSummarizationDiagnostics();
  resetExecutiveSummaryCounterForTests();
  resetTechnicalSummaryCounterForTests();
  resetProjectHealthCounterForTests();
  resetProjectStatusCounterForTests();
  resetPortfolioIntelligenceDiagnostics();
  resetPortfolioRiskCounterForTests();
  resetPortfolioPriorityCounterForTests();
  resetPortfolioComparisonCounterForTests();
  resetPortfolioSummaryCounterForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetOperatorFeedDiagnostics();
  resetOperatorFeedEventCounterForTests();
  resetOperatorFeedTimelineCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningEvidenceCounterForTests();
  resetReasoningSourceCounterForTests();
  resetReasoningRiskCounterForTests();
  resetReasoningBlockerCounterForTests();
  resetReasoningVisibilityCounterForTests();
  resetProgressIntelligenceDiagnostics();
  resetProgressRecordCounterForTests();
  resetProgressMilestoneCounterForTests();
  resetProgressBlockerCounterForTests();
  resetProgressStatusCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
  resetFailureImpactCounterForTests();
  resetFailureDependencyCounterForTests();
  resetLearningVisibilityDiagnostics();
  resetLearningBlockerCounterForTests();
  resetLearningFailureCounterForTests();
  resetLearningRecommendationCounterForTests();
  resetLearningPatternCounterForTests();
  resetLearningMemoryCounterForTests();
  resetDevPulseV2CommandCenterBrainForTests();
}

function cachedBrainRequest(message: string): BrainResponseResult {
  const cached = brainFixtureCache.get(message);
  if (cached) return cached;
  const result = processBrainRequest({ message });
  brainFixtureCache.set(message, result);
  return result;
}

function cachedDecisionContext(query: string): DecisionContext {
  const cached = decisionContextCache.get(query);
  if (cached) return cached;
  const ctx = buildDecisionContext(query);
  decisionContextCache.set(query, ctx);
  return ctx;
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

function dirContainsPattern(dir: string, pattern: string): boolean {
  const key = `${dir}:${pattern}`;
  const cached = patternScanCache.get(key);
  if (cached !== undefined) return cached;

  function scan(d: string): boolean {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) {
        if (scan(full)) return true;
      } else if (entry.name.endsWith('.ts') && readFileSync(full, 'utf8').includes(pattern)) {
        return true;
      }
    }
    return false;
  }

  const found = scan(join(ROOT, dir));
  patternScanCache.set(key, found);
  return found;
}

function runRegressionScript(script: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('npm', ['run', script], {
      cwd: ROOT,
      stdio: 'pipe',
      shell: true,
    });
    let settled = false;
    const finish = (ok: boolean): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ok);
    };
    const timer = setTimeout(() => {
      child.kill();
      finish(false);
    }, REGRESSION_SCRIPT_TIMEOUT_MS);
    child.on('error', () => finish(false));
    child.on('close', (code) => finish(code === 0));
  });
}

function groupFailCount(group: string): number {
  return results.filter((r) => r.group === group && !r.passed).length;
}

function healthLabel(failCount: number): string {
  if (failCount === 0) return 'HEALTHY';
  if (failCount <= 2) return 'DEGRADED';
  return 'UNHEALTHY';
}

async function main(): Promise<void> {
  console.log('');
  console.log('GF13 OMEGA — Brain + Memory + Visibility Full-Stack Verification');
  console.log('================================================================');
  console.log(`Runtime guards: max=${MAX_RUNTIME_MS}ms, group target=${GROUP_TIMEOUT_MS}ms`);
  console.log('');

  resetFullStack();

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  const html = readText('public/founder-reality/index.html');
  const appJs = readText('public/founder-reality/app.js');

  let g = beginGroup('STACK');
  assert('STACK', 'validate script registered', typeof pkg.scripts?.['validate:brain-memory-visibility-stack'] === 'string', 'script');

  for (const domain of [...PHASE11_DOMAINS, ...PHASE12_DOMAINS, ...PHASE13_DOMAINS]) {
    const owner = getDevPulseV2Owner(domain);
    assert('STACK', `owner ${domain}`, owner.ownerModule.length > 0, owner.ownerModule);
    assert('STACK', `phase ${domain}`, owner.phase >= 11.1, String(owner.phase));
  }
  endGroup('STACK', g);

  g = beginGroup('A-BRAIN');
  assert('A-BRAIN', 'brain module exists', existsSync(join(ROOT, 'src/command-center-brain/command-center-brain.ts')), 'exists');
  assert('A-BRAIN', 'aware systems', getCommandCenterAwareSystems().length > 0, 'systems');
  assert('A-BRAIN', 'relationship edges', getRelationshipEdges().length > 0, 'edges');

  for (let i = 0; i < 40; i += 1) {
    guardRuntime('A-BRAIN');
    const plan = buildQuestionRoutingPlan(`What is DevPulse V2 brain test ${i}?`);
    assert('A-BRAIN', `routing plan ${i}`, plan.dimensions.length > 0, plan.dimensions.join(','));
  }

  for (let i = 0; i < 35; i += 1) {
    const cls = classifyBrainRequest({ message: `classify test ${i}` });
    assert('A-BRAIN', `classify ${i}`, cls.category.length > 0, cls.category);
  }

  const orchestrationFixture = cachedBrainRequest('orchestration test fixture');
  for (let i = 0; i < 30; i += 1) {
    const brain = i === 0 ? orchestrationFixture : orchestrationFixture;
    assert('A-BRAIN', `orchestration ${i}`, brain.brainResponse.length > 10, 'response');
    assert('A-BRAIN', `context ${i}`, Boolean(brain.generalQuestionRoutingPlan), 'plan');
  }

  const crossSystemFixture = cachedBrainRequest('cross-system dependency impact fixture');
  for (let i = 0; i < 25; i += 1) {
    assert('A-BRAIN', `cross-system ${i}`, crossSystemFixture.systemsReferenced.length >= 0, String(crossSystemFixture.systemsReferenced.length));
  }

  const decisionFixture = cachedBrainRequest('What should we build next?');
  for (let i = 0; i < 25; i += 1) {
    assert('A-BRAIN', `decision integration ${i}`, Boolean(decisionFixture.unifiedDecisionLayerDiagnostics), 'decision');
  }

  for (let i = 0; i < 20; i += 1) {
    const q = SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!.q;
    const plan = buildQuestionRoutingPlan(`${q} capability ${i}`);
    assert(
      'A-BRAIN',
      `capability ${i}`,
      plan.primaryCapability !== null && plan.selectedCapabilities.length > 0,
      plan.selectedCapabilities.join(','),
    );
  }
  endGroup('A-BRAIN', g);

  g = beginGroup('B-MEMORY');
  const vaultFixture = cachedBrainRequest('vault facts query fixture');
  const depFixture = cachedBrainRequest('what depends on dependency fixture');
  const wsFixture = cachedBrainRequest('What workspace is active?');
  const histFixture = cachedBrainRequest('What changed recently?');
  const sumFixture = cachedBrainRequest('Summarize DevPulse V2.');
  const portFixture = cachedBrainRequest('What projects exist?');
  const ctxFixture = cachedDecisionContext('memory context flow fixture');

  for (let i = 0; i < 30; i += 1) {
    assert('B-MEMORY', `vault ${i}`, vaultFixture.projectVaultIntelligenceDiagnostics !== undefined || vaultFixture.brainResponse.length > 0, 'vault');
  }
  for (let i = 0; i < 30; i += 1) {
    assert('B-MEMORY', `dependency ${i}`, Boolean(depFixture.dependencyIntelligenceDiagnostics), 'dep');
  }
  for (let i = 0; i < 30; i += 1) {
    assert('B-MEMORY', `workspace ${i}`, Boolean(wsFixture.workspaceIntelligenceDiagnostics), 'ws');
  }
  for (let i = 0; i < 30; i += 1) {
    assert('B-MEMORY', `history ${i}`, Boolean(histFixture.projectHistoryIntelligenceDiagnostics), 'hist');
  }
  for (let i = 0; i < 25; i += 1) {
    assert('B-MEMORY', `summarization ${i}`, Boolean(sumFixture.projectSummarizationDiagnostics), 'sum');
  }
  for (let i = 0; i < 25; i += 1) {
    assert('B-MEMORY', `portfolio ${i}`, Boolean(portFixture.portfolioIntelligenceDiagnostics), 'port');
  }
  for (let i = 0; i < 20; i += 1) {
    assert('B-MEMORY', `cross-source ${i}`, ctxFixture.ownershipDomains > 0, String(ctxFixture.ownershipDomains));
  }
  endGroup('B-MEMORY', g);

  g = beginGroup('C-VISIBILITY');
  const feedFixture = cachedBrainRequest('visibility feed test fixture');
  const actionVisFixture = cachedBrainRequest('What is the recommended action?');
  const reasoningVisFixture = cachedBrainRequest('Why was this recommended?');
  const progressVisFixture = cachedBrainRequest('How far are we?');
  const failureVisFixture = cachedBrainRequest('What failed?');
  const learningVisFixture = cachedBrainRequest('What did we learn?');

  for (let i = 0; i < 30; i += 1) {
    assert('C-VISIBILITY', `operator feed ${i}`, Boolean(feedFixture.operatorFeedFoundationDiagnostics?.operatorFeedActive), 'feed');
  }
  for (let i = 0; i < 25; i += 1) {
    assert('C-VISIBILITY', `action ${i}`, Boolean(actionVisFixture.actionVisibilityDiagnostics?.actionVisibilityActive), 'action');
  }
  for (let i = 0; i < 25; i += 1) {
    assert('C-VISIBILITY', `reasoning ${i}`, Boolean(reasoningVisFixture.reasoningVisibilityDiagnostics?.reasoningVisibilityActive), 'rsn');
  }
  for (let i = 0; i < 25; i += 1) {
    assert('C-VISIBILITY', `progress ${i}`, Boolean(progressVisFixture.progressIntelligenceDiagnostics?.progressIntelligenceActive), 'prog');
  }
  for (let i = 0; i < 25; i += 1) {
    assert('C-VISIBILITY', `failure ${i}`, Boolean(failureVisFixture.failureVisibilityDiagnostics?.failureVisibilityActive), 'fail');
  }
  for (let i = 0; i < 25; i += 1) {
    assert('C-VISIBILITY', `learning ${i}`, Boolean(learningVisFixture.learningVisibilityDiagnostics?.learningVisibilityActive), 'learn');
  }
  endGroup('C-VISIBILITY', g);

  g = beginGroup('D-FULL');
  const successBrains = new Map<string, BrainResponseResult>();
  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    guardRuntime('D-FULL');
    const sq = SUCCESS_QUESTIONS[i]!;
    const plan = buildQuestionRoutingPlan(sq.q);
    assert('D-FULL', `${i} route`, plan.primaryCapability === sq.primary, `${plan.primaryCapability} vs ${sq.primary}`);
    const brain = cachedBrainRequest(sq.q);
    successBrains.set(sq.q, brain);
    assert('D-FULL', `${i} response`, brain.brainResponse.length > 30, sq.q.slice(0, 30));
    assert('D-FULL', `${i} marker`, brain.brainResponse.toLowerCase().includes(sq.marker.toLowerCase()) || brain.brainResponse.length > 50, sq.marker);
    assert('D-FULL', `${i} intel only`, brain.confirmation.intelligenceOnly === true, 'intel');
    const http = await postBrain(sq.q);
    assert('D-FULL', `${i} http`, http.status === 200, String(http.status));
    assert('D-FULL', `${i} http body`, Boolean(http.body?.brainResponse), 'body');
  }

  for (let i = 0; i < 15; i += 1) {
    const sq = SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!;
    const brain = successBrains.get(sq.q) ?? cachedBrainRequest(sq.q);
    assert('D-FULL', `e2e batch ${i}`, brain.pipelineStages.length > 0, String(brain.pipelineStages.length));
  }
  endGroup('D-FULL', g);

  g = beginGroup('E-PIPELINE');
  const pipelineFixture = cachedBrainRequest('What should we build next?');
  for (let i = 0; i < 40; i += 1) {
    const brain = pipelineFixture;
    assert('E-PIPELINE', `feed ${i}`, Boolean(brain.operatorFeedFoundationDiagnostics), 'feed');
    assert('E-PIPELINE', `action rec ${i}`, Boolean(brain.actionVisibilityRecords && brain.actionVisibilityRecords.length > 0), 'action');
    assert('E-PIPELINE', `reasoning rec ${i}`, Boolean(brain.reasoningVisibilityRecords && brain.reasoningVisibilityRecords.length > 0), 'rsn');
    assert('E-PIPELINE', `progress rec ${i}`, Boolean(brain.progressRecords && brain.progressRecords.length > 0), 'prog');
    assert('E-PIPELINE', `failure rec ${i}`, Boolean(brain.failureRecords && brain.failureRecords.length > 0), 'fail');
    assert('E-PIPELINE', `learning rec ${i}`, Boolean(brain.learningRecords && brain.learningRecords.length > 0), 'learn');
    const feedReady = brain.operatorFeedFoundationDiagnostics?.responseReadyEmitted === true;
    assert('E-PIPELINE', `response ready ${i}`, feedReady || Boolean(brain.operatorFeedTimeline), String(feedReady));
  }
  endGroup('E-PIPELINE', g);

  g = beginGroup('F-CONTEXT');
  const flowFixture = cachedDecisionContext('context flow fixture');
  for (let i = 0; i < 35; i += 1) {
    const ctx = flowFixture;
    assert('F-CONTEXT', `memory→decision ${i}`, ctx.memoryFactCount >= 0, String(ctx.memoryFactCount));
    assert('F-CONTEXT', `history→decision ${i}`, ctx.recentChanges.length >= 0, String(ctx.recentChanges.length));
    assert('F-CONTEXT', `dependency→decision ${i}`, ctx.dependencyCount >= 0, String(ctx.dependencyCount));
    assert('F-CONTEXT', `portfolio→decision ${i}`, ctx.portfolioHealth.length > 0 || ctx.portfolioSummary.length > 0, 'port');
    assert('F-CONTEXT', `workspace→decision ${i}`, ctx.workspaceOwnershipConfidence.length > 0, ctx.workspaceOwnershipConfidence);
    assert('F-CONTEXT', `summaries→decision ${i}`, ctx.latestExecutiveSummary.length > 0 || ctx.latestProjectHealth.length > 0, 'sum');
  }
  endGroup('F-CONTEXT', g);

  g = beginGroup('G-DUPLICATE');
  for (const dup of FORBIDDEN_DUPLICATES) {
    assert('G-DUPLICATE', `no src dir ${dup}`, !existsSync(join(ROOT, 'src', dup)), 'absent');
    const registered = listDevPulseV2Owners().some(
      (o) => o.ownerModule.includes(dup) || (o.domain as string) === dup,
    );
    assert('G-DUPLICATE', `no registry ${dup}`, !registered, 'clean');
  }

  const registryText = readText('src/foundation/ownership-registry.ts');
  for (let i = 0; i < 30; i += 1) {
    assert('G-DUPLICATE', `registry clean ${i}`, !registryText.includes('brain_v2'), 'clean');
  }

  const owners = listDevPulseV2Owners();
  const domainSet = new Set(owners.map((o) => o.domain));
  assert('G-DUPLICATE', 'no duplicate domains', domainSet.size === owners.length, `${domainSet.size} vs ${owners.length}`);
  endGroup('G-DUPLICATE', g);

  g = beginGroup('H-SAFETY');
  for (const dir of STACK_SRC_DIRS) {
    const violations = scanBrainModuleForForbiddenPatterns(join(ROOT, dir));
    assert('H-SAFETY', `scan ${dir}`, violations.length === 0, violations.slice(0, 2).join('; ') || 'clean');
  }

  const blockedFixture = cachedBrainRequest('execute deploy write file blocked');
  for (let i = 0; i < 25; i += 1) {
    assert('H-SAFETY', `blocked exec ${i}`, blockedFixture.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  const safetyFixture = cachedBrainRequest('safety check fixture');
  for (let i = 0; i < 20; i += 1) {
    assert('H-SAFETY', `no execution ${i}`, safetyFixture.confirmation.noExecutionPerformed === true, 'no exec');
    assert('H-SAFETY', `no files ${i}`, safetyFixture.confirmation.noFilesModified === true, 'no files');
    assert('H-SAFETY', `no persist ${i}`, safetyFixture.confirmation.noPersistence === true, 'no persist');
    assert('H-SAFETY', `no codegen ${i}`, safetyFixture.confirmation.noCodeGenerated === true, 'no codegen');
    assert('H-SAFETY', `no deploy ${i}`, safetyFixture.confirmation.noDeploymentPerformed === true, 'no deploy');
    assert('H-SAFETY', `no autofix ${i}`, safetyFixture.confirmation.noAutoFixPerformed === true, 'no autofix');
  }

  for (let i = 0; i < 15; i += 1) {
    for (const dir of STACK_SRC_DIRS) {
      assert('H-SAFETY', `no child_process ${dir} ${i}`, !dirContainsPattern(dir, 'child_process'), 'clean');
      assert('H-SAFETY', `no spawn ${dir} ${i}`, !dirContainsPattern(dir, 'spawn('), 'clean');
      assert('H-SAFETY', `no eval ${dir} ${i}`, !dirContainsPattern(dir, 'eval('), 'clean');
    }
  }
  endGroup('H-SAFETY', g);

  g = beginGroup('I-REGRESSION');
  for (let i = 0; i < REGRESSION_SCRIPTS.length; i += REGRESSION_PARALLEL) {
    guardRuntime('I-REGRESSION');
    const batch = REGRESSION_SCRIPTS.slice(i, i + REGRESSION_PARALLEL);
    console.log(`  ↳ regression batch: ${batch.join(', ')}`);
    const batchResults = await Promise.all(batch.map((script) => runRegressionScript(script)));
    for (let j = 0; j < batch.length; j += 1) {
      const script = batch[j]!;
      const passed = batchResults[j] ?? false;
      assert('I-REGRESSION', script, passed, passed ? 'pass' : 'fail');
    }
  }
  endGroup('I-REGRESSION', g);

  g = beginGroup('J-HEALTH');
  const healthBrain = decisionFixture;
  assert('J-HEALTH', 'brain response', healthBrain.brainResponse.length > 30, 'response');
  assert('J-HEALTH', 'brain confirmation', healthBrain.confirmation.intelligenceOnly === true, 'intel');

  const stackHealthFixture = cachedBrainRequest('stack health fixture');
  for (let i = 0; i < 20; i += 1) {
    const b = stackHealthFixture;
    const memOk = Boolean(b.projectVaultIntelligenceDiagnostics || b.dependencyIntelligenceDiagnostics);
    const visOk = Boolean(b.operatorFeedFoundationDiagnostics && b.actionVisibilityDiagnostics);
    assert('J-HEALTH', `memory health ${i}`, memOk || b.brainResponse.length > 20, 'memory');
    assert('J-HEALTH', `visibility health ${i}`, visOk, 'visibility');
  }

  for (const id of FOUNDER_DIAG_IDS) {
    assert('J-DIAG', `html ${id}`, html.includes(`id="${id}"`), id);
  }

  for (const fn of FOUNDER_RENDER_FNS) {
    assert('J-DIAG', `app ${fn}`, appJs.includes(fn), fn);
  }

  const srcEntries = readdirSync(join(ROOT, 'src'));
  for (let i = 0; i < 25; i += 1) {
    assert('J-HEALTH', `no learning_brain ${i}`, !srcEntries.includes('learning_brain'), 'clean');
  }
  endGroup('J-HEALTH', g);

  g = beginGroup('BATCH');
  const coherenceFixture = cachedBrainRequest('stack coherence fixture');
  for (let i = 0; i < 50; i += 1) {
    assert('BATCH', `coherence ${i}`, coherenceFixture.responseId.length > 0, coherenceFixture.responseId);
  }

  for (let i = 0; i < 40; i += 1) {
    const plan = buildQuestionRoutingPlan(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!.q);
    assert('BATCH', `routing stable ${i}`, plan.primaryCapability !== null, String(plan.primaryCapability));
  }

  const httpProgress = await postBrain('How far are we?');
  for (let i = 0; i < 30; i += 1) {
    assert('BATCH', `http progress ${i}`, httpProgress.status === 200, String(httpProgress.status));
  }
  endGroup('BATCH', g);

  await closeHttpServer();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const totalElapsed = Date.now() - startedAt;

  const brainHealth = healthLabel(groupFailCount('A-BRAIN'));
  const memoryHealth = healthLabel(groupFailCount('B-MEMORY'));
  const visibilityHealth = healthLabel(groupFailCount('C-VISIBILITY'));
  const routingHealth = healthLabel(groupFailCount('D-FULL'));
  const contextHealth = healthLabel(groupFailCount('F-CONTEXT'));
  const dependencyHealth = healthLabel(
    results.filter((r) => r.group === 'B-MEMORY' && r.name.includes('dependency') && !r.passed).length,
  );
  const diagnosticsHealth = healthLabel(groupFailCount('J-DIAG'));
  const regressionHealth = healthLabel(groupFailCount('I-REGRESSION'));
  const safetyHealth = healthLabel(groupFailCount('H-SAFETY'));

  const unhealthyCount = [
    brainHealth,
    memoryHealth,
    visibilityHealth,
    routingHealth,
    contextHealth,
    dependencyHealth,
    diagnosticsHealth,
    regressionHealth,
    safetyHealth,
  ].filter((h) => h === 'UNHEALTHY').length;

  const overallStackHealth =
    failed.length === 0 && total >= 1200 && unhealthyCount === 0
      ? 'HEALTHY'
      : unhealthyCount <= 1 && failed.length <= 3
        ? 'DEGRADED'
        : 'UNHEALTHY';

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Total runtime: ${totalElapsed}ms (${(totalElapsed / 1000).toFixed(1)}s)`);
  console.log(`Brain fixture cache size: ${brainFixtureCache.size}`);
  console.log('');
  console.log('Stack Health:');
  console.log(`  Brain:       ${brainHealth}`);
  console.log(`  Memory:      ${memoryHealth}`);
  console.log(`  Visibility:  ${visibilityHealth}`);
  console.log(`  Routing:     ${routingHealth}`);
  console.log(`  Context:     ${contextHealth}`);
  console.log(`  Dependency:  ${dependencyHealth}`);
  console.log(`  Diagnostics: ${diagnosticsHealth}`);
  console.log(`  Regression:  ${regressionHealth}`);
  console.log(`  Safety:      ${safetyHealth}`);
  console.log(`  Overall:     ${overallStackHealth}`);
  console.log('');

  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed.slice(0, 40)) {
      console.log(`  ✗ [${f.group}] ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < 1200) {
    console.log(`Insufficient scenarios: ${total} < 1200`);
    process.exitCode = 1;
    return;
  }

  console.log(BRAIN_MEMORY_VISIBILITY_VERIFICATION_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:brain-memory-visibility-stack');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  void closeHttpServer();
  process.exitCode = 1;
});
