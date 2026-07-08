/**
 * Contract-Bound Generation Authority V4 — reporting.
 *
 * Renders the module/route/navigation plan tables, surface plan summary, unsupported-items-removed
 * lists, repairs applied, final gate outcome, and the mandatory capability matrix.
 */

import type {
  CbgaGenerationReport,
  CbgaModulePlanEntry,
  CbgaNavigationPlanItem,
  CbgaRoutePlanEntry,
  CbgaSurfacePlan,
} from './contract-bound-generation-types.js';

export interface CapabilityMatrixRow {
  capability: string;
  status: string;
  productionWired: string;
  autoRun: string;
  activationAllowed: string;
  notes: string;
}

/** The mandatory capability matrix — includes at minimum the 11 capabilities the milestone requires. */
export const CBGA_CAPABILITY_MATRIX_ROWS: CapabilityMatrixRow[] = [
  {
    capability: 'Contract-Bound Generation Authority',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (module/route/nav/surface repair from contract)',
    activationAllowed: 'YES',
    notes: 'Gates + repairs generator inputs against the canonical product contract before materialization.',
  },
  {
    capability: 'Autonomous Engineering Orchestrator',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (matched, safe repairs only)',
    activationAllowed: 'YES',
    notes: 'Diagnoses build failures, applies safe repairs, routes missing capabilities.',
  },
  {
    capability: 'Engineering Intelligence Activation Authority',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'NO (decision authority only)',
    activationAllowed: 'CONDITIONAL (8-point policy)',
    notes: 'Decides whether the Engineering Intelligence Runtime may be invoked for a missing capability.',
  },
  {
    capability: 'Engineering Intelligence Runtime',
    status: 'IMPLEMENTED',
    productionWired: 'PARTIAL',
    autoRun: 'NO (gated by EIAA)',
    activationAllowed: 'CONDITIONAL',
    notes: 'Generates missing capabilities; never installs automatically, always separately validated.',
  },
  {
    capability: 'Product Faithfulness',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'N/A (audit)',
    activationAllowed: 'N/A',
    notes: 'Builds the canonical product contract and audits generation-pipeline concept drift.',
  },
  {
    capability: 'Product Faithfulness Repair',
    status: 'IMPLEMENTED',
    productionWired: 'SIMULATED',
    autoRun: 'NO',
    activationAllowed: 'NO',
    notes: 'In-memory stage-evidence reconciliation only — never regenerates workspace files.',
  },
  {
    capability: 'Fresh Build Artifact Isolation',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES',
    activationAllowed: 'N/A',
    notes: 'Purges stale prior-build artifacts before planning/materialization for a NEW_BUILD.',
  },
  {
    capability: 'Project Context Isolation',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES',
    activationAllowed: 'N/A',
    notes: 'Prevents cross-project/prior-prompt context bleed into the active build.',
  },
  {
    capability: 'Build Reality AutoFix',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (targeted retries)',
    activationAllowed: 'N/A',
    notes: 'Repairs compiler/build failures during the AEE build-autofix loop.',
  },
  {
    capability: 'Build Execution Stabilizer',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES',
    activationAllowed: 'N/A',
    notes: 'Stabilizes npm install/build execution before/after materialization.',
  },
  {
    capability: 'Live Preview Gate',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES',
    activationAllowed: 'N/A',
    notes: 'Blocks preview activation until live-preview proof requirements are satisfied.',
  },
];

export function listCapabilityMatrixCapabilityNames(): string[] {
  return CBGA_CAPABILITY_MATRIX_ROWS.map((r) => r.capability);
}

export function renderCapabilityMatrixMarkdown(): string {
  const header = '| Capability | Status | Production Wired | Auto Run | Activation Allowed | Notes |';
  const divider = '|------------|--------|------------------|----------|--------------------|-------|';
  const rows = CBGA_CAPABILITY_MATRIX_ROWS.map(
    (r) => `| ${r.capability} | ${r.status} | ${r.productionWired} | ${r.autoRun} | ${r.activationAllowed} | ${r.notes} |`,
  );
  return [header, divider, ...rows].join('\n');
}

