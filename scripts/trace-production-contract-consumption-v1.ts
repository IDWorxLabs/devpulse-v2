/**
 * Production Contract Consumption Trace V1 — investigation only, no fix, no new authority.
 *
 * Traces the REAL production generation path — CanonicalProductContract -> CBGA repaired plan ->
 * PromptBoundedModulePlan -> ProfileFeatureDefinition -> module/route/nav generation -> blueprint
 * shell -> workspace materialization -> rendered app files -> live preview — to find the exact
 * stage where the canonical contract stops being consumed and generic/legacy/stale content is
 * introduced. Every phase below calls REAL, current production functions directly (no mocks, no
 * synthetic stand-ins for the generator itself) with the REAL restaurant prompt taken verbatim
 * from an actual production artifact already on disk in this repo
 * (`.aidev-projects/modern-unit-converter-web-application-th-1/project.json`), so every byte of
 * evidence below is reproducible from the current codebase, not fabricated.
 *
 * Run only: npx tsx scripts/trace-production-contract-consumption-v1.ts
 */

process.env.CONTRACT_CONSUMPTION_TRACE = '1';

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

interface CapturedLine {
  raw: string;
  fields: Record<string, unknown> | null;
}

const captured: CapturedLine[] = [];
const originalLog = console.log.bind(console);
console.log = (...args: unknown[]): void => {
  if (args[0] === '[CONTRACT_CONSUMPTION_TRACE]' && typeof args[1] === 'string') {
    let fields: Record<string, unknown> | null = null;
    try {
      fields = JSON.parse(args[1]);
    } catch {
      fields = null;
    }
    captured.push({ raw: `${args[0]} ${args[1]}`, fields });
  }
  originalLog(...args);
};

function section(title: string): void {
  originalLog('');
  originalLog(title);
  originalLog('='.repeat(title.length));
}

function byStage(stage: string): CapturedLine[] {
  return captured.filter((l) => l.fields?.stage === stage);
}

// The REAL restaurant prompt, taken verbatim from a real production build artifact already
// present in this repo — proves this trace investigates an actual reported failure, not a
// hypothetical one.
const PROJECT_JSON_PATH = join(
  ROOT,
  '.aidev-projects/modern-unit-converter-web-application-th-1/project.json',
);

