/**
 * Founder Friction Detector — workflow friction detector.
 */

import type { FounderFrictionDetectorInput, WorkflowFrictionDetection } from './founder-friction-types.js';
import { WORKFLOW_FRICTION_PASS, clampScore } from './founder-friction-types.js';
import { boundGaps, createFrictionGap } from './friction-gap-model.js';
import { getCachedDetectorResult, setCachedDetectorResult } from './founder-friction-cache.js';

export interface WorkflowFrictionUpstream {
  workflowFrictionScore: number;
  continuityScore: number;
  frictionGapCount: number;
}

let detectCount = 0;

export function detectWorkflowFriction(
  input: FounderFrictionDetectorInput,
  upstream: WorkflowFrictionUpstream,
): WorkflowFrictionDetection {
  const cacheKey = [input.requestId, upstream.workflowFrictionScore, input.workflowDeadEnd].join('|');
  const cached = getCachedDetectorResult(cacheKey);
  if (cached && cached.passToken === WORKFLOW_FRICTION_PASS) return cached as WorkflowFrictionDetection;

  detectCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.workflowFrictionScore + upstream.continuityScore) / 2 - upstream.frictionGapCount * 3,
  );

  if (input.workflowDeadEnd === true || input.workflowLoop === true || baseScore < 70) {
    detectionCodes.push('WORKFLOW_FRICTION');
    gaps.push(createFrictionGap({
      title: 'Workflow dead end or broken continuity detected',
      description: 'Founder hits workflow dead ends, loops, or broken continuity reducing effectiveness',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'WORKFLOW_FRICTION',
      sourceDetector: 'workflow-friction-detector',
      frictionContext: 'WORKFLOW_FRICTION',
    }));
  }
  if (input.excessiveSteps === true) {
    gaps.push(createFrictionGap({
      title: 'Workflow complexity or inefficiency',
      description: 'Excessive steps increase workflow friction for founder',
      severity: 'MINOR',
      detectionCode: 'WORKFLOW_FRICTION_GAPS',
      sourceDetector: 'workflow-friction-detector',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 4);
  const result: WorkflowFrictionDetection = {
    detectorType: 'WORKFLOW_FRICTION',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: WORKFLOW_FRICTION_PASS,
  };
  setCachedDetectorResult(cacheKey, result);
  return result;
}

export function getWorkflowFrictionDetectCount(): number {
  return detectCount;
}

export function resetWorkflowFrictionDetectorForTests(): void {
  detectCount = 0;
}
