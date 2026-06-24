/**
 * Cloud Execution Path V1 — failure classification.
 */

import type {
  CloudExecutionFailureClass,
  CloudExecutionFailureReport,
  CloudExecutionJobStatus,
} from './cloud-execution-path-v1-types.js';

export function classifyCloudExecutionFailure(input: {
  jobId: string;
  stage: CloudExecutionJobStatus;
  detail: string;
  errorCode?: string;
}): CloudExecutionFailureReport {
  const detail = input.detail.toLowerCase();
  let failureClass: CloudExecutionFailureClass = 'UNKNOWN';

  if (detail.includes('queue') || detail.includes('enqueue')) failureClass = 'QUEUE_FAILURE';
  else if (detail.includes('claim')) failureClass = 'CLAIM_FAILURE';
  else if (detail.includes('workspace') || detail.includes('isolation')) {
    failureClass = 'WORKSPACE_FAILURE';
  } else if (detail.includes('materializ')) failureClass = 'MATERIALIZATION_FAILURE';
  else if (detail.includes('install') || detail.includes('npm install')) failureClass = 'INSTALL_FAILURE';
  else if (detail.includes('build') && !detail.includes('preview')) failureClass = 'BUILD_FAILURE';
  else if (detail.includes('preview')) failureClass = 'PREVIEW_FAILURE';
  else if (detail.includes('verif') || detail.includes('uvl')) failureClass = 'VERIFICATION_FAILURE';
  else if (detail.includes('afla') || detail.includes('review')) failureClass = 'REVIEW_FAILURE';
  else if (detail.includes('production') || detail.includes('readiness')) {
    failureClass = 'PRODUCTION_GATE_FAILURE';
  } else if (detail.includes('artifact') || detail.includes('handoff')) {
    failureClass = 'ARTIFACT_HANDOFF_FAILURE';
  } else if (detail.includes('timeout') || detail.includes('timed out')) failureClass = 'TIMEOUT';

  return {
    readOnly: true,
    jobId: input.jobId,
    failureClass,
    stage: input.stage,
    detail: input.detail,
    recoverable: failureClass !== 'WORKSPACE_FAILURE' && failureClass !== 'UNKNOWN',
    generatedAt: new Date().toISOString(),
  };
}
