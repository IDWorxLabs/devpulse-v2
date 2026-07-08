/**
 * Runtime Banner Truth Reconciliation V1 — Command Center browser bridge.
 */
(function runtimeBannerTruthReconciliation(global) {
  'use strict';

  var STALE_SESSION_KEYS = ['aidevengine.stale-runtime-error.v1'];
  var RUNTIME_ID_STORAGE_KEY = 'aidevengine.runtimeTruth.runtimeId';
  var DIAGNOSTIC_TRACE = 'RUNTIME_BANNER_TRUTH_DIAGNOSTIC';
  var TRUTH_READY_TRACE = 'COMMAND_CENTER_RUNTIME_TRUTH_READY';
  var RUNTIME_UNAVAILABLE_BANNER =
    'AiDevEngine runtime unavailable. Check Runtime Authority status and restart with npm run dev if needed.';

  function isHealthPayloadOk(payload) {
    return (
      payload &&
      payload.postAllowed === true &&
      payload.serverCapability === 'command-center-brain-v11.1a' &&
      payload.buildIntentRouting === true &&
      payload.registryLoaded === true &&
      payload.runtimeReady === true
    );
  }

  function isTruthFresh(truth) {
    return Boolean(
      truth &&
        truth.ok === true &&
        truth.freshnessStatus === 'FRESH' &&
        truth.classifyRouteAvailable === true,
    );
  }

  function isRuntimeAuthorityReady(authority) {
    if (!authority) return false;
    if (authority.bypassed) return authority.ok === true;
    return authority.ready === true || (authority.ok === true && authority.phase === 'READY');
  }

  function isRuntimeAuthorityVerifying(authority) {
    if (!authority || isRuntimeAuthorityReady(authority)) return false;
    var phase = authority.phase || '';
    return phase === 'VERIFYING' || phase === 'DISCOVERING' || phase === 'STARTING';
  }

  function clearPersistedStaleRuntimeState() {
    try {
      for (var i = 0; i < STALE_SESSION_KEYS.length; i += 1) {
        if (global.sessionStorage) {
          global.sessionStorage.removeItem(STALE_SESSION_KEYS[i]);
        }
      }
    } catch (storageErr) {
      /* ignore */
    }
  }

  function normalizeTruthResult(result) {
    result = result || {};
    var freshnessStatus =
      result.freshnessStatus ||
      (result.payload && result.payload.freshness && result.payload.freshness.status) ||
      (result.stale ? 'STALE' : result.ok ? 'FRESH' : 'UNKNOWN');
    return {
      ok: result.ok === true,
      stale: result.stale === true || freshnessStatus === 'STALE',
      freshnessStatus: freshnessStatus,
      classifyRouteAvailable: result.classifyRouteAvailable === true,
      runtimeId: result.runtimeId || null,
      runtimeIdChanged: result.runtimeIdChanged === true,
      staleReasons:
        result.staleReasons ||
        (result.payload && result.payload.freshness && result.payload.freshness.reasons) ||
        [],
      message: result.message || null,
      payload: result.payload || null,
    };
  }

  function normalizeRuntimeAuthorityPayload(payload) {
    if (!payload) return null;
    var state = payload.state || null;
    return {
      ok: payload.ok === true || (state && state.ready === true),
      ready: Boolean(state && state.ready),
      phase: state && state.phase ? state.phase : null,
      health: state && state.health ? state.health : null,
      bypassed: payload.bypassed === true,
    };
  }

  function reconcileRuntimeBannerState(input) {
    input = input || {};
    var truth = input.truth ? normalizeTruthResult(input.truth) : null;
    var healthPayload = input.healthPayload || null;
    var authority = input.runtimeAuthority || null;
    var authorityReady = isRuntimeAuthorityReady(authority);
    var authorityVerifying = isRuntimeAuthorityVerifying(authority);
    var truthFresh = isTruthFresh(truth);
    var healthReady = isHealthPayloadOk(healthPayload);
    var runtimeConnected = authorityReady || truthFresh || healthReady;
    var staleReasons = [];
    if (truth && truth.freshnessStatus === 'STALE') {
      staleReasons = staleReasons.concat(truth.staleReasons || []);
    }
    if (truth && !truth.classifyRouteAvailable) {
      staleReasons.push('build intent classification route unavailable');
    }
    if (healthPayload && !healthReady) {
      if (healthPayload.runtimeReady !== true) staleReasons.push('brain health runtimeReady=false');
      if (healthPayload.registryLoaded !== true) staleReasons.push('brain health registryLoaded=false');
      if (healthPayload.buildIntentRouting !== true) {
        staleReasons.push('brain health buildIntentRouting=false');
      }
    }

    var lifecycle = 'UNAVAILABLE';
    var bannerSource = 'none';
    var bannerMessage = null;
    var bannerTone = 'none';

    if (authorityReady) {
      lifecycle = 'READY';
      bannerSource = 'runtime-authority-ready';
    } else if (authorityVerifying) {
      lifecycle = 'CHECKING_HEALTH';
      bannerSource = 'runtime-authority-verifying';
      bannerTone = 'neutral';
    } else if (runtimeConnected) {
      lifecycle = 'READY';
      bannerSource =
        truthFresh && healthReady
          ? 'truth-fresh-and-health-ready'
          : truthFresh
            ? 'truth-fresh'
            : 'health-ready';
    } else if (healthPayload && healthPayload.registryLoaded === true) {
      lifecycle = 'DEGRADED';
      bannerSource = 'health-degraded';
    } else if (
      input.previousLifecycle === 'STARTING' ||
      input.previousLifecycle === 'CHECKING_HEALTH'
    ) {
      lifecycle = 'CHECKING_HEALTH';
      bannerSource = 'health-check-in-progress';
      bannerTone = 'neutral';
    } else {
      lifecycle = 'UNAVAILABLE';
      bannerSource = (truth && truth.message) || input.bannerSourceHint || 'runtime-unavailable';
      bannerTone = 'error';
      bannerMessage = RUNTIME_UNAVAILABLE_BANNER;
    }

    return {
      shouldShowBanner: bannerTone === 'error',
      bannerMessage: bannerMessage,
      bannerTone: bannerTone,
      localRuntimeHealthy: runtimeConnected,
      runtimeTruthReady: truthFresh,
      runtimeTruthClassifyAllowed:
        (Boolean(truth && truth.classifyRouteAvailable) && truthFresh) || healthReady,
      chatExecutionAllowed: healthReady || truthFresh || authorityReady,
      runtimeTruthDegraded: healthReady && !truthFresh,
      lifecycle: lifecycle,
      footerStatus: authorityReady
        ? 'Runtime Authority READY'
        : authorityVerifying
          ? 'Runtime Authority verifying…'
          : runtimeConnected
            ? 'AiDevEngine local runtime connected'
            : lifecycle === 'CHECKING_HEALTH'
              ? 'Runtime Authority verifying…'
              : lifecycle === 'DEGRADED'
                ? 'AiDevEngine runtime degraded — retrying health'
                : 'AiDevEngine runtime unavailable',
      bannerSource: bannerSource,
      staleReasons: staleReasons,
      runtimeId: truth ? truth.runtimeId : null,
      truthFresh: truthFresh,
      healthReady: healthReady,
      runtimeAuthorityReady: authorityReady,
    };
  }

  function buildDiagnostic(reconciliation) {
    return {
      trace: DIAGNOSTIC_TRACE,
      truthFresh: reconciliation.truthFresh,
      healthReady: reconciliation.healthReady,
      runtimeAuthorityReady: reconciliation.runtimeAuthorityReady,
      runtimeId: reconciliation.runtimeId,
      staleReasons: reconciliation.staleReasons,
      bannerSource: reconciliation.bannerSource,
      shouldShowBanner: reconciliation.shouldShowBanner,
      lifecycle: reconciliation.lifecycle,
      localRuntimeHealthy: reconciliation.localRuntimeHealthy,
    };
  }

  function logRuntimeBannerDiagnostic(reconciliation) {
    if (typeof console === 'undefined' || !console.log) return;
    console.log(DIAGNOSTIC_TRACE, buildDiagnostic(reconciliation));
  }

  global.RuntimeBannerTruthReconciliation = {
    STALE_SESSION_KEYS: STALE_SESSION_KEYS,
    RUNTIME_ID_STORAGE_KEY: RUNTIME_ID_STORAGE_KEY,
    DIAGNOSTIC_TRACE: DIAGNOSTIC_TRACE,
    TRUTH_READY_TRACE: TRUTH_READY_TRACE,
    RUNTIME_UNAVAILABLE_BANNER: RUNTIME_UNAVAILABLE_BANNER,
    clearPersistedStaleRuntimeState: clearPersistedStaleRuntimeState,
    normalizeTruthResult: normalizeTruthResult,
    normalizeRuntimeAuthorityPayload: normalizeRuntimeAuthorityPayload,
    reconcileRuntimeBannerState: reconcileRuntimeBannerState,
    buildDiagnostic: buildDiagnostic,
    logRuntimeBannerDiagnostic: logRuntimeBannerDiagnostic,
    isTruthFresh: isTruthFresh,
    isHealthPayloadOk: isHealthPayloadOk,
    isRuntimeAuthorityReady: isRuntimeAuthorityReady,
    isRuntimeAuthorityVerifying: isRuntimeAuthorityVerifying,
  };
})(window);
