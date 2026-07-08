/**
 * Project Resume State — duplicate detection and resume routing for one-prompt builds.
 */

import { hashString } from '../build-history-integrity/build-history-hash.js';
import { isUserFacingRegistryProject } from '../project-registry-v1/project-kind.js';
import { readProjectRegistryState } from '../project-registry-v1/project-registry-v1-store.js';
import { persistentProjectPaths } from '../persistent-project-reality/persistent-project-reality-paths.js';
import {
  domainOverlapScore,
  extractProjectNameDomainSignals,
  extractPromptDomainSignals,
} from '../project-context-alignment-v1/prompt-domain-analyzer.js';
import { normalizeProjectRegistryName } from '../project-registry-sovereignty/registry-classifier.js';
import { deriveProjectBuildState } from './project-build-state-deriver.js';
import type {
  DuplicateProjectResumeInput,
  DuplicateProjectResumeResult,
  ProjectResumePlan,
} from './project-resume-state-types.js';

function readStoredPrompt(projectId: string, rootDir?: string): string | null {
  const state = deriveProjectBuildState(projectId, rootDir);
  return state?.originalPrompt ?? null;
}

function promptSimilarity(a: string, b: string): number {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.92;
  const leftWords = new Set(left.split(/\s+/).filter((word) => word.length > 3));
  const rightWords = new Set(right.split(/\s+/).filter((word) => word.length > 3));
  let overlap = 0;
  for (const word of leftWords) {
    if (rightWords.has(word)) overlap += 1;
  }
  const denom = Math.max(leftWords.size, rightWords.size, 1);
  return overlap / denom;
}

function isIncompleteState(buildState: string | null | undefined): boolean {
  return (
    buildState === 'NEEDS_WORK' ||
    buildState === 'FAILED' ||
    buildState === 'PARTIAL' ||
    buildState === 'REPAIRABLE' ||
    buildState === 'RESUMABLE' ||
    buildState === 'STALE'
  );
}

export function routeDuplicateProjectResume(
  input: DuplicateProjectResumeInput,
): DuplicateProjectResumeResult {
  const rawPrompt = input.rawPrompt.trim();
  const rootDir = input.rootDir;
  const promptHash = rawPrompt ? hashString(rawPrompt) : null;
  const promptSignals = extractPromptDomainSignals(rawPrompt);
  const registry = readProjectRegistryState(rootDir);
  const activeProjects = registry.projects.filter(
    (project) => project.status === 'ACTIVE' && isUserFacingRegistryProject(project),
  );

  if (input.confirmFreshCopy) {
    return {
      readOnly: true,
      shouldBlock: false,
      resumingExistingProject: false,
      resumingProjectId: input.projectId ?? null,
      resumingProjectName: input.projectName ?? null,
      effectivePrompt: rawPrompt || null,
      promptSource: rawPrompt ? 'USER' : 'NONE',
      reason: 'User confirmed starting a fresh copy.',
      buildState: null,
      duplicateMatchType: 'NONE',
    };
  }

  if (input.confirmResume && input.projectId) {
    const stored = readStoredPrompt(input.projectId, rootDir);
    return {
      readOnly: true,
      shouldBlock: false,
      resumingExistingProject: true,
      resumingProjectId: input.projectId,
      resumingProjectName: input.projectName ?? null,
      effectivePrompt: rawPrompt || stored,
      promptSource: rawPrompt ? 'USER' : stored ? 'STORED' : 'NONE',
      reason: 'User confirmed resuming the selected project.',
      buildState: deriveProjectBuildState(input.projectId, rootDir)?.buildState ?? null,
      duplicateMatchType: 'NONE',
    };
  }

  let bestMatch: {
    projectId: string;
    name: string;
    score: number;
    matchType: DuplicateProjectResumeResult['duplicateMatchType'];
    buildState: string;
  } | null = null;

  for (const project of activeProjects) {
    if (input.projectId && project.projectId === input.projectId) continue;
    const buildState = deriveProjectBuildState(project.projectId, rootDir);
    if (!buildState || !isIncompleteState(buildState.buildState)) continue;

    const storedPrompt = buildState.originalPrompt;
    const storedHash = buildState.promptHash;
    const nameNormalized = normalizeProjectRegistryName(project.name);
    const requestedName = input.projectName
      ? normalizeProjectRegistryName(input.projectName)
      : '';
    const promptName = promptSignals.proposedProjectName?.toLowerCase() ?? '';

    if (requestedName && nameNormalized === requestedName) {
      const candidate = {
        projectId: project.projectId,
        name: project.name,
        score: 0.98,
        matchType: 'SAME_NAME' as const,
        buildState: buildState.buildState,
      };
      if (!bestMatch || candidate.score > bestMatch.score) bestMatch = candidate;
      continue;
    }

    if (promptHash && storedHash && promptHash === storedHash) {
      const candidate = {
        projectId: project.projectId,
        name: project.name,
        score: 0.99,
        matchType: 'SAME_PROMPT_HASH' as const,
        buildState: buildState.buildState,
      };
      if (!bestMatch || candidate.score > bestMatch.score) bestMatch = candidate;
      continue;
    }

    if (storedPrompt && rawPrompt && promptSimilarity(rawPrompt, storedPrompt) >= 0.72) {
      const candidate = {
        projectId: project.projectId,
        name: project.name,
        score: 0.9,
        matchType: 'SAME_PROMPT_HASH' as const,
        buildState: buildState.buildState,
      };
      if (!bestMatch || candidate.score > bestMatch.score) bestMatch = candidate;
      continue;
    }

    const nameSignals = extractProjectNameDomainSignals(project.name);
    const domainScore = domainOverlapScore(promptSignals.domainIds, nameSignals.domainIds);
    if (domainScore >= 0.55 || (promptName && nameNormalized.includes(promptName))) {
      const candidate = {
        projectId: project.projectId,
        name: project.name,
        score: Math.max(domainScore, 0.75),
        matchType: 'SIMILAR_DOMAIN' as const,
        buildState: buildState.buildState,
      };
      if (!bestMatch || candidate.score > bestMatch.score) bestMatch = candidate;
    }

    const contractPath = persistentProjectPaths(rootDir ?? process.cwd(), project.projectId)
      .featureContract;
    if (contractPath && promptSignals.domainIds.length > 0) {
      void contractPath;
      if (domainScore >= 0.45) {
        const candidate = {
          projectId: project.projectId,
          name: project.name,
          score: domainScore,
          matchType: 'OVERLAPPING_CONTRACT' as const,
          buildState: buildState.buildState,
        };
        if (!bestMatch || candidate.score > bestMatch.score) bestMatch = candidate;
      }
    }
  }

  if (bestMatch && bestMatch.score >= 0.72) {
    const stored = readStoredPrompt(bestMatch.projectId, rootDir);
    return {
      readOnly: true,
      shouldBlock: true,
      resumingExistingProject: false,
      resumingProjectId: bestMatch.projectId,
      resumingProjectName: bestMatch.name,
      effectivePrompt: rawPrompt || stored,
      promptSource: rawPrompt ? 'USER' : stored ? 'STORED' : 'NONE',
      reason: `Existing incomplete ${bestMatch.name} found. Choose Resume, Create fresh copy, or Cancel.`,
      buildState: bestMatch.buildState as DuplicateProjectResumeResult['buildState'],
      duplicateMatchType: bestMatch.matchType,
    };
  }

  const targetProjectId =
    input.confirmResume && input.projectId ? input.projectId : null;
  if (targetProjectId && !rawPrompt) {
    const buildState = deriveProjectBuildState(targetProjectId, rootDir);
    const stored = buildState?.originalPrompt ?? null;
    if (stored) {
      return {
        readOnly: true,
        shouldBlock: false,
        resumingExistingProject: true,
        resumingProjectId: targetProjectId,
        resumingProjectName: buildState?.projectName ?? input.projectName ?? null,
        effectivePrompt: stored,
        promptSource: 'STORED',
        reason: 'Using stored original prompt for project resume.',
        buildState: buildState?.buildState ?? null,
        duplicateMatchType: 'NONE',
      };
    }
  }

  return {
    readOnly: true,
    shouldBlock: false,
    resumingExistingProject: false,
    resumingProjectId: null,
    resumingProjectName: null,
    effectivePrompt: rawPrompt || null,
    promptSource: rawPrompt ? 'USER' : 'NONE',
    reason: 'No duplicate incomplete project detected — fresh build allowed.',
    buildState: null,
    duplicateMatchType: 'NONE',
  };
}

