/**
 * AiDevEngine Universal App Blueprint v1.0 — types.
 */

export const UNIVERSAL_APP_BLUEPRINT_VERSION = '1.0' as const;

export interface UniversalBlueprintBuildInput {
  contractId: string;
  ideaId: string;
  buildUnits: string[];
  appName: string;
  tagline: string;
  coreFeatureLabel?: string;
  coreFeatureImportPath?: string;
  coreFeatureComponentName?: string;
  /**
   * Blueprint Generator Contract-Bound Replacement V1 — landing/home copy derived from the
   * approved build plan (customDomainCopy or approved module plan), never a hardcoded literal.
   * Optional and additive: when omitted, the generator derives a minimal appName-only summary
   * itself rather than falling back to any fixed per-product phrase.
   */
  landingSummary?: string;
  homeSummary?: string;
  /** Which real source produced landingSummary/homeSummary/coreFeatureLabel — recorded into blueprint-manifest.json for the Phase 6 provenance audit. */
  contractDerivationSource?: 'CUSTOM_DOMAIN_COPY' | 'APPROVED_MODULE_PLAN' | 'APP_NAME_ONLY';
  /**
   * Contract-Bound Navigation Shell Fix V1 — the real CBGA-approved navigation plan's labels
   * (`CbgaGenerationReport.navigationPlan.map(item => item.label)`) for this build. Optional and
   * additive: when omitted, the product surface generator emits zero CBGA default-shell
   * navigation labels (Activity/Alerts/Profile/Settings/Help/Feedback/Legal) — the safe default.
   */
  approvedNavigationLabels?: readonly string[];
  /**
   * Module Computation Collapse V1 — the real CBGA-approved module plan's moduleIds
   * (`ApprovedModulePlan.moduleIds`) for this build. Optional and additive: recorded into
   * blueprint-manifest.json for provenance/audit; never used to invent a module the plan did not
   * already approve.
   */
  approvedModuleIds?: readonly string[];
  /**
   * Metadata Computation Collapse V1 — the real CBGA-composed metadata plan's canonical manifest
   * summary string (`ApprovedMetadataPlan.manifestSummary`) for this build. Optional and additive:
   * recorded into blueprint-manifest.json for provenance/audit; never used to invent metadata the
   * plan did not already compose.
   */
  approvedMetadataSummary?: string | null;
  /**
   * Sample Data Computation Collapse V1 — the real CBGA-composed sample data plan for this build.
   * Optional and additive: recorded into blueprint-manifest.json for provenance/audit; dashboard/
   * preview seeds are projected from this plan when supplied.
   */
  approvedSampleDataPlan?: import('../contract-bound-generation-authority-v4/approved-sample-data-plan.js').ApprovedSampleDataPlan | null;
  /**
   * Provenance Computation Collapse V1 — the real CBGA-composed provenance plan for this build.
   */
  approvedProvenancePlan?: import('../contract-bound-generation-authority-v4/approved-provenance-plan.js').ApprovedProvenancePlan | null;
}

export interface UniversalBlueprintInspectionResult {
  readOnly: true;
  passed: boolean;
  version: typeof UNIVERSAL_APP_BLUEPRINT_VERSION;
  missingArtifacts: string[];
  missingPatterns: string[];
  checkedArtifacts: number;
}

export interface UniversalBlueprintWorkspaceFile {
  relativePath: string;
  content: string;
}
