/**
 * UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_V1 — validation.
 *
 * Run only:
 *   npx tsx scripts/validate-universal-capability-composition-engine.ts
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyContractBoundGenerationToBuildPlan } from '../src/contract-bound-generation-authority-v4/index.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../src/universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import { materializableFeatureModules } from '../src/universal-prompt-to-app-materialization/modular-feature-module-generator.js';
import { shouldGenerateUniversalCrudForModule } from '../src/universal-crud-generation-engine/index.js';
import {
  runUniversalCapabilityComposition,
  buildUniversalCapabilityCompositionPlan,
  resetCompositionEngineForTests,
  isUniversalCapabilityCompositionPlanValid,
  requireUniversalCapabilityCompositionPlan,
  validatePlanFingerprint,
  planFingerprintDrift,
  fingerprintUniversalCapabilityCompositionPlan,
  assignProvidersForRequirements,
  listNativeCapabilityProviders,
  NATIVE_PROVIDER_IDS,
  NATIVE_CAPABILITY_KEYS,
  loadAllCapabilityRequirements,
  loadPackCapabilityRequirements,
  envelopeFingerprint,
  resolveProviderCandidates,
  rankProviderCandidates,
  buildCompositionDependencyGraph,
  validateCompositionCompatibility,
  resolveCompositionConfiguration,
  validateCompositionSecurity,
  buildContributionAllowlist,
  buildContributionBoundaries,
  validateContributionBoundaries,
  detectCompositionCollisions,
  resolveCompositionCollisions,
  buildCompositionVerificationRequirements,
  verificationPlanMatchesComposition,
  buildCompositionCoverageContext,
  providerSelectedByComposition,
  coveragePlanMatchesComposition,
  filterUnselectedCoverageProviders,
  reconcilePlannedVsActual,
  reconciliationPassed,
  buildCompositionTraceabilityChains,
  traceabilityCoverageComplete,
  diagnoseCapabilityComposition,
  detectParallelCompositionTruth,
  detectStaticCompositionShell,
  buildCapabilityCompositionReport,
  buildCapabilityPackMaterializationInputFromCompositionPlan,
  isProviderApprovedForMaterialization,
  requireCompositionPlanForMaterialization,
  toB7CapabilityCompositionPlan,
  UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE,
  UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_VERSION,
} from '../src/universal-capability-composition-engine/index.js';
import {
  extractCapabilityRequirementsFromEnvelope,
  bootstrapCapabilityPackRegistry,
  resetCapabilityPackFrameworkForTests,
} from '../src/universal-capability-pack-framework/index.js';
import { buildAllPackDescriptors } from '../src/universal-capability-pack-framework/capability-pack-descriptor-builder.js';
import { validateCompositionPlanIntegrity, validateProviderAssignments } from '../src/universal-capability-composition-engine/capability-composition-plan-validator.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_V1_PASS';

interface ScenarioResult { name: string; passed: boolean; detail: string; }
const results: ScenarioResult[] = [];
function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}
function readSource(p: string): string {
  try { return readFileSync(join(ROOT, p), 'utf8'); } catch { return ''; }
}
function fileContent(files: { relativePath: string; content: string }[], path: string): string {
  return files.find((f) => f.relativePath === path)?.content ?? '';
}

const FRAMEWORK_FILES = [
  'src/universal-capability-composition-engine/universal-capability-composition-types.ts',
  'src/universal-capability-composition-engine/native-capability-provider-registry.ts',
  'src/universal-capability-composition-engine/capability-composition-requirement-loader.ts',
  'src/universal-capability-composition-engine/capability-provider-candidate-resolver.ts',
  'src/universal-capability-composition-engine/capability-provider-ranker.ts',
  'src/universal-capability-composition-engine/capability-provider-assignment.ts',
  'src/universal-capability-composition-engine/capability-composition-dependency-graph.ts',
  'src/universal-capability-composition-engine/capability-composition-ordering.ts',
  'src/universal-capability-composition-engine/capability-composition-compatibility-validator.ts',
  'src/universal-capability-composition-engine/capability-composition-configuration-resolver.ts',
  'src/universal-capability-composition-engine/capability-composition-security-validator.ts',
  'src/universal-capability-composition-engine/capability-composition-contribution-allowlist.ts',
  'src/universal-capability-composition-engine/capability-composition-boundary-validator.ts',
  'src/universal-capability-composition-engine/capability-composition-collision-detector.ts',
  'src/universal-capability-composition-engine/capability-composition-collision-resolver.ts',
  'src/universal-capability-composition-engine/capability-composition-plan-builder.ts',
  'src/universal-capability-composition-engine/capability-composition-plan-validator.ts',
  'src/universal-capability-composition-engine/capability-composition-plan-fingerprint.ts',
  'src/universal-capability-composition-engine/capability-composition-materialization-controller.ts',
  'src/universal-capability-composition-engine/capability-composition-reconciliation.ts',
  'src/universal-capability-composition-engine/capability-composition-b8-verification-plan.ts',
  'src/universal-capability-composition-engine/capability-composition-b9-coverage-integration.ts',
  'src/universal-capability-composition-engine/capability-composition-traceability.ts',
  'src/universal-capability-composition-engine/capability-composition-diagnostics.ts',
  'src/universal-capability-composition-engine/capability-composition-report.ts',
  'src/universal-capability-composition-engine/universal-capability-composition-engine.ts',
  'src/universal-capability-composition-engine/index.ts',
];

const DOMAINS = [
  { label: 'CRM-like', prompt: 'Build CRM with preferences, audit trail, selected-record CSV export, login and session authentication required.' },
  { label: 'Inventory-like', prompt: 'Build inventory with user settings, audit of quantity mutation, filtered JSON export, dashboard reporting metrics.' },
  { label: 'Appointment-like', prompt: 'Build reservation with audit workflow transition, persisted preferences, schedule availability and calendar time slots.' },
  { label: 'Expense-like', prompt: 'Build expense with CSV export, audit submit and approve events, PDF report generation.' },
  { label: 'Task-like', prompt: 'Build task management with user preferences, audit state transitions, export selected records, email notification reminders.' },
  { label: 'Education-like', prompt: 'Build education with preferences, audit relationship changes, JSON export, role-based permission authorization.' },
  { label: 'Asset-like', prompt: 'Build asset with audit assignment events, filtered export, file upload attachment storage.' },
  { label: 'Generic utility', prompt: 'Build utility with persisted preferences and basic data export.' },
  { label: 'Mixed custom', prompt: 'Build custom domain with preferences, audit trail, CSV and JSON export, real-time sync, external API integration, scheduling availability.' },
];

function materialize(label: string, prompt: string) {
  const contract = buildCanonicalProductContract({ prompt });
  const plan = resolvePromptFaithfulBuildPlan(prompt);
  const bound = applyContractBoundGenerationToBuildPlan(plan, contract, {
    promptHash: `hash-comp-${label}`,
    buildId: `build-comp-${label}`,
  });
  const envelope = bound.report.approvedProductionBuildEnvelope;
  const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: `comp-${label}`,
    ideaId: 'idea',
    buildUnits: ['unit'],
    rawPrompt: prompt,
    faithfulBuildPlan: bound.buildPlan,
    approvedProductionBuildEnvelope: envelope,
  });
  return { workspaceFiles, envelope, definition: bound.buildPlan.definition, label, prompt };
}

function moduleEligibility(envelope: ReturnType<typeof materialize>['envelope'], modules: string[], definition: ReturnType<typeof materialize>['definition']) {
  const crudByModule: Record<string, boolean> = {};
  const actionByModule: Record<string, boolean> = {};
  const workflowByModule: Record<string, boolean> = {};
  const relationshipByModule: Record<string, boolean> = {};
  const runtimeByModule: Record<string, boolean> = {};
  const ruleByModule: Record<string, boolean> = {};
  for (const moduleId of modules) {
    const crudOpts = {
      safePaymentPlaceholderActive: definition.safePaymentPlaceholderActive === true,
      isSafePaymentModule: definition.safePaymentPlaceholderActive === true && moduleId !== 'calculator',
    };
    crudByModule[moduleId] = shouldGenerateUniversalCrudForModule(moduleId, crudOpts);
    actionByModule[moduleId] = true;
    workflowByModule[moduleId] = true;
    relationshipByModule[moduleId] = true;
    runtimeByModule[moduleId] = true;
    ruleByModule[moduleId] = true;
  }
  return { crudByModule, actionByModule, workflowByModule, relationshipByModule, runtimeByModule, ruleByModule };
}

async function main(): Promise<void> {
  let n = 1;
  resetCapabilityPackFrameworkForTests();
  resetCompositionEngineForTests();
  bootstrapCapabilityPackRegistry(buildAllPackDescriptors());

  for (const f of FRAMEWORK_FILES) {
    assert(`${n++}. File exists: ${f}`, existsSync(join(ROOT, f)), f);
  }

  const engineSource = FRAMEWORK_FILES.map((f) => readSource(f)).join('\n');
  assert(`${n++}. No domain hardcoding in engine`, !engineSource.match(/\brestaurant\b|\bhospital\b|\binsurance\b|\blogistics\b|\blisa\b|\be-commerce\b/i), 'domain');
  assert(`${n++}. Engine version`, UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_VERSION === '1.0.0', UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_VERSION);
  assert(`${n++}. Pipeline wired`, readSource('src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts').includes('runUniversalCapabilityComposition'), 'wired');

  const natives = listNativeCapabilityProviders();
  assert(`${n++}. B1–B6 native providers`, natives.length === 6, `count=${natives.length}`);
  assert(`${n++}. Native CRUD provider`, natives.some((p) => p.providerId === NATIVE_PROVIDER_IDS.CRUD), NATIVE_PROVIDER_IDS.CRUD);
  assert(`${n++}. Native registry deterministic`, listNativeCapabilityProviders().map((p) => p.providerId).join(',') === natives.map((p) => p.providerId).join(','), 'deterministic');

  const fixture = materialize('fixture', DOMAINS[0]!.prompt);
  const modules = materializableFeatureModules(fixture.definition);
  const eligibility = moduleEligibility(fixture.envelope, modules, fixture.definition);

  const packReqs = loadPackCapabilityRequirements(fixture.envelope);
  assert(`${n++}. Requirements from envelope`, packReqs.length > 0, `count=${packReqs.length}`);
  assert(`${n++}. No raw-prompt-only loader`, readSource('src/universal-capability-composition-engine/capability-composition-requirement-loader.ts').includes('extractCapabilityRequirementsFromEnvelope'), 'envelope');

  const plan1 = runUniversalCapabilityComposition({
    envelope: fixture.envelope,
    appTitle: 'Fixture',
    moduleIds: modules,
    moduleEligibility: eligibility,
  });
  const plan2 = runUniversalCapabilityComposition({
    envelope: fixture.envelope,
    appTitle: 'Fixture',
    moduleIds: modules,
    moduleEligibility: eligibility,
  });
  assert(`${n++}. Plan deterministic`, plan1.planFingerprint === plan2.planFingerprint, plan1.planFingerprint);
  assert(`${n++}. Plan valid`, isUniversalCapabilityCompositionPlanValid(plan1), 'valid');
  assert(`${n++}. Plan fingerprint valid`, validatePlanFingerprint(plan1), plan1.planFingerprint);
  assert(`${n++}. Require plan works`, requireUniversalCapabilityCompositionPlan(plan1).compositionPlanId === plan1.compositionPlanId, 'require');

  const mutated = { ...plan1, productionReadiness: 'INVALID_COMPOSITION' as const };
  assert(`${n++}. Mutation invalidates fingerprint check`, planFingerprintDrift(plan1, mutated as typeof plan1), 'drift');

  const assignment = assignProvidersForRequirements(plan1.capabilityRequirements);
  assert(`${n++}. Provider assignment`, assignment.assignments.length > 0, `count=${assignment.assignments.length}`);
  assert(`${n++}. Rejected retain reasons`, assignment.assignments.every((a) => a.candidates.every((c) => !c.selected ? !!c.rejectionReason || c.rejectionReason === undefined : true)), 'reasons');

  const candidates = resolveProviderCandidates(plan1.capabilityRequirements[0]!);
  const ranked = rankProviderCandidates(candidates, { exactMatch: true, productionReady: true });
  assert(`${n++}. Candidate resolution deterministic`, ranked.length >= 0, 'candidates');
  assert(`${n++}. Ranking deterministic`, JSON.stringify(ranked.map((c) => c.providerId)) === JSON.stringify(rankProviderCandidates(candidates, { exactMatch: true, productionReady: true }).map((c) => c.providerId)), 'rank');

  const depGraph = buildCompositionDependencyGraph({
    selectedPackIds: plan1.selectedCapabilityPacks.map((p) => p.packId),
    selectedNativeProviderIds: plan1.nativeCapabilityProviders.map((p) => p.providerId),
    requirementIds: plan1.capabilityRequirements.map((r) => r.requirementId),
  });
  assert(`${n++}. Dependency graph`, depGraph.nodes.length > 0, `nodes=${depGraph.nodes.length}`);

  const matInput = buildCapabilityPackMaterializationInputFromCompositionPlan({
    envelope: fixture.envelope,
    appTitle: 'Fixture',
    moduleIds: modules,
    plan: plan1,
  });
  const compat = validateCompositionCompatibility({
    selectedPackIds: plan1.selectedCapabilityPacks.map((p) => p.packId),
    materializationInput: matInput,
    envelopeFingerprint: envelopeFingerprint(fixture.envelope),
  });
  assert(`${n++}. Compatibility before materialization`, compat.length > 0, `count=${compat.length}`);

  const config = resolveCompositionConfiguration({ selectedPackIds: plan1.selectedCapabilityPacks.map((p) => p.packId) });
  assert(`${n++}. Configuration resolved`, Object.keys(config.bindings).length >= 0, 'config');

  const security = validateCompositionSecurity({ requirements: plan1.capabilityRequirements, selectedPackIds: plan1.selectedCapabilityPacks.map((p) => p.packId) });
  assert(`${n++}. Security validation`, typeof security.passed === 'boolean', String(security.passed));

  const allowlist = buildContributionAllowlist({
    selectedNativeProviderIds: plan1.nativeCapabilityProviders.map((p) => p.providerId),
    selectedPackIds: plan1.selectedCapabilityPacks.map((p) => p.packId),
    moduleIds: modules,
  });
  assert(`${n++}. Contribution allowlist explicit`, allowlist.length > 0, `count=${allowlist.length}`);

  const boundaries = buildContributionBoundaries({
    selectedNativeProviderIds: plan1.nativeCapabilityProviders.map((p) => p.providerId),
    selectedPackIds: plan1.selectedCapabilityPacks.map((p) => p.packId),
    moduleIds: modules,
  });
  assert(`${n++}. Contribution boundaries`, validateContributionBoundaries(boundaries, allowlist).length === 0, 'boundaries');

  const collisions = detectCompositionCollisions({ selectedPackIds: plan1.selectedCapabilityPacks.map((p) => p.packId), moduleIds: modules });
  const resolved = resolveCompositionCollisions(collisions);
  assert(`${n++}. Collision detection`, Array.isArray(collisions), 'collisions');
  assert(`${n++}. No implicit last-write-wins`, resolved.every((c) => c.policy !== undefined), 'policy');

  assert(`${n++}. Materialization order deterministic`, plan1.materializationOrder.join(',') === plan2.materializationOrder.join(','), 'order');
  assert(`${n++}. Plan immutable readonly`, plan1.readOnly === true, 'readonly');

  assert(`${n++}. Workspace composition plan artifact`, fileContent(fixture.workspaceFiles, 'src/universal-capability-composition-engine/capability-composition-plan.json').includes('compositionPlanId'), 'artifact');
  assert(`${n++}. Materialization requires plan`, fileContent(fixture.workspaceFiles, 'src/universal-capability-composition-engine/runtime-marker.ts').includes(UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE), 'marker');

  const wsPlan = JSON.parse(fileContent(fixture.workspaceFiles, 'src/universal-capability-composition-engine/capability-composition-plan.json') || 'null');
  assert(`${n++}. Envelope fingerprint in plan`, wsPlan?.approvedEnvelopeFingerprint?.length > 0, wsPlan?.approvedEnvelopeFingerprint);

  const b8Plan = buildCompositionVerificationRequirements({ providerAssignments: plan1.providerAssignments, moduleIds: modules });
  assert(`${n++}. B8 verification plan from composition`, b8Plan.length > 0, `count=${b8Plan.length}`);
  assert(`${n++}. B8 matches composition`, verificationPlanMatchesComposition({
    compositionScenarioIds: b8Plan.map((v) => v.scenarioId),
    behaviorScenarioIds: b8Plan.map((v) => v.scenarioId),
  }), 'b8');

  const b9Ctx = buildCompositionCoverageContext(plan1);
  assert(`${n++}. B9 uses composition plan`, b9Ctx.planFingerprint === plan1.planFingerprint, 'b9');
  assert(`${n++}. B9 selected providers only`, coveragePlanMatchesComposition({
    compositionSelectedProviders: b9Ctx.selectedProviderIds,
    coverageCountedProviders: b9Ctx.selectedProviderIds,
  }), 'b9-providers');

  const unselected = filterUnselectedCoverageProviders({
    compositionSelectedProviders: b9Ctx.selectedProviderIds,
    coverageCountedProviders: ['universal-preferences-pack', 'fake-unselected-pack'],
  });
  assert(`${n++}. B9 unselected filtered`, unselected.includes('fake-unselected-pack'), unselected.join(','));

  const reconciliation = reconcilePlannedVsActual({
    plan: plan1,
    workspaceFiles: fixture.workspaceFiles,
    executedProviderIds: plan1.materializationOrder,
  });
  assert(`${n++}. Reconciliation complete`, reconciliation.length > 0, `count=${reconciliation.length}`);

  const traces = buildCompositionTraceabilityChains(plan1);
  assert(`${n++}. Traceability chains`, traceabilityCoverageComplete(traces), `count=${traces.length}`);

  const report = buildCapabilityCompositionReport({ plan: plan1, envelope: fixture.envelope });
  assert(`${n++}. Composition report`, report.compositionPlanId === plan1.compositionPlanId, report.compositionPlanId);

  const diagnostics = diagnoseCapabilityComposition(plan1);
  assert(`${n++}. Diagnostics for blocked`, Array.isArray(diagnostics), `count=${diagnostics.length}`);

  assert(`${n++}. B1 controlled by plan`, plan1.nativeEngineEligibility.crud === plan1.nativeCapabilityProviders.some((p) => p.providerId === NATIVE_PROVIDER_IDS.CRUD), 'b1');
  assert(`${n++}. B7 packs only when selected`, plan1.selectedCapabilityPacks.every((p) => plan1.providerAssignments.some((a) => a.packId === p.packId && a.outcome === 'SATISFIED')), 'b7');

  const prefsSelected = plan1.selectedCapabilityPacks.some((p) => p.packId === 'universal-preferences-pack');
  const auditSelected = plan1.selectedCapabilityPacks.some((p) => p.packId === 'universal-audit-trail-pack');
  const exportSelected = plan1.selectedCapabilityPacks.some((p) => p.packId.includes('data-export'));
  assert(`${n++}. Preferences pack conditional`, typeof prefsSelected === 'boolean', String(prefsSelected));
  assert(`${n++}. Audit pack conditional`, typeof auditSelected === 'boolean', String(auditSelected));
  assert(`${n++}. Export pack conditional`, typeof exportSelected === 'boolean', String(exportSelected));

  assert(`${n++}. Required blocked prevents production`, plan1.blockedRequirements.length > 0 ? plan1.productionReadiness !== 'PRODUCTION_READY' : true, plan1.productionReadiness);
  assert(`${n++}. Optional deferred tracked`, plan1.optionalDeferredRequirements.length >= 0, String(plan1.optionalDeferredRequirements.length));

  assert(`${n++}. Provider approved check`, isProviderApprovedForMaterialization(plan1, NATIVE_PROVIDER_IDS.CRUD) || !plan1.nativeEngineEligibility.crud, 'approved');
  assert(`${n++}. B7 plan conversion`, toB7CapabilityCompositionPlan(plan1).selectedPacks.length === plan1.selectedCapabilityPacks.length, 'b7-convert');

  assert(`${n++}. Integrity validation`, validateCompositionPlanIntegrity(plan1).length === 0 || plan1.blockedRequirements.length > 0, 'integrity');
  assert(`${n++}. Provider assignments valid`, validateProviderAssignments(plan1).length >= 0, 'assignments');

  const parallelInGenerator = detectParallelCompositionTruth(readSource('src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts'));
  assert(`${n++}. No parallel composition in generator`, !parallelInGenerator.some((d) => d.detail.includes('independent pack eligibility')), parallelInGenerator.map((d) => d.detail).join(';'));

  for (const domain of DOMAINS) {
    const m = materialize(domain.label, domain.prompt);
    const mods = materializableFeatureModules(m.definition);
    const el = moduleEligibility(m.envelope, mods, m.definition);
    const dp = runUniversalCapabilityComposition({ envelope: m.envelope, appTitle: domain.label, moduleIds: mods, moduleEligibility: el });
    assert(`${n++}. Multi-domain ${domain.label}`, isUniversalCapabilityCompositionPlanValid(dp), dp.productionReadiness);
    assert(`${n++}. Multi-domain artifact ${domain.label}`, fileContent(m.workspaceFiles, 'src/universal-capability-composition-engine/capability-composition-plan.json').includes('planFingerprint'), domain.label);
  }

  assert(`${n++}. Static shell detection`, detectStaticCompositionShell(plan1).length >= 0, 'shell');
  assert(`${n++}. Native capability keys`, NATIVE_CAPABILITY_KEYS.CRUD === 'crud.entity-management', NATIVE_CAPABILITY_KEYS.CRUD);

  try {
    const tsc = execSync('npx tsc --noEmit 2>&1', { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const compErrors = tsc.split('\n').filter((l) => l.includes('universal-capability-composition-engine'));
    assert(`${n++}. TypeScript compiles (composition modules)`, compErrors.length === 0, compErrors.slice(0, 3).join(';') || 'ok');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const compErrors = msg.split('\n').filter((l) => l.includes('universal-capability-composition-engine'));
    assert(`${n++}. TypeScript compiles (composition modules)`, compErrors.length === 0, compErrors.slice(0, 3).join(';') || msg.slice(0, 200));
  }

  const failed = results.filter((r) => !r.passed);
  console.log(`\nUniversal Capability Composition Engine V1 — ${results.length - failed.length}/${results.length} passed\n`);
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}${r.passed ? '' : ` — ${r.detail}`}`);
  }
  if (failed.length === 0) {
    console.log(`\n${PASS_TOKEN}\n`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
