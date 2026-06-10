/**
 * Product Reality Orchestrator — founder priority analyzer.
 */

import type {
  BlockerAnalysisResult,
  FounderPriorityResult,
  UpstreamReportBundle,
} from './product-reality-types.js';
import { FOUNDER_PRIORITY_PASS } from './product-reality-types.js';
import { boundList, createFounderPriority } from './product-reality-model.js';
import { MAX_FOUNDER_PRIORITIES } from './product-reality-types.js';
import { getCachedFounderPriority, setCachedFounderPriority } from './product-reality-cache.js';

let founderPriorityCount = 0;

export function analyzeFounderPriorities(
  requestId: string,
  reports: UpstreamReportBundle,
  blockers: BlockerAnalysisResult,
): FounderPriorityResult {
  const cacheKey = [requestId, blockers.blockers.length, reports.autoPolish.criticalOpportunities].join('|');
  const cached = getCachedFounderPriority(cacheKey);
  if (cached) return cached;

  founderPriorityCount += 1;
  const priorities = [];

  for (const blocker of blockers.criticalBlockers) {
    priorities.push(createFounderPriority({
      title: `Resolve ${blocker.blockerCode}`,
      description: blocker.blockerReason,
      expectedImpact: 90,
      estimatedConfidenceGain: 85,
      estimatedProductGain: 80,
      sourceSubsystem: blocker.sourceSubsystem,
      tier: 'CRITICAL',
    }));
  }

  for (const fix of reports.productExperience.recommendedPriorityFixes.slice(0, 4)) {
    priorities.push(createFounderPriority({
      title: 'Experience continuity fix',
      description: fix,
      expectedImpact: 82,
      estimatedConfidenceGain: 75,
      estimatedProductGain: 78,
      sourceSubsystem: 'Product Experience Verification Engine',
      tier: 'HIGH',
    }));
  }

  for (const fix of reports.autoPolish.recommendedNextImprovements.slice(0, 3)) {
    priorities.push(createFounderPriority({
      title: 'Polish improvement',
      description: fix,
      expectedImpact: 70,
      estimatedConfidenceGain: 65,
      estimatedProductGain: 72,
      sourceSubsystem: 'Auto-Polish Loop',
      tier: 'MEDIUM',
    }));
  }

  for (const fix of reports.visualQa.recommendedPriorityFixes.slice(0, 2)) {
    priorities.push(createFounderPriority({
      title: 'Visual quality fix',
      description: fix,
      expectedImpact: 60,
      estimatedConfidenceGain: 55,
      estimatedProductGain: 58,
      sourceSubsystem: 'Visual QA Engine',
      tier: 'FUTURE',
    }));
  }

  if (reports.productExperience.launchReadinessScore < 75) {
    priorities.push(createFounderPriority({
      title: 'Launch readiness continuity',
      description: 'Improve launch readiness continuity across verification stack',
      expectedImpact: 88,
      estimatedConfidenceGain: 80,
      estimatedProductGain: 85,
      sourceSubsystem: 'Product Experience Verification Engine',
      tier: 'LAUNCH',
    }));
  }

  const sorted = [...priorities].sort((a, b) => b.expectedImpact - a.expectedImpact);
  const result: FounderPriorityResult = {
    priorities: boundList(sorted, MAX_FOUNDER_PRIORITIES),
    passToken: FOUNDER_PRIORITY_PASS,
  };
  setCachedFounderPriority(cacheKey, result);
  return result;
}

export function getFounderPriorityCount(): number {
  return founderPriorityCount;
}

export function resetFounderPriorityAnalyzerForTests(): void {
  founderPriorityCount = 0;
}
