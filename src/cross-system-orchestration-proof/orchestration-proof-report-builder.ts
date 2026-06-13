/**
 * Orchestration Proof Report Builder — markdown proof report (V1).
 */

import {
  ORCHESTRATION_PROOF_REPORT_TITLE,
  CROSS_SYSTEM_ORCHESTRATION_PROOF_V1_PASS,
} from './orchestration-proof-registry.js';
import type { OrchestrationProofAnalysis, OrchestrationProofReport } from './orchestration-proof-types.js';

function formatList(items: readonly string[]): string {
  if (items.length === 0) return '- none';
  return items.map((item) => `- ${item}`).join('\n');
}

export function buildOrchestrationProofReport(input: {
  analyses: readonly OrchestrationProofAnalysis[];
  history: readonly import('./orchestration-proof-types.js').OrchestrationProofHistoryEntry[];
}): OrchestrationProofReport {
  const latestAnalysis = input.analyses[0] ?? null;
  const scores = input.history.map((e) => e.orchestrationProofScore);
  const averageProofScore =
    scores.length === 0 ? 0 : Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    totalProofs: input.history.length,
    latestAnalysis,
    historySummary: {
      totalProofs: input.history.length,
      averageProofScore,
      fullyProvenCount: input.history.filter((e) => e.orchestrationProofCategory === 'FULLY_PROVEN_CHAIN').length,
      brokenChainCount: input.history.filter((e) => e.orchestrationProofCategory === 'BROKEN_CHAIN').length,
    },
  };
}

export function buildOrchestrationProofReportMarkdown(
  report: OrchestrationProofReport,
  analysis: OrchestrationProofAnalysis | null = report.latestAnalysis,
): string {
  const lines: string[] = [
    `# ${ORCHESTRATION_PROOF_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total proofs: ${report.historySummary.totalProofs}`,
    `- Average proof score: ${report.historySummary.averageProofScore}/100`,
    `- Fully proven chains: ${report.historySummary.fullyProvenCount}`,
    `- Broken chains: ${report.historySummary.brokenChainCount}`,
    '',
  ];

  if (!analysis) {
    lines.push('No orchestration proof analysis available.', '');
    lines.push('---', '', `Pass token: ${CROSS_SYSTEM_ORCHESTRATION_PROOF_V1_PASS}`, '');
    return lines.join('\n');
  }

  lines.push('## Proof Score', '');
  lines.push(`- Proof score: ${analysis.orchestrationProofScore}/100`);
  lines.push(`- Proof category: ${analysis.orchestrationProofCategory}`);
  lines.push('');

  lines.push('## System Orchestration Proof', '');
  const proof = analysis.systemOrchestrationProof;
  lines.push('- Authorities evaluated:', formatList(proof.authoritiesEvaluated));
  lines.push('- Authorities consistent:', formatList(proof.authoritiesConsistent));
  lines.push('- Authorities inconsistent:', formatList(proof.authoritiesInconsistent));
  lines.push('- Strongest authorities:', formatList(analysis.strongestAuthorities));
  lines.push('- Failing authorities:', formatList(analysis.failingAuthorities));
  lines.push('');

  lines.push('## Chain Consistency Results', '');
  for (const result of analysis.chainConsistencyResults) {
    lines.push(`### ${result.scenarioName} (${result.scenarioType})`, '');
    lines.push(`- Proof score: ${result.proofScore}/100 (${result.proofCategory})`);
    lines.push(`- Authorities reached: ${result.authoritiesReached}`);
    lines.push(`- Information losses: ${result.informationLossCount}`);
    lines.push(`- Drift findings: ${result.driftCount}`);
    lines.push(`- Failures: ${result.failureCount}`);
    lines.push('');
  }

  lines.push('## Information Losses', '');
  if (proof.informationLosses.length === 0) {
    lines.push('- none');
  } else {
    for (const loss of proof.informationLosses) {
      lines.push(`- [${loss.severity}] ${loss.field}: ${loss.upstreamAuthority} → ${loss.downstreamAuthority} (lost: ${loss.lostItems.join(', ')})`);
    }
  }
  lines.push('');

  lines.push('## Drift Findings', '');
  if (proof.driftFindings.length === 0) {
    lines.push('- none');
  } else {
    for (const drift of proof.driftFindings) {
      lines.push(`- [${drift.severity}] ${drift.driftType}: ${drift.description}`);
    }
  }
  lines.push('');

  lines.push('## Confidence Propagation', '');
  for (const step of analysis.confidencePropagation.steps) {
    lines.push(`- ${step.authorityId}: ${step.confidence}${step.deltaFromPrevious != null ? ` (Δ ${step.deltaFromPrevious})` : ''}`);
  }
  if (analysis.confidencePropagation.collapseDetected) {
    lines.push(`- **CONFIDENCE_COLLAPSE** at ${analysis.confidencePropagation.collapseAuthority}`);
  }
  lines.push('');

  lines.push('## Readiness Propagation', '');
  for (const step of analysis.readinessPropagation.steps) {
    lines.push(`- ${step.authorityId}: ${step.readiness} (level ${step.readinessLevel})`);
  }
  if (analysis.readinessPropagation.inflationDetected) {
    lines.push(`- **READINESS_INFLATION** at ${analysis.readinessPropagation.inflationAuthority}`);
  }
  lines.push('');

  lines.push('## Evidence Propagation', '');
  lines.push(`- Preserved: ${analysis.evidencePropagation.preservedCount}`);
  lines.push(`- Expanded: ${analysis.evidencePropagation.expandedCount}`);
  lines.push(`- Invented: ${analysis.evidencePropagation.inventedCount}`);
  lines.push(`- Lost: ${analysis.evidencePropagation.lostCount}`);
  lines.push('');

  lines.push('## Orchestration Failures', '');
  if (analysis.orchestrationFailures.length === 0) {
    lines.push('- none');
  } else {
    for (const failure of analysis.orchestrationFailures) {
      lines.push(`- [${failure.severity}] ${failure.failingAuthority}: ${failure.launchImpact}`);
    }
  }
  lines.push('');

  lines.push('## Repair Recommendations', '');
  lines.push(formatList(analysis.repairRecommendations));
  lines.push('');
  lines.push('---', '', `Pass token: ${CROSS_SYSTEM_ORCHESTRATION_PROOF_V1_PASS}`, '');

  return lines.join('\n');
}
