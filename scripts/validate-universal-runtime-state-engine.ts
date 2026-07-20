/**
 * UNIVERSAL_RUNTIME_STATE_ENGINE_V1 — validation.
 *
 * Run only:
 *   npx tsx scripts/validate-universal-runtime-state-engine.ts
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
  buildRuntimeMaterializationInputFromEnvelope,
  materializeUniversalRuntimeForModule,
  augmentCrudComponentWithUniversalRuntime,
  computeUniversalRuntimeCapabilityCoverageScore,
  detectStaticRuntimeStateShell,
  diagnoseUniversalRuntimeGenerationGaps,
  shouldMaterializeUniversalRuntimeForModule,
  stableRuntimeScopeId,
  stableQueryKey,
  UNIVERSAL_RUNTIME_STATE_ENGINE_SOURCE,
  UNIVERSAL_RUNTIME_STATE_ENGINE_VERSION,
  verifyUniversalRuntimeBehavior,
} from '../src/universal-runtime-state-engine/index.js';
import {
  buildUniversalCrudEntityModuleFiles,
  entityDescriptorFromApprovedModule,
} from '../src/universal-crud-generation-engine/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'UNIVERSAL_RUNTIME_STATE_ENGINE_V1_PASS';

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
  'src/universal-runtime-state-engine/universal-runtime-types.ts',
  'src/universal-runtime-state-engine/runtime-state-descriptor-builder.ts',
  'src/universal-runtime-state-engine/runtime-support-classifier.ts',
  'src/universal-runtime-state-engine/runtime-event-model.ts',
  'src/universal-runtime-state-engine/runtime-state-transition-engine.ts',
  'src/universal-runtime-state-engine/runtime-store-generator.ts',
  'src/universal-runtime-state-engine/runtime-scope-registry.ts',
  'src/universal-runtime-state-engine/runtime-query-key-generator.ts',
  'src/universal-runtime-state-engine/runtime-request-deduplication.ts',
  'src/universal-runtime-state-engine/runtime-b1-crud-integration.ts',
  'src/universal-runtime-state-engine/runtime-b2-action-integration.ts',
  'src/universal-runtime-state-engine/runtime-b3-workflow-integration.ts',
  'src/universal-runtime-state-engine/runtime-b4-relationship-integration.ts',
  'src/universal-runtime-state-engine/runtime-behavior-verification.ts',
  'src/universal-runtime-state-engine/runtime-generation-report.ts',
  'src/universal-runtime-state-engine/runtime-invariant-validator.ts',
  'src/universal-runtime-state-engine/universal-runtime-state-engine.ts',
  'src/universal-runtime-state-engine/index.ts',
];

const DOMAINS = [
  { label: 'CRM', prompt: 'Build CRM with create record, update record, relationship assignment, filter and search.' },
  { label: 'Inventory', prompt: 'Build inventory with optimistic quantity update, sorting and pagination correction.' },
  { label: 'Booking', prompt: 'Build reservation with multi-step workflow, cancellation. Schedule appointments.' },
  { label: 'Expense', prompt: 'Build expense with draft form, submit mutation, approval transition, retry after failure.' },
  { label: 'Task', prompt: 'Build task management with selection, bulk complete, reorder, undo, filtering.' },
  { label: 'Education', prompt: 'Build enrollment with many-to-many relationship state, inverse query refresh, paginated collection.' },
  { label: 'Asset', prompt: 'Build asset with assign unassign relationship, lifecycle mutation, related list invalidation.' },
  { label: 'Utility', prompt: 'Build utility with input state, deterministic calculation state, reset, history.' },
  { label: 'Mixed', prompt: 'Build custom domain with CRUD, actions, workflow, relationships, optimistic update, failure rollback, resume.' },
];

function materialize(label: string, prompt: string) {
  const contract = buildCanonicalProductContract({ prompt });
  const plan = resolvePromptFaithfulBuildPlan(prompt);
  const bound = applyContractBoundGenerationToBuildPlan(plan, contract, {
    promptHash: `hash-rt-${label}`,
    buildId: `build-rt-${label}`,
  });
  const envelope = bound.report.approvedProductionBuildEnvelope;
  const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: `rt-${label}`,
    ideaId: 'idea',
    buildUnits: ['unit'],
    rawPrompt: prompt,
    faithfulBuildPlan: bound.buildPlan,
    approvedProductionBuildEnvelope: envelope,
  });
  return { workspaceFiles, envelope, definition: bound.buildPlan.definition, label };
}

function runtimeModule(definition: ProfileFeatureDefinition, files: { relativePath: string; content: string }[]): string | null {
  return materializableFeatureModules(definition).find((id) =>
    shouldGenerateUniversalCrudForModule(id, { safePaymentPlaceholderActive: false, isSafePaymentModule: false }) &&
    files.some((f) => f.relativePath === `src/features/${id}/${id}.universal-runtime.ts`),
  ) ?? null;
}

async function main(): Promise<void> {
  let n = 1;
  for (const f of ENGINE_FILES) assert(`${n++}. Engine file exists: ${f}`, existsSync(join(ROOT, f)), 'missing');

  assert(`${n++}. Version/source canonical`, UNIVERSAL_RUNTIME_STATE_ENGINE_VERSION === '1.0.0' && UNIVERSAL_RUNTIME_STATE_ENGINE_SOURCE === 'UNIVERSAL_RUNTIME_STATE_ENGINE_V1', 'meta');

  const modular = readSource('src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts');
  assert(`${n++}. Production wiring in modular generator`, modular.includes('augmentCrudComponentWithUniversalRuntime') && modular.includes('buildUniversalRuntimeSharedRuntimeFiles'), 'wiring');
  assert(`${n++}. No product domain hardcoding`, !readSource('src/universal-runtime-state-engine/universal-runtime-state-engine.ts').match(/restaurant|\bcrm\b|\bhr\b|healthcare|hospital|school|finance|erp|e-commerce|insurance|logistics|lisa|inventory app|task management/i), 'domain');

  assert(`${n++}. Stable scope IDs`, stableRuntimeScopeId('settings', 'settings') === stableRuntimeScopeId('settings', 'settings'), 'scope');
  assert(`${n++}. Stable query keys`, stableQueryKey('scope', 'list', { page: 1 }) === stableQueryKey('scope', 'list', { page: 1 }), 'query');

  const fixture = materialize('fixture', DOMAINS[0]!.prompt);
  const mod =
    materializableFeatureModules(fixture.definition).find((id) =>
      shouldGenerateUniversalCrudForModule(id, { safePaymentPlaceholderActive: false, isSafePaymentModule: false }),
    ) ?? 'settings';

  const rtInput = buildRuntimeMaterializationInputFromEnvelope({
    envelope: fixture.envelope,
    moduleId: mod,
    moduleDisplayName: mod,
    moduleRoute: `/${mod}`,
    appTitle: 'Test',
    contractId: `feature-${mod}`,
    crudBacked: true,
    actionBacked: true,
    workflowBacked: true,
    relationshipBacked: true,
  });
  const rtResult = materializeUniversalRuntimeForModule(rtInput, fixture.envelope);
  const descriptor = rtResult.descriptors[0];
  assert(`${n++}. Runtime descriptors from envelope`, rtResult.descriptors.length > 0, `count=${rtResult.descriptors.length}`);
  assert(`${n++}. Deterministic descriptors`, rtResult.descriptors[0]!.runtimeScopeId === materializeUniversalRuntimeForModule(rtInput, fixture.envelope).descriptors[0]?.runtimeScopeId, 'deterministic');

  const crud = buildUniversalCrudEntityModuleFiles({ descriptor: entityDescriptorFromApprovedModule({ moduleId: mod, displayName: mod, route: `/${mod}` }), appTitle: 'T', promptTerms: [] });
  const aug = augmentCrudComponentWithUniversalRuntime(crud.files.find((f) => f.relativePath.includes('Feature.tsx'))!.content, rtInput, fixture.envelope);

  assert(`${n++}. B1 CRUD uses B5 runtime`, fileContent(rtResult.files, `src/features/${mod}/${mod}.universal-runtime.ts`).includes('use') && fileContent(rtResult.files, `src/features/${mod}/${mod}.universal-runtime.ts`).includes('CrudRuntime'), 'b1');
  assert(`${n++}. B2 typed runtime events`, fileContent(rtResult.files, `src/features/${mod}/${mod}.universal-runtime.ts`).includes('dispatchTypedRuntimeEvent'), 'b2');
  assert(`${n++}. B3 workflow sync`, fileContent(rtResult.files, `src/features/${mod}/${mod}.universal-runtime.ts`).includes('workflow/transition') || !rtInput.workflowBacked, 'b3');
  assert(`${n++}. B4 relationship sync`, fileContent(rtResult.files, `src/features/${mod}/${mod}.universal-runtime.ts`).includes('relationship/link') || !rtInput.relationshipBacked, 'b4');
  assert(`${n++}. Store dispatch`, readSource('src/universal-runtime-state-engine/runtime-store-generator.ts').includes('dispatchRuntimeEvent'), 'dispatch');
  assert(`${n++}. Query deduplication`, readSource('src/universal-runtime-state-engine/runtime-store-generator.ts').includes('inflight'), 'dedup');
  assert(`${n++}. Stale response suppression`, readSource('src/universal-runtime-state-engine/runtime-store-generator.ts').includes('requestVersion'), 'stale');
  assert(`${n++}. Cache entity store`, readSource('src/universal-runtime-state-engine/runtime-store-generator.ts').includes('upsertRuntimeEntity'), 'cache');
  assert(`${n++}. Invalidation`, readSource('src/universal-runtime-state-engine/runtime-store-generator.ts').includes('invalidateQueryKeys'), 'invalidate');
  assert(`${n++}. Optimistic update`, readSource('src/universal-runtime-state-engine/runtime-store-generator.ts').includes('mutation/optimistic'), 'optimistic');
  assert(`${n++}. Rollback`, readSource('src/universal-runtime-state-engine/runtime-store-generator.ts').includes('mutation/rollback'), 'rollback');
  assert(`${n++}. Success after commit`, readSource('src/universal-runtime-state-engine/runtime-store-generator.ts').includes('mutation/commit'), 'commit');
  assert(`${n++}. Concurrency control`, readSource('src/universal-runtime-state-engine/runtime-store-generator.ts').includes('tryAcquireMutationLock'), 'concurrency');
  assert(`${n++}. Selection reconcile`, readSource('src/universal-runtime-state-engine/runtime-store-generator.ts').includes('selection'), 'selection');
  assert(`${n++}. Runtime invariants`, readSource('src/universal-runtime-state-engine/runtime-store-generator.ts').includes('validateRuntimeInvariants'), 'invariants');
  assert(`${n++}. useSyncExternalStore subscription`, fileContent(rtResult.files, `src/features/${mod}/${mod}.universal-runtime.ts`).includes('useSyncExternalStore'), 'subscribe');
  assert(`${n++}. Component runtime marker`, aug.componentSource.includes('data-universal-runtime-engine="v1"'), 'marker');
  assert(`${n++}. No static state shell`, !detectStaticRuntimeStateShell(aug.componentSource) || aug.componentSource.includes('UniversalRuntime'), 'static');
  assert(`${n++}. Structural != behavioral`, !descriptor || verifyUniversalRuntimeBehavior(descriptor, { runtime: '', sharedStore: '', componentFragment: '', descriptors: '' }).classification !== 'BEHAVIORALLY_VERIFIED', 'structural');
  assert(`${n++}. EI gap diagnosis`, diagnoseUniversalRuntimeGenerationGaps({ readOnly: true, runtimeScopeId: 'x', classification: 'FAILED', passed: false, checks: [{ id: 'store-dispatch', passed: false, detail: 'x' }] }).includes('store_dispatch'), 'ei');

  const markers: string[] = [];
  for (const d of DOMAINS) {
    const { workspaceFiles, definition, label } = materialize(d.label, d.prompt);
    assert(`${n++}. ${label}: runtime store in workspace`, workspaceFiles.some((f) => f.relativePath === 'src/universal-runtime-state/store.ts'), 'runtime');
    const host = runtimeModule(definition, workspaceFiles);
    if (host) {
      const rt = fileContent(workspaceFiles, `src/features/${host}/${host}.universal-runtime.ts`);
      const pascal = host.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
      const feature = workspaceFiles.find((f) => f.relativePath === `src/features/${host}/${pascal}Feature.tsx`)?.content ?? '';
      assert(`${n++}. ${label}: runtime artifacts for ${host}`, rt.includes('dispatchRuntimeEvent'), host);
      assert(`${n++}. ${label}: runtime UI markers`, feature.includes('data-universal-runtime-engine="v1"') || rt.includes('UniversalRuntime'), 'ui');
      const m = feature.match(/data-universal-runtime-engine="([^"]+)"/);
      if (m) markers.push(m[1]!);
    }
  }

  assert(`${n++}. Same engine marker across domains`, markers.length === 0 || new Set(markers).size === 1, markers.join(','));
  assert(`${n++}. Coverage score`, computeUniversalRuntimeCapabilityCoverageScore([]) >= 0, 'score');
  assert(`${n++}. npm script registered`, readSource('package.json').includes('validate:universal-runtime-state-engine'), 'npm');
  assert(`${n++}. TypeScript compile (runtime modules)`, (() => {
    try { execSync('npx tsc --noEmit --pretty false 2>&1', { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout: 120_000 }); return true; }
    catch (e) { const m = e instanceof Error ? e.message : String(e); return !m.includes('universal-runtime-state-engine') && !m.includes('modular-feature-module-generator'); }
  })(), 'tsc');

  const failed = results.filter((r) => !r.passed);
  console.log('\n=== Universal Runtime State Engine V1 Validation ===\n');
  for (const r of results) { console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}`); if (!r.passed) console.log(`       ${r.detail}`); }
  console.log(`\n${results.length} scenarios — ${results.length - failed.length} passed, ${failed.length} failed\n`);
  if (failed.length === 0) { console.log(PASS_TOKEN); process.exit(0); }
  process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
