/**
 * Auto-fix plan builder — assembles full fix plan linked to failures, testing, and upstream runtimes.
 */

import { buildFailureRecords } from '../failure-visibility-engine/failure-record-builder.js';
import { buildTestingPlan } from '../testing-runtime/test-plan-builder.js';
import { parseFixRequest } from './fix-request-parser.js';
import { buildFixProposals } from './fix-proposal-builder.js';
import { analyzeFixAlternatives } from './fix-alternative-analyzer.js';
import { analyzeFixRisks } from './fix-risk-analyzer.js';
import { createFixRollbackPlan } from './fix-rollback-plan.js';
import { createFixVerificationPlan } from './fix-verification-plan.js';
import { buildSimulatedFixResults } from './simulated-fix-result-model.js';
import type {
  AutoFixConfidence,
  AutoFixPlan,
  AutoFixState,
} from './auto-fix-runtime-types.js';

let fixCounter = 0;

function nextFixId(): string {
  fixCounter += 1;
  return `fix-${fixCounter.toString().padStart(4, '0')}`;
}

export function resetAutoFixPlanCounterForTests(): void {
  fixCounter = 0;
}

function resolveAutoFixState(blocked: boolean, riskCount: number): AutoFixState {
  if (blocked) return 'BLOCKED';
  if (riskCount > 6) return 'WAITING_APPROVAL';
  return 'SIMULATION_ONLY';
}

function confidenceFromPlan(blocked: boolean, blockerCount: number, proposalCount: number): AutoFixConfidence {
  if (blocked || blockerCount > 6) return 'LOW';
  if (proposalCount >= 3 && blockerCount <= 4) return 'MEDIUM';
  return 'LOW';
}

export function buildAutoFixPlan(query: string): AutoFixPlan {
  const request = parseFixRequest(query);
  const testingPlan = buildTestingPlan(query);
  const codeGenerationPlan = testingPlan.codeGenerationPlan;
  const buildTaskPlan = testingPlan.buildTaskPlan;
  const executionPacket = testingPlan.executionPacket;

  executionPacket.readiness = {
    ...executionPacket.readiness,
    executionAllowed: false,
  };

  const failureRecords = buildFailureRecords(query);
  const linkedFailureIds = failureRecords.map((f) => f.failureId);
  const fixProposals = buildFixProposals(query, failureRecords);
  const alternatives = analyzeFixAlternatives(query);
  const risks = analyzeFixRisks(query);
  const rollbackPlan = createFixRollbackPlan(query);
  const verificationPlan = createFixVerificationPlan(query);
  const simulatedResults = buildSimulatedFixResults(fixProposals, query);

  const blockers = [
    ...testingPlan.blockers,
    ...risks.filter((r) => r.level === 'CRITICAL' || r.level === 'HIGH').map((r) => r.summary),
    'Phase 14.5 Auto-Fix Runtime — planning only, no fix application',
    'No files modified — all fix proposals have applied: false',
    'Failure visibility remains advisory — failures not auto-resolved',
    'Approval/future fixing gates required before any governed fix application',
  ];

  const blocked =
    blockers.length > 0 ||
    testingPlan.blocked ||
    buildTaskPlan.blocked ||
    codeGenerationPlan.blocked ||
    executionPacket.readiness.executionAllowed ||
    fixProposals.some((p) => p.applied);

  const state = blocked ? 'BLOCKED' : resolveAutoFixState(blocked, risks.length);
  const readinessLabel = `${testingPlan.readiness} | proposals: ${fixProposals.length} | ${state}`;

  return {
    fixId: nextFixId(),
    title: request.title,
    description: request.requestedOutcome,
    problemSummary: request.problemSummary,
    sourceSystem: 'auto_fix_runtime',
    state,
    linkedFailureIds,
    linkedTestingId: testingPlan.testingId,
    linkedGenerationId: codeGenerationPlan.generationId,
    linkedBuildTaskId: buildTaskPlan.taskId,
    linkedExecutionId: executionPacket.executionId,
    failureRecords,
    testingPlan,
    codeGenerationPlan,
    buildTaskPlan,
    executionPacket,
    fixProposals,
    alternatives,
    rollbackPlan,
    verificationPlan,
    simulatedResults,
    risks,
    readiness: readinessLabel,
    blocked: blocked || state === 'BLOCKED',
    blockers,
    confidence: confidenceFromPlan(blocked, blockers.length, fixProposals.length),
    planningOnly: true,
  };
}
