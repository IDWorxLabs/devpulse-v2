/**
 * Command Center Restart Resilience V1 — browser helpers.
 */
(function commandCenterRestartResilience(global) {
  'use strict';

  var HEALTH_POLL_WINDOW_MS = 10000;
  var STALE_RUNTIME_ERROR_PATTERNS = [
    /local runtime is stale or unavailable/i,
    /local runtime not ready/i,
    /restart using start-aidevengine/i,
    /brain health endpoint unreachable/i,
    /local runtime unavailable/i,
    /brain health check failed/i,
    /brain could not respond/i,
  ];
  var STALE_RUNTIME_CHAT_PATTERNS = [
    /local runtime is stale or unavailable/i,
    /local runtime not ready/i,
    /brain could not respond/i,
    /restart using start-aidevengine/i,
  ];
  var SIDEBAR_STATUS_BY_LIFECYCLE = {
    STARTING: 'Starting AiDevEngine runtime…',
    CHECKING_HEALTH: 'Checking runtime health…',
    READY: 'AiDevEngine local runtime connected',
    DEGRADED: 'AiDevEngine runtime degraded — retrying health',
    UNAVAILABLE: 'AiDevEngine runtime unavailable — restart using Start-AiDevEngine',
  };

  function isLocalRuntimeHealthPayloadOk(payload) {
    return (
      payload &&
      payload.postAllowed === true &&
      payload.serverCapability === 'command-center-brain-v11.1a' &&
      payload.buildIntentRouting === true &&
      payload.registryLoaded === true &&
      payload.runtimeReady === true
    );
  }

  function isStaleRuntimeErrorText(text) {
    if (!text || text === 'None') return false;
    for (var i = 0; i < STALE_RUNTIME_ERROR_PATTERNS.length; i += 1) {
      if (STALE_RUNTIME_ERROR_PATTERNS[i].test(text)) return true;
    }
    return false;
  }

  function isStaleRuntimeChatText(text) {
    if (!text) return false;
    for (var i = 0; i < STALE_RUNTIME_CHAT_PATTERNS.length; i += 1) {
      if (STALE_RUNTIME_CHAT_PATTERNS[i].test(text)) return true;
    }
    return false;
  }

  function resolveLifecycleFromHealth(input) {
    var windowMs = input.pollWindowMs || HEALTH_POLL_WINDOW_MS;
    if (input.healthOk) return 'READY';
    if (input.elapsedMs >= windowMs) return 'UNAVAILABLE';
    if (input.payload && input.payload.registryLoaded === true && input.payload.runtimeReady !== true) {
      return 'DEGRADED';
    }
    return 'CHECKING_HEALTH';
  }

  function planHealthPoll(input) {
    var windowMs = input.pollWindowMs || HEALTH_POLL_WINDOW_MS;
    if (input.healthOk || input.elapsedMs >= windowMs) {
      return { shouldContinue: false, nextDelayMs: 0 };
    }
    var nextDelayMs = Math.min(400 + input.attempt * 350, 1500);
    var remaining = windowMs - input.elapsedMs;
    return {
      shouldContinue: remaining > 0,
      nextDelayMs: Math.min(nextDelayMs, remaining),
    };
  }

  function runtimeRequestsAllowed(lifecycle) {
    return lifecycle === 'READY';
  }

  function shouldShowRuntimeBanner(lifecycle) {
    return lifecycle === 'UNAVAILABLE';
  }

  global.CommandCenterRestartResilience = {
    HEALTH_POLL_WINDOW_MS: HEALTH_POLL_WINDOW_MS,
    STALE_RUNTIME_ERROR_SESSION_KEY: 'aidevengine.stale-runtime-error.v1',
    COMMAND_CENTER_HEALTH_READY_TRACE: 'COMMAND_CENTER_HEALTH_READY',
    COMMAND_CENTER_STALE_ERROR_CLEARED_TRACE: 'COMMAND_CENTER_STALE_ERROR_CLEARED',
    SIDEBAR_STATUS_BY_LIFECYCLE: SIDEBAR_STATUS_BY_LIFECYCLE,
    isLocalRuntimeHealthPayloadOk: isLocalRuntimeHealthPayloadOk,
    isStaleRuntimeErrorText: isStaleRuntimeErrorText,
    isStaleRuntimeChatText: isStaleRuntimeChatText,
    resolveLifecycleFromHealth: resolveLifecycleFromHealth,
    planHealthPoll: planHealthPoll,
    runtimeRequestsAllowed: runtimeRequestsAllowed,
    shouldShowRuntimeBanner: shouldShowRuntimeBanner,
  };
})(typeof window !== 'undefined' ? window : globalThis);
