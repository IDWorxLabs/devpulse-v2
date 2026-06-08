/**
 * World 1 protection engine — ensures builder cannot affect World 1 or governance.
 * Dry-run foundation only. No World 1 modification.
 */

import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { ProtectionCheck } from './types.js';
import { WORLD1_PROTECTED_DOMAINS } from './types.js';

export function generateWorld1ProtectionChecks(): ProtectionCheck[] {
  return WORLD1_PROTECTED_DOMAINS.map((domain, index) => {
    const check = checkWorld1ModificationAttempt(domain);
    return {
      checkId: `w1-protect-${(index + 1).toString().padStart(4, '0')}`,
      checkType: `WORLD1_${domain.toUpperCase()}`,
      status: !check.allowed ? 'PROTECTED' : 'VIOLATION_DETECTED',
      description: `World 1 domain ${domain} must not be modified by builder`,
    };
  });
}

export function assertAllWorld1ChecksProtected(checks: ProtectionCheck[]): boolean {
  return checks.every((c) => c.status === 'PROTECTED');
}

export function world1ProtectionKey(checks: ProtectionCheck[]): string {
  return checks.map((c) => `${c.checkType}|${c.status}`).join(';');
}

export function getWorld1ProtectionStatus(checks: ProtectionCheck[]): string {
  return assertAllWorld1ChecksProtected(checks) ? 'PROTECTED' : 'VIOLATION_DETECTED';
}
