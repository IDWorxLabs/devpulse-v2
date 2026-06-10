/**
 * Multi Project Verification Orchestration — dependency chain management.
 */

import type { VerificationOrchestrationProjectInput } from './verification-orchestration-types.js';
import { MAX_VERIFICATION_DEPENDENCY_CHAIN_DEPTH } from './verification-orchestration-types.js';
import {
  getCachedVerificationDependencies,
  setCachedVerificationDependencies,
} from './verification-cache.js';

export interface VerificationDependencyBuildResult {
  chains: string[][];
  cycles: string[][];
  invalid: string[];
  missing: string[];
}

export function buildVerificationDependencyChains(
  projects: VerificationOrchestrationProjectInput[],
): VerificationDependencyBuildResult {
  const cacheKey = projects.map((p) => `${p.projectId}:${(p.dependsOn ?? []).join(',')}`).join('|');
  const cached = getCachedVerificationDependencies(cacheKey);
  if (cached) {
    return { chains: cached, cycles: [], invalid: [], missing: [] };
  }

  const projectIds = new Set(projects.map((p) => p.projectId));
  const missing: string[] = [];
  const invalid: string[] = [];
  const cycles: string[][] = [];

  for (const project of projects) {
    for (const dep of project.dependsOn ?? []) {
      if (!projectIds.has(dep)) {
        missing.push(`${project.projectId} depends on missing ${dep}`);
      }
      if (dep === project.projectId) {
        invalid.push(`${project.projectId} self-dependency`);
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function detectCycle(projectId: string, path: string[]): void {
    if (path.length > MAX_VERIFICATION_DEPENDENCY_CHAIN_DEPTH) {
      invalid.push(`dependency chain depth exceeded at ${projectId}`);
      return;
    }
    if (visiting.has(projectId)) {
      const cycleStart = path.indexOf(projectId);
      cycles.push(cycleStart >= 0 ? [...path.slice(cycleStart), projectId] : [...path, projectId]);
      return;
    }
    if (visited.has(projectId)) return;

    visiting.add(projectId);
    const project = projects.find((p) => p.projectId === projectId);
    for (const dep of project?.dependsOn ?? []) {
      detectCycle(dep, [...path, projectId]);
    }
    visiting.delete(projectId);
    visited.add(projectId);
  }

  for (const project of projects) {
    detectCycle(project.projectId, []);
  }

  const chains: string[][] = [];
  for (const project of projects) {
    chains.push(buildProjectChain(project.projectId, projects));
  }

  const uniqueChains = dedupeChains(chains);

  if (cycles.length === 0 && missing.length === 0) {
    setCachedVerificationDependencies(cacheKey, uniqueChains);
  }

  return { chains: uniqueChains, cycles, invalid, missing };
}

function buildProjectChain(
  projectId: string,
  projects: VerificationOrchestrationProjectInput[],
  visited: Set<string> = new Set(),
): string[] {
  if (visited.has(projectId) || visited.size > MAX_VERIFICATION_DEPENDENCY_CHAIN_DEPTH) {
    return [projectId];
  }

  visited.add(projectId);
  const project = projects.find((p) => p.projectId === projectId);
  const deps = project?.dependsOn ?? [];

  if (deps.length === 0) {
    return [projectId];
  }

  const depChains = deps.map((dep) => buildProjectChain(dep, projects, new Set(visited)));
  const prefix = depChains.reduce((longest, chain) => (chain.length >= longest.length ? chain : longest), [] as string[]);
  return [...prefix, projectId];
}

function dedupeChains(chains: string[][]): string[][] {
  const seen = new Set<string>();
  return chains.filter((chain) => {
    const key = chain.join('->');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getVerificationDependencyCount(projects: VerificationOrchestrationProjectInput[]): number {
  return projects.reduce((sum, p) => sum + (p.dependsOn?.length ?? 0), 0);
}
