/**
 * Build task safety gates — advisory gate checklist only.
 */

import { requiredApprovalGates } from '../execution-runtime/execution-governance.js';
import { foundationBlocksRealExecution } from '../execution-runtime/execution-safety-boundary.js';
import type { BuildTaskSafetyGate } from './build-task-runtime-types.js';

let gateCounter = 0;

function nextGateId(): string {
  gateCounter += 1;
  return `bgate-${gateCounter.toString().padStart(3, '0')}`;
}

export function resetBuildTaskSafetyGateCounterForTests(): void {
  gateCounter = 0;
}

export function evaluateBuildTaskSafetyGates(query: string): BuildTaskSafetyGate[] {
  const lower = query.toLowerCase();
  const gates: BuildTaskSafetyGate[] = [
    {
      gateId: nextGateId(),
      name: 'gate-intelligence-only',
      description: 'Build task runtime is planning-only — no execution performed',
      required: true,
      passed: true,
      sourceSystem: 'build_task_runtime',
      planningOnly: true,
    },
    {
      gateId: nextGateId(),
      name: 'gate-no-real-execution',
      description: 'Real execution, file writes, and shell commands are forbidden in Phase 14.2',
      required: true,
      passed: foundationBlocksRealExecution(),
      sourceSystem: 'execution_runtime',
      planningOnly: true,
    },
    {
      gateId: nextGateId(),
      name: 'gate-execution-blocked',
      description: 'Execution packet must remain blocked or simulation-only',
      required: true,
      passed: true,
      sourceSystem: 'execution_runtime',
      planningOnly: true,
    },
    {
      gateId: nextGateId(),
      name: 'gate-simulation-only',
      description: 'Build task plan must remain in simulation-only state',
      required: true,
      passed: true,
      sourceSystem: 'build_task_runtime',
      planningOnly: true,
    },
  ];

  for (const approval of requiredApprovalGates().slice(0, 3)) {
    gates.push({
      gateId: nextGateId(),
      name: `gate-${approval}`,
      description: `Future approval required: ${approval}`,
      required: true,
      passed: false,
      sourceSystem: 'execution_runtime',
      planningOnly: true,
    });
  }

  if (lower.includes('deploy') || lower.includes('write file') || lower.includes('auto-fix')) {
    gates.push({
      gateId: nextGateId(),
      name: 'gate-forbidden-pattern',
      description: 'Query contains forbidden execution pattern — build task remains blocked',
      required: true,
      passed: false,
      sourceSystem: 'build_task_runtime',
      planningOnly: true,
    });
  }

  return gates;
}
