/**
 * Operational Evidence Freshness Authority V1 — revalidation recommendation engine.
 * Delegates to Validation Runtime Governance — no second validation planner.
 */

import { buildValidationRuntimeGovernanceAssessment } from '../validation-runtime-governance-v1/validation-runtime-governance-assessor.js';
import { buildValidationRuntimeAudit } from '../validation-runtime-audit-v1/index.js';
import { buildValidatorRegistry } from '../validation-runtime-audit-v1/index.js';
import { buildCapabilityImpactGraph } from '../validation-runtime-governance-v1/capability-impact-graph.js';
import { buildTierAssignments } from '../validation-runtime-governance-v1/tier-registry.js';
import { planValidationRun } from '../validation-runtime-governance-v1/validation-run-planner.js';
import type {
  FreshnessStatus,
  RevalidationAction,
  RevalidationRecommendation,
} from './operational-evidence-freshness-v1-types.js';

const VALIDATOR_BY_CAPABILITY: Record<string, string> = {
  'Capability Audit V3.1': 'validate:capability-audit-v3-1',
  'UVL Verification Execution V1': 'validate:uvl-verification-execution-v1',
  'Real Build Execution Pipeline V1.1': 'validate:real-build-execution-pipeline-v1-1',
  'Production Readiness Gate V1': 'validate:production-readiness-gate-v1',
  'Cloud Execution Path V1': 'validate:cloud-execution-path-v1',
  'World2 Real Instantiation V1': 'validate:world2-real-instantiation-v1',
  'Mobile Runtime Validation at Scale V1': 'validate:mobile-runtime-validation-at-scale-v1',
  'Large-Scale Pipeline Integration V1': 'validate:large-scale-pipeline-integration-v1',
  'Multi-Project Concurrent Execution V1': 'validate:multi-project-concurrent-execution-v1',
  'Self-Evolution Execution V1': 'validate:self-evolution-execution-v1',
  'Unified Failure Escalation Authority V1': 'validate:unified-failure-escalation-authority-v1',
  'Canonical Ownership V2 Registration': 'validate:canonical-ownership-v2',
  'Validation Runtime Governance V1': 'validate:validation-runtime-governance-v1',
  'CQI Maturity V1': 'validate:cqi-maturity-v1',
};

function actionForStatus(status: FreshnessStatus): RevalidationAction {
  switch (status) {
    case 'FRESH':
      return 'No Action';
    case 'AGING':
      return 'FAST Validation';
    case 'STALE':
      return 'STANDARD Validation';
    case 'EXPIRED':
      return 'FULL Validation';
  }
}

function tierForAction(action: RevalidationAction): 'FAST' | 'STANDARD' | 'FULL' | 'LAUNCH' | 'NONE' {
  switch (action) {
    case 'No Action':
      return 'NONE';
    case 'FAST Validation':
      return 'FAST';
    case 'STANDARD Validation':
      return 'STANDARD';
    case 'FULL Validation':
      return 'FULL';
    case 'LAUNCH Validation':
      return 'LAUNCH';
  }
}

export function buildRevalidationRecommendations(input: {
  projectRootDir: string;
  capabilities: readonly { capability: string; status: FreshnessStatus }[];
}): RevalidationRecommendation[] {
  const governance = buildValidationRuntimeGovernanceAssessment(input.projectRootDir);
  const registry = buildValidatorRegistry(input.projectRootDir);
  const auditResult = buildValidationRuntimeAudit(input.projectRootDir);
  const capabilityImpactGraph = buildCapabilityImpactGraph(registry);
  const tierAssignments = governance.tierAssignments;
  const metrics = auditResult.assessment.metrics;

  const recommendations: RevalidationRecommendation[] = [];
  const actionsSeen = new Set<RevalidationAction>();

  for (const cap of input.capabilities) {
    const action = actionForStatus(cap.status);
    actionsSeen.add(action);
    const tier = tierForAction(action);

    if (action === 'No Action') {
      recommendations.push({
        readOnly: true,
        capability: cap.capability,
        action,
        tier,
        rationale: 'Evidence is FRESH — no revalidation required.',
        validatorsToRun: [],
        estimatedRuntimeSeconds: 0,
        governancePlannerUsed: true,
      });
      continue;
    }

    const validator = VALIDATOR_BY_CAPABILITY[cap.capability];
    const plan = planValidationRun({
      tier: tier === 'NONE' ? 'FAST' : tier,
      capabilityImpactGraph,
      tierAssignments,
      metrics,
      explicitValidators: validator ? [validator] : undefined,
      changedFiles: cap.status === 'EXPIRED' ? [`src/${cap.capability.replace(/\s+/g, '-').toLowerCase()}/`] : undefined,
    });

    recommendations.push({
      readOnly: true,
      capability: cap.capability,
      action,
      tier,
      rationale: `${cap.status} evidence — Validation Runtime Governance recommends ${tier} tier (${plan.rationale}).`,
      validatorsToRun: plan.validatorsToRun,
      estimatedRuntimeSeconds: plan.estimatedRuntimeSeconds,
      governancePlannerUsed: true,
    });
  }

  if (!actionsSeen.has('LAUNCH Validation')) {
    recommendations.push({
      readOnly: true,
      capability: 'Launch Candidate Suite',
      action: 'LAUNCH Validation',
      tier: 'LAUNCH',
      rationale: 'Governance planner — launch tier available for maximum confidence revalidation.',
      validatorsToRun: planValidationRun({
        tier: 'LAUNCH',
        capabilityImpactGraph,
        tierAssignments,
        metrics,
      }).validatorsToRun.slice(0, 5),
      estimatedRuntimeSeconds: planValidationRun({
        tier: 'LAUNCH',
        capabilityImpactGraph,
        tierAssignments,
        metrics,
      }).estimatedRuntimeSeconds,
      governancePlannerUsed: true,
    });
    actionsSeen.add('LAUNCH Validation');
  }

  const proofHarnessStatuses: Array<{ capability: string; status: FreshnessStatus }> = [
    { capability: 'Proof Harness — Aging Evidence', status: 'AGING' },
    { capability: 'Proof Harness — Stale Evidence', status: 'STALE' },
  ];

  for (const harness of proofHarnessStatuses) {
    if (actionsSeen.has(actionForStatus(harness.status))) continue;
    const action = actionForStatus(harness.status);
    const tier = tierForAction(action);
    const plan = planValidationRun({
      tier: tier === 'NONE' ? 'FAST' : tier,
      capabilityImpactGraph,
      tierAssignments,
      metrics,
    });
    recommendations.push({
      readOnly: true,
      capability: harness.capability,
      action,
      tier,
      rationale: `Proof harness — ${harness.status} evidence revalidation via Validation Runtime Governance.`,
      validatorsToRun: plan.validatorsToRun.slice(0, 3),
      estimatedRuntimeSeconds: plan.estimatedRuntimeSeconds,
      governancePlannerUsed: true,
    });
    actionsSeen.add(action);
  }

  return recommendations;
}
