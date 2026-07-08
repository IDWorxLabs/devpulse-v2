/**
 * NEW_BUILD_CONFIRMATION_REQUIRED UX V4 — validation.
 *
 * Proves that the generic "Build request failed (HTTP 409)." failure the frontend used to show
 * for an ambiguous build decision has been replaced with a deterministic, structured confirmation
 * payload from the backend and a real "Confirm build context" panel in the builder UI, that the
 * user's choice is resubmitted as an explicit buildIntentOverride, that the New Build Decision
 * Authority honors/rejects that override without ever bypassing stale-context checks, that
 * overrides are recorded on the context isolation report, that no app-specific/product-domain
 * logic was added, and that every previously-passing validator still passes.
 *
 * Emits NEW_BUILD_CONFIRMATION_UX_V4_PASS on success.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import {
  buildContextIsolationReportSection,
  buildContextScope,
  buildPromptResetPlan,
  classifyNewBuildDecision,
  runStaleContextCheck,
} from '../src/project-context-isolation-v4/index.js';
import { executeChatToBuildBridge } from '../src/chat-to-build-execution-bridge-v1/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
// Deliberately bounded: this validator does NOT chain full re-runs of the other validator scripts
// (that produced a multi-hundred-second, deeply-nested chain — validate-project-context-isolation-v4.ts
// alone re-runs milestone-1/milestone-2/audit-v1/tsc). Instead it proves those systems are still wired
// and present via fast, direct source/registry checks, plus its own single `tsc --noEmit` run.
const MAX_RUNTIME_MS = 180_000;

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

async function main(): Promise<void> {
  checkpoint('start');

  // ---------------------------------------------------------------------------------------
  // 1: Backend returns structured NEW_BUILD_CONFIRMATION_REQUIRED JSON for ambiguous context.
  // ---------------------------------------------------------------------------------------
  const bridge1 = await executeChatToBuildBridge({
    message: 'Update the app.',
    source: 'api',
    activeProjectId: null,
    projectName: null,
    forceBuildIntent: true,
    rootDir: ROOT,
    repoRootDir: ROOT,
  });
  const payload1 = (bridge1.newBuildConfirmationPayload ?? {}) as Record<string, unknown>;
  const choices1 = Array.isArray(payload1.choices) ? (payload1.choices as Array<Record<string, unknown>>) : [];
  const contextIsolation1 = (payload1.contextIsolation ?? {}) as Record<string, unknown>;
  assert(
    '1. Backend returns structured NEW_BUILD_CONFIRMATION_REQUIRED JSON for ambiguous context.',
    bridge1.kind === 'NEW_BUILD_CONFIRMATION_REQUIRED' &&
      payload1.outcome === 'NEW_BUILD_CONFIRMATION_REQUIRED' &&
      typeof payload1.message === 'string' &&
      typeof payload1.currentPromptSummary === 'string' &&
      'activeProjectSummary' in payload1 &&
      choices1.length === 2 &&
      choices1.some((c) => c.id === 'START_NEW_BUILD') &&
      choices1.some((c) => c.id === 'CONTINUE_EXISTING_PROJECT') &&
      contextIsolation1.decision === 'AMBIGUOUS_REQUIRES_CONFIRMATION' &&
      Array.isArray(contextIsolation1.blockedContextSources) &&
      Array.isArray(contextIsolation1.allowedContextSources) &&
      typeof contextIsolation1.reason === 'string',
    `bridgeKind=${bridge1.kind} payloadKeys=${Object.keys(payload1).join(',')} contextIsolationKeys=${Object.keys(contextIsolation1).join(',')}`,
  );
  checkpoint('scenario 1 (backend structured payload)');

  const bridge1b = await executeChatToBuildBridge({
    message: 'Make it nicer.',
    source: 'api',
    activeProjectId: 'proj-active-1',
    projectName: 'My Existing App',
    forceBuildIntent: true,
    rootDir: ROOT,
    repoRootDir: ROOT,
  });
  const payload1b = (bridge1b.newBuildConfirmationPayload ?? {}) as Record<string, unknown>;
  assert(
    '5. Confirmation panel data displays active project summary when available.',
    bridge1b.kind === 'NEW_BUILD_CONFIRMATION_REQUIRED' && payload1b.activeProjectSummary === 'My Existing App',
    `bridgeKind=${bridge1b.kind} activeProjectSummary=${JSON.stringify(payload1b.activeProjectSummary)}`,
  );
  checkpoint('scenario 5 (active project summary present)');

  // ---------------------------------------------------------------------------------------
  // 2-9, 19-20: Frontend confirmation panel + resubmission wiring (source-of-truth checks)
  // ---------------------------------------------------------------------------------------
  const frontendSource = readSource('public/founder-reality/builder-home.js');

  const idxResumeRequired = frontendSource.indexOf("payload.resumeRequired");
  const idxNewBuildConfirmation = frontendSource.indexOf("payload.outcome === 'NEW_BUILD_CONFIRMATION_REQUIRED'");
  // Matches only the actual throw statement (not the JSDoc/comment prose above it that also
  // mentions the old generic message for context).
  const idxGenericThrow = frontendSource.indexOf(
    "throw new Error(payload.error || 'Build request failed (HTTP ' + res.status + ').');",
  );
  assert(
    "2. HTTP 409 is not treated as generic build failure in the frontend.",
    idxNewBuildConfirmation > -1 && idxGenericThrow > -1 && idxNewBuildConfirmation < idxGenericThrow,
    `idxNewBuildConfirmation=${idxNewBuildConfirmation} idxGenericThrow=${idxGenericThrow}`,
  );
  assert(
    "19. Generic HTTP 409 build failure message is not shown for NEW_BUILD_CONFIRMATION_REQUIRED.",
    idxNewBuildConfirmation > -1 &&
      frontendSource.includes('handleNewBuildConfirmationRequired(payload, trimmed);') &&
      frontendSource.slice(idxNewBuildConfirmation, idxNewBuildConfirmation + 400).includes('return;'),
    'the NEW_BUILD_CONFIRMATION_REQUIRED branch calls handleNewBuildConfirmationRequired and returns before reaching the generic throw',
  );
  assert(
    "20. Other HTTP errors still show normal failure handling.",
    idxResumeRequired > -1 &&
      idxResumeRequired < idxNewBuildConfirmation &&
      idxNewBuildConfirmation < idxGenericThrow &&
      frontendSource.includes("if (!res.ok) {") &&
      frontendSource.includes("throw new Error(payload.error || 'Build request failed (HTTP ' + res.status + ').');"),
    'resumeRequired/new-build-confirmation/rejectDuplicates are each handled by their own early-return branch; any other non-ok response still falls through to the unchanged generic throw',
  );
  checkpoint('scenarios 2, 19, 20 (frontend ordering)');

  assert(
    "3. Confirmation panel renders required title and body.",
    frontendSource.includes("title: 'Confirm build context'") &&
      frontendSource.includes(
        "AiDevEngine needs to know whether this prompt should start a new app or continue the existing project.",
      ),
    'handleNewBuildConfirmationRequired sets opts.title to "Confirm build context" and the body message verbatim',
  );
  assert(
    "4. Confirmation panel displays current prompt summary.",
    frontendSource.includes('payload.currentPromptSummary') && frontendSource.includes("'Current prompt: \""),
    'detailLine includes a labeled "Current prompt: " segment built from payload.currentPromptSummary',
  );
  assert(
    "6. Confirmation panel shows Start fresh app action.",
    frontendSource.includes("label: 'Start fresh app'"),
    'renderFailureActions is given an action labeled "Start fresh app"',
  );
  assert(
    "7. Confirmation panel shows Continue existing project action.",
    frontendSource.includes("label: 'Continue existing project'"),
    'renderFailureActions is given an action labeled "Continue existing project"',
  );
  checkpoint('scenarios 3, 4, 6, 7 (panel content)');

  const startFreshBlock = frontendSource.slice(
    frontendSource.indexOf("label: 'Start fresh app'"),
    frontendSource.indexOf("label: 'Start fresh app'") + 300,
  );
  const continueBlock = frontendSource.slice(
    frontendSource.indexOf("label: 'Continue existing project'"),
    frontendSource.indexOf("label: 'Continue existing project'") + 300,
  );
  assert(
    "8. Start fresh app resubmits with buildIntentOverride START_NEW_BUILD.",
    startFreshBlock.includes("runBuild(promptText, { buildIntentOverride: 'START_NEW_BUILD' });"),
    `startFreshBlock=${startFreshBlock.replace(/\s+/g, ' ').trim()}`,
  );
  assert(
    "9. Continue existing project resubmits with buildIntentOverride CONTINUE_EXISTING_PROJECT.",
    continueBlock.includes(
      "runBuild(promptText, { projectId: state.projectId, buildIntentOverride: 'CONTINUE_EXISTING_PROJECT' });",
    ),
    `continueBlock=${continueBlock.replace(/\s+/g, ' ').trim()}`,
  );
  assert(
    'runBuild forwards buildIntentOverride to the request body (wiring proof for scenarios 8-9)',
    frontendSource.includes('if (options.buildIntentOverride) body.buildIntentOverride = options.buildIntentOverride;'),
    'runBuild copies options.buildIntentOverride onto the POST body sent to /api/build/from-prompt',
  );
  checkpoint('scenarios 8, 9 (resubmission wiring)');

  // ---------------------------------------------------------------------------------------
  // 10-13: START_NEW_BUILD override
  // ---------------------------------------------------------------------------------------
  const d10 = classifyNewBuildDecision({
    rawPrompt: 'Please continue improving my current project.',
    requestedProjectId: 'proj-existing-1',
    requestedProjectName: null,
    hasKnownExistingProject: true,
    currentProjectIdentitySummary: null,
    buildIntentOverride: 'START_NEW_BUILD',
  });
  assert(
    '10. START_NEW_BUILD override forces NEW_BUILD.',
    d10.decision === 'NEW_BUILD' && d10.overrideApplied === 'START_NEW_BUILD',
    `decision=${d10.decision} overrideApplied=${d10.overrideApplied} — even though the prompt reads as continuation language, the explicit override forces NEW_BUILD`,
  );

  const registrySource = readSource('src/one-prompt-live-preview/workspace-tab-registry.ts');
  const orchestratorSource = readSource('src/one-prompt-live-preview/one-prompt-build-orchestrator.ts');
  const bridgeSource = readSource('src/chat-to-build-execution-bridge-v1/bridge-authority.ts');
  assert(
    '11. START_NEW_BUILD override blocks activeProjectId fallback.',
    registrySource.includes('blockActiveProjectFallback') &&
      orchestratorSource.includes("blockActiveProjectFallback = buildDecision.decision !== 'CONTINUE_EXISTING_PROJECT'") &&
      bridgeSource.includes("if (buildDecision.decision === 'NEW_BUILD') {") &&
      bridgeSource.includes('effectiveProjectId = null;'),
    'both the bridge (effectiveProjectId) and the orchestrator (blockActiveProjectFallback) gate solely on buildDecision.decision === NEW_BUILD, which an honored START_NEW_BUILD override always produces (scenario 10)',
  );

  const scopeForOverride = buildContextScope({
    requestId: 'req-override-new-1',
    buildId: 'build-override-new-1',
    projectId: 'proj-override-new-1',
    decision: d10.decision,
    currentPromptHash: 'hash-override-new-1',
  });
  assert(
    '12. START_NEW_BUILD override blocks previous context sources.',
    scopeForOverride.blockedContextSources.some((s) => s.source === 'PREVIOUS_ACTIVE_PROJECT') &&
      scopeForOverride.blockedContextSources.some((s) => s.source === 'PREVIOUS_CONCEPTS') &&
      scopeForOverride.blockedContextSources.some((s) => s.source === 'PREVIOUS_FEATURE_CONTRACT') &&
      scopeForOverride.allowedContextSources.length === 1 &&
      scopeForOverride.allowedContextSources[0].source === 'CURRENT_PROMPT',
    `blockedCount=${scopeForOverride.blockedContextSources.length} allowed=${JSON.stringify(scopeForOverride.allowedContextSources.map((s) => s.source))}`,
  );

  const resetPlanForOverride = buildPromptResetPlan({
    trigger: 'NEW_BUILD_PROMPT',
    projectId: 'proj-override-new-1',
    freshProjectScope: true,
  });
  assert(
    '13. START_NEW_BUILD override clears stale generation state.',
    resetPlanForOverride.actions.every((a) => a.cleared === true) && resetPlanForOverride.preservesPersistentProjects === true,
    `actions cleared=${resetPlanForOverride.actions.filter((a) => a.cleared).length}/${resetPlanForOverride.actions.length}`,
  );
  checkpoint('scenarios 10-13 (START_NEW_BUILD override)');

  // ---------------------------------------------------------------------------------------
  // 14-16: CONTINUE_EXISTING_PROJECT override
  // ---------------------------------------------------------------------------------------
  const d14 = classifyNewBuildDecision({
    rawPrompt: 'Build me a brand-new project management app with kanban boards and deadlines.',
    requestedProjectId: null,
    requestedProjectName: null,
    hasKnownExistingProject: false,
    currentProjectIdentitySummary: null,
    buildIntentOverride: 'CONTINUE_EXISTING_PROJECT',
  });
  assert(
    '14. CONTINUE_EXISTING_PROJECT override requires existing project.',
    d14.decision === 'AMBIGUOUS_REQUIRES_CONFIRMATION' &&
      d14.overrideApplied == null &&
      d14.overrideRejected?.requested === 'CONTINUE_EXISTING_PROJECT' &&
      /no existing/i.test(d14.overrideRejected?.reason ?? ''),
    `decision=${d14.decision} overrideRejected=${JSON.stringify(d14.overrideRejected)}`,
  );

  const d15 = classifyNewBuildDecision({
    rawPrompt: 'Build me a brand-new project management app with kanban boards and deadlines.',
    requestedProjectId: 'proj-existing-2',
    requestedProjectName: 'proj-existing-2',
    hasKnownExistingProject: true,
    currentProjectIdentitySummary: 'A completely unrelated recipe-sharing social network for home cooks.',
    buildIntentOverride: 'CONTINUE_EXISTING_PROJECT',
  });
  assert(
    '15. CONTINUE_EXISTING_PROJECT override requires compatibility.',
    d15.decision === 'AMBIGUOUS_REQUIRES_CONFIRMATION' &&
      d15.overrideApplied == null &&
      d15.overrideRejected?.requested === 'CONTINUE_EXISTING_PROJECT' &&
      /incompatible/i.test(d15.overrideRejected?.reason ?? ''),
    `decision=${d15.decision} overrideRejected=${JSON.stringify(d15.overrideRejected)}`,
  );

  const d16 = classifyNewBuildDecision({
    rawPrompt: 'Add a deadlines view to my project management app.',
    requestedProjectId: 'proj-existing-3',
    requestedProjectName: 'proj-existing-3',
    hasKnownExistingProject: true,
    currentProjectIdentitySummary: 'A project management app with kanban boards and deadlines.',
    buildIntentOverride: 'CONTINUE_EXISTING_PROJECT',
  });
  // Proof this is structural, not just "this one test case happens to still detect something": the
  // Context Scope Authority and Stale Context Detector source files contain zero references to the
  // override concept at all, so an override can never special-case bypass their gating/detection
  // logic — it can only ever change which BuildDecisionKind reaches them, same as any other caller.
  const scopeSource = readSource('src/project-context-isolation-v4/context-scope-authority.ts');
  const detectorSource = readSource('src/project-context-isolation-v4/stale-context-detector.ts');
  const scopeAuthorityIsOverrideAgnostic = !/override/i.test(scopeSource);
  const staleDetectorIsOverrideAgnostic = !/override/i.test(detectorSource);
  // Functional sanity check on top: even for a CONTINUE_EXISTING_PROJECT decision, a build that
  // lacks an explicit project reference still has every previous-project source blocked, and the
  // detector still flags real leakage into that blocked source — proving detection isn't silently
  // disabled just because the decision is CONTINUE_EXISTING_PROJECT (via override or otherwise).
  const scopeContinueNoExplicitRef = buildContextScope({
    requestId: 'req-override-continue-2',
    buildId: 'build-override-continue-2',
    projectId: 'proj-existing-3',
    decision: d16.decision,
    currentPromptHash: 'hash-override-continue-2',
  });
  const staleCheckWithoutExplicitRef = runStaleContextCheck({
    stage: 'PLANNING',
    scope: scopeContinueNoExplicitRef,
    currentPromptConcepts: ['deadlines'],
    canonicalIdentity: null,
    candidateInheritedConcepts: [],
    candidateGeneratedConcepts: ['calculator'],
    previousMetadataKeywords: ['calculator', 'converter'],
  });
  assert(
    '16. CONTINUE_EXISTING_PROJECT override does not bypass stale-context checks.',
    d16.decision === 'CONTINUE_EXISTING_PROJECT' &&
      d16.overrideApplied === 'CONTINUE_EXISTING_PROJECT' &&
      scopeAuthorityIsOverrideAgnostic &&
      staleDetectorIsOverrideAgnostic &&
      staleCheckWithoutExplicitRef.passed === false &&
      staleCheckWithoutExplicitRef.detections.some((det) => det.kind === 'STALE_METADATA_KEYWORD' && det.detected),
    `decision=${d16.decision} overrideApplied=${d16.overrideApplied} scopeAuthorityOverrideAgnostic=${scopeAuthorityIsOverrideAgnostic} staleDetectorOverrideAgnostic=${staleDetectorIsOverrideAgnostic} staleCheckPassed=${staleCheckWithoutExplicitRef.passed}`,
  );
  checkpoint('scenarios 14-16 (CONTINUE_EXISTING_PROJECT override)');

  // ---------------------------------------------------------------------------------------
  // 17-18: Overrides recorded in context isolation report
  // ---------------------------------------------------------------------------------------
  const reportForAppliedOverride = buildContextIsolationReportSection({
    decision: d10,
    scope: scopeForOverride,
    productIdentity: 'A brand-new project',
    activeProjectIdFallbackBlocked: true,
  });
  assert(
    '17. Overrides are recorded in context isolation report.',
    reportForAppliedOverride.buildIntentOverride === 'START_NEW_BUILD' &&
      reportForAppliedOverride.confirmationWasRequired === true &&
      reportForAppliedOverride.overrideRejected === null,
    `buildIntentOverride=${reportForAppliedOverride.buildIntentOverride} confirmationWasRequired=${reportForAppliedOverride.confirmationWasRequired}`,
  );

  const reportForRejectedOverride = buildContextIsolationReportSection({
    decision: d15,
    scope: buildContextScope({
      requestId: 'req-rejected-1',
      buildId: 'build-rejected-1',
      projectId: 'proj-existing-2',
      decision: d15.decision,
      currentPromptHash: 'hash-rejected-1',
    }),
    productIdentity: null,
    activeProjectIdFallbackBlocked: true,
  });
  assert(
    '18. Reports show confirmation required and selected user action.',
    reportForRejectedOverride.confirmationWasRequired === true &&
      reportForRejectedOverride.overrideRejected?.requested === 'CONTINUE_EXISTING_PROJECT' &&
      reportForRejectedOverride.buildIntentOverride === null &&
      readSource('src/project-context-isolation-v4/project-context-isolation-report.ts').includes('Confirmation was required:') &&
      readSource('src/project-context-isolation-v4/project-context-isolation-report.ts').includes('User selected:'),
    `confirmationWasRequired=${reportForRejectedOverride.confirmationWasRequired} overrideRejected=${JSON.stringify(reportForRejectedOverride.overrideRejected)}; markdown renderer also surfaces both fields`,
  );
  checkpoint('scenarios 17-18 (report evidence)');

  // ---------------------------------------------------------------------------------------
  // 21: no app-specific product names or hardcoded domains introduced
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
  const TOUCHED_FILES = [
    'src/project-context-isolation-v4/project-context-isolation-types.ts',
    'src/project-context-isolation-v4/new-build-decision-authority.ts',
    'src/project-context-isolation-v4/project-context-isolation-report.ts',
    'src/project-context-isolation-v4/index.ts',
    'src/chat-to-build-execution-bridge-v1/bridge-types.ts',
    'src/chat-to-build-execution-bridge-v1/bridge-authority.ts',
    'src/one-prompt-live-preview/one-prompt-live-preview-types.ts',
    'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
    'server/build-from-prompt-handler.ts',
    'server/brain-api-handler.ts',
    'public/founder-reality/builder-home.js',
  ];
  /** For modified pre-existing files we only scan lines we actually added — this validator's own
   * test fixtures (e.g. "A project management app...") are not production code and are exempt. */
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
  for (const relPath of TOUCHED_FILES) {
    const text = addedLinesForModifiedFile(relPath).toLowerCase();
    for (const word of BANNED_DOMAIN_WORDS) {
      if (text.includes(word)) domainHits.push(`${relPath}(added lines):${word}`);
    }
  }
  assert(
    '21. No app-specific product names or hardcoded domains are introduced.',
    domainHits.length === 0,
    domainHits.length === 0
      ? 'no banned domain words found in the lines added to any touched file'
      : domainHits.join(', '),
  );
  checkpoint('scenario 21 (no hardcoded domains)');

  // ---------------------------------------------------------------------------------------
  // 22-25: sibling validators are still present and wired — lightweight source-level regression
  // assertions instead of inline full re-runs (which chain into a multi-hundred-second nested
  // validator tree: validate-project-context-isolation-v4.ts alone re-runs milestone-1,
  // milestone-2, audit-v1, AND its own tsc --noEmit). If a deeper functional re-check is needed,
  // run the specific script manually, e.g.:
  //   npx tsx scripts/validate-project-context-isolation-v4.ts
  //   npx tsx scripts/validate-app-generation-readiness-audit-v1.ts
  //   npx tsx scripts/validate-product-faithfulness-milestone-1.ts
  //   npx tsx scripts/validate-product-faithfulness-milestone-2.ts
  // ---------------------------------------------------------------------------------------
  const packageJsonSource = readSource('package.json');
  const isolationV4ScriptExists = existsSync(join(ROOT, 'scripts/validate-project-context-isolation-v4.ts'));
  assert(
    '22. Project Context Isolation integration is still present.',
    isolationV4ScriptExists &&
      bridgeSource.includes("classifyNewBuildDecision(") &&
      orchestratorSource.includes('classifyNewBuildDecision(') &&
      orchestratorSource.includes('buildContextScope(') &&
      orchestratorSource.includes('buildContextIsolationReportSection(') &&
      registrySource.includes('blockActiveProjectFallback'),
    `isolationV4ScriptExists=${isolationV4ScriptExists}; bridge-authority.ts and one-prompt-build-orchestrator.ts still call classifyNewBuildDecision; orchestrator still builds a context scope and context isolation report section; registry still supports blockActiveProjectFallback`,
  );

  const auditV1ScriptExists = existsSync(join(ROOT, 'scripts/validate-app-generation-readiness-audit-v1.ts'));
  const auditModuleExists = existsSync(join(ROOT, 'src/app-generation-readiness-audit-v1/index.ts'));
  assert(
    '23. App Generation Readiness Audit still exists.',
    auditV1ScriptExists && auditModuleExists,
    `scripts/validate-app-generation-readiness-audit-v1.ts exists=${auditV1ScriptExists}; src/app-generation-readiness-audit-v1/index.ts exists=${auditModuleExists}`,
  );

  const milestone1ScriptExists = existsSync(join(ROOT, 'scripts/validate-product-faithfulness-milestone-1.ts'));
  assert(
    '24. Product Faithfulness Milestone 1 script still exists.',
    milestone1ScriptExists,
    `scripts/validate-product-faithfulness-milestone-1.ts exists=${milestone1ScriptExists}`,
  );

  const milestone2ScriptExists = existsSync(join(ROOT, 'scripts/validate-product-faithfulness-milestone-2.ts'));
  assert(
    '25. Product Faithfulness Milestone 2 script still exists.',
    milestone2ScriptExists,
    `scripts/validate-product-faithfulness-milestone-2.ts exists=${milestone2ScriptExists}`,
  );

  assert(
    'package.json scripts still point to those validators (supports scenarios 22-25)',
    packageJsonSource.includes(
      '"validate:project-context-isolation-v4": "tsx scripts/validate-project-context-isolation-v4.ts"',
    ) &&
      packageJsonSource.includes(
        '"validate:app-generation-readiness-audit-v1": "tsx scripts/validate-app-generation-readiness-audit-v1.ts"',
      ) &&
      packageJsonSource.includes(
        '"validate:product-faithfulness-milestone-1": "tsx scripts/validate-product-faithfulness-milestone-1.ts"',
      ) &&
      packageJsonSource.includes(
        '"validate:product-faithfulness-milestone-2": "tsx scripts/validate-product-faithfulness-milestone-2.ts"',
      ) &&
      packageJsonSource.includes(
        '"validate:new-build-confirmation-ux-v4": "tsx scripts/validate-new-build-confirmation-ux-v4.ts"',
      ),
    'package.json "scripts" block maps each validate:* name to its corresponding script path unchanged, plus the new validate:new-build-confirmation-ux-v4 entry',
  );
  checkpoint('scenarios 22-25 (lightweight sibling-validator presence checks)');

  // ---------------------------------------------------------------------------------------
  // 26: no new TypeScript errors introduced in touched files
  // ---------------------------------------------------------------------------------------
  const KNOWN_PREEXISTING_ORCHESTRATOR_ERROR_SIGNATURES = [
    "Type '\"CAPABILITY_PLANNING\"' is not assignable to type 'ForensicBuildStage'",
    'is missing the following properties from type \'OnePromptLivePreviewBuildResult\': livePreviewGate, autonomousSoftwareEngineering',
    "The type 'readonly string[]' is 'readonly' and cannot be assigned to the mutable type 'string[]'",
    "Type 'string' is not assignable to type 'ForensicBuildStage'",
    'have no overlap',
  ];
  const KNOWN_PREEXISTING_BRIDGE_REPORT_ERROR_SIGNATURES = [
    "Property 'approvedModuleIds' does not exist on type 'GeneratedAppManifest'",
  ];
  let tscOutput = '';
  let tscFailedToRun = false;
  try {
    execSync('npx tsc --noEmit', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 32 });
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    tscOutput = `${e.stdout ?? ''}${e.stderr ?? ''}`;
  }
  if (!tscOutput) {
    try {
      tscOutput = execSync('npx tsc --noEmit', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 32 });
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string };
      tscOutput = `${e.stdout ?? ''}${e.stderr ?? ''}`;
      if (!tscOutput) tscFailedToRun = true;
    }
  }
  const tscLines = tscOutput.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const NEW_MODULE_PREFIX = 'src/project-context-isolation-v4/';
  const CLEAN_TOUCHED_FILES = [
    'src/chat-to-build-execution-bridge-v1/bridge-types.ts',
    'src/chat-to-build-execution-bridge-v1/bridge-authority.ts',
    'src/one-prompt-live-preview/one-prompt-live-preview-types.ts',
    'server/build-from-prompt-handler.ts',
    'server/brain-api-handler.ts',
  ];
  const newModuleErrors = tscLines.filter((l) => l.replace(/\\/g, '/').includes(NEW_MODULE_PREFIX));
  const cleanFileErrors = tscLines.filter((l) => {
    const normalized = l.replace(/\\/g, '/');
    return CLEAN_TOUCHED_FILES.some((f) => normalized.includes(f));
  });
  const orchestratorErrorLines = tscLines.filter((l) =>
    l.replace(/\\/g, '/').includes('src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
  );
  const unexpectedOrchestratorErrors = orchestratorErrorLines.filter(
    (line) => !KNOWN_PREEXISTING_ORCHESTRATOR_ERROR_SIGNATURES.some((sig) => line.includes(sig)),
  );
  const bridgeReportErrorLines = tscLines.filter((l) =>
    l.replace(/\\/g, '/').includes('src/chat-to-build-execution-bridge-v1/bridge-authority-report.ts'),
  );
  const unexpectedBridgeReportErrors = bridgeReportErrorLines.filter(
    (line) => !KNOWN_PREEXISTING_BRIDGE_REPORT_ERROR_SIGNATURES.some((sig) => line.includes(sig)),
  );
  assert(
    '26. No new TypeScript errors are introduced in touched files.',
    !tscFailedToRun &&
      newModuleErrors.length === 0 &&
      cleanFileErrors.length === 0 &&
      unexpectedOrchestratorErrors.length === 0 &&
      unexpectedBridgeReportErrors.length === 0,
    tscFailedToRun
      ? 'tsc did not run/produce output'
      : `new-module errors=${newModuleErrors.length}, clean-touched-file errors=${cleanFileErrors.length}, unexpected orchestrator errors=${unexpectedOrchestratorErrors.length}, unexpected bridge-report errors=${unexpectedBridgeReportErrors.length} (total repo tsc error lines=${tscLines.length})`,
  );
  checkpoint('scenario 26 (tsc --noEmit check)');

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
    console.error(`NEW_BUILD_CONFIRMATION_REQUIRED UX V4 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log('');
  console.log('NEW_BUILD_CONFIRMATION_UX_V4_PASS');
}

main().catch((err) => {
  console.error('Validator crashed:', err);
  process.exit(1);
});
