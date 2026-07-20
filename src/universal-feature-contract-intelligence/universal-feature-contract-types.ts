/**
 * Universal Feature Contract Intelligence V1 — types.
 */

export type UniversalFeatureRealityVerdict =
  | 'FEATURE_REALITY_EXCELLENT'
  | 'FEATURE_REALITY_GOOD'
  | 'FEATURE_REALITY_ACCEPTABLE'
  | 'FEATURE_REALITY_NEEDS_IMPROVEMENT'
  | 'FEATURE_REALITY_FAIL';

export type UniversalAppProfile =
  | 'TASK_TRACKER_WEB_V1'
  | 'CRM_WEB_V1'
  | 'INVENTORY_WEB_V1'
  | 'SCHOOL_MANAGEMENT_WEB_V1'
  | 'PROJECT_MANAGEMENT_WEB_V1'
  | 'EXPENSE_TRACKER_WEB_V1'
  | 'FINANCE_TRACKER_WEB_V1'
  | 'QR_APP'
  | 'BOOKING_WEB_V1'
  | 'HABIT_TRACKER_WEB_V1'
  | 'ASSISTIVE_COMMUNICATION_APP_V1'
  | 'GENERIC_CUSTOM_APP_V1';

export interface UniversalFeatureEntity {
  id: string;
  label: string;
  pluralLabel: string;
  navLabel: string;
  slug: string;
  storageKey: string;
  primary: boolean;
}

export type UniversalFeatureActionVerb =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'search'
  | 'assign'
  | 'approve'
  | 'complete';

export interface UniversalFeatureAction {
  id: string;
  entityId: string;
  verb: UniversalFeatureActionVerb;
  label: string;
  required: boolean;
}

export interface UniversalFeatureRule {
  id: string;
  entityId: string | null;
  label: string;
  required: boolean;
}

export interface UniversalFeatureWorkflow {
  id: string;
  entityId: string | null;
  label: string;
  stages: string[];
  required: boolean;
}

export interface UniversalFeatureOutcome {
  id: string;
  entityId: string | null;
  label: string;
  required: boolean;
}

export type FeatureContractCapabilityClassification =
  | 'ENTITY'
  | 'WORKFLOW'
  | 'CAPABILITY';

export interface FeatureContractCompletenessItem {
  capability: string;
  classification: FeatureContractCapabilityClassification;
  outcome: 'RETAINED' | 'MERGED' | 'DISCARDED';
  matchedFeature: string | null;
  reason: string;
}

export interface FeatureContractCompletenessReport {
  contractVersion: 'FEATURE_CONTRACT_COMPLETENESS_V1';
  score: number;
  requestedCount: number;
  retainedCount: number;
  discardedCount: number;
  mergedCount: number;
  hallucinatedCount: number;
  genericSubstitutionCount: number;
  capabilities: FeatureContractCompletenessItem[];
  hallucinatedCapabilities: string[];
  genericSubstitutions: string[];
}

