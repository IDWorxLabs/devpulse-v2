/**
 * Launch Readiness Authority consolidation bridge — Phase Next V1.
 * AFLA is the canonical owner of launch decision, verdict, confidence, and readiness state.
 */

import {
  getLastAutonomousFounderLaunchAssessment,
  type AutonomousFounderLaunchAssessment,
} from '../autonomous-founder-launch-authority/index.js';
import type {
  LaunchReadinessRecommendation,
  LaunchReadinessState,
} from './launch-readiness-types.js';

export const LAUNCH_READINESS_AUTHORITATIVE_OWNER = 'Autonomous Founder Launch Authority';
export const LAUNCH_READINESS_CONSOLIDATION_STATUS = 'MERGED' as const;

export interface LaunchReadinessConsolidationSnapshot {
  readOnly: true;
  authoritativeOwner: typeof LAUNCH_READINESS_AUTHORITATIVE_OWNER;
  consolidationStatus: typeof LAUNCH_READINESS_CONSOLIDATION_STATUS;
  noDuplicateLaunchVerdictGeneration: true;
  noDuplicateLaunchScoring: true;
  delegatedFrom: 'Launch Readiness Authority';
  aflaAssessment: AutonomousFounderLaunchAssessment | null;
}

function mapAflaVerdictToRecommendation(
  assessment: AutonomousFounderLaunchAssessment,
): LaunchReadinessRecommendation {
  switch (assessment.verdict) {
    case 'LAUNCH_READY':
      return 'READY_FOR_PUBLIC_LAUNCH';
    case 'LAUNCH_READY_WITH_WARNINGS':
      return 'READY_FOR_PUBLIC_BETA';
    case 'NEEDS_AUTOFIX':
      return 'READY_FOR_PRIVATE_BETA';
    case 'NEEDS_HUMAN_REVIEW':
      return 'READY_FOR_INTERNAL_USE';
    case 'NOT_LAUNCH_READY':
    default:
      return 'NOT_READY_FOR_LAUNCH';
  }
}

function mapRecommendationToState(recommendation: LaunchReadinessRecommendation): LaunchReadinessState {
  switch (recommendation) {
    case 'READY_FOR_PUBLIC_LAUNCH':
    case 'READY_FOR_PUBLIC_BETA':
      return 'READY';
    case 'READY_FOR_PRIVATE_BETA':
      return 'CAUTION';
    case 'READY_FOR_INTERNAL_USE':
      return 'HIGH_RISK';
    case 'NOT_READY_FOR_LAUNCH':
    default:
      return 'BLOCKED';
  }
}

export function resolveAuthoritativeLaunchReadiness(): LaunchReadinessConsolidationSnapshot {
  const aflaAssessment = getLastAutonomousFounderLaunchAssessment();
  return {
    readOnly: true,
    authoritativeOwner: LAUNCH_READINESS_AUTHORITATIVE_OWNER,
    consolidationStatus: LAUNCH_READINESS_CONSOLIDATION_STATUS,
    noDuplicateLaunchVerdictGeneration: true,
    noDuplicateLaunchScoring: true,
    delegatedFrom: 'Launch Readiness Authority',
    aflaAssessment: aflaAssessment ?? null,
  };
}

export function deriveLaunchDecisionFromAfla(assessment: AutonomousFounderLaunchAssessment): {
  recommendation: LaunchReadinessRecommendation;
  readinessState: LaunchReadinessState;
  launchConfidenceScore: number;
  blocksLaunch: boolean;
} {
  const recommendation = mapAflaVerdictToRecommendation(assessment);
  return {
    recommendation,
    readinessState: mapRecommendationToState(recommendation),
    launchConfidenceScore: assessment.scores.overallFounderScore,
    blocksLaunch: assessment.blocksLaunch,
  };
}

export function applyAflaLaunchDelegation(
  localRecommendation: LaunchReadinessRecommendation,
  aflaAssessment: AutonomousFounderLaunchAssessment | null,
): LaunchReadinessRecommendation {
  if (!aflaAssessment) return localRecommendation;
  if (aflaAssessment.blocksLaunch) return 'NOT_READY_FOR_LAUNCH';
  return mapAflaVerdictToRecommendation(aflaAssessment);
}