export function buildProjectResumePlan(input: {
  projectId: string;
  rawPrompt?: string | null;
  rootDir?: string;
  primaryAction?: 'RESUME_BUILD' | 'REPAIR_BUILD' | 'CONTINUE_FROM_PROMPT';
}): ProjectResumePlan | null {
  const buildState = deriveProjectBuildState(input.projectId, input.rootDir);
  if (!buildState) return null;

  const userPrompt = input.rawPrompt?.trim() || null;
  const effectivePrompt = userPrompt || buildState.originalPrompt;
  if (!effectivePrompt) return null;

  return {
    readOnly: true,
    projectId: buildState.projectId,
    projectName: buildState.projectName,
    buildState: buildState.buildState,
    effectivePrompt,
    promptSource: userPrompt ? 'USER' : 'STORED',
    resumeFromBuildRunId:
      buildState.evidence.lastSuccessfulBuildRunId ?? buildState.evidence.lastFailedBuildRunId,
    lastStableBuildBoundary: buildState.evidence.lastStableBuildBoundary,
    failureReason: buildState.evidence.failureReason,
    primaryAction: input.primaryAction ?? 'RESUME_BUILD',
  };
}

export function composeDuplicateResumeResponse(route: DuplicateProjectResumeResult): Record<string, unknown> {
  return {
    ok: false,
    resumeRequired: true,
    duplicateDetected: route.duplicateMatchType !== 'NONE',
    duplicateMatchType: route.duplicateMatchType,
    resumingProjectId: route.resumingProjectId,
    resumingProjectName: route.resumingProjectName,
    buildState: route.buildState,
    reason: route.reason,
    message:
      route.resumingProjectName && route.duplicateMatchType !== 'NONE'
        ? `Existing incomplete ${route.resumingProjectName} found. Choose how to continue.`
        : route.reason,
    actions: [
      {
        type: 'resume_existing',
        label: 'Resume existing',
        projectId: route.resumingProjectId,
        projectName: route.resumingProjectName,
      },
      {
        type: 'start_fresh_copy',
        label: 'Create fresh copy',
      },
      {
        type: 'cancel_build',
        label: 'Cancel',
      },
    ],
    promptSource: route.promptSource,
    effectivePromptAvailable: Boolean(route.effectivePrompt),
    storedPromptRequired: route.promptSource === 'NONE',
    storedPromptMessage:
      route.promptSource === 'NONE'
        ? 'Original prompt unavailable. Paste prompt to continue.'
        : null,
  };
}
