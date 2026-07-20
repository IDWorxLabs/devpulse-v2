/**
 * Contract-to-Module Traceability Authority V1 — edge registry.
 */

import type { TraceabilityEdge } from './contract-to-module-traceability-types.js';
import { fingerprintTraceabilityValue } from './contract-to-module-identity.js';
import { CONTRACT_TO_MODULE_TRACEABILITY_SOURCE } from './contract-to-module-traceability-types.js';

export function registerTraceabilityEdge(input: {
  edgeType: string;
  fromNodeId: string;
  toNodeId: string;
  sourceAuthority: string;
  sourceRecordId: string;
  reason: string;
}): TraceabilityEdge {
  const edgeId = `edge-${input.edgeType}-${input.fromNodeId}-${input.toNodeId}`;
  return {
    readOnly: true,
    edgeId,
    edgeType: input.edgeType,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    sourceAuthority: input.sourceAuthority,
    sourceRecordId: input.sourceRecordId,
    reason: input.reason,
    provenance: [CONTRACT_TO_MODULE_TRACEABILITY_SOURCE, input.sourceAuthority],
    fingerprint: fingerprintTraceabilityValue([edgeId, input.edgeType, input.fromNodeId, input.toNodeId]),
  };
}
