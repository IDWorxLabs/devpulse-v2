/**
 * Engineering Intelligence Activation Authority V1 — activation report + mandatory Capability
 * Matrix. This file only renders/describes decisions already made elsewhere — it never decides
 * anything and never generates a capability.
 */

import { ENGINEERING_INTELLIGENCE_ACTIVATION_AUTHORITY_V1_CONTRACT } from './engineering-intelligence-activation-types.js';
import type {
  EiaaActivationDecision,
  EiaaActivationEvidence,
  EiaaActivationReport,
} from './engineering-intelligence-activation-types.js';
import type { EiaaDecisionResult } from './activation-decision-engine.js';

export function buildActivationReport(
  evidence: EiaaActivationEvidence,
  decisionResult: EiaaDecisionResult,
): EiaaActivationReport {
  return {
    readOnly: true,
    contractVersion: ENGINEERING_INTELLIGENCE_ACTIVATION_AUTHORITY_V1_CONTRACT,
    decision: decisionResult.decision,
    confidence: decisionResult.confidence,
    reason: decisionResult.reason,
    satisfiedChecks: decisionResult.satisfiedChecks,
    failedChecks: decisionResult.failedChecks,
    rejectedActivationReasons: decisionResult.rejectedActivationReasons,
    recommendedAction: decisionResult.recommendedAction,
    evidence,
    runtimeRequest: decisionResult.runtimeRequest,
    generatedAt: new Date().toISOString(),
  };
}

interface CapabilityMatrixRow {
  capability: string;
  status: string;
  productionWired: string;
  autoRun: string;
  activationAllowed: string;
  notes: string;
}

/**
 * Static, data-driven Capability Matrix rows. "Activation Allowed" only has meaning for the
 * Engineering Intelligence Runtime (the one capability EIAA actually gates) — every other row is
 * an existing repair/orchestration/governance capability, marked N/A for that column.
 */
const CAPABILITY_MATRIX_ROWS: readonly CapabilityMatrixRow[] = [
  {
    capability: 'Autonomous Engineering Orchestrator',
    status: 'ACTIVE',
    productionWired: 'Yes',
    autoRun: 'Yes (targeted repairs only)',
    activationAllowed: 'N/A (orchestrator)',
    notes: 'Diagnoses failures, applies safe repairs via host callback, routes to EIAA when no repair capability exists.',
  },
  {
    capability: 'Engineering Intelligence Activation Authority',
    status: 'ACTIVE',
    productionWired: 'Yes',
    autoRun: 'No (decision-only)',
    activationAllowed: 'N/A (this is the authority)',
    notes: 'Decides ALLOW / DENY / REQUIRE_HUMAN_REVIEW for Engineering Intelligence Runtime activation; never generates capabilities itself.',
  },
  {
    capability: 'Engineering Intelligence Runtime',
    status: 'EXISTS',
    productionWired: 'Yes',
    autoRun: 'No (gated)',
    activationAllowed: 'Only when EIAA returns ALLOW_ENGINEERING_INTELLIGENCE',
    notes: 'Generates missing feature modules on request; must be explicitly authorized before AEO may invoke it, and its output is separately validated, not auto-installed.',
  },
  {
    capability: 'Capability Planning Engine',
    status: 'EXISTS',
    productionWired: 'Planning-only',
    autoRun: 'No',
    activationAllowed: 'N/A (feeds Engineering Intelligence Runtime, not gated directly)',
    notes: 'Plans required capabilities ahead of generation; does not modify the workspace.',
  },
  {
    capability: 'Missing Capability Evolution Engine',
    status: 'EXISTS',
    productionWired: 'Planning-only',
    autoRun: 'No',
    activationAllowed: 'N/A (feeds Engineering Intelligence Runtime, not gated directly)',
    notes: 'Produces the evolution plan consumed by the Engineering Intelligence Runtime once EIAA allows activation.',
  },
  {
    capability: 'Build Reality AutoFix',
    status: 'ACTIVE',
    productionWired: 'Yes',
    autoRun: 'Yes',
    activationAllowed: 'N/A (repair capability, not generation)',
    notes: 'Handles COMPILER_FAILURE / MODULE_GENERATION_FAILURE / MATERIALIZATION_FAILURE / PREVIEW_RUNTIME_FAILURE via AEO.',
  },
  {
    capability: 'Autonomous Recovery Authority',
    status: 'ACTIVE',
    productionWired: 'Yes',
    autoRun: 'Yes',
    activationAllowed: 'N/A (repair capability, not generation)',
    notes: 'Registered repair capability for validation/recovery-class failures.',
  },
  {
    capability: 'Product Faithfulness Repair',
    status: 'EXISTS',
    productionWired: 'Partial (report-driven)',
    autoRun: 'No',
    activationAllowed: 'N/A (repair capability, not generation)',
    notes: 'Detects PRODUCT_IDENTITY_DRIFT; repair is routed through AEO, drift itself routes to the (separately-governed) Contract-Bound Generation Authority, not EIAA.',
  },
  {
    capability: 'Fresh Build Artifact Isolation',
    status: 'ACTIVE',
    productionWired: 'Yes',
    autoRun: 'Yes',
    activationAllowed: 'N/A (repair capability, not generation)',
    notes: 'Registered repair capability for MANIFEST_STALENESS / STALE_EVIDENCE_FAILURE.',
  },
  {
    capability: 'Project Context Isolation',
    status: 'ACTIVE',
    productionWired: 'Yes',
    autoRun: 'Yes',
    activationAllowed: 'N/A (repair capability, not generation)',
    notes: 'Registered repair capability for PROJECT_CONTEXT_FAILURE.',
  },
  {
    capability: 'Build Execution Stabilizer',
    status: 'ACTIVE',
    productionWired: 'Yes',
    autoRun: 'Yes',
    activationAllowed: 'N/A (repair capability, not generation)',
    notes: 'Registered repair capability for DEPENDENCY_INSTALL_FAILURE / COMPILER_FAILURE stabilization retries.',
  },
  {
    capability: 'Live Preview Gate',
    status: 'ACTIVE',
    productionWired: 'Yes',
    autoRun: 'No (evaluator/gate, not a mutator)',
    activationAllowed: 'N/A (repair capability, not generation)',
    notes: 'Evaluates LIVE_PREVIEW_PROOF_FAILURE / PREVIEW_RUNTIME_FAILURE evidence consumed by AEO diagnosis.',
  },
];

