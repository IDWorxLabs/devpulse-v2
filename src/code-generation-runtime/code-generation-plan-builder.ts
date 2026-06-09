/**
 * Code generation plan builder — assembles full proposal linked to build task and execution packet.
 */

import { buildBuildTaskPlan } from '../build-task-runtime/build-task-plan-builder.js';
import { parseCodeGenerationRequest } from './code-generation-request-parser.js';
import { buildArtifactProposals } from './code-artifact-model.js';
import { buildChangeProposals, extractTargetFiles } from './code-change-proposal-builder.js';
import { selectGenerationStrategy, strategyDescription } from './code-generation-strategy.js';
import { analyzeCodeGenerationRisks } from './code-generation-risk-analyzer.js';
import { createCodeGenerationValidationPlan } from './code-generation-validation-plan.js';
import type {
  CodeGenerationConfidence,
  CodeGenerationPlan,
  CodeGenerationState,
} from './code-generation-runtime-types.js';

let generationCounter = 0;

function nextGenerationId(): string {
  generationCounter += 1;
  return `cgen-${generationCounter.toString().padStart(4, '0')}`;
}

export function resetCodeGenerationPlanCounterForTests(): void {
  generationCounter = 0;
}

function resolveGenerationState(blocked: boolean, riskCount: number): CodeGenerationState {
  if (blocked) return 'BLOCKED';
  if (riskCount > 5) return 'WAITING_APPROVAL';
  if (!blocked) return 'SIMULATION_ONLY';
  return 'PROPOSED';
}

function confidenceFromPlan(blocked: boolean, blockerCount: number, artifactCount: number): CodeGenerationConfidence {
  if (blocked || blockerCount > 6) return 'LOW';
  if (artifactCount >= 3 && blockerCount <= 4) return 'MEDIUM';
  return 'LOW';
}

export function buildCodeGenerationPlan(query: string): CodeGenerationPlan {
  const request = parseCodeGenerationRequest(query);
  const buildTaskPlan = buildBuildTaskPlan(query);
  const executionPacket = buildTaskPlan.executionPacket;

  executionPacket.readiness = {
    ...executionPacket.readiness,
    executionAllowed: false,
  };

  const artifactProposals = buildArtifactProposals(query);
  const changeProposals = buildChangeProposals(query);
  const targetFiles = extractTargetFiles(changeProposals);
  const strategy = selectGenerationStrategy(query);
  const risks = analyzeCodeGenerationRisks(query);
  const validationPlan = createCodeGenerationValidationPlan(query);

  const blockers = [
    ...buildTaskPlan.blockers,
    ...risks.filter((r) => r.level === 'CRITICAL' || r.level === 'HIGH').map((r) => r.summary),
    'Phase 14.3 Code Generation Runtime — proposal only, no real file writes',
    'No patches applied — all change proposals have applied: false',
  ];

  const blocked =
    blockers.length > 0 ||
    buildTaskPlan.blocked ||
    executionPacket.readiness.executionAllowed ||
    changeProposals.some((c) => c.applied);

  const state = blocked ? 'BLOCKED' : resolveGenerationState(blocked, risks.length);
  const readinessLabel = `${buildTaskPlan.readiness} | strategy: ${strategy} | ${state}`;

  return {
    generationId: nextGenerationId(),
    title: request.title,
    description: request.goal,
    sourceSystem: 'code_generation_runtime',
    requestedOutcome: request.requestedOutcome,
    state,
    targetFiles,
    artifactProposals,
    changeProposals,
    strategy,
    risks,
    validationPlan,
    buildTaskId: buildTaskPlan.taskId,
    buildTaskPlan,
    executionPacketId: executionPacket.executionId,
    executionPacket,
    readiness: readinessLabel,
    blocked: blocked || state === 'BLOCKED',
    blockers,
    confidence: confidenceFromPlan(blocked, blockers.length, artifactProposals.length),
    rollbackConsiderations: validationPlan.rollbackConsiderations,
    proposalOnly: true,
  };
}

export function strategyRationale(query: string): string {
  const strategy = selectGenerationStrategy(query);
  return strategyDescription(strategy);
}
