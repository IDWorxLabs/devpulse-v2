/**
 * Execution Reality Engine — read-only product delivery verification.
 * Aggregates workspace snapshot, shell signals, and bounded brain prompts.
 */

import { processBrainRequest } from '../command-center-brain/index.js';
import { getSelfVisionRuntimeDiagnostics } from '../self-vision-runtime/self-vision-runtime-diagnostics.js';
import {
  assessLivePreviewReality,
  buildLivePreviewRealityInputFromWorkspace,
} from '../live-preview-reality/index.js';
import { assessRunningApplicationVisibilityFromWorkspace } from '../running-application-visibility/index.js';
import type { ChangeIntelligenceVisibilityAssessment } from '../change-intelligence-visibility/change-intelligence-visibility-types.js';
import type { VerificationResultsVisibilityAssessment } from '../verification-results-visibility/verification-results-visibility-types.js';
import type { ProductWorkspaceSnapshot } from '../../server/product-workspace-snapshot.js';
import { buildProductWorkspaceSnapshot } from '../../server/product-workspace-snapshot.js';
import { assessArchitectureLeakage } from './founder-proxy-architecture-leakage.js';
import {
  CREATION_JOURNEY_STAGES,
  IDEA_TO_APP_PROMPTS,
  PRODUCT_PROMISES,
} from './founder-testing-v4-bounds.js';
import type {
  AutonomousBuilderReality,
  CreationJourneyStageResult,
  IdeaToAppResult,
  JourneyStageStatus,
  OutcomeSimulation,
  PreviewReality,
  RunningAppVisibility,
  VerificationResultsVisibility,
  ChangeIntelligenceVisibility,
  ProjectMemoryReality,
  PromiseRealityEntry,
  PromiseSupportLevel,
  RealityGap,
  RealityGapType,
  VerificationReality,
} from './founder-testing-v4-types.js';
import type { ScreenCheckSources } from './founder-testing-screen-checker.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function stageStatus(partial: boolean, exists: boolean): JourneyStageStatus {
  if (exists && !partial) return 'Exists';
  if (exists || partial) return 'Partially Exists';
  return 'Missing';
}

export function evaluateCreationJourney(
  sources: ScreenCheckSources,
  workspace: ProductWorkspaceSnapshot,
): { stages: CreationJourneyStageResult[]; score: number } {
  const { appJs, html } = sources;
  const stages: CreationJourneyStageResult[] = [];

  const add = (stage: string, exists: boolean, partial: boolean, evidence: string) => {
    stages.push({ stage, status: stageStatus(partial, exists), evidence });
  };

  add('Idea', html.includes('chat-input') && appJs.includes('askBrain'), false, 'Command Center accepts ideas');
  add(
    'Project',
    appJs.includes('renderProjectsSurface') || workspace.projects.count > 0,
    workspace.projects.count === 0,
    workspace.projects.count > 0 ? `${workspace.projects.count} projects tracked` : 'Projects surface without stored projects',
  );
  add('Planning', appJs.includes('Command Center') && appJs.includes('roadmap'), true, 'Brain planning routes exist');
  add('Requirements', appJs.includes('requirement') || appJs.includes('Project Memory'), true, 'Requirements via memory/brain partial');
  add('Architecture', appJs.includes('architecture') || html.includes('System Diagnostics'), true, 'Architecture visibility internal-heavy');
  add('Tasks', appJs.includes('Autonomous Builder') || appJs.includes('build task'), false, 'Task surfaces partial');
  add(
    'Build',
    workspace.autonomousBuilder.executionConnected,
    workspace.autonomousBuilder.world2FoundationComplete,
    workspace.autonomousBuilder.executionConnected
      ? 'Execution connected'
      : 'Foundation only — execution not connected',
  );
  const previewRealityState = workspace.livePreview.reality?.state ?? 'NO_PREVIEW';
  add(
    'Preview',
    workspace.livePreview.reality?.validationReady === true,
    previewRealityState === 'PREVIEW_STARTING' ||
      previewRealityState === 'PREVIEW_LOADING' ||
      previewRealityState === 'PREVIEW_VISIBLE' ||
      previewRealityState === 'PREVIEW_INTERACTIVE' ||
      previewRealityState === 'PREVIEW_DEGRADED' ||
      previewRealityState === 'PREVIEW_STALE',
    workspace.livePreview.reality?.displayLabel ?? workspace.livePreview.statusLabel,
  );
  add(
    'Verification',
    workspace.verification.validatorCount > 0,
    workspace.verification.readiness !== 'ready',
    workspace.verification.readinessLabel,
  );
  add(
    'Launch Readiness',
    appJs.includes('Founder Test') || appJs.includes('launch'),
    true,
    'Founder testing + launch signals partial',
  );

  const weights: Record<JourneyStageStatus, number> = {
    Exists: 10,
    'Partially Exists': 6,
    Missing: 0,
  };
  const score = clamp(stages.reduce((s, st) => s + weights[st.status], 0));
  return { stages, score };
}

