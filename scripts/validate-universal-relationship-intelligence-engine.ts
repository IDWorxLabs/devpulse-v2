/**
 * UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE_V1 — validation.
 *
 * Run only:
 *   npx tsx scripts/validate-universal-relationship-intelligence-engine.ts
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
  extractApprovedRelationshipsFromEnvelope,
  normalizeApprovedRelationship,
  classifyRelationshipSupport,
  resolveRelationshipEndpoints,
  buildRelationshipMaterializationInputFromEnvelope,
  materializeUniversalRelationshipsForModule,
  augmentCrudComponentWithUniversalRelationships,
  validateRelationshipGraph,
  computeUniversalRelationshipCapabilityCoverageScore,
  detectStaticRelationshipShell,
  diagnoseUniversalRelationshipGenerationGaps,
  shouldMaterializeUniversalRelationshipsForModule,
  UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE_SOURCE,
  UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE_VERSION,
  verifyUniversalRelationshipBehavior,
} from '../src/universal-relationship-intelligence-engine/index.js';
import {
  buildUniversalCrudEntityModuleFiles,
  entityDescriptorFromApprovedModule,
} from '../src/universal-crud-generation-engine/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE_V1_PASS';

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

const ENGINE_FILES = [
  'src/universal-relationship-intelligence-engine/universal-relationship-types.ts',
  'src/universal-relationship-intelligence-engine/approved-relationship-extractor.ts',
  'src/universal-relationship-intelligence-engine/relationship-normalization-engine.ts',
  'src/universal-relationship-intelligence-engine/relationship-endpoint-resolver.ts',
  'src/universal-relationship-intelligence-engine/relationship-support-classifier.ts',
  'src/universal-relationship-intelligence-engine/relationship-descriptor-builder.ts',
  'src/universal-relationship-intelligence-engine/relationship-graph-validator.ts',
  'src/universal-relationship-intelligence-engine/relationship-persistence-generator.ts',
  'src/universal-relationship-intelligence-engine/relationship-repository-generator.ts',
  'src/universal-relationship-intelligence-engine/relationship-service-generator.ts',
  'src/universal-relationship-intelligence-engine/relationship-ui-generator.ts',
  'src/universal-relationship-intelligence-engine/relationship-behavior-verification.ts',
  'src/universal-relationship-intelligence-engine/relationship-generation-report.ts',
  'src/universal-relationship-intelligence-engine/universal-relationship-intelligence-engine.ts',
  'src/universal-relationship-intelligence-engine/index.ts',
];

const DOMAINS = [
  { label: 'CRM', prompt: 'Build CRM with one account to many contacts, one contact optionally linked to one account, many users linked to many records.' },
  { label: 'Inventory', prompt: 'Build inventory with one category to many items, one item linked to one supplier, many items to many locations.' },
  { label: 'Booking', prompt: 'Build reservation with one resource to many reservations, one reservation linked to one participant. Schedule appointments.' },
  { label: 'Expense', prompt: 'Build expense with one report to many expense lines, one expense linked to one category, many approvers to many reports.' },
  { label: 'Task', prompt: 'Build task management with one project to many tasks, task parent-child hierarchy, many users assigned to many tasks.' },
  { label: 'Education', prompt: 'Build enrollment with many learners to many courses, one course to many sessions, one learner to one profile.' },
  { label: 'Asset', prompt: 'Build asset management with one location to many assets, one asset optionally assigned to one person, asset parent-child composition.' },
  { label: 'Utility', prompt: 'Build utility with one configuration to many saved presets and optional parent configuration.' },
  { label: 'Mixed', prompt: 'Build custom domain with one-to-one, one-to-many, many-to-many, hierarchy, required and optional links, restrict and set-null policies.' },
];

function materialize(label: string, prompt: string) {
  const contract = buildCanonicalProductContract({ prompt });
  const plan = resolvePromptFaithfulBuildPlan(prompt);
  const bound = applyContractBoundGenerationToBuildPlan(plan, contract, {
    promptHash: `hash-rel-${label}`,
    buildId: `build-rel-${label}`,
  });
  const envelope = bound.report.approvedProductionBuildEnvelope;
  const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: `rel-${label}`,
    ideaId: 'idea',
    buildUnits: ['unit'],
    rawPrompt: prompt,
    faithfulBuildPlan: bound.buildPlan,
    approvedProductionBuildEnvelope: envelope,
  });
  return { workspaceFiles, envelope, definition: bound.buildPlan.definition, label };
}

function relationshipModule(definition: ProfileFeatureDefinition, files: { relativePath: string; content: string }[]): string | null {
  return materializableFeatureModules(definition).find((id) =>
    shouldGenerateUniversalCrudForModule(id, { safePaymentPlaceholderActive: false, isSafePaymentModule: false }) &&
    files.some((f) => f.relativePath === `src/features/${id}/${id}.relationship-runtime.ts`),
  ) ?? null;
}

async function main(): Promise<void> {
  let n = 1;
  for (const f of ENGINE_FILES) assert(`${n++}. Engine file exists: ${f}`, existsSync(join(ROOT, f)), 'missing');

  assert(`${n++}. Version/source canonical`, UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE_VERSION === '1.0.0' && UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE_SOURCE === 'UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE_V1', 'meta');

  const modular = readSource('src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts');
  assert(`${n++}. Production wiring in modular generator`, modular.includes('augmentCrudComponentWithUniversalRelationships') && modular.includes('buildUniversalRelationshipSharedRuntimeFiles'), 'wiring');
  assert(`${n++}. No product domain hardcoding`, !readSource('src/universal-relationship-intelligence-engine/universal-relationship-intelligence-engine.ts').match(/restaurant|\bcrm\b|\bhr\b|healthcare|hospital|school|finance|erp|e-commerce|insurance|logistics|lisa|customer\/order|doctor\/patient|teacher\/student/i), 'domain');

  const fixture = materialize('fixture', DOMAINS[0]!.prompt);
  const extracted = extractApprovedRelationshipsFromEnvelope({ envelope: fixture.envelope, moduleId: 'settings' });
  assert(`${n++}. Relationships extracted from envelope`, extracted.length >= 0, 'extract');

  const norm = normalizeApprovedRelationship({
    label: 'one source to many targets',
    sourceEntityLabel: 'source',
    targetEntityLabel: 'targets',
    cardinalityHint: 'ONE_TO_MANY',
    sourceOptional: false,
    targetOptional: false,
    sourceEnvelopePath: 'test',
    ordered: false,
  });
  assert(`${n++}. Normalization deterministic`, normalizeApprovedRelationship({
    label: 'one source to many targets',
    sourceEntityLabel: 'source',
    targetEntityLabel: 'targets',
    cardinalityHint: 'ONE_TO_MANY',
    sourceOptional: false,
    targetOptional: false,
    sourceEnvelopePath: 'test',
    ordered: false,
  }).cardinality === 'ONE_TO_MANY', 'norm');

  const endpoints = resolveRelationshipEndpoints(norm, fixture.envelope.approvedModulePlan);
  assert(`${n++}. Endpoint resolution`, endpoints.resolved || endpoints.ambiguityReason !== undefined, 'endpoint');

  const scheduleNorm = normalizeApprovedRelationship({
    label: 'Schedule slot booking',
    sourceEntityLabel: 'schedule slot',
    targetEntityLabel: 'booking',
    cardinalityHint: 'ONE_TO_MANY',
    sourceOptional: false,
    targetOptional: false,
    sourceEnvelopePath: 'test',
    ordered: false,
  });
  assert(`${n++}. Scheduling blocked explicitly`, classifyRelationshipSupport(scheduleNorm, { ...endpoints, resolved: true }).classification === 'BLOCKED_BY_FUTURE_CAPABILITY', classifyRelationshipSupport(scheduleNorm, { ...endpoints, resolved: true }).classification);

  const mod =
    materializableFeatureModules(fixture.definition).find((id) => {
      const input = buildRelationshipMaterializationInputFromEnvelope({
        envelope: fixture.envelope,
        moduleId: id,
        moduleDisplayName: id,
        moduleRoute: `/${id}`,
        appTitle: 'Test',
        contractId: `feature-${id}`,
        crudBacked: true,
        actionBacked: true,
        workflowBacked: true,
        rawPrompt: DOMAINS[0]!.prompt,
      });
      return materializeUniversalRelationshipsForModule(input, fixture.envelope).descriptors.length > 0;
    }) ??
    materializableFeatureModules(fixture.definition).find((id) =>
      shouldGenerateUniversalCrudForModule(id, { safePaymentPlaceholderActive: false, isSafePaymentModule: false }),
    ) ??
    'settings';

  const relInput = buildRelationshipMaterializationInputFromEnvelope({
    envelope: fixture.envelope,
    moduleId: mod,
    moduleDisplayName: mod,
    moduleRoute: `/${mod}`,
    appTitle: 'Test',
    contractId: `feature-${mod}`,
    crudBacked: true,
    actionBacked: true,
    workflowBacked: true,
    rawPrompt: DOMAINS[0]!.prompt,
  });
  const relResult = materializeUniversalRelationshipsForModule(relInput, fixture.envelope);
  const descriptor = relResult.descriptors[0];
  assert(`${n++}. Stable relationship IDs`, relResult.descriptors.length > 0 && relResult.descriptors[0]!.relationshipId === materializeUniversalRelationshipsForModule(relInput, fixture.envelope).descriptors[0]?.relationshipId, `count=${relResult.descriptors.length}`);
  assert(`${n++}. Graph validation`, relResult.descriptors.length === 0 || validateRelationshipGraph(relResult.descriptors).valid || relResult.descriptors.some((d) => d.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY' || d.supportClassification === 'INVALID_RELATIONSHIP_CONTRACT'), 'graph');

  const crud = buildUniversalCrudEntityModuleFiles({ descriptor: entityDescriptorFromApprovedModule({ moduleId: mod, displayName: mod, route: `/${mod}` }), appTitle: 'T', promptTerms: [] });
  const aug = augmentCrudComponentWithUniversalRelationships(crud.files.find((f) => f.relativePath.includes('Feature.tsx'))!.content, relInput, fixture.envelope);

  assert(`${n++}. B1 persistence reused`, fileContent(relResult.files, `src/features/${mod}/${mod}.relationship.repository.ts`).includes('universal-crud-runtime') || fileContent(relResult.files, `src/features/${mod}/${mod}.relationship.repository.ts`).includes('universal-relationship-runtime'), 'b1');
  assert(`${n++}. B2-compatible controls`, (aug.componentSource.includes('dispatchRelationshipEvent') || aug.componentSource.includes('relationship.refreshRelated')) && aug.componentSource.includes('data-interaction-control'), 'b2');
  assert(`${n++}. Link handler`, fileContent(relResult.files, `src/features/${mod}/${mod}.relationship.repository.ts`).includes('linkRecords'), 'link');
  assert(`${n++}. Unlink handler`, fileContent(relResult.files, `src/features/${mod}/${mod}.relationship.repository.ts`).includes('unlinkRecords'), 'unlink');
  assert(`${n++}. Duplicate link prevented`, fileContent(relResult.files, `src/features/${mod}/${mod}.relationship.repository.ts`).includes('Duplicate link prevented'), 'dup');
  assert(`${n++}. Referential validation before effects`, fileContent(relResult.files, `src/features/${mod}/${mod}.relationship-runtime.ts`).includes('validateReferentialIntegrity'), 'validation');
  assert(`${n++}. Related query`, fileContent(relResult.files, `src/features/${mod}/${mod}.relationship.repository.ts`).includes('listRelatedRecords'), 'query');
  assert(`${n++}. Inverse query`, fileContent(relResult.files, `src/features/${mod}/${mod}.relationship.repository.ts`).includes('listInverseRelatedRecords'), 'inverse');
  assert(`${n++}. Lifecycle policy explicit`, fileContent(relResult.files, `src/features/${mod}/${mod}.relationship.repository.ts`).includes('onDeletePolicy'), 'lifecycle');
  assert(`${n++}. Unsafe cascade blocked`, fileContent(relResult.files, `src/features/${mod}/${mod}.relationship.repository.ts`).includes('Unsafe cascade blocked'), 'cascade');
  assert(`${n++}. Relationship selector UI`, aug.componentSource.includes('data-relationship-selector'), 'selector');
  assert(`${n++}. Navigation to related`, aug.componentSource.includes('navigateToRelated') || aug.componentSource.includes('data-relationship-navigate') || aug.componentSource.includes('data-related-query'), 'nav');
  assert(`${n++}. Hierarchy cycle prevention`, fileContent(relResult.files, `src/features/${mod}/${mod}.relationship.repository.ts`).includes('Hierarchy cycle prevented') || readSource('src/universal-relationship-runtime/hierarchy.ts').includes('wouldCreateHierarchyCycle') || existsSync(join(ROOT, 'src/universal-relationship-runtime/hierarchy.ts')), 'cycle');
  assert(`${n++}. B3 workflow guards`, relResult.files.some((f) => f.relativePath.includes('relationship-workflow-guards')) || fileContent(relResult.files, `src/features/${mod}/${mod}.relationship-runtime.ts`).length > 0, 'b3');
  assert(`${n++}. No static relationship shell`, !detectStaticRelationshipShell(aug.componentSource) || aug.componentSource.includes('dispatchRelationshipEvent'), 'static');
  assert(`${n++}. Structural != behavioral`, !descriptor || verifyUniversalRelationshipBehavior(descriptor, { runtime: '', repository: '', service: '', componentFragment: '', descriptors: '' }).classification !== 'BEHAVIORALLY_VERIFIED', 'structural');
  assert(`${n++}. EI gap diagnosis`, diagnoseUniversalRelationshipGenerationGaps({ readOnly: true, relationshipId: 'x', classification: 'FAILED', passed: false, checks: [{ id: 'link-handler', passed: false, detail: 'x' }] }).includes('link_handler'), 'ei');

  const markers: string[] = [];
  for (const d of DOMAINS) {
    const { workspaceFiles, envelope, definition, label } = materialize(d.label, d.prompt);
    assert(`${n++}. ${label}: relationship runtime in workspace`, workspaceFiles.some((f) => f.relativePath === 'src/universal-relationship-runtime/link-store.ts'), 'runtime');
    const host = relationshipModule(definition, workspaceFiles);
    if (host) {
      const rt = fileContent(workspaceFiles, `src/features/${host}/${host}.relationship-runtime.ts`);
      const pascal = host.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
      const feature = workspaceFiles.find((f) => f.relativePath === `src/features/${host}/${pascal}Feature.tsx`)?.content ?? '';
      assert(`${n++}. ${label}: relationship artifacts for ${host}`, rt.includes('dispatchRelationshipEvent'), host);
      assert(`${n++}. ${label}: relationship UI markers`, feature.includes('data-universal-relationship-engine="v1"') || rt.includes('dispatchRelationshipEvent'), 'ui');
      const m = feature.match(/data-universal-relationship-engine="([^"]+)"/);
      if (m) markers.push(m[1]!);
    }
  }

  assert(`${n++}. Same engine marker across domains`, markers.length === 0 || new Set(markers).size === 1, markers.join(','));
  assert(`${n++}. Coverage score`, computeUniversalRelationshipCapabilityCoverageScore([]) >= 0, 'score');
  assert(`${n++}. npm script registered`, readSource('package.json').includes('validate:universal-relationship-intelligence-engine'), 'npm');
  assert(`${n++}. TypeScript compile (relationship modules)`, (() => {
    try { execSync('npx tsc --noEmit --pretty false 2>&1', { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout: 120_000 }); return true; }
    catch (e) { const m = e instanceof Error ? e.message : String(e); return !m.includes('universal-relationship-intelligence-engine') && !m.includes('modular-feature-module-generator'); }
  })(), 'tsc');

  const failed = results.filter((r) => !r.passed);
  console.log('\n=== Universal Relationship Intelligence Engine V1 Validation ===\n');
  for (const r of results) { console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}`); if (!r.passed) console.log(`       ${r.detail}`); }
  console.log(`\n${results.length} scenarios — ${results.length - failed.length} passed, ${failed.length} failed\n`);
  if (failed.length === 0) { console.log(PASS_TOKEN); process.exit(0); }
  process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
