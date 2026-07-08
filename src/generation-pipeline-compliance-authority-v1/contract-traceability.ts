/**
 * Generation Pipeline Compliance Authority V1 — contract traceability.
 *
 * "Every generated object must prove origin contract concept, origin workflow, origin capability,
 * origin module, origin route, origin navigation item, origin surface. If provenance cannot be
 * proven, generation fails." This module builds that ancestry chain — Founder Prompt → Canonical
 * Product Contract → CBGA plan entry → generator → artifact — for every proposed module, route,
 * navigation item, the app title, and the surface plan, and reports exactly where the chain breaks
 * when it does.
 */

import type {
  GpcaPipelineEvidenceInput,
  GpcaProvenanceLink,
  GpcaTraceabilityResult,
} from './generation-pipeline-compliance-types.js';

function link(
  artifact: string,
  generatedBy: GpcaProvenanceLink['generatedBy'],
  inputSource: string,
  derivedFrom: string,
  originContractConcept: string | null,
): GpcaProvenanceLink {
  return { readOnly: true, artifact, generatedBy, inputSource, derivedFrom, originContractConcept };
}

function moduleTraceability(evidence: GpcaPipelineEvidenceInput, moduleId: string): GpcaTraceabilityResult {
  const cbga = evidence.cbgaReport;
  const planEntry = cbga?.modulePlan.find((m) => m.moduleId === moduleId) ?? null;
  const chain: GpcaProvenanceLink[] = [
    link(moduleId, 'MODULE_GENERATOR', 'ProfileFeatureDefinition.featureModules', 'PromptBoundedModulePlan.approvedModuleIds', planEntry?.sourceContractConcept ?? null),
  ];
  if (!cbga) {
    return {
      readOnly: true,
      artifact: moduleId,
      artifactKind: 'MODULE',
      proven: false,
      chain,
      brokenAtLink: 'CONTRACT_BOUND_GENERATION_AUTHORITY',
      reason: 'No CBGA report was supplied — this module cannot be traced to a contract-bound module plan.',
    };
  }
  if (!planEntry || !planEntry.generationAllowed) {
    return {
      readOnly: true,
      artifact: moduleId,
      artifactKind: 'MODULE',
      proven: false,
      chain,
      brokenAtLink: 'CONTRACT_BOUND_GENERATION_AUTHORITY',
      reason: `Module "${moduleId}" has no generation-allowed entry in CBGA's module plan.`,
    };
  }
  chain.push(link(planEntry.sourceContractConcept, 'CONTRACT_BOUND_GENERATION_AUTHORITY', 'CanonicalProductContract', 'Founder Prompt', planEntry.sourceContractConcept));
  const conceptExists = evidence.contract.allConceptNames.includes(planEntry.sourceContractConcept);
  return {
    readOnly: true,
    artifact: moduleId,
    artifactKind: 'MODULE',
    proven: conceptExists,
    chain,
    brokenAtLink: conceptExists ? null : 'CANONICAL_PRODUCT_CONTRACT',
    reason: conceptExists
      ? `Module "${moduleId}" traces to contract concept "${planEntry.sourceContractConcept}".`
      : `Module "${moduleId}" cites contract concept "${planEntry.sourceContractConcept}" which no longer exists in the contract.`,
  };
}

function routeTraceability(evidence: GpcaPipelineEvidenceInput, path: string): GpcaTraceabilityResult {
  const cbga = evidence.cbgaReport;
  const routeEntry = cbga?.routePlan.find((r) => r.path === path) ?? null;
  const chain: GpcaProvenanceLink[] = [
    link(path, 'ROUTE_GENERATOR', 'FEATURE_REGISTRY', 'CbgaRoutePlanEntry', routeEntry?.sourceContractConcept ?? null),
  ];
  if (!cbga || !routeEntry) {
    return {
      readOnly: true,
      artifact: path,
      artifactKind: 'ROUTE',
      proven: false,
      chain,
      brokenAtLink: 'CONTRACT_BOUND_GENERATION_AUTHORITY',
      reason: `Route "${path}" has no matching entry in CBGA's route plan.`,
    };
  }
  const moduleResult = moduleTraceability(evidence, routeEntry.moduleId);
  return {
    readOnly: true,
    artifact: path,
    artifactKind: 'ROUTE',
    proven: moduleResult.proven,
    chain: [...chain, ...moduleResult.chain],
    brokenAtLink: moduleResult.proven ? null : moduleResult.brokenAtLink,
    reason: moduleResult.proven
      ? `Route "${path}" traces to module "${routeEntry.moduleId}" and contract concept "${routeEntry.sourceContractConcept}".`
      : `Route "${path}" depends on module "${routeEntry.moduleId}" which cannot itself be traced: ${moduleResult.reason}`,
  };
}

