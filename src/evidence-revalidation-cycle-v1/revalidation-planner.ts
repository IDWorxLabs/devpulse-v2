/**
 * Evidence Revalidation Cycle V1 — revalidation planner.
 * Consumes OEFA, Validation Runtime Governance, Capability Audit, Strategic Audit signals.
 */

import { buildValidationRuntimeGovernanceAssessment } from '../validation-runtime-governance-v1/validation-runtime-governance-assessor.js';
import { buildValidationRuntimeAudit, buildValidatorRegistry } from '../validation-runtime-audit-v1/index.js';
import { buildCapabilityImpactGraph } from '../validation-runtime-governance-v1/capability-impact-graph.js';
import { planValidationRun } from '../validation-runtime-governance-v1/validation-run-planner.js';
import type { OperationalEvidenceFreshnessAssessment } from '../operational-evidence-freshness-authority-v1/operational-evidence-freshness-v1-types.js';
import type {
  EvidenceRevalidationRecord,
  RevalidationPriority,
  RevalidationQueueEntry,
  RevalidationRecommendedAction,
} from './evidence-revalidation-cycle-v1-types.js';

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
  'Production Observability Platform V1': 'validate:production-observability-platform-v1',
  'Continuous Deployment Pipeline V1': 'validate:continuous-deployment-pipeline-v1',
  'Customer Operations Platform V1': 'validate:customer-operations-platform-v1',
};

const PRIORITY_ORDER: Record<RevalidationPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

function actionForStatus(
  status: EvidenceRevalidationRecord['currentStatus'],
): RevalidationRecommendedAction {
  switch (status) {
    case 'FRESH':
    case 'REFRESHED':
      return 'No Action';
    case 'AGING':
      return 'FAST Validation';
    case 'STALE':
      return 'STANDARD Validation';
    case 'EXPIRED':
      return 'TARGETED Validation';
    case 'REVALIDATING':
      return 'TARGETED Validation';
  }
}

function priorityForRecord(input: {
  status: EvidenceRevalidationRecord['currentStatus'];
  freshnessScore: number;
  sourceCapability: string;
}): RevalidationPriority {
  if (input.status === 'EXPIRED') {
    if (input.freshnessScore <= 40) return 'CRITICAL';
    return 'HIGH';
  }
  if (input.status === 'STALE') return 'MEDIUM';
  if (input.status === 'AGING') return 'LOW';
  return 'LOW';
}

function tierForAction(action: RevalidationRecommendedAction): 'FAST' | 'STANDARD' | 'FULL' {
  switch (action) {
    case 'No Action':
      return 'FAST';
    case 'FAST Validation':
      return 'FAST';
    case 'STANDARD Validation':
      return 'STANDARD';
    case 'TARGETED Validation':
      return 'STANDARD';
  }
}

export function buildRevalidationRegistry(
  oefa: OperationalEvidenceFreshnessAssessment,
): EvidenceRevalidationRecord[] {
  const thresholds = oefa.confidenceDecay.thresholds;
  const now = Date.now();

  return oefa.registry.records.map((record) => {
    const status = record.status as EvidenceRevalidationRecord['currentStatus'];
    const expiresAt = new Date(
      new Date(record.lastValidatedAt).getTime() + thresholds.expiredDays * 86_400_000,
    ).toISOString();

    return {
      readOnly: true,
      capabilityId: record.sourceCapability,
      evidenceId: record.evidenceId,
      currentStatus: status,
      lastValidatedAt: record.lastValidatedAt,
      expiresAt,
      priority: priorityForRecord({
        status,
        freshnessScore: record.freshnessScore,
        sourceCapability: record.sourceCapability,
      }),
      recommendedAction: actionForStatus(status),
      revalidationResult: status === 'FRESH' ? 'SKIPPED' : 'PENDING',
    };
  });
}

export function buildPrioritizedRevalidationQueue(input: {
  projectRootDir: string;
  registry: readonly EvidenceRevalidationRecord[];
  oefa: OperationalEvidenceFreshnessAssessment;
}): RevalidationQueueEntry[] {
  const governance = buildValidationRuntimeGovernanceAssessment(input.projectRootDir);
  const registry = buildValidatorRegistry(input.projectRootDir);
  const auditResult = buildValidationRuntimeAudit(input.projectRootDir);
  const capabilityImpactGraph = buildCapabilityImpactGraph(registry);
  const tierAssignments = governance.tierAssignments;
  const metrics = auditResult.assessment.metrics;

  const pending = input.registry.filter(
    (r) => r.revalidationResult === 'PENDING' && r.recommendedAction !== 'No Action',
  );

  const queue: RevalidationQueueEntry[] = pending.map((record) => {
    const tier = tierForAction(record.recommendedAction);
    const validator = VALIDATOR_BY_CAPABILITY[record.capabilityId];
    const plan = planValidationRun({
      tier,
      capabilityImpactGraph,
      tierAssignments,
      metrics,
      explicitValidators: validator ? [validator] : undefined,
    });

    return {
      readOnly: true,
      evidenceId: record.evidenceId,
      capabilityId: record.capabilityId,
      priority: record.priority,
      currentStatus: record.currentStatus,
      recommendedAction: record.recommendedAction,
      validatorsToRun: plan.validatorsToRun,
      estimatedRuntimeSeconds: plan.estimatedRuntimeSeconds,
      governancePlannerUsed: true,
    };
  });

  return queue.sort(
    (a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      a.capabilityId.localeCompare(b.capabilityId),
  );
}

export function countDiscoveredByStatus(registry: readonly EvidenceRevalidationRecord[]): {
  expired: number;
  aging: number;
  stale: number;
  fresh: number;
  revalidating: number;
  refreshed: number;
} {
  return {
    expired: registry.filter((r) => r.currentStatus === 'EXPIRED').length,
    aging: registry.filter((r) => r.currentStatus === 'AGING').length,
    stale: registry.filter((r) => r.currentStatus === 'STALE').length,
    fresh: registry.filter((r) => r.currentStatus === 'FRESH').length,
    revalidating: registry.filter((r) => r.currentStatus === 'REVALIDATING').length,
    refreshed: registry.filter((r) => r.currentStatus === 'REFRESHED').length,
  };
}
