/**
 * Universal Business Rule Engine V1 — public exports.
 */

export {
  buildBusinessRuleMaterializationInputFromEnvelope,
  materializeUniversalBusinessRulesForModule,
  augmentCrudModuleWithUniversalBusinessRules,
  shouldMaterializeUniversalBusinessRulesForModule,
  buildUniversalBusinessRuleSharedRuntimeFiles,
  buildBusinessRuleMaterializationReport,
  computeBusinessRuleCapabilityCoverageScore,
  verifyBusinessRuleBehavior,
  detectStaticBusinessRuleShell,
  diagnoseBusinessRuleGenerationGaps,
  UNIVERSAL_BUSINESS_RULE_ENGINE_VERSION,
  UNIVERSAL_BUSINESS_RULE_ENGINE_SOURCE,
  stableBusinessRuleId,
} from './universal-business-rule-engine.js';

export type {
  UniversalBusinessRuleDescriptor,
  UniversalBusinessRuleMaterializationInput,
  UniversalBusinessRuleMaterializationReport,
  UniversalBusinessRuleBehaviorVerificationResult,
  UniversalBusinessRuleSupportClassification,
  UniversalBusinessRuleKind,
} from './universal-business-rule-types.js';

export type { UniversalBusinessRuleModuleMaterializationResult } from './universal-business-rule-engine.js';

export { extractApprovedBusinessRulesFromEnvelope } from './approved-business-rule-extractor.js';
export { normalizeBusinessRule, normalizeBusinessRules } from './business-rule-normalization-engine.js';
export { classifyBusinessRuleSupport } from './business-rule-support-classifier.js';
export { buildBusinessRuleDescriptors } from './business-rule-descriptor-builder.js';
export {
  serializeRuleExpression,
  deserializeRuleExpression,
  collectExpressionInputs,
} from './business-rule-expression-model.js';
export type { RuleExpression } from './business-rule-expression-model.js';
export {
  getOperator,
  isRegisteredOperator,
  listRegisteredOperators,
  RuleTypeError,
  RuleDivisionByZeroError,
} from './business-rule-operator-registry.js';
export {
  getSafeFunction,
  isRegisteredSafeFunction,
  listSafeFunctions,
} from './business-rule-safe-function-registry.js';
export {
  typeCheckRuleExpression,
  validateRuleInputs,
  validateRuleOutput,
} from './business-rule-type-system.js';
export { resolveRuleDependencies } from './business-rule-dependency-resolver.js';
export { validateBusinessRuleGraph, isExecutableRuleClassification } from './business-rule-graph-validator.js';
export {
  evaluateRule,
  evaluatePredicate,
  evaluateCalculation,
  evaluateAggregation,
  evaluateDerivedValue,
  evaluateRuleSet,
  evaluateExpression,
} from './business-rule-evaluation-engine.js';
export { ruleResultIsSuccess, ruleResultIsFailure } from './business-rule-result-model.js';
export type { RuleEvaluationResult, RuleResultStatus } from './business-rule-result-model.js';
export { runValidationRules } from './business-rule-validation-engine.js';
export { runCalculationRules, isCalculationRule } from './business-rule-calculation-engine.js';
export { runAggregationRule } from './business-rule-aggregation-engine.js';
export { DerivedValueEngine } from './business-rule-derived-value-engine.js';
export { decidePolicy } from './business-rule-policy-engine.js';
export { evaluateTransitionRules } from './business-rule-transition-engine.js';
export { explainResult } from './business-rule-explanation-engine.js';
export { RuleMemoizationCache, buildRuleMemoKey } from './business-rule-memoization.js';
export {
  generateModuleBusinessRulesSource,
  augmentCrudServiceWithBusinessRules,
} from './business-rule-b1-crud-integration.js';
export { BUSINESS_RULE_RUNTIME_EVENT_TYPES } from './business-rule-b5-runtime-integration.js';