function navigationTraceability(evidence: GpcaPipelineEvidenceInput, label: string): GpcaTraceabilityResult {
  const cbga = evidence.cbgaReport;
  const navEntry = cbga?.navigationPlan.find((n) => n.label === label) ?? null;
  const chain: GpcaProvenanceLink[] = [
    link(label, 'NAVIGATION_GENERATOR', 'CbgaRoutePlanEntry', 'CbgaNavigationPlanItem', navEntry?.sourceContractConcept ?? null),
  ];
  if (!cbga || !navEntry) {
    return {
      readOnly: true,
      artifact: label,
      artifactKind: 'NAVIGATION_ITEM',
      proven: false,
      chain,
      brokenAtLink: 'CONTRACT_BOUND_GENERATION_AUTHORITY',
      reason: `Navigation item "${label}" has no matching entry in CBGA's navigation plan.`,
    };
  }
  return {
    readOnly: true,
    artifact: label,
    artifactKind: 'NAVIGATION_ITEM',
    proven: true,
    chain,
    brokenAtLink: null,
    reason: `Navigation item "${label}" traces to route "${navEntry.path}" and contract concept "${navEntry.sourceContractConcept}".`,
  };
}

function titleTraceability(evidence: GpcaPipelineEvidenceInput): GpcaTraceabilityResult {
  const proven = evidence.proposed.appTitle === evidence.contract.productIdentity;
  const chain: GpcaProvenanceLink[] = [
    link(evidence.proposed.appTitle, 'MATERIALIZATION', 'buildPlan.extraction.appName', 'CanonicalProductContract.productIdentity', evidence.contract.productIdentity),
  ];
  return {
    readOnly: true,
    artifact: evidence.proposed.appTitle,
    artifactKind: 'TITLE',
    proven,
    chain,
    brokenAtLink: proven ? null : 'CANONICAL_PRODUCT_CONTRACT',
    reason: proven
      ? `App title "${evidence.proposed.appTitle}" traces to the contract's product identity.`
      : `App title "${evidence.proposed.appTitle}" does not equal the contract's product identity "${evidence.contract.productIdentity}".`,
  };
}

function surfaceTraceability(evidence: GpcaPipelineEvidenceInput): GpcaTraceabilityResult {
  const cbga = evidence.cbgaReport;
  const chain: GpcaProvenanceLink[] = [
    link('primary surface', 'SURFACE_GENERATOR', 'CbgaSurfacePlan', 'CanonicalProductContract', cbga?.surfacePlan.sourceContractConcept ?? null),
  ];
  if (!cbga) {
    return {
      readOnly: true,
      artifact: 'primary surface',
      artifactKind: 'SURFACE',
      proven: false,
      chain,
      brokenAtLink: 'CONTRACT_BOUND_GENERATION_AUTHORITY',
      reason: 'No CBGA report was supplied — the primary surface cannot be traced to a contract-bound surface plan.',
    };
  }
  const proven = cbga.finalGateOutcome === 'GENERATION_ALLOWED';
  return {
    readOnly: true,
    artifact: 'primary surface',
    artifactKind: 'SURFACE',
    proven,
    chain,
    brokenAtLink: proven ? null : 'CONTRACT_BOUND_GENERATION_AUTHORITY',
    reason: proven
      ? `Primary surface traces to contract concept "${cbga.surfacePlan.sourceContractConcept}".`
      : `CBGA's final gate outcome was ${cbga.finalGateOutcome}, so the surface plan is not proven consistent.`,
  };
}

/**
 * Builds the full ancestry chain for every proposed module, route, navigation item, the app title,
 * and the primary surface. Deterministic: the same evidence always yields the same chains in the
 * same order.
 */
export function buildContractTraceabilityChains(evidence: GpcaPipelineEvidenceInput): GpcaTraceabilityResult[] {
  const results: GpcaTraceabilityResult[] = [];
  for (const moduleId of evidence.proposed.moduleIds) {
    results.push(moduleTraceability(evidence, moduleId));
  }
  for (const route of evidence.proposed.routes) {
    results.push(routeTraceability(evidence, route));
  }
  for (const label of evidence.proposed.navigationLabels) {
    results.push(navigationTraceability(evidence, label));
  }
  results.push(titleTraceability(evidence));
  results.push(surfaceTraceability(evidence));
  return results;
}
