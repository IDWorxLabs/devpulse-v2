/**
 * Approval decision engine — records governed approval decisions only.
 * Does NOT execute approved work.
 */

import type { ApprovalDecision, ApprovalInput, GateRecord } from './types.js';
import {
  CODE_GEN_BLOCKED_PATTERNS,
  DEPLOY_BLOCKED_PATTERNS,
  EXECUTION_BLOCKED_PATTERNS,
  FILE_MOD_BLOCKED_PATTERNS,
} from './types.js';

export interface DecisionResult {
  valid: boolean;
  decision: ApprovalDecision;
  reason: string;
  gates: GateRecord[];
  blockedReason: string;
}

export function validateDecision(input: ApprovalInput): DecisionResult {
  const gates: GateRecord[] = [];
  const notes = `${input.approvalNotes} ${input.approvalReason}`.toLowerCase();

  const executionBlock = detectBlockedPattern(notes, EXECUTION_BLOCKED_PATTERNS, 'Self-execution attempt blocked');
  if (executionBlock) {
    return { valid: false, decision: input.approvalDecision, reason: executionBlock, gates, blockedReason: executionBlock };
  }

  const fileBlock = detectBlockedPattern(notes, FILE_MOD_BLOCKED_PATTERNS, 'File modification attempt blocked');
  if (fileBlock) {
    return { valid: false, decision: input.approvalDecision, reason: fileBlock, gates, blockedReason: fileBlock };
  }

  const codeBlock = detectBlockedPattern(notes, CODE_GEN_BLOCKED_PATTERNS, 'Code generation attempt blocked');
  if (codeBlock) {
    return { valid: false, decision: input.approvalDecision, reason: codeBlock, gates, blockedReason: codeBlock };
  }

  const deployBlock = detectBlockedPattern(notes, DEPLOY_BLOCKED_PATTERNS, 'Direct deployment attempt blocked');
  if (deployBlock) {
    return { valid: false, decision: input.approvalDecision, reason: deployBlock, gates, blockedReason: deployBlock };
  }

  if (notes.includes('auto approve') || notes.includes('self approve') || notes.includes('grant approval')) {
    const reason = 'Auto-approval / self-granting blocked';
    gates.push({
      gateId: 'dec-auto-0001',
      gateType: 'AUTO_APPROVAL',
      status: 'CLOSED',
      description: reason,
    });
    return { valid: false, decision: input.approvalDecision, reason, gates, blockedReason: reason };
  }

  if (!(['APPROVE', 'REJECT', 'DEFER', 'REQUEST_INFORMATION'] as const).includes(input.approvalDecision)) {
    gates.push({
      gateId: 'dec-type-0001',
      gateType: 'DECISION_TYPE',
      status: 'CLOSED',
      description: 'Invalid approval decision',
    });
    return { valid: false, decision: input.approvalDecision, reason: 'Invalid decision', gates, blockedReason: 'Invalid decision' };
  }

  gates.push({
    gateId: 'dec-record-0001',
    gateType: 'DECISION_RECORDED',
    status: 'OPEN',
    description: `Decision recorded: ${input.approvalDecision} — no execution performed`,
  });

  return {
    valid: true,
    decision: input.approvalDecision,
    reason: `Decision ${input.approvalDecision} recorded — execution deferred to governed systems`,
    gates,
    blockedReason: '',
  };
}

function detectBlockedPattern(
  text: string,
  patterns: readonly string[],
  reason: string,
): string | null {
  for (const pattern of patterns) {
    if (text.includes(pattern)) return reason;
  }
  return null;
}

export function routeDecision(decision: ApprovalDecision): string {
  switch (decision) {
    case 'APPROVE':
      return 'Record approval response packet and audit entry — do not execute';
    case 'REJECT':
      return 'Record rejection response packet and audit entry — do not execute';
    case 'DEFER':
      return 'Record defer response packet and audit entry — do not execute';
    case 'REQUEST_INFORMATION':
      return 'Record information request packet and audit entry — do not execute';
    default:
      return 'Unknown decision routing';
  }
}

export function decisionKey(decision: ApprovalDecision, valid: boolean): string {
  return `${decision}|${valid}`;
}
