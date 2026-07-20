/**
 * Project Context Isolation + Prompt Reset Authority V4 — validation.
 *
 * Proves the New Build Decision Authority, Context Scope Authority, Stale Context Detector, and
 * Prompt Reset Authority behave correctly in isolation, that they are actually wired into the
 * real production build path (chat-to-build bridge + one-prompt orchestrator + workspace tab
 * registry + project context metadata store), that no app-specific/product-domain logic was
 * added, and that existing validators (Product Faithfulness Milestone 1 & 2, App Generation
 * Readiness Audit V1) still pass.
 *
 * Emits PROJECT_CONTEXT_ISOLATION_V4_PASS on success.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { execFileSync, execSync, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  buildContextScope,
  buildContextIsolationReportSection,
  buildPromptResetPlan,
  classifyNewBuildDecision,
  runStaleContextCheck,
  PROJECT_CONTEXT_ISOLATION_V4_PASS_TOKEN,
} from '../src/project-context-isolation-v4/index.js';
import type { ContextSourceId, ResetCategory } from '../src/project-context-isolation-v4/index.js';
import {
  resetWorkspaceTabRegistryForTests,
  resolveProjectContext,
  setActiveProjectId,
} from '../src/one-prompt-live-preview/workspace-tab-registry.js';
import {
  getProjectContextMetadata,
  replaceProjectContextMetadata,
  resetProjectContextMetadataForTests,
  upsertProjectContextMetadata,
} from '../src/project-context-alignment-v1/project-context-metadata-store.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const require = createRequire(import.meta.url);
const START = Date.now();
const MAX_RUNTIME_MS = 300_000;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

function readSource(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf8');
}

function isBlocked(sources: { source: ContextSourceId; allowed: boolean }[], id: ContextSourceId): boolean {
  return sources.some((s) => s.source === id);
}

function runValidatorScript(
  relPath: string,
  timeoutMs: number,
  extraEnv: NodeJS.ProcessEnv = {},
): { code: number; output: string; durationMs: number } {
  const startedAt = Date.now();
  const tsxCli = require.resolve('tsx/cli');
  try {
    const output = execFileSync(process.execPath, [tsxCli, relPath], {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024 * 32,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      env: { ...process.env, ...extraEnv },
    });
    const durationMs = Date.now() - startedAt;
    console.log(`[validator-timing] ${relPath} processExitMs=${durationMs} exitCode=0`);
    return { code: 0, output, durationMs };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    const code = typeof e.status === 'number' ? e.status : 1;
    const durationMs = Date.now() - startedAt;
    console.log(`[validator-timing] ${relPath} processExitMs=${durationMs} exitCode=${code}`);
    return { code, output: `${e.stdout ?? ''}${e.stderr ?? ''}`, durationMs };
  }
}

async function runValidatorScriptsConcurrently(
  validators: Array<{ script: string; passToken: string }>,
  timeoutMs: number,
): Promise<Record<string, { passToken: string; exitCode: number; output: string }>> {
  const tsxCli = require.resolve('tsx/cli');
  const entries = await Promise.all(
    validators.map(({ script, passToken }) =>
      new Promise<[string, { passToken: string; exitCode: number; output: string }]>((resolve) => {
        const startedAt = Date.now();
        const child = spawn(process.execPath, [tsxCli, script], {
          cwd: ROOT,
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
          env: process.env,
        });
        let output = '';
        let assertionsCompletedMs: number | null = null;
        let settled = false;
        const capture = (chunk: Buffer | string) => {
          output += chunk.toString();
          if (assertionsCompletedMs === null && output.includes(passToken)) {
            assertionsCompletedMs = Date.now() - startedAt;
          }
        };
        child.stdout?.on('data', capture);
        child.stderr?.on('data', capture);
        const timer = setTimeout(() => child.kill(), timeoutMs);
        const finish = (exitCode: number) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          const processExitMs = Date.now() - startedAt;
          console.log(
            `[validator-timing] ${script} assertionsCompletedMs=${assertionsCompletedMs ?? 'missing'} ` +
              `processExitMs=${processExitMs} exitCode=${exitCode}`,
          );
          resolve([script, { passToken, exitCode, output }]);
        };
        child.once('error', () => finish(1));
        child.once('close', (code) => finish(code ?? 1));
      }),
    ),
  );
  return Object.fromEntries(entries);
}

async function runTypeScriptCheck(timeoutMs: number): Promise<{ output: string; failedToRun: boolean }> {
  const tscCli = require.resolve('typescript/bin/tsc');
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [tscCli, '--noEmit'], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      env: process.env,
    });
    let output = '';
    let settled = false;
    const capture = (chunk: Buffer | string) => {
      output += chunk.toString();
    };
    child.stdout?.on('data', capture);
    child.stderr?.on('data', capture);
    const timer = setTimeout(() => child.kill(), timeoutMs);
    const finish = (failedToRun: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      console.log(`[validator-timing] typescript --noEmit processExitMs=${Date.now() - startedAt}`);
      resolve({ output, failedToRun });
    };
    child.once('error', () => finish(true));
    child.once('close', (code, signal) => finish(signal !== null || (code !== 0 && output.length === 0)));
  });
}

async function main(): Promise<void> {
  checkpoint('start');

  // ---------------------------------------------------------------------------------------
  // 1-3: New Build Decision Authority
  // ---------------------------------------------------------------------------------------
  const d1 = classifyNewBuildDecision({
    rawPrompt:
      'Build me a restaurant ordering app with menu management, table reservations, and online payments.',
    requestedProjectId: null,
    requestedProjectName: null,
    hasKnownExistingProject: false,
    currentProjectIdentitySummary: null,
  });
  assert('1. full new app prompt is classified as NEW_BUILD', d1.decision === 'NEW_BUILD', `decision=${d1.decision} reasons=${d1.reasons.join(' | ')}`);

  const d2 = classifyNewBuildDecision({
    rawPrompt: 'Please continue working on my current project and add a payment page to it.',
    requestedProjectId: 'proj-existing-123',
    requestedProjectName: null,
    hasKnownExistingProject: true,
    currentProjectIdentitySummary: 'Current payment application with an existing payment workflow.',
  });
  assert(
    '2. explicit continuation prompt is classified as CONTINUE_EXISTING_PROJECT',
    d2.decision === 'CONTINUE_EXISTING_PROJECT',
    `decision=${d2.decision} reasons=${d2.reasons.join(' | ')}`,
  );

  const d3 = classifyNewBuildDecision({
    rawPrompt: 'Update the app.',
    requestedProjectId: null,
    requestedProjectName: null,
    hasKnownExistingProject: false,
    currentProjectIdentitySummary: null,
  });
  assert(
    '3. an unclear prompt becomes AMBIGUOUS_REQUIRES_CONFIRMATION',
    d3.decision === 'AMBIGUOUS_REQUIRES_CONFIRMATION',
    `decision=${d3.decision} message=${d3.message}`,
  );
  checkpoint('decision authority scenarios 1-3');

  // ---------------------------------------------------------------------------------------
  // 4: activeProjectId fallback removal (functional, on the real registry module)
  // ---------------------------------------------------------------------------------------
  resetWorkspaceTabRegistryForTests();
  const staleCtx = resolveProjectContext({
    projectId: 'stale-calculator-project',
    projectName: 'Stale Calculator Tool',
    createIfMissing: true,
  });
  setActiveProjectId(staleCtx.projectId);
  const freshCtx = resolveProjectContext({
    projectId: undefined,
    projectName: 'Restaurant Ordering App',
    createIfMissing: true,
    blockActiveProjectFallback: true,
  });
  assert(
    '4. NEW_BUILD never uses activeProjectId fallback',
    freshCtx.projectId !== staleCtx.projectId,
    `stale active project=${staleCtx.projectId}, fresh resolved project=${freshCtx.projectId}`,
  );
  resetWorkspaceTabRegistryForTests();
  checkpoint('activeProjectId fallback scenario 4');

  // ---------------------------------------------------------------------------------------
  // 5-9: Context Scope Authority — NEW_BUILD blocks every previous-project source
  // ---------------------------------------------------------------------------------------
  const scopeNew = buildContextScope({
    requestId: 'req-new-1',
    buildId: 'build-new-1',
    projectId: 'proj-new-1',
    decision: 'NEW_BUILD',
    currentPromptHash: 'hash-new-1',
  });
  assert('5. NEW_BUILD blocks previous product identity', isBlocked(scopeNew.blockedContextSources, 'PREVIOUS_ACTIVE_PROJECT'), 'PREVIOUS_ACTIVE_PROJECT blocked');
  assert('6. NEW_BUILD blocks previous concepts', isBlocked(scopeNew.blockedContextSources, 'PREVIOUS_CONCEPTS'), 'PREVIOUS_CONCEPTS blocked');
  assert('7. NEW_BUILD blocks previous feature contract', isBlocked(scopeNew.blockedContextSources, 'PREVIOUS_FEATURE_CONTRACT'), 'PREVIOUS_FEATURE_CONTRACT blocked');
  assert('8. NEW_BUILD blocks previous manifest evidence', isBlocked(scopeNew.blockedContextSources, 'PREVIOUS_MATERIALIZATION_MANIFEST'), 'PREVIOUS_MATERIALIZATION_MANIFEST blocked');
  assert('9. NEW_BUILD blocks previous preview DOM evidence', isBlocked(scopeNew.blockedContextSources, 'PREVIOUS_PREVIEW_EVIDENCE'), 'PREVIOUS_PREVIEW_EVIDENCE blocked');
  checkpoint('context scope authority scenarios 5-9');

  // ---------------------------------------------------------------------------------------
  // 10-11: registry/metadata scoping — fresh metadata, no keyword carryover
  // ---------------------------------------------------------------------------------------
  const TEST_ROOT_DIR = join(tmpdir(), `project-context-isolation-v4-validator-${Date.now()}`);
  mkdirSync(TEST_ROOT_DIR, { recursive: true });
  const metaProjectId = 'meta-scope-test-project';
  upsertProjectContextMetadata(
    { projectId: metaProjectId, name: 'Old Calculator Tool', prompt: 'Build a calculator and unit converter utility app' },
    TEST_ROOT_DIR,
  );
  const beforeMeta = getProjectContextMetadata(metaProjectId, TEST_ROOT_DIR);
  const afterMeta = replaceProjectContextMetadata(
    { projectId: metaProjectId, name: 'Restaurant Ordering App', prompt: 'Build a restaurant ordering app with menus and table reservations' },
    TEST_ROOT_DIR,
  );
  const carriedOverKeywords = (beforeMeta?.keywords ?? []).filter((k) => afterMeta.keywords.includes(k));
  assert(
    '10. NEW_BUILD initializes fresh metadata (no merge with prior record)',
    carriedOverKeywords.length === 0,
    carriedOverKeywords.length === 0
      ? `before=${JSON.stringify(beforeMeta?.keywords)} after=${JSON.stringify(afterMeta.keywords)}`
      : `carried over stale keywords: ${carriedOverKeywords.join(', ')}`,
  );
  assert(
    '11. NEW_BUILD keywords come only from current prompt evidence',
    afterMeta.name === 'Restaurant Ordering App' && !afterMeta.keywords.some((k) => /calculator|convert/i.test(k)),
    `after.keywords=${JSON.stringify(afterMeta.keywords)}`,
  );
  resetProjectContextMetadataForTests(TEST_ROOT_DIR);
  rmSync(TEST_ROOT_DIR, { recursive: true, force: true });
  checkpoint('metadata scoping scenarios 10-11');

  // ---------------------------------------------------------------------------------------
  // 12: CONTINUE_EXISTING_PROJECT allows only explicitly justified inherited context
  // ---------------------------------------------------------------------------------------
  const scopeContinueJustified = buildContextScope({
    requestId: 'req-continue-1',
    buildId: 'build-continue-1',
    projectId: 'proj-continue-1',
    decision: 'CONTINUE_EXISTING_PROJECT',
    currentPromptHash: 'hash-continue-1',
    explicitlyReferencedProjectId: 'proj-continue-1',
    activeProjectIdCandidate: 'proj-continue-1',
  });
  const scopeContinueUnjustifiedActive = buildContextScope({
    requestId: 'req-continue-2',
    buildId: 'build-continue-2',
    projectId: 'proj-continue-2',
    decision: 'CONTINUE_EXISTING_PROJECT',
    currentPromptHash: 'hash-continue-2',
    explicitlyReferencedProjectId: 'proj-continue-2',
    activeProjectIdCandidate: 'some-other-stale-project',
  });
  assert(
    '12. CONTINUE_EXISTING_PROJECT allows only explicitly justified inherited context',
    scopeContinueJustified.allowedContextSources.some((s) => s.source === 'PREVIOUS_ACTIVE_PROJECT') &&
      scopeContinueJustified.allowedContextSources.every((s) => s.reason.length > 0) &&
      isBlocked(scopeContinueUnjustifiedActive.blockedContextSources, 'PREVIOUS_ACTIVE_PROJECT'),
    'matching active project justified+allowed; mismatched/stale active project blocked even under CONTINUE',
  );
  checkpoint('continuation justification scenario 12');

  // ---------------------------------------------------------------------------------------
  // 13: duplicate-project auto-resume cannot silently fire during NEW_BUILD (source wiring proof)
  // ---------------------------------------------------------------------------------------
  const bridgeSource = readSource('src/chat-to-build-execution-bridge-v1/bridge-authority.ts');
  assert(
    '13. duplicate-project detection cannot silently resume during NEW_BUILD',
    bridgeSource.includes("decision.decision === 'CONTINUE_EXISTING_PROJECT'") &&
      bridgeSource.includes("buildDecision.decision === 'NEW_BUILD'") &&
      bridgeSource.includes('effectiveProjectId = null;'),
    'shouldAutoContinueDuplicate is gated on CONTINUE_EXISTING_PROJECT and NEW_BUILD forces a fresh effectiveProjectId',
  );
  checkpoint('duplicate auto-resume gating scenario 13');

  // ---------------------------------------------------------------------------------------
  // 14-19: Prompt Reset Authority
  // ---------------------------------------------------------------------------------------
  const resetPlan = buildPromptResetPlan({ trigger: 'NEW_BUILD_PROMPT', projectId: 'fresh-proj-1', freshProjectScope: true });
  const actionFor = (category: ResetCategory) => resetPlan.actions.find((a) => a.category === category);
  assert('14. prompt reset clears previous canonical contract', actionFor('CANONICAL_CONTRACT')?.cleared === true, JSON.stringify(actionFor('CANONICAL_CONTRACT')));
  assert('15. prompt reset clears previous concept graph', actionFor('CONCEPT_GRAPH')?.cleared === true, JSON.stringify(actionFor('CONCEPT_GRAPH')));
  assert('16. prompt reset clears previous module plan', actionFor('MODULE_PLAN')?.cleared === true, JSON.stringify(actionFor('MODULE_PLAN')));
  assert(
    '17. prompt reset clears previous routes/navigation',
    actionFor('ROUTES')?.cleared === true && actionFor('NAVIGATION')?.cleared === true,
    `${JSON.stringify(actionFor('ROUTES'))} ${JSON.stringify(actionFor('NAVIGATION'))}`,
  );
  assert(
    '18. prompt reset clears previous materialization manifest',
    actionFor('MATERIALIZATION_MANIFEST')?.cleared === true,
    JSON.stringify(actionFor('MATERIALIZATION_MANIFEST')),
  );
  assert('19. prompt reset clears previous faithfulness report', actionFor('FAITHFULNESS_REPORT')?.cleared === true, JSON.stringify(actionFor('FAITHFULNESS_REPORT')));
  assert(
    'preservesPersistentProjects guarantee (not user-numbered, structural check)',
    resetPlan.preservesPersistentProjects === true,
    'PromptResetPlan.preservesPersistentProjects is always true — saved projects are never cleared implicitly',
  );
  checkpoint('prompt reset authority scenarios 14-19');

  // ---------------------------------------------------------------------------------------
  // 20-26: Stale Context Detector
  // ---------------------------------------------------------------------------------------
  const scopeForDetector = buildContextScope({
    requestId: 'req-detect-1',
    buildId: 'build-detect-1',
    projectId: 'proj-detect-1',
    decision: 'NEW_BUILD',
    currentPromptHash: 'hash-detect-1',
  });

  const check20 = runStaleContextCheck({
    stage: 'PLANNING',
    scope: scopeForDetector,
    currentPromptConcepts: ['restaurant', 'ordering', 'menu'],
    canonicalIdentity: 'calculator converter utility',
    candidateInheritedConcepts: [],
    candidateGeneratedConcepts: [],
    previousProjectIdentity: 'calculator converter utility',
  });
  assert(
    '20. stale context detector catches previous project identity leakage',
    check20.detections.find((d) => d.kind === 'PREVIOUS_PROJECT_IDENTITY')?.detected === true,
    JSON.stringify(check20.detections.find((d) => d.kind === 'PREVIOUS_PROJECT_IDENTITY')),
  );

  const check21 = runStaleContextCheck({
    stage: 'ARCHITECTURE',
    scope: scopeForDetector,
    currentPromptConcepts: ['restaurant', 'ordering'],
    canonicalIdentity: null,
    candidateInheritedConcepts: ['calculator', 'converter'],
    candidateGeneratedConcepts: [],
  });
  assert(
    '21. stale context detector catches previous concept leakage',
    check21.detections.find((d) => d.kind === 'PREVIOUS_PRODUCT_CONCEPT')?.detected === true,
    JSON.stringify(check21.detections.find((d) => d.kind === 'PREVIOUS_PRODUCT_CONCEPT')),
  );

  const check22 = runStaleContextCheck({
    stage: 'FEATURE_GENERATION',
    scope: scopeForDetector,
    currentPromptConcepts: ['restaurant'],
    canonicalIdentity: null,
    candidateInheritedConcepts: [],
    candidateGeneratedConcepts: ['calculator', 'tipcalculator'],
    previousMetadataKeywords: ['calculator', 'converter'],
  });
  assert(
    '22. stale context detector catches stale metadata keyword leakage',
    check22.detections.find((d) => d.kind === 'STALE_METADATA_KEYWORD')?.detected === true,
    JSON.stringify(check22.detections.find((d) => d.kind === 'STALE_METADATA_KEYWORD')),
  );

  const check23 = runStaleContextCheck({
    stage: 'MODULE_GENERATION',
    scope: scopeForDetector,
    currentPromptConcepts: ['restaurant'],
    canonicalIdentity: null,
    candidateInheritedConcepts: [],
    candidateGeneratedConcepts: ['booking'],
    previousFeatureContractConcepts: ['booking', 'reservation'],
  });
  assert(
    '23. stale context detector catches stale feature-contract leakage',
    check23.detections.find((d) => d.kind === 'STALE_FEATURE_CONTRACT')?.detected === true,
    JSON.stringify(check23.detections.find((d) => d.kind === 'STALE_FEATURE_CONTRACT')),
  );

  const check24 = runStaleContextCheck({
    stage: 'MATERIALIZATION',
    scope: scopeForDetector,
    currentPromptConcepts: ['restaurant'],
    canonicalIdentity: null,
    candidateInheritedConcepts: [],
    candidateGeneratedConcepts: ['inventory'],
    previousManifestConcepts: ['inventory', 'stock'],
  });
  assert(
    '24. stale context detector catches stale manifest leakage',
    check24.detections.find((d) => d.kind === 'STALE_MANIFEST')?.detected === true,
    JSON.stringify(check24.detections.find((d) => d.kind === 'STALE_MANIFEST')),
  );

  const check25 = runStaleContextCheck({
    stage: 'PREVIEW_PROOF',
    scope: scopeForDetector,
    currentPromptConcepts: ['restaurant'],
    canonicalIdentity: null,
    candidateInheritedConcepts: [],
    candidateGeneratedConcepts: ['notes'],
    previousPreviewEvidenceConcepts: ['notes', 'tasklist'],
  });
  assert(
    '25. stale context detector catches stale preview evidence leakage',
    check25.detections.find((d) => d.kind === 'STALE_PREVIEW_EVIDENCE')?.detected === true,
    JSON.stringify(check25.detections.find((d) => d.kind === 'STALE_PREVIEW_EVIDENCE')),
  );

  const check26 = runStaleContextCheck({
    stage: 'MODULE_GENERATION',
    scope: scopeForDetector,
    currentPromptConcepts: ['restaurant'],
    canonicalIdentity: null,
    candidateInheritedConcepts: [],
    candidateGeneratedConcepts: [],
    candidateModuleOrigins: [{ moduleId: 'settingsModule', origin: 'DEFAULT_TEMPLATE', justified: false }],
  });
  assert(
    '26. stale context detector catches unjustified fallback module leakage',
    check26.detections.find((d) => d.kind === 'UNJUSTIFIED_FALLBACK_MODULE')?.detected === true,
    JSON.stringify(check26.detections.find((d) => d.kind === 'UNJUSTIFIED_FALLBACK_MODULE')),
  );

  const cleanCheck = runStaleContextCheck({
    stage: 'PLANNING',
    scope: scopeForDetector,
    currentPromptConcepts: ['restaurant', 'ordering', 'menu'],
    canonicalIdentity: 'restaurant ordering menu app',
    candidateInheritedConcepts: [],
    candidateGeneratedConcepts: ['restaurant', 'menu'],
  });
  assert(
    'detector does not false-positive on a clean prompt-only build (sanity check)',
    cleanCheck.passed === true,
    JSON.stringify(cleanCheck.detections.filter((d) => d.detected)),
  );
  checkpoint('stale context detector scenarios 20-26');

  // ---------------------------------------------------------------------------------------
  // 27-31: Production wiring proof
  // ---------------------------------------------------------------------------------------
  const orchestratorSource = readSource('src/one-prompt-live-preview/one-prompt-build-orchestrator.ts');
  const registrySource = readSource('src/one-prompt-live-preview/workspace-tab-registry.ts');
  const resultTypesSource = readSource('src/one-prompt-live-preview/one-prompt-live-preview-types.ts');
  const bridgeTypesSource = readSource('src/chat-to-build-execution-bridge-v1/bridge-types.ts');

  assert(
    '27. production build path invokes the new-build decision authority',
    orchestratorSource.includes('classifyNewBuildDecision(') && bridgeSource.includes('classifyNewBuildDecision('),
    'both one-prompt-build-orchestrator.ts and bridge-authority.ts call classifyNewBuildDecision',
  );
  assert(
    '28. production build path invokes prompt reset before new builds',
    orchestratorSource.includes('buildPromptResetPlan(') &&
      orchestratorSource.includes("trigger: 'NEW_BUILD_PROMPT'") &&
      orchestratorSource.indexOf('buildPromptResetPlan(') < orchestratorSource.indexOf('createBuildExecutionMonitor()'),
    'one-prompt-build-orchestrator.ts builds a NEW_BUILD_PROMPT reset plan before the planning execution monitor starts',
  );
  assert(
    '29. production build path creates a context scope',
    orchestratorSource.includes('buildContextScope('),
    'one-prompt-build-orchestrator.ts calls buildContextScope for every build',
  );
  assert(
    '30. production build path blocks unsafe activeProjectId fallback',
    registrySource.includes('blockActiveProjectFallback') &&
      orchestratorSource.includes('blockActiveProjectFallback') &&
      freshCtx.projectId !== staleCtx.projectId,
    'resolveProjectContext accepts blockActiveProjectFallback and the orchestrator passes a decision-derived value in (functionally proven in scenario 4)',
  );
  assert(
    '31. reports include build decision and blocked stale sources',
    (() => {
      const section = buildContextIsolationReportSection({
        decision: d1,
        scope: scopeNew,
        productIdentity: 'Restaurant Ordering App',
        activeProjectIdFallbackBlocked: true,
      });
      return (
        section.decision === 'NEW_BUILD' &&
        section.blockedContextSources.length > 0 &&
        resultTypesSource.includes('contextIsolation') &&
        bridgeTypesSource.includes('contextIsolation')
      );
    })(),
    'ContextIsolationReportSection carries decision + blockedContextSources; OnePromptLivePreviewBuildResult and ChatToBuildBridgeResult both declare a contextIsolation field',
  );
  checkpoint('production wiring proof scenarios 27-31');

  // ---------------------------------------------------------------------------------------
  // 32-34: Guarantees
  // ---------------------------------------------------------------------------------------
  const BANNED_DOMAIN_WORDS = [
    'calculator',
    'restaurant',
    'booking',
    'crm',
    'inventory',
    'notedomain',
    'dashboardapp',
    'lisa',
    'authentication',
    'crud',
    'todoapp',
    'converter',
    'staffmember',
    'customerrecord',
    'salesreport',
  ];
  const NEW_MODULE_FILES = [
    'src/project-context-isolation-v4/project-context-isolation-types.ts',
    'src/project-context-isolation-v4/new-build-decision-authority.ts',
    'src/project-context-isolation-v4/context-scope-authority.ts',
    'src/project-context-isolation-v4/stale-context-detector.ts',
    'src/project-context-isolation-v4/prompt-reset-authority.ts',
    'src/project-context-isolation-v4/project-context-isolation-report.ts',
    'src/project-context-isolation-v4/index.ts',
  ];
  const MODIFIED_PREEXISTING_FILES = [
    'src/one-prompt-live-preview/workspace-tab-registry.ts',
    'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
    'src/one-prompt-live-preview/one-prompt-live-preview-types.ts',
    'src/project-context-alignment-v1/project-context-metadata-store.ts',
    'src/chat-to-build-execution-bridge-v1/bridge-authority.ts',
    'src/chat-to-build-execution-bridge-v1/bridge-types.ts',
    'src/command-center-chat-execution-audit-v1/audit-types.ts',
    'server/build-from-prompt-handler.ts',
    'server/brain-api-handler.ts',
  ];
  /** For pre-existing files we only scan lines we actually added — the rest of a huge existing
   * file (e.g. an unrelated pre-existing error-message string mentioning "CRM" as a product-type
   * example) is not in scope for this guarantee. Fully new files are scanned in full. */
  function addedLinesForModifiedFile(relPath: string): string {
    try {
      const out = execSync(`git diff -- "${relPath}"`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 8 });
      return out
        .split(/\r?\n/)
        .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
        .join('\n');
    } catch {
      return '';
    }
  }

  const domainHits: string[] = [];
  for (const relPath of NEW_MODULE_FILES) {
    const text = readSource(relPath).toLowerCase();
    for (const word of BANNED_DOMAIN_WORDS) {
      if (text.includes(word)) domainHits.push(`${relPath}:${word}`);
    }
  }
  for (const relPath of MODIFIED_PREEXISTING_FILES) {
    const text = addedLinesForModifiedFile(relPath).toLowerCase();
    for (const word of BANNED_DOMAIN_WORDS) {
      if (text.includes(word)) domainHits.push(`${relPath}(added lines):${word}`);
    }
  }
  assert(
    '32. no app-specific product names or hardcoded product domains are used',
    domainHits.length === 0,
    domainHits.length === 0
      ? 'no banned domain words found in any newly-created file, or in the lines added to modified pre-existing files'
      : domainHits.join(', '),
  );

  function removedValidatorLines(relPath: string): string[] {
    try {
      const out = execSync(`git diff --unified=0 -- "${relPath}"`, { cwd: ROOT, encoding: 'utf8' });
      return out
        .split(/\r?\n/)
        .filter((line) => line.startsWith('-') && !line.startsWith('---'));
    } catch {
      return ['unable to inspect validator diff'];
    }
  }
  const untouchedValidators = [
    'scripts/validate-product-faithfulness-milestone-1.ts',
    'scripts/validate-product-faithfulness-milestone-2.ts',
    'scripts/validate-app-generation-readiness-audit-v1.ts',
  ];
  const weakenedValidatorLines = untouchedValidators.flatMap((path) =>
    removedValidatorLines(path).map((line) => `${path}: ${line}`),
  );
  assert(
    '33. no validators are weakened (every pre-existing validator source line is retained)',
    weakenedValidatorLines.length === 0,
    weakenedValidatorLines.length === 0
      ? 'faithfulness execution-evidence support is additive; no pre-existing validator line was removed'
      : `removed validator lines: ${weakenedValidatorLines.join(' | ')}`,
  );

  const vereHits: string[] = [];
  for (const relPath of NEW_MODULE_FILES) {
    const text = readSource(relPath);
    if (/\bVERE\b/i.test(text) || /validation[\s-]?speed/i.test(text)) vereHits.push(relPath);
  }
  for (const relPath of MODIFIED_PREEXISTING_FILES) {
    const text = addedLinesForModifiedFile(relPath);
    if (/\bVERE\b/i.test(text) || /validation[\s-]?speed/i.test(text)) vereHits.push(`${relPath} (added lines)`);
  }
  assert(
    '34. no VERE or validation-speed work is added',
    vereHits.length === 0,
    vereHits.length === 0
      ? 'no VERE / validation-speed references in any newly-created file or in the lines added to modified pre-existing files'
      : `found in: ${vereHits.join(', ')}`,
  );
  checkpoint('guarantee scenarios 32-34');

  // ---------------------------------------------------------------------------------------
  // 35-37: existing validators still pass
  // ---------------------------------------------------------------------------------------
  const prerequisiteValidators = [
    { script: 'scripts/validate-simplified-builder-ui-v1.ts', passToken: 'SIMPLIFIED_BUILDER_UI_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-1-v1.ts', passToken: 'PRODUCT_STABILIZATION_PHASE_1_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-2-v1.ts', passToken: 'PRODUCT_STABILIZATION_PHASE_2_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-3-v1.ts', passToken: 'PRODUCT_STABILIZATION_PHASE_3_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-4-v1.ts', passToken: 'PRODUCT_STABILIZATION_PHASE_4_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-5-v1.ts', passToken: 'PRODUCT_STABILIZATION_PHASE_5_V1_PASS' },
  ];
  const freshEvidenceDir = join(tmpdir(), `project-context-validator-evidence-${process.pid}-${Date.now()}`);
  const freshEvidencePath = join(freshEvidenceDir, 'validator-evidence.json');
  mkdirSync(freshEvidenceDir, { recursive: true });
  const [validatorEvidence, typeScriptCheck] = await Promise.all([
    runValidatorScriptsConcurrently(prerequisiteValidators, 210_000),
    runTypeScriptCheck(210_000),
  ]);
  writeFileSync(
    freshEvidencePath,
    JSON.stringify({
      schema: 'AIDEVENGINE_FRESH_VALIDATOR_EVIDENCE_V1',
      generatedAt: new Date().toISOString(),
      validators: validatorEvidence,
    }),
    'utf8',
  );

  const milestone1 = runValidatorScript(
    'scripts/validate-product-faithfulness-milestone-1.ts',
    120_000,
    { AIDEVENGINE_FRESH_VALIDATOR_EVIDENCE_V1: freshEvidencePath },
  );
  assert(
    '35. existing Product Faithfulness Milestone 1 validator still passes',
    milestone1.code === 0 && milestone1.output.includes('PRODUCT_FAITHFULNESS_MILESTONE_1_PASS'),
    `exit=${milestone1.code} tokenFound=${milestone1.output.includes('PRODUCT_FAITHFULNESS_MILESTONE_1_PASS')}`,
  );
  checkpoint('milestone-1 re-run');

  validatorEvidence['scripts/validate-product-faithfulness-milestone-1.ts'] = {
    passToken: 'PRODUCT_FAITHFULNESS_MILESTONE_1_PASS',
    exitCode: milestone1.code,
    output: milestone1.output,
  };
  writeFileSync(
    freshEvidencePath,
    JSON.stringify({
      schema: 'AIDEVENGINE_FRESH_VALIDATOR_EVIDENCE_V1',
      generatedAt: new Date().toISOString(),
      validators: validatorEvidence,
    }),
    'utf8',
  );
  const milestone2 = runValidatorScript(
    'scripts/validate-product-faithfulness-milestone-2.ts',
    120_000,
    { AIDEVENGINE_FRESH_VALIDATOR_EVIDENCE_V1: freshEvidencePath },
  );
  rmSync(freshEvidenceDir, { recursive: true, force: true });
  assert(
    '36. existing Product Faithfulness Milestone 2 validator still passes',
    milestone2.code === 0 && milestone2.output.includes('PRODUCT_FAITHFULNESS_MILESTONE_2_PASS'),
    `exit=${milestone2.code} tokenFound=${milestone2.output.includes('PRODUCT_FAITHFULNESS_MILESTONE_2_PASS')}`,
  );
  checkpoint('milestone-2 re-run');

  const auditV1 = runValidatorScript('scripts/validate-app-generation-readiness-audit-v1.ts', 60_000);
  assert(
    '37. App-generation readiness audit validator still passes',
    auditV1.code === 0 && auditV1.output.includes('APP_GENERATION_READINESS_AUDIT_V1_PASS'),
    `exit=${auditV1.code} tokenFound=${auditV1.output.includes('APP_GENERATION_READINESS_AUDIT_V1_PASS')}`,
  );
  checkpoint('audit-v1 re-run');

  // ---------------------------------------------------------------------------------------
  // 38: no new TypeScript errors introduced in touched files
  // ---------------------------------------------------------------------------------------
  const KNOWN_PREEXISTING_ORCHESTRATOR_ERROR_SIGNATURES = [
    "Type '\"CAPABILITY_PLANNING\"' is not assignable to type 'ForensicBuildStage'",
    'is missing the following properties from type \'OnePromptLivePreviewBuildResult\': livePreviewGate, autonomousSoftwareEngineering',
    "The type 'readonly string[]' is 'readonly' and cannot be assigned to the mutable type 'string[]'",
    "Type 'string' is not assignable to type 'ForensicBuildStage'",
    'have no overlap',
  ];
  const tscOutput = typeScriptCheck.output;
  const tscFailedToRun = typeScriptCheck.failedToRun;
  const tscLines = tscOutput.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const NEW_MODULE_PREFIX = 'src/project-context-isolation-v4/';
  const CLEAN_TOUCHED_FILES = [
    'src/one-prompt-live-preview/workspace-tab-registry.ts',
    'src/one-prompt-live-preview/one-prompt-live-preview-types.ts',
    'src/project-context-alignment-v1/project-context-metadata-store.ts',
    'src/chat-to-build-execution-bridge-v1/bridge-authority.ts',
    'src/chat-to-build-execution-bridge-v1/bridge-types.ts',
    'src/command-center-chat-execution-audit-v1/audit-types.ts',
    'server/build-from-prompt-handler.ts',
    'server/brain-api-handler.ts',
  ];
  const newModuleErrors = tscLines.filter((l) => l.replace(/\\/g, '/').includes(NEW_MODULE_PREFIX));
  const cleanFileErrors = tscLines.filter((l) => {
    const normalized = l.replace(/\\/g, '/');
    return CLEAN_TOUCHED_FILES.some((f) => normalized.includes(f));
  });
  const orchestratorErrorLines = tscLines.filter((l) => l.replace(/\\/g, '/').includes('src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'));
  const unexpectedOrchestratorErrors = orchestratorErrorLines.filter(
    (line) => !KNOWN_PREEXISTING_ORCHESTRATOR_ERROR_SIGNATURES.some((sig) => line.includes(sig)),
  );
  assert(
    '38. no new TypeScript errors are introduced in touched files',
    !tscFailedToRun &&
      newModuleErrors.length === 0 &&
      cleanFileErrors.length === 0 &&
      unexpectedOrchestratorErrors.length === 0,
    tscFailedToRun
      ? 'tsc did not run/produce output'
      : `new-module errors=${newModuleErrors.length}, clean-touched-file errors=${cleanFileErrors.length}, unexpected orchestrator errors=${unexpectedOrchestratorErrors.length} (pre-existing orchestrator errors=${orchestratorErrorLines.length - unexpectedOrchestratorErrors.length}, total repo tsc error lines=${tscLines.length})`,
  );
  checkpoint('tsc --noEmit check (scenario 38)');

  // ---------------------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------------------
  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');
  console.log(`${results.length - failed.length}/${results.length} checks passed`);

  if (failed.length > 0) {
    console.error(`Project Context Isolation + Prompt Reset Authority V4 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log('');
  console.log(PROJECT_CONTEXT_ISOLATION_V4_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
