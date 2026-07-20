/**
 * Universal Relationship Intelligence Engine V1 — public exports.
 */

export {
  buildRelationshipMaterializationInputFromEnvelope,
  materializeUniversalRelationshipsForModule,
  augmentCrudComponentWithUniversalRelationships,
  shouldMaterializeUniversalRelationshipsForModule,
  buildUniversalRelationshipSharedRuntimeFiles,
  buildUniversalRelationshipMaterializationReport,
  renderUniversalRelationshipMaterializationReportMarkdown,
  computeUniversalRelationshipCapabilityCoverageScore,
  verifyUniversalRelationshipBehavior,
  diagnoseUniversalRelationshipGenerationGaps,
  extractApprovedRelationshipsFromEnvelope,
  detectStaticRelationshipShell,
  validateRelationshipGraph,
  validateSingleRelationshipGraph,
  normalizeApprovedRelationship,
  normalizeApprovedRelationships,
  classifyRelationshipSupport,
  resolveRelationshipEndpoints,
  UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE_VERSION,
  UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE_SOURCE,
} from './universal-relationship-intelligence-engine.js';

export type {
  UniversalRelationshipDescriptor,
  UniversalRelationshipMaterializationInput,
  UniversalRelationshipMaterializationReport,
  UniversalRelationshipBehaviorVerificationResult,
  UniversalRelationshipSupportClassification,
  UniversalRelationshipVerificationClassification,
  UniversalRelationshipCardinality,
  RawApprovedRelationship,
} from './universal-relationship-types.js';

export type { UniversalRelationshipModuleMaterializationResult } from './universal-relationship-intelligence-engine.js';
