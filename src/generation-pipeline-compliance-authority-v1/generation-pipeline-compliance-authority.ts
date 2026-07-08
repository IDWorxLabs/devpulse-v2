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
  type GpcaComplianceReport,
  type GpcaPipelineEvidenceInput,
} from './generation-pipeline-compliance-types.js';

export function runGenerationPipelineComplianceAuthority(evidence: GpcaPipelineEvidenceInput): GpcaComplianceReport {
  const stages = discoverGenerationPipelineStages(evidence);
  const traceability = buildContractTraceabilityChains(evidence);
  const { scores, overallCompliancePercent } = scorePipeline(stages, traceability);
  const gate = runGenerationPipelineComplianceGate(evidence, stages, scores, traceability, overallCompliancePercent);

  const phase: GpcaComplianceReport['phase'] =
    evidence.proposed.generatedFilePaths.length > 0 ? 'POST_MATERIALIZATION' : 'PRE_MATERIALIZATION';

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
    finalGateOutcome: gate.outcome,
    blockedReasons: gate.outcome === 'COMPLIANCE_ALLOWED' ? [] : gate.reasons,
    overallCompliancePercent,
    phase,
    generatedAt: new Date().toISOString(),
  };
}
