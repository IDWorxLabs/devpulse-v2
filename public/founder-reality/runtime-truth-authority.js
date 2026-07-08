/**
 * Runtime Truth Authority V1 — Command Center browser bridge.
 */
(function runtimeTruthAuthority(global) {
  'use strict';

  var CONTRACT_VERSION = 'RUNTIME_TRUTH_AUTHORITY_V1';
  var TRUTH_PATH = '/api/runtime/truth';
  var STORAGE_KEY = 'aidevengine.runtimeTruth.runtimeId';
  var READY_TRACE = 'COMMAND_CENTER_RUNTIME_TRUTH_READY';
  var STALE_MESSAGE = 'AiDevEngine runtime is stale. Restart required.';

  var REQUIRED_CAPABILITIES = ['runtimeTruth', 'brainHealth', 'brainRespond', 'buildIntentClassification'];

  function verifyRuntimeTruthPayload(payload) {
    if (!payload) {
      return {
        ok: false,
        stale: true,
        classifyRouteAvailable: false,
        message: STALE_MESSAGE,
        runtimeId: null,
      };
    }

    var classifyRoute = null;
    for (var i = 0; i < (payload.routeContracts || []).length; i += 1) {
      var route = payload.routeContracts[i];
      if (route.path === '/api/brain/classify-build-intent' && route.method === 'POST') {
        classifyRoute = route;
        break;
      }
    }
    var classifyRouteAvailable =
      classifyRoute && classifyRoute.registeredAtBoot === true && classifyRoute.enabled === true;

    var requiredOk = true;
    for (var c = 0; c < REQUIRED_CAPABILITIES.length; c += 1) {
      var capName = REQUIRED_CAPABILITIES[c];
      var found = false;
      for (var j = 0; j < (payload.capabilities || []).length; j += 1) {
        if (payload.capabilities[j].name === capName && payload.capabilities[j].enabled === true) {
          found = true;
          break;
        }
      }
      if (!found) requiredOk = false;
    }

    var stale =
      payload.freshness && payload.freshness.status === 'STALE' ||
      payload.ok !== true ||
      !requiredOk ||
      !classifyRouteAvailable;

    var message = null;
    if (stale) {
      if (payload.errors && payload.errors.length > 0) {
        message = STALE_MESSAGE + ' ' + payload.errors[0];
      } else if (!classifyRouteAvailable) {
        message = STALE_MESSAGE + ' Build intent classification route missing.';
      } else {
        message = STALE_MESSAGE;
      }
    }

    return {
      ok: !stale,
      stale: stale,
      freshnessStatus: payload.freshness && payload.freshness.status ? payload.freshness.status : stale ? 'STALE' : 'FRESH',
      classifyRouteAvailable: classifyRouteAvailable,
      message: message,
      runtimeId: payload.runtimeIdentity ? payload.runtimeIdentity.runtimeId : null,
      staleReasons: (payload.freshness && payload.freshness.reasons) || (payload.errors || []),
      payload: payload,
    };
  }

  function fetchRuntimeTruth() {
    return fetch(TRUTH_PATH, { method: 'GET', cache: 'no-store' }).then(function (res) {
      return res.text().then(function (bodyText) {
        if (!res.ok) {
          throw new Error('Runtime truth unavailable — HTTP ' + res.status);
        }
        var payload;
        try {
          payload = JSON.parse(bodyText);
        } catch (parseErr) {
          throw new Error('Runtime truth malformed — invalid JSON');
        }
        if (payload.contractVersion !== CONTRACT_VERSION) {
          throw new Error('Runtime truth contract mismatch');
        }
        return payload;
      });
    });
  }

  function readStoredRuntimeId() {
    try {
      return global.localStorage ? global.localStorage.getItem(STORAGE_KEY) : null;
    } catch (storageErr) {
      return null;
    }
  }

  function storeRuntimeId(runtimeId) {
    try {
      if (global.localStorage && runtimeId) {
        global.localStorage.setItem(STORAGE_KEY, runtimeId);
      }
    } catch (storageErr) {
      /* ignore storage failures */
    }
  }

  function verifyRuntimeTruth() {
    return fetchRuntimeTruth().then(function (payload) {
      var result = verifyRuntimeTruthPayload(payload);
      var previousRuntimeId = readStoredRuntimeId();
      if (result.ok) {
        if (typeof console !== 'undefined' && console.log) {
          console.log(READY_TRACE, result.runtimeId);
        }
        if (previousRuntimeId && previousRuntimeId !== result.runtimeId) {
          result.runtimeIdChanged = true;
        }
        storeRuntimeId(result.runtimeId);
      }
      return result;
    });
  }

  global.RuntimeTruthAuthority = {
    CONTRACT_VERSION: CONTRACT_VERSION,
    TRUTH_PATH: TRUTH_PATH,
    STORAGE_KEY: STORAGE_KEY,
    READY_TRACE: READY_TRACE,
    STALE_MESSAGE: STALE_MESSAGE,
    REQUIRED_CAPABILITIES: REQUIRED_CAPABILITIES,
    verifyRuntimeTruthPayload: verifyRuntimeTruthPayload,
    fetchRuntimeTruth: fetchRuntimeTruth,
    verifyRuntimeTruth: verifyRuntimeTruth,
    readStoredRuntimeId: readStoredRuntimeId,
    storeRuntimeId: storeRuntimeId,
  };
})(window);
