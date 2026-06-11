/**
 * AiDevEngine Command Center — product shell with local brain via POST /api/brain/respond.
 * Chat-first layout. No persistence or execution from the UI.
 */

(function commandCenterShell() {
  'use strict';

  var PRODUCT_BRAND = 'AiDevEngine';
  var FEED_STAGE_DELAY_MS = 180;
  var manifestData = null;
  var workspaceData = null;
  var currentViewId = 'command-center';
  var workspaceLoadState = 'idle';
  var workspaceLoadPromise = null;
  var executionProofData = null;
  var executionProofLoadPromise = null;
  var insightsSelectedProjectId = null;

  /** Client-side demo fallback — used only when workspace API is unavailable. */
  var CLIENT_DEMO_PORTFOLIO_FALLBACK = {
    disclaimer: 'Demo data for visual testing only. These projects are not real and are not stored in Project Memory.',
    source: 'demo',
    summary: {
      projects: 3,
      healthy: 1,
      atRisk: 1,
      blocked: 1,
      verificationReady: 1,
      previewAvailable: 0,
      building: 3,
      ready: 1,
    },
    projects: [
      {
        projectId: 'demo-aidevengine',
        name: 'AiDevEngine Demo',
        label: 'DEMO',
        source: 'demo',
        isDemo: true,
        description: 'Autonomous software development engine for planning, validating, and executing app builds.',
        stage: 'Verification & Product Hardening',
        health: 'Healthy',
        progress: 82,
        verification: 'Ready',
        preview: 'Idle',
        risk: 'Medium',
        recommendedAction: 'Continue manual founder testing across navigation, preview, memory, and verification.',
        summary: 'Product shell and portfolio insights are in active polish.',
        blockers: [],
        recentActivity: ['Product navigation polish completed', 'Validator alignment pass completed'],
      },
      {
        projectId: 'demo-field-service',
        name: 'Field Service App Demo',
        label: 'DEMO',
        source: 'demo',
        isDemo: true,
        description: 'A field-service management app for jobs, technicians, scheduling, and customer updates.',
        stage: 'Planning',
        health: 'At Risk',
        progress: 34,
        verification: 'Not Ready',
        preview: 'Not Available',
        risk: 'High',
        recommendedAction: 'Define mobile workflow, job lifecycle, and technician permissions.',
        summary: 'Early planning stage — core workflows and permissions not fully defined.',
        blockers: ['Mobile workflow undefined', 'Technician permission model incomplete'],
        recentActivity: ['Idea captured in demo portfolio', 'Requirements workshop not scheduled'],
      },
      {
        projectId: 'demo-customer-portal',
        name: 'Customer Portal Demo',
        label: 'DEMO',
        source: 'demo',
        isDemo: true,
        description: 'A customer self-service portal for requests, status tracking, documents, and notifications.',
        stage: 'Blocked',
        health: 'Blocked',
        progress: 18,
        verification: 'Blocked',
        preview: 'Not Available',
        risk: 'High',
        recommendedAction: 'Resolve missing authentication and notification requirements.',
        summary: 'Blocked until authentication and notification requirements are resolved.',
        blockers: ['Authentication requirements missing', 'Notification channel requirements missing'],
        recentActivity: ['Blockers identified during planning review', 'Verification gated until requirements clarified'],
      },
    ],
    priorityQueue: [
      { rank: 1, projectId: 'demo-customer-portal', name: 'Customer Portal Demo', reason: 'Blocked by missing authentication and notification requirements.', isDemo: true, source: 'demo' },
      { rank: 2, projectId: 'demo-field-service', name: 'Field Service App Demo', reason: 'Requirements incomplete.', isDemo: true, source: 'demo' },
      { rank: 3, projectId: 'demo-aidevengine', name: 'AiDevEngine Demo', reason: 'Ready for founder testing.', isDemo: true, source: 'demo' },
    ],
    recommendedActions: [
      'Resolve Customer Portal blockers.',
      'Complete Field Service App requirements.',
      'Continue AiDevEngine manual founder testing.',
      'Run verification after requirements are clarified.',
    ],
  };
  var conversationStarted = false;
  var defaultFeedSections = ['Planning', 'Execution', 'Verification', 'Approvals', 'Learning'];
  var feedSectionIdleCopy = {
    Planning: {
      action: 'Ready to classify your next request',
      detail: 'AiDevEngine will identify whether you want to build, verify, preview, or inspect a project.',
    },
    Execution: {
      action: 'Execution runtime not connected yet',
      detail: 'Planning and guidance are available. Connected autonomous execution is not active.',
    },
    Verification: {
      action: 'Ready to evaluate product readiness',
      detail: 'Verification checks product alignment, quality signals, and launch confidence when requested.',
    },
    Approvals: {
      action: 'Waiting for founder decisions when needed',
      detail: 'Approval gates appear only when a decision or review is required.',
    },
    Learning: {
      action: 'Ready to record useful patterns',
      detail: 'Useful outcomes from tests and reviews can inform future recommendations.',
    },
  };
  var founderTestFeedSteps = [
    {
      section: 'Planning',
      action: 'Understanding Product',
      detail: 'Phase 1 — Project Memory, Project Insights, concept clarity, and first-time user reality.',
    },
    {
      section: 'Planning',
      action: 'Simulating first-time founder',
      detail: 'Evaluating whether a new founder can understand AiDevEngine without prior knowledge.',
    },
    {
      section: 'Planning',
      action: 'Evaluating product understanding',
      detail: 'Checking product purpose, welcome copy, and identity consistency.',
    },
    {
      section: 'Planning',
      action: 'Evaluating navigation clarity',
      detail: 'Reviewing menu labels, overlaps, and screen discoverability.',
    },
    {
      section: 'Planning',
      action: 'Evaluating workflow discoverability',
      detail: 'Checking first action visibility and next-step clarity.',
    },
    {
      section: 'Planning',
      action: 'Evaluating trust formation',
      detail: 'Reviewing score explanations and readiness honesty for new founders.',
    },
    {
      section: 'Execution',
      action: 'Checking Execution Reality',
      detail: 'Phase 2 — Live Preview, Running Application, and execution readiness.',
    },
    {
      section: 'Verification',
      action: 'Reviewing Verification Evidence',
      detail: 'Phase 3 — verification results, readiness, and evidence quality.',
    },
    {
      section: 'Learning',
      action: 'Analyzing Product Evolution',
      detail: 'Phase 4 — Change Intelligence, progress, and regressions.',
    },
    {
      section: 'Approvals',
      action: 'Evaluating Founder Experience',
      detail: 'Phase 5 — Action Center, sensemaking, interaction simulation, trust, and workflow quality.',
    },
    {
      section: 'Approvals',
      action: 'Simulating founder interactions',
      detail: 'Testing primary buttons, modal dismissal, and Command Center readability.',
    },
    {
      section: 'Approvals',
      action: 'Testing modal dismissal',
      detail: 'Verifying Founder Test Results closes via X without blocking workflow.',
    },
    {
      section: 'Approvals',
      action: 'Checking workflow recovery',
      detail: 'Confirming founders can continue without refresh after closing overlays.',
    },
    {
      section: 'Learning',
      action: 'Preparing Launch Recommendation',
      detail: 'Phase 6 — launch readiness, beta readiness, and final recommendation.',
      status: 'Completed',
    },
  ];
  var runtimeNotifications = [];
  var runtimeDiagnostics = {
    brainConnected: false,
    brainEndpointReachable: false,
    operatorFeedActive: false,
    chatIntegrationActive: true,
    lastRequestStatus: 'Not started',
    lastError: 'None',
  };
  var previewClientReality = { loaded: false, error: false };

  function el(id) {
    return document.getElementById(id);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function scrollChatToBottom() {
    var history = el('chat-history');
    if (!history) return;
    history.scrollTop = history.scrollHeight;
  }

  function scrollFeedToLatest() {
    var body = el('operator-feed-body');
    if (body) body.scrollTop = body.scrollHeight;
    var log = el('feed-stream-log');
    if (log) log.scrollTop = log.scrollHeight;
  }

  function showWelcomeState() {
    var welcome = el('chat-welcome-state');
    var panel = el('chat-messages-panel');
    if (welcome) welcome.classList.remove('hidden');
    if (panel) panel.classList.remove('has-conversation');
  }

  function hideWelcomeState() {
    conversationStarted = true;
    var welcome = el('chat-welcome-state');
    var panel = el('chat-messages-panel');
    if (welcome) welcome.classList.add('hidden');
    if (panel) panel.classList.add('has-conversation');
  }

  function pushNotification(text) {
    if (runtimeNotifications.indexOf(text) === -1) {
      runtimeNotifications.unshift(text);
    }
    renderNotifications(runtimeNotifications);
  }

  function renderLearningVisibilityDiagnostics(diag) {
    if (!diag) return;
    if (el('learning-visibility-active')) {
      el('learning-visibility-active').textContent = diag.learningVisibilityActive ? 'YES' : 'NO';
    }
    if (el('learning-count')) {
      el('learning-count').textContent = String(diag.learningCount ?? 0);
    }
    if (el('pattern-count')) {
      el('pattern-count').textContent = String(diag.patternCount ?? 0);
    }
    if (el('recurring-failure-count')) {
      el('recurring-failure-count').textContent = String(diag.recurringFailureCount ?? 0);
    }
    if (el('recurring-blocker-count')) {
      el('recurring-blocker-count').textContent = String(diag.recurringBlockerCount ?? 0);
    }
    if (el('last-learning-query')) {
      el('last-learning-query').textContent = diag.lastLearningQuery || 'None';
    }
  }

  function renderFailureVisibilityDiagnostics(diag) {
    if (!diag) return;
    if (el('failure-visibility-active')) {
      el('failure-visibility-active').textContent = diag.failureVisibilityActive ? 'YES' : 'NO';
    }
    if (el('failure-count')) {
      el('failure-count').textContent = String(diag.failureCount ?? 0);
    }
    if (el('critical-failure-count')) {
      el('critical-failure-count').textContent = String(diag.criticalFailureCount ?? 0);
    }
    if (el('blocked-capability-count')) {
      el('blocked-capability-count').textContent = String(diag.blockedCapabilityCount ?? 0);
    }
    if (el('most-severe-failure')) {
      el('most-severe-failure').textContent = diag.mostSevereFailure || 'None';
    }
    if (el('last-failure-query')) {
      el('last-failure-query').textContent = diag.lastFailureQuery || 'None';
    }
  }

  function renderProgressIntelligenceDiagnostics(diag) {
    if (!diag) return;
    if (el('progress-intelligence-active')) {
      el('progress-intelligence-active').textContent = diag.progressIntelligenceActive ? 'YES' : 'NO';
    }
    if (el('project-progress-count')) {
      el('project-progress-count').textContent = String(diag.projectProgressCount ?? 0);
    }
    if (el('average-completion')) {
      el('average-completion').textContent = String(diag.averageCompletion ?? 0);
    }
    if (el('highest-completion')) {
      el('highest-completion').textContent = String(diag.highestCompletion ?? 0);
    }
    if (el('lowest-completion')) {
      el('lowest-completion').textContent = String(diag.lowestCompletion ?? 0);
    }
    if (el('last-progress-query')) {
      el('last-progress-query').textContent = diag.lastProgressQuery || 'None';
    }
  }

  function renderReasoningVisibilityDiagnostics(diag) {
    if (!diag) return;
    if (el('reasoning-visibility-active')) {
      el('reasoning-visibility-active').textContent = diag.reasoningVisibilityActive ? 'YES' : 'NO';
    }
    if (el('reasoning-count')) {
      el('reasoning-count').textContent = String(diag.reasoningCount ?? 0);
    }
    if (el('evidence-count')) {
      el('evidence-count').textContent = String(diag.evidenceCount ?? 0);
    }
    if (el('reasoning-blocker-count')) {
      el('reasoning-blocker-count').textContent = String(diag.blockerCount ?? 0);
    }
    if (el('reasoning-risk-count')) {
      el('reasoning-risk-count').textContent = String(diag.riskCount ?? 0);
    }
    if (el('last-reasoning-source')) {
      el('last-reasoning-source').textContent = diag.lastReasoningSource || 'None';
    }
  }

  function renderActionVisibilityDiagnostics(diag) {
    if (!diag) return;
    if (el('action-visibility-active')) {
      el('action-visibility-active').textContent = diag.actionVisibilityActive ? 'YES' : 'NO';
    }
    if (el('action-count')) {
      el('action-count').textContent = String(diag.actionCount ?? 0);
    }
    if (el('recommended-action-count')) {
      el('recommended-action-count').textContent = String(diag.recommendedCount ?? 0);
    }
    if (el('blocked-action-count')) {
      el('blocked-action-count').textContent = String(diag.blockedCount ?? 0);
    }
    if (el('deferred-action-count')) {
      el('deferred-action-count').textContent = String(diag.deferredCount ?? 0);
    }
    if (el('last-action-title')) {
      el('last-action-title').textContent = diag.lastAction || 'None';
    }
    if (el('last-action-source')) {
      el('last-action-source').textContent = diag.lastActionSource || 'None';
    }
  }

  function renderOperatorFeedDiagnostics(diag) {
    if (!diag) return;
    if (el('operator-feed-active')) {
      el('operator-feed-active').textContent = diag.operatorFeedActive ? 'YES' : 'NO';
    }
    if (el('feed-event-count')) {
      el('feed-event-count').textContent = String(diag.eventCount ?? 0);
    }
    if (el('feed-stage-count')) {
      el('feed-stage-count').textContent = String(diag.stageCount ?? 0);
    }
    if (el('feed-response-ready')) {
      el('feed-response-ready').textContent = diag.responseReadyEmitted ? 'YES' : 'NO';
    }
    if (el('last-feed-capability')) {
      el('last-feed-capability').textContent = diag.lastPrimaryCapability || 'None';
    }
  }

  function renderPortfolioIntelligenceDiagnostics(diag) {
    if (!diag) return;
    if (el('portfolio-intelligence-active')) {
      el('portfolio-intelligence-active').textContent = diag.portfolioIntelligenceActive ? 'YES' : 'NO';
    }
    if (el('portfolio-project-count')) {
      el('portfolio-project-count').textContent = String(diag.projectCount ?? 0);
    }
    if (el('portfolio-active-project-count')) {
      el('portfolio-active-project-count').textContent = String(diag.activeProjectCount ?? 0);
    }
    if (el('portfolio-health-level')) {
      el('portfolio-health-level').textContent = diag.portfolioHealth || 'FAIR';
    }
    if (el('highest-risk-project')) {
      el('highest-risk-project').textContent = diag.highestRiskProject || 'None';
    }
    if (el('highest-priority-project')) {
      el('highest-priority-project').textContent = diag.highestPriorityProject || 'None';
    }
    if (el('last-portfolio-query')) {
      el('last-portfolio-query').textContent = diag.lastPortfolioQuery || 'None';
    }
  }

  function renderProjectSummarizationDiagnostics(diag) {
    if (!diag) return;
    if (el('project-summarization-active')) {
      el('project-summarization-active').textContent = diag.projectSummarizationActive ? 'YES' : 'NO';
    }
    if (el('summary-count')) {
      el('summary-count').textContent = String(diag.summaryCount ?? 0);
    }
    if (el('last-summary-type')) {
      el('last-summary-type').textContent = diag.lastSummaryType || 'None';
    }
    if (el('last-summary-confidence')) {
      el('last-summary-confidence').textContent = diag.lastSummaryConfidence || 'LOW';
    }
    if (el('summary-source-count')) {
      el('summary-source-count').textContent = String(diag.summarySourceCount ?? 0);
    }
  }

  function renderProjectHistoryIntelligenceDiagnostics(diag) {
    if (!diag) return;
    if (el('project-history-intelligence-active')) {
      el('project-history-intelligence-active').textContent = diag.projectHistoryIntelligenceActive ? 'YES' : 'NO';
    }
    if (el('history-event-count')) {
      el('history-event-count').textContent = String(diag.historyEventCount ?? 0);
    }
    if (el('history-checkpoint-count')) {
      el('history-checkpoint-count').textContent = String(diag.checkpointCount ?? 0);
    }
    if (el('history-rollback-count')) {
      el('history-rollback-count').textContent = String(diag.rollbackCount ?? 0);
    }
    if (el('last-history-query')) {
      el('last-history-query').textContent = diag.lastHistoryQuery || 'None';
    }
    if (el('history-confidence')) {
      el('history-confidence').textContent = diag.historyConfidence || 'LOW';
    }
    if (el('phase-transition-count')) {
      el('phase-transition-count').textContent = String(diag.phaseTransitionCount ?? 0);
    }
  }

  function renderWorkspaceIntelligenceDiagnostics(diag) {
    if (!diag) return;
    if (el('workspace-intelligence-active')) {
      el('workspace-intelligence-active').textContent = diag.workspaceIntelligenceActive ? 'YES' : 'NO';
    }
    if (el('workspace-count')) {
      el('workspace-count').textContent = String(diag.workspaceCount ?? 0);
    }
    if (el('active-workspace-name')) {
      el('active-workspace-name').textContent = diag.activeWorkspace || 'None';
    }
    if (el('active-project-name')) {
      el('active-project-name').textContent = diag.activeProject || 'None';
    }
    if (el('workspace-ownership-confidence')) {
      el('workspace-ownership-confidence').textContent = diag.workspaceOwnershipConfidence || 'LOW';
    }
    if (el('workspace-risk-count')) {
      el('workspace-risk-count').textContent = String(diag.workspaceRiskCount ?? 0);
    }
    if (el('context-leakage-risk')) {
      el('context-leakage-risk').textContent = diag.contextLeakageRisk || 'clear';
    }
    if (el('last-workspace-query')) {
      el('last-workspace-query').textContent = diag.lastWorkspaceQuery || 'None';
    }
    if (el('duplicate-workspace-risk')) {
      el('duplicate-workspace-risk').textContent = diag.duplicateWorkspaceRisk || 'clear';
    }
  }

  function renderDependencyIntelligenceDiagnostics(diag) {
    if (!diag) return;
    if (el('dependency-intelligence-active')) {
      el('dependency-intelligence-active').textContent = diag.dependencyIntelligenceActive ? 'YES' : 'NO';
    }
    if (el('dependency-count')) {
      el('dependency-count').textContent = String(diag.dependencyCount ?? 0);
    }
    if (el('blocked-dependency-count')) {
      el('blocked-dependency-count').textContent = String(diag.blockedDependencyCount ?? 0);
    }
    if (el('highest-risk-dependency')) {
      el('highest-risk-dependency').textContent = diag.highestRiskDependency || 'None';
    }
    if (el('last-dependency-query')) {
      el('last-dependency-query').textContent = diag.lastDependencyQuery || 'None';
    }
    if (el('duplicate-dependency-risk')) {
      el('duplicate-dependency-risk').textContent = diag.duplicateDependencyRisk || 'clear';
    }
    if (el('dependency-graph-health')) {
      el('dependency-graph-health').textContent = diag.dependencyGraphHealth || 'healthy';
    }
  }

  function renderVaultIntelligenceDiagnostics(diag) {
    if (!diag) return;
    if (el('vault-intelligence-active')) {
      el('vault-intelligence-active').textContent = diag.projectVaultIntelligenceActive ? 'YES' : 'NO';
    }
    if (el('vault-records-read')) {
      el('vault-records-read').textContent = String(diag.vaultRecordsRead ?? 0);
    }
    if (el('vault-facts-added')) {
      el('vault-facts-added').textContent = String(diag.vaultFactsAdded ?? 0);
    }
    if (el('last-vault-aware-question')) {
      el('last-vault-aware-question').textContent = diag.lastVaultAwareQuestion || 'None';
    }
    if (el('last-vault-fact-count')) {
      el('last-vault-fact-count').textContent = String(diag.lastVaultFactCount ?? 0);
    }
    if (el('vault-bridge-target')) {
      el('vault-bridge-target').textContent = diag.bridgeTarget || 'None';
    }
    if (el('vault-duplicate-risk')) {
      el('vault-duplicate-risk').textContent = diag.duplicateRisk || 'clear';
    }
  }

  function renderProjectUnderstandingDiagnostics(diag) {
    if (!diag) return;
    if (el('project-understanding-active')) {
      el('project-understanding-active').textContent = diag.projectUnderstandingActive ? 'YES' : 'NO';
    }
    if (el('current-project-name')) {
      el('current-project-name').textContent = diag.currentProject || 'None';
    }
    if (el('project-status-value')) {
      el('project-status-value').textContent = diag.projectStatus || 'None';
    }
    if (el('missing-capability-count')) {
      el('missing-capability-count').textContent = String(diag.missingCapabilityCount ?? 0);
    }
    if (el('project-risk-count')) {
      el('project-risk-count').textContent = String(diag.riskCount ?? 0);
    }
    if (el('last-project-query')) {
      el('last-project-query').textContent = diag.lastProjectQuery || 'None';
    }
  }

  function renderGeneralQuestionDiagnostics(diag) {
    if (!diag) return;
    if (el('last-question-dimensions')) {
      el('last-question-dimensions').textContent =
        diag.lastQuestionDimensions && diag.lastQuestionDimensions.length
          ? diag.lastQuestionDimensions.join(', ')
          : 'None';
    }
    if (el('last-context-needs')) {
      el('last-context-needs').textContent =
        diag.lastContextNeeds && diag.lastContextNeeds.length ? diag.lastContextNeeds.join(', ') : 'None';
    }
    if (el('last-reasoning-modes')) {
      el('last-reasoning-modes').textContent =
        diag.lastReasoningModes && diag.lastReasoningModes.length ? diag.lastReasoningModes.join(', ') : 'None';
    }
    if (el('last-capabilities-selected')) {
      el('last-capabilities-selected').textContent =
        diag.lastCapabilitiesSelected && diag.lastCapabilitiesSelected.length
          ? diag.lastCapabilitiesSelected.join(', ')
          : 'None';
    }
    if (el('unavailable-capabilities')) {
      el('unavailable-capabilities').textContent =
        diag.unavailableCapabilities && diag.unavailableCapabilities.length
          ? diag.unavailableCapabilities.join(', ')
          : 'None';
    }
    if (el('routing-confidence')) {
      el('routing-confidence').textContent = diag.routingConfidence || 'None';
    }
    if (el('routing-reason')) {
      el('routing-reason').textContent = diag.routingReason || 'None';
    }
  }

  function renderTimelineIntelligenceDiagnostics(diag) {
    if (!diag) return;
    if (el('current-timeline-phase')) {
      el('current-timeline-phase').textContent = diag.currentTimelinePhase || 'None';
    }
    if (el('completed-phase-count')) {
      el('completed-phase-count').textContent = String(diag.completedPhaseCount ?? 0);
    }
    if (el('milestone-count')) {
      el('milestone-count').textContent = String(diag.milestoneCount ?? 0);
    }
    if (el('timeline-blocker-count')) {
      el('timeline-blocker-count').textContent = String(diag.blockerCount ?? 0);
    }
    if (el('last-timeline-query')) {
      el('last-timeline-query').textContent = diag.lastTimelineQuery || 'None';
    }
  }

  function renderDecisionLayerDiagnostics(diag) {
    if (!diag) return;
    if (el('decision-layer-active')) {
      el('decision-layer-active').textContent = diag.decisionLayerActive ? 'YES' : 'NO';
    }
    if (el('last-decision-question')) {
      el('last-decision-question').textContent = diag.lastDecisionQuestion || 'None';
    }
    if (el('last-recommendation')) {
      el('last-recommendation').textContent = diag.lastRecommendation || 'None';
    }
    if (el('last-decision-risk-level')) {
      el('last-decision-risk-level').textContent = diag.lastRiskLevel || 'None';
    }
    if (el('last-decision-confidence')) {
      el('last-decision-confidence').textContent = diag.lastConfidence || 'None';
    }
    if (el('last-decision-blocker-count')) {
      el('last-decision-blocker-count').textContent = String(diag.lastBlockerCount ?? 0);
    }
  }

  function renderCrossSystemDiagnostics(diag) {
    var list = el('cross-system-diagnostics-list');
    if (!list || !diag) return;
    var rows = [
      { label: 'Relationship Count', ok: diag.relationshipCount > 0, value: String(diag.relationshipCount) },
      { label: 'Dependency Count', ok: diag.dependencyCount > 0, value: String(diag.dependencyCount) },
      { label: 'Impact Analysis Available', ok: diag.impactAnalysisAvailable === true, value: diag.impactAnalysisAvailable ? 'YES' : 'NO' },
    ];
    list.innerHTML = '';
    for (var i = 0; i < rows.length; i += 1) {
      var li = document.createElement('li');
      li.className = rows[i].ok ? 'ok' : 'fail';
      li.textContent = rows[i].label + ': ' + rows[i].value;
      list.appendChild(li);
    }
    if (el('last-query-type')) {
      el('last-query-type').textContent = diag.lastQueryType || 'None';
    }
    if (el('last-analyzer-used')) {
      el('last-analyzer-used').textContent = diag.lastAnalyzerUsed || 'None';
    }
    if (el('last-routing-result')) {
      el('last-routing-result').textContent = diag.lastRoutingResult || 'None';
    }
    if (el('last-relationship-query')) {
      el('last-relationship-query').textContent = diag.lastRelationshipQuery || 'None';
    }
    if (el('last-dependency-query')) {
      el('last-dependency-query').textContent = diag.lastDependencyQuery || 'None';
    }
    if (el('last-impact-query')) {
      el('last-impact-query').textContent = diag.lastImpactQuery || 'None';
    }
  }

  function renderRuntimeDiagnostics() {
    var list = el('runtime-diagnostics-list');
    if (!list) return;
    var rows = [
      { label: 'Brain Connected', ok: runtimeDiagnostics.brainConnected },
      { label: 'Brain Endpoint Reachable', ok: runtimeDiagnostics.brainEndpointReachable },
      { label: 'Operator Feed Active', ok: runtimeDiagnostics.operatorFeedActive },
      { label: 'Chat Integration Active', ok: runtimeDiagnostics.chatIntegrationActive },
    ];
    list.innerHTML = '';
    for (var i = 0; i < rows.length; i += 1) {
      var li = document.createElement('li');
      li.className = rows[i].ok ? 'ok' : 'fail';
      li.textContent = rows[i].label + ': ' + (rows[i].ok ? 'YES' : 'NO');
      list.appendChild(li);
    }
    if (el('last-request-status')) el('last-request-status').textContent = runtimeDiagnostics.lastRequestStatus;
    if (el('last-error')) el('last-error').textContent = runtimeDiagnostics.lastError;
  }

  function setLastError(reason) {
    runtimeDiagnostics.lastError = reason || 'None';
    renderRuntimeDiagnostics();
  }

  function setLastRequestStatus(status) {
    runtimeDiagnostics.lastRequestStatus = status;
    renderRuntimeDiagnostics();
  }

  function appendChatMessage(text, role) {
    var history = el('chat-history');
    if (!history) return;
    var div = document.createElement('div');
    div.className = 'chat-message ' + role;
    div.textContent = text;
    history.appendChild(div);
    scrollChatToBottom();
  }

  function removeThinkingMessage() {
    var thinking = el('brain-thinking');
    if (thinking && thinking.parentNode) thinking.parentNode.removeChild(thinking);
  }

  function showThinking() {
    removeThinkingMessage();
    var history = el('chat-history');
    if (!history) return;
    var div = document.createElement('div');
    div.className = 'chat-message thinking';
    div.id = 'brain-thinking';
    div.textContent = 'Brain is analyzing…';
    history.appendChild(div);
    scrollChatToBottom();
  }

  var VIEW_TITLES = {
    'command-center': 'AiDevEngine Command Center',
    'founder-action-center': 'Founder Action Center',
    'product-coherence': 'Product Coherence',
    projects: 'Projects',
    'autonomous-builder': 'Autonomous Builder',
    'live-preview': 'Live Preview',
    'project-memory': 'Project Memory',
    verification: 'Verification',
    notifications: 'Notifications',
    'project-insights': 'Project Insights',
    'system-diagnostics': 'System Diagnostics',
  };

  var ALL_VIEW_IDS = [
    'command-center',
    'founder-action-center',
    'product-coherence',
    'projects',
    'autonomous-builder',
    'live-preview',
    'project-memory',
    'verification',
    'notifications',
    'project-insights',
    'system-diagnostics',
  ];

  function hideAllViews() {
    for (var i = 0; i < ALL_VIEW_IDS.length; i += 1) {
      var view = el('view-' + ALL_VIEW_IDS[i]);
      if (view) view.classList.add('hidden');
    }
  }

  function renderProductCard(title, bodyHtml) {
    return (
      '<section class="card product-card">' +
      '<h2>' +
      escapeHtml(title) +
      '</h2>' +
      bodyHtml +
      '</section>'
    );
  }

  function renderIntelligenceHeroCards(cards) {
    var html = '<div class="intelligence-hero-grid">';
    for (var i = 0; i < cards.length; i += 1) {
      html +=
        '<article class="intelligence-hero-card"><h3>' +
        escapeHtml(cards[i].title) +
        '</h3><p>' +
        escapeHtml(cards[i].desc) +
        '</p></article>';
    }
    return html + '</div>';
  }

  function renderIntelligenceRelationship() {
    return (
      '<section class="card intelligence-relationship intelligence-relationship-banner">' +
      '<h2>Memory vs Insights</h2>' +
      '<p class="product-lead">Memory stores facts. Insights analyze facts.</p>' +
      '<p class="intelligence-takeaway">Insights come from Memory. Memory does not come from Insights.</p>' +
      '<div class="memory-insights-flow">' +
      '<div class="flow-step"><strong>Project Memory</strong><span>Everything AiDevEngine knows.</span></div>' +
      '<div class="flow-arrow" aria-hidden="true">↓</div>' +
      '<div class="flow-step flow-analysis"><strong>AiDevEngine Analysis</strong><span>Reads Memory and current product state.</span></div>' +
      '<div class="flow-arrow" aria-hidden="true">↓</div>' +
      '<div class="flow-step"><strong>Project Insights</strong><span>Everything AiDevEngine thinks.</span></div>' +
      '</div></section>'
    );
  }

  function renderProjectInsightsClarityIntro() {
    return (
      renderIntelligenceHeader(
        'Project Insights',
        'Everything AiDevEngine thinks about this project.',
        "This is your project's intelligence.",
      ) +
      renderProductCard(
        'What Project Insights does',
        '<p class="product-lead">Project intelligence with recommendations generated from your project state — what needs attention, what is improving, what is blocking progress, and what should happen next.</p>' +
          '<p class="hint"><strong>Project Insights vs Verification:</strong> understand health, patterns, risks, and recommendations here — not pass/fail proof (open Verification for launch confidence).</p>' +
          '<p><strong>It analyzes:</strong></p>' +
          '<ul class="product-list">' +
          '<li>Project Memory</li>' +
          '<li>Verification Results</li>' +
          '<li>Running Application State</li>' +
          '<li>Change Intelligence</li>' +
          '<li>Founder Testing</li>' +
          '</ul>' +
          '<p><strong>To identify:</strong></p>' +
          renderIntelligenceHeroCards([
            { title: 'Project Health', desc: 'Current state of the project' },
            { title: 'Risks', desc: 'What may prevent success' },
            { title: 'Progress', desc: 'How far the build has come' },
            { title: 'Readiness', desc: 'Preparedness for review, beta, or launch' },
            { title: 'Next Actions', desc: 'Highest-impact recommended steps' },
          ]) +
          '<p class="insights-founder-outcome"><strong>Use Project Insights to understand:</strong> what needs attention · what is improving · what is blocking progress · what should happen next</p>' +
          '<p class="insights-what-to-do"><strong>What should I do here?</strong> Review project health and follow recommended actions.</p>',
      )
    );
  }

  function collectPortfolioTopRisks(portfolio) {
    var risks = [];
    var projects = portfolio.projects || [];
    for (var i = 0; i < projects.length; i += 1) {
      var blockers = projects[i].blockers || [];
      for (var j = 0; j < blockers.length; j += 1) {
        risks.push(projects[i].name + ': ' + blockers[j]);
      }
    }
    return risks.slice(0, 8);
  }

  function renderIntelligenceHeader(title, subtitle, tagline) {
    return (
      '<header class="intelligence-header product-hero">' +
      '<h2 class="intelligence-title">' +
      escapeHtml(title) +
      '</h2>' +
      '<p class="intelligence-subtitle">' +
      escapeHtml(subtitle) +
      '</p>' +
      '<p class="intelligence-tagline">' +
      escapeHtml(tagline) +
      '</p></header>'
    );
  }

  function renderBulletList(items) {
    if (!items || !items.length) return '<p class="empty-state">No items yet.</p>';
    var html = '<ul class="product-list">';
    for (var i = 0; i < items.length; i += 1) {
      html += '<li>' + escapeHtml(items[i]) + '</li>';
    }
    html += '</ul>';
    return html;
  }

  function renderProjectsSurface(ws) {
    var container = el('projects-surface');
    if (!container) return;
    var projects = (ws && ws.projects && ws.projects.items) || [];
    var html = renderProductCard(
      'Your Projects',
        '<p class="founder-path-guidance">Start by creating a project or opening an existing one.</p>' +
        '<p class="product-lead">Active workspaces and applications you are building now — not stored vault knowledge in Project Memory.</p>' +
        '<p><strong>Total:</strong> ' +
        String((ws && ws.projects && ws.projects.count) || 0) +
        ' · <strong>Active:</strong> ' +
        String((ws && ws.projects && ws.projects.activeCount) || 0) +
        '</p>',
    );
    if (!projects.length) {
      html +=
        renderProductCard(
          'Get Started',
          '<p class="empty-state">No projects in memory yet.</p>' +
            '<p>Start or select a project in Command Center to begin planning and building.</p>',
        );
    } else {
      html += '<div class="project-grid">';
      for (var i = 0; i < projects.length; i += 1) {
        var p = projects[i];
        html +=
          '<section class="card project-card-item">' +
          '<h3>' +
          escapeHtml(p.name) +
          '</h3>' +
          '<p class="project-meta"><span class="badge">' +
          escapeHtml(p.status) +
          '</span></p>' +
          '<p>' +
          escapeHtml(p.summary || 'No summary yet.') +
          '</p>' +
          '</section>';
      }
      html += '</div>';
    }
    container.innerHTML = html;
  }

  function renderAutonomousBuilderSurface(ws) {
    var container = el('autonomous-builder-surface');
    if (!container) return;
    var ab = (ws && ws.autonomousBuilder) || {};
    container.innerHTML =
      renderProductCard(
        'Autonomous Builder',
        '<p class="product-lead">' +
          escapeHtml(ab.description || 'Plans and executes project work in an isolated workspace.') +
          '</p>',
      ) +
      renderProductCard(
        'Readiness',
        '<p><strong>Status:</strong> ' +
          escapeHtml(ab.readinessLabel || 'Checking…') +
          '</p>' +
          '<p><strong>Foundation:</strong> ' +
          (ab.world2FoundationComplete ? 'Architecture in place' : 'Not ready') +
          '</p>' +
          '<p><strong>Execution runtime:</strong> ' +
          (ab.executionConnected ? 'Connected' : 'Not connected yet') +
          '</p>' +
          '<p class="hint">Autonomous Builder does not overpromise — honest readiness is shown until full execution is active.</p>',
      );
  }

  function previewRealityPillClass(state) {
    if (state === 'PREVIEW_READY' || state === 'PREVIEW_INTERACTIVE') return 'ok';
    if (state === 'PREVIEW_DEGRADED' || state === 'PREVIEW_STALE') return 'warn';
    return 'idle';
  }

  function mergePreviewClientReality(reality) {
    if (!reality) return null;
    var merged = {
      state: reality.state,
      displayLabel: reality.displayLabel,
      summaryLines: (reality.summaryLines || []).slice(),
      problems: (reality.problems || []).slice(),
      recommendedActions: (reality.recommendedActions || []).slice(),
    };
    if (previewClientReality.error && merged.state !== 'NO_PREVIEW') {
      merged.state = 'PREVIEW_DEGRADED';
      merged.displayLabel = 'Preview degraded';
      if (merged.problems.indexOf('Preview frame failed to load content.') === -1) {
        merged.problems.push('Preview frame failed to load content.');
      }
      if (merged.recommendedActions.indexOf('Refresh preview') === -1) {
        merged.recommendedActions.unshift('Refresh preview');
      }
    } else if (previewClientReality.loaded && merged.state === 'PREVIEW_LOADING') {
      merged.state = 'PREVIEW_VISIBLE';
      merged.displayLabel = 'Preview visible';
      merged.summaryLines = ['Preview loaded successfully.', 'Content is visible in the preview surface.'];
    }
    return merged;
  }

  function updatePreviewClientDisplay(lp) {
    var reality = mergePreviewClientReality(lp.reality);
    if (!reality) return;
    var stateEl = document.querySelector('.live-preview-reality-state');
    var labelEl = document.querySelector('.live-preview-reality-label');
    var summaryEl = document.querySelector('.live-preview-reality-summary');
    var problemsEl = document.querySelector('.live-preview-reality-problems');
    if (stateEl) {
      stateEl.textContent = reality.state;
      stateEl.className = 'status-pill live-preview-reality-state ' + previewRealityPillClass(reality.state);
    }
    if (labelEl) {
      labelEl.innerHTML = '<strong>Status:</strong> ' + escapeHtml(reality.displayLabel);
    }
    if (summaryEl) {
      summaryEl.innerHTML = '<p><strong>Reality summary</strong></p>' + renderBulletList(reality.summaryLines || []);
    }
    if (problemsEl) {
      if (reality.problems && reality.problems.length) {
        problemsEl.innerHTML = '<p><strong>Problems</strong></p>' + renderBulletList(reality.problems);
        problemsEl.classList.remove('hidden');
      } else {
        problemsEl.innerHTML = '';
        problemsEl.classList.add('hidden');
      }
    }
  }

  function attachPreviewIframeListeners(lp) {
    var iframe = el('preview-iframe');
    if (!iframe || iframe.dataset.realityBound === '1') return;
    iframe.dataset.realityBound = '1';
    previewClientReality = { loaded: false, error: false };
    iframe.addEventListener('load', function () {
      previewClientReality.loaded = true;
      updatePreviewClientDisplay(lp);
    });
    iframe.addEventListener('error', function () {
      previewClientReality.error = true;
      updatePreviewClientDisplay(lp);
    });
  }

  function runningAppPillClass(state) {
    if (state === 'OUTPUT_READY_FOR_TESTING' || state === 'OUTPUT_INTERACTIVE') return 'ok';
    if (state === 'OUTPUT_STALE' || state === 'OUTPUT_DEGRADED') return 'warn';
    return 'idle';
  }

  function renderRunningApplicationPanel(ra) {
    if (!ra) {
      return renderProductCard(
        'Running Application',
        '<p class="empty-state">Running application visibility is not available yet.</p>',
      );
    }
    var lastUpdate = ra.buildOutput && ra.buildOutput.lastUpdatedAt
      ? new Date(ra.buildOutput.lastUpdatedAt).toLocaleString()
      : 'Unknown';
    return (
      '<div class="running-application-visibility">' +
      renderProductCard(
        'Running Application',
        '<p class="running-app-title"><strong>' + escapeHtml(ra.runningAppTitle || 'No running application') + '</strong></p>' +
          '<p class="status-pill running-app-output-state ' + runningAppPillClass(ra.outputState) + '">' +
          escapeHtml(ra.outputState || 'NO_RUNNING_APP') +
          '</p>' +
          '<p><strong>Output state:</strong> ' + escapeHtml(ra.outputStateLabel || 'Unknown') + '</p>',
      ) +
      renderProductCard(
        'Build Output',
        '<p><strong>Latest output:</strong> ' + escapeHtml((ra.buildOutput && ra.buildOutput.outputType) || 'none') + '</p>' +
          '<p><strong>Build state:</strong> ' + escapeHtml((ra.buildOutput && ra.buildOutput.buildState) || 'none') + '</p>' +
          '<p><strong>Last update:</strong> ' + escapeHtml(lastUpdate) + '</p>' +
          '<p><strong>Change summary:</strong> ' + escapeHtml((ra.buildOutput && ra.buildOutput.changeSummary) || 'No recent changes reported') + '</p>',
      ) +
      renderProductCard(
        'Alignment & Testing',
        '<p><strong>Request alignment:</strong> ' + escapeHtml(ra.requestAlignment || 'UNKNOWN') + '</p>' +
          '<p class="hint">' + escapeHtml(ra.alignmentReason || '') + '</p>' +
          '<p><strong>Testing status:</strong> ' + escapeHtml(ra.testReadiness || 'NOT_TESTABLE') + '</p>' +
          '<p class="hint">' + escapeHtml(ra.testReadinessReason || '') + '</p>' +
          (ra.warnings && ra.warnings.length
            ? '<div class="running-app-warnings"><p><strong>Warnings</strong></p>' + renderBulletList(ra.warnings) + '</div>'
            : '') +
          '<p><strong>Recommended action:</strong> ' + escapeHtml(ra.recommendedAction || 'Refresh preview') + '</p>',
      ) +
      '</div>'
    );
  }

  function streamRunningApplicationFeed(visibility) {
    if (!visibility || !visibility.operatorFeedEvents || !visibility.operatorFeedEvents.length) return;
    var events = visibility.operatorFeedEvents;
    var index = 0;
    function step() {
      if (index >= events.length) return;
      var item = events[index];
      appendFeedStreamEvent(
        {
          section: item.section,
          action: item.action,
          detail: item.detail,
          status: item.status,
          evidence: item.evidence,
          stepIndex: index + 1,
          stepTotal: events.length,
          eventType: item.action,
        },
        index < events.length - 1,
      );
      index += 1;
      if (index < events.length) {
        window.setTimeout(step, 260);
      }
    }
    step();
  }

  function streamPreviewRealityFeed(reality) {
    if (!reality || !reality.operatorFeedEvents || !reality.operatorFeedEvents.length) return;
    clearFeedStreamLog();
    runtimeDiagnostics.operatorFeedActive = true;
    var events = reality.operatorFeedEvents;
    var index = 0;
    function step() {
      if (index >= events.length) return;
      var item = events[index];
      appendFeedStreamEvent(
        {
          section: item.section,
          action: item.action,
          detail: item.detail,
          status: item.status,
          stepIndex: index + 1,
          stepTotal: events.length,
          eventType: item.action,
        },
        index < events.length - 1,
      );
      index += 1;
      if (index < events.length) {
        window.setTimeout(step, 280);
      }
    }
    step();
  }

  function renderLivePreviewSurface(ws) {
    var container = el('live-preview-surface');
    if (!container) return;
    var lp = (ws && ws.livePreview) || {};
    var ra = (ws && ws.runningApplication) || null;
    var html = renderRunningApplicationPanel(ra);
    var reality = mergePreviewClientReality(lp.reality) || {
      state: 'NO_PREVIEW',
      displayLabel: lp.statusLabel || 'Checking preview status…',
      summaryLines: ['Checking live preview status…'],
      problems: [],
      recommendedActions: ['Start or select a project'],
    };
    html +=
      '<div class="live-preview-reality">' +
      renderProductCard(
        'Preview Status',
        '<p class="status-pill live-preview-reality-state ' +
          previewRealityPillClass(reality.state) +
          '">' +
          escapeHtml(reality.state) +
          '</p>' +
          '<p class="live-preview-reality-label"><strong>Live Preview Status:</strong> ' +
          escapeHtml(reality.displayLabel) +
          '</p>' +
          '<div class="live-preview-reality-summary">' +
          '<p><strong>Reality summary</strong></p>' +
          renderBulletList(reality.summaryLines || []) +
          '</div>' +
          (reality.problems && reality.problems.length
            ? '<div class="live-preview-reality-problems"><p><strong>Problems</strong></p>' +
              renderBulletList(reality.problems) +
              '</div>'
            : '') +
          '<div class="live-preview-reality-actions"><p><strong>Recommended action</strong></p>' +
          renderBulletList(reality.recommendedActions || ['Refresh preview']) +
          '</div>' +
          '<p class="hint"><strong>Live Preview vs Verification:</strong> interact with the running app here; use Verification to prove readiness with pass/fail evidence.</p>' +
          '<p class="founder-path-guidance">Use Live Preview to interact with and test the current version of your application.</p>' +
          '<p><strong>Build / output:</strong> ' +
          escapeHtml(lp.buildStatus || 'Unknown') +
          '</p>' +
          (lp.lastVerificationHint
            ? '<p><strong>Last verification:</strong> ' + escapeHtml(lp.lastVerificationHint) + '</p>'
            : ''),
      ) +
      '</div>';

    if (lp.previewUrl) {
      html +=
        renderProductCard(
          'Running Preview',
          '<div class="preview-controls">' +
            '<a class="btn-link" href="' +
            escapeHtml(lp.previewUrl) +
            '" target="_blank" rel="noopener noreferrer">Open preview in new tab</a>' +
            '<button type="button" class="btn-secondary" id="copy-preview-url">Copy preview URL</button>' +
            '<button type="button" class="btn-secondary" id="refresh-preview-frame">Refresh preview</button>' +
            '</div>' +
            '<iframe class="preview-frame" id="preview-iframe" title="Live application preview" src="' +
            escapeHtml(lp.previewUrl) +
            '"></iframe>',
        );
    } else {
      html += renderProductCard(
        'No Live Preview Running',
        '<p class="empty-state">No live preview is running yet.</p>' +
          '<p><strong>Next action:</strong> Start a preview or open a project with a running preview.</p>' +
          '<p class="hint">Live Preview reports actual load, interaction, and freshness — not just container existence.</p>',
      );
    }

    if (lp.sessions && lp.sessions.length) {
      html += renderProductCard('Preview Sessions', renderBulletList(
        lp.sessions.map(function (s) {
          return s.previewState + ' — ' + s.projectId + (s.previewUrl ? ' (' + s.previewUrl + ')' : '');
        }),
      ));
    }

    container.innerHTML = html;
    var copyBtn = el('copy-preview-url');
    if (copyBtn && lp.previewUrl) {
      copyBtn.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(lp.previewUrl);
        }
      });
    }
    var refreshBtn = el('refresh-preview-frame');
    if (refreshBtn && lp.previewUrl) {
      refreshBtn.addEventListener('click', function () {
        previewClientReality = { loaded: false, error: false };
        var frame = el('preview-iframe');
        if (frame) {
          frame.dataset.realityBound = '';
          frame.src = lp.previewUrl;
          attachPreviewIframeListeners(lp);
        }
      });
    }
    if (lp.previewUrl) {
      attachPreviewIframeListeners(lp);
    }
  }

  function renderProjectMemorySurface(ws) {
    var container = el('project-memory-surface');
    if (!container) return;
    var pm = (ws && ws.projectMemory) || {};
    var vs = pm.vaultState || {};
    var html =
      renderProductCard(
        'Everything AiDevEngine knows',
        '<p class="product-lead">Everything AiDevEngine knows about this project.</p>' +
          '<p class="hint"><strong>Project vault:</strong> stored knowledge, history, requirements, and decisions — not active workspaces in <strong>Projects</strong>.</p>' +
          '<p>This includes:</p>' +
          '<ul class="product-list">' +
          '<li>requirements</li>' +
          '<li>architecture</li>' +
          '<li>facts</li>' +
          '<li>business rules</li>' +
          '<li>project history</li>' +
          '</ul>' +
          '<p class="hint"><strong>What should I do here?</strong> Review stored knowledge before making build or launch decisions.</p>',
      ) +
      renderIntelligenceHeader(
        'Project Memory',
        'Everything AiDevEngine knows about this project.',
        "This is your project's memory.",
      ) +
      renderProductCard(
        'Project Knowledge',
        '<p class="product-lead">Stored context — requirements, architecture, decisions, facts, conversations, and history.</p>' +
          renderIntelligenceHeroCards([
            { title: 'Requirements', desc: 'Scope, features, and business rules' },
            { title: 'Architecture', desc: 'System structure and technical decisions' },
            { title: 'Facts', desc: 'Known truths gathered during the build' },
            { title: 'History', desc: 'Conversations and project timeline' },
            { title: 'Verification Memory', desc: 'Quality checks and verification history' },
          ]),
      ) +
      renderIntelligenceRelationship() +
      renderProductCard(
        'Context Overview',
        '<div class="stat-row">' +
          '<span><strong>Projects:</strong> ' +
          String(vs.projectCount || 0) +
          '</span>' +
          '<span><strong>Facts:</strong> ' +
          String(vs.factCount || 0) +
          '</span>' +
          '<span><strong>History snapshots:</strong> ' +
          String(vs.snapshotCount || 0) +
          '</span>' +
          '</div>',
      );

    if (pm.projects && pm.projects.length) {
      for (var i = 0; i < pm.projects.length; i += 1) {
        var p = pm.projects[i];
        html +=
          '<section class="card memory-section">' +
          '<h3>' +
          escapeHtml(p.name) +
          '</h3>' +
          '<div class="memory-section-grid">' +
          renderProductCard(
            'Requirements',
            '<p>' + escapeHtml(p.summary || 'No requirements recorded yet.') + '</p>',
          ) +
          renderProductCard(
            'Architecture',
            '<p>Status: ' + escapeHtml(p.status || 'Unknown') + '</p>',
          ) +
          renderProductCard(
            'Known Facts',
            p.recentFacts && p.recentFacts.length
              ? renderBulletList(p.recentFacts)
              : '<p class="empty-state">No facts stored yet.</p>',
          ) +
          renderProductCard(
            'Decisions',
            p.warnings && p.warnings.length
              ? '<p class="hint">Open Project Insights for risks and recommendations.</p>'
              : '<p class="empty-state">No decisions recorded yet.</p>',
          ) +
          '</div></section>';
      }
    } else {
      html +=
        renderProductCard(
          'Requirements',
          '<p class="empty-state">No requirements stored yet.</p><p>Ask Command Center to define your product idea.</p>',
        ) +
        renderProductCard(
          'Architecture',
          '<p class="empty-state">No architecture recorded yet.</p>',
        ) +
        renderProductCard(
          'Business Rules',
          '<p class="empty-state">No business rules stored yet.</p>',
        ) +
        renderProductCard(
          'Known Facts',
          '<p class="empty-state">Project Memory is ready but no project context is stored yet.</p>',
        ) +
        renderProductCard(
          'Verification History',
          '<p class="empty-state">No verification history stored yet.</p>',
        );
    }

    html += renderProductCard(
      'Need recommendations?',
      '<p>Project Memory stores what AiDevEngine <strong>knows</strong>. For health, risks, and next steps, open <strong>Project Insights</strong>.</p>',
    );

    container.innerHTML = html;
  }

  function activeChangeIntelligence(ws) {
    return lastChangeIntelligence || (ws && ws.changeIntelligence) || null;
  }

  function activeFounderActionCenter(ws) {
    return lastFounderActionCenter || (ws && ws.founderActionCenter) || null;
  }

  function actionCenterStatePillClass(state) {
    if (state === 'ACTIONS_READY') return 'ok';
    if (state === 'ACTIONS_BLOCKED' || state === 'ACTIONS_REQUIRING_REVIEW') return 'warn';
    return 'idle';
  }

  function renderFounderActionCenterSurface(ws) {
    var container = el('founder-action-center-surface');
    if (!container) return;
    var plan = activeFounderActionCenter(ws);
    if (!plan) {
      container.innerHTML = renderProductCard(
        'Founder Action Center',
        '<p class="empty-state">Action recommendations are not available yet. Load the workspace or run Founder Testing.</p>',
      );
      return;
    }

    var step = plan.recommendedNextStep;
    var html =
      '<div class="founder-action-center-visibility">' +
      renderProductCard(
        'Founder Action Center',
        '<p class="product-lead">What matters most, what to do next, and what AiDevEngine recommends — without reading every report.</p>' +
          '<p class="status-pill action-center-state ' +
          actionCenterStatePillClass(plan.state) +
          '">' +
          escapeHtml(plan.stateLabel) +
          '</p>' +
          (plan.insufficientInfo
            ? '<p class="hint">' + escapeHtml(plan.insufficientInfoReason || 'Insufficient product state.') + '</p>'
            : ''),
      );

    html += renderProductCard(
      'Recommended Next Step',
      step
        ? '<div class="action-recommended-next">' +
            '<p><span class="action-priority ' +
            escapeHtml(step.priority) +
            '">Priority: ' +
            escapeHtml(step.priority) +
            '</span></p>' +
            '<p><strong>' +
            escapeHtml(step.title) +
            '</strong> <span class="action-type">(' +
            escapeHtml(step.type.replace('_ACTION', '')) +
            ')</span></p>' +
            '<p class="action-reason"><strong>Reason:</strong> ' +
            escapeHtml(step.reason) +
            '</p>' +
            '<p class="action-impact"><strong>Expected impact:</strong> ' +
            escapeHtml(step.expectedImpact) +
            '</p>' +
            '<p class="action-evidence"><span class="change-evidence">Evidence: ' +
            escapeHtml(step.evidence) +
            '</span></p>' +
            '</div>'
        : '<p class="hint">No recommended next step from current product state.</p>',
    );

    html += renderProductCard(
      'Top Actions',
      plan.topActions && plan.topActions.length
        ? '<ol class="action-top-list">' +
            plan.topActions
              .map(function (a) {
                return (
                  '<li><span class="action-priority ' +
                  escapeHtml(a.priority) +
                  '">' +
                  escapeHtml(a.priority) +
                  '</span> <strong>' +
                  escapeHtml(a.title) +
                  '</strong> (' +
                  escapeHtml(a.type.replace('_ACTION', '')) +
                  ')' +
                  (a.executable ? '' : ' <span class="hint">blocked</span>') +
                  '<br><span class="action-reason"><strong>Reason:</strong> ' +
                  escapeHtml(a.rationale) +
                  '</span></li>'
                );
              })
              .join('') +
            '</ol>'
        : '<p class="hint">No actions ranked yet.</p>',
    );

    html += renderProductCard(
      'Action Blockers',
      plan.blockers && plan.blockers.length
        ? '<ul class="action-blocker-list">' +
            plan.blockers
              .map(function (b) {
                return (
                  '<li><strong>' +
                  escapeHtml(b.title) +
                  '</strong><br><strong>Impact:</strong> ' +
                  escapeHtml(b.impact) +
                  '<br><span class="change-evidence">Evidence: ' +
                  escapeHtml(b.evidence) +
                  '</span></li>'
                );
              })
              .join('') +
            '</ul>'
        : '<p class="hint">No blockers detected from current product state.</p>',
    );

    html += renderProductCard(
      'Opportunities',
      plan.opportunities && plan.opportunities.length
        ? '<ul class="action-opportunity-list">' +
            plan.opportunities
              .map(function (o) {
                return (
                  '<li><strong>' +
                  escapeHtml(o.title) +
                  '</strong> — ' +
                  escapeHtml(o.detail) +
                  '<br><span class="change-evidence">Evidence: ' +
                  escapeHtml(o.evidence) +
                  '</span></li>'
                );
              })
              .join('') +
            '</ul>'
        : '<p class="hint">No immediate opportunities surfaced yet.</p>',
    );

    html += renderProductCard(
      'Execution Impact',
      plan.executionImpact && plan.executionImpact.length
        ? '<p>Completing the top actions is expected to:</p><ul>' +
            plan.executionImpact
              .map(function (impact) {
                return '<li>' + escapeHtml(impact) + '</li>';
              })
              .join('') +
            '</ul>'
        : '<p class="hint">Impact summary will appear after actions are ranked.</p>',
    );

    html += '</div>';
    container.innerHTML = html;
  }

  function streamFounderActionCenterFeed(plan) {
    if (!plan || !plan.operatorFeedEvents || !plan.operatorFeedEvents.length) return;
    clearFeedStreamLog();
    runtimeDiagnostics.operatorFeedActive = true;
    var events = plan.operatorFeedEvents;
    var index = 0;
    function step() {
      if (index >= events.length) return;
      var item = events[index];
      appendFeedStreamEvent(
        {
          section: item.section,
          action: item.action,
          detail: item.detail,
          status: item.status,
          evidence: item.evidence,
          stepIndex: index + 1,
          stepTotal: events.length,
          eventType: item.action,
        },
        index < events.length - 1,
      );
      index += 1;
      if (index < events.length) {
        window.setTimeout(step, 260);
      }
    }
    step();
  }

  function activeProductCoherence(ws) {
    return lastProductCoherence || (ws && ws.founderSensemaking) || null;
  }

  function renderSensemakingFindingList(findings, emptyHint) {
    if (!findings || !findings.length) {
      return '<p class="hint">' + escapeHtml(emptyHint) + '</p>';
    }
    return (
      '<ul class="coherence-finding-list">' +
      findings
        .map(function (f) {
          return (
            '<li><span class="coherence-type">' +
            escapeHtml(f.type) +
            '</span> <span class="coherence-severity ' +
            escapeHtml(f.severity) +
            '">' +
            escapeHtml(f.severity) +
            '</span><br><strong>' +
            escapeHtml(f.whatDoesNotMakeSense) +
            '</strong><br><span class="coherence-why"><strong>Why it matters:</strong> ' +
            escapeHtml(f.whyItMatters) +
            '</span><br><span class="coherence-upgrade"><strong>Recommended upgrade:</strong> ' +
            escapeHtml(f.recommendedUpgrade) +
            '</span><br><span class="coherence-impact"><strong>Expected impact:</strong> ' +
            escapeHtml(f.expectedImpact) +
            '</span></li>'
          );
        })
        .join('') +
      '</ul>'
    );
  }

  function renderFounderFrictionHeatmap(plan, ws) {
    var heat = lastFrictionHeatmap;
    var coherenceScore = plan ? plan.productCoherenceScore : 70;
    if (!heat) {
      heat = {
        overallFrictionScore: Math.max(0, Math.min(100, 100 - coherenceScore)),
        categoryScores: [
          {
            category: 'Navigation',
            score: 22,
            detail: 'Navigation labels and purpose separation are mostly clear.',
          },
          {
            category: 'Understanding',
            score: Math.max(10, 100 - coherenceScore),
            detail: 'Screen purpose and product story mostly understandable.',
          },
          {
            category: 'Workflow',
            score: 18,
            detail: 'First workflow and action path guidance are discoverable.',
          },
          {
            category: 'Verification',
            score: 20,
            detail: 'Verification Trust & Evidence makes pass/fail results explainable.',
          },
          {
            category: 'Decision',
            score: plan && plan.topContradictions && plan.topContradictions.length ? 35 : 15,
            detail: 'Recommended next actions and readiness signals mostly align.',
          },
        ],
        highestFrictionAreas: [
          'Decision (35/100 friction)',
          'Understanding (25/100 friction)',
          'Verification (20/100 friction)',
          'Workflow (18/100 friction)',
          'Navigation (22/100 friction)',
        ],
        confusionHotspots: plan && plan.topConfusionRisks && plan.topConfusionRisks.length
          ? plan.topConfusionRisks.slice(0, 5).map(function (f, idx) {
              return {
                concept: f.whatDoesNotMakeSense,
                screen: f.area,
                detail: f.whyItMatters,
              };
            })
          : [
              {
                concept: 'No major confusion hotspots detected',
                detail: 'Current onboarding and navigation layers are holding up.',
              },
            ],
        deadEndFindings: plan && plan.findings
          ? plan.findings
              .filter(function (f) {
                return f.type === 'DEAD_END';
              })
              .slice(0, 5)
              .map(function (f) {
                return {
                  screen: f.area,
                  detail: f.whatDoesNotMakeSense,
                  recommendedFix: f.recommendedUpgrade,
                };
              })
          : [],
        explanationDependency: [
          { screen: 'Verification', dependency: 'Requires Explanation' },
          { screen: 'Project Insights', dependency: 'Requires Explanation' },
          { screen: 'Live Preview', dependency: 'Requires Explanation' },
          { screen: 'Project Memory', dependency: 'Requires Explanation' },
          { screen: 'Product Coherence', dependency: 'Requires Explanation' },
        ],
        summary: {
          frictionLevel: coherenceScore >= 70 ? 'LOW' : coherenceScore >= 55 ? 'MODERATE' : 'HIGH',
          mostLikelyAbandonmentPoint: 'Action Center when verification fails without next steps',
          mostLikelyConfusionPoint:
            plan && plan.topConfusionRisks && plan.topConfusionRisks[0]
              ? plan.topConfusionRisks[0].whatDoesNotMakeSense
              : 'Overlapping navigation destinations',
          mostSuccessfulJourney:
            'Create/Open Project → Describe Vision → Review Insights → Live Preview → Verification → Launch',
          recommendedUxImprovements: plan && plan.recommendedUpgrades && plan.recommendedUpgrades.length
            ? plan.recommendedUpgrades.slice(0, 4).map(function (u) {
                return u.title;
              })
            : ['Maintain current onboarding, action path, and verification trust clarity.'],
        },
      };
    }

    if (!heat.deadEndFindings || !heat.deadEndFindings.length) {
      heat.deadEndFindings = [
        {
          screen: 'None detected',
          detail: 'Bounded analysis found no obvious dead-end screens without a next action.',
          recommendedFix: 'Continue monitoring after major UX changes.',
        },
      ];
    }

    var categoryHtml =
      '<p><strong>Navigation Friction Score:</strong> ' +
      String(heat.categoryScores[0] ? heat.categoryScores[0].score : 0) +
      '/100</p>' +
      '<p><strong>Understanding Friction Score:</strong> ' +
      String(heat.categoryScores[1] ? heat.categoryScores[1].score : 0) +
      '/100</p>' +
      '<p><strong>Workflow Friction Score:</strong> ' +
      String(heat.categoryScores[2] ? heat.categoryScores[2].score : 0) +
      '/100</p>' +
      '<p><strong>Verification Friction Score:</strong> ' +
      String(heat.categoryScores[3] ? heat.categoryScores[3].score : 0) +
      '/100</p>' +
      '<p><strong>Decision Friction Score:</strong> ' +
      String(heat.categoryScores[4] ? heat.categoryScores[4].score : 0) +
      '/100</p>';
    for (var ci = 0; ci < heat.categoryScores.length; ci += 1) {
      var cat = heat.categoryScores[ci];
      categoryHtml +=
        '<p class="friction-category-detail">' +
        escapeHtml(cat.category) +
        ': ' +
        escapeHtml(cat.detail) +
        '</p>';
    }

    var rankingHtml = '<ol class="friction-ranking-list">';
    for (var ri = 0; ri < heat.highestFrictionAreas.length; ri += 1) {
      rankingHtml += '<li>' + escapeHtml(heat.highestFrictionAreas[ri]) + '</li>';
    }
    rankingHtml += '</ol>';

    var hotspotHtml = '<ul class="friction-hotspot-list">';
    for (var hi = 0; hi < heat.confusionHotspots.length; hi += 1) {
      var spot = heat.confusionHotspots[hi];
      hotspotHtml +=
        '<li><strong>' +
        escapeHtml(spot.concept) +
        '</strong>' +
        (spot.screen ? ' — ' + escapeHtml(spot.screen) : '') +
        '<br><span class="friction-detail">' +
        escapeHtml(spot.detail || '') +
        '</span></li>';
    }
    hotspotHtml += '</ul>';

    var deadEndHtml = '<ul class="friction-dead-end-list">';
    for (var di = 0; di < heat.deadEndFindings.length; di += 1) {
      var dead = heat.deadEndFindings[di];
      deadEndHtml +=
        '<li><strong>' +
        escapeHtml(dead.screen) +
        '</strong>: ' +
        escapeHtml(dead.detail) +
        (dead.recommendedFix
          ? '<br><span class="friction-detail">Fix: ' + escapeHtml(dead.recommendedFix) + '</span>'
          : '') +
        '</li>';
    }
    deadEndHtml += '</ul>';

    var explainHtml = '<ul class="friction-explanation-list">';
    for (var ei = 0; ei < heat.explanationDependency.length; ei += 1) {
      var ex = heat.explanationDependency[ei];
      explainHtml +=
        '<li><strong>' +
        escapeHtml(ex.screen) +
        ':</strong> ' +
        escapeHtml(ex.dependency) +
        (ex.detail ? ' — ' + escapeHtml(ex.detail) : '') +
        '</li>';
    }
    explainHtml += '</ul>';

    var improveHtml = '<ul class="friction-improvement-list">';
    for (var ui = 0; ui < heat.summary.recommendedUxImprovements.length; ui += 1) {
      improveHtml += '<li>' + escapeHtml(heat.summary.recommendedUxImprovements[ui]) + '</li>';
    }
    improveHtml += '</ul>';

    return (
      '<div class="founder-friction-heatmap" id="founder-friction-heatmap">' +
      renderProductCard(
        'Founder Friction Heatmap',
        '<p class="product-lead">Where founders get stuck, confused, abandon workflows, or need extra explanation — ranked automatically from existing product reality signals.</p>' +
          renderProductCard(
            'Friction Category Scores',
            categoryHtml,
          ) +
          renderProductCard(
            'Highest Friction Areas',
            rankingHtml,
          ) +
          renderProductCard(
            'Confusion Hotspots',
            hotspotHtml,
          ) +
          renderProductCard(
            'Dead-End Findings',
            deadEndHtml,
          ) +
          renderProductCard(
            'Explanation Dependency',
            explainHtml,
          ) +
          renderProductCard(
            'Founder Heatmap Summary',
            '<p><strong>Friction Level:</strong> ' +
              escapeHtml(heat.summary.frictionLevel) +
              '</p>' +
              '<p><strong>Overall friction:</strong> ' +
              String(heat.overallFrictionScore) +
              '/100</p>' +
              '<p><strong>Most Likely Abandonment Point:</strong> ' +
              escapeHtml(heat.summary.mostLikelyAbandonmentPoint) +
              '</p>' +
              '<p><strong>Most Likely Confusion Point:</strong> ' +
              escapeHtml(heat.summary.mostLikelyConfusionPoint) +
              '</p>' +
              '<p><strong>Most Successful Journey:</strong> ' +
              escapeHtml(heat.summary.mostSuccessfulJourney) +
              '</p>' +
              '<p><strong>Recommended UX Improvements</strong></p>' +
              improveHtml,
          ),
      ) +
      '</div>'
    );
  }

  function renderProductCoherenceSurface(ws) {
    var container = el('product-coherence-surface');
    if (!container) return;
    var plan = activeProductCoherence(ws);
    if (!plan) {
      container.innerHTML = renderProductCard(
        'Product Coherence',
        '<p class="empty-state">Coherence analysis is not available yet. Load the workspace or run Founder Testing.</p>',
      );
      return;
    }

    var html =
      '<div class="product-coherence-visibility">' +
      renderProductCard(
        'Product Coherence',
        '<p class="product-lead">Does the product make sense as one story — or are founders getting conflicting guidance?</p>' +
          '<p><strong>Founder Sensemaking Score:</strong> ' +
          escapeHtml(String(plan.founderSensemakingScore)) +
          '/100</p>' +
          '<p><strong>Product Coherence Score:</strong> ' +
          escapeHtml(String(plan.productCoherenceScore)) +
          '/100</p>' +
          (plan.insufficientInfo
            ? '<p class="hint">' + escapeHtml(plan.insufficientInfoReason || 'Insufficient product state.') + '</p>'
            : ''),
      );

    html += renderProductCard(
      "What Doesn't Make Sense",
      renderSensemakingFindingList(
        plan.findings,
        'No major coherence gaps detected from current product state.',
      ),
    );

    html += renderProductCard(
      'Contradictions',
      renderSensemakingFindingList(
        plan.topContradictions,
        'No contradictions detected across Insights, Verification, and Action Center.',
      ),
    );

    html += renderProductCard(
      'Trust Risks',
      renderSensemakingFindingList(
        plan.topTrustRisks,
        'No major trust risks flagged.',
      ),
    );

    html += renderProductCard(
      'Recommended Upgrades',
      plan.recommendedUpgrades && plan.recommendedUpgrades.length
        ? '<ol class="coherence-upgrade-list">' +
            plan.recommendedUpgrades
              .map(function (u) {
                return (
                  '<li><span class="coherence-severity ' +
                  escapeHtml(u.priority) +
                  '">' +
                  escapeHtml(u.priority) +
                  '</span> <strong>' +
                  escapeHtml(u.title) +
                  '</strong><br><span class="coherence-impact"><strong>Expected impact:</strong> ' +
                  escapeHtml(u.expectedImpact) +
                  '</span></li>'
                );
              })
              .join('') +
            '</ol>'
        : '<p class="hint">No urgent upgrades recommended.</p>',
    );

    html += renderProductCard(
      'Expected Impact',
      plan.recommendedUpgrades && plan.recommendedUpgrades.length
        ? '<ul class="coherence-impact-list">' +
            plan.recommendedUpgrades
              .slice(0, 4)
              .map(function (u) {
                return '<li>' + escapeHtml(u.expectedImpact) + '</li>';
              })
              .join('') +
            '</ul>'
        : '<p class="hint">Fixing coherence issues should improve founder trust and decision speed.</p>',
    );

    html += renderFounderFrictionHeatmap(plan, ws);
    html += '</div>';
    container.innerHTML = html;
  }

  function streamProductCoherenceFeed(plan) {
    if (!plan || !plan.operatorFeedEvents || !plan.operatorFeedEvents.length) return;
    clearFeedStreamLog();
    runtimeDiagnostics.operatorFeedActive = true;
    var events = plan.operatorFeedEvents;
    var index = 0;
    function step() {
      if (index >= events.length) return;
      var item = events[index];
      appendFeedStreamEvent(
        {
          section: item.section,
          action: item.action,
          detail: item.detail,
          status: item.status,
          evidence: item.evidence,
          stepIndex: index + 1,
          stepTotal: events.length,
          eventType: item.action,
        },
        index < events.length - 1,
      );
      index += 1;
      if (index < events.length) {
        window.setTimeout(step, 260);
      }
    }
    step();
  }

  function renderChangeIntelligencePanel(ci) {
    if (!ci) {
      return renderProductCard(
        'Change Intelligence',
        '<p class="empty-state">Change history is not available yet.</p>',
      );
    }

    var impact = ci.impactSummary || {};
    var html =
      '<div class="change-intelligence-visibility">' +
      renderProductCard(
        'Change Intelligence',
        '<p class="product-lead">What changed, what improved, and what regressed — without comparing reports manually.</p>' +
          (ci.hasSufficientHistory
            ? '<p><strong>Impact summary:</strong> ' +
              String(impact.improvementCount || 0) +
              ' improvements, ' +
              String(impact.regressionCount || 0) +
              ' regressions, ' +
              String(impact.newCount || 0) +
              ' new updates</p>'
            : '<p class="hint">' + escapeHtml(ci.insufficientHistoryReason || 'Insufficient history yet.') + '</p>') +
          (ci.scoreMovementExplanation
            ? '<p><strong>Score movement:</strong> ' + escapeHtml(ci.scoreMovementExplanation) + '</p>'
            : '') +
          (ci.readinessMovementExplanation
            ? '<p><strong>Readiness movement:</strong> ' + escapeHtml(ci.readinessMovementExplanation) + '</p>'
            : ''),
      );

    if (ci.recentChanges && ci.recentChanges.length) {
      html += renderProductCard(
        'Recent Changes',
        '<ul>' +
          ci.recentChanges
            .slice(0, 6)
            .map(function (c) {
              return (
                '<li><strong>' +
                escapeHtml(c.title) +
                '</strong> (' +
                escapeHtml(c.direction) +
                ', ' +
                escapeHtml(c.severity) +
                ')<br>' +
                escapeHtml(c.description) +
                '<br><span class="change-evidence">Evidence: ' +
                escapeHtml(c.evidence) +
                '</span></li>'
              );
            })
            .join('') +
          '</ul>',
      );
    } else {
      html += renderProductCard('Recent Changes', '<p class="hint">No meaningful changes detected yet.</p>');
    }

    if (ci.regressions && ci.regressions.length) {
      html += renderProductCard(
        'Regressions',
        '<ul>' +
          ci.regressions
            .map(function (c) {
              return '<li><strong>' + escapeHtml(c.title) + '</strong> — ' + escapeHtml(c.evidence) + '</li>';
            })
            .join('') +
          '</ul>',
      );
    } else {
      html += renderProductCard('Regressions', '<p class="hint">No regressions detected in the latest comparison.</p>');
    }

    html += renderProductCard(
      'Recommended Review Order',
      ci.recommendedReviewOrder && ci.recommendedReviewOrder.length
        ? '<ol>' +
            ci.recommendedReviewOrder
              .map(function (item) {
                return '<li>' + escapeHtml(item) + '</li>';
              })
              .join('') +
            '</ol>'
        : '<p class="hint">Run Founder Testing to establish review priorities.</p>',
    );

    html += renderProductCard(
      'Timeline',
      '<div class="change-intelligence-timeline">' +
        (ci.timeline && ci.timeline.length
          ? ci.timeline
              .map(function (entry) {
                return (
                  '<div class="change-timeline-entry"><strong>' +
                  escapeHtml(entry.timeLabel) +
                  '</strong><br>' +
                  escapeHtml(entry.summary) +
                  '<br><span class="change-evidence">Evidence: ' +
                  escapeHtml(entry.evidence) +
                  '</span></div>'
                );
              })
              .join('')
          : '<p class="hint">Timeline will populate after meaningful product events.</p>') +
        '</div>',
    );

    html += '</div>';
    return html;
  }

  function streamChangeIntelligenceFeed(ci) {
    if (!ci || !ci.operatorFeedEvents || !ci.operatorFeedEvents.length) return;
    clearFeedStreamLog();
    runtimeDiagnostics.operatorFeedActive = true;
    var events = ci.operatorFeedEvents;
    var index = 0;
    function step() {
      if (index >= events.length) return;
      var item = events[index];
      appendFeedStreamEvent(
        {
          section: item.section,
          action: item.action,
          detail: item.detail,
          status: item.status,
          evidence: item.evidence,
          stepIndex: index + 1,
          stepTotal: events.length,
          eventType: item.action,
        },
        index < events.length - 1,
      );
      index += 1;
      if (index < events.length) {
        window.setTimeout(step, 260);
      }
    }
    step();
  }

  function verificationStatePillClass(state) {
    if (state === 'VERIFICATION_READY' || state === 'VERIFICATION_LAUNCH_READY') return 'ok';
    if (state === 'VERIFICATION_FAILED' || state === 'VERIFICATION_BLOCKED') return 'warn';
    return 'idle';
  }

  function activeVerificationResults(ws) {
    if (founderTestRunning) {
      return {
        state: 'VERIFICATION_RUNNING',
        stateLabel: 'Verification running',
        summary: {
          readinessScore: 0,
          passCount: 0,
          failCount: 0,
          blockedCount: 0,
          warningCount: 0,
          lastRunLabel: 'Founder Testing V4 in progress',
        },
        categories: [],
        fixesNext: [],
        betaReady: false,
        launchReady: false,
        betaReadyReason: 'Results pending — Founder Testing is running.',
        launchReadyReason: 'Results pending — Founder Testing is running.',
        operatorFeedEvents: [],
      };
    }
    return lastVerificationResults || (ws && ws.verificationResults) || null;
  }

  function renderVerificationCategoryGroups(categories) {
    if (!categories || !categories.length) {
      return '<p class="hint">Run Founder Testing to see grouped results by product area.</p>';
    }
    var html = '';
    for (var i = 0; i < categories.length; i += 1) {
      var group = categories[i];
      html +=
        '<div class="verification-category-group">' +
        '<h3>' +
        escapeHtml(group.category) +
        '</h3>' +
        '<p class="hint">Passed: ' +
        String(group.passCount) +
        ' | Failed: ' +
        String(group.failCount) +
        ' | Blocked: ' +
        String(group.blockedCount) +
        ' | Warnings: ' +
        String(group.warningCount) +
        '</p>';
      if (group.checks && group.checks.length) {
        html += '<ul>';
        for (var j = 0; j < group.checks.length; j += 1) {
          var check = group.checks[j];
          html +=
            '<li><strong>' +
            escapeHtml(check.checkName) +
            '</strong> — ' +
            escapeHtml(check.status) +
            '<br><span class="hint">' +
            escapeHtml(check.meaning) +
            '</span><br><span class="verification-evidence">Evidence: ' +
            escapeHtml(check.evidence) +
            '</span></li>';
        }
        html += '</ul>';
      }
      html += '</div>';
    }
    return html;
  }

  function streamVerificationResultsFeed(vr) {
    if (!vr || !vr.operatorFeedEvents || !vr.operatorFeedEvents.length) return;
    clearFeedStreamLog();
    runtimeDiagnostics.operatorFeedActive = true;
    var events = vr.operatorFeedEvents;
    var index = 0;
    function step() {
      if (index >= events.length) return;
      var item = events[index];
      appendFeedStreamEvent(
        {
          section: item.section,
          action: item.action,
          detail: item.detail,
          status: item.status,
          evidence: item.evidence,
          stepIndex: index + 1,
          stepTotal: events.length,
          eventType: item.action,
        },
        index < events.length - 1,
      );
      index += 1;
      if (index < events.length) {
        window.setTimeout(step, 260);
      }
    }
    step();
  }

  function deriveVerificationTrustStatus(vr) {
    if (!vr || vr.state === 'NO_VERIFICATION_RUN' || vr.state === 'VERIFICATION_RUNNING') {
      return {
        status: 'NOT RUN',
        statusKey: 'not-run',
        explanation: 'Run Founder Testing to produce an explainable verification result.',
      };
    }
    if (vr.state === 'VERIFICATION_FAILED' || vr.state === 'VERIFICATION_BLOCKED') {
      return {
        status: 'FAIL',
        statusKey: 'fail',
        explanation:
          String((vr.summary && vr.summary.failCount) || 0) +
          ' failed and ' +
          String((vr.summary && vr.summary.blockedCount) || 0) +
          ' blocked check(s) reduce launch confidence.',
      };
    }
    if (vr.state === 'VERIFICATION_WARNINGS' || ((vr.summary && vr.summary.warningCount) || 0) > 0) {
      return {
        status: 'PASS WITH WARNINGS',
        statusKey: 'warn',
        explanation:
          String((vr.summary && vr.summary.warningCount) || 0) +
          ' warning(s) remain — review before widening access.',
      };
    }
    return {
      status: 'PASS',
      statusKey: 'pass',
      explanation: 'Required checks passed with supporting evidence and no launch-blocking failures.',
    };
  }

  function deriveVerificationTrustConfidence(vr, statusKey) {
    if (statusKey === 'not-run') {
      return {
        confidence: 'Low',
        explanation: 'No verification run yet — confidence cannot be established.',
      };
    }
    if (statusKey === 'fail') {
      return {
        confidence: 'Low',
        explanation: 'Failed or blocked checks reduce launch confidence until issues are resolved.',
      };
    }
    var score = (vr && vr.summary && vr.summary.readinessScore) || 0;
    if (statusKey === 'pass' && score >= 75 && ((vr.summary && vr.summary.failCount) || 0) === 0) {
      return {
        confidence: 'High',
        explanation: 'Strong readiness score, passing checks, and visible evidence support this result.',
      };
    }
    if (statusKey === 'warn' || score >= 55) {
      return {
        confidence: 'Medium',
        explanation: 'Core checks passed but warnings or moderate readiness keep confidence cautious.',
      };
    }
    return {
      confidence: 'Low',
      explanation: 'Readiness score or evidence gaps leave meaningful uncertainty.',
    };
  }

  function founderReadableVerificationEvidence(check) {
    var raw = (check && check.evidence) || '';
    if (!raw || raw === 'No verification run recorded.') {
      return (check && check.meaning) || 'Evidence will appear after Founder Testing runs.';
    }
    return raw
      .replace(/Preview state:/gi, 'Preview status:')
      .replace(/Memory score:/gi, 'Project memory score:')
      .replace(/Vision alignment:/gi, 'Product identity alignment:')
      .replace(/Human success rate:/gi, 'Founder navigation clarity:')
      .replace(/Verification score:/gi, 'Verification readiness:');
  }

  function renderVerificationTrustEvidence(vr, durationMs) {
    var trust = deriveVerificationTrustStatus(vr);
    var conf = deriveVerificationTrustConfidence(vr, trust.statusKey);
    var summary = (vr && vr.summary) || {};
    var executed =
      (summary.passCount || 0) +
      (summary.failCount || 0) +
      (summary.blockedCount || 0) +
      (summary.warningCount || 0) +
      (summary.notRunCount || 0);
    var checks = [];
    if (vr && vr.categories) {
      for (var gi = 0; gi < vr.categories.length; gi += 1) {
        checks = checks.concat(vr.categories[gi].checks || []);
      }
    }
    var prioritized = checks.slice().sort(function (a, b) {
      var rank = { FAIL: 0, BLOCKED: 1, WARNING: 2, PASS: 3, NOT_RUN: 4 };
      return (rank[a.status] || 5) - (rank[b.status] || 5);
    });
    var major = prioritized.slice(0, 5);

    var guidanceHtml = '';
    if (trust.statusKey === 'pass') {
      guidanceHtml =
        '<p class="verification-trust-guidance-lead">Verification passed.</p>' +
        '<p><strong>Recommended next steps:</strong></p>' +
        '<ul class="verification-trust-steps"><li>Review remaining recommendations</li><li>Test key workflows</li><li>Prepare launch activities</li></ul>';
    } else if (trust.statusKey === 'warn') {
      guidanceHtml =
        '<p class="verification-trust-guidance-lead">Verification passed with concerns.</p>' +
        '<p><strong>Recommended next steps:</strong></p>' +
        '<ul class="verification-trust-steps"><li>Review warnings</li><li>Address risks where practical</li><li>Re-run Verification</li></ul>';
    } else if (trust.statusKey === 'fail') {
      guidanceHtml =
        '<p class="verification-trust-guidance-lead">Verification identified launch-blocking issues.</p>' +
        '<p><strong>Recommended next steps:</strong></p>' +
        '<ul class="verification-trust-steps"><li>Review failures</li><li>Fix identified issues</li><li>Re-run Verification</li></ul>';
    } else {
      guidanceHtml =
        '<p class="verification-trust-guidance-lead">Run Founder Testing to generate explainable verification results.</p>' +
        '<p><strong>Recommended next steps:</strong></p>' +
        '<ul class="verification-trust-steps"><li>Open Verification</li><li>Run Founder Test</li><li>Review evidence and next steps here</li></ul>';
    }

    var findingsHtml = '';
    if (!major.length) {
      findingsHtml =
        '<p class="hint">Run Founder Testing to populate evidence-backed findings for Navigation, Readiness, and Launch Readiness.</p>';
    } else {
      findingsHtml = '<div class="verification-trust-findings">';
      for (var fi = 0; fi < major.length; fi += 1) {
        var check = major[fi];
        findingsHtml +=
          '<section class="verification-trust-finding">' +
          '<h4>' +
          escapeHtml(check.category + ' — ' + check.checkName) +
          '</h4>' +
          '<p><strong>What Was Checked</strong><br>' +
          escapeHtml(check.checkName) +
          '</p>' +
          '<p><strong>Evidence Found</strong><br>' +
          escapeHtml(founderReadableVerificationEvidence(check)) +
          '</p>' +
          (check.status === 'PASS'
            ? '<p><strong>Why It Passed</strong><br>' +
              escapeHtml(
                check.meaning && !/not|fail|blocked/i.test(check.meaning)
                  ? check.meaning
                  : check.checkName + ' completed successfully with supporting evidence.',
              ) +
              '</p>'
            : '') +
          (check.status === 'FAIL' || check.status === 'BLOCKED' || check.status === 'WARNING'
            ? '<p><strong>Why It Failed</strong><br>' +
              escapeHtml(
                check.recommendedAction
                  ? check.meaning + ' ' + check.recommendedAction
                  : check.meaning || 'This check did not meet launch readiness expectations.',
              ) +
              '</p>'
            : '') +
          '</section>';
      }
      findingsHtml += '</div>';
    }

    var durationLabel =
      durationMs && durationMs > 0
        ? durationMs < 1000
          ? durationMs + 'ms'
          : (durationMs / 1000).toFixed(1) + 's'
        : 'Pending first run';

    return (
      '<div class="verification-trust-evidence" id="verification-trust-evidence">' +
      renderProductCard(
        'Verification Trust & Evidence',
        '<p class="product-lead">Every pass, warning, and failure is explainable — founders should never wonder why AiDevEngine reached this conclusion.</p>' +
          renderProductCard(
            'Verification Summary',
            '<p class="status-pill verification-trust-status verification-trust-status-' +
              escapeHtml(trust.statusKey) +
              '">' +
              escapeHtml(trust.status) +
              '</p>' +
              '<p><strong>Status explanation:</strong> ' +
              escapeHtml(trust.explanation) +
              '</p>' +
              '<p><strong>Confidence:</strong> ' +
              escapeHtml(conf.confidence) +
              '</p>' +
              '<p class="verification-trust-confidence-explanation"><strong>Confidence explanation:</strong> ' +
              escapeHtml(conf.explanation) +
              '</p>' +
              '<p><strong>Verification Timestamp:</strong> ' +
              escapeHtml(summary.lastRunLabel || 'Not run yet') +
              '</p>' +
              '<p><strong>Verification Duration:</strong> ' +
              escapeHtml(durationLabel) +
              '</p>' +
              '<p><strong>Checks Executed:</strong> ' +
              String(executed) +
              '</p>' +
              '<p><strong>Checks Passed:</strong> ' +
              String(summary.passCount || 0) +
              ' | <strong>Checks Failed:</strong> ' +
              String((summary.failCount || 0) + (summary.blockedCount || 0)) +
              ' | <strong>Checks Skipped:</strong> ' +
              String(summary.notRunCount || 0) +
              '</p>',
          ) +
          findingsHtml +
          renderProductCard(
            'What Verification Checked',
            '<ul class="verification-trust-scope">' +
              '<li>Navigation</li><li>Readiness</li><li>Critical workflows</li><li>Application availability</li><li>Required assets</li><li>Live Preview interaction</li><li>Project context retention</li>' +
              '</ul>',
          ) +
          renderProductCard(
            'What Verification Did Not Check',
            '<ul class="verification-trust-scope verification-trust-scope-limits">' +
              '<li>Real customer usage</li><li>Production traffic</li><li>Business viability</li><li>Marketing readiness</li><li>Future scalability</li>' +
              '</ul>' +
              '<p class="hint">A PASS result does not guarantee business success — it means required product checks passed with visible evidence.</p>',
          ) +
          renderProductCard('Founder Guidance', guidanceHtml),
      ) +
      '</div>'
    );
  }

  function executionProofLabelClass(label) {
    if (label === 'PROVEN') return 'execution-proof-proven';
    if (label === 'PARTIAL' || label === 'CLAIMED') return 'execution-proof-partial';
    if (label === 'BLOCKED') return 'execution-proof-blocked';
    if (label === 'UNAVAILABLE') return 'execution-proof-unavailable';
    return 'execution-proof-unproven';
  }

  function renderExecutionProofList(items, emptyText) {
    if (!items || !items.length) {
      return '<p class="hint">' + escapeHtml(emptyText || 'None listed.') + '</p>';
    }
    return '<ul class="execution-proof-list">' + items.map(function (item) {
      return '<li>' + escapeHtml(String(item)) + '</li>';
    }).join('') + '</ul>';
  }

  function renderExecutionProofDashboard(data) {
    if (!data) {
      return (
        '<section class="card execution-proof-dashboard" id="execution-proof-dashboard">' +
        '<h2>Execution Proof</h2>' +
        '<p class="product-lead">Loading current execution truth from 24A reality authorities…</p>' +
        '</section>'
      );
    }

    var truthRows = (data.workflowTruthMap || []).map(function (row) {
      return (
        '<div class="execution-proof-truth-row">' +
        '<span class="execution-proof-stage">' + escapeHtml(row.display || row.stage) + '</span>' +
        '<span class="status-pill execution-proof-label ' + executionProofLabelClass(row.label) + '">' +
        escapeHtml(row.label) +
        '</span></div>'
      );
    }).join('');

    var scoreRows =
      '<div class="execution-proof-scores">' +
      '<p><strong>Autonomous Builder Reality:</strong> ' + String(data.scores.builderReality) + '/100</p>' +
      '<p><strong>Live Preview Reality:</strong> ' + String(data.scores.livePreviewReality) + '/100</p>' +
      '<p><strong>Verification Reality:</strong> ' + String(data.scores.verificationReality) + '/100</p>' +
      '<p><strong>Founder Workflow Reality:</strong> ' + String(data.scores.founderWorkflowReality) + '/100</p>' +
      '</div>';

    return (
      '<section class="card execution-proof-dashboard" id="execution-proof-dashboard">' +
      '<h2>Execution Proof</h2>' +
      '<p class="product-lead">This is the current execution truth — where the founder workflow stops today and what must be built next. Not a marketing score.</p>' +
      renderProductCard(
        'Workflow Truth Map',
        '<div class="execution-proof-truth-map">' + truthRows + '</div>' +
        '<p class="hint">Last proven stage: <strong>' + escapeHtml(data.lastProvenStage || 'Unknown') + '</strong></p>',
      ) +
      renderProductCard(
        'Current Bottleneck',
        '<p class="execution-proof-bottleneck"><strong>Current Bottleneck:</strong> ' + escapeHtml(data.currentBottleneck || 'Unknown') + '</p>' +
        '<p><strong>Next Required Capability:</strong> ' + escapeHtml(data.nextRequiredCapability || 'Unknown') + '</p>' +
        '<p class="hint">This is what must be built next before later stages can be proven.</p>',
      ) +
      renderProductCard(
        'Launch Readiness',
        '<p class="status-pill execution-proof-label ' + executionProofLabelClass(data.launchReadiness && data.launchReadiness.status === 'LAUNCH_READINESS_PROVEN' ? 'PROVEN' : data.launchReadiness && data.launchReadiness.status === 'LAUNCH_READINESS_PARTIAL' ? 'PARTIAL' : 'UNAVAILABLE') + '">' +
        escapeHtml((data.launchReadiness && data.launchReadiness.status) || 'LAUNCH_READINESS_UNAVAILABLE') +
        '</p>' +
        '<p><strong>Reason:</strong> ' + escapeHtml((data.launchReadiness && data.launchReadiness.reason) || 'No connected build execution evidence.') + '</p>',
      ) +
      renderProductCard('Reality Scores', scoreRows) +
      renderProductCard(
        'Execution Foundation',
        '<p class="hint">Current execution foundation state — read-only. Planned actions are not executed from this dashboard.</p>' +
        '<p><strong>Execution Workspace:</strong> ' +
        escapeHtml((data.executionFoundation && data.executionFoundation.workspace && data.executionFoundation.workspace.label) || 'Loading…') +
        '</p>' +
        '<p><strong>Execution Queue:</strong> ' +
        escapeHtml((data.executionFoundation && data.executionFoundation.queue && data.executionFoundation.queue.label) || 'Loading…') +
        '</p>' +
        '<p><strong>Execution Evidence:</strong> ' +
        escapeHtml((data.executionFoundation && data.executionFoundation.evidence && data.executionFoundation.evidence.label) || 'Loading…') +
        '</p>' +
        '<p class="hint">' +
        escapeHtml((data.executionFoundation && data.executionFoundation.founderConclusion) || '') +
        '</p>',
      ) +
      renderProductCard(
        'Controlled Builder Execution',
        '<p class="hint">Controlled execution inside isolated workspaces — read-only. No execution controls on this dashboard.</p>' +
        '<p><strong>Execution Sessions:</strong> ' +
        escapeHtml((data.controlledBuilderExecution && data.controlledBuilderExecution.sessions && data.controlledBuilderExecution.sessions.label) || 'Loading…') +
        '</p>' +
        '<p><strong>Execution Actions Completed:</strong> ' +
        escapeHtml((data.controlledBuilderExecution && data.controlledBuilderExecution.actions && data.controlledBuilderExecution.actions.label) || 'Loading…') +
        '</p>' +
        '<p><strong>Execution Evidence Generated:</strong> ' +
        escapeHtml((data.controlledBuilderExecution && data.controlledBuilderExecution.evidence && data.controlledBuilderExecution.evidence.label) || 'Loading…') +
        '</p>' +
        '<p><strong>Execution State:</strong> ' +
        escapeHtml((data.controlledBuilderExecution && data.controlledBuilderExecution.state && data.controlledBuilderExecution.state.label) || 'Loading…') +
        '</p>' +
        '<p><strong>Workspace Isolation Status:</strong> ' +
        escapeHtml((data.controlledBuilderExecution && data.controlledBuilderExecution.isolation && data.controlledBuilderExecution.isolation.label) || 'Loading…') +
        '</p>' +
        '<p class="hint">' +
        escapeHtml((data.controlledBuilderExecution && data.controlledBuilderExecution.founderConclusion) || '') +
        '</p>',
      ) +
      renderProductCard(
        'Evidence Summary',
        '<p><strong>Evidence Found</strong></p>' +
        renderExecutionProofList(data.evidenceFound, 'No evidence listed yet.') +
        '<p><strong>Missing Evidence</strong></p>' +
        renderExecutionProofList(data.missingEvidence, 'No missing evidence listed.') +
        '<p><strong>Founder Blockers</strong></p>' +
        renderExecutionProofList(data.founderBlockers, 'No blockers ranked.') +
        '<p class="hint">' + escapeHtml(data.founderConclusion || '') + '</p>',
      ) +
      '<div class="execution-proof-actions">' +
      '<button type="button" class="btn-secondary" id="copy-execution-proof-report">Copy Execution Proof Report</button>' +
      '</div>' +
      '</section>'
    );
  }

  function bindExecutionProofActions() {
    var copyBtn = el('copy-execution-proof-report');
    if (!copyBtn || copyBtn.getAttribute('data-bound') === 'true') return;
    copyBtn.setAttribute('data-bound', 'true');
    copyBtn.addEventListener('click', function () {
      var text = executionProofData && executionProofData.copyReportText;
      if (!text) {
        pushNotification('Execution Proof report not loaded yet');
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          pushNotification('Execution Proof report copied');
        }).catch(function () {
          pushNotification('Could not copy Execution Proof report');
        });
      } else {
        pushNotification('Clipboard unavailable in this browser');
      }
    });
  }

  function loadExecutionProof(force) {
    if (!force && executionProofData) {
      return Promise.resolve(executionProofData);
    }
    if (!force && executionProofLoadPromise) {
      return executionProofLoadPromise;
    }
    executionProofLoadPromise = fetch('/api/founder/execution-proof', { method: 'GET', cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('execution-proof HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        executionProofData = data;
        return data;
      })
      .finally(function () {
        executionProofLoadPromise = null;
      });
    return executionProofLoadPromise;
  }

  function refreshExecutionProofPanel() {
    if (currentViewId === 'verification') {
      renderVerificationSurface(workspaceData, manifestData);
    }
  }

  function renderVerificationSurface(ws, manifest) {
    var container = el('verification-surface');
    if (!container) return;
    var v = (ws && ws.verification) || {};
    var vr = activeVerificationResults(ws);
    var state = (vr && vr.state) || 'NO_VERIFICATION_RUN';
    var summary = (vr && vr.summary) || {
      readinessScore: 0,
      passCount: 0,
      failCount: 0,
      blockedCount: 0,
      warningCount: 0,
    };

    var html = renderExecutionProofDashboard(executionProofData);
    html +=
      renderProductCard(
        'Verification Readiness',
        '<p class="product-lead">Verification Readiness indicates whether sufficient testing and validation evidence exists to confidently review, test, beta, or launch the project.</p>' +
          '<p class="founder-path-guidance">Run Verification to determine whether your application is ready for launch.</p>' +
          '<p class="hint"><strong>Verification vs Project Insights:</strong> Verification gives pass/fail proof and launch confidence. Project Insights explains health, patterns, risks, and recommendations.</p>' +
          '<p><strong>Status:</strong> ' +
          escapeHtml(v.readinessLabel || 'Loading…') +
          '</p>' +
          '<p><strong>Verification scripts available:</strong> ' +
          String(v.validatorCount || 0) +
          '</p>' +
          '<p class="hint"><strong>What should I do here?</strong> Run Founder Testing and review pass/fail evidence before beta or launch.</p>',
      ) +
      renderChangeIntelligencePanel(activeChangeIntelligence(ws));
    html +=
      '<div class="verification-results-visibility">' +
      renderProductCard(
        'Verification State',
        '<p class="status-pill verification-results-state ' +
          verificationStatePillClass(state) +
          '">' +
          escapeHtml(state) +
          '</p>' +
          '<p><strong>Status:</strong> ' +
          escapeHtml((vr && vr.stateLabel) || 'No verification run yet') +
          '</p>' +
          '<p><strong>Readiness:</strong> ' +
          String(summary.readinessScore || 0) +
          '/100</p>' +
          '<p><strong>Passed:</strong> ' +
          String(summary.passCount || 0) +
          ' | <strong>Failed:</strong> ' +
          String(summary.failCount || 0) +
          ' | <strong>Blocked:</strong> ' +
          String(summary.blockedCount || 0) +
          ' | <strong>Warnings:</strong> ' +
          String(summary.warningCount || 0) +
          '</p>' +
          (summary.lastRunLabel
            ? '<p><strong>Last run:</strong> ' + escapeHtml(summary.lastRunLabel) + '</p>'
            : ''),
      ) +
      renderProductCard(
        'What Was Tested',
        '<div class="verification-tested-groups">' + renderVerificationCategoryGroups(vr && vr.categories) + '</div>',
      );

    if (vr && vr.fixesNext && vr.fixesNext.length) {
      html += renderProductCard(
        'Issues to Fix Next',
        '<ol class="verification-fix-list">' +
          vr.fixesNext
            .map(function (fix, idx) {
              return (
                '<li><strong>' +
                escapeHtml(fix.title) +
                '</strong><br>Priority: ' +
                escapeHtml(fix.priority) +
                '<br>Blocks: ' +
                escapeHtml(fix.blocksLabel) +
                '<br>Recommended action: ' +
                escapeHtml(fix.recommendedAction) +
                '<br><span class="verification-evidence">Evidence: ' +
                escapeHtml(fix.evidence) +
                '</span></li>'
              );
            })
            .join('') +
          '</ol>',
      );
    } else {
      html += renderProductCard(
        'Issues to Fix Next',
        '<p class="hint">Run Founder Testing to rank fixes with evidence and priority.</p>',
      );
    }

    html +=
      renderProductCard(
        'Review / Beta / Launch',
        '<p><strong>Review ready:</strong> ' +
          (vr && vr.reviewReady ? 'Yes' : 'Not yet') +
          '</p>' +
          '<p><strong>Beta ready:</strong> ' +
          (vr && vr.betaReady ? 'Yes' : 'No') +
          ' — ' +
          escapeHtml((vr && vr.betaReadyReason) || 'Run Founder Testing first.') +
          '</p>' +
          '<p><strong>Launch ready:</strong> ' +
          (vr && vr.launchReady ? 'Yes' : 'No') +
          ' — ' +
          escapeHtml((vr && vr.launchReadyReason) || 'Run Founder Testing first.') +
          '</p>',
      ) +
      renderProductCard(
        'Founder Testing',
        '<p>Run V4 to produce a founder-visible verification report with pass/fail evidence and fix priorities.</p>' +
          '<button type="button" class="btn-secondary founder-test-inline" id="run-founder-test-verification">Run Founder Test</button>' +
          '<p class="hint">Read-only — builds grouped results from preview, running app, memory, and launch readiness.</p>',
      ) +
      renderVerificationTrustEvidence(vr, lastFounderTestReport && lastFounderTestReport.durationMs) +
      '</div>';

    container.innerHTML = html;
    bindExecutionProofActions();
    var inlineBtn = el('run-founder-test-verification');
    if (inlineBtn) {
      inlineBtn.addEventListener('click', function () {
        runFounderTest();
      });
    }
  }

  function healthClass(health) {
    if (health === 'Healthy') return 'health-ok';
    if (health === 'At Risk') return 'health-warn';
    if (health === 'Blocked') return 'health-blocked';
    return 'health-neutral';
  }

  function renderPortfolioSummaryCards(summary) {
    var s = summary || {};
    var cards = [
      { label: 'Projects', value: s.projects != null ? s.projects : 0 },
      { label: 'Healthy', value: s.healthy != null ? s.healthy : 0 },
      { label: 'At Risk', value: s.atRisk != null ? s.atRisk : 0 },
      { label: 'Blocked', value: s.blocked != null ? s.blocked : 0 },
      { label: 'Verification Ready', value: s.verificationReady != null ? s.verificationReady : 0 },
      { label: 'Preview Available', value: s.previewAvailable != null ? s.previewAvailable : 0 },
      { label: 'Building', value: s.building != null ? s.building : 0 },
      { label: 'Ready', value: s.ready != null ? s.ready : 0 },
    ];
    var html = '<div class="portfolio-summary-grid" id="portfolio-summary-cards">';
    for (var i = 0; i < cards.length; i += 1) {
      html +=
        '<div class="portfolio-summary-card">' +
        '<span class="portfolio-summary-label">' +
        escapeHtml(cards[i].label) +
        '</span>' +
        '<span class="portfolio-summary-value">' +
        String(cards[i].value) +
        '</span></div>';
    }
    html += '</div>';
    return html;
  }

  function renderActiveProjectCard(project) {
    return (
      '<article class="card portfolio-project-card" data-project-id="' +
      escapeHtml(project.projectId) +
      '">' +
      '<div class="portfolio-project-header">' +
      '<h3>' +
      escapeHtml(project.name) +
      '</h3>' +
      '<span class="demo-badge">DEMO</span>' +
      '</div>' +
      '<p class="portfolio-project-desc">' +
      escapeHtml(project.description) +
      '</p>' +
      '<div class="portfolio-project-meta">' +
      '<span><strong>Stage:</strong> ' +
      escapeHtml(project.stage) +
      '</span>' +
      '<span class="' +
      healthClass(project.health) +
      '"><strong>Health:</strong> ' +
      escapeHtml(project.health) +
      '</span>' +
      '<span><strong>Progress:</strong> ' +
      String(project.progress) +
      '%</span>' +
      '<span><strong>Verification:</strong> ' +
      escapeHtml(project.verification) +
      '</span>' +
      '<span><strong>Preview:</strong> ' +
      escapeHtml(project.preview) +
      '</span>' +
      '<span><strong>Risk:</strong> ' +
      escapeHtml(project.risk) +
      '</span>' +
      '</div>' +
      '<p class="portfolio-project-action-line"><strong>Recommended:</strong> ' +
      escapeHtml(project.recommendedAction) +
      '</p>' +
      '<button type="button" class="btn-link portfolio-open-btn" data-open-project="' +
      escapeHtml(project.projectId) +
      '">View Insights</button>' +
      '</article>'
    );
  }

  function renderProjectInsightsPortfolio(portfolio, ws) {
    var fac = activeFounderActionCenter(ws);
    var ci = activeChangeIntelligence(ws);
    var vr = activeVerificationResults(ws);
    var topRisks = collectPortfolioTopRisks(portfolio);
    var recommendedItems = portfolio.recommendedActions || [];
    if (fac && fac.topActions && fac.topActions.length) {
      recommendedItems = fac.topActions.slice(0, 6).map(function (a) {
        return '[' + a.priority + '] ' + a.title + ' — ' + a.rationale;
      });
    }

    var html = renderIntelligenceRelationship();

    html += renderProductCard(
      'Project Health',
      '<p class="section-context">Current state of the project across your portfolio.</p>' +
        renderPortfolioSummaryCards(portfolio.summary),
    );

    html += renderProductCard(
      'Risks',
      '<p class="section-context">Risks are issues that may reduce product quality, delay delivery, or lower launch confidence.</p>' +
        (topRisks.length ? renderBulletList(topRisks) : '<p class="hint">No major risks recorded in the current portfolio view.</p>'),
    );

    var launchCopy =
      vr && vr.summary
        ? '<p><strong>Verification readiness:</strong> ' +
          String(vr.summary.readinessScore) +
          '/100</p><p>' +
          escapeHtml(vr.launchReadyReason || vr.betaReadyReason || 'Run Founder Testing for launch readiness detail.') +
          '</p>'
        : '<p class="hint">Run Founder Testing to populate launch readiness from verification results.</p>';
    html += renderProductCard(
      'Launch Readiness',
      '<p class="section-context">How prepared the project is for review, beta, or launch.</p>' + launchCopy,
    );

    html += renderProductCard(
      'Recommended Actions',
      '<p class="section-context">Highest-impact next steps based on current project state. View insights and follow priority items below.</p>' +
        renderBulletList(recommendedItems.length ? recommendedItems : ['Run Founder Testing to generate recommended actions.']),
    );

    html += renderProductCard(
      'Recent Changes',
      '<p class="section-context">What improved or regressed recently — from Change Intelligence.</p>' +
        (ci && ci.recentChanges && ci.recentChanges.length
          ? '<ul class="product-list">' +
              ci.recentChanges
                .slice(0, 5)
                .map(function (c) {
                  return (
                    '<li><strong>' +
                    escapeHtml(c.title) +
                    '</strong> (' +
                    escapeHtml(c.direction) +
                    ') — ' +
                    escapeHtml(c.description) +
                    '</li>'
                  );
                })
                .join('') +
              '</ul>'
          : '<p class="hint">Recent changes will appear after meaningful product updates or Founder Testing runs.</p>'),
    );

    html +=
      '<p class="demo-disclaimer">' +
      escapeHtml(portfolio.disclaimer || CLIENT_DEMO_PORTFOLIO_FALLBACK.disclaimer) +
      '</p>' +
      '<section class="card" id="active-projects-section">' +
      '<h2>Active Projects</h2>' +
      '<p class="section-context">Select a project to view detailed health, risks, and recommended actions.</p>' +
      '<div class="portfolio-project-grid" id="active-projects-list">';

    var projects = portfolio.projects || [];
    for (var i = 0; i < projects.length; i += 1) {
      html += renderActiveProjectCard(projects[i]);
    }
    html += '</div></section>';

    var queue = portfolio.priorityQueue || [];
    if (queue.length) {
      html += renderProductCard(
        'Priority Queue',
        '<p class="section-context">Demo portfolio priority order — review recommended next actions above for live guidance.</p>' +
          '<ol class="priority-queue" id="priority-queue">' +
            queue
              .map(function (item) {
                return (
                  '<li><strong>' +
                  String(item.rank) +
                  '. ' +
                  escapeHtml(item.name) +
                  '</strong> — ' +
                  escapeHtml(item.reason) +
                  ' <span class="demo-badge inline">DEMO</span></li>'
                );
              })
              .join('') +
            '</ol>',
      );
    }

    return html;
  }

  function renderProjectInsightsDetail(portfolio, projectId) {
    var project = null;
    var projects = portfolio.projects || [];
    for (var i = 0; i < projects.length; i += 1) {
      if (projects[i].projectId === projectId) {
        project = projects[i];
        break;
      }
    }
    if (!project) {
      return (
        '<p class="empty-state">Demo project not found.</p>' +
        '<button type="button" class="btn-secondary" id="back-to-portfolio">Back to Portfolio</button>'
      );
    }

    return (
      '<div class="portfolio-detail-view" id="project-detail-view">' +
      '<button type="button" class="btn-secondary portfolio-back-btn" id="back-to-portfolio">← Back to Portfolio</button>' +
      renderProjectInsightsClarityIntro() +
      renderIntelligenceRelationship() +
      '<header class="portfolio-detail-header">' +
      '<div class="portfolio-project-header">' +
      '<h2>' +
      escapeHtml(project.name) +
      '</h2>' +
      '<span class="demo-badge">DEMO</span>' +
      '</div>' +
      '<p class="demo-disclaimer">' +
      escapeHtml(portfolio.disclaimer || CLIENT_DEMO_PORTFOLIO_FALLBACK.disclaimer) +
      '</p>' +
      '</header>' +
      renderProductCard(
        'Project Overview',
        '<p>' +
          escapeHtml(project.description) +
          '</p><p><strong>Summary:</strong> ' +
          escapeHtml(project.summary) +
          '</p><p class="hint">Insights analyze Project Memory — open Project Memory for stored requirements and facts.</p>',
      ) +
      renderProductCard(
        'Project Health',
        '<p class="section-context">Current state of this project.</p>' +
          '<div class="portfolio-detail-health insight-grid">' +
          '<div class="insight-tile"><span class="insight-label">Health</span><span class="insight-value ' +
          healthClass(project.health) +
          '">' +
          escapeHtml(project.health) +
          '</span></div>' +
          '<div class="insight-tile"><span class="insight-label">Progress</span><span class="insight-value">' +
          String(project.progress) +
          '%</span></div>' +
          '<div class="insight-tile"><span class="insight-label">Stage</span><span class="insight-value">' +
          escapeHtml(project.stage) +
          '</span></div>' +
          '</div>',
      ) +
      renderProductCard(
        'Top Risks',
        '<p class="section-context">Risks are issues that may reduce product quality, delay delivery, or lower launch confidence.</p>' +
          renderBulletList(project.blockers && project.blockers.length ? project.blockers : ['No major risks recorded.']),
      ) +
      renderProductCard(
        'Launch Readiness',
        '<p class="section-context">How prepared this project is for review, beta, or launch.</p>' +
          '<p><strong>Verification:</strong> ' +
          escapeHtml(project.verification) +
          '</p><p><strong>Preview:</strong> ' +
          escapeHtml(project.preview) +
          '</p>',
      ) +
      renderProductCard(
        'Recommended Actions',
        '<p class="section-context">Highest-impact next steps for this project.</p><p>' +
          escapeHtml(project.recommendedAction) +
          '</p>',
      ) +
      renderProductCard(
        'Recent Changes',
        '<p class="section-context">What improved or regressed recently for this project view.</p>' +
          renderBulletList(
            project.recentActivity && project.recentActivity.length
              ? project.recentActivity
              : ['No recent changes recorded in this demo project view.'],
          ),
      ) +
      '</div>'
    );
  }

  function resolvePortfolioInsights(ws) {
    var fromWs = ws && ws.portfolioInsights;
    if (fromWs && Array.isArray(fromWs.projects) && fromWs.projects.length > 0) {
      return fromWs;
    }
    return CLIENT_DEMO_PORTFOLIO_FALLBACK;
  }

  function renderProjectInsightsErrorBanner() {
    return (
      '<div class="insights-error-banner card">' +
      '<p><strong>Project insights could not load from the server.</strong></p>' +
      '<p>Demo portfolio is available for visual testing.</p>' +
      '<button type="button" class="btn-secondary" id="retry-workspace-load">Retry</button>' +
      '</div>'
    );
  }

  function bindProjectInsightsActions() {
    var surface = el('project-insights-surface');
    if (!surface || surface.getAttribute('data-bound') === 'true') return;
    surface.setAttribute('data-bound', 'true');
    surface.addEventListener('click', function (e) {
      var openBtn = e.target && e.target.closest ? e.target.closest('[data-open-project]') : null;
      if (openBtn) {
        insightsSelectedProjectId = openBtn.getAttribute('data-open-project');
        renderProjectInsightsSurface(workspaceData);
        return;
      }
      var backBtn = e.target && e.target.closest ? e.target.closest('#back-to-portfolio') : null;
      if (backBtn) {
        insightsSelectedProjectId = null;
        renderProjectInsightsSurface(workspaceData);
        return;
      }
      var retryBtn = e.target && e.target.closest ? e.target.closest('#retry-workspace-load') : null;
      if (retryBtn) {
        loadProductWorkspace(true);
      }
    });
  }

  function isProjectInsightsViewActive() {
    var view = el('view-project-insights');
    return view && !view.classList.contains('hidden');
  }

  function renderProjectInsightsSurface(ws) {
    var container = el('project-insights-surface');
    if (!container) return;
    var insightsPurposeLead =
      '<section class="card insights-founder-purpose">' +
      '<h2>Project Insights</h2>' +
      '<p class="founder-purpose-headline">Everything AiDevEngine thinks about this project.</p>' +
      '<p class="founder-purpose-pillars"><strong>Health</strong> · <strong>Risks</strong> · <strong>Launch Readiness</strong></p>' +
      '<p class="founder-path-guidance">Review Project Insights to confirm AiDevEngine understands your project correctly.</p>' +
      '<p class="hint"><strong>Next action:</strong> Review project health and follow recommended actions.</p>' +
      '</section>';

    if (workspaceLoadState === 'loading') {
      container.innerHTML =
        insightsPurposeLead +
        renderProjectInsightsClarityIntro() +
        '<p class="empty-state">Portfolio insights loading…</p>';
      return;
    }

    var portfolio = resolvePortfolioInsights(ws);
    if (!portfolio || !Array.isArray(portfolio.projects) || !portfolio.projects.length) {
      container.innerHTML =
        insightsPurposeLead +
        renderProjectInsightsErrorBanner() +
        '<p class="empty-state">Demo portfolio unavailable. Click Retry.</p>';
      bindProjectInsightsActions();
      return;
    }

    try {
      var html = insightsPurposeLead + (workspaceLoadState === 'error' ? renderProjectInsightsErrorBanner() : '');
      if (insightsSelectedProjectId) {
        html += renderProjectInsightsDetail(portfolio, insightsSelectedProjectId);
      } else {
        html += renderProjectInsightsPortfolio(portfolio, ws);
      }
      container.innerHTML = html;
      bindProjectInsightsActions();
    } catch (renderErr) {
      container.innerHTML =
        renderProjectInsightsErrorBanner() +
        renderProjectInsightsPortfolio(CLIENT_DEMO_PORTFOLIO_FALLBACK);
      bindProjectInsightsActions();
    }
  }

  function mergeWorkspaceData(ws) {
    workspaceData = Object.assign({}, workspaceData || {}, ws || {});
    if (!workspaceData.portfolioInsights || !workspaceData.portfolioInsights.projects || !workspaceData.portfolioInsights.projects.length) {
      workspaceData.portfolioInsights = CLIENT_DEMO_PORTFOLIO_FALLBACK;
    }
  }

  function fetchPortfolioDemoJson() {
    return fetch('/api/portfolio-demo.json', { method: 'GET', cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('demo fetch HTTP ' + res.status);
      return res.json();
    });
  }

  function loadProductWorkspace(force) {
    if (!force && workspaceLoadState === 'loaded' && workspaceData && workspaceData.portfolioInsights) {
      return Promise.resolve(workspaceData);
    }
    if (!force && workspaceLoadPromise) {
      return workspaceLoadPromise;
    }

    workspaceLoadState = 'loading';
    if (isProjectInsightsViewActive()) {
      renderProjectInsightsSurface(workspaceData);
    }

    workspaceLoadPromise = fetch('/api/product-workspace.json', { method: 'GET', cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('workspace HTTP ' + res.status);
        return res.json();
      })
      .then(function (ws) {
        var portfolio = ws && ws.portfolioInsights;
        if (!portfolio || !Array.isArray(portfolio.projects) || !portfolio.projects.length) {
          throw new Error('portfolioInsights missing from workspace');
        }
        workspaceLoadState = 'loaded';
        applyWorkspace(ws);
        return workspaceData;
      })
      .catch(function () {
        return fetchPortfolioDemoJson()
          .then(function (demo) {
            workspaceLoadState = 'error';
            mergeWorkspaceData({ portfolioInsights: demo, productBrand: 'AiDevEngine' });
            renderProductSurfaces();
            if (isProjectInsightsViewActive()) {
              renderProjectInsightsSurface(workspaceData);
            }
            return workspaceData;
          })
          .catch(function () {
            workspaceLoadState = 'error';
            mergeWorkspaceData({ portfolioInsights: CLIENT_DEMO_PORTFOLIO_FALLBACK, productBrand: 'AiDevEngine' });
            renderProductSurfaces();
            if (isProjectInsightsViewActive()) {
              renderProjectInsightsSurface(workspaceData);
            }
            return workspaceData;
          });
      })
      .finally(function () {
        workspaceLoadPromise = null;
      });

    return workspaceLoadPromise;
  }

  function renderNotificationsSurface(ws, notifications) {
    var container = el('notifications-surface');
    if (!container) return;
    var items = (notifications && notifications.length ? notifications : (ws && ws.notifications && ws.notifications.items) || []);
    if (!items.length && runtimeNotifications.length) {
      items = runtimeNotifications.slice();
    }
    container.innerHTML =
      renderProductCard(
        'Notifications',
        '<p class="product-lead">Runtime events and system notices from your AiDevEngine session.</p>' +
          (items.length ? renderBulletList(items) : '<p class="empty-state">No notifications yet.</p>'),
      );
  }

  function renderSidebarStatus(ws) {
    var statusEl = el('sidebar-status-text');
    if (!statusEl) return;
    if (!ws || !ws.runtime) {
      statusEl.textContent = 'Checking runtime…';
      return;
    }
    if (ws.runtime.workspacesDisconnected && ws.runtime.workspacesDisconnected.length) {
      statusEl.textContent = 'AiDevEngine local runtime connected — some workspaces not connected yet';
    } else {
      statusEl.textContent = 'AiDevEngine local runtime connected';
    }
  }

  var FOUNDER_PATH_VIEW_STEP = {
    projects: 1,
    'command-center': 2,
    'project-insights': 3,
    'live-preview': 4,
    verification: 5,
  };

  function renderFirstTimeFounderPath(activeViewId, ws) {
    var panel = el('first-time-founder-path');
    if (!panel) return;

    var steps = panel.querySelectorAll('.founder-path-step');
    var activeStep = FOUNDER_PATH_VIEW_STEP[activeViewId] || null;
    for (var i = 0; i < steps.length; i += 1) {
      var stepEl = steps[i];
      var stepNum = parseInt(stepEl.getAttribute('data-path-step'), 10);
      var highlight = activeStep && (stepNum === activeStep || (activeViewId === 'verification' && stepNum === 6));
      if (highlight) {
        stepEl.classList.add('active');
      } else {
        stepEl.classList.remove('active');
      }
    }

    var vr = activeVerificationResults(ws);
    var passEl = el('founder-path-outcome');
    var failEl = el('founder-path-outcome-fail');
    var stepSix = el('founder-path-step-six-copy');
    var state = vr && vr.state;
    var hasRun = state && state !== 'NO_VERIFICATION_RUN' && state !== 'VERIFICATION_RUNNING';
    var passed =
      hasRun &&
      (vr.launchReady ||
        state === 'VERIFICATION_LAUNCH_READY' ||
        state === 'VERIFICATION_READY');
    var failed =
      hasRun &&
      !passed &&
      ((vr.summary && vr.summary.failCount > 0) ||
        state === 'VERIFICATION_FAILED' ||
        state === 'VERIFICATION_BLOCKED');

    if (passEl) {
      if (passed) {
        passEl.removeAttribute('hidden');
      } else {
        passEl.setAttribute('hidden', '');
      }
    }
    if (failEl) {
      if (failed) {
        failEl.removeAttribute('hidden');
      } else {
        failEl.setAttribute('hidden', '');
      }
    }
    if (stepSix) {
      if (passed) {
        stepSix.textContent =
          'Verification passed. Review any recommendations and prepare for launch.';
      } else if (failed) {
        stepSix.textContent =
          'Verification found issues that should be addressed before launch. Review the findings and re-run Verification after fixes.';
      } else {
        stepSix.textContent = 'Review Verification results, then prepare for launch.';
      }
    }
  }

  function bindFirstTimeFounderPath() {
    var panel = el('first-time-founder-path');
    if (!panel || panel.getAttribute('data-bound') === 'true') return;
    panel.setAttribute('data-bound', 'true');
    panel.addEventListener('click', function (e) {
      var step = e.target && e.target.closest ? e.target.closest('.founder-path-step') : null;
      if (!step) return;
      var view = step.getAttribute('data-view-target');
      if (view) switchView(view);
    });
  }

  function renderProductSurfaces() {
    renderFounderActionCenterSurface(workspaceData);
    renderProductCoherenceSurface(workspaceData);
    renderProjectsSurface(workspaceData);
    renderAutonomousBuilderSurface(workspaceData);
    renderLivePreviewSurface(workspaceData);
    renderProjectMemorySurface(workspaceData);
    renderVerificationSurface(workspaceData, manifestData);
    renderNotificationsSurface(workspaceData, runtimeNotifications);
    renderProjectInsightsSurface(workspaceData);
    renderSidebarStatus(workspaceData);
    renderFirstTimeFounderPath(currentViewId || 'command-center', workspaceData);
  }

  function switchView(viewId) {
    hideAllViews();
    var centerTitle = el('center-title');
    var view = el('view-' + viewId);
    if (view) view.classList.remove('hidden');
    if (centerTitle) centerTitle.textContent = VIEW_TITLES[viewId] || PRODUCT_BRAND;

    var navItems = document.querySelectorAll('.nav-item');
    for (var i = 0; i < navItems.length; i += 1) {
      navItems[i].classList.remove('active');
    }
    var activeNav = document.querySelector('.nav-item[data-view="' + viewId + '"]');
    if (activeNav) activeNav.classList.add('active');

    if (viewId === 'notifications') {
      renderNotificationsSurface(workspaceData, runtimeNotifications);
    }
    if (viewId === 'project-insights') {
      renderProjectInsightsSurface(workspaceData);
      loadProductWorkspace(false);
      var ciActive = activeChangeIntelligence(workspaceData);
      if (ciActive) {
        streamChangeIntelligenceFeed(ciActive);
      }
    }
    if (viewId === 'verification') {
      loadExecutionProof(false)
        .then(function () {
          refreshExecutionProofPanel();
        })
        .catch(function () {
          refreshExecutionProofPanel();
        });
    }
    if (viewId === 'live-preview') {
      clearFeedStreamLog();
      runtimeDiagnostics.operatorFeedActive = true;
      var lpReality = workspaceData && workspaceData.livePreview && workspaceData.livePreview.reality;
      var raVis = workspaceData && workspaceData.runningApplication;
      if (lpReality) {
        streamPreviewRealityFeed(lpReality);
      }
      if (raVis) {
        window.setTimeout(function () {
          streamRunningApplicationFeed(raVis);
        }, lpReality && lpReality.operatorFeedEvents ? lpReality.operatorFeedEvents.length * 280 + 120 : 120);
      }
    }
    if (viewId === 'verification') {
      var vrActive = activeVerificationResults(workspaceData);
      if (vrActive) {
        streamVerificationResultsFeed(vrActive);
      }
    }
    if (viewId === 'founder-action-center') {
      renderFounderActionCenterSurface(workspaceData);
      loadProductWorkspace(false);
      var facActive = activeFounderActionCenter(workspaceData);
      if (facActive) {
        streamFounderActionCenterFeed(facActive);
      }
    }
    if (viewId === 'product-coherence') {
      renderProductCoherenceSurface(workspaceData);
      loadProductWorkspace(false);
      var coherenceActive = activeProductCoherence(workspaceData);
      if (coherenceActive) {
        streamProductCoherenceFeed(coherenceActive);
      }
    }
    currentViewId = viewId;
    renderFirstTimeFounderPath(viewId, workspaceData);
  }

  function mapEventToSection(eventType) {
    if (eventType === 'Classifying Request') return 'Planning';
    if (eventType === 'Loading Memory') return 'Verification';
    if (eventType === 'Searching Memory') return 'Verification';
    if (eventType === 'Memory Context Ready') return 'Verification';
    if (eventType === 'Understanding Project') return 'Planning';
    if (eventType === 'Gathering Facts') return 'Execution';
    if (eventType === 'Evaluating Risks') return 'Verification';
    if (eventType === 'Analyzing Dependencies') return 'Approvals';
    if (eventType === 'Generating Conclusions') return 'Learning';
    if (eventType === 'Loading Project Context') return 'Planning';
    if (eventType === 'Analyzing Project Status') return 'Execution';
    if (eventType === 'Checking Project Gaps') return 'Verification';
    if (eventType === 'Checking Project Risks') return 'Approvals';
    if (eventType === 'Project Recommendation Ready') return 'Learning';
    if (eventType === 'Checking Systems') return 'Execution';
    if (eventType === 'Loading Relationships') return 'Verification';
    if (eventType === 'Checking Roadmap') return 'Verification';
    if (eventType === 'Checking Dependencies') return 'Approvals';
    if (eventType === 'Performing Impact Analysis') return 'Approvals';
    if (eventType === 'Generating Response') return 'Learning';
    if (eventType === 'Response Ready') return 'Learning';
    if (eventType === 'Understanding Question') return 'Planning';
    if (eventType === 'Detecting Context Needs') return 'Verification';
    if (eventType === 'Selecting Reasoning Mode') return 'Planning';
    if (eventType === 'Selecting Capabilities') return 'Approvals';
    if (eventType === 'Gathering Relevant Facts') return 'Execution';
    if (eventType === 'Composing Answer') return 'Learning';
    if (eventType === 'Loading Timeline Context') return 'Planning';
    if (eventType === 'Analyzing Timeline') return 'Execution';
    if (eventType === 'Checking Milestones') return 'Verification';
    if (eventType === 'Checking Blockers') return 'Approvals';
    if (eventType === 'Generating Timeline Conclusions') return 'Learning';
    if (eventType === 'Loading Decision Context') return 'Planning';
    if (eventType === 'Evaluating Options') return 'Execution';
    if (eventType === 'Checking Risks') return 'Verification';
    if (eventType === 'Ranking Priorities') return 'Approvals';
    if (eventType === 'Generating Recommendation') return 'Learning';
    return 'Planning';
  }

  function completedSectionsFromEvents(completedEventTypes) {
    var sections = [];
    for (var i = 0; i < completedEventTypes.length; i += 1) {
      var sec = mapEventToSection(completedEventTypes[i]);
      if (sections.indexOf(sec) === -1) sections.push(sec);
    }
    return sections;
  }

  function clearFeedStreamLog() {
    var log = el('feed-stream-log');
    if (log) log.innerHTML = '';
  }

  function resolveFeedEventPresentation(event) {
    if (!event) return { action: '', detail: '', section: 'Planning', stepIndex: 0, stepTotal: 0, evidence: '' };
    if (typeof event === 'string') {
      return { action: event, detail: '', section: mapEventToSection(event), stepIndex: 0, stepTotal: 0, evidence: '' };
    }
    return {
      action: event.action || event.eventType || 'Working',
      detail: event.detail || '',
      section: event.section || mapEventToSection(event.eventType),
      stepIndex: event.stepIndex || 0,
      stepTotal: event.stepTotal || 0,
      evidence: event.evidence || '',
      status: event.status || 'Active',
    };
  }

  function appendFeedStreamEvent(event, active) {
    var log = el('feed-stream-log');
    if (!log) return;
    var pres = resolveFeedEventPresentation(event);
    var div = document.createElement('div');
    div.className = 'feed-event' + (active ? ' active-event' : '');
    var line = (active ? '▸ ' : '✓ ') + pres.action;
    if (pres.detail) line += ' — ' + pres.detail;
    div.textContent = line;
    log.appendChild(div);
    scrollFeedToLatest();
  }

  var feedSectionIcons = {
    Planning: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h10M4 18h14"/></svg>',
    Execution: '<svg viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 10-14h-7l0-6z"/></svg>',
    Verification: '<svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><rect x="4" y="4" width="16" height="16" rx="3"/></svg>',
    Approvals: '<svg viewBox="0 0 24 24"><path d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z"/></svg>',
    Learning: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  };

  function feedBadgeClass(status) {
    if (status === 'Active') return 'active';
    if (status === 'Completed') return 'completed';
    if (status === 'Blocked') return 'blocked';
    if (status === 'Warning') return 'warning';
    return 'queued';
  }

  function renderOperatorFeed(sections, options) {
    var container = el('feed-sections');
    if (!container) return;
    options = options || {};
    var activeEvent = options.activeEvent || null;
    var completedEvents = options.completedEvents || [];
    var idle = Boolean(options.idle);
    var activePres = activeEvent ? resolveFeedEventPresentation(activeEvent) : null;
    var latestBySection = {};
    for (var c = 0; c < completedEvents.length; c += 1) {
      var completedPres = resolveFeedEventPresentation(completedEvents[c]);
      latestBySection[completedPres.section] = completedPres;
    }
    if (activePres) latestBySection[activePres.section] = activePres;

    container.innerHTML = '';
    for (var i = 0; i < sections.length; i += 1) {
      var section = sections[i];
      var sectionState = latestBySection[section];
      var isActive = activePres && activePres.section === section;
      var isCompleted = Boolean(sectionState && !isActive && (sectionState.status === 'Completed' || completedEvents.length > 0));
      var isReady =
        section === 'Learning' &&
        ((activeEvent && (activeEvent.eventType === 'Response Ready' || activePres.action === 'Next action prepared')) ||
          (sectionState && sectionState.action === 'Next action prepared'));
      var idleCopy = feedSectionIdleCopy[section] || { action: section + ' ready', detail: '' };
      var actionText = idle ? idleCopy.action : sectionState ? sectionState.action : idleCopy.action;
      var detailText = idle ? idleCopy.detail : sectionState ? sectionState.detail : idleCopy.detail;
      var badgeStatus = 'Queued';
      if (isActive) badgeStatus = activePres.status || 'Active';
      else if (isCompleted) badgeStatus = sectionState && sectionState.status ? sectionState.status : 'Completed';
      else if (idle) badgeStatus = 'Queued';

      var stepText = '';
      if (sectionState && sectionState.stepIndex && sectionState.stepTotal) {
        stepText = 'Step: ' + String(sectionState.stepIndex) + '/' + String(sectionState.stepTotal);
      }

      var div = document.createElement('div');
      div.className =
        'feed-section' +
        (isActive ? ' active-feed' : '') +
        (isCompleted && !isActive ? ' completed-feed' : '') +
        (isReady ? ' ready-feed' : '') +
        (idle ? ' idle-feed' : '');
      var icon = feedSectionIcons[section] || feedSectionIcons.Planning;
      div.innerHTML =
        '<div class="feed-section-header">' +
        '<span class="feed-section-icon" aria-hidden="true">' + icon + '</span>' +
        '<div class="feed-section-content">' +
        '<h3>' + escapeHtml(section) + '</h3>' +
        '<p class="feed-action-line"><strong>Action:</strong> ' + escapeHtml(actionText) + '</p>' +
        (detailText ? '<p class="feed-detail-line">' + escapeHtml(detailText) + '</p>' : '') +
        (sectionState && sectionState.evidence
          ? '<p class="feed-evidence-line"><strong>Evidence:</strong> ' + escapeHtml(sectionState.evidence) + '</p>'
          : '') +
        '</div></div>' +
        '<div class="feed-section-footer">' +
        '<span class="feed-status-badge ' + feedBadgeClass(badgeStatus) + '">' + escapeHtml(badgeStatus) + '</span>' +
        (stepText ? '<span class="feed-step-line">' + escapeHtml(stepText) + '</span>' : '') +
        '</div>';
      container.appendChild(div);
    }
    scrollFeedToLatest();
  }

  function publishFeedFailure(reason) {
    runtimeDiagnostics.operatorFeedActive = false;
    renderOperatorFeed(defaultFeedSections, { idle: true });
    appendFeedStreamEvent({ action: 'Feed blocked', detail: reason, status: 'Blocked' }, true);
    pushNotification('Brain Request Failed');
    setLastError(reason);
    renderRuntimeDiagnostics();
  }

  function streamOperatorFeedEvents(events, onComplete) {
    if (!events || !events.length) {
      publishFeedFailure('Operator Feed events missing');
      if (onComplete) onComplete();
      return;
    }

    clearFeedStreamLog();
    runtimeDiagnostics.operatorFeedActive = true;
    pushNotification('Operator Feed Active');
    renderRuntimeDiagnostics();

    var index = 0;
    var completedEvents = [];

    function tick() {
      if (index >= events.length) {
        runtimeDiagnostics.operatorFeedActive = true;
        renderOperatorFeed(defaultFeedSections, {
          activeEvent: events[events.length - 1],
          completedEvents: completedEvents.slice(),
          idle: false,
        });
        renderRuntimeDiagnostics();
        scrollFeedToLatest();
        if (onComplete) onComplete();
        return;
      }

      var event = events[index];
      completedEvents.push(event);
      renderOperatorFeed(defaultFeedSections, { activeEvent: event, completedEvents: completedEvents.slice(), idle: false });
      appendFeedStreamEvent(event, true);

      if (index > 0) {
        var prevLog = el('feed-stream-log');
        if (prevLog && prevLog.children.length > 1) {
          var prevPres = resolveFeedEventPresentation(events[index - 1]);
          prevLog.children[prevLog.children.length - 2].className = 'feed-event';
          prevLog.children[prevLog.children.length - 2].textContent =
            '✓ ' + prevPres.action + (prevPres.detail ? ' — ' + prevPres.detail : '');
        }
      }

      index += 1;
      setTimeout(tick, FEED_STAGE_DELAY_MS);
    }

    renderOperatorFeed(defaultFeedSections, { activeEvent: events[0], completedEvents: [], idle: false });
    tick();
  }

  function streamFounderTestFeed(onComplete) {
    clearFeedStreamLog();
    runtimeDiagnostics.operatorFeedActive = true;
    pushNotification('Founder Testing feed active');
    renderRuntimeDiagnostics();

    var index = 0;
    var completed = [];

    function tick() {
      if (index >= founderTestFeedSteps.length) {
        if (onComplete) onComplete();
        return;
      }
      var step = founderTestFeedSteps[index];
      var event = {
        section: step.section,
        action: step.action,
        detail: step.detail,
        status: step.status || (index === founderTestFeedSteps.length - 1 ? 'Completed' : 'Active'),
        stepIndex: index + 1,
        stepTotal: founderTestFeedSteps.length,
        eventType: step.action,
      };
      completed.push(event);
      renderOperatorFeed(defaultFeedSections, { activeEvent: event, completedEvents: completed.slice(), idle: false });
      appendFeedStreamEvent(event, index < founderTestFeedSteps.length - 1);
      if (index > 0) {
        var prevLog = el('feed-stream-log');
        if (prevLog && prevLog.children.length > 1) {
          var prev = founderTestFeedSteps[index - 1];
          prevLog.children[prevLog.children.length - 2].className = 'feed-event';
          prevLog.children[prevLog.children.length - 2].textContent = '✓ ' + prev.action + (prev.detail ? ' — ' + prev.detail : '');
        }
      }
      index += 1;
      setTimeout(tick, 140);
    }
    tick();
  }

  function renderStatusBar(items) {
    var list = el('status-items');
    if (!list) return;
    list.innerHTML = '';
    for (var i = 0; i < items.length; i += 1) {
      var text = items[i];
      var connected = text.indexOf('Not Connected') === -1 && text.indexOf('Connected') !== -1;
      var li = document.createElement('li');
      li.className = 'status-item ' + (connected ? 'connected' : 'disconnected');
      li.innerHTML =
        '<span class="status-dot ' + (connected ? 'connected' : 'disconnected') + '" aria-hidden="true"></span>' +
        '<span class="status-text">' + escapeHtml(text) + '</span>';
      list.appendChild(li);
    }
  }

  function renderNotifications(notifications) {
    var list = el('notification-list');
    if (!list) return;
    list.innerHTML = '';
    for (var i = 0; i < notifications.length; i += 1) {
      var li = document.createElement('li');
      li.textContent = notifications[i];
      list.appendChild(li);
    }
  }

  function interpretBrainFailure(status, bodyText) {
    if (status === 405 && bodyText.indexOf('read-only') !== -1) {
      return 'Stale AiDevEngine server — stop old process on port 4321 and run npm run dev';
    }
    if (status === 405) return 'Brain API unavailable — POST rejected (405). Restart npm run dev.';
    if (status === 404) return 'Brain API unavailable — /api/brain/respond not found.';
    if (status === 400) return 'Brain response malformed — ' + bodyText.slice(0, 120);
    if (status >= 500) return 'Brain API server error — check npm run dev terminal.';
    return 'Brain API request failed — HTTP ' + status;
  }

  function checkBrainHealth() {
    return fetch('/api/brain/health', { method: 'GET', cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Health check HTTP ' + res.status);
        return res.json();
      })
      .then(function (payload) {
        var ok =
          payload &&
          payload.postAllowed === true &&
          payload.serverCapability === 'command-center-brain-v11.1a';
        runtimeDiagnostics.brainEndpointReachable = ok;
        runtimeDiagnostics.brainConnected = ok;
        if (ok) {
          pushNotification('AiDevEngine Command Center brain active');
          setLastError('None');
        } else {
          setLastError('Brain health payload missing expected capability');
        }
        renderRuntimeDiagnostics();
        return ok;
      })
      .catch(function () {
        runtimeDiagnostics.brainEndpointReachable = false;
        runtimeDiagnostics.brainConnected = false;
        setLastError('Brain health endpoint unreachable — stale server or npm run dev not running');
        renderRuntimeDiagnostics();
        return false;
      });
  }

  function renderStacks(stacks) {
    var list = el('completed-stacks');
    if (!list) return;
    list.innerHTML = '';
    for (var i = 0; i < stacks.length; i += 1) {
      var stack = stacks[i];
      var li = document.createElement('li');
      li.className = 'stack-item';
      li.innerHTML =
        '<span class="stack-phase">' + escapeHtml(stack.phase) + '</span>' +
        '<span class="stack-name">' + escapeHtml(stack.name) +
        '<span class="badge-complete">' + escapeHtml(stack.status) + '</span></span>' +
        '<span class="stack-note">' + escapeHtml(stack.note) + '</span>';
      list.appendChild(li);
    }
  }

  function renderValidators(validators) {
    var list = el('validator-list');
    if (!list) return;
    list.innerHTML = '';
    for (var i = 0; i < validators.length; i += 1) {
      var li = document.createElement('li');
      li.textContent = 'npm run ' + validators[i];
      list.appendChild(li);
    }
  }

  function renderList(id, items) {
    var list = el(id);
    if (!list) return;
    list.innerHTML = '';
    for (var i = 0; i < items.length; i += 1) {
      var li = document.createElement('li');
      li.textContent = items[i];
      list.appendChild(li);
    }
  }

  function renderWarnings(warnings) {
    var list = el('reality-warnings');
    if (!list) return;
    list.innerHTML = '';
    for (var i = 0; i < warnings.length; i += 1) {
      var li = document.createElement('li');
      li.textContent = warnings[i].message;
      list.appendChild(li);
    }
  }

  function renderChecklist(items) {
    var list = el('founder-checklist');
    if (!list) return;
    list.innerHTML = '';
    for (var i = 0; i < items.length; i += 1) {
      var item = items[i];
      var li = document.createElement('li');
      var q = document.createElement('span');
      q.textContent = item.question;
      var a = document.createElement('span');
      a.textContent = item.answer;
      a.className = item.answer === 'YES' ? 'answer-yes' : 'answer-not-yet';
      li.appendChild(q);
      li.appendChild(a);
      list.appendChild(li);
    }
  }

  function applyManifest(data) {
    manifestData = data;
    var shell = data.runtimeShell || {};

    if (el('page-title')) el('page-title').textContent = PRODUCT_BRAND;
    if (el('page-subtitle')) el('page-subtitle').textContent = 'Autonomous Development Engine';
    if (el('current-status')) el('current-status').textContent = data.currentStatus;
    if (el('experience-placeholder')) el('experience-placeholder').textContent = data.experienceLayerPlaceholder;
    if (el('trust-placeholder')) el('trust-placeholder').textContent = data.trustEnginePlaceholder;
    if (el('next-step')) el('next-step').textContent = data.nextRecommendedStep;
    if (el('confirmation-text')) {
      el('confirmation-text').textContent =
        'System Diagnostics — internal platform visibility. Not founder project intelligence.';
    }

    if (!conversationStarted) {
      showWelcomeState();
      var history = el('chat-history');
      if (history) history.innerHTML = '';
      var welcomeTitle = document.querySelector('.welcome-title');
      if (welcomeTitle) welcomeTitle.textContent = PRODUCT_BRAND;
      var welcomeSub = document.querySelector('.welcome-subtitle');
      if (welcomeSub) welcomeSub.textContent = 'Turn detailed product ideas into working applications';
      var welcomeHint = document.querySelector('.welcome-hint');
      if (welcomeHint) {
        welcomeHint.textContent =
          'Ask AiDevEngine about your project, roadmap, architecture, verification, or what to build next.';
      }
    }

    defaultFeedSections = shell.operatorFeedSections || defaultFeedSections;
    runtimeNotifications = ['AiDevEngine Command Center brain connected'];
    renderOperatorFeed(defaultFeedSections, { idle: true });
    var statusItems = shell.productStatusBarItems || shell.statusBarItems || [];
    renderStatusBar(statusItems);
    renderNotifications(runtimeNotifications);
    renderStacks(data.completedStacks);
    renderValidators(data.validators);
    renderList('exists-list', data.existsVsNotYet.exists);
    renderList('not-yet-list', data.existsVsNotYet.notYet);
    renderWarnings(data.realityWarnings);
    renderChecklist(data.founderChecklist);
    renderRuntimeDiagnostics();
    renderProductSurfaces();
  }

  function applyWorkspace(data) {
    workspaceData = data;
    if (data && data.runtime) {
      var statusItems = [];
      if (data.runtime.localRuntimeConnected) {
        statusItems.push('AiDevEngine local runtime connected');
      }
      if (data.runtime.brainConnected) {
        statusItems.push('Command Center brain connected');
      }
      if (data.livePreview && data.livePreview.connected) {
        statusItems.push('Live preview runtime active');
      } else {
        statusItems.push('Live preview runtime idle');
      }
      if (data.autonomousBuilder && !data.autonomousBuilder.executionConnected) {
        statusItems.push('Autonomous Builder workspace not connected');
      }
      if (statusItems.length) renderStatusBar(statusItems);
    }
    renderProductSurfaces();
  }

  function askBrain(message) {
    showThinking();
    setLastRequestStatus('In progress');
    pushNotification('Brain Request Started');
    clearFeedStreamLog();
    var requestReceived = {
      eventType: 'Classifying Request',
      action: 'Request received',
      detail: 'AiDevEngine received your message and started routing.',
      section: 'Planning',
      status: 'Active',
      stepIndex: 1,
      stepTotal: 7,
    };
    renderOperatorFeed(defaultFeedSections, { activeEvent: requestReceived, completedEvents: [], idle: false });
    appendFeedStreamEvent(requestReceived, true);

    fetch('/api/brain/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message, timestamp: Date.now() }),
    })
      .then(function (res) {
        return res.text().then(function (bodyText) {
          if (!res.ok) throw new Error(interpretBrainFailure(res.status, bodyText));
          var result;
          try {
            result = JSON.parse(bodyText);
          } catch (parseErr) {
            throw new Error('Brain response malformed — invalid JSON from server');
          }
          if (!result.brainResponse) {
            throw new Error('Brain response malformed — brainResponse field missing');
          }
          return result;
        });
      })
      .then(function (result) {
        streamOperatorFeedEvents(result.operatorFeedEvents, function () {
          removeThinkingMessage();
          appendChatMessage(result.brainResponse, 'brain');
          setLastRequestStatus('Completed');
          pushNotification('Brain Request Completed');
          setLastError('None');
          renderRuntimeDiagnostics();
          if (result.crossSystemDiagnostics) {
            renderCrossSystemDiagnostics(result.crossSystemDiagnostics);
          }
          if (result.projectUnderstandingDiagnostics) {
            renderProjectUnderstandingDiagnostics(result.projectUnderstandingDiagnostics);
          }
          if (result.projectVaultIntelligenceDiagnostics) {
            renderVaultIntelligenceDiagnostics(result.projectVaultIntelligenceDiagnostics);
          }
          if (result.dependencyIntelligenceDiagnostics) {
            renderDependencyIntelligenceDiagnostics(result.dependencyIntelligenceDiagnostics);
          }
          if (result.workspaceIntelligenceDiagnostics) {
            renderWorkspaceIntelligenceDiagnostics(result.workspaceIntelligenceDiagnostics);
          }
          if (result.projectHistoryIntelligenceDiagnostics) {
            renderProjectHistoryIntelligenceDiagnostics(result.projectHistoryIntelligenceDiagnostics);
          }
          if (result.projectSummarizationDiagnostics) {
            renderProjectSummarizationDiagnostics(result.projectSummarizationDiagnostics);
          }
          if (result.portfolioIntelligenceDiagnostics) {
            renderPortfolioIntelligenceDiagnostics(result.portfolioIntelligenceDiagnostics);
          }
          if (result.operatorFeedFoundationDiagnostics) {
            renderOperatorFeedDiagnostics(result.operatorFeedFoundationDiagnostics);
          }
          if (result.actionVisibilityDiagnostics) {
            renderActionVisibilityDiagnostics(result.actionVisibilityDiagnostics);
          }
          if (result.reasoningVisibilityDiagnostics) {
            renderReasoningVisibilityDiagnostics(result.reasoningVisibilityDiagnostics);
          }
          if (result.progressIntelligenceDiagnostics) {
            renderProgressIntelligenceDiagnostics(result.progressIntelligenceDiagnostics);
          }
          if (result.failureVisibilityDiagnostics) {
            renderFailureVisibilityDiagnostics(result.failureVisibilityDiagnostics);
          }
          if (result.learningVisibilityDiagnostics) {
            renderLearningVisibilityDiagnostics(result.learningVisibilityDiagnostics);
          }
          if (result.generalQuestionDiagnostics) {
            renderGeneralQuestionDiagnostics(result.generalQuestionDiagnostics);
          }
          if (result.timelineIntelligenceDiagnostics) {
            renderTimelineIntelligenceDiagnostics(result.timelineIntelligenceDiagnostics);
          }
          if (result.unifiedDecisionLayerDiagnostics) {
            renderDecisionLayerDiagnostics(result.unifiedDecisionLayerDiagnostics);
          }
        });
      })
      .catch(function (err) {
        removeThinkingMessage();
        var reason = err && err.message ? err.message : 'Brain API unavailable';
        publishFeedFailure(reason);
        appendChatMessage('Brain could not respond — ' + reason, 'system');
        setLastRequestStatus('Failed');
      });
  }

  var FOUNDER_TEST_MAX_SCREEN_MS = 5000;
  var founderTestRunning = false;
  var lastFounderTestReport = null;
  var lastVerificationResults = null;
  var lastChangeIntelligence = null;
  var lastFounderActionCenter = null;
  var lastProductCoherence = null;
  var lastFrictionHeatmap = null;

  var FOUNDER_TEST_LIVE_SCREENS = [
    { viewId: 'command-center', label: 'Command Center', containerId: 'chat-surface' },
    { viewId: 'founder-action-center', label: 'Founder Action Center', containerId: 'founder-action-center-surface' },
    { viewId: 'projects', label: 'Projects', containerId: 'projects-surface' },
    { viewId: 'autonomous-builder', label: 'Autonomous Builder', containerId: 'autonomous-builder-surface' },
    { viewId: 'live-preview', label: 'Live Preview', containerId: 'live-preview-surface' },
    { viewId: 'project-memory', label: 'Project Memory', containerId: 'project-memory-surface' },
    { viewId: 'verification', label: 'Verification', containerId: 'verification-surface' },
    { viewId: 'notifications', label: 'Notifications', containerId: 'notifications-surface' },
    { viewId: 'project-insights', label: 'Project Insights', containerId: 'project-insights-surface' },
    { viewId: 'system-diagnostics', label: 'System Diagnostics', containerId: 'section-system-diagnostics-hero' },
  ];

  function waitMs(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function showFounderTestPanel(mode) {
    var panel = el('founder-test-panel');
    if (panel) {
      panel.removeAttribute('hidden');
      panel.setAttribute('aria-hidden', 'false');
    }
    var status = el('founder-test-status');
    if (status && mode === 'running') {
      status.textContent = 'Running founder test… unified evaluation (read-only, 90s max)';
    }
  }

  function hideFounderTestPanel() {
    var panel = el('founder-test-panel');
    if (panel) {
      panel.setAttribute('hidden', '');
      panel.setAttribute('aria-hidden', 'true');
    }
    var input = el('chat-input');
    if (input && !input.disabled) {
      try {
        input.focus();
      } catch (focusErr) {
        /* focus may fail if input not visible yet */
      }
    }
  }

  function verdictClass(verdict) {
    if (
      verdict === 'PRODUCT_READY' ||
      verdict === 'LAUNCH_CANDIDATE' ||
      verdict === 'FOUNDER_APPROVAL_RECOMMENDED' ||
      verdict === 'READY_FOR_LAUNCH'
    ) {
      return 'verdict-ready';
    }
    if (
      verdict === 'PRODUCT_READY_WITH_MINOR_POLISH' ||
      verdict === 'PRODUCT_USABLE_NEEDS_POLISH' ||
      verdict === 'READY_FOR_PUBLIC_BETA' ||
      verdict === 'READY_FOR_LIMITED_BETA' ||
      verdict === 'READY_FOR_LIMITED_CUSTOMERS' ||
      verdict === 'PRODUCT_DIRECTION_VALID'
    ) {
      return 'verdict-polish';
    }
    if (
      verdict === 'PRODUCT_BLOCKED' ||
      verdict === 'VISION_MISALIGNED' ||
      verdict === 'NOT_READY_FOR_USERS' ||
      verdict === 'FOUNDATION_ONLY'
    ) {
      return 'verdict-blocked';
    }
    if (
      verdict === 'TECHNICALLY_READY_PRODUCT_NOT_READY' ||
      verdict === 'READY_FOR_INTERNAL_TESTING' ||
      verdict === 'READY_FOR_INTERNAL_PRODUCT_USE' ||
      verdict === 'EXECUTION_GAPS_PRESENT'
    ) {
      return 'verdict-not-ready';
    }
    return 'verdict-not-ready';
  }

  function renderFounderTestResults(report) {
    var body = el('founder-test-panel-body');
    var copyBtn = el('copy-founder-test-report');
    if (!body || !report) return;

    var isV5 = report.mode === 'founder-testing-v5';
    var isV4 = report.mode === 'founder-testing-v4' || (isV5 && report.v4);
    var v4Report = isV5 && report.v4 ? report.v4 : report;
    var summary = isV5 && report.unifiedSummary ? report.unifiedSummary : null;
    var isV3 = report.mode === 'founder-testing-v3' || isV4;
    var isV2 = report.mode === 'founder-testing-v2' || isV3;
    var blockers = (report.issues || []).filter(function (i) {
      return i.severity === 'BLOCKER';
    });
    var highs = (report.issues || []).filter(function (i) {
      return i.severity === 'HIGH';
    });

    var html = '<div class="founder-test-summary">';
    if (isV5 && summary) {
      html +=
        '<p class="founder-test-mode">Founder Test — unified evaluation</p>' +
        '<p class="founder-test-score">Overall founder score: <strong>' +
        String(summary.overallFounderScore) +
        '/100</strong></p>' +
        '<p class="founder-test-score">Launch recommendation: <strong>' +
        escapeHtml(summary.launchRecommendation) +
        '</strong></p>' +
        '<p class="founder-test-verdict ' +
        verdictClass(report.verdict) +
        '">Verdict: <strong>' +
        escapeHtml(report.verdict) +
        '</strong></p>';
      if (summary.highestImpactUpgrade) {
        html +=
          '<p class="founder-test-score">Highest impact upgrade: <strong>' +
          escapeHtml(summary.highestImpactUpgrade) +
          '</strong></p>';
      }
      html += '</div>';
      if (summary.whatWorks.length) {
        html += '<div class="founder-test-next"><h4>What works</h4><ul>';
        for (var w = 0; w < Math.min(summary.whatWorks.length, 5); w += 1) {
          html += '<li>' + escapeHtml(summary.whatWorks[w]) + '</li>';
        }
        html += '</ul></div>';
      }
      if (summary.whatIsBroken.length) {
        html += '<div class="founder-test-blockers"><h4>What is broken</h4><ul>';
        for (var b = 0; b < Math.min(summary.whatIsBroken.length, 5); b += 1) {
          html += '<li>' + escapeHtml(summary.whatIsBroken[b]) + '</li>';
        }
        html += '</ul></div>';
      }
      if (summary.whatDoesntMakeSense.length) {
        html += '<div class="founder-test-blockers"><h4>What doesn\'t make sense</h4><ul>';
        for (var c = 0; c < Math.min(summary.whatDoesntMakeSense.length, 4); c += 1) {
          html += '<li>' + escapeHtml(summary.whatDoesntMakeSense[c]) + '</li>';
        }
        html += '</ul></div>';
      }
      if (summary.recommendedActions.length) {
        html += '<div class="founder-test-next"><h4>Recommended actions</h4><ol>';
        for (var a = 0; a < Math.min(summary.recommendedActions.length, 5); a += 1) {
          html += '<li>' + escapeHtml(summary.recommendedActions[a]) + '</li>';
        }
        html += '</ol></div>';
      }
      if (summary.launchBlockers.length) {
        html += '<div class="founder-test-blockers"><h4>Launch blockers</h4><ul>';
        for (var lb = 0; lb < Math.min(summary.launchBlockers.length, 4); lb += 1) {
          html += '<li>' + escapeHtml(summary.launchBlockers[lb]) + '</li>';
        }
        html += '</ul></div>';
      }
      html += '<p class="hint">' + escapeHtml(summary.finalRecommendation) + '</p>';
      body.innerHTML = html;
      if (copyBtn) copyBtn.disabled = !report.reportMarkdown;
      showFounderTestPanel('done');
      return;
    }
    if (isV4 && v4Report.launchReadinessReality) {
      var lr4 = v4Report.launchReadinessReality;
      html +=
        '<p class="founder-test-mode">Founder Test V4 — execution reality</p>' +
        '<p class="founder-test-score">Launch readiness: <strong>' +
        String(lr4.launchReadinessRealityScore) +
        '/100</strong> · Execution: <strong>' +
        String(lr4.executionReadiness) +
        '</strong> · Idea-to-app: <strong>' +
        String(v4Report.ideaToAppScore) +
        '</strong></p>' +
        '<p class="founder-test-score">Journey: <strong>' +
        String(v4Report.creationJourneyScore) +
        '</strong> · Promise alignment: <strong>' +
        String(lr4.promiseAlignment) +
        '</strong></p>';
    } else if (isV3 && report.launchReadiness) {
      var lr = report.launchReadiness;
      var rr3 = report.v2 && report.v2.readinessReality ? report.v2.readinessReality : null;
      html +=
        '<p class="founder-test-mode">Founder Test V3 — human behavior simulation</p>' +
        '<p class="founder-test-score">Launch readiness: <strong>' +
        String(lr.launchReadinessScore) +
        '/100</strong> · Trust: <strong>' +
        String(report.trustScore) +
        '</strong> · Goals: <strong>' +
        String(lr.goalCompletionScore) +
        '</strong></p>';
      if (rr3) {
        html +=
          '<p class="founder-test-score">Technical: <strong>' +
          String(rr3.technicalReadiness) +
          '</strong> · Vision: <strong>' +
          String(rr3.visionAlignment) +
          '</strong> · Human success: <strong>' +
          String(lr.humanSuccessRate) +
          '</strong></p>';
      }
    } else if (isV2 && report.readinessReality) {
      var rr = report.readinessReality;
      html +=
        '<p class="founder-test-mode">Founder Test V2 — vision &amp; product reality</p>' +
        '<p class="founder-test-score">Technical: <strong>' +
        String(rr.technicalReadiness) +
        '</strong> · Product: <strong>' +
        String(rr.productReadiness) +
        '</strong> · Vision: <strong>' +
        String(rr.visionAlignment) +
        '</strong></p>' +
        '<p class="founder-test-score">Founder approval: <strong>' +
        String(report.founderApproval ? report.founderApproval.likelihood : 0) +
        '/100</strong> · Leakage: <strong>' +
        escapeHtml(report.architectureLeakageSummary || 'NONE') +
        '</strong></p>';
    } else if (report.scores) {
      html +=
        '<p class="founder-test-score">Overall score: <strong>' +
        String(report.scores.overall) +
        '/100</strong></p>';
    }
    html +=
      '<p class="founder-test-verdict ' +
      verdictClass(report.verdict) +
      '">Verdict: <strong>' +
      escapeHtml(report.verdict) +
      '</strong></p></div>';

    if (isV4 && v4Report.topProductRisks && v4Report.topProductRisks.length) {
      html += '<div class="founder-test-blockers"><h4>Top product risks</h4><ul>';
      for (var pr = 0; pr < Math.min(v4Report.topProductRisks.length, 5); pr += 1) {
        html += '<li>' + escapeHtml(v4Report.topProductRisks[pr]) + '</li>';
      }
      html += '</ul></div>';
    } else if (isV3 && report.topTrustLossRisks && report.topTrustLossRisks.length) {
      html += '<div class="founder-test-blockers"><h4>Top trust loss risks</h4><ul>';
      for (var t = 0; t < Math.min(report.topTrustLossRisks.length, 5); t += 1) {
        html += '<li>' + escapeHtml(report.topTrustLossRisks[t]) + '</li>';
      }
      html += '</ul></div>';
    } else if (isV2 && report.topFounderConcerns && report.topFounderConcerns.length) {
      html += '<div class="founder-test-blockers"><h4>Top founder concerns</h4><ul>';
      for (var c = 0; c < Math.min(report.topFounderConcerns.length, 5); c += 1) {
        html += '<li>' + escapeHtml(report.topFounderConcerns[c]) + '</li>';
      }
      html += '</ul></div>';
    } else if (blockers.length) {
      html += '<div class="founder-test-blockers"><h4>Top blockers</h4><ul>';
      for (var b = 0; b < Math.min(blockers.length, 5); b += 1) {
        html += '<li>' + escapeHtml(blockers[b].screen) + ': ' + escapeHtml(blockers[b].problem) + '</li>';
      }
      html += '</ul></div>';
    } else if (highs.length) {
      html += '<div class="founder-test-blockers"><h4>High priority</h4><ul>';
      for (var h = 0; h < Math.min(highs.length, 5); h += 1) {
        html += '<li>' + escapeHtml(highs[h].screen) + ': ' + escapeHtml(highs[h].problem) + '</li>';
      }
      html += '</ul></div>';
    }

    if (report.recommendedFixOrder && report.recommendedFixOrder.length) {
      html += '<div class="founder-test-next"><h4>Recommended next actions</h4><ol>';
      for (var n = 0; n < Math.min(report.recommendedFixOrder.length, 5); n += 1) {
        html += '<li>' + escapeHtml(report.recommendedFixOrder[n]) + '</li>';
      }
      html += '</ol></div>';
    }

    body.innerHTML = html;
    if (copyBtn) copyBtn.disabled = !report.reportMarkdown;
    showFounderTestPanel('done');
  }

  function showFounderTestError(message) {
    var body = el('founder-test-panel-body');
    if (body) {
      body.innerHTML =
        '<p class="founder-test-error">Founder test failed: ' + escapeHtml(message || 'unknown error') + '</p>' +
        '<p class="hint">Partial report may still be available after retry.</p>';
    }
    showFounderTestPanel('error');
  }

  async function waitForInsightsReady() {
    var start = Date.now();
    while (Date.now() - start < FOUNDER_TEST_MAX_SCREEN_MS) {
      var surface = el('project-insights-surface');
      if (!surface) return false;
      var text = surface.innerHTML || '';
      var stillLoading = /insights loading/i.test(text) || /Portfolio insights loading/i.test(text);
      var hasPortfolio = /portfolio-summary-grid|portfolio-project-card|DEMO/i.test(text);
      if (!stillLoading && hasPortfolio) return true;
      if (!stillLoading && text.replace(/\s/g, '').length > 120) return true;
      await waitMs(120);
    }
    return false;
  }

  async function runFounderTestLiveChecks() {
    var results = [];
    var liveLines = [];

    for (var i = 0; i < FOUNDER_TEST_LIVE_SCREENS.length; i += 1) {
      var spec = FOUNDER_TEST_LIVE_SCREENS[i];
      var checks = [];
      switchView(spec.viewId);
      await waitMs(100);

      var view = el('view-' + spec.viewId);
      checks.push({
        name: 'view-visible',
        passed: !!(view && !view.classList.contains('hidden')),
        detail: view && !view.classList.contains('hidden') ? 'Screen opened' : 'Screen did not open',
      });

      var title = el('center-title');
      var expectedTitle = VIEW_TITLES[spec.viewId] || PRODUCT_BRAND;
      checks.push({
        name: 'title-updates',
        passed: !!(title && title.textContent && title.textContent.indexOf(expectedTitle) !== -1),
        detail: title ? 'Title: ' + title.textContent : 'Title missing',
      });

      if (spec.viewId === 'project-insights') {
        var ready = await waitForInsightsReady();
        checks.push({
          name: 'no-infinite-loading',
          passed: ready,
          detail: ready ? 'Portfolio rendered without infinite loading' : 'Stuck loading or empty portfolio',
        });
      }

      var container = el(spec.containerId);
      var content = container ? container.innerHTML.replace(/\s/g, '') : '';
      checks.push({
        name: 'has-content',
        passed: content.length > 60,
        detail: content.length > 60 ? 'Useful content visible' : 'Insufficient visible content',
      });

      if (spec.viewId === 'project-insights') {
        var noStacks = content.indexOf('Foundation Stacks') === -1 && content.indexOf('validator-list') === -1;
        checks.push({
          name: 'no-internal-diagnostics',
          passed: noStacks,
          detail: noStacks ? 'No internal diagnostics in Project Insights' : 'Internal diagnostics leaked into Project Insights',
        });
      }

      if (spec.viewId === 'verification') {
        var noMassiveList = (container ? container.querySelectorAll('li').length : 0) < 25;
        checks.push({
          name: 'no-massive-validator-list',
          passed: noMassiveList,
          detail: noMassiveList ? 'Verification not overwhelmed with script list' : 'Too many validator entries shown',
        });
      }

      var navBtn = document.querySelector('.nav-item[data-view="' + spec.viewId + '"]');
      checks.push({
        name: 'nav-active',
        passed: !!(navBtn && navBtn.classList.contains('active')),
        detail: navBtn && navBtn.classList.contains('active') ? 'Nav active state clear' : 'Nav active state missing',
      });

      var passed = checks.every(function (c) {
        return c.passed;
      });
      results.push({
        screen: spec.label,
        viewId: spec.viewId,
        passed: passed,
        checks: checks,
      });
      liveLines.push('- ' + spec.label + ': ' + (passed ? 'PASS' : 'FAIL'));
    }

    return { results: results, liveSection: liveLines.join('\n') };
  }

  async function runFounderTestInteractionChecks() {
    switchView('command-center');
    await waitMs(80);

    var panel = el('founder-test-panel');
    var closeBtn = el('founder-test-close');
    var copyBtn = el('copy-founder-test-report');
    var input = el('chat-input');
    var checks = [];

    showFounderTestPanel('done');
    checks.push({
      name: 'modal-opens',
      passed: !!(panel && !panel.hasAttribute('hidden')),
      detail: panel && !panel.hasAttribute('hidden') ? 'Results panel opened' : 'Results panel did not open',
    });

    if (closeBtn) {
      closeBtn.click();
    }
    await waitMs(60);

    var panelHidden = !!(panel && panel.hasAttribute('hidden'));
    var visuallyHidden = panelHidden;
    if (panel && typeof window.getComputedStyle === 'function') {
      visuallyHidden = panelHidden && window.getComputedStyle(panel).display === 'none';
    }

    checks.push({
      name: 'modal-closes-via-x',
      passed: panelHidden,
      detail: panelHidden ? 'X close button dismissed modal' : 'Modal stayed open after clicking X',
    });
    checks.push({
      name: 'modal-visually-hidden',
      passed: visuallyHidden,
      detail: visuallyHidden
        ? 'Modal no longer visible after close'
        : 'Modal still visible or blocking Command Center',
    });
    checks.push({
      name: 'command-center-input-usable',
      passed: !!(input && !input.disabled && !input.readOnly),
      detail: input && !input.disabled ? 'Command Center input remains usable' : 'Command Center input blocked',
    });

    showFounderTestPanel('done');
    checks.push({
      name: 'copy-report-available',
      passed: !!(copyBtn && !copyBtn.disabled),
      detail:
        copyBtn && !copyBtn.disabled
          ? 'Copy Report available while results panel is open'
          : 'Copy Report unavailable while panel open',
    });
    hideFounderTestPanel();

    var passed = checks.every(function (c) {
      return c.passed;
    });

    return {
      screen: 'Founder Interaction Simulation',
      viewId: 'interaction-simulation',
      passed: passed,
      checks: checks,
    };
  }

  async function runFounderTest() {
    if (founderTestRunning) return;
    founderTestRunning = true;
    lastFounderTestReport = null;
    var copyBtn = el('copy-founder-test-report');
    if (copyBtn) copyBtn.disabled = true;
    showFounderTestPanel('running');
    renderVerificationSurface(workspaceData);

    try {
      await new Promise(function (resolve) {
        streamFounderTestFeed(resolve);
      });
      var live = await runFounderTestLiveChecks();
      var interactionLive = await runFounderTestInteractionChecks();
      var liveResults = live.results.slice();
      liveResults.push(interactionLive);
      var res = await fetch('/api/founder-test/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          liveResults: liveResults,
          liveSection: live.liveSection + '\n- Founder Interaction Simulation: ' + (interactionLive.passed ? 'PASS' : 'FAIL'),
        }),
      });
      var data = await res.json();
      if (!data.ok || !data.report) {
        throw new Error((data && data.error) || 'Founder test API failed');
      }
      lastFounderTestReport = data.report;
      lastVerificationResults =
        data.verificationResults ||
        (data.report && (data.report.verificationResults || data.report.verificationResultsVisibility)) ||
        null;
      lastChangeIntelligence =
        data.changeIntelligence ||
        (data.report && (data.report.changeIntelligence || data.report.changeIntelligenceVisibility)) ||
        null;
      lastFounderActionCenter =
        data.founderActionCenter || (data.report && data.report.founderActionCenter) || null;
      lastProductCoherence =
        data.founderSensemaking || (data.report && data.report.founderSensemaking) || null;
      lastFrictionHeatmap =
        data.founderFrictionHeatmap ||
        (data.report && data.report.founderFrictionHeatmap) ||
        null;
      renderFounderTestResults(data.report);
      renderVerificationSurface(workspaceData);
      renderProjectInsightsSurface(workspaceData);
      renderFounderActionCenterSurface(workspaceData);
      renderProductCoherenceSurface(workspaceData);
    } catch (err) {
      showFounderTestError(err && err.message ? err.message : 'Unknown error');
    } finally {
      founderTestRunning = false;
    }
  }

  function copyFounderTestReport() {
    if (!lastFounderTestReport || !lastFounderTestReport.reportMarkdown) return;
    var text = lastFounderTestReport.reportMarkdown;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    }
  }

  function closeMobilePanels() {
    var sidebar = el('sidebar');
    var feed = el('operator-feed');
    var sidebarBackdrop = el('sidebar-backdrop');
    var feedBackdrop = el('feed-backdrop');
    var navToggle = el('mobile-nav-toggle');
    var feedToggle = el('mobile-feed-toggle');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (feed) feed.classList.remove('mobile-open');
    if (sidebarBackdrop) {
      sidebarBackdrop.classList.remove('visible');
      sidebarBackdrop.setAttribute('hidden', '');
    }
    if (feedBackdrop) {
      feedBackdrop.classList.remove('visible');
      feedBackdrop.setAttribute('hidden', '');
    }
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    if (feedToggle) feedToggle.setAttribute('aria-expanded', 'false');
  }

  function bindEvents() {
    bindFirstTimeFounderPath();
    var nav = el('sidebar-nav');
    if (nav) {
      nav.addEventListener('click', function (e) {
        var target = e.target && e.target.closest ? e.target.closest('.nav-item') : e.target;
        if (!target || !target.classList.contains('nav-item')) return;
        var view = target.getAttribute('data-view');
        if (view) switchView(view);
        closeMobilePanels();
      });
    }

    var navToggle = el('mobile-nav-toggle');
    var feedToggle = el('mobile-feed-toggle');
    var sidebar = el('sidebar');
    var feed = el('operator-feed');
    var sidebarBackdrop = el('sidebar-backdrop');
    var feedBackdrop = el('feed-backdrop');

    if (navToggle && sidebar && sidebarBackdrop) {
      navToggle.addEventListener('click', function () {
        var open = sidebar.classList.contains('mobile-open');
        closeMobilePanels();
        if (!open) {
          sidebar.classList.add('mobile-open');
          sidebarBackdrop.removeAttribute('hidden');
          sidebarBackdrop.classList.add('visible');
          navToggle.setAttribute('aria-expanded', 'true');
        }
      });
      sidebarBackdrop.addEventListener('click', closeMobilePanels);
    }

    if (feedToggle && feed && feedBackdrop) {
      feedToggle.addEventListener('click', function () {
        var open = feed.classList.contains('mobile-open');
        closeMobilePanels();
        if (!open) {
          feed.classList.add('mobile-open');
          feedBackdrop.removeAttribute('hidden');
          feedBackdrop.classList.add('visible');
          feedToggle.setAttribute('aria-expanded', 'true');
        }
      });
      feedBackdrop.addEventListener('click', closeMobilePanels);
    }

    var form = el('chat-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = el('chat-input');
        if (!input) return;
        var text = input.value.trim();
        if (!text) return;
        if (!conversationStarted) hideWelcomeState();
        appendChatMessage(text, 'user');
        input.value = '';
        askBrain(text);
      });
    }

    var notifToggle = el('notif-toggle');
    var drawer = el('notification-drawer');
    if (notifToggle && drawer) {
      notifToggle.addEventListener('click', function () {
        var open = drawer.hasAttribute('hidden');
        if (open) {
          drawer.removeAttribute('hidden');
          notifToggle.setAttribute('aria-expanded', 'true');
        } else {
          drawer.setAttribute('hidden', '');
          notifToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    var founderBtn = el('run-founder-test');
    if (founderBtn) {
      founderBtn.addEventListener('click', function () {
        runFounderTest();
      });
    }

    var founderClose = el('founder-test-close');
    if (founderClose) {
      founderClose.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        hideFounderTestPanel();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var panel = el('founder-test-panel');
      if (panel && !panel.hasAttribute('hidden')) {
        hideFounderTestPanel();
      }
    });

    var copyReportBtn = el('copy-founder-test-report');
    if (copyReportBtn) {
      copyReportBtn.addEventListener('click', copyFounderTestReport);
    }
  }

  bindEvents();
  switchView('command-center');
  showWelcomeState();
  renderRuntimeDiagnostics();
  renderCrossSystemDiagnostics({
    relationshipCount: 0,
    dependencyCount: 0,
    impactAnalysisAvailable: true,
    lastQueryType: null,
    lastAnalyzerUsed: null,
    lastRoutingResult: null,
    lastRelationshipQuery: null,
    lastDependencyQuery: null,
    lastImpactQuery: null,
  });

  loadExecutionProof(false)
    .then(function () {
      if (currentViewId === 'verification') {
        refreshExecutionProofPanel();
      }
    })
    .catch(function () {
      /* Execution Proof falls back to loading state in Verification view */
    });

  fetch('/api/founder-reality.json')
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load manifest');
      return res.json();
    })
    .then(function (data) {
      applyManifest(data);
    })
    .catch(function () {
      if (!conversationStarted) hideWelcomeState();
      appendChatMessage('Could not load manifest — System Diagnostics may be limited. Demo portfolio still available.', 'system');
      if (el('current-status')) {
        el('current-status').textContent = 'Manifest load failed. See System Diagnostics when available.';
      }
      setLastError('Manifest load failed');
    });

  loadProductWorkspace(false)
    .then(function () {
      return checkBrainHealth();
    })
    .catch(function () {
      setLastError('Brain health check failed');
    });
})();
