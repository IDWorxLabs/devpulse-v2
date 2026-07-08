/**
 * Generation Pipeline Compliance Authority V1 — narrow production adapter.
 *
 * Bridges GPCA's decoupled evidence shape to the real, existing production types
 * (`CanonicalProductContract`, `ResolvedPromptFaithfulBuildPlan`, `CbgaGenerationReport`) without
 * redesigning any generator. Two call sites are supported, matching the two points the milestone
 * requires GPCA to run at:
 *
 * - `buildGpcaPreMaterializationReport` — right after CBGA repairs the build plan, before any
 *   workspace file is written. Verifies the *inputs* about to be handed to the generators.
 * - `buildGpcaPostMaterializationReport` — right after real files are written to the workspace,
 *   before the dev server / live preview is started. Verifies the *actual generated output*
 *   (including the unconditional blueprint shell) using real file-path evidence — this is the
 *   only point a legacy/generic-shell injection can be proven, because it does not exist until
 *   the workspace has real files on disk.
 *
 * GPCA never writes to the workspace and never mutates the build plan — it only ever returns a
 * report and a boolean the caller must act on.
 */

import { toCbgaContractEvidence } from '../contract-bound-generation-authority-v4/index.js';
import type { CbgaGenerationReport } from '../contract-bound-generation-authority-v4/index.js';
import type { CanonicalProductContract } from '../product-faithfulness-v2/generation-faithfulness-types.js';
import type { ResolvedPromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';
import { runGenerationPipelineComplianceAuthority } from './generation-pipeline-compliance-authority.js';
import { GPCA_KNOWN_GENERIC_BLUEPRINT_PAGES, type GpcaComplianceReport } from './generation-pipeline-compliance-types.js';

function deriveNavigationLabelsFromGeneratedFiles(paths: readonly string[]): string[] {
  const labels: string[] = [];
  for (const page of GPCA_KNOWN_GENERIC_BLUEPRINT_PAGES) {
    if (page.navLabel && paths.includes(page.path) && !labels.includes(page.navLabel)) {
      labels.push(page.navLabel);
    }
  }
  return labels;
}

export function buildGpcaPreMaterializationReport(input: {
  contract: CanonicalProductContract;
  cbgaReport: CbgaGenerationReport;
  buildPlan: ResolvedPromptFaithfulBuildPlan;
}): GpcaComplianceReport {
  return runGenerationPipelineComplianceAuthority({
    contract: toCbgaContractEvidence(input.contract),
    cbgaReport: input.cbgaReport,
    proposed: {
      appTitle: input.buildPlan.extraction.appName,
      moduleIds: input.buildPlan.modulePlan.approvedModuleIds,
      routes: input.buildPlan.modulePlan.routes,
      navigationLabels: [],
      generatedFilePaths: [],
    },
  });
}

export function buildGpcaPostMaterializationReport(input: {
  contract: CanonicalProductContract;
  cbgaReport: CbgaGenerationReport;
  buildPlan: ResolvedPromptFaithfulBuildPlan;
  generatedFilePaths: readonly string[];
}): GpcaComplianceReport {
  return runGenerationPipelineComplianceAuthority({
    contract: toCbgaContractEvidence(input.contract),
    cbgaReport: input.cbgaReport,
    proposed: {
      appTitle: input.buildPlan.extraction.appName,
      moduleIds: input.buildPlan.modulePlan.approvedModuleIds,
      routes: input.buildPlan.modulePlan.routes,
      navigationLabels: deriveNavigationLabelsFromGeneratedFiles(input.generatedFilePaths),
      generatedFilePaths: input.generatedFilePaths,
    },
  });
}

export function gpcaBlocksGeneration(report: GpcaComplianceReport): boolean {
  return report.finalGateOutcome !== 'COMPLIANCE_ALLOWED';
}

export function gpcaFailureReason(report: GpcaComplianceReport): string {
  return `Generation Pipeline Compliance Authority V1 blocked generation (${report.finalGateOutcome}): ${
    report.blockedReasons.join(' ') || 'see report for details.'
  }`;
}
