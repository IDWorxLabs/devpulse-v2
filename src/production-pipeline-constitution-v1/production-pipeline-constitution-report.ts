/**
 * Production Pipeline Constitution V1 — report + Capability Matrix row.
 *
 * Builds a structural completeness summary of the constitution data and exposes this
 * milestone's own Capability Matrix row. Defined independently of GPCA's
 * `GPCA_CAPABILITY_MATRIX_ROWS` (same row shape, no import) so this module never depends on GPCA.
 */

import type { ConstitutionCapabilityMatrixRow } from './production-pipeline-constitution-types.js';
import {
  AMENDMENT_LOG,
  CAPABILITY_REGISTRY,
  CLASSIFICATION_BOUNDARIES,
  CONSTITUTIONAL_INVARIANTS,
  CONSTITUTIONAL_TEST_MATRIX,
  CONSTITUTION_VERSION_HISTORY,
  CONTINUATION_RULES,
  DEPENDENCY_GRAPH,
  ENFORCEMENT_AUTHORITY,
  FINAL_RESULT_LABELS,
  GENERATOR_INTERFACE_FIELDS,
  GENERATOR_RULES,
  GOVERNANCE_RULES,
  AUTHORITY_INTERFACE_FIELDS,
  IMMUTABLE_ARTIFACTS,
  PIPELINE_DATA_CONTRACT,
  PIPELINE_ILLEGAL_TRANSITIONS,
  PIPELINE_LEGAL_TRANSITIONS,
  PIPELINE_STATES,
  PREVIEW_RULES,
  REAUDIT_TRIGGERS,
  REPAIR_CATEGORIES,
  ROADMAP_TIERS,
  ROOT_CAUSE_MAPPINGS,
  RULE_ID_GROUPS,
  RULE_METADATA_FIELDS,
  RULE_REGISTRY,
  SINGLE_SOURCE_OF_TRUTH_REGISTRY,
  STAGE_OWNERSHIP,
  STAGE_PERMISSIONS,
  TRACEABILITY_CHAIN,
  VIOLATION_TAXONOMY,
} from './production-pipeline-constitution.js';

export interface ProductionPipelineConstitutionCompletenessReport {
  readonly stageOwnershipCount: number;
  readonly immutableArtifactCount: number;
  readonly stagePermissionCount: number;
  readonly generatorRuleCount: number;
  readonly repairCategoryCount: number;
  readonly reauditTriggerCount: number;
  readonly continuationRuleCount: number;
  readonly traceabilityChainLength: number;
  readonly classificationBoundaryCount: number;
  readonly previewRuleCount: number;
  readonly finalResultLabelCount: number;
  readonly rootCauseMappingCount: number;
  readonly roadmapTierCount: number;
  readonly complete: boolean;
}

/**
 * Structural completeness check: every constitution section must have at least the number of
 * entries the constitution document itself commits to (see docs/production-pipeline-constitution-v1.md).
 * This never inspects production behavior — only that the constitution's own data is populated.
 */
