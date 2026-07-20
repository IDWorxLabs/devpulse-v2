/**
 * Code Generation Engine V1 — types.
 */

import type { BuildReadyExecutionContract } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';
import type { ResolvedPromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';

export type GeneratedAppProfile =
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

export interface TaskTrackerRequirements {
  readOnly: true;
  profile: GeneratedAppProfile;
  addTask: boolean;
  completeTask: boolean;
  deleteTask: boolean;
  filterAllActiveCompleted: boolean;
  activeTaskCount: boolean;
  cleanModernUi: boolean;
  browserRuntime: boolean;
}

export interface GeneratedWorkspaceFile {
  relativePath: string;
  content: string;
}

export interface CodeGenerationEngineResult {
  readOnly: true;
  generated: boolean;
  profile: GeneratedAppProfile | null;
  workspaceId: string;
  generatedFiles: string[];
  skippedReason: string | null;
}

export interface MaterializeGeneratedAppInput {
  projectRootDir: string;
  workspaceId: string;
  contract: BuildReadyExecutionContract;
  rawPrompt: string;
  profileOverride?: GeneratedAppProfile | null;
  faithfulBuildPlan?: ResolvedPromptFaithfulBuildPlan;
  /** Contract-Bound Navigation Shell Fix V1 — see universal-app-materialization-engine.ts. */
  approvedNavigationLabels?: readonly string[];
  /**
   * Identity Computation Collapse V1 — the single approved, CBGA-repaired product identity for
   * this build. When present, every generator downstream of this call consumes it directly instead
   * of independently deriving identity from `rawPrompt`/`faithfulBuildPlan`. Optional so pre-CBGA
   * or isolated/test-only callers keep their existing draft-derivation behavior.
   */
  approvedIdentity?: import('../contract-bound-generation-authority-v4/approved-product-identity.js').ApprovedProductIdentity | null;
  /**
   * Navigation Computation Collapse V1 — the single approved, CBGA-repaired navigation plan for
   * this build (PPC-1207 No Parallel Truth). When present, downstream generators consume it
   * directly instead of independently deriving/inferring/merging navigation of their own. Optional
   * so pre-CBGA/isolated/test-only callers keep their existing draft-derivation behavior.
   */
  approvedNavigationPlan?: import('../contract-bound-generation-authority-v4/approved-navigation-plan.js').ApprovedNavigationPlan | null;
  /**
   * Module Computation Collapse V1 — the single approved, CBGA-repaired module plan for this
   * build (PPC-1207 No Parallel Truth). When present, downstream generators consume it directly
   * instead of independently deriving/inferring/merging a module list of their own. Optional so
   * pre-CBGA/isolated/test-only callers keep their existing draft-derivation behavior.
   */
  approvedModulePlan?: import('../contract-bound-generation-authority-v4/approved-module-plan.js').ApprovedModulePlan | null;
  /**
   * Metadata Computation Collapse V1 (PPC-1207 No Parallel Truth) — the CBGA-composed metadata
   * plan (title, subtitle, description, module/navigation/route counts, summary strings) this
   * build's workspace files/manifests must consume instead of independently parsing/inferring/
   * counting/summarizing metadata of their own. Optional and `null`-safe so pre-CBGA/isolated/
   * test-only callers keep their existing draft-derivation behavior.
   */
  approvedMetadataPlan?: import('../contract-bound-generation-authority-v4/approved-metadata-plan.js').ApprovedMetadataPlan | null;
  /**
   * Sample Data Computation Collapse V1 (PPC-1207 No Parallel Truth) — the CBGA-composed sample
   * data plan (collections, cards, statistics, seed definitions, empty states) this build's
   * workspace files/manifests must consume instead of independently inventing sample/demo/preview
   * data of their own. Optional so pre-CBGA/isolated/test-only callers keep existing behavior.
   */
  approvedSampleDataPlan?: import('../contract-bound-generation-authority-v4/approved-sample-data-plan.js').ApprovedSampleDataPlan | null;
  /**
   * Provenance Computation Collapse V1 (PPC-1207 No Parallel Truth) — the CBGA-composed provenance
   * plan (ancestry chains, artifact entries, vocabularies) this build's workspace files/manifests
   * must consume instead of independently reconstructing provenance of their own.
   */
  approvedProvenancePlan?: import('../contract-bound-generation-authority-v4/approved-provenance-plan.js').ApprovedProvenancePlan | null;
  /**
   * Repair Reality Alignment V1 (PPC-1207 No Parallel Truth) — the CBGA-composed repair reality
   * plan this build's manifests/reports must consume instead of inferring repair classification.
   */
  approvedRepairRealityPlan?: import('../contract-bound-generation-authority-v4/approved-repair-reality-plan.js').ApprovedRepairRealityPlan | null;
  /**
   * Final Immutable Production Pipeline V1 (PPC-1207 No Parallel Truth) — the single immutable
   * constitutional envelope for this build. Production callers must supply this instead of
   * individual handoffs. Optional only for pre-CBGA/isolated/test-only callers.
   */
  approvedProductionBuildEnvelope?: import('../contract-bound-generation-authority-v4/approved-production-build-envelope.js').ApprovedProductionBuildEnvelope | null;
}
