/**
 * AiDevEngine product workspace snapshot — read-only UI data for product surfaces.
 * Aggregates vault, live preview, and verification readiness without execution.
 */

import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../src/intelligence-console/capability-registry.js';
import {
  assessLivePreviewReality,
  type LivePreviewRealityAssessment,
} from '../src/live-preview-reality/index.js';
import {
  assessRunningApplicationVisibility,
  type RunningApplicationVisibilityAssessment,
} from '../src/running-application-visibility/index.js';
import {
  assessChangeIntelligenceVisibility,
  getChangeIntelligenceHistory,
  recordWorkspaceChangeSnapshot,
  type ChangeIntelligenceVisibilityAssessment,
} from '../src/change-intelligence-visibility/index.js';
import {
  assessFounderActionCenter,
  type FounderActionCenterAssessment,
} from '../src/founder-action-center/index.js';
import {
  assessFounderSensemaking,
  getCachedFounderSensemaking,
  setCachedFounderSensemaking,
  type FounderSensemakingAssessment,
} from '../src/founder-sensemaking-engine/index.js';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildVerificationResultsFromWorkspace,
  type VerificationResultsVisibilityAssessment,
} from '../src/verification-results-visibility/index.js';
import {
  getPreviewRuntimeDiagnostics,
  listPreviewSessions,
  listPreviewTargets,
} from '../src/live-preview-runtime/index.js';
import { getDevPulseV2ProjectVaultAuthority } from '../src/project-vault/index.js';
import { ALL_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import { buildPortfolioInsightsDemo, type PortfolioInsightsDemo } from './portfolio-demo-data.js';

export const PROJECT_MEMORY_DESCRIPTION =
  'Project Memory stores everything AiDevEngine knows about a project: the idea, requirements, decisions, files, history, plans, validations, and context, so the AI does not forget what it is building.';

export const AUTONOMOUS_BUILDER_DESCRIPTION =
  'Autonomous Builder plans and executes project work in an isolated workspace. Foundation architecture is in place; full autonomous execution is not active yet.';

function buildSensemakingCacheKey(input: {
  projectMemory: ProductWorkspaceSnapshot['projectMemory'];
  changeIntelligence: ChangeIntelligenceVisibilityAssessment;
  founderActionCenter: FounderActionCenterAssessment;
  verificationResults: VerificationResultsVisibilityAssessment;
}): string {
  const publicDir = join(process.cwd(), 'public', 'founder-reality');
  let shellKey = 'shell:missing';
  try {
    const appStat = statSync(join(publicDir, 'app.js'));
    const htmlStat = statSync(join(publicDir, 'index.html'));
    shellKey = `shell:${appStat.mtimeMs}:${appStat.size}:${htmlStat.mtimeMs}:${htmlStat.size}`;
  } catch {
    shellKey = 'shell:missing';
  }
  const vault = input.projectMemory.vaultState;
  return [
    'sensemaking',
    shellKey,
    `facts:${vault.factCount}`,
    `projects:${vault.projectCount}`,
    `history:${input.changeIntelligence.historyCount}`,
    `actions:${input.founderActionCenter.topActions.length}`,
    `verify:${input.verificationResults.summary.passCount}:${input.verificationResults.summary.failCount}`,
  ].join('|');
}

export interface ProductWorkspaceSnapshot {
  productBrand: 'AiDevEngine';
  generatedAt: number;
  projectMemory: {
    description: string;
    vaultState: {
      projectCount: number;
      activeProjectCount: number;
      factCount: number;
      snapshotCount: number;
      latestProjectId: string | null;
      warnings: string[];
    };
    projects: Array<{
      projectId: string;
      name: string;
      status: string;
      phase: string;
      summary: string;
      factCount: number;
      warnings: string[];
      recentFacts: string[];
    }>;
    nextSuggestedActions: string[];
  };
  livePreview: {
    connected: boolean;
    statusLabel: string;
    previewUrl: string | null;
    reality: LivePreviewRealityAssessment;
    activeSession: {
      previewSessionId: string;
      projectId: string;
      previewState: string;
      previewUrl: string | null;
      previewTargetName: string;
      previewCapabilities: string[];
      warnings: string[];
      blockedReasons: string[];
      createdAt: number;
    } | null;
    sessions: Array<{
      previewSessionId: string;
      projectId: string;
      previewState: string;
      previewUrl: string | null;
      previewTargetName: string;
      previewCapabilities: string[];
      warnings: string[];
      blockedReasons: string[];
      createdAt: number;
    }>;
    targets: Array<{ targetName: string; targetType: string }>;
    diagnostics: {
      previewRuntimeActive: boolean;
      previewSessionCount: number;
      registeredTargetCount: number;
      readyPreviewCount: number;
      blockedPreviewCount: number;
    };
    buildStatus: string;
    lastVerificationHint: string | null;
  };
  runningApplication: RunningApplicationVisibilityAssessment;
  verificationResults: VerificationResultsVisibilityAssessment;
  changeIntelligence: ChangeIntelligenceVisibilityAssessment;
  founderActionCenter: FounderActionCenterAssessment;
  founderSensemaking: FounderSensemakingAssessment;
  verification: {
    readiness: 'ready' | 'partial' | 'idle';
    readinessLabel: string;
    validatorCount: number;
    uvlCheckCount: number;
    capabilityCount: number;
    latestResultHint: string;
    runHint: string;
  };
  autonomousBuilder: {
    description: string;
    readiness: 'foundation' | 'partial' | 'active';
    readinessLabel: string;
    world2FoundationComplete: boolean;
    executionConnected: boolean;
  };
  projects: {
    count: number;
    activeCount: number;
    items: Array<{ projectId: string; name: string; status: string; summary: string }>;
  };
  notifications: {
    items: string[];
  };
  runtime: {
    brainConnected: boolean;
    localRuntimeConnected: boolean;
    workspacesConnected: string[];
    workspacesDisconnected: string[];
  };
  portfolioInsights: PortfolioInsightsDemo;
}

export type ProductWorkspaceSnapshotWithoutSensemaking = Omit<ProductWorkspaceSnapshot, 'founderSensemaking'>;

export function buildProductWorkspaceSnapshot(validatorScripts: string[]): ProductWorkspaceSnapshot {
  const vault = getDevPulseV2ProjectVaultAuthority();
  const vaultState = vault.getVaultState();
  const projects = vault.listProjects();

  const sessions = listPreviewSessions();
  const targets = listPreviewTargets();
  const previewDiag = getPreviewRuntimeDiagnostics();

  const readySession =
    sessions.find((s) => s.previewState === 'PREVIEW_READY') ??
    sessions.find((s) => s.previewUrl) ??
    sessions[0] ??
    null;

  const previewUrl = readySession?.previewUrl ?? null;
  const previewConnected = sessions.length > 0 || targets.length > 0;

  const livePreviewSessions = sessions.map((s) => ({
    previewSessionId: s.previewSessionId,
    projectId: s.projectId,
    previewState: s.previewState,
    previewUrl: s.previewUrl,
    previewTargetName: s.previewTargetName,
    previewCapabilities: [...s.previewCapabilities],
    warnings: [...s.warnings],
    blockedReasons: [...s.blockedReasons],
    createdAt: s.createdAt,
  }));

  const livePreviewActiveSession = readySession
    ? {
        previewSessionId: readySession.previewSessionId,
        projectId: readySession.projectId,
        previewState: readySession.previewState,
        previewUrl: readySession.previewUrl,
        previewTargetName: readySession.previewTargetName,
        previewCapabilities: [...readySession.previewCapabilities],
        warnings: [...readySession.warnings],
        blockedReasons: [...readySession.blockedReasons],
        createdAt: readySession.createdAt,
      }
    : null;

  const nextSuggestedActions: string[] = [];
  if (projects.length === 0) {
    nextSuggestedActions.push('Start or select a project in Command Center to populate Project Memory.');
  } else {
    nextSuggestedActions.push('Ask Command Center about project status, risks, or next build steps.');
  }
  if (!previewConnected) {
    nextSuggestedActions.push('Start or select a project to launch a live preview.');
  }
  if (validatorScripts.length > 0) {
    nextSuggestedActions.push('Run verification checks manually via npm when validating changes.');
  }

  const workspacesDisconnected: string[] = [];
  const workspacesConnected: string[] = ['Command Center', 'Project Insights'];
  if (!previewDiag.previewRuntimeActive && sessions.length === 0) {
    workspacesDisconnected.push('Live Preview');
  } else {
    workspacesConnected.push('Live Preview');
  }
  workspacesDisconnected.push('Autonomous Builder execution');

  const projectMemoryBlock = {
    description: PROJECT_MEMORY_DESCRIPTION,
    vaultState: {
      projectCount: vaultState.projectCount,
      activeProjectCount: vaultState.activeProjectCount,
      factCount: vaultState.factCount,
      snapshotCount: vaultState.snapshotCount,
      latestProjectId: vaultState.latestProjectId,
      warnings: vaultState.warnings,
    },
    projects: projects.map((p) => ({
      projectId: p.projectId,
      name: p.name,
      status: p.status,
      phase: p.phase,
      summary: p.summary,
      factCount: p.facts.length,
      warnings: p.warnings,
      recentFacts: p.facts.slice(-5).map((f) => `${f.label}: ${f.value}`),
    })),
    nextSuggestedActions,
  };

  const livePreviewBlock = (() => {
    const previewDiagnostics = {
      previewRuntimeActive: previewDiag.previewRuntimeActive,
      previewSessionCount: previewDiag.previewSessionCount,
      registeredTargetCount: previewDiag.registeredTargetCount,
      readyPreviewCount: previewDiag.readyPreviewCount,
      blockedPreviewCount: previewDiag.blockedPreviewCount,
    };
    const reality = assessLivePreviewReality({
      uiSurfacePresent: true,
      connected: previewConnected,
      previewUrl,
      activeSession: livePreviewActiveSession,
      sessions: livePreviewSessions,
      diagnostics: previewDiagnostics,
      latestProjectId: vaultState.latestProjectId,
      projectCount: vaultState.projectCount,
      generatedAt: Date.now(),
    });
    return {
      connected: previewConnected,
      statusLabel: reality.displayLabel,
      previewUrl,
      reality,
      activeSession: livePreviewActiveSession,
      sessions: livePreviewSessions,
      targets: targets.map((t) => ({ targetName: t.targetName, targetType: t.targetType })),
      diagnostics: previewDiagnostics,
      buildStatus: previewDiag.lastState
        ? `Last preview state: ${previewDiag.lastState}`
        : 'No build output reported yet',
      lastVerificationHint: previewDiag.readyPreviewCount > 0 ? 'Preview gates passed for ready sessions' : null,
    };
  })();

  const runningApplicationDraft = {
    productBrand: 'AiDevEngine' as const,
    generatedAt: Date.now(),
    projectMemory: projectMemoryBlock,
    livePreview: livePreviewBlock,
    verification: {
      readiness: (validatorScripts.length > 0 ? 'ready' : 'idle') as 'ready' | 'partial' | 'idle',
      readinessLabel:
        validatorScripts.length > 0
          ? `${validatorScripts.length} verification scripts available — run manually via npm`
          : 'Verification scripts not loaded',
      validatorCount: validatorScripts.length,
      uvlCheckCount: ALL_UVL_ROWS.length,
      capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
      latestResultHint: 'Latest results are produced when you run npm run validate:* scripts locally.',
      runHint: 'Example: npm run validate:shell or npm run validate:product-hardening-verification',
    },
    autonomousBuilder: {
      description: AUTONOMOUS_BUILDER_DESCRIPTION,
      readiness: 'foundation' as const,
      readinessLabel: 'Foundation complete — isolated workspace execution not fully active',
      world2FoundationComplete: true,
      executionConnected: false,
    },
    projects: {
      count: projects.length,
      activeCount: vaultState.activeProjectCount,
      items: projects.map((p) => ({
        projectId: p.projectId,
        name: p.name,
        status: p.status,
        summary: p.summary,
      })),
    },
    notifications: { items: [] as string[] },
    runtime: {
      brainConnected: true,
      localRuntimeConnected: true,
      workspacesConnected,
      workspacesDisconnected,
    },
    portfolioInsights: buildPortfolioInsightsDemo(),
    runningApplication: {} as RunningApplicationVisibilityAssessment,
  };

  const runningApplication = assessRunningApplicationVisibility({
    generatedAt: runningApplicationDraft.generatedAt,
    previewRealityState: livePreviewBlock.reality.state,
    previewReality: {
      validationReady: livePreviewBlock.reality.validationReady,
      freshness: livePreviewBlock.reality.freshness,
      interactivity: livePreviewBlock.reality.interactivity,
      loadReality: livePreviewBlock.reality.loadReality,
      problems: livePreviewBlock.reality.problems,
    },
    activeSession: livePreviewActiveSession
      ? {
          previewSessionId: livePreviewActiveSession.previewSessionId,
          projectId: livePreviewActiveSession.projectId,
          previewState: livePreviewActiveSession.previewState,
          previewUrl: livePreviewActiveSession.previewUrl,
          previewTargetName: livePreviewActiveSession.previewTargetName,
          createdAt: livePreviewActiveSession.createdAt,
          warnings: livePreviewActiveSession.warnings,
          blockedReasons: livePreviewActiveSession.blockedReasons,
        }
      : null,
    previewUrl,
    buildStatus: livePreviewBlock.buildStatus,
    latestProjectId: vaultState.latestProjectId,
    projectCount: vaultState.projectCount,
    projectName:
      projects.find((p) => p.projectId === vaultState.latestProjectId)?.name ?? projects[0]?.name ?? null,
    recentChangeSummary: (() => {
      const latest =
        projects.find((p) => p.projectId === vaultState.latestProjectId) ?? projects[0] ?? null;
      if (!latest) return null;
      const facts = latest.facts.slice(-1).map((f) => `${f.label}: ${f.value}`);
      return facts.length > 0 ? `Latest known change: ${facts[0]}` : latest.summary;
    })(),
    targetType: targets[0]?.targetType ?? null,
  });

  const verificationResults = buildVerificationResultsFromWorkspace({
    productBrand: 'AiDevEngine',
    generatedAt: Date.now(),
    projectMemory: projectMemoryBlock,
    livePreview: livePreviewBlock,
    runningApplication,
    verificationResults: {} as VerificationResultsVisibilityAssessment,
    changeIntelligence: {} as ChangeIntelligenceVisibilityAssessment,
    founderActionCenter: {} as FounderActionCenterAssessment,
    verification: runningApplicationDraft.verification,
    autonomousBuilder: runningApplicationDraft.autonomousBuilder,
    projects: runningApplicationDraft.projects,
    notifications: runningApplicationDraft.notifications,
    runtime: runningApplicationDraft.runtime,
    portfolioInsights: runningApplicationDraft.portfolioInsights,
  });

  const workspaceDraft = {
    productBrand: 'AiDevEngine' as const,
    generatedAt: Date.now(),
    projectMemory: projectMemoryBlock,
    livePreview: livePreviewBlock,
    runningApplication,
    verificationResults,
    changeIntelligence: {} as ChangeIntelligenceVisibilityAssessment,
    founderActionCenter: {} as FounderActionCenterAssessment,
    verification: runningApplicationDraft.verification,
    autonomousBuilder: runningApplicationDraft.autonomousBuilder,
    projects: runningApplicationDraft.projects,
    notifications: runningApplicationDraft.notifications,
    runtime: runningApplicationDraft.runtime,
    portfolioInsights: runningApplicationDraft.portfolioInsights,
  };

  recordWorkspaceChangeSnapshot(workspaceDraft, 'Workspace snapshot');
  const changeIntelligence = assessChangeIntelligenceVisibility(getChangeIntelligenceHistory());

  const workspaceWithChange = {
    ...workspaceDraft,
    changeIntelligence,
  };

  const founderActionCenter = assessFounderActionCenter(workspaceWithChange);

  const workspaceComplete = {
    ...workspaceWithChange,
    founderActionCenter,
  };

  const cacheKey = buildSensemakingCacheKey({
    projectMemory: workspaceComplete.projectMemory,
    changeIntelligence: workspaceComplete.changeIntelligence,
    founderActionCenter: workspaceComplete.founderActionCenter,
    verificationResults: workspaceComplete.verificationResults,
  });
  const cachedSensemaking = getCachedFounderSensemaking(cacheKey);
  if (cachedSensemaking) {
    return { ...workspaceComplete, founderSensemaking: cachedSensemaking };
  }

  let shellSources: { appJs: string; html: string } | undefined;
  try {
    const publicDir = join(process.cwd(), 'public', 'founder-reality');
    shellSources = {
      appJs: readFileSync(join(publicDir, 'app.js'), 'utf8'),
      html: readFileSync(join(publicDir, 'index.html'), 'utf8'),
    };
  } catch {
    shellSources = undefined;
  }

  const founderSensemaking = assessFounderSensemaking(
    {
      projectMemory: workspaceComplete.projectMemory,
      livePreview: workspaceComplete.livePreview,
      runningApplication: workspaceComplete.runningApplication,
      verificationResults: workspaceComplete.verificationResults,
      changeIntelligence: workspaceComplete.changeIntelligence,
      founderActionCenter: workspaceComplete.founderActionCenter,
      verification: workspaceComplete.verification,
      autonomousBuilder: workspaceComplete.autonomousBuilder,
      portfolioInsights: workspaceComplete.portfolioInsights,
      shellSources,
    },
  );
  setCachedFounderSensemaking(cacheKey, founderSensemaking);

  return {
    ...workspaceComplete,
    founderSensemaking,
  };
}
