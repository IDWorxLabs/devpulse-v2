/**
 * Contract-to-Module Traceability Authority V1 — public exports.
 */

export {
  CONTRACT_TO_MODULE_TRACEABILITY_VERSION,
  CONTRACT_TO_MODULE_TRACEABILITY_SOURCE,
  type TraceabilityNode,
  type TraceabilityEdge,
  type TraceabilityFinding,
  type ContractToModuleTraceabilityGraph,
  type ContractToModuleTraceabilityInput,
  type ContractToModuleTraceabilityReport,
  type ConceptPreservationOutcome,
  type ModuleAncestryOutcome,
  type TraceabilityComplianceOutcome,
  type CanonicalBuildOutcome,
  type TransformationBoundary,
  type TraceabilityRootCause,
} from './contract-to-module-traceability-types.js';

export {
  normalizeTraceabilityIdentity,
  traceabilityNodeId,
  fingerprintTraceabilityValue,
  moduleIdentityFromDisplayName,
} from './contract-to-module-identity.js';

export { registerTraceabilityNode } from './contract-to-module-node-registry.js';
export { registerTraceabilityEdge } from './contract-to-module-edge-registry.js';

export {
  buildContractToModuleTraceabilityGraph,
  fingerprintTraceabilityGraph,
  fingerprintTraceabilityFinding,
  fingerprintTraceabilityReport,
} from './contract-to-module-graph-builder.js';

export {
  requireCompleteContractToModuleTraceability,
  runContractToModuleTraceabilityEvaluation,
  loadTraceabilityInputFromWorkspace,
  validateTraceabilityGraph,
  validateTransformationBoundary,
  detectMissingApprovedDescendants,
  detectUnapprovedGeneratedAncestors,
  detectSilentConceptLoss,
  detectIllegalModuleIntroduction,
  generateTraceabilityReport,
  filterModulesByApprovedPlan,
  runPreMaterializationTraceabilityGate,
  resolveMaterializationModuleIdsFromEnvelope,
  isModuleAllowedForMaterialization,
} from './contract-to-module-traceability-authority.js';

export {
  resolveUniversalFeatureNamesFromEnvelope,
  resolveUniversalFeatureNamesForCurrentBuild,
} from './feature-contract-surface-resolver.js';

export {
  runPreMaterializationTraceability,
  augmentWorkspaceWithContractToModuleTraceability,
  type TraceabilityPipelineResult,
} from './contract-to-module-pipeline-integration.js';

export { buildContractToModuleTraceabilityWorkspaceArtifacts } from './contract-to-module-workspace-artifacts.js';
export { toC1TraceabilityFindings, isC1RepairableTraceabilityFinding } from './contract-to-module-c1-adapter.js';
export { toB11TraceabilityBlockers } from './contract-to-module-b11-adapter.js';
export { buildProductFaithfulnessTraceabilityEvidence } from './contract-to-module-product-faithfulness-adapter.js';
export { projectBuildStatusFromTraceabilityOutcome, mergeTraceabilityBuildOutcome, type CanonicalBuildStatusProjection } from './contract-to-module-status-projection.js';
export { reconcileApprovedAndGeneratedModules } from './contract-to-module-output-reconciliation.js';
export { INFRASTRUCTURE_MODULE_REGISTRY, isRegisteredInfrastructureModule } from './contract-to-module-infrastructure-registry.js';
