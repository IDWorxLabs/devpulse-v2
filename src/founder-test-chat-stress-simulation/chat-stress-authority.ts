/**
 * Phase 26.4 — Founder Test chat stress simulation authority.
 */

import { createHash } from 'node:crypto';
import type { LlmProvider } from '../llm-chat-brain/llm-provider-types.js';
import { evaluateChatStressRuns } from './chat-response-evaluator.js';
import { simulateChatStressBatch } from './chat-response-simulator.js';
import {
  buildChatStressSimulationReportMarkdown,
  buildRepeatedFailurePatterns,
  deriveRecommendedChatImprovements,
} from './chat-stress-report-builder.js';
import { listChatStressCategories, listChatStressScenarios } from './chat-stress-scenario-registry.js';
import type {
  ChatStressCategory,
  ChatStressSimulationAssessment,
  ChatStressSimulationReport,
  RunChatStressSimulationInput,
} from './chat-stress-simulation-types.js';
import { CHAT_STRESS_LAUNCH_BLOCK_THRESHOLD } from './chat-stress-simulation-types.js';

let runCounter = 0;

export function resetChatStressSimulationForTests(): void {
  runCounter = 0;
}

function nextRunId(): string {
  runCounter += 1;
  return `chat-stress-${runCounter}-${Date.now()}`;
}

function averageScore(scores: number[]): number {
  if (!scores.length) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function buildCategoryScores(
  evaluations: ReturnType<typeof evaluateChatStressRuns>,
): Record<ChatStressCategory, number> {
  const buckets = new Map<ChatStressCategory, number[]>();
  for (const category of listChatStressCategories()) {
    buckets.set(category, []);
  }
  for (const evaluation of evaluations) {
    buckets.get(evaluation.category)?.push(evaluation.score);
  }
  const out = {} as Record<ChatStressCategory, number>;
  for (const [category, scores] of buckets.entries()) {
    out[category] = averageScore(scores);
  }
  return out;
}

export async function runFounderTestChatStressSimulation(
  input: RunChatStressSimulationInput = {},
): Promise<ChatStressSimulationAssessment> {
  const scenarios = listChatStressScenarios(input.maxScenarios);
  const runs = await simulateChatStressBatch({
    scenarios,
    rootDir: input.rootDir,
    providerOverride: input.providerOverride,
    concurrency: input.concurrency ?? 4,
  });

  const evaluations = evaluateChatStressRuns({ scenarios, runs });
  const overallScore = averageScore(evaluations.map((entry) => entry.score));
  const passedCount = evaluations.filter((entry) => entry.passed).length;
  const failedCount = evaluations.filter((entry) => !entry.passed && !entry.weak).length;
  const weakCount = evaluations.filter((entry) => entry.weak).length;
  const sorted = [...evaluations].sort((a, b) => b.score - a.score);
  const missingCapabilities = [
    ...new Set(
      evaluations
        .filter((entry) => !entry.passed)
        .map((entry) => entry.missingCapability)
        .filter((entry): entry is string => Boolean(entry)),
    ),
  ];

  const repeatedFailurePatterns = buildRepeatedFailurePatterns(evaluations);
  const chatBlocksLaunchReadiness = overallScore < CHAT_STRESS_LAUNCH_BLOCK_THRESHOLD;
  const selfEvolutionRequired =
    chatBlocksLaunchReadiness ||
    missingCapabilities.some((entry) => /identity|weakness|honesty|tone/i.test(entry)) ||
    repeatedFailurePatterns.some((entry) => /legacy|identity|overclaim/i.test(entry.pattern));

  const report: ChatStressSimulationReport = {
    readOnly: true,
    advisoryOnly: true,
    runId: nextRunId(),
    generatedAt: new Date().toISOString(),
    totalScenarios: scenarios.length,
    passedCount,
    failedCount,
    weakCount,
    overallScore,
    chatBlocksLaunchReadiness,
    selfEvolutionRequired,
    strongestAnswers: sorted.slice(0, 5),
    worstAnswers: sorted.slice(-5).reverse(),
    weakAnswers: evaluations.filter((entry) => entry.weak),
    failedAnswers: evaluations.filter((entry) => !entry.passed && !entry.weak),
    repeatedFailurePatterns,
    missingCapabilities,
    recommendedNextChatImprovements: [],
    categoryScores: buildCategoryScores(evaluations),
    evaluations,
    scenarioRuns: runs,
  };

  report.recommendedNextChatImprovements = deriveRecommendedChatImprovements(report);

  return {
    readOnly: true,
    advisoryOnly: true,
    report,
  };
}

export function buildChatStressSimulationCacheKey(report: ChatStressSimulationReport): string {
  const digest = createHash('sha256')
    .update([report.runId, report.overallScore, report.totalScenarios].join('|'))
    .digest('hex')
    .slice(0, 12);
  return `chat-stress:${digest}`;
}

export function formatChatStressSimulationSummary(report: ChatStressSimulationReport): string {
  return (
    `Chat Stress Simulation: ${report.overallScore}/100 — ` +
    `${report.passedCount}/${report.totalScenarios} passed, ${report.failedCount} failed, ${report.weakCount} weak. ` +
    `Chat blocks launch readiness: ${report.chatBlocksLaunchReadiness ? 'YES' : 'NO'}.`
  );
}

export { buildChatStressSimulationReportMarkdown };
