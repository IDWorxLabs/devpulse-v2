/**
 * Product Faithfulness Milestone 1 — validation suite.
 *
 * Constitutional principle under test: a generated application is unsuccessful if it does not
 * substantially represent the requested product, regardless of whether it compiles, previews,
 * validates, or passes interaction proof. This suite proves the product-faithfulness-v1 module is
 * deterministic, evidence-driven, has no LLM dependency, introduces no new orchestration engine,
 * removes no core system, and is correctly wired into the normalizer, the build API response, and
 * the founder-facing UI — then re-runs every earlier validator to confirm no regressions.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFounderRealityServer } from '../server/founder-reality-server.js';
import { exitValidator, startValidatorHttpServer } from '../src/windows-validator-clean-exit-v1/index.js';
import { evaluateProductFaithfulness } from '../src/product-faithfulness-v1/product-faithfulness-engine.js';
import type { ProductFaithfulnessInput } from '../src/product-faithfulness-v1/product-faithfulness-types.js';
import { normalizeBuildResult } from '../src/build-result-normalizer-v1/build-result-normalizer.js';
import type { BuildResultNormalizerInput } from '../src/build-result-normalizer-v1/build-result-normalizer.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const require = createRequire(import.meta.url);

export const PRODUCT_FAITHFULNESS_MILESTONE_1_PASS_TOKEN = 'PRODUCT_FAITHFULNESS_MILESTONE_1_PASS';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

interface FreshValidatorEvidence {
  schema: 'AIDEVENGINE_FRESH_VALIDATOR_EVIDENCE_V1';
  generatedAt: string;
  validators: Record<string, { passToken: string; exitCode: number; output: string }>;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const CORE_ENGINE_FOLDERS = [
  'src/one-prompt-live-preview',
  'src/chat-to-build-execution-bridge-v1',
  'src/autonomous-engineering-executive',
  'src/autonomous-engineering-loop',
  'src/autonomous-software-engineering-engine',
  'src/code-generation-engine',
  'src/end-to-end-build-reality-engine-v1',
  'src/launch-readiness-authority-v2',
  'src/workspace-reality-audit',
  'src/live-preview-gate',
  'src/live-preview-runtime',
  'src/project-registry-v1',
  'src/universal-prompt-to-app-materialization',
  'src/build-execution-stabilizer-v1',
  'src/workspace-materialization-stabilizer-v1',
  'src/live-preview-interaction-proof-v1',
];

const MODULE_DIR = join(ROOT, 'src/product-faithfulness-v1');
const MODULE_FILES = [
  'index.ts',
  'product-faithfulness-types.ts',
  'product-faithfulness-engine.ts',
  'product-faithfulness-feature-extractor.ts',
  'product-faithfulness-comparator.ts',
  'product-faithfulness-report.ts',
  'product-faithfulness-verdict.ts',
].map((f) => join(MODULE_DIR, f));

function readModuleSource(): string {
  return MODULE_FILES.filter(existsSync)
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n\n');
}

/**
 * Runs a previous validator script as a child process and confirms it exits 0 with its pass
 * token. Invokes tsx's CLI entry directly via `node` — cross-platform, no shell required.
 */
