/**
 * Recommendation Generator — evidence-based grouped recommendations (V1).
 */

import { CATEGORY_TO_RECOMMENDATION_GROUP } from './founder-test-automation-registry.js';
import type {
  ImprovementRecommendation,
  PrioritizedBlocker,
  RecommendationGroup,
} from './founder-test-automation-types.js';
import type { FounderTestRealitySweepReport } from '../founder-test-reality-sweep/founder-test-reality-sweep-types.js';
import type { RequirementCompletenessAnalysis } from '../requirement-completeness-intelligence/requirement-completeness-types.js';
import type { VisualReferenceAnalysis } from '../visual-reference-intelligence/visual-reference-types.js';
import type { VoiceNotesAnalysis } from '../voice-notes-intelligence/voice-notes-types.js';

let recommendationCounter = 0;

export function resetRecommendationGeneratorCounterForTests(): void {
  recommendationCounter = 0;
}

function nextRecommendationId(): string {
  recommendationCounter += 1;
  return `recommendation-${recommendationCounter}`;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function mapGroup(category: string, title: string): RecommendationGroup {
  const upper = `${category} ${title}`.toUpperCase();
  if (/STRIPE|PAYPAL|PAYMENT|BILLING|CHECKOUT/.test(upper)) return 'PAYMENTS';
  if (/OAUTH|AUTH|LOGIN|SIGNUP|ROLE/.test(upper)) return 'AUTHENTICATION';
  if (/INTEGRATION|API|STRIPE|SLACK/.test(upper)) return 'INTEGRATIONS';
  if (/ENTITY|DATA|MODEL/.test(upper)) return 'DATA';
  if (/ONBOARD|NAVIGATION|UX|FIRST.?TIME|UI/.test(upper)) return 'UX';
  if (/EXECUTION|VERIFICATION|ARCHITECTURE|PREVIEW/.test(upper)) return 'ARCHITECTURE';
  if (/FOUNDER|AI INTERACTION/.test(upper)) return 'FOUNDER_EXPERIENCE';
  if (/LAUNCH|COUNCIL|RISK/.test(upper)) return 'LAUNCH';
  return (CATEGORY_TO_RECOMMENDATION_GROUP[category] as RecommendationGroup) ?? 'PRODUCT';
}

export function generateImprovementRecommendations(input: {
  sweepReport: FounderTestRealitySweepReport;
  prioritizedBlockers: readonly PrioritizedBlocker[];
  requirementCompletenessAnalysis?: RequirementCompletenessAnalysis | null;
  visualReferenceAnalysis?: VisualReferenceAnalysis | null;
  voiceNotesAnalysis?: VoiceNotesAnalysis | null;
}): ImprovementRecommendation[] {
  const recommendations: ImprovementRecommendation[] = [];
  const seen = new Set<string>();

  const push = (
    group: RecommendationGroup,
    title: string,
    rationale: string,
    expectedImpact: string,
    confidence: number,
    relatedBlockerId: string | null,
    evidence: string[],
  ) => {
    const key = title.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    recommendations.push({
      readOnly: true,
      recommendationId: nextRecommendationId(),
      group,
      title,
      rationale,
      expectedImpact,
      confidence: clamp(confidence),
      relatedBlockerId,
      evidence,
    });
  };

  for (const blocker of input.prioritizedBlockers) {
    const group = mapGroup(blocker.category, blocker.title);
    push(
      group,
      `Resolve: ${blocker.title}`,
      blocker.explanation,
      `Reduces ${blocker.priority.toLowerCase()} launch blocker and improves ${group.toLowerCase()} readiness.`,
      blocker.confidence,
      blocker.blockerId,
      [...blocker.evidence],
    );
  }

  for (const work of input.sweepReport.mostImportantNextBuildItems.slice(0, 6)) {
    const group = mapGroup(work.category, work.action);
    push(
      group,
      work.action,
      work.founderImpact,
      `Addresses recommended launch work from ${work.sourceAuthority}.`,
      clamp(work.priorityScore),
      null,
      [work.workId, work.sourceAuthority],
    );
  }

  const completeness = input.requirementCompletenessAnalysis;
  if (completeness) {
    for (const question of completeness.clarifyingQuestions.filter((q) => q.priority === 'CRITICAL' || q.priority === 'HIGH').slice(0, 3)) {
      push(
        'PRODUCT',
        `Clarify requirement: ${question.category}`,
        question.question,
        'Improves requirement completeness before planning or execution.',
        completeness.confidenceScore,
        null,
        [...question.evidence, 'REQUIREMENT_COMPLETENESS'],
      );
    }
  }

  const visual = input.visualReferenceAnalysis;
  if (visual) {
    for (const gap of visual.completeness.navigationGaps.slice(0, 2)) {
      push(
        'UX',
        'Improve navigation clarity from visual reference',
        gap,
        'Aligns UI structure with inferred user flows before founder retest.',
        visual.confidenceScore,
        null,
        [gap, 'VISUAL_REFERENCE'],
      );
    }
    if (visual.completeness.visualCompletenessScore < 70) {
      push(
        'UX',
        'Upload additional visual references for incomplete flows',
        `Visual completeness score is ${visual.completeness.visualCompletenessScore}/100.`,
        'Strengthens UI evidence and reduces UX ambiguity.',
        visual.confidenceScore,
        null,
        ['VISUAL_COMPLETENESS_GAP'],
      );
    }
  }

  const voice = input.voiceNotesAnalysis;
  if (voice) {
    for (const question of voice.clarifyingQuestions.filter((q) => q.priority === 'HIGH').slice(0, 2)) {
      push(
        'PRODUCT',
        'Resolve voice note requirement gap',
        question.question,
        'Closes founder-stated requirement gaps before rebuild.',
        voice.projectUnderstanding.confidenceScore,
        null,
        [...question.evidence, 'VOICE_NOTES'],
      );
    }
  }

  if (/onboarding/i.test(input.prioritizedBlockers.map((b) => b.title + b.explanation).join(' '))) {
    push(
      'UX',
      'Create onboarding flow before founder testing again',
      'Onboarding gap detected across sweep and requirement evidence.',
      'Improves first-time user experience and founder test pass rate.',
      72,
      null,
      ['ONBOARDING_GAP'],
    );
  }

  return recommendations.slice(0, 20);
}
