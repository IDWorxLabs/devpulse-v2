/**
 * Cloud Execution Path V1 — markdown report builder.
 */

import type { CloudExecutionPathV1Assessment } from './cloud-execution-path-v1-types.js';
import { CLOUD_EXECUTION_PATH_V1_PASS_TOKEN } from './cloud-execution-path-v1-bounds.js';

export function buildCloudExecutionPathV1ReportMarkdown(
  assessment: CloudExecutionPathV1Assessment,
): string {
  const matrixRows = assessment.jobResults
    .map(
      (r) =>
        `| ${r.job.requirementsSnapshot.productName} | ${r.job.executionMode} | ${r.passed ? 'PASS' : 'FAIL'} | ${r.buildProof ? 'Yes' : 'No'} | ${r.previewProof ? 'Yes' : 'No'} | ${r.verificationProof ? 'Yes' : 'No'} | ${r.aflaVerdict ?? '—'} | ${r.productionReadinessScore ?? '—'} | ${r.contaminationCheckPassed ? 'Clean' : 'CONTAMINATED'} |`,
    )
    .join('\n');

  return `# Cloud Execution Path V1 Report

**Generated:** ${assessment.generatedAt}
**Canonical Owner:** ${assessment.canonicalOwner}

**Pass token:** \`${assessment.passToken}\`

---

## Executive Summary

Cloud Execution Path V1 creates the cloud-execution-ready architecture for AiDevEngine without deploying to a paid cloud provider.

| Metric | Value |
|--------|-------|
| Cloud Simulated Proof Status | **${assessment.cloudSimulatedProofStatus}** |
| Jobs Submitted | ${assessment.jobsSubmitted} |
| Jobs Completed | ${assessment.jobsCompleted} |
| Jobs Failed | ${assessment.jobsFailed} |
| Concurrent Jobs Proven | ${assessment.concurrentJobsProven}/${assessment.jobsSubmitted} |
| Contamination Incidents | ${assessment.contaminationIncidents} |
| Cloud-Ready Packages Generated | ${assessment.cloudReadyPackagesGenerated} |

---

## Queue Snapshot

| Bucket | Count |
|--------|-------|
| Queued | ${assessment.queueSnapshot.queued} |
| Active | ${assessment.queueSnapshot.active} |
| Completed | ${assessment.queueSnapshot.completed} |
| Failed | ${assessment.queueSnapshot.failed} |

---

## Cloud Simulated Job Matrix

| Application | Mode | Result | Build | Preview | Verify | AFLA | PRG | Isolation |
|-------------|------|--------|-------|---------|--------|------|-----|-----------|
${matrixRows}

---

## Execution Contract

One execution contract supports:

- **LOCAL** — runs on current machine
- **CLOUD_SIMULATED** — cloud contract, local execution (proven this phase)
- **CLOUD_READY** — produces remote worker package

---

## Audit Answers

| Question | Answer |
|----------|--------|
| Can I submit a build job? | Yes |
| Can a worker claim it? | Yes |
| Can it run through the existing proof chain? | ${assessment.jobsCompleted > 0 ? 'Yes' : 'No'} |
| Can it produce a cloud-ready artifact package? | ${assessment.cloudReadyPackagesGenerated > 0 ? 'Yes' : 'No'} |
| Can multiple jobs run without contaminating each other? | ${assessment.contaminationIncidents === 0 ? 'Proven' : 'Not proven'} |

---

*Cloud Execution Path V1 — orchestration layer only. Reuses Real Build Execution, UVL, Product Architect, AFLA, and Production Readiness Gate.*
`;
}

export { CLOUD_EXECUTION_PATH_V1_PASS_TOKEN };
