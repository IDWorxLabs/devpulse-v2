/**
 * Multi-Project Concurrent Execution V1 — Operator API.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadMultiProjectConcurrentExecutionAssessmentFromDisk,
  runMultiProjectConcurrentExecutionV1,
  MULTI_PROJECT_CONCURRENT_EXECUTION_V1_PASS_TOKEN,
} from '../src/multi-project-concurrent-execution-v1/index.js';
import type { MultiProjectConcurrentExecutionAssessment } from '../src/multi-project-concurrent-execution-v1/multi-project-concurrent-execution-v1-types.js';

export { MULTI_PROJECT_CONCURRENT_EXECUTION_V1_PASS_TOKEN };

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export interface MultiProjectConcurrentExecutionPayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_multi_project_concurrent_execution_v1';
  canonicalOwner: 'Multi-Project Concurrent Execution V1';
  passToken: string;
  concurrentProjectsProven: number;
  concurrentPassRate: number;
  contaminationIncidents: number;
  concurrentWorld2Executions: number;
  concurrentProofStatus: string;
  activeProjects: number;
  queuedProjects: number;
  completedProjects: number;
  workerAllocation: number;
  resourceUsagePercent: number;
  assessment: MultiProjectConcurrentExecutionAssessment | null;
}

export function buildMultiProjectConcurrentExecutionPayload(input?: {
  projectRootDir?: string;
  refresh?: boolean;
}): MultiProjectConcurrentExecutionPayload {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const assessment = input?.refresh
    ? runMultiProjectConcurrentExecutionV1({ projectRootDir })
    : loadMultiProjectConcurrentExecutionAssessmentFromDisk(projectRootDir) ??
      runMultiProjectConcurrentExecutionV1({ projectRootDir });

  const cpuTotal = assessment.resourceAllocation.allocations.reduce(
    (sum, a) => sum + a.cpuBudgetPercent,
    0,
  );

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_multi_project_concurrent_execution_v1',
    canonicalOwner: 'Multi-Project Concurrent Execution V1',
    passToken: assessment.passToken,
    concurrentProjectsProven: assessment.concurrentProjectsProven,
    concurrentPassRate: assessment.concurrentPassRate,
    contaminationIncidents: assessment.contaminationIncidents,
    concurrentWorld2Executions: assessment.concurrentWorld2Executions,
    concurrentProofStatus: assessment.concurrentProofStatus,
    activeProjects: assessment.queueSnapshot.active,
    queuedProjects: assessment.queueSnapshot.queued,
    completedProjects: assessment.queueSnapshot.completed,
    workerAllocation: assessment.resourceAllocation.totalWorkers,
    resourceUsagePercent: cpuTotal,
    assessment,
  };
}

export function sendMultiProjectConcurrentExecutionJson(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  refresh: boolean,
): void {
  const payload = buildMultiProjectConcurrentExecutionPayload({ refresh });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'multi-project-concurrent-execution-v1',
    'X-DevPulse-Canonical-Owner': 'Multi-Project Concurrent Execution V1',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}
