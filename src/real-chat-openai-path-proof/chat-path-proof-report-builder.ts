/**
 * Chat Path Proof Report Builder — markdown proof report (V1).
 */

import {
  REAL_CHAT_OPENAI_PATH_PROOF_REPORT_TITLE,
  REAL_CHAT_OPENAI_PATH_PROOF_V1_PASS,
} from './real-chat-openai-path-registry.js';
import type {
  ChatPathProofHistoryEntry,
  RealChatOpenAiPathProofReport,
  RealChatOpenAiPathProofResult,
} from './real-chat-openai-path-types.js';

export function buildRealChatOpenAiPathProofReport(input: {
  results: readonly RealChatOpenAiPathProofResult[];
  history: readonly ChatPathProofHistoryEntry[];
}): RealChatOpenAiPathProofReport {
  const latestResult = input.results[0] ?? null;

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    totalProofs: input.history.length,
    latestResult,
    historySummary: {
      totalProofs: input.history.length,
      connectedCount: input.history.filter((entry) => entry.finalVerdict === 'CHAT_OPENAI_CONNECTED').length,
      partialCount: input.history.filter((entry) => entry.finalVerdict === 'CHAT_OPENAI_PARTIAL').length,
      disconnectedCount: input.history.filter((entry) => entry.finalVerdict === 'CHAT_OPENAI_DISCONNECTED').length,
      realModeConnectedCount: input.history.filter(
        (entry) => entry.mode === 'real' && entry.finalVerdict === 'CHAT_OPENAI_CONNECTED',
      ).length,
    },
  };
}

export function buildRealChatOpenAiPathProofReportMarkdown(
  report: RealChatOpenAiPathProofReport,
  results: readonly RealChatOpenAiPathProofResult[] = report.latestResult ? [report.latestResult] : [],
): string {
  const lines: string[] = [
    `# ${REAL_CHAT_OPENAI_PATH_PROOF_REPORT_TITLE}`,
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

  for (const result of results) {
    lines.push('## Provider Resolution', '');
    lines.push(`- Provider resolved: ${result.providerResolution.providerResolved ?? 'none'}`);
    lines.push(`- OpenAI selected: ${result.providerResolution.openAiProviderSelected ? 'yes' : 'no'}`);
    lines.push(`- Routing valid: ${result.providerResolution.providerRoutingValid ? 'yes' : 'no'}`);
    lines.push(`- Connectivity prerequisites: ${result.providerResolution.connectivityPrerequisitesMet ? 'yes' : 'no'}`);
    lines.push(`- Model: ${result.providerResolution.model ?? 'n/a'}`);
    lines.push(`- Reason: ${result.providerResolution.reason}`);
    lines.push('');

    lines.push('## Request Status', '');
    lines.push(`- Mode: ${result.mode}`);
    lines.push(`- Test message: ${result.testMessage.content}`);
    lines.push(`- Key status: ${result.keyStatus.status}`);
    lines.push(`- Request sent: ${result.requestResult.requestSent ? 'yes' : 'no'}`);
    lines.push(`- Real request: ${result.requestResult.realRequest ? 'yes' : 'no'}`);
    lines.push(`- Used LLM: ${result.requestResult.usedLlm ? 'yes' : 'no'}`);
    lines.push(`- Fallback used: ${result.requestResult.fallbackUsed ? 'yes' : 'no'}`);
    lines.push(`- Duration: ${result.requestResult.requestDurationMs ?? 'n/a'} ms`);
    lines.push(`- Provider used: ${result.requestResult.providerUsed ?? 'n/a'}`);
    lines.push('');

    lines.push('## Response Status', '');
    lines.push(`- Validation: ${result.responseValidation.status}`);
    lines.push(`- Founder-facing quality: ${result.responseValidation.founderFacingQualityScore}/100`);
    lines.push(`- Mentions AiDevEngine: ${result.responseValidation.mentionsAiDevEngine ? 'yes' : 'no'}`);
    lines.push(`- Preview: ${result.responseValidation.contentPreview ?? 'n/a'}`);
    lines.push(`- Reason: ${result.responseValidation.reason}`);
    lines.push('');

    lines.push('## Founder-Facing Validation', '');
    lines.push(`- Non-empty: ${result.responseValidation.nonEmpty ? 'yes' : 'no'}`);
    lines.push(`- Parseable: ${result.responseValidation.parseable ? 'yes' : 'no'}`);
    lines.push(`- Exposes secrets: ${result.responseValidation.exposesSecrets ? 'yes' : 'no'}`);
    lines.push(`- Placeholder detected: ${result.responseValidation.placeholderDetected ? 'yes' : 'no'}`);
    lines.push('');

    lines.push('## Errors', '');
    if (result.errorAnalysis) {
      lines.push(`- Class: ${result.errorAnalysis.errorClass}`);
      lines.push(`- Message: ${result.errorAnalysis.message}`);
    } else {
      lines.push('- none');
    }
    lines.push('');

    lines.push('## Final Verdict', '');
    lines.push(`- Verdict: ${result.finalVerdict}`);
    lines.push(`- Real response received: ${result.realResponseReceived ? 'yes' : 'no'}`);
    lines.push(`- Summary: ${result.summary}`);
    lines.push('');
  }

  lines.push('---', '', `Pass token: ${REAL_CHAT_OPENAI_PATH_PROOF_V1_PASS}`, '');
  return lines.join('\n');
}
