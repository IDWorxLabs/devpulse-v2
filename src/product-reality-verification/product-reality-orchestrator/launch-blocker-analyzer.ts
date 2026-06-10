/**
 * Product Reality Orchestrator — launch blocker analyzer.
 */

import type {
  BlockerAnalysisResult,
  ProductRealityInput,
  UpstreamReportBundle,
} from './product-reality-types.js';
import { BLOCKER_ANALYSIS_PASS } from './product-reality-types.js';
import { boundList, createLaunchBlocker } from './product-reality-model.js';
import { MAX_LAUNCH_BLOCKERS } from './product-reality-types.js';
import { getCachedBlockerAnalysis, setCachedBlockerAnalysis } from './product-reality-cache.js';

let blockerAnalysisCount = 0;

export function analyzeLaunchBlockers(
  requestId: string,
  reports: UpstreamReportBundle,
  input: ProductRealityInput,
): BlockerAnalysisResult {
  const cacheKey = [requestId, reports.productExperience.criticalExperienceRisks.length, input.workflowBroken].join('|');
  const cached = getCachedBlockerAnalysis(cacheKey);
  if (cached) return cached;

  blockerAnalysisCount += 1;
  const blockers = [];

  if (input.workflowBroken === true || reports.productExperience.workflowContinuityScore < 65) {
    blockers.push(createLaunchBlocker({
      blockerCode: 'WORKFLOW_CHAIN_BROKEN',
      blockerReason: 'Broken workflow chain between request, verification, preview, and report',
      blockerSeverity: 'CRITICAL',
      sourceSubsystem: 'Product Experience Verification Engine',
    }));
  }

  if (input.navigationDeadEnd === true || reports.uxHeuristics.navigationClarityScore < 60) {
    blockers.push(createLaunchBlocker({
      blockerCode: 'NAVIGATION_DEAD_END',
      blockerReason: 'Navigation dead ends prevent natural product traversal',
      blockerSeverity: 'MAJOR',
      sourceSubsystem: 'UX Heuristic Evaluator',
    }));
  }

  if (input.trustGap === true || reports.firstImpression.trustRisks.length > 2) {
    blockers.push(createLaunchBlocker({
      blockerCode: 'MISSING_TRUST_SIGNALS',
      blockerReason: 'Trust signals inconsistent or missing across product surfaces',
      blockerSeverity: 'MAJOR',
      sourceSubsystem: 'First-Impression Judge',
    }));
  }

  if (input.responsiveWeak === true || reports.responsiveReality.mobileScore < 60) {
    blockers.push(createLaunchBlocker({
      blockerCode: 'MAJOR_MOBILE_FAILURE',
      blockerReason: 'Major mobile experience failures undermine responsive product reality',
      blockerSeverity: 'CRITICAL',
      sourceSubsystem: 'Responsive Reality (derived)',
    }));
  }

  if (input.verificationSilo === true || reports.productExperience.verificationContinuityScore < 65) {
    blockers.push(createLaunchBlocker({
      blockerCode: 'VERIFICATION_CHAIN_GAP',
      blockerReason: 'Verification chain gaps between UVL, Visual QA, UX, Preview, and Polish',
      blockerSeverity: 'CRITICAL',
      sourceSubsystem: 'Product Experience Verification Engine',
    }));
  }

  if (input.experienceFragmented === true || reports.productExperience.productCoherenceScore < 65) {
    blockers.push(createLaunchBlocker({
      blockerCode: 'CRITICAL_FRAGMENTATION',
      blockerReason: 'Critical product fragmentation — systems feel disconnected',
      blockerSeverity: 'CRITICAL',
      sourceSubsystem: 'Product Experience Verification Engine',
    }));
  }

  if (reports.autoPolish.criticalOpportunities > 0) {
    blockers.push(createLaunchBlocker({
      blockerCode: 'POLISH_LAUNCH_BLOCKER',
      blockerReason: 'Critical polish blockers remain before production quality claim',
      blockerSeverity: 'MAJOR',
      sourceSubsystem: 'Auto-Polish Loop',
    }));
  }

  if (reports.livePreview.livePreviewResult === 'FAIL') {
    blockers.push(createLaunchBlocker({
      blockerCode: 'PREVIEW_READINESS_BLOCKER',
      blockerReason: 'Live preview verification fails — preview not launch-ready',
      blockerSeverity: 'MAJOR',
      sourceSubsystem: 'Live Preview Gatekeeper',
    }));
  }

  const bounded = boundList(blockers, MAX_LAUNCH_BLOCKERS);
  const result: BlockerAnalysisResult = {
    blockers: bounded,
    criticalBlockers: bounded.filter((b) => b.blockerSeverity === 'CRITICAL'),
    passToken: BLOCKER_ANALYSIS_PASS,
  };
  setCachedBlockerAnalysis(cacheKey, result);
  return result;
}

export function getBlockerAnalysisCount(): number {
  return blockerAnalysisCount;
}

export function resetLaunchBlockerAnalyzerForTests(): void {
  blockerAnalysisCount = 0;
}
