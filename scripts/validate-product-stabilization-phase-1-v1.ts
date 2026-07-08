/**
 * Product Stabilization Phase 1 V1 — validation suite.
 *
 * Confirms the simplified builder remains the default experience, that raw build results are
 * normalized into one clear, plain-English outcome (BUILT_SUCCESSFULLY / BUILT_WITH_WARNINGS /
 * FAILED_WITH_REPAIR_AVAILABLE / FAILED_BLOCKED), that a working build + reachable preview is
 * never presented as a scary failure just because an internal launch-readiness/validation gate
 * hasn't cleared, that raw JSON stays inside Advanced Diagnostics, and that no core engine
 * folders were deleted.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFounderRealityServer } from '../server/founder-reality-server.js';
import { exitValidator, startValidatorHttpServer } from '../src/windows-validator-clean-exit-v1/index.js';
import {
  normalizeBuildResult,
  type BuildResultNormalizerInput,
} from '../src/build-result-normalizer-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export const PRODUCT_STABILIZATION_PHASE_1_V1_PASS_TOKEN = 'PRODUCT_STABILIZATION_PHASE_1_V1_PASS';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

/** Representative sample of core engineering systems that must survive stabilization work. */
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
];

/** Forbidden app-specific hardcoding — this is a general-purpose builder, not tuned to one app. */
const FORBIDDEN_APP_SPECIFIC_TERMS = ['counter', 'todo', 'calculator', 'crm', 'lisa'];

