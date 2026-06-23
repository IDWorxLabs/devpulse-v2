export {
  RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_PASS,
  RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_OWNER_MODULE,
  RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_PHASE,
  RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_REPORT_TITLE,
  RUNTIME_MATERIALIZATION_TRUTH_RECONCILIATION_REPORT_TITLE,
  RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_CORE_QUESTION,
  RUNTIME_MATERIALIZATION_TRUTH_RECONCILIATION_OPERATION,
  RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_CACHE_KEY_PREFIX,
  EVIDENCE_PRIORITY_ORDER,
  RECONCILIATION_RULES,
  INTEGRATION_TARGET_AUTHORITIES,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
  FOUNDER_RUNTIME_TRUTH_QUESTIONS,
  RUNTIME_APPLICATION_CLAIM_IDS,
} from './runtime-materialization-truth-bridge-registry.js';

export type {
  ApplicationTruthVerdict,
  ApplicationTruthRootCause,
  ApplicationTruthContradictionKind,
  RuntimeEvidencePriority,
  RuntimeStartupEvidence,
  RuntimeRouteEvidence,
  RuntimeUiEvidence,
  RuntimeFounderFlowEvidence,
  RuntimeTruthContradiction,
  RuntimeMaterializationTruthEvidenceSnapshot,
  RuntimeMaterializationTruthEvidence,
  RuntimeMaterializationFounderAnswers,
  RuntimeMaterializationTruthReconciliation,
  RuntimeMaterializationTruthBridgeReport,
  RuntimeMaterializationTruthBridgeAssessment,
  AssessRuntimeMaterializationTruthBridgeInput,
  RuntimeMaterializationTruthBridgeHistoryEntry,
  RuntimeApplicationClaimId,
} from './runtime-materialization-truth-bridge-types.js';

export type { RuntimeProofAnalysis, RuntimeFailureBoundary } from './runtime-proof-analyzer.js';

export {
  collectRuntimeMaterializationTruthEvidence,
  type CollectRuntimeMaterializationTruthEvidenceInput,
} from './runtime-evidence-collector.js';

export {
  analyzeRuntimeProofBoundaries,
  mapApplicationVerdictToConsistency,
} from './runtime-proof-analyzer.js';

export {
  reconcileRuntimeMaterializationTruth,
  applyRuntimeMaterializationTruthToClaims,
  shouldSuppressRuntimeFailureBlocker,
} from './runtime-truth-reconciler.js';

export {
  resetRuntimeMaterializationTruthBridgeHistoryForTests,
  recordRuntimeMaterializationTruthBridgeAssessment,
  getRuntimeMaterializationTruthBridgeHistorySize,
  getLatestRuntimeMaterializationTruthBridgeHistoryEntry,
  getRuntimeMaterializationTruthBridgeHistory,
} from './runtime-materialization-truth-bridge-history.js';

export {
  buildRuntimeMaterializationTruthBridgeReportMarkdown,
  buildRuntimeMaterializationTruthReconciliationReportMarkdown,
} from './runtime-materialization-truth-bridge-report-builder.js';

export {
  assessRuntimeMaterializationTruthBridge,
  resetRuntimeMaterializationTruthBridgeCounterForTests,
  resetRuntimeMaterializationTruthBridgeModuleForTests,
} from './runtime-materialization-truth-bridge-authority.js';
