/**
 * Recovery failure bridge — lightweight blocked-state context.
 */

import { isWorld2RecoveryQuestion } from './types.js';

export interface RecoveryFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildRecoveryFailureContext(query: string): RecoveryFailureContext[] {
  if (!isWorld2RecoveryQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: RecoveryFailureContext[] = [
    {
      title: 'Recovery blocked: Phase 15.5 plans only',
      description: 'recoveryAllowed must remain false — no restore, apply, rollback, or file operations',
      sourceSystem: 'world2_recovery_runtime',
      severity: 'CRITICAL',
    },
  ];

  if (lower.includes('rollback plan') || lower.includes('missing rollback')) {
    records.push({
      title: 'Missing rollback plan',
      description: 'Phase 15.4 rollback plan required before recovery planning',
      sourceSystem: 'world2_rollback_runtime',
      severity: 'HIGH',
    });
  }

  if (lower.includes('apply plan') || lower.includes('missing apply')) {
    records.push({
      title: 'Missing apply plan',
      description: 'Phase 15.3 controlled apply plan required before recovery planning',
      sourceSystem: 'world2_controlled_apply_runtime',
      severity: 'HIGH',
    });
  }

  if (lower.includes('execution packet') || lower.includes('packet link')) {
    records.push({
      title: 'Missing execution packet link',
      description: 'Apply plan must link to Phase 15.2 execution packet',
      sourceSystem: 'world2_builder_packet_execution',
      severity: 'HIGH',
    });
  }

  if (lower.includes('failure context') || lower.includes('missing failure')) {
    records.push({
      title: 'Missing failure context',
      description: 'Failure context required to classify recovery strategy',
      sourceSystem: 'failure_visibility_engine',
      severity: 'HIGH',
    });
  }

  if (lower.includes('isolation') || lower.includes('workspace')) {
    records.push({
      title: 'Workspace isolation failure',
      description: 'World 2 workspace must remain isolated during recovery planning',
      sourceSystem: 'workspace_intelligence',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('world 1') || lower.includes('world1')) {
    records.push({
      title: 'World 1 recovery target detected',
      description: 'Recovery must not target or modify World 1',
      sourceSystem: 'workspace_intelligence',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('approval') || lower.includes('founder')) {
    records.push({
      title: 'Approval missing',
      description: 'Founder and multi-gate approvals must be recorded before future recovery',
      sourceSystem: 'founder_approval_execution_gate',
      severity: 'HIGH',
    });
  }

  if (lower.includes('governor') || lower.includes('task')) {
    records.push({
      title: 'Task Governor blocked',
      description: 'Task Governor check must pass before recovery plan',
      sourceSystem: 'task_governor',
      severity: 'MEDIUM',
    });
  }

  if (lower.includes('constitution')) {
    records.push({
      title: 'Constitution blocked',
      description: 'Constitutional enforcement gate must pass',
      sourceSystem: 'law_enforcement',
      severity: 'HIGH',
    });
  }

  if (lower.includes('duplicate') || lower.includes('authority')) {
    records.push({
      title: 'Duplicate authority detected',
      description: 'No duplicate execution authority may exist for recovery planning',
      sourceSystem: 'ownership_registry',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('direct recovery') || lower.includes('git') || lower.includes('shell') || lower.includes('write')) {
    records.push({
      title: 'Direct recovery attempt detected',
      description: 'Direct restore, git reset/checkout, shell commands, and file writes blocked in Phase 15.5',
      sourceSystem: 'world2_recovery_runtime',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('3 failed') || lower.includes('three failure') || lower.includes('repeated')) {
    records.push({
      title: 'Repeated failure limit reached',
      description: 'Same recovery strategy must not repeat after 3 failures — escalate to self-evolution review',
      sourceSystem: 'world2_recovery_runtime',
      severity: 'CRITICAL',
    });
  }

  return records;
}
