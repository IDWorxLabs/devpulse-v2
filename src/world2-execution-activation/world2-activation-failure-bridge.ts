/**
 * World 2 activation failure bridge — surfaces isolation/gate failures without full plan chain.
 */

import { isWorld2ExecutionActivationQuestion } from './world2-execution-activation-types.js';

export interface World2ActivationFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildWorld2ActivationFailureContext(query: string): World2ActivationFailureContext[] {
  if (!isWorld2ExecutionActivationQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: World2ActivationFailureContext[] = [
    {
      title: 'World 2 activation blocked: Phase 15.1 simulation only',
      description: 'World 2 execution activation foundation forbids real execution, file writes, and World 1 modification',
      sourceSystem: 'world2_execution_activation',
      severity: 'CRITICAL',
    },
    {
      title: 'World 2 activation blocked: Founder approval required',
      description: 'Founder approval gate must pass before any future governed World 2 execution',
      sourceSystem: 'unified_decision_layer',
      severity: 'HIGH',
    },
    {
      title: 'World 2 activation blocked: executionAllowed must remain false',
      description: 'Runtime chain execution remains blocked during Phase 15.1 activation planning',
      sourceSystem: 'execution_runtime',
      severity: 'HIGH',
    },
  ];

  if (lower.includes('isolation') || lower.includes('world 1 protected')) {
    records.push({
      title: 'Isolation gate: World 1 must remain protected',
      description: 'Any World 2 activation path that could modify World 1 is blocked',
      sourceSystem: 'workspace_intelligence',
      severity: 'HIGH',
    });
  }

  if (lower.includes('blocks') || lower.includes('blocker')) {
    records.push({
      title: 'Activation blocker: Future execution gates required',
      description: 'Phase 15.1 creates activation plans only — future phases must explicitly allow execution',
      sourceSystem: 'world2_execution_activation',
      severity: 'MEDIUM',
    });
  }

  return records;
}
