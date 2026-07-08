/**
 * End-to-End Build Reality Engine V1 — types.
 * Validates engineering reality vs user-visible reality. No application-specific logic.
 */

export const END_TO_END_BUILD_REALITY_ENGINE_V1_PASS =
  'END_TO_END_BUILD_REALITY_ENGINE_V1_PASS' as const;

export type E2EBuildRealityVerdict = 'READY_FOR_FOUNDER_TESTING' | 'NOT_READY';

export type E2EBuildRealityStageId =
  | 'INTENT_UNDERSTANDING'
  | 'PRODUCT_INTELLIGENCE'
  | 'PLANNING'
  | 'ARCHITECTURE'
  | 'UNIVERSAL_FEATURE_CONTRACT'
  | 'MATERIALIZATION'
  | 'COMPILATION'
  | 'AUTO_REPAIR'
  | 'LIVE_PREVIEW'
  | 'RUNNING_APPLICATION'
  | 'WORKSPACE_REALITY_AUDIT'
  | 'FEATURE_REALITY'
  | 'RUNTIME_TRUTH'
  | 'PREVIEW_AUTHORITY'
  | 'DOM_REALITY'
  | 'INTERACTIVE_REALITY'
  | 'FALSE_SUCCESS_SCAN'
  | 'FOUNDER_TESTING_GATE'
  | 'FINAL_VERDICT';

export interface E2EStageResult {
  readOnly: true;
  stageId: E2EBuildRealityStageId;
  label: string;
  passed: boolean;
  detail: string;
  durationMs: number;
  evidencePaths: string[];
}

export interface E2EContractFeatureModule {
  readOnly: true;
  id: string;
  route: string;
  componentPath: string;
  navLabel: string | null;
}

export interface E2EContractExpectationBundle {
  readOnly: true;
  prompt: string;
  contractId: string;
  productName: string | null;
  productProfile: string | null;
  featureModules: E2EContractFeatureModule[];
  routes: string[];
  requiredUiTerms: string[];
  requiredActionVerbs: string[];
  outcomeLabels: string[];
  workflowLabels: string[];
  mountMode: 'direct-feature' | 'blueprint-shell' | 'unknown';
  primaryModuleId: string | null;
  interactionHints: string[];
  workspaceHash: string | null;
  buildReady: boolean;
}

export type E2EValidationStepKind =
  | 'feature-mounted'
  | 'route-registered'
  | 'ui-term-visible'
  | 'no-generic-shell'
  | 'crud-action'
  | 'button-sequence'
  | 'display-changed'
  | 'outcome-visible';

export interface E2EValidationStep {
  readOnly: true;
  id: string;
  kind: E2EValidationStepKind;
  label: string;
  critical: boolean;
  moduleId: string | null;
  uiTerm: string | null;
  buttonLabels: string[];
  expectedDisplayValue: string | null;
  actionVerb: string | null;
  selectors: Record<string, string>;
}

export interface E2EValidationCheck {
  readOnly: true;
  id: string;
  stageId: E2EBuildRealityStageId;
  label: string;
  passed: boolean;
  detail: string;
  critical: boolean;
}

export interface E2EBuildRealityEvidence {
  readOnly: true;
  collectedAt: string;
  prompt: string;
  projectId: string;
  workspacePath: string | null;
  previewUrl: string | null;
  screenshotPath: string | null;
  domSnapshotPath: string | null;
  mountedComponentTreePath: string | null;
  routeTablePath: string | null;
  featureRegistryPath: string | null;
  runtimeTruthPath: string | null;
  workspaceRealityAuditPath: string | null;
  featureRealityPath: string | null;
  workspaceHash: string | null;
  /** Fingerprint of rendered preview HTML — evidence only, not compared to workspaceHash. */
  previewHash: string | null;
  /** Workspace identity hash embedded in preview when available — used for stale detection. */
  previewWorkspaceHash: string | null;
  buildContractPath: string | null;
  universalFeatureContractPath: string | null;
  interactionReplayPath: string | null;
  previewAuthorityAuditPath: string | null;
  mountedFeatureModules: string[];
  genericShellDetected: boolean;
}

export interface E2EFalseSuccessFinding {
  readOnly: true;
  code: string;
  label: string;
  detail: string;
  critical: boolean;
}

export interface PreviewAuthorityAuditReportRef {
  readOnly: true;
  passed: boolean;
  failureCode: 'PREVIEW_AUTHORITY_MISMATCH' | null;
  generatedWorkspace: string | null;
  builtWorkspace: string | null;
  viteServingWorkspace: string | null;
  registeredPreviewUrl: string | null;
  iframePreviewUrl: string | null;
  playwrightPreviewUrl: string | null;
  playwrightSameAsLivePreview: boolean;
  sessionRegistryMatchesIframe: boolean;
  staleRegistrationDetected: boolean;
  appTsxChecksumMatch: boolean | null;
  initialVisibleDomMatchesContract: boolean;
}

export interface E2EBuildRealityReport {
  readOnly: true;
  prompt: string;
  projectId: string;
  verdict: E2EBuildRealityVerdict;
  failingStage: E2EBuildRealityStageId | null;
  stages: E2EStageResult[];
  checks: E2EValidationCheck[];
  falseSuccessFindings: E2EFalseSuccessFinding[];
  expectations: E2EContractExpectationBundle;
  evidence: E2EBuildRealityEvidence;
  previewAuthorityAudit: PreviewAuthorityAuditReportRef | null;
  durationMs: number;
  generatedAt: string;
  autofixReport?: import('../build-reality-autofix-engine-v1/build-reality-autofix-types.js').BuildRealityAutofixReport | null;
  passedImmediately?: boolean;
  passedAfterAutofix?: boolean;
}

export interface RunEndToEndBuildRealityInput {
  rawPrompt: string;
  projectRootDir: string;
  projectId?: string;
  projectName?: string;
  skipFullBuild?: boolean;
  workspaceDir?: string;
  previewUrl?: string | null;
  gateUnlockedPreviewUrl?: string | null;
  diagnosticPreviewUrl?: string | null;
  buildReady?: boolean;
  enableAutofix?: boolean;
}
