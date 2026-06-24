/**
 * World2 Real Instantiation V1 — markdown report builder.
 */

import {
  WORLD2_REAL_INSTANTIATION_V1_PASS_TOKEN,
  WORLD2_REAL_INSTANTIATION_V1_REPORT_TITLE,
} from './world2-real-instantiation-v1-bounds.js';
import type { World2RealInstantiationAssessment } from './world2-real-instantiation-v1-types.js';

export function buildWorld2RealInstantiationV1ReportMarkdown(
  assessment: World2RealInstantiationAssessment,
): string {
  return [
    `# ${WORLD2_REAL_INSTANTIATION_V1_REPORT_TITLE.replace('.md', '')}`,
    '',
    `Generated: ${assessment.generatedAt}`,
    '',
    '## Executive Summary',
    '',
    `World2 Real Instantiation V1 proves disposable, isolated execution worlds with real filesystem instantiation.`,
    '',
    `- Worlds instantiated: ${assessment.worldsInstantiated}`,
    `- Worlds executed: ${assessment.worldsExecuted}`,
    `- Worlds completed: ${assessment.worldsCompleted}`,
    `- Contamination incidents: ${assessment.contaminationIncidents}`,
    `- World1 protected: ${assessment.world1Protected ? 'Yes' : 'No'}`,
    `- Instantiation proof: ${assessment.instantiationProofStatus}`,
    '',
    '## Multi-World Results',
    '',
    ...assessment.multiWorldResults.map(
      (r) =>
        `- **${r.productName}** (${r.profile}) — ${r.executionMode} — ${r.passed ? 'PASS' : 'FAIL'} — build ${r.buildProof} preview ${r.previewProof} verify ${r.verificationProof}`,
    ),
    '',
    '## Isolation Proof',
    '',
    `- Workspace separation: ${assessment.isolationProof.workspaceSeparation}`,
    `- Artifact separation: ${assessment.isolationProof.artifactSeparation}`,
    `- Build separation: ${assessment.isolationProof.buildSeparation}`,
    `- Preview separation: ${assessment.isolationProof.previewSeparation}`,
    `- Execution separation: ${assessment.isolationProof.executionSeparation}`,
    `- World1 protected: ${assessment.isolationProof.world1Protected}`,
    '',
    '## Pass Token',
    '',
    assessment.passToken === WORLD2_REAL_INSTANTIATION_V1_PASS_TOKEN
      ? `Pass token: \`${WORLD2_REAL_INSTANTIATION_V1_PASS_TOKEN}\``
      : `Status: \`${assessment.passToken}\``,
    '',
  ].join('\n');
}
