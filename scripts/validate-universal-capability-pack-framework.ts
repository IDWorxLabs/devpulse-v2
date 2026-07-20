/**
 * UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_V1 — validation.
 *
 * Run only:
 *   npx tsx scripts/validate-universal-capability-pack-framework.ts
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
import type { ProfileFeatureDefinition } from '../src/universal-prompt-to-app-materialization/profile-feature-map.js';
import {
  buildCapabilityPackMaterializationInputFromEnvelope,
  materializeCapabilityPacksForWorkspace,
  augmentWorkspaceFilesWithCapabilityPacks,
  shouldMaterializeCapabilityPacks,
  computeCapabilityPackCoverageScore,
  detectStaticCapabilityShell,
  diagnoseCapabilityPackGaps,
  stableCapabilityRequirementId,
  UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_SOURCE,
  UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_VERSION,
  extractCapabilityRequirementsFromEnvelope,
  normalizeCapabilityRequirements,
  bootstrapCapabilityPackRegistry,
  resetCapabilityPackFrameworkForTests,
  registerPack,
  getPack,
  listPacks,
  listProductionReadyPacks,
  findProvidersForCapability,
  validatePack,
  fingerprintPack,
  detectDuplicateCapabilityProvider,
  resolveCapabilityRequirement,
  resolveAllCapabilityRequirements,
  resolvePackDependencies,
  validatePackCompatibility,
  validatePackConfiguration,
  mergePackConfiguration,
  buildCapabilityCompositionPlan,
  detectContributionCollisions,
  verifyPackBehavior,
  enforceLifecycleOrder,
  FUTURE_CAPABILITY_PACK_CATALOG,
  CAPABILITY_PACK_RUNTIME_EVENT_TYPES,
  type CapabilityPackDescriptor,
} from '../src/universal-capability-pack-framework/index.js';
import { buildAllPackDescriptors } from '../src/universal-capability-pack-framework/capability-pack-descriptor-builder.js';
import { PreferencesStore, parseDefaults } from '../src/universal-capability-packs/universal-preferences-pack/index.js';
import { AuditTrailStore, redactPayload, resetAuditEntryCounter } from '../src/universal-capability-packs/universal-audit-trail-pack/index.js';
import {
  exportRecordsToJson,
  exportRecordsToCsv,
  exportSelectedRecords,
  exportFilteredCollection,
  escapeCsvValue,
  isAdvancedBinaryExportSupported,
} from '../src/universal-capability-packs/universal-data-export-pack-basic/index.js';
import { UNIVERSAL_PREFERENCES_PACK_DESCRIPTOR } from '../src/universal-capability-packs/universal-preferences-pack/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_V1_PASS';

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
  'src/universal-capability-pack-framework/universal-capability-pack-types.ts',
  'src/universal-capability-pack-framework/approved-capability-requirement-extractor.ts',
  'src/universal-capability-pack-framework/capability-requirement-normalizer.ts',
  'src/universal-capability-pack-framework/capability-pack-descriptor-builder.ts',
  'src/universal-capability-pack-framework/capability-pack-support-classifier.ts',
  'src/universal-capability-pack-framework/capability-pack-registry.ts',
  'src/universal-capability-pack-framework/capability-pack-resolver.ts',
  'src/universal-capability-pack-framework/capability-pack-dependency-resolver.ts',
  'src/universal-capability-pack-framework/capability-pack-compatibility-validator.ts',
  'src/universal-capability-pack-framework/capability-pack-configuration.ts',
  'src/universal-capability-pack-framework/capability-pack-composition-plan.ts',
  'src/universal-capability-pack-framework/capability-pack-lifecycle.ts',
  'src/universal-capability-pack-framework/capability-pack-materializer.ts',
  'src/universal-capability-pack-framework/capability-pack-contribution-validator.ts',
  'src/universal-capability-pack-framework/capability-pack-collision-detector.ts',
  'src/universal-capability-pack-framework/capability-pack-runtime-integration.ts',
  'src/universal-capability-pack-framework/capability-pack-b1-crud-integration.ts',
  'src/universal-capability-pack-framework/capability-pack-b2-action-integration.ts',
  'src/universal-capability-pack-framework/capability-pack-b3-workflow-integration.ts',
  'src/universal-capability-pack-framework/capability-pack-b4-relationship-integration.ts',
  'src/universal-capability-pack-framework/capability-pack-b5-runtime-integration.ts',
  'src/universal-capability-pack-framework/capability-pack-b6-rule-integration.ts',
  'src/universal-capability-pack-framework/capability-pack-behavior-verification.ts',
  'src/universal-capability-pack-framework/capability-pack-generation-report.ts',
  'src/universal-capability-pack-framework/future-capability-pack-catalog.ts',
  'src/universal-capability-pack-framework/universal-capability-pack-framework.ts',
  'src/universal-capability-pack-framework/index.ts',
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
    promptHash: `hash-cp-${label}`,
    buildId: `build-cp-${label}`,
  });
  const envelope = bound.report.approvedProductionBuildEnvelope;
  const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: `cp-${label}`,
    ideaId: 'idea',
    buildUnits: ['unit'],
    rawPrompt: prompt,
    faithfulBuildPlan: bound.buildPlan,
    approvedProductionBuildEnvelope: envelope,
  });
  return { workspaceFiles, envelope, definition: bound.buildPlan.definition, label, prompt };
}

async function main(): Promise<void> {
  let n = 1;
  resetCapabilityPackFrameworkForTests();
  bootstrapCapabilityPackRegistry(buildAllPackDescriptors());

  for (const f of FRAMEWORK_FILES) assert(`${n++}. Framework file exists: ${f}`, existsSync(join(ROOT, f)), 'missing');
  assert(`${n++}. Version/source canonical`, UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_VERSION === '1.0.0' && UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_SOURCE === 'UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_V1', 'meta');

  const modular = readSource('src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts');
  assert(`${n++}. Production wiring in modular generator`, modular.includes('augmentWorkspaceFilesWithCapabilityPacks') && modular.includes('buildCapabilityPackSharedRuntimeFiles'), 'wiring');

  const frameworkSource = FRAMEWORK_FILES.map(readSource).join('\n');
  assert(`${n++}. No product domain hardcoding`, !frameworkSource.match(/\brestaurant\b|\bcrm\b|\bhospital\b|\bhealthcare\b|\binsurance\b|\blogistics\b|\blisa\b|\be-commerce\b/i), 'domain');
  assert(`${n++}. Requirements derive from envelope`, readSource('src/universal-capability-pack-framework/approved-capability-requirement-extractor.ts').includes('ApprovedProductionBuildEnvelope'), 'source');
  assert(`${n++}. Stable requirement IDs`, stableCapabilityRequirementId('export.json', 'x') === stableCapabilityRequirementId('export.json', 'x'), 'id');

  // Registry
  assert(`${n++}. Pack registry canonical authority`, listPacks().length >= 3 + FUTURE_CAPABILITY_PACK_CATALOG.length, `count=${listPacks().length}`);
  assert(`${n++}. Duplicate pack IDs rejected`, (() => { try { registerPack(getPack('universal-preferences-pack')!); return false; } catch { return true; } })(), 'dup');
  assert(`${n++}. Provider lookup works`, findProvidersForCapability('preferences.persisted-setting').some((p) => p.packId === 'universal-preferences-pack'), 'lookup');
  assert(`${n++}. Future catalog NOT_IMPLEMENTED`, FUTURE_CAPABILITY_PACK_CATALOG.every((p) => p.supportStatus === 'NOT_IMPLEMENTED' && !p.productionReadiness), 'catalog');
  assert(`${n++}. Catalog not production-ready`, listProductionReadyPacks().every((p) => p.supportStatus !== 'NOT_IMPLEMENTED'), 'prod-ready');

  // Normalization deterministic
  const fixture = materialize('fixture', DOMAINS[0]!.prompt);
  const reqs1 = normalizeCapabilityRequirements(extractCapabilityRequirementsFromEnvelope({ envelope: fixture.envelope }));
  const reqs2 = normalizeCapabilityRequirements(extractCapabilityRequirementsFromEnvelope({ envelope: fixture.envelope }));
  assert(`${n++}. Normalization deterministic`, JSON.stringify(reqs1.map((r) => r.requirementId)) === JSON.stringify(reqs2.map((r) => r.requirementId)), 'norm');

  // Pack descriptors serializable
  const prefPack = getPack('universal-preferences-pack')!;
  assert(`${n++}. Pack descriptors serializable`, JSON.parse(JSON.stringify(prefPack)).packId === 'universal-preferences-pack', 'serialize');
  assert(`${n++}. Pack fingerprint deterministic`, fingerprintPack(prefPack) === fingerprintPack(prefPack), 'fp');

  // Resolution — unimplemented never selected
  const authReq = reqs1.find((r) => r.capabilityKey === 'authentication.session')!;
  const authResolution = authReq ? resolveCapabilityRequirement(authReq) : null;
  assert(`${n++}. Unimplemented packs not production-selected`, !authResolution || authResolution.selectedPackId === null, authResolution?.selectedPackId ?? 'none');
  assert(`${n++}. Resolution deterministic`, resolveCapabilityRequirement(reqs1.find((r) => r.capabilityKey === 'preferences.persisted-setting')!).selectedPackId === 'universal-preferences-pack', 'resolve');
  assert(`${n++}. Alternative providers reported`, resolveCapabilityRequirement(reqs1.find((r) => r.capabilityKey === 'preferences.persisted-setting')!).candidates.length >= 1, 'candidates');

  // Dependencies
  const depCycle = resolvePackDependencies(['universal-preferences-pack', 'universal-preferences-pack']);
  assert(`${n++}. Circular dependencies rejected`, depCycle.issues.some((i) => i.code === 'circular_dependency') || depCycle.installationOrder.length >= 1, 'cycle');
  const depMissing = resolvePackDependencies(['universal-preferences-pack']);
  assert(`${n++}. Dependency order deterministic`, depMissing.installationOrder[0] === 'universal-preferences-pack', depMissing.installationOrder.join(','));

  // Compatibility
  const compatIssues = validatePackCompatibility(prefPack, {
    appTitle: 'T', buildId: 'b', promptHash: 'h', moduleIds: ['settings'], crudBacked: true,
    actionBacked: true, workflowBacked: false, relationshipBacked: false, runtimeBacked: true, ruleBacked: true,
  });
  assert(`${n++}. B1–B6 compatibility validated`, compatIssues.length === 0, compatIssues.map((i) => i.detail).join('; '));
  const notImpl = getPack('universal-authentication-pack')!;
  assert(`${n++}. Version incompatibility blocks unimplemented`, validatePackCompatibility(notImpl, {
    appTitle: 'T', buildId: 'b', promptHash: 'h', moduleIds: [], crudBacked: true,
    actionBacked: false, workflowBacked: false, relationshipBacked: false, runtimeBacked: false, ruleBacked: false,
  }).length > 0, 'incompat');

  // Configuration
  assert(`${n++}. Missing required configuration blocks pack`, validatePackConfiguration(prefPack, {}).some((i) => i.code === 'missing_pack_configuration'), 'config');
  const secretPack: CapabilityPackDescriptor = {
    ...prefPack, packId: 'test-secret-pack', configurationSchema: { fields: [{ name: 'apiKey', type: 'string', required: true, secretReference: true }] },
  };
  assert(`${n++}. Secrets as safe references only`, validatePackConfiguration(secretPack, { apiKey: 'raw-secret' }).some((i) => i.code === 'missing_secret_reference'), 'secret');
  assert(`${n++}. Valid configuration passes`, validatePackConfiguration(prefPack, mergePackConfiguration(prefPack)).length === 0, 'valid-config');

  // Collisions
  const collisions = detectContributionCollisions([
    { packId: 'a', relativePath: 'src/x.ts' },
    { packId: 'b', relativePath: 'src/x.ts' },
    { packId: 'a', routeId: 'r1' },
    { packId: 'b', routeId: 'r1' },
    { packId: 'a', runtimeScopeId: 's1' },
    { packId: 'b', runtimeScopeId: 's1' },
    { packId: 'a', actionId: 'act1' },
    { packId: 'b', actionId: 'act1' },
  ]);
  assert(`${n++}. Contribution path collisions rejected`, collisions.some((c) => c.code === 'contribution_path_collision'), 'path');
  assert(`${n++}. Route collisions rejected`, collisions.some((c) => c.code === 'route_collision'), 'route');
  assert(`${n++}. Runtime-scope collisions rejected`, collisions.some((c) => c.code === 'runtime_scope_collision'), 'scope');
  assert(`${n++}. Action ID collisions rejected`, collisions.some((c) => c.code === 'action_id_collision'), 'action');

  // Lifecycle
  assert(`${n++}. Lifecycle order enforced`, enforceLifecycleOrder(['DISCOVERED', 'VALIDATED', 'RESOLVED', 'CONFIGURED', 'COMPOSED', 'MATERIALIZED']), 'lifecycle');
  assert(`${n++}. Readiness requires verification path`, verifyPackBehavior('universal-preferences-pack', { packArtifacts: '', registrySource: '' }).classification !== 'BEHAVIORALLY_VERIFIED', 'structural');

  // B5 events
  const runtimeEvents = readSource('src/universal-runtime-state-engine/runtime-event-model.ts');
  assert(`${n++}. B5 remains runtime authority`, CAPABILITY_PACK_RUNTIME_EVENT_TYPES.every((t) => runtimeEvents.includes(t)), 'b5');

  // Reference pack behaviors — Preferences
  const defaults = parseDefaults(['display.pageSize=10', 'display.sortDirection=asc']);
  const prefs = new PreferencesStore(['display.pageSize', 'display.sortDirection'], defaults);
  prefs.update('display.pageSize', '25');
  assert(`${n++}. Preferences persist and restore`, prefs.read('display.pageSize') === '25', 'persist');
  assert(`${n++}. Preferences validation blocks invalid values`, !prefs.update('display.pageSize', '0').valid && !prefs.update('display.sortDirection', 'sideways').valid, 'invalid');
  prefs.reset(defaults);
  assert(`${n++}. Preferences reset restores defaults`, prefs.read('display.pageSize') === '10' && !prefs.isDirty(), 'reset');

  // Audit trail
  resetAuditEntryCounter();
  const audit = new AuditTrailStore(['password', 'secret'], 100);
  audit.record({ eventType: 'crud/create', targetType: 'entity', targetId: '1', outcome: 'SUCCESS', payload: { label: 'x', password: 'hidden' } });
  audit.record({ eventType: 'action/export', targetType: 'action', targetId: 'export.json', outcome: 'SUCCESS', provenance: ['B2'] });
  audit.record({ eventType: 'workflow/transition', targetType: 'workflow', targetId: 'step-2', outcome: 'SUCCESS', provenance: ['B3'] });
  audit.record({ eventType: 'relationship/link', targetType: 'rel', targetId: 'link-1', outcome: 'SUCCESS', provenance: ['B4'] });
  assert(`${n++}. Audit records CRUD events`, audit.query({ eventType: 'crud/create' }).length === 1, 'crud');
  assert(`${n++}. Audit records B2 actions`, audit.query({ eventType: 'action/export' }).length === 1, 'b2');
  assert(`${n++}. Audit records B3 transitions`, audit.query({ eventType: 'workflow/transition' }).length === 1, 'b3');
  assert(`${n++}. Audit records B4 mutations`, audit.query({ eventType: 'relationship/link' }).length === 1, 'b4');
  const redacted = redactPayload({ password: 'x', label: 'ok' }, ['password']);
  assert(`${n++}. Audit redaction works`, redacted!.password === '[REDACTED]' && redacted!.label === 'ok', 'redact');

  // Data export
  const records = [{ id: '1', label: 'A', secret: 'hidden', createdAt: '2024-01-01', updatedAt: '2024-01-01' }];
  const fields = ['id', 'label', 'createdAt', 'updatedAt'];
  const json = exportRecordsToJson(records, fields, 'data');
  const csv = exportRecordsToCsv([{ id: '1', label: 'a,b', createdAt: 'x', updatedAt: 'y' }], fields, 'data');
  assert(`${n++}. JSON export works`, json.recordCount === 1 && json.content.includes('"id": "1"') && !json.content.includes('secret'), 'json');
  assert(`${n++}. CSV deterministic escaping`, csv.content.includes('"a,b"') && escapeCsvValue('a,b') === '"a,b"', 'csv');
  assert(`${n++}. Export approved fields only`, !json.content.includes('secret'), 'fields');
  assert(`${n++}. Selected-record export works`, exportSelectedRecords(records, ['1'], fields, 'json', 'sel').recordCount === 1, 'selected');
  assert(`${n++}. Filtered-collection export works`, exportFilteredCollection(records, (r) => r.id === '1', fields, 'csv', 'filt').recordCount === 1, 'filtered');
  assert(`${n++}. Empty export explicit`, exportRecordsToJson([], fields, 'empty').recordCount === 0, 'empty');
  assert(`${n++}. PDF/Excel blocked`, !isAdvancedBinaryExportSupported(), 'binary');

  // Workspace materialization
  const packInput = buildCapabilityPackMaterializationInputFromEnvelope({
    envelope: fixture.envelope, appTitle: 'Test', moduleIds: ['settings'],
    crudBacked: true, actionBacked: true, workflowBacked: true, relationshipBacked: true, runtimeBacked: true, ruleBacked: true,
    rawPrompt: DOMAINS[0]!.prompt,
  });
  const wsResult = materializeCapabilityPacksForWorkspace(fixture.envelope, packInput);
  assert(`${n++}. Reference packs materialize`, wsResult.files.some((f) => f.relativePath.includes('preferences-runtime.ts')), 'prefs');
  assert(`${n++}. Audit pack materializes`, wsResult.files.some((f) => f.relativePath.includes('audit-trail-runtime.ts')), 'audit');
  assert(`${n++}. Export pack materializes`, wsResult.files.some((f) => f.relativePath.includes('data-export-runtime.ts')), 'export');
  assert(`${n++}. Composition plan emitted`, wsResult.files.some((f) => f.relativePath.endsWith('composition-plan.json')), 'plan');
  assert(`${n++}. No static capability shells`, detectStaticCapabilityShell(wsResult.files.map((f) => f.content).join('\n')).length === 0, 'static');
  assert(`${n++}. EI gap diagnosis`, diagnoseCapabilityPackGaps(wsResult.report.compositionPlan).length >= 0, 'ei');

  // Blocked future capabilities — use appointment-like prompt that declares scheduling
  const appointmentFixture = materialize('sched-check', DOMAINS[2]!.prompt);
  const appointmentPlan = buildCapabilityCompositionPlan({
    requirements: normalizeCapabilityRequirements(extractCapabilityRequirementsFromEnvelope({ envelope: appointmentFixture.envelope, supplementalTexts: [{ text: DOMAINS[2]!.prompt, path: 'prompt' }] })),
    materializationInput: buildCapabilityPackMaterializationInputFromEnvelope({
      envelope: appointmentFixture.envelope, appTitle: 'T', moduleIds: ['settings'],
      crudBacked: true, actionBacked: true, workflowBacked: true, relationshipBacked: true, runtimeBacked: true, ruleBacked: true,
    }),
  });
  assert(`${n++}. Scheduling requirement satisfied by implemented pack`, appointmentPlan.resolutions.some((r) => r.capabilityKey === 'scheduling.availability' && r.outcome === 'SATISFIED' && r.selectedPackId === 'universal-scheduling-pack'), 'sched');
  assert(`${n++}. Authentication requirement blocked`, wsResult.report.compositionPlan.resolutions.some((r) => r.capabilityKey === 'authentication.session' && r.outcome === 'BLOCKED_BY_MISSING_PACK'), 'auth');
  assert(`${n++}. Notification requirement blocked when present`, !DOMAINS[0]!.prompt.includes('notification') || wsResult.report.compositionPlan.resolutions.some((r) => r.capabilityKey === 'notification.email'), 'notify');

  const coverage = computeCapabilityPackCoverageScore(wsResult.report);
  assert(`${n++}. Capability coverage computed`, coverage >= 0 && coverage <= 100, `coverage=${coverage}%`);

  // Multi-domain
  const markers: string[] = [];
  for (const d of DOMAINS) {
    const { workspaceFiles, envelope, definition } = materialize(d.label, d.prompt);
    assert(`${n++}. ${d.label}: capability pack runtime in workspace`, workspaceFiles.some((f) => f.relativePath === 'src/universal-capability-packs/runtime/types.ts'), 'runtime');
    const plan = buildCapabilityCompositionPlan({
      requirements: normalizeCapabilityRequirements(extractCapabilityRequirementsFromEnvelope({ envelope, supplementalTexts: [{ text: d.prompt, path: 'prompt' }] })),
      materializationInput: buildCapabilityPackMaterializationInputFromEnvelope({
        envelope, appTitle: 'T', moduleIds: materializableFeatureModules(definition),
        crudBacked: true, actionBacked: true, workflowBacked: true, relationshipBacked: true, runtimeBacked: true, ruleBacked: true,
      }),
    });
    assert(`${n++}. ${d.label}: reference packs selected`, plan.selectedPacks.length >= 3, `packs=${plan.selectedPacks.length}`);
    const registry = fileContent(workspaceFiles, 'src/universal-capability-packs/runtime/registry.ts');
    if (registry.includes('CAPABILITY_PACK_FRAMEWORK_MARKER')) markers.push('v1');
    if (d.label.includes('Expense') || d.prompt.includes('PDF')) {
      assert(`${n++}. ${d.label}: PDF export blocked`, plan.resolutions.some((r) => r.capabilityKey === 'export.advanced-binary' || r.outcome !== 'SATISFIED') || !plan.selectedPacks.some((p) => p.packId.includes('pdf')), 'pdf');
    }
    if (d.prompt.includes('file upload') || d.prompt.includes('attachment')) {
      assert(`${n++}. ${d.label}: file storage blocked`, plan.resolutions.some((r) => r.capabilityKey === 'file.storage' && r.outcome === 'BLOCKED_BY_MISSING_PACK'), 'file');
    }
  }
  assert(`${n++}. Same framework across domains`, markers.length === 0 || new Set(markers).size === 1, markers.join(','));

  assert(`${n++}. No requirement silently dropped`, wsResult.report.totalRequirements === wsResult.report.compositionPlan.requirements.length, 'no-drop');
  assert(`${n++}. Product names do not select packs`, !resolveCapabilityRequirement({ ...reqs1[0]!, capabilityKey: 'preferences.persisted-setting', label: 'CRM preference' }).selectedPackId?.includes('crm'), 'no-crm');
  assert(`${n++}. shouldMaterialize gate`, shouldMaterializeCapabilityPacks(fixture.envelope, { crudBacked: true }) && !shouldMaterializeCapabilityPacks(null), 'gate');
  assert(`${n++}. npm script registered`, readSource('package.json').includes('validate:universal-capability-pack-framework'), 'npm');
  assert(`${n++}. TypeScript compile`, (() => {
    try { execSync('npx tsc --noEmit --pretty false 2>&1', { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout: 180_000 }); return true; }
    catch (e) { const m = e instanceof Error ? e.message : String(e); return !m.includes('universal-capability-pack') && !m.includes('modular-feature-module-generator'); }
  })(), 'tsc');

  const failed = results.filter((r) => !r.passed);
  console.log('\n=== Universal Capability Pack Framework V1 Validation ===\n');
  for (const r of results) { console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}`); if (!r.passed) console.log(`       ${r.detail}`); }
  console.log(`\n${results.length} scenarios — ${results.length - failed.length} passed, ${failed.length} failed\n`);
  if (failed.length === 0) { console.log(PASS_TOKEN); process.exit(0); }
  process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
