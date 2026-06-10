/**
 * Product Experience Verification Engine — workflow continuity verifier.
 */

import type { ProductExperienceInput, WorkflowContinuityVerification } from './product-experience-types.js';
import { WORKFLOW_CONTINUITY_PASS, clampScore } from './product-experience-types.js';
import { boundGaps, createExperienceGap } from './experience-gap-model.js';
import { getCachedVerifierResult, setCachedVerifierResult } from './product-experience-cache.js';

export interface WorkflowContinuityUpstream {
  workflowContinuityScore: number;
  previewReportConnectionScore: number;
  actionReadinessScore: number;
  chatToFeedConnected: boolean;
  reportToNextActionConnected: boolean;
}

let verifyCount = 0;

export function verifyWorkflowContinuity(
  input: ProductExperienceInput,
  upstream: WorkflowContinuityUpstream,
): WorkflowContinuityVerification {
  const cacheKey = [input.requestId, upstream.workflowContinuityScore, input.workflowBreak].join('|');
  const cached = getCachedVerifierResult(cacheKey);
  if (cached && cached.passToken === WORKFLOW_CONTINUITY_PASS) return cached as WorkflowContinuityVerification;

  verifyCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.workflowContinuityScore + upstream.previewReportConnectionScore + upstream.actionReadinessScore) / 3,
  );

  if (input.workflowBreak === true || baseScore < 78) {
    detectionCodes.push('WORKFLOW_BREAK');
    gaps.push(createExperienceGap({
      title: 'Workflow break in Request→Analysis→Verification→Preview→Report→Next Action',
      description: 'Natural workflow progression is interrupted between major product stages',
      severity: baseScore < 65 ? 'CRITICAL' : 'HIGH',
      detectionCode: 'WORKFLOW_BREAK',
      sourceVerifier: 'workflow-continuity-verifier',
      connectedSystems: ['Chat', 'UVL', 'Preview', 'Reports'],
    }));
  }
  if (input.workflowDeadEnd === true || !upstream.reportToNextActionConnected) {
    detectionCodes.push('WORKFLOW_DEAD_END');
    gaps.push(createExperienceGap({
      title: 'Report generated but no next action',
      description: 'Verification reports end without clear next step for founder',
      severity: 'HIGH',
      detectionCode: 'WORKFLOW_DEAD_END',
      sourceVerifier: 'workflow-continuity-verifier',
      connectedSystems: ['Reports', 'Chat', 'Operator Feed'],
    }));
  }
  if (input.workflowLoopConfusion === true) {
    detectionCodes.push('WORKFLOW_LOOP_CONFUSION');
    gaps.push(createExperienceGap({
      title: 'Workflow loop confusion',
      description: 'User cycles between surfaces without clear progression or resolution',
      severity: 'MEDIUM',
      detectionCode: 'WORKFLOW_LOOP_CONFUSION',
      sourceVerifier: 'workflow-continuity-verifier',
      connectedSystems: ['Verification', 'Preview', 'Reports'],
    }));
  }
  if (!upstream.chatToFeedConnected) {
    gaps.push(createExperienceGap({
      title: 'Chat disconnected from workflow',
      description: 'Chat actions do not visibly continue into operator feed workflow',
      severity: 'MEDIUM',
      detectionCode: 'WORKFLOW_BREAK',
      sourceVerifier: 'workflow-continuity-verifier',
      connectedSystems: ['Chat', 'Operator Feed'],
    }));
  }

  const penalty = gaps.length * 4;
  const continuityScore = clampScore(baseScore - penalty);

  const result: WorkflowContinuityVerification = {
    continuityScore,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: WORKFLOW_CONTINUITY_PASS,
  };
  setCachedVerifierResult(cacheKey, result);
  return result;
}

export function getWorkflowContinuityVerifyCount(): number {
  return verifyCount;
}

export function resetWorkflowContinuityVerifierForTests(): void {
  verifyCount = 0;
}
