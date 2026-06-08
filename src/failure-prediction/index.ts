export {
  createDevPulseV2FailurePredictionAuthority,
  DevPulseV2FailurePredictionAuthority,
  getDevPulseV2FailurePredictionAuthority,
  resetDevPulseV2FailurePredictionAuthorityForTests,
} from './failure-prediction-authority.js';
export {
  analyzeFailurePatterns,
  analyzeObservationPatterns,
  analyzeReplayPatterns,
  analyzeVerificationPatterns,
  generatePredictionRecords,
  summarizePredictions,
  BROWSER_VERIFICATION_WARNS_TITLE,
  REPEATED_MISSING_UI_TITLE,
  REPEATED_VALIDATION_FAILURES_TITLE,
} from './failure-prediction-engine.js';
export {
  buildFailurePredictionReport,
  formatFailurePredictionReport,
} from './failure-prediction-report.js';
export { createPredictionRecord, scoreConfidence } from './failure-prediction-scoring.js';
export {
  assertCentralBrainOwnershipUnchanged,
  getCentralBrainOwnerForBridge,
  getLatestPredictionSummary,
  publishPredictionSummary,
  resetPredictionBrainBridgeForTests,
} from './prediction-brain-bridge.js';
export {
  assertEvidenceRegistryOwnershipUnchanged,
  collectPredictionEvidence,
  getEvidenceRegistryOwnerForBridge,
  getLastCollectedPredictionEvidenceIds,
  getPredictionEvidenceSummary,
  resetPredictionEvidenceBridgeForTests,
} from './prediction-evidence-bridge.js';
export {
  analyzeRealityReplayPatterns,
  assertRealityReplayOwnershipUnchanged,
  getRealityPredictionSummary,
  getRealityReplayOwnerForBridge,
} from './prediction-reality-replay-bridge.js';
export {
  analyzeObservationPatterns as analyzeObservationBridgePatterns,
  assertSelfVisionOwnershipUnchanged,
  getObservationPredictionSummary,
  getSelfVisionOwnerForBridge,
} from './prediction-self-vision-bridge.js';
export {
  analyzeSessionReplayPatterns,
  assertSessionReplayOwnershipUnchanged,
  getReplayPredictionSummary,
  getSessionReplayOwnerForBridge,
} from './prediction-session-replay-bridge.js';
export {
  analyzeVerificationPatterns as analyzeVerificationBridgePatterns,
  assertVerificationLoopOwnershipUnchanged,
  getVerificationLoopOwnerForBridge,
  getVerificationPredictionSummary,
} from './prediction-verification-bridge.js';
export {
  PREDICTION_OWNER_MODULE,
  PREDICTION_PASS_TOKEN,
  type FailurePredictionAuthorityState,
  type FailurePredictionReport,
  type PredictionConfidence,
  type PredictionRecord,
  type PredictionStatus,
  type PredictionSummary,
  type RiskLevel,
} from './types.js';
