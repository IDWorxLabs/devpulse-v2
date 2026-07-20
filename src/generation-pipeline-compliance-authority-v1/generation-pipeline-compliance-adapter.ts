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

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { toCbgaContractEvidence } from '../contract-bound-generation-authority-v4/index.js';
import type { CbgaGenerationReport } from '../contract-bound-generation-authority-v4/index.js';
import { isApprovedProvenancePlanValid } from '../contract-bound-generation-authority-v4/approved-provenance-plan.js';
import { runInfrastructureProductBoundaryVerification } from '../infrastructure-product-boundary-authority-v1/index.js';
import type { InfrastructureProductBoundaryAudit } from '../infrastructure-product-boundary-authority-v1/index.js';
import type { CanonicalProductContract } from '../product-faithfulness-v2/generation-faithfulness-types.js';
import type { ResolvedPromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';
import { runGenerationPipelineComplianceAuthority } from './generation-pipeline-compliance-authority.js';
import { GPCA_KNOWN_GENERIC_BLUEPRINT_PAGES, type GpcaComplianceReport } from './generation-pipeline-compliance-types.js';
import { collectRenderedContentEvidence, type RenderedContentFileInput } from './rendered-content-collector.js';
import type { GpcaRenderedContentAudit } from './rendered-content-types.js';

/**
 * Structural fallback only: before real files exist (pre-materialization) or when no workspace
 * content can be read, approximates "navigation labels this build proposes to generate" from
 * the mere presence of a known generic blueprint page's *path*. This is deliberately a coarse,
 * conservative proxy — it can never see whether that page is actually reachable from real
 * rendered navigation, only that its file exists.
 */
function deriveNavigationLabelsFromGeneratedFiles(paths: readonly string[]): string[] {
  const labels: string[] = [];
  for (const page of GPCA_KNOWN_GENERIC_BLUEPRINT_PAGES) {
    if (page.navLabel && paths.includes(page.path) && !labels.includes(page.navLabel)) {
      labels.push(page.navLabel);
    }
  }
  return labels;
}

/**
 * Contract-Bound Navigation Shell Fix V1 — "what navigation labels did this build actually
 * generate?" has a real, accurate answer once real file content can be read: the Rendered
 * Content Evidence Expansion V1 audit already extracts every label the real `<nav>` markup (and
 * `label:` data field) of this build's actual generated files renders
 * (`renderedContentAudit.navigation.navigationLabels`). That is what `detectContractBypassedInputs`
 * / `detectHardcodedNavigationLabels` should judge — never a page-existence proxy that cannot
 * distinguish "this default-shell page file exists, unreachable, for other structural consumers"
 * from "this default-shell label is actually exposed to the user as clickable navigation."
 * Falls back to the structural, presence-based proxy only when no rendered content evidence is
 * available at all (matches every other Rendered Content Evidence Expansion V1 fallback: never
 * fabricates evidence, never fails the build for not having it, never *less* strict — a label
 * still blocks the build the moment it is genuinely rendered anywhere).
 */
function deriveNavigationLabelsForPostMaterializationReport(
  paths: readonly string[],
  renderedContentAudit: GpcaRenderedContentAudit | null,
): string[] {
  if (renderedContentAudit) {
    return [...new Set(renderedContentAudit.navigation.navigationLabels)];
  }
  return deriveNavigationLabelsFromGeneratedFiles(paths);
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
      appTitle:
        input.cbgaReport.approvedIdentity?.displayName ??
        input.cbgaReport.approvedMetadataPlan?.applicationTitle ??
        input.cbgaReport.repairedInputs.appTitle ??
        input.buildPlan.extraction.appName,
      moduleIds: input.buildPlan.modulePlan.approvedModuleIds,
      routes: input.buildPlan.modulePlan.routes,
      navigationLabels: input.cbgaReport.approvedNavigationPlan?.productEntries ?? [],
      generatedFilePaths: [],
    },
  });
}

const RENDERED_CONTENT_FILE_SIZE_CAP_BYTES = 512_000;

/**
 * Rendered Content Evidence Expansion V1 — reads the *real* contents of this build's real,
 * already-written generated files (never guessed, never templated by this adapter) so
 * `collectRenderedContentEvidence` can audit what a user would actually see. Read-only: this
 * function never writes to the workspace. Missing/oversized files are skipped, not fabricated.
 */
function readRenderedFileContents(workspaceDir: string, generatedFilePaths: readonly string[]): RenderedContentFileInput[] {
  const files: RenderedContentFileInput[] = [];
  for (const relativePath of generatedFilePaths) {
    const absolutePath = join(workspaceDir, relativePath);
    if (!existsSync(absolutePath)) continue;
    try {
      const content = readFileSync(absolutePath, 'utf8');
      if (content.length > RENDERED_CONTENT_FILE_SIZE_CAP_BYTES) continue;
      files.push({ path: relativePath, content });
    } catch {
      continue;
    }
  }
  return files;
}

function buildContractVocabulary(contract: CanonicalProductContract): string[] {
  const evidence = toCbgaContractEvidence(contract);
  return [evidence.productIdentity, ...evidence.allConceptNames];
}

