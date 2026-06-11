/**
 * Founder Interaction Simulation Engine — public API.
 */

export {
  FOUNDER_INTERACTION_SIMULATION_PASS_TOKEN,
  FOUNDER_INTERACTION_SIMULATION_OWNER_MODULE,
  MAX_INTERACTION_SCENARIOS,
  MAX_INTERACTION_FINDINGS,
} from './founder-interaction-simulation-bounds.js';

export type {
  InteractionFindingType,
  InteractionCategory,
  InteractionSeverity,
  InteractionFinding,
  InteractionScenarioResult,
  InteractionFeedEvent,
  FounderInteractionSimulationAssessment,
  FounderInteractionShellSources,
  AssessFounderInteractionSimulationInput,
  EnrichedAssessments,
} from './founder-interaction-simulation-types.js';

export {
  assessFounderInteractionSimulation,
  enrichAssessmentsWithInteractionSimulation,
  resetFounderInteractionCounterForTests,
} from './founder-interaction-simulation-authority.js';
