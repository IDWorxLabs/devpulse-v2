/**
 * Contract-Bound Generation Authority V4 — module plan.
 *
 * Every generated module must map to at least one contract concept. No module is invented because
 * a fallback profile suggests it or because it is generically convenient — the derivation is purely
 * mechanical (slugify a contract concept name), so it generalizes to any product domain.
 */

import {
  CBGA_GENERIC_FALLBACK_MODULE_TERMS,
  CBGA_SYSTEM_SHELL_MODULE_IDS,
} from './contract-bound-generation-types.js';
import type {
  CbgaCanonicalContractEvidence,
  CbgaModuleEvidenceSource,
  CbgaModulePlanEntry,
  CbgaProposedModuleEvaluation,
} from './contract-bound-generation-types.js';

export function slugifyConcept(concept: string): string {
  return concept
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'concept';
}

export function titleCaseConcept(concept: string): string {
  return concept
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function moduleEntryFor(
  concept: string,
  source: CbgaModuleEvidenceSource,
  contract: CbgaCanonicalContractEvidence,
): CbgaModulePlanEntry {
  const moduleId = slugifyConcept(concept);
  return {
    readOnly: true,
    moduleId,
    displayName: titleCaseConcept(concept),
    sourceContractConcept: concept,
    requiredWorkflows: source === 'CONTRACT_WORKFLOW' ? [concept] : [],
    requiredEntities: source === 'CONTRACT_ENTITY' ? [concept] : [],
    requiredActions: [...contract.coreActions],
    requiredUiSurfaces: ['list', 'detail'],
    evidenceSource: source,
    confidence: source === 'CONTRACT_CAPABILITY' ? 65 : 80,
    generationAllowed: true,
  };
}

/**
 * Deterministically derive the module plan from the contract alone. Every entry maps back to a
 * real contract concept (`sourceContractConcept`) — nothing here is invented or generic.
 */
export function buildContractModulePlan(contract: CbgaCanonicalContractEvidence): CbgaModulePlanEntry[] {
  const seen = new Set<string>();
  const entries: CbgaModulePlanEntry[] = [];

  const addAll = (concepts: readonly string[], source: CbgaModuleEvidenceSource): void => {
    for (const concept of concepts) {
      const moduleId = slugifyConcept(concept);
      if (seen.has(moduleId)) continue;
      seen.add(moduleId);
      entries.push(moduleEntryFor(concept, source, contract));
    }
  };

  addAll(contract.coreEntities, 'CONTRACT_ENTITY');
  addAll(contract.primaryWorkflows, 'CONTRACT_WORKFLOW');
  addAll(contract.majorFeatureGroups, 'CONTRACT_CAPABILITY');

  return entries;
}

function isGenericFallbackModuleId(moduleId: string): boolean {
  const normalized = moduleId.toLowerCase();
  return CBGA_GENERIC_FALLBACK_MODULE_TERMS.some(
    (term) => normalized === term || normalized.includes(term.replace(/-/g, '')) || normalized.includes(term),
  );
}

/**
 * Classify every proposed (about-to-be-generated) module id against the contract-bound module
 * plan. A module is only ever CONTRACT_SUPPORTED when it maps to a real plan entry; a small,
 * generic, cross-cutting infrastructure allowlist (auth/dashboard/settings/persistence — not tied
 * to any product domain) is tolerated as SYSTEM_SHELL_ALLOWED; everything else is unsupported.
 */
export function evaluateProposedModules(
  modulePlan: readonly CbgaModulePlanEntry[],
  proposedModuleIds: readonly string[],
): CbgaProposedModuleEvaluation[] {
  return proposedModuleIds.map((moduleId) => {
    const matched = modulePlan.find((entry) => entry.moduleId === moduleId) ?? null;
    if (matched) {
      return {
        readOnly: true,
        moduleId,
        verdict: 'CONTRACT_SUPPORTED' as const,
        matchedPlanEntry: matched,
        reason: `Maps to contract concept "${matched.sourceContractConcept}".`,
      };
    }
    if (CBGA_SYSTEM_SHELL_MODULE_IDS.includes(moduleId)) {
      return {
        readOnly: true,
        moduleId,
        verdict: 'SYSTEM_SHELL_ALLOWED' as const,
        matchedPlanEntry: null,
        reason: 'Generic cross-cutting infrastructure module, not a product feature claim.',
      };
    }
    if (isGenericFallbackModuleId(moduleId)) {
      return {
        readOnly: true,
        moduleId,
        verdict: 'GENERIC_UNSUPPORTED' as const,
        matchedPlanEntry: null,
        reason: `"${moduleId}" is a generic/placeholder module term with no contract evidence.`,
      };
    }
    return {
      readOnly: true,
      moduleId,
      verdict: 'UNSUPPORTED_FALLBACK' as const,
      matchedPlanEntry: null,
      reason: `"${moduleId}" does not map to any contract concept and is not a recognized system-shell module — blocked before generation.`,
    };
  });
}
