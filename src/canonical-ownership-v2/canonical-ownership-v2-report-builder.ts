/**
 * Canonical Ownership V2 Registration — markdown report builder.
 */

import {
  CANONICAL_OWNERSHIP_V2_PASS_TOKEN,
  CANONICAL_OWNERSHIP_V2_REGISTRATION_REPORT_TITLE,
  REGISTRATION_SCOPE_CAPABILITY_IDS,
} from './canonical-ownership-v2-bounds.js';
import type { CanonicalOwnershipV2Assessment } from './canonical-ownership-v2-types.js';

export function buildCanonicalOwnershipV2ReportMarkdown(
  assessment: CanonicalOwnershipV2Assessment,
): string {
  const ownerRows = assessment.graph.nodes
    .map(
      (node) =>
        `| ${node.owner} | ${node.capabilities.length} | ${node.consumers.length} | ${node.providers.length} |`,
    )
    .join('\n');

  const capabilityRows = assessment.entries
    .map(
      (e) =>
        `| ${e.capabilityName} | ${e.canonicalOwner} | ${e.status} | ${e.maturity} | \`${e.passToken}\` |`,
    )
    .join('\n');

  const resolutionRows = assessment.duplicateRiskResolutions
    .map((r) => `| ${r.pair} | ${r.resolved ? 'RESOLVED' : 'OPEN'} | ${r.boundary} |`)
    .join('\n');

  return [
    `# ${CANONICAL_OWNERSHIP_V2_REGISTRATION_REPORT_TITLE.replace('.md', '')}`,
    '',
    `Generated: ${assessment.generatedAt}`,
    '',
    '## Executive Summary',
    '',
    'Canonical Ownership V2 registers all post-V1/V2 proof capabilities under one canonical owner each, eliminating orphan capabilities and duplicate-risk false positives.',
    '',
    `- Registered capabilities: ${assessment.registeredCapabilities}/${REGISTRATION_SCOPE_CAPABILITY_IDS.length} in scope`,
    `- Registration scope complete: ${assessment.registrationScopeComplete ? 'Yes' : 'No'}`,
    `- Orphan critical capabilities: ${assessment.orphanCriticalCount}`,
    `- Ownership collisions: ${assessment.collisionCount}`,
    `- Duplicate risks resolved: ${assessment.duplicateRisksResolved}`,
    `- Ownership proof status: ${assessment.ownershipProofStatus}`,
    '',
    '## Canonical Owners',
    '',
    '| Owner | Capabilities | Consumers | Providers |',
    '| --- | ---: | ---: | ---: |',
    ownerRows,
    '',
    '## Registered Capabilities',
    '',
    '| Capability | Canonical Owner | Status | Maturity | Pass Token |',
    '| --- | --- | --- | --- | --- |',
    capabilityRows,
    '',
    '## Duplicate-Risk Resolution',
    '',
    '| Pair | Status | Boundary |',
    '| --- | --- | --- |',
    resolutionRows,
    '',
    '## Orphan Detection',
    '',
    assessment.orphanCapabilities.length === 0
      ? 'No orphan capabilities detected.'
      : assessment.orphanCapabilities
          .map((o) => `- **${o.capabilityName}** — missing: ${o.missingFields.join(', ')}`)
          .join('\n'),
    '',
    '## Ownership Collisions',
    '',
    assessment.ownershipCollisions.length === 0
      ? 'No ownership collisions detected.'
      : assessment.ownershipCollisions
          .map((c) => `- **${c.collisionType}** — ${c.detail}`)
          .join('\n'),
    '',
    '## Audit Impact',
    '',
    `- Canonical ownership gap closed: ${assessment.auditImpact.canonicalOwnershipGapClosed ? 'Yes' : 'No'}`,
    `- Duplicate-risk false positives reduced: ${assessment.auditImpact.duplicateRiskFalsePositivesReduced}`,
    `- Audit should report: ${assessment.auditImpact.auditShouldReport}`,
    '',
    '## Pass Token',
    '',
    assessment.passToken === CANONICAL_OWNERSHIP_V2_PASS_TOKEN
      ? `Pass token: \`${CANONICAL_OWNERSHIP_V2_PASS_TOKEN}\``
      : `Status: \`${assessment.passToken}\``,
    '',
  ].join('\n');
}
