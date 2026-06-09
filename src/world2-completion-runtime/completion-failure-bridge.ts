/**
 * Completion failure bridge — lightweight blocked-state context.
 */

import { isWorld2CompletionQuestion } from './types.js';

export interface CompletionFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildCompletionFailureContext(query: string): CompletionFailureContext[] {
  if (!isWorld2CompletionQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: CompletionFailureContext[] = [
    {
      title: 'Completion blocked: Phase 15.6 plans only',
      description: 'completionAllowed must remain false — no marking projects complete',
      sourceSystem: 'world2_completion_runtime',
      severity: 'CRITICAL',
    },
  ];

  if (lower.includes('recovery plan') || lower.includes('missing recovery')) {
    records.push({
      title: 'Missing recovery plan',
      description: 'Phase 15.5 recovery plan required before completion planning',
      sourceSystem: 'world2_recovery_runtime',
      severity: 'HIGH',
    });
  }

  if (lower.includes('rollback plan') || lower.includes('missing rollback')) {
    records.push({
      title: 'Missing rollback plan',
      description: 'Phase 15.4 rollback plan required before completion planning',
      sourceSystem: 'world2_rollback_runtime',
      severity: 'HIGH',
    });
  }

  if (lower.includes('apply plan') || lower.includes('missing apply')) {
    records.push({
      title: 'Missing apply plan',
      description: 'Phase 15.3 controlled apply plan required before completion planning',
      sourceSystem: 'world2_controlled_apply_runtime',
      severity: 'HIGH',
    });
  }

  if (lower.includes('execution packet') || lower.includes('missing packet')) {
    records.push({
      title: 'Missing execution packet',
      description: 'Phase 15.2 execution packet required before completion planning',
      sourceSystem: 'world2_builder_packet_execution',
      severity: 'HIGH',
    });
  }

  if (lower.includes('evidence') || lower.includes('missing evidence')) {
    records.push({
      title: 'Missing evidence',
      description: 'Completion evidence must be recorded before completion declaration',
      sourceSystem: 'world2_completion_runtime',
      severity: 'HIGH',
    });
  }

  if (lower.includes('verification') || lower.includes('missing verification')) {
    records.push({
      title: 'Missing verification',
      description: 'Runtime verification must pass before completion planning',
      sourceSystem: 'runtime_verification_layer',
      severity: 'HIGH',
    });
  }

  if (lower.includes('world 1') || lower.includes('world1')) {
    records.push({
      title: 'World 1 completion target detected',
      description: 'Completion must not target or modify World 1',
      sourceSystem: 'workspace_intelligence',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('approval') || lower.includes('founder')) {
    records.push({
      title: 'Approval missing',
      description: 'Founder and multi-gate approvals must be recorded before completion',
      sourceSystem: 'founder_approval_execution_gate',
      severity: 'HIGH',
    });
  }

  if (lower.includes('governor') || lower.includes('task')) {
    records.push({
      title: 'Task Governor blocked',
      description: 'Task Governor check must pass before completion plan',
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
      description: 'No duplicate execution authority may exist for completion planning',
      sourceSystem: 'ownership_registry',
      severity: 'CRITICAL',
    });
  }

  return records;
}
