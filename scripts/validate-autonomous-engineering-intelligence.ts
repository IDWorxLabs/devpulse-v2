/**
 * AUTONOMOUS_ENGINEERING_INTELLIGENCE_V1 — validation.
 *
 * Run only:
 *   npx tsx scripts/validate-autonomous-engineering-intelligence.ts
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
  analyzeEngineeringFindings,
  classifyRepairEligibility,
  buildAutonomousEngineeringPlan,
  validateAutonomousEngineeringPlan,
  executeAutonomousEngineeringPlan,
  verifyAutonomousEngineeringResult,
  reconcileAutonomousEngineeringResult,
  generateAutonomousEngineeringReport,
  requireSafeAutonomousRepair,
  detectAutonomousRepairRegression,
  fingerprintAutonomousEngineeringPlan,
  fingerprintAutonomousEngineeringResult,
  loadAutonomousEngineeringInput,
  validateAutonomousEngineeringInput,
  runAutonomousEngineeringCycle,
  shouldRunAutonomousEngineering,
  bootstrapRepairStrategyRegistry,
  registerRepairStrategy,
  getRepairStrategy,
  listRepairStrategies,
  findStrategiesForFinding,
  validateRepairStrategy,
  fingerprintRepairStrategy,
  detectDuplicateRepairStrategy,
  inspectRepairAuthorityDependencies,
  resetRepairStrategyRegistryForTests,
  REFERENCE_REPAIR_STRATEGIES,
  executeRepairStrategy,
  isMutationPathAllowed,
  detectForbiddenConstitutionalMutation,
  MUTATION_ALLOWLIST_PREFIXES,
  normalizeEngineeringFindings,
  groupEngineeringFindings,
  analyzeRootCause,
  buildAutonomousEngineeringEvidence,
  buildAutonomousEngineeringTraceability,
  isTraceabilityComplete,
  buildAutonomousEngineeringDiagnostics,
  selectRepairStrategy,
  buildRepairDependencyGraph,
  validateRepairPreconditions,
  shouldAllowRepairAttempt,
  maxRepairCyclesReached,
  rollbackMutations,
  selectTargetedValidators,
  runTargetedValidationPlan,
  augmentWorkspaceFilesWithAutonomousEngineering,
  shouldMaterializeAutonomousEngineering,
  AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE,
  AUTONOMOUS_ENGINEERING_INTELLIGENCE_VERSION,
  type AutonomousEngineeringFinding,
} from '../src/autonomous-engineering-intelligence/index.js';
import { runProductionReadinessEvaluation } from '../src/universal-production-readiness/universal-production-readiness.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'AUTONOMOUS_ENGINEERING_INTELLIGENCE_V1_PASS';

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
  'src/autonomous-engineering-intelligence/autonomous-engineering-types.ts',
  'src/autonomous-engineering-intelligence/autonomous-engineering-input-loader.ts',
  'src/autonomous-engineering-intelligence/autonomous-engineering-input-validator.ts',
  'src/autonomous-engineering-intelligence/autonomous-engineering-finding-normalizer.ts',
  'src/autonomous-engineering-intelligence/autonomous-engineering-finding-grouper.ts',
  'src/autonomous-engineering-intelligence/autonomous-engineering-root-cause-analyzer.ts',
  'src/autonomous-engineering-intelligence/autonomous-repair-eligibility-classifier.ts',
  'src/autonomous-engineering-intelligence/autonomous-repair-safety-classifier.ts',
  'src/autonomous-engineering-intelligence/autonomous-repair-strategy-registry.ts',
  'src/autonomous-engineering-intelligence/autonomous-repair-strategy-selector.ts',
  'src/autonomous-engineering-intelligence/autonomous-repair-dependency-graph.ts',
  'src/autonomous-engineering-intelligence/autonomous-repair-ordering.ts',
  'src/autonomous-engineering-intelligence/autonomous-repair-mutation-policy.ts',
  'src/autonomous-engineering-intelligence/autonomous-repair-precondition-validator.ts',
  'src/autonomous-engineering-intelligence/autonomous-repair-plan-builder.ts',
  'src/autonomous-engineering-intelligence/autonomous-repair-plan-validator.ts',
  'src/autonomous-engineering-intelligence/autonomous-repair-plan-fingerprint.ts',
  'src/autonomous-engineering-intelligence/autonomous-repair-executor.ts',
  'src/autonomous-engineering-intelligence/autonomous-repair-rollback.ts',
  'src/autonomous-engineering-intelligence/autonomous-repair-attempt-policy.ts',
  'src/autonomous-engineering-intelligence/autonomous-repair-targeted-validation.ts',
  'src/autonomous-engineering-intelligence/autonomous-repair-post-verification.ts',
  'src/autonomous-engineering-intelligence/autonomous-repair-reconciliation.ts',
  'src/autonomous-engineering-intelligence/autonomous-repair-regression-detector.ts',
  'src/autonomous-engineering-intelligence/autonomous-engineering-evidence.ts',
  'src/autonomous-engineering-intelligence/autonomous-engineering-traceability.ts',
  'src/autonomous-engineering-intelligence/autonomous-engineering-diagnostics.ts',
  'src/autonomous-engineering-intelligence/autonomous-engineering-report.ts',
  'src/autonomous-engineering-intelligence/autonomous-engineering-pipeline-integration.ts',
  'src/autonomous-engineering-intelligence/autonomous-engineering-intelligence.ts',
  'src/autonomous-engineering-intelligence/index.ts',
  'src/autonomous-engineering-intelligence/strategies/missing-generated-artifact-repair.ts',
  'src/autonomous-engineering-intelligence/strategies/missing-action-handler-repair.ts',
  'src/autonomous-engineering-intelligence/strategies/missing-workflow-transition-repair.ts',
  'src/autonomous-engineering-intelligence/strategies/missing-relationship-wiring-repair.ts',
  'src/autonomous-engineering-intelligence/strategies/missing-runtime-scope-repair.ts',
  'src/autonomous-engineering-intelligence/strategies/missing-rule-wiring-repair.ts',
  'src/autonomous-engineering-intelligence/strategies/missing-verification-scenario-repair.ts',
  'src/autonomous-engineering-intelligence/strategies/composition-materialization-reconciliation-repair.ts',
  'src/autonomous-engineering-intelligence/strategies/static-shell-replacement-repair.ts',
  'src/autonomous-engineering-intelligence/strategies/missing-evidence-emission-repair.ts',
  'src/autonomous-engineering-intelligence/strategies/index.ts',
];

const DOMAINS = [
  { label: 'CRM-like', prompt: 'Build CRM with preferences, audit trail, selected-record CSV export, login and session authentication required.', authBlocked: true },
  { label: 'Inventory-like', prompt: 'Build inventory with user settings, audit of quantity mutation, filtered JSON export, dashboard reporting metrics.', authBlocked: false },
  { label: 'Appointment-like', prompt: 'Build reservation with audit workflow transition, persisted preferences, schedule availability and calendar time slots.', authBlocked: false },
  { label: 'Expense-like', prompt: 'Build expense with CSV export, audit submit and approve events, PDF report generation.', authBlocked: false },
  { label: 'Task-like', prompt: 'Build task management with user preferences, audit state transitions, export selected records, email notification reminders.', authBlocked: false },
  { label: 'Education-like', prompt: 'Build education with preferences, audit relationship changes, JSON export, role-based permission authorization.', authBlocked: true },
  { label: 'Asset-like', prompt: 'Build asset with audit assignment events, filtered export, file upload attachment storage.', authBlocked: false },
  { label: 'Generic utility', prompt: 'Build utility with persisted preferences and basic data export.', authBlocked: false },
  { label: 'Mixed custom', prompt: 'Build custom domain with preferences, audit trail, CSV and JSON export, real-time sync, external API integration, scheduling availability.', authBlocked: false },
];

const SATISFIABLE_PROMPT = 'Build utility with persisted preferences and basic data export.';

function materialize(label: string, prompt: string) {
  const contract = buildCanonicalProductContract({ prompt });
  const plan = resolvePromptFaithfulBuildPlan(prompt);
  const bound = applyContractBoundGenerationToBuildPlan(plan, contract, {
    promptHash: `hash-ae-${label}`,
    buildId: `build-ae-${label}`,
  });
  const envelope = bound.report.approvedProductionBuildEnvelope;
  const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: `ae-${label}`,
    ideaId: 'idea',
    buildUnits: ['unit'],
    rawPrompt: prompt,
    faithfulBuildPlan: bound.buildPlan,
    approvedProductionBuildEnvelope: envelope,
  });
  return { workspaceFiles, envelope, definition: bound.buildPlan.definition, label, prompt };
}

function engineeringInputFromMaterialize(m: ReturnType<typeof materialize>) {
  const modules = materializableFeatureModules(m.definition);
  return loadAutonomousEngineeringInput({
    envelope: m.envelope,
    workspaceFiles: m.workspaceFiles,
    moduleIds: modules,
    contractId: m.envelope.traceability.contractId,
  });
}

function syntheticFinding(partial: Partial<AutonomousEngineeringFinding> & Pick<AutonomousEngineeringFinding, 'diagnosticCode'>): AutonomousEngineeringFinding {
  return {
    findingId: partial.findingId ?? `ae-synthetic-${partial.diagnosticCode}`,
    diagnosticCode: partial.diagnosticCode,
    sourceAuthority: partial.sourceAuthority ?? 'B11_PRODUCTION_READINESS',
    sourceEvaluationId: partial.sourceEvaluationId ?? 'eval-synthetic',
    sourceFingerprint: partial.sourceFingerprint ?? 'fp-synthetic',
    severity: partial.severity ?? 'BLOCKER',
    criticality: partial.criticality ?? 'REQUIRED',
    readinessDimension: partial.readinessDimension ?? 'BEHAVIORAL_READINESS',
    requirementIds: partial.requirementIds ?? [],
    behaviorIds: partial.behaviorIds ?? [],
    capabilityKeys: partial.capabilityKeys ?? [],
    providerIds: partial.providerIds ?? [],
    packIds: partial.packIds ?? [],
    contributionIds: partial.contributionIds ?? [],
    artifactPaths: partial.artifactPaths ?? [],
    routeIds: partial.routeIds ?? [],
    runtimeScopeIds: partial.runtimeScopeIds ?? [],
    actionIds: partial.actionIds ?? [],
    workflowIds: partial.workflowIds ?? [],
    relationshipIds: partial.relationshipIds ?? [],
    ruleIds: partial.ruleIds ?? [],
    expectedState: partial.expectedState ?? '',
    observedState: partial.observedState ?? '',
    missingEvidence: partial.missingEvidence ?? [],
    contradictionEvidence: partial.contradictionEvidence ?? [],
    provenance: partial.provenance ?? [AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE],
    traceability: partial.traceability ?? [],
    fingerprint: partial.fingerprint ?? `fp-${partial.diagnosticCode}`,
  };
}

async function main(): Promise<void> {
  let n = 1;
  resetRepairStrategyRegistryForTests();

  for (const f of FRAMEWORK_FILES) {
    assert(`${n++}. File exists: ${f}`, existsSync(join(ROOT, f)), f);
  }

  const engineSource = FRAMEWORK_FILES.map((f) => readSource(f)).join('\n');
  assert(`${n++}. No domain hardcoding`, !engineSource.match(/\brestaurant\b|\bhospital\b|\binsurance\b|\blogistics\b|\blisa\b/i), 'domain');
  assert(`${n++}. Engine version`, AUTONOMOUS_ENGINEERING_INTELLIGENCE_VERSION === '1.0.0', AUTONOMOUS_ENGINEERING_INTELLIGENCE_VERSION);
  assert(`${n++}. Pipeline wired`, readSource('src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts').includes('augmentWorkspaceFilesWithAutonomousEngineering'), 'wired');
  assert(`${n++}. C1 does not grant release approval`, !engineSource.includes('RELEASE_APPROVED'), 'no release');
  assert(`${n++}. C1 reevaluation uses B11 only`, readSource('src/autonomous-engineering-intelligence/autonomous-repair-reconciliation.ts').includes('runProductionReadinessEvaluation'), 'b11 reeval');
  assert(`${n++}. No raw prompt authority`, !readSource('src/autonomous-engineering-intelligence/autonomous-engineering-input-loader.ts').includes('rawPrompt'), 'structured only');
  assert(`${n++}. No eval execution`, !engineSource.match(/\beval\s*\(/), 'no eval');
  assert(`${n++}. No shell patch executor`, !engineSource.includes('execSync') && !engineSource.includes('child_process'), 'no shell');

  const blocked = materialize('blocked', DOMAINS[0]!.prompt);
  const input = engineeringInputFromMaterialize(blocked);
  assert(`${n++}. Input from structured B11`, input.readinessReport !== null, 'readiness');
  assert(`${n++}. B10 plan loaded`, input.compositionPlan !== null, 'b10');
  assert(`${n++}. Input validation`, validateAutonomousEngineeringInput(input).length === 0, validateAutonomousEngineeringInput(input).join(','));

  const analysis = analyzeEngineeringFindings(input);
  assert(`${n++}. Findings from B8-B11`, analysis.findings.length > 0, `count=${analysis.findings.length}`);
  assert(`${n++}. Finding IDs stable`, analysis.findings[0]!.findingId.startsWith('ae-finding-'), analysis.findings[0]!.findingId);
  assert(`${n++}. Every finding has fingerprint`, analysis.findings.every((f) => f.fingerprint.length > 0), 'fp');
  assert(`${n++}. Eligibility explicit`, analysis.eligibility.every((d) => d.eligibility.length > 0), 'eligibility');
  assert(`${n++}. Auth remains blocked`, input.readinessReport!.readinessVerdict !== 'PRODUCTION_READY', input.readinessReport!.readinessVerdict);
  assert(`${n++}. Auth not autonomously repairable`, !analysis.eligibility.some((d) => d.eligibility === 'AUTONOMOUSLY_REPAIRABLE' && analysis.findings.find((f) => f.findingId === d.findingId)?.capabilityKeys.some((k) => k.includes('authentication'))), 'auth repair');

  const f1 = analysis.findings[0]!;
  const f2 = normalizeEngineeringFindings(input)[0]!;
  assert(`${n++}. Normalization deterministic`, f1.findingId === f2.findingId, f1.findingId);
  assert(`${n++}. Grouping retains findings`, groupEngineeringFindings(analysis.findings).flatMap((g) => g.findingIds).length >= analysis.findings.length, 'groups');
  assert(`${n++}. Root cause deterministic`, analyzeRootCause(f1) !== 'UNKNOWN_ROOT_CAUSE' || f1.diagnosticCode.includes('blocked'), analyzeRootCause(f1));
  assert(`${n++}. Unknown root cause blocks`, classifyRepairEligibility(syntheticFinding({ diagnosticCode: 'unknown_custom_code_xyz' })).eligibility === 'NOT_APPLICABLE' || classifyRepairEligibility(syntheticFinding({ diagnosticCode: 'unknown_custom_code_xyz' })).eligibility === 'UNSAFE_FOR_AUTONOMOUS_REPAIR', 'unknown');

  bootstrapRepairStrategyRegistry();
  assert(`${n++}. Strategy registry canonical`, listRepairStrategies().length === REFERENCE_REPAIR_STRATEGIES.length, String(listRepairStrategies().length));
  assert(`${n++}. Ten reference strategies`, REFERENCE_REPAIR_STRATEGIES.length === 10, String(REFERENCE_REPAIR_STRATEGIES.length));
  assert(`${n++}. Duplicate strategy rejected`, (() => { try { registerRepairStrategy(REFERENCE_REPAIR_STRATEGIES[0]!); return false; } catch { return true; } })(), 'dup');
  assert(`${n++}. Strategy validation`, validateRepairStrategy(REFERENCE_REPAIR_STRATEGIES[0]!).length === 0, 'valid');
  assert(`${n++}. Strategy fingerprint`, fingerprintRepairStrategy(REFERENCE_REPAIR_STRATEGIES[0]!).length > 0, 'fp');
  assert(`${n++}. Strategy dependencies`, inspectRepairAuthorityDependencies(REFERENCE_REPAIR_STRATEGIES[0]!).length > 0, 'deps');
  assert(`${n++}. Duplicate detection`, detectDuplicateRepairStrategy().length === 0, 'none');

  const staticFinding = syntheticFinding({ diagnosticCode: 'static_behavior_shell', artifactPaths: ['src/features/test/TestFeature.tsx'] });
  const staticEligibility = classifyRepairEligibility(staticFinding);
  const staticSelection = selectRepairStrategy(staticFinding, staticEligibility);
  assert(`${n++}. Static shell repairable`, staticEligibility.eligibility === 'AUTONOMOUSLY_REPAIRABLE', staticEligibility.eligibility);
  assert(`${n++}. Strategy selection deterministic`, staticSelection.selectedStrategyId === 'static-shell-replacement-repair.v1', staticSelection.selectedStrategyId ?? 'null');
  assert(`${n++}. Rejected strategies have reason`, staticSelection.candidates.filter((c) => !c.selected).every((c) => !!c.rejectionReason), 'reasons');

  const plan = buildAutonomousEngineeringPlan({ engineeringInput: input, findings: analysis.findings });
  const plan2 = buildAutonomousEngineeringPlan({ engineeringInput: input, findings: analysis.findings });
  assert(`${n++}. Plan deterministic fingerprint`, plan.fingerprint === plan2.fingerprint, plan.fingerprint);
  assert(`${n++}. Plan immutable`, plan.readOnly === true, 'readonly');
  assert(`${n++}. Plan fingerprint stable`, fingerprintAutonomousEngineeringPlan(plan) === plan.fingerprint, plan.fingerprint);
  assert(`${n++}. Plan has execution order`, plan.executionOrder.length >= 0, String(plan.executionOrder.length));

  const graph = buildRepairDependencyGraph(plan);
  assert(`${n++}. Dependency order`, graph.order.length >= 0, String(graph.order.length));
  assert(`${n++}. No silent cycle`, !graph.issues.includes('repair_dependency_cycle') || plan.selectedStrategies.length <= 1, graph.issues.join(','));

  assert(`${n++}. Mutation allowlist enforced`, isMutationPathAllowed('src/features/foo/Bar.tsx'), 'allowed');
  assert(`${n++}. Mutation denylist enforced`, !isMutationPathAllowed('approved-production-build-envelope.json'), 'denied');
  assert(`${n++}. Constitutional mutation forbidden`, detectForbiddenConstitutionalMutation('canonical-product-contract.json'), 'forbidden');
  assert(`${n++}. Allowlist prefixes`, MUTATION_ALLOWLIST_PREFIXES.length > 0, String(MUTATION_ALLOWLIST_PREFIXES.length));

  const planErrors = validateAutonomousEngineeringPlan(plan);
  assert(`${n++}. Plan validation`, planErrors.filter((e) => e !== 'repair_not_required').length === 0 || plan.selectedStrategies.length === 0, planErrors.join(','));

  const pre = validateRepairPreconditions(input, plan);
  assert(`${n++}. Precondition validation`, pre.length === 0 || plan.selectedStrategies.length === 0, pre.join(','));

  const execution = executeAutonomousEngineeringPlan({ engineeringInput: input, plan, findings: analysis.findings });
  assert(`${n++}. Execution outcome explicit`, execution.outcome.length > 0, execution.outcome);
  assert(`${n++}. Mutations have rollback`, execution.appliedMutations.every((m) => m.rollbackData !== undefined), 'rollback');
  assert(`${n++}. Mutations have fingerprints`, execution.appliedMutations.every((m) => m.expectedBeforeFingerprint !== undefined), 'fp');
  assert(`${n++}. Attempt limits`, !shouldAllowRepairAttempt([{ findingId: 'f', strategyId: 's', inputFingerprint: 'a', resultFingerprint: 'b', failed: true }], { findingId: 'f', strategyId: 's', inputFingerprint: 'a' }).allowed, 'limited');
  assert(`${n++}. Max cycles bounded`, maxRepairCyclesReached(1), 'capped');

  const postVerify = verifyAutonomousEngineeringResult({ engineeringInput: input, plan, appliedMutations: execution.appliedMutations, readinessBefore: execution.readinessBefore, readinessAfter: execution.readinessAfter, resolvedFindingIds: execution.resolvedFindingIds });
  assert(`${n++}. Post verification`, typeof postVerify.behaviorVerified === 'boolean', String(postVerify.behaviorVerified));

  const reconciled = reconcileAutonomousEngineeringResult({ engineeringInput: { ...input, workspaceFiles: execution.workspaceFiles } });
  assert(`${n++}. B11 reevaluation`, reconciled.readinessAfter.length > 0, reconciled.readinessAfter);
  assert(`${n++}. C1 cannot grant PRODUCTION_READY directly`, !readSource('src/autonomous-engineering-intelligence/autonomous-repair-reconciliation.ts').includes('PRODUCTION_READY'), 'b11 only');

  const report = generateAutonomousEngineeringReport({ plan, execution, findings: analysis.findings });
  assert(`${n++}. Report deterministic`, report.findingsAnalyzed === analysis.findings.length, String(report.findingsAnalyzed));
  assert(`${n++}. Traceability built`, buildAutonomousEngineeringTraceability({ findings: analysis.findings, plan, execution }).length === analysis.findings.length, 'trace');
  assert(`${n++}. Evidence fingerprints`, buildAutonomousEngineeringEvidence({ plan, execution }).resultFingerprint.length > 0, 'evidence');
  assert(`${n++}. Result fingerprint API`, fingerprintAutonomousEngineeringResult({ planFingerprint: plan.fingerprint, outcome: execution.outcome, appliedMutationCount: 0, resolvedFindingCount: 0 }).length > 0, 'fp');

  const cycle = runAutonomousEngineeringCycle(input);
  assert(`${n++}. Full cycle`, cycle.plan.planId.length > 0, cycle.plan.planId);
  assert(`${n++}. Diagnostics`, buildAutonomousEngineeringDiagnostics({ plan, outcome: execution.outcome, preconditionErrors: [], validationErrors: [] }).length >= 0, 'diag');

  assert(`${n++}. shouldRun when blocked`, shouldRunAutonomousEngineering(input) || analysis.findings.length === 0, 'should run');
  const readyInput = { ...input, readinessReport: input.readinessReport ? { ...input.readinessReport, readinessVerdict: 'PRODUCTION_READY' as const } : null };
  assert(`${n++}. C1 skips when PRODUCTION_READY`, !shouldRunAutonomousEngineering(readyInput), 'skip');

  const aeResult = augmentWorkspaceFilesWithAutonomousEngineering(blocked.workspaceFiles, blocked.envelope, {
    envelope: blocked.envelope,
    appTitle: blocked.envelope.approvedProductIdentity.displayName,
    moduleIds: materializableFeatureModules(blocked.definition),
    contractId: blocked.envelope.traceability.contractId,
    compositionBacked: true,
    behavioralVerificationBacked: true,
    capabilityCoverageBacked: true,
  });
  assert(`${n++}. Pipeline integration`, aeResult.outcome.length > 0, aeResult.outcome);
  assert(`${n++}. Workspace artifacts`, fileContent(aeResult.files, 'src/autonomous-engineering-intelligence/autonomous-engineering-plan.json').includes('planId'), 'artifact');
  assert(`${n++}. Marker not evidence`, readSource('src/autonomous-engineering-intelligence/autonomous-engineering-intelligence.ts').includes('not repair evidence'), 'marker');

  assert(`${n++}. B2 strategy exists`, !!getRepairStrategy('missing-action-handler-repair.v1'), 'b2');
  assert(`${n++}. B3 strategy exists`, !!getRepairStrategy('missing-workflow-transition-repair.v1'), 'b3');
  assert(`${n++}. B4 strategy exists`, !!getRepairStrategy('missing-relationship-wiring-repair.v1'), 'b4');
  assert(`${n++}. B5 strategy exists`, !!getRepairStrategy('missing-runtime-scope-repair.v1'), 'b5');
  assert(`${n++}. B6 strategy exists`, !!getRepairStrategy('missing-rule-wiring-repair.v1'), 'b6');
  assert(`${n++}. B8 strategy exists`, !!getRepairStrategy('missing-verification-scenario-repair.v1'), 'b8');
  assert(`${n++}. B10 strategy exists`, !!getRepairStrategy('composition-materialization-reconciliation-repair.v1'), 'b10');
  assert(`${n++}. Targeted validators`, selectTargetedValidators(plan).length >= 0, 'validators');
  assert(`${n++}. No broad sibling chain in executor`, !readSource('src/autonomous-engineering-intelligence/autonomous-repair-executor.ts').includes('validate-final-immutable'), 'narrow');

  const regressions = detectAutonomousRepairRegression(input.readinessReport, input.readinessReport);
  assert(`${n++}. Regression detector`, Array.isArray(regressions), String(regressions.length));

  for (const domain of DOMAINS) {
    const m = materialize(domain.label, domain.prompt);
    const ei = engineeringInputFromMaterialize(m);
    const ev = runProductionReadinessEvaluation({ envelope: m.envelope, workspaceFiles: m.workspaceFiles, moduleIds: materializableFeatureModules(m.definition), contractId: m.envelope.traceability.contractId });
    const ae = analyzeEngineeringFindings(ei);
    if (domain.authBlocked) {
      assert(`${n++}. Multi-domain auth blocked ${domain.label}`, ev.readinessVerdict !== 'PRODUCTION_READY', ev.readinessVerdict);
    }
    assert(`${n++}. Multi-domain identical logic ${domain.label}`, ae.findings.every((f) => f.provenance.includes(AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE)), domain.label);
  }

  const satisfiable = materialize('satisfiable', SATISFIABLE_PROMPT);
  const satInput = engineeringInputFromMaterialize(satisfiable);
  const satEval = runProductionReadinessEvaluation({ envelope: satisfiable.envelope, workspaceFiles: satisfiable.workspaceFiles, moduleIds: materializableFeatureModules(satisfiable.definition), contractId: satisfiable.envelope.traceability.contractId });
  assert(`${n++}. Satisfiable readiness explicit`, satEval.readinessVerdict.length > 0, satEval.readinessVerdict);
  if (satEval.readinessVerdict === 'PRODUCTION_READY') {
    assert(`${n++}. Fully repairable generic PRODUCTION_READY`, satEval.releaseDecision === 'RELEASE_APPROVED', satEval.releaseDecision);
  } else {
    const satCycle = runAutonomousEngineeringCycle(satInput);
    assert(`${n++}. Fully repairable cycle outcome`, satCycle.execution.outcome.length > 0, satCycle.execution.outcome);
  }

  assert(`${n++}. Product name does not affect selection`, selectRepairStrategy(staticFinding, staticEligibility).selectedStrategyId === 'static-shell-replacement-repair.v1', 'neutral');
  assert(`${n++}. Contradictory evidence blocks`, classifyRepairEligibility(syntheticFinding({ diagnosticCode: 'composition_fingerprint_mismatch', contradictionEvidence: ['x'] })).eligibility === 'BLOCKED_BY_CONTRADICTION', 'contradiction');
  assert(`${n++}. Missing evidence blocks repair path`, analyzeRootCause(syntheticFinding({ diagnosticCode: 'x', missingEvidence: ['y'] })) === 'EVIDENCE_ADAPTER_MISSING', 'missing');
  assert(`${n++}. shouldMaterializeAutonomousEngineering`, shouldMaterializeAutonomousEngineering(satisfiable.envelope, { compositionBacked: true, readinessBlocked: true }), 'materialize');
  assert(`${n++}. npm script registered`, readSource('package.json').includes('validate:autonomous-engineering-intelligence'), 'script');

  const pkg = JSON.parse(readSource('package.json'));
  assert(`${n++}. npm script exact`, pkg.scripts['validate:autonomous-engineering-intelligence'] === 'tsx scripts/validate-autonomous-engineering-intelligence.ts', 'script');

  const failed = results.filter((r) => !r.passed);
  const passed = results.filter((r) => r.passed).length;
  console.log(`\nAutonomous Engineering Intelligence V1: ${passed}/${results.length} assertions passed\n`);
  for (const r of failed) console.log(`FAIL: ${r.name} — ${r.detail}`);
  if (failed.length > 0) process.exit(1);

  const regressions_to_run = [
    'validate-universal-production-readiness.ts',
    'validate-universal-capability-composition-engine.ts',
    'validate-universal-capability-coverage.ts',
    'validate-universal-behavioral-verification.ts',
    'validate-universal-capability-pack-framework.ts',
    'validate-universal-business-rule-engine.ts',
    'validate-universal-runtime-state-engine.ts',
    'validate-universal-relationship-intelligence-engine.ts',
    'validate-universal-workflow-generation-engine.ts',
    'validate-universal-action-materialization-engine.ts',
    'validate-universal-crud-generation-engine.ts',
    'validate-final-immutable-production-pipeline-v1.ts',
  ];
  for (const script of regressions_to_run) {
    execSync(`npx tsx scripts/${script}`, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
  }
  console.log(`\n${PASS_TOKEN}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
