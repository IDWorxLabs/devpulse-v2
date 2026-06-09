/**
 * Testing request parser — extracts testing planning intent from queries.
 */

import type { TestingRequest } from './testing-runtime-types.js';

let requestCounter = 0;

function nextRequestId(): string {
  requestCounter += 1;
  return `treq-${requestCounter.toString().padStart(4, '0')}`;
}

export function resetTestingRequestCounterForTests(): void {
  requestCounter = 0;
}

export function parseTestingRequest(query: string): TestingRequest {
  const lower = query.toLowerCase().trim();
  let title = 'Testing Planning Request';
  let goal = 'Plan governed testing without executing commands or writing test files';
  let outcome = 'Advisory testing plan with cases, evidence, simulated results, and risks';

  if (lower.includes('how would we test') || lower.includes('how would you test')) {
    title = 'How Would We Test';
    goal = 'Define how proposed work would be tested in a future governed phase';
    outcome = 'Testing plan with cases, pass/fail criteria, and simulated results';
  } else if (lower.includes('what tests are required') || lower.includes('what tests would')) {
    title = 'Required Test Cases';
    goal = 'Identify required test cases for proposed code and build tasks';
    outcome = 'Test case list with pass/fail criteria — no execution';
  } else if (lower.includes('pass or fail') || lower.includes('pass fail criteria')) {
    title = 'Pass/Fail Criteria';
    goal = 'Define what would count as pass or fail for proposed changes';
    outcome = 'Pass and fail criteria advisory — simulation only';
  } else if (lower.includes('what evidence') || lower.includes('test evidence') || lower.includes('validation evidence')) {
    title = 'Testing Evidence Requirements';
    goal = 'Define evidence required to prove proposed changes work';
    outcome = 'Evidence requirement list — no commands executed';
  } else if (lower.includes('prove') || lower.includes('what would prove')) {
    title = 'Proof Requirements';
    goal = 'Define what would prove the proposed change works';
    outcome = 'Proof criteria linked to evidence requirements — advisory only';
  } else if (lower.includes('can testing run') || lower.includes('blocking testing')) {
    title = 'Testing Readiness';
    goal = 'Assess whether testing could run in a future governed phase';
    outcome = 'Readiness advisory — testing blocked, simulation only';
  } else if (lower.includes('simulated failures') || lower.includes('simulated test result')) {
    title = 'Simulated Test Results';
    goal = 'Model simulated pass/fail results without running tests';
    outcome = 'Simulated result set for failure visibility — no test execution';
  } else if (lower.includes('test plan') || lower.includes('testing runtime')) {
    title = 'Testing Plan';
    goal = 'Compose full testing plan from intelligence sources';
    outcome = 'Complete testing plan linked to code generation, build task, and execution packet';
  }

  return {
    requestId: nextRequestId(),
    query,
    title,
    goal,
    requestedOutcome: outcome,
    sourceSystem: 'testing_runtime',
    planningOnly: true,
  };
}
