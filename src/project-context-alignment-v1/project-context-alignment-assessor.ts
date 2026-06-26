/**
 * Project Context Alignment Guard V1 — assess whether a build prompt belongs in the active project.
 */

import { isBuildIntentRequest } from '../build-intent-routing/build-intent-detector.js';
import { readProjectRegistryState } from '../project-registry-v1/project-registry-v1-store.js';
import type {
  ProjectContextAlignmentAction,
  ProjectContextAlignmentInput,
  ProjectContextAlignmentResult,
  ProjectContextSuggestedAction,
} from './project-context-alignment-types.js';
import {
  domainOverlapScore,
  extractProjectNameDomainSignals,
  extractPromptDomainSignals,
  normalizeProjectDisplayName,
} from './prompt-domain-analyzer.js';
import { getProjectContextMetadata } from './project-context-metadata-store.js';
import {
  isLisaProjectName,
  lisaKeywordsForProject,
  promptMentionsActiveProjectName,
  promptMentionsLisaOrAccessibility,
  proposedNameShouldNotBeTaskTracker,
  resolveLisaProjectDomain,
} from '../project-context-switching/index.js';

const GENERIC_GUIDANCE =
  /\b(what should i do next|what next|help me decide|any suggestions|status update|how is the project)\b/i;

function alignedResult(input: {
  activeProjectId: string | null;
  activeProjectName: string | null;
  promptDomain: string;
  activeProjectDomain: string;
  reason: string;
  alignmentScore: number;
}): ProjectContextAlignmentResult {
  return {
    readOnly: true,
    verdict: 'ALIGNED',
    blocksExecution: false,
    activeProjectId: input.activeProjectId,
    activeProjectName: input.activeProjectName,
    promptDomain: input.promptDomain,
    activeProjectDomain: input.activeProjectDomain,
    reason: input.reason,
    suggestedProjectId: null,
    suggestedProjectName: null,
    suggestedAction: 'NONE',
    proposedNewProjectName: null,
    actions: [],
    alignmentScore: input.alignmentScore,
  };
}

function blockedResult(input: {
  verdict: ProjectContextAlignmentResult['verdict'];
  activeProjectId: string | null;
  activeProjectName: string | null;
  promptDomain: string;
  activeProjectDomain: string;
  reason: string;
  suggestedProjectId: string | null;
  suggestedProjectName: string | null;
  suggestedAction: ProjectContextSuggestedAction;
  proposedNewProjectName: string | null;
  actions: ProjectContextAlignmentAction[];
  alignmentScore: number;
}): ProjectContextAlignmentResult {
  return {
    readOnly: true,
    verdict: input.verdict,
    blocksExecution: true,
    activeProjectId: input.activeProjectId,
    activeProjectName: input.activeProjectName,
    promptDomain: input.promptDomain,
    activeProjectDomain: input.activeProjectDomain,
    reason: input.reason,
    suggestedProjectId: input.suggestedProjectId,
    suggestedProjectName: input.suggestedProjectName,
    suggestedAction: input.suggestedAction,
    proposedNewProjectName: input.proposedNewProjectName,
    actions: input.actions,
    alignmentScore: input.alignmentScore,
  };
}

function buildActions(input: {
  verdict: ProjectContextAlignmentResult['verdict'];
  suggestedProjectId: string | null;
  suggestedProjectName: string | null;
  proposedNewProjectName: string | null;
}): ProjectContextAlignmentAction[] {
  const actions: ProjectContextAlignmentAction[] = [];
  if (input.suggestedProjectId && input.suggestedProjectName) {
    actions.push({
      readOnly: true,
      type: 'switch_project',
      label: `Switch to ${input.suggestedProjectName}`,
      projectId: input.suggestedProjectId,
      projectName: input.suggestedProjectName,
    });
  }
  if (
    input.verdict === 'NEW_PROJECT_SUGGESTED' ||
    input.verdict === 'DEFINITELY_MISPLACED'
  ) {
    actions.push({
      readOnly: true,
      type: 'create_project',
      label: `Create ${input.proposedNewProjectName ?? 'new project'}`,
      projectName: input.proposedNewProjectName ?? 'New Project',
    });
  }
  if (input.verdict === 'POSSIBLY_MISPLACED') {
    actions.push({
      readOnly: true,
      type: 'continue_anyway',
      label: 'Continue in current project anyway',
    });
  }
  return actions;
}

