/**
 * Founder Acceptance Orchestrator — acceptance blocker analyzer.
 */

import type {
  FounderAcceptanceOrchestratorInput,
  AcceptanceBlocker,
  AcceptanceBlockerAnalysis,
} from './founder-acceptance-orchestrator-types.js';
import { ACCEPTANCE_BLOCKER_PASS } from './founder-acceptance-orchestrator-types.js';
import { getCachedAcceptanceBlockerAnalysis, setCachedAcceptanceBlockerAnalysis } from './founder-acceptance-cache.js';

export interface AcceptanceBlockerUpstream {
  launchBlockerCount: number;
  releaseReadiness: string;
  readinessCriticalBlockers: number;
  frictionCriticalGaps: number;
  trustCriticalGaps: number;
}

let analyzeCount = 0;
let blockerCounter = 0;

function createBlocker(params: {
  title: string;
  description: string;
  severity: AcceptanceBlocker['severity'];
  blockerCode: string;
}): AcceptanceBlocker {
  blockerCounter += 1;
  return {
    blockerId: `acceptance-blocker-${blockerCounter}`,
    title: params.title,
    description: params.description,
    severity: params.severity,
    blockerCode: params.blockerCode,
    sourceAnalyzer: 'acceptance-blocker-analyzer',
  };
}

export function analyzeAcceptanceBlockers(
  requestId: string,
  input: FounderAcceptanceOrchestratorInput,
  upstream: AcceptanceBlockerUpstream,
): AcceptanceBlockerAnalysis {
  const cacheKey = [requestId, upstream.launchBlockerCount, input.adoptionBlocked].join('|');
  const cached = getCachedAcceptanceBlockerAnalysis(cacheKey);
  if (cached) return cached;

  analyzeCount += 1;
  const blockers: AcceptanceBlocker[] = [];

  if (input.adoptionBlocked === true) {
    blockers.push(createBlocker({
      title: 'Founder adoption blocker',
      description: 'Adoption barriers prevent founder from accepting DevPulse',
      severity: 'CRITICAL',
      blockerCode: 'ACCEPTANCE_BLOCKERS',
    }));
  }

  if (upstream.readinessCriticalBlockers > 0 || input.readinessLow === true) {
    blockers.push(createBlocker({
      title: 'Readiness blocker prevents acceptance',
      description: 'Founder readiness gaps block genuine acceptance',
      severity: 'CRITICAL',
      blockerCode: 'READINESS_BLOCKER',
    }));
  }

  if (input.launchBlocked === true || upstream.launchBlockerCount > 0) {
    blockers.push(createBlocker({
      title: 'Launch blocker prevents acceptance',
      description: 'Launch or release blockers prevent founder launch acceptance',
      severity: upstream.releaseReadiness === 'NOT_READY' ? 'CRITICAL' : 'MAJOR',
      blockerCode: 'LAUNCH_BLOCKER',
    }));
  }

  if (upstream.trustCriticalGaps > 0 || input.trustWeak === true) {
    blockers.push(createBlocker({
      title: 'Trust blocker undermines acceptance',
      description: 'Trust failures prevent founder from genuinely accepting DevPulse',
      severity: 'CRITICAL',
      blockerCode: 'TRUST_BLOCKER',
    }));
  }

  if (upstream.frictionCriticalGaps > 0 || input.frictionExcessive === true) {
    blockers.push(createBlocker({
      title: 'Friction blocker degrades acceptance',
      description: 'Excessive friction prevents founder from accepting daily use',
      severity: 'MAJOR',
      blockerCode: 'FRICTION_BLOCKER',
    }));
  }

  if (input.governanceBlocked === true) {
    blockers.push(createBlocker({
      title: 'Governance blocks founder acceptance',
      description: 'Governance restrictions prevent founder acceptance',
      severity: 'CRITICAL',
      blockerCode: 'GOVERNANCE_BLOCKER',
    }));
  }

  const bounded = blockers.slice(0, 16);
  const result: AcceptanceBlockerAnalysis = {
    blockers: bounded,
    criticalAcceptanceBlockers: bounded.filter((b) => b.severity === 'CRITICAL'),
    majorAcceptanceBlockers: bounded.filter((b) => b.severity === 'MAJOR'),
    passToken: ACCEPTANCE_BLOCKER_PASS,
  };
  setCachedAcceptanceBlockerAnalysis(cacheKey, result);
  return result;
}

export function getAcceptanceBlockerAnalyzeCount(): number {
  return analyzeCount;
}

export function resetAcceptanceBlockerAnalyzerForTests(): void {
  analyzeCount = 0;
  blockerCounter = 0;
}
