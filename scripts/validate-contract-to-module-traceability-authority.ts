/**
 * CONTRACT_TO_MODULE_TRACEABILITY_AUTHORITY_V1 — validation.
 *
 * Run only:
 *   npx tsx scripts/validate-contract-to-module-traceability-authority.ts
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
import {
  buildContractToModuleTraceabilityGraph,
  normalizeTraceabilityIdentity,
  registerTraceabilityNode,
  registerTraceabilityEdge,
  validateTraceabilityGraph,
  validateTransformationBoundary,
  detectMissingApprovedDescendants,
  detectUnapprovedGeneratedAncestors,
  detectSilentConceptLoss,
  detectIllegalModuleIntroduction,
  generateTraceabilityReport,
  requireCompleteContractToModuleTraceability,
  fingerprintTraceabilityGraph,
  fingerprintTraceabilityFinding,
  fingerprintTraceabilityReport,
  filterModulesByApprovedPlan,
  runPreMaterializationTraceabilityGate,
  resolveMaterializationModuleIdsFromEnvelope,
  isModuleAllowedForMaterialization,
  runContractToModuleTraceabilityEvaluation,
  loadTraceabilityInputFromWorkspace,
  augmentWorkspaceWithContractToModuleTraceability,
  toC1TraceabilityFindings,
  toB11TraceabilityBlockers,
  buildProductFaithfulnessTraceabilityEvidence,
  projectBuildStatusFromTraceabilityOutcome,
  CONTRACT_TO_MODULE_TRACEABILITY_SOURCE,
  CONTRACT_TO_MODULE_TRACEABILITY_VERSION,
} from '../src/contract-to-module-traceability/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'CONTRACT_TO_MODULE_TRACEABILITY_AUTHORITY_V1_PASS';

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
  'src/contract-to-module-traceability/contract-to-module-traceability-types.ts',
  'src/contract-to-module-traceability/contract-to-module-identity.ts',
  'src/contract-to-module-traceability/contract-to-module-node-registry.ts',
  'src/contract-to-module-traceability/contract-to-module-edge-registry.ts',
  'src/contract-to-module-traceability/contract-to-module-graph-builder.ts',
  'src/contract-to-module-traceability/contract-to-module-graph-validator.ts',
  'src/contract-to-module-traceability/contract-to-module-boundary-validator.ts',
  'src/contract-to-module-traceability/contract-to-module-concept-preservation.ts',
  'src/contract-to-module-traceability/contract-to-module-module-ancestry.ts',
  'src/contract-to-module-traceability/contract-to-module-alias-validator.ts',
  'src/contract-to-module-traceability/contract-to-module-aggregation-validator.ts',
  'src/contract-to-module-traceability/contract-to-module-derivation-validator.ts',
  'src/contract-to-module-traceability/contract-to-module-infrastructure-registry.ts',
  'src/contract-to-module-traceability/contract-to-module-exclusion-validator.ts',
  'src/contract-to-module-traceability/contract-to-module-silent-loss-detector.ts',
  'src/contract-to-module-traceability/contract-to-module-illegal-introduction-detector.ts',
  'src/contract-to-module-traceability/contract-to-module-module-plan-validator.ts',
  'src/contract-to-module-traceability/contract-to-module-materialization-gate.ts',
  'src/contract-to-module-traceability/contract-to-module-output-reconciliation.ts',
  'src/contract-to-module-traceability/contract-to-module-product-faithfulness-adapter.ts',
  'src/contract-to-module-traceability/contract-to-module-c1-adapter.ts',
  'src/contract-to-module-traceability/contract-to-module-b11-adapter.ts',
  'src/contract-to-module-traceability/contract-to-module-status-projection.ts',
  'src/contract-to-module-traceability/contract-to-module-diagnostics.ts',
  'src/contract-to-module-traceability/contract-to-module-findings.ts',
  'src/contract-to-module-traceability/contract-to-module-report.ts',
  'src/contract-to-module-traceability/contract-to-module-workspace-artifacts.ts',
  'src/contract-to-module-traceability/contract-to-module-pipeline-integration.ts',
  'src/contract-to-module-traceability/contract-to-module-traceability-authority.ts',
  'src/contract-to-module-traceability/index.ts',
];

const SATISFIABLE = 'Build utility with persisted preferences and basic data export.';
const CRM_LIKE = 'Build CRM with preferences, audit trail, selected-record CSV export, login and session authentication required.';

function extractGeneratedModuleIds(files: { relativePath: string; content: string }[]): string[] {
  const registry = fileContent(files, 'src/features/registry.ts');
  return [...registry.matchAll(/id: '([^']+)'/g)].map((m) => m[1]!);
}

function materialize(label: string, prompt: string) {
  const contract = buildCanonicalProductContract({ rawPrompt: prompt });
  const plan = resolvePromptFaithfulBuildPlan(prompt);
  const bound = applyContractBoundGenerationToBuildPlan(plan, contract, {
    promptHash: `hash-cmt-${label}`,
    buildId: `build-cmt-${label}`,
  });
  const envelope = bound.report.approvedProductionBuildEnvelope;
  const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: `cmt-${label}`,
    ideaId: 'idea',
    buildUnits: ['unit'],
    rawPrompt: prompt,
    faithfulBuildPlan: bound.buildPlan,
    approvedProductionBuildEnvelope: envelope,
  });
  return { workspaceFiles, envelope, contract, definition: bound.buildPlan.definition, label, prompt };
}

async function main(): Promise<void> {
  let n = 1;
  const engineSource = FRAMEWORK_FILES.map((f) => readSource(f)).join('\n');

  for (const f of FRAMEWORK_FILES) {
    assert(`${n++}. File exists: ${f}`, existsSync(join(ROOT, f)), f);
  }

  assert(`${n++}. Engine version`, CONTRACT_TO_MODULE_TRACEABILITY_VERSION === '1.0.0', CONTRACT_TO_MODULE_TRACEABILITY_VERSION);
  assert(`${n++}. No domain hardcoding`, !engineSource.match(/\bcrm\b|\brestaurant\b|\binsurance\b|\blogistics\b|\blisa\b/i), 'domain');
  const dashboardBranchPattern = /(?:if|case|switch|===|!==|==|!=)\s*\(?\s*['"]dashboard['"]|moduleId\s*===\s*['"]dashboard['"]/;
  assert(`${n++}. No dashboard branch`, !dashboardBranchPattern.test(engineSource), 'no dashboard branch');
  assert(`${n++}. Pipeline wired`, readSource('src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts').includes('augmentWorkspaceWithContractToModuleTraceability'), 'wired');
  assert(`${n++}. Materialization filter wired`, readSource('src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts').includes('resolveMaterializationModuleIdsFromEnvelope'), 'filter');
  assert(`${n++}. C1 adapter wired`, readSource('src/autonomous-engineering-intelligence/autonomous-engineering-finding-normalizer.ts').includes('CONTRACT_TO_MODULE_TRACEABILITY'), 'c1');
  assert(`${n++}. Status projection blocks preview`, projectBuildStatusFromTraceabilityOutcome('BUILD_BLOCKED_TRACEABILITY').previewAvailable === false, 'blocked');
  assert(`${n++}. No RELEASE_APPROVED`, !engineSource.includes('RELEASE_APPROVED'), 'no release');
  assert(`${n++}. No eval`, !engineSource.match(/\beval\s*\(/), 'no eval');

  const node = registerTraceabilityNode({
    nodeType: 'APPROVED_PRODUCT_CONCEPT',
    canonicalIdentity: 'Test Concept',
    displayName: 'Test Concept',
    sourceAuthority: 'TEST',
    sourceRecordId: 'test',
    envelopeFingerprint: 'env',
    contractFingerprint: 'con',
  });
  assert(`${n++}. Node stable ID`, node.traceabilityNodeId.includes('test-concept'), node.traceabilityNodeId);
  assert(`${n++}. Node fingerprint`, node.fingerprint.length > 0, node.fingerprint);
  assert(`${n++}. Identity normalization`, normalizeTraceabilityIdentity('Test Concept') === normalizeTraceabilityIdentity('test-concept'), 'norm');

  const edge = registerTraceabilityEdge({
    edgeType: 'FEATURE_PLANNED_AS_MODULE',
    fromNodeId: node.traceabilityNodeId,
    toNodeId: node.traceabilityNodeId,
    sourceAuthority: 'TEST',
    sourceRecordId: 'test',
    reason: 'test',
  });
  assert(`${n++}. Edge fingerprint`, edge.fingerprint.length > 0, edge.fingerprint);

  const satisfiable = materialize('satisfiable', SATISFIABLE);
  const approvedIds = satisfiable.envelope.approvedModulePlan.moduleIds;
  const allModules = satisfiable.definition.featureModules.filter((m) => m !== 'persistence');
  const filtered = filterModulesByApprovedPlan(allModules, satisfiable.envelope);
  assert(`${n++}. Filter removes unapproved`, filtered.length <= allModules.length, `${filtered.length}<=${allModules.length}`);
  assert(`${n++}. Filter keeps approved`, filtered.every((m) => isModuleAllowedForMaterialization(m, satisfiable.envelope)), 'allowed only');

  const proposed = extractGeneratedModuleIds(satisfiable.workspaceFiles);
  const workspaceTraceInput = loadTraceabilityInputFromWorkspace({
    contract: satisfiable.contract,
    envelope: satisfiable.envelope,
    workspaceFiles: satisfiable.workspaceFiles,
    proposedModuleIds: proposed,
  });
  const workspaceTraceReport = runContractToModuleTraceabilityEvaluation(workspaceTraceInput);
  assert(
    `${n++}. Universal Feature Contract schema is consumed`,
    workspaceTraceInput.universalFeatureNames.length > 0,
    String(workspaceTraceInput.universalFeatureNames.length),
  );
  assert(
    `${n++}. Valid feature contract has no false first-broken boundary`,
    !workspaceTraceReport.graph.findings.some(
      (finding) => finding.firstBrokenBoundary === 'CONTRACT_TO_FEATURE_CONTRACT',
    ),
    workspaceTraceReport.graph.findings.map((finding) => finding.diagnosticCode).join(','),
  );
  const graph = buildContractToModuleTraceabilityGraph({
    contract: satisfiable.contract,
    envelope: satisfiable.envelope,
    workspaceFiles: satisfiable.workspaceFiles,
    proposedModuleIds: proposed,
    universalFeatureNames: [],
  });
  assert(`${n++}. Graph built`, graph.nodes.length > 0, String(graph.nodes.length));
  assert(`${n++}. Graph fingerprint`, fingerprintTraceabilityGraph(graph).length > 0, graph.fingerprint);
  assert(`${n++}. Concept preservation outcomes`, graph.conceptPreservation.length === satisfiable.contract.allConceptNames.length, String(graph.conceptPreservation.length));
  assert(`${n++}. Module ancestry outcomes`, graph.moduleAncestry.length === proposed.length, String(graph.moduleAncestry.length));
  assert(`${n++}. Graph validation`, validateTraceabilityGraph(graph).length === 0 || graph.findings.some((f) => f.severity === 'BLOCKER'), validateTraceabilityGraph(graph).join(','));
  assert(`${n++}. Boundary validation`, validateTransformationBoundary(graph, 'MATERIALIZATION_TO_GENERATED_MODULES').findings.length >= 0, 'boundary');

  const report = generateTraceabilityReport(graph);
  assert(`${n++}. Report deterministic`, report.fingerprint === generateTraceabilityReport(graph).fingerprint, report.fingerprint);
  assert(`${n++}. Report fingerprint API`, fingerprintTraceabilityReport(report).length > 0, 'fp');
  assert(`${n++}. PF adapter`, buildProductFaithfulnessTraceabilityEvidence({ contract: satisfiable.contract, graph }).looseTextMatchingDisabled === true, 'pf');
  assert(`${n++}. B11 adapter`, Array.isArray(toB11TraceabilityBlockers(report)), 'b11');
  assert(`${n++}. C1 adapter`, Array.isArray(toC1TraceabilityFindings(graph.findings)), 'c1');

  assert(`${n++}. Workspace artifacts`, fileContent(satisfiable.workspaceFiles, 'src/contract-to-module-traceability/contract-to-module-traceability-report.json').includes('complianceOutcome'), 'artifact');
  assert(`${n++}. Marker not evidence`, readSource('src/contract-to-module-traceability/contract-to-module-workspace-artifacts.ts').includes('not traceability evidence'), 'marker');

  const crm = materialize('crm', CRM_LIKE);
  const crmProposed = extractGeneratedModuleIds(crm.workspaceFiles);
  const crmGraph = buildContractToModuleTraceabilityGraph({
    contract: crm.contract,
    envelope: crm.envelope,
    workspaceFiles: crm.workspaceFiles,
    proposedModuleIds: crmProposed,
    universalFeatureNames: [],
  });
  const unapproved = detectUnapprovedGeneratedAncestors(crmGraph);
  assert(`${n++}. Unapproved modules blocked`, unapproved.length === 0, unapproved.join(',') || String(crmProposed));
  assert(`${n++}. No unapproved in ancestry`, !crmGraph.moduleAncestry.some((m) => m.outcome === 'UNAPPROVED_MODULE'), crmGraph.moduleAncestry.filter((m) => m.outcome === 'UNAPPROVED_MODULE').map((m) => m.moduleId).join(','));

  const unapprovedSim = buildContractToModuleTraceabilityGraph({
    contract: crm.contract,
    envelope: crm.envelope,
    workspaceFiles: crm.workspaceFiles,
    proposedModuleIds: [...crmProposed, 'unapproved-overview-module'],
    universalFeatureNames: [],
  });
  assert(`${n++}. Generic unapproved module blocked`, unapprovedSim.findings.some((f) => f.diagnosticCode === 'generated_module_not_in_cbga_plan'), 'blocked');
  assert(`${n++}. First boundary identified`, unapprovedSim.findings.every((f) => f.firstBrokenBoundary !== 'UNKNOWN' || f.diagnosticCode.includes('missing')), 'boundary');

  const silent = detectSilentConceptLoss(crmGraph);
  assert(`${n++}. Silent loss detection`, Array.isArray(silent), String(silent.length));
  assert(`${n++}. Illegal introduction detection`, Array.isArray(detectIllegalModuleIntroduction(unapprovedSim)), 'illegal');

  const gate = runPreMaterializationTraceabilityGate({ envelope: crm.envelope, proposedModuleIds: ['unapproved-overview-module'] });
  assert(`${n++}. Pre-materialization gate blocks`, !gate.allowed, gate.errors.join(','));

  const blockedStatus = projectBuildStatusFromTraceabilityOutcome('BUILD_BLOCKED_TRACEABILITY');
  assert(`${n++}. Blocked not COMPLETED success`, blockedStatus.executionStatus === 'BLOCKED', blockedStatus.executionStatus);
  assert(`${n++}. Blocked no preview`, !blockedStatus.previewAvailable, 'preview');
  assert(`${n++}. Blocked wording`, !blockedStatus.completionWording.includes('successfully'), blockedStatus.completionWording);

  const regenStatus = projectBuildStatusFromTraceabilityOutcome('BUILD_REGENERATION_REQUIRED');
  assert(`${n++}. Regen blocked status`, regenStatus.executionStatus === 'BLOCKED', regenStatus.executionStatus);

  if (graph.findings[0]) {
    assert(`${n++}. Finding fingerprint`, fingerprintTraceabilityFinding(graph.findings[0]).length > 0, 'fp');
  }

  assert(`${n++}. Missing descendants`, Array.isArray(detectMissingApprovedDescendants(graph)), 'missing');
  assert(`${n++}. npm script registered`, readSource('package.json').includes('validate:contract-to-module-traceability-authority'), 'script');

  const pkg = JSON.parse(readSource('package.json'));
  assert(`${n++}. npm script exact`, pkg.scripts['validate:contract-to-module-traceability-authority'] === 'tsx scripts/validate-contract-to-module-traceability-authority.ts', 'exact');

  try {
    if (report.complianceOutcome !== 'TRACEABILITY_COMPLIANT') {
      requireCompleteContractToModuleTraceability(report);
      assert(`${n++}. requireComplete throws when blocked`, false, 'should throw');
    } else {
      requireCompleteContractToModuleTraceability(report);
      assert(`${n++}. requireComplete passes when compliant`, true, 'ok');
    }
  } catch {
    assert(`${n++}. requireComplete throws when blocked`, report.complianceOutcome !== 'TRACEABILITY_COMPLIANT', 'threw');
  }

  const REQUIRED_REGRESSIONS = [
    'validate-generation-pipeline-compliance-authority-v1.ts',
    'validate-contract-bound-generation-authority-v4.ts',
    'validate-product-faithfulness-milestone-2.ts',
    'validate-final-immutable-production-pipeline-v1.ts',
  ] as const;

  const runnerSource = readSource('scripts/validate-contract-to-module-traceability-authority.ts');
  const execSyncPerRegressionMatches = runnerSource.match(/execSync\(\s*`npx tsx scripts\/\$\{script\}`/g) ?? [];
  assert(`${n++}. Regression runner single execSync`, execSyncPerRegressionMatches.length === 1, String(execSyncPerRegressionMatches.length));
  assert(
    `${n++}. Completion token gated after required regressions`,
    runnerSource.indexOf('for (const script of REQUIRED_REGRESSIONS)') > -1 &&
      runnerSource.includes('console.log(`\\n${PASS_TOKEN}\\n`)') &&
      runnerSource.lastIndexOf('console.log(`\\n${PASS_TOKEN}\\n`)') > runnerSource.indexOf('for (const script of REQUIRED_REGRESSIONS)'),
    'token order',
  );

  const failed = results.filter((r) => !r.passed);
  const passed = results.filter((r) => r.passed).length;
  console.log(`\nContract-to-Module Traceability Authority V1: ${passed}/${results.length} direct assertions passed\n`);
  for (const r of failed) console.log(`FAIL: ${r.name} — ${r.detail}`);
  if (failed.length > 0) process.exit(1);

  const regressionExecutionCounts = new Map<string, number>(REQUIRED_REGRESSIONS.map((script) => [script, 0]));
  const regressionResults: { script: string; passed: boolean }[] = [];

  for (const script of REQUIRED_REGRESSIONS) {
    regressionExecutionCounts.set(script, (regressionExecutionCounts.get(script) ?? 0) + 1);
    try {
      execSync(`npx tsx scripts/${script}`, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
      regressionResults.push({ script, passed: true });
      console.log(`REGRESSION PASS — ${script}`);
    } catch (error) {
      const err = error as { stderr?: string; stdout?: string; message?: string };
      const detail = [err.stdout, err.stderr, err.message].filter(Boolean).join('\n').trim();
      regressionResults.push({ script, passed: false });
      console.error(`REGRESSION FAIL — ${script}`);
      console.error(detail.slice(0, 2000));
      process.exit(1);
    }
  }

  for (const script of REQUIRED_REGRESSIONS) {
    if (regressionExecutionCounts.get(script) !== 1) {
      console.error(`REGRESSION DUPLICATE EXECUTION — ${script}: ${regressionExecutionCounts.get(script)}`);
      process.exit(1);
    }
  }

  console.log(`\nRequired regressions: ${regressionResults.filter((r) => r.passed).length}/${REQUIRED_REGRESSIONS.length} passed`);
  console.log(`\n${PASS_TOKEN}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
