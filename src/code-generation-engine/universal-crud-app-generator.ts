/**
 * Universal CRUD app generator — delegates to Universal Prompt-to-App Materialization V1.
 */

import type { GeneratedWorkspaceFile, GeneratedAppProfile } from './code-generation-engine-types.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import type { ResolvedPromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';
import type { ApprovedProductIdentity } from '../contract-bound-generation-authority-v4/approved-product-identity.js';
import type { ApprovedNavigationPlan } from '../contract-bound-generation-authority-v4/approved-navigation-plan.js';
import type { ApprovedModulePlan } from '../contract-bound-generation-authority-v4/approved-module-plan.js';
import type { ApprovedMetadataPlan } from '../contract-bound-generation-authority-v4/approved-metadata-plan.js';
import type { ApprovedSampleDataPlan } from '../contract-bound-generation-authority-v4/approved-sample-data-plan.js';
import type { ApprovedProvenancePlan } from '../contract-bound-generation-authority-v4/approved-provenance-plan.js';
import type { ApprovedRepairRealityPlan } from '../contract-bound-generation-authority-v4/approved-repair-reality-plan.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';

export function buildUniversalCrudWorkspaceFiles(input: {
  contractId: string;
  ideaId: string;
  buildUnits: string[];
  rawPrompt: string;
  profile?: GeneratedAppProfile;
  buildRunId?: string;
  faithfulBuildPlan?: ResolvedPromptFaithfulBuildPlan;
  /** Contract-Bound Navigation Shell Fix V1 — see universal-app-materialization-engine.ts. */
  approvedNavigationLabels?: readonly string[];
  /** Identity Computation Collapse V1 — see universal-app-materialization-engine.ts. */
  approvedIdentity?: ApprovedProductIdentity | null;
  /** Navigation Computation Collapse V1 — see universal-app-materialization-engine.ts. */
  approvedNavigationPlan?: ApprovedNavigationPlan | null;
  /** Module Computation Collapse V1 — see universal-app-materialization-engine.ts. */
  approvedModulePlan?: ApprovedModulePlan | null;
  /** Metadata Computation Collapse V1 — see universal-app-materialization-engine.ts. */
  approvedMetadataPlan?: ApprovedMetadataPlan | null;
  approvedSampleDataPlan?: ApprovedSampleDataPlan | null;
  approvedProvenancePlan?: ApprovedProvenancePlan | null;
  approvedRepairRealityPlan?: ApprovedRepairRealityPlan | null;
  /** Final Immutable Production Pipeline V1 — see universal-app-materialization-engine.ts. */
  approvedProductionBuildEnvelope?: ApprovedProductionBuildEnvelope | null;
}): GeneratedWorkspaceFile[] {
  return buildUniversalMaterializedWorkspaceFiles({
    contractId: input.contractId,
    ideaId: input.ideaId,
    buildUnits: input.buildUnits,
    rawPrompt: input.rawPrompt,
    profile: input.profile,
    buildRunId: input.buildRunId,
    faithfulBuildPlan: input.faithfulBuildPlan,
    approvedNavigationLabels: input.approvedNavigationLabels,
    approvedIdentity: input.approvedIdentity,
    approvedNavigationPlan: input.approvedNavigationPlan,
    approvedModulePlan: input.approvedModulePlan,
    approvedMetadataPlan: input.approvedMetadataPlan,
    approvedSampleDataPlan: input.approvedSampleDataPlan,
    approvedProvenancePlan: input.approvedProvenancePlan,
    approvedRepairRealityPlan: input.approvedRepairRealityPlan,
    approvedProductionBuildEnvelope: input.approvedProductionBuildEnvelope,
  });
}
