/**
 * AEL Evidence Collector — normalizes build spine evidence for decision engine.
 */

import type { AeeFinalReport, AeeStage } from '../autonomous-engineering-executive/aee-types.js';
import type { AelEvidenceBundle, ProductRealityReport, FounderLoopCycleReport } from './ael-types.js';
import { evaluateProductReality } from './product-reality-engine.js';

export function collectAelEvidence(input: {
  rawPrompt: string;
  workspaceDir: string;
  generatedModules: readonly string[];
  approvedModuleIds?: readonly string[];
  npmInstallOk: boolean;
  npmBuildOk: boolean;
  previewOk: boolean;
  previewDegraded: boolean;
  autofixAttempts: number;
  capabilityEvolutionAttempts: number;
  previewRecoveryAttempts: number;
  aeeFurthestStage: AeeStage | null;
  aeeFinalReport: AeeFinalReport | null;
  engineeringIntelligenceScore?: number | null;
  productRealityReport?: ProductRealityReport;
  founderLoopReport?: FounderLoopCycleReport | null;
  safetyReviewRequired?: boolean;
  remainingGaps?: readonly string[];
}): AelEvidenceBundle {
  const productRealityReport =
    input.productRealityReport ??
    evaluateProductReality({
      rawPrompt: input.rawPrompt,
      workspaceDir: input.workspaceDir,
      generatedModules: input.generatedModules,
      approvedModuleIds: input.approvedModuleIds,
    });

  const gaps = [
    ...(input.remainingGaps ?? []),
    ...productRealityReport.launchReadinessBlockers,
    ...productRealityReport.missingCapabilities.map((c) => `Missing capability: ${c}`),
  ];

  return {
    readOnly: true,
    npmBuildOk: input.npmBuildOk,
    npmInstallOk: input.npmInstallOk,
    previewOk: input.previewOk,
    previewDegraded: input.previewDegraded,
    productRealityReport,
    founderLoopReport: input.founderLoopReport ?? null,
    autofixAttempts: input.autofixAttempts,
    capabilityEvolutionAttempts: input.capabilityEvolutionAttempts,
    previewRecoveryAttempts: input.previewRecoveryAttempts,
    aeeFurthestStage: input.aeeFurthestStage,
    aeeFinalReport: input.aeeFinalReport,
    engineeringIntelligenceScore: input.engineeringIntelligenceScore ?? null,
    safetyReviewRequired: input.safetyReviewRequired ?? false,
    remainingGaps: [...new Set(gaps)],
  };
}

export function buildAeeEvidenceSummary(aeeFinalReport: AeeFinalReport | null): string {
  if (!aeeFinalReport) return 'AEE not consulted';
  return `AEE stage ${aeeFinalReport.buildSpineStageReached} — ${aeeFinalReport.finalOutcome ?? 'in progress'}`;
}
