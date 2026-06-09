/**
 * Verification orchestrator report builder and response composer.
 */

import type {
  VerificationOrchestrationReport,
  OrchestrationState,
  ParallelGroup,
  VerificationExecutionPlan,
} from './types.js';
import { isVerificationOrchestratorQuestion } from './types.js';

let reportCounter = 0;

export function resetVerificationOrchestratorReportCounterForTests(): void {
  reportCounter = 0;
}

export function nextOrchestrationId(): string {
  reportCounter += 1;
  return `vorch-${reportCounter.toString().padStart(4, '0')}`;
}

export function buildVerificationOrchestrationReport(
  partial: Omit<
    VerificationOrchestrationReport,
    'orchestrationId' | 'createdAt' | 'planningOnly'
  >,
): VerificationOrchestrationReport {
  return {
    orchestrationId: nextOrchestrationId(),
    ...partial,
    createdAt: Date.now(),
    planningOnly: true,
  };
}

export function composeVerificationOrchestrationResponse(
  query: string,
  report: VerificationOrchestrationReport,
): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Verification Orchestrator Response', ''];

  lines.push(`Orchestration ID: ${report.orchestrationId}`);
  lines.push(`Plan ID: ${report.verificationPlanId}`);
  lines.push(`State: ${report.orchestrationState}`);
  lines.push(`Targets: ${report.verificationTargets.length}`);
  lines.push('');

  if (lower.includes('first') || lower.includes('order') || lower.includes('plan')) {
    lines.push('Execution order:');
    for (const id of report.executionOrder) {
      lines.push(`• ${id}`);
    }
  }

  if (lower.includes('parallel')) {
    lines.push('Parallel groups:');
    for (const g of report.parallelGroups) {
      lines.push(`• ${g.groupId}: ${g.targetIds.join(', ')}`);
    }
  }

  if (lower.includes('blocked')) {
    lines.push('Blocked targets:');
    for (const id of report.blockedTargets) {
      lines.push(`• ${id}`);
    }
  }

  if (lower.includes('waiting')) {
    lines.push('Waiting targets:');
    for (const id of report.waitingTargets) {
      lines.push(`• ${id}`);
    }
  }

  if (lower.includes('dependenc') || lower.includes('missing')) {
    lines.push('Ready targets:');
    for (const id of report.readyTargets) {
      lines.push(`• ${id}`);
    }
  }

  if (report.blockedReasons.length > 0) {
    lines.push('Blocked reasons:');
    for (const b of report.blockedReasons) lines.push(`• ${b}`);
  }

  lines.push('');
  lines.push('Planning only — no verification execution, evidence collection, or auto-fix.');
  return lines.join('\n');
}

export interface VerificationOrchestratorFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildVerificationOrchestratorFailureContext(
  query: string,
): VerificationOrchestratorFailureContext[] {
  if (!isVerificationOrchestratorQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: VerificationOrchestratorFailureContext[] = [
    {
      title: 'Verification orchestrator: planning only',
      description: 'Phase 16.9 coordinates execution planning without provider execution',
      sourceSystem: 'verification_orchestrator',
      severity: 'LOW',
    },
  ];

  if (lower.includes('cycle') || lower.includes('dependency cycle')) {
    records.push({
      title: 'Dependency cycle',
      description: 'Circular dependency detected in verification target graph',
      sourceSystem: 'verification_orchestrator',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('missing dependency') || lower.includes('dependencies are missing')) {
    records.push({
      title: 'Missing dependency',
      description: 'Verification target references unregistered upstream dependency',
      sourceSystem: 'verification_orchestrator',
      severity: 'HIGH',
    });
  }

  if (lower.includes('ownership conflict')) {
    records.push({
      title: 'Ownership conflict',
      description: 'Verification target owner not registered in ownership registry',
      sourceSystem: 'verification_orchestrator',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('blocked target') || lower.includes('blocked verification')) {
    records.push({
      title: 'Blocked target',
      description: 'Verification target blocked by prerequisites or ownership',
      sourceSystem: 'verification_orchestrator',
      severity: 'HIGH',
    });
  }

  if (lower.includes('orchestration blocked') || lower.includes('blocked')) {
    records.push({
      title: 'Orchestration blocked',
      description: 'Verification orchestration gates failed',
      sourceSystem: 'verification_orchestrator',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('world 1') || lower.includes('world1')) {
    records.push({
      title: 'World 1 protection violation',
      description: 'Verification orchestrator must not target or modify World 1',
      sourceSystem: 'workspace_intelligence',
      severity: 'CRITICAL',
    });
  }

  return records;
}

export function deriveOrchestrationState(
  blocked: boolean,
  waitingCount: number,
  readyCount: number,
): OrchestrationState {
  if (blocked) return 'BLOCKED';
  if (waitingCount > 0 && readyCount === 0) return 'WAITING';
  if (readyCount > 0) return 'READY';
  return 'PLANNED';
}

export function primaryPlanId(plans: VerificationExecutionPlan[]): string {
  return plans[0]?.verificationPlanId ?? 'vplan-0000';
}

export function summarizeParallelGroups(groups: ParallelGroup[]): ParallelGroup[] {
  return groups;
}