export function buildProductionPipelineConstitutionCompletenessReport(): ProductionPipelineConstitutionCompletenessReport {
  const stageOwnershipCount = STAGE_OWNERSHIP.length;
  const immutableArtifactCount = IMMUTABLE_ARTIFACTS.length;
  const stagePermissionCount = STAGE_PERMISSIONS.length;
  const generatorRuleCount = GENERATOR_RULES.length;
  const repairCategoryCount = REPAIR_CATEGORIES.length;
  const reauditTriggerCount = REAUDIT_TRIGGERS.length;
  const continuationRuleCount = CONTINUATION_RULES.length;
  const traceabilityChainLength = TRACEABILITY_CHAIN.length;
  const classificationBoundaryCount = CLASSIFICATION_BOUNDARIES.length;
  const previewRuleCount = PREVIEW_RULES.length;
  const finalResultLabelCount = FINAL_RESULT_LABELS.length;
  const rootCauseMappingCount = ROOT_CAUSE_MAPPINGS.length;
  const roadmapTierCount = ROADMAP_TIERS.length;

  const complete =
    stageOwnershipCount >= 15 &&
    immutableArtifactCount >= 7 &&
    stagePermissionCount >= 7 &&
    generatorRuleCount >= 8 &&
    repairCategoryCount === 6 &&
    reauditTriggerCount === 7 &&
    continuationRuleCount >= 5 &&
    traceabilityChainLength === 7 &&
    classificationBoundaryCount >= 7 &&
    previewRuleCount === 5 &&
    finalResultLabelCount === 7 &&
    rootCauseMappingCount === 8 &&
    roadmapTierCount === 7;

  return {
    stageOwnershipCount,
    immutableArtifactCount,
    stagePermissionCount,
    generatorRuleCount,
    repairCategoryCount,
    reauditTriggerCount,
    continuationRuleCount,
    traceabilityChainLength,
    classificationBoundaryCount,
    previewRuleCount,
    finalResultLabelCount,
    rootCauseMappingCount,
    roadmapTierCount,
    complete,
  };
}

/** This milestone's own Capability Matrix row (mandatory per project convention). */
export const PRODUCTION_PIPELINE_CONSTITUTION_CAPABILITY_MATRIX_ROW: ConstitutionCapabilityMatrixRow = {
  capability: 'Production Pipeline Constitution',
  status: 'DOCUMENTED',
  productionWired: 'NO (architecture/documentation milestone — no production code path reads this module)',
  autoRun: 'N/A',
  activationAllowed: 'N/A',
  notes:
    'Production Pipeline Constitution V1 — defines the single enforced model (Prompt → Canonical Product Contract → Contract-Bound Generation Plan → Generator Inputs → Workspace Artifacts → GPCA Audit → Preview → Final Result) and the rule that no stage downstream of CBGA may independently re-derive product identity, modules, navigation, routes, copy, or feature meaning. Maps all eight Production Generation Architecture Audit V1 root causes (A-H) to a constitutional rule, affected stages, implementation implication, and suggested future milestone, and defines a dependency-ordered Tier 0-6 implementation roadmap. Amendment Set 1 (2026-07-09) restructured the document into three parts (binding Constitution / historical Architecture Audit / non-binding Roadmap), gave every rule a permanent PPC-nnn ID and standard metadata (owner/validator/severity/auto-fix eligibility/rationale), added explicit per-stage Read/Write/Mutate boundaries, a Canonical Pipeline State Machine, six Constitutional Invariants, the Rule Documentation Format, the Production Pipeline Constitution Enforcement Authority (PPCEA — architecturally owned now, implementation deferred), and a Constitution Governance section with a permanent Amendment Log. Amendment Set 2 (2026-07-09) added the Single Source of Truth Registry (PPC-16xx, 16 concepts), the Canonical Pipeline Data Contract (PPC-17xx, 9 objects from Raw Prompt through Engineering Report), the Generator Interface Standard (PPC-18xx) and Authority Interface Standard (PPC-19xx), the Constitutional Capability Registry (PPC-20xx, 12 capabilities), the Violation Taxonomy (PPC-21xx, 11 categories), the Constitutional Dependency Graph (PPC-22xx, 8 authorities), Constitution Versioning (PPC-23xx, V1.0→V1.1→V1.2 history), the No Parallel Truth invariant (PPC-1207) and a Violation Taxonomy completeness invariant (PPC-1208), the Constitutional Test Matrix (PPC-24xx, mechanically derived from RULE_REGISTRY — never a hand-maintained second list), and extended Constitution Governance with Proposal/Review/Version-Release/Archival rules (PPC-1506–PPC-1509). Documentation/architecture only: does not audit, gate, repair, or generate anything, and changes no behavior of GPCA, CBGA, Product Faithfulness, AEO, EIAA, VERE, or any production generator. Future milestones are expected to implement against this document rather than re-discovering the same class of problem generator-by-generator.',
};

