/**
 * Contract-Bound Generation Authority V4 — Approved Provenance Plan handoff.
 *
 * Production Pipeline Constitution Adoption Phase 8 — Provenance Computation Collapse V1.
 *
 * PPC-1207 "No Parallel Truth": artifact provenance and ancestry may exist in exactly one
 * authoritative form. This module does not compute any NEW provenance fact and does not add a new
 * authority: it is a pure, deterministic COMPOSITION over every handoff Phases 3–7 already
 * produced — `ApprovedProductIdentity`, `ApprovedNavigationPlan`, `ApprovedModulePlan`,
 * `ApprovedMetadataPlan`, `ApprovedSampleDataPlan` — plus the canonical product contract evidence
 * and CBGA's repaired inputs, packaged into a single, typed, immutable handoff every downstream
 * production stage (GPCA, manifests, engineering report, blueprint generator, materialization) must
 * consume instead of independently reconstructing/inferring/heuristic-matching ancestry of its own.
 */

import type { ApprovedProductIdentity } from './approved-product-identity.js';
import type { ApprovedNavigationPlan } from './approved-navigation-plan.js';
import type { ApprovedModulePlan } from './approved-module-plan.js';
import type { ApprovedMetadataPlan } from './approved-metadata-plan.js';
import type { ApprovedSampleDataPlan } from './approved-sample-data-plan.js';
import type {
  CbgaCanonicalContractEvidence,
  CbgaModulePlanEntry,
  CbgaNavigationPlanItem,
  CbgaRepairedGeneratorInputs,
  CbgaRoutePlanEntry,
  CbgaSurfacePlan,
  CbgaGenerationGateOutcome,
} from './contract-bound-generation-types.js';
import { CBGA_SYSTEM_SHELL_MODULE_IDS } from './contract-bound-generation-types.js';
import { UNIVERSAL_APP_BLUEPRINT_ARTIFACT_PROVENANCE } from '../universal-app-blueprint/universal-app-blueprint-contract-provenance.js';

export const APPROVED_PROVENANCE_PLAN_SOURCE = 'CBGA_COMPOSED_PROVENANCE_PLAN' as const;

export const APPROVED_PROVENANCE_PLAN_SCHEMA_VERSION = '1.0.0' as const;

export const APPROVED_PROVENANCE_PLAN_PROVENANCE_RULE_IDS: readonly string[] = [
  'PPC-101',
  'PPC-201',
  'PPC-202',
  'PPC-401',
  'PPC-402',
  'PPC-1207',
  'PPC-1600',
  'PPC-1601',
  'PPC-1701',
  'PPC-1702',
  'PPC-1703',
  'PPC-1800',
  'PPC-1900',
  'PPC-2100',
  'PPC-2101',
  'PPC-2102',
];

export const APPROVED_PROVENANCE_PLAN_CONSUMERS: readonly string[] = [
  'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY',
  'UNIVERSAL_APP_BLUEPRINT_GENERATOR',
  'UNIVERSAL_APP_BLUEPRINT_PRODUCT_SURFACE',
  'UNIVERSAL_APP_MATERIALIZATION_ENGINE',
  'UNIVERSAL_FEATURE_CONTRACT_INTELLIGENCE',
  'GENERATED_APP_MANIFEST',
  'BLUEPRINT_MANIFEST',
  'BUILD_MANIFEST',
  'FINAL_ENGINEERING_REPORT',
  'LIVE_PREVIEW_GATE',
  'RUNTIME_METADATA',
  'PREVIEW_METADATA',
];

export type ApprovedProvenanceArtifactKind =
  | 'MODULE'
  | 'ROUTE'
  | 'NAVIGATION_ITEM'
  | 'TITLE'
  | 'SURFACE'
  | 'METADATA'
  | 'SAMPLE_DATA'
  | 'PROVENANCE';

export interface ApprovedProvenanceLink {
  readonly artifact: string;
  readonly generatedBy: string;
  readonly inputSource: string;
  readonly derivedFrom: string;
  readonly originContractConcept: string | null;
}

