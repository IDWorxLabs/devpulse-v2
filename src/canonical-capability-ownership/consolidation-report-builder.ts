/**
 * Canonical Capability Ownership V1 — consolidation report builder.
 */

import type { CanonicalOwnershipAssessment } from './canonical-capability-ownership-types.js';
import { CONSOLIDATION_GROUPS } from './consolidation-groups.js';
import { CANONICAL_CAPABILITY_OWNERSHIP_V1_PASS_TOKEN } from './ownership-registry.js';

function formatOwnershipRow(entry: {
  capability: string;
  owner: string;
  status: string;
  consumers: readonly string[];
}): string {
  const consumers =
    entry.consumers.length > 0 ? entry.consumers.slice(0, 3).join(', ') : '—';
  return `| ${entry.capability} | ${entry.owner} | ${consumers} | ${entry.status} |`;
}

export function buildConsolidationReportMarkdown(
  assessment: CanonicalOwnershipAssessment,
): string {
  const lines: string[] = [
    '# AiDevEngine Consolidation Report',
    '',
    '**Phase Next — Capability Consolidation V1**',
    `**Generated:** ${assessment.generatedAt.slice(0, 10)}`,
    '**Objective:** Reduce overlap, establish canonical owners, strengthen existing intelligence',
    '',
    `**Pass token:** \`${CANONICAL_CAPABILITY_OWNERSHIP_V1_PASS_TOKEN}\``,
    '',
    '---',
    '',
    '## Consolidation Principle',
    '',
    '```text',
    'One Capability',
    '=',
    'One Canonical Owner',
    '```',
    '',
    'Capabilities may have consumers and integrations.',
    'Capabilities may not have multiple authorities attempting to own the same responsibility.',
    '',
    '---',
    '',
    '## Executive Summary',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| Consolidation groups | ${assessment.consolidationGroupsComplete}/${assessment.consolidationGroupsTotal} complete |`,
    `| Merged capabilities | ${assessment.mergedCapabilities.length} |`,
    `| Removed capabilities | ${assessment.removedCapabilities.length} |`,
    `| Canonical owners registered | ${assessment.canonicalOwners.length} |`,
    `| Remaining duplicate-risk count | ${assessment.remainingDuplicateRiskCount} |`,
    '',
    '### Success Criteria',
    '',
    '- One Launch Decision Owner — **Autonomous Founder Launch Authority**',
    '- One Verification Owner — **Unified Verification Lab (UVL)**',
    '- One Requirement Intelligence Owner — **Clarifying Question Intelligence**',
    '- One World2 Owner — **World2 Disposable Workspace Pipeline (24E–24Y)**',
    '- No Navigation Review Authority — **REMOVED**',
    '',
    '---',
    '',
    '## Completed Merges',
    '',
  ];

  for (const group of CONSOLIDATION_GROUPS) {
    if (group.auditDecision !== 'MERGE') continue;
    lines.push(`### ${group.id.replaceAll('_', ' ')}`);
    lines.push('');
    lines.push(`**Decision:** MERGE → **${group.target}**`);
    lines.push('');
    lines.push(`**Reason:** ${group.reason}`);
    lines.push('');
    lines.push('**Merged capabilities:**');
    for (const merged of group.mergedCapabilities) {
      lines.push(`- ${merged}`);
    }
    lines.push('');
    lines.push('**Canonical responsibilities:**');
    for (const responsibility of group.responsibilities) {
      lines.push(`- ${responsibility}`);
    }
    lines.push('');
    lines.push(`**Validation:** ${group.validationCriterion}`);
    lines.push('');
  }

  lines.push('---', '', '## Removed Capabilities', '');

  for (const group of CONSOLIDATION_GROUPS) {
    if (group.auditDecision !== 'REMOVE') continue;
    lines.push(`### ${group.mergedCapabilities.join(', ')}`);
    lines.push('');
    lines.push(`**Decision:** REMOVE`);
    lines.push('');
    lines.push(`**Covered by:** ${group.target}`);
    lines.push('');
    lines.push(`**Reason:** ${group.reason}`);
    lines.push('');
    lines.push(`**Validation:** ${group.validationCriterion}`);
    lines.push('');
  }

  lines.push('---', '', '## Canonical Ownership Map', '');
  lines.push(
    '| Capability | Owner | Consumers | Status |',
    '|------------|-------|-----------|--------|',
  );

  for (const entry of assessment.entries) {
    lines.push(formatOwnershipRow(entry));
  }

  lines.push('', '---', '', '## Remaining Duplicate-Risk Count', '');
  lines.push(`**${assessment.remainingDuplicateRiskCount}** unresolved high duplicate-risk ownership conflicts.`);
  lines.push('');

  lines.push('---', '', '## Future Consolidation Recommendations', '');
  for (const recommendation of assessment.futureConsolidationRecommendations) {
    lines.push(`- ${recommendation}`);
  }

  lines.push('', '---', '', '## Consolidation Groups Summary', '');
  lines.push(
    '| Group | Decision | Target | Status |',
    '|-------|----------|--------|--------|',
  );

  for (const group of CONSOLIDATION_GROUPS) {
    const complete = assessment.consolidationGroupsComplete === assessment.consolidationGroupsTotal;
    lines.push(
      `| ${group.id.replaceAll('_', ' ')} | ${group.auditDecision} | ${group.target} | ${complete ? 'COMPLETE' : 'INCOMPLETE'} |`,
    );
  }

  lines.push('');
  return lines.join('\n');
}
