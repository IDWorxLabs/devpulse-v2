/**
 * ASE Enforcement — goal evaluation from evidence (not stage numbers).
 */

import type { EngineeringEvidenceBundle, EngineeringGoal, EngineeringState } from './ase-enforcement-engine-types.js';

export function evaluateEngineeringGoal(input: {
  state: EngineeringState;
  evidence: EngineeringEvidenceBundle;
  materializationExecuted: boolean;
  simulateHumanReviewPayment?: boolean;
}): EngineeringGoal {
  const { state, evidence, materializationExecuted, simulateHumanReviewPayment } = input;

  if (simulateHumanReviewPayment || evidence.humanReviewRequired) {
    return 'ESCALATE_UNSAFE_REQUEST';
  }
  if (state === 'HUMAN_REVIEW_REQUIRED') {
    return 'ESCALATE_UNSAFE_REQUEST';
  }
  if (evidence.blockers.some((b) => /payment|unsafe|human review/i.test(b))) {
    return 'ESCALATE_UNSAFE_REQUEST';
  }
  if (goalFromBlockers(evidence.blockers) === 'REPAIR_ENGINEERING_FAILURES' || state === 'REPAIRING') {
    return 'REPAIR_ENGINEERING_FAILURES';
  }
  if (goalFromBlockers(evidence.blockers) === 'EVOLVE_MISSING_CAPABILITIES' || state === 'EVOLVING_CAPABILITIES') {
    return 'EVOLVE_MISSING_CAPABILITIES';
  }
  if (state === 'CONTINUOUS_IMPROVEMENT') {
    return 'IMPROVE_PRODUCT_QUALITY';
  }
  if (!materializationExecuted && (state === 'GENERATING' || state === 'PLANNING' || state === 'UNDERSTANDING_PRODUCT')) {
    if (!evidence.readyForMaterialization) {
      return goalFromBlockers(evidence.blockers) ?? 'PLAN_CAPABILITIES';
    }
    return 'GENERATE_APPLICATION';
  }
  if (!materializationExecuted) {
    return evidence.readyForMaterialization ? 'GENERATE_APPLICATION' : 'PLAN_CAPABILITIES';
  }
  if (state === 'VALIDATING' || !evidence.readyForLaunch) {
    return 'COMPLETE_LAUNCH_EVIDENCE';
  }
  if (evidence.blockers.some((b) => /interaction|handler|dead button/i.test(b))) {
    return 'PROVE_INTERACTIONS';
  }
  return 'COMPLETE_LAUNCH_EVIDENCE';
}

function goalFromBlockers(blockers: readonly string[]): EngineeringGoal | null {
  const text = blockers.join(' ');
  if (/capability|evolution/i.test(text)) return 'EVOLVE_MISSING_CAPABILITIES';
  if (/interaction|handler|dead button|debug/i.test(text)) return 'REPAIR_ENGINEERING_FAILURES';
  if (/validation|behavior|simulation/i.test(text)) return 'VALIDATE_BEHAVIOR';
  return null;
}
