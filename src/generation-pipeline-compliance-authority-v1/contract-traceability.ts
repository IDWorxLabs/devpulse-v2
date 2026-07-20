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
import {
  isApprovedProvenancePlanValid,
  type ApprovedProvenanceAncestryChain,
  type ApprovedProvenancePlan,
} from '../contract-bound-generation-authority-v4/approved-provenance-plan.js';
import {
  isApprovedRepairRealityPlanValid,
  type ApprovedRepairRealityPlan,
} from '../contract-bound-generation-authority-v4/approved-repair-reality-plan.js';
import {
  isApprovedProductionBuildEnvelopeValid,
  type ApprovedProductionBuildEnvelope,
} from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { CBGA_SYSTEM_SHELL_MODULE_IDS } from '../contract-bound-generation-authority-v4/contract-bound-generation-types.js';

function toGpcaTraceabilityResult(chain: ApprovedProvenanceAncestryChain): GpcaTraceabilityResult {
  return {
    readOnly: true,
    artifact: chain.artifact,
    artifactKind: chain.artifactKind as GpcaTraceabilityResult['artifactKind'],
    proven: chain.proven,
    chain: chain.chain.map((entry) => ({
      readOnly: true as const,
      artifact: entry.artifact,
      generatedBy: entry.generatedBy as GpcaProvenanceLink['generatedBy'],
      inputSource: entry.inputSource,
      derivedFrom: entry.derivedFrom,
      originContractConcept: entry.originContractConcept,
    })),
    brokenAtLink: chain.brokenAtLink as GpcaTraceabilityResult['brokenAtLink'],
    reason: chain.reason,
  };
}

function projectTraceabilityFromApprovedProvenancePlan(
  plan: ApprovedProvenancePlan,
  evidence: GpcaPipelineEvidenceInput,
): GpcaTraceabilityResult[] | null {
  const moduleIdsMatch =
    plan.approvedModuleIds.length === evidence.proposed.moduleIds.length &&
    plan.approvedModuleIds.every((moduleId, index) => moduleId === evidence.proposed.moduleIds[index]);
  const routesMatch =
    plan.approvedRoutes.length === evidence.proposed.routes.length &&
    plan.approvedRoutes.every((route, index) => route === evidence.proposed.routes[index]);
  const navMatch =
    plan.approvedNavigationLabels.length === evidence.proposed.navigationLabels.length &&
    plan.approvedNavigationLabels.every((label, index) => label === evidence.proposed.navigationLabels[index]);
  const titleMatch = plan.appTitle === evidence.proposed.appTitle;
  if (!moduleIdsMatch || !routesMatch || !navMatch || !titleMatch) {
    return null;
  }
  return plan.ancestryChains.map(toGpcaTraceabilityResult);
}

