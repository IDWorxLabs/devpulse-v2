/**
 * Verification registry report builder and response composer.
 */

import type { VerificationRegistryReport, VerificationRegistryState } from './types.js';
import { isVerificationRegistryQuestion } from './types.js';

let reportCounter = 0;

export function resetVerificationRegistryReportCounterForTests(): void {
  reportCounter = 0;
}

export function nextVerificationRegistryReportId(): string {
  reportCounter += 1;
  return `vreg-${reportCounter.toString().padStart(4, '0')}`;
}

export function buildVerificationRegistryReport(
  partial: Omit<VerificationRegistryReport, 'reportId' | 'createdAt' | 'registryOnly'>,
): VerificationRegistryReport {
  return {
    reportId: nextVerificationRegistryReportId(),
    ...partial,
    createdAt: Date.now(),
    registryOnly: true,
  };
}

export function composeVerificationRegistryResponse(
  query: string,
  report: VerificationRegistryReport,
): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Verification Registry Response', ''];

  lines.push(`Report ID: ${report.reportId}`);
  lines.push(`Registry State: ${report.registryState}`);
  lines.push(`Targets: ${report.targetCount}`);
  lines.push(`Dependencies: ${report.dependencyCount}`);
  lines.push(`Requirements: ${report.requirementCount}`);
  lines.push(`Capabilities: ${report.capabilityCount}`);
  lines.push('');

  if (lower.includes('verified') || lower.includes('target') || lower.includes('what can')) {
    lines.push('Verification targets:');
    for (const t of report.verificationTargets) {
      lines.push(`• ${t.verificationTargetName} (${t.verificationTargetId}) — ${t.ownerModule}`);
    }
  }

  if (lower.includes('own')) {
    lines.push('Target ownership:');
    for (const t of report.verificationTargets) {
      lines.push(`• ${t.verificationTargetName}: ${t.ownerModule} (phase ${t.phase})`);
    }
  }

  if (lower.includes('dependenc')) {
    lines.push('Verification dependencies:');
    for (const d of report.verificationDependencies.slice(0, 10)) {
      lines.push(`• ${d.targetId}: upstream=${d.upstreamDependencies.join(', ') || 'none'}`);
    }
  }

  if (lower.includes('evidence') || lower.includes('requirement')) {
    lines.push('Verification requirements:');
    for (const r of report.verificationRequirements.slice(0, 10)) {
      lines.push(`• ${r.targetId}: evidence=${r.requiredEvidence.join(', ')}`);
    }
  }

  if (report.blockedReasons.length > 0) {
    lines.push('Blocked reasons:');
    for (const b of report.blockedReasons) lines.push(`• ${b}`);
  }

  lines.push('');
  lines.push('Registry only — no verification execution, orchestration, or auto-fix.');
  return lines.join('\n');
}

export interface VerificationRegistryFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildVerificationRegistryFailureContext(query: string): VerificationRegistryFailureContext[] {
  if (!isVerificationRegistryQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: VerificationRegistryFailureContext[] = [
    {
      title: 'Verification registry: metadata only',
      description: 'Phase 16.8 defines verification targets without execution or orchestration',
      sourceSystem: 'verification_registry',
      severity: 'LOW',
    },
  ];

  if (lower.includes('duplicate target')) {
    records.push({
      title: 'Duplicate target',
      description: 'Verification target registration rejected — target must be unique',
      sourceSystem: 'verification_registry',
      severity: 'HIGH',
    });
  }

  if (lower.includes('missing owner')) {
    records.push({
      title: 'Missing owner',
      description: 'Verification owner not registered for target',
      sourceSystem: 'verification_registry',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('invalid dependency')) {
    records.push({
      title: 'Invalid dependency',
      description: 'Verification dependency references unknown target or prerequisite',
      sourceSystem: 'verification_registry',
      severity: 'HIGH',
    });
  }

  if (lower.includes('invalid requirement')) {
    records.push({
      title: 'Invalid requirement',
      description: 'Verification requirement references unknown target or evidence',
      sourceSystem: 'verification_registry',
      severity: 'HIGH',
    });
  }

  if (lower.includes('blocked') || lower.includes('registry blocked')) {
    records.push({
      title: 'Verification registry blocked',
      description: 'Verification registry gates failed',
      sourceSystem: 'verification_registry',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('world 1') || lower.includes('world1')) {
    records.push({
      title: 'World 1 protection violation',
      description: 'Verification registry must not target or modify World 1',
      sourceSystem: 'workspace_intelligence',
      severity: 'CRITICAL',
    });
  }

  return records;
}

export function deriveRegistryState(blocked: boolean, targetCount: number): VerificationRegistryState {
  if (blocked) return 'BLOCKED';
  if (targetCount === 0) return 'REGISTERED';
  return 'READY';
}
