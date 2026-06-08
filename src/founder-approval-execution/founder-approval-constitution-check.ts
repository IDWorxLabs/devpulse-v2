/**
 * Constitutional approval checks — explicit rules requiring founder approval.
 */

import type { ExecutionClassification } from '../execution-authority/types.js';
import type { RecoveryRecord } from '../recovery-execution/types.js';
import type { ConstitutionalRule } from './types.js';

const RULES_REQUIRING_APPROVAL: ConstitutionalRule[] = [
  'WRITE_OPERATION',
  'PROJECT_MODIFICATION',
  'RECOVERY_ACTION',
  'AUTONOMOUS_ACTION',
  'WORLD2_ACTIVITY',
];

export function getConstitutionalRulesRequiringApproval(): readonly ConstitutionalRule[] {
  return RULES_REQUIRING_APPROVAL;
}

export function mapClassificationToConstitutionalRule(
  classification: ExecutionClassification | undefined,
): ConstitutionalRule | null {
  switch (classification) {
    case 'WRITE_OPERATION':
      return 'WRITE_OPERATION';
    case 'PROJECT_MODIFICATION':
      return 'PROJECT_MODIFICATION';
    case 'RECOVERY_ACTION':
      return 'RECOVERY_ACTION';
    case 'AUTONOMOUS_ACTION':
      return 'AUTONOMOUS_ACTION';
    default:
      return null;
  }
}

export function runConstitutionCheck(record: RecoveryRecord): ConstitutionalRule[] {
  const triggered: ConstitutionalRule[] = [];
  const verification = record.verificationResult;

  const classification = verification.authorityDecision?.classification ??
    (verification.runtimeDecision?.classification !== 'INVALID'
      ? verification.runtimeDecision?.classification
      : undefined);

  const mapped = mapClassificationToConstitutionalRule(classification);
  if (mapped) {
    triggered.push(mapped);
  }

  if (verification.runtimeRecord?.package.metadata.world2_activity === 'true') {
    triggered.push('WORLD2_ACTIVITY');
  }

  if (record.plan.strategy === 'WORLD2_ISOLATION_REQUIRED' && !triggered.includes('WORLD2_ACTIVITY')) {
    triggered.push('WORLD2_ACTIVITY');
  }

  return [...new Set(triggered)];
}

export function constitutionRequiresApproval(rules: ConstitutionalRule[]): boolean {
  return rules.some((r) => RULES_REQUIRING_APPROVAL.includes(r));
}

export function readOnlyDoesNotRequireApproval(classification: ExecutionClassification | undefined): boolean {
  return classification === 'READ_ONLY' || classification === undefined;
}
