/**
 * Connected Runtime Activation Proof — markdown report builder.
 */

import {
  CONNECTED_RUNTIME_ACTIVATION_PROOF_CORE_QUESTION,
  CONNECTED_RUNTIME_ACTIVATION_PROOF_PASS_TOKEN,
  CONNECTED_RUNTIME_ACTIVATION_PROOF_PHASE,
  CONNECTED_RUNTIME_ACTIVATION_PROOF_REPORT_TITLE,
  SAFETY_GUARANTEES,
} from './connected-runtime-activation-proof-registry.js';
import type { RuntimeActivationProofReport } from './connected-runtime-activation-proof-types.js';

export function buildRuntimeActivationProofReportMarkdown(
  report: RuntimeActivationProofReport,
): string {
  const lines: string[] = [
    `# ${CONNECTED_RUNTIME_ACTIVATION_PROOF_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    CONNECTED_RUNTIME_ACTIVATION_PROOF_CORE_QUESTION,
    '',
    '## Phase',
    '',
    CONNECTED_RUNTIME_ACTIVATION_PROOF_PHASE,
    '',
    '## CONNECTED RUNTIME ACTIVATION PROOF',
    '',
    `**Runtime proof level:** ${report.runtimeProofLevel}`,
    `**Runtime activation state:** ${report.runtimeActivationState}`,
    `**Build materialization proven:** ${report.buildMaterializationProven ? 'YES' : 'NO'}`,
    '',
    '## Runtime Activation State',
    '',
    `- state: **${report.runtimeActivationState}**`,
    `- proof level: **${report.runtimeProofLevel}**`,
    '',
    '## Runtime Command Evidence',
    '',
    `- command found: ${report.command.runtimeCommandFound}`,
    `- command: ${report.command.command ?? 'none'}`,
    `- working directory: ${report.command.workingDirectory ?? 'none'}`,
    `- script: ${report.command.scriptName ?? 'none'}`,
    `- framework hint: ${report.command.frameworkHint ?? 'none'}`,
    `- execution observed: ${report.command.executionObserved}`,
    '',
    '## Runtime Process Evidence',
    '',
    `- process state: **${report.process.processState}**`,
    `- process id: ${report.process.processId ?? 'none'}`,
    `- session id: ${report.process.runtimeSessionId ?? 'none'}`,
    '',
    '## Runtime Port Evidence',
    '',
    `- port state: **${report.port.portState}**`,
    `- port: ${report.port.port ?? 'none'}`,
    `- url: ${report.port.url ?? 'none'}`,
    `- reachable: ${report.port.reachable}`,
    '',
    '## Runtime Health Evidence',
    '',
    `- health state: **${report.health.healthState}**`,
    `- status code: ${report.health.statusCode ?? 'none'}`,
    `- response type: ${report.health.responseType ?? 'none'}`,
    '',
    '## Runtime Logs',
    '',
    `- boot complete: ${report.logs.bootComplete}`,
    `- ready signal: ${report.logs.readySignalFound}`,
    `- fatal error: ${report.logs.fatalErrorFound}`,
    `- warnings: ${report.logs.warningCount} · errors: ${report.logs.errorCount}`,
    '',
    '## Runtime Manifest',
    '',
    `- manifest exists: ${report.manifest.manifestExists}`,
    `- contract linked: ${report.manifest.contractLinked}`,
    `- workspace linked: ${report.manifest.workspaceLinked}`,
    `- process linked: ${report.manifest.processLinked}`,
    `- port linked: ${report.manifest.portLinked}`,
    `- traceability score: ${report.manifest.traceabilityScore}/100`,
    '',
    '## Runtime Linkage Analysis',
    '',
    `- runtime linkage connected: **${report.linkage.runtimeLinkageConnected ? 'YES' : 'NO'}**`,
    `- first broken runtime link: ${report.linkage.firstBrokenRuntimeLink ?? 'none'}`,
    `- traceability score: ${report.linkage.traceabilityScore}/100`,
    '',
    '## Missing Evidence',
    '',
  ];

  for (const item of report.missingEvidence) {
    lines.push(`- ${item}`);
  }

  lines.push('');
  lines.push('## Recommended Fix');
  lines.push('');
  lines.push(report.recommendedFix);
  lines.push('');
  lines.push('## Founder Questions');
  lines.push('');
  lines.push('| Question | Answer |');
  lines.push('|----------|--------|');
  lines.push(`| Can application run? | ${report.founderQuestions.canApplicationRun ? 'YES' : 'NO'} |`);
  lines.push(`| Can runtime be reached? | ${report.founderQuestions.canRuntimeBeReached ? 'YES' : 'NO'} |`);
  lines.push(`| Command used | ${report.founderQuestions.commandUsed ?? 'none'} |`);
  lines.push(`| Port/URL observed | ${report.founderQuestions.portOrUrlObserved ?? 'none'} |`);

  if (report.activationEvidence) {
    const ev = report.activationEvidence;
    lines.push('');
    lines.push('## Runtime Activation Proof');
    lines.push('');
    lines.push(`- workspace path: ${ev.workspacePath}`);
    lines.push(`- runtime command: ${ev.runtimeCommand ?? 'none'}`);
    lines.push(`- process observed: ${ev.processState === 'STARTED' ? 'YES' : 'NO'} (pid ${ev.processId ?? 'none'})`);
    lines.push(`- port reachable: ${ev.portReachable ? 'YES' : 'NO'} (${ev.detectedPort ?? 'none'})`);
    lines.push(`- health verified: ${ev.healthResponded ? 'YES' : 'NO'} (${ev.responseCode ?? 'none'})`);
    lines.push(`- proof level: **${ev.proofLevel}**`);
    lines.push('');
    lines.push('## First Broken Runtime Link');
    lines.push('');
    lines.push(ev.firstBrokenRuntimeLink ?? 'none');
  }

  lines.push('');
  lines.push('## Safety Guarantees');
  lines.push('');
  for (const g of SAFETY_GUARANTEES) {
    lines.push(`- ${g}`);
  }

  lines.push('');
  lines.push(`Pass token: \`${CONNECTED_RUNTIME_ACTIVATION_PROOF_PASS_TOKEN}\``);
  lines.push('');

  return lines.join('\n');
}

export function formatRuntimeActivationProofSummary(report: RuntimeActivationProofReport): string {
  return (
    `Connected Runtime Activation Proof: ${report.runtimeProofLevel} — ` +
    `state ${report.runtimeActivationState}, ` +
    `linkage ${report.linkage.runtimeLinkageConnected ? 'connected' : 'broken'}` +
    (report.port.url ? ` (${report.port.url})` : '.')
  );
}
