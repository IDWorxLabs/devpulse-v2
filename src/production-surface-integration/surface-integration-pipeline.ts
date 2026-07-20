/** Pipeline integration — runs after BuildContext integrity augmentation. */
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { CanonicalProductContract } from '../product-faithfulness-v2/generation-faithfulness-types.js';
import { runContractToModuleTraceabilityEvaluation } from '../contract-to-module-traceability/contract-to-module-traceability-authority.js';
import { loadTraceabilityInputFromWorkspace } from '../contract-to-module-traceability/contract-to-module-traceability-authority.js';
import {
  evaluateProductionSurfaceIntegration,
  productionSurfaceIntegrationWorkspaceArtifacts,
} from './production-surface-integration.js';
import type { ProductionSurfaceIntegrationReport } from './production-surface-types.js';

export interface ProductionSurfacePipelineResult {
  readonly report: ProductionSurfaceIntegrationReport;
  readonly workspaceFiles: GeneratedWorkspaceFile[];
}

export function augmentWorkspaceWithProductionSurfaceIntegration(
  workspaceFiles: readonly GeneratedWorkspaceFile[],
  input: {
    readonly contract: CanonicalProductContract;
    readonly envelope: ApprovedProductionBuildEnvelope;
    readonly proposedModuleIds: readonly string[];
    readonly projectId?: string | null;
    readonly workspaceId?: string | null;
    readonly previousProductIdentities?: readonly string[];
    readonly gpcaBlocked?: boolean;
  },
): ProductionSurfacePipelineResult {
  const traceInput = loadTraceabilityInputFromWorkspace({
    contract: input.contract,
    envelope: input.envelope,
    workspaceFiles,
    proposedModuleIds: input.proposedModuleIds,
  });
  const traceabilityReport = runContractToModuleTraceabilityEvaluation({
    contract: traceInput.contract,
    envelope: traceInput.envelope,
    workspaceFiles,
    proposedModuleIds: traceInput.proposedModuleIds,
    universalFeatureNames: traceInput.universalFeatureNames,
  });
  const report = evaluateProductionSurfaceIntegration({
    envelope: input.envelope,
    workspaceFiles,
    traceabilityReport,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    previousProductIdentities: input.previousProductIdentities,
    gpcaBlocked: input.gpcaBlocked,
  });
  return {
    report,
    workspaceFiles: [...workspaceFiles, ...productionSurfaceIntegrationWorkspaceArtifacts(report)],
  };
}
