/**
 * Connected Preview Experience Proof — markdown report builder.
 */

import {
  CONNECTED_PREVIEW_EXPERIENCE_PROOF_CORE_QUESTION,
  CONNECTED_PREVIEW_EXPERIENCE_PROOF_PASS_TOKEN,
  CONNECTED_PREVIEW_EXPERIENCE_PROOF_PHASE,
  CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPORT_TITLE,
  SAFETY_GUARANTEES,
} from './connected-preview-experience-proof-registry.js';
import type { PreviewExperienceProofReport } from './connected-preview-experience-proof-types.js';

export function buildPreviewExperienceProofReportMarkdown(
  report: PreviewExperienceProofReport,
): string {
  const lines: string[] = [
    `# ${CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    CONNECTED_PREVIEW_EXPERIENCE_PROOF_CORE_QUESTION,
    '',
    '## Phase',
    '',
    CONNECTED_PREVIEW_EXPERIENCE_PROOF_PHASE,
    '',
    '## CONNECTED PREVIEW EXPERIENCE PROOF',
    '',
    `**Preview proof level:** ${report.previewProofLevel}`,
    `**Preview state:** ${report.previewState}`,
    `**Runtime activation proven:** ${report.runtimeActivationProven ? 'YES' : 'NO'}`,
    '',
    '## Preview State',
    '',
    `- state: **${report.previewState}**`,
    `- proof level: **${report.previewProofLevel}**`,
    '',
    '## Preview Session Evidence',
    '',
    `- session observed: ${report.session.sessionObserved}`,
    `- session id: ${report.session.sessionId ?? 'none'}`,
    `- workspace linked: ${report.session.workspaceLinked}`,
    `- runtime linked: ${report.session.runtimeLinked}`,
    '',
    '## Preview URL Evidence',
    '',
    `- url observed: ${report.url.urlObserved}`,
    `- url reachable: ${report.url.urlReachable}`,
    `- preview url: ${report.url.previewUrl ?? 'none'}`,
    '',
    '## Render Evidence',
    '',
    `- render state: **${report.render.renderState}**`,
    `- application rendered: ${report.render.applicationRendered}`,
    `- title: ${report.render.applicationTitle ?? 'none'}`,
    '',
    '## Interaction Evidence',
    '',
    `- interaction state: **${report.interaction.interactionState}**`,
    `- interactive elements: ${report.interaction.interactiveElements.length}`,
    '',
    '## Capture Evidence',
    '',
    `- capture state: ${report.captures.captureState}`,
    `- capture count: ${report.captures.captureCount}`,
    '',
    '## Manifest Evidence',
    '',
    `- manifest exists: ${report.manifest.manifestExists}`,
    `- runtime linked: ${report.manifest.runtimeLinked}`,
    `- traceability score: ${report.manifest.traceabilityScore}/100`,
    '',
    '## Linkage Analysis',
    '',
    `- preview linkage connected: **${report.linkage.previewLinkageConnected ? 'YES' : 'NO'}**`,
    `- first broken preview link: ${report.linkage.firstBrokenPreviewLink ?? 'none'}`,
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
  lines.push(`| Can founder see app? | ${report.founderQuestions.canFounderSeeApp ? 'YES' : 'NO'} |`);
  lines.push(
    `| Can founder interact? | ${report.founderQuestions.canFounderInteractWithApp ? 'YES' : 'NO'} |`,
  );

  lines.push('');
  lines.push('## Safety Guarantees');
  lines.push('');
  for (const g of SAFETY_GUARANTEES) {
    lines.push(`- ${g}`);
  }

  lines.push('');
  lines.push(`Pass token: \`${CONNECTED_PREVIEW_EXPERIENCE_PROOF_PASS_TOKEN}\``);
  lines.push('');

  return lines.join('\n');
}

export function formatPreviewExperienceProofSummary(report: PreviewExperienceProofReport): string {
  return (
    `Connected Preview Experience Proof: ${report.previewProofLevel} — ` +
    `state ${report.previewState}, ` +
    `linkage ${report.linkage.previewLinkageConnected ? 'connected' : 'broken'}` +
    (report.url.previewUrl ? ` (${report.url.previewUrl})` : '.')
  );
}
