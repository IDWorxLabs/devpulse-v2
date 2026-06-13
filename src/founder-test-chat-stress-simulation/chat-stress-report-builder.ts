/**
 * Phase 26.4 — Chat stress simulation report builder.
 */

import type {
  ChatStressEvaluation,
  ChatStressFailurePattern,
  ChatStressSimulationReport,
} from './chat-stress-simulation-types.js';
import { CHAT_STRESS_LAUNCH_BLOCK_THRESHOLD } from './chat-stress-simulation-types.js';

function formatEvaluationDetail(evaluation: ChatStressEvaluation): string[] {
  return [
    `**Prompt:** ${evaluation.prompt}`,
    `**Actual answer:** ${evaluation.actualAnswer.slice(0, 500)}${evaluation.actualAnswer.length > 500 ? '…' : ''}`,
    `**Score:** ${evaluation.score}/100 (${evaluation.band})`,
    ...(evaluation.failureReasons.length
      ? [`**Failure reason:** ${evaluation.failureReasons.join('; ')}`]
      : []),
    ...(evaluation.missingCapability
      ? [`**Missing capability:** ${evaluation.missingCapability}`]
      : []),
    ...(evaluation.recommendedFix ? [`**Recommended fix:** ${evaluation.recommendedFix}`] : []),
    '',
  ];
}

export function buildRepeatedFailurePatterns(
  evaluations: ChatStressEvaluation[],
): ChatStressFailurePattern[] {
  const counts = new Map<string, { count: number; categories: Set<string>; example: ChatStressEvaluation }>();

  for (const evaluation of evaluations) {
    if (evaluation.passed) continue;
    for (const reason of evaluation.failureReasons) {
      const existing = counts.get(reason);
      if (existing) {
        existing.count += 1;
        existing.categories.add(evaluation.category);
        if (evaluation.score < existing.example.score) existing.example = evaluation;
      } else {
        counts.set(reason, {
          count: 1,
          categories: new Set([evaluation.category]),
          example: evaluation,
        });
      }
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([pattern, meta]) => ({
      readOnly: true,
      pattern,
      count: meta.count,
      categories: [...meta.categories] as ChatStressFailurePattern['categories'],
      examplePrompt: meta.example.prompt,
      recommendedFix: meta.example.recommendedFix ?? 'Improve chat grounding and founder-facing answer quality.',
    }));
}

export function buildChatStressSimulationReportMarkdown(report: ChatStressSimulationReport): string {
  const lines: string[] = [
    '## Chat Stress Simulation',
    '',
    'Broad chat intelligence stress test using the same Command Center Brain + LLM Chat Brain path as the live UI.',
    '',
    `Total scenarios: ${report.totalScenarios}`,
    `Passed: ${report.passedCount}`,
    `Failed: ${report.failedCount}`,
    `Weak answers: ${report.weakCount}`,
    `Overall chat score: **${report.overallScore}/100**`,
    `Chat blocks launch readiness: **${report.chatBlocksLaunchReadiness ? 'YES' : 'NO'}**`,
    `Self-evolution required: **${report.selfEvolutionRequired ? 'YES' : 'NO'}**`,
    '',
    '### Scoring bands',
    '',
    '- 90–100: Strong founder-facing chat',
    '- 80–89: Good, needs polish',
    '- 70–79: Usable but not launch-ready',
    '- Below 70: Chat blocks launch',
    '',
  ];

  if (report.strongestAnswers.length) {
    lines.push('### Strongest answers', '');
    for (const entry of report.strongestAnswers.slice(0, 3)) {
      lines.push(...formatEvaluationDetail(entry));
    }
  }

  if (report.worstAnswers.length) {
    lines.push('### Worst answers', '');
    for (const entry of report.worstAnswers.slice(0, 5)) {
      lines.push(...formatEvaluationDetail(entry));
    }
  }

  if (report.weakAnswers.length) {
    lines.push('### Weak answers', '');
    for (const entry of report.weakAnswers.slice(0, 8)) {
      lines.push(...formatEvaluationDetail(entry));
    }
  }

  if (report.failedAnswers.length) {
    lines.push('### Failed answers', '');
    for (const entry of report.failedAnswers.slice(0, 10)) {
      lines.push(...formatEvaluationDetail(entry));
    }
  }

  if (report.repeatedFailurePatterns.length) {
    lines.push('### Repeated failure patterns', '');
    for (const pattern of report.repeatedFailurePatterns) {
      lines.push(
        `- **${pattern.pattern}** (${pattern.count}×) — categories: ${pattern.categories.join(', ')} — example: "${pattern.examplePrompt}" — fix: ${pattern.recommendedFix}`,
      );
    }
    lines.push('');
  }

  if (report.missingCapabilities.length) {
    lines.push('### Missing capabilities', '', ...report.missingCapabilities.map((c) => `- ${c}`), '');
  }

  if (report.recommendedNextChatImprovements.length) {
    lines.push(
      '### Recommended next chat improvements',
      '',
      ...report.recommendedNextChatImprovements.map((c) => `- ${c}`),
      '',
    );
  }

  return lines.join('\n');
}

export function deriveRecommendedChatImprovements(
  report: Pick<
    ChatStressSimulationReport,
    'overallScore' | 'repeatedFailurePatterns' | 'missingCapabilities' | 'weakCount' | 'failedCount'
  >,
): string[] {
  const items: string[] = [];
  if (report.overallScore < CHAT_STRESS_LAUNCH_BLOCK_THRESHOLD) {
    items.push(`Raise overall chat score above ${CHAT_STRESS_LAUNCH_BLOCK_THRESHOLD} before launch readiness.`);
  }
  for (const pattern of report.repeatedFailurePatterns.slice(0, 4)) {
    items.push(`${pattern.pattern}: ${pattern.recommendedFix}`);
  }
  for (const capability of report.missingCapabilities.slice(0, 4)) {
    items.push(`Close gap: ${capability}`);
  }
  if (report.failedCount > 0) {
    items.push('Review failed prompts in Chat Stress Simulation and fix root causes, not just surface wording.');
  }
  if (report.weakCount > 5) {
    items.push('Polish weak answers — many are usable but not founder-ready.');
  }
  return [...new Set(items)].slice(0, 8);
}
