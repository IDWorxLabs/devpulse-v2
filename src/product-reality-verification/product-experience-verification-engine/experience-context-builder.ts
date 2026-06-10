/**
 * Product Experience Verification Engine — experience context builder.
 */

import type { ExperienceContext, ExperienceContextType } from './product-experience-types.js';
import { EXPERIENCE_CONTEXT_PASS } from './product-experience-types.js';
import { getCachedExperienceContext, setCachedExperienceContext } from './product-experience-cache.js';

const CONTEXT_DEFINITIONS: Record<ExperienceContextType, Omit<ExperienceContext, 'passToken'>> = {
  FOUNDER_DAILY_USE: {
    contextType: 'FOUNDER_DAILY_USE',
    expectedGoals: ['Track project progress', 'Direct work through chat', 'Understand readiness and next actions'],
    expectedActions: ['Open chat', 'Review operator feed', 'Check UVL status', 'Accept or escalate work'],
    expectedTransitions: ['Chat → Operator Feed → Report → Next Action', 'Request → Analysis → Verification'],
    expectedTrustSignals: ['Honest completion state', 'Evidence visibility', 'Clear blocked reasons'],
    expectedIntelligenceVisibility: ['Recommendations', 'Reasoning', 'Detected risks', 'Next steps'],
    expectedSuccessOutcomes: ['Founder understands progress', 'Founder trusts recommendations', 'Clear next action'],
  },
  FIRST_TIME_USER: {
    contextType: 'FIRST_TIME_USER',
    expectedGoals: ['Understand what DevPulse is', 'Discover core capabilities', 'Complete first meaningful action'],
    expectedActions: ['Explore navigation', 'Send first chat message', 'Find verification surfaces'],
    expectedTransitions: ['Landing → Orientation → First Action → Feedback'],
    expectedTrustSignals: ['Product identity clarity', 'No false readiness claims', 'Guided discovery'],
    expectedIntelligenceVisibility: ['Visible AI command center identity', 'Clear intelligence output'],
    expectedSuccessOutcomes: ['User feels one coherent product', 'First action succeeds with guidance'],
  },
  VERIFICATION_WORKFLOW: {
    contextType: 'VERIFICATION_WORKFLOW',
    expectedGoals: ['Run verification', 'Trace evidence', 'Connect findings to reports'],
    expectedActions: ['Open UVL', 'Review Visual QA', 'Check UX heuristics', 'Validate preview'],
    expectedTransitions: ['Request → Verification → Evidence → Report → Next Action'],
    expectedTrustSignals: ['Verification continuity', 'No siloed results', 'Honest pass/fail'],
    expectedIntelligenceVisibility: ['Verification reasoning', 'Risk detection', 'Priority fixes'],
    expectedSuccessOutcomes: ['Verification chain feels connected', 'Report links to next action'],
  },
  PROJECT_BUILD_WORKFLOW: {
    contextType: 'PROJECT_BUILD_WORKFLOW',
    expectedGoals: ['Build project', 'Preview output', 'Verify before acceptance'],
    expectedActions: ['Initiate build', 'Open live preview', 'Review verification report'],
    expectedTransitions: ['Build → Preview → Verification → Acceptance'],
    expectedTrustSignals: ['Build completion honesty', 'Preview representativeness'],
    expectedIntelligenceVisibility: ['Build status intelligence', 'Risk warnings', 'Next steps'],
    expectedSuccessOutcomes: ['Build-to-preview-to-report flow is continuous'],
  },
  PRODUCT_REVIEW_WORKFLOW: {
    contextType: 'PRODUCT_REVIEW_WORKFLOW',
    expectedGoals: ['Review product quality holistically', 'Assess launch readiness'],
    expectedActions: ['Review reports', 'Check polish roadmap', 'Evaluate experience coherence'],
    expectedTransitions: ['Review → Gap Analysis → Roadmap → Priority Fix'],
    expectedTrustSignals: ['Consistent scoring', 'Evidence-backed assessments'],
    expectedIntelligenceVisibility: ['Cross-system intelligence', 'Unified authority output'],
    expectedSuccessOutcomes: ['Single product experience verdict', 'Actionable roadmap'],
  },
  MOBILE_USAGE_WORKFLOW: {
    contextType: 'MOBILE_USAGE_WORKFLOW',
    expectedGoals: ['Use DevPulse on mobile', 'Navigate and verify on small screens'],
    expectedActions: ['Open mobile nav', 'Use chat', 'Review notifications', 'Check responsive surfaces'],
    expectedTransitions: ['Mobile nav → Surface → Action → Feedback'],
    expectedTrustSignals: ['Mobile parity honesty', 'No desktop-only hidden state'],
    expectedIntelligenceVisibility: ['Readable intelligence on mobile', 'Visible recommendations'],
    expectedSuccessOutcomes: ['Mobile feels part of same product', 'No navigation context loss'],
  },
  DESKTOP_USAGE_WORKFLOW: {
    contextType: 'DESKTOP_USAGE_WORKFLOW',
    expectedGoals: ['Operate full command center', 'Use all verification surfaces'],
    expectedActions: ['Navigate World 2', 'Use chat and feed', 'Run UVL and preview'],
    expectedTransitions: ['Desktop nav → Multi-surface workflow → Report'],
    expectedTrustSignals: ['Desktop authority surfaces visible', 'Consistent product identity'],
    expectedIntelligenceVisibility: ['Full intelligence console', 'Operator feed continuity'],
    expectedSuccessOutcomes: ['Desktop experience anchors product coherence'],
  },
};

let contextBuildCount = 0;

export function buildExperienceContext(contextType: ExperienceContextType): ExperienceContext {
  const cacheKey = contextType;
  const cached = getCachedExperienceContext(cacheKey);
  if (cached) return cached;

  contextBuildCount += 1;
  const def = CONTEXT_DEFINITIONS[contextType];
  const context: ExperienceContext = { ...def, passToken: EXPERIENCE_CONTEXT_PASS };
  setCachedExperienceContext(cacheKey, context);
  return context;
}

export function listExperienceContextTypes(): readonly ExperienceContextType[] {
  return Object.keys(CONTEXT_DEFINITIONS) as ExperienceContextType[];
}

export function getContextBuildCount(): number {
  return contextBuildCount;
}

export function resetExperienceContextBuilderForTests(): void {
  contextBuildCount = 0;
}
