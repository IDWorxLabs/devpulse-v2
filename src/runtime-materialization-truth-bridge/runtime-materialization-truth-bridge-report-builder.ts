/**
 * Runtime Materialization Truth Bridge — report builder (Phase 26.76).
 */

import {
  EVIDENCE_PRIORITY_ORDER,
  FOUNDER_RUNTIME_TRUTH_QUESTIONS,
  INTEGRATION_TARGET_AUTHORITIES,
  ORCHESTRATION_FLOW,
  RECONCILIATION_RULES,
  RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_CORE_QUESTION,
  RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_PHASE,
  RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_REPORT_TITLE,
  RUNTIME_MATERIALIZATION_TRUTH_RECONCILIATION_REPORT_TITLE,
  SAFETY_GUARANTEES,
} from './runtime-materialization-truth-bridge-registry.js';
import type { RuntimeMaterializationTruthBridgeReport } from './runtime-materialization-truth-bridge-types.js';

export function buildRuntimeMaterializationTruthBridgeReportMarkdown(
  report: RuntimeMaterializationTruthBridgeReport,
): string {
  const { evidence, reconciliation } = report;
  const snap = evidence.snapshot;

  const lines: string[] = [
    `# ${RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_REPORT_TITLE}`,
    '',
    `**Bridge:** ${report.bridgeId}`,
    `**Generated:** ${report.generatedAt}`,
    `**Final APPLICATION truth:** ${report.finalApplicationTruth}`,
    '',
    '## Core question',
    '',
    RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_CORE_QUESTION,
    '',
    '## Phase',
    '',
    RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_PHASE,
    '',
    '## Safety guarantees',
    '',
    ...SAFETY_GUARANTEES.map((g) => `- ${g}`),
    '',
    '## Orchestration flow',
    '',
    ...ORCHESTRATION_FLOW.map((step, i) => `${i + 1}. ${step}`),
    '',
    '## Integration targets',
    '',
    ...INTEGRATION_TARGET_AUTHORITIES.map((a) => `- ${a}`),
    '',
    '## Runtime evidence',
    '',
    report.runtimeEvidenceSummary,
    '',
    `- runtimeProofLevel: **${snap.runtimeProofLevel}**`,
    `- previewProofLevel: **${snap.previewProofLevel ?? 'n/a'}**`,
    `- filesExistOnDisk: **${snap.filesExistOnDisk}**`,
    `- failureBoundary: **${reconciliation.failureBoundary}**`,
    '',
    '### Startup',
    '',
    `- serverStartSucceeded: ${evidence.startup.serverStartSucceeded}`,
    `- processStarted: ${evidence.startup.processStarted}`,
    `- portReachable: ${evidence.startup.portReachable}`,
    `- healthResponded: ${evidence.startup.healthResponded}`,
    '',
    '### Routes',
    '',
    `- primaryUrlReachable: ${evidence.routes.primaryUrlReachable}`,
    `- routesReachable: ${evidence.routes.routesReachable}/${evidence.routes.knownRoutesChecked}`,
    '',
    '### UI',
    '',
    `- applicationRendered: ${evidence.ui.applicationRendered}`,
    `- blankPageDetected: ${evidence.ui.blankPageDetected}`,
    '',
    '## Founder Test verdict',
    '',
    report.founderTestVerdictSummary,
    '',
    `- founderRuntimeProofLevel: **${snap.founderRuntimeProofLevel}**`,
    `- founderPreviewProofLevel: **${snap.founderPreviewProofLevel}**`,
    `- preReconciliation: **${reconciliation.preReconciliationApplicationVerdict}**`,
    '',
    '## Truth Matrix verdict',
    '',
    report.truthMatrixVerdictSummary,
    '',
    '## RUNTIME_MATERIALIZATION_TRUTH reconciliation',
    '',
    `Operation: **${reconciliation.operationId}**`,
    `Root cause: **${reconciliation.rootCause}**`,
    `Authoritative source: **${reconciliation.authoritativeSource}**`,
    `Recommended fix: ${reconciliation.recommendedFix}`,
    '',
    '### Rules applied',
    '',
    ...reconciliation.rulesApplied.map((r) => `- ${r}`),
    '',
    '### Contradictions',
    '',
  ];

  if (reconciliation.contradictions.length === 0) {
    lines.push('- none');
  } else {
    for (const c of reconciliation.contradictions) {
      lines.push(`- **${c.kind}**: ${c.detail}`);
    }
  }

  lines.push('');
  lines.push('## Founder questions');
  lines.push('');
  const a = reconciliation.founderAnswers;
  const qa: Array<[string, string]> = [
    [FOUNDER_RUNTIME_TRUTH_QUESTIONS[0]!, a.didApplicationStart ? 'YES' : 'NO'],
    [FOUNDER_RUNTIME_TRUTH_QUESTIONS[1]!, a.didApplicationBecomeReachable ? 'YES' : 'NO'],
    [FOUNDER_RUNTIME_TRUTH_QUESTIONS[2]!, a.didRoutesWork ? 'YES' : 'NO'],
    [FOUNDER_RUNTIME_TRUTH_QUESTIONS[3]!, a.didUiRender ? 'YES' : 'NO'],
    [FOUNDER_RUNTIME_TRUTH_QUESTIONS[4]!, a.didFounderCriticalWorkflowsComplete ? 'YES' : 'NO'],
    [FOUNDER_RUNTIME_TRUTH_QUESTIONS[5]!, a.didReportingReflectRuntimeReality ? 'YES' : 'NO'],
    [FOUNDER_RUNTIME_TRUTH_QUESTIONS[6]!, a.trueRootCause],
  ];
  for (const [q, ans] of qa) {
    lines.push(`- **${q}** → ${ans}`);
  }

  lines.push('');
  lines.push('## Evidence priority');
  lines.push('');
  for (const [i, p] of EVIDENCE_PRIORITY_ORDER.entries()) {
    lines.push(`${i + 1}. ${p}`);
  }

  return lines.join('\n');
}

