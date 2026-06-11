/**
 * Verification Reality — public exports.
 */

export {
  VERIFICATION_REALITY_PASS_TOKEN,
  VERIFICATION_REALITY_OWNER_MODULE,
} from './verification-reality-bounds.js';

export type {
  AssessVerificationRealityInput,
  VerificationAnalyzerResults,
  VerificationModulePresenceEvidence,
  VerificationRealityAssessment,
  VerificationRealityBlocker,
  VerificationRealityEvidence,
  VerificationRealityMatrixRow,
  VerificationRealityReport,
  VerificationRealityStage,
  VerificationRealitySubscores,
  VerificationWorkspaceSignals,
} from './verification-reality-types.js';

export type {
  BuildOutputLinkLevel,
  EvidenceChainBreakPoint,
  EvidenceChainLevel,
  PreviewLinkLevel,
  RuntimeLinkLevel,
  VerificationEvidenceLevel,
  VerificationInventoryLevel,
} from './verification-reality-analyzer-types.js';

export {
  MAX_HISTORY_ENTRIES,
  MAX_REGISTRY_ENTRIES,
  MAX_VERIFICATION_BLOCKERS,
  MAX_VERIFICATION_EVIDENCE,
} from './verification-reality-bounds.js';

export {
  analyzeBuildOutputLink,
  analyzeEvidenceChain,
  analyzePreviewLink,
  analyzeRuntimeLink,
  analyzeValidationInventory,
  buildVerificationWorkspaceSignalsForValidation,
  buildVerificationWorkspaceSignalsFromSnapshot,
  collectVerificationRealityEvidence,
  detectVerificationModulePresenceEvidence,
  resolveEvidenceChainBreakPoint,
  runAllVerificationRealityAnalyzers,
} from './verification-reality-analyzers.js';

export {
  getVerificationHistoryCount,
  listVerificationHistory,
  recordVerificationHistory,
  resetVerificationRealityHistoryForTests,
} from './verification-reality-history.js';

export {
  getVerificationRegistryCount,
  listVerificationRegistryEntries,
  resetVerificationRealityRegistryForTests,
  storeVerificationRegistryEntry,
} from './verification-reality-registry.js';

export {
  assessVerificationReality,
  buildVerificationRealityReport,
  resetVerificationRealityCounterForTests,
  writeVerificationRealityReportFile,
} from './verification-reality-authority.js';
