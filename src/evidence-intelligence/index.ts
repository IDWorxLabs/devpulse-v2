/**
 * Evidence Intelligence — public exports.
 */

import { resetEvidenceSourceRegistryForTests } from './evidence-source-registry.js';
import { resetEvidenceRecordRegistryForTests } from './evidence-record-registry.js';
import { resetEvidenceIntelligenceCacheForTests } from './evidence-intelligence-cache.js';
import { resetEvidenceQualityAnalyzerForTests } from './evidence-quality-analyzer.js';
import { resetEvidenceSufficiencyAnalyzerForTests } from './evidence-sufficiency-analyzer.js';
import { resetEvidenceConflictDetectorForTests } from './evidence-conflict-detector.js';
import { resetEvidenceGapAnalyzerForTests } from './evidence-gap-analyzer.js';
import { resetEvidenceAuthorityBuilderForTests } from './evidence-authority-builder.js';
import { resetEvidenceIntelligenceEvaluatorForTests } from './evidence-intelligence-evaluator.js';
import { resetEvidenceIntelligenceHistoryForTests } from './evidence-intelligence-history.js';
import { resetEvidenceIntelligenceReportingForTests } from './evidence-intelligence-reporting.js';
import { resetEvidenceIntelligenceForTests } from './evidence-intelligence.js';
import { resetUnifiedTrustRuntimeModuleForTests } from '../unified-trust-runtime/index.js';

export {
  EVIDENCE_INTELLIGENCE_PASS_TOKEN,
  EVIDENCE_INTELLIGENCE_OWNER_MODULE,
  DEFAULT_MAX_EVIDENCE_HISTORY_SIZE,
  EVIDENCE_INTELLIGENCE_QUESTION_SIGNALS,
  isEvidenceIntelligenceQuestion,
} from './evidence-intelligence-types.js';

export type {
  EvidenceSourceId,
  EvidenceCategory,
  EvidenceStatus,
  EvidenceSufficiencyLevel,
  EvidenceSourceRegistration,
  RawEvidenceInput,
  EvidenceRecord,
  EvidenceQualityScores,
  EvidenceConflict,
  EvidenceGap,
  UnifiedEvidenceAuthority,
  EvidenceIntelligenceEvaluation,
  EvidenceIntelligenceRecord,
  EvidenceIntelligenceHistoryEntry,
  EvidenceIntelligenceReport,
  EvidenceIntelligenceInput,
  EvidenceIntelligenceResult,
  EvidenceIntelligenceRuntimeReport,
} from './evidence-intelligence-types.js';

export {
  registerEvidenceSource,
  getEvidenceSource,
  listEvidenceSources,
  getEvidenceSourceCount,
  isKnownEvidenceSource,
  listKnownEvidenceSourceIds,
  resetEvidenceSourceRegistryForTests,
} from './evidence-source-registry.js';

export {
  registerEvidenceRecord,
  registerEvidenceRecords,
  getEvidenceRecord,
  listEvidenceRecords,
  getEvidenceRecordCount,
  lookupEvidenceBySource,
  lookupEvidenceByProject,
  lookupEvidenceByWorkspace,
  lookupEvidenceByCategory,
  lookupEvidenceByStatus,
  lookupEvidenceByAuthority,
  resetEvidenceRecordRegistryForTests,
} from './evidence-record-registry.js';

export {
  analyzeEvidenceQuality,
  getQualityAnalysisCount,
  resetEvidenceQualityAnalyzerForTests,
} from './evidence-quality-analyzer.js';

export {
  analyzeEvidenceSufficiency,
  getSufficiencyAnalysisCount,
  resetEvidenceSufficiencyAnalyzerForTests,
} from './evidence-sufficiency-analyzer.js';

export {
  detectEvidenceConflicts,
  getConflictDetectionCount,
  resetEvidenceConflictDetectorForTests,
} from './evidence-conflict-detector.js';

export {
  analyzeEvidenceGaps,
  getGapAnalysisCount,
  resetEvidenceGapAnalyzerForTests,
} from './evidence-gap-analyzer.js';

export {
  buildUnifiedEvidenceAuthority,
  getAuthorityBuildCount,
  resetEvidenceAuthorityBuilderForTests,
} from './evidence-authority-builder.js';

export {
  evaluateEvidenceIntelligence,
  getEvaluationCount,
  resetEvidenceIntelligenceEvaluatorForTests,
} from './evidence-intelligence-evaluator.js';

export {
  recordEvidenceIntelligenceHistory,
  getEvidenceIntelligenceHistory,
  getEvidenceIntelligenceHistorySize,
  clearEvidenceIntelligenceHistory,
  resetEvidenceIntelligenceHistoryForTests,
} from './evidence-intelligence-history.js';

export {
  generateEvidenceIntelligenceReport,
  getReportCount,
  resetEvidenceIntelligenceReportingForTests,
} from './evidence-intelligence-reporting.js';

export { getEvidenceIntelligenceCacheStats, resetEvidenceIntelligenceCacheForTests } from './evidence-intelligence-cache.js';

export {
  getDevPulseV2EvidenceIntelligence,
  registerEvidenceIntelligenceWithCentralBrain,
  registerEvidenceIntelligenceWithUnifiedTrustRuntime,
  registerEvidenceIntelligenceWithTrustEngine,
  registerEvidenceIntelligenceWithAutonomousTesting,
  registerEvidenceIntelligenceWithAutonomousFixing,
  registerEvidenceIntelligenceWithAutonomousVerification,
  registerEvidenceIntelligenceWithCompletionEngine,
  registerEvidenceIntelligenceWithVerificationStrategyCore,
  registerEvidenceIntelligenceWithVerificationIntelligence,
  registerEvidenceIntelligenceWithVerificationIntegration,
  registerEvidenceIntelligenceWithMultiProjectVerification,
  registerEvidenceIntelligenceWithMultiProjectMonitoring,
  registerEvidenceIntelligenceWithSelfEvolutionGovernance,
  registerEvidenceIntelligenceWithWorld2,
  registerEvidenceIntelligenceWithUvl,
  getEvidenceIntelligenceRecord,
  listEvidenceIntelligenceRecords,
  getEvidenceIntelligenceRecordCount,
  runEvidenceIntelligence,
  getEvidenceIntelligenceRuntimeReport,
  resetEvidenceIntelligenceForTests,
} from './evidence-intelligence.js';

export type { EvidenceIntelligenceSystemSnapshot } from './evidence-intelligence.js';

export function resetEvidenceIntelligenceModuleForTests(): void {
  resetEvidenceRecordRegistryForTests();
  resetEvidenceIntelligenceCacheForTests();
  resetEvidenceSourceRegistryForTests();
  resetEvidenceQualityAnalyzerForTests();
  resetEvidenceSufficiencyAnalyzerForTests();
  resetEvidenceConflictDetectorForTests();
  resetEvidenceGapAnalyzerForTests();
  resetEvidenceAuthorityBuilderForTests();
  resetEvidenceIntelligenceEvaluatorForTests();
  resetEvidenceIntelligenceHistoryForTests();
  resetEvidenceIntelligenceReportingForTests();
  resetEvidenceIntelligenceForTests();
  resetUnifiedTrustRuntimeModuleForTests();
}