function provenanceTraceability(evidence: GpcaPipelineEvidenceInput): GpcaTraceabilityResult {
  const provenancePlan = evidence.cbgaReport?.approvedProvenancePlan ?? null;
  const chain: GpcaProvenanceLink[] = [
    link(
      'artifact provenance',
      'CONTRACT_BOUND_GENERATION_AUTHORITY',
      'ApprovedProductIdentity + ApprovedNavigationPlan + ApprovedModulePlan + ApprovedMetadataPlan + ApprovedSampleDataPlan',
      'ApprovedProvenancePlan',
      provenancePlan?.contractId ?? null,
    ),
  ];
  if (!provenancePlan || !isApprovedProvenancePlanValid(provenancePlan)) {
    return {
      readOnly: true,
      artifact: 'artifact provenance',
      artifactKind: 'PROVENANCE',
      proven: false,
      chain,
      brokenAtLink: 'CONTRACT_BOUND_GENERATION_AUTHORITY',
      reason: 'No CBGA approved provenance plan was supplied — artifact provenance cannot be traced to a composed handoff.',
    };
  }
  const summaryConsistent = provenancePlan.traceabilityEntries.some(
    (entry) => entry.key === 'contractId' && entry.value === provenancePlan.contractId,
  );
  const proven = summaryConsistent && provenancePlan.ancestryChains.length > 0;
  return {
    readOnly: true,
    artifact: 'artifact provenance',
    artifactKind: 'PROVENANCE',
    proven,
    chain: [
      ...chain,
      link(provenancePlan.provenanceSummary, 'CONTRACT_BOUND_GENERATION_AUTHORITY', 'ApprovedProvenancePlan.provenanceSummary', 'ApprovedProvenancePlan.ancestryChains', provenancePlan.contractId),
    ],
    brokenAtLink: proven ? null : 'CONTRACT_BOUND_GENERATION_AUTHORITY',
    reason: proven
      ? `Artifact provenance traces to ApprovedProvenancePlan composed from prior handoffs and contract "${provenancePlan.contractId}".`
      : 'ApprovedProvenancePlan is structurally inconsistent with its traceability projection.',
  };
}

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
  // System-shell infrastructure modules (auth/dashboard/settings/persistence) are cross-cutting
  // hosting — they never require a product-concept entry. Trace them as CBGA-allowlisted
  // infrastructure so local persistence can materialize without inventing a product concept.
  if (CBGA_SYSTEM_SHELL_MODULE_IDS.includes(moduleId)) {
    return {
      readOnly: true,
      artifact: moduleId,
      artifactKind: 'MODULE',
      proven: true,
      chain: [
        link(
          moduleId,
          'MODULE_GENERATOR',
          'CBGA_SYSTEM_SHELL_MODULE_IDS',
          'ApprovedModulePlan.systemShellModuleIds',
          moduleId,
        ),
      ],
      brokenAtLink: null,
      reason: `Module "${moduleId}" is a CBGA-allowlisted system-shell infrastructure module.`,
    };
  }
  // Module Computation Collapse V1 — the approved, post-repair module plan
  // (`ApprovedModulePlan.moduleEntries`) is checked FIRST and ADDITIONALLY to the original
  // `modulePlan` check below; it can only ever prove more modules traceable (it is always a
  // strict subset of `modulePlan`, filtered to the moduleIds CBGA's final repair actually
  // approved), never weaken this check.
  const approvedEntry = cbga?.approvedModulePlan.moduleEntries.find((m) => m.moduleId === moduleId) ?? null;
  const legacyPlanEntry = cbga?.modulePlan.find((m) => m.moduleId === moduleId) ?? null;
  const sourceContractConcept = approvedEntry?.contractSource ?? legacyPlanEntry?.sourceContractConcept ?? null;
  const chain: GpcaProvenanceLink[] = [
    link(
      moduleId,
      'MODULE_GENERATOR',
      'ProfileFeatureDefinition.featureModules',
      approvedEntry ? 'ApprovedModulePlan.moduleEntries' : 'PromptBoundedModulePlan.approvedModuleIds',
      sourceContractConcept,
    ),
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
  if (!sourceContractConcept || (!approvedEntry && !legacyPlanEntry?.generationAllowed)) {
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
  chain.push(link(sourceContractConcept, 'CONTRACT_BOUND_GENERATION_AUTHORITY', 'CanonicalProductContract', 'Founder Prompt', sourceContractConcept));
  const conceptExists = evidence.contract.allConceptNames.includes(sourceContractConcept);
  return {
    readOnly: true,
    artifact: moduleId,
    artifactKind: 'MODULE',
    proven: conceptExists,
    chain,
    brokenAtLink: conceptExists ? null : 'CANONICAL_PRODUCT_CONTRACT',
    reason: conceptExists
      ? `Module "${moduleId}" traces to contract concept "${sourceContractConcept}".`
      : `Module "${moduleId}" cites contract concept "${sourceContractConcept}" which no longer exists in the contract.`,
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
  // Navigation Computation Collapse V1 — the approved, post-repair navigation plan
  // (`ApprovedNavigationPlan.navigationItems`) is checked FIRST and ADDITIONALLY to the original
  // pre-repair `navigationPlan` check below; it can only ever prove more navigation items
  // traceable (it is always a strict subset of `navigationPlan`), never weaken this check.
  const approvedNavEntry =
    cbga?.approvedNavigationPlan.navigationItems.find((n) => n.label === label) ?? null;
  const legacyNavEntry = cbga?.navigationPlan.find((n) => n.label === label) ?? null;
  const navEntry = approvedNavEntry ?? legacyNavEntry;
  const chain: GpcaProvenanceLink[] = [
    link(label, 'NAVIGATION_GENERATOR', 'CbgaRoutePlanEntry', 'ApprovedNavigationPlan.navigationItems', navEntry?.sourceContractConcept ?? null),
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
  // Identity Computation Collapse V1 — additive only. The original check (exact equality against
  // the canonical contract's own productIdentity) is preserved verbatim as the first branch of the
  // OR; this can only ever prove MORE titles traceable, never fewer, because
  // `approvedIdentity.displayName` is itself CBGA's own repaired output derived from this same
  // contract (see approved-product-identity.ts) — it never introduces a new, independent source of
  // truth. Never weakens GPCA: a title that fails both checks still fails.
  const approvedDisplayName = evidence.cbgaReport?.approvedIdentity?.displayName ?? null;
  const approvedMetadataTitle = evidence.cbgaReport?.approvedMetadataPlan?.applicationTitle ?? null;
  const proven =
    evidence.proposed.appTitle === evidence.contract.productIdentity ||
    (approvedDisplayName !== null && evidence.proposed.appTitle === approvedDisplayName) ||
    (approvedMetadataTitle !== null && evidence.proposed.appTitle === approvedMetadataTitle);
  const chain: GpcaProvenanceLink[] = [
    link(evidence.proposed.appTitle, 'MATERIALIZATION', 'buildPlan.extraction.appName', 'CanonicalProductContract.productIdentity', evidence.contract.productIdentity),
    ...(approvedDisplayName !== null
      ? [link(evidence.proposed.appTitle, 'MATERIALIZATION', 'buildPlan.extraction.appName', 'ApprovedProductIdentity.displayName', approvedDisplayName)]
      : []),
    ...(approvedMetadataTitle !== null
      ? [link(evidence.proposed.appTitle, 'MATERIALIZATION', 'buildPlan.extraction.appName', 'ApprovedMetadataPlan.applicationTitle', approvedMetadataTitle)]
      : []),
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

function metadataTraceability(evidence: GpcaPipelineEvidenceInput): GpcaTraceabilityResult {
  const cbga = evidence.cbgaReport;
  const metadataPlan = cbga?.approvedMetadataPlan ?? null;
  const chain: GpcaProvenanceLink[] = [
    link(
      'build metadata',
      'MATERIALIZATION',
      'ApprovedProductIdentity + ApprovedNavigationPlan + ApprovedModulePlan + CanonicalProductContract',
      'ApprovedMetadataPlan',
      metadataPlan?.contractId ?? null,
    ),
  ];
  if (!cbga || !metadataPlan) {
    return {
      readOnly: true,
      artifact: 'build metadata',
      artifactKind: 'METADATA',
      proven: false,
      chain,
      brokenAtLink: 'CONTRACT_BOUND_GENERATION_AUTHORITY',
      reason: 'No CBGA approved metadata plan was supplied — build metadata cannot be traced to a composed handoff.',
    };
  }
  const titleConsistent = metadataPlan.applicationTitle === cbga.approvedIdentity.displayName;
  const moduleCountConsistent = metadataPlan.approvedModuleCount === cbga.approvedModulePlan.moduleIds.length;
  const navigationCountConsistent =
    metadataPlan.approvedNavigationCount === cbga.approvedNavigationPlan.productEntries.length;
  const proven = titleConsistent && moduleCountConsistent && navigationCountConsistent;
  return {
    readOnly: true,
    artifact: 'build metadata',
    artifactKind: 'METADATA',
    proven,
    chain: [
      ...chain,
      link(metadataPlan.applicationTitle, 'CONTRACT_BOUND_GENERATION_AUTHORITY', 'ApprovedProductIdentity.displayName', 'ApprovedMetadataPlan.applicationTitle', cbga.approvedIdentity.productIdentity),
    ],
    brokenAtLink: proven ? null : 'CONTRACT_BOUND_GENERATION_AUTHORITY',
    reason: proven
      ? `Build metadata traces to ApprovedMetadataPlan composed from ApprovedProductIdentity, ApprovedNavigationPlan, ApprovedModulePlan, and contract "${metadataPlan.contractId}".`
      : `ApprovedMetadataPlan is structurally inconsistent with its source handoffs (title=${titleConsistent}, moduleCount=${moduleCountConsistent}, navigationCount=${navigationCountConsistent}).`,
  };
}

function sampleDataTraceability(evidence: GpcaPipelineEvidenceInput): GpcaTraceabilityResult {
  const cbga = evidence.cbgaReport;
  const samplePlan = cbga?.approvedSampleDataPlan ?? null;
  const chain: GpcaProvenanceLink[] = [
    link(
      'sample data',
      'MATERIALIZATION',
      'ApprovedProductIdentity + ApprovedNavigationPlan + ApprovedModulePlan + ApprovedMetadataPlan + CanonicalProductContract',
      'ApprovedSampleDataPlan',
      samplePlan?.traceability.contractId ?? null,
    ),
  ];
  if (!cbga || !samplePlan) {
    return {
      readOnly: true,
      artifact: 'sample data',
      artifactKind: 'SAMPLE_DATA',
      proven: false,
      chain,
      brokenAtLink: 'CONTRACT_BOUND_GENERATION_AUTHORITY',
      reason: 'No CBGA approved sample data plan was supplied — sample/demo/preview data cannot be traced to a composed handoff.',
    };
  }
  const titleConsistent = samplePlan.demoAppTitle === cbga.approvedIdentity.displayName;
  const moduleIdsConsistent =
    samplePlan.demoFeatureModuleIds.length === cbga.approvedModulePlan.moduleIds.length &&
    samplePlan.demoFeatureModuleIds.every(
      (moduleId, index) => moduleId === cbga.approvedModulePlan.moduleIds[index],
    );
  const samplesFlagConsistent = samplePlan.approvedSamplesPresent === samplePlan.traceability.samplesPresent;
  const proven = titleConsistent && moduleIdsConsistent && samplesFlagConsistent;
  return {
    readOnly: true,
    artifact: 'sample data',
    artifactKind: 'SAMPLE_DATA',
    proven,
    chain: [
      ...chain,
      link(
        samplePlan.sampleSummary,
        'CONTRACT_BOUND_GENERATION_AUTHORITY',
        'ApprovedSampleDataPlan.sampleSummary',
        'ApprovedSampleDataPlan.approvedSamplesPresent',
        String(samplePlan.approvedSamplesPresent),
      ),
    ],
    brokenAtLink: proven ? null : 'CONTRACT_BOUND_GENERATION_AUTHORITY',
    reason: proven
      ? `Sample data traces to ApprovedSampleDataPlan composed from prior handoffs and contract "${samplePlan.traceability.contractId}".`
      : `ApprovedSampleDataPlan is structurally inconsistent with its source handoffs (title=${titleConsistent}, moduleIds=${moduleIdsConsistent}, samplesFlag=${samplesFlagConsistent}).`,
  };
}

function repairRealityTraceability(evidence: GpcaPipelineEvidenceInput): GpcaTraceabilityResult {
  const repairPlan = evidence.cbgaReport?.approvedRepairRealityPlan ?? null;
  const chain: GpcaProvenanceLink[] = [
    link(
      'repair reality',
      'CONTRACT_BOUND_GENERATION_AUTHORITY',
      'CbgaRepairAction[] + orchestrator classified post-CBGA repairs',
      'ApprovedRepairRealityPlan',
      repairPlan?.contractId ?? null,
    ),
  ];
  if (!repairPlan || !isApprovedRepairRealityPlanValid(repairPlan)) {
    return {
      readOnly: true,
      artifact: 'repair reality',
      artifactKind: 'REPAIR_REALITY',
      proven: false,
      chain,
      brokenAtLink: 'CONTRACT_BOUND_GENERATION_AUTHORITY',
      reason: 'No structurally valid ApprovedRepairRealityPlan was supplied — repair classification cannot be proven.',
    };
  }
  const summaryEntry = repairPlan.traceabilityEntries.find((entry) => entry.key === 'repairSummary');
  const proven =
    summaryEntry?.value === repairPlan.repairSummary &&
    repairPlan.repairEntries.every((entry) => entry.immutable === true);
  return {
    readOnly: true,
    artifact: 'repair reality',
    artifactKind: 'REPAIR_REALITY',
    proven,
    chain: [
      ...chain,
      link(
        'repair reality',
        'CONTRACT_BOUND_GENERATION_AUTHORITY',
        'ApprovedRepairRealityPlan.repairEntries',
        repairPlan.repairSummary,
        repairPlan.contractId,
      ),
    ],
    brokenAtLink: proven ? null : 'CONTRACT_BOUND_GENERATION_AUTHORITY',
    reason: proven
      ? `Repair reality proven — ${repairPlan.repairEntries.length} classified repair(s); workspace mutations=${repairPlan.repairEntries.filter((e) => e.workspaceMutated).length}.`
      : 'ApprovedRepairRealityPlan traceability integrity check failed.',
  };
}

function productionBuildEnvelopeTraceability(evidence: GpcaPipelineEvidenceInput): GpcaTraceabilityResult {
  const envelope = evidence.cbgaReport?.approvedProductionBuildEnvelope ?? null;
  const chain: GpcaProvenanceLink[] = [
    link(
      'production build envelope',
      'CONTRACT_BOUND_GENERATION_AUTHORITY',
      'CanonicalProductContract + all approved handoffs',
      'ApprovedProductionBuildEnvelope',
      envelope?.traceability.contractId ?? null,
    ),
  ];
  if (!isApprovedProductionBuildEnvelopeValid(envelope)) {
    return {
      readOnly: true,
      artifact: 'production build envelope',
      artifactKind: 'PRODUCTION_BUILD_ENVELOPE',
      proven: false,
      chain,
      brokenAtLink: 'CONTRACT_BOUND_GENERATION_AUTHORITY',
      reason: 'No structurally valid ApprovedProductionBuildEnvelope was supplied — constitutional handoffs cannot be traced to a single immutable envelope.',
    };
  }
  const handoffs = [
    envelope.approvedProductIdentity,
    envelope.approvedNavigationPlan,
    envelope.approvedModulePlan,
    envelope.approvedMetadataPlan,
    envelope.approvedSampleDataPlan,
    envelope.approvedProvenancePlan,
    envelope.approvedRepairRealityPlan,
  ];
  const buildIdsConsistent = handoffs.every((handoff) => handoff.buildId === envelope.buildId);
  const promptHashesConsistent = handoffs.every((handoff) => handoff.promptHash === envelope.promptHash);
  const proven = buildIdsConsistent && promptHashesConsistent && envelope.immutable === true;
  return {
    readOnly: true,
    artifact: 'production build envelope',
    artifactKind: 'PRODUCTION_BUILD_ENVELOPE',
    proven,
    chain: [
      ...chain,
      link(
        envelope.traceability.envelopeSummary,
        'CONTRACT_BOUND_GENERATION_AUTHORITY',
        'ApprovedProductionBuildEnvelope.buildFingerprint',
        envelope.pipelineState.currentState,
        envelope.buildFingerprint,
      ),
    ],
    brokenAtLink: proven ? null : 'CONTRACT_BOUND_GENERATION_AUTHORITY',
    reason: proven
      ? `Production build envelope proven — state=${envelope.pipelineState.currentState}; ${handoffs.length} handoff(s) agree on buildId/promptHash.`
      : `ApprovedProductionBuildEnvelope integrity failed (buildIds=${buildIdsConsistent}, promptHashes=${promptHashesConsistent}).`,
  };
}

/**
 * Builds the full ancestry chain for every proposed module, route, navigation item, the app title,
 * the primary surface, the composed build metadata, the composed sample data plan, repair reality,
 * and the immutable production build envelope.
 * Deterministic: the same evidence always yields the same chains in the same order.
 */
export function buildContractTraceabilityChains(evidence: GpcaPipelineEvidenceInput): GpcaTraceabilityResult[] {
  const provenancePlan = evidence.cbgaReport?.approvedProvenancePlan ?? null;
  if (isApprovedProvenancePlanValid(provenancePlan)) {
    const projected = projectTraceabilityFromApprovedProvenancePlan(provenancePlan, evidence);
    if (projected) {
      return [...projected, repairRealityTraceability(evidence), productionBuildEnvelopeTraceability(evidence)];
    }
  }

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
  results.push(metadataTraceability(evidence));
  results.push(sampleDataTraceability(evidence));
  results.push(provenanceTraceability(evidence));
  results.push(repairRealityTraceability(evidence));
  results.push(productionBuildEnvelopeTraceability(evidence));
  return results;
}
