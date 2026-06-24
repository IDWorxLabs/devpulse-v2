/**
 * Strategic Capability Audit V4 — fresh roadmap builder (evidence-driven, not V3 templates).
 */

import type { RoadmapV4Priority, StrategicGapEntry } from './strategic-capability-audit-v4-types.js';
import type { StrategicEvidenceSnapshot } from './strategic-evidence-collector.js';
import { collectProvenStrategicCapabilities } from './strategic-proven-capability-registry.js';
import {
  buildActivePrioritiesFromUnresolvedGaps,
  buildCompleteEntriesForProvenCapabilities,
  mergeRoadmapPriorities,
  PHASE_BY_GAP,
} from './strategic-roadmap-evidence-builder.js';

export function buildRoadmapV4(input: {
  gaps: readonly StrategicGapEntry[];
  evidence: StrategicEvidenceSnapshot;
  noMajorGaps: boolean;
  highestValue: string;
}): RoadmapV4Priority[] {
  const provenRecords = collectProvenStrategicCapabilities(input.evidence);
  const seenPhases = new Set<string>();

  if (input.noMajorGaps && input.evidence.continuousDeploymentProven) {
    const active = buildActivePrioritiesFromUnresolvedGaps({
      gaps: input.gaps,
      provenRecords,
      highestValue: input.highestValue,
      maxActive: 2,
    });
    const complete = buildCompleteEntriesForProvenCapabilities(provenRecords);
    return mergeRoadmapPriorities(active, complete);
  }

  if (input.noMajorGaps && input.evidence.productionObservabilityProven) {
    const active = buildActivePrioritiesFromUnresolvedGaps({
      gaps: input.gaps,
      provenRecords,
      highestValue: input.highestValue,
      maxActive: 2,
    });
    const complete = buildCompleteEntriesForProvenCapabilities(provenRecords);
    return mergeRoadmapPriorities(active, complete);
  }

  if (input.noMajorGaps && input.evidence.customerOperationsProven) {
    const active = buildActivePrioritiesFromUnresolvedGaps({
      gaps: input.gaps,
      provenRecords,
      highestValue: input.highestValue,
      maxActive: 2,
    });
    const complete = buildCompleteEntriesForProvenCapabilities(provenRecords);
    return mergeRoadmapPriorities(active, complete);
  }

  if (input.noMajorGaps) {
    const active = buildActivePrioritiesFromUnresolvedGaps({
      gaps: input.gaps,
      provenRecords,
      highestValue: input.highestValue,
      maxActive: 3,
    });
    return mergeRoadmapPriorities(active, buildCompleteEntriesForProvenCapabilities(provenRecords));
  }

  const priorities: RoadmapV4Priority[] = [];
  let rank = 1;
  for (const gapEntry of input.gaps) {
    const mapping = PHASE_BY_GAP[gapEntry.capability] ?? {
      phase: gapEntry.capability,
      action: 'BUILD' as const,
    };
    if (seenPhases.has(mapping.phase)) continue;
    seenPhases.add(mapping.phase);

    const proven = provenRecords.find((r) => r.phase === mapping.phase && r.proven);
    priorities.push({
      readOnly: true,
      rank,
      phase: mapping.phase,
      action: proven ? 'COMPLETE' : mapping.action,
      rationale: proven
        ? `${mapping.phase} proven — ${proven.passToken ?? 'PASS'}`
        : gapEntry.detail,
      impact: gapEntry.severity === 'BLOCKING' ? 'CRITICAL' : gapEntry.severity,
      dependencies: deriveDependencies(gapEntry, input.evidence),
      evidenceBasis: proven?.passToken ?? gapEntry.evidenceBasis,
    });
    rank += 1;
    if (rank > 8) break;
  }

  return priorities;
}

function deriveDependencies(
  gap: StrategicGapEntry,
  evidence: StrategicEvidenceSnapshot,
): string[] {
  switch (gap.category) {
    case 'Customer-Facing Capabilities':
      return ['Production Readiness Gate V1', 'Cloud Execution Path V1', 'Canonical Ownership V2'];
    case 'Cloud-Scale Capabilities':
      return ['Cloud Execution Path V1', 'World2 Real Instantiation V1'];
    case 'Autonomous Software Factory':
      return ['Self-Evolution Execution V1', 'Unified Failure Escalation Authority V1'];
    case 'Operational Capabilities':
      return ['Operational Evidence Freshness Authority V1', 'Unified Failure Escalation Authority V1'];
    case 'Intelligence Capabilities':
      return ['Self-Evolution Execution V1', 'Product Architect Intelligence V1'];
    default:
      return evidence.canonicalOwnershipProven
        ? ['Capability Audit V3.1', 'Validation Runtime Governance V1']
        : ['Canonical Ownership V2 Registration'];
  }
}
