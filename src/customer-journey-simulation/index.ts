export {
  CUSTOMER_JOURNEY_SIMULATION_PASS_TOKEN,
  CUSTOMER_JOURNEY_SIMULATION_OWNER_MODULE,
  MAX_CUSTOMER_PERSONAS,
  MAX_CUSTOMER_JOURNEYS,
  MAX_CUSTOMER_FINDINGS,
  MAX_CUSTOMER_SCENARIOS,
  MAX_ADOPTION_BLOCKERS,
} from './customer-journey-simulation-bounds.js';

export type {
  CustomerFindingType,
  CustomerJourneyCategory,
  CustomerPersonaId,
  CustomerSeverity,
  CustomerJourneySubscores,
  CustomerJourneyFinding,
  CustomerPersonaResult,
  CustomerJourneyScenarioResult,
  CustomerJourneyFeedEvent,
  CustomerJourneySimulationAssessment,
  CustomerJourneyShellSources,
  AssessCustomerJourneySimulationInput,
  EnrichedCustomerJourneyAssessments,
  CustomerJourneySimulationVisibility,
} from './customer-journey-simulation-types.js';

export {
  assessCustomerJourneySimulation,
  evaluateCustomerJourneySimulationVisibility,
  enrichAssessmentsWithCustomerJourney,
  resetCustomerJourneyCounterForTests,
} from './customer-journey-simulation-authority.js';
