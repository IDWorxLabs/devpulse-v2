/**
 * Contract-to-Module Traceability Authority V1 — deterministic report generation.
 */

import type {
  ContractToModuleTraceabilityGraph,
  ContractToModuleTraceabilityReport,
  TraceabilityComplianceOutcome,
  CanonicalBuildOutcome,
} from './contract-to-module-traceability-types.js';
import { fingerprintTraceabilityValue } from './contract-to-module-identity.js';
import { reconcileApprovedAndGeneratedModules } from './contract-to-module-output-reconciliation.js';
import { generateTraceabilityFindings } from './contract-to-module-findings.js';
import { buildTraceabilityDiagnostics } from './contract-to-module-diagnostics.js';

function resolveComplianceOutcome(graph: ContractToModuleTraceabilityGraph): TraceabilityComplianceOutcome {
  if (graph.findings.some((f) => f.diagnosticCode === 'generated_module_not_in_cbga_plan')) return 'TRACEABILITY_BLOCKED';
  if (graph.findings.some((f) => f.regenerationStage === 'FEATURE_CONTRACT')) return 'REGENERATION_REQUIRED';
  if (graph.findings.some((f) => f.regenerationStage === 'CBGA')) return 'REGENERATION_REQUIRED';
  if (graph.findings.some((f) => f.regenerationStage === 'MATERIALIZATION')) return 'REGENERATION_REQUIRED';
  if (graph.findings.some((f) => f.severity === 'BLOCKER')) return 'TRACEABILITY_BLOCKED';
  return 'TRACEABILITY_COMPLIANT';
}

function resolveBuildOutcome(compliance: TraceabilityComplianceOutcome): CanonicalBuildOutcome {
  if (compliance === 'TRACEABILITY_COMPLIANT') return 'BUILD_SUCCEEDED';
  if (compliance === 'REGENERATION_REQUIRED') return 'BUILD_REGENERATION_REQUIRED';
  if (compliance === 'NEW_CAPABILITY_REQUIRED') return 'BUILD_REQUIRES_NEW_CAPABILITY';
  if (compliance === 'HUMAN_DECISION_REQUIRED') return 'BUILD_REQUIRES_HUMAN_DECISION';
  return 'BUILD_BLOCKED_TRACEABILITY';
}

export function generateTraceabilityReport(graph: ContractToModuleTraceabilityGraph): ContractToModuleTraceabilityReport {
  const dedupedFindings = generateTraceabilityFindings(graph.findings);
  const graphWithDeduped = { ...graph, findings: dedupedFindings };
  const reconciliation = reconcileApprovedAndGeneratedModules(graphWithDeduped);
  const preservedConceptCount = graph.conceptPreservation.filter((c) => c.outcome.startsWith('PRESERVED')).length;
  const missingConceptCount = graph.conceptPreservation.filter((c) => c.outcome.startsWith('MISSING')).length;
  const complianceOutcome = resolveComplianceOutcome(graphWithDeduped);
  const buildOutcome = resolveBuildOutcome(complianceOutcome);
  const repairableFindings = dedupedFindings.filter((f) => f.repairEligibility.includes('WIRING') || f.repairEligibility.includes('REGISTRATION'));
  const regenerationRequiredFindings = dedupedFindings.filter((f) => f.regenerationStage !== null);

  const reportBase = {
    graph: graphWithDeduped,
    expectedConceptCount: graph.conceptPreservation.length,
    preservedConceptCount,
    missingConceptCount,
    expectedModuleCount: reconciliation.expected,
    generatedApprovedModuleCount: reconciliation.generatedApproved,
    missingModuleCount: reconciliation.missing,
    unapprovedModuleCount: reconciliation.unapproved,
    traceabilityCompleteness: reconciliation.completeness,
    complianceOutcome,
    buildOutcome,
    repairableFindings,
    regenerationRequiredFindings,
    diagnostics: [] as { code: string; detail: string }[],
    fingerprint: '',
  };

  const fingerprint = fingerprintTraceabilityValue([
    graph.fingerprint,
    complianceOutcome,
    buildOutcome,
    String(dedupedFindings.length),
  ]);

  const report: ContractToModuleTraceabilityReport = {
    ...reportBase,
    readOnly: true,
    fingerprint,
    diagnostics: buildTraceabilityDiagnostics({ ...reportBase, readOnly: true, fingerprint, diagnostics: [] }),
  };

  return report;
}
