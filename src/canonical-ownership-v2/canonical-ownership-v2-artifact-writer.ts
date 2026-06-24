/**
 * Canonical Ownership V2 Registration — artifact persistence.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CANONICAL_OWNERSHIP_V2_ARTIFACT_DIR } from './canonical-ownership-v2-bounds.js';
import type { CanonicalOwnershipV2Assessment } from './canonical-ownership-v2-types.js';

export function writeCanonicalOwnershipV2Artifacts(
  projectRootDir: string,
  assessment: CanonicalOwnershipV2Assessment,
): void {
  const dir = join(projectRootDir, CANONICAL_OWNERSHIP_V2_ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, 'ownership-registry.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, entries: assessment.entries }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'ownership-graph.json'),
    `${JSON.stringify(assessment.graph, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'orphan-capabilities.json'),
    `${JSON.stringify(
      { generatedAt: assessment.generatedAt, orphans: assessment.orphanCapabilities },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'ownership-collisions.json'),
    `${JSON.stringify(
      { generatedAt: assessment.generatedAt, collisions: assessment.ownershipCollisions },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'duplicate-risk-resolution.json'),
    `${JSON.stringify(
      { generatedAt: assessment.generatedAt, resolutions: assessment.duplicateRiskResolutions },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'audit-impact.json'),
    `${JSON.stringify(assessment.auditImpact, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(join(dir, 'assessment.json'), `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
}