export interface UniversalFeatureContract {
  contractVersion: '1.0';
  contractId: string;
  productProfile: UniversalAppProfile;
  productName: string;
  generatedAt: string;
  sourcePrompt: string;
  entities: UniversalFeatureEntity[];
  actions: UniversalFeatureAction[];
  rules: UniversalFeatureRule[];
  workflows: UniversalFeatureWorkflow[];
  outcomes: UniversalFeatureOutcome[];
  completeness?: FeatureContractCompletenessReport;
  /**
   * Navigation Computation Collapse V1 (PPC-1207 No Parallel Truth) — the approved, CBGA-repaired
   * navigation plan's labels (`ApprovedNavigationPlan.productEntries`), in their approved order.
   * Absent/`null` only for pre-CBGA/isolated/test-only contracts built without an approved
   * navigation plan — never independently derived from `entities[].navLabel` or any other
   * in-contract source. Optional (rather than required) so every existing per-profile contract
   * literal in `buildProfileContract` needs no change — this field is populated at the single
   * override point `buildUniversalFeatureContract` already uses for `approvedProductName`.
   */
  navigation?: readonly string[] | null;
  /**
   * Module Computation Collapse V1 (PPC-1207 No Parallel Truth) — the approved, CBGA-repaired
   * module plan's moduleIds (`ApprovedModulePlan.moduleIds`), in their approved order.
   * Absent/`null` only for pre-CBGA/isolated/test-only contracts built without an approved module
   * plan — never independently derived from `entities[].id` or any other in-contract source.
   * Optional (rather than required) so every existing per-profile contract literal in
   * `buildProfileContract` needs no change — this field is populated at the single override point
   * `buildUniversalFeatureContract` already uses for `approvedProductName`/`navigation`.
   */
  modules?: readonly string[] | null;
  /**
   * Metadata Computation Collapse V1 (PPC-1207 No Parallel Truth) — the approved, CBGA-composed
   * metadata projection (`ApprovedMetadataPlan` fields: title, subtitle, module/navigation/route
   * counts). Absent/`null` only for pre-CBGA/isolated/test-only contracts built without an
   * approved metadata plan — never independently derived from prompt parsing, counting, or
   * summarization. Optional so every existing per-profile contract literal in `buildProfileContract`
   * needs no change — populated at the single override point `buildUniversalFeatureContract` already
   * uses for identity/navigation/modules.
   */
  metadata?: {
    readonly applicationTitle: string;
    readonly applicationSubtitle: string;
    readonly approvedModuleCount: number;
    readonly approvedNavigationCount: number;
    readonly approvedRouteCount: number;
  } | null;
  /**
   * Sample Data Computation Collapse V1 (PPC-1207 No Parallel Truth) — the approved, CBGA-composed
   * sample data projection. Absent/`null` only for pre-CBGA/isolated/test-only contracts — never
   * independently derived from generator-invented demo records.
   */
  sampleData?: {
    readonly approvedSamplesPresent: boolean;
    readonly sampleSummary: string;
    readonly approvedEntityTypeCount: number;
  } | null;
  /**
   * Provenance Computation Collapse V1 (PPC-1207 No Parallel Truth) — the approved, CBGA-composed
   * provenance projection. Absent/`null` only for pre-CBGA/isolated/test-only contracts — never
   * independently reconstructed from heuristics or duplicate ancestry computation.
   */
  provenance?: {
    readonly provenanceSummary: string;
    readonly contractId: string;
    readonly ancestryChainCount: number;
    readonly provenAncestryChainCount: number;
  } | null;
  /**
   * Repair Reality Alignment V1 (PPC-1207 No Parallel Truth) — the approved, classified repair
   * projection. Absent/`null` only for pre-CBGA/isolated/test-only contracts.
   */
  repairReality?: {
    readonly repairSummary: string;
    readonly repairEntryCount: number;
    readonly workspaceMutationCount: number;
  } | null;
}

