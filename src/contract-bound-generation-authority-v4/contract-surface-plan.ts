/**
 * Contract-Bound Generation Authority V4 — surface plan.
 *
 * Derives the visible UI surface requirements (title, primary interaction, empty/success states,
 * controls, data concepts) from the contract alone. The generic-shell detectors below are
 * structural pattern checks against known placeholder/template phrasing (the actual observed bug:
 * a title/welcome screen literally reading "reusable components where") — they never reference any
 * specific product domain.
 */

import type {
  CbgaCanonicalContractEvidence,
  CbgaModulePlanEntry,
  CbgaProposedGeneratorInputs,
  CbgaSurfaceEvaluation,
  CbgaSurfacePlan,
} from './contract-bound-generation-types.js';

/** Generic placeholder/template phrasing — structural markers of a generic shell, not a domain list. */
const GENERIC_TITLE_PATTERNS: RegExp[] = [
  /^custom app$/i,
  /^custom application$/i,
  /^project management system$/i,
  /reusable component/i,
  /^\s*$/,
];

const GENERIC_WELCOME_PATTERNS: RegExp[] = [
  /reusable component/i,
  /welcome to (project management|custom app)/i,
  /generic (dashboard|shell|template)/i,
  /^\s*$/,
];

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
}

/** Soft lexical relatedness — plural/singular and shared stems, never domain-specific. */
function wordsRelated(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a))) return true;
  if (a.endsWith('s') && a.slice(0, -1) === b) return true;
  if (b.endsWith('s') && b.slice(0, -1) === a) return true;
  if (a.endsWith('es') && a.slice(0, -2) === b) return true;
  if (b.endsWith('es') && b.slice(0, -2) === a) return true;
  return false;
}

export function buildContractSurfacePlan(
  contract: CbgaCanonicalContractEvidence,
  modulePlan: readonly CbgaModulePlanEntry[],
): CbgaSurfacePlan {
  const primaryModule = modulePlan[0] ?? null;
  const primaryWorkflow = contract.primaryWorkflows[0] ?? contract.majorFeatureGroups[0] ?? primaryModule?.sourceContractConcept ?? 'primary workflow';

  return {
    readOnly: true,
    titleRequirement: contract.productIdentity,
    primaryInteractionRequirement: primaryWorkflow,
    emptyStateRequirement: primaryModule
      ? `No ${primaryModule.displayName} yet — get started by adding one.`
      : 'No items yet — get started by adding one.',
    successStateRequirement: primaryModule
      ? `${primaryModule.displayName} saved successfully.`
      : 'Saved successfully.',
    requiredControls: [...new Set(contract.coreActions)].slice(0, 6),
    requiredDataConcepts: [...contract.coreEntities],
    sourceContractConcept: contract.productIdentity,
  };
}

/** Does the text reference at least one real contract concept (by word overlap)? */
function referencesContractConcept(text: string, contract: CbgaCanonicalContractEvidence): boolean {
  const words = normalizeWords(text);
  const conceptWords = [contract.productIdentity, ...contract.allConceptNames].flatMap((concept) =>
    normalizeWords(concept),
  );
  for (const word of words) {
    if (conceptWords.some((conceptWord) => wordsRelated(word, conceptWord))) return true;
  }
  return false;
}

export function evaluateProposedSurface(
  surfacePlan: CbgaSurfacePlan,
  contract: CbgaCanonicalContractEvidence,
  proposed: CbgaProposedGeneratorInputs,
): CbgaSurfaceEvaluation {
  const reasons: string[] = [];
  const title = proposed.proposedAppTitle ?? '';

  const titleIsGeneric = GENERIC_TITLE_PATTERNS.some((pattern) => pattern.test(title.trim()));
  if (titleIsGeneric) reasons.push(`Proposed app title "${title}" is a generic/placeholder title.`);

  const titleMatchesProductIdentity =
    !titleIsGeneric &&
    (title.trim().toLowerCase() === contract.productIdentity.trim().toLowerCase() ||
      referencesContractConcept(title, contract));
  if (!titleIsGeneric && !titleMatchesProductIdentity) {
    reasons.push(`Proposed app title "${title}" does not derive from product identity "${contract.productIdentity}".`);
  }

  const welcomeText = proposed.proposedWelcomeSurfaceText ?? '';
  const welcomeSurfaceIsGenericShell =
    welcomeText.length > 0 &&
    (GENERIC_WELCOME_PATTERNS.some((pattern) => pattern.test(welcomeText)) ||
      !referencesContractConcept(welcomeText, contract));
  if (welcomeSurfaceIsGenericShell) {
    reasons.push('Proposed welcome/landing surface reads as a generic reusable-shell screen, not a description of the requested product.');
  }

  const primaryWorkflowVisible =
    proposed.proposedPrimaryWorkflowVisible ??
    proposed.proposedModuleIds.some((id) =>
      normalizeWords(surfacePlan.primaryInteractionRequirement).some((w) => id.toLowerCase().includes(w)),
    );
  if (!primaryWorkflowVisible) reasons.push(`Primary workflow "${surfacePlan.primaryInteractionRequirement}" is not visible in the proposed surface.`);

  const primaryWorkflowInteractive = primaryWorkflowVisible
    ? proposed.proposedPrimaryWorkflowInteractive ?? true
    : false;
  if (primaryWorkflowVisible && !primaryWorkflowInteractive) {
    reasons.push(`Primary workflow "${surfacePlan.primaryInteractionRequirement}" is visible but not interactive.`);
  }

  return {
    readOnly: true,
    titleIsGeneric,
    titleMatchesProductIdentity,
    welcomeSurfaceIsGenericShell,
    primaryWorkflowVisible,
    primaryWorkflowInteractive,
    reasons,
  };
}
