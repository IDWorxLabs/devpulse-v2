/**
 * Validation Runtime Governance V1 — main assessor.
 */

import { buildValidationRuntimeAudit } from '../validation-runtime-audit-v1/index.js';
import { buildCapabilityImpactGraph } from './capability-impact-graph.js';
import { buildDuplicatePreventionRules } from './duplicate-prevention.js';
import { buildGovernancePolicy, isValidationRuntimeGovernanceActive } from './governance-policy-authority.js';
import { computeGovernanceMetrics } from './governance-metrics.js';
import { buildRuntimeBudgetRegistry } from './runtime-budget-registry.js';
import { buildReuseStrategy } from './reuse-strategy.js';
import { buildTierAssignments } from './tier-registry.js';
import {
  AUDIT_V1_PASS_TOKEN,
  VALIDATION_RUNTIME_GOVERNANCE_V1_PASS_TOKEN,
} from './validation-runtime-governance-v1-bounds.js';
import type { ValidationRuntimeGovernanceAssessment } from './validation-runtime-governance-v1-types.js';
import { buildValidatorRegistry } from '../validation-runtime-audit-v1/index.js';

export function buildValidationRuntimeGovernanceAssessment(
  projectRootDir: string,
): ValidationRuntimeGovernanceAssessment {
  const auditResult = buildValidationRuntimeAudit(projectRootDir);
  const { assessment: auditAssessment } = auditResult;
  const registry = buildValidatorRegistry(projectRootDir);

  const tierAssignments = buildTierAssignments(auditAssessment.metrics);
  const capabilityImpactGraph = buildCapabilityImpactGraph(registry);
  const runtimeBudgetRegistry = buildRuntimeBudgetRegistry(auditAssessment.metrics);
  const reuseStrategy = buildReuseStrategy();
  const duplicatePreventionRules = buildDuplicatePreventionRules(auditAssessment.metrics);
  const policy = buildGovernancePolicy(duplicatePreventionRules);

  const governanceMetrics = computeGovernanceMetrics({
    metrics: auditAssessment.metrics,
    tierAssignments,
    aggregateDuplicateWorkPercent: auditAssessment.aggregateDuplicateWorkPercent,
  });

  return {
    version: 'V1',
    generatedAt: new Date().toISOString(),
    passToken: VALIDATION_RUNTIME_GOVERNANCE_V1_PASS_TOKEN,
    governanceActive: isValidationRuntimeGovernanceActive(),
    policy,
    tierAssignments,
    capabilityImpactGraph,
    runtimeBudgetRegistry,
    reuseStrategy,
    governanceMetrics,
    auditBaselinePassToken: AUDIT_V1_PASS_TOKEN,
  };
}
