/**
 * Runtime verification report builder — assembles full report across Phase 14 chain.
 */

import { buildAutoFixPlan } from '../auto-fix-runtime/auto-fix-plan-builder.js';
import { parseVerificationRequest } from './runtime-verification-request-parser.js';
import { buildVerificationEvidence } from './verification-evidence-builder.js';
import { analyzeVerificationGaps } from './verification-gap-analyzer.js';
import {
  calculateVerificationConfidence,
  calculateVerificationScore,
} from './verification-confidence-calculator.js';
import { analyzeVerificationTrust } from './verification-trust-analyzer.js';
import type {
  RuntimeVerificationReport,
  VerificationConfidence,
  VerificationState,
} from './runtime-verification-types.js';

let verificationCounter = 0;

function nextVerificationId(): string {
  verificationCounter += 1;
  return `vrfy-${verificationCounter.toString().padStart(4, '0')}`;
}

export function resetVerificationReportCounterForTests(): void {
  verificationCounter = 0;
}

function resolveVerificationState(
  blocked: boolean,
  score: number,
  criticalGaps: number,
): VerificationState {
  if (blocked) return 'BLOCKED';
  if (criticalGaps > 2) return 'PARTIALLY_VERIFIED';
  if (score >= 75 && criticalGaps === 0) return 'VERIFIED';
  if (score >= 50) return 'PARTIALLY_VERIFIED';
  return 'SIMULATION_ONLY';
}

function recommendedNextAction(gaps: { severity: string; summary: string }[], score: number): string {
  const critical = gaps.find((g) => g.severity === 'CRITICAL');
  if (critical) return `Address critical gap: ${critical.summary.slice(0, 80)}`;
  if (score < 60) return 'Extend validation scripts and resolve unsatisfied evidence before future runtime';
  return 'Proceed to founder approval gate — runtime chain structurally verified for Phase 14 advisory scope';
}

export function buildRuntimeVerificationReport(query: string): RuntimeVerificationReport {
  const request = parseVerificationRequest(query);
  const autoFixPlan = buildAutoFixPlan(query);
  const executionPacket = autoFixPlan.executionPacket;
  const buildTaskPlan = autoFixPlan.buildTaskPlan;
  const codeGenerationPlan = autoFixPlan.codeGenerationPlan;
  const testingPlan = autoFixPlan.testingPlan;

  executionPacket.readiness = {
    ...executionPacket.readiness,
    executionAllowed: false,
  };

  const evidence = buildVerificationEvidence(autoFixPlan);
  const gaps = analyzeVerificationGaps(autoFixPlan, evidence);
  const verificationScore = calculateVerificationScore(evidence, gaps);
  const criticalGaps = gaps.filter((g) => g.severity === 'CRITICAL').length;
  const trustAssessment = analyzeVerificationTrust(verificationScore, evidence, gaps);

  const blockers = [
    ...autoFixPlan.blockers,
    ...gaps.filter((g) => g.severity === 'CRITICAL' || g.severity === 'HIGH').map((g) => g.summary),
    'Phase 14.6 Runtime Verification Layer — verification only, no runtime actions',
    'No test execution, no fix application, no file modification',
    'Approval/future execution gates required before any governed runtime',
  ];

  const blocked =
    blockers.length > 0 ||
    autoFixPlan.blocked ||
    executionPacket.readiness.executionAllowed ||
    verificationScore < 100;

  const state = blocked ? 'BLOCKED' : resolveVerificationState(blocked, verificationScore, criticalGaps);
  const confidence: VerificationConfidence = calculateVerificationConfidence(
    verificationScore,
    gaps.length,
    criticalGaps,
  );
  const readinessLabel = `score: ${verificationScore} | trust: ${trustAssessment.trustLevel} | ${state}`;

  return {
    verificationId: nextVerificationId(),
    title: request.title,
    description: request.goal,
    sourceSystem: 'runtime_verification_layer',
    state,
    linkedExecutionId: executionPacket.executionId,
    linkedBuildTaskId: buildTaskPlan.taskId,
    linkedGenerationId: codeGenerationPlan.generationId,
    linkedTestingId: testingPlan.testingId,
    linkedFixId: autoFixPlan.fixId,
    executionPacket,
    buildTaskPlan,
    codeGenerationPlan,
    testingPlan,
    autoFixPlan,
    evidence,
    gaps,
    trustAssessment,
    verificationScore,
    confidence,
    blocked: blocked || state === 'BLOCKED',
    blockers,
    readiness: readinessLabel,
    recommendedNextAction: recommendedNextAction(gaps, verificationScore),
    verificationOnly: true,
  };
}