/** Amendment Set 1 structural completeness — every new required section has real, non-empty data. */
export interface AmendmentSet1CompletenessReport {
  readonly ruleRegistrySize: number;
  readonly ruleRegistryIdsUnique: boolean;
  readonly ruleIdGroupCount: number;
  readonly ruleMetadataFieldCount: number;
  readonly constitutionalInvariantCount: number;
  readonly pipelineStateCount: number;
  readonly pipelineLegalTransitionCount: number;
  readonly pipelineIllegalTransitionCount: number;
  readonly enforcementAuthorityDefined: boolean;
  readonly governanceRuleCount: number;
  readonly amendmentLogEntryCount: number;
  readonly complete: boolean;
}

export function buildAmendmentSet1CompletenessReport(): AmendmentSet1CompletenessReport {
  const ruleRegistrySize = RULE_REGISTRY.length;
  const ruleRegistryIdsUnique = new Set(RULE_REGISTRY.map((r) => r.id)).size === ruleRegistrySize;
  const ruleIdGroupCount = RULE_ID_GROUPS.length;
  const ruleMetadataFieldCount = RULE_METADATA_FIELDS.length;
  const constitutionalInvariantCount = CONSTITUTIONAL_INVARIANTS.length;
  const pipelineStateCount = PIPELINE_STATES.length;
  const pipelineLegalTransitionCount = PIPELINE_LEGAL_TRANSITIONS.length;
  const pipelineIllegalTransitionCount = PIPELINE_ILLEGAL_TRANSITIONS.length;
  const enforcementAuthorityDefined =
    ENFORCEMENT_AUTHORITY.name.length > 0 && ENFORCEMENT_AUTHORITY.validates.length >= 9 && ENFORCEMENT_AUTHORITY.implemented === false;
  const governanceRuleCount = GOVERNANCE_RULES.length;
  const amendmentLogEntryCount = AMENDMENT_LOG.length;

  // Note (Amendment Set 2): the hundred-block group count, invariant count, and governance rule
  // count are intentionally checked with >= rather than === . Amendment Set 1 established a MINIMUM
  // for its own completeness; later amendment sets (e.g. Amendment Set 2's PPC-16xx-PPC-24xx groups,
  // PPC-1207/1208 invariants, PPC-1506-1509 governance rules) are additive per PPC-1505 (ID
  // permanence) and must never make this earlier report regress from complete=true to false.
  const complete =
    ruleRegistrySize >= 80 &&
    ruleRegistryIdsUnique &&
    ruleIdGroupCount >= 15 &&
    ruleMetadataFieldCount === 6 &&
    constitutionalInvariantCount >= 6 &&
    pipelineStateCount >= 9 &&
    pipelineLegalTransitionCount >= 9 &&
    pipelineIllegalTransitionCount >= 5 &&
    enforcementAuthorityDefined &&
    governanceRuleCount >= 5 &&
    amendmentLogEntryCount >= 2;

  return {
    ruleRegistrySize,
    ruleRegistryIdsUnique,
    ruleIdGroupCount,
    ruleMetadataFieldCount,
    constitutionalInvariantCount,
    pipelineStateCount,
    pipelineLegalTransitionCount,
    pipelineIllegalTransitionCount,
    enforcementAuthorityDefined,
    governanceRuleCount,
    amendmentLogEntryCount,
    complete,
  };
}

/** Amendment Set 2 structural completeness — every new required section has real, non-empty data. */
export interface AmendmentSet2CompletenessReport {
  readonly singleSourceOfTruthRegistryCount: number;
  readonly pipelineDataContractCount: number;
  readonly generatorInterfaceFieldCount: number;
  readonly authorityInterfaceFieldCount: number;
  readonly capabilityRegistryCount: number;
  readonly violationTaxonomyCount: number;
  readonly dependencyGraphCount: number;
  readonly constitutionVersionHistoryCount: number;
  readonly constitutionVersionHistoryExactlyOneCurrent: boolean;
  readonly constitutionalTestMatrixCoversEveryRule: boolean;
  readonly ruleIdGroupCount: number;
  readonly ruleRegistrySize: number;
  readonly ruleRegistryIdsUnique: boolean;
  readonly governanceRuleCount: number;
  readonly amendmentLogEntryCount: number;
  readonly noParallelTruthInvariantPresent: boolean;
  readonly complete: boolean;
}

