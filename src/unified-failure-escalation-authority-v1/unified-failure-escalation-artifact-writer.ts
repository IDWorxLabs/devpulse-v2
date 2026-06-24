/**
 * Unified Failure Escalation Authority V1 — artifact persistence.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_ARTIFACT_DIR } from './unified-failure-escalation-v1-bounds.js';
import type { UnifiedFailureEscalationAssessment } from './unified-failure-escalation-v1-types.js';

export function writeUnifiedFailureEscalationArtifacts(
  projectRootDir: string,
  assessment: UnifiedFailureEscalationAssessment,
): void {
  const dir = join(projectRootDir, UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, 'incident-registry.json'),
    `${JSON.stringify(assessment.registry, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'severity-distribution.json'),
    `${JSON.stringify(assessment.severityDistribution, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'root-cause-analysis.json'),
    `${JSON.stringify(assessment.rootCauseAnalysis, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'escalation-decisions.json'),
    `${JSON.stringify(
      { generatedAt: assessment.generatedAt, decisions: assessment.escalationDecisions },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'repeated-failure-analysis.json'),
    `${JSON.stringify(
      { generatedAt: assessment.generatedAt, analyses: assessment.repeatedFailureAnalysis },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'effectiveness-assessment.json'),
    `${JSON.stringify(assessment.effectivenessAssessment, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'audit-impact.json'),
    `${JSON.stringify(assessment.auditImpact, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(join(dir, 'assessment.json'), `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
}
