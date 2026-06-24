/**
 * Cloud Execution Path V1 — single job runner via adapter dispatch.
 */

import type { CloudExecutionJob, CloudExecutionJobResult } from './cloud-execution-path-v1-types.js';
import { resolveCloudExecutionAdapter } from './cloud-execution-adapters.js';

export function runCloudExecutionJob(input: {
  projectRootDir: string;
  job: CloudExecutionJob;
  workerId: string;
  otherJobIds?: readonly string[];
}): CloudExecutionJobResult {
  const adapter = resolveCloudExecutionAdapter(input.job.executionMode);
  return adapter.execute(input);
}
