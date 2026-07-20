/**
 * Production Pipeline Constitution V1 — types.
 *
 * This module is a machine-readable mirror of `docs/production-pipeline-constitution-v1.md`.
 * It exists so the constitution's completeness can be verified structurally (every required
 * section has real entries, not just a markdown heading), not merely by grepping prose.
 *
 * This is a documentation/architecture milestone: nothing here audits, gates, repairs, or
 * generates production output. It never imports from GPCA/CBGA/Product Faithfulness/AEO/EIAA/
 * VERE, and nothing in those authorities imports from here.
 */

export interface StageOwnershipEntry {
  readonly concept: string;
  readonly owningStage: string;
  readonly consumers: readonly string[];
}

export interface ImmutableArtifactEntry {
  readonly artifact: string;
  readonly approvedBy: string;
  readonly immutableFrom: string;
}

export interface StagePermissionEntry {
  readonly stage: string;
  readonly allowedInputs: readonly string[];
  readonly forbiddenInputs: readonly string[];
  readonly allowedOutputs: readonly string[];
  readonly forbiddenOutputs: readonly string[];
  readonly inferenceAllowed: boolean;
  readonly fallbackAllowed: boolean;
  readonly mutationAllowed: boolean;
  readonly repairAllowed: boolean;
  readonly previewAllowed: boolean;
}

export interface GeneratorRuleEntry {
  readonly id: string;
  readonly rule: string;
}

export type RepairCategoryId =
  | 'EVIDENCE_ONLY'
  | 'GENERATION'
  | 'WORKSPACE'
  | 'COMPILER'
  | 'RUNTIME'
  | 'MISSING_CAPABILITY';

export interface RepairCategoryEntry {
  readonly categoryId: RepairCategoryId;
  readonly label: string;
  readonly allowedScope: string;
  readonly forbiddenScope: string;
  readonly canMutateFiles: boolean;
  readonly gpcaReauditRequired: boolean;
  readonly productFaithfulnessReauditRequired: boolean;
  readonly previewMayProceedAfter: string;
}

export interface ReauditTriggerEntry {
  readonly id: string;
  readonly trigger: string;
}

export interface ContinuationRuleEntry {
  readonly id: string;
  readonly rule: string;
}

export interface TraceabilityChainStep {
  readonly order: number;
  readonly step: string;
}

export interface ClassificationBoundaryEntry {
  readonly boundary: string;
  readonly rule: string;
}

export interface PreviewRuleEntry {
  readonly id: number;
  readonly rule: string;
}

export interface FinalResultLabelEntry {
  readonly id: number;
  readonly label: string;
  readonly description: string;
}

export type RootCauseCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export interface RootCauseMappingEntry {
  readonly code: RootCauseCode;
  readonly name: string;
  readonly constitutionalRule: string;
  readonly stagesAffected: readonly string[];
  readonly implementationImplication: string;
  readonly suggestedMilestone: string;
}

export interface RoadmapTierEntry {
  readonly tier: number;
  readonly name: string;
  readonly objective: string;
  readonly affectedSystems: readonly string[];
  readonly whyBeforeLater: string;
  readonly blockersEliminated: string;
  readonly validationStrategy: string;
}

/** Same shape as GPCA's own `CapabilityMatrixRow` (generation-pipeline-compliance-report.ts),
 * defined independently here rather than imported, so this module never depends on GPCA. */
export interface ConstitutionCapabilityMatrixRow {
  readonly capability: string;
  readonly status: string;
  readonly productionWired: string;
  readonly autoRun: string;
  readonly activationAllowed: string;
  readonly notes: string;
}

// =====================================================================================================
// Amendment Set 1 — Rule IDs, Rule Metadata, Constitutional Invariants, State Machine, PPCEA, Governance
// =====================================================================================================

export type RuleSeverity = 'BLOCKING' | 'STRUCTURAL' | 'ADVISORY';
export type AutoFixEligibility = 'YES' | 'NO' | 'PARTIAL';

/** The permanent hundred-block groups every rule ID belongs to (Amendment 2). Never renumbered. */
export interface RuleIdGroup {
  readonly prefix: string;
  readonly name: string;
  readonly sectionAnchor: string;
}

/**
 * A single permanently-identified constitutional rule (Amendment 2 + Amendment 3).
 * `id` is permanent and MUST never be reused, even if the rule is later deprecated (Amendment 9).
 */
export interface RuleRegistryEntry {
  readonly id: string;
  readonly group: string;
  readonly statement: string;
  readonly owner: string;
  readonly validator: string;
  readonly severity: RuleSeverity;
  readonly autoFixEligible: AutoFixEligibility;
  readonly rationale: string;
  readonly deprecated?: boolean;
  readonly supersededBy?: string;
}

/** The standard metadata field schema every rule follows (Amendment 3). Documentation-only. */
export interface RuleMetadataFieldDefinition {
  readonly field: string;
  readonly description: string;
}

/** A timeless architectural invariant (Amendment 6). */
export interface ConstitutionalInvariantEntry {
  readonly id: string;
  readonly statement: string;
  readonly relatedRuleGroup: string;
}

/** A node in the Canonical Pipeline State Machine (Amendment 5). */
export interface PipelineStateEntry {
  readonly state: string;
  readonly description: string;
  readonly terminal: boolean;
}

/** A legal edge in the Canonical Pipeline State Machine (Amendment 5). */
export interface PipelineTransitionEntry {
  readonly from: string;
  readonly to: string;
  readonly condition: string;
}

/** An explicitly forbidden edge in the Canonical Pipeline State Machine (Amendment 5). */
export interface IllegalPipelineTransitionEntry {
  readonly from: string;
  readonly to: string;
  readonly reason: string;
}

