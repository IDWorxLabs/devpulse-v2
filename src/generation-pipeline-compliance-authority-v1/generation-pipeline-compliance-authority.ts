/**
 * Generation Pipeline Compliance Authority V1 — main entry point.
 *
 * Orchestrates stage discovery, traceability, scoring, and the compliance gate into one
 * deterministic `GpcaComplianceReport`. This module never generates code and never repairs a
 * generator — its only output is proof (or disproof) that the pipeline obeyed the contract, plus a
 * single gate outcome the caller must actually respect.
 */

import { buildContractTraceabilityChains } from './contract-traceability.js';
import { detectLegacyGeneratorUsage, detectTemplateGeneratorUsage } from './generator-legacy-detection.js';
import { runGenerationPipelineComplianceGate } from './generation-pipeline-compliance-gate.js';
import { scorePipeline } from './pipeline-compliance-scoring.js';
import { discoverGenerationPipelineStages } from './pipeline-stage-discovery.js';
import {
  GENERATION_PIPELINE_COMPLIANCE_AUTHORITY_V1_CONTRACT,
  RENDERED_CONTENT_OUTCOME_TO_GATE_OUTCOME,
  type GpcaComplianceReport,
  type GpcaPipelineEvidenceInput,
} from './generation-pipeline-compliance-types.js';
import type { GpcaRenderedContentAudit } from './rendered-content-types.js';
import type { InfrastructureProductBoundaryAudit } from '../infrastructure-product-boundary-authority-v1/index.js';

/**
 * Rendered Content Evidence Expansion V1 — `renderedContentAudit` is a second, orthogonal evidence
 * layer (real rendered headings/nav/buttons/titles/text, generic template/placeholder/reusable-
 * shell fingerprints — see rendered-content-collector.ts) supplied by the caller when real
 * generated file contents exist. It never weakens the structural gate above: a structural block
 * always wins outright, and rendered-content evidence can only ever turn an otherwise-ALLOWED
 * outcome into a block — it can never turn a structural block into an allow.
 */
export function runGenerationPipelineComplianceAuthority(
  evidence: GpcaPipelineEvidenceInput,
  renderedContentAudit?: GpcaRenderedContentAudit | null,
  boundaryAudit?: InfrastructureProductBoundaryAudit | null,
): GpcaComplianceReport {
  const stages = discoverGenerationPipelineStages(evidence);
  const traceability = buildContractTraceabilityChains(evidence);
  const { scores, overallCompliancePercent } = scorePipeline(stages, traceability);
  const gate = runGenerationPipelineComplianceGate(evidence, stages, scores, traceability, overallCompliancePercent, boundaryAudit);

  const phase: GpcaComplianceReport['phase'] =
    evidence.proposed.generatedFilePaths.length > 0 ? 'POST_MATERIALIZATION' : 'PRE_MATERIALIZATION';

  let finalGateOutcome = gate.outcome;
  let blockedReasons = gate.outcome === 'COMPLIANCE_ALLOWED' ? [] : gate.reasons;

  // Only a structurally-ALLOWED build is even eligible for the rendered-content layer to override —
  // this is strictly additive coverage for builds the structural gate would otherwise have let through.
  if (gate.outcome === 'COMPLIANCE_ALLOWED' && renderedContentAudit && renderedContentAudit.gateOutcome !== 'RENDERED_CONTENT_ALLOWED') {
    finalGateOutcome = RENDERED_CONTENT_OUTCOME_TO_GATE_OUTCOME[renderedContentAudit.gateOutcome];
    blockedReasons = [
      'Generation Pipeline Compliance Authority V1 — Rendered Content Evidence Expansion V1 blocked this build: structure passed, but the rendered output did not.',
      ...renderedContentAudit.blockedReasons,
    ];
  }

  return {
    readOnly: true,
    contractVersion: GENERATION_PIPELINE_COMPLIANCE_AUTHORITY_V1_CONTRACT,
    contractId: evidence.contract.contractId,
    productIdentity: evidence.contract.productIdentity,
    stages,
    scores,
    traceability,
    legacyGeneratorsDetected: gate.legacyGeneratorsDetected.length > 0 ? gate.legacyGeneratorsDetected : detectLegacyGeneratorUsage(stages),
    templateGeneratorsDetected:
      gate.templateGeneratorsDetected.length > 0 ? gate.templateGeneratorsDetected : detectTemplateGeneratorUsage(stages),
    genericShellSurfacesBlocked: gate.genericShellSurfacesBlocked,
    blueprintBypassDetected: gate.blueprintBypassDetected,
    contractBypassDetected: gate.contractBypassDetected,
    finalGateOutcome,
    blockedReasons,
    overallCompliancePercent,
    phase,
    renderedContentAudit: renderedContentAudit ?? null,
    boundaryAudit: boundaryAudit ?? null,
    generatedAt: new Date().toISOString(),
  };
}