export interface ApprovedProvenanceAncestryChain {
  readonly artifact: string;
  readonly artifactKind: ApprovedProvenanceArtifactKind;
  readonly proven: boolean;
  readonly chain: readonly ApprovedProvenanceLink[];
  readonly brokenAtLink: string | null;
  readonly reason: string;
}

export interface ApprovedProvenanceArtifactEntry {
  readonly artifactId: string;
  readonly relativePath: string;
  readonly kind: string;
  readonly producer: string;
  readonly origin: string;
  readonly source: string;
}

export interface ApprovedProvenanceProducerEntry {
  readonly producerId: string;
  readonly stage: string;
  readonly handoffSource: string;
  readonly source: string;
}

export interface ApprovedProvenanceConsumerEntry {
  readonly consumerId: string;
  readonly stage: string;
  readonly source: string;
}

export interface ApprovedProvenanceOwnershipEntry {
  readonly artifactId: string;
  readonly owningStage: string;
  readonly source: string;
}

export interface ApprovedProvenanceTraceabilityEntry {
  readonly key: string;
  readonly value: string;
  readonly category: 'IDENTITY' | 'MODULE' | 'NAVIGATION' | 'ROUTE' | 'METADATA' | 'SAMPLE' | 'ARTIFACT' | 'VOCABULARY' | 'SUMMARY';
  readonly source: string;
}

export interface ApprovedProvenancePlan {
  readOnly: true;

  artifactEntries: readonly ApprovedProvenanceArtifactEntry[];
  producerEntries: readonly ApprovedProvenanceProducerEntry[];
  consumerEntries: readonly ApprovedProvenanceConsumerEntry[];
  ownershipEntries: readonly ApprovedProvenanceOwnershipEntry[];
  contractReferences: readonly string[];
  traceabilityEntries: readonly ApprovedProvenanceTraceabilityEntry[];
  ancestryChains: readonly ApprovedProvenanceAncestryChain[];
  fingerprints: readonly string[];
  artifactKinds: readonly ApprovedProvenanceArtifactKind[];
  approvedStages: readonly string[];
  pipelineOrigins: readonly string[];
  generationOrigins: readonly string[];
  repairOrigins: readonly string[];
  constitutionalRuleReferences: readonly string[];
  pipelineStateReferences: readonly string[];
  diagnosticOrigins: readonly string[];
  generatedArtifacts: readonly string[];
  renderedArtifacts: readonly string[];
  manifestArtifacts: readonly string[];
  workspaceArtifacts: readonly string[];
  previewArtifacts: readonly string[];
  engineeringArtifacts: readonly string[];

  contractVocabulary: readonly string[];
  cbgaVocabulary: readonly string[];

  provenanceSummary: string;
  contractId: string;
  appTitle: string;
  approvedModuleIds: readonly string[];
  approvedRoutes: readonly string[];
  approvedNavigationLabels: readonly string[];
  finalGateOutcome: CbgaGenerationGateOutcome;

  source: typeof APPROVED_PROVENANCE_PLAN_SOURCE;
  schemaVersion: typeof APPROVED_PROVENANCE_PLAN_SCHEMA_VERSION;
  provenanceRuleIds: readonly string[];
  owningStage: 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4';
  consumers: readonly string[];
  immutable: true;
  promptHash: string | null;
  buildId: string | null;
  generatedAt: string;
}

function link(
  artifact: string,
  generatedBy: string,
  inputSource: string,
  derivedFrom: string,
  originContractConcept: string | null,
): ApprovedProvenanceLink {
  return { artifact, generatedBy, inputSource, derivedFrom, originContractConcept };
}

