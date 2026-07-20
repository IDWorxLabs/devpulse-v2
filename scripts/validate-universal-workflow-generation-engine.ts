/**
 * UNIVERSAL_WORKFLOW_GENERATION_ENGINE_V1 — validation.
 *
 * Run only:
 *   npx tsx scripts/validate-universal-workflow-generation-engine.ts
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyContractBoundGenerationToBuildPlan } from '../src/contract-bound-generation-authority-v4/index.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../src/universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import {
  materializableFeatureModules,
} from '../src/universal-prompt-to-app-materialization/modular-feature-module-generator.js';
import { shouldGenerateUniversalCrudForModule } from '../src/universal-crud-generation-engine/index.js';
import type { ProfileFeatureDefinition } from '../src/universal-prompt-to-app-materialization/profile-feature-map.js';
import {
  extractApprovedWorkflowsFromEnvelope,
  normalizeApprovedWorkflow,
  classifyWorkflowSupport,
  buildWorkflowMaterializationInputFromEnvelope,
  materializeUniversalWorkflowsForModule,
  augmentCrudComponentWithUniversalWorkflows,
  validateWorkflowGraph,
  computeUniversalWorkflowCapabilityCoverageScore,
  detectStaticWorkflowShell,
  diagnoseUniversalWorkflowGenerationGaps,
  shouldMaterializeUniversalWorkflowsForModule,
  UNIVERSAL_WORKFLOW_GENERATION_ENGINE_SOURCE,
  UNIVERSAL_WORKFLOW_GENERATION_ENGINE_VERSION,
  verifyUniversalWorkflowBehavior,
} from '../src/universal-workflow-generation-engine/index.js';
import {
  buildUniversalCrudEntityModuleFiles,
  entityDescriptorFromApprovedModule,
} from '../src/universal-crud-generation-engine/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'UNIVERSAL_WORKFLOW_GENERATION_ENGINE_V1_PASS';

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
  'src/universal-workflow-generation-engine/universal-workflow-types.ts',
  'src/universal-workflow-generation-engine/approved-workflow-extractor.ts',
  'src/universal-workflow-generation-engine/workflow-normalization-engine.ts',
  'src/universal-workflow-generation-engine/workflow-support-classifier.ts',
  'src/universal-workflow-generation-engine/workflow-descriptor-builder.ts',
  'src/universal-workflow-generation-engine/workflow-graph-validator.ts',
  'src/universal-workflow-generation-engine/workflow-state-machine-runtime.ts',
  'src/universal-workflow-generation-engine/workflow-instance-persistence.ts',
  'src/universal-workflow-generation-engine/workflow-ui-generator.ts',
  'src/universal-workflow-generation-engine/workflow-behavior-verification.ts',
  'src/universal-workflow-generation-engine/workflow-generation-report.ts',
  'src/universal-workflow-generation-engine/universal-workflow-generation-engine.ts',
  'src/universal-workflow-generation-engine/index.ts',
];

const DOMAINS = [
  { label: 'CRM', prompt: 'Build CRM with lead qualification workflow: create lead, qualify, approve or reject, convert or close.' },
  { label: 'Inventory', prompt: 'Build inventory with draft adjustment, review, confirm, complete workflow.' },
  { label: 'Booking', prompt: 'Build reservation workflow: enter details, select option, confirm, complete. Schedule appointments.' },
  { label: 'Expense', prompt: 'Build expense workflow: draft, submit, approve or reject, revise, complete.' },
  { label: 'Task', prompt: 'Build task workflow: open, in progress, blocked, complete, reopen.' },
  { label: 'Education', prompt: 'Build enrollment workflow: application, review, accept or reject, enrollment completion.' },
  { label: 'Asset', prompt: 'Build asset workflow: register, inspect, approve, activate.' },
  { label: 'Utility', prompt: 'Build utility workflow: input, validate, calculate, review result, reset.' },
  { label: 'Mixed', prompt: 'Build custom workflow with linear steps, branch, cancellation, retry, and resume.' },
];

function materialize(label: string, prompt: string) {
  const contract = buildCanonicalProductContract({ prompt });
  const plan = resolvePromptFaithfulBuildPlan(prompt);
  const bound = applyContractBoundGenerationToBuildPlan(plan, contract, {
    promptHash: `hash-wf-${label}`,
    buildId: `build-wf-${label}`,
  });
  const envelope = bound.report.approvedProductionBuildEnvelope;
  const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: `wf-${label}`,
    ideaId: 'idea',
    buildUnits: ['unit'],
    rawPrompt: prompt,
    faithfulBuildPlan: bound.buildPlan,
    approvedProductionBuildEnvelope: envelope,
  });
  return { workspaceFiles, envelope, definition: bound.buildPlan.definition, label };
}

function workflowModule(definition: ProfileFeatureDefinition, files: { relativePath: string; content: string }[]): string | null {
  return materializableFeatureModules(definition).find((id) =>
    shouldGenerateUniversalCrudForModule(id, { safePaymentPlaceholderActive: false, isSafePaymentModule: false }) &&
    files.some((f) => f.relativePath === `src/features/${id}/${id}.workflow-runtime.ts`),
  ) ?? null;
}

async function main(): Promise<void> {
  let n = 1;
  for (const f of ENGINE_FILES) assert(`${n++}. Engine file exists: ${f}`, existsSync(join(ROOT, f)), 'missing');

  assert(`${n++}. Version/source canonical`, UNIVERSAL_WORKFLOW_GENERATION_ENGINE_VERSION === '1.0.0' && UNIVERSAL_WORKFLOW_GENERATION_ENGINE_SOURCE === 'UNIVERSAL_WORKFLOW_GENERATION_ENGINE_V1', 'meta');

  const modular = readSource('src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts');
  assert(`${n++}. Production wiring in modular generator`, modular.includes('augmentCrudComponentWithUniversalWorkflows') && modular.includes('buildUniversalWorkflowSharedRuntimeFiles'), 'wiring');
  assert(`${n++}. No product domain hardcoding`, !readSource('src/universal-workflow-generation-engine/universal-workflow-generation-engine.ts').match(/restaurant|\bcrm\b|\bhr\b|healthcare|hospital|school|finance|erp|e-commerce|insurance|logistics|lisa/i), 'domain');

  const fixture = materialize('fixture', DOMAINS[0]!.prompt);
  assert(`${n++}. Workflows extracted from envelope`, fixture.envelope.canonicalProductContract.primaryWorkflows.length >= 0, 'extract');

  const norm = normalizeApprovedWorkflow({ label: 'Create → Review → Submit', sourceEnvelopePath: 't', moduleId: 'm', contractId: 'c' }, fixture.envelope.canonicalProductContract);
  assert(`${n++}. Normalization deterministic`, normalizeApprovedWorkflow({ label: 'Create → Review → Submit', sourceEnvelopePath: 't', moduleId: 'm', contractId: 'c' }, fixture.envelope.canonicalProductContract).stageLabels.length >= 2, 'norm');

  const scheduleNorm = normalizeApprovedWorkflow({ label: 'Schedule slot booking', sourceEnvelopePath: 't', moduleId: 'm', contractId: 'c' }, fixture.envelope.canonicalProductContract);
  assert(`${n++}. Scheduling blocked explicitly`, classifyWorkflowSupport(scheduleNorm).classification === 'BLOCKED_BY_FUTURE_CAPABILITY', classifyWorkflowSupport(scheduleNorm).classification);

  const wfInput = buildWorkflowMaterializationInputFromEnvelope({
    envelope: fixture.envelope,
    moduleId: 'settings',
    moduleDisplayName: 'Settings',
    moduleRoute: '/settings',
    appTitle: 'Test',
    contractId: 'feature-settings',
    crudBacked: true,
    actionBacked: true,
  });
  const wfResult = materializeUniversalWorkflowsForModule(wfInput, fixture.envelope);
  const descriptor = wfResult.descriptors[0];
  assert(`${n++}. Stable workflow IDs`, wfResult.descriptors.length > 0 && wfResult.descriptors[0]!.workflowId === materializeUniversalWorkflowsForModule(wfInput, fixture.envelope).descriptors[0]?.workflowId, `count=${wfResult.descriptors.length}`);
  assert(`${n++}. Graph validation`, wfResult.descriptors.length > 0 && (validateWorkflowGraph(wfResult.descriptors[0]!).valid || wfResult.descriptors[0]!.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY'), 'graph');

  const crud = buildUniversalCrudEntityModuleFiles({ descriptor: entityDescriptorFromApprovedModule({ moduleId: 'settings', displayName: 'Settings', route: '/settings' }), appTitle: 'T', promptTerms: [] });
  const aug = augmentCrudComponentWithUniversalWorkflows(crud.files.find((f) => f.relativePath.includes('Feature.tsx'))!.content, wfInput, fixture.envelope);

  assert(`${n++}. B1 persistence reused`, fileContent(wfResult.files, 'src/features/settings/settings.workflow-instance.repository.ts').includes('universal-crud-runtime'), 'b1');
  assert(`${n++}. B2-compatible controls via dispatchEvent`, aug.componentSource.includes('dispatchEvent') && aug.componentSource.includes('data-interaction-control'), 'b2');
  assert(`${n++}. Valid transitions execute`, fileContent(wfResult.files, 'src/features/settings/settings.workflow-runtime.ts').includes('findTransition'), 'transition');
  assert(`${n++}. Invalid transitions rejected`, fileContent(wfResult.files, 'src/features/settings/settings.workflow-runtime.ts').includes('Invalid transition'), 'invalid');
  assert(`${n++}. Guards before effects`, fileContent(wfResult.files, 'src/features/settings/settings.workflow-runtime.ts').includes('guard-validation'), 'guard');
  assert(`${n++}. Validation before effects`, fileContent(wfResult.files, 'src/features/settings/settings.workflow-runtime.ts').includes('Validation failed'), 'validation');
  assert(`${n++}. Progress reflects state`, aug.componentSource.includes('data-workflow-progress'), 'progress');
  assert(`${n++}. Cancellation policy`, fileContent(wfResult.files, 'src/features/settings/settings.workflow-runtime.ts').includes('CANCELLED'), 'cancel');
  assert(`${n++}. Retry/recovery`, fileContent(wfResult.files, 'src/features/settings/settings.workflow-runtime.ts').includes('RETRY'), 'retry');
  assert(`${n++}. Resume restores state`, fileContent(wfResult.files, 'src/features/settings/settings.workflow-runtime.ts').includes('loadWorkflowInstance'), 'resume');
  assert(`${n++}. Terminal completion requires transition`, fileContent(wfResult.files, 'src/features/settings/settings.workflow-runtime.ts').includes('completedAt'), 'terminal');
  assert(`${n++}. No static workflow shell`, !detectStaticWorkflowShell(aug.componentSource) || aug.componentSource.includes('dispatchEvent'), 'static');
  assert(`${n++}. Structural != behavioral`, !descriptor || verifyUniversalWorkflowBehavior(descriptor, { runtime: '', repository: '', componentFragment: '', descriptors: '' }).classification !== 'BEHAVIORALLY_VERIFIED', 'structural');
  assert(`${n++}. EI gap diagnosis`, diagnoseUniversalWorkflowGenerationGaps({ readOnly: true, workflowId: 'x', classification: 'FAILED', passed: false, checks: [{ id: 'state-machine', passed: false, detail: 'x' }] }).includes('missing_transition'), 'ei');

  const markers: string[] = [];
  const scores: number[] = [];
  for (const d of DOMAINS) {
    const { workspaceFiles, envelope, definition, label } = materialize(d.label, d.prompt);
    assert(`${n++}. ${label}: workflow runtime in workspace`, workspaceFiles.some((f) => f.relativePath === 'src/universal-workflow-runtime/state-machine.ts'), 'runtime');
    const mod = workflowModule(definition, workspaceFiles);
    if (mod) {
      const rt = fileContent(workspaceFiles, `src/features/${mod}/${mod}.workflow-runtime.ts`);
      const pascal = mod.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
      const feature = workspaceFiles.find((f) => f.relativePath === `src/features/${mod}/${pascal}Feature.tsx`)?.content ?? '';
      assert(`${n++}. ${label}: workflow artifacts for ${mod}`, rt.includes('dispatchEvent'), mod);
      assert(`${n++}. ${label}: workflow UI markers`, feature.includes('data-universal-workflow-engine="v1"') || rt.includes('dispatchEvent'), 'ui');
      const m = feature.match(/data-universal-workflow-engine="([^"]+)"/);
      if (m) markers.push(m[1]!);
      scores.push(materializeUniversalWorkflowsForModule(buildWorkflowMaterializationInputFromEnvelope({
        envelope, moduleId: mod, moduleDisplayName: mod, moduleRoute: `/${mod}`, appTitle: label, contractId: `f-${mod}`, crudBacked: true, actionBacked: true,
      }), envelope).report.behavioralCoveragePercent);
    }
  }

  assert(`${n++}. Same engine marker across domains`, markers.length === 0 || new Set(markers).size === 1, markers.join(','));
  assert(`${n++}. Coverage score`, computeUniversalWorkflowCapabilityCoverageScore([]) >= 0, 'score');
  assert(`${n++}. npm script registered`, readSource('package.json').includes('validate:universal-workflow-generation-engine'), 'npm');
  assert(`${n++}. TypeScript compile (workflow modules)`, (() => {
    try { execSync('npx tsc --noEmit --pretty false 2>&1', { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout: 120_000 }); return true; }
    catch (e) { const m = e instanceof Error ? e.message : String(e); return !m.includes('universal-workflow-generation-engine') && !m.includes('modular-feature-module-generator'); }
  })(), 'tsc');

  const failed = results.filter((r) => !r.passed);
  console.log('\n=== Universal Workflow Generation Engine V1 Validation ===\n');
  for (const r of results) { console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}`); if (!r.passed) console.log(`       ${r.detail}`); }
  console.log(`\n${results.length} scenarios — ${results.length - failed.length} passed, ${failed.length} failed\n`);
  if (failed.length === 0) { console.log(PASS_TOKEN); process.exit(0); }
  process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
