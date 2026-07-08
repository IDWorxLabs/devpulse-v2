/**
 * Product Stabilization Phase 2 V1 — validation suite.
 *
 * Confirms AiDevEngine proves whether a generated app is actually usable inside its live
 * preview — not just that a previewUrl exists — via the live-preview-interaction-proof-v1
 * module, that the proof is wired into the build response and the Phase 1 normalizer, that the
 * simplified builder UI shows a plain-English "Live Preview Proof" section with raw evidence
 * only in Advanced Diagnostics, that the runner is bounded (max attempts / timeouts), and that
 * the interaction planner remains fully generic (no app-specific hardcoding).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exitValidator } from '../src/windows-validator-clean-exit-v1/index.js';
import {
  runLivePreviewInteractionProof,
  classifyPlaywrightLaunchError,
  PLAYWRIGHT_INSTALL_INSTRUCTION,
  LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_LOAD_WAIT_MS,
  LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_INTERACTION_ATTEMPTS,
  LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_TOTAL_PROOF_TIME_MS,
  type ProofPageDriver,
} from '../src/live-preview-interaction-proof-v1/index.js';
import { normalizeBuildResult, type BuildResultNormalizerInput } from '../src/build-result-normalizer-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export const PRODUCT_STABILIZATION_PHASE_2_V1_PASS_TOKEN = 'PRODUCT_STABILIZATION_PHASE_2_V1_PASS';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

/** Forbidden app-specific hardcoding — this proof must stay generic for any generated app. */
const FORBIDDEN_APP_SPECIFIC_TERMS = [
  'counter',
  'todo',
  'calculator',
  'crm',
  'lisa',
  'expense-tracker',
  'expense tracker',
];

function containsForbiddenAppSpecificTerm(source: string): string | null {
  for (const term of FORBIDDEN_APP_SPECIFIC_TERMS) {
    const re = term.includes(' ') || term.includes('-') ? new RegExp(term, 'i') : new RegExp(`\\b${term}\\b`, 'i');
    if (re.test(source)) return term;
  }
  return null;
}

/** "auth-only assumptions" — flags a bare "auth" token, not words like "authority"/"author". */
function containsAuthOnlyAssumption(source: string): boolean {
  return /\bauth\b/i.test(source);
}

/** A minimal fake ProofPageDriver for deterministic, fast, no-browser-required testing. */
function makeFakeDriver(overrides: Partial<ProofPageDriver> & { gotoTimeouts?: number[] } = {}): ProofPageDriver & {
  gotoCalls: number;
  gotoTimeouts: number[];
} {
  const gotoTimeouts: number[] = [];
  const base: ProofPageDriver & { gotoCalls: number; gotoTimeouts: number[] } = {
    gotoCalls: 0,
    gotoTimeouts,
    async goto(_url, timeoutMs) {
      base.gotoCalls += 1;
      gotoTimeouts.push(timeoutMs);
      return { ok: true };
    },
    getConsoleErrors: () => [],
    getFatalErrors: () => [],
    countRootUi: async () => 5,
    findVisibleText: async () => true,
    hasButton: async () => false,
    clickFirstButton: async () => false,
    hasTextInput: async () => false,
    fillAndSubmitFirstTextInput: async () => false,
    hasCheckbox: async () => false,
    toggleFirstCheckbox: async () => ({ performed: false, changed: false }),
    hasSelect: async () => false,
    changeFirstSelect: async () => ({ performed: false, changed: false }),
    hasInternalLink: async () => false,
    clickFirstInternalLink: async () => false,
    snapshotBodyText: async () => 'body',
    close: async () => undefined,
  };
  return Object.assign(base, overrides);
}

