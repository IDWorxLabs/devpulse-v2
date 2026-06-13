/**
 * Launch Blocker Prioritizer — ranks sweep blockers with impact evidence (V1).
 */

import { PRIORITY_IMPACT_WEIGHTS } from './founder-test-automation-registry.js';
import type {
  BlockerPriority,
  PrioritizedBlocker,
} from './founder-test-automation-types.js';
import type {
  LaunchBlockerEntry,
  FounderTestRealitySweepReport,
} from '../founder-test-reality-sweep/founder-test-reality-sweep-types.js';
import type { RequirementCompletenessAnalysis } from '../requirement-completeness-intelligence/requirement-completeness-types.js';

function completenessGapsForBlockers(completeness: RequirementCompletenessAnalysis): readonly {
  gapId: string;
  description: string;
  severity: BlockerPriority;
  domain: string;
}[] {
  const missing = completeness.missingRequirements as unknown;
  if (Array.isArray(missing)) {
    return missing.map((gap) => ({
      gapId: gap.gapId,
      description: gap.description,
      severity: mapSeverity(gap.severity),
      domain: gap.domain,
    }));
  }
  const legacy = missing as {
    missingScreens?: readonly string[];
    missingFlows?: readonly string[];
  };
  const gaps: { gapId: string; description: string; severity: BlockerPriority; domain: string }[] = [];
  for (const screen of legacy.missingScreens ?? []) {
    gaps.push({ gapId: `screen-${screen}`, description: screen, severity: 'HIGH', domain: 'UI_REQUIREMENTS' });
  }
  for (const flow of legacy.missingFlows ?? []) {
    gaps.push({ gapId: `flow-${flow}`, description: flow, severity: 'HIGH', domain: 'UI_REQUIREMENTS' });
  }
  return gaps;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function mapSeverity(severity: string): BlockerPriority {
  if (severity === 'CRITICAL') return 'CRITICAL';
  if (severity === 'HIGH') return 'HIGH';
  if (severity === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
}

function categoryUserImpact(category: string): number {
  if (category.includes('FIRST_TIME') || category.includes('NAVIGATION')) return 90;
  if (category.includes('FOUNDER')) return 75;
  if (category.includes('PREVIEW')) return 70;
  return 55;
}

export function prioritizeLaunchBlockers(input: {
  sweepReport: FounderTestRealitySweepReport;
  requirementCompletenessAnalysis?: RequirementCompletenessAnalysis | null;
}): PrioritizedBlocker[] {
  const blockers: PrioritizedBlocker[] = [];
  const allBlockers = [
    ...input.sweepReport.topBlockers,
    ...input.sweepReport.launchBlockers.filter(
      (b) => !input.sweepReport.topBlockers.some((t) => t.blockerId === b.blockerId),
    ),
  ];

  for (const blocker of allBlockers) {
    const priority = mapSeverity(blocker.severity);
    const weights = PRIORITY_IMPACT_WEIGHTS[priority];
    blockers.push({
      readOnly: true,
      blockerId: blocker.blockerId,
      title: blocker.title,
      priority,
      category: blocker.category,
      launchImpact: clamp(weights.launch + (blocker.impactRank <= 1 ? 5 : 0)),
      userImpact: clamp(categoryUserImpact(blocker.category)),
      founderImpact: clamp(weights.founder),
      confidence: clamp(70 + (blocker.severity === 'CRITICAL' ? 15 : blocker.severity === 'HIGH' ? 10 : 5)),
      explanation: blocker.explanation,
      sourceAuthority: blocker.sourceAuthority,
      evidence: [blocker.blockerId, blocker.sourceAuthority, `SEVERITY_${blocker.severity}`],
    });
  }

  for (const capability of input.sweepReport.topMissingCapabilities.slice(0, 4)) {
    blockers.push({
      readOnly: true,
      blockerId: capability.capabilityId,
      title: `Missing capability: ${capability.capability}`,
      priority: mapSeverity(capability.launchImpact),
      category: capability.category,
      launchImpact: clamp(PRIORITY_IMPACT_WEIGHTS[mapSeverity(capability.launchImpact)].launch),
      userImpact: 65,
      founderImpact: 70,
      confidence: 68,
      explanation: `Missing capability detected: ${capability.capability}`,
      sourceAuthority: capability.sourceAuthority,
      evidence: [capability.capabilityId, 'MISSING_CAPABILITY'],
    });
  }

  const completeness = input.requirementCompletenessAnalysis;
  if (
    completeness &&
    (completeness.projectRequirementReadiness === 'NOT_READY' || completeness.completenessScore < 45)
  ) {
    for (const gap of completenessGapsForBlockers(completeness).slice(0, 4)) {
      blockers.push({
        readOnly: true,
        blockerId: gap.gapId,
        title: `Requirement gap: ${gap.domain}`,
        priority: gap.severity,
        category: 'MISSING_CAPABILITY_REALITY',
        launchImpact: gap.severity === 'CRITICAL' ? 85 : 72,
        userImpact: 80,
        founderImpact: 68,
        confidence: completeness.confidenceScore,
        explanation: gap.description,
        sourceAuthority: 'requirement-completeness-intelligence',
        evidence: [gap.gapId, gap.domain],
      });
    }
  }

  const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return blockers
    .sort((a, b) => order[a.priority] - order[b.priority] || b.launchImpact - a.launchImpact)
    .slice(0, 16);
}

export function extractBlockersFromSweep(
  blockers: readonly LaunchBlockerEntry[],
): LaunchBlockerEntry[] {
  return [...blockers];
}
