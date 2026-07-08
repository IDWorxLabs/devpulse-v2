/**
 * Command Center Chat Execution Audit V1 — browser forensic client.
 */
(function commandCenterChatExecutionAudit(global) {
  'use strict';

  var CONTRACT_VERSION = 'COMMAND_CENTER_CHAT_EXECUTION_AUDIT_V1';
  var PASS_TOKEN = 'COMMAND_CENTER_CHAT_EXECUTION_AUDIT_V1_PASS';
  var EVENT_PATH = '/api/command-center/chat-execution-audit/event';
  var LATEST_PATH = '/api/command-center/chat-execution-audit/latest';

  var EVENTS = {
    FORM_SUBMIT_ENTER: 'COMMAND_CENTER_CHAT_AUDIT_FORM_SUBMIT_ENTER',
    FORM_SUBMIT_NO_INPUT: 'COMMAND_CENTER_CHAT_AUDIT_FORM_SUBMIT_NO_INPUT',
    FORM_SUBMIT_EMPTY_MESSAGE: 'COMMAND_CENTER_CHAT_AUDIT_FORM_SUBMIT_EMPTY_MESSAGE',
    FORM_SUBMIT_DISPATCHED: 'COMMAND_CENTER_CHAT_AUDIT_FORM_SUBMIT_DISPATCHED',
    ASK_BRAIN_ENTER: 'COMMAND_CENTER_CHAT_AUDIT_ASK_BRAIN_ENTER',
    ASK_BRAIN_BLOCKED_RUNTIME_TRUTH: 'COMMAND_CENTER_CHAT_AUDIT_ASK_BRAIN_BLOCKED_RUNTIME_TRUTH',
    ASK_BRAIN_BLOCKED_RUNTIME_HEALTH: 'COMMAND_CENTER_CHAT_AUDIT_ASK_BRAIN_BLOCKED_RUNTIME_HEALTH',
    ASK_BRAIN_BLOCKED_RUNTIME_POLL_FAILED: 'COMMAND_CENTER_CHAT_AUDIT_ASK_BRAIN_BLOCKED_RUNTIME_POLL_FAILED',
    SHOW_THINKING: 'COMMAND_CENTER_CHAT_AUDIT_SHOW_THINKING',
    SHOW_THINKING_SKIPPED_NO_HISTORY: 'COMMAND_CENTER_CHAT_AUDIT_SHOW_THINKING_SKIPPED_NO_HISTORY',
    CLASSIFY_START: 'COMMAND_CENTER_CHAT_AUDIT_CLASSIFY_START',
    CLASSIFY_COMPLETE: 'COMMAND_CENTER_CHAT_AUDIT_CLASSIFY_COMPLETE',
    FETCH_PAYLOAD_CREATED: 'COMMAND_CENTER_CHAT_AUDIT_FETCH_PAYLOAD_CREATED',
    FETCH_START: 'COMMAND_CENTER_CHAT_AUDIT_FETCH_START',
    FETCH_RESPONSE: 'COMMAND_CENTER_CHAT_AUDIT_FETCH_RESPONSE',
    FETCH_ERROR: 'COMMAND_CENTER_CHAT_AUDIT_FETCH_ERROR',
    TRACE_RENDER_START: 'COMMAND_CENTER_CHAT_AUDIT_TRACE_RENDER_START',
    TRACE_RENDER_EMPTY: 'COMMAND_CENTER_CHAT_AUDIT_TRACE_RENDER_EMPTY',
    TRACE_RENDER_COMPLETE: 'COMMAND_CENTER_CHAT_AUDIT_TRACE_RENDER_COMPLETE',
    RESPONSE_RENDERED: 'COMMAND_CENTER_CHAT_AUDIT_RESPONSE_RENDERED',
    NO_OP_DETECTED: 'COMMAND_CENTER_CHAT_AUDIT_NO_OP_DETECTED',
    SEND_BUTTON_DISABLED: 'COMMAND_CENTER_CHAT_AUDIT_SEND_BUTTON_DISABLED',
    AFTER_USER_MESSAGE_RENDERED: 'COMMAND_CENTER_CHAT_AUDIT_AFTER_USER_MESSAGE_RENDERED',
    DEGRADED_RUNTIME_TRUTH_CONTINUE: 'COMMAND_CENTER_CHAT_AUDIT_DEGRADED_RUNTIME_TRUTH_CONTINUE',
    RUNTIME_TRUTH_REHYDRATE_START: 'COMMAND_CENTER_CHAT_AUDIT_RUNTIME_TRUTH_REHYDRATE_START',
    RUNTIME_TRUTH_REHYDRATE_COMPLETE: 'COMMAND_CENTER_CHAT_AUDIT_RUNTIME_TRUTH_REHYDRATE_COMPLETE',
    SESSION_REPAIR_START: 'COMMAND_CENTER_CHAT_AUDIT_SESSION_REPAIR_START',
    SESSION_REPAIR_COMPLETE: 'COMMAND_CENTER_CHAT_AUDIT_SESSION_REPAIR_COMPLETE',
    SESSION_REPAIR_SKIPPED: 'COMMAND_CENTER_CHAT_AUDIT_SESSION_REPAIR_SKIPPED',
    PROJECT_CONTEXT_WARNING: 'COMMAND_CENTER_CHAT_AUDIT_PROJECT_CONTEXT_WARNING',
    FETCH_WATCHDOG_ARMED: 'COMMAND_CENTER_CHAT_AUDIT_FETCH_WATCHDOG_ARMED',
    FETCH_WATCHDOG_TRIGGERED: 'COMMAND_CENTER_CHAT_AUDIT_FETCH_WATCHDOG_TRIGGERED',
    CHAT_EXECUTION_STOPPED_AFTER_RENDER: 'COMMAND_CENTER_CHAT_AUDIT_CHAT_EXECUTION_STOPPED_AFTER_RENDER',
    VISIBLE_BLOCKING_ERROR_SHOWN: 'COMMAND_CENTER_CHAT_AUDIT_VISIBLE_BLOCKING_ERROR_SHOWN',
  };

  var activeAuditId = null;
  var localEvents = [];

  function createAuditId() {
    return 'cc-audit-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  }

  function postAudit(body) {
    try {
      fetch(EVENT_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(body),
      }).catch(function () {
        /* audit must never block chat */
      });
    } catch (postErr) {
      /* ignore */
    }
  }

  function record(auditId, layer, name, detail, metadata) {
    if (!auditId) return;
    var event = {
      auditId: auditId,
      timestamp: Date.now(),
      layer: layer,
      name: name,
      detail: detail,
      metadata: metadata || null,
    };
    localEvents.push(event);
    postAudit({
      auditId: auditId,
      layer: layer,
      name: name,
      detail: detail,
      metadata: metadata,
    });
  }

  function recordNoOp(auditId, blockingEvent, reason, metadata) {
    record(auditId, 'browser', blockingEvent, reason, metadata);
    record(auditId, 'browser', EVENTS.NO_OP_DETECTED, reason, metadata);
    postAudit({
      auditId: auditId,
      finalize: { outcome: 'NO_OP', noOpReason: reason },
    });
    renderDiagnosticCard({
      auditId: auditId,
      reason: reason,
      blockingEvent: blockingEvent,
    });
  }

  function startAudit(input) {
    input = input || {};
    var auditId = createAuditId();
    activeAuditId = auditId;
    localEvents = [];
    postAudit({
      auditId: auditId,
      start: true,
      messagePreview: input.messagePreview || '',
      activeProjectId: input.activeProjectId || null,
      activeSessionId: input.activeSessionId || null,
      projectName: input.projectName || null,
      detail: 'Audit trail started.',
    });
    if (input.sendButtonDisabled) {
      record(
        auditId,
        'browser',
        EVENTS.SEND_BUTTON_DISABLED,
        'Send button disabled when submit attempted.',
        {
          runtimeTruthReady: input.runtimeTruthReady === true,
          localRuntimeHealthy: input.localRuntimeHealthy === true,
        },
      );
    }
    return auditId;
  }

  function getActiveAuditId() {
    return activeAuditId;
  }

  function clearActiveAudit() {
    activeAuditId = null;
    localEvents = [];
    hideDiagnosticCard();
  }

  function renderDiagnosticCard(input) {
    var card = document.getElementById('chat-execution-audit-card');
    if (!card) return;
    card.hidden = false;
    card.classList.remove('hidden');
    card.innerHTML =
      '<div class="chat-execution-audit-card-inner">' +
      '<strong>Chat execution audit — no visible progress</strong>' +
      '<p class="chat-execution-audit-reason">' +
      String(input.reason || 'Unknown no-op') +
      '</p>' +
      '<p class="chat-execution-audit-meta">Audit ID: ' +
      String(input.auditId || 'unknown') +
      ' · Event: ' +
      String(input.blockingEvent || 'unknown') +
      '</p>' +
      '<button type="button" class="btn-secondary chat-execution-audit-dismiss">Dismiss</button>' +
      '<button type="button" class="btn-secondary chat-execution-audit-view">View audit trail</button>' +
      '</div>';
    var dismiss = card.querySelector('.chat-execution-audit-dismiss');
    if (dismiss) {
      dismiss.addEventListener('click', hideDiagnosticCard);
    }
    var view = card.querySelector('.chat-execution-audit-view');
    if (view) {
      view.addEventListener('click', function () {
        fetch(LATEST_PATH, { cache: 'no-store' })
          .then(function (res) {
            return res.json();
          })
          .then(function (payload) {
            console.info('[ChatExecutionAudit]', payload);
            alert(
              'Latest audit: ' +
                (payload.audit && payload.audit.outcome ? payload.audit.outcome : 'unknown') +
                '\nEvents: ' +
                (payload.audit && payload.audit.events ? payload.audit.events.length : 0),
            );
          })
          .catch(function () {
            alert('Could not load latest audit trail.');
          });
      });
    }
  }

  function hideDiagnosticCard() {
    var card = document.getElementById('chat-execution-audit-card');
    if (!card) return;
    card.hidden = true;
    card.classList.add('hidden');
    card.innerHTML = '';
  }

  function finalizeAudit(auditId, outcome, noOpReason) {
    postAudit({
      auditId: auditId,
      finalize: { outcome: outcome, noOpReason: noOpReason || null },
    });
    if (outcome !== 'NO_OP') {
      hideDiagnosticCard();
    }
    if (activeAuditId === auditId) {
      activeAuditId = null;
    }
  }

  global.CommandCenterChatExecutionAudit = {
    CONTRACT_VERSION: CONTRACT_VERSION,
    PASS_TOKEN: PASS_TOKEN,
    EVENTS: EVENTS,
    EVENT_PATH: EVENT_PATH,
    LATEST_PATH: LATEST_PATH,
    startAudit: startAudit,
    record: record,
    recordNoOp: recordNoOp,
    finalizeAudit: finalizeAudit,
    getActiveAuditId: getActiveAuditId,
    clearActiveAudit: clearActiveAudit,
    renderDiagnosticCard: renderDiagnosticCard,
    hideDiagnosticCard: hideDiagnosticCard,
    getLocalEvents: function () {
      return localEvents.slice();
    },
  };
})(window);
