/**
 * Generation Pipeline Compliance Authority V1 — reporting.
 *
 * Renders the deterministic pipeline compliance table, the per-stage score breakdown, the
 * unsupported/legacy/template/blueprint findings, the final gate outcome, and the mandatory
 * capability matrix (required in every report by this milestone's spec).
 */

import type { GpcaComplianceReport, GpcaStageComplianceScore } from './generation-pipeline-compliance-types.js';

export interface CapabilityMatrixRow {
  capability: string;
  status: string;
  productionWired: string;
  autoRun: string;
  activationAllowed: string;
  notes: string;
}

/** The mandatory capability matrix — includes at minimum the 11 capabilities this milestone requires. */
export const GPCA_CAPABILITY_MATRIX_ROWS: CapabilityMatrixRow[] = [
  {
    capability: 'Generation Pipeline Compliance Authority',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (audits + blocks every build)',
    activationAllowed: 'YES',
    notes: 'Audits every generation stage and blocks contract bypass before materialization/preview.',
  },
  {
    capability: 'Contract-Bound Generation Authority',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES',
    activationAllowed: 'YES',
    notes: 'Repairs generator inputs (modules/routes/nav/title) to the canonical contract before generation.',
  },
  {
    capability: 'Autonomous Engineering Orchestrator',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'YES (matched, safe repairs only)',
    activationAllowed: 'YES',
    notes: 'Coordinates diagnosis and repair; routes GPCA failure classes to missing-capability planning (no auto-repair exists for them).',
  },
  {
    capability: 'Engineering Intelligence Activation Authority',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'NO (decision authority only)',
    activationAllowed: 'CONDITIONAL (8-point policy)',
    notes: 'Activates Engineering Intelligence only when policy permits and only after GPCA/AEO prove the generator itself lacks the capability.',
  },
  {
    capability: 'Engineering Intelligence Runtime',
    status: 'IMPLEMENTED',
    productionWired: 'PARTIAL',
    autoRun: 'NO (gated by EIAA)',
    activationAllowed: 'CONDITIONAL',
    notes: 'Generates missing capabilities after EIAA approval; GPCA never invokes it directly.',
  },
  {
    capability: 'Product Faithfulness',
    status: 'IMPLEMENTED',
    productionWired: 'YES',
    autoRun: 'N/A (audit)',
    activationAllowed: 'N/A',
    notes: 'Produces the canonical product contract GPCA audits every stage against.',
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
  return GPCA_CAPABILITY_MATRIX_ROWS.map((r) => r.capability);
}

export function renderCapabilityMatrixMarkdown(): string {
  const header = '| Capability | Status | Production Wired | Auto Run | Activation Allowed | Notes |';
  const divider = '|------------|--------|------------------|----------|--------------------|-------|';
  const rows = GPCA_CAPABILITY_MATRIX_ROWS.map(
    (r) => `| ${r.capability} | ${r.status} | ${r.productionWired} | ${r.autoRun} | ${r.activationAllowed} | ${r.notes} |`,
  );
  return [header, divider, ...rows].join('\n');
}

function renderPipelineComplianceTable(report: GpcaComplianceReport): string {
  const header =
    '| Generation Stage | Production Wired | Uses CBGA | Uses Contract | Legacy Free | Template Free | Traceable | Status |';
  const divider =
    '|-------------------|-------------------|-----------|----------------|-------------|----------------|-----------|--------|';
  const rows = report.stages.map((stage) => {
    const score = report.scores.find((s) => s.stageId === stage.stageId) as GpcaStageComplianceScore;
    const legacyFree = stage.flags.usesLegacyPlanner || stage.flags.usesFallbackModules ? 'NO' : 'YES';
    const templateFree =
      stage.flags.usesHardcodedTemplate || stage.flags.usesGenericUiCopy || stage.flags.usesReusableComponentShell
        ? 'NO'
        : 'YES';
    const traceable = score.traceabilityPercent === 100 ? 'YES' : 'NO';
    return `| ${stage.stageName} | YES | ${stage.flags.usesCbga ? 'YES' : 'NO'} | ${
      stage.flags.usesCanonicalContract ? 'YES' : 'NO'
    } | ${legacyFree} | ${templateFree} | ${traceable} | ${score.status} |`;
  });
  return [header, divider, ...rows].join('\n');
}

function renderScoreTable(scores: readonly GpcaStageComplianceScore[]): string {
  const header =
    '| Stage | Contract % | Input % | Output % | Traceability % | Template Leakage % | Legacy Usage % | Blueprint Usage % | Overall % | Status |';
  const divider =
    '|-------|-----------|---------|----------|-----------------|---------------------|------------------|---------------------|-----------|--------|';
  const rows = scores.map(
    (s) =>
      `| ${s.stageName} | ${s.contractCompliancePercent} | ${s.inputCompliancePercent} | ${s.outputCompliancePercent} | ${s.traceabilityPercent} | ${s.templateLeakagePercent} | ${s.legacyUsagePercent} | ${s.blueprintUsagePercent} | ${s.overallCompliancePercent} | ${s.status} |`,
  );
  return [header, divider, ...rows].join('\n');
}

export function renderGenerationPipelineComplianceReportMarkdown(report: GpcaComplianceReport): string {
  const lines: string[] = [];
  lines.push('# Generation Pipeline Compliance Authority V1 — Report');
  lines.push('');
  lines.push(`**Contract ID:** ${report.contractId}`);
  lines.push(`**Product identity:** ${report.productIdentity}`);
  lines.push(`**Phase:** ${report.phase}`);
  lines.push(`**Overall compliance:** ${report.overallCompliancePercent}%`);
  lines.push(`**Final gate outcome:** ${report.finalGateOutcome}`);
  lines.push('');
  lines.push('## Pipeline Compliance');
  lines.push(renderPipelineComplianceTable(report));
  lines.push('');
  lines.push('## Per-Stage Compliance Scores');
  lines.push(renderScoreTable(report.scores));
  lines.push('');
  lines.push('## Findings');
  lines.push(`- **Legacy generators detected:** ${report.legacyGeneratorsDetected.join(', ') || '(none)'}`);
  lines.push(`- **Template generators detected:** ${report.templateGeneratorsDetected.join(', ') || '(none)'}`);
  lines.push(`- **Generic shell surfaces blocked:** ${report.genericShellSurfacesBlocked.join(', ') || '(none)'}`);
  lines.push(`- **Blueprint bypass detected:** ${report.blueprintBypassDetected.join(', ') || '(none)'}`);
  lines.push(`- **Contract bypass detected:** ${report.contractBypassDetected.join(', ') || '(none)'}`);
  lines.push('');
  lines.push('## Blocked Reasons');
  lines.push(report.blockedReasons.length > 0 ? report.blockedReasons.map((r) => `- ${r}`).join('\n') : '- (generation allowed — no blocking reasons)');
  lines.push('');
  lines.push('## Capability Matrix');
  lines.push(renderCapabilityMatrixMarkdown());
  return lines.join('\n');
}
