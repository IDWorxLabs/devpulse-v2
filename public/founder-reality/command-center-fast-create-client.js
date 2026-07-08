/**
 * Command Center Fast Create Client — shared POST /api/projects/fast-create helper.
 * Used by Command Center Create Project modal and referenced by builder-test parity checks.
 */
(function commandCenterFastCreateClient(global) {
  'use strict';

  var FAST_PROJECT_CREATE_API = '/api/projects/fast-create';
  var FAST_PROJECT_CREATE_TIMEOUT_MS = 2000;
  var COMMAND_CENTER_FAST_CREATE_SUCCESS = 'COMMAND_CENTER_FAST_CREATE_SUCCESS';

  function buildRequestBody(input) {
    var trimmed = String((input && input.projectName) || '').trim();
    if (!trimmed && input && input.defaultName) {
      trimmed = String(input.defaultName).trim();
    }
    var body = {
      projectName: trimmed,
      forceFreshProject: input && input.forceFreshProject !== false,
    };
    if (trimmed) {
      body.name = trimmed;
    }
    if (input && input.confirmFreshCopy === true) {
      body.confirmFreshCopy = true;
    }
    return body;
  }

  function parseFastCreateResponse(res, text) {
    var json = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch (parseErr) {
        var invalid = new Error('Invalid fast-create response');
        invalid.parseError = true;
        throw invalid;
      }
    }
    return json;
  }

  function postFastProjectCreate(input) {
    input = input || {};
    var startedAt = Date.now();
    var createRequestCompleted = false;
    var timeoutId = setTimeout(function () {
      if (createRequestCompleted) return;
      if (input.onSlowCreateWarning) {
        input.onSlowCreateWarning(Date.now() - startedAt);
      }
    }, FAST_PROJECT_CREATE_TIMEOUT_MS);

    return fetch(FAST_PROJECT_CREATE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequestBody(input)),
      cache: 'no-store',
    })
      .then(function (res) {
        createRequestCompleted = true;
        clearTimeout(timeoutId);
        var elapsedMs = Date.now() - startedAt;
        return res.text().then(function (text) {
          var json = parseFastCreateResponse(res, text);
          return {
            response: res,
            payload: json,
            elapsedMs: elapsedMs,
            projectName: (input && input.projectName) || (json && json.projectName) || null,
          };
        });
      })
      .catch(function (err) {
        createRequestCompleted = true;
        clearTimeout(timeoutId);
        throw err;
      })
      .finally(function () {
        createRequestCompleted = true;
        clearTimeout(timeoutId);
      });
  }

  global.CommandCenterFastCreateClient = {
    FAST_PROJECT_CREATE_API: FAST_PROJECT_CREATE_API,
    FAST_PROJECT_CREATE_TIMEOUT_MS: FAST_PROJECT_CREATE_TIMEOUT_MS,
    COMMAND_CENTER_FAST_CREATE_SUCCESS: COMMAND_CENTER_FAST_CREATE_SUCCESS,
    buildRequestBody: buildRequestBody,
    postFastProjectCreate: postFastProjectCreate,
  };
})(typeof window !== 'undefined' ? window : globalThis);