function baseInput(overrides: Partial<BuildResultNormalizerInput>): BuildResultNormalizerInput {
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
  console.log('Product Stabilization Phase 2 V1 — Validation');
  console.log('===============================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  assert(
    '01. package script registered',
    Boolean(pkg.scripts?.['validate:product-stabilization-phase-2-v1']),
    'validate:product-stabilization-phase-2-v1',
  );

  // --- 1. Module exists and exports public API ------------------------------------

  const moduleDir = join(ROOT, 'src/live-preview-interaction-proof-v1');
  const expectedFiles = [
    'index.ts',
    'live-preview-interaction-proof-types.ts',
    'live-preview-interaction-proof-engine.ts',
    'live-preview-interaction-proof-planner.ts',
    'live-preview-interaction-proof-runner.ts',
    'live-preview-interaction-proof-normalizer.ts',
    'live-preview-interaction-proof-report.ts',
  ];
  const missingFiles = expectedFiles.filter((f) => !existsSync(join(moduleDir, f)));
  assert('02. live-preview-interaction-proof-v1 module exists with all required files', missingFiles.length === 0, missingFiles.join(', ') || 'all present');
  assert(
    '03. module exports the public engine + result kinds',
    typeof runLivePreviewInteractionProof === 'function',
    'runLivePreviewInteractionProof exported',
  );

  // --- 2. Preview unavailable returns PREVIEW_INTERACTION_BLOCKED ------------------

  let driverInvoked = false;
  const previewUnavailable = await runLivePreviewInteractionProof(
    { previewUrl: null, devServerRunning: false, prompt: 'a simple app' },
    { launchDriver: async () => { driverInvoked = true; return { ok: true, driver: makeFakeDriver() }; } },
  );
  assert(
    '04. preview unavailable returns PREVIEW_INTERACTION_BLOCKED without touching Playwright',
    previewUnavailable.result === 'PREVIEW_INTERACTION_BLOCKED' && driverInvoked === false,
    previewUnavailable.result,
  );

  // --- 3. Playwright missing returns PREVIEW_INTERACTION_BLOCKED with install instruction

  const classification = classifyPlaywrightLaunchError(
    "browserType.launch: Executable doesn't exist at C:\\fake\\chrome-headless-shell.exe",
  );
  assert(
    '05. missing browser executable is classified as blocked with install instruction',
    classification.blocked === true && classification.reason.includes(PLAYWRIGHT_INSTALL_INSTRUCTION),
    classification.reason,
  );

  const playwrightMissing = await runLivePreviewInteractionProof(
    { previewUrl: 'http://127.0.0.1:5199/', devServerRunning: true, prompt: 'a simple app' },
    { launchDriver: async () => ({ ok: false, blockedReason: classification.reason }) },
  );
  assert(
    '06. Playwright missing returns PREVIEW_INTERACTION_BLOCKED with npx playwright install chromium',
    playwrightMissing.result === 'PREVIEW_INTERACTION_BLOCKED' &&
      (playwrightMissing.evidence.blockedReason || '').includes(PLAYWRIGHT_INSTALL_INSTRUCTION),
    playwrightMissing.evidence.blockedReason || 'missing',
  );

  // --- 4. Generic button interaction can pass when visible state changes ----------

  let bodyTextCallCount = 0;
  const buttonPassDriver = makeFakeDriver({
    hasButton: async () => true,
    clickFirstButton: async () => true,
    snapshotBodyText: async () => {
      bodyTextCallCount += 1;
      return bodyTextCallCount <= 1 ? 'count: 0' : 'count: 1';
    },
  });
  const buttonPass = await runLivePreviewInteractionProof(
    { previewUrl: 'http://127.0.0.1:5199/', devServerRunning: true, prompt: 'a simple app with a button' },
    { launchDriver: async () => ({ ok: true, driver: buttonPassDriver }) },
  );
  assert(
    '07. generic button interaction passes when visible state changes',
    buttonPass.result === 'PREVIEW_INTERACTION_PASS',
    buttonPass.result,
  );

  // --- 5. Generic input interaction can pass when submitted text appears ----------

  let inputBodyCallCount = 0;
  const inputPassDriver = makeFakeDriver({
    hasTextInput: async () => true,
    fillAndSubmitFirstTextInput: async () => true,
    snapshotBodyText: async () => {
      inputBodyCallCount += 1;
      return inputBodyCallCount <= 1 ? 'no items yet' : 'no items yet, AiDevEngine proof text';
    },
  });
  const inputPass = await runLivePreviewInteractionProof(
    { previewUrl: 'http://127.0.0.1:5199/', devServerRunning: true, prompt: 'a simple app with a text input' },
    { launchDriver: async () => ({ ok: true, driver: inputPassDriver }) },
  );
  assert(
    '08. generic input interaction passes when submitted text appears',
    inputPass.result === 'PREVIEW_INTERACTION_PASS',
    inputPass.result,
  );

  // --- 6. Non-changing button interaction returns PARTIAL or FAIL -----------------

  const noChangeDriver = makeFakeDriver({
    hasButton: async () => true,
    clickFirstButton: async () => true,
    snapshotBodyText: async () => 'always the same',
  });
  const noChange = await runLivePreviewInteractionProof(
    { previewUrl: 'http://127.0.0.1:5199/', devServerRunning: true, prompt: 'a simple app' },
    { launchDriver: async () => ({ ok: true, driver: noChangeDriver }) },
  );
  assert(
    '09. non-changing button interaction returns PARTIAL or FAIL, never a fake PASS',
    noChange.result === 'PREVIEW_INTERACTION_PARTIAL' || noChange.result === 'PREVIEW_INTERACTION_FAIL',
    noChange.result,
  );

  // --- 7. Fatal browser console error causes fail/block warning -------------------

  const fatalErrorDriver = makeFakeDriver({
    hasButton: async () => true,
    clickFirstButton: async () => true,
    getFatalErrors: () => ['Uncaught TypeError: x is not a function'],
  });
  const fatalErrorResult = await runLivePreviewInteractionProof(
    { previewUrl: 'http://127.0.0.1:5199/', devServerRunning: true, prompt: 'a simple app' },
    { launchDriver: async () => ({ ok: true, driver: fatalErrorDriver }) },
  );
  assert(
    '10. fatal browser console error causes a fail/block result',
    fatalErrorResult.result === 'PREVIEW_INTERACTION_FAIL' || fatalErrorResult.result === 'PREVIEW_INTERACTION_BLOCKED',
    fatalErrorResult.result,
  );

  // --- 8. Proof is bounded: max attempts + timeout enforced ------------------------

  let attemptCount = 0;
  const alwaysInteractiveDriver = makeFakeDriver({
    hasButton: async () => true,
    clickFirstButton: async () => { attemptCount += 1; return true; },
    hasTextInput: async () => true,
    fillAndSubmitFirstTextInput: async () => { attemptCount += 1; return true; },
    hasCheckbox: async () => true,
    toggleFirstCheckbox: async () => { attemptCount += 1; return { performed: true, changed: false }; },
    hasSelect: async () => true,
    changeFirstSelect: async () => { attemptCount += 1; return { performed: true, changed: false }; },
    hasInternalLink: async () => true,
    clickFirstInternalLink: async () => { attemptCount += 1; return true; },
    snapshotBodyText: async () => 'unchanging',
  });
  const boundedResult = await runLivePreviewInteractionProof(
    {
      previewUrl: 'http://127.0.0.1:5199/',
      devServerRunning: true,
      prompt: 'a simple app',
      maxInteractionAttempts: 2,
    },
    { launchDriver: async () => ({ ok: true, driver: alwaysInteractiveDriver }) },
  );
  assert(
    '11. max interaction attempts is enforced (bounded, not unlimited)',
    boundedResult.evidence.interactionAttempts.length <= 2,
    `${boundedResult.evidence.interactionAttempts.length} attempts recorded`,
  );

  const timeoutDriver = makeFakeDriver();
  const timeoutResult = await runLivePreviewInteractionProof(
    { previewUrl: 'http://127.0.0.1:5199/', devServerRunning: true, prompt: 'a simple app', maxLoadWaitMs: 4000 },
    { launchDriver: async () => ({ ok: true, driver: timeoutDriver }) },
  );
  assert(
    '12. page load timeout bound is passed through to the driver (never unbounded)',
    timeoutDriver.gotoTimeouts.length === 1 && timeoutDriver.gotoTimeouts[0]! <= 4000,
    JSON.stringify(timeoutDriver.gotoTimeouts),
  );
  assert(
    '13. default safety budget matches the required bounds (10s load / 5 attempts / 30s total)',
    LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_LOAD_WAIT_MS === 10_000 &&
      LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_INTERACTION_ATTEMPTS === 5 &&
      LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_TOTAL_PROOF_TIME_MS === 30_000,
    `${LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_LOAD_WAIT_MS}/${LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_INTERACTION_ATTEMPTS}/${LIVE_PREVIEW_INTERACTION_PROOF_DEFAULT_MAX_TOTAL_PROOF_TIME_MS}`,
  );
  void timeoutResult;

  // --- 9. Build response includes livePreviewInteractionProof ---------------------

  const handlerTs = readFileSync(join(ROOT, 'server/build-from-prompt-handler.ts'), 'utf8');
  const handlerWiredCount = (handlerTs.match(/livePreviewInteractionProof/g) || []).length;
  assert(
    '14. build-from-prompt-handler wires livePreviewInteractionProof into both response paths',
    handlerTs.includes('runInteractionProofForBuild') && handlerWiredCount >= 4,
    `${handlerWiredCount} references found`,
  );

  // --- 10. Normalized build includes live preview proof summary -------------------

  const proofPassReport = {
    readOnly: true as const,
    contractVersion: 'LIVE_PREVIEW_INTERACTION_PROOF_V1' as const,
    result: 'PREVIEW_INTERACTION_PASS' as const,
    evidence: {
      readOnly: true as const,
      previewUrl: 'http://127.0.0.1:5174/',
      pageLoaded: true,
      loadErrorDetail: null,
      consoleErrors: [],
      fatalConsoleErrorDetected: false,
      rootUiFound: true,
      primaryFeatureTextFound: 'item',
      candidateTermsTried: ['item'],
      plannedInteractions: [],
      interactionAttempts: [],
      durationMs: 1200,
      blockedReason: null,
    },
    summary: {
      readOnly: true as const,
      headline: 'Preview loaded, the primary feature was found, and an interaction changed the visible result.',
      whatLoaded: ['The live preview opened successfully.'],
      whatWasTested: [],
      whatWorked: ['A button click changed the visible result.'],
      whatFailed: [],
      suggestedRepair: [],
    },
  };
  const normalizedWithProofPass = normalizeBuildResult(baseInput({ livePreviewInteractionProof: proofPassReport }));
  assert(
    '15. normalized build includes a live preview proof summary when the proof passed',
    normalizedWithProofPass.livePreviewProof !== null &&
      normalizedWithProofPass.livePreviewProof.result === 'PREVIEW_INTERACTION_PASS' &&
      normalizedWithProofPass.result === 'BUILT_SUCCESSFULLY' &&
      normalizedWithProofPass.stages.interactionProofChecked === true &&
      normalizedWithProofPass.stages.interactionProofPassed === true,
    JSON.stringify({ result: normalizedWithProofPass.result, stages: normalizedWithProofPass.stages }),
  );

  const proofFailReport = {
    ...proofPassReport,
    result: 'PREVIEW_INTERACTION_FAIL' as const,
    summary: {
      ...proofPassReport.summary,
      headline: 'Preview loaded, but the primary interaction did not work as expected.',
      whatWorked: [],
      whatFailed: ['A button click did not change the visible result.'],
      suggestedRepair: ['Check the event handler and state update logic for this interaction.'],
    },
  };
  const normalizedWithProofFail = normalizeBuildResult(baseInput({ livePreviewInteractionProof: proofFailReport }));
  assert(
    '16. preview available but interaction proof fails normalizes to BUILT_WITH_WARNINGS, not fake success',
    normalizedWithProofFail.result === 'BUILT_WITH_WARNINGS' &&
      normalizedWithProofFail.stages.buildOutputReady === true &&
      normalizedWithProofFail.stages.previewReady === true,
    normalizedWithProofFail.result,
  );

  // --- 14. Launch Readiness does not block interaction proof -----------------------

  const proofBlockedReport = {
    ...proofPassReport,
    result: 'PREVIEW_INTERACTION_BLOCKED' as const,
    evidence: { ...proofPassReport.evidence, blockedReason: 'no browser available' },
  };
  const launchNotReadyButProofPassed = normalizeBuildResult(
    baseInput({
      status: 'FAILED', // raw launch-readiness / workspace-reality-audit gate still open
      livePreviewInteractionProof: proofPassReport,
    }),
  );
  assert(
    '17. Launch Readiness gate does not block a passing interaction proof from BUILT_WITH_WARNINGS/SUCCESS path',
    launchNotReadyButProofPassed.result !== 'FAILED_BLOCKED' &&
      launchNotReadyButProofPassed.result !== 'FAILED_WITH_REPAIR_AVAILABLE' &&
      launchNotReadyButProofPassed.stages.launchNotReady === true,
    launchNotReadyButProofPassed.result,
  );
  const blockedProofDoesNotDowngrade = normalizeBuildResult(
    baseInput({ status: 'READY', livePreviewInteractionProof: proofBlockedReport }),
  );
  assert(
    '18. interaction proof BLOCKED (infra limitation) never downgrades an otherwise healthy build',
    blockedProofDoesNotDowngrade.result === 'BUILT_SUCCESSFULLY',
    blockedProofDoesNotDowngrade.result,
  );

  const engineTs = readFileSync(join(moduleDir, 'live-preview-interaction-proof-engine.ts'), 'utf8');
  assert(
    '19. engine gates only on previewUrl + devServerRunning, not on launch-readiness/workspace-audit flags',
    !/launchNotReady|launchReadiness|workspaceRealityAudit|WORKSPACE_REALITY_AUDIT/.test(engineTs),
    'engine.ts has no launch-readiness coupling',
  );

  // --- 11. UI displays Live Preview Proof section -----------------------------------

  const indexPath = join(ROOT, 'public/founder-reality/index.html');
  const indexHtml = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
  const builderHomeJsPath = join(ROOT, 'public/founder-reality/builder-home.js');
  const builderHomeJs = existsSync(builderHomeJsPath) ? readFileSync(builderHomeJsPath, 'utf8') : '';
  assert(
    '20. UI displays a Live Preview Proof section with a plain-English headline',
    indexHtml.includes('Live Preview Proof') &&
      indexHtml.includes('id="builder-proof-section"') &&
      indexHtml.includes('id="builder-proof-headline"') &&
      builderHomeJs.includes('renderInteractionProof') &&
      builderHomeJs.includes('PROOF_BADGE'),
    'proof section markup + renderer present',
  );

  // --- 12. Raw evidence hidden by default -------------------------------------------

  const diagnosticsMarkupMatch = indexHtml.match(
    /<aside\s+class="builder-diagnostics-drawer[^>]*id="builder-diagnostics-drawer"[\s\S]*?>/,
  );
  const diagnosticsTagOpen = diagnosticsMarkupMatch ? diagnosticsMarkupMatch[0] : '';
  assert(
    '21. raw JSON / proof evidence is hidden by default (diagnostics drawer starts hidden)',
    diagnosticsTagOpen.includes('hidden') && diagnosticsTagOpen.includes('aria-hidden="true"'),
    diagnosticsTagOpen || 'diagnostics drawer tag not found',
  );
  assert(
    '22. raw proof evidence rendering lives inside renderDiagnostics, not the result panel',
    /function renderDiagnostics[\s\S]*?JSON\.stringify\(proof/.test(builderHomeJs) &&
      !/function renderInteractionProof[\s\S]{0,600}JSON\.stringify/.test(builderHomeJs),
    'JSON.stringify(proof, ...) only inside renderDiagnostics',
  );

  // --- 13. Advanced Diagnostics still exposes proof evidence -------------------------

  assert(
    '23. Advanced Diagnostics exposes proof result, page-load, root-UI, and raw evidence fields',
    indexHtml.includes('id="diag-proof-result"') &&
      indexHtml.includes('id="diag-proof-page-loaded"') &&
      indexHtml.includes('id="diag-proof-root-ui"') &&
      indexHtml.includes('id="builder-diagnostics-proof-raw"') &&
      builderHomeJs.includes('builder-diagnostics-proof-raw'),
    'diagnostics proof fields present',
  );

  // --- 15. Generality audit ------------------------------------------------------------

  const moduleFiles = expectedFiles.map((f) => join(moduleDir, f));
  const normalizerFiles = [
    join(ROOT, 'src/build-result-normalizer-v1/build-result-normalizer.ts'),
    join(ROOT, 'src/build-result-normalizer-v1/build-result-normalizer-adapter.ts'),
    join(ROOT, 'src/build-result-normalizer-v1/build-result-normalizer-types.ts'),
  ];
  let hardcodingFound: string | null = null;
  let authOnlyFound: string | null = null;
  for (const file of [...moduleFiles, ...normalizerFiles, builderHomeJsPath, indexPath]) {
    if (!existsSync(file)) continue;
    const source = readFileSync(file, 'utf8');
    const found = containsForbiddenAppSpecificTerm(source);
    if (found && !hardcodingFound) hardcodingFound = `${found} in ${file}`;
    if (containsAuthOnlyAssumption(source) && !authOnlyFound) authOnlyFound = file;
  }
  assert(
    '24. no app-specific hardcoding (counter/todo/calculator/CRM/LISA/expense-tracker) in proof module or normalizer/UI',
    hardcodingFound === null,
    hardcodingFound || 'clean',
  );
  assert(
    '25. no auth-only assumptions baked into the interaction proof or normalizer',
    authOnlyFound === null,
    authOnlyFound || 'clean',
  );

  const plannerTs = readFileSync(join(moduleDir, 'live-preview-interaction-proof-planner.ts'), 'utf8');
  assert(
    '26. interaction planning stays generic — discovers buttons/inputs/checkboxes/selects/links, not app-specific selectors',
    /BUTTON_CLICK/.test(plannerTs) &&
      /INPUT_SUBMIT/.test(plannerTs) &&
      /CHECKBOX_TOGGLE/.test(plannerTs) &&
      /SELECT_CHANGE/.test(plannerTs) &&
      /LINK_NAVIGATION/.test(plannerTs),
    'generic interaction types present in planner',
  );

  const passed = results.filter((r) => r.passed).length;
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}`);
    if (!check.passed) console.log(`       ${check.detail}`);
  }
  console.log('');
  console.log(`${passed}/${results.length} checks passed`);
  console.log('');

  if (passed === results.length) {
    console.log(PRODUCT_STABILIZATION_PHASE_2_V1_PASS_TOKEN);
    await exitValidator(0);
    return;
  }
  await exitValidator(1);
}

main().catch(async (err) => {
  console.error(err);
  await exitValidator(1);
});
