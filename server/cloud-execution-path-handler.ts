/**
 * Cloud Execution Path Operator API — read-only cloud execution visibility.
 */

import {
  getLastCloudExecutionAssessment,
  listCloudExecutionHistory,
  CLOUD_EXECUTION_PATH_V1_PASS_TOKEN,
  runCloudExecutionPathV1,
  getCloudExecutionQueueSnapshot,
} from '../src/cloud-execution-path-v1/index.js';
import type { CloudExecutionPathV1Assessment } from '../src/cloud-execution-path-v1/cloud-execution-path-v1-types.js';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export { CLOUD_EXECUTION_PATH_V1_PASS_TOKEN };

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export interface CloudExecutionPayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_cloud_execution_path_v1';
  canonicalOwner: 'Cloud Execution Path V1';
  passToken: string;
  cloudSimulatedProofStatus: string;
  jobsSubmitted: number;
  jobsCompleted: number;
  jobsFailed: number;
  contaminationIncidents: number;
  queuedJobs: readonly {
    jobId: string;
    productName: string;
    executionMode: string;
    status: string;
    requestedAt: string;
  }[];
  activeJobs: readonly {
    jobId: string;
    productName: string;
    executionMode: string;
    status: string;
    currentStage: string | null;
    workerId: string | null;
  }[];
  completedJobs: readonly {
    jobId: string;
    productName: string;
    executionMode: string;
    overallScore: number | null;
    verdict: string | null;
    runtimeDurationMs: number | null;
    artifactStatus: Record<string, boolean>;
  }[];
  failedJobs: readonly {
    jobId: string;
    productName: string;
    failureClass: string | null;
    detail: string | null;
  }[];
  assessment: CloudExecutionPathV1Assessment | null;
}

function mapAssessmentToPayload(
  assessment: CloudExecutionPathV1Assessment,
  projectRootDir: string,
): CloudExecutionPayload {
  const queue = getCloudExecutionQueueSnapshot(projectRootDir);

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_cloud_execution_path_v1',
    canonicalOwner: 'Cloud Execution Path V1',
    passToken: assessment.passToken,
    cloudSimulatedProofStatus: assessment.cloudSimulatedProofStatus,
    jobsSubmitted: assessment.jobsSubmitted,
    jobsCompleted: assessment.jobsCompleted,
    jobsFailed: assessment.jobsFailed,
    contaminationIncidents: assessment.contaminationIncidents,
    queuedJobs: queue.queuedJobs.map((j) => ({
      jobId: j.jobId,
      productName: j.requirementsSnapshot.productName,
      executionMode: j.executionMode,
      status: j.status,
      requestedAt: j.requestedAt,
    })),
    activeJobs: queue.activeJobs.map((j) => ({
      jobId: j.jobId,
      productName: j.requirementsSnapshot.productName,
      executionMode: j.executionMode,
      status: j.status,
      currentStage: j.currentStage,
      workerId: j.workerId,
    })),
    completedJobs: assessment.jobResults
      .filter((r) => r.passed)
      .map((r) => ({
        jobId: r.job.jobId,
        productName: r.job.requirementsSnapshot.productName,
        executionMode: r.job.executionMode,
        overallScore: r.productionReadinessScore,
        verdict: r.productionReadinessVerdict,
        runtimeDurationMs: r.job.runtimeDurationMs,
        artifactStatus: { ...r.artifactStatus } as Record<string, boolean>,
      })),
    failedJobs: assessment.jobResults
      .filter((r) => !r.passed)
      .map((r) => ({
        jobId: r.job.jobId,
        productName: r.job.requirementsSnapshot.productName,
        failureClass: r.failureReport?.failureClass ?? null,
        detail: r.failureReport?.detail ?? r.executionSummary,
      })),
    assessment,
  };
}

export function buildCloudExecutionPayload(input?: {
  refresh?: boolean;
  projectRootDir?: string;
}): CloudExecutionPayload {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const assessment =
    input?.refresh || !getLastCloudExecutionAssessment()
      ? runCloudExecutionPathV1({ projectRootDir, resetQueue: input?.refresh ?? false })
      : getLastCloudExecutionAssessment()!;

  return mapAssessmentToPayload(assessment, projectRootDir);
}

export function sendCloudExecutionPathV1Json(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  refresh: boolean,
  projectRootDir?: string,
): void {
  const payload = buildCloudExecutionPayload({ refresh, projectRootDir });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'cloud-execution-path-v1',
    'X-DevPulse-Canonical-Owner': 'Cloud Execution Path V1',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

export function listCloudExecutionHistorySummary(): ReturnType<
  typeof listCloudExecutionHistory
> {
  return listCloudExecutionHistory();
}
