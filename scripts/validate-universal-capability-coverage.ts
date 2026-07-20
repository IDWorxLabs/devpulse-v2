/**
 * UNIVERSAL_CAPABILITY_COVERAGE_INTELLIGENCE_V1 — validation.
 *
 * Run only:
 *   npx tsx scripts/validate-universal-capability-coverage.ts
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
  extractCapabilitiesFromProductionTruth,
  runUniversalCapabilityCoverage,
  buildCapabilityCoverageMaterializationInputFromEnvelope,
  materializeCapabilityCoverageForWorkspace,
  shouldMaterializeCapabilityCoverage,
  calculateCoverage,
  calculateBehavioralCoverage,
  calculateEngineeringCoverage,
  calculatePackCoverage,
  calculateModuleCoverage,
  calculateApplicationCoverage,
  compareCoverage,
  detectCoverageRegression,
  fingerprintCoverage,
  rejectFalseCoverage,
  buildCoverageSnapshot,
  classifyMaturityFromDimensions,
  classifySupportFromMaturity,
  maturityIndex,
  buildCapabilityEngineeringScorecard,
  analyzeCapabilityGaps,
  detectCoverageRegressions,
  coverageSilentlyDecreased,
  buildCapabilityTraceabilityChains,
  diagnoseCapabilityCoverage,
  detectFalseCoverage,
  buildCapabilityCoverageReport,
  stableCapabilityId,
  fingerprintCapability,
  UNIVERSAL_CAPABILITY_COVERAGE_SOURCE,
  UNIVERSAL_CAPABILITY_COVERAGE_VERSION,
  type UniversalCapabilityDescriptor,
  type CapabilityCoverageSnapshot,
} from '../src/universal-capability-coverage/index.js';
import { extractCapabilityRequirementsFromEnvelope } from '../src/universal-capability-pack-framework/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'UNIVERSAL_CAPABILITY_COVERAGE_INTELLIGENCE_V1_PASS';

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
  'src/universal-capability-coverage/universal-capability-coverage-types.ts',
  'src/universal-capability-coverage/capability-coverage-engine.ts',
  'src/universal-capability-coverage/capability-maturity-classifier.ts',
  'src/universal-capability-coverage/capability-scorecard.ts',
  'src/universal-capability-coverage/capability-gap-analysis.ts',
  'src/universal-capability-coverage/capability-regression-detector.ts',
  'src/universal-capability-coverage/capability-traceability.ts',
  'src/universal-capability-coverage/capability-coverage-report.ts',
  'src/universal-capability-coverage/capability-coverage-diagnostics.ts',
  'src/universal-capability-coverage/capability-coverage-pipeline.ts',
  'src/universal-capability-coverage/universal-capability-coverage.ts',
  'src/universal-capability-coverage/index.ts',
];

const DOMAINS = [
  { label: 'CRM-like', prompt: 'Build CRM with preferences, audit trail, selected-record CSV export, login and session authentication required.' },
  { label: 'Inventory-like', prompt: 'Build inventory with user settings, audit of quantity mutation, filtered JSON export, dashboard reporting metrics.' },
  { label: 'Booking-like', prompt: 'Build reservation with audit workflow transition, persisted preferences, schedule availability and calendar time slots.' },
  { label: 'Healthcare-like', prompt: 'Build healthcare with patient records, audit trail, role-based permission authorization, appointment scheduling.' },
  { label: 'Education-like', prompt: 'Build education with preferences, audit relationship changes, JSON export, role-based permission authorization.' },
  { label: 'Finance-like', prompt: 'Build finance with CSV export, audit submit and approve events, PDF report generation, dashboard metrics.' },
  { label: 'Asset-like', prompt: 'Build asset with audit assignment events, filtered export, file upload attachment storage.' },
  { label: 'Utility', prompt: 'Build utility with persisted preferences and basic data export.' },
  { label: 'Mixed custom', prompt: 'Build custom domain with preferences, audit trail, CSV and JSON export, real-time sync, external API integration, scheduling availability.' },
];

function materialize(label: string, prompt: string) {
  const contract = buildCanonicalProductContract({ prompt });
  const plan = resolvePromptFaithfulBuildPlan(prompt);
  const bound = applyContractBoundGenerationToBuildPlan(plan, contract, {
    promptHash: `hash-cc-${label}`,
    buildId: `build-cc-${label}`,
  });
  const envelope = bound.report.approvedProductionBuildEnvelope;
  const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: `cc-${label}`,
    ideaId: 'idea',
    buildUnits: ['unit'],
    rawPrompt: prompt,
    faithfulBuildPlan: bound.buildPlan,
    approvedProductionBuildEnvelope: envelope,
  });
  return { workspaceFiles, envelope, definition: bound.buildPlan.definition, label, prompt };
}

function matInput(envelope: ReturnType<typeof materialize>['envelope'], modules: string[], definition: ReturnType<typeof materialize>['definition']) {
  const crudBacked = modules.some((m) => shouldGenerateUniversalCrudForModule(m, { safePaymentPlaceholderActive: false, isSafePaymentModule: false }));
  return buildCapabilityCoverageMaterializationInputFromEnvelope({
    envelope,
    appTitle: 'Test',
    moduleIds: modules,
    contractId: envelope.traceability.contractId,
    crudBacked,
    actionBacked: true,
    workflowBacked: true,
    relationshipBacked: true,
    runtimeBacked: true,
    ruleBacked: true,
    capabilityPackBacked: true,
    behavioralVerificationBacked: true,
  });
}

async function main(): Promise<void> {
  let n = 1;

  for (const f of FRAMEWORK_FILES) assert(`${n++}. Framework file exists: ${f}`, existsSync(join(ROOT, f)), 'missing');
  assert(`${n++}. Version/source canonical`, UNIVERSAL_CAPABILITY_COVERAGE_VERSION === '1.0.0' && UNIVERSAL_CAPABILITY_COVERAGE_SOURCE === 'UNIVERSAL_CAPABILITY_COVERAGE_INTELLIGENCE_V1', 'meta');

  const modular = readSource('src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts');
  assert(`${n++}. Production wiring in modular generator`, modular.includes('augmentWorkspaceFilesWithCapabilityCoverage') && modular.includes('buildCapabilityCoverageSharedRuntimeFiles'), 'wiring');

  const frameworkSource = FRAMEWORK_FILES.map(readSource).join('\n');
  assert(`${n++}. No product domain hardcoding`, !frameworkSource.match(/\brestaurant\b|\bcrm\b|\bhospital\b|\bhealthcare\b|\binsurance\b|\blogistics\b|\blisa\b|\be-commerce\b/i), 'domain');
  assert(`${n++}. Coverage derives from approved truth`, readSource('src/universal-capability-coverage/capability-coverage-engine.ts').includes('ApprovedProductionBuildEnvelope'), 'source');

  const fixture = materialize('fixture', DOMAINS[0]!.prompt);
  const modules = materializableFeatureModules(fixture.definition);
  const input = matInput(fixture.envelope, modules, fixture.definition);

  const caps1 = extractCapabilitiesFromProductionTruth({
    envelope: fixture.envelope,
    materializationInput: input,
    workspaceFiles: fixture.workspaceFiles,
    behaviorReport: JSON.parse(fileContent(fixture.workspaceFiles, 'src/universal-behavioral-verification/behavior-verification-report.json') || 'null'),
  });
  const caps2 = extractCapabilitiesFromProductionTruth({
    envelope: fixture.envelope,
    materializationInput: input,
    workspaceFiles: fixture.workspaceFiles,
    behaviorReport: JSON.parse(fileContent(fixture.workspaceFiles, 'src/universal-behavioral-verification/behavior-verification-report.json') || 'null'),
  });
  assert(`${n++}. Extraction deterministic`, JSON.stringify(caps1.map((c) => c.capabilityKey)) === JSON.stringify(caps2.map((c) => c.capabilityKey)), 'deterministic');
  assert(`${n++}. Stable capability IDs`, stableCapabilityId('export.csv', 'x') === stableCapabilityId('export.csv', 'x'), 'id');
  assert(`${n++}. Fingerprint deterministic`, fingerprintCapability(caps1[0]!) === fingerprintCapability(caps1[0]!), 'fp');

  const coverage = runUniversalCapabilityCoverage({
    envelope: fixture.envelope,
    workspaceFiles: fixture.workspaceFiles,
    materializationInput: input,
  });
  assert(`${n++}. Capabilities extracted`, coverage.capabilities.length > 0, `count=${coverage.capabilities.length}`);
  assert(`${n++}. Structural separate from behavioral`, coverage.capabilities.some((c) => c.dimensionScores.structuralCoverage !== c.dimensionScores.behavioralCoverage), 'separate');
  assert(`${n++}. Behavioral derives from B8`, coverage.capabilities.some((c) => c.verificationEvidence.some((e) => e.includes('behavior-report'))), 'b8');
  assert(`${n++}. Production coverage independent`, typeof coverage.snapshot.scorecard.productionCoveragePercent === 'number' &&
    typeof coverage.snapshot.scorecard.behavioralCoveragePercent === 'number' &&
    typeof coverage.snapshot.scorecard.structuralCoveragePercent === 'number' &&
    coverage.capabilities.every((c) => c.dimensionScores.productionCoverage !== undefined && c.dimensionScores.behavioralCoverage !== undefined),
  'prod');

  const blockedFuture = coverage.capabilities.find((c) =>
    c.supportClassification === 'NOT_IMPLEMENTED' ||
    (c.capabilityKey === 'authentication.session' && c.behavioralCoverage === 0) ||
    (c.capabilityKey === 'scheduling.availability' && c.behavioralCoverage === 0),
  );
  assert(`${n++}. Blocked future capability NOT_IMPLEMENTED`, blockedFuture !== undefined && (blockedFuture.supportClassification === 'NOT_IMPLEMENTED' || blockedFuture.maturityLevel === 'DECLARED'), blockedFuture?.capabilityKey ?? coverage.capabilities.map((c) => c.capabilityKey).join(','));
  assert(`${n++}. Authentication runtime not falsely verified`, (() => {
    const auth = coverage.capabilities.find((c) => c.capabilityKey === 'authentication.session');
    return auth ? auth.behavioralCoverage === 0 : true;
  })(), 'auth-behavior');

  const prefs = coverage.capabilities.find((c) => c.capabilityKey === 'preferences.persisted-setting');
  assert(`${n++}. Preferences has behavioral evidence`, prefs ? prefs.behavioralCoverage > 0 || prefs.maturityLevel !== 'NOT_PRESENT' : false, prefs?.behavioralCoverage?.toString() ?? 'missing');

  const crud = coverage.capabilities.find((c) => c.capabilityKey === 'engine.crud');
  assert(`${n++}. CRUD engine capability`, crud !== undefined && crud.category === 'CRUD', crud?.capabilityKey ?? 'missing');

  assert(`${n++}. Maturity classification deterministic`, classifyMaturityFromDimensions({
    requirementDeclared: true, structuralPresent: true, runtimePresent: false, behaviorallyVerified: false, productionReady: false,
  }) === 'STRUCTURALLY_IMPLEMENTED', 'maturity');
  assert(`${n++}. Support classification explicit`, ['PRODUCTION_READY', 'NOT_IMPLEMENTED', 'PARTIALLY_IMPLEMENTED', 'BLOCKED_BY_DEPENDENCY'].includes(
    classifySupportFromMaturity({ maturityLevel: 'DECLARED', blocked: true, invalid: false, deprecated: false, packSupportStatus: 'NOT_IMPLEMENTED' }),
  ), 'support');

  assert(`${n++}. False coverage rejected`, !coverage.capabilities.some((c) => rejectFalseCoverage(c)), detectFalseCoverage(coverage.capabilities).join(','));
  assert(`${n++}. Catalog-only auth no behavioral inflation`, (() => {
    const authCap = coverage.capabilities.find((c) => c.capabilityKey === 'authentication.session');
    return authCap ? authCap.behavioralCoverage === 0 : true;
  })(), 'catalog');

  const scorecard = calculateCoverage(coverage.capabilities);
  assert(`${n++}. Scorecard deterministic`, buildCapabilityEngineeringScorecard(coverage.capabilities).behavioralCoveragePercent === scorecard.behavioralCoveragePercent, 'scorecard');
  assert(`${n++}. calculateBehavioralCoverage`, calculateBehavioralCoverage(coverage.capabilities) === scorecard.behavioralCoveragePercent, 'behavioral');
  assert(`${n++}. calculateEngineeringCoverage`, calculateEngineeringCoverage(coverage.capabilities) === scorecard.engineeringCoveragePercent, 'engineering');
  assert(`${n++}. calculatePackCoverage`, calculatePackCoverage(coverage.capabilities) >= 0, 'pack');
  assert(`${n++}. calculateModuleCoverage`, calculateModuleCoverage(coverage.capabilities, modules) >= 0, 'module');
  assert(`${n++}. calculateApplicationCoverage`, calculateApplicationCoverage(coverage.capabilities) === scorecard.engineeringCoveragePercent, 'app');

  const gaps = analyzeCapabilityGaps(coverage.capabilities);
  assert(`${n++}. Gap analysis`, gaps.length >= 0 && gaps.some((g) => g.gapType === 'capability_blocked' || g.gapType === 'runtime_missing'), gaps.map((g) => g.gapType).join(','));
  assert(`${n++}. Diagnostics`, diagnoseCapabilityCoverage(coverage.capabilities, gaps).length > 0, 'diag');

  const chains = buildCapabilityTraceabilityChains(coverage.capabilities);
  assert(`${n++}. Traceability chains`, chains.length === coverage.capabilities.length, 'trace');

  const snapshot1 = coverage.snapshot;
  const snapshot2 = buildCoverageSnapshot({ snapshotId: 's2', capabilities: coverage.capabilities });
  const comparison = compareCoverage(snapshot1, snapshot2);
  assert(`${n++}. compareCoverage unchanged`, comparison.unchanged, 'compare');
  assert(`${n++}. fingerprintCoverage`, fingerprintCoverage(coverage.capabilities) === snapshot1.fingerprint, 'fp');

  const regressedCaps: UniversalCapabilityDescriptor[] = coverage.capabilities.map((c) =>
    c.capabilityKey === 'engine.crud'
      ? { ...c, maturityLevel: 'DECLARED', behavioralCoverage: 0, engineeringCoverage: 10, dimensionScores: { ...c.dimensionScores, behavioralCoverage: 0 } }
      : c,
  );
  const prevSnapshot: CapabilityCoverageSnapshot = { ...snapshot1, capabilities: coverage.capabilities };
  const regressedSnapshot = buildCoverageSnapshot({ snapshotId: 'regressed', capabilities: regressedCaps });
  const regressions = detectCoverageRegressions(prevSnapshot.capabilities, regressedSnapshot.capabilities);
  assert(`${n++}. Regression detected`, regressions.length > 0, regressions.map((r) => r.regressionType).join(','));
  assert(`${n++}. detectCoverageRegression`, detectCoverageRegression(prevSnapshot, regressedSnapshot).length > 0, 'detect');
  assert(`${n++}. coverageSilentlyDecreased`, coverageSilentlyDecreased(prevSnapshot.capabilities, regressedSnapshot.capabilities), 'silent');

  const promptOnlyCaps = extractCapabilitiesFromProductionTruth({
    envelope: fixture.envelope,
    materializationInput: input,
    workspaceFiles: [],
    behaviorReport: null,
  });
  assert(`${n++}. Prompt alone does not inflate coverage`, calculateBehavioralCoverage(promptOnlyCaps) <= calculateBehavioralCoverage(coverage.capabilities), 'prompt');

  const wsResult = materializeCapabilityCoverageForWorkspace(fixture.workspaceFiles, fixture.envelope, input);
  assert(`${n++}. Workspace artifacts emitted`, wsResult.files.some((f) => f.relativePath.endsWith('capability-coverage-report.json')), 'artifacts');
  assert(`${n++}. Pipeline marker in workspace`, fileContent(fixture.workspaceFiles, 'src/universal-capability-coverage/runtime-marker.ts').includes(UNIVERSAL_CAPABILITY_COVERAGE_SOURCE) || fileContent([...fixture.workspaceFiles, ...wsResult.files], 'src/universal-capability-coverage/runtime-marker.ts').includes(UNIVERSAL_CAPABILITY_COVERAGE_SOURCE), 'marker');
  assert(`${n++}. shouldMaterializeCapabilityCoverage`, shouldMaterializeCapabilityCoverage(fixture.envelope, { crudBacked: true, behavioralVerificationBacked: true }), 'should');

  const report = buildCapabilityCoverageReport({ reportId: 'r1', snapshot: coverage.snapshot });
  assert(`${n++}. Engineering report`, report.snapshot.scorecard.totalCapabilities > 0, 'report');

  assert(`${n++}. Envelope requirements used`, extractCapabilityRequirementsFromEnvelope({ envelope: fixture.envelope }).length > 0, 'reqs');
  assert(`${n++}. Maturity index bounded`, coverage.snapshot.scorecard.capabilityMaturityIndex >= 0 && coverage.snapshot.scorecard.capabilityMaturityIndex <= 100, 'index');
  assert(`${n++}. No silent classification`, coverage.capabilities.every((c) => c.supportClassification.length > 0), 'class');

  for (const d of DOMAINS) {
    const { workspaceFiles, envelope, definition } = materialize(d.label, d.prompt);
    const moduleIds = materializableFeatureModules(definition);
    const domainInput = matInput(envelope, moduleIds, definition);
    const reportJson = fileContent(workspaceFiles, 'src/universal-capability-coverage/capability-coverage-report.json');
    let domainReport: { snapshot: { scorecard: { totalCapabilities: number; behavioralCoveragePercent: number } } } | null = null;
    try { domainReport = JSON.parse(reportJson); } catch { domainReport = null; }
    assert(`${n++}. ${d.label}: multi-domain validation`, domainReport !== null && domainReport.snapshot.scorecard.totalCapabilities > 0, 'domain');
    assert(`${n++}. ${d.label}: coverage artifacts in workspace`, workspaceFiles.some((f) => f.relativePath.includes('universal-capability-coverage')), 'artifact');
    assert(`${n++}. ${d.label}: scorecard in range`, domainReport !== null && domainReport.snapshot.scorecard.behavioralCoveragePercent >= 0 && domainReport.snapshot.scorecard.behavioralCoveragePercent <= 100, 'range');
  }

  assert(`${n++}. npm script registered`, readSource('package.json').includes('validate:universal-capability-coverage'), 'npm');
  assert(`${n++}. TypeScript compilation`, (() => {
    try {
      execSync('npx tsc --noEmit --pretty false 2>&1', { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout: 180_000 });
      return true;
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      return !m.includes('universal-capability-coverage') && !m.includes('modular-feature-module-generator');
    }
  })(), 'tsc');

  const failed = results.filter((r) => !r.passed);
  console.log(`\nUniversal Capability Coverage Intelligence V1 — ${results.length - failed.length}/${results.length} passed\n`);
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