/**
 * Placeholder & Template Elimination Authority V1 (Part 1) — CBGA's own approved generation-plan
 * vocabulary (module display names, approved navigation labels, approved route labels), distinct
 * from the raw canonical contract vocabulary above. Lets the rendered-content collector's Content
 * Origin classifier recognize text that is genuinely CBGA-approved (e.g. an approved module's
 * display name rendered verbatim) even when it is not a literal contract concept name.
 */
function buildCbgaVocabulary(cbgaReport: CbgaGenerationReport): string[] {
  return [
    ...cbgaReport.modulePlan.map((m) => m.displayName),
    ...cbgaReport.navigationPlan.map((n) => n.label),
    ...cbgaReport.routePlan.map((r) => r.label),
  ];
}

/**
 * Placeholder & Template Elimination Authority V1 (Part 1) — raw-prompt-derived vocabulary (the
 * founder's own words), distinct from both the contract and CBGA vocabularies above. Lets the
 * classifier recognize prompt-derived product copy that has not (yet) been folded into the
 * canonical contract's concept list.
 */
function buildPromptVocabulary(buildPlan: ResolvedPromptFaithfulBuildPlan): string[] {
  const extraction = buildPlan.extraction as { appName?: string; requiredModules?: readonly string[] };
  return [extraction.appName ?? '', ...(extraction.requiredModules ?? [])].filter((term) => term.length > 0);
}

const BOUNDARY_ELIGIBLE_FILE_EXTENSION_PATTERN = /\.(?:tsx?|jsx?|css)$/i;

/**
 * Infrastructure vs Product Boundary Authority V1 applies only to real source/style files — the
 * only files that can meaningfully "carry a responsibility" (render, compose, wire, or author
 * content). Build metadata (manifests, lockfiles, JSON audit trails) is excluded generically by
 * file extension, never by path/name — the exact same rule for every build.
 */
function filterBoundaryEligibleFiles(files: readonly RenderedContentFileInput[]): RenderedContentFileInput[] {
  return files.filter((file) => BOUNDARY_ELIGIBLE_FILE_EXTENSION_PATTERN.test(file.path));
}

export function buildGpcaPostMaterializationReport(input: {
  contract: CanonicalProductContract;
  cbgaReport: CbgaGenerationReport;
  buildPlan: ResolvedPromptFaithfulBuildPlan;
  generatedFilePaths: readonly string[];
  /**
   * Rendered Content Evidence Expansion V1 — the real absolute directory this build's files were
   * written to. Optional and additive: when omitted (or when no files can be read from it), GPCA
   * falls back to structural-only evidence exactly as before this milestone — it never fabricates
   * rendered evidence, and it never fails the build for not having it.
   */
  workspaceDir?: string;
}): GpcaComplianceReport {
  let renderedContentAudit: GpcaRenderedContentAudit | null = null;
  let boundaryAudit: InfrastructureProductBoundaryAudit | null = null;
  if (input.workspaceDir) {
    const files = readRenderedFileContents(input.workspaceDir, input.generatedFilePaths);
    const provenancePlan = input.cbgaReport.approvedProvenancePlan;
    const contractVocabulary = isApprovedProvenancePlanValid(provenancePlan)
      ? [...provenancePlan.contractVocabulary]
      : buildContractVocabulary(input.contract);
    const cbgaVocabulary = isApprovedProvenancePlanValid(provenancePlan)
      ? [...provenancePlan.cbgaVocabulary]
      : buildCbgaVocabulary(input.cbgaReport);
    const promptVocabulary = buildPromptVocabulary(input.buildPlan);
    renderedContentAudit = collectRenderedContentEvidence({ files, contractVocabulary, cbgaVocabulary, promptVocabulary });
    // Infrastructure vs Product Boundary Authority V1 — same real file contents already read above,
    // classified generically by responsibility (never by path) so the presence-based blueprint-
    // bypass/generic-shell detectors below can distinguish real hosting infrastructure from real
    // product surfaces instead of blocking on file existence alone. Scoped to real source/style
    // files only (never build metadata like manifests/lockfiles/docs): "infrastructure vs product
    // responsibility" is a question about code that composes or renders something, not about
    // non-executable audit-trail data — this is a generic file-kind rule, identical for every
    // build, never a per-file/per-path exemption.
    boundaryAudit = runInfrastructureProductBoundaryVerification(filterBoundaryEligibleFiles(files), contractVocabulary);
  }

  return runGenerationPipelineComplianceAuthority(
    {
      contract: toCbgaContractEvidence(input.contract),
      cbgaReport: input.cbgaReport,
      proposed: {
        appTitle: input.buildPlan.extraction.appName,
        moduleIds: input.buildPlan.modulePlan.approvedModuleIds,
        routes: input.buildPlan.modulePlan.routes,
        navigationLabels: deriveNavigationLabelsForPostMaterializationReport(input.generatedFilePaths, renderedContentAudit),
        generatedFilePaths: input.generatedFilePaths,
      },
    },
    renderedContentAudit,
    boundaryAudit,
  );
}

export function gpcaBlocksGeneration(report: GpcaComplianceReport): boolean {
  return report.finalGateOutcome !== 'COMPLIANCE_ALLOWED';
}

export function gpcaFailureReason(report: GpcaComplianceReport): string {
  return `Generation Pipeline Compliance Authority V1 blocked generation (${report.finalGateOutcome}): ${
    report.blockedReasons.join(' ') || 'see report for details.'
  }`;
}
