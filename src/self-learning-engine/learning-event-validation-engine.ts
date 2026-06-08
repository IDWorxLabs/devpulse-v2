/**
 * Learning event validation engine — validates learning event inputs.
 * Recording only. No execution or behavior change.
 */

import type { GateRecord, LearningEventInput } from './types.js';
import {
  AUTO_BEHAVIOR_BLOCKED_PATTERNS,
  CODE_GEN_BLOCKED_PATTERNS,
  DEPLOY_BLOCKED_PATTERNS,
  EXECUTION_BLOCKED_PATTERNS,
  FILE_MOD_BLOCKED_PATTERNS,
  GOVERNANCE_MUTATION_BLOCKED_PATTERNS,
  MODEL_TRAINING_BLOCKED_PATTERNS,
  REGISTRY_MUTATION_BLOCKED_PATTERNS,
} from './types.js';

export interface LearningEventValidationResult {
  valid: boolean;
  blocked: boolean;
  reason: string;
  gates: GateRecord[];
  warnings: string[];
}

function detectBlockedPattern(text: string, patterns: readonly string[], reason: string): string | null {
  const lower = text.toLowerCase();
  for (const pattern of patterns) {
    if (lower.includes(pattern)) return reason;
  }
  return null;
}

export function learningEventValidationKey(input: LearningEventInput): string {
  return [
    input.workspaceId,
    input.projectId,
    input.sourceSystem,
    input.eventType,
    input.eventSummary.slice(0, 32),
  ].join('|');
}

export function validateLearningEventInput(input: LearningEventInput): LearningEventValidationResult {
  const gates: GateRecord[] = [];
  const warnings: string[] = [];
  const context = `${input.eventSummary} ${input.eventOutcome ?? ''}`;

  if (!input.learningEventId?.trim()) {
    gates.push({
      gateId: 'learn-evt-id-0001',
      gateType: 'LEARNING_EVENT_ID',
      status: 'CLOSED',
      description: 'learningEventId is required',
    });
    return { valid: false, blocked: true, reason: 'learningEventId is required', gates, warnings };
  }

  if (!input.workspaceId?.trim()) {
    gates.push({
      gateId: 'learn-ws-0001',
      gateType: 'WORKSPACE_ID',
      status: 'CLOSED',
      description: 'workspaceId is required',
    });
    return { valid: false, blocked: true, reason: 'workspaceId is required', gates, warnings };
  }

  if (!input.projectId?.trim()) {
    gates.push({
      gateId: 'learn-proj-0001',
      gateType: 'PROJECT_ID',
      status: 'CLOSED',
      description: 'projectId is required',
    });
    return { valid: false, blocked: true, reason: 'projectId is required', gates, warnings };
  }

  if (input.sourceSystem === 'UNKNOWN') {
    gates.push({
      gateId: 'learn-src-0001',
      gateType: 'SOURCE_SYSTEM',
      status: 'CLOSED',
      description: 'sourceSystem UNKNOWN blocked',
    });
    return { valid: false, blocked: true, reason: 'sourceSystem UNKNOWN blocked', gates, warnings };
  }

  if (input.eventType === 'UNKNOWN') {
    gates.push({
      gateId: 'learn-type-0001',
      gateType: 'EVENT_TYPE',
      status: 'CLOSED',
      description: 'eventType UNKNOWN blocked',
    });
    return { valid: false, blocked: true, reason: 'eventType UNKNOWN blocked', gates, warnings };
  }

  if (!input.eventSummary?.trim()) {
    gates.push({
      gateId: 'learn-sum-0001',
      gateType: 'EVENT_SUMMARY',
      status: 'CLOSED',
      description: 'eventSummary is required',
    });
    return { valid: false, blocked: true, reason: 'eventSummary is required', gates, warnings };
  }

  if (input.governanceStatus === 'FAIL') {
    gates.push({
      gateId: 'learn-gov-0001',
      gateType: 'GOVERNANCE_STATUS',
      status: 'CLOSED',
      description: 'governanceStatus FAIL blocked',
    });
    return { valid: false, blocked: true, reason: 'governanceStatus FAIL blocked', gates, warnings };
  }

  const blockedChecks: Array<[readonly string[], string]> = [
    [EXECUTION_BLOCKED_PATTERNS, 'Direct execution request blocked'],
    [FILE_MOD_BLOCKED_PATTERNS, 'Direct file modification request blocked'],
    [CODE_GEN_BLOCKED_PATTERNS, 'Direct code generation request blocked'],
    [DEPLOY_BLOCKED_PATTERNS, 'Direct deployment request blocked'],
    [MODEL_TRAINING_BLOCKED_PATTERNS, 'Model training request blocked'],
    [AUTO_BEHAVIOR_BLOCKED_PATTERNS, 'Automatic behavior change request blocked'],
    [REGISTRY_MUTATION_BLOCKED_PATTERNS, 'Ownership registry mutation request blocked'],
    [GOVERNANCE_MUTATION_BLOCKED_PATTERNS, 'Governance mutation request blocked'],
  ];

  for (const [patterns, reason] of blockedChecks) {
    const hit = detectBlockedPattern(context, patterns, reason);
    if (hit) {
      gates.push({
        gateId: `learn-sec-${patterns[0]}`,
        gateType: 'SECURITY_BLOCK',
        status: 'CLOSED',
        description: hit,
      });
      warnings.push(hit);
      return { valid: false, blocked: true, reason: hit, gates, warnings };
    }
  }

  gates.push({
    gateId: 'learn-evt-valid-0001',
    gateType: 'LEARNING_EVENT_VALID',
    status: 'OPEN',
    description: 'Learning event input validated',
  });

  return { valid: true, blocked: false, reason: 'Learning event validated', gates, warnings };
}