export function buildAmendmentSet2CompletenessReport(): AmendmentSet2CompletenessReport {
  const singleSourceOfTruthRegistryCount = SINGLE_SOURCE_OF_TRUTH_REGISTRY.length;
  const pipelineDataContractCount = PIPELINE_DATA_CONTRACT.length;
  const generatorInterfaceFieldCount = GENERATOR_INTERFACE_FIELDS.length;
  const authorityInterfaceFieldCount = AUTHORITY_INTERFACE_FIELDS.length;
  const capabilityRegistryCount = CAPABILITY_REGISTRY.length;
  const violationTaxonomyCount = VIOLATION_TAXONOMY.length;
  const dependencyGraphCount = DEPENDENCY_GRAPH.length;
  const constitutionVersionHistoryCount = CONSTITUTION_VERSION_HISTORY.length;
  const constitutionVersionHistoryExactlyOneCurrent = CONSTITUTION_VERSION_HISTORY.filter((v) => v.historicalStatus === 'CURRENT').length === 1;
  const ruleIdsInMatrix = new Set(CONSTITUTIONAL_TEST_MATRIX.map((m) => m.ruleId));
  const constitutionalTestMatrixCoversEveryRule = RULE_REGISTRY.every((r) => ruleIdsInMatrix.has(r.id)) && CONSTITUTIONAL_TEST_MATRIX.length === RULE_REGISTRY.length;
  const ruleIdGroupCount = RULE_ID_GROUPS.length;
  const ruleRegistrySize = RULE_REGISTRY.length;
  const ruleRegistryIdsUnique = new Set(RULE_REGISTRY.map((r) => r.id)).size === ruleRegistrySize;
  const governanceRuleCount = GOVERNANCE_RULES.length;
  const amendmentLogEntryCount = AMENDMENT_LOG.length;
  const noParallelTruthInvariantPresent = CONSTITUTIONAL_INVARIANTS.some((inv) => /no parallel truth/i.test(inv.statement));

  const complete =
    singleSourceOfTruthRegistryCount >= 16 &&
    pipelineDataContractCount >= 9 &&
    generatorInterfaceFieldCount >= 9 &&
    authorityInterfaceFieldCount >= 11 &&
    capabilityRegistryCount >= 12 &&
    violationTaxonomyCount >= 11 &&
    dependencyGraphCount >= 8 &&
    constitutionVersionHistoryCount >= 3 &&
    constitutionVersionHistoryExactlyOneCurrent &&
    constitutionalTestMatrixCoversEveryRule &&
    ruleIdGroupCount === 24 &&
    ruleRegistrySize >= 130 &&
    ruleRegistryIdsUnique &&
    governanceRuleCount === 9 &&
    amendmentLogEntryCount >= 3 &&
    noParallelTruthInvariantPresent;

  return {
    singleSourceOfTruthRegistryCount,
    pipelineDataContractCount,
    generatorInterfaceFieldCount,
    authorityInterfaceFieldCount,
    capabilityRegistryCount,
    violationTaxonomyCount,
    dependencyGraphCount,
    constitutionVersionHistoryCount,
    constitutionVersionHistoryExactlyOneCurrent,
    constitutionalTestMatrixCoversEveryRule,
    ruleIdGroupCount,
    ruleRegistrySize,
    ruleRegistryIdsUnique,
    governanceRuleCount,
    amendmentLogEntryCount,
    noParallelTruthInvariantPresent,
    complete,
  };
}
