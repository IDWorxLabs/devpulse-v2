/**
 * Contract-to-Module Traceability Authority V1 — workspace artifacts.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ContractToModuleTraceabilityReport } from './contract-to-module-traceability-types.js';
import { CONTRACT_TO_MODULE_TRACEABILITY_SOURCE } from './contract-to-module-traceability-types.js';
import { reconcileApprovedAndGeneratedModules } from './contract-to-module-output-reconciliation.js';

export function buildContractToModuleTraceabilityWorkspaceArtifacts(
  report: ContractToModuleTraceabilityReport,
): GeneratedWorkspaceFile[] {
  const reconciliation = reconcileApprovedAndGeneratedModules(report.graph);
  return [
    {
      relativePath: 'src/contract-to-module-traceability/contract-to-module-traceability-graph.json',
      content: `${JSON.stringify(report.graph, null, 2)}\n`,
    },
    {
      relativePath: 'src/contract-to-module-traceability/contract-to-module-traceability-findings.json',
      content: `${JSON.stringify(report.graph.findings, null, 2)}\n`,
    },
    {
      relativePath: 'src/contract-to-module-traceability/contract-to-module-traceability-reconciliation.json',
      content: `${JSON.stringify(reconciliation, null, 2)}\n`,
    },
    {
      relativePath: 'src/contract-to-module-traceability/contract-to-module-traceability-report.json',
      content: `${JSON.stringify(report, null, 2)}\n`,
    },
    {
      relativePath: 'src/contract-to-module-traceability/contract-to-module-traceability-marker.ts',
      content: `/** ${CONTRACT_TO_MODULE_TRACEABILITY_SOURCE} — marker only, not traceability evidence */
export const CONTRACT_TO_MODULE_TRACEABILITY_MARKER = '${CONTRACT_TO_MODULE_TRACEABILITY_SOURCE}' as const;
export const TRACEABILITY_GRAPH_FINGERPRINT = '${report.graph.fingerprint}';
export const TRACEABILITY_EXPECTED_MODULE_COUNT = ${report.expectedModuleCount};
export const TRACEABILITY_GENERATED_APPROVED_MODULE_COUNT = ${report.generatedApprovedModuleCount};
export const TRACEABILITY_MISSING_MODULE_COUNT = ${report.missingModuleCount};
export const TRACEABILITY_UNAPPROVED_MODULE_COUNT = ${report.unapprovedModuleCount};
export const TRACEABILITY_COMPLETENESS = ${report.traceabilityCompleteness};
export const TRACEABILITY_COMPLIANCE_OUTCOME = '${report.complianceOutcome}' as const;
`,
    },
  ];
}
