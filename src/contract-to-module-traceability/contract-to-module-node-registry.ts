/**
 * Contract-to-Module Traceability Authority V1 — node registry.
 */

import type { TraceabilityNode } from './contract-to-module-traceability-types.js';
import { fingerprintTraceabilityValue, normalizeTraceabilityIdentity, traceabilityNodeId } from './contract-to-module-identity.js';
import { CONTRACT_TO_MODULE_TRACEABILITY_SOURCE } from './contract-to-module-traceability-types.js';

export function registerTraceabilityNode(input: {
  nodeType: TraceabilityNode['nodeType'];
  canonicalIdentity: string;
  displayName: string;
  sourceAuthority: string;
  sourceRecordId: string;
  envelopeFingerprint: string;
  contractFingerprint: string;
  requirementIds?: readonly string[];
  conceptIds?: readonly string[];
  featureIds?: readonly string[];
  behaviorIds?: readonly string[];
  moduleIds?: readonly string[];
  contributionIds?: readonly string[];
  capabilityKeys?: readonly string[];
  providerIds?: readonly string[];
  artifactPaths?: readonly string[];
  routeIds?: readonly string[];
  runtimeScopeIds?: readonly string[];
}): TraceabilityNode {
  const canonicalIdentity = normalizeTraceabilityIdentity(input.canonicalIdentity);
  const nodeId = traceabilityNodeId(input.nodeType, canonicalIdentity);
  return {
    readOnly: true,
    traceabilityNodeId: nodeId,
    nodeType: input.nodeType,
    canonicalIdentity,
    displayName: input.displayName,
    sourceAuthority: input.sourceAuthority,
    sourceRecordId: input.sourceRecordId,
    envelopeFingerprint: input.envelopeFingerprint,
    contractFingerprint: input.contractFingerprint,
    requirementIds: input.requirementIds ?? [],
    conceptIds: input.conceptIds ?? [],
    featureIds: input.featureIds ?? [],
    behaviorIds: input.behaviorIds ?? [],
    moduleIds: input.moduleIds ?? [],
    contributionIds: input.contributionIds ?? [],
    capabilityKeys: input.capabilityKeys ?? [],
    providerIds: input.providerIds ?? [],
    artifactPaths: input.artifactPaths ?? [],
    routeIds: input.routeIds ?? [],
    runtimeScopeIds: input.runtimeScopeIds ?? [],
    provenance: [CONTRACT_TO_MODULE_TRACEABILITY_SOURCE, input.sourceAuthority],
    fingerprint: fingerprintTraceabilityValue([nodeId, input.nodeType, canonicalIdentity, input.sourceRecordId]),
  };
}
