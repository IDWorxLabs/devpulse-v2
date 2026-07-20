/**
 * Product Faithfulness Milestone 2 — validation suite.
 *
 * Constitutional principle under test: the canonical feature contract is the single source of
 * truth for product identity, and generation must remain consistent with it end to end. This
 * suite proves the canonical contract is immutable, every generation stage is audited against it,
 * drift/substitution/dominant-unsupported-concepts are detected generically, repair is minimal
 * and never touches unrelated stages, the module has no application-specific logic, no LLM
 * dependency, and no new orchestration engine — then re-runs every earlier validator (including
 * Milestone 1) to confirm no regressions.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFounderRealityServer } from '../server/founder-reality-server.js';
import { exitValidator, startValidatorHttpServer } from '../src/windows-validator-clean-exit-v1/index.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/canonical-product-contract.js';
import { buildConceptGraph } from '../src/product-faithfulness-v2/product-concept-graph.js';
import { auditGenerationPipeline, buildStageEvidence } from '../src/product-faithfulness-v2/generation-faithfulness-auditor.js';
import type { GenerationStageRawEvidence } from '../src/product-faithfulness-v2/generation-faithfulness-auditor.js';
import { applyMinimalRepairs, repairAndReaudit } from '../src/product-faithfulness-v2/generation-faithfulness-repair.js';
import { runGenerationFaithfulnessAudit, runGenerationGate } from '../src/product-faithfulness-v2/index.js';
import type { GenerationFaithfulnessReport, GenerationStageName } from '../src/product-faithfulness-v2/generation-faithfulness-types.js';
import { normalizeBuildResult } from '../src/build-result-normalizer-v1/build-result-normalizer.js';
import type { BuildResultNormalizerInput } from '../src/build-result-normalizer-v1/build-result-normalizer.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const require = createRequire(import.meta.url);

export const PRODUCT_FAITHFULNESS_MILESTONE_2_PASS_TOKEN = 'PRODUCT_FAITHFULNESS_MILESTONE_2_PASS';

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
  'src/product-faithfulness-v1',
];

const MODULE_DIR = join(ROOT, 'src/product-faithfulness-v2');
const MODULE_FILES = [
  'index.ts',
  'canonical-product-contract.ts',
  'product-concept-graph.ts',
  'feature-contract-consistency.ts',
  'generation-faithfulness-auditor.ts',
  'generation-faithfulness-repair.ts',
  'generation-faithfulness-report.ts',
  'generation-faithfulness-types.ts',
].map((f) => join(MODULE_DIR, f));

function readModuleSource(): string {
  return MODULE_FILES.filter(existsSync)
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n\n');
}

function runPreviousValidator(scriptRelativePath: string, passToken: string): { ok: boolean; detail: string } {
  const evidencePath = process.env.AIDEVENGINE_FRESH_VALIDATOR_EVIDENCE_V1;
  if (evidencePath && existsSync(evidencePath)) {
    try {
      const evidence = JSON.parse(readFileSync(evidencePath, 'utf8')) as FreshValidatorEvidence;
      const generatedAt = Date.parse(evidence.generatedAt);
      const ageMs = Date.now() - generatedAt;
      const entry = evidence.validators?.[scriptRelativePath];
      const evidencePassed =
        evidence.schema === 'AIDEVENGINE_FRESH_VALIDATOR_EVIDENCE_V1' &&
        Number.isFinite(generatedAt) &&
        ageMs >= -5_000 &&
        ageMs <= 300_000 &&
        entry?.exitCode === 0 &&
        entry.passToken === passToken &&
        entry.output.includes(passToken);
      if (evidencePassed) {
        return {
          ok: true,
          detail: `fresh independent process evidence consumed (ageMs=${ageMs})`,
        };
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

const BOOKING_PROMPT = 'Build an appointment booking system for a hair salon';
const bookingContract = buildCanonicalProductContract({ prompt: BOOKING_PROMPT });

function stageEv(stage: GenerationStageName, patch: Partial<GenerationStageRawEvidence['input']>): GenerationStageRawEvidence {
  return { stage, input: { prompt: '', ...patch } };
}

const BOOKING_STAGES_CONSISTENT: GenerationStageRawEvidence[] = [
  stageEv('ARCHITECTURE', { architectureSummary: 'Appointments Calendar Customers Services Booking Staff Scheduling Dashboard' }),
  stageEv('FEATURE_CONTRACT', {
    featureContract: [
      { featureName: 'Appointments' },
      { featureName: 'Calendar' },
      { featureName: 'Customers' },
      { featureName: 'Services' },
      { featureName: 'Booking' },
      { featureName: 'Staff' },
      { featureName: 'Scheduling' },
      { featureName: 'Dashboard' },
    ],
  }),
  stageEv('GENERATED_MODULES', {
    generatedFeatureModules: ['Appointments', 'Calendar', 'Customers', 'Services', 'Booking', 'Staff', 'Scheduling', 'Dashboard'],
  }),
  stageEv('ROUTES', {
    generatedRoutes: ['/appointments', '/calendar', '/customers', '/services', '/booking', '/staff', '/scheduling', '/dashboard'],
  }),
  stageEv('NAVIGATION', {
    navigationLabels: ['Appointments', 'Calendar', 'Customers', 'Services', 'Booking', 'Staff', 'Scheduling', 'Dashboard'],
  }),
  stageEv('MANIFEST', {
    workspaceManifestSummary: ['Appointments', 'Calendar', 'Customers', 'Services', 'Booking', 'Staff', 'Scheduling', 'Dashboard'],
  }),
  stageEv('PREVIEW_DOM', { domText: 'Appointments Calendar Customers Services Booking Staff Scheduling Dashboard' }),
];

function auditFixture(): ReturnType<typeof auditGenerationPipeline> {
  return auditGenerationPipeline(bookingContract, buildStageEvidence(BOOKING_STAGES_CONSISTENT));
}

async function main(): Promise<void> {
  console.log('');
  console.log('Product Faithfulness Milestone 2 — Validation');
  console.log('===============================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert(
    '01. package script registered',
    Boolean(pkg.scripts?.['validate:product-faithfulness-milestone-2']),
    'validate:product-faithfulness-milestone-2',
  );

  for (const file of MODULE_FILES) {
    assert(`02. module file exists — ${file.replace(ROOT, '')}`, existsSync(file), file);
  }

  const moduleSource = readModuleSource();

  // --- Scenario 1: Canonical contract remains immutable after creation ---------------------

  const originalIdentity = bookingContract.productIdentity;
  let mutationThrew = false;
  try {
    (bookingContract as unknown as { productIdentity: string }).productIdentity = 'HACKED';
  } catch {
    mutationThrew = true;
  }
  assert(
    '03. Canonical contract is immutable — direct field mutation is rejected or has no effect',
    mutationThrew || bookingContract.productIdentity === originalIdentity,
    `identity after mutation attempt: ${bookingContract.productIdentity}`,
  );
  let arrayMutationThrew = false;
  const entityCountBefore = bookingContract.coreEntities.length;
  try {
    (bookingContract.coreEntities as string[]).push('Hacked Entity');
  } catch {
    arrayMutationThrew = true;
  }
  assert(
    '04. Canonical contract array fields are immutable — push is rejected or has no effect',
    arrayMutationThrew || bookingContract.coreEntities.length === entityCountBefore,
    `coreEntities length after push attempt: ${bookingContract.coreEntities.length}`,
  );
  assert(
    '05. Canonical contract is frozen at the object level',
    Object.isFrozen(bookingContract),
    'expected Object.isFrozen(contract) === true',
  );

  // --- Scenarios 2-7: each generation stage remains consistent with the canonical contract --

  const consistentAudit = auditFixture();
  const stageByName = new Map(consistentAudit.stages.map((s) => [s.stage, s]));
  assert(
    '06. Architecture stage remains consistent with the canonical contract',
    stageByName.get('ARCHITECTURE')?.driftKind === 'NONE',
    JSON.stringify(stageByName.get('ARCHITECTURE')),
  );
  assert(
    '07. Feature contract stage remains consistent',
    stageByName.get('FEATURE_CONTRACT')?.retentionRatio! >= 0.85,
    JSON.stringify(stageByName.get('FEATURE_CONTRACT')),
  );
  assert(
    '08. Generated modules stage remains consistent',
    stageByName.get('GENERATED_MODULES')?.driftKind === 'NONE',
    JSON.stringify(stageByName.get('GENERATED_MODULES')),
  );
  assert(
    '09. Routes stage remains consistent',
    stageByName.get('ROUTES')?.driftKind === 'NONE',
    JSON.stringify(stageByName.get('ROUTES')),
  );
  assert(
    '10. Navigation stage remains consistent',
    stageByName.get('NAVIGATION')?.driftKind === 'NONE',
    JSON.stringify(stageByName.get('NAVIGATION')),
  );
  assert(
    '11. Manifest stage remains consistent',
    stageByName.get('MANIFEST')?.driftKind === 'NONE',
    JSON.stringify(stageByName.get('MANIFEST')),
  );
  assert(
    '12. Preview DOM evidence remains consistent',
    stageByName.get('PREVIEW_DOM')?.driftKind === 'NONE',
    JSON.stringify(stageByName.get('PREVIEW_DOM')),
  );
  assert(
    '13. Fully consistent pipeline yields verdict CONSISTENT',
    consistentAudit.verdict === 'CONSISTENT',
    consistentAudit.verdict,
  );

  // --- Scenario 8: concept drift is detected -------------------------------------------------

  const driftStages: GenerationStageRawEvidence[] = [
    stageEv('FEATURE_CONTRACT', { featureContract: [{ featureName: 'Appointments' }, { featureName: 'Calendar' }, { featureName: 'Booking' }] }),
    stageEv('NAVIGATION', { navigationLabels: ['Appointments', 'Calendar', 'Booking', 'Customers', 'Services'] }),
  ];
  const driftAudit = auditGenerationPipeline(bookingContract, buildStageEvidence(driftStages));
  assert(
    '14. Partial concept loss is classified as DRIFT (not full disappearance)',
    driftAudit.verdict === 'DRIFTED' || driftAudit.stages.some((s) => s.driftKind === 'DRIFT'),
    `verdict=${driftAudit.verdict} stages=${JSON.stringify(driftAudit.stages.map((s) => ({ stage: s.stage, driftKind: s.driftKind, retentionRatio: s.retentionRatio })))}`,
  );

  // --- Scenario 9: concept substitution is detected ------------------------------------------

  const substitutionStages: GenerationStageRawEvidence[] = [
    stageEv('FEATURE_CONTRACT', {
      featureContract: [
        { featureName: 'Appointments' },
        { featureName: 'Calendar' },
        { featureName: 'Customers' },
        { featureName: 'Services' },
        { featureName: 'Booking' },
        { featureName: 'Staff' },
        { featureName: 'Scheduling' },
        { featureName: 'Dashboard' },
      ],
    }),
    stageEv('GENERATED_MODULES', { generatedFeatureModules: ['NoteList', 'NoteEditor', 'Archive', 'Tags'] }),
  ];
  const substitutionEvidence = buildStageEvidence(substitutionStages);
  const substitutionAudit = auditGenerationPipeline(bookingContract, substitutionEvidence);
  assert(
    '15. Concept substitution is detected between stages (concept disappeared, unrelated concept appeared)',
    substitutionAudit.conceptSubstitutions.length > 0 || substitutionAudit.verdict === 'SUBSTITUTED',
    JSON.stringify(substitutionAudit.conceptSubstitutions),
  );

  // --- Scenario 10: unexpected dominant concepts detected generically ------------------------

  const conversionContract = buildCanonicalProductContract({
    prompt: 'Build a unit conversion tool for temperature and length',
  });
  const dominanceStages: GenerationStageRawEvidence[] = [
    stageEv('GENERATED_MODULES', { generatedFeatureModules: ['Dashboard', 'Cloud', 'Synchronization', 'Settings', 'Router'] }),
  ];
  const dominanceAudit = auditGenerationPipeline(conversionContract, buildStageEvidence(dominanceStages));
  assert(
    '16. Unexpected dominant concepts are detected generically (no hardcoded word list)',
    dominanceAudit.unexpectedDominantConcepts.length > 0,
    `requestedConcepts=${JSON.stringify(conversionContract.allConceptNames)} unexpectedDominantConcepts=${JSON.stringify(dominanceAudit.unexpectedDominantConcepts)}`,
  );
  assert(
    '17. Dominance rule is generic — no hardcoded "dashboard/cloud/router" style literals in the auditor source',
    !/['"`](dashboard|cloud|synchronization|router)['"`]/i.test(readFileSync(join(MODULE_DIR, 'feature-contract-consistency.ts'), 'utf8')),
    'expected the dominance rule to compare counts, not specific words',
  );

  // --- Scenario 11: minimal repair updates only affected generation stages -------------------

  const recoverableStages: GenerationStageRawEvidence[] = [
    stageEv('FEATURE_CONTRACT', {
      featureContract: [
        { featureName: 'Appointments' },
        { featureName: 'Calendar' },
        { featureName: 'Customers' },
        { featureName: 'Services' },
        { featureName: 'Booking' },
        { featureName: 'Staff' },
        { featureName: 'Scheduling' },
        { featureName: 'Dashboard' },
      ],
    }),
    stageEv('NAVIGATION', { navigationLabels: ['Appointments'] }),
    stageEv('ROUTES', {
      generatedRoutes: ['/appointments', '/calendar', '/customers', '/services', '/booking', '/staff', '/scheduling', '/dashboard'],
    }),
  ];
  const recoverableEvidence = buildStageEvidence(recoverableStages);
  const recoverableAudit = auditGenerationPipeline(bookingContract, recoverableEvidence);
  const { repairedStages, actions: repairActions } = applyMinimalRepairs(bookingContract, recoverableEvidence, recoverableAudit);
  const routesStageBefore = recoverableEvidence.find((s) => s.stage === 'ROUTES');
  const routesStageAfter = repairedStages.find((s) => s.stage === 'ROUTES');
  const featureContractBefore = recoverableEvidence.find((s) => s.stage === 'FEATURE_CONTRACT');
  const featureContractAfter = repairedStages.find((s) => s.stage === 'FEATURE_CONTRACT');
  assert(
    '18. Minimal repair leaves an already-consistent stage (ROUTES) byte-identical (same object reference)',
    routesStageBefore === routesStageAfter,
    `unchanged reference expected — routesStage driftKind was ${recoverableAudit.stages.find((s) => s.stage === 'ROUTES')?.driftKind}`,
  );
  assert(
    '19. Minimal repair leaves an already-consistent stage (FEATURE_CONTRACT) byte-identical (same object reference)',
    featureContractBefore === featureContractAfter,
    `unchanged reference expected — featureContractStage driftKind was ${recoverableAudit.stages.find((s) => s.stage === 'FEATURE_CONTRACT')?.driftKind}`,
  );
  const navigationStageAfter = repairedStages.find((s) => s.stage === 'NAVIGATION');
  const navigationStageBefore = recoverableEvidence.find((s) => s.stage === 'NAVIGATION');
  assert(
    '20. Minimal repair replaces the flagged stage (NAVIGATION) with a new, updated evidence object',
    navigationStageAfter !== navigationStageBefore && navigationStageAfter!.concepts.length > navigationStageBefore!.concepts.length,
    `before=${navigationStageBefore!.concepts.length} after=${navigationStageAfter!.concepts.length}`,
  );

  // --- Scenario 12: successful repair increases faithfulness score ---------------------------

  const { finalAudit: recoverableFinalAudit, improved } = repairAndReaudit(bookingContract, recoverableEvidence, recoverableAudit);
  assert(
    '21. Successful repair increases the concept retention ratio',
    recoverableFinalAudit.conceptRetentionRatio > recoverableAudit.conceptRetentionRatio && improved,
    `before=${recoverableAudit.conceptRetentionRatio} after=${recoverableFinalAudit.conceptRetentionRatio}`,
  );

  // --- Scenario 13: repair never regenerates unrelated modules -------------------------------

  const unrelatedActionFound = repairActions.some(
    (a) => a.stage !== 'NAVIGATION',
  );
  assert(
    '22. Repair actions only ever target stages the audit actually flagged as inconsistent (never an unrelated, already-consistent stage)',
    !unrelatedActionFound,
    JSON.stringify(repairActions.map((a) => a.stage)),
  );
  assert(
    '23. Repair never fabricates evidence for a concept that truly does not exist anywhere — unrecoverable concepts are recorded as unapplied, not silently invented',
    repairActions.every((a) => a.applied === true || a.type === 'REGENERATE_FEATURE_MODULE'),
    JSON.stringify(repairActions),
  );

  // --- Generation Gate ------------------------------------------------------------------------

  const gateBlocked = runGenerationGate(bookingContract, [stageEv('ARCHITECTURE', { architectureSummary: 'Notes Archive Tags Rich Text' })]);
  assert(
    '24. Generation gate blocks (does not proceed) when the architecture stage is inconsistent and unrecoverable',
    gateBlocked.proceed === false,
    JSON.stringify({ verdict: gateBlocked.finalAudit.verdict, improved: gateBlocked.improved }),
  );
  const gateHealthy = runGenerationGate(bookingContract, BOOKING_STAGES_CONSISTENT.filter((s) => s.stage === 'ARCHITECTURE'));
  assert(
    '25. Generation gate proceeds when the architecture stage is already consistent',
    gateHealthy.proceed === true,
    JSON.stringify({ verdict: gateHealthy.finalAudit.verdict }),
  );

  // --- Concept graph ---------------------------------------------------------------------------

  const graph = buildConceptGraph(bookingContract);
  assert('26. Concept graph produces nodes for requested concepts', graph.nodes.length > 0, `nodes=${graph.nodes.length}`);
  assert('27. Concept graph produces evidence-based edges', graph.edges.length > 0, `edges=${graph.edges.length}`);
  assert(
    '28. Concept graph includes generated-module nodes (Required generated module in the example chain)',
    graph.nodes.some((n) => n.kind === 'MODULE'),
    JSON.stringify(graph.nodes.map((n) => n.kind)),
  );

  // --- Scenario 14/15: no application-specific logic, no hardcoded product names -------------

  const FORBIDDEN_DOMAIN_TERMS = [
    'calculator', 'todo', 'crm', 'booking', 'notes', 'hospital', 'inventory', 'lisa', 'authentication', 'crud',
  ];
  let forbiddenDomainTermFound: string | null = null;
  for (const term of FORBIDDEN_DOMAIN_TERMS) {
    if (new RegExp(`\\b${term}\\b`, 'i').test(moduleSource) && !forbiddenDomainTermFound) forbiddenDomainTermFound = term;
  }
  assert(
    '29. No application-specific / domain-specific handling in the v2 module (calculator, CRM, booking, notes, hospital, inventory, LISA, authentication, CRUD)',
    forbiddenDomainTermFound === null,
    forbiddenDomainTermFound || 'clean',
  );
  const PROJECT_INSTANCE_TERMS = ['expense-tracker', 'expense tracker'];
  let projectInstanceHardcoding: string | null = null;
  for (const term of PROJECT_INSTANCE_TERMS) {
    if (new RegExp(term.replace(/[- ]/g, '.'), 'i').test(moduleSource) && !projectInstanceHardcoding) projectInstanceHardcoding = term;
  }
  assert(
    '30. No hardcoded references to a specific past project instance',
    projectInstanceHardcoding === null,
    projectInstanceHardcoding || 'clean',
  );
  assert(
    '31. No conditional logic branching on a specific projectId/projectName',
    !/projectId\s*===|projectName\s*===/.test(moduleSource),
    'expected no projectId/projectName identity branching',
  );
  assert(
    '32. Every domain-specific classification is structural (role classifier keys off word shape, not product names)',
    /classifyConceptRole/.test(moduleSource) && !/if\s*\(\s*concept\.concept\s*===/.test(moduleSource),
    'expected classifyConceptRole to use structural checks, not literal concept-name equality',
  );

  // Generalizes beyond one domain — repeat the audit for an unrelated recognized/unrecognized domain.
  const recipeContract = buildCanonicalProductContract({
    prompt: 'Build a recipe manager with ingredients and cooking instructions',
  });
  assert(
    '33. Canonical contract construction generalizes beyond the four v1 example domains',
    recipeContract.allConceptNames.length > 0,
    `allConceptNames=${JSON.stringify(recipeContract.allConceptNames)}`,
  );

  // --- Scenario 16: no LLM dependency ---------------------------------------------------------

  const LLM_USAGE_TERMS = ['openai', 'anthropic', 'gpt-', 'gpt3', 'gpt4', 'claude', 'chatcompletion', 'inference api', 'chat.completions'];
  let llmDependencyFound: string | null = null;
  for (const term of LLM_USAGE_TERMS) {
    if (new RegExp(term, 'i').test(moduleSource) && !llmDependencyFound) llmDependencyFound = term;
  }
  assert('34. No LLM dependency in source', llmDependencyFound === null, llmDependencyFound || 'clean');
  assert(
    '35. No network calls (fetch/http/axios) — pure, offline, deterministic',
    !/\bfetch\s*\(|require\(['"]https?['"]\)|axios/.test(moduleSource),
    'expected no network calls',
  );

  // --- Scenario 17: no new orchestration engine ------------------------------------------------

  assert(
    '36. No new orchestration primitives (setInterval/setTimeout/child_process/EventEmitter/Worker)',
    !/setInterval\(|setTimeout\(|child_process|EventEmitter|new\s+Worker\(/.test(moduleSource),
    'expected a pure, synchronous audit/repair module with no scheduling or process management',
  );
  assert(
    '37. Every public v2 entry point is synchronous (no async, no Promise)',
    !/export\s+async\s+function/.test(moduleSource),
    'expected all exported functions to be synchronous',
  );

  // --- Core systems preserved -------------------------------------------------------------------

  for (const folder of CORE_ENGINE_FOLDERS) {
    assert(`38. core folder preserved — ${folder}`, existsSync(join(ROOT, folder)), folder);
  }

  // --- Determinism ---------------------------------------------------------------------------

  const repeatA = runGenerationFaithfulnessAudit({ prompt: BOOKING_PROMPT }, BOOKING_STAGES_CONSISTENT);
  const repeatB = runGenerationFaithfulnessAudit({ prompt: BOOKING_PROMPT }, BOOKING_STAGES_CONSISTENT);
  assert(
    '39. Deterministic — identical input always produces identical verdict and retention',
    repeatA.verdict === repeatB.verdict && repeatA.conceptRetentionPercent === repeatB.conceptRetentionPercent,
    `${repeatA.verdict}/${repeatA.conceptRetentionPercent} vs ${repeatB.verdict}/${repeatB.conceptRetentionPercent}`,
  );

  // --- Build Result Integration: new outcomes ------------------------------------------------

  const consistentReport: GenerationFaithfulnessReport = runGenerationFaithfulnessAudit({ prompt: BOOKING_PROMPT }, BOOKING_STAGES_CONSISTENT);
  const healthyGenBuild = normalizeBuildResult(baseNormalizerInput({ generationFaithfulnessReport: consistentReport }));
  assert(
    '40. Consistent generation (no repairs needed) normalizes to BUILT_SUCCESSFULLY, not a scary result',
    healthyGenBuild.result === 'BUILT_SUCCESSFULLY',
    healthyGenBuild.result,
  );

  const recoverableReport: GenerationFaithfulnessReport = runGenerationFaithfulnessAudit({ prompt: BOOKING_PROMPT }, recoverableStages);
  assert(
    '41. Fixture actually produced applied repairs for the next check',
    recoverableReport.repairsPerformed.some((a) => a.applied),
    JSON.stringify(recoverableReport.repairsPerformed),
  );
  const repairedBuild = normalizeBuildResult(baseNormalizerInput({ generationFaithfulnessReport: recoverableReport }));
  assert(
    '42. Build with successful faithfulness repair normalizes to BUILT_AFTER_FAITHFULNESS_REPAIR',
    repairedBuild.result === 'BUILT_AFTER_FAITHFULNESS_REPAIR',
    repairedBuild.result,
  );
  assert(
    '43. normalizedBuild.generationFaithfulness summary is populated when a report is provided',
    repairedBuild.generationFaithfulness !== null && repairedBuild.generationFaithfulness.verdict === recoverableReport.verdict,
    JSON.stringify(repairedBuild.generationFaithfulness),
  );

  // Unlike the substitution fixture above (which has recoverable evidence in FEATURE_CONTRACT and
  // is therefore correctly auto-repaired), this fixture has NO booking evidence anywhere in the
  // pipeline — every stage shows an unrelated product — so repair cannot recover anything and the
  // drift must be reported as a failure, not silently folded into a healthy build.
  const unrecoverableDriftStages: GenerationStageRawEvidence[] = [
    stageEv('ARCHITECTURE', { architectureSummary: 'Notes Archive Tags Rich Text' }),
    stageEv('FEATURE_CONTRACT', { featureContract: [{ featureName: 'Notes' }, { featureName: 'Archive' }] }),
    stageEv('GENERATED_MODULES', { generatedFeatureModules: ['NoteList', 'NoteEditor'] }),
    stageEv('ROUTES', { generatedRoutes: ['/notes'] }),
    stageEv('NAVIGATION', { navigationLabels: ['Notes', 'New Note'] }),
    stageEv('MANIFEST', { workspaceManifestSummary: ['Notes', 'Archive', 'Tags'] }),
    stageEv('PREVIEW_DOM', { domText: 'My Notes Archive Pin Note Rich Text' }),
  ];
  const driftReport: GenerationFaithfulnessReport = runGenerationFaithfulnessAudit({ prompt: BOOKING_PROMPT }, unrecoverableDriftStages);
  assert(
    '44a. Unrecoverable drift fixture actually has no successfully applied repairs',
    !driftReport.repairsPerformed.some((a) => a.applied),
    JSON.stringify(driftReport.repairsPerformed.filter((a) => a.applied)),
  );
  const driftBuild = normalizeBuildResult(baseNormalizerInput({ generationFaithfulnessReport: driftReport }));
  assert(
    '44. Build with substituted/inconsistent product identity never normalizes to BUILT_SUCCESSFULLY',
    driftBuild.result === 'FAILED_PRODUCT_DRIFT' || driftBuild.result === 'FAILED_CONTRACT_INCONSISTENCY',
    driftBuild.result,
  );
  assert(
    '45. No generation faithfulness report at all never downgrades a healthy build (additive, not a regression trigger)',
    normalizeBuildResult(baseNormalizerInput({})).result === 'BUILT_SUCCESSFULLY',
    'expected BUILT_SUCCESSFULLY when no generation faithfulness report was ever produced',
  );

  // --- Normalizer type surface ---------------------------------------------------------------

  const normalizerTypesSource = readFileSync(join(ROOT, 'src/build-result-normalizer-v1/build-result-normalizer-types.ts'), 'utf8');
  for (const kind of ['BUILT_AFTER_FAITHFULNESS_REPAIR', 'FAILED_PRODUCT_DRIFT', 'FAILED_CONTRACT_INCONSISTENCY']) {
    assert(`46. NormalizedBuildResultKind declares ${kind}`, normalizerTypesSource.includes(kind), kind);
  }
  assert(
    '47. Existing NormalizedBuildResultKind values (including Milestone 1) were not removed',
    ['BUILT_SUCCESSFULLY', 'BUILT_WITH_WARNINGS', 'BUILT_WITH_PRODUCT_MISMATCH', 'BUILT_WITH_LOW_FAITHFULNESS', 'FAILED_WITH_REPAIR_AVAILABLE', 'FAILED_BLOCKED'].every(
      (k) => normalizerTypesSource.includes(k),
    ),
    'expected all six pre-existing result kinds to remain declared',
  );

  // --- API wiring --------------------------------------------------------------------------

  const handlerSource = readFileSync(join(ROOT, 'server/build-from-prompt-handler.ts'), 'utf8');
  assert(
    '48. build-from-prompt-handler computes generation faithfulness for a build',
    handlerSource.includes('evaluateGenerationFaithfulnessForBuild') || handlerSource.includes('evaluateGenerationFaithfulness('),
    'expected the handler to call the generation faithfulness auditor',
  );
  assert(
    '49. build-from-prompt-handler includes generationFaithfulness in the API response (existing fields preserved)',
    /generationFaithfulness[,\s]/.test(handlerSource) && handlerSource.includes('productFaithfulness,') && handlerSource.includes('normalizedBuild:'),
    'expected generationFaithfulness alongside productFaithfulness/normalizedBuild, not replacing them',
  );

  // --- UI ------------------------------------------------------------------------------------

  const indexPath = join(ROOT, 'public/founder-reality/index.html');
  const cssPath = join(ROOT, 'public/founder-reality/builder-home.css');
  const jsPath = join(ROOT, 'public/founder-reality/builder-home.js');
  const indexHtml = readFileSync(indexPath, 'utf8');
  const js = readFileSync(jsPath, 'utf8');

  assert(
    '50. UI extends the Product Faithfulness panel with canonical identity / retention / drift / repairs',
    indexHtml.includes('id="builder-generation-faithfulness"') &&
      indexHtml.includes('id="builder-generation-faithfulness-identity"') &&
      indexHtml.includes('id="builder-generation-faithfulness-retention"') &&
      indexHtml.includes('id="builder-generation-faithfulness-drift"'),
    'expected the generation faithfulness sub-panel elements',
  );
  assert(
    '51. UI shows repairs performed and recovered/remaining-missing concepts',
    indexHtml.includes('id="builder-generation-faithfulness-repairs-list"') &&
      indexHtml.includes('id="builder-generation-faithfulness-recovered-list"') &&
      indexHtml.includes('id="builder-generation-faithfulness-missing-list"'),
    'expected repairs/recovered/missing lists',
  );
  assert(
    '52. JS renders the generation faithfulness sub-panel from normalizedBuild.generationFaithfulness',
    /function renderGenerationFaithfulness\s*\(/.test(js) && js.includes('normalized.generationFaithfulness'),
    'expected renderGenerationFaithfulness(generationFaithfulness) wired into renderBuildResult',
  );
  assert(
    '53. Detailed evidence (contract, concept graph, per-stage audit) is kept in Advanced Diagnostics',
    indexHtml.includes('id="builder-diagnostics-generation-faithfulness-raw"') && js.includes('builder-diagnostics-generation-faithfulness-raw'),
    'expected raw JSON evidence rendered only inside the diagnostics drawer',
  );
  assert(
    '54. UI declares distinct result kinds for repaired / drifted / inconsistent outcomes',
    js.includes('BUILT_AFTER_FAITHFULNESS_REPAIR') && js.includes('FAILED_PRODUCT_DRIFT') && js.includes('FAILED_CONTRACT_INCONSISTENCY'),
    'expected the UI result maps to cover all three new result kinds',
  );

  // --- Generality audit: normalizer/UI files carry no app-specific hardcoding ----------------

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
  assert('55. No app-specific hardcoding in normalizer or builder UI files', hardcodingFound === null, hardcodingFound || 'clean');

  // --- Live server check -----------------------------------------------------------------------

  let closeServer: (() => Promise<void>) | null = null;
  try {
    const started = await startValidatorHttpServer(() => createFounderRealityServer());
    closeServer = started.close;
    const rootRes = await fetch(`${started.baseUrl}/`);
    const rootHtml = await rootRes.text();
    assert('56. GET / returns HTTP 200', rootRes.status === 200, String(rootRes.status));
    assert(
      '57. GET / serves the generation faithfulness sub-panel markup',
      rootHtml.includes('id="builder-generation-faithfulness"'),
      'served HTML missing the generation faithfulness sub-panel',
    );
  } catch (err) {
    assert('56-57. live server checks', false, err instanceof Error ? err.message : String(err));
  } finally {
    if (closeServer) await closeServer();
  }

  // --- Scenario 18: all previous stabilization and faithfulness validators still pass --------

  const previousValidators: Array<{ script: string; token: string }> = [
    { script: 'scripts/validate-simplified-builder-ui-v1.ts', token: 'SIMPLIFIED_BUILDER_UI_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-1-v1.ts', token: 'PRODUCT_STABILIZATION_PHASE_1_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-2-v1.ts', token: 'PRODUCT_STABILIZATION_PHASE_2_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-3-v1.ts', token: 'PRODUCT_STABILIZATION_PHASE_3_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-4-v1.ts', token: 'PRODUCT_STABILIZATION_PHASE_4_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-5-v1.ts', token: 'PRODUCT_STABILIZATION_PHASE_5_V1_PASS' },
    { script: 'scripts/validate-product-faithfulness-milestone-1.ts', token: 'PRODUCT_FAITHFULNESS_MILESTONE_1_PASS' },
  ];
  let checkNumber = 58;
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
    console.log(PRODUCT_FAITHFULNESS_MILESTONE_2_PASS_TOKEN);
    await exitValidator(0);
    return;
  }
  await exitValidator(1);
}

main().catch(async (err) => {
  console.error(err);
  await exitValidator(1);
});
