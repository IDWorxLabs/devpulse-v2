/**
 * Builder packet execution failure bridge — lightweight blocked-state context.
 */

import { isWorld2BuilderPacketExecutionQuestion } from './types.js';

export interface BuilderPacketExecutionFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildBuilderPacketExecutionFailureContext(query: string): BuilderPacketExecutionFailureContext[] {
  if (!isWorld2BuilderPacketExecutionQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: BuilderPacketExecutionFailureContext[] = [
    {
      title: 'Builder packet blocked: Phase 15.2 preparation only',
      description: 'No file writes, apply operations, shell commands, or deployment in this phase',
      sourceSystem: 'world2_builder_packet_execution',
      severity: 'CRITICAL',
    },
    {
      title: 'Builder packet blocked: executionAllowed must remain false',
      description: 'Execution packet is inspectable only — no governed apply until future phase',
      sourceSystem: 'world2_builder_packet_execution',
      severity: 'HIGH',
    },
  ];

  if (lower.includes('activation') || lower.includes('missing')) {
    records.push({
      title: 'Missing World 2 activation',
      description: 'Phase 15.1 activation plan required before builder packet execution preparation',
      sourceSystem: 'world2_execution_activation',
      severity: 'HIGH',
    });
  }

  if (lower.includes('world 1') || lower.includes('world1')) {
    records.push({
      title: 'World 1 target detected',
      description: 'Builder packet execution must not target or modify World 1',
      sourceSystem: 'workspace_intelligence',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('blocked') || lower.includes('approval')) {
    records.push({
      title: 'Approval missing',
      description: 'Founder approval and high/critical step approvals must be recorded before controlled apply',
      sourceSystem: 'founder_approval_execution_gate',
      severity: 'HIGH',
    });
  }

  if (lower.includes('governor') || lower.includes('task')) {
    records.push({
      title: 'Task Governor blocked',
      description: 'Task Governor scheduling check must pass before execution packet preparation',
      sourceSystem: 'task_governor',
      severity: 'MEDIUM',
    });
  }

  return records;
}
