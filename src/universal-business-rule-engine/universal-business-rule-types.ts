/**
 * Universal Business Rule Engine V1 — domain-agnostic types.
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { RuleExpression } from './business-rule-expression-model.js';

export const UNIVERSAL_BUSINESS_RULE_ENGINE_VERSION = '1.0.0' as const;
export const UNIVERSAL_BUSINESS_RULE_ENGINE_SOURCE = 'UNIVERSAL_BUSINESS_RULE_ENGINE_V1' as const;

export type UniversalBusinessRuleSupportClassification =
  | 'FULLY_SUPPORTED'
  | 'VALIDATION_SUPPORTED'
  | 'PREDICATE_SUPPORTED'
  | 'CALCULATION_SUPPORTED'
  | 'AGGREGATION_SUPPORTED'
  | 'DERIVED_VALUE_SUPPORTED'
  | 'WORKFLOW_GUARD_SUPPORTED'
  | 'ACTION_ELIGIBILITY_SUPPORTED'
  | 'RELATIONSHIP_RULE_SUPPORTED'
  | 'STATE_TRANSITION_SUPPORTED'
  | 'PERSISTENCE_CONSTRAINT_SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'EXTENSION_POINT_REQUIRED'
  | 'BLOCKED_BY_FUTURE_CAPABILITY'
  | 'INVALID_RULE_CONTRACT'
  | 'NOT_EXECUTABLE_INFORMATIONAL';

export type UniversalBusinessRuleVerificationClassification =
  | 'BEHAVIORALLY_VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'STRUCTURALLY_PRESENT_ONLY'
  | 'BLOCKED_BY_CAPABILITY'
  | 'INVALID'
  | 'NOT_RUN'
  | 'FAILED';

export type UniversalBusinessRuleKind =
  | 'FIELD_VALIDATION'
  | 'RECORD_VALIDATION'
  | 'CROSS_FIELD'
  | 'CROSS_RECORD'
  | 'RELATIONSHIP_RULE'
  | 'WORKFLOW_GUARD'
  | 'ACTION_ELIGIBILITY'
  | 'DERIVED_VALUE'
  | 'CALCULATION'
  | 'AGGREGATION'
  | 'STATE_TRANSITION'
  | 'POLICY';

export type RuleValueType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'date'
  | 'collection'
  | 'identifier'
  | 'null';

export type RuleNullPolicy = 'FAIL' | 'TREAT_AS_ZERO' | 'SKIP' | 'RETURN_NULL' | 'BLOCK_EVALUATION';
export type RulePrecisionPolicy = 'INTEGER' | 'FIXED_2' | 'FIXED_4' | 'PRESERVE';
export type RuleRoundingPolicy = 'ROUND_HALF_UP' | 'ROUND_HALF_EVEN' | 'TRUNCATE' | 'FLOOR' | 'CEILING' | 'NONE';
export type RuleDivisionByZeroPolicy = 'FAIL' | 'RETURN_NULL' | 'RETURN_ZERO';
export type RuleEnforcementPoint =
  | 'FORM_SUBMIT'
  | 'SERVICE_CREATE'
  | 'SERVICE_UPDATE'
  | 'SERVICE_DELETE'
  | 'ACTION_PRECONDITION'
  | 'WORKFLOW_GUARD'
  | 'WORKFLOW_COMPLETION'
  | 'RELATIONSHIP_LINK'
  | 'RELATIONSHIP_UNLINK'
  | 'DERIVED_STATE'
  | 'PERSISTENCE_COMMIT';

export interface RuleInputDefinition {
  readonly name: string;
  readonly type: RuleValueType;
  readonly optional: boolean;
}

export interface RawApprovedBusinessRule {
  readonly label: string;
  readonly ruleKind: UniversalBusinessRuleKind;
  readonly sourceEnvelopePath: string;
  readonly moduleId: string;
  readonly targetField?: string;
}

export interface UniversalBusinessRuleDescriptor {
  readonly ruleId: string;
  readonly label: string;
  readonly description: string;
  readonly ruleKind: UniversalBusinessRuleKind;
  readonly moduleId: string;
  readonly entityId: string;
  readonly fieldId: string | null;
  readonly inputDefinitions: readonly RuleInputDefinition[];
  readonly outputType: RuleValueType;
  readonly expression: RuleExpression;
  readonly dependencies: readonly string[];
  readonly nullPolicy: RuleNullPolicy;
  readonly precisionPolicy: RulePrecisionPolicy;
  readonly roundingPolicy: RuleRoundingPolicy;
  readonly divisionByZeroPolicy: RuleDivisionByZeroPolicy;
  readonly enforcementPoints: readonly RuleEnforcementPoint[];
  readonly severity: 'ERROR' | 'WARNING';
  readonly errorCode: string;
  readonly userFeedback: string;
  readonly provenance: readonly string[];
  readonly sourceEnvelopePaths: readonly string[];
  readonly supportClassification: UniversalBusinessRuleSupportClassification;
  readonly blockedReason?: string;
  readonly version: string;
}

export interface UniversalBusinessRuleMaterializationInput {
  readonly moduleId: string;
  readonly moduleDisplayName: string;
  readonly moduleRoute: string;
  readonly appTitle: string;
  readonly contractId: string;
  readonly crudBacked: boolean;
  readonly actionBacked: boolean;
  readonly workflowBacked: boolean;
  readonly relationshipBacked: boolean;
  readonly buildId: string;
  readonly promptHash: string;
  readonly rawPrompt?: string;
}

export interface BusinessRuleDescriptorBuildContext {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly input: UniversalBusinessRuleMaterializationInput;
}

export interface UniversalBusinessRuleBehaviorVerificationResult {
  readonly readOnly: true;
  readonly ruleId: string;
  readonly classification: UniversalBusinessRuleVerificationClassification;
  readonly passed: boolean;
  readonly checks: readonly { readonly id: string; readonly passed: boolean; readonly detail: string }[];
}

export interface UniversalBusinessRuleMaterializationReport {
  readonly readOnly: true;
  readonly engineVersion: typeof UNIVERSAL_BUSINESS_RULE_ENGINE_VERSION;
  readonly moduleId: string;
  readonly totalApprovedRules: number;
  readonly fullyMaterializedRules: number;
  readonly validationRules: number;
  readonly calculationRules: number;
  readonly aggregationRules: number;
  readonly workflowRules: number;
  readonly actionEligibilityRules: number;
  readonly relationshipRules: number;
  readonly blockedRules: number;
  readonly invalidRules: number;
  readonly behaviorallyVerifiedRules: number;
  readonly behavioralCoveragePercent: number;
  readonly verifiedEnforcementPoints: number;
  readonly totalEnforcementPoints: number;
  readonly descriptors: readonly UniversalBusinessRuleDescriptor[];
  readonly verifications: readonly UniversalBusinessRuleBehaviorVerificationResult[];
}

export function stableBusinessRuleId(moduleId: string, ruleKind: string, discriminator: string): string {
  const base = `${moduleId}__${ruleKind}__${discriminator}`.toLowerCase().replace(/[^a-z0-9_]+/g, '_');
  return `rule-${base}`;
}

export function escRuleString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/`/g, '\\`');
}
