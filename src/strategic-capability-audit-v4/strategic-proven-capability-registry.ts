/**
 * Strategic Capability Audit V4 — evidence-driven proven capability registry.
 * Single source for roadmap COMPLETE vs active decisions.
 */

import type { StrategicEvidenceSnapshot } from './strategic-evidence-collector.js';

export interface ProvenCapabilityRecord {
  readOnly: true;
  capability: string;
  phase: string;
  passToken: string | null;
  evidenceSource: string;
  proven: boolean;
}

const GAP_CAPABILITY_TO_PHASE: Readonly<Record<string, string>> = {
  'General-purpose code generation': 'General-Purpose Code Generation',
  'Production observability for deployed apps': 'Production Observability Platform',
  'Continuous deployment pipeline for customer apps': 'Continuous Deployment Pipeline',
  'Multi-tenant customer operations': 'Customer Operations Platform',
  'Expired operational evidence': 'Evidence Revalidation Cycle',
  'Orphan capabilities': 'Canonical Ownership Extension',
  'Bounded autonomous evolution': 'Autonomous Evolution Loop',
  'UVL verification execution': 'UVL Verification Execution',
};

export function gapCapabilityToPhase(capability: string): string {
  return GAP_CAPABILITY_TO_PHASE[capability] ?? capability;
}

export function isPhaseProven(phase: string, records: readonly ProvenCapabilityRecord[]): boolean {
  return records.some((r) => r.phase === phase && r.proven);
}

export function collectProvenStrategicCapabilities(
  evidence: StrategicEvidenceSnapshot,
): ProvenCapabilityRecord[] {
  return [
    {
      readOnly: true,
      capability: 'General-Purpose Code Generation V1',
      phase: 'General-Purpose Code Generation',
      passToken: evidence.generalPurposeCodegen.passToken,
      evidenceSource: 'General-Purpose Code Generation V1',
      proven: evidence.generalPurposeCodegen.proven,
    },
    {
      readOnly: true,
      capability: 'Continuous Deployment Pipeline V1',
      phase: 'Continuous Deployment Pipeline',
      passToken: evidence.continuousDeploymentProven ? 'CONTINUOUS_DEPLOYMENT_PIPELINE_V1_PASS' : null,
      evidenceSource: 'Continuous Deployment Pipeline V1',
      proven: evidence.continuousDeploymentProven,
    },
    {
      readOnly: true,
      capability: 'Production Observability Platform V1',
      phase: 'Production Observability Platform',
      passToken: evidence.productionObservabilityProven
        ? 'PRODUCTION_OBSERVABILITY_PLATFORM_V1_PASS'
        : null,
      evidenceSource: 'Production Observability Platform V1',
      proven: evidence.productionObservabilityProven,
    },
    {
      readOnly: true,
      capability: 'Customer Operations Platform V1',
      phase: 'Customer Operations Platform',
      passToken: evidence.customerOperationsProven ? 'CUSTOMER_OPERATIONS_PLATFORM_V1_PASS' : null,
      evidenceSource: 'Customer Operations Platform V1',
      proven: evidence.customerOperationsProven,
    },
    {
      readOnly: true,
      capability: 'Production Readiness Gate V1',
      phase: 'Production Readiness Gate',
      passToken: evidence.productionReadiness.passToken,
      evidenceSource: 'Production Readiness Gate V1',
      proven: evidence.productionReadiness.proven,
    },
    {
      readOnly: true,
      capability: 'Cloud Execution Path V1',
      phase: 'Cloud Execution Path',
      passToken: evidence.cloudExecution.passToken,
      evidenceSource: 'Cloud Execution Path V1',
      proven: evidence.cloudExecution.proven,
    },
    {
      readOnly: true,
      capability: 'Unified Failure Escalation Authority V1',
      phase: 'Unified Failure Escalation Authority',
      passToken: evidence.failureEscalationProven ? 'UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_PASS' : null,
      evidenceSource: 'Unified Failure Escalation Authority V1',
      proven: evidence.failureEscalationProven,
    },
    {
      readOnly: true,
      capability: 'Operational Evidence Freshness Authority V1',
      phase: 'Operational Evidence Freshness Authority',
      passToken: evidence.evidenceFreshnessProven
        ? 'OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_PASS'
        : null,
      evidenceSource: 'Operational Evidence Freshness Authority V1',
      proven: evidence.evidenceFreshnessProven,
    },
    {
      readOnly: true,
      capability: 'Evidence Revalidation Cycle V1',
      phase: 'Evidence Revalidation Cycle',
      passToken: evidence.evidenceRevalidationProven
        ? 'EVIDENCE_REVALIDATION_CYCLE_V1_PASS'
        : null,
      evidenceSource: 'Evidence Revalidation Cycle V1',
      proven: evidence.evidenceRevalidationProven,
    },
    {
      readOnly: true,
      capability: 'Canonical Ownership V2',
      phase: 'Canonical Ownership V2 Registration',
      passToken: evidence.canonicalOwnershipProven ? 'CANONICAL_OWNERSHIP_V2_PASS' : null,
      evidenceSource: 'Canonical Ownership V2',
      proven: evidence.canonicalOwnershipProven,
    },
    {
      readOnly: true,
      capability: 'Large-Scale Pipeline Integration V1',
      phase: 'Large-Scale Pipeline Integration',
      passToken: evidence.pipelineIntegration.integrationComplete
        ? 'LARGE_SCALE_PIPELINE_INTEGRATION_V1_PASS'
        : null,
      evidenceSource: 'Large-Scale Pipeline Integration V1',
      proven: evidence.pipelineIntegration.integrationComplete,
    },
  ];
}

export function provenPhaseSet(records: readonly ProvenCapabilityRecord[]): Set<string> {
  return new Set(records.filter((r) => r.proven).map((r) => r.phase));
}
