/**
 * Generation Pipeline Compliance Authority V1 — legacy/template/generic-shell/contract-bypass
 * detection.
 *
 * Every detector here operates only on real evidence (the discovered stage descriptors and this
 * build's actual proposed/generated inputs) — never on a product-domain assumption. Detection is
 * therefore identical in shape for a restaurant platform, a calculator, or a CRM: it only ever
 * asks "does this artifact trace back to CBGA / the canonical contract, yes or no."
 */

import { CBGA_DEFAULT_SHELL_NAVIGATION_LABELS, CBGA_SYSTEM_SHELL_MODULE_IDS } from '../contract-bound-generation-authority-v4/index.js';
import { isPathSafeInfrastructure } from '../infrastructure-product-boundary-authority-v1/index.js';
import type { InfrastructureProductBoundaryAudit } from '../infrastructure-product-boundary-authority-v1/index.js';
import {
  GPCA_KNOWN_GENERIC_BLUEPRINT_PAGES,
  type GpcaPipelineEvidenceInput,
  type GpcaStageDescriptor,
} from './generation-pipeline-compliance-types.js';

export interface GpcaContractBypassDetection {
  readonly moduleBypass: readonly string[];
  readonly routeBypass: readonly string[];
  readonly navigationBypass: readonly string[];
  readonly titleBypassed: boolean;
  readonly detected: boolean;
}

/** Detects modules/routes/navigation/title actually proposed for generation that CBGA never approved. */
export function detectContractBypassedInputs(evidence: GpcaPipelineEvidenceInput): GpcaContractBypassDetection {
  const cbga = evidence.cbgaReport;
  if (!cbga) {
    return { moduleBypass: [], routeBypass: [], navigationBypass: [], titleBypassed: false, detected: false };
  }
  const approvedModuleIds = new Set([
    ...cbga.modulePlan.filter((m) => m.generationAllowed).map((m) => m.moduleId),
    ...CBGA_SYSTEM_SHELL_MODULE_IDS,
  ]);
  const approvedRoutes = new Set(cbga.routePlan.map((r) => r.path));
  const approvedNavLabels = new Set(cbga.navigationPlan.map((n) => n.label));

  const moduleBypass = evidence.proposed.moduleIds.filter((m) => !approvedModuleIds.has(m));
  const routeBypass = evidence.proposed.routes.filter((r) => !approvedRoutes.has(r));
  const navigationBypass = evidence.proposed.navigationLabels.filter(
    (label) => !approvedNavLabels.has(label) && CBGA_DEFAULT_SHELL_NAVIGATION_LABELS.includes(label),
  );
  const approvedTitles = new Set(
    [
      cbga.productIdentity,
      cbga.approvedIdentity?.displayName,
      cbga.approvedMetadataPlan?.applicationTitle,
      cbga.repairedInputs?.appTitle,
    ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0),
  );
  // Identity Computation Collapse — a title that matches any CBGA-approved identity surface is
  // not a generator bypass. Comparing only to contract.productIdentity falsely blocks prompt-
  // derived non-generic titles that CBGA intentionally preserved.
  const titleBypassed = !approvedTitles.has(evidence.proposed.appTitle);

  return {
    moduleBypass,
    routeBypass,
    navigationBypass,
    titleBypassed,
    detected: moduleBypass.length > 0 || routeBypass.length > 0 || navigationBypass.length > 0 || titleBypassed,
  };
}

/** Stages that structurally rely on a legacy, pre-contract planner/template rather than CBGA output. */
export function detectLegacyGeneratorUsage(stages: readonly GpcaStageDescriptor[]): string[] {
  return stages
    .filter((s) => s.flags.usesLegacyPlanner || (s.flags.usesRegexExtraction && s.flags.usesTitleOutsideContract))
    .map((s) => s.stageName);
}

/** Stages that generate content from a hardcoded template rather than contract-derived copy. */
export function detectTemplateGeneratorUsage(stages: readonly GpcaStageDescriptor[]): string[] {
  return stages
    .filter((s) => s.flags.usesHardcodedTemplate || s.flags.usesGenericUiCopy || s.flags.usesReusableComponentShell)
    .map((s) => s.stageName);
}

export interface GpcaGenericShellDetection {
  readonly detectedPaths: readonly string[];
  readonly justifiedPaths: readonly string[];
}

function isNavLabelJustifiedByContract(label: string, evidence: GpcaPipelineEvidenceInput): boolean {
  const normalized = label.toLowerCase();
  const haystack = [
    ...evidence.contract.navigationExpectations,
    ...evidence.contract.majorFeatureGroups,
    ...evidence.contract.allConceptNames,
    ...evidence.contract.businessConcepts,
  ].map((c) => c.toLowerCase());
  return haystack.some((c) => c === normalized || c.includes(normalized) || normalized.includes(c));
}

