/**
 * Decision point engine — maps founder decision points. No execution.
 */

import type { DecisionPoint, ExperienceJourneyStage } from './types.js';
import { FOUNDER_QUESTIONS } from './types.js';
import { generateJourneyStages, getJourneyStageDescription } from './founder-journey-engine.js';
import { systemsForStage } from './system-sequence-engine.js';

export function decisionPointsKey(points: DecisionPoint[]): string {
  return points.map((p) => `${p.stage}:${p.decisionId}`).join('|');
}

export function generateDecisionPoints(stages: ExperienceJourneyStage[]): DecisionPoint[] {
  const decisionTemplates: Partial<Record<ExperienceJourneyStage, { question: string; required: boolean }>> = {
    IDEA_CAPTURE: { question: 'Proceed with this project idea in World 2?', required: true },
    PROJECT_PLANNING: { question: 'Approve project planning scope?', required: true },
    WORLD2_SIMULATION: { question: 'Continue after simulation review?', required: true },
    BUILD_PREPARATION: { question: 'Approve build preparation exposure?', required: false },
    VERIFICATION: { question: 'Approve verification-gated apply?', required: true },
    TRUST_REVIEW: { question: 'Accept trust review outcome?', required: false },
    MOBILE_MONITORING: { question: 'Approve mobile session decisions?', required: false },
    SELF_EVOLUTION_ANALYSIS: { question: 'Review self-evolution findings before continuing?', required: false },
    PROJECT_COMPLETION: { question: 'Founder sign-off for project completion?', required: true },
  };

  return stages
    .filter((stage) => decisionTemplates[stage])
    .map((stage, index) => {
      const template = decisionTemplates[stage]!;
      return {
        decisionId: `decision-${(index + 1).toString().padStart(2, '0')}`,
        stage,
        decisionQuestion: template.question,
        founderActionRequired: template.required,
        relatedSystems: systemsForStage(stage),
      };
    });
}

export function answerFounderQuestions(
  currentStage: ExperienceJourneyStage,
  systemSequence: string[],
): string[] {
  return [
    `How do I start? → Begin at FOUNDER_HOME, then PROJECT_ENTRY with your project idea.`,
    `What should I do next? → Current stage: ${currentStage}. ${getJourneyStageDescription(currentStage)}`,
    `What is DevPulse doing? → Exposing ${systemSequence.length} governed systems — experience mapping only, no execution.`,
    `What stage am I in? → ${currentStage}`,
    `What systems are involved? → ${systemSequence.slice(0, 5).join(', ')}${systemSequence.length > 5 ? '…' : ''}`,
    `What decision is required from me? → ${FOUNDER_QUESTIONS[5]!.replace('What decision is required from me?', 'See decision points for this stage.')}`,
  ];
}

export function countRequiredDecisions(points: DecisionPoint[]): number {
  return points.filter((p) => p.founderActionRequired).length;
}
