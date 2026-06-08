/**
 * Execution system guardrail — detect execution capability claims on foundation systems.
 */

import { DevPulseV2AiDevEngineAuthority } from '../aidev-engine/aidev-engine-authority.js';
import { DevPulseV2CodeGenerationPlannerAuthority } from '../code-generation-planner/code-generation-planner-authority.js';
import { DevPulseV2FailurePredictionAuthority } from '../failure-prediction/failure-prediction-authority.js';
import { DevPulseV2RealityReplayAuthority } from '../reality-replay/reality-replay-authority.js';
import { DevPulseV2RecoveryStrategyAuthority } from '../recovery-strategy-planner/recovery-strategy-authority.js';
import { DevPulseV2RootCauseAttributionAuthority } from '../root-cause-attribution/root-cause-attribution-authority.js';
import { DevPulseV2SelfVisionAuthority } from '../self-vision/self-vision-authority.js';
import { DevPulseV2SessionReplayAuthority } from '../session-replay/session-replay-authority.js';
import type { SystemGuardrailResult } from './types.js';

const EXECUTION_METHOD_NAMES = [
  'execute',
  'runAction',
  'runCommand',
  'executeCommand',
  'writeFile',
  'modifyFile',
  'applyPatch',
  'applyChanges',
  'performRollback',
  'executeRollback',
  'performRecovery',
  'executeRecovery',
  'runAutonomously',
  'autoExecute',
] as const;

function detectExecutionMethods(instance: object): string[] {
  const violations: string[] = [];
  for (const method of EXECUTION_METHOD_NAMES) {
    if (typeof (instance as Record<string, unknown>)[method] === 'function') {
      violations.push(`claims ${method}()`);
    }
  }
  return violations;
}

function checkSystem(systemId: string, instance: object): SystemGuardrailResult {
  const violations = detectExecutionMethods(instance);
  return {
    systemId,
    nonExecuting: violations.length === 0,
    violations,
  };
}

export function validateFoundationSystemsNonExecuting(): SystemGuardrailResult[] {
  return [
    checkSystem('aidev_engine', new DevPulseV2AiDevEngineAuthority()),
    checkSystem('code_generation_planner', new DevPulseV2CodeGenerationPlannerAuthority()),
    checkSystem('recovery_strategy_planner', new DevPulseV2RecoveryStrategyAuthority()),
    checkSystem('root_cause_attribution', new DevPulseV2RootCauseAttributionAuthority()),
    checkSystem('failure_prediction', new DevPulseV2FailurePredictionAuthority()),
    checkSystem('self_vision', new DevPulseV2SelfVisionAuthority()),
    checkSystem('reality_replay', new DevPulseV2RealityReplayAuthority()),
    checkSystem('session_replay', new DevPulseV2SessionReplayAuthority()),
  ];
}

export function assertAllFoundationSystemsNonExecuting(): boolean {
  return validateFoundationSystemsNonExecuting().every((r) => r.nonExecuting);
}
