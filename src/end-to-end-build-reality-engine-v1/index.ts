/**
 * End-to-End Build Reality Engine V1 — public API.
 */

export {
  END_TO_END_BUILD_REALITY_ENGINE_V1_PASS,
  type E2EBuildRealityVerdict,
  type E2EBuildRealityStageId,
  type E2EStageResult,
  type E2EContractExpectationBundle,
  type E2EContractFeatureModule,
  type E2EValidationStep,
  type E2EValidationCheck,
  type E2EBuildRealityEvidence,
  type E2EFalseSuccessFinding,
  type E2EBuildRealityReport,
  type PreviewAuthorityAuditReportRef,
  type RunEndToEndBuildRealityInput,
} from './e2e-build-reality-types.js';

export { extractContractExpectations } from './contract-expectation-extractor.js';
export { buildContractDerivedValidationPlan, listGenericShellMarkers } from './contract-derived-plan-generator.js';
export {
  discoverModuleInteractions,
  discoverPromptSemanticHints,
  deriveSmokeButtonSequence,
  expectedArithmeticResult,
} from './feature-source-interaction-discovery.js';
export { detectFalseSuccesses } from './false-success-detector.js';
export { collectBuildRealityEvidence } from './evidence-collector.js';
export {
  runContractDerivedDomReality,
  createPlaywrightDomRealityPage,
  stageLabel,
  type E2EInteractionReplayStep,
} from './e2e-dom-reality-runner.js';
export {
  assessWorkspaceRealityAuditIntegration,
  assessFeatureRealityIntegration,
  assessRuntimeTruthIntegration,
  assessFounderTestingGateIntegration,
} from './e2e-authority-integrations.js';
export {
  E2E_REGRESSION_PROMPT_SUITE,
  E2E_REGRESSION_CI_PROMPTS,
  type E2ERegressionPromptEntry,
} from './e2e-regression-prompts.js';
export { runEndToEndBuildReality } from './e2e-build-reality-authority.js';
export {
  runPreviewAuthorityAudit,
  PREVIEW_AUTHORITY_MISMATCH,
  type PreviewAuthorityAuditReport,
  type PreviewAuthorityFinding,
} from './preview-authority-audit.js';
export {
  computeAppTsxChecksum,
  stampPreviewWorkspaceIdentity,
  fetchPreviewIdentityFromUrl,
} from './preview-workspace-identity.js';
export {
  resolvePreviewServingWorkspaceDir,
  resolveBuilderWorkspaceDir,
  previewWorkspacePathsAligned,
} from './preview-workspace-resolver.js';
