/**
 * Founder Acceptance Framework — founder acceptance criteria registry.
 */

import type { AcceptanceCriterion, CriteriaGroup, CriteriaGroupId, CriteriaRegistry } from './founder-acceptance-types.js';
import { CRITERIA_REGISTRY_PASS, MAX_CRITERIA_PER_GROUP, clampWeight } from './founder-acceptance-types.js';
import { getCachedCriteriaRegistry, setCachedCriteriaRegistry } from './founder-acceptance-cache.js';

let criteriaCounter = 0;
let criteriaRegistryBuilds = 0;

function criterion(
  title: string,
  description: string,
  weight: number,
  dimension: AcceptanceCriterion['dimension'],
  groupId: AcceptanceCriterion['groupId'],
): AcceptanceCriterion {
  criteriaCounter += 1;
  return {
    criterionId: `acceptance-criterion-${criteriaCounter}`,
    title,
    description,
    weight: clampWeight(weight),
    dimension,
    groupId,
  };
}

const CRITERIA_GROUPS: CriteriaGroup[] = [
  {
    groupId: 'CLARITY_CRITERIA' as CriteriaGroupId,
    groupName: 'Clarity Criteria',
    criteria: [
      criterion('Progress clarity', 'Founder can see current project progress without ambiguity', 90, 'FOUNDER_CLARITY', 'CLARITY_CRITERIA'),
      criterion('Readiness clarity', 'Launch and verification readiness states are clearly communicated', 88, 'FOUNDER_CLARITY', 'CLARITY_CRITERIA'),
      criterion('Next action clarity', 'Founder always knows the recommended next action', 92, 'FOUNDER_CLARITY', 'CLARITY_CRITERIA'),
    ],
  },
  {
    groupId: 'CONFIDENCE_CRITERIA' as CriteriaGroupId,
    groupName: 'Confidence Criteria',
    criteria: [
      criterion('Recommendation confidence', 'Founder can trust AI recommendations with visible reasoning', 90, 'FOUNDER_CONFIDENCE', 'CONFIDENCE_CRITERIA'),
      criterion('Readiness confidence', 'Readiness claims are backed by evidence not optimism', 88, 'FOUNDER_CONFIDENCE', 'CONFIDENCE_CRITERIA'),
      criterion('Verification confidence', 'Verification outcomes inspire confidence in product state', 85, 'FOUNDER_CONFIDENCE', 'CONFIDENCE_CRITERIA'),
    ],
  },
  {
    groupId: 'TRUST_CRITERIA' as CriteriaGroupId,
    groupName: 'Trust Criteria',
    criteria: [
      criterion('Honest blocked states', 'Blocked or incomplete work is honestly surfaced', 95, 'FOUNDER_TRUST', 'TRUST_CRITERIA'),
      criterion('Evidence visibility', 'Verification evidence is traceable and visible', 90, 'FOUNDER_TRUST', 'TRUST_CRITERIA'),
      criterion('Consistent trust signals', 'Trust signals remain consistent across surfaces', 85, 'FOUNDER_TRUST', 'TRUST_CRITERIA'),
    ],
  },
  {
    groupId: 'PRODUCTIVITY_CRITERIA' as CriteriaGroupId,
    groupName: 'Productivity Criteria',
    criteria: [
      criterion('Chat productivity', 'Founder can direct work efficiently through chat', 88, 'FOUNDER_PRODUCTIVITY', 'PRODUCTIVITY_CRITERIA'),
      criterion('Workflow efficiency', 'Request-to-report workflow minimizes unnecessary steps', 85, 'FOUNDER_PRODUCTIVITY', 'PRODUCTIVITY_CRITERIA'),
      criterion('Low friction operations', 'Daily operations avoid unnecessary founder friction', 90, 'FOUNDER_PRODUCTIVITY', 'PRODUCTIVITY_CRITERIA'),
    ],
  },
  {
    groupId: 'CONTROL_CRITERIA' as CriteriaGroupId,
    groupName: 'Control Criteria',
    criteria: [
      criterion('Decision control', 'Founder retains accept, fix, and escalate control', 92, 'FOUNDER_CONTROL', 'CONTROL_CRITERIA'),
      criterion('Direction control', 'Founder can steer work through clear command surfaces', 88, 'FOUNDER_CONTROL', 'CONTROL_CRITERIA'),
      criterion('Escalation control', 'Escalation paths are visible and actionable', 85, 'FOUNDER_CONTROL', 'CONTROL_CRITERIA'),
    ],
  },
  {
    groupId: 'RELIABILITY_CRITERIA' as CriteriaGroupId,
    groupName: 'Reliability Criteria',
    criteria: [
      criterion('Consistent behavior', 'Product behaves predictably across sessions', 90, 'FOUNDER_RELIABILITY', 'RELIABILITY_CRITERIA'),
      criterion('State reliability', 'System state signals match actual product reality', 92, 'FOUNDER_RELIABILITY', 'RELIABILITY_CRITERIA'),
      criterion('Verification reliability', 'Verification outcomes remain stable and reproducible', 85, 'FOUNDER_RELIABILITY', 'RELIABILITY_CRITERIA'),
    ],
  },
  {
    groupId: 'UNDERSTANDING_CRITERIA' as CriteriaGroupId,
    groupName: 'Understanding Criteria',
    criteria: [
      criterion('Product purpose understanding', 'Founder understands what DevPulse is and does', 88, 'FOUNDER_UNDERSTANDING', 'UNDERSTANDING_CRITERIA'),
      criterion('Intelligence comprehension', 'Founder understands reasoning behind recommendations', 90, 'FOUNDER_UNDERSTANDING', 'UNDERSTANDING_CRITERIA'),
      criterion('Workflow comprehension', 'Founder understands verification and build workflows', 85, 'FOUNDER_UNDERSTANDING', 'UNDERSTANDING_CRITERIA'),
    ],
  },
  {
    groupId: 'CONTINUITY_CRITERIA' as CriteriaGroupId,
    groupName: 'Continuity Criteria',
    criteria: [
      criterion('Chat-to-feed continuity', 'Chat actions continue visibly into operator feed', 88, 'FOUNDER_CONTINUITY', 'CONTINUITY_CRITERIA'),
      criterion('Report-to-action continuity', 'Reports connect to clear next actions', 90, 'FOUNDER_CONTINUITY', 'CONTINUITY_CRITERIA'),
      criterion('Cross-surface continuity', 'No context loss between major product surfaces', 92, 'FOUNDER_CONTINUITY', 'CONTINUITY_CRITERIA'),
    ],
  },
  {
    groupId: 'VISIBILITY_CRITERIA' as CriteriaGroupId,
    groupName: 'Visibility Criteria',
    criteria: [
      criterion('Intelligence visibility', 'Recommendations and risks remain visible', 90, 'FOUNDER_VISIBILITY', 'VISIBILITY_CRITERIA'),
      criterion('Status visibility', 'System and verification status clearly visible', 88, 'FOUNDER_VISIBILITY', 'VISIBILITY_CRITERIA'),
      criterion('Operator feed visibility', 'Operator feed provides continuous intelligence stream', 85, 'FOUNDER_VISIBILITY', 'VISIBILITY_CRITERIA'),
    ],
  },
].map((g) => ({ ...g, criteria: g.criteria.slice(0, MAX_CRITERIA_PER_GROUP) }));

export function buildCriteriaRegistry(requestId: string): CriteriaRegistry {
  const cacheKey = `criteria-${requestId}`;
  const cached = getCachedCriteriaRegistry(cacheKey);
  if (cached) return cached;

  criteriaRegistryBuilds += 1;
  const totalCriteria = CRITERIA_GROUPS.reduce((sum, g) => sum + g.criteria.length, 0);
  const result: CriteriaRegistry = {
    groups: CRITERIA_GROUPS.map((g) => ({ ...g, criteria: [...g.criteria] })),
    totalCriteria,
    passToken: CRITERIA_REGISTRY_PASS,
  };
  setCachedCriteriaRegistry(cacheKey, result);
  return result;
}

export function getCriteriaRegistryBuilds(): number {
  return criteriaRegistryBuilds;
}

export function resetFounderAcceptanceCriteriaRegistryForTests(): void {
  criteriaCounter = 0;
  criteriaRegistryBuilds = 0;
}
