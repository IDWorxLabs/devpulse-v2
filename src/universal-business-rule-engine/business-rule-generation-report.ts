/**
 * Universal Business Rule Engine V1 — capability reporting.
 */

import { isExecutableRuleClassification } from './business-rule-graph-validator.js';
import {
  UNIVERSAL_BUSINESS_RULE_ENGINE_VERSION,
  type UniversalBusinessRuleBehaviorVerificationResult,
  type UniversalBusinessRuleDescriptor,
  type UniversalBusinessRuleMaterializationReport,
} from './universal-business-rule-types.js';

export function buildBusinessRuleMaterializationReport(input: {
  moduleId: string;
  descriptors: readonly UniversalBusinessRuleDescriptor[];
  verifications: readonly UniversalBusinessRuleBehaviorVerificationResult[];
}): UniversalBusinessRuleMaterializationReport {
  const { moduleId, descriptors, verifications } = input;

  const executable = descriptors.filter((d) => isExecutableRuleClassification(d.supportClassification));
  const verifiedIds = new Set(
    verifications.filter((v) => v.classification === 'BEHAVIORALLY_VERIFIED').map((v) => v.ruleId),
  );
  const behaviorallyVerifiedExecutable = executable.filter((d) => verifiedIds.has(d.ruleId)).length;

  const countKind = (kind: string) => descriptors.filter((d) => d.ruleKind === kind).length;
  const enforcementPoints = executable.flatMap((d) => d.enforcementPoints.map((p) => `${d.ruleId}::${p}`));
  const verifiedEnforcementPoints = executable
    .filter((d) => verifiedIds.has(d.ruleId))
    .flatMap((d) => d.enforcementPoints).length;

  return {
    readOnly: true,
    engineVersion: UNIVERSAL_BUSINESS_RULE_ENGINE_VERSION,
    moduleId,
    totalApprovedRules: descriptors.length,
    fullyMaterializedRules: executable.length,
    validationRules: countKind('FIELD_VALIDATION') + countKind('RECORD_VALIDATION') + countKind('CROSS_FIELD') + countKind('CROSS_RECORD'),
    calculationRules: countKind('CALCULATION') + countKind('DERIVED_VALUE'),
    aggregationRules: countKind('AGGREGATION'),
    workflowRules: countKind('WORKFLOW_GUARD') + countKind('STATE_TRANSITION'),
    actionEligibilityRules: countKind('ACTION_ELIGIBILITY'),
    relationshipRules: countKind('RELATIONSHIP_RULE'),
    blockedRules: descriptors.filter((d) => d.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY' || d.supportClassification === 'EXTENSION_POINT_REQUIRED').length,
    invalidRules: descriptors.filter((d) => d.supportClassification === 'INVALID_RULE_CONTRACT').length,
    behaviorallyVerifiedRules: behaviorallyVerifiedExecutable,
    // Informational rules never appear in the executable denominator.
    behavioralCoveragePercent: executable.length === 0 ? 100 : Math.round((behaviorallyVerifiedExecutable / executable.length) * 100),
    verifiedEnforcementPoints,
    totalEnforcementPoints: enforcementPoints.length,
    descriptors,
    verifications,
  };
}

export function computeBusinessRuleCapabilityCoverageScore(report: UniversalBusinessRuleMaterializationReport): number {
  if (report.fullyMaterializedRules === 0) return 100;
  return Math.round((report.behaviorallyVerifiedRules / report.fullyMaterializedRules) * 100);
}
