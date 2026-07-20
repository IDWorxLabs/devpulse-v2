/**
 * Universal Production Readiness Verification V1 — production pipeline integration.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { runProductionReadinessEvaluation } from './universal-production-readiness.js';
import type {
  ProductionReadinessMaterializationInput,
  ProductionReadinessReport,
} from './universal-production-readiness-types.js';
import {
  UNIVERSAL_PRODUCTION_READINESS_SOURCE,
  UNIVERSAL_PRODUCTION_READINESS_VERSION,
} from './universal-production-readiness-types.js';
import { buildProductionReconciliation } from './production-readiness-materialization-reconciler.js';
import { loadProductionReadinessInput } from './production-readiness-input-loader.js';
import { buildCompositionTraceabilityChains } from '../universal-capability-composition-engine/capability-composition-traceability.js';

export interface ProductionReadinessWorkspaceResult {
  readonly files: GeneratedWorkspaceFile[];
  readonly report: ProductionReadinessReport;
}

export function buildProductionReadinessMaterializationInputFromEnvelope(input: {
  envelope: ApprovedProductionBuildEnvelope;
  appTitle: string;
  moduleIds: readonly string[];
  contractId: string;
  compositionBacked: boolean;
  behavioralVerificationBacked: boolean;
  capabilityCoverageBacked: boolean;
}): ProductionReadinessMaterializationInput {
  return { ...input };
}

export function shouldMaterializeProductionReadiness(
  envelope?: ApprovedProductionBuildEnvelope | null,
  options?: { compositionBacked?: boolean; behavioralVerificationBacked?: boolean },
): boolean {
  if (!envelope) return false;
  return options?.compositionBacked === true && options?.behavioralVerificationBacked === true;
}

export function materializeProductionReadinessForWorkspace(
  workspaceFiles: readonly GeneratedWorkspaceFile[],
  envelope: ApprovedProductionBuildEnvelope,
  input: ProductionReadinessMaterializationInput,
): ProductionReadinessWorkspaceResult {
  const report = runProductionReadinessEvaluation({
    envelope,
    workspaceFiles,
    moduleIds: input.moduleIds,
    contractId: input.contractId,
  });

  const readinessInput = loadProductionReadinessInput({
    envelope,
    workspaceFiles,
    moduleIds: input.moduleIds,
    contractId: input.contractId,
  });
  const reconciliation = buildProductionReconciliation(readinessInput);
  const traceability = readinessInput.compositionPlan
    ? buildCompositionTraceabilityChains(readinessInput.compositionPlan)
    : [];

  const files: GeneratedWorkspaceFile[] = [
    {
      relativePath: 'src/universal-production-readiness/production-readiness-evaluation.json',
      content: `${JSON.stringify(report, null, 2)}\n`,
    },
    {
      relativePath: 'src/universal-production-readiness/production-readiness-report.json',
      content: `${JSON.stringify(report, null, 2)}\n`,
    },
    {
      relativePath: 'src/universal-production-readiness/production-readiness-reconciliation.json',
      content: `${JSON.stringify(reconciliation, null, 2)}\n`,
    },
    {
      relativePath: 'src/universal-production-readiness/production-readiness-traceability.json',
      content: `${JSON.stringify(traceability, null, 2)}\n`,
    },
    {
      relativePath: 'src/universal-production-readiness/production-readiness-marker.ts',
      content: `/** ${UNIVERSAL_PRODUCTION_READINESS_SOURCE} — verdict marker only, not readiness evidence */
export const UNIVERSAL_PRODUCTION_READINESS_MARKER = '${UNIVERSAL_PRODUCTION_READINESS_SOURCE}' as const;
export const UNIVERSAL_PRODUCTION_READINESS_VERSION = '${UNIVERSAL_PRODUCTION_READINESS_VERSION}';
export const PRODUCTION_READINESS_VERDICT = '${report.readinessVerdict}' as const;
export const PRODUCTION_RELEASE_DECISION = '${report.releaseDecision}' as const;
export const PRODUCTION_READINESS_FINGERPRINT = '${report.fingerprint}';
export const PRODUCTION_READINESS_SCORE = ${report.productionReadinessScore};
`,
    },
  ];

  return { files, report };
}

export function augmentWorkspaceFilesWithProductionReadiness(
  workspaceFiles: GeneratedWorkspaceFile[],
  envelope: ApprovedProductionBuildEnvelope,
  input: ProductionReadinessMaterializationInput,
): ProductionReadinessWorkspaceResult {
  const result = materializeProductionReadinessForWorkspace(workspaceFiles, envelope, input);
  return { files: [...workspaceFiles, ...result.files], report: result.report };
}

export function buildProductionReadinessSharedRuntimeFiles(): GeneratedWorkspaceFile[] {
  return [];
}
