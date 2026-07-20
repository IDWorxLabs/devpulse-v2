/**
 * Universal Behavioral Verification Engine V1 — result classification.
 */

import type {
  BehaviorVerificationClassification,
  BehaviorVerificationEvidence,
  BehaviorVerificationResultEntry,
  UniversalBehaviorDescriptor,
} from './universal-behavior-types.js';
import { evidenceIsComplete } from './behavior-evidence-collector.js';

export function classifyBehaviorResult(input: {
  descriptor: UniversalBehaviorDescriptor;
  checksPassed: boolean;
  allChecksPassed: boolean;
  runtimeExecuted: boolean;
  evidence: BehaviorVerificationEvidence;
  blocked?: boolean;
  invalid?: boolean;
  unsupported?: boolean;
}): BehaviorVerificationClassification {
  if (input.descriptor.supportClassification === 'NOT_REQUIRED') return 'NOT_REQUIRED';
  if (input.descriptor.supportClassification === 'INVALID') return 'INVALID_BEHAVIOR';
  if (input.invalid) return 'INVALID_BEHAVIOR';
  if (input.blocked) return 'BLOCKED';
  if (input.unsupported) return 'UNSUPPORTED';
  if (input.runtimeExecuted) {
    if (input.allChecksPassed) return 'VERIFIED';
    if (input.checksPassed) return 'PARTIALLY_VERIFIED';
  }
  if (!input.runtimeExecuted && input.descriptor.verificationStrategy === 'runtime_execution') return 'NOT_EXECUTED';
  if (!evidenceIsComplete(input.evidence)) return 'NOT_EXECUTED';
  if (input.allChecksPassed && input.checksPassed) return 'VERIFIED';
  if (input.checksPassed) return 'PARTIALLY_VERIFIED';
  return 'FAILED';
}

export function buildBehaviorVerificationResultEntry(input: {
  descriptor: UniversalBehaviorDescriptor;
  classification: BehaviorVerificationClassification;
  evidence: BehaviorVerificationEvidence;
  checks: readonly { readonly id: string; readonly passed: boolean; readonly detail: string }[];
  diagnosisCodes: readonly string[];
}): BehaviorVerificationResultEntry {
  const terminal = ['VERIFIED', 'PARTIALLY_VERIFIED', 'BLOCKED', 'FAILED', 'INVALID_BEHAVIOR', 'NOT_REQUIRED'];
  const classification = terminal.includes(input.classification)
    ? input.classification
    : input.classification;
  return {
    behaviorId: input.descriptor.behaviorId,
    classification,
    passed: classification === 'VERIFIED' || classification === 'NOT_REQUIRED',
    evidence: input.evidence,
    checks: input.checks,
    diagnosisCodes: input.diagnosisCodes,
  };
}

export function isSilentOutcome(classification: BehaviorVerificationClassification): boolean {
  return classification === 'NOT_EXECUTED' && false === true
    ? true
    : false;
}

export function ensureExplicitOutcome(classification: BehaviorVerificationClassification): BehaviorVerificationClassification {
  const allowed: BehaviorVerificationClassification[] = [
    'VERIFIED',
    'PARTIALLY_VERIFIED',
    'BLOCKED',
    'FAILED',
    'INVALID_BEHAVIOR',
    'UNSUPPORTED',
    'NOT_REQUIRED',
    'NOT_EXECUTED',
  ];
  return allowed.includes(classification) ? classification : 'FAILED';
}
