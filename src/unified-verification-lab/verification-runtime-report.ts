/**
 * Verification runtime report builder and response composer.
 */

import type { VerificationRuntimeReport, VerificationRuntimeState } from './types.js';
import { isUvlRuntimeQuestion } from './types.js';
import type { VerificationProvider } from './types.js';
import type { VerificationSession } from './types.js';

let reportCounter = 0;

export function resetVerificationRuntimeReportCounterForTests(): void {
  reportCounter = 0;
}

export function nextVerificationRuntimeReportId(): string {
  reportCounter += 1;
  return `uvlrep-${reportCounter.toString().padStart(4, '0')}`;
}

export function buildVerificationRuntimeReport(
  partial: Omit<VerificationRuntimeReport, 'reportId' | 'createdAt' | 'runtimeOnly'>,
): VerificationRuntimeReport {
  return {
    reportId: nextVerificationRuntimeReportId(),
    ...partial,
    createdAt: Date.now(),
    runtimeOnly: true,
  };
}

export function composeVerificationRuntimeResponse(
  query: string,
  report: VerificationRuntimeReport,
): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Unified Verification Lab Runtime Response', ''];

  lines.push(`Report ID: ${report.reportId}`);
  lines.push(`Runtime State: ${report.runtimeState}`);
  lines.push(`Providers: ${report.providerCount}`);
  lines.push(`Sessions: ${report.sessionCount}`);
  lines.push('');

  if (lower.includes('provider')) {
    lines.push('Registered providers:');
    for (const p of report.registeredProviders) {
      lines.push(`• ${p.providerName} (${p.providerId}) — ${p.ownerModule}`);
    }
  }

  if (lower.includes('session')) {
    lines.push('Verification sessions:');
    for (const s of report.verificationSessions.slice(0, 12)) {
      lines.push(`• ${s.verificationSessionId} — ${s.verificationType} — ${s.sessionState}`);
    }
  }

  if (lower.includes('runtime') || lower.includes('lab') || lower.includes('capabilit')) {
    lines.push('Runtime capabilities:');
    for (const p of report.registeredProviders) {
      lines.push(`• ${p.providerType}: ${p.supportedVerifications.join(', ')}`);
    }
  }

  if (report.blockedReasons.length > 0) {
    lines.push('Blocked reasons:');
    for (const b of report.blockedReasons) lines.push(`• ${b}`);
  }

  lines.push('');
  lines.push('Runtime only — no verification execution, evidence generation, or auto-fix.');
  return lines.join('\n');
}

export interface VerificationRuntimeFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildVerificationRuntimeFailureContext(query: string): VerificationRuntimeFailureContext[] {
  if (!isUvlRuntimeQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: VerificationRuntimeFailureContext[] = [
    {
      title: 'UVL runtime: lifecycle only',
      description: 'Phase 16.7 manages providers and sessions without verification execution',
      sourceSystem: 'unified_verification_lab_runtime',
      severity: 'LOW',
    },
  ];

  if (lower.includes('duplicate provider')) {
    records.push({
      title: 'Duplicate provider',
      description: 'Verification provider registration rejected — provider must be unique',
      sourceSystem: 'unified_verification_lab_runtime',
      severity: 'HIGH',
    });
  }

  if (lower.includes('missing provider')) {
    records.push({
      title: 'Missing provider',
      description: 'Verification provider not registered',
      sourceSystem: 'unified_verification_lab_runtime',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('duplicate session')) {
    records.push({
      title: 'Duplicate session',
      description: 'Verification session creation rejected — session must be unique per provider',
      sourceSystem: 'unified_verification_lab_runtime',
      severity: 'HIGH',
    });
  }

  if (lower.includes('invalid ownership')) {
    records.push({
      title: 'Invalid ownership',
      description: 'Provider ownership module invalid for UVL runtime',
      sourceSystem: 'unified_verification_lab_runtime',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('blocked') || lower.includes('runtime blocked')) {
    records.push({
      title: 'Verification runtime blocked',
      description: 'Unified Verification Lab Runtime gates failed',
      sourceSystem: 'unified_verification_lab_runtime',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('world 1') || lower.includes('world1')) {
    records.push({
      title: 'World 1 protection violation',
      description: 'UVL runtime must not target or modify World 1',
      sourceSystem: 'workspace_intelligence',
      severity: 'CRITICAL',
    });
  }

  return records;
}

export function deriveRuntimeState(
  sessions: VerificationSession[],
  blocked: boolean,
): VerificationRuntimeState {
  if (blocked) return 'BLOCKED';
  if (sessions.length === 0) return 'REGISTERED';
  if (sessions.every((s) => s.sessionState === 'COMPLETED')) return 'COMPLETED';
  if (sessions.some((s) => s.sessionState === 'RUNNING')) return 'RUNNING';
  if (sessions.some((s) => s.sessionState === 'READY' || s.sessionState === 'REGISTERED')) return 'READY';
  return 'REGISTERED';
}
