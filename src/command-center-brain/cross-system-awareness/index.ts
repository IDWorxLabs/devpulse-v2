export {
  RELATIONSHIP_TYPES,
  CROSS_SYSTEM_AWARENESS_PASS_TOKEN,
  CROSS_SYSTEM_AWARENESS_OWNER_MODULE,
  DUPLICATE_CROSS_SYSTEM_PATTERNS,
  type RelationshipType,
  type SystemRelationshipEdge,
  type CrossSystemSystemRecord,
  type CrossSystemAwarenessSnapshot,
} from './relationship-types.js';

export {
  SYSTEM_RELATIONSHIP_EDGES,
  buildCrossSystemRegistry,
  getRelationshipEdges,
  getSystemById,
  registryKey,
  resolveSystemIdFromMessage,
  resolveSystemPairFromMessage,
} from './system-relationship-registry.js';

export {
  analyzeDependencies,
  analyzeDependenciesFromMessage,
  formatDependencyResponse,
  countTotalDependencies,
  type DependencyAnalysisResult,
} from './dependency-analyzer.js';

export {
  analyzeImpact,
  analyzeImpactFromMessage,
  formatImpactResponse,
  type ImpactAnalysisResult,
} from './impact-analyzer.js';

export {
  processCrossSystemAwareness,
  buildCrossSystemSnapshot,
  crossSystemAwarenessKey,
  isCrossSystemCategory,
  DevPulseV2CrossSystemAwareness,
  getDevPulseV2CrossSystemAwareness,
  type CrossSystemAwarenessResult,
} from './cross-system-awareness-engine.js';

export {
  CROSS_SYSTEM_ROUTING_PASS_TOKEN,
  buildCrossSystemRoutingReport,
  routingReportKey,
  type CrossSystemRoutingReport as CrossSystemRoutingReportDetail,
  type CrossSystemAnalyzerUsed,
} from './runtime-verification/index.js';
