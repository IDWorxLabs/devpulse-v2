/**
 * Founder Readiness Authority — readiness blocker analyzer.
 */

import type {
  FounderReadinessAuthorityInput,
  ReadinessBlocker,
  ReadinessBlockerAnalysis,
  WorkflowReadinessAnalysis,
  ConfidenceReadinessAnalysis,
  TrustReadinessAnalysis,
  ProductivityReadinessAnalysis,
  FrictionReadinessAnalysis,
} from './founder-readiness-types.js';
import { READINESS_BLOCKERS_PASS } from './founder-readiness-types.js';
import { getCachedReadinessBlockerAnalysis, setCachedReadinessBlockerAnalysis } from './founder-readiness-cache.js';

export interface ReadinessBlockerUpstream {
  launchBlockerCount: number;
  releaseReadiness: string;
  operationalSurfaceReady: boolean;
  adoptionBlockerCount: number;
}

let analyzeCount = 0;
let blockerCounter = 0;

function createBlocker(params: {
  title: string;
  description: string;
  severity: ReadinessBlocker['severity'];
  blockerCode: string;
  sourceAnalyzer: string;
}): ReadinessBlocker {
  blockerCounter += 1;
  return {
    blockerId: `readiness-blocker-${blockerCounter}`,
    title: params.title,
    description: params.description,
    severity: params.severity,
    blockerCode: params.blockerCode,
    sourceAnalyzer: params.sourceAnalyzer,
  };
}

export function analyzeReadinessBlockers(
  requestId: string,
  input: FounderReadinessAuthorityInput,
  analyzers: {
    workflowReadiness: WorkflowReadinessAnalysis;
    confidenceReadiness: ConfidenceReadinessAnalysis;
    trustReadiness: TrustReadinessAnalysis;
    productivityReadiness: ProductivityReadinessAnalysis;
    frictionReadiness: FrictionReadinessAnalysis;
  },
  upstream: ReadinessBlockerUpstream,
): ReadinessBlockerAnalysis {
  const cacheKey = [
    requestId,
    analyzers.workflowReadiness.score,
    upstream.launchBlockerCount,
    input.launchNotReady,
  ].join('|');
  const cached = getCachedReadinessBlockerAnalysis(cacheKey);
  if (cached) return cached;

  analyzeCount += 1;
  const blockers: ReadinessBlocker[] = [];

  for (const gap of analyzers.workflowReadiness.gaps.filter((g) => g.severity === 'CRITICAL')) {
    blockers.push(createBlocker({
      title: gap.title,
      description: gap.description,
      severity: 'CRITICAL',
      blockerCode: 'WORKFLOW_READINESS_BLOCKER',
      sourceAnalyzer: 'readiness-blocker-analyzer',
    }));
  }
  for (const gap of analyzers.confidenceReadiness.gaps.filter((g) => g.severity === 'CRITICAL')) {
    blockers.push(createBlocker({
      title: gap.title,
      description: gap.description,
      severity: 'CRITICAL',
      blockerCode: 'CONFIDENCE_READINESS_BLOCKER',
      sourceAnalyzer: 'readiness-blocker-analyzer',
    }));
  }
  for (const gap of analyzers.trustReadiness.gaps.filter((g) => g.severity === 'CRITICAL')) {
    blockers.push(createBlocker({
      title: gap.title,
      description: gap.description,
      severity: 'CRITICAL',
      blockerCode: 'TRUST_READINESS_BLOCKER',
      sourceAnalyzer: 'readiness-blocker-analyzer',
    }));
  }
  for (const gap of analyzers.frictionReadiness.gaps.filter((g) => g.severity === 'CRITICAL')) {
    blockers.push(createBlocker({
      title: gap.title,
      description: gap.description,
      severity: 'CRITICAL',
      blockerCode: 'FRICTION_READINESS_BLOCKER',
      sourceAnalyzer: 'readiness-blocker-analyzer',
    }));
  }

  if (input.launchNotReady === true || upstream.launchBlockerCount > 0) {
    blockers.push(createBlocker({
      title: 'Launch readiness blocker detected',
      description: 'Launch or release blockers prevent founder launch readiness',
      severity: upstream.releaseReadiness === 'NOT_READY' ? 'CRITICAL' : 'MAJOR',
      blockerCode: 'LAUNCH_READINESS_BLOCKER',
      sourceAnalyzer: 'readiness-blocker-analyzer',
    }));
  }

  if (input.operationalGaps === true || !upstream.operationalSurfaceReady) {
    blockers.push(createBlocker({
      title: 'Operational readiness blocker',
      description: 'Operational surface gaps block founder daily use',
      severity: 'MAJOR',
      blockerCode: 'OPERATIONAL_READINESS_BLOCKER',
      sourceAnalyzer: 'readiness-blocker-analyzer',
    }));
  }

  if (upstream.adoptionBlockerCount > 0) {
    blockers.push(createBlocker({
      title: 'Founder adoption blocker',
      description: 'Adoption barriers prevent founder from operating DevPulse effectively',
      severity: 'MAJOR',
      blockerCode: 'ADOPTION_BLOCKER',
      sourceAnalyzer: 'readiness-blocker-analyzer',
    }));
  }

  if (input.governanceBlocked === true) {
    blockers.push(createBlocker({
      title: 'Governance blocks founder readiness',
      description: 'Governance restrictions prevent founder from operating effectively',
      severity: 'CRITICAL',
      blockerCode: 'GOVERNANCE_BLOCKER',
      sourceAnalyzer: 'readiness-blocker-analyzer',
    }));
  }

  const bounded = blockers.slice(0, 16);
  const result: ReadinessBlockerAnalysis = {
    blockers: bounded,
    criticalReadinessBlockers: bounded.filter((b) => b.severity === 'CRITICAL'),
    majorReadinessBlockers: bounded.filter((b) => b.severity === 'MAJOR'),
    passToken: READINESS_BLOCKERS_PASS,
  };
  setCachedReadinessBlockerAnalysis(cacheKey, result);
  return result;
}

export function getBlockerAnalyzeCount(): number {
  return analyzeCount;
}

export function resetReadinessBlockerAnalyzerForTests(): void {
  analyzeCount = 0;
  blockerCounter = 0;
}
