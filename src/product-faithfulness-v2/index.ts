/**
 * Product Faithfulness V2 — public entry point.
 *
 * Milestone 1 evaluates whether the finished generated application matches the requested product.
 * Milestone 2 prevents drift instead of only detecting it: the Canonical Product Contract, built
 * once immediately after prompt understanding, becomes the single source of truth for product
 * identity, and every downstream generation stage is audited against it — with minimal, targeted
 * repair attempted before materialization.
 */

import { buildCanonicalProductContract } from './canonical-product-contract.js';
import { buildConceptGraph } from './product-concept-graph.js';
import { auditGenerationPipeline, buildStageEvidence } from './generation-faithfulness-auditor.js';
import type { GenerationStageRawEvidence } from './generation-faithfulness-auditor.js';
import { repairAndReaudit } from './generation-faithfulness-repair.js';
import { buildGenerationFaithfulnessReport } from './generation-faithfulness-report.js';
import type { ProductFaithfulnessInput } from '../product-faithfulness-v1/product-faithfulness-types.js';
import type { CanonicalProductContract, GenerationFaithfulnessReport, GenerationGateResult } from './generation-faithfulness-types.js';

export { GENERATION_FAITHFULNESS_V2_CONTRACT, GENERATION_STAGE_ORDER } from './generation-faithfulness-types.js';
export type {
  CanonicalConceptRecord,
  CanonicalProductContract,
  ConceptGraph,
  ConceptGraphEdge,
  ConceptGraphNode,
  ConceptGraphNodeKind,
  ConceptRole,
  ConceptSubstitution,
  DriftCategory,
  GenerationConsistencyVerdict,
  GenerationFaithfulnessAuditResult,
  GenerationFaithfulnessPlainEnglishSummary,
  GenerationFaithfulnessReport,
  GenerationGateResult,
  GenerationStageEvidence,
  GenerationStageName,
  RepairAction,
  RepairActionType,
  StageConsistencyResult,
  StageDriftKind,
} from './generation-faithfulness-types.js';

export { buildCanonicalProductContract, classifyConceptRole } from './canonical-product-contract.js';
export { buildConceptGraph } from './product-concept-graph.js';
export {
  auditStageConsistency,
  compareConceptSets,
  detectEntityDrift,
  detectFeatureDrift,
  detectNavigationDrift,
  detectWorkflowDrift,
} from './feature-contract-consistency.js';
export { auditGenerationPipeline, buildStageEvidence } from './generation-faithfulness-auditor.js';
export type { GenerationStageRawEvidence } from './generation-faithfulness-auditor.js';
export { applyMinimalRepairs, repairAndReaudit } from './generation-faithfulness-repair.js';
export { buildGenerationFaithfulnessReport } from './generation-faithfulness-report.js';
export {
  normalizeCapabilityIdentity,
  capabilityIdentitiesMatch,
  isLexicalFragmentOfCapability,
  suppressLexicalFragmentsOfCapabilities,
  matchCapabilityAgainstSurfaces,
  assertFaithfulnessMetricInvariants,
  retentionPercentFromMissing,
} from './verification-accuracy.js';

/**
 * Runs the full Milestone 2 pipeline: build the canonical contract, build the concept graph,
 * audit every evidenced generation stage against it, attempt minimal repair, re-audit, and
 * produce the extended faithfulness report. Pure and synchronous — no orchestration engine.
 */
export function runGenerationFaithfulnessAudit(
  contractInput: ProductFaithfulnessInput,
  stageRawEvidence: GenerationStageRawEvidence[],
): GenerationFaithfulnessReport {
  const contract = buildCanonicalProductContract(contractInput);
  const conceptGraph = buildConceptGraph(contract);
  const stageEvidence = buildStageEvidence(stageRawEvidence);
  const preRepairAudit = auditGenerationPipeline(contract, stageEvidence);
  const { finalAudit, actions } = repairAndReaudit(contract, stageEvidence, preRepairAudit);
  return buildGenerationFaithfulnessReport(contract, conceptGraph, preRepairAudit, finalAudit, actions);
}

/**
 * Generation Gate — intended to run before materialization begins. Audits the given (typically
 * architecture-stage) evidence against the canonical contract; if inconsistent, attempts one
 * minimal repair pass and re-audits. Proceeds only when the contract is already represented, or
 * consistency measurably improved after repair.
 */
export function runGenerationGate(
  contract: CanonicalProductContract,
  stageRawEvidence: GenerationStageRawEvidence[],
): GenerationGateResult {
  const stageEvidence = buildStageEvidence(stageRawEvidence);
  const initialAudit = auditGenerationPipeline(contract, stageEvidence);

  if (initialAudit.verdict === 'CONSISTENT') {
    return { readOnly: true, proceed: true, initialAudit, finalAudit: initialAudit, repairsAttempted: [], improved: false };
  }

  const { finalAudit, actions, improved } = repairAndReaudit(contract, stageEvidence, initialAudit);
  const proceed = finalAudit.verdict === 'CONSISTENT' || improved;
  return { readOnly: true, proceed, initialAudit, finalAudit, repairsAttempted: actions, improved };
}
