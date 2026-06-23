export {

  BUILD_MATERIALIZATION_TRUTH_BRIDGE_PASS,

  BUILD_MATERIALIZATION_TRUTH_BRIDGE_OWNER_MODULE,

  BUILD_MATERIALIZATION_TRUTH_BRIDGE_PHASE,

  BUILD_MATERIALIZATION_TRUTH_BRIDGE_REPORT_TITLE,

  BUILD_MATERIALIZATION_TRUTH_RECONCILIATION_REPORT_TITLE,

  BUILD_MATERIALIZATION_TRUTH_BRIDGE_CORE_QUESTION,

  BUILD_MATERIALIZATION_TRUTH_RECONCILIATION_OPERATION,

  BUILD_MATERIALIZATION_TRUTH_BRIDGE_CACHE_KEY_PREFIX,

  EVIDENCE_PRIORITY_ORDER,

  RECONCILIATION_RULES,

  INTEGRATION_TARGET_AUTHORITIES,

  ORCHESTRATION_FLOW,

  SAFETY_GUARANTEES,

  FOUNDER_BUILD_TRUTH_QUESTIONS,

} from './build-materialization-truth-bridge-registry.js';



export type {

  BuildTruthVerdict,

  BuildTruthRootCause,

  BuildTruthContradictionKind,

  BuildTruthEvidencePriority,

  BuildTruthContradiction,

  BuildMaterializationTruthEvidenceSnapshot,

  BuildMaterializationTruthEvidence,

  BuildMaterializationFounderAnswers,

  BuildMaterializationTruthReconciliation,

  BuildMaterializationTruthBridgeReport,

  BuildMaterializationTruthBridgeAssessment,

  AssessBuildMaterializationTruthBridgeInput,

  BuildMaterializationTruthBridgeHistoryEntry,

} from './build-materialization-truth-bridge-types.js';



export {

  collectBuildMaterializationTruthEvidence,

  type CollectBuildMaterializationTruthEvidenceInput,

} from './evidence-bridge.js';



export {

  reconcileBuildMaterializationTruth,

  buildTruthMatrixBuildClaimFromReconciliation,

  derivePreReconciliationBuildVerdict,

  shouldSuppressArtifactsBrokenBlocker,

  applyBuildMaterializationTruthToClaims,

} from './truth-reconciler.js';



export {

  resetBuildMaterializationTruthBridgeHistoryForTests,

  recordBuildMaterializationTruthBridgeAssessment,

  getBuildMaterializationTruthBridgeHistorySize,

  getLatestBuildMaterializationTruthBridgeHistoryEntry,

  getBuildMaterializationTruthBridgeHistory,

} from './build-materialization-truth-bridge-history.js';



export {

  buildBuildMaterializationTruthBridgeReportMarkdown,

  buildBuildMaterializationTruthReconciliationReportMarkdown,

} from './build-materialization-truth-bridge-report-builder.js';



export {

  assessBuildMaterializationTruthBridge,

  resetBuildMaterializationTruthBridgeCounterForTests,

  resetBuildMaterializationTruthBridgeModuleForTests,

} from './build-materialization-truth-bridge-authority.js';


