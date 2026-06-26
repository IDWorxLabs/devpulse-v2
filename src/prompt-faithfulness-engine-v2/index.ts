/**
 * Prompt Faithfulness Engine V2 — public API.
 */

import { resetPromptAmbiguityDetectorForTests } from './prompt-ambiguity-detector.js';
import { resetPromptAssumptionDetectorForTests } from './prompt-assumption-detector.js';
import { resetPromptCapabilityMapperForTests } from './prompt-capability-mapper.js';
import { resetPromptCompletenessAnalyzerForTests } from './prompt-completeness-analyzer.js';
import { resetPromptConflictDetectorForTests } from './prompt-conflict-detector.js';
import { resetPromptDriftDetectorForTests } from './prompt-drift-detector.js';
import { resetPromptEvidenceContractForTests } from './prompt-evidence-contract.js';
import { resetPromptEvidenceExtractorForTests } from './prompt-evidence-extractor.js';
import {
  resetPromptFaithfulnessAuthorityForTests,
} from './prompt-faithfulness-authority.js';
import { resetPromptFaithfulnessHistoryForTests } from './prompt-faithfulness-history.js';
import { resetPromptFaithfulnessScorerForTests } from './prompt-faithfulness-scorer.js';
import { resetPromptKnowledgeGraphForTests } from './prompt-knowledge-graph.js';
import { resetPromptRegressionMonitorForTests } from './prompt-regression-monitor.js';
import { resetPromptRequirementRegistryForTests } from './prompt-requirement-registry.js';
import { resetPromptTraceabilityEngineForTests } from './prompt-traceability-engine.js';
import { resetPromptChangeImpactForTests } from './prompt-change-impact.js';

export {
  PROMPT_FAITHFULNESS_ENGINE_V2_PASS_TOKEN,
  PROMPT_FAITHFULNESS_ENGINE_V2_OWNER_MODULE,
  PROMPT_EVIDENCE_CONTRACT_VERSION,
  DEFAULT_FAITHFULNESS_THRESHOLD,
  DEFAULT_DRIFT_THRESHOLD,
  DEFAULT_MAX_FAITHFULNESS_HISTORY,
} from './prompt-faithfulness-registry.js';

export type {
  EvidenceCategory,
  RequirementPriority,
  EvidenceStrength,
  VerificationStatus,
  ParsedPrompt,
  ParsedPromptSection,
  PromptEvidenceItem,
  PromptEvidenceContract,
  PromptRequirement,
  KnowledgeGraphNode,
  PromptKnowledgeGraph,
  CapabilityMappingEntry,
  TraceabilityLink,
  PromptConflict,
  PromptAmbiguity,
  UnsupportedAssumption,
  CompletenessGap,
  CompletenessAnalysis,
  FaithfulnessCoverageMetrics,
  PromptFaithfulnessScore,
  DriftDetectionResult,
  PromptFaithfulnessV2Result,
  PromptFaithfulnessHistoryEntry,
  ContinuousMonitoringResult,
  LaunchFaithfulnessEvidence,
} from './prompt-faithfulness-v2-types.js';

export { parsePrompt } from './prompt-parser.js';
export { extractPromptEvidence, resetPromptEvidenceExtractorForTests } from './prompt-evidence-extractor.js';
export { buildPromptEvidenceContract, assertContractImmutable, resetPromptEvidenceContractForTests } from './prompt-evidence-contract.js';
export {
  buildRequirementRegistry,
  updateRequirementVerificationStatus,
  getRequirementById,
  resetPromptRequirementRegistryForTests,
} from './prompt-requirement-registry.js';
export { buildPromptKnowledgeGraph, resetPromptKnowledgeGraphForTests } from './prompt-knowledge-graph.js';
export { mapRequirementsToCapabilities, getMissingCapabilities, resetPromptCapabilityMapperForTests } from './prompt-capability-mapper.js';
export {
  buildTraceabilityLinks,
  getRequirementsForArtifact,
  assertArtifactHasLineage,
  resetPromptTraceabilityEngineForTests,
} from './prompt-traceability-engine.js';
export { detectPromptConflicts, hasBlockingConflicts, resetPromptConflictDetectorForTests } from './prompt-conflict-detector.js';
export { detectPromptAmbiguities, hasBlockingAmbiguities, resetPromptAmbiguityDetectorForTests } from './prompt-ambiguity-detector.js';
export { detectUnsupportedAssumptions, hasRejectedAssumptions, resetPromptAssumptionDetectorForTests } from './prompt-assumption-detector.js';
export { analyzePromptCompleteness, resetPromptCompletenessAnalyzerForTests } from './prompt-completeness-analyzer.js';
export { calculatePromptFaithfulnessScore, formatFaithfulnessScorePercent, resetPromptFaithfulnessScorerForTests } from './prompt-faithfulness-scorer.js';
export { detectPromptDrift, resetPromptDriftDetectorForTests } from './prompt-drift-detector.js';
export { runContinuousFaithfulnessMonitoring, resetPromptRegressionMonitorForTests } from './prompt-regression-monitor.js';
export { analyzeChangeImpact, resetPromptChangeImpactForTests } from './prompt-change-impact.js';
export type { ChangeImpactAnalysis } from './prompt-change-impact.js';
export { buildPromptFaithfulnessContractReport } from './prompt-contract-report-builder.js';
export {
  recordPromptFaithfulnessHistory,
  getPromptFaithfulnessHistory,
  getPromptFaithfulnessHistorySize,
  resetPromptFaithfulnessHistoryForTests,
} from './prompt-faithfulness-history.js';

export {
  getDevPulseV2PromptFaithfulnessEngineV2,
  runPromptFaithfulnessEngineV2,
  getActivePromptEvidenceContract,
  getLastPromptFaithfulnessV2Result,
  verifyRequirementFaithfulness,
  buildLaunchFaithfulnessEvidence,
  registerPromptFaithfulnessWithLaunchAuthority,
  registerPromptFaithfulnessWithCapabilityPlanning,
  registerPromptFaithfulnessWithExecutionTrace,
  resetPromptFaithfulnessAuthorityForTests,
} from './prompt-faithfulness-authority.js';

export function resetPromptFaithfulnessEngineV2ModuleForTests(): void {
  resetPromptFaithfulnessAuthorityForTests();
  resetPromptEvidenceExtractorForTests();
  resetPromptEvidenceContractForTests();
  resetPromptRequirementRegistryForTests();
  resetPromptKnowledgeGraphForTests();
  resetPromptCapabilityMapperForTests();
  resetPromptTraceabilityEngineForTests();
  resetPromptConflictDetectorForTests();
  resetPromptAmbiguityDetectorForTests();
  resetPromptAssumptionDetectorForTests();
  resetPromptCompletenessAnalyzerForTests();
  resetPromptFaithfulnessScorerForTests();
  resetPromptDriftDetectorForTests();
  resetPromptRegressionMonitorForTests();
  resetPromptChangeImpactForTests();
  resetPromptFaithfulnessHistoryForTests();
}
