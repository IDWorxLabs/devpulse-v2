/**
 * Command Center Chat Response Execution Repair V1 — browser bridge.
 */
(function commandCenterChatResponseExecutionRepair(global) {
  'use strict';

  var CONTRACT_VERSION = 'COMMAND_CENTER_CHAT_RESPONSE_EXECUTION_REPAIR_V1';
  var PASS_TOKEN = 'COMMAND_CENTER_CHAT_RESPONSE_EXECUTION_REPAIR_V1_PASS';
  var FETCH_WATCHDOG_MS = 500;
  var POST_RENDER_STOPPED_MESSAGE = 'Chat execution stopped after local message render';

  var EVENTS = {
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

  var fetchStartedByAudit = Object.create(null);
  var watchdogTimers = Object.create(null);
  var lastSuccessfulStageByAudit = Object.create(null);

  function setLastStage(auditId, stage) {
    if (!auditId) return;
    lastSuccessfulStageByAudit[auditId] = stage;
  }

  function markFetchStarted(auditId) {
    if (!auditId) return;
    fetchStartedByAudit[auditId] = true;
    clearFetchWatchdog(auditId);
  }

  function clearFetchWatchdog(auditId) {
    if (!auditId || !watchdogTimers[auditId]) return;
    clearTimeout(watchdogTimers[auditId]);
    delete watchdogTimers[auditId];
  }

  function evaluateChatExecutionGate(input) {
    input = input || {};
    var healthReady = input.healthReady === true;
    var localHealthy = input.localRuntimeHealthy === true;
    var truthFresh = input.truthFresh === true;
    var lifecycle = input.runtimeReadinessLifecycle || 'UNAVAILABLE';

    if (!localHealthy && !healthReady) {
      if (lifecycle === 'CHECKING_HEALTH' || lifecycle === 'DEGRADED' || lifecycle === 'STARTING') {
        return {
          allowed: false,
          degraded: false,
          blocked: false,
          awaitingHealthPoll: true,
          blockReason: 'Awaiting local runtime health confirmation',
          blockingLayer: 'browser.runtime_health_poll',
          suggestedAction: 'Wait for health poll or restart AiDevEngine',
          auditEvent: null,
        };
      }
      return {
        allowed: false,
        degraded: false,
        blocked: true,
        awaitingHealthPoll: false,
        blockReason: 'Local runtime unhealthy — brain API unavailable',
        blockingLayer: 'browser.local_runtime_health',
        suggestedAction: 'Restart AiDevEngine using Start-AiDevEngine',
        auditEvent: EVENTS.VISIBLE_BLOCKING_ERROR_SHOWN,
      };
    }

    if (healthReady && !truthFresh) {
      return {
        allowed: true,
        degraded: true,
        blocked: false,
        awaitingHealthPoll: false,
        blockReason: null,
        blockingLayer: null,
        suggestedAction: null,
        auditEvent: EVENTS.DEGRADED_RUNTIME_TRUTH_CONTINUE,
      };
    }

    if (!input.runtimeTruthReady || !input.runtimeTruthClassifyAllowed) {
      if (healthReady) {
        return {
          allowed: true,
          degraded: true,
          blocked: false,
          awaitingHealthPoll: false,
          blockReason: null,
          blockingLayer: null,
          suggestedAction: null,
          auditEvent: EVENTS.DEGRADED_RUNTIME_TRUTH_CONTINUE,
        };
      }
      return {
        allowed: false,
        degraded: false,
        blocked: true,
        awaitingHealthPoll: false,
        blockReason: 'Runtime truth stale and brain health not ready',
        blockingLayer: 'browser.runtime_truth_gate',
        suggestedAction: 'Restart npm run dev and reload Command Center',
        auditEvent: EVENTS.VISIBLE_BLOCKING_ERROR_SHOWN,
      };
    }

    return {
      allowed: true,
      degraded: false,
      blocked: false,
      awaitingHealthPoll: false,
      blockReason: null,
      blockingLayer: null,
      suggestedAction: null,
      auditEvent: null,
    };
  }

  function evaluateSessionRepair(input) {
    input = input || {};
    if (!input.hasSessionContinuityApi) {
      return { needsRepair: false, canContinue: true, reason: 'Session API unavailable — server bootstrap' };
    }
    if (input.isLikelyBuildPrompt && !input.activeProjectId) {
      return {
        needsRepair: false,
        canContinue: true,
        reason: 'Build prompt without active project — server will bootstrap project context',
      };
    }
    if (input.isLikelyBuildPrompt && input.hydrationState === 'loading') {
      return {
        needsRepair: false,
        canContinue: true,
        reason: 'Build prompt during session hydration — server will bootstrap',
      };
    }
    if (input.hydrationState === 'loading') {
      return { needsRepair: true, canContinue: false, reason: 'Session hydration in progress' };
    }
    if (input.activeProjectId && !input.activeSessionId && input.hydrationState === 'empty') {
      return { needsRepair: true, canContinue: true, reason: 'Missing session for active project' };
    }
    return { needsRepair: false, canContinue: true, reason: null };
  }

  function renderPostRenderStoppedCard(input) {
    var card = document.getElementById('chat-execution-audit-card');
    if (!card) return;
    card.hidden = false;
    card.classList.remove('hidden');
    card.innerHTML =
      '<div class="chat-execution-audit-card-inner chat-response-repair-card">' +
      '<strong>' +
      POST_RENDER_STOPPED_MESSAGE +
      '</strong>' +
      '<p class="chat-execution-audit-reason">' +
      String(input.blockingReason || 'Unknown blocking reason') +
      '</p>' +
      '<p class="chat-execution-audit-meta">Audit ID: ' +
      String(input.auditId || 'unknown') +
      '</p>' +
      '<p class="chat-execution-audit-meta">Last successful stage: ' +
      String(input.lastSuccessfulStage || 'unknown') +
      '</p>' +
      '<p class="chat-execution-audit-meta">Suggested action: ' +
      String(input.suggestedAction || 'Check System Diagnostics and restart runtime') +
      '</p>' +
      '</div>';
  }

  function armFetchWatchdog(auditId, onTriggered) {
    if (!auditId) return;
    clearFetchWatchdog(auditId);
    var Audit = global.CommandCenterChatExecutionAudit;
    if (Audit && Audit.record) {
      Audit.record(
        auditId,
        'browser',
        EVENTS.FETCH_WATCHDOG_ARMED,
        'Fetch watchdog armed — 500ms without fetch start triggers diagnostic.',
      );
    }
    watchdogTimers[auditId] = setTimeout(function () {
      if (fetchStartedByAudit[auditId]) return;
      if (Audit && Audit.record) {
        Audit.record(
          auditId,
          'browser',
          EVENTS.FETCH_WATCHDOG_TRIGGERED,
          POST_RENDER_STOPPED_MESSAGE,
          {
            lastSuccessfulStage: lastSuccessfulStageByAudit[auditId] || 'unknown',
          },
        );
        if (Audit.recordNoOp) {
          Audit.recordNoOp(
            auditId,
            EVENTS.CHAT_EXECUTION_STOPPED_AFTER_RENDER,
            POST_RENDER_STOPPED_MESSAGE,
            {
              lastSuccessfulStage: lastSuccessfulStageByAudit[auditId] || 'unknown',
            },
          );
        }
      }
      renderPostRenderStoppedCard({
        auditId: auditId,
        blockingReason: 'No /api/brain/respond fetch started within 500ms after user message render',
        lastSuccessfulStage: lastSuccessfulStageByAudit[auditId] || 'User message rendered',
        suggestedAction: 'Check runtime truth diagnostics and retry Send',
      });
      if (typeof onTriggered === 'function') onTriggered();
    }, FETCH_WATCHDOG_MS);
  }

  global.CommandCenterChatResponseExecutionRepair = {
    CONTRACT_VERSION: CONTRACT_VERSION,
    PASS_TOKEN: PASS_TOKEN,
    FETCH_WATCHDOG_MS: FETCH_WATCHDOG_MS,
    POST_RENDER_STOPPED_MESSAGE: POST_RENDER_STOPPED_MESSAGE,
    EVENTS: EVENTS,
    evaluateChatExecutionGate: evaluateChatExecutionGate,
    evaluateSessionRepair: evaluateSessionRepair,
    setLastStage: setLastStage,
    markFetchStarted: markFetchStarted,
    armFetchWatchdog: armFetchWatchdog,
    clearFetchWatchdog: clearFetchWatchdog,
    renderPostRenderStoppedCard: renderPostRenderStoppedCard,
  };
})(window);