export function buildRuntimeMaterializationTruthReconciliationReportMarkdown(
  report: RuntimeMaterializationTruthBridgeReport,
): string {
  const { reconciliation, evidence } = report;
  const snap = evidence.snapshot;

  return [
    `# ${RUNTIME_MATERIALIZATION_TRUTH_RECONCILIATION_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Objective',
    '',
    'Extend proof from BUILD_PROVEN to APPLICATION_PROVEN using runtime evidence.',
    '',
    '## Reconciliation rules',
    '',
    ...RECONCILIATION_RULES.map((r) => `- ${r}`),
    '',
    '## Pre vs post reconciliation',
    '',
    `| Field | Pre | Post |`,
    `|-------|-----|------|`,
    `| APPLICATION truth | ${reconciliation.preReconciliationApplicationVerdict} | **${reconciliation.postReconciliationApplicationVerdict}** |`,
    `| Root cause | — | **${reconciliation.rootCause}** |`,
    `| Failure boundary | — | **${reconciliation.failureBoundary}** |`,
    '',
    '## FILES_EXIST vs APPLICATION_WORKS',
    '',
    `| Signal | Value |`,
    `|--------|-------|`,
    `| filesExistOnDisk | ${snap.filesExistOnDisk} |`,
    `| applicationBoots | ${evidence.proofAnalysis.applicationBoots} |`,
    `| routesReachable | ${evidence.proofAnalysis.routesReachable} |`,
    `| uiRenders | ${evidence.proofAnalysis.uiRenders} |`,
    `| runtimeProofLevel | ${snap.runtimeProofLevel} |`,
    `| founderRuntimeProofLevel | ${snap.founderRuntimeProofLevel} |`,
    '',
    '## Final APPLICATION truth',
    '',
    `**${report.finalApplicationTruth}** (rootCause=${reconciliation.rootCause}, boundary=${reconciliation.failureBoundary})`,
    '',
    '## Recommended fix',
    '',
    reconciliation.recommendedFix,
    '',
  ].join('\n');
}
