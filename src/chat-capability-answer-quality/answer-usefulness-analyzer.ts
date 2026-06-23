/**
 * Phase 26.92 — Answer usefulness analyzer (V1).
 */

import { GENERIC_AI_PATTERNS } from './chat-capability-answer-quality-registry.js';

export function analyzeAnswerUsefulness(answer: string): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 70;

  if (GENERIC_AI_PATTERNS.some((p) => p.test(answer))) {
    issues.push('Generic AI assistant wording detected');
    score -= 25;
  }

  if (/\b(next|start|try|run|review|ask|recommend|workflow|step)\b/i.test(answer)) {
    score += 15;
  }
  if (/\b(founder test|command center|validation|planning gate)\b/i.test(answer)) {
    score += 10;
  }
  if (answer.split(/\s+/).length >= 80) {
    score += 10;
  } else if (answer.split(/\s+/).length < 40) {
    issues.push('Answer too short to be useful');
    score -= 15;
  }

  return { score: Math.max(0, Math.min(100, score)), issues };
}
