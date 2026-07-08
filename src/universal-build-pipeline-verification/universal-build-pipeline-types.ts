/**
 * Universal Build Pipeline Verification V1 — types.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';

export type PipelineStageId =
  | 'PROMPT_INTAKE'
  | 'INTENT_UNDERSTANDING'
  | 'PROFILE_RESOLUTION'
  | 'PROMPT_FAITHFULNESS'
  | 'MODULE_EXTRACTION'
  | 'PLAN_CONTRACT'
  | 'ASE_AUTHORIZATION'
  | 'WORKSPACE_GENERATION'
  | 'FEATURE_REALITY'
  | 'MATERIALIZATION_QUALITY'
  | 'PERSISTENT_PROMOTION'
  | 'NPM_INSTALL'
  | 'NPM_BUILD'
  | 'AUTOFIX_ELIGIBILITY'
  | 'PREVIEW_STARTUP'
  | 'DEVICE_VIEWPORT_PREVIEW'
  | 'FINAL_REPORT';

export type BlockerClass =
  | 'LEGITIMATE_BLOCKER'
  | 'OVERSTRICT_BLOCKER'
  | 'WRONG_STAGE_BLOCKER'
  | 'STALE_EVIDENCE_BLOCKER'
  | 'MISSING_FALLBACK_BLOCKER'
  | 'PROFILE_MISROUTE_BLOCKER'
  | 'AUTH_INJECTION_BUG'
  | 'PREVIEW_GATE_BUG'
  | 'REPORTING_ONLY_BUG';

export type BuildOutcome =
  | 'BUILD_COMPLETED_WITH_PREVIEW'
  | 'BUILD_COMPLETED_WITH_DEGRADED_PREVIEW'
  | 'BUILD_COMPLETED_WITH_BUILD_ERRORS'
  | 'BUILD_BLOCKED_BEFORE_MATERIALIZATION';

export type StageDecision = 'PASS' | 'WARN' | 'FAIL' | 'SKIP' | 'DEGRADED';

export interface PipelineStageTrace {
  readOnly: true;
  stage: PipelineStageId;
  stageName: string;
  authorityModule: string;
  decision: StageDecision;
  evidenceRequired: string;
  evidenceAvailable: string;
  blocksContinuation: boolean;
  blockerReason: string | null;
  blockerClass: BlockerClass | null;
  legitimateBlocker: boolean | null;
  downstreamStagesSkipped: readonly PipelineStageId[];
}

export interface ClassifiedBlocker {
  readOnly: true;
  stage: PipelineStageId;
  reason: string;
  blockerClass: BlockerClass;
  legitimate: boolean;
}

export interface UniversalBuildMatrixEntry {
  readOnly: true;
  categoryId: string;
  categoryLabel: string;
  prompt: string;
  expectedProfile: GeneratedAppProfile | 'ASSISTIVE_COMMUNICATION';
  requiredModuleHints: readonly string[];
  isLisaRegression: boolean;
}

export interface UniversalBuildCategoryResult {
  readOnly: true;
  categoryId: string;
  categoryLabel: string;
  prompt: string;
  selectedProfile: string | null;
  stageTraces: readonly PipelineStageTrace[];
  blockers: readonly ClassifiedBlocker[];
  buildOutcome: BuildOutcome;
  reachedNpmInstall: boolean;
  reachedNpmBuild: boolean;
  reachedPreview: boolean;
  reachedReport: boolean;
  promptFaithfulnessPassed: boolean;
  workspaceMaterialized: boolean;
  featureRealityStatus: string | null;
  livePreviewVerified: boolean;
  productionProofComplete: boolean;
}

export interface UniversalBuildPipelineAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: string;
  passToken: string;
  generatedAt: string;
  promptsTested: number;
  categoryResults: readonly UniversalBuildCategoryResult[];
  blockersByClass: Record<BlockerClass, readonly ClassifiedBlocker[]>;
  systemicBlockerPatterns: readonly string[];
  profileMisroutePatterns: readonly string[];
  overstrictGatePatterns: readonly string[];
  authInjectionBugs: readonly string[];
  previewGateBugs: readonly string[];
  recommendedFixes: readonly { priority: number; fix: string; rationale: string }[];
  lisaIncluded: boolean;
  genericCustomProfileAccepted: boolean;
  featureRealityFallbackIsWarning: boolean;
  expenseTrackerContaminationDetected: boolean;
}

export interface RunUniversalBuildPipelineInput {
  projectRootDir?: string;
  leafMode?: boolean;
  categories?: readonly string[];
}

export interface BuildContinuationPolicyInput {
  promptFaithfulnessPassed: boolean;
  workspaceExists: boolean;
  generatedModulesExist: boolean;
  blockers: readonly string[];
  hasGeneratedSourceFiles: boolean;
  featureRealityStatus?: string | null;
  generatedFileCount?: number;
  bannedFallbackScanPassed?: boolean;
  selectedProfile?: string | null;
  prompt?: string;
}

export interface BuildContinuationPolicyResult {
  readOnly: true;
  shouldContinueToBuild: boolean;
  shouldContinueToPreview: boolean;
  overriddenBlockers: readonly string[];
  continuationReason: string | null;
  safetyBlockers: readonly string[];
}
