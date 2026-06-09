/**
 * DevPulse V2 Phase 16.5 — Interaction Testing Engine public API.
 */

export {
  INTERACTION_TESTING_ENGINE_PASS_TOKEN,
  INTERACTION_TESTING_ENGINE_OWNER_MODULE,
  INTERACTION_TESTING_QUESTION_SIGNALS,
  FORBIDDEN_INTERACTION_TESTING_DUPLICATES,
  ALL_INTERACTION_TYPES,
  isInteractionTestingQuestion,
  isInteractionTestingAdvisoryQuestion,
  isDuplicateInteractionTestingQuestion,
  type InteractionType,
  type InteractionState,
  type InteractionPlan,
  type ExecutedInteraction,
  type InteractionResult,
  type InteractionTestingReport,
  type InteractionTestingDiagnostics,
  type ExecuteInteractionTestingInput,
  type ExecuteInteractionTestingResult,
} from './types.js';

export {
  parseInteractionTestingQuery,
  resetInteractionTestingRequestCounterForTests,
  type ParsedInteractionTestingQuery,
} from './interaction-testing-request-parser.js';

export {
  classifyInteractionSurfaces,
  type ClassifiedInteractionSurface,
} from './interaction-surface-classifier.js';

export {
  buildInteractionPlans,
  resetInteractionPlanCounterForTests,
} from './interaction-plan-builder.js';

export {
  executeButtonInteractions,
  resetButtonInteractionCounterForTests,
} from './button-interaction-tester.js';

export {
  executeNavigationInteractions,
  resetNavigationInteractionCounterForTests,
} from './navigation-interaction-tester.js';

export {
  executeFormInteractions,
  resetFormInteractionCounterForTests,
} from './form-interaction-tester.js';

export {
  executeWorkflowInteractions,
  resetWorkflowInteractionCounterForTests,
} from './workflow-interaction-tester.js';

export {
  recordInteractionResults,
  summarizeInteractionCount,
} from './interaction-result-recorder.js';

export {
  evaluateInteractionTestingGates,
  validateInteractionTesting,
  type InteractionTestingGateReport,
  type InteractionTestingValidationResult,
} from './interaction-testing-validator.js';

export {
  buildInteractionTestingReport,
  composeInteractionTestingResponse,
  buildInteractionTestingFailureContext,
  nextInteractionTestId,
  resetInteractionTestingReportCounterForTests,
  type InteractionTestingFailureContext,
} from './interaction-testing-report.js';

export {
  getInteractionTestingDiagnostics,
  updateInteractionTestingDiagnostics,
  resetInteractionTestingDiagnostics,
  interactionTestingKey,
} from './interaction-testing-diagnostics.js';

export {
  executeInteractionTesting,
  processInteractionTestingRequest,
  getInteractionTestingContext,
} from './interaction-testing-engine.js';

export function getDevPulseV2InteractionTestingEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_interaction_testing_engine',
    passToken: 'INTERACTION_TESTING_ENGINE_V1_PASS',
    phase: 16.5,
    extensionOnly: true,
  };
}