function evaluateIdeaPrompt(prompt: string, response: string): Omit<IdeaToAppResult, 'prompt' | 'responsePreview'> {
  const r = response.trim();
  const leakage = assessArchitectureLeakage(r);
  const understandsRequest = r.length >= 40 && /\b(crm|portal|service|commerce|dispatch|app|build)\b/i.test(r);
  const canCreateProject = /\b(project|create|start|new)\b/i.test(r);
  const canCreateRequirements = /\b(requirement|spec|feature|scope)\b/i.test(r);
  const canCreatePlan = /\b(plan|roadmap|step|phase|strategy)\b/i.test(r);
  const routesToExecution = /\b(build|execute|autonomous|implement)\b/i.test(r);
  const routesToVerification = /\b(verify|verification|validate|test|quality)\b/i.test(r);
  const explainsNextSteps = /\b(next|start|ask|open|try|recommend)\b/i.test(r);
  const issues: string[] = [];
  if (!understandsRequest) issues.push('Request understanding weak');
  if (!explainsNextSteps) issues.push('Next steps unclear');
  if (leakage.level === 'CRITICAL' || leakage.level === 'HIGH') {
    issues.push(`Architecture-heavy response (${leakage.level})`);
  }
  if (!routesToExecution) issues.push('No clear route toward execution');
  const checks = [
    understandsRequest,
    canCreateProject,
    canCreateRequirements,
    canCreatePlan,
    routesToExecution,
    routesToVerification,
    explainsNextSteps,
  ];
  const ideaToAppScore = clamp((checks.filter(Boolean).length / checks.length) * 100 - (issues.length > 2 ? 15 : 0));
  return {
    understandsRequest,
    canCreateProject,
    canCreateRequirements,
    canCreatePlan,
    routesToExecution,
    routesToVerification,
    explainsNextSteps,
    ideaToAppScore,
    issues,
  };
}

