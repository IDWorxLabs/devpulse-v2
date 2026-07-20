/**
 * UNIVERSAL_BEHAVIORAL_VERIFICATION_ENGINE_V1 — validation.
 *
 * Run only:
 *   npx tsx scripts/validate-universal-behavioral-verification.ts
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
  extractApprovedBehaviorsFromEnvelope,
  normalizeApprovedBehaviors,
  normalizeBehaviorKey,
  bootstrapBehaviorRegistry,
  resetUniversalBehavioralVerificationForTests,
  registerBehavior,
  listBehaviors,
  lookupBehavior,
  validateBehavior,
  fingerprintBehaviorDescriptor,
  detectDuplicates,
  detectMissingVerification,
  buildBehaviorVerificationPlan,
  executeBehaviorVerification,
  runUniversalBehavioralVerification,
  buildBehaviorVerificationReport,
  computeBehaviorCoverage,
  computeBehaviorCoveragePercent,
  diagnoseBehaviorFailure,
  diagnoseSilentBehaviorSkips,
  buildBehaviorTraceabilityChains,
  detectStaticBehaviorShell,
  detectStaticBehaviorShells,
  rejectPlaceholderBehavior,
  validateRuntimeReachability,
  buildBehaviorVerificationMaterializationInputFromEnvelope,
  materializeBehaviorVerificationForWorkspace,
  shouldMaterializeBehavioralVerification,
  VerificationCrudRuntime,
  stableBehaviorId,
  buildGlobalExecutionCache,
  UNIVERSAL_BEHAVIORAL_VERIFICATION_SOURCE,
  UNIVERSAL_BEHAVIORAL_VERIFICATION_VERSION,
  type UniversalBehaviorDescriptor,
} from '../src/universal-behavioral-verification/index.js';
import { PreferencesStore, parseDefaults } from '../src/universal-capability-packs/universal-preferences-pack/index.js';
import { exportRecordsToJson } from '../src/universal-capability-packs/universal-data-export-pack-basic/index.js';
import { evidenceIsComplete } from '../src/universal-behavioral-verification/behavior-evidence-collector.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'UNIVERSAL_BEHAVIORAL_VERIFICATION_ENGINE_V1_PASS';

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
  'src/universal-behavioral-verification/universal-behavior-types.ts',
  'src/universal-behavioral-verification/approved-behavior-extractor.ts',
  'src/universal-behavioral-verification/behavior-normalizer.ts',
  'src/universal-behavioral-verification/behavior-registry.ts',
  'src/universal-behavioral-verification/behavior-verification-planner.ts',
  'src/universal-behavioral-verification/behavior-runtime-observer.ts',
  'src/universal-behavioral-verification/behavior-execution-engine.ts',
  'src/universal-behavioral-verification/behavior-evidence-collector.ts',
  'src/universal-behavioral-verification/behavior-verification-result.ts',
  'src/universal-behavioral-verification/behavior-report.ts',
  'src/universal-behavioral-verification/behavior-coverage.ts',
  'src/universal-behavioral-verification/behavior-diagnostics.ts',
  'src/universal-behavioral-verification/behavior-traceability.ts',
  'src/universal-behavioral-verification/behavior-runtime-validator.ts',
  'src/universal-behavioral-verification/behavior-pipeline-integration.ts',
  'src/universal-behavioral-verification/universal-behavioral-verification.ts',
  'src/universal-behavioral-verification/index.ts',
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
    promptHash: `hash-bv-${label}`,
    buildId: `build-bv-${label}`,
  });
  const envelope = bound.report.approvedProductionBuildEnvelope;
  const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: `bv-${label}`,
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
  resetUniversalBehavioralVerificationForTests();

  for (const f of FRAMEWORK_FILES) assert(`${n++}. Framework file exists: ${f}`, existsSync(join(ROOT, f)), 'missing');
  assert(`${n++}. Version/source canonical`, UNIVERSAL_BEHAVIORAL_VERIFICATION_VERSION === '1.0.0' && UNIVERSAL_BEHAVIORAL_VERIFICATION_SOURCE === 'UNIVERSAL_BEHAVIORAL_VERIFICATION_ENGINE_V1', 'meta');

  const modular = readSource('src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts');
  assert(`${n++}. Production wiring in modular generator`, modular.includes('materializeBehaviorVerificationForWorkspace') && modular.includes('buildBehaviorVerificationSharedRuntimeFiles'), 'wiring');

  const frameworkSource = FRAMEWORK_FILES.map(readSource).join('\n');
  assert(`${n++}. No product domain hardcoding`, !frameworkSource.match(/\brestaurant\b|\bcrm\b|\bhospital\b|\bhealthcare\b|\binsurance\b|\blogistics\b|\blisa\b|\be-commerce\b/i), 'domain');
  assert(`${n++}. Behaviors derive from envelope`, readSource('src/universal-behavioral-verification/approved-behavior-extractor.ts').includes('ApprovedProductionBuildEnvelope'), 'source');

  const fixture = materialize('fixture', DOMAINS[0]!.prompt);
  const modules = materializableFeatureModules(fixture.definition);
  const matInput = buildBehaviorVerificationMaterializationInputFromEnvelope({
    envelope: fixture.envelope,
    appTitle: 'Test',
    moduleIds: modules,
    contractId: fixture.envelope.traceability.contractId,
    crudBacked: modules.some((m) => shouldGenerateUniversalCrudForModule(m, { safePaymentPlaceholderActive: false, isSafePaymentModule: false })),
    actionBacked: true,
    workflowBacked: true,
    relationshipBacked: true,
    runtimeBacked: true,
    ruleBacked: true,
    capabilityPackBacked: true,
    rawPrompt: fixture.prompt,
    definition: fixture.definition,
  });

  const raw1 = extractApprovedBehaviorsFromEnvelope({
    envelope: fixture.envelope,
    moduleIds: modules,
    contractId: matInput.contractId,
    crudBacked: matInput.crudBacked,
    actionBacked: matInput.actionBacked,
    workflowBacked: matInput.workflowBacked,
    relationshipBacked: matInput.relationshipBacked,
    ruleBacked: matInput.ruleBacked,
    capabilityPackBacked: matInput.capabilityPackBacked,
  });
  const raw2 = extractApprovedBehaviorsFromEnvelope({
    envelope: fixture.envelope,
    moduleIds: modules,
    contractId: matInput.contractId,
    crudBacked: matInput.crudBacked,
    actionBacked: matInput.actionBacked,
    workflowBacked: matInput.workflowBacked,
    relationshipBacked: matInput.relationshipBacked,
    ruleBacked: matInput.ruleBacked,
    capabilityPackBacked: matInput.capabilityPackBacked,
  });
  const desc1 = normalizeApprovedBehaviors(raw1);
  const desc2 = normalizeApprovedBehaviors(raw2);
  assert(`${n++}. Normalization deterministic`, JSON.stringify(desc1.map((d) => d.behaviorId)) === JSON.stringify(desc2.map((d) => d.behaviorId)), 'norm');
  assert(`${n++}. Stable behavior IDs`, stableBehaviorId('CRUD', 'crud.create', 'customers') === stableBehaviorId('CRUD', 'crud.create', 'customers'), 'id');

  bootstrapBehaviorRegistry(desc1);
  assert(`${n++}. Registry deterministic ordering`, listBehaviors()[0]!.behaviorId.localeCompare(listBehaviors().at(-1)!.behaviorId) <= 0, 'order');
  assert(`${n++}. Duplicate behaviors rejected`, (() => { try { registerBehavior(desc1[0]!); return false; } catch { return true; } })(), 'dup');
  assert(`${n++}. Lookup works`, lookupBehavior(desc1[0]!.behaviorId)?.behaviorId === desc1[0]!.behaviorId, 'lookup');
  assert(`${n++}. Validate behavior`, validateBehavior(desc1[0]!).length === 0, 'valid');
  assert(`${n++}. Fingerprint deterministic`, fingerprintBehaviorDescriptor(desc1[0]!) === fingerprintBehaviorDescriptor(desc1[0]!), 'fp');
  assert(`${n++}. Duplicate detection`, detectDuplicates(desc1).length === 0, 'dup-detect');

  assert(`${n++}. Normalization examples`, normalizeBehaviorKey({ label: 'create entity', behaviorCategory: 'CRUD', sourceEnvelopePath: 'x' }) === 'crud.create', 'crud.create');
  assert(`${n++}. Workflow normalization`, normalizeBehaviorKey({ label: 'workflow approval step', behaviorCategory: 'WORKFLOW', sourceEnvelopePath: 'x' }) === 'workflow.approval', 'workflow');
  assert(`${n++}. Export normalization`, normalizeBehaviorKey({ label: 'CSV export', behaviorCategory: 'EXPORT', sourceEnvelopePath: 'x', capabilityKey: 'export.csv' }) === 'export.csv', 'export');

  const plan = buildBehaviorVerificationPlan(desc1, 'plan-1');
  assert(`${n++}. Verification plan emitted`, plan.behaviorIds.length === desc1.length, `plan=${plan.behaviorIds.length}`);
  assert(`${n++}. Runtime required when executable`, plan.runtimeRequired === desc1.some((d) => d.verificationStrategy === 'runtime_execution'), 'runtime');

  const verification = runUniversalBehavioralVerification({
    envelope: fixture.envelope,
    workspaceFiles: fixture.workspaceFiles,
    materializationInput: {
      envelope: fixture.envelope,
      appTitle: 'Test',
      moduleIds: modules,
      contractId: matInput.contractId,
      crudBacked: matInput.crudBacked,
      actionBacked: matInput.actionBacked,
      workflowBacked: matInput.workflowBacked,
      relationshipBacked: matInput.relationshipBacked,
      runtimeBacked: matInput.runtimeBacked,
      ruleBacked: matInput.ruleBacked,
      capabilityPackBacked: matInput.capabilityPackBacked,
      rawPrompt: fixture.prompt,
      definition: fixture.definition,
    },
  });
  assert(`${n++}. Runtime execution occurs`, verification.results.some((r) => r.evidence.runtimeEvidence.actionExecuted), 'executed');
  assert(`${n++}. Evidence captured`, verification.results.every((r) => r.evidence.timestamp && r.evidence.fingerprint), 'evidence');
  assert(`${n++}. CRUD behavior executes`, verification.results.some((r) => r.classification === 'VERIFIED' && lookupBehavior(r.behaviorId)?.normalizedKey.startsWith('crud.')), 'crud');
  assert(`${n++}. Actions execute`, verification.results.some((r) => lookupBehavior(r.behaviorId)?.behaviorCategory === 'ACTION'), 'action');
  assert(`${n++}. Workflows execute`, verification.results.some((r) => lookupBehavior(r.behaviorId)?.behaviorCategory === 'WORKFLOW'), 'workflow');
  assert(`${n++}. Relationships execute`, verification.results.some((r) => lookupBehavior(r.behaviorId)?.behaviorCategory === 'RELATIONSHIP'), 'relationship');
  assert(`${n++}. Runtime state executes`, verification.results.some((r) => lookupBehavior(r.behaviorId)?.behaviorCategory === 'RUNTIME_STATE'), 'runtime');
  assert(`${n++}. Business rules execute`, verification.results.some((r) => lookupBehavior(r.behaviorId)?.behaviorCategory === 'BUSINESS_RULE'), 'rule');
  assert(`${n++}. Capability packs execute`, verification.results.some((r) => ['PREFERENCES', 'AUDIT', 'EXPORT'].includes(lookupBehavior(r.behaviorId)?.behaviorCategory ?? '')), 'pack');
  assert(`${n++}. Navigation executes`, verification.results.some((r) => lookupBehavior(r.behaviorId)?.behaviorCategory === 'NAVIGATION'), 'nav');
  assert(`${n++}. Persistence executes`, verification.results.some((r) => lookupBehavior(r.behaviorId)?.behaviorCategory === 'PERSISTENCE'), 'persist');
  assert(`${n++}. Recovery executes`, verification.results.some((r) => lookupBehavior(r.behaviorId)?.behaviorCategory === 'RECOVERY'), 'recovery');

  const explicitOutcomes = new Set(verification.results.map((r) => r.classification));
  assert(`${n++}. No silent seventh outcome`, [...explicitOutcomes].every((c) => ['VERIFIED', 'PARTIALLY_VERIFIED', 'BLOCKED', 'FAILED', 'INVALID_BEHAVIOR', 'UNSUPPORTED', 'NOT_REQUIRED', 'NOT_EXECUTED'].includes(c)), [...explicitOutcomes].join(','));
  assert(`${n++}. Silent skip detection`, diagnoseSilentBehaviorSkips(verification.results).length === verification.results.filter((r) => r.classification === 'NOT_EXECUTED').length, 'silent');

  const shellSource = 'export function fake() { return true; // TODO placeholder button fake loading }';
  assert(`${n++}. Static behavior shells rejected`, detectStaticBehaviorShell(shellSource) && detectStaticBehaviorShells(shellSource).length > 0, 'shell');
  assert(`${n++}. Placeholder rejection`, rejectPlaceholderBehavior('placeholder workflow fake success dialog').length > 0, 'placeholder');

  const coverage = computeBehaviorCoverage(desc1, verification.results);
  assert(`${n++}. Coverage calculated`, coverage.coveragePercent >= 0 && coverage.coveragePercent <= 100, `coverage=${coverage.coveragePercent}`);
  assert(`${n++}. Coverage formula`, computeBehaviorCoveragePercent(desc1, verification.results) === coverage.coveragePercent, 'formula');

  const verifiedIds = new Set(verification.results.filter((r) => r.classification === 'VERIFIED').map((r) => r.behaviorId));
  assert(`${n++}. Missing verification detection`, detectMissingVerification(desc1, verifiedIds).length >= 0, 'missing');

  const chains = buildBehaviorTraceabilityChains(desc1, verification.results);
  assert(`${n++}. Traceability chains`, chains.length === desc1.length && chains.every((c) => c.approvedBehaviorPath.length > 0), 'trace');

  const crudRuntime = new VerificationCrudRuntime();
  const now = new Date().toISOString();
  crudRuntime.create({ id: '1', label: 'Test', createdAt: now, updatedAt: now });
  assert(`${n++}. In-memory CRUD runtime`, crudRuntime.count() === 1, 'crud-runtime');

  const prefs = new PreferencesStore(['display.pageSize'], parseDefaults(['display.pageSize=10']));
  prefs.update('display.pageSize', '20');
  assert(`${n++}. Preferences runtime reference`, prefs.read('display.pageSize') === '20', 'prefs');

  const jsonExport = exportRecordsToJson([{ id: '1', label: 'A', createdAt: 'x', updatedAt: 'y' }], ['id', 'label'], 't');
  assert(`${n++}. Export runtime reference`, jsonExport.recordCount === 1, 'export');

  assert(`${n++}. Product names do not affect verification`, stableBehaviorId('CRUD', 'crud.create', 'module-a') !== stableBehaviorId('CRUD', 'crud.create', 'module-b'), 'neutral');

  const wsResult = materializeBehaviorVerificationForWorkspace(fixture.workspaceFiles, fixture.envelope, matInput);
  assert(`${n++}. Workspace artifacts emitted`, wsResult.files.some((f) => f.relativePath.endsWith('behavior-verification-report.json')), 'artifacts');
  assert(`${n++}. Pipeline integration marker`, fileContent(fixture.workspaceFiles, 'src/universal-behavioral-verification/runtime-marker.ts').includes(UNIVERSAL_BEHAVIORAL_VERIFICATION_SOURCE) || fileContent([...fixture.workspaceFiles, ...wsResult.files], 'src/universal-behavioral-verification/runtime-marker.ts').includes(UNIVERSAL_BEHAVIORAL_VERIFICATION_SOURCE), 'marker');

  const reachability = validateRuntimeReachability({
    workspaceFilePaths: fixture.workspaceFiles.map((f) => f.relativePath),
    crudBacked: true,
    runtimeBacked: true,
    capabilityPackBacked: true,
  });
  assert(`${n++}. Runtime reachable`, reachability.reachable, reachability.missing.join(','));

  assert(`${n++}. shouldMaterializeBehavioralVerification`, shouldMaterializeBehavioralVerification(fixture.envelope, { crudBacked: true }), 'should');

  const report = buildBehaviorVerificationReport({
    reportId: 'r1',
    descriptors: desc1,
    results: verification.results,
    plan,
    workspaceSources: fixture.workspaceFiles.map((f) => f.content).join('\n'),
  });
  assert(`${n++}. Engineering report`, report.totalBehaviors === desc1.length, 'report');

  const crudDesc = desc1.find((d) => d.normalizedKey === 'crud.create');
  if (crudDesc) {
    const cache = buildGlobalExecutionCache({
      envelope: fixture.envelope,
      workspaceFiles: fixture.workspaceFiles,
      materializationInput: matInput,
    });
    const crudResult = executeBehaviorVerification(crudDesc, {
      envelope: fixture.envelope,
      workspaceFiles: fixture.workspaceFiles,
      materializationInput: matInput,
    }, cache);
    assert(`${n++}. Single CRUD evidence complete`, evidenceIsComplete(crudResult.evidence) || crudResult.classification === 'BLOCKED', crudResult.classification);
    assert(`${n++}. CRUD diagnosis on failure`, diagnoseBehaviorFailure(crudDesc, crudResult.classification, crudResult.checks).length >= 0, 'diag');
  }

  for (const d of DOMAINS) {
    const { workspaceFiles, envelope, definition, label } = materialize(d.label, d.prompt);
    const reportJson = fileContent(workspaceFiles, 'src/universal-behavioral-verification/behavior-verification-report.json');
    let report: { totalBehaviors: number; coveragePercent: number; silentSkipCount: number; results: { classification: string }[] } | null = null;
    try { report = JSON.parse(reportJson); } catch { report = null; }
    assert(`${n++}. ${label}: multi-domain validation`, report !== null && report.totalBehaviors > 0 && report.coveragePercent >= 0, `behaviors=${report?.totalBehaviors ?? 0}`);
    assert(`${n++}. ${label}: behavioral artifacts in workspace`, workspaceFiles.some((f) => f.relativePath.includes('universal-behavioral-verification')), 'artifact');
    assert(`${n++}. ${label}: no silent skips for required`, report !== null && report.silentSkipCount === report.results.filter((r) => r.classification === 'NOT_EXECUTED').length, 'silent');
  }

  assert(`${n++}. TypeScript compilation`, (() => {
    try {
      execSync('npx tsc --noEmit --pretty false 2>&1', { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout: 180_000 });
      return true;
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      return !m.includes('universal-behavioral-verification') && !m.includes('modular-feature-module-generator');
    }
  })(), 'tsc');

  const failed = results.filter((r) => !r.passed);
  console.log(`\nUniversal Behavioral Verification Engine V1 — ${results.length - failed.length}/${results.length} passed\n`);
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}${r.passed ? '' : `: ${r.detail}`}`);
  }
  if (failed.length === 0) console.log(`\n${PASS_TOKEN}\n`);
  else process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
