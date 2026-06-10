/**
 * Security Hardening — bounded history.
 */

import type { SecurityHardeningHistoryEntry, SecurityHardeningRecord } from './security-hardening-types.js';
import { DEFAULT_MAX_SECURITY_HARDENING_HISTORY_SIZE } from './security-hardening-types.js';

const history: SecurityHardeningHistoryEntry[] = [];

export function recordSecurityHardeningHistory(record: SecurityHardeningRecord): void {
  history.push({
    securityId: record.securityId,
    securityScore: record.securityScore,
    state: record.state,
    riskLevel: record.riskLevel,
    recordedAt: Date.now(),
  });

  while (history.length > DEFAULT_MAX_SECURITY_HARDENING_HISTORY_SIZE) {
    history.shift();
  }
}

export function getSecurityHardeningHistory(): readonly SecurityHardeningHistoryEntry[] {
  return [...history];
}

export function getSecurityHardeningHistorySize(): number {
  return history.length;
}

export function clearSecurityHardeningHistory(): void {
  history.length = 0;
}

export function resetSecurityHardeningHistoryForTests(): void {
  clearSecurityHardeningHistory();
}
