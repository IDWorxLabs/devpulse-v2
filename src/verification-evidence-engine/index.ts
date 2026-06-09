/**
 * DevPulse V2 Phase 16.10 — Verification Evidence Engine public API.
 */

export {
  VERIFICATION_EVIDENCE_ENGINE_PASS_TOKEN,
  VERIFICATION_EVIDENCE_ENGINE_OWNER_MODULE,
  VERIFICATION_EVIDENCE_QUESTION_SIGNALS,
  FORBIDDEN_VERIFICATION_EVIDENCE_DUPLICATES,
  INITIAL_EVIDENCE_CATEGORIES,
  isVerificationEvidenceQuestion,
  isVerificationEvidenceAdvisoryQuestion,
  isDuplicateVerificationEvidenceQuestion,
  type EvidenceCategory,
  type EvidenceStatus,
  type EvidenceTrustState,
  type EvidenceVisibility,
  type EvidenceUsage,
  type EvidenceAuthorityState,
  type EvidenceOwnership,
  type EvidenceLineage,
  type EvidenceProvenance,
  type EvidenceRecord,
  type EvidenceValidationIssue,
  type EvidenceValidationResult,
  type EvidenceInventoryReport,
  type EvidenceOwnershipReport,
  type EvidenceLineageReport,
  type EvidenceTraceabilityReport,
  type EvidenceDiagnosticsReport,
  type EvidenceSummaryReport,
  type VerificationEvidenceDiagnostics,
  type PrepareVerificationEvidenceInput,
  type PrepareVerificationEvidenceResult,
} from './verification-evidence-types.js';

export {
  registerEvidence,
  getEvidence,
  listEvidence,
  listEvidenceByOwner,
  listEvidenceByVerification,
  listEvidenceByProject,
  listEvidenceByWorkspace,
  updateEvidenceRecord,
  registerInitialEvidenceFromTargets,
  buildSeedEvidenceRecord,
  nextEvidenceId,
  listRegisteredEvidenceTypes,
  resetVerificationEvidenceStoreForTests,
  type RegisterEvidenceResult,
} from './verification-evidence-store.js';

export {
  buildEvidenceOwnership,
  assignEvidenceOwnership,
  extractOwnershipReportEntries,
  validateOwnershipPresent,
} from './verification-evidence-ownership.js';

export {
  emptyEvidenceLineage,
  linkParentChild,
  linkDerivedEvidence,
  linkSupportingEvidence,
  countLineageLinks,
  extractLineageReportEntries,
  detectBrokenLineageReferences,
} from './verification-evidence-lineage.js';

export {
  buildTraceabilityIndex,
  locateByVerificationTarget,
  locateByVerificationSession,
  locateByProject,
  locateByWorkspace,
  locateByModule,
  locateByOwner,
  locateByReport,
  locateByOrchestration,
  locateByCompletionChain,
  locateByWorld2Chain,
  summarizeTraceabilityIndex,
  countTraceabilityKeys,
  type TraceabilityIndex,
} from './verification-evidence-traceability.js';

export {
  queryEvidence,
  getTraceabilityIndex,
  countEvidenceByCategory,
  type EvidenceQueryCriteria,
} from './verification-evidence-query.js';

export {
  validateEvidenceIntegrity,
  evaluateEvidenceGates,
  validateVerificationEvidence,
  type EvidenceGateReport,
} from './verification-evidence-validator.js';

export {
  buildEvidenceInventoryReport,
  buildEvidenceOwnershipReport,
  buildEvidenceLineageReport,
  buildEvidenceTraceabilityReport,
  buildEvidenceDiagnosticsReport,
  buildEvidenceSummaryReport,
  composeVerificationEvidenceResponse,
  deriveEvidenceAuthorityState,
  nextEvidenceAuthorityId,
  resetVerificationEvidenceReportCounterForTests,
  buildVerificationEvidenceFailureContext,
  type VerificationEvidenceFailureContext,
} from './verification-evidence-report-builder.js';

export {
  getVerificationEvidenceDiagnostics,
  updateVerificationEvidenceDiagnostics,
  resetVerificationEvidenceDiagnostics,
  verificationEvidenceEngineKey,
} from './verification-evidence-diagnostics.js';

export {
  prepareVerificationEvidence,
  processVerificationEvidenceRequest,
  getVerificationEvidenceContext,
} from './verification-evidence-engine.js';

export function getDevPulseV2VerificationEvidenceEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_verification_evidence_engine',
    passToken: 'VERIFICATION_EVIDENCE_ENGINE_V1_PASS',
    phase: 16.10,
    extensionOnly: true,
  };
}
