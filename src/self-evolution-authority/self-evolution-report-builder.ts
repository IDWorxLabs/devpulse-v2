/**
 * Self-Evolution Authority Report Builder.
 */

import { SELF_EVOLUTION_REPORT_TITLE } from './self-evolution-bounds.js';
import type { SelfEvolutionAssessment, SelfEvolutionPatternCategory } from './self-evolution-types.js';

const CATEGORY_LABELS: Record<SelfEvolutionPatternCategory, string> = {
  CHAT_INTELLIGENCE: 'Chat Intelligence Evolution',
  TRUST: 'Trust Evolution',
  USER_SUCCESS: 'User Success Evolution',
  PROMISE_FULFILLMENT: 'Promise Fulfillment Evolution',
  GAP_DETECTION: 'Gap Detection Evolution',
  REPOSITORY_INTEGRITY: 'Repository Integrity Evolution',
  LAUNCH_READINESS: 'Launch Readiness Evolution',
  SELF_AWARENESS: 'Self-Awareness Evolution',
};

function formatPatterns(assessment: SelfEvolutionAssessment): string {
  if (!assessment.patterns.length) return '- None recorded.\n';
  return assessment.patterns
    .map(
      (pattern) =>
        `- **${CATEGORY_LABELS[pattern.category]}** [${pattern.status}] repeat=${pattern.repeatCount}\n` +
        `  Signal: ${pattern.failureSignal}\n` +
        `  Missing capability: ${pattern.missingCapability}\n` +
        `  Recommended evolution: ${pattern.recommendedEvolution}\n` +
        `  Evidence: ${pattern.evidence.join('; ') || 'None'}`,
    )
    .join('\n');
}

export function buildSelfEvolutionReportMarkdown(assessment: SelfEvolutionAssessment, generatedAt: number): string {
  const date = new Date(generatedAt).toISOString();
  const missingCapabilities = [
    ...new Set(assessment.patterns.map((pattern) => pattern.missingCapability)),
  ];
  const evidence = assessment.patterns.flatMap((pattern) => pattern.evidence).slice(0, 12);
  const verdict =
    assessment.readinessState === 'STABLE'
      ? 'No repeated failure evolution pressure detected — advisory only, not GO / NO GO.'
      : assessment.readinessState === 'MONITORING'
        ? 'Repeated failures are emerging and should be monitored before they become structural blockers.'
        : assessment.readinessState === 'EVOLUTION_REQUIRED'
          ? 'Repeated failures require capability evolution instead of isolated fixes.'
          : 'Blocked evolution patterns prevent safe repetition of the same fixes.';

  return `# ${SELF_EVOLUTION_REPORT_TITLE}

Generated: ${date}
Repeated-failure evolution analysis — evidence-backed and advisory only

## Self-Evolution Summary

Self-evolution score: **${assessment.selfEvolutionScore}/100**

Repeated failures: **${assessment.repeatedFailureCount}**

Required evolutions: **${assessment.evolutionRequiredCount}**

Blocked evolutions: **${assessment.blockedEvolutionCount}**

Readiness state: **${assessment.readinessState}**

Blocks launch readiness: **${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}**

Core question: **When this failure repeats, what capability should be created, improved, or connected next?**

## Repeated Failure Patterns

${formatPatterns(assessment)}

## Required Evolutions

${assessment.requiredEvolutions.length ? assessment.requiredEvolutions.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. No required evolutions recorded in this bounded pass.'}

## Missing Capabilities

${missingCapabilities.length ? missingCapabilities.map((item) => `- ${item}`).join('\n') : '- None recorded.'}

## Evidence

${evidence.length ? evidence.map((item) => `- ${item}`).join('\n') : '- None recorded.'}

## Recommendations

${assessment.recommendations.length ? assessment.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. If the same problem keeps appearing, identify what must evolve.'}

## Self-Evolution Verdict

${verdict}
`;
}
