/**
 * Project Session Continuity V1 — Command Center browser bridge.
 */
(function projectSessionContinuity(global) {
  'use strict';

  var CONTRACT_VERSION = 'PROJECT_SESSION_CONTINUITY_V1';
  var ACTIVE_PATH = '/api/project-sessions/active';
  var MESSAGES_PATH = '/api/project-sessions/messages';
  var ACTIVATE_PATH = '/api/project-sessions/activate';
  var HYDRATED_TRACE = 'PROJECT_SESSION_CONTINUITY_HYDRATED';

  function fetchActiveSession(projectId, sessionId) {
    var query = '';
    if (projectId) {
      query = '?projectId=' + encodeURIComponent(projectId);
      if (sessionId) query += '&sessionId=' + encodeURIComponent(sessionId);
    }
    return fetch(ACTIVE_PATH + query, { method: 'GET', cache: 'no-store' }).then(function (res) {
      return res.text().then(function (bodyText) {
        if (!res.ok) throw new Error('Project session fetch failed — HTTP ' + res.status);
        var payload = JSON.parse(bodyText);
        if (payload.contractVersion !== CONTRACT_VERSION) {
          throw new Error('Project session contract mismatch');
        }
        return payload;
      });
    });
  }

  function persistSessionMessage(input) {
    return fetch(MESSAGES_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(input),
    }).then(function (res) {
      return res.text().then(function (bodyText) {
        if (!res.ok) throw new Error('Project session message persist failed — HTTP ' + res.status);
        return JSON.parse(bodyText);
      });
    });
  }

  function activateProjectSession(projectId, sessionId) {
    return fetch(ACTIVATE_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ projectId: projectId, sessionId: sessionId || null }),
    }).then(function (res) {
      return res.text().then(function (bodyText) {
        if (!res.ok) throw new Error('Project session activate failed — HTTP ' + res.status);
        return JSON.parse(bodyText);
      });
    });
  }

  function applySessionContextToWorkspace(context, workspaceData, multiProjectWorkspaces) {
    if (!context || !context.projectId) return { workspaceData: workspaceData, multiProjectWorkspaces: multiProjectWorkspaces };
    workspaceData = workspaceData || {};
    workspaceData.projectSession = context;
    workspaceData.activeProjectId = context.projectId;
    workspaceData.activeSessionId = context.sessionId;

    var previewUrl = context.previewUrl || null;
    var buildStatus = context.buildStatus || 'IDLE';
    var found = false;
    multiProjectWorkspaces = (multiProjectWorkspaces || []).slice();
    for (var i = 0; i < multiProjectWorkspaces.length; i += 1) {
      if (multiProjectWorkspaces[i].projectId !== context.projectId) continue;
      found = true;
      multiProjectWorkspaces[i].previewUrl = previewUrl || multiProjectWorkspaces[i].previewUrl;
      multiProjectWorkspaces[i].buildStatus = buildStatus || multiProjectWorkspaces[i].buildStatus;
      multiProjectWorkspaces[i].workspacePath = context.workspacePath || multiProjectWorkspaces[i].workspacePath;
      multiProjectWorkspaces[i].buildProfile = context.buildProfile || multiProjectWorkspaces[i].buildProfile;
      multiProjectWorkspaces[i].livePreviewAvailable = Boolean(previewUrl);
    }
    workspaceData.multiProjectWorkspaces = multiProjectWorkspaces;

    workspaceData.livePreview = Object.assign({}, workspaceData.livePreview || {}, {
      previewUrl: previewUrl,
      connected: Boolean(previewUrl),
      livePreviewAvailable: Boolean(previewUrl),
      buildStatus: buildStatus,
      previewBindingReason: context.previewBindingReason || null,
      previewRepairAction: context.previewRepairAction || null,
      onePromptBuild: Object.assign({}, (workspaceData.livePreview && workspaceData.livePreview.onePromptBuild) || {}, {
        previewUrl: previewUrl,
        status: buildStatus,
        workspacePath: context.workspacePath,
        generatedProfile: context.buildProfile,
        livePreviewAvailable: Boolean(previewUrl),
      }),
    });

    return { workspaceData: workspaceData, multiProjectWorkspaces: multiProjectWorkspaces };
  }

  function chatHtmlFromSessionContext(context) {
    if (!context) return '';
    if (context.chatHistoryHtml && String(context.chatHistoryHtml).trim()) {
      return context.chatHistoryHtml;
    }
    if (!context.chatMessages || !context.chatMessages.length) return '';
    var html = '';
    for (var i = 0; i < context.chatMessages.length; i += 1) {
      var message = context.chatMessages[i];
      if (message.html) {
        html += message.html;
      } else {
        html +=
          '<div class="chat-message ' +
          message.role +
          '">' +
          String(message.text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;') +
          '</div>';
      }
    }
    return html;
  }

  global.ProjectSessionContinuity = {
    CONTRACT_VERSION: CONTRACT_VERSION,
    ACTIVE_PATH: ACTIVE_PATH,
    MESSAGES_PATH: MESSAGES_PATH,
    ACTIVATE_PATH: ACTIVATE_PATH,
    HYDRATED_TRACE: HYDRATED_TRACE,
    fetchActiveSession: fetchActiveSession,
    persistSessionMessage: persistSessionMessage,
    activateProjectSession: activateProjectSession,
    applySessionContextToWorkspace: applySessionContextToWorkspace,
    chatHtmlFromSessionContext: chatHtmlFromSessionContext,
  };
})(window);
