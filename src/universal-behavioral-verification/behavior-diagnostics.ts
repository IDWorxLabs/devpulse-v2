/**
 * Universal Behavioral Verification Engine V1 — engineering diagnostics.
 */

import type {
  BehaviorVerificationClassification,
  UniversalBehaviorDescriptor,
} from './universal-behavior-types.js';

export type BehaviorDiagnosisCode =
  | 'missing_behavior'
  | 'invalid_behavior'
  | 'runtime_not_reachable'
  | 'workflow_failed'
  | 'persistence_failed'
  | 'rule_failed'
  | 'runtime_state_failed'
  | 'verification_not_executed'
  | 'evidence_missing'
  | 'placeholder_behavior'
  | 'fake_runtime'
  | 'unsupported_behavior'
  | 'dependency_blocked'
  | 'configuration_blocked';

export function diagnoseBehaviorFailure(
  descriptor: UniversalBehaviorDescriptor,
  classification: BehaviorVerificationClassification,
  checks: readonly { readonly id: string; readonly passed: boolean; readonly detail: string }[],
): readonly BehaviorDiagnosisCode[] {
  const codes: BehaviorDiagnosisCode[] = [];

  if (classification === 'NOT_EXECUTED') codes.push('verification_not_executed');
  if (classification === 'INVALID_BEHAVIOR') codes.push('invalid_behavior');
  if (classification === 'UNSUPPORTED') codes.push('unsupported_behavior');
  if (classification === 'BLOCKED') codes.push('dependency_blocked');

  for (const check of checks) {
    if (check.passed) continue;
    if (check.id.includes('placeholder') || check.id.includes('static-shell')) codes.push('placeholder_behavior');
    if (check.id.includes('workflow')) codes.push('workflow_failed');
    if (check.id.includes('persistence') || check.id.includes('repository')) codes.push('persistence_failed');
    if (check.id.includes('rule')) codes.push('rule_failed');
    if (check.id.includes('runtime')) codes.push('runtime_state_failed');
    if (check.id.includes('route')) codes.push('runtime_not_reachable');
    if (check.id.includes('fake')) codes.push('fake_runtime');
  }

  if (classification === 'FAILED' && codes.length === 0) {
    if (descriptor.behaviorCategory === 'WORKFLOW') codes.push('workflow_failed');
    else if (descriptor.behaviorCategory === 'BUSINESS_RULE') codes.push('rule_failed');
    else if (descriptor.behaviorCategory === 'PERSISTENCE') codes.push('persistence_failed');
    else codes.push('missing_behavior');
  }

  if (classification === 'NOT_EXECUTED' || classification === 'FAILED') {
    if (!checks.some((c) => c.passed)) codes.push('evidence_missing');
  }

  return [...new Set(codes)];
}

export function diagnoseSilentBehaviorSkips(
  results: readonly { readonly classification: BehaviorVerificationClassification; readonly behaviorId: string }[],
): readonly string[] {
  return results
    .filter((r) => r.classification === 'NOT_EXECUTED')
    .map((r) => `silent_skip:${r.behaviorId}`);
}

export function diagnoseConfigurationBlocked(
  descriptor: UniversalBehaviorDescriptor,
): readonly BehaviorDiagnosisCode[] {
  if (descriptor.runtimeRequirements.some((r) => r.startsWith('capability:'))) {
    return ['configuration_blocked'];
  }
  return [];
}
