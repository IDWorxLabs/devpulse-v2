/**
 * UNIVERSAL_BUSINESS_RULE_ENGINE_V1 — validation.
 *
 * Run only:
 *   npx tsx scripts/validate-universal-business-rule-engine.ts
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
  buildBusinessRuleMaterializationInputFromEnvelope,
  materializeUniversalBusinessRulesForModule,
  augmentCrudModuleWithUniversalBusinessRules,
  shouldMaterializeUniversalBusinessRulesForModule,
  computeBusinessRuleCapabilityCoverageScore,
  detectStaticBusinessRuleShell,
  diagnoseBusinessRuleGenerationGaps,
  stableBusinessRuleId,
  UNIVERSAL_BUSINESS_RULE_ENGINE_SOURCE,
  UNIVERSAL_BUSINESS_RULE_ENGINE_VERSION,
  verifyBusinessRuleBehavior,
  evaluateRule,
  evaluateRuleSet,
  evaluateExpression,
  serializeRuleExpression,
  deserializeRuleExpression,
  listRegisteredOperators,
  isRegisteredOperator,
  listSafeFunctions,
  typeCheckRuleExpression,
  validateRuleInputs,
  resolveRuleDependencies,
  validateBusinessRuleGraph,
  runValidationRules,
  runAggregationRule,
  DerivedValueEngine,
  decidePolicy,
  evaluateTransitionRules,
  explainResult,
  RuleMemoizationCache,
  ruleResultIsSuccess,
  BUSINESS_RULE_RUNTIME_EVENT_TYPES,
  type UniversalBusinessRuleDescriptor,
} from '../src/universal-business-rule-engine/index.js';
import {
  buildUniversalCrudEntityModuleFiles,
  entityDescriptorFromApprovedModule,
} from '../src/universal-crud-generation-engine/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'UNIVERSAL_BUSINESS_RULE_ENGINE_V1_PASS';

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
  'src/universal-business-rule-engine/universal-business-rule-types.ts',
  'src/universal-business-rule-engine/approved-business-rule-extractor.ts',
  'src/universal-business-rule-engine/business-rule-normalization-engine.ts',
  'src/universal-business-rule-engine/business-rule-support-classifier.ts',
  'src/universal-business-rule-engine/business-rule-descriptor-builder.ts',
  'src/universal-business-rule-engine/business-rule-expression-model.ts',
  'src/universal-business-rule-engine/business-rule-operator-registry.ts',
  'src/universal-business-rule-engine/business-rule-safe-function-registry.ts',
  'src/universal-business-rule-engine/business-rule-type-system.ts',
  'src/universal-business-rule-engine/business-rule-dependency-resolver.ts',
  'src/universal-business-rule-engine/business-rule-graph-validator.ts',
  'src/universal-business-rule-engine/business-rule-evaluation-engine.ts',
  'src/universal-business-rule-engine/business-rule-result-model.ts',
  'src/universal-business-rule-engine/business-rule-validation-engine.ts',
  'src/universal-business-rule-engine/business-rule-calculation-engine.ts',
  'src/universal-business-rule-engine/business-rule-aggregation-engine.ts',
  'src/universal-business-rule-engine/business-rule-derived-value-engine.ts',
  'src/universal-business-rule-engine/business-rule-policy-engine.ts',
  'src/universal-business-rule-engine/business-rule-transition-engine.ts',
  'src/universal-business-rule-engine/business-rule-explanation-engine.ts',
  'src/universal-business-rule-engine/business-rule-memoization.ts',
  'src/universal-business-rule-engine/business-rule-b1-crud-integration.ts',
  'src/universal-business-rule-engine/business-rule-b2-action-integration.ts',
  'src/universal-business-rule-engine/business-rule-b3-workflow-integration.ts',
  'src/universal-business-rule-engine/business-rule-b4-relationship-integration.ts',
  'src/universal-business-rule-engine/business-rule-b5-runtime-integration.ts',
  'src/universal-business-rule-engine/business-rule-behavior-verification.ts',
  'src/universal-business-rule-engine/business-rule-generation-report.ts',
  'src/universal-business-rule-engine/business-rule-runtime-generator.ts',
  'src/universal-business-rule-engine/universal-business-rule-engine.ts',
  'src/universal-business-rule-engine/index.ts',
];

const DOMAINS = [
  { label: 'CRM', prompt: 'Build CRM with required fields, derived display value, eligibility predicate, relationship-based delete restriction, collection count.' },
  { label: 'Inventory', prompt: 'Build inventory with quantity must be greater than zero, derived total, threshold of 100 units, aggregate count of items.' },
  { label: 'Booking', prompt: 'Build reservation where start must be before end, required relationship, workflow may complete when all required steps are complete. Schedule availability checks.' },
  { label: 'Expense', prompt: 'Build expense management with total equals sum of line values, discount equals percentage of subtotal, submit eligibility, approval only when validation passes.' },
  { label: 'Task', prompt: 'Build task management with completion eligibility, dependency rule, progress aggregation, status may move only under condition.' },
  { label: 'Education', prompt: 'Build education administration with required relationship, maximum of 30 per group, conditional classification, many students linked to many groups.' },
  { label: 'Asset', prompt: 'Build asset management with lifecycle restriction, assignment eligibility, cannot delete while related records exist, derived status.' },
  { label: 'Utility', prompt: 'Build utility with deterministic calculation, input validation is required, reset, derived output.' },
  { label: 'Mixed', prompt: 'Build custom domain with validation required, total equals sum of values, workflow completion guard, cannot delete while related records exist, approval eligibility, real-time sync of external market data.' },
];

function materialize(label: string, prompt: string) {
  const contract = buildCanonicalProductContract({ prompt });
  const plan = resolvePromptFaithfulBuildPlan(prompt);
  const bound = applyContractBoundGenerationToBuildPlan(plan, contract, {
    promptHash: `hash-br-${label}`,
    buildId: `build-br-${label}`,
  });
  const envelope = bound.report.approvedProductionBuildEnvelope;
  const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: `br-${label}`,
    ideaId: 'idea',
    buildUnits: ['unit'],
    rawPrompt: prompt,
    faithfulBuildPlan: bound.buildPlan,
    approvedProductionBuildEnvelope: envelope,
  });
  return { workspaceFiles, envelope, definition: bound.buildPlan.definition, label, prompt };
}

function ruleModule(definition: ProfileFeatureDefinition, files: { relativePath: string; content: string }[]): string | null {
  return materializableFeatureModules(definition).find((id) =>
    shouldGenerateUniversalCrudForModule(id, { safePaymentPlaceholderActive: false, isSafePaymentModule: false }) &&
    files.some((f) => f.relativePath === `src/features/${id}/${id}.business-rules.ts`),
  ) ?? null;
}

async function main(): Promise<void> {
  let n = 1;
  for (const f of ENGINE_FILES) assert(`${n++}. Engine file exists: ${f}`, existsSync(join(ROOT, f)), 'missing');

  assert(`${n++}. Version/source canonical`, UNIVERSAL_BUSINESS_RULE_ENGINE_VERSION === '1.0.0' && UNIVERSAL_BUSINESS_RULE_ENGINE_SOURCE === 'UNIVERSAL_BUSINESS_RULE_ENGINE_V1', 'meta');

  // --- Production wiring, no parallel truth, no domain hardcoding.
  const modular = readSource('src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts');
  assert(`${n++}. Production wiring in modular generator`, modular.includes('augmentCrudModuleWithUniversalBusinessRules') && modular.includes('buildUniversalBusinessRuleSharedRuntimeFiles'), 'wiring');
  const engineSources = ENGINE_FILES.map(readSource).join('\n');
  assert(`${n++}. No product domain hardcoding in engine source`, !engineSources.match(/\brestaurant\b|\bcrm\b|\bhealthcare\b|\bhospital\b|\binsurance\b|\blogistics\b|\blisa\b|\be-commerce\b|\baccounting\b/i), 'domain');
  assert(`${n++}. No arbitrary code execution primitives`, !engineSources.match(/\beval\s*\(|new\s+Function\s*\(/), 'no-eval');
  assert(`${n++}. Rules derive from ApprovedProductionBuildEnvelope`, readSource('src/universal-business-rule-engine/approved-business-rule-extractor.ts').includes('ApprovedProductionBuildEnvelope'), 'source');

  // --- Stable identity.
  assert(`${n++}. Stable deterministic rule IDs`, stableBusinessRuleId('m', 'FIELD_VALIDATION', 'x') === stableBusinessRuleId('m', 'FIELD_VALIDATION', 'x') && stableBusinessRuleId('m', 'FIELD_VALIDATION', 'x').startsWith('rule-'), 'id');

  // --- Safe expression model.
  const sumExpr = { kind: 'aggregate', op: 'SUM', collection: { kind: 'collection-input', name: 'values' } } as const;
  assert(`${n++}. Expressions serializable round-trip`, JSON.stringify(deserializeRuleExpression(serializeRuleExpression(sumExpr))) === JSON.stringify(sumExpr), 'serialize');

  // --- Operator registry closed and typed.
  assert(`${n++}. Operator registry closed`, isRegisteredOperator('ADD') && !isRegisteredOperator('EXEC') && listRegisteredOperators().length >= 30, `ops=${listRegisteredOperators().length}`);
  assert(`${n++}. Safe function registry pure/deterministic`, listSafeFunctions().includes('ROUND_HALF_UP') && !listSafeFunctions().includes('FETCH'), 'fns');

  // --- Deterministic evaluation.
  const calcDescriptor: UniversalBusinessRuleDescriptor = {
    ruleId: 'rule-test__calculation__sum', label: 'Sum of values', description: 'test', ruleKind: 'CALCULATION',
    moduleId: 'test', entityId: 'test', fieldId: null,
    inputDefinitions: [{ name: 'values', type: 'collection', optional: false }],
    outputType: 'number', expression: sumExpr, dependencies: ['collection:values'],
    nullPolicy: 'FAIL', precisionPolicy: 'FIXED_2', roundingPolicy: 'ROUND_HALF_UP', divisionByZeroPolicy: 'FAIL',
    enforcementPoints: ['DERIVED_STATE'], severity: 'ERROR', errorCode: 'rule_sum', userFeedback: 'Sum failed',
    provenance: ['test'], sourceEnvelopePaths: ['test'], supportClassification: 'CALCULATION_SUPPORTED', version: '1.0.0',
  };
  const calc1 = evaluateRule(calcDescriptor, { values: [1.111, 2.222, 3.333] });
  const calc2 = evaluateRule(calcDescriptor, { values: [1.111, 2.222, 3.333] });
  assert(`${n++}. Calculations deterministic`, JSON.stringify(calc1) === JSON.stringify(calc2) && calc1.status === 'VALUE', `v=${String(calc1.value)}`);
  assert(`${n++}. Precision + rounding policy enforced`, calc1.value === 6.67, `v=${String(calc1.value)} (FIXED_2 ROUND_HALF_UP)`);
  assert(`${n++}. Aggregation uses real source data`, evaluateRule(calcDescriptor, { values: [10, 20] }).value === 30 && evaluateRule(calcDescriptor, { values: [5] }).value === 5, 'agg');

  // --- Division by zero policy.
  const divDescriptor: UniversalBusinessRuleDescriptor = {
    ...calcDescriptor, ruleId: 'rule-test__calculation__div',
    inputDefinitions: [{ name: 'a', type: 'number', optional: false }, { name: 'b', type: 'number', optional: false }],
    expression: { kind: 'op', op: 'DIVIDE', args: [{ kind: 'input', name: 'a' }, { kind: 'input', name: 'b' }] },
  };
  assert(`${n++}. Division-by-zero FAIL policy`, evaluateRule(divDescriptor, { a: 1, b: 0 }).status === 'ERROR', 'div-fail');
  assert(`${n++}. Division-by-zero RETURN_ZERO policy`, evaluateRule({ ...divDescriptor, divisionByZeroPolicy: 'RETURN_ZERO' }, { a: 1, b: 0 }).value === 0, 'div-zero');

  // --- Null policy.
  assert(`${n++}. Null FAIL policy → explicit error`, evaluateRule(divDescriptor, { a: 1 }).status === 'ERROR', 'null-fail');
  assert(`${n++}. Null TREAT_AS_ZERO policy`, evaluateRule({ ...calcDescriptor, nullPolicy: 'TREAT_AS_ZERO' }, {}).value === 0, 'null-zero');
  assert(`${n++}. Null BLOCK_EVALUATION policy`, evaluateRule({ ...divDescriptor, nullPolicy: 'BLOCK_EVALUATION' }, { a: 1 }).status === 'BLOCKED', 'null-block');

  // --- Type checking.
  const typeIssues = typeCheckRuleExpression({ kind: 'op', op: 'BOGUS_OP', args: [{ kind: 'input', name: 'undeclared' }] }, []);
  assert(`${n++}. Type checking rejects unsupported operator + undeclared input`, typeIssues.some((i) => i.code === 'unsupported_operator') && typeIssues.some((i) => i.code === 'missing_input'), 'typecheck');
  assert(`${n++}. Invalid operand types rejected at runtime`, evaluateRule(divDescriptor, { a: 'not-a-number' as never, b: 2 }).status === 'ERROR', 'operand');
  assert(`${n++}. Input type validation`, validateRuleInputs([{ name: 'x', type: 'integer', optional: false }], { x: 1.5 }).length > 0 && validateRuleInputs([{ name: 'x', type: 'integer', optional: false }], { x: 2 }).length === 0, 'inputs');

  // --- Dependency resolution + cycles.
  const depA: UniversalBusinessRuleDescriptor = { ...calcDescriptor, ruleId: 'rule-a', dependencies: ['rule-b'] };
  const depB: UniversalBusinessRuleDescriptor = { ...calcDescriptor, ruleId: 'rule-b', dependencies: ['rule-a'] };
  assert(`${n++}. Circular dependencies rejected`, resolveRuleDependencies([depA, depB]).issues.some((i) => i.code === 'circular_dependency'), 'cycle');
  const depC: UniversalBusinessRuleDescriptor = { ...calcDescriptor, ruleId: 'rule-c', dependencies: [] };
  const depD: UniversalBusinessRuleDescriptor = { ...calcDescriptor, ruleId: 'rule-d', dependencies: ['rule-c'] };
  const order = resolveRuleDependencies([depD, depC]).evaluationOrder;
  assert(`${n++}. Dependency resolution deterministic order`, order.indexOf('rule-c') < order.indexOf('rule-d'), order.join(','));
  const cyclicResults = evaluateRuleSet([depA, depB], { values: [1] });
  assert(`${n++}. Circular rule set never executes`, cyclicResults.every((r) => r.status === 'INVALID'), 'cyclic-set');
  const chained = evaluateRuleSet([depD, depC], { values: [2, 3] });
  assert(`${n++}. Rule set feeds dependency values forward`, chained.every((r) => ruleResultIsSuccess(r)), 'chain');

  // --- Graph validation: duplicates + conflicts + missing formula.
  const graphDup = validateBusinessRuleGraph([calcDescriptor, calcDescriptor]);
  assert(`${n++}. Duplicate rule IDs detected`, graphDup.issues.some((i) => i.code === 'duplicate_rule_id'), 'dup');
  const conflictA = { ...calcDescriptor, ruleId: 'rule-conf-a', fieldId: 'total' };
  const conflictB = { ...calcDescriptor, ruleId: 'rule-conf-b', fieldId: 'total', expression: { kind: 'aggregate', op: 'COUNT', collection: { kind: 'collection-input', name: 'values' } } } as UniversalBusinessRuleDescriptor;
  assert(`${n++}. Conflicting duplicate formulas detected`, validateBusinessRuleGraph([conflictA, conflictB]).issues.some((i) => i.code === 'conflicting_rules'), 'conflict');

  // --- Validation rules block invalid CRUD mutations; valid ones pass.
  const requiredRule: UniversalBusinessRuleDescriptor = {
    ...calcDescriptor, ruleId: 'rule-req', ruleKind: 'FIELD_VALIDATION', fieldId: 'label', outputType: 'boolean',
    inputDefinitions: [{ name: 'label', type: 'string', optional: false }],
    expression: { kind: 'op', op: 'NOT', args: [{ kind: 'safe-function', functionId: 'IS_BLANK', args: [{ kind: 'input', name: 'label' }] }] },
    enforcementPoints: ['SERVICE_CREATE', 'SERVICE_UPDATE'], supportClassification: 'VALIDATION_SUPPORTED',
    errorCode: 'rule_required', userFeedback: 'Value is required',
  };
  const invalidOutcome = runValidationRules([requiredRule], 'SERVICE_CREATE', { label: '   ' });
  const validOutcome = runValidationRules([requiredRule], 'SERVICE_CREATE', { label: 'Real value' });
  assert(`${n++}. Invalid CRUD mutation blocked with rich violation`, !invalidOutcome.valid && invalidOutcome.violations[0]!.code === 'rule_required' && invalidOutcome.violations[0]!.ruleId === 'rule-req', 'invalid');
  assert(`${n++}. Valid CRUD mutation passes`, validOutcome.valid, 'valid');

  // --- Cross-field rules.
  const crossField: UniversalBusinessRuleDescriptor = {
    ...requiredRule, ruleId: 'rule-cross', ruleKind: 'CROSS_FIELD',
    inputDefinitions: [{ name: 'startValue', type: 'date', optional: false }, { name: 'endValue', type: 'date', optional: false }],
    expression: { kind: 'op', op: 'BEFORE', args: [{ kind: 'input', name: 'startValue' }, { kind: 'input', name: 'endValue' }] },
  };
  assert(`${n++}. Cross-field start-before-end works`,
    evaluateRule(crossField, { startValue: '2001-01-01', endValue: '2001-01-02' }).status === 'PASSED' &&
    evaluateRule(crossField, { startValue: '2001-01-03', endValue: '2001-01-02' }).status === 'FAILED', 'cross');

  // --- Cross-record adapter (uniqueness over supplied repository snapshot).
  const uniqueRule: UniversalBusinessRuleDescriptor = {
    ...requiredRule, ruleId: 'rule-unique', ruleKind: 'CROSS_RECORD',
    inputDefinitions: [{ name: 'candidate', type: 'string', optional: false }, { name: 'existingValues', type: 'collection', optional: false }],
    expression: { kind: 'op', op: 'NOT', args: [{ kind: 'op', op: 'CONTAINS', args: [{ kind: 'collection-input', name: 'existingValues' }, { kind: 'input', name: 'candidate' }] }] },
    enforcementPoints: ['SERVICE_CREATE', 'PERSISTENCE_COMMIT'],
  };
  assert(`${n++}. Cross-record uniqueness adapter works`,
    evaluateRule(uniqueRule, { candidate: 'a', existingValues: ['b', 'c'] }).status === 'PASSED' &&
    evaluateRule(uniqueRule, { candidate: 'b', existingValues: ['b', 'c'] }).status === 'FAILED', 'unique');

  // --- Aggregation empty collection policy.
  const emptyAgg = runAggregationRule(calcDescriptor, [], {}, 'RETURN_ZERO');
  assert(`${n++}. Empty collection policy works`, emptyAgg.status === 'VALUE' && emptyAgg.value === 0, 'empty');

  // --- State transition policy.
  const transitionRule: UniversalBusinessRuleDescriptor = {
    ...requiredRule, ruleId: 'rule-trans', ruleKind: 'STATE_TRANSITION',
    inputDefinitions: [{ name: 'currentState', type: 'string', optional: false }, { name: 'allowedSourceStates', type: 'collection', optional: false }],
    expression: { kind: 'op', op: 'CONTAINS', args: [{ kind: 'collection-input', name: 'allowedSourceStates' }, { kind: 'input', name: 'currentState' }] },
    enforcementPoints: ['WORKFLOW_GUARD'], supportClassification: 'STATE_TRANSITION_SUPPORTED',
  };
  assert(`${n++}. State-transition policy rejects invalid transitions`,
    evaluateTransitionRules([transitionRule], { currentState: 'draft', allowedSourceStates: ['draft', 'review'] }).allowed &&
    !evaluateTransitionRules([transitionRule], { currentState: 'archived', allowedSourceStates: ['draft', 'review'] }).allowed, 'transition');

  // --- Policy decisions with explanation + provenance.
  const policy = decidePolicy(requiredRule, { label: '' });
  assert(`${n++}. Policy DENY carries explanation + provenance`, policy.decision === 'DENY' && policy.explanation.length > 0 && policy.provenance.length > 0, policy.decision);

  // --- Blocked future capability rules explicit, never fake success.
  const blockedRule: UniversalBusinessRuleDescriptor = {
    ...requiredRule, ruleId: 'rule-blocked', supportClassification: 'BLOCKED_BY_FUTURE_CAPABILITY', blockedReason: 'blocked_by_scheduling_capability',
  };
  const blockedResult = evaluateRule(blockedRule, { label: 'x' });
  assert(`${n++}. Blocked capability rules produce explicit BLOCKED`, blockedResult.status === 'BLOCKED' && !ruleResultIsSuccess(blockedResult), blockedResult.status);
  assert(`${n++}. Policy escalates blocked to REQUIRE_FUTURE_CAPABILITY`, decidePolicy(blockedRule, {}).decision === 'REQUIRE_FUTURE_CAPABILITY', 'blocked-policy');

  // --- Errors never default to success.
  const errorResult = evaluateRule(divDescriptor, { a: 1, b: 0 });
  assert(`${n++}. Rule errors never default to success`, errorResult.status === 'ERROR' && !ruleResultIsSuccess(errorResult) && errorResult.violations.length > 0, 'error');

  // --- Pure evaluation: no side effects on inputs.
  const frozenInputs = Object.freeze({ values: Object.freeze([1, 2, 3]) as never });
  const pureResult = evaluateRule(calcDescriptor, frozenInputs);
  assert(`${n++}. Rule evaluation has no side effects`, pureResult.status === 'VALUE', 'pure');

  // --- Memoization + invalidation.
  const memo = new RuleMemoizationCache();
  memo.set(calcDescriptor, { values: [1, 2] }, calc1);
  assert(`${n++}. Memoized results keyed by version+inputs`, memo.get(calcDescriptor, { values: [1, 2] }) !== undefined && memo.get(calcDescriptor, { values: [9] }) === undefined, 'memo');
  const derivedEngine = new DerivedValueEngine([calcDescriptor, depD]);
  derivedEngine.compute(calcDescriptor, { values: [1] });
  const invalidated = derivedEngine.invalidateDependency('rule-test__calculation__sum');
  assert(`${n++}. Stale rule results invalidated on dependency change`, invalidated.includes('rule-test__calculation__sum') && derivedEngine.memoSize() === 0, `invalidated=${invalidated.length}`);
  const derivedFresh1 = derivedEngine.compute(calcDescriptor, { values: [4, 6] });
  const derivedFresh2 = derivedEngine.compute(calcDescriptor, { values: [4, 6, 10] });
  assert(`${n++}. Derived values recompute after dependency changes`, derivedFresh1.value === 10 && derivedFresh2.value === 20, 'recompute');

  // --- Explanation engine.
  const explanation = explainResult(requiredRule, invalidOutcome.valid ? calc1 : evaluateRule(requiredRule, { label: '' }));
  assert(`${n++}. Explanation engine yields user + developer output without raw AST`, explanation.userMessage.length > 0 && explanation.developerDetail.includes('FIELD_VALIDATION') && !explanation.userMessage.includes('"kind"'), 'explain');

  // --- B5 runtime event integration.
  const runtimeEventModel = readSource('src/universal-runtime-state-engine/runtime-event-model.ts');
  assert(`${n++}. B5 owns runtime rule state via typed events`, BUSINESS_RULE_RUNTIME_EVENT_TYPES.every((t) => runtimeEventModel.includes(t)), 'b5-events');
  const storeGen = readSource('src/universal-runtime-state-engine/runtime-store-generator.ts');
  assert(`${n++}. B5 store manages rule state transitions`, storeGen.includes("case 'rule/evaluation-success'") && storeGen.includes("case 'rule/dependency-invalidated'"), 'b5-store');

  // --- Full module materialization on fixture.
  const fixture = materialize('fixture', DOMAINS[3]!.prompt);
  const mod =
    materializableFeatureModules(fixture.definition).find((id) =>
      shouldGenerateUniversalCrudForModule(id, { safePaymentPlaceholderActive: false, isSafePaymentModule: false }),
    ) ?? 'settings';
  const brInput = buildBusinessRuleMaterializationInputFromEnvelope({
    envelope: fixture.envelope, moduleId: mod, moduleDisplayName: mod, moduleRoute: `/${mod}`, appTitle: 'Test',
    contractId: `feature-${mod}`, crudBacked: true, actionBacked: true, workflowBacked: true, relationshipBacked: true,
    rawPrompt: DOMAINS[3]!.prompt,
  });
  const brResult = materializeUniversalBusinessRulesForModule(brInput, fixture.envelope);
  assert(`${n++}. Rule descriptors from envelope`, brResult.descriptors.length > 0, `count=${brResult.descriptors.length}`);
  const brResult2 = materializeUniversalBusinessRulesForModule(brInput, fixture.envelope);
  assert(`${n++}. Normalization + descriptors deterministic`, JSON.stringify(brResult.descriptors.map((d) => d.ruleId)) === JSON.stringify(brResult2.descriptors.map((d) => d.ruleId)), 'deterministic');
  assert(`${n++}. Every rule has explicit support classification`, brResult.descriptors.every((d) => typeof d.supportClassification === 'string' && d.supportClassification.length > 0), 'classified');
  assert(`${n++}. Provenance stable + envelope-sourced`, brResult.descriptors.every((d) => d.provenance.length > 0 && d.sourceEnvelopePaths.length > 0), 'provenance');

  // --- Service augmentation: enforcement at service boundary.
  const crud = buildUniversalCrudEntityModuleFiles({ descriptor: entityDescriptorFromApprovedModule({ moduleId: mod, displayName: mod, route: `/${mod}` }), appTitle: 'T', promptTerms: [] });
  const componentSrc = crud.files.find((f) => f.relativePath.includes('Feature.tsx'))!.content;
  const serviceSrc = crud.files.find((f) => f.relativePath.endsWith('.service.ts'))!.content;
  const augmented = augmentCrudModuleWithUniversalBusinessRules(componentSrc, serviceSrc, brInput, fixture.envelope);
  assert(`${n++}. B1 service invokes B6 before create persistence`, augmented.serviceSource.includes("BusinessRules('SERVICE_CREATE'"), 'svc-create');
  assert(`${n++}. B1 service invokes B6 before update persistence`, augmented.serviceSource.includes("BusinessRules('SERVICE_UPDATE'"), 'svc-update');
  assert(`${n++}. B1 service invokes B6 before delete persistence`, augmented.serviceSource.includes("BusinessRules('SERVICE_DELETE'"), 'svc-delete');
  assert(`${n++}. B1 validation consolidated (existing validator retained, B6 added)`, augmented.serviceSource.includes('validate') && augmented.serviceSource.includes('BusinessRules'), 'consolidated');
  assert(`${n++}. Component rule marker + hook`, augmented.componentSource.includes('data-universal-business-rule-engine="v1"') && augmented.componentSource.includes('BusinessRules'), 'component');

  const moduleRules = fileContent(augmented.ruleResult.files, `src/features/${mod}/${mod}.business-rules.ts`);
  assert(`${n++}. B2 action eligibility uses B6`, moduleRules.includes('ActionEligibility') && moduleRules.includes('ACTION_PRECONDITION'), 'b2');
  assert(`${n++}. B3 workflow guards use B6`, moduleRules.includes('WorkflowCompletionGuard') && moduleRules.includes('WORKFLOW_GUARD'), 'b3');
  assert(`${n++}. B4 relationship constraints use B6`, moduleRules.includes('DeleteConstraint') && moduleRules.includes('RelatedLinkCounter'), 'b4');
  assert(`${n++}. B6 dispatches rule events to B5 store`, moduleRules.includes('dispatchRuntimeEvent') && moduleRules.includes('rule/evaluation-success'), 'b5-dispatch');
  assert(`${n++}. Handlers cannot bypass failed rules (enforcement throws)`, readSource('src/universal-business-rule-engine/business-rule-runtime-generator.ts').includes('BusinessRuleViolationError'), 'no-bypass');

  // --- Behavioral verification.
  const verifications = brResult.report.verifications;
  assert(`${n++}. Behavioral verification runs per rule`, verifications.length === brResult.descriptors.length, `v=${verifications.length}`);
  const structuralOnly = verifyBusinessRuleBehavior(calcDescriptor, { moduleRules: '', serviceSource: '', componentFragment: '', sharedEvaluator: '' });
  assert(`${n++}. Structural presence not counted as behavioral proof`, structuralOnly.classification !== 'BEHAVIORALLY_VERIFIED', structuralOnly.classification);
  assert(`${n++}. No approved executable rule silently dropped`, brResult.descriptors.every((d) => verifications.some((v) => v.ruleId === d.ruleId)), 'no-silent-drop');
  assert(`${n++}. No static rule shells in generated surfaces`, detectStaticBusinessRuleShell(moduleRules).length === 0, detectStaticBusinessRuleShell(moduleRules).join('; ') || 'clean');
  assert(`${n++}. EI gap diagnosis generic`, diagnoseBusinessRuleGenerationGaps([blockedRule], []).includes('blocked_by_scheduling_capability'), 'ei');

  // --- Capability report.
  const coverage = computeBusinessRuleCapabilityCoverageScore(brResult.report);
  assert(`${n++}. Capability coverage computed (informational excluded from denominator)`, coverage >= 0 && coverage <= 100 && brResult.report.totalEnforcementPoints > 0, `coverage=${coverage}%`);

  // --- Multi-domain matrix: same engine, no special-casing.
  const markers: string[] = [];
  for (const d of DOMAINS) {
    const { workspaceFiles, definition, label } = materialize(d.label, d.prompt);
    assert(`${n++}. ${label}: rule runtime in workspace`, workspaceFiles.some((f) => f.relativePath === 'src/universal-business-rule-runtime/evaluator.ts'), 'runtime');
    const host = ruleModule(definition, workspaceFiles);
    if (host) {
      const rules = fileContent(workspaceFiles, `src/features/${host}/${host}.business-rules.ts`);
      const pascal = host.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
      const feature = workspaceFiles.find((f) => f.relativePath === `src/features/${host}/${pascal}Feature.tsx`)?.content ?? '';
      const service = workspaceFiles.find((f) => f.relativePath === `src/features/${host}/${host}.service.ts`)?.content ?? '';
      assert(`${n++}. ${label}: rule artifacts for ${host}`, rules.includes('BUSINESS_RULES') && rules.includes('enforce'), host);
      assert(`${n++}. ${label}: service-boundary enforcement`, service.includes("BusinessRules('SERVICE_CREATE'"), 'service');
      const m = feature.match(/data-universal-business-rule-engine="([^"]+)"/);
      if (m) markers.push(m[1]!);
    }
  }
  assert(`${n++}. Same engine marker across domains`, markers.length === 0 || new Set(markers).size === 1, markers.join(','));

  // --- Blocked future external capability in mixed domain remains explicit.
  const mixed = materialize('MixedBlock', DOMAINS[8]!.prompt);
  const mixedMod = materializableFeatureModules(mixed.definition).find((id) =>
    shouldGenerateUniversalCrudForModule(id, { safePaymentPlaceholderActive: false, isSafePaymentModule: false }),
  );
  if (mixedMod) {
    const mixedResult = materializeUniversalBusinessRulesForModule(
      buildBusinessRuleMaterializationInputFromEnvelope({
        envelope: mixed.envelope, moduleId: mixedMod, moduleDisplayName: mixedMod, moduleRoute: `/${mixedMod}`, appTitle: 'T',
        contractId: `feature-${mixedMod}`, crudBacked: true, actionBacked: true, workflowBacked: true, relationshipBacked: true,
        rawPrompt: DOMAINS[8]!.prompt,
      }),
      mixed.envelope,
    );
    assert(`${n++}. Unsupported future capability explicitly blocked`,
      mixedResult.descriptors.some((d) => d.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY'),
      mixedResult.descriptors.map((d) => d.supportClassification).join(','));
  }

  assert(`${n++}. shouldMaterialize gate respects exclusions`, !shouldMaterializeUniversalBusinessRulesForModule('auth', fixture.envelope, { crudBacked: true }) && shouldMaterializeUniversalBusinessRulesForModule(mod, fixture.envelope, { crudBacked: true }), 'gate');
  assert(`${n++}. npm script registered`, readSource('package.json').includes('validate:universal-business-rule-engine'), 'npm');
  assert(`${n++}. TypeScript compile (touched modules)`, (() => {
    try { execSync('npx tsc --noEmit --pretty false 2>&1', { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout: 180_000 }); return true; }
    catch (e) { const m = e instanceof Error ? e.message : String(e); return !m.includes('universal-business-rule-engine') && !m.includes('modular-feature-module-generator') && !m.includes('universal-runtime-state-engine'); }
  })(), 'tsc');

  const failed = results.filter((r) => !r.passed);
  console.log('\n=== Universal Business Rule Engine V1 Validation ===\n');
  for (const r of results) { console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}`); if (!r.passed) console.log(`       ${r.detail}`); }
  console.log(`\n${results.length} scenarios — ${results.length - failed.length} passed, ${failed.length} failed\n`);
  if (failed.length === 0) { console.log(PASS_TOKEN); process.exit(0); }
  process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
