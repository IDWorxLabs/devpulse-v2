/**
 * Founder Acceptance Gate — markdown report builder.
 */

import {
  FOUNDER_ACCEPTANCE_GATE_PASS_TOKEN,
  FOUNDER_ACCEPTANCE_GATE_PHASE,
  FOUNDER_ACCEPTANCE_GATE_REPORT_TITLE,
  REQUIRED_ACCEPTANCE_AUTHORITY_LABELS,
} from './founder-acceptance-gate-registry.js';
import type { FounderAcceptanceReport } from './founder-acceptance-gate-types.js';

export function buildFounderAcceptanceGateReportMarkdown(report: FounderAcceptanceReport): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${FOUNDER_ACCEPTANCE_GATE_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Phase',
    '',
    report.phaseName,
    '',
    '## Purpose',
    '',
    report.purpose,
    '',
    '## Core Question',
    '',
    assessment.coreQuestion,
    '',
    '## Verdict',
    '',
    `**${assessment.acceptanceState}**`,
    '',
    '## Confidence',
    '',
    `**${assessment.acceptanceConfidence}/100**`,
    '',
    '| Factor | Points |',
    '|--------|--------|',
    `| Authority coverage | ${assessment.confidenceBreakdown.authorityCoverage}/${25} |`,
    `| Proof quality | ${assessment.confidenceBreakdown.proofQuality}/${25} |`,
    `| Simulation quality | ${assessment.confidenceBreakdown.simulationQuality}/${20} |`,
    `| Requirement completeness | ${assessment.confidenceBreakdown.requirementCompleteness}/${15} |`,
    `| Founder readiness | ${assessment.confidenceBreakdown.founderReadiness}/${15} |`,
    '',
    '## Required Authority Inputs',
    '',
    '| Authority | Available | Score |',
    '|-----------|-----------|-------|',
  ];

  for (const authority of assessment.inputSnapshot.requiredAuthorities) {
    lines.push(
      `| ${REQUIRED_ACCEPTANCE_AUTHORITY_LABELS[authority.authorityId]} | ${authority.available ? 'yes' : 'no'} | ${authority.score}/100 |`,
    );
  }

  lines.push('');
  lines.push(`Founder Test score: **${assessment.inputSnapshot.founderTestScore}/100** (${assessment.inputSnapshot.founderTestVerdict})`);
  lines.push('');

  const section = (title: string, items: string[]) => {
    lines.push(`## ${title}`);
    lines.push('');
    if (items.length === 0) {
      lines.push('- None');
    } else {
      for (const item of items.slice(0, 12)) {
        lines.push(`- ${item}`);
      }
    }
    lines.push('');
  };

  section('Accepted Because', assessment.reasons.acceptedBecause);
  section('Rejected Because', assessment.reasons.rejectedBecause);
  section('Warnings', assessment.reasons.warningReasons);
  section('Blockers', assessment.reasons.blockingReasons);
  section('Required Next Actions', assessment.reasons.requiredNextActions);

  lines.push('## Pass Token');
  lines.push('');
  lines.push(FOUNDER_ACCEPTANCE_GATE_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
