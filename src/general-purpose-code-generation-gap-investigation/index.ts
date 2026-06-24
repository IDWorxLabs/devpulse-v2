/**
 * General-Purpose Code Generation Gap Investigation — public API.
 */

export {
  GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_PASS_TOKEN,
  GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_FAIL_TOKEN,
  GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_REPORT_TITLE,
  GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_ARTIFACT_DIR,
  CATEGORY_VISION_TARGET,
  RBEP_PROVEN_CATEGORIES,
  GP_V1_PROOF_DOMAINS,
} from './general-purpose-code-generation-gap-investigation-bounds.js';

export type {
  GeneralPurposeCodeGenerationGapInvestigationAssessment,
  GapVerdict,
  EvidenceAnalysisEntry,
  RemainingCodegenGap,
} from './general-purpose-code-generation-gap-investigation-types.js';

export { runGeneralPurposeCodeGenerationGapInvestigation } from './general-purpose-code-generation-gap-investigation-assessor.js';
export { writeGeneralPurposeCodeGenerationGapInvestigationArtifacts } from './gap-investigation-artifact-writer.js';
export { buildGeneralPurposeCodeGenerationGapInvestigationReportMarkdown } from './gap-investigation-report-builder.js';
export { isGeneralPurposeV1Proven } from './gap-evidence-analyzer.js';
