/**
 * DevPulse V2 Phase 14.4 — Testing Runtime Foundation public API.
 */

export {
  TESTING_RUNTIME_FOUNDATION_PASS_TOKEN,
  TESTING_RUNTIME_OWNER_MODULE,
  TESTING_QUESTION_SIGNALS,
  TESTING_INPUT_SOURCES,
  FORBIDDEN_TESTING_RUNTIME_DUPLICATES,
  isTestingRuntimeFoundationQuestion,
  isDuplicateTestingBrainQuestion,
  isTestingPlanningAdvisoryQuestion,
  type TestingState,
  type TestingConfidence,
  type SimulatedTestStatus,
  type TestingRequest,
  type TestingCase,
  type TestingEvidenceRequirement,
  type TestingRisk,
  type SimulatedTestResult,
  type TestingPlan,
  type TestingRuntimeDiagnostics,
  type TestingRuntimeResult,
} from './testing-runtime-types.js';

export {
  parseTestingRequest,
  resetTestingRequestCounterForTests,
} from './testing-request-parser.js';

export {
  buildTestCases,
  extractPassCriteria,
  extractFailCriteria,
  resetTestCaseCounterForTests,
} from './test-case-model.js';

export {
  buildEvidenceRequirements,
  resetTestEvidenceCounterForTests,
} from './test-evidence-model.js';

export {
  analyzeTestRisks,
  resetTestRiskCounterForTests,
} from './test-risk-analyzer.js';

export {
  buildSimulatedTestResults,
  simulatedFailureResults,
  resetSimulatedTestResultCounterForTests,
} from './simulated-test-result-model.js';

export {
  buildTestingPlan,
  resetTestingPlanCounterForTests,
} from './test-plan-builder.js';

export {
  getTestingRuntimeDiagnostics,
  updateTestingRuntimeDiagnostics,
  resetTestingRuntimeDiagnostics,
  testingRuntimeKey,
} from './testing-runtime-diagnostics.js';

export {
  processTestingRuntimeRequest,
  getTestingRuntimeContext,
} from './testing-runtime.js';

export { buildTestingFailureContext } from './testing-failure-bridge.js';

export function getDevPulseV2TestingRuntime(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_testing_runtime',
    passToken: 'DEVPULSE_V2_TESTING_RUNTIME_FOUNDATION_V1_PASS',
    phase: 14.4,
  };
}
