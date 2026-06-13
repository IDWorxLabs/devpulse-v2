/**
 * Improvement Path Builder — ordered founder action path (V1).
 */

import type {
  ImprovementPathStep,
  ImprovementRecommendation,
  PrioritizedBlocker,
} from './founder-test-automation-types.js';
import type { FounderTestRealitySweepReport } from '../founder-test-reality-sweep/founder-test-reality-sweep-types.js';

const AUTH_KEYWORDS = /auth|login|signup|oauth/i;
const ONBOARDING_KEYWORDS = /onboarding|first.?time/i;
const NAV_KEYWORDS = /navigation|nav|ui/i;

export function buildImprovementPath(input: {
  sweepReport: FounderTestRealitySweepReport;
  prioritizedBlockers: readonly PrioritizedBlocker[];
  recommendations: readonly ImprovementRecommendation[];
}): ImprovementPathStep[] {
  const steps: ImprovementPathStep[] = [];
  const seen = new Set<string>();

  const addStep = (
    action: string,
    rationale: string,
    priority: PrioritizedBlocker['priority'],
    relatedBlockerId: string | null,
    evidence: string[],
  ) => {
    const key = action.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    steps.push({
      readOnly: true,
      stepNumber: steps.length + 1,
      action,
      rationale,
      priority,
      relatedBlockerId,
      evidence,
    });
  };

  const authBlocker = input.prioritizedBlockers.find(
    (b) => AUTH_KEYWORDS.test(`${b.title} ${b.explanation}`),
  );
  if (authBlocker) {
    addStep(
      'Resolve authentication gap',
      authBlocker.explanation,
      authBlocker.priority,
      authBlocker.blockerId,
      authBlocker.evidence,
    );
  }

  const onboardingBlocker = input.prioritizedBlockers.find(
    (b) => ONBOARDING_KEYWORDS.test(`${b.title} ${b.explanation}`),
  );
  const onboardingRec = input.recommendations.find((r) => /onboarding/i.test(r.title));
  if (onboardingBlocker || onboardingRec) {
    addStep(
      'Resolve onboarding gap',
      onboardingBlocker?.explanation ?? onboardingRec?.rationale ?? 'Onboarding evidence is incomplete.',
      onboardingBlocker?.priority ?? 'HIGH',
      onboardingBlocker?.blockerId ?? onboardingRec?.relatedBlockerId ?? null,
      onboardingBlocker?.evidence ?? onboardingRec?.evidence ?? ['ONBOARDING_GAP'],
    );
  }

  const navBlocker = input.prioritizedBlockers.find(
    (b) => NAV_KEYWORDS.test(`${b.title} ${b.explanation}`) && b.category.includes('NAVIGATION'),
  );
  if (navBlocker) {
    addStep(
      'Improve navigation clarity',
      navBlocker.explanation,
      navBlocker.priority,
      navBlocker.blockerId,
      navBlocker.evidence,
    );
  }

  for (const blocker of input.prioritizedBlockers) {
    if (steps.some((s) => s.relatedBlockerId === blocker.blockerId)) continue;
    addStep(
      `Address: ${blocker.title}`,
      blocker.explanation,
      blocker.priority,
      blocker.blockerId,
      blocker.evidence,
    );
    if (steps.length >= 8) break;
  }

  for (const work of input.sweepReport.mostImportantNextBuildItems) {
    if (steps.length >= 10) break;
    addStep(work.action, work.founderImpact, 'MEDIUM', null, [work.workId, work.sourceAuthority]);
  }

  addStep(
    'Re-run founder testing',
    `Validate fixes against reality sweep baseline (${input.sweepReport.sweepId}).`,
    'MEDIUM',
    null,
    ['FOUNDER_RETEST', input.sweepReport.sweepId],
  );

  return steps.map((step, index) => ({ ...step, stepNumber: index + 1 }));
}
