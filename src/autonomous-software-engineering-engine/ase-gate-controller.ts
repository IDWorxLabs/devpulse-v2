/**
 * ASE — gate controller.
 */

import type { AseGateResult, AseStageId, AseStageResult } from './ase-types.js';
import { ASE_STAGE_ORDER } from './ase-types.js';

const STAGE_DEFINITIONS: Record<
  AseStageId,
  { requiredPrior: readonly AseStageId[]; passCheck: (results: Map<AseStageId, AseStageResult>) => boolean }
> = {
  INTENT_UNDERSTANDING: { requiredPrior: [], passCheck: () => true },
  PROMPT_FAITHFULNESS: {
    requiredPrior: ['INTENT_UNDERSTANDING'],
    passCheck: (r) => r.get('INTENT_UNDERSTANDING')?.passed === true,
  },
  CAPABILITY_PLANNING: {
    requiredPrior: ['PROMPT_FAITHFULNESS'],
    passCheck: (r) => r.get('PROMPT_FAITHFULNESS')?.passed === true,
  },
  MISSING_CAPABILITY_EVOLUTION: {
    requiredPrior: ['CAPABILITY_PLANNING'],
    passCheck: (r) => r.get('CAPABILITY_PLANNING')?.passed === true || r.get('CAPABILITY_PLANNING')?.status === 'SKIPPED',
  },
  INCREMENTAL_BUILD: {
    requiredPrior: ['MISSING_CAPABILITY_EVOLUTION', 'CAPABILITY_PLANNING'],
    passCheck: (r) =>
      r.get('MISSING_CAPABILITY_EVOLUTION')?.passed === true ||
      r.get('MISSING_CAPABILITY_EVOLUTION')?.status === 'SKIPPED',
  },
  BEHAVIOR_SIMULATION: {
    requiredPrior: ['INCREMENTAL_BUILD'],
    passCheck: (r) => r.get('INCREMENTAL_BUILD')?.passed === true,
  },
  VIRTUAL_USER: {
    requiredPrior: ['BEHAVIOR_SIMULATION'],
    passCheck: (r) => r.get('BEHAVIOR_SIMULATION')?.passed === true,
  },
  VIRTUAL_DEVICE: {
    requiredPrior: ['VIRTUAL_USER', 'INCREMENTAL_BUILD'],
    passCheck: (r) => r.get('VIRTUAL_USER')?.passed === true && r.get('INCREMENTAL_BUILD')?.passed === true,
  },
  INTERACTION_PROOF: {
    requiredPrior: ['BEHAVIOR_SIMULATION', 'VIRTUAL_DEVICE', 'INCREMENTAL_BUILD'],
    passCheck: (r) =>
      r.get('BEHAVIOR_SIMULATION')?.passed === true &&
      r.get('VIRTUAL_DEVICE')?.passed === true,
  },
  AUTONOMOUS_DEBUGGING: {
    requiredPrior: ['INTERACTION_PROOF'],
    passCheck: () => true,
  },
  CONTINUOUS_IMPROVEMENT: {
    requiredPrior: ['AUTONOMOUS_DEBUGGING'],
    passCheck: (r) => r.get('AUTONOMOUS_DEBUGGING')?.passed === true,
  },
  LAUNCH_READINESS_AUTHORITY: {
    requiredPrior: ['CONTINUOUS_IMPROVEMENT'],
    passCheck: (r) => r.get('CONTINUOUS_IMPROVEMENT')?.passed === true,
  },
  LIVE_PREVIEW_GATE: {
    requiredPrior: ['LAUNCH_READINESS_AUTHORITY'],
    passCheck: (r) => r.get('LAUNCH_READINESS_AUTHORITY')?.passed === true,
  },
};

export function canProceedToStage(
  stageId: AseStageId,
  stageResults: Map<AseStageId, AseStageResult>,
): { allowed: boolean; blockedReason: string | null } {
  const def = STAGE_DEFINITIONS[stageId];
  for (const prior of def.requiredPrior) {
    const priorResult = stageResults.get(prior);
    if (!priorResult || (!priorResult.passed && priorResult.status !== 'SKIPPED')) {
      return {
        allowed: false,
        blockedReason: `${stageId} cannot run until ${prior} passes.`,
      };
    }
  }
  if (!def.passCheck(stageResults)) {
    return {
      allowed: false,
      blockedReason: `${stageId} gate prerequisites not satisfied.`,
    };
  }
  return { allowed: true, blockedReason: null };
}

export function buildAseGateResults(stageResults: Map<AseStageId, AseStageResult>): readonly AseGateResult[] {
  return ASE_STAGE_ORDER.map((stageId) => {
    const result = stageResults.get(stageId);
    return {
      readOnly: true,
      gateId: stageId,
      passed: result?.passed ?? false,
      blockedReason: result?.blockedReason ?? null,
    };
  });
}

export function getStageDefinition(stageId: AseStageId) {
  const names: Record<AseStageId, string> = {
    INTENT_UNDERSTANDING: 'Intent Understanding Engine',
    PROMPT_FAITHFULNESS: 'Prompt Faithfulness Engine V2',
    CAPABILITY_PLANNING: 'Capability Planning Engine',
    MISSING_CAPABILITY_EVOLUTION: 'Missing Capability Evolution Engine',
    INCREMENTAL_BUILD: 'Incremental Autonomous Builder',
    BEHAVIOR_SIMULATION: 'Behavior Simulation Engine',
    VIRTUAL_USER: 'Virtual User Engine',
    VIRTUAL_DEVICE: 'Virtual Device Laboratory',
    INTERACTION_PROOF: 'Interaction Proof Engine',
    AUTONOMOUS_DEBUGGING: 'Autonomous Debugging Engine',
    CONTINUOUS_IMPROVEMENT: 'Continuous Product Improvement Engine',
    LAUNCH_READINESS_AUTHORITY: 'Launch Readiness Authority V2',
    LIVE_PREVIEW_GATE: 'Live Preview Gate',
  };
  return {
    stageId,
    name: names[stageId],
    requiredPriorStages: STAGE_DEFINITIONS[stageId].requiredPrior,
    passCondition: `${stageId} evidence published with PASS status`,
    failureCondition: `${stageId} evidence indicates blocking failure`,
    recoveryRoute: 'AUTONOMOUS_DEBUGGING' as const,
    resumeBoundary: 'FEATURE_SLICE_STABILIZED' as const,
  };
}
