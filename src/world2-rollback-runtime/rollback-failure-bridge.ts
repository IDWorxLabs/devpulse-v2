/**
 * Rollback failure bridge — lightweight blocked-state context.
 */

import { isWorld2RollbackQuestion } from './types.js';

export interface RollbackFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildRollbackFailureContext(query: string): RollbackFailureContext[] {
  if (!isWorld2RollbackQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: RollbackFailureContext[] = [
    {
      title: 'Rollback blocked: Phase 15.4 plans only',
      description: 'rollbackAllowed must remain false — no restore, git, or file operations',
      sourceSystem: 'world2_rollback_runtime',
      severity: 'CRITICAL',
    },
  ];

  if (lower.includes('apply plan') || lower.includes('missing')) {
    records.push({
      title: 'Missing apply plan',
      description: 'Phase 15.3 controlled apply plan required before rollback planning',
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

  if (lower.includes('snapshot')) {
    records.push({
      title: 'Missing snapshot strategy',
      description: 'Pre-apply snapshot requirements must be identified before rollback planning',
      sourceSystem: 'world2_rollback_runtime',
      severity: 'HIGH',
    });
  }

  if (lower.includes('world 1') || lower.includes('world1')) {
    records.push({
      title: 'World 1 rollback target detected',
      description: 'Rollback must not target or modify World 1',
      sourceSystem: 'workspace_intelligence',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('approval') || lower.includes('founder')) {
    records.push({
      title: 'Approval missing',
      description: 'Founder and multi-gate approvals must be recorded before future rollback',
      sourceSystem: 'founder_approval_execution_gate',
      severity: 'HIGH',
    });
  }

  if (lower.includes('governor') || lower.includes('task')) {
    records.push({
      title: 'Task Governor blocked',
      description: 'Task Governor check must pass before rollback plan',
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
      description: 'No duplicate execution authority may exist for rollback planning',
      sourceSystem: 'ownership_registry',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('direct rollback') || lower.includes('git') || lower.includes('shell')) {
    records.push({
      title: 'Direct rollback attempt detected',
      description: 'Direct restore, git reset/checkout, and shell commands blocked in Phase 15.4',
      sourceSystem: 'world2_rollback_runtime',
      severity: 'CRITICAL',
    });
  }

  return records;
}
