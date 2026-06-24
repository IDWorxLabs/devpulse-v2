/**
 * General-Purpose Code Generation V1 — AFLA integration.
 * Lowers confidence when a non-CRUD idea still looks CRUD-only.
 */

import { runAutonomousFounderLaunchAuthority } from '../autonomous-founder-launch-authority/autonomous-founder-launch-orchestrator.js';
import { buildBuildRealityEvidenceFromWorkspace } from '../autonomous-founder-launch-authority/founder-evidence-collector.js';
import type { GenerationStrategy } from './general-purpose-code-generation-v1-types.js';

export function assessGeneralPurposeAfla(input: {
  workspaceDir: string;
  productName: string;
  strategy: GenerationStrategy;
  workflowValidationPassed: boolean;
  roleCoveragePassed: boolean;
  domainLogicPassed: boolean;
  npmInstallOk: boolean;
  npmBuildOk: boolean;
  previewSuccess: boolean;
}): {
  aflaReviewPassed: boolean;
  aflaScore: number;
  crudOnlyPenalty: number;
  blockers: readonly string[];
} {
  const buildReality = buildBuildRealityEvidenceFromWorkspace({
    npmInstallOk: input.npmInstallOk,
    npmBuildOk: input.npmBuildOk,
    devServerOk: input.previewSuccess,
    workspacePresent: true,
  });

  const afla = runAutonomousFounderLaunchAuthority({
    workspaceDir: input.workspaceDir,
    buildReality,
    productName: input.productName,
    contractId: null,
    skipAutofix: true,
  });

  let crudOnlyPenalty = 0;
  const blockers: string[] = [];

  if (input.strategy !== 'CRUD_APP') {
    if (!input.workflowValidationPassed) {
      crudOnlyPenalty += 15;
      blockers.push('Primary workflow not validated for non-CRUD strategy');
    }
    if (!input.roleCoveragePassed) {
      crudOnlyPenalty += 10;
      blockers.push('Role coverage incomplete');
    }
    if (!input.domainLogicPassed) {
      crudOnlyPenalty += 10;
      blockers.push('Domain logic placeholders missing');
    }
  }

  const adjustedScore = Math.max(0, afla.scores.overallFounderScore - crudOnlyPenalty);

  const aflaReviewPassed =
    input.previewSuccess &&
    input.npmBuildOk &&
    crudOnlyPenalty === 0 &&
    input.workflowValidationPassed &&
    input.roleCoveragePassed &&
    input.domainLogicPassed;

  return {
    aflaReviewPassed,
    aflaScore: adjustedScore,
    crudOnlyPenalty,
    blockers,
  };
}
