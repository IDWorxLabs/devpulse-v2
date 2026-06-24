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
  var founderReviewData = null;
  var founderReviewLoadPromise = null;
  var founderReviewProfile = 'TASK_TRACKER_WEB_V1';
  var requirementDiscoveryData = null;
  var requirementDiscoveryLoadPromise = null;
  var verificationHubData = null;
  var verificationHubLoadPromise = null;
  var verificationHubProfile = 'CRM_WEB_V1';
  var trustCalibrationData = null;
  var trustCalibrationLoadPromise = null;
  var trustCalibrationProfile = 'CRM_WEB_V1';
  var productArchitectData = null;
  var productArchitectLoadPromise = null;
  var productArchitectProfile = 'CRM_WEB_V1';
  var largeScaleValidationData = null;
  var executionPipelineData = null;
  var executionPipelineLoadPromise = null;
  var largeScaleValidationLoadPromise = null;
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
  var defaultFeedSections = ['Planning', 'Execution', 'Verification', 'Verification Hub', 'Founder Review', 'Product Architect Review', 'Founder Trust Calibration', 'Large-Scale Validation', 'Execution Pipeline', 'Requirement Discovery', 'Approvals', 'Learning'];
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
    'Verification Hub': {
      action: 'Verification hub ready',
      detail: 'UVL coordinates verification coverage, confidence, timeline, gaps, and history across applications.',
    },
    'Founder Review': {
      action: 'Launch review pipeline idle',
      detail: 'Open Founder Review to see evidence chain, reviewer panel, verdict, and AutoFix status.',
    },
    'Product Architect Review': {
      action: 'Product architecture review ready',
      detail: 'Evaluate product completeness, workflows, journeys, and critical product gaps before launch.',
    },
    'Founder Trust Calibration': {
      action: 'Trust calibration ready',
      detail: 'Measure AFLA verdict stability, false positives, confidence accuracy, and reviewer alignment.',
    },
    'Large-Scale Validation': {
      action: 'Large-scale validation ready',
      detail: 'Stress-test build, verify, review, and launch across 50+ application categories.',
    },
    'Execution Pipeline': {
      action: 'Real build execution ready',
      detail: 'End-to-end execution proof — prompt through CQI, planning, codegen, build, preview, UVL, Product Architect, and AFLA.',
    },
    'Requirement Discovery': {
      action: 'Requirement discovery ready',
      detail: 'CQI identifies missing requirements and asks domain-aware questions before planning.',
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
  var deliveredFounderTestReportKeys = Object.create(null);
  var notificationIdCounter = 0;
  var localFounderTestPreviewRunId = null;
  var operatorFeedMode = 'default';
  var founderTestRuntimeDismissed = false;
  var founderTestRuntimePinnedRunId = null;
  var lastKnownActiveFounderTestRuntimeSnapshot = null;
  var founderTestRuntimeCardSnapshot = null;
  var founderTestRuntimeReportBindingMismatch = false;
  var founderTestRuntimeReportBindingRefreshInFlight = false;
  var founderTestFinalReportsByRunId = Object.create(null);
  var founderTestFinalReportFetchStateByRunId = Object.create(null);
  var founderTestOperatorFeedReportFetching = false;
  var founderTestOperatorFeedReportFetchInFlight = false;
  var founderTestRuntimeReportFetchFailed = false;
  var founderTestCompletePreparingSinceMs = null;
  var founderTestReportHandoffStalled = false;
  var founderTestResultDebugSnapshot = null;
  var founderTestLastResultFetchDiagnostic = null;
  var founderTestReportHandoffStallCheckId = null;
  var FOUNDER_TEST_REPORT_HANDOFF_STALL_MS = 10000;
  var FOUNDER_TEST_RESULT_FETCH_TIMEOUT_MS = 3000;
  var FOUNDER_TEST_RESULT_FETCH_MAX_ATTEMPTS = 3;
  var NON_JSON_RESPONSE_PREVIEW_MAX_CHARS = 120;
  var FOUNDER_TEST_COMPLETE_HEADER_HANDOFF_STALLED =
    'Founder Test complete — report handoff stalled.';
  var founderTestRunStartedAt = null;
  var founderTestRunningDiagnosticDelivered = false;
  var OPERATOR_FEED_MODE_DEFAULT = 'default';
  var OPERATOR_FEED_MODE_FOUNDER_TEST = 'founder-test-runtime';
  var FOUNDER_TEST_RUNNING_DIAGNOSTIC_MS = 45000;
  var runtimeDiagnostics = {
    brainConnected: false,
    brainEndpointReachable: false,
    operatorFeedActive: false,
    chatIntegrationActive: true,
    lastRequestStatus: 'Not started',
    lastError: 'None',
  };
  var previewClientReality = { loaded: false, error: false };
  var activeProjectId = null;
  var multiProjectWorkspaces = [];
  var projectChatThreads = {};
  var linkedProjectSwitch = true;
  var projectTabCounter = 0;

  function getActiveProjectWorkspace() {
    if (!multiProjectWorkspaces.length) return null;
    for (var i = 0; i < multiProjectWorkspaces.length; i += 1) {
      if (multiProjectWorkspaces[i].projectId === activeProjectId) {
        return multiProjectWorkspaces[i];
      }
    }
    return multiProjectWorkspaces[0];
  }

  function getActiveProjectName() {
    var project = getActiveProjectWorkspace();
    return project ? project.projectName : 'New Project';
  }

  function saveActiveProjectChat() {
    if (!activeProjectId) return;
    var history = el('chat-history');
    if (!history) return;
    projectChatThreads[activeProjectId] = history.innerHTML;
  }

  function restoreProjectChat(projectId) {
    var history = el('chat-history');
    if (!history) return;
    history.innerHTML = projectChatThreads[projectId] || '';
    if (history.innerHTML.trim()) {
      hideWelcomeState();
    } else {
      showWelcomeState();
    }
    scrollChatToBottom();
  }

  function renderWorkspaceTabs(containerId) {
    var container = el(containerId || 'workspace-tabs');
    if (!container) return;
    if (!multiProjectWorkspaces.length) {
      container.innerHTML =
        '<button type="button" class="workspace-tab active" data-project-id="__default__">Default Project</button>';
      return;
    }
    container.innerHTML = multiProjectWorkspaces
      .map(function (project) {
        var status =
          project.buildStatus === 'READY'
            ? ' · Ready'
            : project.buildStatus === 'BUILDING'
              ? ' · Building'
              : project.buildStatus === 'FAILED'
                ? ' · Failed'
                : '';
        return (
          '<button type="button" class="workspace-tab' +
          (project.projectId === activeProjectId ? ' active' : '') +
          '" data-project-id="' +
          escapeHtml(project.projectId) +
          '" role="tab" aria-selected="' +
          (project.projectId === activeProjectId ? 'true' : 'false') +
          '">' +
          escapeHtml(project.projectName + status) +
          '</button>'
        );
      })
      .join('');
    var tabs = container.querySelectorAll('.workspace-tab');
    for (var i = 0; i < tabs.length; i += 1) {
      tabs[i].addEventListener('click', function () {
        var projectId = this.getAttribute('data-project-id');
        if (projectId && projectId !== '__default__') {
          switchActiveProject(projectId);
        }
      });
    }
  }

  function updateWorkspaceLinkedIndicator() {
    var indicator = el('workspace-linked-indicator');
    if (!indicator) return;
    var project = getActiveProjectWorkspace();
    if (!project) {
      indicator.classList.add('hidden');
      return;
    }
    indicator.classList.remove('hidden');
    indicator.textContent =
      'Active project: ' +
      project.projectName +
      ' — Command Center chat and Live Preview stay linked to this project.';
  }

  function buildWorkspaceViewForActiveProject(base) {
    base = base || workspaceData || {};
    var project = getActiveProjectWorkspace();
    if (!project) return base;
    var livePreview = Object.assign({}, base.livePreview || {}, {
      previewUrl: project.previewUrl || (base.livePreview && base.livePreview.previewUrl) || null,
      connected: Boolean(project.previewUrl),
      buildStatus:
        project.buildStatus === 'READY'
          ? 'READY — ' + (project.workspacePath || project.projectId)
          : project.buildStatus || (base.livePreview && base.livePreview.buildStatus) || 'Unknown',
      onePromptReady: project.buildStatus === 'READY' && Boolean(project.previewUrl),
      onePromptBuild: {
        status: project.buildStatus,
        workspaceId: project.projectId,
        workspacePath: project.workspacePath,
        generatedProfile: project.buildProfile,
        buildResult: project.buildStatus === 'READY' ? 'PASS' : project.buildStatus === 'FAILED' ? 'FAIL' : null,
        previewUrl: project.previewUrl,
        failureReason: null,
        npmInstallOk: project.buildStatus === 'READY',
        npmBuildOk: project.buildStatus === 'READY',
      },
    });
    return Object.assign({}, base, {
      activeProjectId: activeProjectId,
      multiProjectWorkspaces: multiProjectWorkspaces,
      livePreview: livePreview,
    });
  }

  function switchActiveProject(projectId, options) {
    options = options || {};
    if (!projectId || projectId === activeProjectId) {
      renderWorkspaceTabs('workspace-tabs');
      renderWorkspaceTabs('preview-workspace-tabs');
      updateWorkspaceLinkedIndicator();
      return;
    }
    if (!options.skipChatSave) {
      saveActiveProjectChat();
    }
    activeProjectId = projectId;
    for (var i = 0; i < multiProjectWorkspaces.length; i += 1) {
      multiProjectWorkspaces[i].active = multiProjectWorkspaces[i].projectId === projectId;
    }
    if (!options.skipChatRestore) {
      restoreProjectChat(projectId);
    }
    renderWorkspaceTabs('workspace-tabs');
    renderWorkspaceTabs('preview-workspace-tabs');
    updateWorkspaceLinkedIndicator();
    if (linkedProjectSwitch && !options.skipViewSwitch) {
      if (currentViewId === 'command-center' || currentViewId === 'live-preview') {
        renderLivePreviewSurface(buildWorkspaceViewForActiveProject(workspaceData));
      }
    }
    renderProductSurfaces();
  }

  function applyMultiProjectWorkspaceState(data) {
    if (data && Array.isArray(data.multiProjectWorkspaces)) {
      multiProjectWorkspaces = data.multiProjectWorkspaces.slice();
    }
    if (data && data.activeProjectId) {
      switchActiveProject(data.activeProjectId, { skipChatSave: true, skipChatRestore: false, skipViewSwitch: true });
    } else if (!activeProjectId && multiProjectWorkspaces.length) {
      switchActiveProject(multiProjectWorkspaces[0].projectId, {
        skipChatSave: true,
        skipChatRestore: false,
        skipViewSwitch: true,
      });
    } else {
      renderWorkspaceTabs('workspace-tabs');
      renderWorkspaceTabs('preview-workspace-tabs');
      updateWorkspaceLinkedIndicator();
    }
  }

  function createNewProjectTab(name) {
    projectTabCounter += 1;
    var projectId = 'project-' + Date.now() + '-' + projectTabCounter;
    var projectName = name || 'Project ' + projectTabCounter;
    multiProjectWorkspaces.push({
      projectId: projectId,
      projectName: projectName,
      workspacePath: null,
      chatThreadId: 'chat-' + projectId,
      previewUrl: null,
      buildProfile: null,
      buildStatus: 'IDLE',
      lastUpdated: new Date().toISOString(),
      active: false,
      devServerPort: null,
      buildId: null,
    });
    switchActiveProject(projectId);
    pushNotification('Created project tab — ' + projectName);
  }

  function mergeMultiProjectWorkspacesFromResponse(nextSessions) {
    if (!Array.isArray(nextSessions) || !nextSessions.length) return;
    var merged = multiProjectWorkspaces.slice();
    for (var i = 0; i < nextSessions.length; i += 1) {
      var incoming = nextSessions[i];
      var existingIndex = -1;
      for (var j = 0; j < merged.length; j += 1) {
        if (merged[j].projectId === incoming.projectId) {
          existingIndex = j;
          break;
        }
      }
      if (existingIndex >= 0) {
        merged[existingIndex] = Object.assign({}, merged[existingIndex], incoming);
      } else {
        merged.push(incoming);
      }
    }
    multiProjectWorkspaces = merged;
  }

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

  function createNotificationId(prefix) {
    notificationIdCounter += 1;
    return String(prefix) + '-' + String(notificationIdCounter) + '-' + String(Date.now());
  }

  function normalizeNotificationEntry(entry) {
    if (typeof entry === 'string') {
      return { id: createNotificationId('simple'), type: 'simple', text: entry, timestamp: new Date().toISOString() };
    }
    return entry;
  }

  function findNotificationEntryById(id) {
    for (var i = 0; i < runtimeNotifications.length; i += 1) {
      var entry = normalizeNotificationEntry(runtimeNotifications[i]);
      if (entry.id === id) return entry;
    }
    return null;
  }

  function refreshNotificationSurfaces() {
    renderNotifications(runtimeNotifications);
    renderNotificationsSurface(workspaceData, runtimeNotifications);
    updateNotificationUnreadBadge();
  }

  function updateNotificationUnreadBadge() {
    var badge = el('notif-unread-badge');
    var toggle = el('notif-toggle');
    var unread = 0;
    for (var u = 0; u < runtimeNotifications.length; u += 1) {
      var note = normalizeNotificationEntry(runtimeNotifications[u]);
      if (note.read !== true) unread += 1;
    }
    if (badge) {
      badge.textContent = unread > 0 ? String(unread) : '0';
      if (unread > 0) {
        badge.removeAttribute('hidden');
        badge.setAttribute('aria-hidden', 'false');
      } else {
        badge.setAttribute('hidden', '');
        badge.setAttribute('aria-hidden', 'true');
      }
    }
    if (toggle) toggle.setAttribute('data-unread-count', String(unread));
  }

  function markAllNotificationsRead() {
    for (var i = 0; i < runtimeNotifications.length; i += 1) {
      var entry = runtimeNotifications[i];
      if (typeof entry === 'object' && entry) entry.read = true;
    }
    updateNotificationUnreadBadge();
  }

  function traceFounderTestDelivery(event, detail) {
    if (typeof window !== 'undefined' && window.__DEVPULSE_TRACE_FOUNDER_TEST__ === true) {
      console.log('[founder-test-delivery]', event, detail || '');
    }
  }

  function postFounderTestDeliveryTraceClientEvent(payload) {
    if (!payload || !payload.runId || !payload.boundaryId) return;
    try {
      fetch('/api/founder-test/delivery-trace-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
        cache: 'no-store',
      }).catch(function () {});
    } catch (_) {}
  }

  function pushNotification(text) {
    var exists = false;
    for (var i = 0; i < runtimeNotifications.length; i += 1) {
      var existing = normalizeNotificationEntry(runtimeNotifications[i]);
      if (existing.type === 'simple' && existing.text === text) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      runtimeNotifications.unshift({
        id: createNotificationId('simple'),
        type: 'simple',
        text: text,
        timestamp: new Date().toISOString(),
        read: false,
      });
    }
    refreshNotificationSurfaces();
  }

  function buildFounderTestReportNotificationHtml(entry) {
    var preview = entry.preview || '';
    if (!preview && entry.reportMarkdown) {
      preview = String(entry.reportMarkdown).slice(0, 280).replace(/\s+/g, ' ').trim();
      if (entry.reportMarkdown.length > preview.length) preview += '…';
    }
    return (
      '<div class="founder-test-report-notification-inner">' +
      '<p class="notification-report-title"><strong>' +
      escapeHtml(entry.title || 'Founder Test Report') +
      '</strong></p>' +
      '<p class="notification-report-meta">' +
      escapeHtml('Status: ' + (entry.status || 'unknown')) +
      ' · Run: ' +
      escapeHtml(entry.runId || 'n/a') +
      ' · ' +
      escapeHtml(entry.timestamp || '') +
      '</p>' +
      (preview
        ? '<pre class="notification-report-preview">' + escapeHtml(preview) + '</pre>'
        : '<p class="notification-report-preview empty">No report preview available.</p>') +
      '<button type="button" class="notification-copy-report-btn" data-copy-report-id="' +
      escapeHtml(entry.id) +
      '">Copy Report</button>' +
      '</div>'
    );
  }

  function setNotificationCopyButtonFeedback(button, state) {
    if (!button) return;
    button.classList.remove('is-copied', 'is-copy-failed');
    if (state === 'copied') {
      button.textContent = 'Copied';
      button.classList.add('is-copied');
      window.setTimeout(function () {
        button.textContent = 'Copy Report';
        button.classList.remove('is-copied');
      }, 2200);
      return;
    }
    if (state === 'failed') {
      button.textContent = 'Copy failed';
      button.classList.add('is-copy-failed');
      window.setTimeout(function () {
        button.textContent = 'Copy Report';
        button.classList.remove('is-copy-failed');
      }, 2600);
    }
  }

  function wireNotificationCopyButtons(container) {
    if (!container || container.dataset.copyWired === 'true') return;
    container.dataset.copyWired = 'true';
    container.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('[data-copy-report-id]') : null;
      if (!btn) return;
      e.preventDefault();
      var entry = findNotificationEntryById(btn.getAttribute('data-copy-report-id'));
      if (!entry) {
        setNotificationCopyButtonFeedback(btn, 'failed');
        return;
      }
      var noteRunId = entry.runId || resolveActiveFounderTestRunId();
      var useHandoffResolver =
        entry.status === 'COMPLETE' ||
        (entry.reportMarkdown &&
          String(entry.reportMarkdown).indexOf('# Founder Test Runtime Failure Report') >= 0);
      if (useHandoffResolver) {
        copyFounderTestReportHandoffShared({
          runId: noteRunId,
          onCopied: function () {
            setNotificationCopyButtonFeedback(btn, 'copied');
          },
          onFailed: function () {
            setNotificationCopyButtonFeedback(btn, 'failed');
          },
        });
        return;
      }
      copyFounderTestFinalReportMarkdownShared(noteRunId, {
        fallbackText: entry.reportMarkdown,
        onCopied: function () {
          setNotificationCopyButtonFeedback(btn, 'copied');
        },
        onFailed: function () {
          setNotificationCopyButtonFeedback(btn, 'failed');
        },
      });
    });
  }

  function isValidHandoffRunId(runId) {
    if (runId == null) return false;
    var normalized = String(runId).trim().toLowerCase();
    return (
      normalized.length > 0 &&
      normalized !== 'n/a' &&
      normalized !== 'unknown' &&
      normalized !== 'null' &&
      normalized !== 'undefined'
    );
  }

  function resolveReportHandoffRunId(explicitRunId, runtime) {
    var candidates = [
      explicitRunId,
      founderTestRuntimeCardSnapshot && founderTestRuntimeCardSnapshot.runId,
      runtime && runtime.runId,
      founderTestRuntimePinnedRunId,
      lastKnownActiveFounderTestRuntimeSnapshot && lastKnownActiveFounderTestRuntimeSnapshot.runId,
      lastFounderTestRuntimeSnapshot && lastFounderTestRuntimeSnapshot.runId,
    ];
    for (var ri = 0; ri < candidates.length; ri += 1) {
      if (isValidHandoffRunId(candidates[ri])) return String(candidates[ri]).trim();
    }
    return null;
  }

  function coerceReportHandoffRunId(resolvedRunId, runtime) {
    if (isValidHandoffRunId(resolvedRunId)) return String(resolvedRunId).trim();
    return resolveReportHandoffRunId(null, runtime);
  }

  function buildReportHandoffRunIdDiagnosticFields(requestedRunId, runtime) {
    runtime = runtime || resolveActiveFounderTestRuntimeSnapshot();
    var resolvedActiveRunId = resolveReportHandoffRunId(null, runtime);
    return {
      requestedRunId: isValidHandoffRunId(requestedRunId) ? String(requestedRunId) : 'n/a',
      runtimeCardRunId: isValidHandoffRunId(founderTestRuntimeCardSnapshot && founderTestRuntimeCardSnapshot.runId)
        ? String(founderTestRuntimeCardSnapshot.runId)
        : 'n/a',
      pinnedRunId: isValidHandoffRunId(founderTestRuntimePinnedRunId) ? String(founderTestRuntimePinnedRunId) : 'n/a',
      resolvedActiveRunId: isValidHandoffRunId(resolvedActiveRunId) ? String(resolvedActiveRunId) : 'n/a',
      runtimeSnapshotRunId: isValidHandoffRunId(runtime && runtime.runId) ? String(runtime.runId) : 'n/a',
    };
  }

  function normalizeFounderTestDeliveryRunId(runId, runtime) {
    return resolveReportHandoffRunId(runId, runtime);
  }

  function refreshNotificationDrawerIfOpen() {
    var drawer = el('notification-drawer');
    var list = el('notification-list');
    if (drawer && !drawer.hasAttribute('hidden')) {
      renderNotifications(runtimeNotifications);
      if (list) wireNotificationCopyButtons(list);
    }
  }

  function refreshFounderTestFinalReportDeliverySurfaces(runtime) {
    refreshNotificationSurfaces();
    updateNotificationUnreadBadge();
    refreshNotificationDrawerIfOpen();
    var runId = normalizeFounderTestDeliveryRunId(null, runtime);
    if (runId && hasFounderTestFinalReportAvailable(runId)) {
      setFounderTestFinalReportFetchState(runId, 'available');
    }
    founderTestOperatorFeedReportFetching = false;
    founderTestOperatorFeedReportFetchInFlight = false;
    updateFounderTestOperatorFeedReportActionLabels(runtime);
    updateCopyReportButtonState();
    lastRenderedOperatorTraceKey = '';
    if (runtime) {
      renderFounderTestRuntime(runtime);
    } else if (founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot()) {
      renderFounderTestUnifiedRuntimeCard(
        founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot(),
      );
    }
  }

  function pushFounderTestReportReadyNotification(runId, markdown, options) {
    options = options || {};
    if (!runId || !markdown || !String(markdown).trim()) return false;
    var dedupeKey = 'founder-test-report-' + runId + '-COMPLETE';
    if (!options.allowDuplicate && deliveredFounderTestReportKeys[dedupeKey]) {
      return false;
    }
    deliveredFounderTestReportKeys[dedupeKey] = true;
    var preview = String(markdown).slice(0, 280).replace(/\s+/g, ' ').trim();
    if (markdown.length > preview.length) preview += '…';
    runtimeNotifications.unshift({
      id: createNotificationId('ft-report'),
      type: 'founder-test-report',
      title: 'Founder Test Report Ready',
      text: 'Founder Test Report Ready',
      reportMarkdown: String(markdown),
      preview: preview,
      runId: runId,
      status: 'COMPLETE',
      timestamp: options.generatedAt || new Date().toISOString(),
      read: false,
    });
    return true;
  }

  function applyFounderTestFinalReport(runId, markdown, source, options) {
    options = options || {};
    if (!markdown || !String(markdown).trim()) {
      postFounderTestDeliveryTraceClientEvent({
        boundaryId: 'FOUNDER_REPORT_RENDER',
        runId: runId,
        succeeded: false,
        exception: 'empty report markdown',
        missingArtifact: 'report markdown',
        details: { fetchStarted: true, fetchCompleted: true, reportParsed: false, reportRendered: false, source: source || 'unknown' },
      });
      return false;
    }
    if (!isFounderTestFinalReportMarkdown(markdown)) {
      postFounderTestDeliveryTraceClientEvent({
        boundaryId: 'FOUNDER_REPORT_RENDER',
        runId: runId,
        succeeded: false,
        exception: 'markdown failed final report shape check',
        missingArtifact: 'valid founder report markdown',
        details: { reportMarkdownLength: String(markdown).length, source: source || 'unknown', reportRendered: false },
      });
      return false;
    }
    runId = normalizeFounderTestDeliveryRunId(runId, options.runtime);
    if (!runId) {
      traceFounderTestDelivery('bridge-runid-missing', source || 'unknown');
      postFounderTestDeliveryTraceClientEvent({
        boundaryId: 'FOUNDER_REPORT_RENDER',
        runId: options.runtime && options.runtime.runId ? options.runtime.runId : null,
        succeeded: false,
        exception: 'runId missing for report render',
        missingArtifact: 'runId',
        details: { source: source || 'unknown', reportRendered: false },
      });
      return false;
    }
    var normalized = String(markdown);
    founderTestFinalReportsByRunId[runId] = normalized;
    setFounderTestFinalReportFetchState(runId, 'available');
    if (options.reportObject && typeof options.reportObject === 'object') {
      lastFounderTestReport = options.reportObject;
      if (!lastFounderTestReport.reportMarkdown) lastFounderTestReport.reportMarkdown = normalized;
    } else {
      lastFounderTestReport = lastFounderTestReport || {};
      lastFounderTestReport.reportMarkdown = normalized;
    }
    lastFounderTestPartialReportMarkdown = normalized;
    founderTestRuntimePinnedRunId = runId;
    founderTestOperatorFeedReportFetching = false;
    founderTestOperatorFeedReportFetchInFlight = false;
    founderTestRuntimeReportFetchFailed = false;
    if (options.runtime) {
      rememberActiveFounderTestRuntimeSnapshot(options.runtime);
    }
    var notificationDelivered = false;
    if (options.skipNotification !== true) {
      notificationDelivered = pushFounderTestReportReadyNotification(runId, normalized, {
        allowDuplicate: options.allowDuplicate === true,
        generatedAt: options.generatedAt,
      });
    }
    refreshFounderTestFinalReportDeliverySurfaces(options.runtime || lastFounderTestRuntimeSnapshot);
    syncFounderTestOperatorFeedReportButtonState(runId, options.runtime || lastFounderTestRuntimeSnapshot);
    traceFounderTestDelivery('bridge-applied', {
      runId: runId,
      source: source || 'unknown',
      notificationDelivered: notificationDelivered,
    });
    traceFounderTestDelivery('final-report-client-cache-ready', { runId: runId, source: source || 'unknown' });
    if (notificationDelivered) {
      traceFounderTestDelivery('final-report-notification-delivered', { runId: runId });
    }
    founderTestReportHandoffStalled = false;
    founderTestCompletePreparingSinceMs = null;
    founderTestResultDebugSnapshot = null;
    stopFounderTestReportHandoffStallGuard();
    postFounderTestDeliveryTraceClientEvent({
      boundaryId: 'FOUNDER_REPORT_RENDER',
      runId: runId,
      succeeded: true,
      details: {
        fetchStarted: true,
        fetchCompleted: true,
        reportParsed: true,
        reportRendered: true,
        reportMarkdownLength: normalized.length,
        responseSize: normalized.length,
        source: source || 'unknown',
      },
    });
    return true;
  }

  function getFounderTestFinalReportMarkdownByRunId(runId) {
    if (!runId) return null;
    var cached = founderTestFinalReportsByRunId[runId];
    return cached && String(cached).trim() ? String(cached) : null;
  }

  function getFounderTestFinalReportFetchState(runId) {
    runId = runId || resolveActiveFounderTestRunId();
    if (hasFounderTestFinalReportAvailable(runId)) {
      founderTestFinalReportFetchStateByRunId[runId] = 'available';
      return 'available';
    }
    return founderTestFinalReportFetchStateByRunId[runId] || 'idle';
  }

  function setFounderTestFinalReportFetchState(runId, state) {
    if (!runId) return;
    if (hasFounderTestFinalReportAvailable(runId)) {
      founderTestFinalReportFetchStateByRunId[runId] = 'available';
      return;
    }
    if (state === 'failed' && founderTestFinalReportFetchStateByRunId[runId] === 'available') {
      return;
    }
    founderTestFinalReportFetchStateByRunId[runId] = state;
  }

  function markFounderTestFinalReportFetching(runId) {
    if (!runId) return;
    if (hasFounderTestFinalReportAvailable(runId)) {
      setFounderTestFinalReportFetchState(runId, 'available');
      return;
    }
    setFounderTestFinalReportFetchState(runId, 'fetching');
    founderTestOperatorFeedReportFetching = true;
    founderTestOperatorFeedReportFetchInFlight = true;
  }

  function markFounderTestFinalReportFetchFailed(runId) {
    if (!runId || hasFounderTestFinalReportAvailable(runId)) {
      if (runId) setFounderTestFinalReportFetchState(runId, 'available');
      founderTestOperatorFeedReportFetching = false;
      founderTestOperatorFeedReportFetchInFlight = false;
      return;
    }
    setFounderTestFinalReportFetchState(runId, 'failed');
    founderTestOperatorFeedReportFetching = false;
    founderTestOperatorFeedReportFetchInFlight = false;
    founderTestRuntimeReportFetchFailed = true;
  }

  function syncFounderTestOperatorFeedReportButtonState(runId, runtime) {
    runId = normalizeFounderTestDeliveryRunId(runId, runtime);
    if (runId && hasFounderTestFinalReportAvailable(runId)) {
      setFounderTestFinalReportFetchState(runId, 'available');
      founderTestOperatorFeedReportFetching = false;
      founderTestOperatorFeedReportFetchInFlight = false;
      founderTestRuntimeReportFetchFailed = false;
    }
    lastRenderedOperatorTraceKey = '';
    updateFounderTestOperatorFeedReportActionLabels(runtime);
    renderFounderTestUnifiedRuntimeCard(
      runtime || founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot(),
    );
  }

  function copyFounderTestFinalReportMarkdownShared(runId, feedback) {
    feedback = feedback || {};
    runId = normalizeFounderTestDeliveryRunId(runId, feedback.runtime);
    var resolved = resolveFounderTestFinalReportMarkdown(runId);
    var text = resolved.markdown;
    if (!text && feedback.fallbackText && String(feedback.fallbackText).trim()) {
      text = String(feedback.fallbackText);
    }
    if (!text || !String(text).trim()) {
      if (feedback.onFailed) feedback.onFailed();
      return Promise.resolve({ ok: false, method: 'none' });
    }
    return copyTextToClipboardWithFallback(String(text))
      .then(function (result) {
        if (result.ok && feedback.onCopied) feedback.onCopied();
        else if (!result.ok && feedback.onFailed) feedback.onFailed();
        return result;
      })
      .catch(function () {
        if (feedback.onFailed) feedback.onFailed();
        return { ok: false, method: 'error' };
      });
  }

  function findNotificationReportMarkdownByRunId(runId) {
    if (!runId) return null;
    for (var i = 0; i < runtimeNotifications.length; i += 1) {
      var entry = normalizeNotificationEntry(runtimeNotifications[i]);
      if (entry.type !== 'founder-test-report') continue;
      if (entry.runId !== runId) continue;
      if (entry.reportMarkdown && String(entry.reportMarkdown).trim()) {
        return String(entry.reportMarkdown);
      }
    }
    return null;
  }

  function resolveFounderTestFinalReportMarkdown(runId) {
    runId = runId || resolveActiveFounderTestRunId();
    var cached = getFounderTestFinalReportMarkdownByRunId(runId);
    if (cached) {
      return { markdown: cached, source: 'local-cache', runId: runId };
    }
    if (lastFounderTestReport && lastFounderTestReport.reportMarkdown && isFounderTestFinalReportMarkdown(lastFounderTestReport.reportMarkdown)) {
      return { markdown: String(lastFounderTestReport.reportMarkdown), source: 'full-report', runId: runId };
    }
    var notificationMarkdown = findNotificationReportMarkdownByRunId(runId);
    if (notificationMarkdown) {
      return { markdown: notificationMarkdown, source: 'notification', runId: runId };
    }
    if (lastFounderTestPartialReportMarkdown && isFounderTestFinalReportMarkdown(lastFounderTestPartialReportMarkdown)) {
      return { markdown: String(lastFounderTestPartialReportMarkdown), source: 'partial-report', runId: runId };
    }
    return { markdown: null, source: 'none', runId: runId };
  }

  function hasFounderTestFinalReportAvailable(runId) {
    runId = runId || resolveActiveFounderTestRunId();
    if (getFounderTestFinalReportMarkdownByRunId(runId)) return true;
    if (
      lastFounderTestReport &&
      lastFounderTestReport.reportMarkdown &&
      isFounderTestFinalReportMarkdown(lastFounderTestReport.reportMarkdown)
    ) {
      return true;
    }
    if (findNotificationReportMarkdownByRunId(runId)) return true;
    if (lastFounderTestPartialReportMarkdown && isFounderTestFinalReportMarkdown(lastFounderTestPartialReportMarkdown)) {
      return true;
    }
    return false;
  }

  function stopFounderTestReportHandoffStallGuard() {
    if (founderTestReportHandoffStallCheckId != null) {
      window.clearInterval(founderTestReportHandoffStallCheckId);
      founderTestReportHandoffStallCheckId = null;
    }
  }

  function resetFounderTestReportHandoffStallState() {
    founderTestCompletePreparingSinceMs = null;
    founderTestReportHandoffStalled = false;
    founderTestResultDebugSnapshot = null;
    founderTestLastResultFetchDiagnostic = null;
    stopFounderTestReportHandoffStallGuard();
  }

  var founderTestApiBaseUrlOverride = null;
  var founderTestApiResolvedOrigin = null;

  function resolveFounderTestFrontendOrigin() {
    if (typeof window === 'undefined' || !window.location) return 'n/a';
    return window.location.origin || 'n/a';
  }

  function resolveFounderTestApiBaseUrl() {
    if (founderTestApiBaseUrlOverride) {
      return String(founderTestApiBaseUrlOverride).replace(/\/$/, '');
    }
    if (manifestData && manifestData.apiBaseUrl) {
      return String(manifestData.apiBaseUrl).replace(/\/$/, '');
    }
    if (typeof window !== 'undefined' && window.__DEVPULSE_FOUNDER_TEST_API_BASE__) {
      return String(window.__DEVPULSE_FOUNDER_TEST_API_BASE__).replace(/\/$/, '');
    }
    if (founderTestApiResolvedOrigin) {
      return String(founderTestApiResolvedOrigin).replace(/\/$/, '');
    }
    if (typeof window !== 'undefined' && window.location) {
      var port = window.location.port;
      if (port === '5173' || port === '5174' || port === '3000') {
        return 'http://localhost:4321';
      }
      return window.location.origin;
    }
    return '';
  }

  function rememberFounderTestApiOriginFromUrl(requestUrl) {
    try {
      var parsed = new URL(String(requestUrl), resolveFounderTestFrontendOrigin());
      if (parsed.origin && parsed.origin !== 'null') {
        founderTestApiResolvedOrigin = parsed.origin;
      }
    } catch (rememberErr) {
      /* ignore invalid URL */
    }
  }

  function buildFounderTestApiUrl(path, params) {
    var normalizedPath = path.charAt(0) === '/' ? path : '/' + path;
    var base = resolveFounderTestApiBaseUrl();
    var url = base ? base.replace(/\/$/, '') + normalizedPath : normalizedPath;
    if (params && typeof params === 'object') {
      var queryParts = [];
      for (var key in params) {
        if (!Object.prototype.hasOwnProperty.call(params, key)) continue;
        var value = params[key];
        if (value == null || value === '') continue;
        queryParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)));
      }
      if (queryParts.length) {
        url += (url.indexOf('?') >= 0 ? '&' : '?') + queryParts.join('&');
      }
    }
    return url;
  }

  function buildFounderTestResultFetchUrl(runId) {
    return buildFounderTestApiUrl('/api/founder-test/result', { runId: runId });
  }

  function buildFounderTestResultDebugUrl(runId) {
    return buildFounderTestApiUrl('/api/founder-test/result-debug', { runId: runId });
  }

  function buildFounderTestResultReportUrl(runId) {
    return buildFounderTestApiUrl('/api/founder-test/result-report', { runId: runId });
  }

  function buildFounderTestResultDownloadUrl(runId) {
    return buildFounderTestApiUrl('/api/founder-test/result-download', { runId: runId });
  }

  function buildFounderTestPingUrl() {
    return buildFounderTestApiUrl('/api/founder-test/ping', null);
  }

  function buildFounderTestRuntimeStatusUrl(runId) {
    return buildFounderTestApiUrl('/api/founder-test/runtime-status', runId ? { runId: runId } : null);
  }

  function buildFounderTestRunUrl() {
    return buildFounderTestApiUrl('/api/founder-test/run', null);
  }

  function buildFounderTestApiRoutingDiagnosticLines(runId) {
    var resolvedRunId = coerceReportHandoffRunId(runId, null) || 'n/a';
    return [
      '- Frontend origin: ' + resolveFounderTestFrontendOrigin(),
      '- Resolved API base: ' + (resolveFounderTestApiBaseUrl() || 'same-origin-relative'),
      '- Runtime-status URL: ' + buildFounderTestRuntimeStatusUrl(resolvedRunId === 'n/a' ? null : resolvedRunId),
      '- Result URL: ' + buildFounderTestResultFetchUrl(resolvedRunId),
      '- Result-report URL: ' + buildFounderTestResultReportUrl(resolvedRunId),
      '- Result-debug URL: ' + buildFounderTestResultDebugUrl(resolvedRunId),
      '- Ping URL: ' + buildFounderTestPingUrl(),
    ];
  }

  function previewNonJsonResponseBody(body, maxChars) {
    maxChars = maxChars || NON_JSON_RESPONSE_PREVIEW_MAX_CHARS;
    if (!body) return '';
    var normalized = String(body).replace(/\s+/g, ' ').trim();
    return normalized.length > maxChars ? normalized.slice(0, maxChars) + '…' : normalized;
  }

  function buildResultFetchFailureDiagnosticLines(diagnostic) {
    diagnostic = diagnostic || {};
    return [
      '- Requested URL: ' + String(diagnostic.requestedUrl || 'n/a'),
      '- Requested runId: ' + String(diagnostic.requestedRunId || 'n/a'),
      '- Fetch error message: ' + String(diagnostic.fetchErrorMessage || 'none'),
      '- HTTP status: ' + String(diagnostic.httpStatus != null ? diagnostic.httpStatus : 'n/a'),
      '- Response content-type: ' + String(diagnostic.responseContentType || 'n/a'),
      '- JSON parse failed: ' + String(diagnostic.jsonParseFailed === true),
      '- Non-JSON response preview: ' + String(diagnostic.nonJsonResponsePreview || 'none'),
    ];
  }

  function buildResultDebugResponseDiagnosticLines(debug) {
    if (!debug) {
      return ['- result-debug response: unavailable'];
    }
    return [
      '- result-debug routeReached: ' + String(debug.routeReached === true),
      '- result-debug requestedRunId: ' + String(debug.requestedRunId || 'n/a'),
      '- result-debug hasStoredResult: ' + String(debug.hasStoredResult === true),
      '- result-debug storedRunIds: ' + (Array.isArray(debug.storedRunIds) ? debug.storedRunIds.join(', ') : 'none'),
      '- result-debug runtimeState: ' + String(debug.runtimeState || 'n/a'),
      '- result-debug publicState: ' + String(debug.publicState || 'n/a'),
      '- result-debug handoffState: ' + String(debug.handoffState || 'n/a'),
      '- result-debug currentOperation: ' + String(debug.currentOperation || 'n/a'),
      '- result-debug hasReportMarkdown: ' + String(debug.hasReportMarkdown === true),
      '- result-debug reportMarkdownLength: ' + String(typeof debug.reportMarkdownLength === 'number' ? debug.reportMarkdownLength : 0),
      '- result-debug generatedAt: ' + String(debug.generatedAt || 'n/a'),
      '- result-debug contentTypeExpected: ' + String(debug.contentTypeExpected || 'application/json'),
    ];
  }

  async function parseFounderTestHttpJsonResponse(res) {
    var contentType = res.headers && res.headers.get ? res.headers.get('content-type') || '' : '';
    var rawText = await res.text();
    var jsonParseFailed = false;
    var nonJsonResponsePreview = '';
    var data = null;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      jsonParseFailed = true;
      nonJsonResponsePreview = previewNonJsonResponseBody(rawText);
    }
    return {
      contentType: contentType,
      data: data,
      jsonParseFailed: jsonParseFailed,
      nonJsonResponsePreview: nonJsonResponsePreview,
      rawText: rawText,
    };
  }

  function recordFounderTestResultFetchAttempt(partial) {
    founderTestLastResultFetchDiagnostic = {
      requestedUrl: partial.requestedUrl || null,
      requestedRunId: partial.requestedRunId || null,
      fetchErrorMessage: partial.fetchErrorMessage || null,
      httpStatus: partial.httpStatus != null ? partial.httpStatus : null,
      responseContentType: partial.responseContentType || null,
      jsonParseFailed: partial.jsonParseFailed === true,
      nonJsonResponsePreview: partial.nonJsonResponsePreview || null,
      resultDebugResponse: partial.resultDebugResponse || null,
    };
    return founderTestLastResultFetchDiagnostic;
  }

  async function attachResultFetchFailureDebug(runId, runtime, partialDiagnostic) {
    var debugResponse = await fetchFounderTestResultDebug(runId, runtime);
    var diagnostic = recordFounderTestResultFetchAttempt({
      requestedUrl: partialDiagnostic.requestedUrl,
      requestedRunId: runId,
      fetchErrorMessage: partialDiagnostic.fetchErrorMessage,
      httpStatus: partialDiagnostic.httpStatus,
      responseContentType: partialDiagnostic.responseContentType,
      jsonParseFailed: partialDiagnostic.jsonParseFailed,
      nonJsonResponsePreview: partialDiagnostic.nonJsonResponsePreview,
      resultDebugResponse: debugResponse,
    });
    if (debugResponse) {
      founderTestResultDebugSnapshot = debugResponse;
    }
    return diagnostic;
  }

  function buildResultFetchFailureHandoffDiagnostic(runtime, fetchDiagnostic, debug) {
    fetchDiagnostic = fetchDiagnostic || founderTestLastResultFetchDiagnostic || {};
    debug = debug || fetchDiagnostic.resultDebugResponse || founderTestResultDebugSnapshot || {};
    runtime = runtime || founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot();
    var runIdFields = buildReportHandoffRunIdDiagnosticFields(fetchDiagnostic.requestedRunId, runtime);
    return [
      '# Founder Test Complete — Report Handoff / Fetch Failure Diagnostic',
      '',
      'Generated: ' + new Date().toISOString(),
      '',
      '## Status',
      '',
      founderTestReportHandoffStalled
        ? FOUNDER_TEST_COMPLETE_HEADER_HANDOFF_STALLED
        : 'Founder Test complete — result fetch failed.',
      '',
      '- Missing boundary: ' + String(debug.missingHandoffBoundary || 'Final report delivered to client cache'),
      '',
      '## RunId Propagation',
      '',
      '- Requested runId: ' + runIdFields.requestedRunId,
      '- Runtime card runId: ' + runIdFields.runtimeCardRunId,
      '- Pinned runId: ' + runIdFields.pinnedRunId,
      '- Resolved active runId: ' + runIdFields.resolvedActiveRunId,
      '- Runtime snapshot runId: ' + runIdFields.runtimeSnapshotRunId,
      '',
      '## API Routing',
      '',
    ]
      .concat(buildFounderTestApiRoutingDiagnosticLines(runIdFields.resolvedActiveRunId))
      .concat([
        '',
        '## Result Fetch',
        '',
      ])
      .concat(buildResultFetchFailureDiagnosticLines(fetchDiagnostic))
      .concat([
        '',
        '## Result Debug Endpoint',
        '',
      ])
      .concat(buildResultDebugResponseDiagnosticLines(debug))
      .concat([
        '',
        '## Store Snapshot',
        '',
        '- Stored runId: ' + String(debug.storedRunId || 'n/a'),
        '- hasStoredResult: ' + String(debug.hasStoredResult === true),
        '- hasReportMarkdown: ' + String(debug.hasReportMarkdown === true),
        '- reportMarkdownLength: ' + String(typeof debug.reportMarkdownLength === 'number' ? debug.reportMarkdownLength : 0),
        '- storedRunIds: ' + (Array.isArray(debug.storedRunIds) ? debug.storedRunIds.join(', ') : 'none'),
        '- endpoint status: ' + String(debug.endpointStatus != null ? debug.endpointStatus : 'n/a'),
        '',
        '## Runtime Snapshot',
        '',
        '- State: ' + (runtime && runtime.state ? runtime.state : 'COMPLETE'),
        '- Elapsed: ' + (runtime && runtime.uiSummary ? runtime.uiSummary.elapsedLine : 'n/a'),
        '',
      ])
      .join('\n');
  }

  function buildReportHandoffStallDiagnosticMarkdown(runtime, debug) {
    return buildResultFetchFailureHandoffDiagnostic(
      runtime,
      founderTestLastResultFetchDiagnostic,
      debug || founderTestResultDebugSnapshot,
    );
  }

  async function fetchFounderTestResultDebug(runId, runtime) {
    runId = coerceReportHandoffRunId(resolveReportHandoffRunId(runId, runtime), runtime);
    if (!runId) return null;
    var requestedUrl = buildFounderTestResultDebugUrl(runId);
    try {
      var res = await fetch(requestedUrl, { cache: 'no-store' });
      rememberFounderTestApiOriginFromUrl(requestedUrl);
      var parsed = await parseFounderTestHttpJsonResponse(res);
      if (parsed.jsonParseFailed) {
        recordFounderTestResultFetchAttempt({
          requestedUrl: requestedUrl,
          requestedRunId: runId,
          fetchErrorMessage: 'result-debug returned non-JSON response',
          httpStatus: res.status,
          responseContentType: parsed.contentType,
          jsonParseFailed: true,
          nonJsonResponsePreview: parsed.nonJsonResponsePreview,
          resultDebugResponse: null,
        });
        return null;
      }
      if (!res.ok) {
        recordFounderTestResultFetchAttempt({
          requestedUrl: requestedUrl,
          requestedRunId: runId,
          fetchErrorMessage: 'result-debug returned HTTP ' + String(res.status),
          httpStatus: res.status,
          responseContentType: parsed.contentType,
          jsonParseFailed: false,
          nonJsonResponsePreview: null,
          resultDebugResponse: parsed.data,
        });
        return parsed.data;
      }
      return parsed.data;
    } catch (debugErr) {
      recordFounderTestResultFetchAttempt({
        requestedUrl: requestedUrl,
        requestedRunId: runId,
        fetchErrorMessage:
          debugErr && debugErr.message ? debugErr.message : 'result-debug fetch failed',
        httpStatus: null,
        responseContentType: null,
        jsonParseFailed: false,
        nonJsonResponsePreview: null,
        resultDebugResponse: null,
      });
      return null;
    }
  }

  async function triggerFounderTestReportHandoffStall(runId, runtime) {
    if (founderTestReportHandoffStalled) return;
    runtime = runtime || founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot();
    runId = coerceReportHandoffRunId(resolveReportHandoffRunId(runId, runtime), runtime);
    if (!runId) return;
    if (hasFounderTestFinalReportAvailable(runId)) return;
    founderTestReportHandoffStalled = true;
    founderTestOperatorFeedReportFetching = false;
    founderTestOperatorFeedReportFetchInFlight = false;
    stopFounderTestReportHandoffStallGuard();
    var runIdFields = buildReportHandoffRunIdDiagnosticFields(runId, runtime);
    var debug = await fetchFounderTestResultDebug(runId, runtime);
    if (debug) {
      founderTestResultDebugSnapshot = debug;
    } else {
      founderTestResultDebugSnapshot = {
        requestedRunId: runId,
        runtimeCardRunId: runIdFields.runtimeCardRunId,
        pinnedRunId: runIdFields.pinnedRunId,
        resolvedActiveRunId: runIdFields.resolvedActiveRunId,
        hasStoredResult: false,
        hasReportMarkdown: false,
        reportMarkdownLength: 0,
        storedRunIds: [],
        endpointStatus: 'debug-fetch-failed',
        missingHandoffBoundary: 'Final report delivered to client cache',
        runtimeRunId: runIdFields.runtimeSnapshotRunId,
        storedRunId: null,
      };
    }
    refreshFounderTestFinalReportDeliverySurfaces(runtime || resolveActiveFounderTestRuntimeSnapshot());
    traceFounderTestDelivery('report-handoff-stalled', founderTestResultDebugSnapshot);
  }

  function scheduleFounderTestReportHandoffStallGuard(runId, runtime) {
    runId = coerceReportHandoffRunId(resolveReportHandoffRunId(runId, runtime), runtime);
    var publicState = runtime && (runtime.publicState || runtime.state);
    if (!runId || !runtime || (publicState !== 'COMPLETE' && !isFounderTestCompleteSuccessState(runtime.state))) return;
    if (hasFounderTestFinalReportAvailable(runId)) {
      resetFounderTestReportHandoffStallState();
      return;
    }
    if (founderTestCompletePreparingSinceMs == null) {
      founderTestCompletePreparingSinceMs = Date.now();
    }
    if (founderTestReportHandoffStallCheckId != null) return;
    founderTestReportHandoffStallCheckId = window.setInterval(function () {
      if (founderTestReportHandoffStalled) {
        stopFounderTestReportHandoffStallGuard();
        return;
      }
      var activeRunId = coerceReportHandoffRunId(
        resolveReportHandoffRunId(runId, founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot()),
        founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot(),
      );
      if (hasFounderTestFinalReportAvailable(activeRunId)) {
        resetFounderTestReportHandoffStallState();
        return;
      }
      var elapsed = Date.now() - (founderTestCompletePreparingSinceMs || Date.now());
      if (elapsed >= FOUNDER_TEST_REPORT_HANDOFF_STALL_MS) {
        triggerFounderTestReportHandoffStall(activeRunId, runtime || resolveActiveFounderTestRuntimeSnapshot());
      }
    }, 500);
  }

  function resolveFounderTestCompleteReportFallbackText(runtime, runId, fetchResult) {
    var diagnostic =
      fetchResult && fetchResult.fetchDiagnostic
        ? fetchResult.fetchDiagnostic
        : founderTestLastResultFetchDiagnostic;
    var errorMessage =
      fetchResult && fetchResult.errorMessage
        ? fetchResult.errorMessage
        : lastFounderTestErrorMessage || 'Final report unavailable';
    return buildCompleteFounderTestHandoffDiagnostic(runtime, runId, errorMessage, diagnostic);
  }

  function resolveFounderTestCompleteHeaderHint(runtime) {
    runtime = runtime || resolveActiveFounderTestRuntimeSnapshot();
    var publicState = runtime && (runtime.publicState || runtime.state);
    if (!runtime || (publicState !== 'COMPLETE' && publicState !== 'REPORT_HANDOFF_PENDING' && !isFounderTestCompleteSuccessState(runtime.state))) {
      return null;
    }
    var runId = normalizeFounderTestDeliveryRunId(runtime.runId, runtime);
    if (hasFounderTestFinalReportAvailable(runId)) {
      return 'Founder Test complete — report ready.';
    }
    if (founderTestReportHandoffStalled) {
      return FOUNDER_TEST_COMPLETE_HEADER_HANDOFF_STALLED;
    }
    if (founderTestRuntimeReportFetchFailed) {
      return 'Founder Test complete — report fetch failed, diagnostic available.';
    }
    var fetchState = getFounderTestFinalReportFetchState(runId);
    if (fetchState === 'fetching') {
      return 'Report Handoff pending — fetching report.';
    }
    if (publicState === 'REPORT_HANDOFF_PENDING' || runtime.state === 'COMPLETING') {
      return runtime.handoffStateLabel || 'Report Handoff pending.';
    }
    return 'Report Handoff pending.';
  }

  function resolveFounderTestReportHandoffStatusLabel(runtime, runId) {
    runtime = runtime || founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot();
    runId = normalizeFounderTestDeliveryRunId(runId, runtime);
    if (hasFounderTestFinalReportAvailable(runId)) return null;
    if (founderTestReportHandoffStalled || founderTestRuntimeReportFetchFailed) {
      return 'Report Handoff Diagnostic available';
    }
    var fetchState = getFounderTestFinalReportFetchState(runId);
    if (fetchState === 'fetching' || founderTestOperatorFeedReportFetchInFlight) {
      return 'Fetching Report...';
    }
    if (runtime && runtime.handoffStateLabel) return runtime.handoffStateLabel;
    if (runtime && runtime.publicState === 'REPORT_HANDOFF_PENDING') return 'Report Handoff pending';
    return null;
  }

  function isFounderTestPublicCompleteWithReport(runtime, runId) {
    runId = normalizeFounderTestDeliveryRunId(runId, runtime);
    return hasFounderTestFinalReportAvailable(runId);
  }

  function resolveFounderTestOperatorFeedReportActionLabels(runtime) {
    runtime = runtime || founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot();
    var runId = normalizeFounderTestDeliveryRunId(null, runtime);
    var publicState = runtime && (runtime.publicState || runtime.state);
    var hasLocal = hasFounderTestFinalReportAvailable(runId);
    var fetchState = getFounderTestFinalReportFetchState(runId);
    if (hasLocal) {
      return { copy: 'Copy Final Report', open: 'Open Final Report', enabled: true, fetchingStatus: null };
    }
    if (founderTestReportHandoffStalled || fetchState === 'failed' || founderTestRuntimeReportFetchFailed) {
      return {
        copy: 'Copy Handoff Diagnostic',
        open: 'Open Handoff Diagnostic',
        enabled: true,
        fetchingStatus: 'Report Handoff Diagnostic available',
      };
    }
    if (
      fetchState === 'fetching' ||
      founderTestOperatorFeedReportFetchInFlight ||
      publicState === 'COMPLETE' ||
      publicState === 'REPORT_HANDOFF_PENDING' ||
      (runtime && runtime.state === 'COMPLETING')
    ) {
      return {
        copy: 'Copy Final Report',
        open: 'Open Final Report',
        enabled: false,
        fetchingStatus: resolveFounderTestReportHandoffStatusLabel(runtime, runId),
      };
    }
    return { copy: 'Copy Latest Report', open: 'Open Report', enabled: true, fetchingStatus: null };
  }

  function shouldUseFounderTestHandoffDiagnosticForCompleteReport() {
    return (
      founderTestReportHandoffStalled === true ||
      founderTestRuntimeReportFetchFailed === true ||
      !!(founderTestLastResultFetchDiagnostic && founderTestLastResultFetchDiagnostic.requestedUrl) ||
      !!founderTestResultDebugSnapshot ||
      isGenericFailedToFetchMessage(lastFounderTestErrorMessage)
    );
  }

  function isGenericFailedToFetchMessage(message) {
    if (!message) return false;
    return /failed to fetch/i.test(String(message));
  }

  function buildCompleteFounderTestHandoffDiagnostic(runtime, runId, errorMessage, fetchDiagnostic) {
    runtime = runtime || founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot();
    runId = coerceReportHandoffRunId(runId, runtime);
    var diagnostic = fetchDiagnostic || founderTestLastResultFetchDiagnostic || {};
    if (!diagnostic.requestedUrl) {
      diagnostic = {
        requestedUrl: runId ? buildFounderTestResultFetchUrl(runId) : 'n/a',
        requestedRunId: runId || 'n/a',
        fetchErrorMessage:
          errorMessage || diagnostic.fetchErrorMessage || lastFounderTestErrorMessage || 'Final report fetch failed',
        httpStatus: diagnostic.httpStatus != null ? diagnostic.httpStatus : null,
        responseContentType: diagnostic.responseContentType || null,
        jsonParseFailed: diagnostic.jsonParseFailed === true,
        nonJsonResponsePreview: diagnostic.nonJsonResponsePreview || null,
        resultDebugResponse: diagnostic.resultDebugResponse || founderTestResultDebugSnapshot || null,
      };
    }
    return buildResultFetchFailureHandoffDiagnostic(runtime, diagnostic, founderTestResultDebugSnapshot);
  }

  function resolveFounderTestResultsPanelReportActionLabels(runtime) {
    runtime = runtime || resolveActiveFounderTestRuntimeSnapshot();
    var operatorLabels = resolveFounderTestOperatorFeedReportActionLabels(runtime);
    if (operatorLabels.copy === 'Copy Handoff Diagnostic') {
      return { copy: 'Copy Handoff Diagnostic', open: 'Open Handoff Diagnostic', enabled: true };
    }
    if (operatorLabels.enabled === false && operatorLabels.fetchingStatus) {
      return { copy: operatorLabels.copy, open: operatorLabels.open, enabled: false };
    }
    var runId = normalizeFounderTestDeliveryRunId(null, runtime);
    var hasLocal = hasFounderTestFinalReportAvailable(runId);
    if (hasLocal) {
      return { copy: 'Copy Final Report', open: 'Open Final Report', enabled: true };
    }
    var payload = buildFounderTestCopyPayload(runtime);
    if (
      payload &&
      (payload.source === 'runtime-diagnostic' ||
        payload.source === 'runtime-failure' ||
        payload.source === 'diagnostic')
    ) {
      return { copy: 'Copy Runtime Diagnostic', open: 'Open Runtime Diagnostic', enabled: true };
    }
    return { copy: 'Copy Report', open: 'Open Report', enabled: operatorLabels.enabled !== false };
  }

  function updateFounderTestOperatorFeedReportActionLabels(runtime) {
    var labels = resolveFounderTestOperatorFeedReportActionLabels(runtime);
    var copyBtn = el('founder-test-copy-latest-report');
    var openBtn = el('founder-test-open-report');
    var statusEl = el('founder-test-report-handoff-status');
    var buttonsEnabled = labels.enabled !== false;
    if (statusEl) {
      if (labels.fetchingStatus) {
        statusEl.textContent = labels.fetchingStatus;
        statusEl.removeAttribute('hidden');
      } else {
        statusEl.textContent = '';
        statusEl.setAttribute('hidden', '');
      }
    }
    if (copyBtn) {
      copyBtn.disabled = !buttonsEnabled;
      copyBtn.setAttribute('aria-disabled', buttonsEnabled ? 'false' : 'true');
      if (copyBtn.textContent !== 'Copied' && copyBtn.textContent !== 'Copy failed') {
        copyBtn.textContent = labels.copy;
      }
    }
    if (openBtn) {
      openBtn.disabled = !buttonsEnabled;
      openBtn.setAttribute('aria-disabled', buttonsEnabled ? 'false' : 'true');
      openBtn.textContent = labels.open;
    }
    var retryBtn = el('founder-test-retry-fetch-result');
    if (retryBtn) {
      var runId = normalizeFounderTestDeliveryRunId(null, runtime);
      var fetchState = getFounderTestFinalReportFetchState(runId);
      var showRetry =
        fetchState === 'failed' ||
        founderTestReportHandoffStalled ||
        founderTestRuntimeReportFetchFailed;
      if (showRetry) {
        retryBtn.removeAttribute('hidden');
      } else {
        retryBtn.setAttribute('hidden', '');
      }
    }
  }

  function resolveFounderTestReportDelivery(input) {
    input = input || {};
    var runtime = input.runtime || resolveActiveFounderTestRuntimeSnapshot() || null;
    var data = input.data || {};
    var runId = data.runId || resolveActiveFounderTestRunId() || (runtime && runtime.runId) || input.runId || 'unknown';
    var state = data.state || (runtime && runtime.state) || (data.ok ? 'COMPLETE' : 'FAILED');
    var markdown =
      data.reportMarkdown ||
      (data.report && data.report.reportMarkdown) ||
      input.reportMarkdown ||
      '';
    if (!markdown && data.partialReportMarkdown && isFounderTestFinalReportMarkdown(data.partialReportMarkdown)) {
      markdown = data.partialReportMarkdown;
    }
    if (!markdown && !isFounderTestCompleteSuccessState(state)) {
      markdown =
        data.failureReportMarkdown ||
        data.runtimeDiagnosticMarkdown ||
        data.founderTestLaunchReadinessReportMarkdown ||
        '';
    }
    if (!markdown && runtime && isFounderTestCompleteSuccessState(runtime.state)) {
      markdown = buildCompleteFounderTestHandoffDiagnostic(
        runtime,
        runId,
        data.error || input.errorMessage || lastFounderTestErrorMessage,
      );
    }
    if (!markdown && runtime && !isFounderTestCompleteSuccessState(runtime.state)) {
      markdown = buildRuntimeFailureReportText(runtime, data.error || input.errorMessage || lastFounderTestErrorMessage);
    }
    var status = state;
    var title = input.title;
    if (!title) {
      if (state === 'RUNNING' || state === 'STARTING' || state === 'COMPLETING') {
        title = 'Founder Test Still Running — Diagnostic Available';
        status = 'RUNNING';
      } else if (state === 'STALLED') {
        title = 'Founder Test Stalled — Diagnostic Report Available';
      } else if (state === 'FAILED' || state === 'CANCELLED') {
        title = 'Founder Test Failed — Runtime Report Available';
      } else if (state === 'COMPLETE') {
        if (data.reportMarkdown || (data.report && data.report.reportMarkdown)) {
          title = 'Founder Test Report Ready';
        } else {
          title = 'Founder Test Report Ready';
          status = 'COMPLETE';
        }
      } else {
        title = 'Founder Test Partial Report Available';
        status = 'PARTIAL';
      }
    }
    return {
      runId: runId,
      status: status,
      title: title,
      reportMarkdown: markdown,
      timestamp: data.generatedAt || new Date().toISOString(),
    };
  }

  function deliverFounderTestReportNotification(input) {
    input = input || {};
    var resolved = resolveFounderTestReportDelivery(input);
    if (!resolved.reportMarkdown || !String(resolved.reportMarkdown).trim()) {
      traceFounderTestDelivery('skipped-empty-markdown', resolved.runId);
      return false;
    }
    if (
      isFounderTestFinalReportMarkdown(resolved.reportMarkdown) &&
      (resolved.status === 'COMPLETE' ||
        (input.data && isFounderTestCompleteSuccessState(input.data.state)) ||
        (input.runtime && isFounderTestCompleteSuccessState(input.runtime.state)))
    ) {
      return applyFounderTestFinalReport(resolved.runId, resolved.reportMarkdown, 'deliver-notification', {
        runtime: input.runtime || lastFounderTestRuntimeSnapshot,
        generatedAt: resolved.timestamp,
        allowDuplicate: input.allowDuplicate === true,
      });
    }
    var dedupeKey = 'founder-test-report-' + resolved.runId + '-' + resolved.status;
    if (!input.allowDuplicate && deliveredFounderTestReportKeys[dedupeKey]) {
      traceFounderTestDelivery('dedupe-blocked', dedupeKey);
      return false;
    }
    deliveredFounderTestReportKeys[dedupeKey] = true;
    var preview = String(resolved.reportMarkdown).slice(0, 280).replace(/\s+/g, ' ').trim();
    if (resolved.reportMarkdown.length > preview.length) preview += '…';
    runtimeNotifications.unshift({
      id: createNotificationId('ft-report'),
      type: 'founder-test-report',
      title: resolved.title,
      text: resolved.title,
      reportMarkdown: resolved.reportMarkdown,
      preview: preview,
      runId: resolved.runId,
      status: resolved.status,
      timestamp: resolved.timestamp,
      read: false,
    });
    traceFounderTestDelivery('delivered', { runId: resolved.runId, status: resolved.status, title: resolved.title });
    refreshNotificationSurfaces();
    updateNotificationUnreadBadge();
    refreshNotificationDrawerIfOpen();
    return true;
  }

  function renderNotificationsVaultHtml(items) {
    if (!items || !items.length) return '<p class="empty-state">No notifications yet.</p>';
    var html = '<ul class="notification-vault-list">';
    for (var i = 0; i < items.length; i += 1) {
      var entry = normalizeNotificationEntry(items[i]);
      if (entry.type === 'founder-test-report') {
        html +=
          '<li class="notification-vault-item founder-test-report-notification">' +
          buildFounderTestReportNotificationHtml(entry) +
          '</li>';
      } else {
        html +=
          '<li class="notification-vault-item notification-simple">' + escapeHtml(entry.text || '') + '</li>';
      }
    }
    html += '</ul>';
    return html;
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

  function renderLlmChatBrainDiagnostics(diag) {
    if (!diag) return;
    if (el('llm-connected')) el('llm-connected').textContent = diag.llmConnected ? 'YES' : 'NO';
    if (el('llm-fallback-used')) el('llm-fallback-used').textContent = diag.fallbackUsed ? 'YES' : 'NO';
    if (el('llm-provider-model')) {
      el('llm-provider-model').textContent =
        diag.provider && diag.model ? diag.provider + ' / ' + diag.model : 'None';
    }
    if (el('llm-context-included')) {
      el('llm-context-included').textContent = diag.contextIncluded ? 'YES' : 'NO';
    }
    if (el('llm-context-sources')) {
      var sources = diag.contextSourcesUsed && diag.contextSourcesUsed.length
        ? diag.contextSourcesUsed.join(', ')
        : (diag.contextSourcesLabel || 'None');
      el('llm-context-sources').textContent = sources;
    }
    if (el('llm-context-hydration')) {
      el('llm-context-hydration').textContent = diag.lastContextHydration || '—';
    }
    if (el('llm-hydrated-facts')) {
      el('llm-hydrated-facts').textContent =
        diag.hydratedFactCount === undefined || diag.hydratedFactCount === null
          ? '0'
          : String(diag.hydratedFactCount);
    }
    if (el('llm-context-confidence')) {
      el('llm-context-confidence').textContent = diag.contextConfidence || '—';
    }
    if (el('llm-identity-loaded')) {
      el('llm-identity-loaded').textContent = diag.identityLoaded ? 'YES' : 'NO';
    }
    if (el('llm-founder-loaded')) {
      el('llm-founder-loaded').textContent = diag.founderLoaded ? 'YES' : 'NO';
    }
    if (el('llm-product-loaded')) {
      el('llm-product-loaded').textContent = diag.productLoaded ? 'YES' : 'NO';
    }
    if (el('llm-history-loaded')) {
      el('llm-history-loaded').textContent = diag.historyLoaded ? 'YES' : 'NO';
    }
    if (el('llm-self-evolution-loaded')) {
      el('llm-self-evolution-loaded').textContent = diag.selfEvolutionLoaded ? 'YES' : 'NO';
    }
    if (el('llm-identity-version')) {
      el('llm-identity-version').textContent = diag.identityVersion ? '(v' + diag.identityVersion + ')' : '';
    }
    if (el('llm-founder-version')) {
      el('llm-founder-version').textContent = diag.founderVersion ? '(v' + diag.founderVersion + ')' : '';
    }
    if (el('llm-product-version')) {
      el('llm-product-version').textContent = diag.productVersion ? '(v' + diag.productVersion + ')' : '';
    }
    if (el('llm-current-product-identity')) {
      el('llm-current-product-identity').textContent = diag.currentProductIdentity || '—';
    }
    if (el('llm-founder-identity')) {
      el('llm-founder-identity').textContent = diag.founderIdentity || '—';
    }
    if (el('llm-company-identity')) {
      el('llm-company-identity').textContent = diag.companyIdentity || '—';
    }
    if (el('llm-legacy-identity')) {
      el('llm-legacy-identity').textContent = diag.legacyIdentity || '—';
    }
    if (el('llm-judge-score')) {
      el('llm-judge-score').textContent =
        diag.judgeScore === null || diag.judgeScore === undefined ? '—' : String(diag.judgeScore);
    }
    if (el('llm-warnings')) {
      el('llm-warnings').textContent =
        diag.warnings && diag.warnings.length ? diag.warnings.join('; ') : 'None';
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
    'founder-review': 'Founder Review',
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
    'founder-review',
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

  function isOnePromptLivePreviewReady(lp) {
    if (!lp) return false;
    if (lp.onePromptReady === true) return true;
    if (lp.onePromptBuild && lp.onePromptBuild.status === 'READY' && lp.onePromptBuild.previewUrl) return true;
    if (lp.previewUrl && lp.connected === true && lp.buildStatus && /^READY/i.test(lp.buildStatus)) return true;
    return false;
  }

  function resolveCanonicalLivePreviewPanels(lp, ra) {
    lp = lp || {};
    var ready = isOnePromptLivePreviewReady(lp);
    var resolvedLp = lp;
    var resolvedRa = ra || null;
    if (ready && lp.previewUrl) {
      var targetName =
        (lp.activeSession && lp.activeSession.previewTargetName) ||
        (lp.onePromptBuild && lp.onePromptBuild.generatedProfile) ||
        'Generated Application';
      resolvedLp = Object.assign({}, lp, {
        connected: true,
        statusLabel: lp.statusLabel || 'Generated app running in Live Preview',
        reality: lp.reality && lp.reality.state === 'PREVIEW_READY'
          ? lp.reality
          : {
              state: 'PREVIEW_READY',
              displayLabel: 'Preview ready for validation',
              summaryLines: [
                'Preview loaded successfully.',
                'User interaction available.',
                'Generated application is running in Live Preview.',
              ],
              problems: [],
              recommendedActions: ['Interact with the running app in Live Preview'],
            },
      });
      if (!resolvedRa || resolvedRa.outputState === 'NO_RUNNING_APP' || resolvedRa.testReadiness === 'NOT_TESTABLE') {
        resolvedRa = Object.assign({}, resolvedRa || {}, {
          runningAppTitle: targetName + ' Preview',
          outputState: 'OUTPUT_READY_FOR_TESTING',
          outputStateLabel: 'Ready for testing',
          testReadiness: 'TESTABLE',
          testReadinessReason: 'Output is visible, current, interactive, and meaningful to test.',
          requestAlignment: 'ALIGNED',
          alignmentReason: 'Active preview matches the latest one-prompt build request.',
          recommendedAction: 'Interact with the running app in Live Preview',
          buildOutput: Object.assign({}, (resolvedRa && resolvedRa.buildOutput) || {}, {
            buildState: 'PREVIEW_READY',
            outputType: 'preview_app',
            changeSummary:
              (lp.onePromptBuild && lp.onePromptBuild.workspacePath
                ? 'Generated ' + (lp.onePromptBuild.generatedProfile || 'application') + ' at ' + lp.onePromptBuild.workspacePath
                : null) || 'Generated application is running in Live Preview.',
          }),
        });
      }
    }
    return { livePreview: resolvedLp, runningApplication: resolvedRa };
  }

  function mergePreviewClientReality(reality, lp) {
    if (!reality) {
      if (lp && isOnePromptLivePreviewReady(lp) && lp.previewUrl) {
        return {
          state: 'PREVIEW_READY',
          displayLabel: 'Preview ready for validation',
          summaryLines: [
            'Preview loaded successfully.',
            'User interaction available.',
            'Generated application is running in Live Preview.',
          ],
          problems: [],
          recommendedActions: ['Interact with the running app in Live Preview'],
        };
      }
      return null;
    }
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
    } else if (lp && isOnePromptLivePreviewReady(lp) && lp.previewUrl && merged.state === 'NO_PREVIEW') {
      merged.state = 'PREVIEW_READY';
      merged.displayLabel = 'Preview ready for validation';
      merged.summaryLines = [
        'Preview loaded successfully.',
        'User interaction available.',
        'Generated application is running in Live Preview.',
      ];
      merged.problems = [];
      merged.recommendedActions = ['Interact with the running app in Live Preview'];
    }
    return merged;
  }

  function updatePreviewClientDisplay(lp) {
    var panels = resolveCanonicalLivePreviewPanels(lp, null);
    var reality = mergePreviewClientReality(panels.livePreview.reality, panels.livePreview);
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
    ws = buildWorkspaceViewForActiveProject(ws);
    var canonical = resolveCanonicalLivePreviewPanels((ws && ws.livePreview) || {}, (ws && ws.runningApplication) || null);
    var lp = canonical.livePreview;
    var ra = canonical.runningApplication;
    var activeProject = getActiveProjectWorkspace();
    var html =
      '<div class="preview-workspace-tabs-shell">' +
      renderProductCard(
        'Project Preview Tabs',
        '<div class="workspace-tabs-header">' +
          '<span class="workspace-tabs-label">Active project</span>' +
          '<div class="preview-workspace-tabs" id="preview-workspace-tabs" role="tablist" aria-label="Live preview projects"></div>' +
          '</div>' +
          (activeProject
            ? '<div class="preview-project-meta">' +
              '<p><strong>Project:</strong> ' +
              escapeHtml(activeProject.projectName) +
              '</p>' +
              '<p><strong>Workspace:</strong> ' +
              escapeHtml(activeProject.workspacePath || 'Not built yet') +
              '</p>' +
              '<p><strong>Profile:</strong> ' +
              escapeHtml(activeProject.buildProfile || 'n/a') +
              '</p>' +
              '<p><strong>Build status:</strong> ' +
              escapeHtml(activeProject.buildStatus || 'IDLE') +
              '</p>' +
              '<p><strong>Preview URL:</strong> ' +
              escapeHtml(activeProject.previewUrl || 'No preview yet') +
              '</p>' +
              '</div>'
            : '<p class="hint">Select or create a project tab to manage isolated Live Preview sessions.</p>'),
      ) +
      '</div>';
    html += renderRunningApplicationPanel(ra);
    var reality = mergePreviewClientReality(lp.reality, lp) || {
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
          (lp.onePromptBuild
            ? '<p><strong>Generated profile:</strong> ' +
              escapeHtml(lp.onePromptBuild.generatedProfile || 'n/a') +
              '</p>' +
              '<p><strong>Workspace:</strong> ' +
              escapeHtml(lp.onePromptBuild.workspacePath || lp.onePromptBuild.workspaceId || 'n/a') +
              '</p>' +
              '<p><strong>Build result:</strong> ' +
              escapeHtml(lp.onePromptBuild.buildResult || 'n/a') +
              '</p>' +
              (lp.onePromptBuild.failureReason
                ? '<p><strong>Failure reason:</strong> ' + escapeHtml(lp.onePromptBuild.failureReason) + '</p>'
                : '') +
              (lp.onePromptBuild.previewUrl
                ? '<p><strong>Live Preview URL:</strong> ' + escapeHtml(lp.onePromptBuild.previewUrl) + '</p>'
                : '')
            : '') +
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
    renderWorkspaceTabs('preview-workspace-tabs');
    updateWorkspaceLinkedIndicator();
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
        'Mobile Runtime Experience',
        '<p class="hint">Mobile runtime capability truth — read-only. No emulator or device launch controls.</p>' +
        '<p><strong>Device Frames:</strong> ' +
        escapeHtml((data.mobileRuntimeExperience && data.mobileRuntimeExperience.deviceFrames) || 'Loading…') +
        '</p>' +
        '<p><strong>Mobile Simulation:</strong> ' +
        escapeHtml((data.mobileRuntimeExperience && data.mobileRuntimeExperience.mobileSimulation) || 'Loading…') +
        '</p>' +
        '<p><strong>Android Runtime:</strong> ' +
        escapeHtml((data.mobileRuntimeExperience && data.mobileRuntimeExperience.androidRuntime) || 'Loading…') +
        '</p>' +
        '<p><strong>iOS Runtime:</strong> ' +
        escapeHtml((data.mobileRuntimeExperience && data.mobileRuntimeExperience.iosRuntime) || 'Loading…') +
        '</p>' +
        '<p><strong>Expo Runtime:</strong> ' +
        escapeHtml((data.mobileRuntimeExperience && data.mobileRuntimeExperience.expoRuntime) || 'Loading…') +
        '</p>' +
        '<p><strong>Cloud Runtime:</strong> ' +
        escapeHtml((data.mobileRuntimeExperience && data.mobileRuntimeExperience.cloudRuntime) || 'Loading…') +
        '</p>' +
        '<p><strong>Overall Mobile Runtime Score:</strong> ' +
        escapeHtml((data.mobileRuntimeExperience && data.mobileRuntimeExperience.overallScore) || 'Loading…') +
        '</p>' +
        '<p class="hint">' +
        escapeHtml((data.mobileRuntimeExperience && data.mobileRuntimeExperience.founderConclusion) || '') +
        '</p>',
      ) +
      renderProductCard(
        'Real File Workspace Execution',
        '<p class="hint">Real isolated workspace file execution — read-only. No execution controls on this dashboard.</p>' +
        '<p><strong>Workspace Path Status:</strong> ' +
        escapeHtml((data.realFileWorkspaceExecution && data.realFileWorkspaceExecution.workspacePathStatus) || 'Loading…') +
        '</p>' +
        '<p><strong>Real File Sessions:</strong> ' +
        escapeHtml((data.realFileWorkspaceExecution && data.realFileWorkspaceExecution.sessions && data.realFileWorkspaceExecution.sessions.label) || 'Loading…') +
        '</p>' +
        '<p><strong>Operations Completed:</strong> ' +
        escapeHtml((data.realFileWorkspaceExecution && data.realFileWorkspaceExecution.operations && data.realFileWorkspaceExecution.operations.label) || 'Loading…') +
        '</p>' +
        '<p><strong>Operations Blocked:</strong> ' +
        escapeHtml(String((data.realFileWorkspaceExecution && data.realFileWorkspaceExecution.operations && data.realFileWorkspaceExecution.operations.blocked) || 0)) +
        '</p>' +
        '<p><strong>Evidence Generated:</strong> ' +
        escapeHtml((data.realFileWorkspaceExecution && data.realFileWorkspaceExecution.evidence && data.realFileWorkspaceExecution.evidence.label) || 'Loading…') +
        '</p>' +
        '<p><strong>Production Protection Status:</strong> ' +
        escapeHtml((data.realFileWorkspaceExecution && data.realFileWorkspaceExecution.productionProtectionStatus) || 'Loading…') +
        '</p>' +
        '<p class="hint">' +
        escapeHtml((data.realFileWorkspaceExecution && data.realFileWorkspaceExecution.founderConclusion) || '') +
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

  var FOUNDER_REVIEW_SUITE_PROFILES = [
    { profile: 'TASK_TRACKER_WEB_V1', label: 'Task Tracker' },
    { profile: 'CRM_WEB_V1', label: 'CRM' },
    { profile: 'INVENTORY_WEB_V1', label: 'Inventory System' },
    { profile: 'SCHOOL_MANAGEMENT_WEB_V1', label: 'School Management System' },
    { profile: 'PROJECT_MANAGEMENT_WEB_V1', label: 'Project Management System' },
  ];

  function founderReviewEvidenceClass(status) {
    if (status === 'PASS') return 'founder-review-pass';
    if (status === 'FAIL') return 'founder-review-fail';
    if (status === 'RUNNING') return 'founder-review-running';
    return 'founder-review-waiting';
  }

  function founderReviewVerdictClass(verdict) {
    if (verdict === 'LAUNCH_READY') return 'founder-verdict-ready';
    if (verdict === 'LAUNCH_READY_WITH_WARNINGS') return 'founder-verdict-warnings';
    if (verdict === 'NEEDS_AUTOFIX') return 'founder-verdict-autofix';
    if (verdict === 'NEEDS_HUMAN_REVIEW') return 'founder-verdict-human';
    if (verdict === 'NOT_LAUNCH_READY') return 'founder-verdict-blocked';
    return 'founder-verdict-waiting';
  }

  function renderFounderReviewList(items, emptyText) {
    if (!items || !items.length) {
      return '<p class="hint">' + escapeHtml(emptyText) + '</p>';
    }
    return '<ul class="founder-review-list">' + items.map(function (item) {
      return '<li>' + escapeHtml(String(item)) + '</li>';
    }).join('') + '</ul>';
  }

  function renderRequirementDiscoveryPanel(data) {
    if (!data) {
      return renderProductCard(
        'Requirement Discovery',
        '<p class="product-lead">Loading Clarifying Question Intelligence maturity visibility…</p>',
      );
    }

    var coverageRows = (data.requirementCoverage || [])
      .map(function (row) {
        return (
          '<div class="requirement-discovery-row">' +
          '<span>' + escapeHtml(row.category) + '</span>' +
          '<span class="status-pill requirement-discovery-' + String(row.status).toLowerCase() + '">' +
          escapeHtml(row.status) +
          '</span>' +
          '<span>' + String(row.score) + '/100</span>' +
          '</div>'
        );
      })
      .join('');

    return renderProductCard(
      'Requirement Discovery',
      '<p class="product-lead">Clarifying Question Intelligence — understand first, build second. Informational only.</p>' +
        '<p><strong>Confidence Score:</strong> ' + String(data.confidenceScore) + '/100</p>' +
        '<p><strong>Product Domain:</strong> ' + escapeHtml(data.productDomain || 'GENERIC') + '</p>' +
        '<p><strong>Can Proceed To Planning:</strong> ' + (data.canProceedToPlanning ? 'Yes' : 'No') + '</p>' +
        '<p><strong>Requirement Coverage</strong></p>' +
        '<div class="requirement-discovery-grid">' + coverageRows + '</div>' +
        '<p><strong>Open Questions</strong></p>' +
        renderFounderReviewList(
          (data.openQuestions || []).map(function (item) {
            return item.question;
          }),
          'No open questions — sufficient understanding for planning.',
        ) +
        '<p><strong>Resolved Questions</strong></p>' +
        renderFounderReviewList(data.resolvedQuestions, 'No resolved questions yet.') +
        '<p><strong>Critical Gaps</strong></p>' +
        renderFounderReviewList(data.criticalGaps, 'No critical requirement gaps.'),
    );
  }

  function loadRequirementDiscovery(force, prompt) {
    if (!force && requirementDiscoveryData) {
      return Promise.resolve(requirementDiscoveryData);
    }
    if (requirementDiscoveryLoadPromise) {
      return requirementDiscoveryLoadPromise;
    }
    var url = '/api/founder/requirement-discovery';
    if (prompt) {
      url += '?prompt=' + encodeURIComponent(prompt);
    }
    requirementDiscoveryLoadPromise = fetch(url, { method: 'GET', cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('requirement-discovery HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        requirementDiscoveryData = data;
        return data;
      })
      .finally(function () {
        requirementDiscoveryLoadPromise = null;
      });
    return requirementDiscoveryLoadPromise;
  }

  var VERIFICATION_HUB_SUITE_PROFILES = [
    { profile: 'CRM_WEB_V1', label: 'CRM' },
    { profile: 'MARKETPLACE_WEB_V1', label: 'Marketplace' },
    { profile: 'INVENTORY_WEB_V1', label: 'Inventory' },
    { profile: 'SCHOOL_MANAGEMENT_WEB_V1', label: 'School Management' },
    { profile: 'PROJECT_MANAGEMENT_WEB_V1', label: 'Project Management' },
    { profile: 'BOOKING_PLATFORM_WEB_V1', label: 'Booking Platform' },
    { profile: 'RESTAURANT_POS_WEB_V1', label: 'Restaurant POS' },
    { profile: 'LEARNING_PLATFORM_WEB_V1', label: 'Learning Platform' },
    { profile: 'INSURANCE_CRM_WEB_V1', label: 'Insurance CRM' },
    { profile: 'FLEET_MANAGEMENT_WEB_V1', label: 'Fleet Management' },
    { profile: 'HR_PLATFORM_WEB_V1', label: 'HR Platform' },
    { profile: 'CUSTOMER_SUPPORT_WEB_V1', label: 'Customer Support Platform' },
  ];

  function verificationHubTimelineClass(status) {
    if (status === 'PASSED') return 'verification-hub-passed';
    if (status === 'FAILED') return 'verification-hub-failed';
    if (status === 'PENDING') return 'verification-hub-pending';
    return 'verification-hub-not-run';
  }

  function renderVerificationHubPanel(data) {
    if (!data) {
      return renderProductCard(
        'Verification Hub',
        '<p class="product-lead">Loading Unified Verification Lab maturity visibility…</p>',
      );
    }

    var profileOptions = VERIFICATION_HUB_SUITE_PROFILES.map(function (app) {
      var selected = data.profile === app.profile ? ' selected' : '';
      return '<option value="' + escapeHtml(app.profile) + '"' + selected + '>' + escapeHtml(app.label) + '</option>';
    }).join('');

    var coverageRows = (data.categoryCoverage || [])
      .map(function (row) {
        return (
          '<div class="verification-hub-row">' +
          '<span>' + escapeHtml(row.category) + '</span>' +
          '<span>' + String(row.coveragePercent) + '% coverage</span>' +
          '<span>' + String(row.confidencePercent) + '% confidence</span>' +
          '<span class="status-pill verification-hub-' + String(row.status).toLowerCase() + '">' +
          escapeHtml(row.status) +
          '</span>' +
          '</div>'
        );
      })
      .join('');

    var timelineRows = (data.timeline || [])
      .map(function (step) {
        return (
          '<div class="verification-hub-timeline-row">' +
          '<span class="status-pill ' + verificationHubTimelineClass(step.status) + '">' +
          (step.status === 'PASSED' ? '✓' : step.status === 'FAILED' ? '✗' : '…') +
          '</span>' +
          '<span>' + escapeHtml(step.label) + '</span>' +
          '<span class="hint">' + escapeHtml(step.detail) + '</span>' +
          '</div>'
        );
      })
      .join('');

    var historyRows = (data.history || [])
      .slice(0, 8)
      .map(function (entry) {
        return (
          '<div class="verification-hub-history-row">' +
          '<span>' + escapeHtml(entry.productName) + '</span>' +
          '<span>' + String(entry.overallCoveragePercent) + '%</span>' +
          '<span>' + String(entry.verificationConfidenceScore) + '/100</span>' +
          '<span>' + escapeHtml(entry.result) + '</span>' +
          '</div>'
        );
      })
      .join('');

    return renderProductCard(
      'Verification Hub',
      '<p class="product-lead">Unified Verification Lab — coordinates and proves verification for any generated application. Informational only.</p>' +
        '<div class="verification-hub-profile-bar">' +
        '<label for="verification-hub-profile-select"><strong>Application:</strong></label> ' +
        '<select id="verification-hub-profile-select" class="verification-hub-profile-select">' + profileOptions + '</select>' +
        '</div>' +
        '<p><strong>Coverage %:</strong> ' + String(data.overallCoveragePercent) + '%</p>' +
        '<p><strong>Confidence %:</strong> ' + String(data.verificationConfidenceScore) + '/100</p>' +
        '<p><strong>Sufficient for Launch:</strong> ' + (data.verificationSufficientForLaunch ? 'Yes' : 'No') + '</p>' +
        '<p><strong>Verification Coverage</strong></p>' +
        '<div class="verification-hub-grid">' + coverageRows + '</div>' +
        '<p><strong>Verification Timeline</strong></p>' +
        '<div class="verification-hub-timeline">' + timelineRows + '</div>' +
        '<p><strong>Verification Gaps</strong></p>' +
        renderFounderReviewList(data.verificationGaps, 'No verification gaps detected.') +
        '<p><strong>Critical Gaps</strong></p>' +
        renderFounderReviewList(data.criticalGaps, 'No critical verification gaps.') +
        '<p><strong>Verification History</strong></p>' +
        '<div class="verification-hub-history">' + (historyRows || '<p class="hint">No prior verification runs recorded yet.</p>') + '</div>',
    );
  }

  function loadVerificationHub(force, profile) {
    if (!force && verificationHubData && !profile) {
      return Promise.resolve(verificationHubData);
    }
    if (verificationHubLoadPromise) {
      return verificationHubLoadPromise;
    }
    var url = '/api/founder/verification-hub';
    var queryProfile = profile || verificationHubProfile;
    if (queryProfile) {
      url += '?profile=' + encodeURIComponent(queryProfile);
    }
    verificationHubLoadPromise = fetch(url, { method: 'GET', cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('verification-hub HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        verificationHubData = data;
        verificationHubProfile = data.profile || queryProfile;
        return data;
      })
      .finally(function () {
        verificationHubLoadPromise = null;
      });
    return verificationHubLoadPromise;
  }

  function bindVerificationHubActions() {
    var profileSelect = el('verification-hub-profile-select');
    if (!profileSelect) return;
    profileSelect.addEventListener('change', function () {
      verificationHubProfile = profileSelect.value;
      loadVerificationHub(true, verificationHubProfile)
        .then(function () {
          if (currentViewId === 'verification') {
            renderVerificationSurface(workspaceData, manifestData);
          }
        })
        .catch(function () {
          /* panel falls back to loading state */
        });
    });
  }

  function refreshVerificationHubPanel() {
    if (currentViewId === 'verification') {
      renderVerificationSurface(workspaceData, manifestData);
    }
  }

  var TRUST_CALIBRATION_SUITE_PROFILES = [
    { profile: 'CRM_WEB_V1', label: 'CRM' },
    { profile: 'MARKETPLACE_WEB_V1', label: 'Marketplace' },
    { profile: 'INVENTORY_WEB_V1', label: 'Inventory' },
    { profile: 'SCHOOL_MANAGEMENT_WEB_V1', label: 'School Management' },
    { profile: 'PROJECT_MANAGEMENT_WEB_V1', label: 'Project Management' },
    { profile: 'BOOKING_PLATFORM_WEB_V1', label: 'Booking Platform' },
    { profile: 'RESTAURANT_POS_WEB_V1', label: 'Restaurant POS' },
    { profile: 'LEARNING_PLATFORM_WEB_V1', label: 'Learning Platform' },
    { profile: 'INSURANCE_CRM_WEB_V1', label: 'Insurance CRM' },
    { profile: 'FLEET_MANAGEMENT_WEB_V1', label: 'Fleet Management' },
    { profile: 'HR_PLATFORM_WEB_V1', label: 'HR Platform' },
    { profile: 'CUSTOMER_SUPPORT_WEB_V1', label: 'Customer Support Platform' },
    { profile: 'SOCIAL_PLATFORM_WEB_V1', label: 'Social Platform' },
    { profile: 'FITNESS_APP_WEB_V1', label: 'Fitness App' },
    { profile: 'HEALTHCARE_PORTAL_WEB_V1', label: 'Healthcare Portal' },
    { profile: 'PROPERTY_MANAGEMENT_WEB_V1', label: 'Property Management' },
    { profile: 'E_COMMERCE_PLATFORM_WEB_V1', label: 'E-Commerce Platform' },
    { profile: 'JOB_BOARD_WEB_V1', label: 'Job Board' },
    { profile: 'EVENT_PLATFORM_WEB_V1', label: 'Event Platform' },
    { profile: 'FINANCE_TRACKER_WEB_V1', label: 'Finance Tracker' },
  ];

  function renderTrustCalibrationPanel(data) {
    if (!data) {
      return renderProductCard(
        'Founder Trust Calibration',
        '<p class="product-lead">Loading AFLA trust calibration visibility…</p>',
      );
    }

    var profileOptions = TRUST_CALIBRATION_SUITE_PROFILES.map(function (app) {
      var selected = data.profile === app.profile ? ' selected' : '';
      return '<option value="' + escapeHtml(app.profile) + '"' + selected + '>' + escapeHtml(app.label) + '</option>';
    }).join('');

    var reviewerRows = Object.keys(data.reviewerAlignment.scores || {}).map(function (label) {
      return (
        '<div class="trust-calibration-row">' +
        '<span>' + escapeHtml(label) + '</span>' +
        '<span>' + String(data.reviewerAlignment.scores[label]) + '/100</span>' +
        '</div>'
      );
    }).join('');

    var historyRows = (data.history || [])
      .slice(0, 8)
      .map(function (entry) {
        return (
          '<div class="trust-calibration-history-row">' +
          '<span>' + escapeHtml(entry.productName) + '</span>' +
          '<span>' + String(entry.aflaTrustScore) + '/100</span>' +
          '<span>' + escapeHtml(entry.verdictQuality) + '</span>' +
          '<span>FP:' + String(entry.falsePositiveCount) + ' FN:' + String(entry.falseNegativeCount) + '</span>' +
          '</div>'
        );
      })
      .join('');

    var explain = data.launchDecisionExplainability || {};

    return renderProductCard(
      'Founder Trust Calibration',
      '<p class="product-lead">Autonomous Founder Launch Authority — calibrate launch decisions against evidence. Informational only.</p>' +
        '<div class="trust-calibration-profile-bar">' +
        '<label for="trust-calibration-profile-select"><strong>Application:</strong></label> ' +
        '<select id="trust-calibration-profile-select" class="trust-calibration-profile-select">' + profileOptions + '</select>' +
        '</div>' +
        '<p><strong>Trust Score:</strong> ' + String(data.aflaTrustScore) + '/100</p>' +
        '<p><strong>False Positives:</strong> ' + String(data.falsePositiveCount) + '</p>' +
        '<p><strong>False Negatives:</strong> ' + String(data.falseNegativeCount) + '</p>' +
        '<p><strong>Confidence Accuracy:</strong> ' +
        (data.confidenceAccuracy.aligned ? 'Aligned' : data.confidenceAccuracy.inflated ? 'Inflated' : data.confidenceAccuracy.tooConservative ? 'Too conservative' : 'Review') +
        ' (gap ' + String(data.confidenceAccuracy.confidenceGap) + ')</p>' +
        '<p><strong>Reviewer Alignment:</strong> divergence ' + String(data.reviewerAlignment.divergence) +
        (data.reviewerAlignment.extremeDisagreement ? ' — extreme disagreement' : '') + '</p>' +
        '<div class="trust-calibration-grid">' + reviewerRows + '</div>' +
        '<p><strong>Verdict Stability:</strong> ' +
        (data.verdictStability.verdictStable ? 'Stable' : 'Unstable') +
        ' · score variance ' + String(data.verdictStability.scoreVariance) +
        ' · confidence variance ' + String(data.verdictStability.confidenceVariance) + '</p>' +
        '<p><strong>Decision Summary:</strong> ' + escapeHtml(explain.decisionSummary || '') + '</p>' +
        '<p><strong>Reason For Verdict:</strong> ' + escapeHtml(explain.reasonForVerdict || '') + '</p>' +
        '<p><strong>Top Positive Signals</strong></p>' +
        renderFounderReviewList(explain.topPositiveSignals, 'No positive signals recorded.') +
        '<p><strong>Top Risks</strong></p>' +
        renderFounderReviewList(explain.topRisks, 'No risks recorded.') +
        '<p><strong>Verification Gaps</strong></p>' +
        renderFounderReviewList(data.falsePositives, 'No false positives detected.') +
        '<p><strong>Calibration History</strong></p>' +
        '<div class="trust-calibration-history">' + (historyRows || '<p class="hint">No prior calibration runs recorded yet.</p>') + '</div>',
    );
  }

  function loadTrustCalibration(force, profile) {
    if (!force && trustCalibrationData && !profile) {
      return Promise.resolve(trustCalibrationData);
    }
    if (trustCalibrationLoadPromise) {
      return trustCalibrationLoadPromise;
    }
    var url = '/api/founder/trust-calibration';
    var queryProfile = profile || trustCalibrationProfile;
    if (queryProfile) {
      url += '?profile=' + encodeURIComponent(queryProfile);
    }
    trustCalibrationLoadPromise = fetch(url, { method: 'GET', cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('trust-calibration HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        trustCalibrationData = data;
        trustCalibrationProfile = data.profile || queryProfile;
        return data;
      })
      .finally(function () {
        trustCalibrationLoadPromise = null;
      });
    return trustCalibrationLoadPromise;
  }

  function bindTrustCalibrationActions() {
    var profileSelect = el('trust-calibration-profile-select');
    if (!profileSelect) return;
    profileSelect.addEventListener('change', function () {
      trustCalibrationProfile = profileSelect.value;
      loadTrustCalibration(true, trustCalibrationProfile)
        .then(function () {
          if (currentViewId === 'founder-review') {
            renderFounderReviewSurface(workspaceData);
          }
        })
        .catch(function () {
          /* panel falls back to loading state */
        });
    });
  }

  var PRODUCT_ARCHITECT_SUITE_PROFILES = [
    { profile: 'CRM_WEB_V1', label: 'CRM' },
    { profile: 'MARKETPLACE_WEB_V1', label: 'Marketplace' },
    { profile: 'INVENTORY_WEB_V1', label: 'Inventory' },
    { profile: 'SCHOOL_MANAGEMENT_WEB_V1', label: 'School Management' },
    { profile: 'HEALTHCARE_PORTAL_WEB_V1', label: 'Healthcare Portal' },
    { profile: 'FINANCE_TRACKER_WEB_V1', label: 'Finance Tracker' },
    { profile: 'BOOKING_PLATFORM_WEB_V1', label: 'Booking Platform' },
    { profile: 'RESTAURANT_POS_WEB_V1', label: 'Restaurant POS' },
    { profile: 'PROJECT_MANAGEMENT_WEB_V1', label: 'Project Management' },
    { profile: 'HR_PLATFORM_WEB_V1', label: 'HR Platform' },
    { profile: 'SOCIAL_PLATFORM_WEB_V1', label: 'Social Platform' },
    { profile: 'LEARNING_PLATFORM_WEB_V1', label: 'Learning Platform' },
  ];

  function renderProductArchitectPanel(data) {
    if (!data) {
      return renderProductCard(
        'Product Architect Review',
        '<p class="product-lead">Loading product architecture intelligence…</p>',
      );
    }

    var profileOptions = PRODUCT_ARCHITECT_SUITE_PROFILES.map(function (app) {
      var selected = data.profile === app.profile ? ' selected' : '';
      return '<option value="' + escapeHtml(app.profile) + '"' + selected + '>' + escapeHtml(app.label) + '</option>';
    }).join('');

    var historyRows = (data.history || [])
      .slice(0, 8)
      .map(function (entry) {
        return (
          '<div class="product-architect-history-row">' +
          '<span>' + escapeHtml(entry.productName) + '</span>' +
          '<span>' + String(entry.productReadinessScore) + '/100</span>' +
          '<span>' + escapeHtml(entry.readinessLabel) + '</span>' +
          '<span>Critical:' + String(entry.criticalGapCount) + '</span>' +
          '</div>'
        );
      })
      .join('');

    return renderProductCard(
      'Product Architect Review',
      '<p class="product-lead">Product Architect Intelligence — evaluate whether the product itself is complete before verification and launch review. Informational only.</p>' +
        '<div class="product-architect-profile-bar">' +
        '<label for="product-architect-profile-select"><strong>Application:</strong></label> ' +
        '<select id="product-architect-profile-select" class="product-architect-profile-select">' + profileOptions + '</select>' +
        '</div>' +
        '<p><strong>Product Readiness Score:</strong> ' + String(data.productReadinessScore) + '/100 (' + escapeHtml(data.readinessLabel) + ')</p>' +
        '<p><strong>Architecture Score:</strong> ' + String(data.architectureScore) + '/100</p>' +
        '<p><strong>Workflow Score:</strong> ' + String(data.workflowScore) + '/100</p>' +
        '<p><strong>User Journey Score:</strong> ' + String(data.userJourneyScore) + '/100</p>' +
        '<p><strong>Screen Coverage Score:</strong> ' + String(data.screenCoverageScore) + '/100</p>' +
        '<p><strong>CQI Root Cause:</strong> ' + escapeHtml(data.cqiRootCause || 'Unknown') + '</p>' +
        '<p><strong>Critical Product Gaps</strong></p>' +
        renderFounderReviewList(data.criticalProductGaps, 'No critical product gaps detected.') +
        '<p><strong>Missing Screens</strong></p>' +
        renderFounderReviewList(data.missingScreens, 'No missing screens detected.') +
        '<p><strong>Missing Workflows</strong></p>' +
        renderFounderReviewList(data.missingWorkflows, 'No missing workflows detected.') +
        '<p><strong>Recommendations</strong></p>' +
        renderFounderReviewList(data.recommendations, 'No recommendations yet.') +
        '<p><strong>Assessment History</strong></p>' +
        '<div class="product-architect-history">' + (historyRows || '<p class="hint">No prior product architecture runs recorded yet.</p>') + '</div>',
    );
  }

  function loadProductArchitect(force, profile) {
    if (!force && productArchitectData && !profile) {
      return Promise.resolve(productArchitectData);
    }
    if (productArchitectLoadPromise) {
      return productArchitectLoadPromise;
    }
    var url = '/api/founder/product-architect-intelligence';
    var queryProfile = profile || productArchitectProfile;
    if (queryProfile) {
      url += '?profile=' + encodeURIComponent(queryProfile);
    }
    productArchitectLoadPromise = fetch(url, { method: 'GET', cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('product-architect-intelligence HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        productArchitectData = data;
        productArchitectProfile = data.profile || queryProfile;
        return data;
      })
      .finally(function () {
        productArchitectLoadPromise = null;
      });
    return productArchitectLoadPromise;
  }

  function bindProductArchitectActions() {
    var profileSelect = el('product-architect-profile-select');
    if (!profileSelect || profileSelect.getAttribute('data-bound') === 'true') return;
    profileSelect.setAttribute('data-bound', 'true');
    profileSelect.addEventListener('change', function () {
      productArchitectProfile = profileSelect.value;
      loadProductArchitect(true, productArchitectProfile)
        .then(function () {
          if (currentViewId === 'founder-review') {
            renderFounderReviewSurface(workspaceData);
          }
        })
        .catch(function () {
          if (currentViewId === 'founder-review') {
            renderFounderReviewSurface(workspaceData);
          }
        });
    });
  }

  function renderLargeScaleValidationPanel(data) {
    if (!data) {
      return renderProductCard(
        'Large-Scale Validation',
        '<p class="product-lead">Loading large-scale multi-app validation…</p>',
      );
    }

    var failureRows = (data.failureDistribution || [])
      .map(function (row) {
        return (
          '<div class="large-scale-row">' +
          '<span>' + escapeHtml(row.failureClass) + '</span>' +
          '<span>' + String(row.count) + ' (' + String(row.percentage) + '%)</span>' +
          '</div>'
        );
      })
      .join('');

    var leaderboardRows = (data.categoryLeaderboard || [])
      .slice(0, 10)
      .map(function (row) {
        return (
          '<div class="large-scale-leaderboard-row">' +
          '<span>' + escapeHtml(row.productName) + '</span>' +
          '<span>' + String(row.score) + '/100</span>' +
          '<span>' + (row.passed ? 'PASS' : 'FAIL') + '</span>' +
          '</div>'
        );
      })
      .join('');

    return renderProductCard(
      'Large-Scale Validation',
      '<p class="product-lead">AiDevEngine generalization proof — one prompt per category across 50+ industries. Informational only.</p>' +
        '<p><strong>Categories Tested:</strong> ' + String(data.categoriesTested) + '</p>' +
        '<p><strong>Pass Rate:</strong> ' + String(data.passRates.overallPassRate) + '%</p>' +
        '<p><strong>Generalization Score:</strong> ' + String(data.generalizationScore) + '/100</p>' +
        '<p><strong>Generation Success:</strong> ' + String(data.passRates.generationSuccessRate) + '% · ' +
        '<strong>Blueprint:</strong> ' + String(data.passRates.blueprintSuccessRate) + '% · ' +
        '<strong>AFLA:</strong> ' + String(data.passRates.aflaSuccessRate) + '%</p>' +
        '<p><strong>Failure Distribution</strong></p>' +
        '<div class="large-scale-grid">' + failureRows + '</div>' +
        '<p><strong>Category Leaderboard</strong></p>' +
        '<div class="large-scale-leaderboard">' + leaderboardRows + '</div>' +
        '<p><strong>Weakest Categories</strong></p>' +
        renderFounderReviewList(data.weakestCategories, 'No weak categories flagged.') +
        '<p><strong>Cross-App Consistency:</strong> ' + String(data.crossAppConsistency.overallConsistency) + '%</p>',
    );
  }

  function loadLargeScaleValidation(force) {
    if (!force && largeScaleValidationData) {
      return Promise.resolve(largeScaleValidationData);
    }
    if (largeScaleValidationLoadPromise) {
      return largeScaleValidationLoadPromise;
    }
    var url = '/api/founder/large-scale-validation?refresh=true';
    largeScaleValidationLoadPromise = fetch(url, { method: 'GET', cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('large-scale-validation HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        largeScaleValidationData = data;
        return data;
      })
      .finally(function () {
        largeScaleValidationLoadPromise = null;
      });
    return largeScaleValidationLoadPromise;
  }

  function renderExecutionPipelinePanel(data) {
    if (!data) {
      return renderProductCard(
        'Execution Pipeline',
        '<p class="product-lead">Loading real build execution pipeline…</p>',
      );
    }

    var failureRows = (data.failureDistribution || [])
      .map(function (row) {
        return (
          '<div class="large-scale-row">' +
          '<span>' + escapeHtml(row.failureClass) + '</span>' +
          '<span>' + String(row.count) + ' (' + String(row.percentage) + '%)</span>' +
          '</div>'
        );
      })
      .join('');

    var recentRows = (data.recentBuilds || [])
      .map(function (row) {
        return (
          '<div class="large-scale-leaderboard-row">' +
          '<span>' + escapeHtml(row.productName) + '</span>' +
          '<span>' + (row.buildSuccess ? 'BUILD ✓' : 'BUILD ✗') + '</span>' +
          '<span>' + (row.previewSuccess ? 'PREVIEW ✓' : 'PREVIEW ✗') + '</span>' +
          '<span>' + escapeHtml(row.aflaVerdict || '—') + '</span>' +
          '</div>'
        );
      })
      .join('');

    return renderProductCard(
      'Execution Pipeline',
      '<p class="product-lead">Real build execution proof — actual generated applications, not plans or mock execution.</p>' +
        '<p><strong>Build Success Rate:</strong> ' + String(data.buildSuccessRate) + '% · ' +
        '<strong>Preview Success Rate:</strong> ' + String(data.previewSuccessRate) + '% · ' +
        '<strong>Verification Success Rate:</strong> ' + String(data.verificationSuccessRate) + '%</p>' +
        '<p><strong>Execution Proof Status:</strong> ' + escapeHtml(data.executionProofStatus || 'UNKNOWN') + ' · ' +
        '<strong>Execution Generalization Score:</strong> ' + String(data.executionGeneralizationScore) + '/100</p>' +
        '<p><strong>Failure Distribution</strong></p>' +
        '<div class="large-scale-grid">' + failureRows + '</div>' +
        '<p><strong>Recent Builds</strong></p>' +
        '<div class="large-scale-leaderboard">' + recentRows + '</div>',
    );
  }

  function loadExecutionPipeline(force) {
    if (!force && executionPipelineData) {
      return Promise.resolve(executionPipelineData);
    }
    if (executionPipelineLoadPromise) {
      return executionPipelineLoadPromise;
    }
    executionPipelineLoadPromise = fetch('/api/founder/real-build-execution-pipeline?refresh=true', {
      method: 'GET',
      cache: 'no-store',
    })
      .then(function (res) {
        if (!res.ok) throw new Error('real-build-execution-pipeline HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        executionPipelineData = data;
        return data;
      })
      .finally(function () {
        executionPipelineLoadPromise = null;
      });
    return executionPipelineLoadPromise;
  }

  function renderFounderReviewDashboard(data) {
    if (!data) {
      return (
        '<section class="card founder-review-dashboard" id="founder-review-dashboard">' +
        '<h2>Founder Review</h2>' +
        '<p class="product-lead">Loading Autonomous Founder Launch Authority review transparency…</p>' +
        '</section>'
      );
    }

    var profileOptions = FOUNDER_REVIEW_SUITE_PROFILES.map(function (app) {
      var selected = data.profile === app.profile ? ' selected' : '';
      return '<option value="' + escapeHtml(app.profile) + '"' + selected + '>' + escapeHtml(app.label) + '</option>';
    }).join('');

    var evidenceRows = (data.evidenceChain || []).map(function (row) {
      return (
        '<div class="founder-review-evidence-row">' +
        '<span class="founder-review-evidence-label">' + escapeHtml(row.label) + '</span>' +
        '<span class="status-pill ' + founderReviewEvidenceClass(row.status) + '">' + escapeHtml(row.status) + '</span>' +
        '<span class="founder-review-evidence-score">' + String(row.score) + '/100</span>' +
        '</div>'
      );
    }).join('');

    var reviewerCards = (data.reviewerPanel || []).map(function (reviewer) {
      var confidence =
        reviewer.role === 'founder' && reviewer.founderConfidence != null
          ? '<p><strong>Confidence:</strong> ' + String(reviewer.founderConfidence) + '/100</p>'
          : '';
      return (
        '<article class="founder-review-reviewer-card">' +
        '<h4>' + escapeHtml(reviewer.title) + '</h4>' +
        '<p><strong>Score:</strong> ' + String(reviewer.score) + '/100</p>' +
        confidence +
        '<p><strong>Findings</strong></p>' +
        renderFounderReviewList(reviewer.findings, 'No findings recorded.') +
        '<p><strong>Risks</strong></p>' +
        renderFounderReviewList(reviewer.risks, 'No risks recorded.') +
        '</article>'
      );
    }).join('');

    var historyRows = (data.history || []).slice(0, 8).map(function (entry) {
      return (
        '<div class="founder-review-history-row">' +
        '<span>' + escapeHtml(entry.generatedAt.slice(0, 10)) + '</span>' +
        '<span>' + escapeHtml(entry.productName) + '</span>' +
        '<span>' + String(entry.overallScore) + '/100</span>' +
        '<span class="status-pill ' + founderReviewVerdictClass(entry.verdict) + '">' + escapeHtml(String(entry.verdict).replaceAll('_', ' ')) + '</span>' +
        '</div>'
      );
    }).join('');

    return (
      '<section class="card founder-review-dashboard" id="founder-review-dashboard">' +
      '<h2>Founder Review</h2>' +
      '<p class="product-lead">AiDevEngine internal launch review transparency — informational only. Autonomous Founder Launch Authority remains the sole launch decision owner.</p>' +
      '<div class="founder-review-profile-bar">' +
      '<label for="founder-review-profile-select"><strong>Application:</strong></label> ' +
      '<select id="founder-review-profile-select" class="founder-review-profile-select">' + profileOptions + '</select>' +
      '</div>' +
      renderProductCard(
        'Launch Readiness',
        '<p class="founder-review-overall-score"><strong>Overall Score:</strong> ' + String(data.launchReadiness.overallScore) + '/100</p>' +
        '<p><strong>Current Status:</strong> <span class="status-pill founder-review-phase">' + escapeHtml(data.launchReadiness.currentPhase) + '</span></p>' +
        '<p class="hint">' + escapeHtml(data.launchReadiness.userLabel || '') + '</p>',
      ) +
      renderRequirementDiscoveryPanel(requirementDiscoveryData) +
      renderProductArchitectPanel(productArchitectData) +
      renderTrustCalibrationPanel(trustCalibrationData) +
      renderProductCard(
        'Evidence Chain',
        '<div class="founder-review-evidence-grid">' + evidenceRows + '</div>',
      ) +
      renderProductCard(
        'Reviewer Panel',
        '<p class="hint">Six reviewers: Senior Engineer Review, QA Review, UX Review, Product Review, Launch Review, Founder Review.</p>' +
        '<div class="founder-review-reviewer-grid">' + (reviewerCards || '<p class="hint">Waiting for reviewer assessments.</p>') + '</div>',
      ) +
      renderProductCard(
        'Launch Readiness Breakdown',
        '<div class="founder-review-score-grid">' +
        '<p><strong>Engineering:</strong> ' + String(data.scoreBreakdown.engineering) + '</p>' +
        '<p><strong>QA:</strong> ' + String(data.scoreBreakdown.qa) + '</p>' +
        '<p><strong>UX:</strong> ' + String(data.scoreBreakdown.ux) + '</p>' +
        '<p><strong>Product:</strong> ' + String(data.scoreBreakdown.product) + '</p>' +
        '<p><strong>Launch:</strong> ' + String(data.scoreBreakdown.launch) + '</p>' +
        '<p><strong>Founder:</strong> ' + String(data.scoreBreakdown.founder) + '</p>' +
        '<p class="founder-review-overall-score"><strong>Overall:</strong> ' + String(data.scoreBreakdown.overall) + '</p>' +
        '</div>',
      ) +
      renderProductCard(
        'Launch Blockers',
        '<p><strong>Critical Blockers</strong></p>' +
        renderFounderReviewList(data.blockers.criticalBlockers, 'No critical blockers.') +
        '<p><strong>Warnings</strong></p>' +
        renderFounderReviewList(data.blockers.warnings, 'No warnings.') +
        '<p><strong>Recommendations</strong></p>' +
        renderFounderReviewList(data.blockers.recommendations, 'No recommendations yet.'),
      ) +
      renderProductCard(
        'AutoFix',
        '<p><strong>AutoFix Active:</strong> ' + (data.autoFix.autofixActive ? 'Yes' : 'No') + '</p>' +
        '<p><strong>Retry Count:</strong> ' + String(data.autoFix.retryCount) + ' / ' + String(data.autoFix.maxRetries) + '</p>' +
        '<p><strong>AutoFix Queue</strong></p>' +
        renderFounderReviewList(data.autoFix.queue, 'AutoFix queue is empty.') +
        '<p><strong>Resolved Issues</strong></p>' +
        renderFounderReviewList(data.autoFix.resolvedIssues, 'No resolved issues yet.') +
        '<p><strong>Remaining Issues</strong></p>' +
        renderFounderReviewList(data.autoFix.remainingIssues, 'No remaining issues.') +
        (data.autoFix.remediationPlanId
          ? '<p class="hint"><strong>FounderRemediationPlan:</strong> ' + escapeHtml(data.autoFix.remediationPlanId) + '</p>'
          : ''),
      ) +
      renderProductCard(
        'Founder Verdict',
        '<p class="status-pill ' + founderReviewVerdictClass(data.founderVerdict.verdict) + '">' +
        escapeHtml(String(data.founderVerdict.verdict).replaceAll('_', ' ')) +
        '</p>' +
        '<p><strong>Founder Confidence:</strong> ' + String(data.founderVerdict.founderConfidence) + '/100</p>' +
        '<p><strong>Reasoning Summary:</strong> ' + escapeHtml(data.founderVerdict.reasoningSummary) + '</p>' +
        (data.founderVerdict.blocksLaunchReason
          ? '<p class="hint"><strong>Blocks Launch:</strong> ' + escapeHtml(data.founderVerdict.blocksLaunchReason) + '</p>'
          : ''),
      ) +
      renderProductCard(
        'Historical Launch Reviews',
        '<p><strong>Trend Direction:</strong> ' + escapeHtml(data.trendDirection || 'UNKNOWN') + '</p>' +
        '<div class="founder-review-history-grid">' + (historyRows || '<p class="hint">No prior reviews recorded yet.</p>') + '</div>' +
        '<p class="hint">Maximum history: 25 reviews.</p>',
      ) +
      '<div class="founder-review-actions">' +
      '<button type="button" class="btn-secondary" id="copy-founder-review-report">Copy Founder Review Report</button>' +
      '</div>' +
      '</section>'
    );
  }

  function bindFounderReviewDashboardActions() {
    var copyBtn = el('copy-founder-review-report');
    if (copyBtn && copyBtn.getAttribute('data-bound') !== 'true') {
      copyBtn.setAttribute('data-bound', 'true');
      copyBtn.addEventListener('click', function () {
        var text = founderReviewData && founderReviewData.copyReportText;
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text);
        }
      });
    }
    var profileSelect = el('founder-review-profile-select');
    if (profileSelect && profileSelect.getAttribute('data-bound') !== 'true') {
      profileSelect.setAttribute('data-bound', 'true');
      profileSelect.addEventListener('change', function () {
        founderReviewProfile = profileSelect.value || 'TASK_TRACKER_WEB_V1';
        loadFounderReview(true)
          .then(function () {
            refreshFounderReviewPanel();
          })
          .catch(function () {
            refreshFounderReviewPanel();
          });
      });
    }
  }

  function loadFounderReview(force) {
    if (!force && founderReviewData && founderReviewData.profile === founderReviewProfile) {
      return Promise.resolve(founderReviewData);
    }
    if (founderReviewLoadPromise) {
      return founderReviewLoadPromise;
    }
    var url = '/api/founder/founder-review?profile=' + encodeURIComponent(founderReviewProfile);
    founderReviewLoadPromise = fetch(url, { method: 'GET', cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('founder-review HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        founderReviewData = data;
        return data;
      })
      .finally(function () {
        founderReviewLoadPromise = null;
      });
    return founderReviewLoadPromise;
  }

  function refreshFounderReviewPanel() {
    if (currentViewId === 'founder-review') {
      renderFounderReviewSurface(workspaceData);
    }
  }

  function renderFounderReviewSurface(ws) {
    var container = el('founder-review-surface');
    if (!container) return;
    container.innerHTML = renderFounderReviewDashboard(founderReviewData);
    bindFounderReviewDashboardActions();
    bindProductArchitectActions();
    bindTrustCalibrationActions();
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
    html += renderVerificationHubPanel(verificationHubData);
    html += renderLargeScaleValidationPanel(largeScaleValidationData);
    html += renderExecutionPipelinePanel(executionPipelineData);
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
    bindVerificationHubActions();
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
    container.innerHTML = renderProductCard(
      'Notifications',
      '<p class="product-lead">Runtime events and system notices from your AiDevEngine session.</p>' +
        renderNotificationsVaultHtml(items),
    );
    wireNotificationCopyButtons(container);
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
    renderLivePreviewSurface(buildWorkspaceViewForActiveProject(workspaceData));
    renderProjectMemorySurface(workspaceData);
    renderVerificationSurface(workspaceData, manifestData);
    renderFounderReviewSurface(workspaceData);
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
    if (viewId === 'founder-review') {
      Promise.all([loadFounderReview(false), loadRequirementDiscovery(false)])
        .then(function () {
          refreshFounderReviewPanel();
        })
        .catch(function () {
          refreshFounderReviewPanel();
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
    if (isOperatorFeedFounderTestMode()) return;
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
    if (isOperatorFeedFounderTestMode()) return;
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
    'Verification Hub': '<svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><rect x="3" y="3" width="18" height="18" rx="3"/></svg>',
    'Founder Review': '<svg viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>',
    'Founder Trust Calibration': '<svg viewBox="0 0 24 24"><path d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z"/><path d="M9 12l2 2 4-4"/></svg>',
    'Product Architect Review': '<svg viewBox="0 0 24 24"><path d="M3 7h18v12H3z"/><path d="M7 7V5h10v2"/><path d="M8 11h8M8 15h5"/></svg>',
    'Large-Scale Validation': '<svg viewBox="0 0 24 24"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>',
    'Execution Pipeline': '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    'Requirement Discovery': '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M12 4h9"/><path d="M4 9h16"/><path d="M4 15h16"/><path d="M4 4v16"/></svg>',
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

  function isOperatorFeedFounderTestMode() {
    return operatorFeedMode === OPERATOR_FEED_MODE_FOUNDER_TEST && !founderTestRuntimeDismissed;
  }

  function applyOperatorFeedModeLayout() {
    var body = el('operator-feed-body');
    if (!body) return;
    var active = isOperatorFeedFounderTestMode();
    body.classList.toggle('founder-test-runtime-active', active);
    body.setAttribute('data-operator-feed-mode', operatorFeedMode);
    var streamLog = el('feed-stream-log');
    var sections = el('feed-sections');
    if (streamLog) streamLog.setAttribute('aria-hidden', active ? 'true' : 'false');
    if (sections) sections.setAttribute('aria-hidden', active ? 'true' : 'false');
  }

  function activateOperatorFeedFounderTestMode(runtime) {
    operatorFeedMode = OPERATOR_FEED_MODE_FOUNDER_TEST;
    founderTestRuntimeDismissed = false;
    if (runtime && runtime.runId) founderTestRuntimePinnedRunId = runtime.runId;
    applyOperatorFeedModeLayout();
  }

  function dismissOperatorFeedFounderTestMode() {
    founderTestRuntimeDismissed = true;
    operatorFeedMode = OPERATOR_FEED_MODE_DEFAULT;
    founderTestRuntimePinnedRunId = null;
    founderTestRuntimeCardSnapshot = null;
    lastKnownActiveFounderTestRuntimeSnapshot = null;
    founderTestRuntimeReportBindingMismatch = false;
    lastRenderedOperatorTraceKey = '';
    applyOperatorFeedModeLayout();
    var container = el('founder-test-operator-trace');
    if (container) {
      container.setAttribute('hidden', '');
      container.innerHTML = '';
    }
  }

  function syncOperatorFeedLayout(runtime) {
    if (runtime && runtime.runId && runtime.state !== 'IDLE' && !founderTestRuntimeDismissed) {
      activateOperatorFeedFounderTestMode(runtime);
      return;
    }
    if (isOperatorFeedFounderTestMode()) {
      applyOperatorFeedModeLayout();
      return;
    }
    applyOperatorFeedModeLayout();
  }

  function renderOperatorFeed(sections, options) {
    if (isOperatorFeedFounderTestMode()) {
      applyOperatorFeedModeLayout();
      return;
    }
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
      var entry = normalizeNotificationEntry(notifications[i]);
      var li = document.createElement('li');
      if (entry.type === 'founder-test-report') {
        li.className = 'notification-item founder-test-report-notification';
        li.innerHTML = buildFounderTestReportNotificationHtml(entry);
      } else {
        li.textContent = entry.text || '';
      }
      list.appendChild(li);
    }
    wireNotificationCopyButtons(list);
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
        if (payload && typeof payload.llmConnected === 'boolean') {
          renderLlmChatBrainDiagnostics({
            llmConnected: payload.llmConnected,
            fallbackUsed: !payload.llmConnected,
            provider: payload.llmProvider || null,
            model: payload.llmModel || null,
            contextIncluded: payload.contextIncluded === true,
            contextSourcesUsed: payload.contextSourcesUsed || [],
            contextSourcesLabel: payload.contextSourcesLabel || null,
            lastContextHydration: payload.lastContextHydration || null,
            hydratedFactCount: payload.hydratedFactCount || 0,
            contextConfidence: payload.contextConfidence || null,
            identityLoaded: payload.identityLoaded === true,
            founderLoaded: payload.founderLoaded === true,
            productLoaded: payload.productLoaded === true,
            historyLoaded: payload.historyLoaded === true,
            selfEvolutionLoaded: payload.selfEvolutionLoaded === true,
            identityVersion: payload.identityVersion || null,
            founderVersion: payload.founderVersion || null,
            productVersion: payload.productVersion || null,
            currentProductIdentity: payload.currentProductIdentity || null,
            founderIdentity: payload.founderIdentity || null,
            companyIdentity: payload.companyIdentity || null,
            legacyIdentity: payload.legacyIdentity || null,
            judgeScore: null,
            warnings: payload.llmApiKeyConfigured ? [] : ['LLM_API_KEY not configured in process.env'],
          });
        }
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
    if (data && data.apiBaseUrl) {
      founderTestApiBaseUrlOverride = null;
      founderTestApiResolvedOrigin = String(data.apiBaseUrl).replace(/\/$/, '');
    }
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
    runtimeNotifications = [
      {
        id: createNotificationId('simple'),
        type: 'simple',
        text: 'AiDevEngine Command Center brain connected',
        timestamp: new Date().toISOString(),
        read: true,
      },
    ];
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
    applyMultiProjectWorkspaceState(data);
    if (data && data.runtime) {
      var statusItems = [];
      if (data.runtime.localRuntimeConnected) {
        statusItems.push('AiDevEngine local runtime connected');
      }
      if (data.runtime.brainConnected) {
        statusItems.push('Command Center brain connected');
      }
      if (data.livePreview && data.livePreview.connected) {
        statusItems.push(
          data.livePreview.onePromptReady || (data.livePreview.onePromptBuild && data.livePreview.onePromptBuild.status === 'READY')
            ? 'Live preview runtime connected — generated app running'
            : 'Live preview runtime active',
        );
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

  function isOnePromptBuildPrompt(message) {
    var text = String(message || '');
    return (
      /task tracker|todo app|todo list/i.test(text) &&
      /add tasks?|mark them complete|filter by all\/active\/completed/i.test(text)
    );
  }

  function startBuildProgressFeedTicker() {
    var stages = [
      {
        eventType: 'Classifying Request',
        action: 'Detecting build prompt',
        detail: 'Recognized Task Tracker build request.',
        section: 'Build',
        status: 'Active',
        stepIndex: 1,
        stepTotal: 7,
      },
      {
        eventType: 'Understanding Project',
        action: 'Planning contract',
        detail: 'Creating build-ready requirements-to-plan contract.',
        section: 'Build',
        status: 'Active',
        stepIndex: 2,
        stepTotal: 7,
      },
      {
        eventType: 'Gathering Facts',
        action: 'Materializing workspace',
        detail: 'Generating Task Tracker source files.',
        section: 'Build',
        status: 'Active',
        stepIndex: 3,
        stepTotal: 7,
      },
      {
        eventType: 'Analyzing Project Status',
        action: 'Installing dependencies',
        detail: 'Running npm install in generated workspace.',
        section: 'Build',
        status: 'Active',
        stepIndex: 4,
        stepTotal: 7,
      },
      {
        eventType: 'Generating Response',
        action: 'Building app',
        detail: 'Running npm run build.',
        section: 'Build',
        status: 'Active',
        stepIndex: 5,
        stepTotal: 7,
      },
      {
        eventType: 'Generating Response',
        action: 'Starting Live Preview',
        detail: 'Launching Vite dev server.',
        section: 'Build',
        status: 'Active',
        stepIndex: 6,
        stepTotal: 7,
      },
    ];
    var index = 0;
    var completed = [];
    renderOperatorFeed(defaultFeedSections, {
      activeEvent: stages[0],
      completedEvents: [],
      idle: false,
    });
    appendFeedStreamEvent(stages[0], true);
    var timer = window.setInterval(function () {
      if (index >= stages.length - 1) return;
      completed.push(stages[index]);
      index += 1;
      renderOperatorFeed(defaultFeedSections, {
        activeEvent: stages[index],
        completedEvents: completed.map(function (item) {
          return item.action;
        }),
        idle: false,
      });
      appendFeedStreamEvent(stages[index], true);
    }, 6000);
    return function stopBuildProgressFeedTicker() {
      window.clearInterval(timer);
    };
  }

  function applyOnePromptLivePreview(buildResult, livePreviewMeta, workspaceSync, responseMeta) {
    if (!buildResult && !livePreviewMeta && !workspaceSync) return;
    workspaceData = workspaceData || {};
    workspaceData.livePreview = workspaceData.livePreview || {};
    workspaceData.runtime = workspaceData.runtime || {};
    var build = buildResult || {};
    var meta = livePreviewMeta || {};
    var sync = workspaceSync || null;
    responseMeta = responseMeta || {};

    if (responseMeta.multiProjectWorkspaces) {
      mergeMultiProjectWorkspacesFromResponse(responseMeta.multiProjectWorkspaces);
    }
    if (build.projectId) {
      switchActiveProject(build.projectId, { skipChatSave: true, skipViewSwitch: true });
    } else if (responseMeta.activeProjectId) {
      switchActiveProject(responseMeta.activeProjectId, { skipChatSave: true, skipViewSwitch: true });
    }
    if (sync && sync.livePreview) {
      workspaceData.livePreview = Object.assign({}, workspaceData.livePreview, sync.livePreview);
      if (sync.runningApplication) {
        workspaceData.runningApplication = sync.runningApplication;
      }
      if (sync.runtimeLivePreviewConnected === true) {
        workspaceData.livePreview.connected = true;
      }
    } else {
      workspaceData.livePreview.connected =
        build.status === 'READY' || meta.connected === true || workspaceData.livePreview.connected;
      workspaceData.livePreview.previewUrl =
        build.previewUrl || meta.previewUrl || workspaceData.livePreview.previewUrl;
      workspaceData.livePreview.buildStatus =
        meta.buildStatusLabel ||
        (build.status === 'READY'
          ? 'READY — ' + (build.workspacePath || build.workspaceId || 'workspace')
          : build.failureReason || build.status || 'Unknown');
      workspaceData.livePreview.onePromptBuild = {
        status: build.status,
        workspaceId: build.workspaceId,
        workspacePath: build.workspacePath,
        generatedProfile: build.generatedProfile,
        buildResult: build.buildResult,
        previewUrl: build.previewUrl,
        failureReason: build.failureReason,
        npmInstallOk: build.npmInstallOk,
        npmBuildOk: build.npmBuildOk,
      };
      var canonicalPanels = resolveCanonicalLivePreviewPanels(workspaceData.livePreview, workspaceData.runningApplication);
      workspaceData.livePreview = canonicalPanels.livePreview;
      workspaceData.runningApplication = canonicalPanels.runningApplication;
    }

    if (build.status === 'READY' || (sync && sync.runtimeLivePreviewConnected)) {
      workspaceData.livePreview.connected = true;
      workspaceData.livePreview.onePromptReady = true;
    }

    workspaceData.activeProjectId = activeProjectId;
    workspaceData.multiProjectWorkspaces = multiProjectWorkspaces;
    applyWorkspace(workspaceData);
    if (build.status === 'READY' && build.previewUrl) {
      switchView('live-preview');
      pushNotification('Live Preview ready — ' + (build.projectName || 'generated app'));
    } else if (build.status === 'FAILED') {
      pushNotification('Build failed — ' + (build.failureReason || 'see Live Preview status'));
    }
  }

  function askBrain(message) {
    showThinking();
    setLastRequestStatus('In progress');
    pushNotification('Brain Request Started');
    clearFeedStreamLog();
    var stopBuildTicker = null;
    if (isOnePromptBuildPrompt(message)) {
      stopBuildTicker = startBuildProgressFeedTicker();
    } else {
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
    }

    fetch('/api/brain/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        timestamp: Date.now(),
        activeProjectId: activeProjectId,
        projectName: getActiveProjectName(),
      }),
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
        if (stopBuildTicker) stopBuildTicker();
        streamOperatorFeedEvents(result.operatorFeedEvents, function () {
          removeThinkingMessage();
          appendChatMessage(result.brainResponse, 'brain');
          if (result.category === 'BUILD') {
            applyOnePromptLivePreview(
              result.onePromptLivePreview,
              result.buildLivePreview,
              result.livePreviewWorkspaceSync,
              {
                activeProjectId: result.activeProjectId,
                multiProjectWorkspaces: result.multiProjectWorkspaces,
              },
            );
            if (result.onePromptLivePreview && result.onePromptLivePreview.status === 'FAILED') {
              setLastRequestStatus('Build failed');
              pushNotification('Build Failed');
              setLastError(result.onePromptLivePreview.failureReason || 'Build failed');
            } else {
              setLastRequestStatus('Completed');
              pushNotification('Brain Request Completed');
              setLastError('None');
            }
          } else {
            setLastRequestStatus('Completed');
            pushNotification('Brain Request Completed');
            setLastError('None');
          }
          renderRuntimeDiagnostics();
          if (result.llmChatBrainDiagnostics) {
            renderLlmChatBrainDiagnostics(result.llmChatBrainDiagnostics);
          }
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
        if (stopBuildTicker) stopBuildTicker();
        removeThinkingMessage();
        var reason = err && err.message ? err.message : 'Brain API unavailable';
        publishFeedFailure(reason);
        appendChatMessage('Brain could not respond — ' + reason, 'system');
        setLastRequestStatus('Failed');
      });
  }

  var FOUNDER_TEST_MAX_SCREEN_MS = 5000;
  var founderTestRunning = false;
  var founderTestRuntimePollId = null;
  var lastRenderedRuntimeFeedKey = '';
  var lastRenderedOperatorTraceKey = '';
  var founderTestUnifiedTraceExpanded = false;
  var lastFounderTestPostTimedOut = false;
  var lastFounderTestReport = null;
  var lastFounderTestRuntimeSnapshot = null;
  var lastFounderTestErrorMessage = null;
  var lastFounderTestPartialReportMarkdown = null;
  var copyReportFeedbackTimer = null;
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

  function resolveActiveFounderTestRunId() {
    return resolveReportHandoffRunId(null, null);
  }

  function resolveActiveFounderTestRuntimeSnapshot() {
    var runId = resolveActiveFounderTestRunId();
    function isActiveSnapshot(snapshot) {
      return (
        snapshot &&
        snapshot.runId &&
        snapshot.state !== 'IDLE' &&
        (!runId || snapshot.runId === runId)
      );
    }
    if (isActiveSnapshot(founderTestRuntimeCardSnapshot)) return founderTestRuntimeCardSnapshot;
    if (isActiveSnapshot(lastKnownActiveFounderTestRuntimeSnapshot)) return lastKnownActiveFounderTestRuntimeSnapshot;
    if (isActiveSnapshot(lastFounderTestRuntimeSnapshot)) return lastFounderTestRuntimeSnapshot;
    if (founderTestRuntimeCardSnapshot && founderTestRuntimeCardSnapshot.runId) {
      return founderTestRuntimeCardSnapshot;
    }
    if (lastKnownActiveFounderTestRuntimeSnapshot) return lastKnownActiveFounderTestRuntimeSnapshot;
    return lastFounderTestRuntimeSnapshot;
  }

  function rememberActiveFounderTestRuntimeSnapshot(runtime) {
    if (!runtime || !runtime.runId) return;
    if (runtime.state !== 'IDLE') {
      lastKnownActiveFounderTestRuntimeSnapshot = runtime;
      founderTestRuntimePinnedRunId = runtime.runId;
      founderTestRuntimeReportBindingMismatch = false;
    }
    lastFounderTestRuntimeSnapshot = runtime;
  }

  function detectFounderTestRuntimeReportMismatch(cardRuntime, reportRuntime) {
    if (!cardRuntime || !reportRuntime) return false;
    if (!cardRuntime.runId || !reportRuntime.runId) return false;
    if (cardRuntime.runId !== reportRuntime.runId) return true;
    var cardActive =
      cardRuntime.state === 'RUNNING' ||
      cardRuntime.state === 'STARTING' ||
      cardRuntime.state === 'COMPLETING' ||
      cardRuntime.state === 'STALLED';
    var reportIdle = reportRuntime.state === 'IDLE' || !reportRuntime.runId;
    return cardActive && reportIdle;
  }

  async function refreshActiveFounderTestReportBinding(reason) {
    var runId = resolveActiveFounderTestRunId();
    if (!runId || founderTestRuntimeReportBindingRefreshInFlight) return null;
    founderTestRuntimeReportBindingRefreshInFlight = true;
    try {
      if (reason) {
        pushNotification('Runtime/report mismatch detected — refreshing active run result.');
      }
      var statusUrl = buildFounderTestRuntimeStatusUrl(runId);
      var statusRes = await fetch(statusUrl, { cache: 'no-store' });
      if (statusRes.ok) {
        rememberFounderTestApiOriginFromUrl(statusUrl);
        var statusData = await statusRes.json();
        if (statusData && statusData.runtime && statusData.runtime.state !== 'IDLE') {
          rememberActiveFounderTestRuntimeSnapshot(statusData.runtime);
          renderFounderTestRuntime(statusData.runtime);
        }
      }
      var resultUrl = buildFounderTestResultFetchUrl(runId);
      var resultRes = await fetch(resultUrl, {
        cache: 'no-store',
      });
      if (resultRes.ok || resultRes.status === 202) {
        rememberFounderTestApiOriginFromUrl(resultUrl);
        var resultData = await resultRes.json();
        applyFounderTestResultPayload(resultData);
        return resultData;
      }
    } catch (refreshErr) {
      /* best-effort refresh */
    } finally {
      founderTestRuntimeReportBindingRefreshInFlight = false;
    }
    return null;
  }

  function waitMs(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function stopFounderTestRuntimePolling() {
    if (founderTestRuntimePollId != null) {
      window.clearInterval(founderTestRuntimePollId);
      founderTestRuntimePollId = null;
    }
  }

  function resolveOperatorTraceStateClass(traceStageStatus) {
    if (traceStageStatus === 'SLOW') return 'trace-slow';
    if (traceStageStatus === 'STALLED') return 'trace-stalled';
    if (traceStageStatus === 'FAILED') return 'trace-failed';
    if (traceStageStatus === 'COMPLETE') return 'trace-complete';
    if (traceStageStatus === 'RUNNING') return 'trace-running';
    return 'trace-idle';
  }

  function renderFounderTestUnifiedRuntimeCard(runtime) {
    var container = el('founder-test-operator-trace');
    if (!container) return;

    if (founderTestRuntimeDismissed) {
      container.setAttribute('hidden', '');
      container.innerHTML = '';
      return;
    }

    var displayRuntime = runtime;
    if (
      (!displayRuntime || displayRuntime.state === 'IDLE' || !displayRuntime.runId) &&
      isOperatorFeedFounderTestMode() &&
      lastKnownActiveFounderTestRuntimeSnapshot &&
      lastKnownActiveFounderTestRuntimeSnapshot.runId
    ) {
      displayRuntime = lastKnownActiveFounderTestRuntimeSnapshot;
    } else if (
      (!displayRuntime || displayRuntime.state === 'IDLE' || !displayRuntime.runId) &&
      isOperatorFeedFounderTestMode() &&
      lastFounderTestRuntimeSnapshot &&
      lastFounderTestRuntimeSnapshot.runId
    ) {
      displayRuntime = lastFounderTestRuntimeSnapshot;
    }

    if (!displayRuntime || !displayRuntime.runId) {
      if (!isOperatorFeedFounderTestMode()) {
        container.setAttribute('hidden', '');
        container.innerHTML = '';
        lastRenderedOperatorTraceKey = '';
      }
      founderTestRuntimeCardSnapshot = null;
      return;
    }

    runtime = displayRuntime;
    founderTestRuntimeCardSnapshot = runtime;
    var publicState = runtime.publicState || runtime.state || 'RUNNING';
    var cardRunId = normalizeFounderTestDeliveryRunId(null, runtime);
    var cardHasLocalReport = hasFounderTestFinalReportAvailable(cardRunId);
    var cardFetchState = getFounderTestFinalReportFetchState(cardRunId);
    var traceStatus =
      cardHasLocalReport && publicState === 'COMPLETE'
        ? 'COMPLETE'
        : publicState === 'REPORT_HANDOFF_PENDING' || runtime.state === 'COMPLETING' || cardFetchState === 'fetching'
          ? 'REPORT_HANDOFF_PENDING'
          : runtime.traceStageStatus || runtime.state || 'RUNNING';
    var stateClass = resolveOperatorTraceStateClass(traceStatus === 'REPORT_HANDOFF_PENDING' ? 'RUNNING' : traceStatus);
    var stageLine =
      runtime.handoffStateLabel ||
      (runtime.uiSummary && runtime.uiSummary.stageLine) ||
      (runtime.progress && runtime.progress.currentStageLabel
        ? 'Stage ' +
          String(runtime.progress.currentStageOrder) +
          '/' +
          String(runtime.progress.totalStages) +
          ' — ' +
          runtime.progress.currentStageLabel
        : 'Stage pending');
    var handoffStatusLabel = resolveFounderTestReportHandoffStatusLabel(runtime, cardRunId);
    var timelineEvents = (runtime.traceEvents || []).slice(-8);
    var fullTraceEvents = runtime.traceEvents || [];
    var traceKey =
      String(runtime.runId) +
      ':' +
      String(traceStatus) +
      ':' +
      String(timelineEvents.length) +
      ':' +
      String(founderTestUnifiedTraceExpanded) +
      ':' +
      (timelineEvents.length ? timelineEvents[timelineEvents.length - 1].traceEventId : '') +
      ':' +
      String(cardHasLocalReport) +
      ':' +
      String(cardFetchState);
    if (traceKey === lastRenderedOperatorTraceKey) return;
    lastRenderedOperatorTraceKey = traceKey;

    function renderEventList(events) {
      var html = '';
      for (var i = 0; i < events.length; i += 1) {
        var event = events[i];
        var eventClass = 'trace-event';
        if (event.status === 'SLOW') eventClass += ' trace-event-slow';
        if (event.status === 'STALLED') eventClass += ' trace-event-stalled';
        if (event.status === 'FAILED') eventClass += ' trace-event-failed';
        if (event.status === 'COMPLETE' || event.status === 'PASSED') eventClass += ' trace-event-complete';
        html +=
          '<li class="' +
          eventClass +
          '">' +
          escapeHtml(event.displayLine || event.operationLabel) +
          '</li>';
      }
      return html;
    }

    var isComplete = isFounderTestPublicCompleteWithReport(runtime, cardRunId);
    var actionLabels = resolveFounderTestOperatorFeedReportActionLabels(runtime);
    var copyReportLabel = actionLabels.copy;
    var openReportLabel = actionLabels.open;
    var reportButtonsDisabled = actionLabels.enabled === false;
    var showRetryFetch =
      cardFetchState === 'failed' ||
      founderTestReportHandoffStalled ||
      founderTestRuntimeReportFetchFailed;

    var detailsHtml = '';
    if (!isComplete && runtime.missingCompletionBoundary) {
      detailsHtml +=
        '<div class="founder-test-unified-boundary"><dt>Missing boundary</dt><dd>' +
        escapeHtml(runtime.missingCompletionBoundary) +
        '</dd></div>';
    }
    if (!isComplete && runtime.stage2CompletionGapReason) {
      detailsHtml +=
        '<div class="founder-test-operator-trace-stall"><dt>Stage 2 gap</dt><dd>' +
        escapeHtml(runtime.stage2CompletionGapReason) +
        '</dd></div>';
    }
    if (founderTestRuntimeReportBindingMismatch) {
      detailsHtml +=
        '<div class="founder-test-operator-trace-stall"><dt>Report binding</dt><dd>Runtime/report mismatch detected — refreshing active run result.</dd></div>';
    }
    if (!isComplete && runtime.stallReason) {
      detailsHtml +=
        '<div class="founder-test-operator-trace-stall"><dt>Stall reason</dt><dd>' +
        escapeHtml(runtime.stallReason) +
        '</dd></div>';
    }

    container.removeAttribute('hidden');
    container.className = 'founder-test-operator-trace founder-test-unified-runtime ' + stateClass;
    syncOperatorFeedLayout(runtime);
    container.innerHTML =
      '<div class="founder-test-operator-trace-header">' +
      '<h3>Founder Test Runtime</h3>' +
      '<span class="founder-test-operator-trace-badge">' +
      escapeHtml(String(traceStatus)) +
      '</span></div>' +
      '<p class="founder-test-unified-run-id">Run ID: ' +
      escapeHtml(String(runtime.runId)) +
      '</p>' +
      '<div class="founder-test-unified-status">' +
      '<p class="founder-test-unified-stage">' +
      escapeHtml(stageLine) +
      '</p>' +
      '<p class="founder-test-unified-elapsed">' +
      escapeHtml((runtime.uiSummary && runtime.uiSummary.elapsedLine) || 'Elapsed: —') +
      '</p></div>' +
      '<dl class="founder-test-operator-trace-meta founder-test-unified-operations">' +
      '<div><dt>Handoff state</dt><dd>' +
      escapeHtml(runtime.handoffStateLabel || '—') +
      '</dd></div>' +
      '<div><dt>Current operation</dt><dd>' +
      escapeHtml(runtime.currentOperation || '—') +
      '</dd></div>' +
      '<div><dt>Last completed</dt><dd>' +
      escapeHtml(runtime.lastCompletedOperation || '—') +
      '</dd></div>' +
      '<div><dt>Next expected</dt><dd>' +
      escapeHtml(runtime.nextExpectedOperation || '—') +
      '</dd></div>' +
      detailsHtml +
      '</dl>' +
      '<div class="founder-test-unified-scroll">' +
      '<p class="founder-test-unified-section-label">Progress timeline</p>' +
      '<ul class="founder-test-operator-trace-events founder-test-unified-timeline" aria-label="Latest founder test runtime events">' +
      renderEventList(timelineEvents) +
      '</ul>' +
      (founderTestUnifiedTraceExpanded
        ? '<ul class="founder-test-operator-trace-events founder-test-unified-full-trace" aria-label="Full founder test runtime trace">' +
          renderEventList(fullTraceEvents) +
          '</ul>'
        : '') +
      '</div>' +
      (handoffStatusLabel
        ? '<p class="founder-test-report-handoff-status" id="founder-test-report-handoff-status">' +
          escapeHtml(handoffStatusLabel) +
          '</p>'
        : '<p class="founder-test-report-handoff-status" id="founder-test-report-handoff-status" hidden></p>') +
      '<div class="founder-test-runtime-report-actions">' +
      '<button type="button" class="founder-test-runtime-action-btn" id="founder-test-copy-latest-report"' +
      (reportButtonsDisabled ? ' disabled aria-disabled="true"' : '') +
      '>' +
      escapeHtml(copyReportLabel) +
      '</button>' +
      '<button type="button" class="founder-test-runtime-action-btn" id="founder-test-open-report"' +
      (reportButtonsDisabled ? ' disabled aria-disabled="true"' : '') +
      '>' +
      escapeHtml(openReportLabel) +
      '</button>' +
      (showRetryFetch
        ? '<button type="button" class="founder-test-runtime-action-btn" id="founder-test-retry-fetch-result">Retry Fetch Result</button>'
        : '<button type="button" class="founder-test-runtime-action-btn" id="founder-test-retry-fetch-result" hidden>Retry Fetch Result</button>') +
      '<button type="button" class="founder-test-runtime-action-btn founder-test-runtime-dismiss-btn" id="founder-test-dismiss-runtime">Dismiss</button>' +
      '</div>' +
      '<button type="button" class="founder-test-unified-trace-toggle" id="founder-test-unified-trace-toggle">' +
      (founderTestUnifiedTraceExpanded ? 'Hide full trace' : 'Show full trace') +
      '</button>';

    wireFounderTestRuntimeCardActions(runtime);

    var toggleBtn = el('founder-test-unified-trace-toggle');
    if (toggleBtn) {
      toggleBtn.onclick = function () {
        founderTestUnifiedTraceExpanded = !founderTestUnifiedTraceExpanded;
        lastRenderedOperatorTraceKey = '';
        renderFounderTestUnifiedRuntimeCard(runtime);
      };
    }
  }

  function wireFounderTestRuntimeCardActions(runtime) {
    var copyBtn = el('founder-test-copy-latest-report');
    if (copyBtn) {
      copyBtn.onclick = function () {
        copyLatestFounderTestReport(copyBtn);
      };
    }
    var openBtn = el('founder-test-open-report');
    if (openBtn) {
      openBtn.onclick = function () {
        openFounderTestReportModal();
      };
    }
    var retryBtn = el('founder-test-retry-fetch-result');
    if (retryBtn) {
      retryBtn.onclick = function () {
        retryFetchFounderTestResult(retryBtn);
      };
    }
    var dismissBtn = el('founder-test-dismiss-runtime');
    if (dismissBtn) {
      dismissBtn.onclick = function () {
        dismissOperatorFeedFounderTestMode();
      };
    }
  }

  function copyLatestFounderTestReport(buttonEl) {
    copyFounderTestReportHandoffShared({
      feedbackButton: buttonEl,
      resetOperatorFeedLabels: true,
      syncOperatorFeedLabels: true,
    });
  }

  function openFounderTestReportModal() {
    openFounderTestReportHandoffShared();
  }

  function hideFounderTestReportModal() {
    var modal = el('founder-test-report-modal');
    if (!modal) return;
    modal.setAttribute('hidden', '');
    modal.setAttribute('aria-hidden', 'true');
  }

  function applyFounderTestResultPayload(data) {
    if (!data) return;
    var runId = normalizeFounderTestDeliveryRunId(data.runId, data.runtime);
    var markdown = data.reportMarkdown || (data.report && data.report.reportMarkdown) || null;
    if (markdown && isFounderTestFinalReportMarkdown(markdown)) {
      applyFounderTestFinalReport(runId, markdown, 'result-endpoint', {
        runtime: data.runtime,
        reportObject: data.report || null,
        generatedAt: data.generatedAt,
      });
      return;
    }
    if (data.runtime) {
      rememberActiveFounderTestRuntimeSnapshot(data.runtime);
      renderFounderTestRuntime(data.runtime);
    }
    var completeSuccess =
      isFounderTestCompleteSuccessState(data.state) ||
      (data.runtime && isFounderTestCompleteSuccessState(data.runtime.state));
    if (data.partialReportMarkdown && isFounderTestFinalReportMarkdown(data.partialReportMarkdown)) {
      lastFounderTestPartialReportMarkdown = data.partialReportMarkdown;
    }
    if (!completeSuccess) {
      if (data.partialReportMarkdown) {
        lastFounderTestPartialReportMarkdown = data.partialReportMarkdown;
      }
      if (data.failureReportMarkdown && !lastFounderTestPartialReportMarkdown) {
        lastFounderTestPartialReportMarkdown = data.failureReportMarkdown;
      }
      if (data.runtimeDiagnosticMarkdown && !lastFounderTestPartialReportMarkdown) {
        lastFounderTestPartialReportMarkdown = data.runtimeDiagnosticMarkdown;
      }
    }
    updateCopyReportButtonState();
  }

  async function retryFetchFounderTestResult(buttonEl) {
    var cardRuntime = founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot();
    var runId = coerceReportHandoffRunId(null, cardRuntime);
    if (!runId) {
      pushNotification('No founder test runId available to retry');
      return;
    }
    if (buttonEl) {
      buttonEl.disabled = true;
      buttonEl.textContent = 'Fetching…';
    }
    founderTestRuntimeReportFetchFailed = false;
    founderTestReportHandoffStalled = false;
    try {
      var fetchResult = await fetchFounderTestResultWithRetry(runId, FOUNDER_TEST_RESULT_FETCH_MAX_ATTEMPTS);
      if (fetchResult && fetchResult.data && !fetchResult.fetchFailed) {
        applyFounderTestResultPayload(fetchResult.data);
        if (buttonEl) buttonEl.textContent = 'Fetched';
      } else if (fetchResult && fetchResult.fetchFailed) {
        markFounderTestFinalReportFetchFailed(runId);
        founderTestReportHandoffStalled = true;
        refreshFounderTestFinalReportDeliverySurfaces(cardRuntime);
        if (buttonEl) buttonEl.textContent = 'Fetch failed';
      } else if (buttonEl) {
        buttonEl.textContent = 'Not ready';
      }
    } catch (fetchErr) {
      if (buttonEl) buttonEl.textContent = 'Fetch failed';
      markFounderTestFinalReportFetchFailed(runId);
      founderTestReportHandoffStalled = true;
      refreshFounderTestFinalReportDeliverySurfaces(cardRuntime);
      pushNotification('Retry fetch failed — ' + (fetchErr && fetchErr.message ? fetchErr.message : 'unknown error'));
    } finally {
      if (buttonEl) {
        buttonEl.disabled = false;
        window.setTimeout(function () {
          buttonEl.textContent = 'Retry Fetch Result';
        }, 2200);
      }
    }
  }

  function maybeDeliverRunningDiagnosticNotification() {
    if (founderTestRunningDiagnosticDelivered || founderTestRuntimeDismissed) return;
    if (!founderTestRunStartedAt || !lastFounderTestRuntimeSnapshot || !lastFounderTestRuntimeSnapshot.runId) return;
    var runtime = lastFounderTestRuntimeSnapshot;
    var terminalStates = { COMPLETE: true, FAILED: true, CANCELLED: true, STALLED: true };
    if (terminalStates[runtime.state]) return;
    if (Date.now() - founderTestRunStartedAt < FOUNDER_TEST_RUNNING_DIAGNOSTIC_MS) return;
    var delivered = deliverFounderTestReportNotification({
      title: 'Founder Test Still Running — Diagnostic Available',
      data: { runId: runtime.runId, state: 'RUNNING' },
      runtime: runtime,
    });
    if (delivered) founderTestRunningDiagnosticDelivered = true;
  }

  function renderFounderTestOperatorFeedTrace(runtime) {
    renderFounderTestUnifiedRuntimeCard(runtime);
  }

  function renderFounderTestRuntime(runtime) {
    var btn = el('run-founder-test');
    var btnLabel = el('founder-test-btn-label');
    var btnHint = el('founder-test-btn-hint');
    if (!runtime) {
      if (!isOperatorFeedFounderTestMode()) {
        if (btn) btn.classList.remove('is-running');
        if (btnLabel) btnLabel.textContent = 'Run Founder Test';
        if (btnHint) btnHint.textContent = 'Complete founder validation — one report, one verdict.';
        lastRenderedRuntimeFeedKey = '';
        renderFounderTestUnifiedRuntimeCard(null);
      }
      return;
    }

    activateOperatorFeedFounderTestMode(runtime);
    var ui = runtime.uiSummary || {};
    var running =
      runtime.state === 'RUNNING' ||
      runtime.state === 'STARTING' ||
      runtime.state === 'COMPLETING' ||
      runtime.state === 'STALLED';
    if (btn) {
      btn.disabled = running;
      btn.classList.toggle('is-running', running);
    }
    if (btnLabel) {
      btnLabel.textContent = running ? 'Running Founder Test...' : 'Run Founder Test';
    }
    if (btnHint) {
      btnHint.textContent = running
        ? ui.stageLine || 'Founder Test in progress — see Operator Feed runtime card.'
        : runtime.state === 'COMPLETE'
          ? resolveFounderTestCompleteHeaderHint(runtime) || 'Founder Test complete — preparing report.'
          : runtime.state === 'FAILED'
            ? 'Founder Test failed — copy runtime failure report for diagnostics.'
            : 'Complete founder validation — one report, one verdict.';
    }
    renderFounderTestUnifiedRuntimeCard(runtime);
  }

  function renderLocalFounderTestRuntimePreview(stageLine) {
    if (!localFounderTestPreviewRunId) {
      localFounderTestPreviewRunId = 'local-preview-' + String(Date.now());
    }
    renderFounderTestRuntime({
      runId: localFounderTestPreviewRunId,
      uiSummary: {
        headline: 'Running Founder Test...',
        stageLine: stageLine || 'Preparing local checks',
        elapsedLine: 'Elapsed: —',
        remainingLine: 'Remaining: —',
      },
      feed: { events: [] },
      state: 'RUNNING',
      progress: { currentStageOrder: 0, totalStages: 11, currentStageLabel: stageLine },
    });
  }

  async function waitForFounderTestAsyncResult(runId) {
    var deadline = Date.now() + 20 * 60 * 1000;
    var terminalStates = { COMPLETE: true, FAILED: true, CANCELLED: true, STALLED: true };
    while (Date.now() < deadline) {
      await pollFounderTestRuntimeStatusOnce();
      var runtime = lastFounderTestRuntimeSnapshot;
      if (runtime && terminalStates[runtime.state]) {
        break;
      }
      await new Promise(function (resolve) {
        window.setTimeout(resolve, 800);
      });
    }
    var resultUrl = buildFounderTestResultFetchUrl(runId);
    var resultRes = await fetch(resultUrl, { cache: 'no-store' });
    rememberFounderTestApiOriginFromUrl(resultUrl);
    if (!resultRes.ok && resultRes.status !== 202) {
      var stalledRuntime = lastFounderTestRuntimeSnapshot;
      var stalledState =
        stalledRuntime && isFounderTestCompleteSuccessState(stalledRuntime.state)
          ? 'COMPLETE'
          : stalledRuntime && stalledRuntime.state === 'STALLED'
            ? 'STALLED'
            : 'FAILED';
      deliverFounderTestReportNotification({
        data: {
          runId: runId,
          state: stalledState,
          error: 'Founder test result not ready (HTTP ' + String(resultRes.status) + ').',
          failureReportMarkdown:
            stalledRuntime && isFounderTestCompleteSuccessState(stalledRuntime.state)
              ? buildCompleteFounderTestHandoffDiagnostic(
                  stalledRuntime,
                  runId,
                  'Founder test result not ready (HTTP ' + String(resultRes.status) + ').',
                )
              : null,
        },
        runtime: stalledRuntime,
        errorMessage: 'Founder test result not ready (HTTP ' + String(resultRes.status) + ').',
      });
      throw new Error('Founder test result not ready (HTTP ' + String(resultRes.status) + ').');
    }
    var data = await resultRes.json();
    if (
      isFounderTestCompleteSuccessState(data.state) ||
      (data.runtime && isFounderTestCompleteSuccessState(data.runtime.state))
    ) {
      if (!data.reportMarkdown && !(data.report && data.report.reportMarkdown)) {
        for (var retry = 0; retry < FOUNDER_TEST_RESULT_FETCH_MAX_ATTEMPTS; retry += 1) {
          await waitMs(FOUNDER_TEST_RESULT_FETCH_DELAY_MS);
          resultRes = await fetch(buildFounderTestResultFetchUrl(runId), { cache: 'no-store' });
          if (!resultRes.ok && resultRes.status !== 202) break;
          data = await resultRes.json();
          if (data.reportMarkdown || (data.report && data.report.reportMarkdown)) break;
        }
      }
    }
    applyFounderTestResultPayload(data);
    return data;
  }

  async function pollFounderTestRuntimeStatusOnce() {
    try {
      var activeRunId = resolveActiveFounderTestRunId();
      var statusUrl = buildFounderTestRuntimeStatusUrl(activeRunId);
      var res = await fetch(statusUrl, { cache: 'no-store' });
      if (!res.ok) return null;
      rememberFounderTestApiOriginFromUrl(statusUrl);
      var data = await res.json();
      if (data && data.runtime) {
        if (
          data.runtime.state === 'IDLE' &&
          activeRunId &&
          lastKnownActiveFounderTestRuntimeSnapshot &&
          lastKnownActiveFounderTestRuntimeSnapshot.runId === activeRunId
        ) {
          founderTestRuntimeReportBindingMismatch = true;
          lastRenderedOperatorTraceKey = '';
          renderFounderTestUnifiedRuntimeCard(lastKnownActiveFounderTestRuntimeSnapshot);
          refreshActiveFounderTestReportBinding(false);
          return lastKnownActiveFounderTestRuntimeSnapshot;
        }
        rememberActiveFounderTestRuntimeSnapshot(data.runtime);
        renderFounderTestRuntime(data.runtime);
        if (data.runtime.publicState === 'COMPLETE' || isFounderTestCompleteSuccessState(data.runtime.state)) {
          var pollRunId = normalizeFounderTestDeliveryRunId(activeRunId, data.runtime);
          scheduleFounderTestReportHandoffStallGuard(pollRunId, data.runtime);
          if (
            !hasFounderTestFinalReportAvailable(pollRunId) &&
            getFounderTestFinalReportFetchState(pollRunId) !== 'fetching' &&
            !founderTestOperatorFeedReportFetchInFlight
          ) {
            markFounderTestFinalReportFetching(pollRunId);
            updateFounderTestOperatorFeedReportActionLabels(data.runtime);
            fetchFounderTestResultWithRetry(pollRunId, FOUNDER_TEST_RESULT_FETCH_MAX_ATTEMPTS).then(
              function (fetchResult) {
                var markdown =
                  (fetchResult &&
                    fetchResult.data &&
                    (fetchResult.data.reportMarkdown ||
                      (fetchResult.data.report && fetchResult.data.report.reportMarkdown))) ||
                  null;
                if (markdown) {
                  applyFounderTestFinalReport(pollRunId, markdown, 'poll-result-fetch', {
                    runtime: fetchResult.data.runtime || data.runtime,
                    reportObject: fetchResult.data.report || null,
                    generatedAt: fetchResult.data.generatedAt,
                  });
                } else if (fetchResult && fetchResult.fetchFailed) {
                  markFounderTestFinalReportFetchFailed(pollRunId);
                  founderTestReportHandoffStalled = true;
                  refreshFounderTestFinalReportDeliverySurfaces(data.runtime);
                } else {
                  founderTestOperatorFeedReportFetching = false;
                  founderTestOperatorFeedReportFetchInFlight = false;
                }
              },
            );
          }
        }
        maybeDeliverRunningDiagnosticNotification();
        return data.runtime;
      }
    } catch (pollErr) {
      /* polling is best-effort */
    }
    return null;
  }

  function startFounderTestRuntimePolling() {
    stopFounderTestRuntimePolling();
    founderTestRuntimePollId = window.setInterval(function () {
      pollFounderTestRuntimeStatusOnce();
    }, 800);
  }

  function showFounderTestPanel(mode) {
    var panel = el('founder-test-panel');
    if (panel) {
      panel.removeAttribute('hidden');
      panel.setAttribute('aria-hidden', 'false');
    }
    var status = el('founder-test-status');
    if (!status) return;
    if (mode === 'running') {
      status.textContent = 'RUNNING — one button, one execution, one report (read-only)';
    } else if (mode === 'done') {
      status.textContent = hasFounderTestFinalReportAvailable(resolveActiveFounderTestRunId())
        ? 'COMPLETE — unified launch-readiness report ready'
        : founderTestReportHandoffStalled
          ? 'COMPLETE — report handoff stalled (diagnostic available)'
          : 'COMPLETE — preparing final report';
    } else if (mode === 'error') {
      status.textContent = 'FAILED — founder test did not complete';
    } else {
      status.textContent = 'READY — press Run Founder Test';
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
    var launchReadiness = report.launchReadiness || report.founderTestLaunchReadiness || null;
    var isV3 = report.mode === 'founder-testing-v3' || isV4;
    var isV2 = report.mode === 'founder-testing-v2' || isV3;
    var blockers = (report.issues || []).filter(function (i) {
      return i.severity === 'BLOCKER';
    });
    var highs = (report.issues || []).filter(function (i) {
      return i.severity === 'HIGH';
    });

    var html = '<div class="founder-test-summary">';
    if (launchReadiness) {
      html +=
        '<p class="founder-test-mode">Phase 25.19 — One Button Founder Test Integration</p>' +
        '<p class="founder-test-score">Founder Readiness Score: <strong>' +
        String(launchReadiness.founderReadinessScore) +
        '/100</strong></p>' +
        '<p class="founder-test-score">Launch Readiness: <strong>' +
        escapeHtml(launchReadiness.launchReadinessVerdict) +
        '</strong></p>' +
        '<p class="founder-test-score">Founder Acceptance: <strong>' +
        escapeHtml(launchReadiness.founderAcceptanceState) +
        '</strong></p>' +
        '<p class="founder-test-score">Confidence: <strong>' +
        escapeHtml(launchReadiness.confidenceLevel) +
        '</strong></p>' +
        '<p class="founder-test-score">Blockers: <strong>' +
        String((launchReadiness.topBlockers || []).length) +
        '</strong> · Warnings: <strong>' +
        String((launchReadiness.topWarnings || []).length) +
        '</strong></p>';
      if (launchReadiness.chatStressSimulation) {
        var chatStress = launchReadiness.chatStressSimulation;
        html +=
          '<div class="founder-test-chat-stress"><h4>Chat Stress Simulation</h4>' +
          '<p>Overall chat score: <strong>' +
          String(chatStress.overallScore) +
          '/100</strong> · Passed: <strong>' +
          String(chatStress.passedCount) +
          '</strong> · Failed: <strong>' +
          String(chatStress.failedCount) +
          '</strong> · Weak: <strong>' +
          String(chatStress.weakCount) +
          '</strong></p>' +
          '<p>Chat blocks launch readiness: <strong>' +
          (chatStress.chatBlocksLaunchReadiness ? 'YES' : 'NO') +
          '</strong> · Self-evolution required: <strong>' +
          (chatStress.selfEvolutionRequired ? 'YES' : 'NO') +
          '</strong></p>';
        var failedOrWeak = (chatStress.failedAnswers || []).concat(chatStress.weakAnswers || []);
        if (failedOrWeak.length) {
          html += '<ul class="chat-stress-failures">';
          for (var cs = 0; cs < Math.min(failedOrWeak.length, 6); cs += 1) {
            var entry = failedOrWeak[cs];
            html +=
              '<li><strong>Prompt:</strong> ' +
              escapeHtml(entry.prompt) +
              '<br><strong>Answer:</strong> ' +
              escapeHtml(entry.actualAnswer.slice(0, 220)) +
              (entry.actualAnswer.length > 220 ? '…' : '') +
              '<br><strong>Failure:</strong> ' +
              escapeHtml((entry.failureReasons || []).join('; ') || entry.band) +
              (entry.missingCapability
                ? '<br><strong>Missing:</strong> ' + escapeHtml(entry.missingCapability)
                : '') +
              (entry.recommendedFix
                ? '<br><strong>Fix:</strong> ' + escapeHtml(entry.recommendedFix)
                : '') +
              '</li>';
          }
          html += '</ul>';
        }
        if (chatStress.repeatedFailurePatterns && chatStress.repeatedFailurePatterns.length) {
          html += '<p><strong>Repeated patterns:</strong> ' +
            escapeHtml(
              chatStress.repeatedFailurePatterns
                .slice(0, 3)
                .map(function (p) {
                  return p.pattern + ' (' + p.count + '×)';
                })
                .join(' · '),
            ) +
            '</p>';
        }
        html += '</div>';
      }
      if (launchReadiness.productReadinessSimulation) {
        var pr = launchReadiness.productReadinessSimulation;
        html +=
          '<div class="founder-test-product-readiness"><h4>Full Product Readiness Simulation</h4>' +
          '<p>Readiness score: <strong>' +
          String(pr.readinessScore) +
          '/100</strong> · Verdict: <strong>' +
          escapeHtml(String(pr.verdict).replace(/_/g, ' ')) +
          '</strong> · Launch blocked: <strong>' +
          (pr.launchBlocked ? 'YES' : 'NO') +
          '</strong></p>' +
          '<table class="product-readiness-table"><thead><tr><th>Simulation</th><th>Score</th><th>Top failure</th></tr></thead><tbody>';
        for (var pi = 0; pi < Math.min(pr.simulations.length, 8); pi += 1) {
          var ps = pr.simulations[pi];
          html +=
            '<tr><td>' +
            escapeHtml(ps.label) +
            '</td><td>' +
            String(ps.score) +
            '</td><td>' +
            escapeHtml(ps.topFailures[0] || '—') +
            '</td></tr>';
        }
        html += '</tbody></table>';
        if (pr.selfEvolution && pr.selfEvolution.whatShouldWeBuildNext.length) {
          html += '<p><strong>Build next:</strong> ' +
            escapeHtml(pr.selfEvolution.whatShouldWeBuildNext.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (launchReadiness.connectedBuildExecution) {
        var cbe = launchReadiness.connectedBuildExecution;
        html +=
          '<div class="founder-test-connected-build"><h4>Connected Build Execution</h4>' +
          '<p>Materialization: <strong>' +
          escapeHtml(cbe.materializationLevel || '—') +
          '</strong> · Artifacts: <strong>' +
          escapeHtml(cbe.artifactEvidenceLevel || '—') +
          '</strong> · Linkage: <strong>' +
          (cbe.linkageConnected ? 'CONNECTED' : 'BROKEN') +
          '</strong></p>' +
          '<p>Generated artifacts: <strong>' +
          (cbe.canProveGeneratedArtifacts ? 'YES' : 'NO') +
          '</strong> · Workspace: <strong>' +
          (cbe.canProveWorkspaceCreation ? 'YES' : 'NO') +
          '</strong> · Materialization: <strong>' +
          (cbe.canProveBuildMaterialization ? 'YES' : 'NO') +
          '</strong></p>';
        if (cbe.missingBuildEvidence && cbe.missingBuildEvidence.length) {
          html +=
            '<p><strong>Missing evidence:</strong> ' +
            escapeHtml(cbe.missingBuildEvidence.slice(0, 5).join(' · ')) +
            '</p>';
        }
        if (cbe.whatShouldBeBuiltNext) {
          html += '<p><strong>Build next:</strong> ' + escapeHtml(cbe.whatShouldBeBuiltNext) + '</p>';
        }
        html += '</div>';
      }
      if (launchReadiness.connectedRuntimeActivationProof) {
        var cra = launchReadiness.connectedRuntimeActivationProof;
        html +=
          '<div class="founder-test-connected-runtime"><h4>Connected Runtime Activation Proof</h4>' +
          '<p>Runtime proof: <strong>' +
          escapeHtml(cra.runtimeProofLevel || '—') +
          '</strong> · State: <strong>' +
          escapeHtml(cra.runtimeActivationState || '—') +
          '</strong> · Linkage: <strong>' +
          (cra.linkage.runtimeLinkageConnected ? 'CONNECTED' : 'BROKEN') +
          '</strong></p>' +
          '<p>Can start app: <strong>' +
          (cra.founderQuestions.canApplicationRun ? 'YES' : 'NO') +
          '</strong> · Reachable: <strong>' +
          (cra.founderQuestions.canRuntimeBeReached ? 'YES' : 'NO') +
          '</strong></p>';
        if (cra.founderQuestions.commandUsed) {
          html +=
            '<p>Command: <code>' + escapeHtml(cra.founderQuestions.commandUsed) + '</code></p>';
        }
        if (cra.founderQuestions.portOrUrlObserved) {
          html +=
            '<p>URL: <code>' + escapeHtml(cra.founderQuestions.portOrUrlObserved) + '</code></p>';
        }
        if (cra.founderQuestions.exactMissingRuntimeEvidence.length) {
          html +=
            '<p><strong>Missing evidence:</strong> ' +
            escapeHtml(cra.founderQuestions.exactMissingRuntimeEvidence.slice(0, 4).join(' · ')) +
            '</p>';
        }
        if (cra.founderQuestions.whatShouldBeBuiltNext.length) {
          html +=
            '<p><strong>Build next:</strong> ' +
            escapeHtml(cra.founderQuestions.whatShouldBeBuiltNext[0]) +
            '</p>';
        }
        html += '</div>';
      }
      if (launchReadiness.connectedPreviewExperienceProof) {
        var cpe = launchReadiness.connectedPreviewExperienceProof;
        html +=
          '<div class="founder-test-connected-preview"><h4>Connected Preview Experience Proof</h4>' +
          '<p>Preview proof: <strong>' +
          escapeHtml(cpe.previewProofLevel || '—') +
          '</strong> · State: <strong>' +
          escapeHtml(cpe.previewState || '—') +
          '</strong> · Linkage: <strong>' +
          (cpe.linkage.previewLinkageConnected ? 'CONNECTED' : 'BROKEN') +
          '</strong></p>' +
          '<p>Founder can see app: <strong>' +
          (cpe.founderQuestions.canFounderSeeApp ? 'YES' : 'NO') +
          '</strong> · Can interact: <strong>' +
          (cpe.founderQuestions.canFounderInteractWithApp ? 'YES' : 'NO') +
          '</strong></p>';
        if (cpe.url.previewUrl) {
          html += '<p>Preview URL: <code>' + escapeHtml(cpe.url.previewUrl) + '</code></p>';
        }
        if (cpe.founderQuestions.whatEvidenceMissing.length) {
          html +=
            '<p><strong>Missing evidence:</strong> ' +
            escapeHtml(cpe.founderQuestions.whatEvidenceMissing.slice(0, 4).join(' · ')) +
            '</p>';
        }
        if (cpe.founderQuestions.whatShouldBeBuiltNext.length) {
          html +=
            '<p><strong>Build next:</strong> ' +
            escapeHtml(cpe.founderQuestions.whatShouldBeBuiltNext[0]) +
            '</p>';
        }
        html += '</div>';
      }
      if (launchReadiness.connectedVerificationExecutionProof) {
        var cve = launchReadiness.connectedVerificationExecutionProof;
        html +=
          '<div class="founder-test-connected-verification"><h4>Connected Verification Execution Proof</h4>' +
          '<p>Verification proof: <strong>' +
          escapeHtml(cve.verificationProofLevel || '—') +
          '</strong> · State: <strong>' +
          escapeHtml(cve.verificationState || '—') +
          '</strong> · Readiness: <strong>' +
          escapeHtml(cve.readiness.readinessState || '—') +
          '</strong></p>' +
          '<p>App verified: <strong>' +
          (cve.founderQuestions.wasGeneratedAppVerified ? 'YES' : 'NO') +
          '</strong> · Trust verification: <strong>' +
          (cve.founderQuestions.canVerificationBeTrusted ? 'YES' : 'NO') +
          '</strong></p>';
        if (cve.results.passCount || cve.results.failCount) {
          html +=
            '<p>Pass/Fail: <strong>' +
            String(cve.results.passCount) +
            '</strong> / <strong>' +
            String(cve.results.failCount) +
            '</strong></p>';
        }
        if (cve.founderQuestions.whatEvidenceMissing.length) {
          html +=
            '<p><strong>Missing evidence:</strong> ' +
            escapeHtml(cve.founderQuestions.whatEvidenceMissing.slice(0, 4).join(' · ')) +
            '</p>';
        }
        if (cve.founderQuestions.whatShouldBeBuiltNext.length) {
          html +=
            '<p><strong>Build next:</strong> ' +
            escapeHtml(cve.founderQuestions.whatShouldBeBuiltNext[0]) +
            '</p>';
        }
        html += '</div>';
      }
      if (launchReadiness.connectedLaunchReadinessProof) {
        var clr = launchReadiness.connectedLaunchReadinessProof;
        html +=
          '<div class="founder-test-connected-launch"><h4>Connected Launch Readiness Proof</h4>' +
          '<p>Launch proof: <strong>' +
          escapeHtml(clr.launchProofLevel || '—') +
          '</strong> · State: <strong>' +
          escapeHtml(clr.launchState || '—') +
          '</strong> · Linkage: <strong>' +
          (clr.linkage.launchLinkageConnected ? 'CONNECTED' : 'BROKEN') +
          '</strong></p>' +
          '<p>Launch ready: <strong>' +
          (clr.founderQuestions.areWeLaunchReady ? 'YES' : 'NO') +
          '</strong> · Critical blockers: <strong>' +
          String(clr.blockers.criticalCount) +
          '</strong></p>';
        if (clr.founderQuestions.whatBlocksLaunch.length) {
          html +=
            '<p><strong>Blocks launch:</strong> ' +
            escapeHtml(clr.founderQuestions.whatBlocksLaunch.slice(0, 3).join(' · ')) +
            '</p>';
        }
        if (clr.founderQuestions.whatMustBeFixedNext.length) {
          html +=
            '<p><strong>Fix next:</strong> ' +
            escapeHtml(clr.founderQuestions.whatMustBeFixedNext[0]) +
            '</p>';
        }
        html += '</div>';
      }
      if (launchReadiness.autonomousBuildExecutionProof) {
        var ep = launchReadiness.autonomousBuildExecutionProof;
        html +=
          '<div class="founder-test-execution-proof"><h4>Autonomous Build Execution Proof</h4>' +
          '<p>Chain connected: <strong>' +
          (ep.chainConnected ? 'YES' : 'NO') +
          '</strong> · First break: <strong>' +
          escapeHtml(ep.firstBrokenStage || '—') +
          '</strong> · Launch blocked: <strong>' +
          (ep.launchBlockedByChain ? 'YES' : 'NO') +
          '</strong></p>' +
          '<table class="execution-proof-table"><thead><tr><th>Stage</th><th>Proof</th><th>Score</th></tr></thead><tbody>';
        for (var ei = 0; ei < ep.stageProofs.length; ei += 1) {
          var st = ep.stageProofs[ei];
          html +=
            '<tr><td>' +
            escapeHtml(st.stage) +
            '</td><td>' +
            escapeHtml(st.proofLevel) +
            '</td><td>' +
            String(st.score) +
            '</td></tr>';
        }
        html += '</tbody></table>';
        if (ep.recommendedFix) {
          html += '<p><strong>Recommended fix:</strong> ' + escapeHtml(ep.recommendedFix) + '</p>';
        }
        html += '</div>';
      }
      if (launchReadiness.topBlockers && launchReadiness.topBlockers.length) {
        html += '<div class="founder-test-blockers"><h4>Top launch blockers</h4><ul>';
        for (var lb = 0; lb < Math.min(launchReadiness.topBlockers.length, 5); lb += 1) {
          var blocker = launchReadiness.topBlockers[lb];
          html +=
            '<li><strong>' +
            escapeHtml(blocker.sourceAuthority) +
            ':</strong> ' +
            escapeHtml(blocker.explanation) +
            '</li>';
        }
        html += '</ul></div>';
      }
      if (launchReadiness.topRecommendedActions && launchReadiness.topRecommendedActions.length) {
        html += '<div class="founder-test-next"><h4>Top recommended actions</h4><ul>';
        for (var ra = 0; ra < Math.min(launchReadiness.topRecommendedActions.length, 5); ra += 1) {
          html +=
            '<li>' +
            escapeHtml(launchReadiness.topRecommendedActions[ra].action) +
            '</li>';
        }
        html += '</ul></div>';
      }
      html +=
        '<p class="hint"><button type="button" class="btn-secondary" id="view-founder-test-full-report">View Full Report</button></p>' +
        '<pre class="founder-test-full-report hidden" id="founder-test-full-report"></pre>';
    }
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
      if (report.v4 && report.v4.chatIntelligenceReality) {
        var chatIntel = report.v4.chatIntelligenceReality;
        html +=
          '<div class="founder-test-blockers"><h4>Chat Intelligence</h4>' +
          '<p class="founder-test-score">Score: <strong>' +
          String(chatIntel.chatIntelligenceScore) +
          '/100</strong> · Verdict: <strong>' +
          escapeHtml(chatIntel.chatLaunchVerdict) +
          '</strong> · Blocks launch: <strong>' +
          (chatIntel.blocksLaunchReadiness ? 'Yes' : 'No') +
          '</strong></p>';
        if (chatIntel.failedScenarios.length) {
          html += '<ul>';
          for (var cf = 0; cf < Math.min(chatIntel.failedScenarios.length, 4); cf += 1) {
            var failedChat = chatIntel.failedScenarios[cf];
            html +=
              '<li><strong>' +
              escapeHtml(failedChat.prompt) +
              '</strong> — ' +
              escapeHtml(failedChat.whyFailed[0] || 'Not grounded') +
              '</li>';
          }
          html += '</ul>';
        } else {
          html += '<p class="hint">All bounded chat intelligence scenarios passed.</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.repositoryTypecheckReality) {
        var typecheck = report.v4.repositoryTypecheckReality;
        html +=
          '<div class="founder-test-blockers"><h4>Repository Typecheck</h4>' +
          '<p class="founder-test-score">State: <strong>' +
          escapeHtml(typecheck.readinessState) +
          '</strong> · Errors: <strong>' +
          String(typecheck.errorCount) +
          '</strong> · Blocks launch: <strong>' +
          (typecheck.blocksLaunchReadiness ? 'Yes' : 'No') +
          '</strong></p>';
        if (typecheck.findings.length) {
          html += '<ul>';
          for (var tf = 0; tf < Math.min(typecheck.findings.length, 3); tf += 1) {
            var typeFinding = typecheck.findings[tf];
            html +=
              '<li><strong>' +
              escapeHtml(typeFinding.file) +
              ':' +
              String(typeFinding.line) +
              '</strong> — ' +
              escapeHtml(typeFinding.message) +
              '</li>';
          }
          html += '</ul>';
        } else if (typecheck.readinessState === 'TYPECHECK_NOT_RUN') {
          html += '<p class="hint">Repository typecheck baseline not supplied — launch blocked until compile integrity is established.</p>';
        } else {
          html += '<p class="hint">Repository typecheck baseline is clean.</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.skepticalFounderSimulator) {
        var skeptical = report.v4.skepticalFounderSimulator;
        html +=
          '<div class="founder-test-blockers"><h4>Skeptical Founder Simulator</h4>' +
          '<p class="founder-test-score">Score: <strong>' +
          String(skeptical.skepticalFounderScore) +
          '/100</strong> · Launch risk: <strong>' +
          String(skeptical.launchRiskScore) +
          '/100</strong> · Objections: <strong>' +
          String(skeptical.objectionCount) +
          '</strong></p>';
        if (skeptical.objections.length) {
          html += '<ul>';
          for (var so = 0; so < Math.min(skeptical.objections.length, 4); so += 1) {
            html += '<li>' + escapeHtml(skeptical.objections[so]) + '</li>';
          }
          html += '</ul>';
        }
        if (skeptical.recommendations.length) {
          html += '<p class="hint"><strong>Recommendations:</strong> ' +
            escapeHtml(skeptical.recommendations.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.promiseFulfillment) {
        var promise = report.v4.promiseFulfillment;
        html +=
          '<div class="founder-test-blockers"><h4>Promise Fulfillment</h4>' +
          '<p class="founder-test-score">Score: <strong>' +
          String(promise.fulfillmentScore) +
          '/100</strong> · Fulfilled: <strong>' +
          String(promise.fulfilledCount) +
          '</strong> · Partial: <strong>' +
          String(promise.partiallyFulfilledCount) +
          '</strong> · Unproven: <strong>' +
          String(promise.unprovenCount) +
          '</strong> · Contradicted: <strong>' +
          String(promise.contradictedCount) +
          '</strong></p>';
        if (promise.recommendations.length) {
          html += '<p class="hint"><strong>Recommendations:</strong> ' +
            escapeHtml(promise.recommendations.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.trustAuthority) {
        var trust = report.v4.trustAuthority;
        html +=
          '<div class="founder-test-blockers"><h4>Trust Authority</h4>' +
          '<p class="founder-test-score">Trust score: <strong>' +
          String(trust.trustScore) +
          '/100</strong> · Risk score: <strong>' +
          String(trust.trustRiskScore) +
          '/100</strong> · Critical failures: <strong>' +
          String(trust.criticalTrustFailures) +
          '</strong></p>';
        if (trust.trustRisks.length) {
          html += '<ul>';
          for (var tr = 0; tr < Math.min(trust.trustRisks.length, 4); tr += 1) {
            html += '<li>' + escapeHtml(trust.trustRisks[tr]) + '</li>';
          }
          html += '</ul>';
        }
        if (trust.recommendations.length) {
          html += '<p class="hint"><strong>Recommendations:</strong> ' +
            escapeHtml(trust.recommendations.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.selfAwarenessAuthority) {
        var awareness = report.v4.selfAwarenessAuthority;
        html +=
          '<div class="founder-test-blockers"><h4>Self-Awareness Authority</h4>' +
          '<p class="founder-test-score">Self-awareness score: <strong>' +
          String(awareness.selfAwarenessScore) +
          '/100</strong> · Risk score: <strong>' +
          String(awareness.selfAwarenessRiskScore) +
          '/100</strong> · Critical failures: <strong>' +
          String(awareness.criticalAwarenessFailures) +
          '</strong></p>';
        if (awareness.limitations.length) {
          html += '<ul>';
          for (var al = 0; al < Math.min(awareness.limitations.length, 4); al += 1) {
            html += '<li>' + escapeHtml(awareness.limitations[al]) + '</li>';
          }
          html += '</ul>';
        }
        if (awareness.recommendations.length) {
          html += '<p class="hint"><strong>Recommendations:</strong> ' +
            escapeHtml(awareness.recommendations.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.userSuccessAuthority) {
        var userSuccess = report.v4.userSuccessAuthority;
        html +=
          '<div class="founder-test-blockers"><h4>User Success Authority</h4>' +
          '<p class="founder-test-score">User success score: <strong>' +
          String(userSuccess.userSuccessScore) +
          '/100</strong> · Outcome achievement: <strong>' +
          String(userSuccess.outcomeAchievementScore) +
          '/100</strong> · Critical failures: <strong>' +
          String(userSuccess.criticalSuccessFailures) +
          '</strong></p>';
        if (userSuccess.blockers.length) {
          html += '<ul>';
          for (var ub = 0; ub < Math.min(userSuccess.blockers.length, 4); ub += 1) {
            html += '<li>' + escapeHtml(userSuccess.blockers[ub]) + '</li>';
          }
          html += '</ul>';
        }
        if (userSuccess.recommendations.length) {
          html += '<p class="hint"><strong>Recommendations:</strong> ' +
            escapeHtml(userSuccess.recommendations.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.gapDetectionAuthority) {
        var gapDetection = report.v4.gapDetectionAuthority;
        html +=
          '<div class="founder-test-blockers"><h4>Gap Detection Authority</h4>' +
          '<p class="founder-test-score">Gap Detection Score: <strong>' +
          String(gapDetection.gapDetectionScore) +
          '/100</strong> · Critical Gaps: <strong>' +
          String(gapDetection.criticalGapCount) +
          '</strong> · High Gaps: <strong>' +
          String(gapDetection.highGapCount) +
          '</strong></p>' +
          '<p class="hint">Launch Blocking Gaps: <strong>' +
          (gapDetection.blocksLaunchReadiness ? 'Yes' : 'No') +
          '</strong> · Readiness: <strong>' +
          escapeHtml(gapDetection.readinessState) +
          '</strong></p>';
        var criticalGaps = gapDetection.detectedGaps.filter(function (gap) {
          return gap.severity === 'CRITICAL' || gap.severity === 'HIGH';
        });
        if (criticalGaps.length) {
          html += '<ul>';
          for (var gg = 0; gg < Math.min(criticalGaps.length, 4); gg += 1) {
            html +=
              '<li>[' +
              escapeHtml(criticalGaps[gg].severity) +
              '] ' +
              escapeHtml(criticalGaps[gg].title) +
              ': ' +
              escapeHtml(criticalGaps[gg].description) +
              '</li>';
          }
          html += '</ul>';
        }
        if (gapDetection.recommendations.length) {
          html += '<p class="hint"><strong>Recommendations:</strong> ' +
            escapeHtml(gapDetection.recommendations.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.selfEvolutionAuthority) {
        var selfEvolution = report.v4.selfEvolutionAuthority;
        html +=
          '<div class="founder-test-blockers"><h4>Self-Evolution Authority</h4>' +
          '<p class="founder-test-score">Self-Evolution Score: <strong>' +
          String(selfEvolution.selfEvolutionScore) +
          '/100</strong> · Repeated Failures: <strong>' +
          String(selfEvolution.repeatedFailureCount) +
          '</strong></p>' +
          '<p class="hint">Required Evolutions: <strong>' +
          String(selfEvolution.evolutionRequiredCount) +
          '</strong> · Blocked Evolutions: <strong>' +
          String(selfEvolution.blockedEvolutionCount) +
          '</strong> · Readiness: <strong>' +
          escapeHtml(selfEvolution.readinessState) +
          '</strong></p>';
        if (selfEvolution.patterns.length) {
          html += '<ul>';
          for (var se = 0; se < Math.min(selfEvolution.patterns.length, 4); se += 1) {
            html +=
              '<li>[' +
              escapeHtml(selfEvolution.patterns[se].status) +
              '] ' +
              escapeHtml(selfEvolution.patterns[se].failureSignal) +
              '</li>';
          }
          html += '</ul>';
        }
        if (selfEvolution.recommendations.length) {
          html += '<p class="hint"><strong>Recommendations:</strong> ' +
            escapeHtml(selfEvolution.recommendations.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.unknownDiscoveryAuthority) {
        var unknownDiscovery = report.v4.unknownDiscoveryAuthority;
        html +=
          '<div class="founder-test-blockers"><h4>Unknown Discovery Authority</h4>' +
          '<p class="founder-test-score">Unknown Discovery Score: <strong>' +
          String(unknownDiscovery.unknownDiscoveryScore) +
          '/100</strong> · Findings: <strong>' +
          String(unknownDiscovery.findingCount) +
          '</strong></p>' +
          '<p class="hint">Critical Findings: <strong>' +
          String(unknownDiscovery.criticalFindingCount) +
          '</strong> · High Findings: <strong>' +
          String(unknownDiscovery.highFindingCount) +
          '</strong> · Readiness: <strong>' +
          escapeHtml(unknownDiscovery.readinessState) +
          '</strong></p>';
        if (unknownDiscovery.recommendedTests.length) {
          html += '<p class="hint"><strong>Recommended New Tests:</strong> ' +
            escapeHtml(unknownDiscovery.recommendedTests.slice(0, 3).join(' · ')) +
            '</p>';
        }
        if (unknownDiscovery.findings.length) {
          html += '<ul>';
          for (var ud = 0; ud < Math.min(unknownDiscovery.findings.length, 4); ud += 1) {
            html +=
              '<li>[' +
              escapeHtml(unknownDiscovery.findings[ud].severity) +
              '] ' +
              escapeHtml(unknownDiscovery.findings[ud].title) +
              '</li>';
          }
          html += '</ul>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.firstTimeUserRealityAuthority) {
        var firstTimeUserAuthority = report.v4.firstTimeUserRealityAuthority;
        html +=
          '<div class="founder-test-blockers"><h4>First-Time User Reality Authority</h4>' +
          '<p class="founder-test-score">First-Time User Score: <strong>' +
          String(firstTimeUserAuthority.firstTimeUserScore) +
          '/100</strong> · Confusion Score: <strong>' +
          String(firstTimeUserAuthority.confusionScore) +
          '/100</strong></p>' +
          '<p class="hint">Critical Confusion: <strong>' +
          String(firstTimeUserAuthority.criticalConfusionCount) +
          '</strong> · User Blockers: <strong>' +
          String(firstTimeUserAuthority.blockerCount) +
          '</strong> · Readiness: <strong>' +
          escapeHtml(firstTimeUserAuthority.readinessState) +
          '</strong></p>';
        if (firstTimeUserAuthority.confusionPoints.length) {
          html += '<ul>';
          for (var ftuA = 0; ftuA < Math.min(firstTimeUserAuthority.confusionPoints.length, 4); ftuA += 1) {
            html += '<li>' + escapeHtml(firstTimeUserAuthority.confusionPoints[ftuA]) + '</li>';
          }
          html += '</ul>';
        }
        if (firstTimeUserAuthority.recommendations.length) {
          html += '<p class="hint"><strong>Recommendations:</strong> ' +
            escapeHtml(firstTimeUserAuthority.recommendations.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.customerValueAuthority) {
        var customerValue = report.v4.customerValueAuthority;
        html +=
          '<div class="founder-test-blockers"><h4>Customer Value Authority</h4>' +
          '<p class="founder-test-score">Customer Value Score: <strong>' +
          String(customerValue.customerValueScore) +
          '/100</strong> · Retention Value Score: <strong>' +
          String(customerValue.retentionValueScore) +
          '/100</strong></p>' +
          '<p class="hint">Value Risk Score: <strong>' +
          String(customerValue.valueRiskScore) +
          '/100</strong> · Critical Value Failures: <strong>' +
          String(customerValue.criticalValueFailures) +
          '</strong> · Readiness: <strong>' +
          escapeHtml(customerValue.readinessState) +
          '</strong></p>';
        if (customerValue.valueRisks.length) {
          html += '<p class="hint"><strong>Value Risks:</strong> ' +
            escapeHtml(customerValue.valueRisks.slice(0, 3).join(' · ')) +
            '</p>';
        }
        if (customerValue.recommendations.length) {
          html += '<p class="hint"><strong>Recommendations:</strong> ' +
            escapeHtml(customerValue.recommendations.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.competitiveRealityAuthority) {
        var competitiveReality = report.v4.competitiveRealityAuthority;
        html +=
          '<div class="founder-test-blockers"><h4>Competitive Reality Authority</h4>' +
          '<p class="founder-test-score">Competitive Reality Score: <strong>' +
          String(competitiveReality.competitiveRealityScore) +
          '/100</strong> · Differentiation Score: <strong>' +
          String(competitiveReality.differentiationScore) +
          '/100</strong></p>' +
          '<p class="hint">Competitive Risk Score: <strong>' +
          String(competitiveReality.competitiveRiskScore) +
          '/100</strong> · Unique Advantages: <strong>' +
          String(competitiveReality.uniqueAdvantageCount) +
          '</strong> · Readiness: <strong>' +
          escapeHtml(competitiveReality.readinessState) +
          '</strong></p>';
        if (competitiveReality.competitiveRisks.length) {
          html += '<p class="hint"><strong>Competitive Risks:</strong> ' +
            escapeHtml(competitiveReality.competitiveRisks.slice(0, 3).join(' · ')) +
            '</p>';
        }
        if (competitiveReality.recommendations.length) {
          html += '<p class="hint"><strong>Recommendations:</strong> ' +
            escapeHtml(competitiveReality.recommendations.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.realityProofAuthority) {
        var realityProof = report.v4.realityProofAuthority;
        html +=
          '<div class="founder-test-blockers"><h4>Reality-Proof Authority</h4>' +
          '<p class="founder-test-score">Reality Proof Score: <strong>' +
          String(realityProof.realityProofScore) +
          '/100</strong> · Reality Risk Score: <strong>' +
          String(realityProof.realityRiskScore) +
          '/100</strong></p>' +
          '<p class="hint">Proven Reality: <strong>' +
          String(realityProof.provenRealityCount) +
          '</strong> · Assumed Reality: <strong>' +
          String(realityProof.assumedRealityCount) +
          '</strong> · Unknown Reality: <strong>' +
          String(realityProof.unknownRealityCount) +
          '</strong> · Readiness: <strong>' +
          escapeHtml(realityProof.readinessState) +
          '</strong></p>';
        if (realityProof.recommendations.length) {
          html += '<p class="hint"><strong>Recommendations:</strong> ' +
            escapeHtml(realityProof.recommendations.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.realUserRealityAuthority) {
        var realUserReality = report.v4.realUserRealityAuthority;
        html +=
          '<div class="founder-test-blockers"><h4>Real User Reality Authority</h4>' +
          '<p class="founder-test-score">Reality Score: <strong>' +
          String(realUserReality.realUserRealityScore) +
          '/100</strong> · User Evidence: <strong>' +
          String(realUserReality.userEvidenceScore) +
          '/100</strong></p>' +
          '<p class="hint">User Success: <strong>' +
          String(realUserReality.userSuccessScore) +
          '/100</strong> · User Confusion: <strong>' +
          String(realUserReality.userConfusionScore) +
          '/100</strong> · User Retention: <strong>' +
          String(realUserReality.userRetentionScore) +
          '/100</strong></p>' +
          '<p class="hint">Real User Evidence: <strong>' +
          String(realUserReality.realUserEvidenceCount) +
          '</strong> · Founder Evidence: <strong>' +
          String(realUserReality.founderOnlyEvidenceCount) +
          '</strong> · Readiness: <strong>' +
          escapeHtml(realUserReality.readinessState) +
          '</strong></p>';
        if (realUserReality.noRealUserEvidence) {
          html += '<p class="hint"><strong>NO_REAL_USER_EVIDENCE</strong></p>';
        }
        if (realUserReality.recommendations.length) {
          html += '<p class="hint"><strong>Recommendations:</strong> ' +
            escapeHtml(realUserReality.recommendations.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.adoptionPredictionAuthority) {
        var adoptionPrediction = report.v4.adoptionPredictionAuthority;
        html +=
          '<div class="founder-test-blockers"><h4>Adoption Prediction Authority</h4>' +
          '<p class="founder-test-score">Adoption Score: <strong>' +
          String(adoptionPrediction.adoptionPredictionScore) +
          '/100</strong> · Retention Prediction: <strong>' +
          String(adoptionPrediction.retentionPredictionScore) +
          '/100</strong></p>' +
          '<p class="hint">Recommendation Prediction: <strong>' +
          String(adoptionPrediction.recommendationPredictionScore) +
          '/100</strong> · Abandonment Risk: <strong>' +
          String(adoptionPrediction.abandonmentRiskScore) +
          '/100</strong> · Growth Potential: <strong>' +
          String(adoptionPrediction.growthPotentialScore) +
          '/100</strong></p>' +
          '<p class="hint">Evidence Confidence: <strong>' +
          String(adoptionPrediction.evidenceConfidenceScore) +
          '/100</strong> · Readiness: <strong>' +
          escapeHtml(adoptionPrediction.readinessState) +
          '</strong></p>';
        if (adoptionPrediction.recommendations.length) {
          html += '<p class="hint"><strong>Recommendations:</strong> ' +
            escapeHtml(adoptionPrediction.recommendations.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.launchReadinessAuthority) {
        var launchReadiness = report.v4.launchReadinessAuthority;
        html +=
          '<div class="founder-test-blockers"><h4>Launch Readiness Authority</h4>' +
          '<p class="founder-test-score">Recommendation: <strong>' +
          escapeHtml(launchReadiness.recommendation.replace(/_/g, ' ')) +
          '</strong> · Confidence: <strong>' +
          String(launchReadiness.launchConfidenceScore) +
          '/100</strong></p>' +
          '<p class="hint">Blocking Authorities: <strong>' +
          String(launchReadiness.blockingAuthorityCount) +
          '</strong> · Supporting Authorities: <strong>' +
          String(launchReadiness.supportingAuthorityCount) +
          '</strong> · Readiness: <strong>' +
          escapeHtml(launchReadiness.readinessState) +
          '</strong></p>';
        if (launchReadiness.blockers.length) {
          html += '<p class="hint"><strong>Blockers:</strong> ' +
            escapeHtml(launchReadiness.blockers.slice(0, 3).join(' · ')) +
            '</p>';
        }
        if (launchReadiness.recommendations.length) {
          html += '<p class="hint"><strong>Recommendations:</strong> ' +
            escapeHtml(launchReadiness.recommendations.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.uiReviewerAuthority) {
        var uiReviewer = report.v4.uiReviewerAuthority;
        html +=
          '<div class="founder-test-blockers"><h4>UI Reviewer Authority</h4>' +
          '<p class="founder-test-score">UI Review: <strong>' +
          String(uiReviewer.uiReviewScore) +
          '/100</strong> · Navigation: <strong>' +
          String(uiReviewer.navigationScore) +
          '/100</strong> · Discoverability: <strong>' +
          String(uiReviewer.discoverabilityScore) +
          '/100</strong></p>' +
          '<p class="hint">Hierarchy: <strong>' +
          String(uiReviewer.hierarchyScore) +
          '/100</strong> · Critical UI failures: <strong>' +
          String(uiReviewer.criticalUiFailures) +
          '</strong> · Readiness: <strong>' +
          escapeHtml(uiReviewer.readinessState) +
          '</strong></p>';
        if (uiReviewer.uiRisks.length) {
          html += '<p class="hint"><strong>UI risks:</strong> ' +
            escapeHtml(uiReviewer.uiRisks.slice(0, 3).join(' · ')) +
            '</p>';
        }
        if (uiReviewer.uiRecommendations.length) {
          html += '<p class="hint"><strong>Recommendations:</strong> ' +
            escapeHtml(uiReviewer.uiRecommendations.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.clarifyingQuestionIntelligence) {
        var clarifying = report.v4.clarifyingQuestionIntelligence;
        html +=
          '<div class="founder-test-blockers"><h4>Clarifying Question Intelligence</h4>' +
          '<p class="founder-test-score">Requirement Completeness: <strong>' +
          String(clarifying.requirementCompletenessScore) +
          '/100</strong> · Confidence To Proceed: <strong>' +
          String(clarifying.confidenceToProceed) +
          '/100</strong></p>' +
          '<p class="hint">Missing Requirements: <strong>' +
          String(clarifying.missingRequirementCount) +
          '</strong> · Critical Missing: <strong>' +
          String(clarifying.criticalMissingRequirementCount) +
          '</strong> · Readiness: <strong>' +
          escapeHtml(clarifying.readinessState) +
          '</strong></p>';
        if (clarifying.recommendedQuestions.length) {
          html += '<p class="hint"><strong>Recommended Questions:</strong> ' +
            escapeHtml(
              clarifying.recommendedQuestions
                .slice(0, 3)
                .map(function (item) { return item.question; })
                .join(' · '),
            ) +
            '</p>';
        }
        if (clarifying.assumptionsPrevented.length) {
          html += '<p class="hint"><strong>Assumptions Prevented:</strong> ' +
            escapeHtml(clarifying.assumptionsPrevented.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.launchCouncil) {
        var council = report.v4.launchCouncil;
        html +=
          '<div class="founder-test-blockers"><h4>Launch Council (Advisory)</h4>' +
          '<p class="founder-test-score">Readiness: <strong>' +
          escapeHtml(council.readinessState) +
          '</strong> · Confidence: <strong>' +
          String(council.confidenceScore) +
          '/100</strong> · Blockers: <strong>' +
          String(council.launchBlockerCount) +
          '</strong></p>' +
          '<p class="hint">' +
          escapeHtml((report.v4.launchCouncilReport && report.v4.launchCouncilReport.summary) || 'Launch Council advisory summary unavailable.') +
          '</p></div>';
      }
      if (report.v4 && report.v4.launchCouncilFinalization) {
        var finalization = report.v4.launchCouncilFinalization;
        html +=
          '<div class="founder-test-blockers"><h4>Launch Council Finalization</h4>' +
          '<p class="founder-test-score">Position: <strong>' +
          escapeHtml(finalization.councilPosition) +
          '</strong> · Score: <strong>' +
          String(finalization.councilScore) +
          '/100</strong> · Confidence: <strong>' +
          String(finalization.councilConfidence) +
          '/100</strong></p>' +
          '<p class="hint">Agreement: <strong>' +
          String(finalization.agreementScore) +
          '/100</strong> · Blocking authorities: <strong>' +
          String(finalization.blockingAuthorityCount) +
          '</strong></p>';
        if (finalization.highestRiskAuthorities.length) {
          html += '<p class="hint"><strong>Highest risks:</strong> ' +
            escapeHtml(finalization.highestRiskAuthorities.slice(0, 3).join(' · ')) +
            '</p>';
        }
        if (finalization.strongestAuthorities.length) {
          html += '<p class="hint"><strong>Strongest areas:</strong> ' +
            escapeHtml(finalization.strongestAuthorities.slice(0, 3).join(' · ')) +
            '</p>';
        }
        if (finalization.launchBlockers.length) {
          html += '<p class="hint"><strong>Blockers:</strong> ' +
            escapeHtml(finalization.launchBlockers.slice(0, 3).join(' · ')) +
            '</p>';
        }
        if (finalization.recommendations.length) {
          html += '<p class="hint"><strong>Recommendations:</strong> ' +
            escapeHtml(finalization.recommendations.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.launchVerdictGovernance) {
        var governance = report.v4.launchVerdictGovernance;
        html +=
          '<div class="founder-test-blockers"><h4>Launch Verdict Governance</h4>' +
          '<p class="founder-test-score">Final Verdict: <strong>' +
          escapeHtml(governance.finalLaunchVerdict.replace(/_/g, ' ')) +
          '</strong> · Confidence: <strong>' +
          String(governance.governanceConfidence) +
          '/100</strong></p>' +
          '<p class="hint">Satisfied rules: <strong>' +
          String(governance.satisfiedRuleCount) +
          '</strong> · Failed rules: <strong>' +
          String(governance.failedRuleCount) +
          '</strong></p>';
        if (governance.requiredEvidenceMissing.length) {
          html += '<p class="hint"><strong>Missing evidence:</strong> ' +
            escapeHtml(governance.requiredEvidenceMissing.slice(0, 2).join(' · ')) +
            '</p>';
        }
        if (governance.blockingAuthorities.length) {
          html += '<p class="hint"><strong>Blocking authorities:</strong> ' +
            escapeHtml(governance.blockingAuthorities.slice(0, 3).join(' · ')) +
            '</p>';
        }
        if (governance.recommendations.length) {
          html += '<p class="hint"><strong>Recommendations:</strong> ' +
            escapeHtml(governance.recommendations.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '</div>';
      }
      if (report.v4 && report.v4.adaptiveAutofixIntelligence) {
        var adaptive = report.v4.adaptiveAutofixIntelligence;
        html +=
          '<div class="founder-test-blockers"><h4>Adaptive AutoFix Intelligence</h4>' +
          '<p class="founder-test-score">AutoFix Score: <strong>' +
          String(adaptive.adaptiveAutoFixScore) +
          '/100</strong> · Readiness: <strong>' +
          escapeHtml(adaptive.autofixReadiness) +
          '</strong></p>' +
          '<p class="hint">Repeated Failures: <strong>' +
          String(adaptive.repeatedFailureCount) +
          '</strong> · Capability Gaps: <strong>' +
          String(adaptive.capabilityGapCount) +
          '</strong> · Evolution Required: <strong>' +
          String(adaptive.evolutionRequiredCount) +
          '</strong></p>';
        if (adaptive.failureCategories.length) {
          html += '<p class="hint"><strong>Failure Categories:</strong> ' +
            escapeHtml(adaptive.failureCategories.slice(0, 3).join(' · ')) +
            '</p>';
        }
        if (adaptive.recommendations.length) {
          html += '<p class="hint"><strong>Evolution Recommendations:</strong> ' +
            escapeHtml(
              adaptive.recommendations
                .slice(0, 3)
                .map(function (item) { return item.missingCapability; })
                .join(' · '),
            ) +
            '</p>';
        }
        if (adaptive.missingCapabilities.length) {
          html += '<p class="hint"><strong>Missing Capabilities:</strong> ' +
            escapeHtml(adaptive.missingCapabilities.slice(0, 3).join(' · ')) +
            '</p>';
        }
        html += '<p class="hint">Expected Failure Reduction: <strong>' +
          String(adaptive.estimatedFailureReduction) +
          '%</strong> · Triggered: <strong>' +
          (adaptive.triggeredAdaptiveAutofix ? 'ADAPTIVE_AUTOFIX_REQUIRED' : 'No') +
          '</strong></p></div>';
      }
      html += '<p class="hint">' + escapeHtml(summary.finalRecommendation) + '</p>';
      body.innerHTML = html;
      updateCopyReportButtonState();
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
    updateCopyReportButtonState();
    var viewFullBtn = el('view-founder-test-full-report');
    var fullReportEl = el('founder-test-full-report');
    if (viewFullBtn && fullReportEl && report.reportMarkdown) {
      fullReportEl.textContent = report.reportMarkdown;
      viewFullBtn.addEventListener('click', function () {
        fullReportEl.classList.toggle('hidden');
        viewFullBtn.textContent = fullReportEl.classList.contains('hidden')
          ? 'View Full Report'
          : 'Hide Full Report';
      });
    }
    showFounderTestPanel('done');
  }

  function formatFounderTestFetchError(err) {
    if (!err) return 'Unknown error';
    var message = err.message || String(err);
    if (err.name === 'TypeError' && /failed to fetch|networkerror|load failed/i.test(message)) {
      return 'Failed to fetch — the server connection was lost or timed out. The dev server may have restarted during the run.';
    }
    if (/abort/i.test(message)) {
      return 'Founder test request was aborted before completion.';
    }
    return message;
  }

  var FOUNDER_TEST_RESULT_FETCH_DELAY_MS = 600;

  function isFounderTestCompleteSuccessState(state) {
    return state === 'COMPLETE';
  }

  function isFounderTestFinalReportMarkdown(markdown) {
    if (!markdown || !String(markdown).trim()) return false;
    var text = String(markdown);
    return (
      text.indexOf('# Founder Test Runtime Failure Report') < 0 &&
      text.indexOf('Founder test still running') < 0
    );
  }

  function buildFounderTestCompletePreparingDiagnosticText(snapshot, generatedAt) {
    return [
      '# Founder Test Complete — Report Preparing',
      '',
      'Generated: ' + (generatedAt || (snapshot && snapshot.endedAt) || new Date().toISOString()),
      '',
      '## Status',
      '',
      'Final report preparing',
      '',
      'All founder test stages completed successfully. The final report is being assembled — retry Copy/Open Report in a moment.',
      '',
      '## Runtime Snapshot',
      '',
      '- Run ID: ' + (snapshot && snapshot.runId ? snapshot.runId : 'n/a'),
      '- State: COMPLETE',
      '- Elapsed: ' + (snapshot && snapshot.uiSummary ? snapshot.uiSummary.elapsedLine : 'n/a'),
      '',
    ].join('\n');
  }

  function buildFounderTestCompleteHandoffFallbackText(snapshot, reason, fetchAttempts) {
    return [
      '# Founder Test Complete — Report Handoff Diagnostic',
      '',
      'Generated: ' + new Date().toISOString(),
      '',
      '## Status',
      '',
      '- State: COMPLETE',
      '- Run ID: ' + (snapshot && snapshot.runId ? snapshot.runId : 'n/a'),
      '- Reason: ' + (reason || 'Final report not available after bounded retries.'),
      ...(typeof fetchAttempts === 'number' ? ['- Result fetch attempts: ' + String(fetchAttempts)] : []),
      '',
      'All founder test stages completed. The final report could not be retrieved from the result endpoint after bounded retries.',
      '',
      '## Runtime Snapshot',
      '',
      '- Elapsed: ' + (snapshot && snapshot.uiSummary ? snapshot.uiSummary.elapsedLine : 'n/a'),
      '',
    ].join('\n');
  }

  async function fetchFounderTestReportMarkdownFromEndpoint(runId) {
    runId = coerceReportHandoffRunId(runId, founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot());
    if (!runId) return { markdown: null, errorMessage: 'No active founder test runId.' };
    var reportUrl = buildFounderTestResultReportUrl(runId);
    try {
      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var fetchTimer = null;
      if (controller) {
        fetchTimer = window.setTimeout(function () {
          controller.abort();
        }, FOUNDER_TEST_RESULT_FETCH_TIMEOUT_MS);
      }
      var reportRes = await fetch(reportUrl, {
        cache: 'no-store',
        signal: controller ? controller.signal : undefined,
      });
      if (fetchTimer != null) window.clearTimeout(fetchTimer);
      rememberFounderTestApiOriginFromUrl(reportUrl);
      if (!reportRes.ok) {
        return {
          markdown: null,
          errorMessage: 'Result-report endpoint returned HTTP ' + String(reportRes.status),
          httpStatus: reportRes.status,
          requestedUrl: reportUrl,
        };
      }
      var contentType = reportRes.headers && reportRes.headers.get ? reportRes.headers.get('content-type') || '' : '';
      var markdown = await reportRes.text();
      if (!markdown || !String(markdown).trim()) {
        return {
          markdown: null,
          errorMessage: 'Result-report endpoint returned empty markdown',
          httpStatus: reportRes.status,
          requestedUrl: reportUrl,
          responseContentType: contentType,
        };
      }
      return {
        markdown: String(markdown),
        errorMessage: null,
        httpStatus: reportRes.status,
        requestedUrl: reportUrl,
        responseContentType: contentType,
      };
    } catch (reportErr) {
      return {
        markdown: null,
        errorMessage:
          reportErr && reportErr.name === 'AbortError'
            ? 'Result-report fetch timed out after ' + String(FOUNDER_TEST_RESULT_FETCH_TIMEOUT_MS) + ' ms'
            : reportErr && reportErr.message
              ? reportErr.message
              : 'Failed to fetch founder test report markdown',
        requestedUrl: reportUrl,
      };
    }
  }

  function resolveFounderTestResultDeliveryMarkdown(data, runId) {
    if (!data) return null;
    if (data.reportMarkdown && String(data.reportMarkdown).trim()) {
      return String(data.reportMarkdown);
    }
    if (data.report && data.report.reportMarkdown && String(data.report.reportMarkdown).trim()) {
      return String(data.report.reportMarkdown);
    }
    return null;
  }

  function shouldFetchFounderTestReportFromMarkdownEndpoint(data) {
    if (!data) return false;
    if (data.payloadTooLarge === true) return true;
    if (data.deliveryMode === 'markdown-endpoint' || data.deliveryMode === 'download-endpoint') return true;
    if (data.hasReportMarkdown === true && !resolveFounderTestResultDeliveryMarkdown(data)) return true;
    return false;
  }

  async function fetchFounderTestResultWithRetry(runId, maxAttempts) {
    runId = coerceReportHandoffRunId(runId, founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot());
    if (!runId) {
      return {
        data: null,
        fetchFailed: true,
        exhausted: true,
        errorMessage: 'No active founder test runId.',
        fetchDiagnostic: null,
      };
    }
    if (founderTestOperatorFeedReportFetchInFlight && getFounderTestFinalReportFetchState(runId) === 'fetching') {
      return {
        data: null,
        fetchFailed: false,
        exhausted: false,
        errorMessage: null,
        fetchDiagnostic: null,
        inFlight: true,
      };
    }
    if (!hasFounderTestFinalReportAvailable(runId)) {
      markFounderTestFinalReportFetching(runId);
    }
    updateFounderTestOperatorFeedReportActionLabels(founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot());
    var attempts = Math.max(1, maxAttempts || FOUNDER_TEST_RESULT_FETCH_MAX_ATTEMPTS);
    var lastData = null;
    var lastError = null;
    var lastRequestedUrl = buildFounderTestResultFetchUrl(runId);
    var lastHttpStatus = null;
    var lastContentType = null;
    var lastJsonParseFailed = false;
    var lastNonJsonPreview = null;
    function recordClientCacheDeliveryTrace(succeeded, detail) {
      detail = detail || {};
      postFounderTestDeliveryTraceClientEvent({
        boundaryId: 'CLIENT_CACHE',
        runId: runId,
        succeeded: succeeded,
        details: {
          fetchStarted: true,
          fetchCompleted: true,
          httpStatus: lastHttpStatus,
          responseSize: detail.responseSize != null ? detail.responseSize : null,
          reportParsed: detail.reportParsed === true,
        },
        exception: succeeded ? null : detail.errorMessage || lastError,
        missingArtifact: succeeded ? null : 'report markdown',
      });
    }
    for (var attempt = 0; attempt < attempts; attempt += 1) {
      if (attempt > 0) {
        await waitMs(FOUNDER_TEST_RESULT_FETCH_DELAY_MS);
      }
      lastRequestedUrl = buildFounderTestResultFetchUrl(runId);
      try {
        var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var fetchTimer = null;
        if (controller) {
          fetchTimer = window.setTimeout(function () {
            controller.abort();
          }, FOUNDER_TEST_RESULT_FETCH_TIMEOUT_MS);
        }
        var resultRes = await fetch(lastRequestedUrl, {
          cache: 'no-store',
          signal: controller ? controller.signal : undefined,
        });
        if (fetchTimer != null) window.clearTimeout(fetchTimer);
        rememberFounderTestApiOriginFromUrl(lastRequestedUrl);
        lastHttpStatus = resultRes.status;
        var parsed = await parseFounderTestHttpJsonResponse(resultRes);
        lastContentType = parsed.contentType;
        lastJsonParseFailed = parsed.jsonParseFailed;
        lastNonJsonPreview = parsed.nonJsonResponsePreview;
        recordFounderTestResultFetchAttempt({
          requestedUrl: lastRequestedUrl,
          requestedRunId: runId,
          fetchErrorMessage: lastError,
          httpStatus: lastHttpStatus,
          responseContentType: lastContentType,
          jsonParseFailed: lastJsonParseFailed,
          nonJsonResponsePreview: lastNonJsonPreview,
          resultDebugResponse: founderTestResultDebugSnapshot,
        });
        if (parsed.jsonParseFailed) {
          lastError = 'Result endpoint returned non-JSON response (content-type: ' + String(lastContentType || 'unknown') + ')';
          continue;
        }
        if (lastHttpStatus === 404) {
          lastError = 'Founder test result not stored for runId ' + runId;
          continue;
        }
        if (!resultRes.ok && lastHttpStatus !== 202) {
          lastError = 'Result endpoint returned HTTP ' + String(lastHttpStatus);
          continue;
        }
        var data = parsed.data;
        lastData = data;
        var inlineMarkdown = resolveFounderTestResultDeliveryMarkdown(data, runId);
        if (inlineMarkdown) {
          applyFounderTestFinalReport(
            runId,
            inlineMarkdown,
            'result-fetch-retry',
            {
              runtime: data.runtime || lastFounderTestRuntimeSnapshot,
              reportObject: data.report || null,
              generatedAt: data.generatedAt,
            },
          );
          recordClientCacheDeliveryTrace(true, {
            reportParsed: true,
            responseSize: inlineMarkdown.length,
          });
          return {
            data: data,
            fetchFailed: false,
            exhausted: false,
            errorMessage: null,
            fetchDiagnostic: founderTestLastResultFetchDiagnostic,
          };
        }
        if (data && shouldFetchFounderTestReportFromMarkdownEndpoint(data)) {
          var reportFetch = await fetchFounderTestReportMarkdownFromEndpoint(runId);
          if (reportFetch.markdown) {
            applyFounderTestFinalReport(
              runId,
              reportFetch.markdown,
              'result-report-endpoint',
              {
                runtime: data.runtime || lastFounderTestRuntimeSnapshot,
                generatedAt: data.generatedAt,
              },
            );
            recordClientCacheDeliveryTrace(true, {
              reportParsed: true,
              responseSize: reportFetch.markdown.length,
            });
            return {
              data: data,
              fetchFailed: false,
              exhausted: false,
              errorMessage: null,
              fetchDiagnostic: founderTestLastResultFetchDiagnostic,
            };
          }
          lastError = reportFetch.errorMessage || 'Result-report endpoint did not return markdown';
          recordFounderTestResultFetchAttempt({
            requestedUrl: reportFetch.requestedUrl || buildFounderTestResultReportUrl(runId),
            requestedRunId: runId,
            fetchErrorMessage: lastError,
            httpStatus: reportFetch.httpStatus != null ? reportFetch.httpStatus : null,
            responseContentType: reportFetch.responseContentType || null,
            jsonParseFailed: false,
            nonJsonResponsePreview: null,
            resultDebugResponse: founderTestResultDebugSnapshot,
          });
          continue;
        }
        if (lastHttpStatus === 202) {
          lastError = 'Result metadata preparing for runId ' + runId;
          continue;
        }
        lastError = 'Stored result missing reportMarkdown for runId ' + runId;
      } catch (fetchErr) {
        lastError =
          fetchErr && fetchErr.name === 'AbortError'
            ? 'Result fetch timed out after ' + String(FOUNDER_TEST_RESULT_FETCH_TIMEOUT_MS) + ' ms'
            : fetchErr && fetchErr.message
              ? fetchErr.message
              : 'Failed to fetch founder test result';
        recordFounderTestResultFetchAttempt({
          requestedUrl: lastRequestedUrl,
          requestedRunId: runId,
          fetchErrorMessage: lastError,
          httpStatus: lastHttpStatus,
          responseContentType: lastContentType,
          jsonParseFailed: lastJsonParseFailed,
          nonJsonResponsePreview: lastNonJsonPreview,
          resultDebugResponse: null,
        });
      }
    }
    var fetchFailed = !resolveFounderTestFinalReportMarkdown(runId).markdown;
    var fetchDiagnostic = null;
    if (fetchFailed) {
      markFounderTestFinalReportFetchFailed(runId);
      founderTestReportHandoffStalled = true;
      fetchDiagnostic = await attachResultFetchFailureDebug(
        runId,
        founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot(),
        {
          requestedUrl: lastRequestedUrl,
          fetchErrorMessage: lastError || 'Final report not available after bounded retries.',
          httpStatus: lastHttpStatus,
          responseContentType: lastContentType,
          jsonParseFailed: lastJsonParseFailed,
          nonJsonResponsePreview: lastNonJsonPreview,
        },
      );
      refreshFounderTestFinalReportDeliverySurfaces(
        founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot(),
      );
      recordClientCacheDeliveryTrace(false, {
        reportParsed: false,
        errorMessage: lastError || 'Final report not available after bounded retries.',
      });
    }
    return {
      data: lastData,
      fetchFailed: fetchFailed,
      exhausted: true,
      errorMessage: lastError || 'Final report not available after bounded retries.',
      fetchDiagnostic: fetchDiagnostic,
    };
  }

  function buildRuntimeFailureReportText(snapshot, errorMessage) {
    if (snapshot && isFounderTestCompleteSuccessState(snapshot.state)) {
      return buildCompleteFounderTestHandoffDiagnostic(snapshot, snapshot.runId, errorMessage);
    }
    var lines = [
      '# Founder Test Runtime Failure Report',
      '',
      'Generated: ' + new Date().toISOString(),
      '',
      '## Error',
      '',
      errorMessage || 'Unknown error',
      '',
      '## Runtime Snapshot',
      '',
      '- Run ID: ' + (snapshot && snapshot.runId ? snapshot.runId : 'n/a'),
      '- State: ' + (snapshot && snapshot.state ? snapshot.state : 'unknown'),
      '- Stage: ' +
        (snapshot && snapshot.progress
          ? (snapshot.progress.currentStageLabel || 'unknown') +
            ' (' +
            String(snapshot.progress.currentStageOrder) +
            '/' +
            String(snapshot.progress.totalStages) +
            ')'
          : 'unknown'),
      '- Elapsed: ' + (snapshot && snapshot.uiSummary ? snapshot.uiSummary.elapsedLine : 'n/a'),
      '- Stall health: ' + (snapshot && snapshot.stallAnalysis ? snapshot.stallAnalysis.health : 'n/a'),
      '- Stall reason: ' +
        (snapshot && (snapshot.stallReason || (snapshot.stallAnalysis && snapshot.stallAnalysis.warningMessage))
          ? snapshot.stallReason || snapshot.stallAnalysis.warningMessage
          : 'none'),
      '- Last heartbeat: ' + (snapshot && snapshot.lastHeartbeatAt ? snapshot.lastHeartbeatAt : 'n/a'),
      '- Seconds since heartbeat: ' +
        String(snapshot && typeof snapshot.secondsSinceLastHeartbeat === 'number' ? snapshot.secondsSinceLastHeartbeat : 0),
      '- Last successful artifact sub-step: ' +
        (snapshot && snapshot.lastSuccessfulArtifactSubstep ? snapshot.lastSuccessfulArtifactSubstep : 'n/a'),
      '- Active artifact sub-step: ' +
        (snapshot && snapshot.activeArtifactBuildSubstep ? snapshot.activeArtifactBuildSubstep : 'none'),
      '- Artifact sub-step stall: ' +
        (snapshot && snapshot.artifactBuildSubstepStallReason ? snapshot.artifactBuildSubstepStallReason : 'none'),
      '- Missing completion boundary: ' +
        (snapshot && snapshot.missingCompletionBoundary ? snapshot.missingCompletionBoundary : 'none'),
      '- Chat stress started: ' +
        String(snapshot && typeof snapshot.chatStressStartedCount === 'number' ? snapshot.chatStressStartedCount : 0),
      '- Chat stress settled: ' +
        String(snapshot && typeof snapshot.chatStressSettledCount === 'number' ? snapshot.chatStressSettledCount : 0),
      '- Chat stress pending: ' +
        String(snapshot && typeof snapshot.chatStressPendingCount === 'number' ? snapshot.chatStressPendingCount : 0),
      ...(snapshot && snapshot.chatStressPendingScenarioIds && snapshot.chatStressPendingScenarioIds.length
        ? ['- Chat stress pending scenarios: ' + snapshot.chatStressPendingScenarioIds.join(', ')]
        : []),
      '- Chat stress active scenario: ' +
        (snapshot && snapshot.chatStressActiveScenarioId ? snapshot.chatStressActiveScenarioId : 'n/a'),
      '- Handler alive: ' + (snapshot && snapshot.handlerAlive ? 'yes' : 'no'),
      '- POST timed out: ' +
        (lastFounderTestPostTimedOut || (snapshot && snapshot.postTimedOut) ? 'yes' : 'no'),
      '- Last completed scenario: ' +
        (snapshot && (snapshot.lastSuccessfulArtifactSubstep || snapshot.lastCompletedOperation)
          ? snapshot.lastSuccessfulArtifactSubstep || snapshot.lastCompletedOperation
          : 'n/a'),
      '- Runtime monitor running: ' +
        (snapshot && (snapshot.state === 'RUNNING' || snapshot.state === 'STALLED') ? 'yes' : 'no'),
      '',
      '## Artifact Build Trace',
      '',
    ];
    if (snapshot && snapshot.traceEvents) {
      for (var t = 0; t < snapshot.traceEvents.length; t += 1) {
        var traceEvent = snapshot.traceEvents[t];
        if (
          traceEvent.operationId.indexOf('launch-readiness') >= 0 ||
          traceEvent.operationId.indexOf('loading-') >= 0 ||
          traceEvent.operationId.indexOf('running-') >= 0 ||
          traceEvent.operationId.indexOf('assessing-') >= 0 ||
          traceEvent.operationId.indexOf('building-launch') >= 0 ||
          traceEvent.operationId.indexOf('artifact-substep') >= 0
        ) {
          lines.push('- ' + traceEvent.displayLine);
        }
      }
    }
    lines.push(
      '',
      '## Stage Timings',
      '',
    );
    if (snapshot && snapshot.stages) {
      for (var i = 0; i < snapshot.stages.length; i += 1) {
        var stage = snapshot.stages[i];
        lines.push(
          '- ' +
            String(stage.order) +
            '. ' +
            stage.label +
            ': ' +
            stage.status +
            (stage.durationMs != null ? ' (' + String(stage.durationMs) + ' ms)' : ''),
        );
      }
    }
    lines.push('', '## Runtime Feed', '');
    if (snapshot && snapshot.feed && snapshot.feed.events) {
      for (var j = 0; j < snapshot.feed.events.length; j += 1) {
        var event = snapshot.feed.events[j];
        lines.push('- [' + event.displayTime + '] ' + event.message);
      }
    }
    if (lastFounderTestPartialReportMarkdown) {
      lines.push('', '## Partial Founder Test Report', '', lastFounderTestPartialReportMarkdown, '');
    }
    return lines.join('\n');
  }

  function buildFounderTestMinimalDiagnosticText(errorMessage) {
    return [
      '# Founder Test Diagnostic Report',
      '',
      'Generated: ' + new Date().toISOString(),
      '',
      '## Error',
      '',
      errorMessage || 'Unknown error',
      '',
      'No runtime snapshot or founder test report was available at copy time.',
      '',
    ].join('\n');
  }

  function buildFounderTestCopyPayload(cardRuntime) {
    cardRuntime = cardRuntime || founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot();
    var activeRuntime = cardRuntime || resolveActiveFounderTestRuntimeSnapshot();
    var activeRunId = coerceReportHandoffRunId(null, activeRuntime);
    var resolvedFinal = resolveFounderTestFinalReportMarkdown(activeRunId);
    if (resolvedFinal.markdown) {
      return {
        source: resolvedFinal.source,
        text: resolvedFinal.markdown,
        runtime: activeRuntime,
        runId: activeRunId,
        needsFetch: false,
      };
    }
    if (activeRuntime && isFounderTestCompleteSuccessState(activeRuntime.state)) {
      if (shouldUseFounderTestHandoffDiagnosticForCompleteReport()) {
        return {
          source: 'complete-fetch-failure-diagnostic',
          text: buildCompleteFounderTestHandoffDiagnostic(
            activeRuntime,
            activeRunId,
            lastFounderTestErrorMessage,
          ),
          runtime: activeRuntime,
          runId: activeRunId,
          needsFetch: false,
        };
      }
      return {
        source: 'complete-preparing',
        text: null,
        runtime: activeRuntime,
        needsFetch: true,
        runId: activeRunId,
      };
    }
    if (activeRuntime && activeRuntime.runId && activeRuntime.state !== 'IDLE') {
      if (isFounderTestCompleteSuccessState(activeRuntime.state)) {
        if (shouldUseFounderTestHandoffDiagnosticForCompleteReport()) {
          return {
            source: 'complete-fetch-failure-diagnostic',
            text: buildCompleteFounderTestHandoffDiagnostic(
              activeRuntime,
              activeRunId,
              lastFounderTestErrorMessage,
            ),
            runtime: activeRuntime,
            runId: activeRunId,
            needsFetch: false,
          };
        }
        return {
          source: 'complete-preparing',
          text: null,
          runtime: activeRuntime,
          needsFetch: true,
          runId: activeRunId,
        };
      }
      var diagnosticMessage =
        lastFounderTestErrorMessage ||
        (activeRuntime.state === 'STALLED'
          ? 'Founder test stalled — diagnostic snapshot available.'
          : activeRuntime.state === 'FAILED'
            ? 'Founder test failed — diagnostic snapshot available.'
            : activeRuntime.state === 'RUNNING' ||
                activeRuntime.state === 'STARTING' ||
                activeRuntime.state === 'COMPLETING'
              ? 'Founder test still running — diagnostic snapshot available.'
              : 'Founder test diagnostic snapshot available.');
      return {
        source: 'runtime-diagnostic',
        text: buildRuntimeFailureReportText(activeRuntime, diagnosticMessage),
        runtime: activeRuntime,
      };
    }
    if (activeRunId && lastKnownActiveFounderTestRuntimeSnapshot) {
      if (isFounderTestCompleteSuccessState(lastKnownActiveFounderTestRuntimeSnapshot.state)) {
        return {
          source: 'complete-fetch-failure-diagnostic',
          text: buildCompleteFounderTestHandoffDiagnostic(
            lastKnownActiveFounderTestRuntimeSnapshot,
            activeRunId,
            lastFounderTestErrorMessage,
          ),
          runtime: lastKnownActiveFounderTestRuntimeSnapshot,
          runId: activeRunId,
          needsFetch: false,
        };
      }
      return {
        source: 'runtime-failure',
        text: buildRuntimeFailureReportText(
          lastKnownActiveFounderTestRuntimeSnapshot,
          lastFounderTestErrorMessage || 'Founder test still running — diagnostic snapshot available.',
        ),
        runtime: lastKnownActiveFounderTestRuntimeSnapshot,
      };
    }
    if (lastFounderTestRuntimeSnapshot && lastFounderTestRuntimeSnapshot.runId) {
      if (isFounderTestCompleteSuccessState(lastFounderTestRuntimeSnapshot.state)) {
        return {
          source: 'complete-fetch-failure-diagnostic',
          text: buildCompleteFounderTestHandoffDiagnostic(
            lastFounderTestRuntimeSnapshot,
            activeRunId || lastFounderTestRuntimeSnapshot.runId,
            lastFounderTestErrorMessage,
          ),
          runtime: lastFounderTestRuntimeSnapshot,
          runId: coerceReportHandoffRunId(activeRunId, lastFounderTestRuntimeSnapshot),
          needsFetch: false,
        };
      }
      return {
        source: 'runtime-failure',
        text: buildRuntimeFailureReportText(lastFounderTestRuntimeSnapshot, lastFounderTestErrorMessage),
        runtime: lastFounderTestRuntimeSnapshot,
      };
    }
    if (lastFounderTestErrorMessage) {
      if (
        lastFounderTestRuntimeSnapshot &&
        isFounderTestCompleteSuccessState(lastFounderTestRuntimeSnapshot.state)
      ) {
        return {
          source: 'complete-fetch-failure-diagnostic',
          text: buildCompleteFounderTestHandoffDiagnostic(
            lastFounderTestRuntimeSnapshot,
            activeRunId,
            lastFounderTestErrorMessage,
          ),
          runtime: lastFounderTestRuntimeSnapshot,
          runId: coerceReportHandoffRunId(activeRunId, lastFounderTestRuntimeSnapshot),
          needsFetch: false,
        };
      }
      return {
        source: 'diagnostic',
        text: buildFounderTestMinimalDiagnosticText(lastFounderTestErrorMessage),
        runtime: activeRuntime,
      };
    }
    return null;
  }

  function resolveFounderTestReportHandoffText(cardRuntime, handoffRunId, fetchResult) {
    var refreshed = buildFounderTestCopyPayload(cardRuntime);
    if (refreshed && refreshed.text && String(refreshed.text).trim() && !refreshed.needsFetch) {
      return String(refreshed.text);
    }
    var cachedMarkdown = resolveFounderTestFinalReportMarkdown(handoffRunId).markdown;
    if (cachedMarkdown) return cachedMarkdown;
    if (fetchResult && fetchResult.data && fetchResult.data.reportMarkdown) {
      return String(fetchResult.data.reportMarkdown);
    }
    return resolveFounderTestCompleteReportFallbackText(cardRuntime, handoffRunId, fetchResult);
  }

  function copyFounderTestReportHandoffShared(options) {
    options = options || {};
    var cardRuntime = options.runtime || founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot();
    var handoffRunId = coerceReportHandoffRunId(options.runId || null, cardRuntime);
    var reportRuntime = resolveActiveFounderTestRuntimeSnapshot();

    function finishClipboardCopy(text) {
      return copyTextToClipboardWithFallback(String(text)).then(function (result) {
        if (options.feedbackButton) {
          options.feedbackButton.textContent = result.ok ? 'Copied' : 'Copy failed';
          if (options.resetOperatorFeedLabels) {
            window.setTimeout(function () {
              updateFounderTestOperatorFeedReportActionLabels(cardRuntime);
            }, 2200);
          }
        }
        if (result.ok && options.onCopied) options.onCopied();
        else if (!result.ok && options.onFailed) options.onFailed();
        return result;
      });
    }

    if (cardRuntime && detectFounderTestRuntimeReportMismatch(cardRuntime, reportRuntime)) {
      founderTestRuntimeReportBindingMismatch = true;
      return refreshActiveFounderTestReportBinding(true).then(function () {
        return copyFounderTestReportHandoffShared(options);
      });
    }

    var cached = resolveFounderTestFinalReportMarkdown(handoffRunId);
    if (cached.markdown) {
      return copyFounderTestFinalReportMarkdownShared(handoffRunId, {
        runtime: cardRuntime,
        onCopied: options.onCopied,
        onFailed: options.onFailed,
      });
    }

    var payload = buildFounderTestCopyPayload(cardRuntime);
    if (payload && payload.text && String(payload.text).trim() && !payload.needsFetch) {
      return copyFounderTestFinalReportMarkdownShared(handoffRunId || payload.runId, {
        fallbackText: payload.text,
        runtime: payload.runtime,
        onCopied: options.onCopied,
        onFailed: options.onFailed,
      });
    }

    if (payload && payload.needsFetch && handoffRunId) {
      if (options.syncOperatorFeedLabels) {
        markFounderTestFinalReportFetching(handoffRunId);
        updateFounderTestOperatorFeedReportActionLabels(cardRuntime);
      }
      return fetchFounderTestResultWithRetry(handoffRunId, FOUNDER_TEST_RESULT_FETCH_MAX_ATTEMPTS).then(function (fetchResult) {
        if (!hasFounderTestFinalReportAvailable(handoffRunId)) {
          if (fetchResult && fetchResult.fetchFailed) {
            markFounderTestFinalReportFetchFailed(handoffRunId);
          } else {
            founderTestOperatorFeedReportFetching = false;
            founderTestOperatorFeedReportFetchInFlight = false;
          }
        }
        if (options.syncOperatorFeedLabels) {
          updateFounderTestOperatorFeedReportActionLabels(cardRuntime);
        }
        updateCopyReportButtonState();
        return finishClipboardCopy(resolveFounderTestReportHandoffText(cardRuntime, handoffRunId, fetchResult));
      });
    }

    if (!payload || !payload.text || !String(payload.text).trim()) {
      if (options.feedbackButton) {
        options.feedbackButton.textContent = 'Copy failed';
        if (options.resetOperatorFeedLabels) {
          window.setTimeout(function () {
            updateFounderTestOperatorFeedReportActionLabels(cardRuntime);
          }, 2200);
        }
      }
      if (options.onFailed) options.onFailed();
      return Promise.resolve({ ok: false, method: 'none' });
    }

    return finishClipboardCopy(String(payload.text));
  }

  function openFounderTestReportHandoffShared(options) {
    options = options || {};
    var cardRuntime = options.runtime || founderTestRuntimeCardSnapshot || resolveActiveFounderTestRuntimeSnapshot();
    var handoffRunId = coerceReportHandoffRunId(options.runId || null, cardRuntime);
    var reportRuntime = resolveActiveFounderTestRuntimeSnapshot();
    var modal = el('founder-test-report-modal');
    var body = el('founder-test-report-modal-body');
    if (!modal || !body) return Promise.resolve();

    function showReportText(text) {
      body.textContent =
        text && String(text).trim()
          ? String(text)
          : 'No founder test report is available yet. Use Retry Fetch Result or wait for the run to finish.';
      modal.removeAttribute('hidden');
      modal.setAttribute('aria-hidden', 'false');
    }

    if (cardRuntime && detectFounderTestRuntimeReportMismatch(cardRuntime, reportRuntime)) {
      founderTestRuntimeReportBindingMismatch = true;
      return refreshActiveFounderTestReportBinding(true).then(function () {
        return openFounderTestReportHandoffShared(options);
      });
    }

    var payload = buildFounderTestCopyPayload(cardRuntime);
    if (payload && payload.text && String(payload.text).trim() && !payload.needsFetch) {
      showReportText(payload.text);
      return Promise.resolve();
    }

    var openCached = resolveFounderTestFinalReportMarkdown(handoffRunId);
    if (openCached.markdown) {
      showReportText(openCached.markdown);
      return Promise.resolve();
    }

    if (payload && payload.needsFetch && handoffRunId) {
      markFounderTestFinalReportFetching(handoffRunId);
      updateFounderTestOperatorFeedReportActionLabels(cardRuntime);
      updateCopyReportButtonState();
      body.textContent = 'Fetching Report...';
      modal.removeAttribute('hidden');
      modal.setAttribute('aria-hidden', 'false');
      return fetchFounderTestResultWithRetry(handoffRunId, FOUNDER_TEST_RESULT_FETCH_MAX_ATTEMPTS).then(function (fetchResult) {
        if (!hasFounderTestFinalReportAvailable(handoffRunId)) {
          if (fetchResult && fetchResult.fetchFailed) {
            markFounderTestFinalReportFetchFailed(handoffRunId);
          } else {
            founderTestOperatorFeedReportFetching = false;
            founderTestOperatorFeedReportFetchInFlight = false;
          }
        }
        updateFounderTestOperatorFeedReportActionLabels(cardRuntime);
        updateCopyReportButtonState();
        showReportText(resolveFounderTestReportHandoffText(cardRuntime, handoffRunId, fetchResult));
      });
    }

    showReportText(payload && payload.text ? payload.text : '');
    return Promise.resolve();
  }

  function setCopyReportButtonFeedback(state) {
    var copyBtn = el('copy-founder-test-report');
    if (!copyBtn) return;
    copyBtn.classList.remove('is-copied', 'is-copy-failed');
    if (copyReportFeedbackTimer != null) {
      window.clearTimeout(copyReportFeedbackTimer);
      copyReportFeedbackTimer = null;
    }
    if (state === 'copied') {
      copyBtn.textContent = 'Copied';
      copyBtn.classList.add('is-copied');
      copyReportFeedbackTimer = window.setTimeout(function () {
        updateCopyReportButtonState();
      }, 2200);
      return;
    }
    if (state === 'failed') {
      copyBtn.textContent = 'Copy failed';
      copyBtn.classList.add('is-copy-failed');
      copyReportFeedbackTimer = window.setTimeout(function () {
        updateCopyReportButtonState();
      }, 2600);
    }
  }

  function updateCopyReportButtonState() {
    var copyBtn = el('copy-founder-test-report');
    var openBtn = el('open-founder-test-report');
    if (!copyBtn && !openBtn) return;
    var payload = buildFounderTestCopyPayload();
    var activeRuntime = resolveActiveFounderTestRuntimeSnapshot();
    var hasText = !!(payload && payload.text && String(payload.text).trim());
    var canFetchComplete = !!(payload && payload.needsFetch && payload.runId && !hasText);
    var panelLabels = resolveFounderTestResultsPanelReportActionLabels(activeRuntime);
    var buttonsEnabled = panelLabels.enabled !== false && (hasText || canFetchComplete);
    if (copyBtn) {
      copyBtn.disabled = !buttonsEnabled;
      copyBtn.setAttribute('aria-disabled', buttonsEnabled ? 'false' : 'true');
      if (copyBtn.textContent !== 'Copied' && copyBtn.textContent !== 'Copy failed') {
        copyBtn.textContent = panelLabels.copy;
      }
      copyBtn.classList.remove('is-copied', 'is-copy-failed');
    }
    if (openBtn) {
      openBtn.disabled = !buttonsEnabled;
      openBtn.setAttribute('aria-disabled', buttonsEnabled ? 'false' : 'true');
      openBtn.textContent = panelLabels.open;
    }
  }

  function copyTextToClipboardWithFallback(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () {
        return { ok: true, method: 'clipboard' };
      });
    }
    return new Promise(function (resolve) {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', 'readonly');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        var ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        resolve({ ok: ok, method: 'execCommand' });
      } catch (copyErr) {
        document.body.removeChild(textarea);
        resolve({ ok: false, method: 'execCommand', error: copyErr });
      }
    });
  }

  function renderFounderTestRuntimeFailedOverlay(errorMessage) {
    var snap = lastFounderTestRuntimeSnapshot;
    if (!snap) {
      renderFounderTestRuntime({
        state: 'FAILED',
        runId: null,
        uiSummary: {
          headline: 'Founder Test Failed',
          stageLine: errorMessage || 'Connection lost before completion',
          elapsedLine: 'Elapsed: —',
          remainingLine: 'Remaining: —',
        },
        feed: { events: [] },
        progress: { currentStageOrder: 0, totalStages: 11, currentStageLabel: 'Failed' },
      });
      return;
    }
    var failedSnap = {
      runId: snap.runId,
      state: snap.state === 'COMPLETE' ? snap.state : 'FAILED',
      alreadyRunning: false,
      uiSummary: {
        headline: 'Founder Test Failed',
        stageLine: errorMessage || (snap.uiSummary && snap.uiSummary.stageLine) || 'Execution stopped',
        elapsedLine: (snap.uiSummary && snap.uiSummary.elapsedLine) || 'Elapsed: —',
        remainingLine: 'Remaining: —',
      },
      feed: snap.feed || { events: [] },
      progress: snap.progress || { currentStageOrder: 0, totalStages: 11, currentStageLabel: 'Failed' },
      stallAnalysis: snap.stallAnalysis,
      lastHeartbeatAt: snap.lastHeartbeatAt,
      secondsSinceLastHeartbeat: snap.secondsSinceLastHeartbeat,
      currentStageTimeoutMs: snap.currentStageTimeoutMs,
      stallReason: snap.stallReason,
    };
    renderFounderTestRuntime(failedSnap);
  }

  function showFounderTestError(message, context) {
    context = context || {};
    lastFounderTestErrorMessage = message || 'Unknown error';
    if (context.runtime) {
      lastFounderTestRuntimeSnapshot = context.runtime;
    }
    if (context.partialReportMarkdown) {
      lastFounderTestPartialReportMarkdown = context.partialReportMarkdown;
    }
    var runtime = context.runtime || lastFounderTestRuntimeSnapshot;
    if (runtime && isFounderTestCompleteSuccessState(runtime.state)) {
      if (isGenericFailedToFetchMessage(lastFounderTestErrorMessage)) {
        founderTestRuntimeReportFetchFailed = true;
        recordFounderTestResultFetchAttempt({
          requestedUrl: runtime.runId ? buildFounderTestResultFetchUrl(runtime.runId) : 'n/a',
          requestedRunId: runtime.runId || null,
          fetchErrorMessage: lastFounderTestErrorMessage,
          httpStatus: null,
          responseContentType: null,
          jsonParseFailed: false,
          nonJsonResponsePreview: null,
          resultDebugResponse: founderTestResultDebugSnapshot,
        });
      }
      var bodyComplete = el('founder-test-panel-body');
      if (bodyComplete) {
        bodyComplete.innerHTML =
          '<p class="founder-test-error">Founder Test complete — final report handoff failed.</p>' +
          '<p class="hint">Use <strong>Copy Handoff Diagnostic</strong> or <strong>Open Report</strong> for fetch/debug proof.</p>';
      }
      deliverFounderTestReportNotification({
        data: {
          runId: runtime.runId,
          state: 'COMPLETE',
          failureReportMarkdown: buildCompleteFounderTestHandoffDiagnostic(
            runtime,
            runtime.runId,
            lastFounderTestErrorMessage,
          ),
        },
        runtime: runtime,
        errorMessage: lastFounderTestErrorMessage,
      });
      renderFounderTestRuntime(runtime);
      updateCopyReportButtonState();
      showFounderTestPanel('done');
      return;
    }
    var body = el('founder-test-panel-body');
    var runtimeHint = '';
    if (lastFounderTestRuntimeSnapshot && lastFounderTestRuntimeSnapshot.progress) {
      runtimeHint =
        '<p class="hint">Last known stage: <strong>' +
        escapeHtml(
          'Stage ' +
            String(lastFounderTestRuntimeSnapshot.progress.currentStageOrder) +
            '/' +
            String(lastFounderTestRuntimeSnapshot.progress.totalStages) +
            ' — ' +
            (lastFounderTestRuntimeSnapshot.progress.currentStageLabel || 'unknown'),
        ) +
        '</strong></p>';
    }
    if (body) {
      body.innerHTML =
        '<p class="founder-test-error">Founder test failed: ' +
        escapeHtml(lastFounderTestErrorMessage) +
        '</p>' +
        runtimeHint +
        '<p class="hint">Use <strong>Copy Report</strong> to copy the full report, partial report, or runtime diagnostic snapshot.</p>';
    }
    renderFounderTestRuntimeFailedOverlay(lastFounderTestErrorMessage);
    deliverFounderTestReportNotification({
      data: {
        runId: lastFounderTestRuntimeSnapshot && lastFounderTestRuntimeSnapshot.runId,
        state:
          lastFounderTestRuntimeSnapshot && lastFounderTestRuntimeSnapshot.state === 'STALLED'
            ? 'STALLED'
            : 'FAILED',
        partialReportMarkdown: lastFounderTestPartialReportMarkdown,
        failureReportMarkdown: lastFounderTestRuntimeSnapshot
          ? buildRuntimeFailureReportText(lastFounderTestRuntimeSnapshot, lastFounderTestErrorMessage)
          : null,
        error: lastFounderTestErrorMessage,
      },
      runtime: lastFounderTestRuntimeSnapshot,
      errorMessage: lastFounderTestErrorMessage,
    });
    updateCopyReportButtonState();
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
    if (founderTestRunning) {
      renderLocalFounderTestRuntimePreview('Duplicate run blocked — please wait');
      return;
    }
    founderTestRunning = true;
    founderTestUnifiedTraceExpanded = false;
    lastFounderTestPostTimedOut = false;
    lastRenderedRuntimeFeedKey = '';
    lastRenderedOperatorTraceKey = '';
    localFounderTestPreviewRunId = null;
    founderTestRuntimeDismissed = false;
    founderTestRunningDiagnosticDelivered = false;
    founderTestRunStartedAt = Date.now();
    lastKnownActiveFounderTestRuntimeSnapshot = null;
    founderTestRuntimeCardSnapshot = null;
    founderTestRuntimeReportBindingMismatch = false;
    founderTestOperatorFeedReportFetching = false;
    founderTestOperatorFeedReportFetchInFlight = false;
    founderTestRuntimeReportFetchFailed = false;
    resetFounderTestReportHandoffStallState();
    founderTestLastResultFetchDiagnostic = null;
    founderTestFinalReportFetchStateByRunId = Object.create(null);
    founderTestRuntimePinnedRunId = null;
    activateOperatorFeedFounderTestMode(null);
    var runBtn = el('run-founder-test');
    if (runBtn) {
      runBtn.disabled = true;
      runBtn.classList.add('is-running');
    }
    lastFounderTestErrorMessage = null;
    var copyBtn = el('copy-founder-test-report');
    if (copyBtn) {
      copyBtn.disabled = true;
      copyBtn.setAttribute('aria-disabled', 'true');
    }
    var openReportBtnAtRun = el('open-founder-test-report');
    if (openReportBtnAtRun) {
      openReportBtnAtRun.disabled = true;
      openReportBtnAtRun.setAttribute('aria-disabled', 'true');
    }
    showFounderTestPanel('running');
    renderVerificationSurface(workspaceData);
    renderLocalFounderTestRuntimePreview('Local screen checks');

    try {
      var live = await runFounderTestLiveChecks();
      renderLocalFounderTestRuntimePreview('Founder interaction simulation');
      var interactionLive = await runFounderTestInteractionChecks();
      renderLocalFounderTestRuntimePreview('Connecting to founder test API');
      startFounderTestRuntimePolling();
      await pollFounderTestRuntimeStatusOnce();

      var liveResults = live.results.slice();
      liveResults.push(interactionLive);
      var res;
      var data = null;
      try {
        res = await fetch(buildFounderTestRunUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            liveResults: liveResults,
            liveSection:
              live.liveSection +
              '\n- Founder Interaction Simulation: ' +
              (interactionLive.passed ? 'PASS' : 'FAIL'),
          }),
        });
        rememberFounderTestApiOriginFromUrl(buildFounderTestRunUrl());
      } catch (fetchErr) {
        lastFounderTestPostTimedOut = true;
        var runtimeAfterFetchFailure = await pollFounderTestRuntimeStatusOnce();
        if (runtimeAfterFetchFailure) {
          runtimeAfterFetchFailure.postTimedOut = true;
          lastFounderTestRuntimeSnapshot = runtimeAfterFetchFailure;
        }
        throw {
          fetchFailure: true,
          message: formatFounderTestFetchError(fetchErr),
          runtime: runtimeAfterFetchFailure || lastFounderTestRuntimeSnapshot,
        };
      }

      try {
        data = await res.json();
      } catch (parseErr) {
        var runtimeAfterParseFailure = await pollFounderTestRuntimeStatusOnce();
        throw {
          fetchFailure: true,
          message: 'Founder test response was not valid JSON (HTTP ' + String(res.status) + ').',
          runtime: runtimeAfterParseFailure || lastFounderTestRuntimeSnapshot,
        };
      }

      if (res.status === 409 && data.errorCode === 'FOUNDER_TEST_ALREADY_RUNNING') {
        if (data.runtime) lastFounderTestRuntimeSnapshot = data.runtime;
        renderFounderTestRuntime(data.runtime);
        throw new Error('Founder Test is already running. Please wait for the current run to finish.');
      }

      if ((res.status === 202 || data.accepted) && data.runId) {
        if (data.runtime) {
          lastFounderTestRuntimeSnapshot = data.runtime;
          renderFounderTestRuntime(data.runtime);
        }
        data = await waitForFounderTestAsyncResult(data.runId);
        if (data.runtime) {
          lastFounderTestRuntimeSnapshot = data.runtime;
          renderFounderTestRuntime(data.runtime);
        }
      } else if (data.runtime) {
        lastFounderTestRuntimeSnapshot = data.runtime;
        renderFounderTestRuntime(data.runtime);
      }

      if (data.founderTestLaunchReadinessReportMarkdown) {
        lastFounderTestPartialReportMarkdown = data.founderTestLaunchReadinessReportMarkdown;
      }

      if (!data.ok) {
        throw new Error((data && data.error) || 'Founder test API failed');
      }
      if (data.report && data.report.reportMarkdown) {
        applyFounderTestFinalReport(
          normalizeFounderTestDeliveryRunId(data.runId, data.runtime),
          data.report.reportMarkdown,
          'run-complete',
          {
            runtime: data.runtime || lastFounderTestRuntimeSnapshot,
            reportObject: data.report,
            generatedAt: data.generatedAt,
          },
        );
      } else if (data.reportMarkdown) {
        applyFounderTestFinalReport(
          normalizeFounderTestDeliveryRunId(data.runId, data.runtime),
          data.reportMarkdown,
          'run-complete-markdown',
          {
            runtime: data.runtime || lastFounderTestRuntimeSnapshot,
            generatedAt: data.generatedAt,
          },
        );
      } else if (!isFounderTestCompleteSuccessState(data.state)) {
        throw new Error((data && data.error) || 'Founder test API failed');
      }
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
      showFounderTestPanel('done');
      updateCopyReportButtonState();
    } catch (err) {
      var errorMessage =
        err && err.fetchFailure && err.message
          ? err.message
          : err && err.message
            ? err.message
            : 'Unknown error';
      showFounderTestError(errorMessage, {
        runtime:
          (err && err.runtime) ||
          lastFounderTestRuntimeSnapshot ||
          null,
        partialReportMarkdown: lastFounderTestPartialReportMarkdown,
      });
    } finally {
      stopFounderTestRuntimePolling();
      founderTestRunning = false;
      var btn = el('run-founder-test');
      if (btn) {
        btn.disabled = false;
        btn.classList.remove('is-running');
      }
      updateCopyReportButtonState();
    }
  }

  function copyFounderTestReport() {
    copyFounderTestReportHandoffShared({
      syncOperatorFeedLabels: true,
      onCopied: function () {
        setCopyReportButtonFeedback('copied');
      },
      onFailed: function () {
        setCopyReportButtonFeedback('failed');
      },
    });
  }

  function openFounderTestResultsPanelReport() {
    openFounderTestReportHandoffShared();
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
    var workspaceTabAdd = el('workspace-tab-add');
    if (workspaceTabAdd) {
      workspaceTabAdd.addEventListener('click', function () {
        createNewProjectTab('Project ' + (projectTabCounter + 1));
      });
    }
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

    var uploadBtn = el('chat-upload-btn');
    var uploadInput = el('chat-upload-input');
    if (uploadBtn && uploadInput) {
      uploadBtn.addEventListener('click', function () {
        if (typeof uploadInput.showPicker === 'function') {
          try {
            uploadInput.showPicker();
            return;
          } catch (pickerErr) {
            /* fall through to click */
          }
        }
        uploadInput.click();
      });
      uploadInput.addEventListener('change', function () {
        if (uploadInput.files && uploadInput.files.length) {
          pushNotification('Upload coming soon — selected: ' + uploadInput.files[0].name);
        } else {
          pushNotification('Upload coming soon');
        }
        uploadInput.value = '';
      });
    } else if (uploadBtn) {
      uploadBtn.addEventListener('click', function () {
        pushNotification('Upload coming soon');
      });
    }

    var voiceBtn = el('chat-voice-btn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', function () {
        pushNotification('Voice notes coming soon');
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
          markAllNotificationsRead();
        } else {
          drawer.setAttribute('hidden', '');
          notifToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    var reportModalClose = el('founder-test-report-modal-close');
    var reportModalBackdrop = el('founder-test-report-modal-backdrop');
    if (reportModalClose) reportModalClose.addEventListener('click', hideFounderTestReportModal);
    if (reportModalBackdrop) reportModalBackdrop.addEventListener('click', hideFounderTestReportModal);

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
    var openReportBtn = el('open-founder-test-report');
    if (openReportBtn) {
      openReportBtn.addEventListener('click', openFounderTestResultsPanelReport);
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

  loadVerificationHub(false)
    .then(function () {
      if (currentViewId === 'verification') {
        refreshVerificationHubPanel();
      }
    })
    .catch(function () {
      /* Verification Hub falls back to loading state in Verification view */
    });

  loadProductArchitect(false)
    .then(function () {
      if (currentViewId === 'founder-review') {
        renderFounderReviewSurface(workspaceData);
      }
    })
    .catch(function () {
      /* Product Architect Review falls back to loading state in Founder Review view */
    });

  loadTrustCalibration(false)
    .then(function () {
      if (currentViewId === 'founder-review') {
        renderFounderReviewSurface(workspaceData);
      }
    })
    .catch(function () {
      /* Trust Calibration falls back to loading state in Founder Review view */
    });

  loadLargeScaleValidation(false)
    .then(function () {
      if (currentViewId === 'verification') {
        renderVerificationSurface(workspaceData, manifestData);
      }
    })
    .catch(function () {
      /* Large-Scale Validation falls back to loading state */
    });

  loadExecutionPipeline(false)
    .then(function () {
      if (currentViewId === 'verification') {
        renderVerificationSurface(workspaceData, manifestData);
      }
    })
    .catch(function () {
      /* Execution Pipeline falls back to loading state */
    });

  fetch(buildFounderTestApiUrl('/api/founder-reality.json', null))
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load manifest');
      rememberFounderTestApiOriginFromUrl(buildFounderTestApiUrl('/api/founder-reality.json', null));
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