function scoreProjectAgainstPrompt(
  projectName: string,
  projectId: string,
  promptDomainIds: string[],
  rootDir?: string,
): number {
  const metadata = getProjectContextMetadata(projectId, rootDir);
  const nameSignals = extractProjectNameDomainSignals(projectName);
  let domainIds = [
    ...new Set([...nameSignals.domainIds, ...(metadata?.keywords ?? [])]),
  ];
  if (metadata?.lastBuildIntentSummary) {
    const summarySignals = extractPromptDomainSignals(metadata.lastBuildIntentSummary);
    domainIds = [...new Set([...domainIds, ...summarySignals.domainIds])];
  }
  const nameNormalized = normalizeProjectDisplayName(projectName).toLowerCase();
  let score = domainOverlapScore(promptDomainIds, domainIds);
  for (const domainId of promptDomainIds) {
    if (nameNormalized.includes(domainId)) score = Math.max(score, 0.85);
  }
  if (metadata?.profile && promptDomainIds.some((id) => metadata.profile?.toLowerCase().includes(id))) {
    score = Math.max(score, 0.75);
  }
  return score;
}

export function assessProjectContextAlignment(
  input: ProjectContextAlignmentInput,
): ProjectContextAlignmentResult {
  const prompt = input.prompt.trim();
  const activeProjectId = input.activeProjectId ?? null;
  const activeProjectName = input.activeProjectName?.trim() || null;
  const rootDir = input.rootDir;

  if (!isBuildIntentRequest(prompt) || GENERIC_GUIDANCE.test(prompt)) {
    return alignedResult({
      activeProjectId,
      activeProjectName,
      promptDomain: 'non-build',
      activeProjectDomain: activeProjectName ?? 'none',
      reason: 'Prompt is not a build execution request — alignment guard does not block chat.',
      alignmentScore: 1,
    });
  }

  if (input.confirmProjectContextAlignment) {
    const promptSignals = extractPromptDomainSignals(prompt, {
      activeProjectName: activeProjectName,
    });
    return alignedResult({
      activeProjectId,
      activeProjectName,
      promptDomain: promptSignals.domainLabel,
      activeProjectDomain: activeProjectName ?? 'current project',
      reason: 'User confirmed continuing in the current project.',
      alignmentScore: 0.5,
    });
  }

  const promptSignals = extractPromptDomainSignals(prompt, {
    activeProjectName: activeProjectName,
  });
  const registry = readProjectRegistryState(rootDir);
  const activeRecord =
    registry.projects.find(
      (project) => project.projectId === activeProjectId && project.status === 'ACTIVE',
    ) ??
    registry.projects.find(
      (project) =>
        project.status === 'ACTIVE' &&
        activeProjectName &&
        project.name.toLowerCase() === activeProjectName.toLowerCase(),
    ) ??
    null;

  const resolvedActiveId = activeRecord?.projectId ?? activeProjectId;
  const resolvedActiveName = activeRecord?.name ?? activeProjectName ?? 'current project';
  const activeMetadata = resolvedActiveId
    ? getProjectContextMetadata(resolvedActiveId, rootDir)
    : null;
  const activeNameSignals = extractProjectNameDomainSignals(resolvedActiveName);
  const lisaDomain = resolveLisaProjectDomain(resolvedActiveName);
  const activeDomainIds = [
    ...new Set([
      ...activeNameSignals.domainIds,
      ...(activeMetadata?.keywords ?? []),
      ...(lisaDomain ? lisaKeywordsForProject() : []),
    ]),
  ];
  if (activeMetadata?.lastBuildIntentSummary) {
    const summaryDomainSignals = extractPromptDomainSignals(activeMetadata.lastBuildIntentSummary);
    for (const domainId of summaryDomainSignals.domainIds) {
      if (!activeDomainIds.includes(domainId)) activeDomainIds.push(domainId);
    }
  }
  const activeDomainLabel =
    lisaDomain ??
    (activeMetadata?.domain && activeMetadata.domain !== 'general application'
      ? activeMetadata.domain
      : activeNameSignals.domainLabel);

  const activeScore = resolvedActiveId
    ? scoreProjectAgainstPrompt(resolvedActiveName, resolvedActiveId, promptSignals.domainIds, rootDir)
    : 0;
  const activeHasSpecificDomain = activeDomainIds.length > 0;

  if (
    promptMentionsActiveProjectName(prompt, resolvedActiveName) ||
    (isLisaProjectName(resolvedActiveName) && promptMentionsLisaOrAccessibility(prompt))
  ) {
    return alignedResult({
      activeProjectId: resolvedActiveId,
      activeProjectName: resolvedActiveName,
      promptDomain: promptSignals.domainLabel,
      activeProjectDomain: activeDomainLabel,
      reason: `Prompt explicitly targets active project "${resolvedActiveName}".`,
      alignmentScore: Math.max(activeScore, 0.85),
    });
  }

  const activeProjects = registry.projects.filter((project) => project.status === 'ACTIVE');
  let bestOther: { projectId: string; name: string; score: number } | null = null;
  for (const project of activeProjects) {
    if (project.projectId === resolvedActiveId) continue;
    const score = scoreProjectAgainstPrompt(project.name, project.projectId, promptSignals.domainIds, rootDir);
    if (!bestOther || score > bestOther.score) {
      bestOther = { projectId: project.projectId, name: project.name, score };
    }
  }

  if (activeScore >= 0.55) {
    return alignedResult({
      activeProjectId: resolvedActiveId,
      activeProjectName: resolvedActiveName,
      promptDomain: promptSignals.domainLabel,
      activeProjectDomain: activeDomainLabel,
      reason: `Prompt matches the active project "${resolvedActiveName}".`,
      alignmentScore: activeScore,
    });
  }

  const promptHasSpecificDomain = promptSignals.domainIds.length > 0;
  const allowFirstBuildOnGenericProject =
    activeProjects.length <= 1 &&
    !activeMetadata?.lastBuildIntentSummary &&
    !(activeMetadata?.keywords?.length);

  if (
    promptHasSpecificDomain &&
    !activeHasSpecificDomain &&
    activeScore < 0.35 &&
    !allowFirstBuildOnGenericProject
  ) {
    const proposedName =
      proposedNameShouldNotBeTaskTracker(prompt, promptSignals.proposedProjectName)
        ? isLisaProjectName(resolvedActiveName)
          ? 'LISA'
          : 'New Project'
        : (promptSignals.proposedProjectName ?? 'New Project');
    return blockedResult({
      verdict: 'NEW_PROJECT_SUGGESTED',
      activeProjectId: resolvedActiveId,
      activeProjectName: resolvedActiveName,
      promptDomain: promptSignals.domainLabel,
      activeProjectDomain: activeDomainLabel,
      reason: `This build prompt targets ${promptSignals.domainLabel}, which does not match active project "${resolvedActiveName}". Create or open a dedicated project first.`,
      suggestedProjectId: null,
      suggestedProjectName: null,
      suggestedAction: 'CREATE_NEW_PROJECT',
      proposedNewProjectName: proposedName,
      actions: buildActions({
        verdict: 'NEW_PROJECT_SUGGESTED',
        suggestedProjectId: null,
        suggestedProjectName: null,
        proposedNewProjectName: proposedName,
      }),
      alignmentScore: activeScore,
    });
  }

  if (
    !activeHasSpecificDomain &&
    (!bestOther || bestOther.score < 0.55) &&
    (resolvedActiveId || Boolean(activeProjectName))
  ) {
    return alignedResult({
      activeProjectId: resolvedActiveId,
      activeProjectName: resolvedActiveName,
      promptDomain: promptSignals.domainLabel,
      activeProjectDomain: activeDomainLabel,
      reason: `Active project "${resolvedActiveName}" has no established domain yet — first build can define project context.`,
      alignmentScore: activeScore,
    });
  }

  if (bestOther && bestOther.score >= 0.55 && bestOther.score > activeScore + 0.15) {
    return blockedResult({
      verdict: 'BELONGS_TO_EXISTING_PROJECT',
      activeProjectId: resolvedActiveId,
      activeProjectName: resolvedActiveName,
      promptDomain: promptSignals.domainLabel,
      activeProjectDomain: activeDomainLabel,
      reason: `This prompt appears unrelated to ${resolvedActiveName}. It looks more like ${promptSignals.domainLabel} and matches existing project "${bestOther.name}".`,
      suggestedProjectId: bestOther.projectId,
      suggestedProjectName: bestOther.name,
      suggestedAction: 'SWITCH_PROJECT',
      proposedNewProjectName: null,
      actions: buildActions({
        verdict: 'BELONGS_TO_EXISTING_PROJECT',
        suggestedProjectId: bestOther.projectId,
        suggestedProjectName: bestOther.name,
        proposedNewProjectName: null,
      }),
      alignmentScore: activeScore,
    });
  }

  const overlap = domainOverlapScore(promptSignals.domainIds, activeDomainIds);

  if (
    promptHasSpecificDomain &&
    activeHasSpecificDomain &&
    overlap === 0 &&
    activeScore < 0.25
  ) {
    const proposedName =
      proposedNameShouldNotBeTaskTracker(prompt, promptSignals.proposedProjectName)
        ? isLisaProjectName(resolvedActiveName)
          ? 'LISA'
          : 'New Project'
        : (promptSignals.proposedProjectName ?? 'New Project');
    return blockedResult({
      verdict: 'DEFINITELY_MISPLACED',
      activeProjectId: resolvedActiveId,
      activeProjectName: resolvedActiveName,
      promptDomain: promptSignals.domainLabel,
      activeProjectDomain: activeDomainLabel,
      reason: `This prompt appears unrelated to ${resolvedActiveName}. It looks more like ${promptSignals.domainLabel}. Do you want to create/open a ${proposedName} project instead?`,
      suggestedProjectId: bestOther?.score && bestOther.score >= 0.4 ? bestOther.projectId : null,
      suggestedProjectName: bestOther?.score && bestOther.score >= 0.4 ? bestOther.name : null,
      suggestedAction: bestOther?.score && bestOther.score >= 0.4 ? 'SWITCH_PROJECT' : 'CREATE_NEW_PROJECT',
      proposedNewProjectName: proposedName,
      actions: buildActions({
        verdict: 'DEFINITELY_MISPLACED',
        suggestedProjectId: bestOther?.score && bestOther.score >= 0.4 ? bestOther.projectId : null,
        suggestedProjectName: bestOther?.score && bestOther.score >= 0.4 ? bestOther.name : null,
        proposedNewProjectName: proposedName,
      }),
      alignmentScore: activeScore,
    });
  }

  if (activeScore < 0.45) {
    const proposedName =
      proposedNameShouldNotBeTaskTracker(prompt, promptSignals.proposedProjectName)
        ? isLisaProjectName(resolvedActiveName)
          ? 'LISA'
          : 'New Project'
        : (promptSignals.proposedProjectName ?? 'New Project');
    return blockedResult({
      verdict: 'POSSIBLY_MISPLACED',
      activeProjectId: resolvedActiveId,
      activeProjectName: resolvedActiveName,
      promptDomain: promptSignals.domainLabel,
      activeProjectDomain: activeDomainLabel,
      reason: `This prompt may not belong in ${resolvedActiveName}. It reads like ${promptSignals.domainLabel}. Confirm before starting build execution here.`,
      suggestedProjectId: bestOther && bestOther.score >= 0.4 ? bestOther.projectId : null,
      suggestedProjectName: bestOther && bestOther.score >= 0.4 ? bestOther.name : null,
      suggestedAction: 'CONFIRM_CONTINUE',
      proposedNewProjectName: proposedName,
      actions: buildActions({
        verdict: 'POSSIBLY_MISPLACED',
        suggestedProjectId: bestOther && bestOther.score >= 0.4 ? bestOther.projectId : null,
        suggestedProjectName: bestOther && bestOther.score >= 0.4 ? bestOther.name : null,
        proposedNewProjectName: proposedName,
      }),
      alignmentScore: activeScore,
    });
  }

  return alignedResult({
    activeProjectId: resolvedActiveId,
    activeProjectName: resolvedActiveName,
    promptDomain: promptSignals.domainLabel,
    activeProjectDomain: activeDomainLabel,
    reason: `Prompt is close enough to active project "${resolvedActiveName}".`,
    alignmentScore: activeScore,
  });
}

export function alignmentBlocksBuildExecution(result: ProjectContextAlignmentResult): boolean {
  return result.blocksExecution;
}
