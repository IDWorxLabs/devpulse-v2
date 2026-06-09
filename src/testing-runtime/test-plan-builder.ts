/**
 * Test plan builder — assembles full testing plan linked to code generation, build task, and execution packet.
 */

import { buildCodeGenerationPlan } from '../code-generation-runtime/code-generation-plan-builder.js';
import { parseTestingRequest } from './testing-request-parser.js';
import { buildTestCases, extractFailCriteria, extractPassCriteria } from './test-case-model.js';
import { buildEvidenceRequirements } from './test-evidence-model.js';
import { analyzeTestRisks } from './test-risk-analyzer.js';
import { buildSimulatedTestResults } from './simulated-test-result-model.js';
import type {
  TestingConfidence,
  TestingPlan,
  TestingState,
} from './testing-runtime-types.js';

let testingCounter = 0;

function nextTestingId(): string {
  testingCounter += 1;
  return `test-${testingCounter.toString().padStart(4, '0')}`;
}

export function resetTestingPlanCounterForTests(): void {
  testingCounter = 0;
}

function resolveTestingState(blocked: boolean, riskCount: number): TestingState {
  if (blocked) return 'BLOCKED';
  if (riskCount > 6) return 'WAITING_APPROVAL';
  return 'SIMULATION_ONLY';
}

function confidenceFromPlan(blocked: boolean, blockerCount: number, caseCount: number): TestingConfidence {
  if (blocked || blockerCount > 6) return 'LOW';
  if (caseCount >= 5 && blockerCount <= 4) return 'MEDIUM';
  return 'LOW';
}

export function buildTestingPlan(query: string): TestingPlan {
  const request = parseTestingRequest(query);
  const codeGenerationPlan = buildCodeGenerationPlan(query);
  const buildTaskPlan = codeGenerationPlan.buildTaskPlan;
  const executionPacket = codeGenerationPlan.executionPacket;

  executionPacket.readiness = {
    ...executionPacket.readiness,
    executionAllowed: false,
  };

  const testCases = buildTestCases(query);
  const evidenceRequirements = buildEvidenceRequirements(query);
  const risks = analyzeTestRisks(query);
  const simulatedResults = buildSimulatedTestResults(testCases, query);
  const passCriteria = extractPassCriteria(testCases);
  const failCriteria = extractFailCriteria(testCases);

  const blockers = [
    ...buildTaskPlan.blockers,
    ...codeGenerationPlan.blockers,
    ...risks.filter((r) => r.level === 'CRITICAL' || r.level === 'HIGH').map((r) => r.summary),
    'Phase 14.4 Testing Runtime — simulation only, no test execution',
    'No test files written — no npm, node, tsx, git, shell, or child_process',
    'Approval/future testing gates required before any governed test execution',
  ];

  const blocked =
    blockers.length > 0 ||
    buildTaskPlan.blocked ||
    codeGenerationPlan.blocked ||
    executionPacket.readiness.executionAllowed ||
    codeGenerationPlan.changeProposals.some((c) => c.applied);

  const state = blocked ? 'BLOCKED' : resolveTestingState(blocked, risks.length);
  const readinessLabel = `${buildTaskPlan.readiness} | cases: ${testCases.length} | ${state}`;

  const rollbackConsiderations = [
    'Revert proposed code generation artifacts if simulated tests fail in future phase',
    'Restore prior validation state before re-running foundation validators',
    'Reset diagnostics counters if testing plan linkage drifts',
    'Do not apply change proposals — all proposals remain applied: false',
  ];

  return {
    testingId: nextTestingId(),
    title: request.title,
    description: request.goal,
    goal: request.goal,
    sourceSystem: 'testing_runtime',
    state,
    linkedGenerationId: codeGenerationPlan.generationId,
    linkedBuildTaskId: buildTaskPlan.taskId,
    linkedExecutionId: executionPacket.executionId,
    codeGenerationPlan,
    buildTaskPlan,
    executionPacket,
    testCases,
    evidenceRequirements,
    simulatedResults,
    risks,
    passCriteria,
    failCriteria,
    readiness: readinessLabel,
    blocked: blocked || state === 'BLOCKED',
    blockers,
    confidence: confidenceFromPlan(blocked, blockers.length, testCases.length),
    rollbackConsiderations,
    planningOnly: true,
  };
}
