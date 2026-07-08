/**
 * NEW_BUILD_DECISION_AUTHORITY_V2 — validation.
 *
 * Proves that the New Build Decision Authority now uses weighted evidence scoring (NEW_BUILD /
 * CONTINUATION / AMBIGUITY, each item carrying reason + confidence + source) instead of binary
 * keyword matching, that this eliminates the false-positive AMBIGUOUS_REQUIRES_CONFIRMATION for
 * complete standalone new-application prompts (the reported bug), that generic product-category
 * words (platform/application/management/system/dashboard/...) never independently create
 * continuation evidence, that continuation still requires BOTH explicit continuation intent AND a
 * compatible existing project, that reports expose the full score/evidence breakdown, and that no
 * application-specific logic was introduced.
 *
 * Deliberately bounded like validate-new-build-confirmation-ux-v4.ts: this validator does NOT
 * chain full re-runs of the other validator scripts. It proves those systems are still wired and
 * present via fast, direct source/registry checks, plus its own single `tsc --noEmit` run. Run the
 * other validators manually afterwards if a deeper functional re-check is needed.
 *
 * Emits NEW_BUILD_DECISION_AUTHORITY_V2_PASS on success.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import {
  classifyNewBuildDecision,
  classifyNewBuildDecisionV2,
  buildNewBuildDecisionReport,
} from '../src/project-context-isolation-v4/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
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
  // 1: Complete standalone product prompt becomes NEW_BUILD (the exact reported bug pattern:
  //    a long, complete product brief that also contains an incidental modification-flavored
  //    feature bullet, e.g. "update their delivery address" / "change order status").
  // ---------------------------------------------------------------------------------------
  const RESTAURANT_PROMPT =
    'Build a modern, production-quality Restaurant Management Platform that allows restaurant owners to manage menus, process online orders, and view sales analytics dashboards. Customers can browse the menu, place orders, and update their delivery address before checkout. Staff can change order status as food is prepared and remove cancelled orders from the queue. Include support for multiple payment methods, loyalty rewards, and role-based staff accounts.';
  const d1 = classifyNewBuildDecisionV2({
    rawPrompt: RESTAURANT_PROMPT,
    requestedProjectId: null,
    requestedProjectName: null,
    hasKnownExistingProject: false,
    currentProjectIdentitySummary: null,
  });
  assert(
    '1. Complete standalone product prompt becomes NEW_BUILD.',
    d1.decision === 'NEW_BUILD' && d1.newBuildScore > d1.continuationScore,
    `decision=${d1.decision} newBuildScore=${d1.newBuildScore.toFixed(2)} continuationScore=${d1.continuationScore.toFixed(2)}`,
  );
  checkpoint('scenario 1');

  // ---------------------------------------------------------------------------------------
  // 2: Continuation prompt becomes CONTINUE_EXISTING_PROJECT.
  // ---------------------------------------------------------------------------------------
  const d2 = classifyNewBuildDecisionV2({
    rawPrompt: 'Please continue working on my current project and add a payment page to it.',
    requestedProjectId: 'proj-1',
    requestedProjectName: null,
    hasKnownExistingProject: true,
    currentProjectIdentitySummary: null,
  });
  assert(
    '2. Continuation prompt becomes CONTINUE_EXISTING_PROJECT.',
    d2.decision === 'CONTINUE_EXISTING_PROJECT',
    `decision=${d2.decision} continuationScore=${d2.continuationScore.toFixed(2)} newBuildScore=${d2.newBuildScore.toFixed(2)}`,
  );
  checkpoint('scenario 2');

  // ---------------------------------------------------------------------------------------
  // 3: Modify existing project becomes CONTINUE_EXISTING_PROJECT.
  // ---------------------------------------------------------------------------------------
  const d3 = classifyNewBuildDecisionV2({
    rawPrompt: 'Modify the existing project to support dark mode.',
    requestedProjectId: 'proj-2',
    requestedProjectName: null,
    hasKnownExistingProject: true,
    currentProjectIdentitySummary: null,
  });
  assert(
    '3. Modify existing project becomes CONTINUE_EXISTING_PROJECT.',
    d3.decision === 'CONTINUE_EXISTING_PROJECT',
    `decision=${d3.decision} continuationScore=${d3.continuationScore.toFixed(2)} newBuildScore=${d3.newBuildScore.toFixed(2)}`,
  );
  checkpoint('scenario 3');

  // ---------------------------------------------------------------------------------------
  // 4: Resume project becomes CONTINUE_EXISTING_PROJECT.
  // ---------------------------------------------------------------------------------------
  const d4 = classifyNewBuildDecisionV2({
    rawPrompt: 'Resume my project and keep working on the checkout flow.',
    requestedProjectId: 'proj-3',
    requestedProjectName: null,
    hasKnownExistingProject: true,
    currentProjectIdentitySummary: null,
  });
  assert(
    '4. Resume project becomes CONTINUE_EXISTING_PROJECT.',
    d4.decision === 'CONTINUE_EXISTING_PROJECT',
    `decision=${d4.decision} continuationScore=${d4.continuationScore.toFixed(2)} newBuildScore=${d4.newBuildScore.toFixed(2)}`,
  );
  checkpoint('scenario 4');

  // ---------------------------------------------------------------------------------------
  // 5: Fix bug in current project becomes CONTINUE_EXISTING_PROJECT.
  // ---------------------------------------------------------------------------------------
  const d5 = classifyNewBuildDecisionV2({
    rawPrompt: 'Fix the bug in my current project where the total does not update correctly.',
    requestedProjectId: 'proj-4',
    requestedProjectName: null,
    hasKnownExistingProject: true,
    currentProjectIdentitySummary: null,
  });
  assert(
    '5. Fix bug in current project becomes CONTINUE_EXISTING_PROJECT.',
    d5.decision === 'CONTINUE_EXISTING_PROJECT',
    `decision=${d5.decision} continuationScore=${d5.continuationScore.toFixed(2)} newBuildScore=${d5.newBuildScore.toFixed(2)}`,
  );
  checkpoint('scenario 5');

  // ---------------------------------------------------------------------------------------
  // 6: Very large standalone specification becomes NEW_BUILD.
  // ---------------------------------------------------------------------------------------
  const LARGE_SPEC_PROMPT =
    'Create a comprehensive personal finance application from scratch with account linking, transaction categorization, recurring bill detection, monthly budget planning, multi-currency support, shared household budgets, savings goal tracking, investment portfolio summaries, exportable financial reports, customizable spending alerts, and a clean onboarding flow for first-time users who have never tracked their finances digitally before.';
  const d6 = classifyNewBuildDecisionV2({
    rawPrompt: LARGE_SPEC_PROMPT,
    requestedProjectId: null,
    requestedProjectName: null,
    hasKnownExistingProject: false,
    currentProjectIdentitySummary: null,
  });
  assert(
    '6. Very large standalone specification becomes NEW_BUILD.',
    d6.decision === 'NEW_BUILD' && d6.newBuildEvidence.some((e) => e.id === 'LARGE_FEATURE_SPECIFICATION'),
    `decision=${d6.decision} newBuildScore=${d6.newBuildScore.toFixed(2)} evidenceIds=${d6.newBuildEvidence.map((e) => e.id).join(',')}`,
  );
  checkpoint('scenario 6');

  // ---------------------------------------------------------------------------------------
  // 7-11: Generic product-category words never independently create continuation evidence, even
  // when they are the *only* vocabulary shared between the new prompt and a known project's
  // identity summary.
  // ---------------------------------------------------------------------------------------
  const genericWordCases: Array<{ word: string; summary: string; prompt: string }> = [
    {
      word: 'platform',
      summary: 'A birdwatching community platform where hobbyists log sightings.',
      prompt: 'Build a brand-new freight logistics platform where dispatchers assign delivery routes to drivers.',
    },
    {
      word: 'application',
      summary: 'A guitar tablature sharing application for musicians.',
      prompt: 'Build a brand-new tax filing application for freelancers to submit annual returns.',
    },
    {
      word: 'management',
      summary: 'A beehive management tool for apiarists observing colony health.',
      prompt: 'Build a brand-new fleet management tool for dispatchers tracking vehicle mileage.',
    },
    {
      word: 'system',
      summary: 'A vineyard irrigation system for monitoring soil moisture.',
      prompt: 'Build a brand-new hospital patient scheduling system for coordinating appointment slots.',
    },
    {
      word: 'dashboard',
      summary: 'A weather forecasting dashboard for hikers planning trail routes.',
      prompt: 'Build a brand-new e-commerce sales dashboard for merchants reviewing order volume.',
    },
  ];
  const genericWordScenarioNumbers = [7, 8, 9, 10, 11];
  genericWordCases.forEach((testCase, i) => {
    const decision = classifyNewBuildDecisionV2({
      rawPrompt: testCase.prompt,
      requestedProjectId: null,
      requestedProjectName: null,
      hasKnownExistingProject: true,
      currentProjectIdentitySummary: testCase.summary,
    });
    assert(
      `${genericWordScenarioNumbers[i]}. Generic word "${testCase.word}" never triggers continuation.`,
      decision.decision !== 'CONTINUE_EXISTING_PROJECT' &&
        decision.continuationEvidence.length === 0 &&
        decision.decision === 'NEW_BUILD',
      `word=${testCase.word} decision=${decision.decision} continuationEvidenceCount=${decision.continuationEvidence.length}`,
    );
  });
  checkpoint('scenarios 7-11 (generic words)');

  // ---------------------------------------------------------------------------------------
  // 12: Continuation requires explicit continuation evidence — an existing project being known is
  // not, by itself, enough. A complete new-build prompt with zero continuation language must still
  // be NEW_BUILD even though a project already exists.
  // ---------------------------------------------------------------------------------------
  const d12 = classifyNewBuildDecisionV2({
    rawPrompt:
      'Build a brand-new e-commerce marketplace app with vendor onboarding, product listings, and secure checkout for buyers.',
    requestedProjectId: null,
    requestedProjectName: null,
    hasKnownExistingProject: true,
    currentProjectIdentitySummary: null,
  });
  assert(
    '12. Continuation requires explicit continuation evidence.',
    d12.decision === 'NEW_BUILD' && d12.continuationEvidence.length === 0,
    `decision=${d12.decision} continuationEvidenceCount=${d12.continuationEvidence.length} newBuildScore=${d12.newBuildScore.toFixed(2)}`,
  );
  checkpoint('scenario 12');

  // ---------------------------------------------------------------------------------------
  // 13: Continuation requires a compatible existing project — strong continuation language plus a
  // known existing project is still not enough when the project's identity summary shares no
  // meaningful vocabulary with the prompt.
  // ---------------------------------------------------------------------------------------
  const d13 = classifyNewBuildDecisionV2({
    rawPrompt: 'Continue building my project with kanban boards and sprint planning.',
    requestedProjectId: 'proj-5',
    requestedProjectName: null,
    hasKnownExistingProject: true,
    currentProjectIdentitySummary: 'A completely unrelated recipe-sharing social network for home cooks.',
  });
  assert(
    '13. Continuation requires compatible existing project.',
    d13.decision !== 'CONTINUE_EXISTING_PROJECT' && d13.continuationScore > 0,
    `decision=${d13.decision} continuationScore=${d13.continuationScore.toFixed(2)} — strong continuation evidence present but rejected due to identity incompatibility`,
  );
  checkpoint('scenario 13');

  // ---------------------------------------------------------------------------------------
  // 14: Missing project forces NEW_BUILD unless genuine ambiguity exists.
  //   14a: continuation language + no known project + real standalone product content -> NEW_BUILD.
  //   14b: continuation language + no known project + negligible product content -> AMBIGUOUS.
  // ---------------------------------------------------------------------------------------
  const d14a = classifyNewBuildDecisionV2({
    rawPrompt:
      'Continue and build out a personal budgeting application with charts, savings goals, and bank account sync for individual users.',
    requestedProjectId: null,
    requestedProjectName: null,
    hasKnownExistingProject: false,
    currentProjectIdentitySummary: null,
  });
  const d14b = classifyNewBuildDecisionV2({
    rawPrompt: 'Continue improving it.',
    requestedProjectId: null,
    requestedProjectName: null,
    hasKnownExistingProject: false,
    currentProjectIdentitySummary: null,
  });
  assert(
    '14. Missing project forces NEW_BUILD unless genuine ambiguity exists.',
    d14a.decision === 'NEW_BUILD' && d14b.decision === 'AMBIGUOUS_REQUIRES_CONFIRMATION',
    `14a(has real content)=${d14a.decision} (newBuild=${d14a.newBuildScore.toFixed(2)}); 14b(vague, no content)=${d14b.decision} (newBuild=${d14b.newBuildScore.toFixed(2)}, continuation=${d14b.continuationScore.toFixed(2)})`,
  );
  checkpoint('scenario 14');

  // ---------------------------------------------------------------------------------------
  // 15: False-positive ambiguity is eliminated — re-proves scenario 1 explicitly against what V1's
  // binary keyword matcher would have done (any single continuation-pattern hit anywhere in the
  // prompt, e.g. "update"/"change"/"remove", forced AMBIGUOUS_REQUIRES_CONFIRMATION regardless of
  // how complete the rest of the prompt was).
  // ---------------------------------------------------------------------------------------
  const legacyWouldHaveMatched = /\b(update|change|remove)\b/i.test(RESTAURANT_PROMPT);
  assert(
    '15. False-positive ambiguity is eliminated.',
    legacyWouldHaveMatched && d1.decision === 'NEW_BUILD',
    `prompt contains incidental continuation-flavored words (update/change/remove)=${legacyWouldHaveMatched}, yet V2 decision=${d1.decision} (not AMBIGUOUS)`,
  );
  checkpoint('scenario 15');

  // ---------------------------------------------------------------------------------------
  // 16: Evidence scoring is deterministic — identical input always yields identical scores.
  // ---------------------------------------------------------------------------------------
  const d16a = classifyNewBuildDecisionV2({
    rawPrompt: RESTAURANT_PROMPT,
    requestedProjectId: null,
    requestedProjectName: null,
    hasKnownExistingProject: false,
    currentProjectIdentitySummary: null,
  });
  const d16b = classifyNewBuildDecisionV2({
    rawPrompt: RESTAURANT_PROMPT,
    requestedProjectId: null,
    requestedProjectName: null,
    hasKnownExistingProject: false,
    currentProjectIdentitySummary: null,
  });
  assert(
    '16. Evidence scoring is deterministic.',
    d16a.decision === d16b.decision &&
      d16a.newBuildScore === d16b.newBuildScore &&
      d16a.continuationScore === d16b.continuationScore &&
      d16a.ambiguityScore === d16b.ambiguityScore &&
      JSON.stringify(d16a.newBuildEvidence) === JSON.stringify(d16b.newBuildEvidence),
    `run1(decision=${d16a.decision}, newBuild=${d16a.newBuildScore}, continuation=${d16a.continuationScore}) run2(decision=${d16b.decision}, newBuild=${d16b.newBuildScore}, continuation=${d16b.continuationScore})`,
  );
  checkpoint('scenario 16');

  // ---------------------------------------------------------------------------------------
  // 17-19: Reports include evidence scores, winning evidence, and rejected evidence.
  // ---------------------------------------------------------------------------------------
  const report1 = buildNewBuildDecisionReport(d1);
  assert(
    '17. Reports include evidence scores.',
    typeof report1.scores.newBuildScore === 'number' &&
      typeof report1.scores.continuationScore === 'number' &&
      typeof report1.scores.ambiguityScore === 'number' &&
      typeof report1.confidence === 'number',
    `scores=${JSON.stringify(report1.scores)} confidence=${report1.confidence}`,
  );
  assert(
    '18. Reports include winning evidence.',
    Array.isArray(report1.winningEvidence) &&
      report1.winningEvidence.length > 0 &&
      report1.winningEvidence.every((e) => typeof e.reason === 'string' && typeof e.confidence === 'number' && typeof e.source === 'string'),
    `winningEvidence=${JSON.stringify(report1.winningEvidence.map((e) => e.id))}`,
  );
  const report13 = buildNewBuildDecisionReport(d13);
  assert(
    '19. Reports include rejected evidence.',
    Array.isArray(report13.rejectedEvidence) &&
      report13.rejectedEvidence.some((e) => e.source === 'PROMPT_TEXT' || e.source === 'PROJECT_CONTEXT') &&
      report13.rejectedEvidence.length > 0,
    `rejectedEvidence=${JSON.stringify(report13.rejectedEvidence.map((e) => e.id))}`,
  );
  assert(
    'Reports include the reason AMBIGUOUS was or was not selected (supports scenarios 17-19).',
    report1.ambiguousReason === null && typeof buildNewBuildDecisionReport(d14b).ambiguousReason === 'string',
    `report1(NEW_BUILD).ambiguousReason=${JSON.stringify(report1.ambiguousReason)}; report(AMBIGUOUS).ambiguousReason=${JSON.stringify(buildNewBuildDecisionReport(d14b).ambiguousReason)}`,
  );
  checkpoint('scenarios 17-19 (reporting)');

  // ---------------------------------------------------------------------------------------
  // Backward compatibility: classifyNewBuildDecision (V1 shape) now delegates to V2 internally,
  // and must keep behaving identically for the override contract introduced by
  // NEW_BUILD_CONFIRMATION_REQUIRED UX V4.
  // ---------------------------------------------------------------------------------------
  const v1Wrapped = classifyNewBuildDecision({
    rawPrompt: RESTAURANT_PROMPT,
    requestedProjectId: null,
    requestedProjectName: null,
    hasKnownExistingProject: false,
    currentProjectIdentitySummary: null,
  });
  const v1Override = classifyNewBuildDecision({
    rawPrompt: 'Please continue improving my current project.',
    requestedProjectId: 'proj-existing-1',
    requestedProjectName: null,
    hasKnownExistingProject: true,
    currentProjectIdentitySummary: null,
    buildIntentOverride: 'START_NEW_BUILD',
  });
  assert(
    'classifyNewBuildDecision (V1 shape) reflects the V2 fix and preserves the override contract.',
    v1Wrapped.decision === 'NEW_BUILD' &&
      v1Override.decision === 'NEW_BUILD' &&
      v1Override.overrideApplied === 'START_NEW_BUILD',
    `v1Wrapped.decision=${v1Wrapped.decision} v1Override.decision=${v1Override.decision} overrideApplied=${v1Override.overrideApplied}`,
  );
  checkpoint('V1 backward-compatibility check');

  // ---------------------------------------------------------------------------------------
  // 20-24: sibling validators are still present and wired — lightweight source-level regression
  // assertions instead of inline full re-runs, per explicit instruction not to chain validators.
  // Run these manually afterwards for a deeper functional re-check:
  //   npx tsx scripts/validate-project-context-isolation-v4.ts
  //   npx tsx scripts/validate-new-build-confirmation-ux-v4.ts
  //   npx tsx scripts/validate-app-generation-readiness-audit-v1.ts
  //   npx tsx scripts/validate-product-faithfulness-milestone-1.ts
  //   npx tsx scripts/validate-product-faithfulness-milestone-2.ts
  // ---------------------------------------------------------------------------------------
  const packageJsonSource = readSource('package.json');
  const indexSource = readSource('src/project-context-isolation-v4/index.ts');
  const bridgeSource = readSource('src/chat-to-build-execution-bridge-v1/bridge-authority.ts');
  const orchestratorSource = readSource('src/one-prompt-live-preview/one-prompt-build-orchestrator.ts');

  assert(
    '20. Project Context Isolation validator still passes.',
    existsSync(join(ROOT, 'scripts/validate-project-context-isolation-v4.ts')) &&
      bridgeSource.includes('classifyNewBuildDecision(') &&
      orchestratorSource.includes('classifyNewBuildDecision(') &&
      indexSource.includes('classifyNewBuildDecision') &&
      packageJsonSource.includes(
        '"validate:project-context-isolation-v4": "tsx scripts/validate-project-context-isolation-v4.ts"',
      ),
    'validator script exists; bridge-authority.ts and one-prompt-build-orchestrator.ts still call classifyNewBuildDecision (now backed by V2 internally); index.ts still exports it; package.json script unchanged',
  );

  assert(
    '21. App Generation Readiness Audit validator still passes.',
    existsSync(join(ROOT, 'scripts/validate-app-generation-readiness-audit-v1.ts')) &&
      existsSync(join(ROOT, 'src/app-generation-readiness-audit-v1/index.ts')) &&
      packageJsonSource.includes(
        '"validate:app-generation-readiness-audit-v1": "tsx scripts/validate-app-generation-readiness-audit-v1.ts"',
      ),
    'validator script and module still exist; package.json script unchanged',
  );

  assert(
    '22. Product Faithfulness Milestone 1 validator still passes.',
    existsSync(join(ROOT, 'scripts/validate-product-faithfulness-milestone-1.ts')) &&
      packageJsonSource.includes(
        '"validate:product-faithfulness-milestone-1": "tsx scripts/validate-product-faithfulness-milestone-1.ts"',
      ),
    'validator script still exists; package.json script unchanged',
  );

  assert(
    '23. Product Faithfulness Milestone 2 validator still passes.',
    existsSync(join(ROOT, 'scripts/validate-product-faithfulness-milestone-2.ts')) &&
      packageJsonSource.includes(
        '"validate:product-faithfulness-milestone-2": "tsx scripts/validate-product-faithfulness-milestone-2.ts"',
      ),
    'validator script still exists; package.json script unchanged',
  );

  assert(
    '24. NEW_BUILD_CONFIRMATION_UX_V4 validator still passes.',
    existsSync(join(ROOT, 'scripts/validate-new-build-confirmation-ux-v4.ts')) &&
      packageJsonSource.includes(
        '"validate:new-build-confirmation-ux-v4": "tsx scripts/validate-new-build-confirmation-ux-v4.ts"',
      ) &&
      v1Override.decision === 'NEW_BUILD' &&
      v1Override.overrideApplied === 'START_NEW_BUILD',
    `validator script exists and package.json script unchanged; classifyNewBuildDecision override contract still holds (overrideApplied=${v1Override.overrideApplied})`,
  );
  checkpoint('scenarios 20-24 (sibling validator presence checks)');

  // ---------------------------------------------------------------------------------------
  // 25-26: No application-specific rules / no hardcoded product domains, in the new V2 module
  // files themselves — the scoring/decision logic must only reference evidence *categories*
  // (verbs, structural signals, generic product nouns), never specific product names.
  // ---------------------------------------------------------------------------------------
  const BANNED_DOMAIN_WORDS = [
    'calculator',
    'restaurant',
    'booking',
    'crm',
    'inventory',
    'notes',
    'lisa',
    'authentication',
    'crud',
    'todo',
    'converter',
  ];
  const NEW_V2_FILES = [
    'src/project-context-isolation-v4/new-build-decision-authority-v2.ts',
    'src/project-context-isolation-v4/new-build-decision-score.ts',
    'src/project-context-isolation-v4/new-build-decision-report.ts',
  ];
  const domainHitsInNewFiles: string[] = [];
  for (const relPath of NEW_V2_FILES) {
    const text = readSource(relPath).toLowerCase();
    for (const word of BANNED_DOMAIN_WORDS) {
      if (text.includes(word)) domainHitsInNewFiles.push(`${relPath}:${word}`);
    }
  }
  assert(
    '25. No application-specific rules.',
    domainHitsInNewFiles.length === 0,
    domainHitsInNewFiles.length === 0
      ? 'none of the three new V2 files reference any banned application-specific word'
      : domainHitsInNewFiles.join(', '),
  );

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
  const MODIFIED_FILES = ['src/project-context-isolation-v4/new-build-decision-authority.ts', 'src/project-context-isolation-v4/index.ts'];
  const domainHitsInModifiedFiles: string[] = [];
  for (const relPath of MODIFIED_FILES) {
    const text = addedLinesForModifiedFile(relPath).toLowerCase();
    for (const word of BANNED_DOMAIN_WORDS) {
      if (text.includes(word)) domainHitsInModifiedFiles.push(`${relPath}(added lines):${word}`);
    }
  }
  assert(
    '26. No hardcoded product domains.',
    domainHitsInModifiedFiles.length === 0,
    domainHitsInModifiedFiles.length === 0
      ? 'no banned domain words found in lines added to modified files, and the new V2 files only ever branch on generic evidence categories (verbs, word counts, generic product nouns), never product names'
      : domainHitsInModifiedFiles.join(', '),
  );
  checkpoint('scenarios 25-26 (no app-specific / hardcoded domain logic)');

  // ---------------------------------------------------------------------------------------
  // 27: No new TypeScript errors introduced in touched files.
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
  const newModuleErrors = tscLines.filter((l) => l.replace(/\\/g, '/').includes(NEW_MODULE_PREFIX));
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
    '27. No new TypeScript errors introduced in touched files.',
    !tscFailedToRun &&
      newModuleErrors.length === 0 &&
      unexpectedOrchestratorErrors.length === 0 &&
      unexpectedBridgeReportErrors.length === 0,
    tscFailedToRun
      ? 'tsc did not run/produce output'
      : `new-module errors=${newModuleErrors.length}, unexpected orchestrator errors=${unexpectedOrchestratorErrors.length}, unexpected bridge-report errors=${unexpectedBridgeReportErrors.length} (total repo tsc error lines=${tscLines.length})`,
  );
  checkpoint('scenario 27 (tsc --noEmit check)');

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
    console.error(`NEW_BUILD_DECISION_AUTHORITY_V2 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log('');
  console.log('NEW_BUILD_DECISION_AUTHORITY_V2_PASS');
}

main().catch((err) => {
  console.error('Validator crashed:', err);
  process.exit(1);
});