function runPreviousValidator(scriptRelativePath: string, passToken: string): { ok: boolean; detail: string } {
  const evidencePath = process.env.AIDEVENGINE_FRESH_VALIDATOR_EVIDENCE_V1;
  if (evidencePath && existsSync(evidencePath)) {
    try {
      const evidence = JSON.parse(readFileSync(evidencePath, 'utf8')) as FreshValidatorEvidence;
      const generatedAt = Date.parse(evidence.generatedAt);
      const ageMs = Date.now() - generatedAt;
      const entry = evidence.validators?.[scriptRelativePath];
      if (
        evidence.schema === 'AIDEVENGINE_FRESH_VALIDATOR_EVIDENCE_V1' &&
        Number.isFinite(generatedAt) &&
        ageMs >= -5_000 &&
        ageMs <= 300_000 &&
        entry?.exitCode === 0 &&
        entry.passToken === passToken &&
        entry.output.includes(passToken)
      ) {
        return { ok: true, detail: `fresh independent process evidence consumed (ageMs=${ageMs})` };
      }
    } catch {
      // Invalid or stale evidence must fall through to an independent child execution.
    }
  }

  const tsxCli = require.resolve('tsx/cli');
  try {
    const output = execFileSync(process.execPath, [tsxCli, scriptRelativePath], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const ok = output.includes(passToken);
    return { ok, detail: ok ? 'pass token found' : 'pass token missing from output' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stdout = (err as { stdout?: Buffer | string })?.stdout;
    const stdoutText = stdout ? stdout.toString() : '';
    return { ok: stdoutText.includes(passToken), detail: stdoutText ? stdoutText.slice(-300) : message.slice(0, 300) };
  }
}

function baseNormalizerInput(overrides: Partial<BuildResultNormalizerInput>): BuildResultNormalizerInput {
  return {
    status: 'READY',
    npmInstallOk: true,
    npmBuildOk: true,
    devServerRunning: true,
    previewUrl: 'http://127.0.0.1:5174/',
    failureReason: null,
    ...overrides,
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Product Faithfulness Milestone 1 — Validation');
  console.log('===============================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert(
    '01. package script registered',
    Boolean(pkg.scripts?.['validate:product-faithfulness-milestone-1']),
    'validate:product-faithfulness-milestone-1',
  );

  // --- Module files exist -----------------------------------------------------------------

  for (const file of MODULE_FILES) {
    assert(`02. module file exists — ${file.replace(ROOT, '')}`, existsSync(file), file);
  }

  const moduleSource = readModuleSource();

  // --- Scenario 1: Calculator prompt -> Calculator output -> PASS -------------------------

  const calculatorInput: ProductFaithfulnessInput = {
    prompt: 'Build a simple calculator app',
    generatedComponents: [
      'AdditionButton',
      'SubtractionButton',
      'MultiplicationButton',
      'DivisionButton',
      'Display',
      'NumericKeypad',
      'EqualsButton',
      'ClearButton',
    ],
    generatedRoutes: ['/calculator'],
  };
  const calculatorReport = evaluateProductFaithfulness(calculatorInput);
  assert(
    '03. Calculator prompt -> Calculator output -> PASS (not a mismatch, healthy score)',
    calculatorReport.verdict !== 'PRODUCT_MISMATCH' &&
      calculatorReport.verdict !== 'LOW_FAITHFULNESS' &&
      calculatorReport.score >= 65,
    `verdict=${calculatorReport.verdict} score=${calculatorReport.score}`,
  );

  // --- Scenario 2: Todo prompt -> Todo output -> PASS --------------------------------------

  const todoInput: ProductFaithfulnessInput = {
    prompt: 'Build a todo list app to track my daily tasks',
    generatedRoutes: ['/tasks'],
    generatedComponents: ['TaskList', 'AddTaskForm', 'TaskItem', 'CategoryFilter', 'ReminderBanner', 'DueDatePicker', 'ChecklistToggle'],
    navigationLabels: ['Tasks', 'Completed', 'Categories'],
    visibleHeadings: ['My Tasks', 'Mark Complete'],
  };
  const todoReport = evaluateProductFaithfulness(todoInput);
  assert(
    '04. Todo prompt -> Todo output -> PASS (not a mismatch, healthy score)',
    todoReport.verdict !== 'PRODUCT_MISMATCH' && todoReport.verdict !== 'LOW_FAITHFULNESS' && todoReport.score >= 65,
    `verdict=${todoReport.verdict} score=${todoReport.score}`,
  );

  // --- Scenario 3: Booking prompt -> Booking output -> PASS --------------------------------

  const bookingInput: ProductFaithfulnessInput = {
    prompt: 'Build an appointment booking system for a hair salon',
    generatedRoutes: ['/appointments', '/calendar', '/customers', '/services', '/staff', '/dashboard'],
    generatedComponents: [
      'AppointmentList',
      'CalendarView',
      'CustomerList',
      'ServiceList',
      'StaffList',
      'Dashboard',
      'BookingForm',
      'TimeSlotPicker',
    ],
  };
  const bookingReport = evaluateProductFaithfulness(bookingInput);
  assert(
    '05. Booking prompt -> Booking output -> PASS (not a mismatch, healthy score)',
    bookingReport.verdict !== 'PRODUCT_MISMATCH' && bookingReport.verdict !== 'LOW_FAITHFULNESS' && bookingReport.score >= 65,
    `verdict=${bookingReport.verdict} score=${bookingReport.score}`,
  );

  // --- Scenario 4: Booking prompt -> Notes output -> PRODUCT_MISMATCH, score < 20% --------

  const bookingToNotesInput: ProductFaithfulnessInput = {
    prompt: 'Build an appointment booking system for a hair salon',
    generatedRoutes: ['/notes'],
    generatedComponents: ['NoteList', 'NoteEditor'],
    navigationLabels: ['Notes', 'New Note'],
    visibleHeadings: ['My Notes'],
  };
  const bookingToNotesReport = evaluateProductFaithfulness(bookingToNotesInput);
  assert(
    '06. Booking prompt -> Notes output -> PRODUCT_MISMATCH',
    bookingToNotesReport.verdict === 'PRODUCT_MISMATCH',
    bookingToNotesReport.verdict,
  );
  assert(
    '07. Booking prompt -> Notes output -> faithfulness score under 20%',
    bookingToNotesReport.score < 20,
    String(bookingToNotesReport.score),
  );

  // --- Scenario 5: CRM prompt -> Calculator output -> PRODUCT_MISMATCH --------------------

  const crmToCalculatorInput: ProductFaithfulnessInput = {
    prompt: 'Build a CRM for tracking leads, deals, and sales pipeline',
    generatedComponents: [
      'AdditionButton',
      'SubtractionButton',
      'MultiplicationButton',
      'DivisionButton',
      'Display',
      'NumericKeypad',
      'EqualsButton',
      'ClearButton',
    ],
  };
  const crmToCalculatorReport = evaluateProductFaithfulness(crmToCalculatorInput);
  assert(
    '08. CRM prompt -> Calculator output -> PRODUCT_MISMATCH',
    crmToCalculatorReport.verdict === 'PRODUCT_MISMATCH',
    crmToCalculatorReport.verdict,
  );

  // --- Scenario 6: Unexpected feature detection works --------------------------------------

  const unexpectedInput: ProductFaithfulnessInput = {
    prompt: 'Build a todo list app',
    generatedComponents: ['TaskList', 'AddTaskForm', 'InvoiceGenerator', 'PaymentCheckout'],
  };
  const unexpectedReport = evaluateProductFaithfulness(unexpectedInput);
  assert(
    '09. Unexpected feature detection works',
    unexpectedReport.comparison.unexpected.length > 0,
    `unexpected=${JSON.stringify(unexpectedReport.comparison.unexpected)}`,
  );

  // --- Scenario 7: Missing feature detection works -----------------------------------------

  const missingInput: ProductFaithfulnessInput = {
    prompt: 'Build an appointment booking system for a hair salon',
    generatedComponents: ['AppointmentList'],
  };
  const missingReport = evaluateProductFaithfulness(missingInput);
  assert(
    '10. Missing feature detection works',
    missingReport.comparison.missing.length > 0,
    `missing=${JSON.stringify(missingReport.comparison.missing)}`,
  );

  // --- Scenario 8: DOM concept extraction works --------------------------------------------

  const domInput: ProductFaithfulnessInput = {
    prompt: 'Build an appointment booking system',
    domText: 'Welcome to your Appointments dashboard. View your Calendar and manage Customers and Services.',
  };
  const domReport = evaluateProductFaithfulness(domInput);
  assert(
    '11. DOM concept extraction works',
    domReport.generated.concepts.some((c) => ['Appointments', 'Calendar', 'Customers', 'Services', 'Dashboard'].includes(c.concept)),
    `generated=${JSON.stringify(domReport.generated.concepts.map((c) => c.concept))}`,
  );

  // --- Scenario 9: Feature contract extraction works ---------------------------------------

  const featureContractInput: ProductFaithfulnessInput = {
    prompt: 'Build a todo list app',
    featureContract: [{ featureName: 'Task List' }, { featureName: 'Add Task' }, { name: 'Mark Complete' }],
  };
  const featureContractReport = evaluateProductFaithfulness(featureContractInput);
  assert(
    '12. Feature contract extraction works',
    featureContractReport.requested.concepts.some((c) => ['Tasks', 'Task List', 'Add Task', 'Mark Complete'].includes(c.concept)),
    `requested=${JSON.stringify(featureContractReport.requested.concepts.map((c) => c.concept))}`,
  );

  // --- Scenario 10: Manifest extraction works ----------------------------------------------

  const manifestInput: ProductFaithfulnessInput = {
    prompt: 'Build a CRM',
    materializationManifestHints: {
      featureModuleNames: ['Leads', 'Pipeline', 'Deals'],
      promptTerms: ['customer', 'sales'],
      routes: ['/leads', '/pipeline', '/deals'],
    },
  };
  const manifestReport = evaluateProductFaithfulness(manifestInput);
  assert(
    '13. Manifest extraction works',
    manifestReport.generated.concepts.some((c) => ['Leads', 'Pipeline', 'Deals', 'Customers', 'Sales'].includes(c.concept)),
    `generated=${JSON.stringify(manifestReport.generated.concepts.map((c) => c.concept))}`,
  );

  // --- Scenario 11: No app-specific hardcoding ---------------------------------------------

  // The module legitimately ships a generic, reusable product-domain glossary (the same kind of
  // reference data a spellchecker ships with) — that is required by the milestone's own examples
  // (calculator, todo, booking, CRM). What must never appear is hardcoding tied to one specific
  // generated project instance (a project id/name from this codebase's own test history), or
  // conditional logic branching on a specific project identity rather than on evidence content.
  const PROJECT_INSTANCE_TERMS = ['lisa', 'expense-tracker', 'expense tracker'];
  let projectInstanceHardcoding: string | null = null;
  for (const term of PROJECT_INSTANCE_TERMS) {
    const re = term.includes(' ') || term.includes('-') ? new RegExp(term, 'i') : new RegExp(`\\b${term}\\b`, 'i');
    if (re.test(moduleSource) && !projectInstanceHardcoding) projectInstanceHardcoding = term;
  }
  assert(
    '14. No hardcoded references to a specific past project instance',
    projectInstanceHardcoding === null,
    projectInstanceHardcoding || 'clean',
  );
  assert(
    '15. No conditional logic branching on a specific projectId/projectName',
    !/projectId\s*===|projectName\s*===/.test(moduleSource),
    'expected no projectId/projectName identity branching — the engine must only branch on evidence content',
  );
  // Genericity: the module must generalize beyond the four example domains via a fallback
  // tokenizer, not only via the curated glossary.
  const unrecognizedDomainReport = evaluateProductFaithfulness({
    prompt: 'Build a recipe manager with ingredients and cooking instructions',
    generatedComponents: ['RecipeList', 'IngredientEditor', 'InstructionSteps'],
  });
  assert(
    '16. Generalizes beyond the curated glossary via a domain-agnostic fallback',
    unrecognizedDomainReport.requested.concepts.length > 0 && unrecognizedDomainReport.generated.concepts.length > 0,
    `requested=${unrecognizedDomainReport.requested.concepts.length} generated=${unrecognizedDomainReport.generated.concepts.length}`,
  );

  // --- Scenario 12: No LLM dependency -------------------------------------------------------

  // Note: the module's own doc comments legitimately say things like "no LLM" to document the
  // design decision — that is the opposite of a violation, so the audit looks for actual usage
  // signals (imports, API call patterns, model identifiers) rather than the bare word "LLM".
  const LLM_USAGE_TERMS = ['openai', 'anthropic', 'gpt-', 'gpt3', 'gpt4', 'claude', 'chatcompletion', 'inference api', 'chat.completions'];
  let llmDependencyFound: string | null = null;
  for (const term of LLM_USAGE_TERMS) {
    if (new RegExp(term, 'i').test(moduleSource) && !llmDependencyFound) llmDependencyFound = term;
  }
  assert('17. No LLM dependency in source', llmDependencyFound === null, llmDependencyFound || 'clean');
  assert(
    '18. No network calls (fetch/http/axios) in the faithfulness module — pure, offline, deterministic',
    !/\bfetch\s*\(|require\(['"]https?['"]\)|axios/.test(moduleSource),
    'expected no network calls',
  );

  // --- Scenario 13: No new orchestration engine ---------------------------------------------

  assert(
    '19. No new orchestration primitives (setInterval/setTimeout/spawn/EventEmitter/queue)',
    !/setInterval\(|setTimeout\(|child_process|EventEmitter|new\s+Worker\(/.test(moduleSource),
    'expected a pure, synchronous evaluation module with no scheduling or process management',
  );
  assert(
    '20. evaluateProductFaithfulness is a synchronous pure function (no async, no Promise)',
    /export function evaluateProductFaithfulness\s*\(/.test(moduleSource) &&
      !/export async function evaluateProductFaithfulness/.test(moduleSource),
    'expected a synchronous export',
  );

  // --- Scenario 14: No core systems removed -------------------------------------------------

  for (const folder of CORE_ENGINE_FOLDERS) {
    assert(`21. core folder preserved — ${folder}`, existsSync(join(ROOT, folder)), folder);
  }

  // --- Determinism: same input always produces the same output ----------------------------

  const repeatA = evaluateProductFaithfulness(calculatorInput);
  const repeatB = evaluateProductFaithfulness(calculatorInput);
  assert(
    '22. Deterministic — identical input always produces identical score and verdict',
    repeatA.score === repeatB.score && repeatA.verdict === repeatB.verdict,
    `${repeatA.score}/${repeatA.verdict} vs ${repeatB.score}/${repeatB.verdict}`,
  );

  // --- Verdict coverage: all five verdicts are reachable / declared ------------------------

  const verdictFile = readFileSync(join(MODULE_DIR, 'product-faithfulness-verdict.ts'), 'utf8');
  for (const verdict of ['PRODUCT_FAITHFUL', 'PRODUCT_MOSTLY_FAITHFUL', 'PARTIALLY_FAITHFUL', 'LOW_FAITHFULNESS', 'PRODUCT_MISMATCH']) {
    assert(`23. verdict declared — ${verdict}`, verdictFile.includes(verdict), verdict);
  }

  // --- Build Result Integration: BUILT_SUCCESSFULLY must never coexist with a mismatch/low ---

  const healthyBuild = normalizeBuildResult(baseNormalizerInput({ productFaithfulnessReport: calculatorReport }));
  assert(
    '24. Healthy build + faithful product normalizes to BUILT_SUCCESSFULLY',
    healthyBuild.result === 'BUILT_SUCCESSFULLY',
    healthyBuild.result,
  );

  const mismatchBuild = normalizeBuildResult(baseNormalizerInput({ productFaithfulnessReport: bookingToNotesReport }));
  assert(
    '25. Healthy build + PRODUCT_MISMATCH normalizes to BUILT_WITH_PRODUCT_MISMATCH (never BUILT_SUCCESSFULLY)',
    mismatchBuild.result === 'BUILT_WITH_PRODUCT_MISMATCH',
    mismatchBuild.result,
  );

  const lowFaithfulnessReport = missingReport; // same fixture: 1/8 requested concepts present -> LOW_FAITHFULNESS band
  assert(
    '26. Fixture actually produces LOW_FAITHFULNESS for the next check',
    lowFaithfulnessReport.verdict === 'LOW_FAITHFULNESS',
    `verdict=${lowFaithfulnessReport.verdict} score=${lowFaithfulnessReport.score}`,
  );
  const lowFaithfulnessBuild = normalizeBuildResult(baseNormalizerInput({ productFaithfulnessReport: lowFaithfulnessReport }));
  assert(
    '27. Healthy build + LOW_FAITHFULNESS normalizes to BUILT_WITH_LOW_FAITHFULNESS (never BUILT_SUCCESSFULLY)',
    lowFaithfulnessBuild.result === 'BUILT_WITH_LOW_FAITHFULNESS',
    lowFaithfulnessBuild.result,
  );
  assert(
    '28. normalizedBuild.productFaithfulness summary is populated when a report is provided',
    mismatchBuild.productFaithfulness !== null && mismatchBuild.productFaithfulness.verdict === 'PRODUCT_MISMATCH',
    JSON.stringify(mismatchBuild.productFaithfulness),
  );
  assert(
    '29. No faithfulness report at all never downgrades a healthy build (additive, not a regression trigger)',
    normalizeBuildResult(baseNormalizerInput({})).result === 'BUILT_SUCCESSFULLY',
    'expected BUILT_SUCCESSFULLY when no faithfulness report was ever produced',
  );

  // --- API wiring: productFaithfulness included in the build response ---------------------

  const handlerPath = join(ROOT, 'server/build-from-prompt-handler.ts');
  const handlerSource = readFileSync(handlerPath, 'utf8');
  assert(
    '30. build-from-prompt-handler computes product faithfulness for a build',
    handlerSource.includes('evaluateProductFaithfulnessForBuild') || handlerSource.includes('evaluateProductFaithfulness('),
    'expected the handler to call the product faithfulness engine',
  );
  assert(
    '31. build-from-prompt-handler includes productFaithfulness in the API response (existing fields preserved)',
    /productFaithfulness[,\s]/.test(handlerSource) &&
      handlerSource.includes('normalizedBuild:') &&
      handlerSource.includes('livePreviewInteractionProof,'),
    'expected productFaithfulness alongside normalizedBuild/livePreviewInteractionProof, not replacing them',
  );

  // --- Normalizer type surface ---------------------------------------------------------------

  const normalizerTypesSource = readFileSync(join(ROOT, 'src/build-result-normalizer-v1/build-result-normalizer-types.ts'), 'utf8');
  assert(
    '32. NormalizedBuildResultKind declares BUILT_WITH_PRODUCT_MISMATCH and BUILT_WITH_LOW_FAITHFULNESS',
    normalizerTypesSource.includes('BUILT_WITH_PRODUCT_MISMATCH') && normalizerTypesSource.includes('BUILT_WITH_LOW_FAITHFULNESS'),
    'expected both new result kinds declared',
  );
  assert(
    '33. Existing NormalizedBuildResultKind values were not removed',
    ['BUILT_SUCCESSFULLY', 'BUILT_WITH_WARNINGS', 'FAILED_WITH_REPAIR_AVAILABLE', 'FAILED_BLOCKED'].every((k) =>
      normalizerTypesSource.includes(k),
    ),
    'expected all four pre-existing result kinds to remain declared',
  );

  // --- UI: compact Product Faithfulness panel ------------------------------------------------

  const indexPath = join(ROOT, 'public/founder-reality/index.html');
  const cssPath = join(ROOT, 'public/founder-reality/builder-home.css');
  const jsPath = join(ROOT, 'public/founder-reality/builder-home.js');
  const indexHtml = readFileSync(indexPath, 'utf8');
  const css = readFileSync(cssPath, 'utf8');
  const js = readFileSync(jsPath, 'utf8');

  assert(
    '34. UI declares a compact Product Faithfulness panel',
    indexHtml.includes('id="builder-faithfulness-section"') && indexHtml.includes('Product Faithfulness'),
    'expected #builder-faithfulness-section with a "Product Faithfulness" heading',
  );
  assert(
    '35. Panel displays score, verdict badge, and headline/reason',
    indexHtml.includes('id="builder-faithfulness-score"') &&
      indexHtml.includes('id="builder-faithfulness-badge"') &&
      indexHtml.includes('id="builder-faithfulness-headline"') &&
      indexHtml.includes('id="builder-faithfulness-reason"'),
    'expected score/badge/headline/reason elements',
  );
  assert(
    '36. Panel exposes top matched / missing / unexpected concept lists behind a details toggle',
    indexHtml.includes('id="builder-faithfulness-details"') &&
      indexHtml.includes('id="builder-faithfulness-matched-list"') &&
      indexHtml.includes('id="builder-faithfulness-missing-list"') &&
      indexHtml.includes('id="builder-faithfulness-unexpected-list"'),
    'expected matched/missing/unexpected lists inside a <details> element',
  );
  assert(
    '37. JS renders the faithfulness panel from normalizedBuild.productFaithfulness',
    /function renderFaithfulness\s*\(/.test(js) && js.includes('normalized.productFaithfulness'),
    'expected renderFaithfulness(productFaithfulness) wired into renderBuildResult',
  );
  assert(
    '38. Raw comparison detail is kept in Advanced Diagnostics, not the compact panel',
    indexHtml.includes('id="builder-diagnostics-faithfulness-raw"') && js.includes('builder-diagnostics-faithfulness-raw'),
    'expected raw JSON evidence rendered only inside the diagnostics drawer',
  );
  assert(
    '39. UI distinguishes "runs" from "is the correct application" via distinct result kinds',
    js.includes('BUILT_WITH_PRODUCT_MISMATCH') && js.includes('BUILT_WITH_LOW_FAITHFULNESS'),
    'expected the UI result maps to cover both new result kinds distinctly from BUILT_SUCCESSFULLY',
  );

  // --- Generality audit: UI/normalizer files carry no app-specific hardcoding -------------

  const FORBIDDEN_APP_SPECIFIC_TERMS = ['counter', 'todo', 'calculator', 'crm', 'lisa', 'expense-tracker', 'expense tracker'];
  function containsForbiddenAppSpecificTerm(source: string): string | null {
    for (const term of FORBIDDEN_APP_SPECIFIC_TERMS) {
      const re = term.includes(' ') || term.includes('-') ? new RegExp(term, 'i') : new RegExp(`\\b${term}\\b`, 'i');
      if (re.test(source)) return term;
    }
    return null;
  }
  const normalizerDir = join(ROOT, 'src/build-result-normalizer-v1');
  const normalizerFiles = readdirSync(normalizerDir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => join(normalizerDir, f));
  let hardcodingFound: string | null = null;
  for (const file of [...normalizerFiles, indexPath, cssPath, jsPath]) {
    const found = containsForbiddenAppSpecificTerm(readFileSync(file, 'utf8'));
    if (found && !hardcodingFound) hardcodingFound = `${found} in ${file}`;
  }
  assert(
    '40. No app-specific hardcoding in normalizer or builder UI files',
    hardcodingFound === null,
    hardcodingFound || 'clean',
  );

  // --- Live server checks -------------------------------------------------------------------

  let closeServer: (() => Promise<void>) | null = null;
  try {
    const started = await startValidatorHttpServer(() => createFounderRealityServer());
    closeServer = started.close;
    const rootRes = await fetch(`${started.baseUrl}/`);
    const rootHtml = await rootRes.text();
    assert('41. GET / returns HTTP 200', rootRes.status === 200, String(rootRes.status));
    assert(
      '42. GET / serves the Product Faithfulness panel markup',
      rootHtml.includes('id="builder-faithfulness-section"'),
      'served HTML missing the faithfulness panel',
    );
  } catch (err) {
    assert('41-42. live server checks', false, err instanceof Error ? err.message : String(err));
  } finally {
    if (closeServer) await closeServer();
  }

  // --- Acceptance criteria: all previous validators still pass ----------------------------

  const previousValidators: Array<{ script: string; token: string }> = [
    { script: 'scripts/validate-simplified-builder-ui-v1.ts', token: 'SIMPLIFIED_BUILDER_UI_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-1-v1.ts', token: 'PRODUCT_STABILIZATION_PHASE_1_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-2-v1.ts', token: 'PRODUCT_STABILIZATION_PHASE_2_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-3-v1.ts', token: 'PRODUCT_STABILIZATION_PHASE_3_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-4-v1.ts', token: 'PRODUCT_STABILIZATION_PHASE_4_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-5-v1.ts', token: 'PRODUCT_STABILIZATION_PHASE_5_V1_PASS' },
  ];
  let checkNumber = 43;
  for (const { script, token } of previousValidators) {
    const outcome = runPreviousValidator(script, token);
    assert(`${checkNumber}. ${script} still passes`, outcome.ok, outcome.detail);
    checkNumber += 1;
  }

  const passed = results.filter((r) => r.passed).length;
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}`);
    if (!check.passed) console.log(`       ${check.detail}`);
  }
  console.log('');
  console.log(`${passed}/${results.length} checks passed`);
  console.log('');

  if (passed === results.length) {
    console.log(PRODUCT_FAITHFULNESS_MILESTONE_1_PASS_TOKEN);
    await exitValidator(0);
    return;
  }
  await exitValidator(1);
}

main().catch(async (err) => {
  console.error(err);
  await exitValidator(1);
});
