/**
 * System sequence engine — sequences existing system domains for exposure. No duplication.
 */

import type { ExperienceJourneyStage } from './types.js';
import { EXPOSED_SYSTEM_DOMAINS } from './types.js';
import { generateJourneyStages } from './founder-journey-engine.js';

const STAGE_SYSTEMS: Record<ExperienceJourneyStage, readonly string[]> = {
  IDEA_CAPTURE: ['world2_workspace_foundation', 'intent_architecture'],
  PROJECT_PLANNING: ['world2_execution_planner', 'execution_authority'],
  WORLD2_SIMULATION: ['world2_simulation_runtime', 'world2_learning_loop'],
  BUILD_PREPARATION: ['world2_autonomous_builder', 'controlled_execution_bridge'],
  VERIFICATION: ['verification_gated_apply', 'execution_evidence_ledger', 'execution_verification_loop'],
  TRUST_REVIEW: ['trust_engine', 'evidence_registry'],
  MOBILE_MONITORING: [
    'mobile_command_foundation',
    'mobile_chat_interface',
    'mobile_live_preview_foundation',
    'mobile_approval_flow_foundation',
    'cross_device_continuity_foundation',
  ],
  SELF_EVOLUTION_ANALYSIS: [
    'missing_capability_detector',
    'safe_capability_acquisition',
    'self_learning_engine',
    'architecture_drift_detection',
    'complexity_score_foundation',
    'future_problem_prediction',
  ],
  PROJECT_COMPLETION: ['world2_completion_verifier', 'founder_approval_execution_gate'],
};

export function systemSequenceKey(systems: string[]): string {
  return systems.join('→');
}

export function generateSystemSequence(stages: ExperienceJourneyStage[]): string[] {
  const seen = new Set<string>();
  const sequence: string[] = [];

  for (const stage of stages) {
    for (const system of STAGE_SYSTEMS[stage]) {
      if (!seen.has(system)) {
        seen.add(system);
        sequence.push(system);
      }
    }
  }

  return sequence;
}

export function getFullExposedSystemSequence(): string[] {
  return generateSystemSequence(generateJourneyStages());
}

export function systemsForStage(stage: ExperienceJourneyStage): string[] {
  return [...STAGE_SYSTEMS[stage]];
}

export function includesGovernanceStack(systems: string[]): boolean {
  return systems.some((s) =>
    ['execution_authority', 'verification_gated_apply', 'founder_approval_execution_gate'].includes(s),
  );
}

export function includesWorld2Stack(systems: string[]): boolean {
  return systems.some((s) => s.startsWith('world2_') || s === 'controlled_execution_bridge');
}

export function includesMobileStack(systems: string[]): boolean {
  return systems.some((s) => s.startsWith('mobile_') || s === 'cross_device_continuity_foundation');
}

export function includesSelfEvolutionStack(systems: string[]): boolean {
  return systems.some((s) =>
    [
      'missing_capability_detector',
      'safe_capability_acquisition',
      'self_learning_engine',
      'architecture_drift_detection',
      'complexity_score_foundation',
      'future_problem_prediction',
    ].includes(s),
  );
}

export function includesVerificationAwareness(systems: string[]): boolean {
  return systems.some((s) =>
    ['verification_gated_apply', 'execution_verification_loop', 'execution_evidence_ledger'].includes(s),
  );
}

export function includesTrustAwareness(systems: string[]): boolean {
  return systems.some((s) => ['trust_engine', 'evidence_registry'].includes(s));
}