/** The Production Pipeline Constitution Enforcement Authority definition (Amendment 1). */
export interface EnforcementAuthorityDefinition {
  readonly name: string;
  readonly abbreviation: string;
  readonly implemented: boolean;
  readonly mandate: string;
  readonly validates: readonly string[];
  readonly doesNotReplace: string;
}

/** A rule governing how the constitution itself may change (Amendment 9). */
export interface GovernanceRuleEntry {
  readonly id: string;
  readonly rule: string;
}

/** One entry in the permanent amendment log (Amendment 9). */
export interface AmendmentLogEntry {
  readonly amendmentSet: string;
  readonly date: string;
  readonly summary: string;
}

/** The Purpose/History/Expected-Failure-Prevented documentation format (Amendment 7). */
export interface RuleDocumentationExample {
  readonly ruleId: string;
  readonly purpose: string;
  readonly history: string;
  readonly expectedFailurePrevented: string;
}

// =====================================================================================================
// Amendment Set 2 — Single Source of Truth Registry, Pipeline Data Contract, Generator/Authority
// Interface Standards, Capability Registry, Violation Taxonomy, Dependency Graph, Versioning,
// No Parallel Truth, Constitutional Test Matrix, extended Governance.
// =====================================================================================================

/**
 * Amendment 1 (Set 2) — one row of the Single Source of Truth Registry. Every production concept
 * must resolve to exactly one row here; a concept with two rows (two constitutional owners) is
 * itself a constitutional violation of this registry's own purpose.
 */
export interface SingleSourceOfTruthRegistryEntry {
  readonly concept: string;
  readonly constitutionalOwner: string;
  readonly consumers: readonly string[];
  readonly mayMutate: string;
  readonly validator: string;
  readonly pipelineStage: string;
  readonly constitutionRuleIds: readonly string[];
}

/**
 * Amendment 2 (Set 2) — one immutable object in the Canonical Pipeline Data Contract. Documents the
 * object's owner/producer/consumers and which of its fields are immutable vs. still-mutable at the
 * point it is produced, so future implementations consume it rather than reconstructing an
 * equivalent object independently (the exact failure mode Amendment 9's No Parallel Truth
 * principle forbids).
 */
export interface PipelineDataContractEntry {
  readonly order: number;
  readonly object: string;
  readonly owner: string;
  readonly producer: string;
  readonly consumers: readonly string[];
  readonly immutableFields: readonly string[];
  readonly mutableFields: readonly string[];
  readonly version: string;
  readonly validation: string;
  readonly provenance: string;
}

/** A single standard-schema field shared by the Generator Interface Standard / Authority Interface Standard (Amendments 3-4). */
export interface InterfaceFieldDefinition {
  readonly field: string;
  readonly description: string;
}

/**
 * Amendment 5 (Set 2) — one row of the Constitutional Capability Registry. Every production
 * capability (an authority, generator, or repair system) must be registered here exactly once.
 */
export interface CapabilityRegistryEntry {
  readonly capability: string;
  readonly owner: string;
  readonly purpose: string;
  readonly pipelineStage: string;
  readonly validator: string;
  readonly autoFixEligible: AutoFixEligibility;
  readonly engineeringIntelligenceEligible: boolean;
  readonly currentStatus: string;
  readonly dependencies: readonly string[];
}

/** Amendment 6 (Set 2) — one primary category of the constitutional Violation Taxonomy. */
export interface ViolationTaxonomyEntry {
  readonly id: string;
  readonly category: string;
  readonly description: string;
  readonly exampleRuleIds: readonly string[];
}

/**
 * Amendment 7 (Set 2) — one authority's row in the Constitutional Dependency Graph. `dependsOn`/
 * `requiredBefore`/`requiredAfter`/`producesFor`/`consumesFrom` make legal execution order explicit;
 * `forbiddenDependencies` names the exact illegal-order mistakes this row exists to rule out.
 */
export interface DependencyGraphEntry {
  readonly authority: string;
  readonly dependsOn: readonly string[];
  readonly requiredBefore: readonly string[];
  readonly requiredAfter: readonly string[];
  readonly producesFor: readonly string[];
  readonly consumesFrom: readonly string[];
  readonly forbiddenDependencies: readonly string[];
}

export type ConstitutionHistoricalStatus = 'CURRENT' | 'SUPERSEDED' | 'DRAFT';

/** Amendment 8 (Set 2) — one entry in the Constitution's own version history. */
export interface ConstitutionVersionEntry {
  readonly version: string;
  readonly majorVersion: number;
  readonly minorVersion: number;
  readonly patchVersion: number;
  readonly ratificationDate: string;
  readonly supersededBy: string | null;
  readonly historicalStatus: ConstitutionHistoricalStatus;
  readonly summary: string;
}

export type TestMatrixCoverageStatus = 'COMPLETE' | 'PARTIAL' | 'NONE';
export type TestMatrixImplementationStatus = 'IMPLEMENTED' | 'PARTIAL' | 'NOT_IMPLEMENTED';

/**
 * Amendment 10 (Set 2) — one row of the Constitutional Test Matrix. Deliberately derived
 * mechanically from `RULE_REGISTRY` (never hand-maintained as a second, independent list) so it can
 * never drift out of sync with the rule registry itself — the exact "No Parallel Truth" discipline
 * (Amendment 9) applied to the matrix's own construction.
 */
export interface ConstitutionalTestMatrixEntry {
  readonly ruleId: string;
  readonly validator: string;
  readonly coverageStatus: TestMatrixCoverageStatus;
  readonly implementationStatus: TestMatrixImplementationStatus;
  readonly owner: string;
  readonly pipelineStage: string;
}