function containsForbiddenAppSpecificTerm(source: string): string | null {
  for (const term of FORBIDDEN_APP_SPECIFIC_TERMS) {
    const re = new RegExp(`\\b${term}\\b`, 'i');
    if (re.test(source)) return term;
  }
  return null;
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
  console.log('Product Stabilization Phase 1 V1 — Validation');
  console.log('===============================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  assert(
    '01. package script registered',
    Boolean(pkg.scripts?.['validate:product-stabilization-phase-1-v1']),
    'validate:product-stabilization-phase-1-v1',
  );

  // --- 1. Simplified builder remains default -----------------------------------

  const indexPath = join(ROOT, 'public/founder-reality/index.html');
  const indexHtml = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
  assert(
    '02. simplified builder is still the default shell',
    indexHtml.includes('data-component="BuilderHome"') && indexHtml.includes('id="builder-prompt-input"'),
    'index.html renders BuilderHome',
  );

  // --- 2. Build result normalization exists -------------------------------------

  const normalizerDir = join(ROOT, 'src/build-result-normalizer-v1');
  assert('03. build-result-normalizer-v1 module exists', existsSync(normalizerDir), normalizerDir);

  const handlerTs = readFileSync(join(ROOT, 'server/build-from-prompt-handler.ts'), 'utf8');
  assert(
    '04. build-from-prompt-handler wires normalizedBuild into the bridge-path response',
    handlerTs.includes('normalizeOnePromptBuildResult') && handlerTs.includes('normalizedBuild:'),
    'normalizedBuild present in API response composition',
  );

  const oneResult = normalizeBuildResult(baseInput({}));
  assert(
    '05. normalized result is exactly one of the four defined outcomes',
    ['BUILT_SUCCESSFULLY', 'BUILT_WITH_WARNINGS', 'FAILED_WITH_REPAIR_AVAILABLE', 'FAILED_BLOCKED'].includes(
      oneResult.result,
    ),
    oneResult.result,
  );

  // --- Unit tests of the classification rule ------------------------------------

  const success = normalizeBuildResult(baseInput({ status: 'READY' }));
  assert(
    '06. fully healthy build normalizes to BUILT_SUCCESSFULLY',
    success.result === 'BUILT_SUCCESSFULLY',
    success.result,
  );

  // The critical rule: npm install ok + npm build ok + dev server running + preview URL present
  // must NEVER render as a scary failure, even when the engine's raw status is FAILED because an
  // internal launch-readiness / workspace-reality-audit gate has not cleared.
  const launchGateBlockedButWorking = normalizeBuildResult(
    baseInput({
      status: 'FAILED',
      failureReason:
        'End-to-end build reality blocked at WORKSPACE_REALITY_AUDIT; playwright=http://127.0.0.1:5174 iframe=none',
      visiblePreviewValidationStatus: 'FAIL',
      visiblePreviewValidationFailureReasons: ['E2E failing stage: WORKSPACE_REALITY_AUDIT'],
    }),
  );
  assert(
    '07. Launch Readiness / workspace-reality-audit gate does not block basic local preview',
    launchGateBlockedButWorking.result === 'BUILT_WITH_WARNINGS' &&
      launchGateBlockedButWorking.stages.buildOutputReady === true &&
      launchGateBlockedButWorking.stages.previewReady === true &&
      launchGateBlockedButWorking.showLivePreview === true,
    JSON.stringify(launchGateBlockedButWorking.result),
  );
  assert(
    '08. launch-readiness gate is reflected as a stage flag, not a headline failure',
    launchGateBlockedButWorking.stages.launchNotReady === true,
    'launchNotReady flag present for diagnostics even though result is not a failure',
  );

  const combinedSummaryText = [
    launchGateBlockedButWorking.summary.headline,
    launchGateBlockedButWorking.summary.whatToDoNext,
    ...launchGateBlockedButWorking.summary.whatWorked,
    ...launchGateBlockedButWorking.summary.whatFailed,
  ].join(' ');
  assert(
    '09. plain-English summary does not leak raw internal stage jargon',
    !/WORKSPACE_REALITY_AUDIT|playwright=|iframe=/.test(combinedSummaryText),
    combinedSummaryText,
  );

  const repairAvailable = normalizeBuildResult(
    baseInput({
      status: 'FAILED',
      npmBuildOk: false,
      devServerRunning: false,
      previewUrl: null,
      failureReason: 'The generated app did not compile.',
      buildAutofixLoopAttempts: [
        { attempt: 1, failureClass: 'TYPESCRIPT_ERROR', repairApplied: true, buildRerunOk: false },
      ],
    }),
  );
  assert(
    '10. failed build with a repair attempt normalizes to FAILED_WITH_REPAIR_AVAILABLE',
    repairAvailable.result === 'FAILED_WITH_REPAIR_AVAILABLE',
    repairAvailable.result,
  );

  const blocked = normalizeBuildResult(
    baseInput({
      status: 'FAILED',
      npmInstallOk: false,
      npmBuildOk: false,
      devServerRunning: false,
      previewUrl: null,
      failureReason: 'Installing dependencies failed.',
    }),
  );
  assert(
    '11. failed build with no repair attempt normalizes to FAILED_BLOCKED',
    blocked.result === 'FAILED_BLOCKED',
    blocked.result,
  );

  // --- 3. Live preview available exactly when previewUrl + devServerRunning ----

  const previewAvailable = normalizeBuildResult(
    baseInput({ previewUrl: 'http://127.0.0.1:5175/', devServerRunning: true }),
  );
  assert(
    '12. live preview is available when previewUrl exists and devServerRunning is true',
    previewAvailable.showLivePreview === true && previewAvailable.previewUrl === 'http://127.0.0.1:5175/',
    'showLivePreview true',
  );

  const previewUrlButServerDown = normalizeBuildResult(
    baseInput({ previewUrl: 'http://127.0.0.1:5175/', devServerRunning: false }),
  );
  assert(
    '13. preview is not shown as prominently-live when dev server is not running',
    previewUrlButServerDown.showLivePreview === false,
    'showLivePreview false when devServerRunning is false',
  );

  // --- End-to-end build reality stages separated --------------------------------

  const stageKeys = Object.keys(oneResult.stages);
  assert(
    '14. end-to-end build reality separates BUILD_OUTPUT_READY / PREVIEW_READY / VALIDATION_NEEDS_WORK / LAUNCH_NOT_READY',
    stageKeys.includes('buildOutputReady') &&
      stageKeys.includes('previewReady') &&
      stageKeys.includes('validationNeedsWork') &&
      stageKeys.includes('launchNotReady'),
    stageKeys.join(', '),
  );

  // --- 5 & 6. Raw JSON hidden by default, Advanced Diagnostics exposes full evidence

  const builderHomeJsPath = join(ROOT, 'public/founder-reality/builder-home.js');
  const builderHomeJs = existsSync(builderHomeJsPath) ? readFileSync(builderHomeJsPath, 'utf8') : '';

  const diagnosticsMarkupMatch = indexHtml.match(
    /<aside\s+class="builder-diagnostics-drawer[^>]*id="builder-diagnostics-drawer"[\s\S]*?>/,
  );
  const diagnosticsTagOpen = diagnosticsMarkupMatch ? diagnosticsMarkupMatch[0] : '';
  assert(
    '15. raw JSON is hidden by default (diagnostics drawer starts hidden)',
    diagnosticsTagOpen.includes('hidden') && diagnosticsTagOpen.includes('aria-hidden="true"'),
    diagnosticsTagOpen || 'diagnostics drawer tag not found',
  );
  assert(
    '16. raw JSON rendering lives inside the diagnostics drawer function, not the result panel',
    /function renderDiagnostics[\s\S]*?JSON\.stringify\(payload/.test(builderHomeJs) &&
      !/function renderBuildResult[\s\S]{0,600}JSON\.stringify/.test(builderHomeJs),
    'JSON.stringify(payload) only inside renderDiagnostics',
  );
  assert(
    '17. Advanced Diagnostics still exposes full build-reality evidence',
    indexHtml.includes('id="diag-build-output-ready"') &&
      indexHtml.includes('id="diag-preview-ready"') &&
      indexHtml.includes('id="diag-validation-needs-work"') &&
      indexHtml.includes('id="diag-launch-not-ready"') &&
      indexHtml.includes('id="diag-normalized-result"') &&
      builderHomeJs.includes('builder-diagnostics-raw'),
    'diagnostics stage + raw evidence fields present',
  );

  // --- 7. Plain-English failure/result summary exists in the UI -----------------

  assert(
    '18. plain-English result summary rendered in the UI (headline, what worked/failed, next step)',
    indexHtml.includes('id="builder-result-headline"') &&
      indexHtml.includes('id="builder-result-worked-list"') &&
      indexHtml.includes('id="builder-result-failed-list"') &&
      indexHtml.includes('id="builder-result-next"') &&
      builderHomeJs.includes('renderBuildResult') &&
      builderHomeJs.includes('normalized.summary.whatToDoNext'),
    'BuildFailurePanel/result-panel renders normalized summary fields',
  );

  // --- 8. No app-specific hardcoding ---------------------------------------------

  const normalizerFiles = [
    join(ROOT, 'src/build-result-normalizer-v1/build-result-normalizer.ts'),
    join(ROOT, 'src/build-result-normalizer-v1/build-result-normalizer-adapter.ts'),
    join(ROOT, 'src/build-result-normalizer-v1/build-result-normalizer-types.ts'),
  ];
  let hardcodingFound: string | null = null;
  for (const file of [...normalizerFiles, builderHomeJsPath, indexPath]) {
    if (!existsSync(file)) continue;
    const source = readFileSync(file, 'utf8');
    const found = containsForbiddenAppSpecificTerm(source);
    if (found) {
      hardcodingFound = `${found} in ${file}`;
      break;
    }
  }
  assert(
    '19. no app-specific hardcoding (counter/todo/calculator/CRM/LISA) in normalizer or builder UI',
    hardcodingFound === null,
    hardcodingFound || 'clean',
  );

  // --- 9. No core engine folders deleted ------------------------------------------

  for (const folder of CORE_ENGINE_FOLDERS) {
    assert(`20. core folder preserved — ${folder}`, existsSync(join(ROOT, folder)), folder);
  }

  // --- Live server smoke check: default route unaffected --------------------------

  let closeServer: (() => Promise<void>) | null = null;
  try {
    const started = await startValidatorHttpServer(() => createFounderRealityServer());
    closeServer = started.close;
    const baseUrl = started.baseUrl;

    const rootRes = await fetch(`${baseUrl}/`);
    const rootHtml = await rootRes.text();
    assert('21. GET / still returns HTTP 200', rootRes.status === 200, String(rootRes.status));
    assert(
      '22. GET / still serves the simplified builder as default',
      rootHtml.includes('id="builder-prompt-input"') && !rootHtml.includes('id="chat-surface"'),
      'default route content',
    );
  } catch (err) {
    assert('21-22. live server checks', false, err instanceof Error ? err.message : String(err));
  } finally {
    if (closeServer) {
      await closeServer();
    }
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
    console.log(PRODUCT_STABILIZATION_PHASE_1_V1_PASS_TOKEN);
    await exitValidator(0);
    return;
  }
  await exitValidator(1);
}

main().catch(async (err) => {
  console.error(err);
  await exitValidator(1);
});
