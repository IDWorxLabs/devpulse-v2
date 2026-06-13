/**
 * OpenAI Connectivity Report Builder — markdown connectivity report (V1).
 */

import {
  OPENAI_CONNECTIVITY_PROOF_REPORT_TITLE,
  OPENAI_CONNECTIVITY_PROOF_V1_PASS,
} from './openai-connectivity-registry.js';
import type {
  OpenAiConnectivityAnalysis,
  OpenAiConnectivityHistoryEntry,
  OpenAiConnectivityProofReport,
} from './openai-connectivity-types.js';

export function buildOpenAiConnectivityProofReport(input: {
  analyses: readonly OpenAiConnectivityAnalysis[];
  history: readonly OpenAiConnectivityHistoryEntry[];
}): OpenAiConnectivityProofReport {
  const latestAnalysis = input.analyses[0] ?? null;

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    totalProofs: input.history.length,
    latestAnalysis,
    historySummary: {
      totalProofs: input.history.length,
      connectedCount: input.history.filter((entry) => entry.connectivityVerdict === 'CONNECTED').length,
      partialCount: input.history.filter((entry) => entry.connectivityVerdict === 'PARTIAL').length,
      disconnectedCount: input.history.filter((entry) => entry.connectivityVerdict === 'DISCONNECTED').length,
      realModeConnectedCount: input.history.filter(
        (entry) => entry.mode === 'real' && entry.connectivityVerdict === 'CONNECTED',
      ).length,
    },
  };
}

export function buildOpenAiConnectivityProofReportMarkdown(
  report: OpenAiConnectivityProofReport,
  analyses: readonly OpenAiConnectivityAnalysis[] = report.latestAnalysis ? [report.latestAnalysis] : [],
): string {
  const lines: string[] = [
    `# ${OPENAI_CONNECTIVITY_PROOF_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total proofs: ${report.historySummary.totalProofs}`,
    `- Connected: ${report.historySummary.connectedCount}`,
    `- Partial: ${report.historySummary.partialCount}`,
    `- Disconnected: ${report.historySummary.disconnectedCount}`,
    `- Real-mode connected: ${report.historySummary.realModeConnectedCount}`,
    '',
  ];

  for (const analysis of analyses) {
    lines.push('## Key Status', '');
    lines.push(`- Status: ${analysis.keyStatus.status}`);
    lines.push(`- Source: ${analysis.keyStatus.keySource ?? 'none'}`);
    lines.push(`- Preview: ${analysis.keyStatus.maskedPreview ?? 'n/a'}`);
    lines.push(`- Reason: ${analysis.keyStatus.reason}`);
    lines.push('');

    lines.push('## Client Status', '');
    lines.push(`- Status: ${analysis.clientStatus.status}`);
    lines.push(`- Provider: ${analysis.clientStatus.provider}`);
    lines.push(`- Model: ${analysis.clientStatus.model}`);
    lines.push(`- Base URL: ${analysis.clientStatus.baseUrl}`);
    lines.push(`- Configuration valid: ${analysis.clientStatus.configurationValid ? 'yes' : 'no'}`);
    lines.push('');

    lines.push('## Request Status', '');
    lines.push(`- Mode: ${analysis.mode}`);
    lines.push(`- Request sent: ${analysis.requestResult.requestSent ? 'yes' : 'no'}`);
    lines.push(`- Real request: ${analysis.requestResult.realRequest ? 'yes' : 'no'}`);
    lines.push(`- Duration: ${analysis.requestResult.requestDurationMs ?? 'n/a'} ms`);
    lines.push(`- Model used: ${analysis.requestResult.modelUsed ?? 'n/a'}`);
    lines.push(`- Tokens: ${analysis.requestResult.totalTokens ?? 'n/a'}`);
    lines.push('');

    lines.push('## Response Status', '');
    lines.push(`- Status: ${analysis.responseStatus.status}`);
    lines.push(`- Parseable: ${analysis.responseStatus.parseable ? 'yes' : 'no'}`);
    lines.push(`- Preview: ${analysis.responseStatus.contentPreview ?? 'n/a'}`);
    lines.push(`- CONNECTIVITY_OK marker: ${analysis.responseStatus.containsConnectivityMarker ? 'yes' : 'no'}`);
    lines.push('');

    lines.push('## Errors', '');
    if (analysis.errorAnalysis) {
      lines.push(`- Class: ${analysis.errorAnalysis.errorClass}`);
      lines.push(`- Message: ${analysis.errorAnalysis.message}`);
      lines.push(`- Status code: ${analysis.errorAnalysis.statusCode ?? 'n/a'}`);
      lines.push(`- Retryable: ${analysis.errorAnalysis.retryable ? 'yes' : 'no'}`);
    } else {
      lines.push('- none');
    }
    lines.push('');

    lines.push('## Final Verdict', '');
    lines.push(`- Verdict: ${analysis.connectivityVerdict}`);
    lines.push(`- Real response received: ${analysis.realResponseReceived ? 'yes' : 'no'}`);
    lines.push(`- Summary: ${analysis.summary}`);
    lines.push('');
  }

  lines.push('---', '', `Pass token: ${OPENAI_CONNECTIVITY_PROOF_V1_PASS}`, '');
  return lines.join('\n');
}
