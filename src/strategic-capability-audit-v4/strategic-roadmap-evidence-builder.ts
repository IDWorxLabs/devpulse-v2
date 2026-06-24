/**
 * Strategic Capability Audit V4 — evidence-driven roadmap helpers.
 */

import type { RoadmapV4Priority, StrategicGapEntry } from './strategic-capability-audit-v4-types.js';
import type { StrategicEvidenceSnapshot } from './strategic-evidence-collector.js';
import {
  gapCapabilityToPhase,
  isPhaseProven,
  type ProvenCapabilityRecord,
} from './strategic-proven-capability-registry.js';

const PHASE_BY_GAP: Readonly<Record<string, { phase: string; action: RoadmapV4Priority['action'] }>> = {
  'Production observability for deployed apps': {
    phase: 'Production Observability Platform',
    action: 'BUILD',
  },
  'Multi-tenant customer operations': {
    phase: 'Customer Operations Platform',
    action: 'BUILD',
  },
  'General-purpose code generation': {
    phase: 'General-Purpose Code Generation',
    action: 'EXTEND',
  },
  'Continuous deployment pipeline for customer apps': {
    phase: 'Continuous Deployment Pipeline',
    action: 'BUILD',
  },
  'Expired operational evidence': {
    phase: 'Evidence Revalidation Cycle',
    action: 'MAINTAIN',
  },
  'Orphan capabilities': {
    phase: 'Canonical Ownership Extension',
    action: 'REGISTER',
  },
  'Bounded autonomous evolution': {
    phase: 'Autonomous Evolution Loop',
    action: 'EXTEND',
  },
  'UVL verification execution': {
    phase: 'UVL Verification Execution',
    action: 'BUILD',
  },
};

const COMPLETE_RATIONALE: Readonly<Record<string, { rationale: string; evidenceBasis: string; dependencies: string[] }>> = {
  'General-Purpose Code Generation': {
    rationale:
      'General-Purpose Code Generation V1 PASS: 10/10 non-trivial domains with workflow, role, domain logic, and production readiness proven.',
    evidenceBasis: 'GENERAL_PURPOSE_CODE_GENERATION_V1_PASS',
    dependencies: ['Real Build Execution Pipeline V1.1', 'UVL Verification Execution V1'],
  },
  'Continuous Deployment Pipeline': {
    rationale:
      'Continuous Deployment Pipeline V1 PASS: deployment candidates, promotion governance, staging-before-production, deployment history, and rollback recommendations proven.',
    evidenceBasis: 'CONTINUOUS_DEPLOYMENT_PIPELINE_V1_PASS',
    dependencies: ['Production Observability Platform V1', 'Cloud Execution Path V1'],
  },
  'Production Observability Platform': {
    rationale:
      'Production Observability Platform V1 PASS: application health, deployment tracking, availability monitoring, incident detection, and recovery recommendations proven.',
    evidenceBasis: 'PRODUCTION_OBSERVABILITY_PLATFORM_V1_PASS',
    dependencies: ['Customer Operations Platform V1', 'Unified Failure Escalation Authority V1'],
  },
  'Customer Operations Platform': {
    rationale:
      'Customer Operations Platform V1 PASS: 3 customers, tenant isolation 0 violations, project ownership, usage tracking, subscription readiness.',
    evidenceBasis: 'CUSTOMER_OPERATIONS_PLATFORM_V1_PASS',
    dependencies: ['Production Readiness Gate V1', 'Multi-Project Concurrent Execution V1'],
  },
  'Evidence Revalidation Cycle': {
    rationale:
      'Evidence Revalidation Cycle V1 PASS: expired evidence discovered, prioritized, and refreshed — confidence recovered without capability modification.',
    evidenceBasis: 'EVIDENCE_REVALIDATION_CYCLE_V1_PASS',
    dependencies: ['Operational Evidence Freshness Authority V1', 'Validation Runtime Governance V1'],
  },
};

export function filterUnresolvedGaps(
  gaps: readonly StrategicGapEntry[],
  provenRecords: readonly ProvenCapabilityRecord[],
): StrategicGapEntry[] {
  return gaps.filter((g) => {
    const phase = gapCapabilityToPhase(g.capability);
    if (isPhaseProven(phase, provenRecords)) return false;
    if (g.severity === 'LOW' && isPhaseProven(phase, provenRecords)) return false;
    return true;
  });
}

export function buildActivePrioritiesFromUnresolvedGaps(input: {
  gaps: readonly StrategicGapEntry[];
  provenRecords: readonly ProvenCapabilityRecord[];
  highestValue: string;
  maxActive?: number;
}): RoadmapV4Priority[] {
  const unresolved = filterUnresolvedGaps(input.gaps, input.provenRecords);
  const priorities: RoadmapV4Priority[] = [];
  const seenPhases = new Set<string>();
  let rank = 1;

  for (const gapEntry of unresolved) {
    if (gapEntry.severity === 'LOW' && gapEntry.strategicValueScore < 30) continue;
    const mapping = PHASE_BY_GAP[gapEntry.capability];
    if (!mapping) continue;
    if (seenPhases.has(mapping.phase)) continue;
    seenPhases.add(mapping.phase);

    priorities.push({
      readOnly: true,
      rank,
      phase: mapping.phase,
      action: mapping.action,
      rationale: gapEntry.detail,
      impact: gapEntry.severity === 'BLOCKING' ? 'CRITICAL' : gapEntry.severity,
      dependencies: [],
      evidenceBasis: gapEntry.evidenceBasis,
    });
    rank += 1;
    if (rank > (input.maxActive ?? 2)) break;
  }

  if (priorities.length === 0) {
    priorities.push({
      readOnly: true,
      rank: 1,
      phase: 'Operational Excellence Maintenance',
      action: 'MAINTAIN',
      rationale:
        'All registered strategic capabilities proven — maintain evidence freshness, escalation effectiveness, tenant isolation, and deployment health.',
      impact: 'MEDIUM',
      dependencies: [
        'Operational Evidence Freshness Authority V1',
        'Unified Failure Escalation Authority V1',
        'Continuous Deployment Pipeline V1',
      ],
      evidenceBasis: input.highestValue,
    });
  }

  return priorities;
}

export function buildCompleteEntriesForProvenCapabilities(
  provenRecords: readonly ProvenCapabilityRecord[],
): RoadmapV4Priority[] {
  const entries: RoadmapV4Priority[] = [];
  const order = [
    'General-Purpose Code Generation',
    'Continuous Deployment Pipeline',
    'Production Observability Platform',
    'Customer Operations Platform',
    'Evidence Revalidation Cycle',
  ];

  for (const phase of order) {
    const record = provenRecords.find((r) => r.phase === phase && r.proven);
    if (!record) continue;
    const meta = COMPLETE_RATIONALE[phase];
    if (!meta) continue;
    entries.push({
      readOnly: true,
      rank: 0,
      phase,
      action: 'COMPLETE',
      rationale: meta.rationale,
      impact: 'HIGH',
      dependencies: meta.dependencies,
      evidenceBasis: meta.evidenceBasis,
    });
  }

  return entries;
}

export function mergeRoadmapPriorities(
  active: readonly RoadmapV4Priority[],
  complete: readonly RoadmapV4Priority[],
): RoadmapV4Priority[] {
  const merged = [...active, ...complete];
  return merged.map((p, index) => ({ ...p, rank: index + 1 }));
}

export { PHASE_BY_GAP };