export function evaluateIdeaToAppPrompts(deadlineMs: number): IdeaToAppResult[] {
  const results: IdeaToAppResult[] = [];
  const start = Date.now();
  for (const prompt of IDEA_TO_APP_PROMPTS) {
    if (Date.now() - start > deadlineMs) break;
    try {
      const brain = processBrainRequest({ message: prompt, timestamp: Date.now() });
      const response = brain.brainResponse ?? '';
      const eval_ = evaluateIdeaPrompt(prompt, response);
      results.push({
        prompt,
        responsePreview: response.slice(0, 240) + (response.length > 240 ? '…' : ''),
        ...eval_,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'brain failed';
      results.push({
        prompt,
        responsePreview: '',
        understandsRequest: false,
        canCreateProject: false,
        canCreateRequirements: false,
        canCreatePlan: false,
        routesToExecution: false,
        routesToVerification: false,
        explainsNextSteps: false,
        ideaToAppScore: 0,
        issues: [message],
      });
    }
  }
  return results;
}

export function evaluateAutonomousBuilderReality(workspace: ProductWorkspaceSnapshot): AutonomousBuilderReality {
  const ab = workspace.autonomousBuilder;
  const canPlanWork = ab.world2FoundationComplete;
  const canCreateRequirements = ab.world2FoundationComplete;
  const canCreateArchitecture = ab.world2FoundationComplete;
  const canCreateTasks = false;
  const canCoordinateSystems = ab.world2FoundationComplete;
  const canCreatePreviews = workspace.livePreview.connected;
  const canExecuteBuilds = ab.executionConnected;
  const canVerifyOutputs = workspace.verification.validatorCount > 0;

  const capabilities = [
    canPlanWork,
    canCreateRequirements,
    canCreateArchitecture,
    canCreateTasks,
    canCoordinateSystems,
    canCreatePreviews,
    canExecuteBuilds,
    canVerifyOutputs,
  ];
  const score = clamp((capabilities.filter(Boolean).length / capabilities.length) * 100);

  return {
    score,
    canPlanWork,
    canCreateRequirements,
    canCreateArchitecture,
    canCreateTasks,
    canCoordinateSystems,
    canCreatePreviews,
    canExecuteBuilds,
    canVerifyOutputs,
    honestyNote: ab.readinessLabel,
  };
}

export function evaluateProjectMemoryReality(workspace: ProductWorkspaceSnapshot): ProjectMemoryReality {
  const pm = workspace.projectMemory;
  const vs = pm.vaultState;
  const retainsContext = vs.projectCount > 0 || vs.factCount > 0;
  const recallsRequirements = vs.factCount > 0;
  const understandsState = pm.projects.some((p) => p.summary.length > 0);
  const plansFutureWork = pm.nextSuggestedActions.length > 0;
  const referencesVerificationHistory = vs.snapshotCount > 0;

  const checks = [retainsContext, recallsRequirements, understandsState, plansFutureWork, referencesVerificationHistory];
  return {
    score: clamp((checks.filter(Boolean).length / checks.length) * 100),
    retainsContext,
    recallsRequirements,
    understandsState,
    plansFutureWork,
    referencesVerificationHistory,
  };
}

export function evaluateRunningAppVisibility(
  workspace: ProductWorkspaceSnapshot,
  sources: ScreenCheckSources,
): RunningAppVisibility {
  const visibility =
    workspace.runningApplication ?? assessRunningApplicationVisibilityFromWorkspace(workspace);
  const uiPresent =
    sources.appJs.includes('running-application-visibility') &&
    sources.appJs.includes('Running Application') &&
    sources.appJs.includes('OUTPUT_');

  const checks = [
    visibility.identifiable || visibility.outputState === 'NO_RUNNING_APP',
    visibility.outputStateExplicit && uiPresent,
    visibility.buildOutputVisible || visibility.outputState === 'NO_RUNNING_APP',
    visibility.alignmentHonest,
    visibility.testReadinessExplicit,
    visibility.readyForTesting || visibility.outputState !== 'OUTPUT_READY_FOR_TESTING',
  ];

  return {
    score: clamp((checks.filter(Boolean).length / checks.length) * 100),
    outputState: visibility.outputState,
    identifiablePass: visibility.identifiable || visibility.outputState === 'NO_RUNNING_APP',
    outputStateExplicitPass: visibility.outputStateExplicit && uiPresent,
    buildOutputVisiblePass: visibility.buildOutputVisible || visibility.outputState === 'NO_RUNNING_APP',
    alignmentHonestPass: visibility.alignmentHonest,
    testReadinessExplicitPass: visibility.testReadinessExplicit,
    staleDetected: visibility.staleDetected,
    degradedDetected: visibility.degradedDetected,
    readyForTestingPass: visibility.readyForTesting,
    runningAppTitle: visibility.runningAppTitle,
    requestAlignment: visibility.requestAlignment,
    testReadiness: visibility.testReadiness,
    alignmentReason: visibility.alignmentReason,
    testReadinessReason: visibility.testReadinessReason,
    recommendedAction: visibility.recommendedAction,
    warnings: visibility.warnings,
  };
}

export function evaluateFounderActionCenterVisibility(
  assessment: import('../founder-action-center/founder-action-center-types.js').FounderActionCenterAssessment,
  sources: ScreenCheckSources,
): import('./founder-testing-v4-types.js').FounderActionCenterVisibility {
  const uiPresent =
    sources.appJs.includes('founder-action-center-visibility') &&
    sources.appJs.includes('Founder Action Center') &&
    sources.appJs.includes('Recommended Next Step') &&
    sources.appJs.includes('Top Actions');

  const checks = [
    assessment.actionsGenerated || assessment.insufficientInfo,
    assessment.prioritiesVisible && sources.appJs.includes('action-priority'),
    assessment.blockersVisible && sources.appJs.includes('Action Blockers'),
    assessment.rationaleVisible && sources.appJs.includes('Reason'),
    assessment.impactVisible && sources.appJs.includes('Execution Impact'),
    assessment.recommendationsActionable || assessment.state === 'NO_ACTIONS',
    assessment.noDuplicates,
    assessment.noTechnicalOnly,
    uiPresent,
  ];

  return {
    score: clamp((checks.filter(Boolean).length / checks.length) * 100),
    state: assessment.state,
    actionsExistPass: assessment.actionsGenerated || assessment.insufficientInfo,
    prioritiesVisiblePass: assessment.prioritiesVisible && sources.appJs.includes('action-priority'),
    blockersVisiblePass: assessment.blockersVisible && sources.appJs.includes('Action Blockers'),
    rationaleVisiblePass: assessment.rationaleVisible && sources.appJs.includes('Reason'),
    impactVisiblePass: assessment.impactVisible && sources.appJs.includes('Execution Impact'),
    recommendationsActionablePass: assessment.recommendationsActionable || assessment.state === 'NO_ACTIONS',
    noDuplicatesPass: assessment.noDuplicates,
    noTechnicalOnlyPass: assessment.noTechnicalOnly,
    topActionCount: assessment.topActions.length,
    blockerCount: assessment.blockers.length,
    recommendedNextStep: assessment.recommendedNextStep?.title ?? null,
  };
}

export function evaluateChangeIntelligenceVisibility(
  assessment: ChangeIntelligenceVisibilityAssessment,
  sources: ScreenCheckSources,
): ChangeIntelligenceVisibility {
  const uiPresent =
    sources.appJs.includes('change-intelligence-visibility') &&
    sources.appJs.includes('Change Intelligence') &&
    sources.appJs.includes('change-intelligence-timeline');

  const checks = [
    assessment.historyExists,
    assessment.improvementsVisible && sources.appJs.includes('Recent Changes'),
    assessment.regressionsVisible && sources.appJs.includes('Regressions'),
    assessment.readinessExplained || !assessment.hasSufficientHistory,
    assessment.scoreExplained || !assessment.hasSufficientHistory,
    assessment.timelineUnderstandable && uiPresent,
    assessment.recommendationsPrioritized && sources.appJs.includes('Recommended Review Order'),
  ];

  return {
    score: clamp((checks.filter(Boolean).length / checks.length) * 100),
    hasSufficientHistory: assessment.hasSufficientHistory,
    historyExistsPass: assessment.historyExists,
    improvementsVisiblePass: assessment.improvementsVisible && sources.appJs.includes('Recent Changes'),
    regressionsVisiblePass: assessment.regressionsVisible && sources.appJs.includes('Regressions'),
    readinessExplainedPass: assessment.readinessExplained || !assessment.hasSufficientHistory,
    scoreExplainedPass: assessment.scoreExplained || !assessment.hasSufficientHistory,
    timelineUnderstandablePass: assessment.timelineUnderstandable && uiPresent,
    recommendationsPrioritizedPass: assessment.recommendationsPrioritized && sources.appJs.includes('Recommended Review Order'),
    improvementCount: assessment.impactSummary.improvementCount,
    regressionCount: assessment.impactSummary.regressionCount,
    recommendedReviewOrder: assessment.recommendedReviewOrder,
  };
}

export function evaluateVerificationResultsVisibility(
  assessment: VerificationResultsVisibilityAssessment,
  sources: ScreenCheckSources,
): VerificationResultsVisibility {
  const uiPresent =
    sources.appJs.includes('verification-results-visibility') &&
    sources.appJs.includes('Verification State') &&
    sources.appJs.includes('What Was Tested');

  const checks = [
    assessment.stateExplicit && uiPresent,
    assessment.countsVisible && sources.appJs.includes('Passed:'),
    assessment.categoriesGrouped && sources.appJs.includes('verification-category-group'),
    assessment.evidencePresent,
    assessment.nextActionVisible && sources.appJs.includes('Issues to Fix Next'),
    assessment.readinessExplained,
    !assessment.optimisticReadiness,
  ];

  return {
    score: clamp((checks.filter(Boolean).length / checks.length) * 100),
    state: assessment.state,
    stateExplicitPass: assessment.stateExplicit && uiPresent,
    countsVisiblePass: assessment.countsVisible && sources.appJs.includes('Passed:'),
    categoriesGroupedPass: assessment.categoriesGrouped && sources.appJs.includes('verification-category-group'),
    evidencePresentPass: assessment.evidencePresent,
    nextActionVisiblePass: assessment.nextActionVisible && sources.appJs.includes('Issues to Fix Next'),
    readinessExplainedPass: assessment.readinessExplained,
    noOptimisticReadinessPass: !assessment.optimisticReadiness,
    passCount: assessment.summary.passCount,
    failCount: assessment.summary.failCount,
    blockedCount: assessment.summary.blockedCount,
    warningCount: assessment.summary.warningCount,
    betaReady: assessment.betaReady,
    launchReady: assessment.launchReady,
    fixesNext: assessment.fixesNext.map((f) => f.title),
  };
}

export function evaluatePreviewReality(
  workspace: ProductWorkspaceSnapshot,
  sources: ScreenCheckSources,
): PreviewReality {
  const lp = workspace.livePreview;
  const uiSurfacePresent =
    sources.appJs.includes('live-preview-surface') &&
    sources.appJs.includes('renderLivePreviewSurface') &&
    sources.appJs.includes('live-preview-reality');
  const assessment = assessLivePreviewReality({
    ...buildLivePreviewRealityInputFromWorkspace(workspace, uiSurfacePresent),
  });

  const launchPathExists = uiSurfacePresent;
  const stateUnderstandable =
    sources.appJs.includes('Live Preview Status') &&
    sources.appJs.includes('PREVIEW_') &&
    (sources.appJs.includes('No Live Preview Running') || !!lp.statusLabel);
  const readinessVisible =
    sources.appJs.includes('live-preview-reality-summary') && sources.appJs.includes('Recommended Action');
  const connectedToLifecycle = sources.appJs.includes('project') && launchPathExists;

  const dimensionChecks = [
    assessment.availability.passed,
    assessment.loadReality.passed,
    assessment.interactivity.passed,
    assessment.freshness.passed,
    assessment.validationReady,
  ];
  const legacyChecks = [launchPathExists, stateUnderstandable, readinessVisible, connectedToLifecycle];
  const score = clamp(
    (dimensionChecks.filter(Boolean).length / dimensionChecks.length) * 70 +
      (legacyChecks.filter(Boolean).length / legacyChecks.length) * 30,
  );

  return {
    score,
    state: assessment.state,
    existsPass: assessment.availability.passed,
    loadsPass: assessment.loadReality.passed,
    interactivePass: assessment.interactivity.passed,
    currentPass: assessment.freshness.passed,
    validationReadyPass: assessment.validationReady,
    problems: assessment.problems,
    recommendedActions: assessment.recommendedActions,
    summaryLines: assessment.summaryLines,
    falsePositiveReadiness: assessment.falsePositiveReadiness,
    launchPathExists,
    stateUnderstandable,
    readinessVisible,
    connectedToLifecycle,
  };
}

export function evaluateVerificationReality(
  workspace: ProductWorkspaceSnapshot,
  sources: ScreenCheckSources,
): VerificationReality {
  const v = workspace.verification;
  const pathExists = sources.appJs.includes('verification-surface') && v.validatorCount > 0;
  const resultsUnderstandable = sources.appJs.includes('Verification Readiness');
  const actionsProvided = sources.appJs.includes('Run Verification') || sources.appJs.includes('npm run validate');
  const launchReadinessSupported = v.uvlCheckCount > 0;

  const checks = [pathExists, resultsUnderstandable, actionsProvided, launchReadinessSupported];
  return {
    score: clamp((checks.filter(Boolean).length / checks.length) * 100),
    pathExists,
    resultsUnderstandable,
    actionsProvided,
    launchReadinessSupported,
  };
}

export function buildPromiseRealityMatrix(
  workspace: ProductWorkspaceSnapshot,
  sources: ScreenCheckSources,
  ideaResults: IdeaToAppResult[],
): PromiseRealityEntry[] {
  const selfVision = getSelfVisionRuntimeDiagnostics();
  return PRODUCT_PROMISES.map((p) => {
    let support: PromiseSupportLevel = 'NOT_SUPPORTED';
    let evidence = 'No supporting signals detected';

    if (p.id === 'ai-planning') {
      const ok = ideaResults.some((r) => r.canCreatePlan) && sources.appJs.includes('askBrain');
      support = ok ? 'PARTIALLY_SUPPORTED' : 'NOT_SUPPORTED';
      evidence = ok ? 'Brain planning routes and plan language in idea prompts' : 'Planning not end-to-end';
    } else if (p.id === 'ai-validation') {
      support = workspace.verification.validatorCount > 0 ? 'PARTIALLY_SUPPORTED' : 'NOT_SUPPORTED';
      evidence = workspace.verification.readinessLabel;
    } else if (p.id === 'ai-execution') {
      support = workspace.autonomousBuilder.executionConnected ? 'SUPPORTED' : 'NOT_SUPPORTED';
      evidence = workspace.autonomousBuilder.readinessLabel;
    } else if (p.id === 'autonomous-dev') {
      const partial = workspace.autonomousBuilder.world2FoundationComplete;
      support = workspace.autonomousBuilder.executionConnected ? 'PARTIALLY_SUPPORTED' : partial ? 'PARTIALLY_SUPPORTED' : 'NOT_SUPPORTED';
      evidence = 'Foundation exists; full autonomous delivery not active';
    } else if (p.id === 'project-understanding') {
      support = workspace.projectMemory.vaultState.factCount > 0 ? 'PARTIALLY_SUPPORTED' : 'PARTIALLY_SUPPORTED';
      evidence = `Vault: ${workspace.projectMemory.vaultState.projectCount} projects, ${workspace.projectMemory.vaultState.factCount} facts`;
    } else if (p.id === 'verification') {
      support = workspace.verification.readiness === 'ready' ? 'PARTIALLY_SUPPORTED' : 'PARTIALLY_SUPPORTED';
      evidence = 'Manual npm verification — not auto-run from UI';
    } else if (p.id === 'preview') {
      const reality = workspace.livePreview.reality;
      if (reality?.validationReady) {
        support = 'SUPPORTED';
      } else if (reality?.loadReality.passed || reality?.availability.passed) {
        support = 'PARTIALLY_SUPPORTED';
      } else {
        support = 'NOT_SUPPORTED';
      }
      evidence = reality?.displayLabel ?? workspace.livePreview.statusLabel;
    }

    if (p.id === 'preview' && selfVision.selfVisionRuntimeActive) {
      evidence += '; Self Vision runtime active';
    }

    return { promiseId: p.id, label: p.label, support, evidence };
  });
}

export function detectRealityGaps(
  promiseMatrix: PromiseRealityEntry[],
  workspace: ProductWorkspaceSnapshot,
  journey: CreationJourneyStageResult[],
): RealityGap[] {
  const gaps: RealityGap[] = [];

  const executionPromise = promiseMatrix.find((p) => p.promiseId === 'ai-execution');
  if (executionPromise?.support === 'NOT_SUPPORTED') {
    gaps.push({
      gapType: 'EXECUTION_GAP',
      promise: 'AiDevEngine builds and executes software',
      reality: workspace.autonomousBuilder.readinessLabel,
      detail: 'Planning exists; connected execution does not',
    });
  }

  const buildStage = journey.find((s) => s.stage === 'Build');
  if (buildStage?.status === 'Partially Exists' || buildStage?.status === 'Missing') {
    gaps.push({
      gapType: 'EXECUTION_GAP',
      promise: 'End-to-end build delivery',
      reality: buildStage.evidence,
      detail: 'Build stage not fully operational',
    });
  }

  const previewReality = workspace.livePreview.reality;
  if (previewReality && !previewReality.validationReady) {
    const detail =
      previewReality.state === 'PREVIEW_STALE'
        ? 'Preview does not reflect latest project changes'
        : previewReality.state === 'PREVIEW_DEGRADED'
          ? 'Preview loaded but interaction or runtime checks failed'
          : previewReality.state === 'NO_PREVIEW'
            ? 'No live preview available for validation'
            : previewReality.problems[0] ?? 'Live preview is not validation-ready';
    gaps.push({
      gapType: 'WORKFLOW_GAP',
      promise: 'Live preview of built software',
      reality: previewReality.displayLabel,
      detail,
    });
  }

  if (workspace.verification.readinessLabel.includes('manually')) {
    gaps.push({
      gapType: 'WORKFLOW_GAP',
      promise: 'Integrated verification',
      reality: 'Manual npm scripts required',
      detail: 'Verification not surfaced as one-click product workflow',
    });
  }

  const autonomous = promiseMatrix.find((p) => p.promiseId === 'autonomous-dev');
  if (autonomous?.support !== 'SUPPORTED') {
    gaps.push({
      gapType: 'INTELLIGENCE_GAP',
      promise: 'Autonomous software development',
      reality: autonomous?.evidence ?? 'Partial foundation',
      detail: 'Product language ahead of execution reality',
    });
  }

  const launchStage = journey.find((s) => s.stage === 'Launch Readiness');
  if (launchStage?.status !== 'Exists') {
    gaps.push({
      gapType: 'LAUNCH_GAP',
      promise: 'Launch-ready product delivery',
      reality: launchStage?.evidence ?? 'Launch signals partial',
      detail: 'Launch readiness tooling exists; delivery path incomplete',
    });
  }

  if (workspace.projectMemory.vaultState.projectCount === 0) {
    gaps.push({
      gapType: 'FOUNDATION_GAP',
      promise: 'Persistent project context',
      reality: 'Empty project memory for new users',
      detail: 'Users must populate memory before full lifecycle benefits',
    });
  }

  return gaps;
}

export function simulateFounderOutcome(
  ideaResults: IdeaToAppResult[],
  workspace: ProductWorkspaceSnapshot,
  gaps: RealityGap[],
): OutcomeSimulation {
  const crm = ideaResults.find((r) => /crm/i.test(r.prompt));
  return {
    persona: 'Founder',
    goal: 'Build a CRM',
    whatHappensToday:
      'Founder asks Command Center → receives brain response → must manually drive planning, verification, and preview; no connected autonomous build.',
    succeeds: [
      crm?.understandsRequest ? 'CRM request understood by brain' : 'Brain responds to prompt',
      'Project Insights and navigation available',
      workspace.verification.validatorCount > 0 ? 'Verification scripts available locally' : 'Verification surface exists',
    ].filter(Boolean) as string[],
    fails: [
      !workspace.autonomousBuilder.executionConnected ? 'No connected autonomous build execution' : '',
      !crm?.routesToExecution ? 'Weak execution routing from idea prompt' : '',
      gaps.some((g) => g.gapType === 'EXECUTION_GAP') ? 'Execution gap vs product promise' : '',
    ].filter(Boolean) as string[],
    requiresManualWork: [
      'Run npm validate scripts manually',
      'Populate Project Memory via Command Center',
      'Start preview manually when runtime available',
    ],
    missing: gaps.map((g) => g.detail).slice(0, 4),
    valueDelivered: (crm?.ideaToAppScore ?? 0) >= 50 && workspace.autonomousBuilder.world2FoundationComplete,
  };
}

export function simulateCustomerOutcome(workspace: ProductWorkspaceSnapshot): OutcomeSimulation {
  return {
    persona: 'Customer',
    goal: 'Create project → understand → preview → verify',
    whatHappensToday:
      'Customer can use Command Center and surfaces, but must rely on manual verification and may not get live preview or autonomous build without setup.',
    succeeds: [
      'Command Center chat available',
      'Project Insights demo portfolio visible',
      'Verification readiness surface explains status',
    ],
    fails: [
      workspace.projects.count === 0 ? 'No pre-populated customer project' : '',
      workspace.livePreview.reality?.validationReady !== true ? 'Live preview not validation-ready by default' : '',
      !workspace.autonomousBuilder.executionConnected ? 'Autonomous build not connected' : '',
    ].filter(Boolean) as string[],
    requiresManualWork: [
      'Terminal verification runs',
      'Learning product surfaces',
      'Command Center prompting for project setup',
    ],
    missing: [
      'One-click build-to-preview loop',
      'Integrated verification results in UI',
      'Guaranteed autonomous delivery',
    ],
    valueDelivered:
      workspace.runtime.brainConnected &&
      workspace.runtime.localRuntimeConnected &&
      workspace.verification.validatorCount > 0,
  };
}

export function loadWorkspaceSnapshot(validatorScripts: string[]): ProductWorkspaceSnapshot {
  return buildProductWorkspaceSnapshot(validatorScripts);
}
