/**
 * Unified Failure Escalation Authority V1 — World2 failure experiment.
 */

import { randomUUID } from 'node:crypto';
import { createWorld2Instance } from '../world2-real-instantiation-v1/world2-instance-lifecycle.js';
import type { World2FailureExperiment } from './unified-failure-escalation-v1-types.js';

export function createWorld2FailureExperiment(input: {
  projectRootDir: string;
  incidentId: string;
  profile?: string;
}): World2FailureExperiment {
  const profile = input.profile ?? 'TASK_TRACKER_WEB_V1';
  const world = createWorld2Instance({
    projectRootDir: input.projectRootDir,
    profile,
    executionMode: 'CLOUD_SIMULATED',
    instantiatedBy: 'unified-failure-escalation-authority-v1',
  });

  return {
    readOnly: true,
    experimentId: randomUUID(),
    worldId: world.worldId,
    incidentId: input.incidentId,
    profile,
    createdAt: new Date().toISOString(),
    status: 'CREATED',
  };
}
