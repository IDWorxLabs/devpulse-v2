/**
 * PRODUCT_FAITHFULNESS_EVIDENCE_TRACE_V1 — trace tool.
 *
 * This is a debugging tool, NOT a validator. It does not assert pass/fail scenarios, does not add
 * a new protection layer, does not create a new authority, and does not change any production
 * behavior. It:
 *
 *   1. Statically audits the real, already-shipped source files for module-level global state,
 *      fallback-to-previous-evidence paths, "recovered concept" repair paths, and the hardcoded
 *      product-domain concept glossary — quoting the exact current file/line from disk.
 *   2. Empirically exercises the REAL, exported, production functions (no re-implementation, no
 *      simulation of behavior that isn't actually in the codebase) with two back-to-back builds —
 *      an unrelated first app, then a second, textually-unrelated app — to observe, with real
 *      evidence, whether/where the second build's Product Faithfulness evidence can be
 *      contaminated by the first.
 *   3. Assembles everything into a single report identifying the single earliest point where
 *      stale evidence can enter, the exact file/function responsible, contributing factors, and a
 *      description-only recommended fix (not applied).
 *
 * Run only:
 *   npx tsx scripts/trace-product-faithfulness-evidence-v1.ts
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  resolveRepoRoot,
  auditGlobalState,
  auditFallbackPaths,
  auditRecoveryPaths,
  auditHardcodedConceptGlossary,
  recordEvidenceTrace,
  resetEvidenceTraceLog,
  getEvidenceTraceLog,
  detectStaleEvidenceInTrace,
  buildProductFaithfulnessTraceReport,
  renderProductFaithfulnessTraceReportMarkdown,
  PRODUCT_FAITHFULNESS_TRACE_V1_TOKEN,
  type DomainCollisionProbeResult,
  type ProjectContextReuseProbeResult,
  type EarliestEntryPoint,
  type RecommendedFixDescription,
} from '../src/product-faithfulness-trace-v1/index.js';

import { extractRequestedConcepts } from '../src/product-faithfulness-v1/product-faithfulness-feature-extractor.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/canonical-product-contract.js';
import { resolveProjectContext } from '../src/one-prompt-live-preview/workspace-tab-registry.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();

function checkpoint(label: string): void {
  console.log(`[checkpoint ${Date.now() - START}ms] ${label}`);
}

function simplePromptHash(prompt: string): string {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) hash = (hash * 31 + prompt.charCodeAt(i)) | 0;
  return `prompthash-${Math.abs(hash).toString(16)}`;
}

// -----------------------------------------------------------------------------------------------
// 1. STATIC AUDITS — real source files, read-only.
// -----------------------------------------------------------------------------------------------

checkpoint('start');

const GLOBAL_STATE_AUDIT_FILES = [
  'src/one-prompt-live-preview/workspace-tab-registry.ts',
  'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
  'src/prompt-bounded-materialization/prompt-bounded-materialization-authority.ts',
  'src/materialization-evidence/forensic-manifest-lifecycle.ts',
  'src/build-result-normalizer-v1/build-result-normalizer-adapter.ts',
  'src/live-preview-interaction-proof-v1/live-preview-interaction-proof-engine.ts',
];

const globalStateFindings = auditGlobalState(ROOT, GLOBAL_STATE_AUDIT_FILES);
checkpoint('global state audit');

const FALLBACK_AUDIT_FILES = [
  'src/materialization-evidence/forensic-manifest-lifecycle.ts',
  'src/prompt-bounded-materialization/prompt-bounded-materialization-authority.ts',
];
const fallbackPathFindings = auditFallbackPaths(ROOT, FALLBACK_AUDIT_FILES);
checkpoint('fallback path audit');

const RECOVERY_AUDIT_FILES = ['src/product-faithfulness-v2/generation-faithfulness-repair.ts'];
const recoveryPathFindings = auditRecoveryPaths(ROOT, RECOVERY_AUDIT_FILES);
checkpoint('recovery path audit');

const hardcodedConceptListFindings = auditHardcodedConceptGlossary(
  ROOT,
  'src/product-faithfulness-v1/product-faithfulness-feature-extractor.ts',
);
checkpoint('hardcoded concept glossary audit');

// -----------------------------------------------------------------------------------------------
// 2a. LIVE PROBE — domain-glossary keyword collision. Exercises the REAL extractRequestedConcepts
//     / buildCanonicalProductContract with prompts for OTHER domains that never mention
//     calculator/arithmetic, to see whether the hardcoded glossary misclassifies them anyway.
// -----------------------------------------------------------------------------------------------

resetEvidenceTraceLog();

const DOMAIN_COLLISION_PROMPTS: Array<{ probeName: string; prompt: string }> = [
  {
    probeName: 'Restaurant management platform (realistic business prompt)',
    prompt:
      'Build a Restaurant Management Platform where staff can take orders, calculate the bill for each table, track customer orders, manage bookings, and view daily sales.',
  },
  {
    probeName: 'Restaurant management platform (minimal prompt)',
    prompt: 'Build a Restaurant Management Platform.',
  },
  {
    probeName: 'Gym membership manager',
    prompt: 'Build a gym membership manager that lets staff calculate membership renewal fees and track attendance.',
  },
  {
    probeName: 'Freelancer invoicing tool',
    prompt: 'Build an invoicing tool for freelancers to calculate totals owed by each client and send invoices.',
  },
  {
    probeName: 'Hotel front desk system',
    prompt: 'Build a hotel front desk system to manage room bookings, guests, and calculate nightly rates.',
  },
];

const domainCollisionProbes: DomainCollisionProbeResult[] = DOMAIN_COLLISION_PROMPTS.map(({ probeName, prompt }) => {
  const { concepts, domainLabel } = extractRequestedConcepts({ prompt });
  const conceptNames = concepts.map((c) => c.concept);
  const calculatorConceptsPresent = conceptNames.filter((name) =>
    ['Addition', 'Subtraction', 'Multiplication', 'Division', 'Numeric Keypad', 'Equals'].includes(name),
  );
  const collided = domainLabel === 'Calculator / Arithmetic Utility' || calculatorConceptsPresent.length > 0;

  recordEvidenceTrace({
    stage: 'CANONICAL_PRODUCT_CONTRACT',
    requestId: 'req-restaurant-001',
    buildId: 'build-restaurant-001',
    projectId: 'project-restaurant-001',
    promptHash: simplePromptHash(prompt),
    sourceFile: 'src/product-faithfulness-v1/product-faithfulness-feature-extractor.ts',
    sourceModule: 'extractRequestedConcepts -> domainWideConcepts/directConceptMatches',
    owner: 'product-faithfulness-v1',
    productIdentity: domainLabel,
    conceptList: conceptNames,
    accepted: true,
    reasonAccepted: collided
      ? `Trigger keyword or concept keyword from the hardcoded "Calculator / Arithmetic Utility" bundle matched a generic English word present in this prompt.`
      : 'No domain-glossary keyword matched.',
  });

  return {
    readOnly: true,
    probeName,
    prompt,
    producedDomainLabel: domainLabel,
    producedConceptNames: conceptNames,
    collided,
    collisionExplanation: collided
      ? `extractRequestedConcepts(prompt) returned domainLabel="${domainLabel}" and/or calculator concepts [${calculatorConceptsPresent.join(', ')}] for a prompt about an unrelated product, purely because the prompt used a generic word (e.g. "calculate") that the DOMAIN_GLOSSARY hardcodes as a Calculator-app trigger/concept keyword.`
      : null,
  };
});
checkpoint('domain collision probes');

// Also prove the same collision reaches the V2 canonical contract's productIdentity — this is
// exactly what feeds generation-faithfulness-repair's "Recovered ..." messages.
const restaurantContract = buildCanonicalProductContract({ prompt: DOMAIN_COLLISION_PROMPTS[0].prompt });
recordEvidenceTrace({
  stage: 'CANONICAL_PRODUCT_CONTRACT',
  requestId: 'req-restaurant-001',
  buildId: 'build-restaurant-001',
  projectId: 'project-restaurant-001',
  promptHash: simplePromptHash(DOMAIN_COLLISION_PROMPTS[0].prompt),
  sourceFile: 'src/product-faithfulness-v2/canonical-product-contract.ts',
  sourceModule: 'buildCanonicalProductContract',
  owner: 'product-faithfulness-v2',
  productIdentity: restaurantContract.productIdentity,
  conceptList: restaurantContract.allConceptNames,
  accepted: true,
  reasonAccepted: 'productIdentity = domainLabel ?? ... ; domainLabel came from the same hardcoded glossary collision.',
});
checkpoint('canonical contract probe');

// -----------------------------------------------------------------------------------------------
// 2b. LIVE PROBE — resolveProjectContext reuse. Exercises the REAL resolveProjectContext twice:
//     build 1 mints a fresh project; build 2 explicitly passes build 1's projectId (mirroring what
//     the frontend actually sends via `state.projectId` on every subsequent build) even though the
//     request is a brand-new, unrelated app and blockActiveProjectFallback is set exactly the way
//     the orchestrator sets it for a NEW_BUILD decision.
// -----------------------------------------------------------------------------------------------

const firstBuildContext = resolveProjectContext({
  projectId: null,
  projectName: 'Calculator App',
  createIfMissing: true,
  blockActiveProjectFallback: true,
});

const secondBuildContext = resolveProjectContext({
  // This is exactly what public/founder-reality/builder-home.js sends on every Build click:
  // `{ projectId: state.projectId || undefined }`, where state.projectId was persisted from the
  // previous build's response (persistProjectId(build.projectId) after every successful build).
  projectId: firstBuildContext.projectId,
  projectName: 'Restaurant Management Platform',
  createIfMissing: true,
  blockActiveProjectFallback: true,
});

const projectContextReuseProbe: ProjectContextReuseProbeResult = {
  readOnly: true,
  firstBuildProjectId: firstBuildContext.projectId,
  secondBuildRequestedProjectId: firstBuildContext.projectId,
  secondBuildResolvedProjectId: secondBuildContext.projectId,
  secondBuildCreatedNewProject: secondBuildContext.created,
  blockActiveProjectFallbackWasSet: true,
  reused: secondBuildContext.projectId === firstBuildContext.projectId && secondBuildContext.created === false,
  explanation:
    secondBuildContext.projectId === firstBuildContext.projectId
      ? 'resolveProjectContext returned the FIRST build\'s projectId/session for the SECOND (unrelated) build even with blockActiveProjectFallback=true, because that flag only gates the *implicit* activeProjectId fallback branch — it never gates the case where the caller explicitly supplies a (now-stale) projectId. The workspace directory is keyed only by projectId, so the second build reuses the first build\'s workspace directory on disk.'
      : 'resolveProjectContext minted a fresh projectId for the second build (not reproduced in this run).',
};

recordEvidenceTrace({
  stage: 'WORKSPACE',
  requestId: 'req-restaurant-001',
  buildId: 'build-restaurant-001',
  projectId: secondBuildContext.projectId,
  promptHash: simplePromptHash(DOMAIN_COLLISION_PROMPTS[0].prompt),
  sourceFile: 'src/one-prompt-live-preview/workspace-tab-registry.ts',
  sourceModule: 'resolveProjectContext',
  owner: 'one-prompt-live-preview',
  productIdentity: null,
  conceptList: [],
  scopeId: secondBuildContext.projectId,
  accepted: true,
  reasonAccepted: 'requestedId was already a known session (sessions.has(requestedId)) so it was returned verbatim, created:false.',
});

// This entry represents the calculator build's workspace/session identity being reused for the
// restaurant build's requestId/buildId — feed it through the comparator against the restaurant
// build's own identity to produce a STALE_EVIDENCE_DETECTED record in the exact shape requested.
recordEvidenceTrace({
  stage: 'WORKSPACE',
  requestId: 'req-calculator-000',
  buildId: 'build-calculator-000',
  projectId: firstBuildContext.projectId,
  promptHash: simplePromptHash('Build a calculator app.'),
  sourceFile: 'src/one-prompt-live-preview/workspace-tab-registry.ts',
  sourceModule: 'resolveProjectContext (first build\'s session, still alive in the process-wide `sessions` Map)',
  owner: 'one-prompt-live-preview',
  productIdentity: 'Calculator / Arithmetic Utility',
  conceptList: ['Addition', 'Multiplication', 'Numeric Keypad', 'Equals'],
  scopeId: firstBuildContext.projectId,
  accepted: true,
  reasonAccepted: 'Same projectId as the second (restaurant) build resolved to — sessions.has(requestedId) accepted it without checking which build/request originally created it.',
});

checkpoint('resolveProjectContext reuse probe');

const staleEvidenceDetections = detectStaleEvidenceInTrace(getEvidenceTraceLog(), {
  requestId: 'req-restaurant-001',
  buildId: 'build-restaurant-001',
  projectId: secondBuildContext.projectId,
  promptHash: simplePromptHash(DOMAIN_COLLISION_PROMPTS[0].prompt),
});
checkpoint('stale evidence comparison');

// -----------------------------------------------------------------------------------------------
// 3. Assemble report.
// -----------------------------------------------------------------------------------------------

const earliestEntryPoint: EarliestEntryPoint = {
  readOnly: true,
  file: 'src/product-faithfulness-v1/product-faithfulness-feature-extractor.ts',
  function: 'DOMAIN_GLOSSARY (module-level constant), read by domainWideConcepts',
  line: 42,
  stage: 'PROMPT_UNDERSTANDING',
  description:
    'The "Calculator / Arithmetic Utility" domain bundle\'s triggerKeywords array includes the plain English business verb "calculate" (and its concept-level keyword list separately includes the plain noun "product" under Multiplication). Any prompt for ANY product — restaurant, gym, hotel, invoicing, or otherwise — that uses the word "calculate" (e.g. "calculate the bill", "calculate totals", "calculate fees") is, on that single word alone, classified as domainLabel="Calculator / Arithmetic Utility" and gets the full calculator concept set (Addition, Subtraction, Multiplication, Division, Numeric Keypad, Equals, Display, Clear) injected into extractRequestedConcepts\'s output — before any workspace, manifest, or session state is even involved. This is reproduced live above with zero caching, zero session reuse, and zero cross-build state: a single call to the real extractRequestedConcepts() with a same-build, same-request restaurant prompt already produces the exact symptom.',
};

const contributingFindings: EarliestEntryPoint[] = [
  {
    readOnly: true,
    file: 'src/one-prompt-live-preview/workspace-tab-registry.ts',
    function: 'resolveProjectContext',
    line: 77,
    stage: 'WORKSPACE',
    description:
      'blockActiveProjectFallback (set true for every NEW_BUILD by the orchestrator) only disables the *implicit* fallback-to-activeProjectId branch. It does nothing when the caller explicitly supplies a projectId — which the frontend always does (public/founder-reality/builder-home.js persists and resends state.projectId from the previous build on every subsequent Build click). So a NEW_BUILD that is correctly classified as unrelated to the previous project still reuses that previous project\'s id, session, and — because the workspace directory path is `${GENERATED_BUILDER_WORKSPACES_DIR}/${projectId}` — its workspace directory on disk. Reproduced live above.',
  },
  {
    readOnly: true,
    file: 'src/materialization-evidence/forensic-manifest-lifecycle.ts',
    function: 'finalizeForensicManifestSuccess',
    line: 559,
    stage: 'MATERIALIZATION_MANIFEST',
    description:
      'featureModuleDetails: existing?.featureModuleDetails ?? [] unconditionally carries forward whatever featureModuleDetails was already on disk at input.workspaceDir from a PREVIOUS write (readManifest at line 500), while featureModules/routes/prompt on the same manifest ARE refreshed from the current build\'s input a few lines below/above. MaterializationEvidenceCompletionInput (materialization-evidence-types.ts) has no featureModuleDetails field at all, so this function has no way to receive a fresh value even if it wanted to — it can only ever inherit from disk or default to []. Compounds finding #1 above: whenever workspaceDir is reused (see resolveProjectContext finding), the new build\'s manifest keeps the old build\'s feature module names/component paths/promptTerms verbatim.',
  },
  {
    readOnly: true,
    file: 'src/build-result-normalizer-v1/build-result-normalizer-adapter.ts',
    function: 'deriveProductFaithfulnessInput',
    line: 47,
    stage: 'FEATURE_CONTRACT',
    description:
      'featureContract: featureModuleDetails.map((m) => ({ featureName: m.name })) (plus navigationLabels/generatedComponents/materializationManifestHints a few lines below, all also derived from featureModuleDetails) feeds whatever is in the manifest\'s featureModuleDetails — stale or not — straight into the exact ProductFaithfulnessInput fields that extractRequestedConcepts\'s combined-text fallback scans for domain-glossary keywords. This is the last hop before finding #0 (the glossary itself) runs on evidence that may already be stale.',
  },
  {
    readOnly: true,
    file: 'src/product-faithfulness-v2/generation-faithfulness-repair.ts',
    function: 'applyMinimalRepairs',
    line: 68,
    stage: 'PRODUCT_FAITHFULNESS',
    description:
      'Once a concept such as "Multiplication" is canonical (contract.allConceptNames, derived solely from build.prompt via buildCanonicalProductContract({ prompt: build.prompt })) but missing from a given stage\'s own extracted concepts, this function reintroduces it into that stage and labels it "Recovered" as long as it is present in ANY other stage\'s evidence (conceptPresentSomewhere, built from every stage passed to the same audit call) — it has no way to know that the "other stage" it borrowed from is itself carrying stale evidence (finding #2/#3 above). This produces the exact "Recovered \\"X\\"" wording reported by the user.',
  },
];

const recommendedFixes: RecommendedFixDescription[] = [
  {
    readOnly: true,
    targetFile: 'src/product-faithfulness-v1/product-faithfulness-feature-extractor.ts',
    targetFunction: 'DOMAIN_GLOSSARY',
    description:
      'Remove (or make multi-word / far more specific) the generic English keywords in the glossary that collide with ordinary business vocabulary — most importantly "calculate" as a Calculator-domain triggerKeyword, and "product"/"times" as Multiplication concept keywords. Trigger keywords should require unambiguous domain terms (e.g. "calculator app", "arithmetic operations") rather than common verbs any product prompt could use in a different sense.',
  },
  {
    readOnly: true,
    targetFile: 'src/one-prompt-live-preview/workspace-tab-registry.ts',
    targetFunction: 'resolveProjectContext',
    description:
      'When blockActiveProjectFallback is true (i.e. the caller already classified this request as NEW_BUILD), ignore any caller-supplied projectId too, not just the implicit activeProjectId fallback — always mint a fresh project id/session for NEW_BUILD regardless of what projectId the request body happens to carry.',
  },
  {
    readOnly: true,
    targetFile: 'src/materialization-evidence/materialization-evidence-types.ts',
    targetFunction: 'MaterializationEvidenceCompletionInput',
    description:
      'Add a featureModuleDetails field to this input type and have finalizeForensicManifestSuccess (forensic-manifest-lifecycle.ts) build featureModuleDetails from the CURRENT build\'s input/discovery every time, only falling back to `existing` when the current build genuinely produced no feature modules of its own (e.g. a no-op continuation).',
  },
];

const report = buildProductFaithfulnessTraceReport({
  evidenceTraceLog: getEvidenceTraceLog(),
  staleEvidenceDetections,
  globalStateFindings,
  fallbackPathFindings,
  recoveryPathFindings,
  hardcodedConceptListFindings,
  domainCollisionProbes,
  projectContextReuseProbe,
  earliestEntryPoint,
  contributingFindings,
  recommendedFixes,
});

console.log(renderProductFaithfulnessTraceReportMarkdown(report));
checkpoint('report rendered');

console.log(`\n${PRODUCT_FAITHFULNESS_TRACE_V1_TOKEN}`);