export interface BuildUniversalFeatureContractInput {
  contractId: string;
  rawPrompt: string;
  profile?: UniversalAppProfile;
  requirements?: readonly string[];
  clarifyingAnswers?: readonly string[];
  /**
   * Identity Computation Collapse V1 (PPC-1207 No Parallel Truth) — the single approved,
   * CBGA-repaired product identity for this build. When present, it replaces `productName` on the
   * returned contract; `rawPrompt`/profile-derived `productName` (via `extractPromptAppTitle`)
   * only runs when this is omitted — pre-CBGA/isolated/test-only callers only.
   */
  approvedProductName?: string | null;
  /**
   * Navigation Computation Collapse V1 (PPC-1207 No Parallel Truth) — the single approved,
   * CBGA-repaired navigation plan's labels for this build. When present, it replaces `navigation`
   * on the returned contract unconditionally; omitted (pre-CBGA/isolated/test-only calls) leaves
   * `navigation` unset.
   */
  approvedNavigationLabels?: readonly string[] | null;
  /**
   * Module Computation Collapse V1 (PPC-1207 No Parallel Truth) — the single approved,
   * CBGA-repaired module plan's moduleIds for this build. When present, it replaces `modules` on
   * the returned contract unconditionally; omitted (pre-CBGA/isolated/test-only calls) leaves
   * `modules` unset.
   */
  approvedModuleIds?: readonly string[] | null;
  /** Canonical CBGA contract evidence used to score prompt-to-feature retention. */
  approvedCanonicalContract?: {
    readonly coreEntities: readonly string[];
    readonly primaryWorkflows: readonly string[];
    readonly majorFeatureGroups: readonly string[];
  } | null;
  /** Approved module identities used as the semantic entity authority for generic custom apps. */
  approvedModuleEntries?: readonly {
    readonly moduleId: string;
    readonly displayName: string;
    readonly contractSource: string;
  }[] | null;
  /**
   * Metadata Computation Collapse V1 (PPC-1207 No Parallel Truth) — the single approved,
   * CBGA-composed metadata projection for this build. When present, it replaces `metadata` on the
   * returned contract unconditionally; omitted (pre-CBGA/isolated/test-only calls) leaves `metadata`
   * unset.
   */
  approvedMetadata?: {
    readonly applicationTitle: string;
    readonly applicationSubtitle: string;
    readonly approvedModuleCount: number;
    readonly approvedNavigationCount: number;
    readonly approvedRouteCount: number;
  } | null;
  /**
   * Sample Data Computation Collapse V1 (PPC-1207 No Parallel Truth) — the single approved,
   * CBGA-composed sample data projection for this build. When present, it replaces `sampleData` on
   * the returned contract unconditionally; omitted (pre-CBGA/isolated/test-only calls) leaves
   * `sampleData` unset.
   */
  approvedSampleData?: {
    readonly approvedSamplesPresent: boolean;
    readonly sampleSummary: string;
    readonly approvedEntityTypeCount: number;
  } | null;
  /**
   * Provenance Computation Collapse V1 (PPC-1207 No Parallel Truth) — the single approved,
   * CBGA-composed provenance projection for this build. When present, it replaces `provenance` on
   * the returned contract unconditionally; omitted (pre-CBGA/isolated/test-only calls) leaves
   * `provenance` unset.
   */
  approvedProvenance?: {
    readonly provenanceSummary: string;
    readonly contractId: string;
    readonly ancestryChainCount: number;
    readonly provenAncestryChainCount: number;
  } | null;
  /**
   * Repair Reality Alignment V1 (PPC-1207 No Parallel Truth) — the single approved repair reality
   * projection for this build. When present, it replaces `repairReality` unconditionally.
   */
  approvedRepairReality?: {
    readonly repairSummary: string;
    readonly repairEntryCount: number;
    readonly workspaceMutationCount: number;
  } | null;
}

export type FeatureValidationStepKind =
  | 'discover'
  | 'create'
  | 'edit'
  | 'delete'
  | 'search'
  | 'complete'
  | 'persistence-route'
  | 'persistence-reload'
  | 'recovery'
  | 'ux-feedback'
  | 'ux-actionable';

export interface FeatureRealityValidationStep {
  id: string;
  kind: FeatureValidationStepKind;
  entityId: string;
  actionId: string | null;
  label: string;
  critical: boolean;
  selectors: Record<string, string>;
  sampleText: string;
  editedText?: string;
}

export interface FeatureRealityValidationPlan {
  planVersion: '1.0';
  contractId: string;
  productProfile: UniversalAppProfile;
  primaryEntityId: string;
  navLabel: string;
  featureRootSelector: string;
  storageKey: string;
  steps: FeatureRealityValidationStep[];
}

export interface UniversalFeatureRealityCheck {
  id: string;
  category: string;
  entityId: string | null;
  actionId: string | null;
  label: string;
  passed: boolean;
  detail: string;
  critical: boolean;
}

export interface UniversalFeatureRealityScores {
  contractCompletenessScore: number;
  featureCoverageScore: number;
  executionScore: number;
  workflowScore: number;
  persistenceScore: number;
  overallFeatureRealityScore: number;
}

export interface UniversalFeatureContractAssessment {
  readOnly: true;
  passed: boolean;
  verdict: UniversalFeatureRealityVerdict;
  passToken: string;
  scores: UniversalFeatureRealityScores;
  contract: UniversalFeatureContract;
  plan: FeatureRealityValidationPlan;
  checks: UniversalFeatureRealityCheck[];
  failedChecks: UniversalFeatureRealityCheck[];
  blocksLaunchReadiness: boolean;
  blocksLaunchReadinessReason: string | null;
  previewUrl: string;
  contractId: string;
  generatedAt: string;
  reportMarkdown: string;
}

export interface UniversalFeatureContractSuiteResult {
  readOnly: true;
  passed: boolean;
  passToken: string;
  appResults: Array<{
    productProfile: UniversalAppProfile;
    productName: string;
    passed: boolean;
    overallScore: number;
    verdict: UniversalFeatureRealityVerdict;
  }>;
  generatedAt: string;
}

export interface RunUniversalFeatureValidationInput {
  previewUrl: string;
  contract: UniversalFeatureContract;
}
