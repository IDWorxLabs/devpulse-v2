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
  const titleBypassed = evidence.proposed.appTitle !== cbga.productIdentity;

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

/** Detects generic blueprint shell pages actually present on disk that the contract does not justify. */
export function detectGenericShellInjection(evidence: GpcaPipelineEvidenceInput): GpcaGenericShellDetection {
  const detectedPaths: string[] = [];
  const justifiedPaths: string[] = [];
  for (const page of GPCA_KNOWN_GENERIC_BLUEPRINT_PAGES) {
    if (!evidence.proposed.generatedFilePaths.includes(page.path)) continue;
    const justified = page.navLabel !== null && isNavLabelJustifiedByContract(page.navLabel, evidence);
    if (justified) {
      justifiedPaths.push(page.path);
    } else {
      detectedPaths.push(page.path);
    }
  }
  return { detectedPaths, justifiedPaths };
}

/** Detects the unconditional reusable blueprint shell (welcome/onboarding) bypassing the product surface. */
export function detectBlueprintBypass(evidence: GpcaPipelineEvidenceInput): string[] {
  const bypassPaths = ['src/blueprint/WelcomeScreen.tsx', 'src/blueprint/OnboardingScreen.tsx'];
  return bypassPaths.filter((p) => evidence.proposed.generatedFilePaths.includes(p));
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