function renderModulePlanTable(modulePlan: readonly CbgaModulePlanEntry[]): string {
  const header = '| Module ID | Display Name | Source Contract Concept | Evidence Source | Confidence | Allowed |';
  const divider = '|-----------|--------------|--------------------------|------------------|------------|---------|';
  const rows = modulePlan.map(
    (m) =>
      `| ${m.moduleId} | ${m.displayName} | ${m.sourceContractConcept} | ${m.evidenceSource} | ${m.confidence} | ${m.generationAllowed ? 'YES' : 'NO'} |`,
  );
  return [header, divider, ...rows].join('\n');
}

function renderRoutePlanTable(routePlan: readonly CbgaRoutePlanEntry[]): string {
  const header = '| Route ID | Path | Label | Module ID | Source Contract Concept |';
  const divider = '|----------|------|-------|-----------|--------------------------|';
  const rows = routePlan.map(
    (r) => `| ${r.routeId} | ${r.path} | ${r.label} | ${r.moduleId} | ${r.sourceContractConcept} |`,
  );
  return [header, divider, ...rows].join('\n');
}

function renderNavigationPlanTable(navigationPlan: readonly CbgaNavigationPlanItem[]): string {
  const header = '| Label | Path | Module ID | Source Contract Concept | Visibility Reason |';
  const divider = '|-------|------|-----------|--------------------------|--------------------|';
  const rows = navigationPlan.map(
    (n) => `| ${n.label} | ${n.path} | ${n.moduleId} | ${n.sourceContractConcept} | ${n.visibilityReason} |`,
  );
  return [header, divider, ...rows].join('\n');
}

function renderSurfacePlanSummary(surfacePlan: CbgaSurfacePlan): string {
  return [
    `- **Title requirement:** ${surfacePlan.titleRequirement}`,
    `- **Primary interaction requirement:** ${surfacePlan.primaryInteractionRequirement}`,
    `- **Empty state requirement:** ${surfacePlan.emptyStateRequirement}`,
    `- **Success state requirement:** ${surfacePlan.successStateRequirement}`,
    `- **Required controls:** ${surfacePlan.requiredControls.join(', ') || '(none)'}`,
    `- **Required data concepts:** ${surfacePlan.requiredDataConcepts.join(', ') || '(none)'}`,
    `- **Source contract concept:** ${surfacePlan.sourceContractConcept}`,
  ].join('\n');
}

export function renderContractBoundGenerationReportMarkdown(report: CbgaGenerationReport): string {
  const lines: string[] = [];
  lines.push('# Contract-Bound Generation Authority V4 — Report');
  lines.push('');
  lines.push(`**Contract ID:** ${report.contractId}`);
  lines.push(`**Product identity:** ${report.productIdentity}`);
  lines.push(`**Final gate outcome:** ${report.finalGateOutcome}`);
  lines.push('');
  lines.push('## Module Plan');
  lines.push(renderModulePlanTable(report.modulePlan));
  lines.push('');
  lines.push('## Route Plan');
  lines.push(renderRoutePlanTable(report.routePlan));
  lines.push('');
  lines.push('## Navigation Plan');
  lines.push(renderNavigationPlanTable(report.navigationPlan));
  lines.push('');
  lines.push('## Surface Plan');
  lines.push(renderSurfacePlanSummary(report.surfacePlan));
  lines.push('');
  lines.push('## Unsupported Items Removed Before Generation');
  lines.push(`- **Unsupported modules removed:** ${report.initialGate.unsupportedModulesRemoved.join(', ') || '(none)'}`);
  lines.push(`- **Unsupported routes removed:** ${report.initialGate.unsupportedRoutesRemoved.join(', ') || '(none)'}`);
  lines.push(`- **Unsupported navigation removed:** ${report.initialGate.unsupportedNavigationRemoved.join(', ') || '(none)'}`);
  lines.push(`- **Generic shell surface blocked:** ${report.initialGate.genericShellSurfaceBlocked ? 'YES' : 'NO'}`);
  lines.push('');
  lines.push('## Repairs Applied');
  lines.push(
    report.repairsApplied.length > 0
      ? report.repairsApplied.map((a) => `- **${a.actionId}:** ${a.detail}`).join('\n')
      : '- (no repairs were required)',
  );
  lines.push('');
  lines.push('## Capability Matrix');
  lines.push(renderCapabilityMatrixMarkdown());
  return lines.join('\n');
}