function composeModuleAncestry(
  contract: CbgaCanonicalContractEvidence,
  modulePlan: ApprovedModulePlan,
  legacyModulePlan: readonly CbgaModulePlanEntry[],
  moduleId: string,
): ApprovedProvenanceAncestryChain {
  if (
    modulePlan.systemShellModuleIds.includes(moduleId) ||
    CBGA_SYSTEM_SHELL_MODULE_IDS.includes(moduleId)
  ) {
    return {
      artifact: moduleId,
      artifactKind: 'MODULE',
      proven: true,
      chain: [
        link(
          moduleId,
          'MODULE_GENERATOR',
          'ApprovedModulePlan.systemShellModuleIds',
          'CBGA_SYSTEM_SHELL_MODULE_IDS',
          moduleId,
        ),
      ],
      brokenAtLink: null,
      reason: `Module "${moduleId}" is a CBGA-allowlisted system-shell infrastructure module.`,
    };
  }
  const approvedEntry = modulePlan.moduleEntries.find((entry) => entry.moduleId === moduleId) ?? null;
  const legacyPlanEntry = legacyModulePlan.find((entry) => entry.moduleId === moduleId) ?? null;
  const sourceContractConcept = approvedEntry?.contractSource ?? legacyPlanEntry?.sourceContractConcept ?? null;
  const chain: ApprovedProvenanceLink[] = [
    link(
      moduleId,
      'MODULE_GENERATOR',
      'ApprovedModulePlan.moduleEntries',
      approvedEntry ? 'ApprovedModulePlan.moduleEntries' : 'CbgaRepairedGeneratorInputs.moduleIds',
      sourceContractConcept,
    ),
  ];
  if (!sourceContractConcept || (!approvedEntry && !legacyPlanEntry?.generationAllowed)) {
    return {
      artifact: moduleId,
      artifactKind: 'MODULE',
      proven: false,
      chain,
      brokenAtLink: 'CONTRACT_BOUND_GENERATION_AUTHORITY',
      reason: `Module "${moduleId}" has no generation-allowed entry in the approved module plan.`,
    };
  }
  chain.push(
    link(sourceContractConcept, 'CONTRACT_BOUND_GENERATION_AUTHORITY', 'CanonicalProductContract', 'Founder Prompt', sourceContractConcept),
  );
  const conceptExists = contract.allConceptNames.includes(sourceContractConcept);
  return {
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

function composeRouteAncestry(
  contract: CbgaCanonicalContractEvidence,
  modulePlan: ApprovedModulePlan,
  legacyModulePlan: readonly CbgaModulePlanEntry[],
  routePlan: readonly CbgaRoutePlanEntry[],
  path: string,
): ApprovedProvenanceAncestryChain {
  const routeEntry = routePlan.find((route) => route.path === path) ?? null;
  const chain: ApprovedProvenanceLink[] = [
    link(path, 'ROUTE_GENERATOR', 'ApprovedModulePlan.routes', 'CbgaRoutePlanEntry', routeEntry?.sourceContractConcept ?? null),
  ];
  if (!routeEntry) {
    return {
      artifact: path,
      artifactKind: 'ROUTE',
      proven: false,
      chain,
      brokenAtLink: 'CONTRACT_BOUND_GENERATION_AUTHORITY',
      reason: `Route "${path}" has no matching entry in the approved route plan.`,
    };
  }
  const moduleResult = composeModuleAncestry(contract, modulePlan, legacyModulePlan, routeEntry.moduleId);
  return {
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

function composeNavigationAncestry(
  navigationPlan: ApprovedNavigationPlan,
  legacyNavigationPlan: readonly CbgaNavigationPlanItem[],
  label: string,
): ApprovedProvenanceAncestryChain {
  const approvedNavEntry = navigationPlan.navigationItems.find((item) => item.label === label) ?? null;
  const legacyNavEntry = legacyNavigationPlan.find((item) => item.label === label) ?? null;
  const navEntry = approvedNavEntry ?? legacyNavEntry;
  const chain: ApprovedProvenanceLink[] = [
    link(label, 'NAVIGATION_GENERATOR', 'ApprovedNavigationPlan.navigationItems', 'CbgaRoutePlanEntry', navEntry?.sourceContractConcept ?? null),
  ];
  if (!navEntry) {
    return {
      artifact: label,
      artifactKind: 'NAVIGATION_ITEM',
      proven: false,
      chain,
      brokenAtLink: 'CONTRACT_BOUND_GENERATION_AUTHORITY',
      reason: `Navigation item "${label}" has no matching entry in the approved navigation plan.`,
    };
  }
  return {
    artifact: label,
    artifactKind: 'NAVIGATION_ITEM',
    proven: true,
    chain,
    brokenAtLink: null,
    reason: `Navigation item "${label}" traces to route "${navEntry.path}" and contract concept "${navEntry.sourceContractConcept}".`,
  };
}

function composeTitleAncestry(
  contract: CbgaCanonicalContractEvidence,
  identity: ApprovedProductIdentity,
  metadataPlan: ApprovedMetadataPlan,
  appTitle: string,
): ApprovedProvenanceAncestryChain {
  const proven =
    appTitle === contract.productIdentity ||
    appTitle === identity.displayName ||
    appTitle === metadataPlan.applicationTitle;
  const chain: ApprovedProvenanceLink[] = [
    link(appTitle, 'MATERIALIZATION', 'CbgaRepairedGeneratorInputs.appTitle', 'CanonicalProductContract.productIdentity', contract.productIdentity),
    link(appTitle, 'MATERIALIZATION', 'CbgaRepairedGeneratorInputs.appTitle', 'ApprovedProductIdentity.displayName', identity.displayName),
    link(appTitle, 'MATERIALIZATION', 'CbgaRepairedGeneratorInputs.appTitle', 'ApprovedMetadataPlan.applicationTitle', metadataPlan.applicationTitle),
  ];
  return {
    artifact: appTitle,
    artifactKind: 'TITLE',
    proven,
    chain,
    brokenAtLink: proven ? null : 'CANONICAL_PRODUCT_CONTRACT',
    reason: proven
      ? `App title "${appTitle}" traces to the approved product identity.`
      : `App title "${appTitle}" does not equal the contract's product identity "${contract.productIdentity}".`,
  };
}

function composeSurfaceAncestry(
  surfacePlan: CbgaSurfacePlan,
  finalGateOutcome: CbgaGenerationGateOutcome,
): ApprovedProvenanceAncestryChain {
  const chain: ApprovedProvenanceLink[] = [
    link('primary surface', 'SURFACE_GENERATOR', 'CbgaSurfacePlan', 'CanonicalProductContract', surfacePlan.sourceContractConcept),
  ];
  const proven = finalGateOutcome === 'GENERATION_ALLOWED';
  return {
    artifact: 'primary surface',
    artifactKind: 'SURFACE',
    proven,
    chain,
    brokenAtLink: proven ? null : 'CONTRACT_BOUND_GENERATION_AUTHORITY',
    reason: proven
      ? `Primary surface traces to contract concept "${surfacePlan.sourceContractConcept}".`
      : `CBGA's final gate outcome was ${finalGateOutcome}, so the surface plan is not proven consistent.`,
  };
}

function composeMetadataAncestry(
  identity: ApprovedProductIdentity,
  navigationPlan: ApprovedNavigationPlan,
  modulePlan: ApprovedModulePlan,
  metadataPlan: ApprovedMetadataPlan,
): ApprovedProvenanceAncestryChain {
  const titleConsistent = metadataPlan.applicationTitle === identity.displayName;
  const moduleCountConsistent = metadataPlan.approvedModuleCount === modulePlan.moduleIds.length;
  const navigationCountConsistent = metadataPlan.approvedNavigationCount === navigationPlan.productEntries.length;
  const proven = titleConsistent && moduleCountConsistent && navigationCountConsistent;
  const chain: ApprovedProvenanceLink[] = [
    link(
      'build metadata',
      'MATERIALIZATION',
      'ApprovedProductIdentity + ApprovedNavigationPlan + ApprovedModulePlan + CanonicalProductContract',
      'ApprovedMetadataPlan',
      metadataPlan.contractId,
    ),
    link(metadataPlan.applicationTitle, 'CONTRACT_BOUND_GENERATION_AUTHORITY', 'ApprovedProductIdentity.displayName', 'ApprovedMetadataPlan.applicationTitle', identity.productIdentity),
  ];
  return {
    artifact: 'build metadata',
    artifactKind: 'METADATA',
    proven,
    chain,
    brokenAtLink: proven ? null : 'CONTRACT_BOUND_GENERATION_AUTHORITY',
    reason: proven
      ? `Build metadata traces to ApprovedMetadataPlan composed from prior handoffs and contract "${metadataPlan.contractId}".`
      : `ApprovedMetadataPlan is structurally inconsistent with its source handoffs (title=${titleConsistent}, moduleCount=${moduleCountConsistent}, navigationCount=${navigationCountConsistent}).`,
  };
}

function composeSampleDataAncestry(
  identity: ApprovedProductIdentity,
  modulePlan: ApprovedModulePlan,
  sampleDataPlan: ApprovedSampleDataPlan,
): ApprovedProvenanceAncestryChain {
  const titleConsistent = sampleDataPlan.demoAppTitle === identity.displayName;
  const moduleIdsConsistent =
    sampleDataPlan.demoFeatureModuleIds.length === modulePlan.moduleIds.length &&
    sampleDataPlan.demoFeatureModuleIds.every((moduleId, index) => moduleId === modulePlan.moduleIds[index]);
  const samplesFlagConsistent = sampleDataPlan.approvedSamplesPresent === sampleDataPlan.traceability.samplesPresent;
  const proven = titleConsistent && moduleIdsConsistent && samplesFlagConsistent;
  const chain: ApprovedProvenanceLink[] = [
    link(
      'sample data',
      'MATERIALIZATION',
      'ApprovedProductIdentity + ApprovedNavigationPlan + ApprovedModulePlan + ApprovedMetadataPlan + CanonicalProductContract',
      'ApprovedSampleDataPlan',
      sampleDataPlan.traceability.contractId,
    ),
    link(
      sampleDataPlan.sampleSummary,
      'CONTRACT_BOUND_GENERATION_AUTHORITY',
      'ApprovedSampleDataPlan.sampleSummary',
      'ApprovedSampleDataPlan.approvedSamplesPresent',
      String(sampleDataPlan.approvedSamplesPresent),
    ),
  ];
  return {
    artifact: 'sample data',
    artifactKind: 'SAMPLE_DATA',
    proven,
    chain,
    brokenAtLink: proven ? null : 'CONTRACT_BOUND_GENERATION_AUTHORITY',
    reason: proven
      ? `Sample data traces to ApprovedSampleDataPlan composed from prior handoffs and contract "${sampleDataPlan.traceability.contractId}".`
      : `ApprovedSampleDataPlan is structurally inconsistent with its source handoffs (title=${titleConsistent}, moduleIds=${moduleIdsConsistent}, samplesFlag=${samplesFlagConsistent}).`,
  };
}

function composeProvenanceAncestry(
  contractId: string,
  composedFrom: readonly string[],
): ApprovedProvenanceAncestryChain {
  const chain: ApprovedProvenanceLink[] = [
    link(
      'artifact provenance',
      'CONTRACT_BOUND_GENERATION_AUTHORITY',
      composedFrom.join(' + '),
      'ApprovedProvenancePlan',
      contractId,
    ),
  ];
  return {
    artifact: 'artifact provenance',
    artifactKind: 'PROVENANCE',
    proven: true,
    chain,
    brokenAtLink: null,
    reason: `Artifact provenance traces to ApprovedProvenancePlan composed from ${composedFrom.join(', ')}.`,
  };
}

/** Projects ancestry chains from the approved provenance plan — never a second derivation site. */
export function ancestryChainsFromApprovedProvenancePlan(
  plan: ApprovedProvenancePlan,
): readonly ApprovedProvenanceAncestryChain[] {
  return plan.ancestryChains;
}

export function buildApprovedProvenancePlan(input: {
  identity: ApprovedProductIdentity;
  navigationPlan: ApprovedNavigationPlan;
  modulePlan: ApprovedModulePlan;
  metadataPlan: ApprovedMetadataPlan;
  sampleDataPlan: ApprovedSampleDataPlan;
  contract: CbgaCanonicalContractEvidence;
  repairedInputs: CbgaRepairedGeneratorInputs;
  legacyModulePlan: readonly CbgaModulePlanEntry[];
  legacyRoutePlan: readonly CbgaRoutePlanEntry[];
  legacyNavigationPlan: readonly CbgaNavigationPlanItem[];
  surfacePlan: CbgaSurfacePlan;
  finalGateOutcome: CbgaGenerationGateOutcome;
  contractDerivationSource?: 'CUSTOM_DOMAIN_COPY' | 'APPROVED_MODULE_PLAN' | 'APP_NAME_ONLY';
  promptHash?: string | null;
  buildId?: string | null;
}): ApprovedProvenancePlan {
  const composedFrom = [
    'ApprovedProductIdentity',
    'ApprovedNavigationPlan',
    'ApprovedModulePlan',
    'ApprovedMetadataPlan',
    'ApprovedSampleDataPlan',
    'CbgaCanonicalContractEvidence',
  ] as const;

  const ancestryChains: ApprovedProvenanceAncestryChain[] = [];
  for (const moduleId of input.repairedInputs.moduleIds) {
    ancestryChains.push(composeModuleAncestry(input.contract, input.modulePlan, input.legacyModulePlan, moduleId));
  }
  for (const route of input.repairedInputs.routes) {
    ancestryChains.push(
      composeRouteAncestry(input.contract, input.modulePlan, input.legacyModulePlan, input.legacyRoutePlan, route),
    );
  }
  for (const label of input.repairedInputs.navigationLabels) {
    ancestryChains.push(composeNavigationAncestry(input.navigationPlan, input.legacyNavigationPlan, label));
  }
  ancestryChains.push(
    composeTitleAncestry(input.contract, input.identity, input.metadataPlan, input.repairedInputs.appTitle),
  );
  ancestryChains.push(composeSurfaceAncestry(input.surfacePlan, input.finalGateOutcome));
  ancestryChains.push(
    composeMetadataAncestry(input.identity, input.navigationPlan, input.modulePlan, input.metadataPlan),
  );
  ancestryChains.push(composeSampleDataAncestry(input.identity, input.modulePlan, input.sampleDataPlan));
  ancestryChains.push(composeProvenanceAncestry(input.contract.contractId, composedFrom));

  const artifactEntries: ApprovedProvenanceArtifactEntry[] = UNIVERSAL_APP_BLUEPRINT_ARTIFACT_PROVENANCE.map(
    (artifact) => ({
      artifactId: artifact.relativePath,
      relativePath: artifact.relativePath,
      kind: artifact.kind,
      producer: 'UNIVERSAL_APP_BLUEPRINT_GENERATOR',
      origin: artifact.reason,
      source: 'UNIVERSAL_APP_BLUEPRINT_ARTIFACT_PROVENANCE',
    }),
  );

  const producerEntries: ApprovedProvenanceProducerEntry[] = [
    { producerId: 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4', stage: 'CBGA', handoffSource: APPROVED_PROVENANCE_PLAN_SOURCE, source: 'ApprovedProvenancePlan.producerEntries' },
    { producerId: 'UNIVERSAL_APP_MATERIALIZATION_ENGINE', stage: 'MATERIALIZATION', handoffSource: APPROVED_PROVENANCE_PLAN_SOURCE, source: 'ApprovedProvenancePlan.producerEntries' },
    { producerId: 'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY', stage: 'COMPLIANCE', handoffSource: APPROVED_PROVENANCE_PLAN_SOURCE, source: 'ApprovedProvenancePlan.producerEntries' },
  ];

  const consumerEntries: ApprovedProvenanceConsumerEntry[] = APPROVED_PROVENANCE_PLAN_CONSUMERS.map((consumerId) => ({
    consumerId,
    stage: consumerId,
    source: 'ApprovedProvenancePlan.consumers',
  }));

  const ownershipEntries: ApprovedProvenanceOwnershipEntry[] = artifactEntries.map((entry) => ({
    artifactId: entry.artifactId,
    owningStage: entry.kind === 'CONTRACT_DERIVED' ? 'MATERIALIZATION' : 'BLUEPRINT_INFRASTRUCTURE',
    source: 'ApprovedProvenancePlan.ownershipEntries',
  }));

  const contractReferences = [
    input.contract.contractId,
    input.contract.productIdentity,
    ...input.contract.businessConcepts,
  ];

  const contractVocabulary = [input.contract.productIdentity, ...input.contract.allConceptNames];
  const cbgaVocabulary = [
    ...input.modulePlan.displayNames,
    ...input.navigationPlan.productEntries,
    ...input.modulePlan.routes,
  ];

  const provenanceSummary = `Provenance for "${input.repairedInputs.appTitle}" — ${ancestryChains.filter((chain) => chain.proven).length}/${ancestryChains.length} ancestry chain(s) proven; contract "${input.contract.contractId}".`;

  const traceabilityEntries: ApprovedProvenanceTraceabilityEntry[] = [
    { key: 'contractId', value: input.contract.contractId, category: 'SUMMARY', source: 'CbgaCanonicalContractEvidence.contractId' },
    { key: 'appTitle', value: input.repairedInputs.appTitle, category: 'IDENTITY', source: 'CbgaRepairedGeneratorInputs.appTitle' },
    { key: 'productIdentity', value: input.identity.productIdentity, category: 'IDENTITY', source: 'ApprovedProductIdentity.productIdentity' },
    { key: 'approvedModuleCount', value: String(input.modulePlan.moduleIds.length), category: 'MODULE', source: 'ApprovedModulePlan.moduleIds.length' },
    { key: 'approvedNavigationCount', value: String(input.navigationPlan.productEntries.length), category: 'NAVIGATION', source: 'ApprovedNavigationPlan.productEntries.length' },
    { key: 'metadataSummary', value: input.metadataPlan.manifestSummary, category: 'METADATA', source: 'ApprovedMetadataPlan.manifestSummary' },
    { key: 'sampleSummary', value: input.sampleDataPlan.sampleSummary, category: 'SAMPLE', source: 'ApprovedSampleDataPlan.sampleSummary' },
    { key: 'contractDerivationSource', value: input.contractDerivationSource ?? 'APP_NAME_ONLY', category: 'ARTIFACT', source: 'deriveBlueprintContractCopy.source' },
    { key: 'finalGateOutcome', value: input.finalGateOutcome, category: 'SUMMARY', source: 'CbgaGenerationReport.finalGateOutcome' },
    { key: 'provenanceSummary', value: provenanceSummary, category: 'SUMMARY', source: 'ApprovedProvenancePlan.provenanceSummary' },
  ];

  const generatedArtifacts = artifactEntries.map((entry) => entry.relativePath);
  const manifestArtifacts = ['.generated-app-manifest.json', 'build-manifest.json', 'blueprint-manifest.json', 'universal-feature-contract.json', 'feature-contract.json'];
  const workspaceArtifacts = ['src/data/demo-data.ts', 'src/blueprint/product-surface.ts', ...generatedArtifacts];
  const previewArtifacts = ['src/main.tsx', 'src/App.tsx'];
  const engineeringArtifacts = ['FINAL_ENGINEERING_REPORT', 'GPCA_COMPLIANCE_REPORT'];
  const renderedArtifacts = generatedArtifacts.filter((path) => path.endsWith('.tsx') || path.endsWith('.ts'));

  const fingerprints = [
    `contract:${input.contract.contractId}`,
    `modules:${input.modulePlan.moduleIds.join(',')}`,
    `routes:${input.modulePlan.routes.join(',')}`,
    `gate:${input.finalGateOutcome}`,
  ];

  return {
    readOnly: true,
    artifactEntries,
    producerEntries,
    consumerEntries,
    ownershipEntries,
    contractReferences,
    traceabilityEntries,
    ancestryChains,
    fingerprints,
    artifactKinds: ['MODULE', 'ROUTE', 'NAVIGATION_ITEM', 'TITLE', 'SURFACE', 'METADATA', 'SAMPLE_DATA', 'PROVENANCE'],
    approvedStages: ['CONTRACT_BOUND_GENERATION_AUTHORITY_V4', 'MATERIALIZATION', 'COMPLIANCE', 'PREVIEW', 'ENGINEERING_REPORT'],
    pipelineOrigins: [...composedFrom],
    generationOrigins: [input.identity.source, input.navigationPlan.source, input.modulePlan.source, input.metadataPlan.source, input.sampleDataPlan.source],
    repairOrigins: input.repairedInputs.actionsPerformed.map((action) => action.actionId),
    constitutionalRuleReferences: [...APPROVED_PROVENANCE_PLAN_PROVENANCE_RULE_IDS],
    pipelineStateReferences: [input.finalGateOutcome, input.contractDerivationSource ?? 'APP_NAME_ONLY'],
    diagnosticOrigins: traceabilityEntries.map((entry) => `${entry.key}=${entry.source}`),
    generatedArtifacts,
    renderedArtifacts,
    manifestArtifacts,
    workspaceArtifacts,
    previewArtifacts,
    engineeringArtifacts,
    contractVocabulary,
    cbgaVocabulary,
    provenanceSummary,
    contractId: input.contract.contractId,
    appTitle: input.repairedInputs.appTitle,
    approvedModuleIds: [...input.repairedInputs.moduleIds],
    approvedRoutes: [...input.repairedInputs.routes],
    approvedNavigationLabels: [...input.repairedInputs.navigationLabels],
    finalGateOutcome: input.finalGateOutcome,
    source: APPROVED_PROVENANCE_PLAN_SOURCE,
    schemaVersion: APPROVED_PROVENANCE_PLAN_SCHEMA_VERSION,
    provenanceRuleIds: APPROVED_PROVENANCE_PLAN_PROVENANCE_RULE_IDS,
    owningStage: 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    consumers: APPROVED_PROVENANCE_PLAN_CONSUMERS,
    immutable: true,
    promptHash: input.promptHash ?? null,
    buildId: input.buildId ?? null,
    generatedAt: new Date().toISOString(),
  };
}

function chainMatchesProposedInputs(plan: ApprovedProvenancePlan): boolean {
  const moduleChains = plan.ancestryChains.filter((chain) => chain.artifactKind === 'MODULE');
  const routeChains = plan.ancestryChains.filter((chain) => chain.artifactKind === 'ROUTE');
  const navChains = plan.ancestryChains.filter((chain) => chain.artifactKind === 'NAVIGATION_ITEM');
  return (
    moduleChains.length === plan.approvedModuleIds.length &&
    routeChains.length === plan.approvedRoutes.length &&
    navChains.length === plan.approvedNavigationLabels.length &&
    plan.ancestryChains.some((chain) => chain.artifactKind === 'TITLE' && chain.artifact === plan.appTitle)
  );
}

export function isApprovedProvenancePlanValid(
  plan: ApprovedProvenancePlan | null | undefined,
): plan is ApprovedProvenancePlan {
  if (!plan) return false;
  if (plan.immutable !== true) return false;
  if (typeof plan.provenanceSummary !== 'string' || plan.provenanceSummary.trim().length === 0) return false;
  if (typeof plan.contractId !== 'string' || plan.contractId.trim().length === 0) return false;
  if (!Array.isArray(plan.ancestryChains) || plan.ancestryChains.length === 0) return false;
  if (!Array.isArray(plan.artifactEntries) || plan.artifactEntries.length === 0) return false;
  if (!Array.isArray(plan.traceabilityEntries) || plan.traceabilityEntries.length === 0) return false;
  if (plan.source !== APPROVED_PROVENANCE_PLAN_SOURCE) return false;
  if (plan.schemaVersion !== APPROVED_PROVENANCE_PLAN_SCHEMA_VERSION) return false;
  if (plan.owningStage !== 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4') return false;
  if (!Array.isArray(plan.contractVocabulary) || plan.contractVocabulary.length === 0) return false;
  if (!Array.isArray(plan.cbgaVocabulary)) return false;
  const entryByKey = new Map(plan.traceabilityEntries.map((entry) => [entry.key, entry.value] as const));
  if (entryByKey.get('contractId') !== plan.contractId) return false;
  if (entryByKey.get('appTitle') !== plan.appTitle) return false;
  if (entryByKey.get('provenanceSummary') !== plan.provenanceSummary) return false;
  if (!chainMatchesProposedInputs(plan)) return false;
  if (plan.manifestArtifacts.length === 0) return false;
  return true;
}

export function requireApprovedProvenancePlan(
  plan: ApprovedProvenancePlan | null | undefined,
  contextLabel: string,
): ApprovedProvenancePlan {
  if (!isApprovedProvenancePlanValid(plan)) {
    throw new Error(
      `CONSTITUTIONAL_VIOLATION_PPC_1207_NO_PARALLEL_TRUTH: ${contextLabel} was invoked downstream of Contract-Bound Generation Authority V4 without a structurally valid approved provenance plan. Fallback/independent provenance reconstruction is forbidden after CBGA approval.`,
    );
  }
  return plan;
}