export function renderCapabilityMatrixMarkdown(): string {
  const header = '| Capability | Status | Production Wired | Auto Run | Activation Allowed | Notes |';
  const divider = '|------------|--------|------------------|----------|--------------------|-------|';
  const rows = CAPABILITY_MATRIX_ROWS.map(
    (r) => `| ${r.capability} | ${r.status} | ${r.productionWired} | ${r.autoRun} | ${r.activationAllowed} | ${r.notes} |`,
  );
  return [header, divider, ...rows].join('\n');
}

export function listCapabilityMatrixCapabilityNames(): readonly string[] {
  return CAPABILITY_MATRIX_ROWS.map((r) => r.capability);
}

export function renderActivationReportMarkdown(report: EiaaActivationReport): string {
  const lines: string[] = [];
  lines.push('## Engineering Intelligence Activation Authority — Decision Report');
  lines.push('');
  lines.push(`- Decision: **${report.decision}**`);
  lines.push(`- Confidence: ${report.confidence}`);
  lines.push(`- Reason: ${report.reason}`);
  lines.push(`- Missing capability: ${report.evidence.missingCapabilityId ?? 'none'}`);
  lines.push(`- Recommended action: ${report.recommendedAction}`);
  lines.push('');
  lines.push('### Policy checks satisfied');
  for (const c of report.satisfiedChecks) lines.push(`- ✓ ${c.checkId}: ${c.detail}`);
  lines.push('');
  lines.push('### Policy checks failed');
  if (report.failedChecks.length === 0) lines.push('- (none)');
  for (const c of report.failedChecks) lines.push(`- ✗ ${c.checkId}: ${c.detail}`);
  if (report.rejectedActivationReasons.length > 0) {
    lines.push('');
    lines.push('### Rejected activation reasons');
    for (const r of report.rejectedActivationReasons) lines.push(`- ${r}`);
  }
  if (report.runtimeRequest) {
    lines.push('');
    lines.push('### Engineering Intelligence Runtime invocation request');
    lines.push(`- Missing capability: ${report.runtimeRequest.missingCapabilityName} (${report.runtimeRequest.missingCapabilityId})`);
    lines.push(`- Failure taxonomy class: ${report.runtimeRequest.failureTaxonomyClass}`);
    lines.push(`- Integration point: ${report.runtimeRequest.integrationPoint}`);
    lines.push(`- Validation strategy: ${report.runtimeRequest.validationStrategy.join('; ')}`);
  }
  lines.push('');
  lines.push('### Capability Matrix');
  lines.push('');
  lines.push(renderCapabilityMatrixMarkdown());
  return lines.join('\n');
}

export function activationDecisionAllowsInvocation(decision: EiaaActivationDecision): boolean {
  return decision === 'ALLOW_ENGINEERING_INTELLIGENCE';
}
