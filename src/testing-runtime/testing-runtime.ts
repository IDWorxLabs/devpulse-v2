/**
 * Testing Runtime Foundation — Phase 14.4 orchestrator.
 * Creates test plans and simulated results — does NOT run tests or write files.
 */

import { publishTestingRuntimeFeedStages } from '../operator-feed/testing-runtime-feed-bridge.js';
import { buildTestingPlan } from './test-plan-builder.js';
import { parseTestingRequest } from './testing-request-parser.js';
import {
  getTestingRuntimeDiagnostics,
  updateTestingRuntimeDiagnostics,
} from './testing-runtime-diagnostics.js';
import { simulatedFailureResults } from './simulated-test-result-model.js';
import {
  isDuplicateTestingBrainQuestion,
  type TestingPlan,
  type TestingRuntimeDiagnostics,
  type TestingRuntimeResult,
} from './testing-runtime-types.js';

function composeResponse(query: string, plan: TestingPlan): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Testing Runtime Foundation Response', ''];

  if (isDuplicateTestingBrainQuestion(query)) {
    lines.push('Recommendation: No.');
    lines.push(
      'Why: Phase 14.4 Testing Runtime Foundation extends testing planning architecture — do not create testing_brain, test_brain, or validation_brain duplicates.',
    );
    lines.push('Next safe action: Extend Testing Runtime through Command Center routing.');
    return lines.join('\n');
  }

  if (lower.includes('how would we test') || lower.includes('how would you test')) {
    lines.push(`Testing plan: ${plan.testingId} — ${plan.title}`);
    lines.push(`Test cases: ${plan.testCases.length}`);
    lines.push(`Evidence requirements: ${plan.evidenceRequirements.length}`);
    lines.push(`Simulated results: ${plan.simulatedResults.length}`);
    lines.push(`Code generation: ${plan.linkedGenerationId} (proposal-only)`);
    lines.push(`Build task: ${plan.linkedBuildTaskId} (blocked: ${plan.buildTaskPlan.blocked})`);
    lines.push(`Execution packet: ${plan.linkedExecutionId} (executionAllowed: false)`);
    lines.push('');
    lines.push('Simulation-only — no tests were run, no commands executed, no files modified.');
    lines.push('Approval/future testing gates are required before any governed test execution.');
  } else if (lower.includes('what tests are required') || lower.includes('what tests would')) {
    lines.push('Required test cases:');
    for (const c of plan.testCases) {
      lines.push(`• ${c.title}: ${c.description}`);
    }
  } else if (lower.includes('pass or fail') || lower.includes('pass fail criteria') || lower.includes('count as pass') || lower.includes('count as fail')) {
    lines.push('Pass criteria:');
    for (const p of plan.passCriteria.slice(0, 8)) {
      lines.push(`• ${p}`);
    }
    lines.push('');
    lines.push('Fail criteria:');
    for (const f of plan.failCriteria.slice(0, 8)) {
      lines.push(`• ${f}`);
    }
  } else if (lower.includes('what evidence') || lower.includes('test evidence') || lower.includes('validation evidence')) {
    lines.push('Evidence requirements:');
    for (const e of plan.evidenceRequirements) {
      lines.push(`• [${e.proofType}] ${e.requirement}`);
    }
  } else if (lower.includes('prove') || lower.includes('what would prove')) {
    lines.push('Proof requirements:');
    for (const e of plan.evidenceRequirements) {
      lines.push(`• ${e.requirement}`);
    }
    lines.push('');
    lines.push('Rollback considerations:');
    for (const r of plan.rollbackConsiderations.slice(0, 4)) {
      lines.push(`• ${r}`);
    }
  } else if (lower.includes('can testing run') || lower.includes('blocking testing') || lower.includes('what is blocking testing')) {
    lines.push('Can testing run now: No');
    lines.push(`State: ${plan.state}`);
    lines.push(`Blocked: ${plan.blocked}`);
    lines.push(`Readiness: ${plan.readiness}`);
    lines.push('Testing is simulation-only — no commands run, no test files written.');
  } else if (lower.includes('simulated failures') || lower.includes('simulated test result')) {
    const failures = simulatedFailureResults(plan.simulatedResults);
    lines.push(`Simulated failures: ${failures.length}`);
    for (const f of failures) {
      lines.push(`• [${f.status}] ${f.title}: ${f.summary}`);
    }
  } else if (lower.includes('risks')) {
    lines.push('Testing risks:');
    for (const r of plan.risks) {
      lines.push(`• [${r.level}] ${r.summary}`);
    }
  } else {
    lines.push(`Plan ${plan.testingId}: ${plan.title}`);
    lines.push(`State: ${plan.state} | Cases: ${plan.testCases.length}`);
    lines.push(`Evidence: ${plan.evidenceRequirements.length} | Simulated: ${plan.simulatedResults.length}`);
    lines.push(`Risks: ${plan.risks.length}`);
    lines.push(`Linked generation: ${plan.linkedGenerationId} | Build task: ${plan.linkedBuildTaskId} | Packet: ${plan.linkedExecutionId}`);
  }

  lines.push('');
  lines.push('Simulation-only — no test execution, no commands run, no files modified.');
  lines.push('All linked code generation remains proposal-only. Build task and execution remain blocked.');
  return lines.join('\n');
}

export function processTestingRuntimeRequest(query: string): TestingRuntimeResult {
  publishTestingRuntimeFeedStages(query);
  const request = parseTestingRequest(query);
  const plan = buildTestingPlan(query);
  updateTestingRuntimeDiagnostics(query, plan);

  return {
    query,
    request,
    plan,
    responseText: composeResponse(query, plan),
  };
}

export function getTestingRuntimeContext(query: string): {
  result: TestingRuntimeResult;
  diagnostics: TestingRuntimeDiagnostics;
  testingBlockers: string[];
  testingReadiness: string;
} {
  const result = processTestingRuntimeRequest(query);
  return {
    result,
    diagnostics: getTestingRuntimeDiagnostics(),
    testingBlockers: result.plan.blockers,
    testingReadiness: result.plan.readiness,
  };
}