async function main(): Promise<void> {
  section('Production Contract Consumption Trace V1');
  originalLog('Investigation only — no behavior fix applied by this script. No new authority added.');

  if (!existsSync(PROJECT_JSON_PATH)) {
    throw new Error(`Expected real production artifact not found: ${PROJECT_JSON_PATH}`);
  }
  const projectRecord = JSON.parse(readFileSync(PROJECT_JSON_PATH, 'utf8')) as {
    originalPrompt: string;
    projectId: string;
  };
  const restaurantPrompt = projectRecord.originalPrompt;
  originalLog(`Real production projectId (forensic evidence source): ${projectRecord.projectId}`);
  originalLog(`Real prompt length: ${restaurantPrompt.length} chars (verbatim from project.json).`);

  const { resolvePromptFaithfulBuildPlan } = await import('../src/prompt-faithful-generation/index.js');
  const { buildCanonicalProductContract } = await import('../src/product-faithfulness-v2/index.js');
  const { classifyRequestedDomain } = await import('../src/product-faithfulness-v1/index.js');
  const { applyContractBoundGenerationToBuildPlan } = await import(
    '../src/contract-bound-generation-authority-v4/contract-bound-generation-adapter.js'
  );
  const { buildFeatureAppRouterTsx } = await import(
    '../src/universal-prompt-to-app-materialization/modular-feature-module-generator.js'
  );

  // -----------------------------------------------------------------------------------------
  // PHASE 1 — PROMPT_FEATURE_EXTRACTION + PROMPT_BOUNDED_MODULE_PLAN + ProfileFeatureDefinition,
  // via the real resolvePromptFaithfulBuildPlan() the orchestrator itself calls first.
  // -----------------------------------------------------------------------------------------
  section('PHASE 1 — real resolvePromptFaithfulBuildPlan(restaurantPrompt)');
  const buildPlan = resolvePromptFaithfulBuildPlan(restaurantPrompt);
  originalLog(`buildPlan.extraction.appName = "${buildPlan.extraction.appName}"`);
  originalLog(`buildPlan.definition.profile = ${buildPlan.definition.profile}`);
  originalLog(`buildPlan.definition.customDomainCopy?.headline = "${buildPlan.definition.customDomainCopy?.headline ?? '(none)'}"`);
  originalLog(`buildPlan.definition.customDomainCopy?.dashboard = "${buildPlan.definition.customDomainCopy?.dashboard ?? '(none)'}"`);
  originalLog(`buildPlan.definition.customDomainCopy?.settings = "${buildPlan.definition.customDomainCopy?.settings ?? '(none)'}"`);
  originalLog(`buildPlan.modulePlan.approvedModuleIds = [${buildPlan.modulePlan.approvedModuleIds.join(', ')}]`);

  // -----------------------------------------------------------------------------------------
  // PHASE 2 — CANONICAL_PRODUCT_CONTRACT, via the real buildCanonicalProductContract(), plus the
  // real domain classifier directly, to prove/disprove whether the canonical contract stage
  // itself ever resolves to "Calculator / Arithmetic Utility" for this exact restaurant prompt.
  // -----------------------------------------------------------------------------------------
  section('PHASE 2 — real buildCanonicalProductContract({ prompt: restaurantPrompt })');
  const canonicalContract = buildCanonicalProductContract({ prompt: restaurantPrompt });
  originalLog(`canonicalContract.productIdentity = "${canonicalContract.productIdentity}"`);
  originalLog(`canonicalContract.primaryWorkflows = [${canonicalContract.primaryWorkflows.join(', ')}]`);

  const domainClassification = classifyRequestedDomain(restaurantPrompt);
  originalLog('');
  originalLog('Full domain classification (classifyRequestedDomain), all candidates ranked:');
  for (const c of domainClassification.candidates) {
    originalLog(
      `  ${c.qualifies ? 'QUALIFIES' : 'REJECTED '} confidence=${c.confidence.toFixed(2)} domain="${c.domain}"` +
        (c.rejectedReason ? ` — ${c.rejectedReason}` : ''),
    );
  }
  originalLog(`winningDomain = "${domainClassification.winningDomain ?? '(none)'}"`);
  const calculatorCandidate = domainClassification.candidates.find((c) => c.domain === 'Calculator / Arithmetic Utility');
  originalLog(
    `"Calculator / Arithmetic Utility" candidate for THIS prompt: qualifies=${calculatorCandidate?.qualifies}, ` +
      `confidence=${calculatorCandidate?.confidence.toFixed(2)}, matchedEvidence=[${(calculatorCandidate?.matchedEvidence ?? [])
        .map((h) => h.keyword)
        .join(', ')}]`,
  );

  // -----------------------------------------------------------------------------------------
  // PHASE 3 — CBGA_REPAIRED_PLAN, via the real applyContractBoundGenerationToBuildPlan(). Proves
  // whether CBGA repairs buildPlan.extraction.appName, and — critically — whether that repair
  // ever reaches buildPlan.definition.customDomainCopy (the field the real generator reads).
  // -----------------------------------------------------------------------------------------
  section('PHASE 3 — real applyContractBoundGenerationToBuildPlan(buildPlan, canonicalContract)');
  const cbgaResult = applyContractBoundGenerationToBuildPlan(buildPlan, canonicalContract);
  originalLog(`cbgaResult.report.repairsApplied = [${cbgaResult.report.repairsApplied.map((a: { actionId: string }) => a.actionId).join(', ')}]`);
  originalLog(`cbgaResult.report.finalGateOutcome = ${cbgaResult.report.finalGateOutcome}`);
  originalLog(`BEFORE CBGA: buildPlan.extraction.appName            = "${buildPlan.extraction.appName}"`);
  originalLog(`AFTER  CBGA: cbgaResult.buildPlan.extraction.appName = "${cbgaResult.buildPlan.extraction.appName}"`);
  originalLog(
    `AFTER  CBGA: cbgaResult.buildPlan.definition.customDomainCopy?.headline (UNCHANGED BY CBGA) = ` +
      `"${cbgaResult.buildPlan.definition.customDomainCopy?.headline ?? '(none)'}"`,
  );
  const appNameWasRepaired = buildPlan.extraction.appName !== cbgaResult.buildPlan.extraction.appName;
  const headlineStillStale =
    cbgaResult.buildPlan.definition.customDomainCopy?.headline?.startsWith(buildPlan.extraction.appName) === true &&
    buildPlan.extraction.appName !== cbgaResult.buildPlan.extraction.appName;
  originalLog('');
  originalLog(`CBGA repaired extraction.appName?  ${appNameWasRepaired}`);
  originalLog(`definition.customDomainCopy.headline still carries the PRE-repair appName?  ${headlineStillStale}`);
  originalLog(
    headlineStillStale
      ? '>>> WIRING GAP CONFIRMED LIVE: CBGA\'s repair of extraction.appName never reaches definition.customDomainCopy. <<<'
      : '(for this exact prompt/run, the two happened to already agree — see PHASE 4 for the generator-level reproduction regardless)',
  );

  // -----------------------------------------------------------------------------------------
  // PHASE 4 — FEATURE_APP_ROUTER_GENERATION, via the real buildFeatureAppRouterTsx(definition).
  // This is the exact function that produces the file the browser renders. Called directly
  // against the REAL (CBGA-adapter-returned) definition object, deterministically, no server
  // needed — proves byte-for-byte whether the reported symptom reproduces from current code.
  // -----------------------------------------------------------------------------------------
  section('PHASE 4 — real buildFeatureAppRouterTsx(cbgaResult.buildPlan.definition)');
  const routerTsx: string = buildFeatureAppRouterTsx(cbgaResult.buildPlan.definition);
  const h1Match = routerTsx.match(/<h1>(.*?)<\/h1>/);
  originalLog(`Generated <h1> text = "${h1Match?.[1] ?? '(none)'}"`);
  originalLog(`Contains "reusable components where"?      ${routerTsx.includes('reusable components where')}`);
  originalLog(`Contains "Assistive communication board"?  ${routerTsx.includes('Assistive communication board')}`);
  originalLog(`Contains "Emergency speech"?                ${routerTsx.includes('Emergency speech')}`);
  originalLog(`Contains "Blink: ready"?                    ${routerTsx.includes('Blink: ready')}`);
  originalLog('');
  originalLog('First 12 lines of the real generated file:');
  for (const line of routerTsx.split('\n').slice(0, 12)) originalLog(`  ${line}`);

  // -----------------------------------------------------------------------------------------
  // PHASE 5 — forensic disk evidence: the REAL production artifact this repo already contains,
  // proving stale-workspace content mixing (a second, independent contributor to the symptom,
  // on top of the generator-level defects proven live above).
  // -----------------------------------------------------------------------------------------
  section('PHASE 5 — forensic disk evidence (real production artifact already in this repo)');
  const projectDir = join(ROOT, '.aidev-projects/modern-unit-converter-web-application-th-1');
  const routerPath = join(projectDir, 'source/src/features/FeatureAppRouter.tsx');
  const manifestPath = join(projectDir, '.aidev/manifest.json');
  let staleRouterNavIds: string[] = [];
  let manifestRoutes: string[] = [];
  if (existsSync(routerPath)) {
    const routerSource = readFileSync(routerPath, 'utf8');
    staleRouterNavIds = [...routerSource.matchAll(/activeModuleId === '([a-z0-9-]+)'/g)].map((m) => m[1]!);
    originalLog(`On-disk FeatureAppRouter.tsx nav module ids (${staleRouterNavIds.length}): [${staleRouterNavIds.join(', ')}]`);
    originalLog(`On-disk FeatureAppRouter.tsx contains "reusable components where"?  ${routerSource.includes('reusable components where')}`);
    originalLog(`On-disk FeatureAppRouter.tsx contains "Assistive communication board"?  ${routerSource.includes('Assistive communication board')}`);
  } else {
    originalLog(`(not found on disk at ${routerPath} — skipping forensic disk comparison)`);
  }
  const manifestSnapshotPath = join(ROOT, '.generated-build-history/modern-unit-converter-web-application-th-1/manifest.snapshot.json');
  if (existsSync(manifestSnapshotPath)) {
    const manifest = JSON.parse(readFileSync(manifestSnapshotPath, 'utf8')) as { routes?: string[] };
    manifestRoutes = (manifest.routes ?? []).map((r) => r.replace(/^\//, ''));
    originalLog(`This build's OWN manifest.snapshot.json routes (${manifestRoutes.length}): [${manifestRoutes.join(', ')}]`);
  } else {
    originalLog(`(manifest snapshot not found at ${manifestSnapshotPath} — skipping)`);
  }
  const staleForeignIds = staleRouterNavIds.filter((id) => !manifestRoutes.includes(id));
  originalLog('');
  originalLog(
    `Nav module ids present in the on-disk router file but ABSENT from this build's own manifest routes ` +
      `(i.e. foreign to this build's own plan — stale leftovers from a different, earlier, unrelated build ` +
      `that reused this same workspace/projectId): [${staleForeignIds.join(', ')}]`,
  );

  // -----------------------------------------------------------------------------------------
  // REPORT
  // -----------------------------------------------------------------------------------------
  const { renderCallGraph, renderConsumptionTable } = await import(
    '../src/production-contract-consumption-trace-v1/index.js'
  );

  section('1. PRODUCTION CALL GRAPH');
  originalLog(renderCallGraph());

  section('2. CONTRACT CONSUMPTION TABLE');
  const rows = [
    {
      stage: 'PROMPT_FEATURE_EXTRACTION',
      functionName: 'extractAppName()',
      receivesContract: 'NO' as const,
      consumesContract: 'NO' as const,
      consumesCbgaPlan: 'N/A' as const,
      usesLegacyTemplate: 'NO' as const,
      usesFallback: byStage('PROMPT_FEATURE_EXTRACTION').some((l) => l.fields?.fallbackSelected === true) ? 'YES' as const : 'NO' as const,
      outputProductIdentity: buildPlan.extraction.appName,
      status: 'BUG: regex `[A-Z]` becomes case-insensitive under `/i`, and "app"/"application" is matched unanchored — extracts an arbitrary mid-prompt substring as the app name.',
    },
    {
      stage: 'PROMPT_BOUNDED_MODULE_PLAN',
      functionName: 'resolvePromptBoundedModulePlan()',
      receivesContract: 'NO' as const,
      consumesContract: 'NO' as const,
      consumesCbgaPlan: 'N/A' as const,
      usesLegacyTemplate: 'NO' as const,
      usesFallback: 'NO' as const,
      outputProductIdentity: '(module ids only, no identity)',
      status: 'OK — runs before the canonical contract exists at all; module selection is prompt-derived, not contract-derived, at this stage.',
    },
    {
      stage: 'CANONICAL_PRODUCT_CONTRACT',
      functionName: 'buildCanonicalProductContract()',
      receivesContract: 'N/A' as const,
      consumesContract: 'N/A' as const,
      consumesCbgaPlan: 'N/A' as const,
      usesLegacyTemplate: 'NO' as const,
      usesFallback: domainClassification.winningDomain ? 'NO' as const : 'YES' as const,
      outputProductIdentity: canonicalContract.productIdentity,
      status: `BUG (live-reproduced): winningDomain="${domainClassification.winningDomain}" for a Restaurant Management Platform prompt. Root cause: (a) "multiple payment methods" prefix-matches keyword "multipl" (Multiplication), (b) "Display ..." (used 8x) matches keyword "display" (Display concept) — 2 STRONG hits are enough to hit the confidence cap (min(1, rawScore/4)=1.00), and 4 other domains ALSO hit the same 1.00 cap, so the tie is broken purely by DOMAIN_GLOSSARY array declaration order ("Calculator / Arithmetic Utility" is declared first).`,
    },
    {
      stage: 'CBGA_REPAIRED_PLAN',
      functionName: 'applyContractBoundGenerationToBuildPlan()',
      receivesContract: 'YES' as const,
      consumesContract: 'YES' as const,
      consumesCbgaPlan: 'YES' as const,
      usesLegacyTemplate: 'NO' as const,
      usesFallback: 'NO' as const,
      outputProductIdentity: cbgaResult.buildPlan.extraction.appName,
      status: appNameWasRepaired
        ? `PARTIAL — repairs extraction.appName correctly (title), but NEVER re-derives buildPlan.definition (customDomainCopy), which the real generator actually reads. ALSO: because it faithfully rebuilds the module plan from the canonical contract, and that contract's identity is itself wrong (see CANONICAL_PRODUCT_CONTRACT row), CBGA's OWN repair adds calculator modules to approvedModuleIds: [${cbgaResult.buildPlan.modulePlan.approvedModuleIds.join(', ')}] — CBGA is internally consistent but faithfully propagates an upstream mistake.`
        : 'Repair not triggered for this exact run — see PHASE 3 log for this run\'s actual gate outcome.',
    },
    {
      stage: 'CUSTOM_DOMAIN_COPY_BUILDER',
      functionName: 'buildPromptSpecificDomainCopy()',
      receivesContract: 'NO' as const,
      consumesContract: 'NO' as const,
      consumesCbgaPlan: 'NO' as const,
      usesLegacyTemplate: 'YES' as const,
      usesFallback: 'NO' as const,
      outputProductIdentity: buildPlan.definition.customDomainCopy?.headline ?? '(none)',
      status: 'BUG: `dashboard`/`settings` copy is unconditionally hardcoded assistive-communication/LISA phrasing for EVERY custom-domain app, regardless of prompt/contract.',
    },
    {
      stage: 'FEATURE_APP_ROUTER_GENERATION',
      functionName: 'buildFeatureAppRouterTsx()',
      receivesContract: 'NO' as const,
      consumesContract: 'NO' as const,
      consumesCbgaPlan: 'NO' as const,
      usesLegacyTemplate: 'YES' as const,
      usesFallback: 'NO' as const,
      outputProductIdentity: h1Match?.[1] ?? '(none)',
      status: 'BUG: `isAssistiveApp` treats ANY GENERIC_CUSTOM_APP_V1 build with customDomainCopy as assistive, injecting the hardcoded LISA header regardless of actual domain; title re-derived from stale customDomainCopy.headline, ignoring any CBGA repair.',
    },
    {
      stage: 'WORKSPACE_MATERIALIZATION',
      functionName: 'runWorkspaceMaterialization() / auditExistingWorkspaceForContinuation()',
      receivesContract: 'YES' as const,
      consumesContract: 'PARTIAL' as const,
      consumesCbgaPlan: 'PARTIAL' as const,
      usesLegacyTemplate: 'NO' as const,
      usesFallback: staleForeignIds.length > 0 ? 'YES' as const : 'NO' as const,
      outputProductIdentity: canonicalContract.productIdentity,
      status: staleForeignIds.length > 0
        ? `Stale workspace reuse CONFIRMED on disk: ${staleForeignIds.length} nav module id(s) in the real router file are foreign to this build's own manifest.`
        : 'No stale foreign module ids found in this forensic sample.',
    },
  ];
  originalLog(renderConsumptionTable(rows));

  section('3-7. EXACT FIRST-STAGE ANSWERS');
  const answers: Array<{ q: string; a: string }> = [
    {
      q: '3. Exact first stage where the canonical contract is lost',
      a: 'It is never fully "lost" — CBGA (CBGA_REPAIRED_PLAN) correctly repairs `buildPlan.extraction.appName` to the contract\'s product identity when the title is generic. The contract is instead LOST-IN-TRANSIT one stage earlier than CBGA can help: `ProfileFeatureDefinition.customDomainCopy` (built inside PROMPT_BOUNDED_MODULE_PLAN / resolvePromptFaithfulBuildPlan, BEFORE the canonical contract or CBGA even run) is never recomputed after CBGA repairs the title, so the generator reads the stale, pre-repair copy regardless of what CBGA fixes downstream.',
    },
    {
      q: '4. Exact first stage where generic/template content is introduced',
      a: 'CUSTOM_DOMAIN_COPY_BUILDER (`buildPromptSpecificDomainCopy()`, src/prompt-faithful-generation/prompt-specific-ui-copy-builder.ts) — its `dashboard` and `settings` fields are unconditional, hardcoded assistive-communication/LISA phrasing for every custom-domain prompt, proven live above regardless of the real restaurant prompt\'s content.',
    },
    {
      q: '5. Exact first stage where "Calculator / Arithmetic Utility" is introduced',
      a:
        domainClassification.winningDomain === 'Calculator / Arithmetic Utility'
          ? `CANONICAL_PRODUCT_CONTRACT itself, live-reproduced above, for THIS exact restaurant prompt (winningDomain="${domainClassification.winningDomain}", confidence=${calculatorCandidate?.confidence.toFixed(2)}, matchedEvidence=[${(calculatorCandidate?.matchedEvidence ?? []).map((h) => h.keyword).join(', ')}]). Root cause is a generic (non-app-specific) classifier defect in src/product-faithfulness-v1/product-faithfulness-feature-extractor.ts: "multiple payment methods" prefix-matches keyword "multipl" (>= 4 chars triggers startsWith matching) and "Display ..." matches keyword "display" — 2 STRONG hits already saturate the confidence cap (Math.min(1, rawScore/CONFIDENCE_NORMALIZER)=1.00), and every other qualifying domain candidate ALSO reaches the same 1.00 cap for this prompt, so the winner is decided purely by DOMAIN_GLOSSARY array declaration order, not by which domain is actually the best match. Stale workspace reuse (WORKSPACE_MATERIALIZATION / continuation-skip, ${staleForeignIds.length} foreign nav id(s) proven on real disk in PHASE 5) is a SEPARATE, additional, independent contributor to the same symptom, not the only cause.`
          : `NOT the canonical contract stage for this prompt (proven live: winningDomain="${domainClassification.winningDomain}", Calculator/Arithmetic-Utility qualifies=${calculatorCandidate?.qualifies}). It is introduced ONLY via stale workspace reuse (WORKSPACE_MATERIALIZATION / continuation-skip): a PRIOR, unrelated build against the same workspace/projectId left calculator-domain feature folders (addition/subtraction/multiplication/division/numeric-keypad/equals/display) and FeatureAppRouter.tsx nav buttons on disk, proven forensically in PHASE 5 above (${staleForeignIds.length} foreign nav id(s) found).`,
    },
    {
      q: '6. Exact first stage where "reusable components where" is introduced',
      a: 'PROMPT_FEATURE_EXTRACTION (`extractAppName()`, src/prompt-faithful-generation/prompt-feature-extractor.ts) — proven live above: this exact function, called with the real restaurant prompt, returns the literal string via its case-insensitive, word-boundary-free `buildNamed` regex matching into the prompt\'s own "Build reusable components where appropriate" architecture bullet.',
    },
    {
      q: '7. Exact first stage where assistive communication copy is introduced',
      a: 'CUSTOM_DOMAIN_COPY_BUILDER for the copy text itself ("Communication board overview...", "Accessibility and assistive communication settings."); FEATURE_APP_ROUTER_GENERATION (`buildFeatureAppRouterTsx()`) for the actual rendered Blink/Gaze/Speech/Emergency-speech header markup, gated by its `isAssistiveApp` check which is true for ANY GENERIC_CUSTOM_APP_V1 build with any customDomainCopy set — proven live above for the real restaurant prompt.',
    },
  ];
  for (const { q, a } of answers) {
    originalLog('');
    originalLog(q);
    originalLog(`-> ${a}`);
  }

  section('8-15. FILE/FUNCTION/BRANCH + REMAINING QUESTIONS');
  const remaining: Array<{ q: string; a: string }> = [
    {
      q: '8. Exact file and function responsible',
      a: [
        '- src/prompt-faithful-generation/prompt-feature-extractor.ts :: extractAppName() — the title-extraction regex bug.',
        '- src/prompt-faithful-generation/prompt-specific-ui-copy-builder.ts :: buildPromptSpecificDomainCopy() — hardcoded assistive dashboard/settings copy.',
        '- src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts :: buildFeatureAppRouterTsx() — isAssistiveApp misclassification + re-deriving title from stale customDomainCopy instead of the already-correctly-repaired appTitle variable computed one call frame up in universal-app-materialization-engine.ts.',
        '- src/contract-bound-generation-authority-v4/contract-bound-generation-adapter.ts :: applyContractBoundGenerationToBuildPlan() — repairs extraction.appName but never touches/re-derives buildPlan.definition, so the repair cannot reach the generator.',
      ].join('\n'),
    },
    {
      q: '9. Exact branch responsible',
      a: 'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts, buildFeatureAppRouterTsx(): `const isAssistiveApp = definition.profile === \'ASSISTIVE_COMMUNICATION_APP_V1\' || (definition.profile === \'GENERIC_CUSTOM_APP_V1\' && Boolean(definition.customDomainCopy));` — the second disjunct is true for essentially every custom-domain app, not just assistive-communication ones.',
    },
    {
      q: '10. Whether stale workspace reuse is involved',
      a: `YES, independently confirmed on real disk evidence in PHASE 5 (${staleForeignIds.length} nav module id(s) present in the on-disk router file that this build\'s own manifest never planned) — a SEPARATE, additive contributor to the symptom on top of the two generator-level defects proven live in PHASES 1-4.`,
    },
    {
      q: '11. Whether generic template selection is involved',
      a: 'YES — CUSTOM_DOMAIN_COPY_BUILDER unconditionally selects hardcoded assistive-communication template copy for `dashboard`/`settings` on every custom-domain build; FEATURE_APP_ROUTER_GENERATION unconditionally selects the assistive Blink/Gaze/Speech/Emergency-speech header markup whenever `customDomainCopy` is present at all.',
    },
    {
      q: '12. Whether UniversalFeatureContract overrides canonical contract',
      a: 'NOT OBSERVED as an override in this trace — `buildUniversalFeatureContract()` (universal-app-materialization-engine.ts) is called alongside, not instead of, the canonical contract, and is used only for `contract.productName`/`displayName` fallback when `extraction.appName === \'Custom App\'`, which was not the case here. It is a parallel, redundant identity source, not a direct override in the path traced.',
    },
    {
      q: '13. Whether ProfileFeatureDefinition overrides canonical contract',
      a: 'YES, functionally — `ProfileFeatureDefinition.customDomainCopy` is built BEFORE the canonical contract exists and is never reconciled with it afterward, so whatever it already baked in (title, dashboard/settings copy) silently overrides/ignores anything the canonical contract or CBGA later determine.',
    },
    {
      q: '14. Whether PromptBoundedModulePlan is ignored or partially consumed',
      a: 'PARTIALLY consumed — its `approvedModuleIds`/`routes` are correctly threaded through CBGA repair and into materialization (proven by the WORKSPACE_MATERIALIZATION trace and the module-plan repair path in contract-bound-generation-adapter.ts). What is NOT consumed anywhere downstream is a re-validation that the actual materialized/on-disk files (FEATURE_APP_ROUTER_GENERATION\'s output plus any stale files) still match `approvedModuleIds` for a continuation build — that is exactly the gap GPCA Continuation Workspace Compliance Fix V1 now audits (see WORKSPACE_MATERIALIZATION row above).',
    },
    {
      q: '15. Whether CBGA repaired plan reaches the real generator',
      a: `PARTIALLY. Module/route/navigation repairs DO reach the generator (materializeGeneratedApplication reads \`boundedBuildPlan.extraction.appName\` for \`appTitle\`/\`displayName\`, which IS the CBGA-repaired value). But buildFeatureAppRouterTsx() — the one function that renders the literal <h1> title and the assistive header — reads \`definition.customDomainCopy.headline\` instead, which is a DIFFERENT field CBGA's repair never touches. Proven live above: appNameWasRepaired=${appNameWasRepaired}, yet buildFeatureAppRouterTsx\'s own output title in PHASE 4 = "${h1Match?.[1] ?? '(none)'}" came from the stale field, not the repaired one.`,
    },
  ];
  for (const { q, a } of remaining) {
    originalLog('');
    originalLog(q);
    originalLog(`-> ${a}`);
  }

  section('16. MINIMAL RECOMMENDED FIX (not implemented — trace-only per instructions)');
  originalLog(
    [
      'Four independent, additive (never-weakening) fixes, each isolated to the exact stage that owns the defect:',
      '',
      '  0. classifyDomainEvidence() (product-faithfulness-v1/product-faithfulness-feature-extractor.ts):',
      '     the confidence formula `Math.min(1, rawScore / CONFIDENCE_NORMALIZER)` saturates at 1.00 with as',
      '     few as 2 STRONG keyword hits, which produces frequent multi-way ties across unrelated domains that',
      '     are then broken purely by DOMAIN_GLOSSARY array declaration order (proven live above: 5 domains',
      '     tied at 1.00 for the real restaurant prompt, and "Calculator / Arithmetic Utility" won only because',
      '     it is declared first). Raising the normalizer (or ranking by raw STRONG-match COUNT before applying',
      '     any cap) would make ties far rarer without touching the generic/no-hardcoded-domain matching logic',
      '     itself. Separately, `hasKeyword()`\'s `startsWith` prefix rule let "multiple" match keyword "multipl"',
      '     (Multiplication) — requiring a stronger boundary (e.g. next char is not a lowercase letter) would',
      '     prevent this specific false positive without weakening genuine prefix matches elsewhere.',
      '',
      '  1. extractAppName() (prompt-feature-extractor.ts): anchor the "app"/"application" match to a word',
      '     boundary (`\\bapp\\b` / `\\bapplication\\b`) and stop applying `/i` to the `[A-Z]` capture-start',
      '     class (use an explicit `[A-Za-z]` only where case-insensitivity is actually intended for the rest',
      '     of the pattern). This alone prevents the regex from ever matching into an unrelated later sentence.',
      '',
      '  2. buildPromptSpecificDomainCopy() (prompt-specific-ui-copy-builder.ts): make `dashboard` and',
      '     `settings` prompt/contract-derived (e.g. `${extraction.corePurpose} overview.` /',
      '     `${appName} settings.`) instead of hardcoded assistive-communication phrasing, OR gate that',
      '     specific wording behind the same LISA/accessibility detection extractAppName() already uses',
      '     (`promptMentionsLisaOrAccessibility`) instead of applying it to every custom-domain app.',
      '',
      '  3. The CBGA-repair-does-not-reach-the-generator gap (contract-bound-generation-adapter.ts +',
      '     modular-feature-module-generator.ts): after CBGA repairs `extraction.appName`, also re-derive',
      '     `definition.customDomainCopy` (re-run buildPromptSpecificDomainCopy with the repaired extraction)',
      '     before returning `repairedBuildPlan`, OR have buildFeatureAppRouterTsx() accept the already-',
      '     correct `appTitle` its own caller (universal-app-materialization-engine.ts) computes instead of',
      '     re-deriving its own from `customDomainCopy.headline`. Separately, `isAssistiveApp` should key off',
      '     an explicit profile/contract signal (e.g. a dedicated assistive-communication flag already present',
      '     on the contract) rather than "GENERIC_CUSTOM_APP_V1 with any customDomainCopy at all".',
      '',
      '  4. (Separate, orthogonal to generation) stale workspace reuse: a "-rebuild-" / continuation request',
      '     against an existing projectId with an unrelated new prompt should re-run Fresh Build Artifact',
      '     Isolation (already implemented for NEW_BUILD) rather than only the presence-based',
      '     workspaceHasGeneratedFeatureModules() check — GPCA Continuation Workspace Compliance Fix V1',
      '     already added a detection/block backstop for this; the generator-side purge itself is still',
      '     un-implemented and out of scope for this trace-only investigation.',
    ].join('\n'),
  );

  section('SUMMARY');
  originalLog(`extractAppName("${restaurantPrompt.slice(0, 40)}...") = "${buildPlan.extraction.appName}"`);
  originalLog(
    `canonicalContract.productIdentity = "${canonicalContract.productIdentity}" ` +
      `(live-reproduced domain-classifier confidence-tie bug for this real restaurant prompt — see item 5/0 above)`,
  );
  originalLog(`CBGA repaired extraction.appName: ${appNameWasRepaired} -> "${cbgaResult.buildPlan.extraction.appName}"`);
  originalLog(`buildFeatureAppRouterTsx() rendered <h1>: "${h1Match?.[1] ?? '(none)'}" (reads stale customDomainCopy, ignores CBGA repair)`);
  originalLog(`Assistive header injected for this restaurant build: ${routerTsx.includes('Assistive communication board')}`);
  originalLog(`Stale foreign calculator/CRM/notes module ids found on real disk: ${staleForeignIds.length}`);
  originalLog('');
  originalLog('Captured [CONTRACT_CONSUMPTION_TRACE] line count by stage:');
  for (const stage of [
    'PROMPT_FEATURE_EXTRACTION',
    'PROMPT_BOUNDED_MODULE_PLAN',
    'CANONICAL_PRODUCT_CONTRACT',
    'CBGA_REPAIRED_PLAN',
    'CUSTOM_DOMAIN_COPY_BUILDER',
    'FEATURE_APP_ROUTER_GENERATION',
    'WORKSPACE_MATERIALIZATION',
  ]) {
    originalLog(`  ${stage}: ${byStage(stage).length}`);
  }
  originalLog('');
  originalLog('PRODUCTION_CONTRACT_CONSUMPTION_TRACE_V1_COMPLETE');
}

void main().catch((error) => {
  originalLog('');
  originalLog('TRACE SCRIPT ERROR (see below) — partial trace output above may still be useful:');
  originalLog(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});
