/**
 * Contract-to-Module Traceability Authority V1 — production pipeline integration.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { CanonicalProductContract } from '../product-faithfulness-v2/generation-faithfulness-types.js';
import {
  runContractToModuleTraceabilityEvaluation,
  runPreMaterializationTraceabilityGate,
  filterModulesByApprovedPlan,
  loadTraceabilityInputFromWorkspace,
} from './contract-to-module-traceability-authority.js';
import { buildContractToModuleTraceabilityWorkspaceArtifacts } from './contract-to-module-workspace-artifacts.js';
import type { ContractToModuleTraceabilityReport, CanonicalBuildOutcome } from './contract-to-module-traceability-types.js';
import { projectBuildStatusFromTraceabilityOutcome } from './contract-to-module-status-projection.js';

export interface TraceabilityPipelineResult {
  readonly filteredModuleIds: string[];
  readonly report: ContractToModuleTraceabilityReport | null;
  readonly workspaceFiles: GeneratedWorkspaceFile[];
  readonly buildOutcome: CanonicalBuildOutcome;
  readonly preGateBlocked: boolean;
}

export function runPreMaterializationTraceability(input: {
  envelope: ApprovedProductionBuildEnvelope;
  candidateModuleIds: readonly string[];
}): { filteredModuleIds: string[]; blocked: boolean; errors: string[] } {
  const filteredModuleIds = filterModulesByApprovedPlan(input.candidateModuleIds, input.envelope);
  const gate = runPreMaterializationTraceabilityGate({
    envelope: input.envelope,
    proposedModuleIds: filteredModuleIds,
  });
  return { filteredModuleIds, blocked: !gate.allowed, errors: gate.errors };
}

export function augmentWorkspaceWithContractToModuleTraceability(
  workspaceFiles: GeneratedWorkspaceFile[],
  input: {
    contract: CanonicalProductContract;
    envelope: ApprovedProductionBuildEnvelope;
    proposedModuleIds: readonly string[];
  },
): TraceabilityPipelineResult {
  const traceInput = loadTraceabilityInputFromWorkspace({
    contract: input.contract,
    envelope: input.envelope,
    workspaceFiles,
    proposedModuleIds: input.proposedModuleIds,
  });
  const report = runContractToModuleTraceabilityEvaluation({
    contract: traceInput.contract,
    envelope: traceInput.envelope,
    workspaceFiles,
    proposedModuleIds: traceInput.proposedModuleIds,
    universalFeatureNames: traceInput.universalFeatureNames,
  });
  const artifacts = buildContractToModuleTraceabilityWorkspaceArtifacts(report);
  const status = projectBuildStatusFromTraceabilityOutcome(report.buildOutcome);
  return {
    filteredModuleIds: [...input.proposedModuleIds],
    report,
    workspaceFiles: [...workspaceFiles, ...artifacts],
    buildOutcome: report.buildOutcome,
    preGateBlocked: !status.previewAvailable && report.complianceOutcome !== 'TRACEABILITY_COMPLIANT',
  };
}
