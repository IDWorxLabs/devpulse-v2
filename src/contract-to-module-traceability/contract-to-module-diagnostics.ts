/**
 * Contract-to-Module Traceability Authority V1 — diagnostics.
 */

import type { ContractToModuleTraceabilityReport } from './contract-to-module-traceability-types.js';

export function buildTraceabilityDiagnostics(report: ContractToModuleTraceabilityReport): { code: string; detail: string }[] {
  const diagnostics: { code: string; detail: string }[] = [];
  if (report.unapprovedModuleCount > 0) {
    diagnostics.push({ code: 'unapproved_module_introduced', detail: `${report.unapprovedModuleCount} unapproved module(s)` });
  }
  if (report.missingConceptCount > 0) {
    diagnostics.push({ code: 'approved_concept_silently_dropped', detail: `${report.missingConceptCount} missing concept(s)` });
  }
  if (report.complianceOutcome === 'REGENERATION_REQUIRED') {
    diagnostics.push({ code: 'traceability_chain_incomplete', detail: 'regeneration required' });
  }
  return diagnostics.sort((a, b) => a.code.localeCompare(b.code));
}
