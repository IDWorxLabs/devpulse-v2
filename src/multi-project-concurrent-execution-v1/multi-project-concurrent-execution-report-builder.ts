/**
 * Multi-Project Concurrent Execution V1 — markdown report builder.
 */

import {
  MIN_CONCURRENT_PROJECTS_PROOF,
  MULTI_PROJECT_CONCURRENT_EXECUTION_V1_PASS_TOKEN,
  MULTI_PROJECT_CONCURRENT_EXECUTION_V1_REPORT_TITLE,
} from './multi-project-concurrent-execution-v1-bounds.js';
import type { MultiProjectConcurrentExecutionAssessment } from './multi-project-concurrent-execution-v1-types.js';

export function buildMultiProjectConcurrentExecutionV1ReportMarkdown(
  assessment: MultiProjectConcurrentExecutionAssessment,
): string {
  const projectRows = assessment.projectResults
    .map(
      (r) =>
        `| ${r.productName} | ${r.profile} | ${r.passed ? 'PASS' : 'FAIL'} | ${r.buildProof ? 'Yes' : 'No'} | ${r.previewProof ? 'Yes' : 'No'} | ${r.verificationProof ? 'Yes' : 'No'} | ${r.contaminationCheckPassed ? 'Clean' : 'CONTAMINATED'} |`,
    )
    .join('\n');

  return [
    `# ${MULTI_PROJECT_CONCURRENT_EXECUTION_V1_REPORT_TITLE.replace('.md', '')}`,
    '',
    `Generated: ${assessment.generatedAt}`,
    '',
    '## Executive Summary',
    '',
    'Multi-Project Concurrent Execution V1 proves AiDevEngine can execute multiple independent projects simultaneously without contamination, resource collision, or proof corruption.',
    '',
    `- Concurrent projects proven: ${assessment.concurrentProjectsProven}/${MIN_CONCURRENT_PROJECTS_PROOF}`,
    `- Concurrent pass rate: ${assessment.concurrentPassRate}%`,
    `- Contamination incidents: ${assessment.contaminationIncidents}`,
    `- Concurrent World2 executions: ${assessment.concurrentWorld2Executions}`,
    `- Concurrent proof status: ${assessment.concurrentProofStatus}`,
    '',
    '## Concurrent Project Results',
    '',
    '| Product | Profile | Result | Build | Preview | Verification | Isolation |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    projectRows,
    '',
    '## Verification Assessment',
    '',
    `| Metric | Rate |`,
    '| --- | ---: |',
    `| Build success | ${assessment.verificationAssessment.buildSuccessRate}% |`,
    `| Preview success | ${assessment.verificationAssessment.previewSuccessRate}% |`,
    `| Verification success | ${assessment.verificationAssessment.verificationSuccessRate}% |`,
    `| Production readiness | ${assessment.verificationAssessment.productionReadinessRate}% |`,
    `| Concurrent pass rate | ${assessment.verificationAssessment.concurrentPassRate}% |`,
    '',
    '## Queue Snapshot',
    '',
    `- Queued: ${assessment.queueSnapshot.queued}`,
    `- Active: ${assessment.queueSnapshot.active}`,
    `- Completed: ${assessment.queueSnapshot.completed}`,
    `- Failed: ${assessment.queueSnapshot.failed}`,
    '',
    '## Contamination Assessment',
    '',
    assessment.contaminationAssessment.passed
      ? 'No contamination incidents detected across concurrent projects.'
      : assessment.contaminationAssessment.violations.map((v) => `- ${v}`).join('\n'),
    '',
    '## Success Criteria',
    '',
    '| Question | Answer |',
    '| --- | --- |',
    `| Can multiple projects run simultaneously? | ${assessment.concurrentProjectsProven >= MIN_CONCURRENT_PROJECTS_PROOF ? 'Yes' : 'No'} |`,
    `| Can they build simultaneously? | ${assessment.verificationAssessment.buildSuccessRate >= 100 ? 'Yes' : 'Partial'} |`,
    `| Can they verify simultaneously? | ${assessment.verificationAssessment.verificationSuccessRate >= 100 ? 'Yes' : 'Partial'} |`,
    `| Can they remain isolated? | ${assessment.contaminationIncidents === 0 ? 'Yes' : 'No'} |`,
    `| Can World2 support concurrent execution? | ${assessment.concurrentWorld2Executions >= MIN_CONCURRENT_PROJECTS_PROOF ? 'Yes' : 'No'} |`,
    `| Can proof chains remain independent? | ${assessment.buildProof.allBuildProofComplete ? 'Yes' : 'No'} |`,
    '',
    '## Pass Token',
    '',
    assessment.passToken === MULTI_PROJECT_CONCURRENT_EXECUTION_V1_PASS_TOKEN
      ? `Pass token: \`${MULTI_PROJECT_CONCURRENT_EXECUTION_V1_PASS_TOKEN}\``
      : `Status: \`${assessment.passToken}\``,
    '',
  ].join('\n');
}
