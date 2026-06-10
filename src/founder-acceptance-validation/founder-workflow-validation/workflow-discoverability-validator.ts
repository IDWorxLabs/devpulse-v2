/**
 * Founder Workflow Validation — workflow discoverability validator.
 */

import type { FounderWorkflowValidationInput, WorkflowDiscoverabilityValidation } from './founder-workflow-types.js';
import { WORKFLOW_DISCOVERABILITY_PASS, clampScore } from './founder-workflow-types.js';
import { boundGaps, createWorkflowGap } from './workflow-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-workflow-cache.js';

export interface WorkflowDiscoverabilityUpstream {
  featureDiscoverabilityScore: number;
  uvlDiscoverable: boolean;
  chatPresent: boolean;
  findPanelAliasCount: number;
  capabilityCount: number;
}

let validateCount = 0;

export function validateWorkflowDiscoverability(
  input: FounderWorkflowValidationInput,
  upstream: WorkflowDiscoverabilityUpstream,
): WorkflowDiscoverabilityValidation {
  const cacheKey = [input.requestId, upstream.featureDiscoverabilityScore, input.hiddenCapabilities].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === WORKFLOW_DISCOVERABILITY_PASS) return cached as WorkflowDiscoverabilityValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const surfaceSignals = [
    upstream.chatPresent,
    upstream.uvlDiscoverable,
    upstream.findPanelAliasCount > 20,
    upstream.capabilityCount > 30,
  ].filter(Boolean).length;
  const baseScore = Math.round((upstream.featureDiscoverabilityScore + surfaceSignals * 20) / 2);

  if (input.workflowDiscoverabilityWeak === true || input.hiddenCapabilities === true || baseScore < 75) {
    detectionCodes.push('WORKFLOW_DISCOVERABILITY');
    gaps.push(createWorkflowGap({
      title: 'Capabilities or workflows not discoverable',
      description: 'Founder cannot find available actions, paths, or verification surfaces',
      severity: baseScore < 60 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'WORKFLOW_DISCOVERABILITY',
      sourceValidator: 'workflow-discoverability-validator',
      workflowContext: 'DISCOVERY_TO_ACTION',
    }));
  }
  if (!upstream.uvlDiscoverable) {
    gaps.push(createWorkflowGap({
      title: 'UVL verification path hidden',
      description: 'Unified Verification Lab not easily discoverable in founder workflow',
      severity: 'MAJOR',
      detectionCode: 'DISCOVERABILITY_GAPS',
      sourceValidator: 'workflow-discoverability-validator',
      workflowContext: 'BUILD_TO_VERIFICATION',
    }));
  }

  const discoverabilityScore = clampScore(baseScore - gaps.length * 5);
  const result: WorkflowDiscoverabilityValidation = {
    validatorType: 'WORKFLOW_DISCOVERABILITY',
    score: discoverabilityScore,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: WORKFLOW_DISCOVERABILITY_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getDiscoverabilityValidateCount(): number {
  return validateCount;
}

export function resetWorkflowDiscoverabilityValidatorForTests(): void {
  validateCount = 0;
}
