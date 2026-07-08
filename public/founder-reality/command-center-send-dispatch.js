/**
 * Command Center Send Dispatch V1 — browser bridge.
 */
(function commandCenterSendDispatch(global) {
  'use strict';

  var BUILD_VERB_PATTERN = /\b(build|create|make)\b/i;
  var BUILD_TARGET_PATTERN =
    /\b(app|application|calculator|todo|tracker|website|saas|portal|dashboard|system|platform|software|product|feature|tool|utility|notes|timer|counter)\b/i;

  var TOKENS = {
    SEND_CLICKED: 'COMMAND_CENTER_SEND_CLICKED',
    SUBMIT_STARTED: 'COMMAND_CENTER_SUBMIT_STARTED',
    BRAIN_POST_SENT: 'COMMAND_CENTER_BRAIN_POST_SENT',
    BRAIN_RESPONSE_RECEIVED: 'COMMAND_CENTER_BRAIN_RESPONSE_RECEIVED',
    SUBMIT_BLOCKED: 'COMMAND_CENTER_SUBMIT_BLOCKED',
  };

  function isLikelyBuildPromptMessage(message) {
    var normalized = String(message || '').trim();
    if (!normalized) return false;
    return BUILD_VERB_PATTERN.test(normalized) && BUILD_TARGET_PATTERN.test(normalized);
  }

  function logDiagnostic(token, detail) {
    if (typeof console !== 'undefined' && console.info) {
      console.info(token, detail === undefined ? '' : detail);
    }
  }

  global.CommandCenterSendDispatch = {
    TOKENS: TOKENS,
    isLikelyBuildPromptMessage: isLikelyBuildPromptMessage,
    logDiagnostic: logDiagnostic,
  };
})(window);
