/**
 * BUILD_REALITY_AUTOFIX_ENGINE_V1 — types.
 * General, contract-driven autonomous repair. No application-specific logic.
 */

import type { E2EBuildRealityReport } from '../end-to-end-build-reality-engine-v1/e2e-build-reality-types.js';

export const BUILD_REALITY_AUTOFIX_ENGINE_V1_PASS =
  'BUILD_REALITY_AUTOFIX_ENGINE_V1_PASS' as const;

export const BUILD_REALITY_AUTOFIX_MAX_ATTEMPTS = 3 as const;

export const BUILD_REALITY_AUTOFIX_PLAYWRIGHT_INSTALL_COMMAND =
  'npx playwright install chromium' as const;

export type BuildRealityAutofixFailureClass =
  | 'TYPESCRIPT_COMPILE_FAILURE'
  | 'IMPORT_EXPORT_MISMATCH'
  | 'MISSING_FILE_OR_MODULE'
  | 'ROUTE_OR_ROOT_MOUNT_MISMATCH'
  | 'CONTRACT_PRIMARY_FEATURE_NOT_RENDERED'
  | 'DOM_INTERACTION_FAILURE'
  | 'PLAYWRIGHT_OR_BROWSER_ENVIRONMENT_FAILURE'
  | 'PREVIEW_SERVER_FAILURE'
  | 'MATERIALIZATION_FAILURE'
  | 'VALIDATOR_HARNESS_FAILURE'
  | 'UNKNOWN_FAILURE';

export type BuildRealityAutofixVerdict =
  | 'AUTOFIX_NOT_NEEDED'
  | 'AUTOFIX_REPAIRED'
  | 'AUTOFIX_BLOCKED'
  | 'AUTOFIX_EXHAUSTED'
  | 'AUTOFIX_UNSAFE';

export type BuildRealityAutofixValidationKind =
  | 'custom'
  | 'typescript-build'
  | 'end-to-end-build-reality';

export interface BuildRealityAutofixEvidence {
  readOnly: true;
  workspaceDir: string | null;
  rawPrompt: string | null;
  typescriptOutput: string | null;
  domFailureDetail: string | null;
  previewAuthorityDetail: string | null;
  materializationDetail: string | null;
  playwrightDetail: string | null;
  validatorHarnessDetail: string | null;
  validationDetail: string | null;
  e2eReport: E2EBuildRealityReport | null;
  failedChecks: Array<{ id: string; stageId: string; detail: string }>;
  failingStage: string | null;
  falseSuccessCodes: string[];
}

export interface BuildRealityAutofixFailureFinding {
  readOnly: true;
  failureClass: BuildRealityAutofixFailureClass;
  detail: string;
  source: string;
  critical: boolean;
}

export interface BuildRealityAutofixRepairAction {
  readOnly: true;
  actionId: string;
  failureClass: BuildRealityAutofixFailureClass;
  description: string;
  targetFiles: string[];
  safe: boolean;
}

export interface BuildRealityAutofixRepairPlan {
  readOnly: true;
  primaryFailureClass: BuildRealityAutofixFailureClass;
  primaryRootCause: string;
  actions: BuildRealityAutofixRepairAction[];
  blockedReason: string | null;
  blockedCommand: string | null;
}

export interface BuildRealityAutofixPatchRecord {
  readOnly: true;
  attempt: number;
  failureClass: BuildRealityAutofixFailureClass;
  filesTouched: string[];
  beforeEvidence: string;
  afterEvidence: string;
  applied: boolean;
  detail: string;
}

export interface BuildRealityAutofixValidationResult {
  readOnly: true;
  passed: boolean;
  detail: string;
  evidence: BuildRealityAutofixEvidence;
}

export interface BuildRealityAutofixAttemptRecord {
  readOnly: true;
  attempt: number;
  failureClasses: BuildRealityAutofixFailureClass[];
  plan: BuildRealityAutofixRepairPlan;
  patch: BuildRealityAutofixPatchRecord | null;
  validationAfterPatch: BuildRealityAutofixValidationResult | null;
  validationPassed: boolean;
}

export interface BuildRealityAutofixReport {
  readOnly: true;
  initialValidationPassed: boolean;
  initialValidationDetail: string;
  failureFindings: BuildRealityAutofixFailureFinding[];
  primaryFailureClass: BuildRealityAutofixFailureClass | null;
  primaryRootCause: string | null;
  attempts: BuildRealityAutofixAttemptRecord[];
  filesTouched: string[];
  validationCommand: string;
  finalValidationPassed: boolean;
  finalValidationDetail: string;
  verdict: BuildRealityAutofixVerdict;
  blockedCommand: string | null;
  passToken: typeof BUILD_REALITY_AUTOFIX_ENGINE_V1_PASS | null;
  durationMs: number;
  generatedAt: string;
}

export interface BuildRealityAutofixInput {
  workspaceDir?: string | null;
  rawPrompt?: string | null;
  validationKind?: BuildRealityAutofixValidationKind;
  validationCommand?: string;
  maxAttempts?: number;
  e2eReport?: E2EBuildRealityReport | null;
  typescriptOutput?: string | null;
  domFailureDetail?: string | null;
  previewAuthorityDetail?: string | null;
  materializationDetail?: string | null;
  playwrightDetail?: string | null;
  validatorHarnessDetail?: string | null;
  /** Initial validation runner — must return structured evidence on failure. */
  runValidation: () => Promise<BuildRealityAutofixValidationResult>;
}

export interface BuildRealityAutofixResult {
  readOnly: true;
  report: BuildRealityAutofixReport;
  repaired: boolean;
  finalValidationPassed: boolean;
}
