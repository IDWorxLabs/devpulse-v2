/**
 * DevPulse V2 Phase 12.2 — Dependency Intelligence public API.
 */

export {
  DEPENDENCY_INTELLIGENCE_PASS_TOKEN,
  DEPENDENCY_INTELLIGENCE_OWNER_MODULE,
  DEPENDENCY_QUESTION_SIGNALS,
  FORBIDDEN_DEPENDENCY_INTELLIGENCE_DUPLICATES,
  isDependencyIntelligenceQuestion,
  isDuplicateDependencyBrainQuestion,
  displayNameFor,
  type DependencyEntityKind,
  type DependencyType,
  type DependencyConfidence,
  type DependencyEdge,
  type SystemDependency,
  type CapabilityDependency,
  type ModuleDependency,
  type PhaseDependency,
  type QuestionDependency,
  type DependencyGraph,
  type DependencyPathResult,
  type DependencyAnalysis,
  type DependencyIntelligenceDiagnostics,
  type DependencyAnswer,
} from './dependency-intelligence-types.js';

export {
  buildDependencyGraph,
  getDependencyGraph,
  getUpstreamDependencies,
  getDownstreamDependents,
  resetDependencyGraphForTests,
} from './dependency-graph-builder.js';

export { analyzeDependencies, dependencyFactsFromAnalysis } from './dependency-analyzer.js';
export { findDependencyPath, extractPathQueries } from './dependency-path-finder.js';
export { findHighestRiskDependency, assessRemovalImpact, compareRisk, riskLevelLabel } from './dependency-risk-detector.js';
export {
  findBlockedDependencies,
  findMissingDependencies,
  findBlockedCapabilities,
  blockersForSystem,
} from './dependency-blocker-detector.js';

export {
  getDependencyIntelligenceDiagnostics,
  updateDependencyIntelligenceDiagnostics,
  resetDependencyIntelligenceDiagnostics,
  dependencyIntelligenceKey,
} from './dependency-intelligence-diagnostics.js';

export {
  processDependencyIntelligenceRequest,
  getDependencyIntelligenceContext,
} from './dependency-intelligence.js';

export function getDevPulseV2DependencyIntelligence(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_dependency_intelligence',
    passToken: 'DEVPULSE_V2_DEPENDENCY_INTELLIGENCE_FOUNDATION_V1_PASS',
    phase: 12.2,
  };
}