/**
 * Detects generic blueprint shell pages actually present on disk that the contract does not
 * justify.
 *
 * Infrastructure vs Product Boundary Authority V1 — Phase 6 asks a different question than "does
 * this file exist?": when a real, content-based `boundaryAudit` is supplied and it classifies the
 * exact file as pure `INFRASTRUCTURE` (zero business-content signal in its real, current content —
 * never a filename lookup, never a whitelist), the file is exempt from this presence-based check.
 * Any other classification (`PRODUCT`, `MIXED`, `UNKNOWN`) — or no boundary evidence at all — leaves
 * this detector exactly as strict as before this milestone.
 */
export function detectGenericShellInjection(
  evidence: GpcaPipelineEvidenceInput,
  boundaryAudit?: InfrastructureProductBoundaryAudit | null,
): GpcaGenericShellDetection {
  const detectedPaths: string[] = [];
  const justifiedPaths: string[] = [];
  for (const page of GPCA_KNOWN_GENERIC_BLUEPRINT_PAGES) {
    if (!evidence.proposed.generatedFilePaths.includes(page.path)) continue;
    const justifiedByContract = page.navLabel !== null && isNavLabelJustifiedByContract(page.navLabel, evidence);
    const justifiedByBoundary = isPathSafeInfrastructure(boundaryAudit, page.path);
    if (justifiedByContract || justifiedByBoundary) {
      justifiedPaths.push(page.path);
    } else {
      detectedPaths.push(page.path);
    }
  }
  return { detectedPaths, justifiedPaths };
}

/**
 * Detects the unconditional reusable blueprint shell (welcome/onboarding) bypassing the product
 * surface.
 *
 * Same Phase 6 boundary exemption as `detectGenericShellInjection` above: a supplied `boundaryAudit`
 * that classifies the exact file as pure `INFRASTRUCTURE` from its own real content exempts it. No
 * boundary evidence (or any other classification) preserves this detector's original, unmodified
 * strictness.
 */
export function detectBlueprintBypass(
  evidence: GpcaPipelineEvidenceInput,
  boundaryAudit?: InfrastructureProductBoundaryAudit | null,
): string[] {
  const bypassPaths = ['src/blueprint/WelcomeScreen.tsx', 'src/blueprint/OnboardingScreen.tsx'];
  return bypassPaths.filter(
    (p) => evidence.proposed.generatedFilePaths.includes(p) && !isPathSafeInfrastructure(boundaryAudit, p),
  );
}

/** Navigation labels present in the proposed output that are default-shell labels with no contract support. */
export function detectHardcodedNavigationLabels(evidence: GpcaPipelineEvidenceInput): string[] {
  return evidence.proposed.navigationLabels.filter(
    (label) => CBGA_DEFAULT_SHELL_NAVIGATION_LABELS.includes(label) && !isNavLabelJustifiedByContract(label, evidence),
  );
}

/** Routes proposed for generation that neither CBGA's route plan nor the contract can support. */
export function detectHardcodedRoutes(evidence: GpcaPipelineEvidenceInput): string[] {
  const approvedRoutes = new Set((evidence.cbgaReport?.routePlan ?? []).map((r) => r.path));
  return evidence.proposed.routes.filter((r) => !approvedRoutes.has(r));
}

/** Module ids proposed for generation that CBGA's module plan never approved (system-shell infra excepted). */
export function detectHardcodedModuleIds(evidence: GpcaPipelineEvidenceInput): string[] {
  const approvedIds = new Set([
    ...(evidence.cbgaReport?.modulePlan ?? []).filter((m) => m.generationAllowed).map((m) => m.moduleId),
    ...CBGA_SYSTEM_SHELL_MODULE_IDS,
  ]);
  return evidence.proposed.moduleIds.filter((m) => !approvedIds.has(m));
}

export interface GpcaTitleDetection {
  readonly generatedOutsideContract: boolean;
  readonly reason: string;
}

/** Detects when the proposed app title does not equal the contract's product identity. */
export function detectTitleGeneratedOutsideContract(evidence: GpcaPipelineEvidenceInput): GpcaTitleDetection {
  const generatedOutsideContract = evidence.proposed.appTitle !== evidence.contract.productIdentity;
  return {
    generatedOutsideContract,
    reason: generatedOutsideContract
      ? `Proposed app title "${evidence.proposed.appTitle}" does not equal the contract's product identity "${evidence.contract.productIdentity}".`
      : 'Proposed app title matches the contract product identity.',
  };
}

/** True when any stage structurally derives a title via regex extraction instead of the contract. */
export function detectRegexTitleExtractionRisk(stages: readonly GpcaStageDescriptor[]): boolean {
  return stages.some((s) => s.flags.usesRegexExtraction);
}

/** True when any stage structurally still relies on the legacy per-profile template map. */
export function detectProfileTemplateLeakage(stages: readonly GpcaStageDescriptor[]): boolean {
  return stages.some((s) => s.flags.usesProfileFeatureDefinition && s.flags.usesLegacyPlanner);
}

/** True when the independent Universal Feature Contract stage is not itself derived from the canonical contract. */
export function detectUniversalFeatureContractLeakage(stages: readonly GpcaStageDescriptor[]): boolean {
  const stage = stages.find((s) => s.stageId === 'UNIVERSAL_FEATURE_CONTRACT');
  return Boolean(stage && stage.flags.usesUniversalFeatureContract && !stage.flags.usesCanonicalContract);
}
