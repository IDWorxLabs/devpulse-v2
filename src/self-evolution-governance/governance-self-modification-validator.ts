/**
 * Self Evolution Governance — self modification validator.
 * Phase 21 safety law: code modification, deployment, self-edit, production changes BLOCKED.
 */

import type { GovernanceSelfModificationValidation, SelfEvolutionGovernanceInput } from './self-evolution-governance-types.js';

const BLOCKED_SIGNALS = [
  'selfmod:code_modification',
  'selfmod:deployment',
  'selfmod:self_edit',
  'selfmod:execution',
  'selfmod:production_change',
  'selfmod:autonomous_write',
] as const;

export function validateSelfModification(input: SelfEvolutionGovernanceInput): GovernanceSelfModificationValidation {
  const findings: string[] = [];
  const signals = input.signals ?? [];

  const codeAttempt = signals.some((s) => s === 'selfmod:code_modification' || s === 'selfmod:autonomous_write');
  const deployAttempt = signals.includes('selfmod:deployment') || signals.includes('selfmod:production_change');
  const execAttempt = signals.includes('selfmod:execution');
  const selfEditAttempt = signals.includes('selfmod:self_edit');

  // Phase 21 default: all self-modification BLOCKED
  const codeModificationBlocked = true;
  const deploymentBlocked = true;
  const executionBlocked = true;
  const selfEditBlocked = true;

  if (codeAttempt) findings.push('code_modification_attempt_blocked');
  if (deployAttempt) findings.push('deployment_attempt_blocked');
  if (execAttempt) findings.push('execution_attempt_blocked');
  if (selfEditAttempt) findings.push('self_edit_attempt_blocked');

  const anyAttempt = codeAttempt || deployAttempt || execAttempt || selfEditAttempt
    || BLOCKED_SIGNALS.some((s) => signals.includes(s));

  const state: GovernanceSelfModificationValidation['state'] = 'SELF_MODIFICATION_BLOCKED';

  return {
    state,
    codeModificationBlocked,
    deploymentBlocked,
    executionBlocked,
    selfEditBlocked,
    findings: findings.length > 0 ? findings : ['phase_21_self_modification_blocked_by_default'],
  };
}
