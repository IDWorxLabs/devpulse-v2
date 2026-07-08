/**
 * Product Faithfulness V2 — types.
 *
 * Milestone 1 evaluates whether the finished generated application matches the requested
 * product. Milestone 2 goes further: it makes the Canonical Product Contract the single source
 * of truth for product identity and audits every downstream generation stage against it, so
 * product mismatch is caught (and, where mechanically possible, repaired) during generation
 * instead of only being reported after the fact.
 *
 * Deterministic and evidence-driven throughout. No LLM. No new orchestration engine — every
 * exported function here is a plain, synchronous, pure function.
 */

import type { ExtractedProductConcept } from '../product-faithfulness-v1/product-faithfulness-types.js';

export const GENERATION_FAITHFULNESS_V2_CONTRACT = 'PRODUCT_FAITHFULNESS_V2' as const;

/** Generic structural role a requested concept plays — never tied to a specific product domain. */
export type ConceptRole = 'ENTITY' | 'ACTION' | 'WORKFLOW' | 'NAVIGATION' | 'CAPABILITY';

export interface CanonicalConceptRecord {
  readOnly: true;
  concept: string;
  role: ConceptRole;
}

/**
 * The Canonical Product Contract — built once, immediately after prompt understanding, from
 * evidence only. Immutable (deep-frozen) once built. Every downstream stage is audited against
 * it; no stage may rewrite it.
 */
export interface CanonicalProductContract {
  readOnly: true;
  contractVersion: typeof GENERATION_FAITHFULNESS_V2_CONTRACT;
  /** Stable identifier derived from the prompt + extracted concepts — same input, same id. */
  contractId: string;
  productIdentity: string;
  primaryPurpose: string;
  primaryWorkflows: string[];
  coreEntities: string[];
  coreActions: string[];
  navigationExpectations: string[];
  majorFeatureGroups: string[];
  userGoals: string[];
  interactionExpectations: string[];
  businessConcepts: string[];
  allConcepts: CanonicalConceptRecord[];
  allConceptNames: string[];
}

export type ConceptGraphNodeKind = ConceptRole | 'MODULE';

export interface ConceptGraphNode {
  readOnly: true;
  id: string;
  kind: ConceptGraphNodeKind;
  label: string;
}

/** Concepts are connected by evidence (they were requested together, in the same contract), not by product name. */
export interface ConceptGraphEdge {
  readOnly: true;
  from: string;
  to: string;
  relation: string;
}

export interface ConceptGraph {
  readOnly: true;
  nodes: ConceptGraphNode[];
  edges: ConceptGraphEdge[];
}

/** The generation pipeline stages that must remain consistent with the canonical contract. */
export type GenerationStageName =
  | 'ARCHITECTURE'
  | 'FEATURE_CONTRACT'
  | 'GENERATED_MODULES'
  | 'ROUTES'
  | 'NAVIGATION'
  | 'MANIFEST'
  | 'PREVIEW_DOM';

export const GENERATION_STAGE_ORDER: GenerationStageName[] = [
  'ARCHITECTURE',
  'FEATURE_CONTRACT',
  'GENERATED_MODULES',
  'ROUTES',
  'NAVIGATION',
  'MANIFEST',
  'PREVIEW_DOM',
];

export interface GenerationStageEvidence {
  readOnly: true;
  stage: GenerationStageName;
  concepts: ExtractedProductConcept[];
}

export type StageDriftKind = 'NONE' | 'DRIFT' | 'DISAPPEARANCE' | 'SUBSTITUTION';

export type DriftCategory = 'GENERAL' | 'NAVIGATION' | 'ENTITY' | 'WORKFLOW' | 'FEATURE';

export interface StageConsistencyResult {
  readOnly: true;
  stage: GenerationStageName;
  driftCategory: DriftCategory;
  retained: string[];
  missing: string[];
  unexpected: string[];
  retentionRatio: number;
  driftKind: StageDriftKind;
  /** Generic dominance rule: unsupported concepts at least as numerous as retained canonical concepts. */
  dominanceDetected: boolean;
  unexpectedDominantConcepts: string[];
}

export type RepairActionType =
  | 'REGENERATE_FEATURE_MODULE'
  | 'REPAIR_NAVIGATION'
  | 'REPAIR_FEATURE_REGISTRATION'
  | 'REPAIR_MODULE_SELECTION'
  | 'REPAIR_FEATURE_CONTRACT_REFERENCE'
  | 'REPAIR_MANIFEST'
  | 'RERUN_STAGE';

export interface RepairAction {
  readOnly: true;
  type: RepairActionType;
  stage: GenerationStageName;
  concept: string;
  detail: string;
  /** Whether this repair could be mechanically applied from sibling evidence (true) or only planned (false). */
  applied: boolean;
}

export type GenerationConsistencyVerdict = 'CONSISTENT' | 'DRIFTED' | 'SUBSTITUTED' | 'INCONSISTENT';

export interface ConceptSubstitution {
  readOnly: true;
  fromStage: GenerationStageName;
  toStage: GenerationStageName;
  disappearedConcept: string;
  replacedByConcept: string;
}

export interface GenerationFaithfulnessAuditResult {
  readOnly: true;
  contract: CanonicalProductContract;
  stages: StageConsistencyResult[];
  /** Retention ratio at the most downstream evidenced stage. */
  conceptRetentionRatio: number;
  conceptDriftRatio: number;
  conceptsDisappearedBetweenStages: string[];
  conceptSubstitutions: ConceptSubstitution[];
  unexpectedDominantConcepts: string[];
  remainingMissingConcepts: string[];
  verdict: GenerationConsistencyVerdict;
}

export interface GenerationGateResult {
  readOnly: true;
  proceed: boolean;
  initialAudit: GenerationFaithfulnessAuditResult;
  finalAudit: GenerationFaithfulnessAuditResult;
  repairsAttempted: RepairAction[];
  improved: boolean;
}

export interface GenerationFaithfulnessPlainEnglishSummary {
  readOnly: true;
  headline: string;
  reason: string;
}

export interface GenerationFaithfulnessReport {
  readOnly: true;
  contractVersion: typeof GENERATION_FAITHFULNESS_V2_CONTRACT;
  contract: CanonicalProductContract;
  conceptGraph: ConceptGraph;
  audit: GenerationFaithfulnessAuditResult;
  preRepairAudit: GenerationFaithfulnessAuditResult;
  repairsPerformed: RepairAction[];
  recoveredConcepts: string[];
  remainingMissingConcepts: string[];
  unexpectedDominantConcepts: string[];
  conceptRetentionPercent: number;
  conceptDriftPercent: number;
  verdict: GenerationConsistencyVerdict;
  summary: GenerationFaithfulnessPlainEnglishSummary;
}
