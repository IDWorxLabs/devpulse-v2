/**
 * Chat-to-Build Execution Bridge V1 — Command Center browser bridge.
 */
(function chatToBuildExecutionBridge(global) {
  'use strict';

  var CONTRACT_VERSION = 'CHAT_TO_BUILD_EXECUTION_BRIDGE_V1';
  var PASS_TOKEN = 'CHAT_TO_BUILD_EXECUTION_BRIDGE_V1_PASS';
  var TRACE = 'CHAT_TO_BUILD_EXECUTION_BRIDGE_V1';

  var PROGRESS_STAGES = [
    { stage: 'INTENT_ANALYSIS', label: 'Intent understood' },
    { stage: 'PROJECT_ALIGNMENT', label: 'Project context aligned' },
    { stage: 'PROJECT_IDENTITY', label: 'Project identity resolved' },
    { stage: 'PLANNING', label: 'Planning complete' },
    { stage: 'ARCHITECTURE', label: 'Architecture complete' },
    { stage: 'FEATURE_GENERATION', label: 'Universal Feature Contract generated' },
    { stage: 'CODE_GENERATION', label: 'Modules generated' },
    { stage: 'WORKSPACE_BUILD', label: 'Workspace materialized' },
    { stage: 'RUNTIME_START', label: 'Runtime started' },
    { stage: 'LIVE_PREVIEW', label: 'Live Preview ready' },
    { stage: 'VALIDATION', label: 'Validation complete' },
    { stage: 'FOUNDER_EVIDENCE', label: 'Founder evidence collected' },
    { stage: 'COMPLETE', label: 'Engineering report generated' },
  ];

  function isBridgePayload(payload) {
    return (
      payload &&
      ((payload.chatToBuildExecutionBridge &&
        payload.chatToBuildExecutionBridge.contractVersion === CONTRACT_VERSION) ||
        (payload.chatToBuildBridge &&
          payload.chatToBuildBridge.contractVersion === CONTRACT_VERSION))
    );
  }

  function resolveBridgeProgress(payload) {
    if (!payload) return null;
    var bridge = payload.chatToBuildExecutionBridge || payload.chatToBuildBridge;
    if (!bridge || bridge.contractVersion !== CONTRACT_VERSION) return null;
    if (Array.isArray(bridge.progressItems) && bridge.progressItems.length) {
      return bridge.progressItems;
    }
    return null;
  }

  function resolveBridgeTraceEvents(payload) {
    if (!payload) return [];
    if (payload.executionTraceEvents && payload.executionTraceEvents.length) {
      return payload.executionTraceEvents;
    }
    if (payload.operatorFeedEvents && payload.operatorFeedEvents.length) {
      return payload.operatorFeedEvents;
    }
    return [];
  }

  function resolveEngineeringReport(payload) {
    if (!isBridgePayload(payload)) return payload && payload.engineeringReport ? payload.engineeringReport : null;
    return payload.chatToBuildExecutionBridge.engineeringReport || payload.engineeringReport || null;
  }

  function formatProgressLine(item) {
    var icon = item.status === 'complete' ? '\u2713' : item.status === 'active' ? '\u27F3' : item.status === 'failed' ? '\u2717' : '\u25CB';
    return icon + ' ' + item.label;
  }

  function renderBridgeProgressToFeed(payload, appendFn) {
    var progress = resolveBridgeProgress(payload);
    if (!progress || typeof appendFn !== 'function') return;
    for (var i = 0; i < progress.length; i++) {
      var item = progress[i];
      appendFn({
        eventType: 'Bridge Progress',
        action: item.label,
        detail: item.detail || item.label,
        section: 'Build',
        status: item.status === 'complete' ? 'Completed' : item.status === 'active' ? 'Active' : 'Queued',
        stepIndex: i + 1,
        stepTotal: progress.length,
        metadata: { bridgeStage: item.stage, contractVersion: CONTRACT_VERSION },
      });
    }
  }

  function interimProgressStages() {
    return PROGRESS_STAGES.map(function (entry, index) {
      return {
        eventType: 'Bridge Progress',
        action: entry.label,
        detail: 'Autonomous engineering pipeline — ' + entry.label,
        section: 'Build',
        status: index === 0 ? 'Active' : 'Queued',
        stepIndex: index + 1,
        stepTotal: PROGRESS_STAGES.length,
        metadata: { bridgeStage: entry.stage, contractVersion: CONTRACT_VERSION },
      };
    });
  }

  global.ChatToBuildExecutionBridge = {
    CONTRACT_VERSION: CONTRACT_VERSION,
    PASS_TOKEN: PASS_TOKEN,
    TRACE: TRACE,
    PROGRESS_STAGES: PROGRESS_STAGES,
    isBridgePayload: isBridgePayload,
    resolveBridgeProgress: resolveBridgeProgress,
    resolveBridgeTraceEvents: resolveBridgeTraceEvents,
    resolveEngineeringReport: resolveEngineeringReport,
    formatProgressLine: formatProgressLine,
    renderBridgeProgressToFeed: renderBridgeProgressToFeed,
    interimProgressStages: interimProgressStages,
  };
})(window);
