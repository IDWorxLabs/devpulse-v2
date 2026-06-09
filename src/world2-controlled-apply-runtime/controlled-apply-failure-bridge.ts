/**
 * Controlled apply failure bridge — lightweight blocked-state context.
 */

import { isWorld2ControlledApplyQuestion } from './types.js';

export interface ControlledApplyFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildControlledApplyFailureContext(query: string): ControlledApplyFailureContext[] {
  if (!isWorld2ControlledApplyQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: ControlledApplyFailureContext[] = [
    {
      title: 'Controlled apply blocked: Phase 15.3 apply plans only',
      description: 'applyAllowed must remain false — no file writes, apply, or shell commands',
      sourceSystem: 'world2_controlled_apply_runtime',
      severity: 'CRITICAL',
    },
  ];

  if (lower.includes('activation') || lower.includes('missing')) {
    records.push({
      title: 'Missing World 2 activation',
      description: 'Phase 15.1 activation required before controlled apply plan',
      sourceSystem: 'world2_execution_activation',
      severity: 'HIGH',
    });
  }

  if (lower.includes('packet') || lower.includes('execution')) {
    records.push({
      title: 'Missing execution packet',
      description: 'Phase 15.2 builder packet execution packet required as input',
      sourceSystem: 'world2_builder_packet_execution',
      severity: 'HIGH',
    });
  }

  if (lower.includes('isolation') || lower.includes('workspace')) {
    records.push({
      title: 'Workspace isolation failure',
      description: 'World 2 workspace must be isolated before controlled apply',
      sourceSystem: 'workspace_intelligence',
      severity: 'HIGH',
    });
  }

  if (lower.includes('world 1') || lower.includes('world1')) {
    records.push({
      title: 'World 1 target detected',
      description: 'Controlled apply must not target or modify World 1',
      sourceSystem: 'workspace_intelligence',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('approval') || lower.includes('founder')) {
    records.push({
      title: 'Approval missing',
      description: 'Founder and multi-gate approvals must be recorded before future apply',
      sourceSystem: 'founder_approval_execution_gate',
      severity: 'HIGH',
    });
  }

  if (lower.includes('governor') || lower.includes('task')) {
    records.push({
      title: 'Task Governor blocked',
      description: 'Task Governor check must pass before controlled apply plan',
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
      description: 'No duplicate execution authority may exist for controlled apply',
      sourceSystem: 'ownership_registry',
      severity: 'CRITICAL',
    });
  }

  return records;
}
