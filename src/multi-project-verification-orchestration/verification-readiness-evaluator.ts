/**
 * Multi Project Verification Orchestration — readiness evaluation.
 */

import type {
  VerificationOrchestrationProjectInput,
  VerificationOrchestrationStatus,
} from './verification-orchestration-types.js';
import type { VerificationDependencyBuildResult } from './verification-dependency-manager.js';
import { getCachedVerificationReadiness, setCachedVerificationReadiness } from './verification-cache.js';

export function evaluateVerificationOrchestrationReadiness(
  project: VerificationOrchestrationProjectInput,
  dependencyResult: VerificationDependencyBuildResult,
  completedProjects: Set<string> = new Set(),
): VerificationOrchestrationStatus {
  const cached = getCachedVerificationReadiness(project.projectId);
  if (cached) return cached as VerificationOrchestrationStatus;

  let status: VerificationOrchestrationStatus = 'READY';

  if (project.isolationOk === false) {
    status = 'BLOCKED';
  } else if (project.resourceAvailable === false) {
    status = 'CAPACITY_BLOCKED';
  } else if (
    dependencyResult.missing.some((m) => m.startsWith(project.projectId)) ||
    dependencyResult.cycles.some((c) => c.includes(project.projectId))
  ) {
    status = 'DEPENDENCY_BLOCKED';
  } else if ((project.dependsOn ?? []).some((dep) => !completedProjects.has(dep))) {
    status = 'WAITING';
  } else if (project.verificationStatus === 'BLOCKED') {
    status = 'BLOCKED';
  } else if (project.verificationStatus === 'VERIFIED') {
    status = 'READY';
  } else if (project.verificationReady === false) {
    status = 'WAITING';
  } else if (project.orchestrationReady === false) {
    status = 'CAPACITY_BLOCKED';
  }

  setCachedVerificationReadiness(project.projectId, status);
  return status;
}

export function evaluateAllVerificationReadiness(
  projects: VerificationOrchestrationProjectInput[],
  dependencyResult: VerificationDependencyBuildResult,
): Map<string, VerificationOrchestrationStatus> {
  const statuses = new Map<string, VerificationOrchestrationStatus>();
  const completed = new Set(
    projects.filter((p) => p.verificationStatus === 'VERIFIED').map((p) => p.projectId),
  );

  for (const project of projects) {
    statuses.set(
      project.projectId,
      evaluateVerificationOrchestrationReadiness(project, dependencyResult, completed),
    );
  }
  return statuses;
}

export function getConfidenceBand(confidence: number): string {
  if (confidence >= 80) return 'HIGH';
  if (confidence >= 60) return 'MEDIUM';
  if (confidence >= 40) return 'LOW';
  return 'CRITICAL';
}

export function getRiskBand(riskScore: number): string {
  if (riskScore >= 70) return 'HIGH';
  if (riskScore >= 50) return 'MEDIUM';
  if (riskScore >= 30) return 'LOW';
  return 'MINIMAL';
}

export function getVerificationPriorityScore(project: VerificationOrchestrationProjectInput): number {
  const confidence = project.confidence ?? 50;
  const risk = project.riskScore ?? 30;
  return Math.round(confidence - risk * 0.5);
}
