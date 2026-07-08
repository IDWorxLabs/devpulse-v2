/**
 * ASE Enforcement — central engineering decision brain.
 */

import type {
  EngineeringDecision,
  EngineeringDecisionType,
  EngineeringEvidenceBundle,
  EngineeringGoal,
  EngineeringState,
} from './ase-enforcement-engine-types.js';

export function evaluateEngineeringDecision(input: {
  state: EngineeringState;
  goal: EngineeringGoal;
  evidence: EngineeringEvidenceBundle;
  materializationExecuted: boolean;
}): EngineeringDecision {
  const { state, goal, evidence, materializationExecuted } = input;

  if (goal === 'ESCALATE_UNSAFE_REQUEST' || state === 'HUMAN_REVIEW_REQUIRED') {
    return makeDecision('ESCALATE_TO_HUMAN_REVIEW', goal, 'Human safety review required.', null, false);
  }

  if (state === 'FAILED' && evidence.blockers.length === 0) {
    return makeDecision('STOP_ENGINEERING', goal, 'Engineering failed without recovery path.', null, false);
  }

  if (goal === 'REPAIR_ENGINEERING_FAILURES' || state === 'REPAIRING') {
    return makeDecision(
      'RUN_AUTONOMOUS_DEBUGGING',
      goal,
      'Route to autonomous debugging for repair.',
      'AUTONOMOUS_DEBUGGING',
      true,
    );
  }

  if (goal === 'EVOLVE_MISSING_CAPABILITIES' || state === 'EVOLVING_CAPABILITIES') {
    return makeDecision(
      'RUN_CAPABILITY_EVOLUTION',
      goal,
      'Missing capability evolution required.',
      'MISSING_CAPABILITY_EVOLUTION',
      true,
    );
  }

  if (goal === 'IMPROVE_PRODUCT_QUALITY' || state === 'CONTINUOUS_IMPROVEMENT') {
    return makeDecision(
      'RUN_CONTINUOUS_IMPROVEMENT',
      goal,
      'Continuous improvement loop authorized.',
      'CONTINUOUS_IMPROVEMENT',
      true,
    );
  }

  if (goal === 'PROVE_INTERACTIONS') {
    return makeDecision(
      'RUN_INTERACTION_PROOF',
      goal,
      'Interaction proof must pass before launch.',
      'INTERACTION_PROOF',
      true,
    );
  }

  if (goal === 'VALIDATE_BEHAVIOR') {
    return makeDecision('RUN_VALIDATION', goal, 'Validation pipeline must complete.', 'BEHAVIOR_SIMULATION', true);
  }

  if (goal === 'COMPLETE_LAUNCH_EVIDENCE' && materializationExecuted) {
    if (evidence.readyForLaunch && evidence.readyForMaterialization) {
      return makeDecision('READY_FOR_LAUNCH', goal, 'Launch evidence complete.', 'LAUNCH_READINESS', true);
    }
    return makeDecision('RUN_VALIDATION', goal, 'Launch evidence incomplete — continue validation.', 'LAUNCH_READINESS', true);
  }

  if (!materializationExecuted) {
    if (evidence.readyForMaterialization && evidence.readyForGeneration) {
      return makeDecision('CONTINUE_BUILD', goal, 'ASE authorizes materialization.', 'MATERIALIZATION', true);
    }
    if (!evidence.readyForMaterialization) {
      const blockerText = evidence.blockers.join(' ');
      if (/payment|unsafe|human/i.test(blockerText)) {
        return makeDecision('ESCALATE_TO_HUMAN_REVIEW', goal, blockerText, 'HUMAN_REVIEW', false);
      }
      if (/capability|evolution/i.test(blockerText)) {
        return makeDecision('RUN_CAPABILITY_EVOLUTION', goal, blockerText, 'MISSING_CAPABILITY_EVOLUTION', true);
      }
      return makeDecision('RETRY_LAST_STEP', goal, blockerText || 'Gates not satisfied.', 'RETRY', true);
    }
    return makeDecision('CONTINUE_BUILD', goal, 'Continue authorized engineering.', 'INCREMENTAL_BUILD', true);
  }

  return makeDecision('CONTINUE_BUILD', goal, 'Engineering continues under ASE authority.', null, true);
}

function makeDecision(
  decision: EngineeringDecisionType,
  goal: EngineeringGoal,
  reason: string,
  recoveryRoute: EngineeringDecision['recoveryRoute'],
  authorized: boolean,
): EngineeringDecision {
  return {
    readOnly: true,
    decision,
    goal,
    reason,
    authorized,
    recoveryRoute,
  };
}
