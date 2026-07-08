/**
 * Command Center HTTP Routing Forensic Audit V1 — browser diagnostics client.
 */
(function commandCenterHttpRoutingForensic(global) {
  'use strict';

  var CONTRACT_VERSION = 'COMMAND_CENTER_HTTP_ROUTING_FORENSIC_AUDIT_V1';
  var PASS_TOKEN = 'COMMAND_CENTER_HTTP_ROUTING_FORENSIC_AUDIT_V1_PASS';
  var REQUEST_HEADER = 'X-Command-Center-Request-Id';
  var LATEST_PATH = '/api/command-center/http-routing-forensic/latest';
  var REGISTRATION_PATH = '/api/command-center/http-routing-forensic/route-registration';
  var EVENT_PATH = '/api/command-center/http-routing-forensic/event';

  var BROWSER_EVENTS = {
    FETCH_START: 'BROWSER_FETCH_START',
    FETCH_RESPONSE: 'BROWSER_FETCH_RESPONSE',
    FETCH_ERROR: 'BROWSER_FETCH_ERROR',
    FETCH_TIMEOUT: 'BROWSER_FETCH_TIMEOUT',
  };

  var activeRequestId = null;
  var activeEndpoint = null;
  var activeStatus = 'Idle';
  var lastSuccessfulStage = null;
  var blockingLayer = null;
  var blockingReason = null;

  function createRequestId() {
    return 'cc-http-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  }

  function setDiagnostics(partial) {
    if (partial.requestId !== undefined) activeRequestId = partial.requestId;
    if (partial.endpoint !== undefined) activeEndpoint = partial.endpoint;
    if (partial.status !== undefined) activeStatus = partial.status;
    if (partial.lastSuccessfulStage !== undefined) lastSuccessfulStage = partial.lastSuccessfulStage;
    if (partial.blockingLayer !== undefined) blockingLayer = partial.blockingLayer;
    if (partial.blockingReason !== undefined) blockingReason = partial.blockingReason;
    renderDiagnosticsCard();
  }

  function renderDiagnosticsCard() {
    var card = document.getElementById('http-routing-forensic-card');
    if (!card) return;
    card.classList.remove('hidden');
    card.hidden = false;
    card.innerHTML =
      '<div class="http-routing-forensic-card-inner">' +
      '<h3>HTTP Routing Forensic</h3>' +
      '<p><strong>Request ID:</strong> ' + (activeRequestId || '—') + '</p>' +
      '<p><strong>Endpoint:</strong> ' + (activeEndpoint || '—') + '</p>' +
      '<p><strong>Status:</strong> ' + (activeStatus || '—') + '</p>' +
      (lastSuccessfulStage
        ? '<p><strong>Last successful stage:</strong> ' + lastSuccessfulStage + '</p>'
        : '') +
      (blockingLayer ? '<p><strong>Blocking layer:</strong> ' + blockingLayer + '</p>' : '') +
      (blockingReason ? '<p><strong>Blocking reason:</strong> ' + blockingReason + '</p>' : '') +
      '</div>';
  }

  function postBrowserEvent(requestId, name, detail) {
    try {
      fetch(EVENT_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ requestId: requestId, name: name, detail: detail }),
      }).catch(function () {
        /* never block chat */
      });
    } catch (postErr) {
      /* ignore */
    }
  }

  function beginFetch(endpoint) {
    var requestId = createRequestId();
    postBrowserEvent(requestId, BROWSER_EVENTS.FETCH_START, 'Browser fetch started for ' + endpoint);
    setDiagnostics({
      requestId: requestId,
      endpoint: endpoint,
      status: 'Connecting...',
      lastSuccessfulStage: 'Browser fetch initiated',
      blockingLayer: null,
      blockingReason: null,
    });
    return requestId;
  }

  function markFetchResponse(requestId, status, responseRequestId) {
    postBrowserEvent(
      responseRequestId || requestId,
      BROWSER_EVENTS.FETCH_RESPONSE,
      'Browser received HTTP response status=' + status,
    );
    setDiagnostics({
      requestId: responseRequestId || requestId,
      status: 'Response received (' + status + ')',
      lastSuccessfulStage: 'Browser received HTTP response',
      blockingLayer: status >= 400 ? 'HTTP response error' : null,
      blockingReason: status >= 400 ? 'HTTP status ' + status : null,
    });
  }

  function markFetchError(requestId, err) {
    var message = err && err.message ? err.message : String(err);
    postBrowserEvent(requestId, BROWSER_EVENTS.FETCH_ERROR, message);
    setDiagnostics({
      requestId: requestId,
      status: 'Request failed',
      blockingLayer: 'Browser network layer',
      blockingReason: message,
    });
  }

  function markFetchTimeout(requestId) {
    setDiagnostics({
      requestId: requestId,
      status: 'Request timed out — no response',
      blockingLayer: 'Unknown — request never returned',
      blockingReason: 'No HTTP response received before timeout',
    });
    pollForensicReport(requestId);
  }

  function pollForensicReport(requestId) {
    fetch(LATEST_PATH + '?requestId=' + encodeURIComponent(requestId), {
      method: 'GET',
      cache: 'no-store',
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (payload) {
        if (!payload || !payload.report || !payload.report.firstFailure) return;
        var failure = payload.report.firstFailure;
        setDiagnostics({
          blockingLayer: failure.stage,
          blockingReason: failure.blockingReason || failure.stage,
        });
      })
      .catch(function () {
        /* ignore */
      });
  }

  function wrapFetch(endpoint, init) {
    var requestId = beginFetch(endpoint);
    var headers = Object.assign({}, (init && init.headers) || {});
    headers[REQUEST_HEADER] = requestId;
    var mergedInit = Object.assign({}, init || {}, { headers: headers });

    var timeoutMs = 120000;
    var timeoutId = setTimeout(function () {
      markFetchTimeout(requestId);
    }, timeoutMs);

    return fetch(endpoint, mergedInit)
      .then(function (res) {
        clearTimeout(timeoutId);
        var responseRequestId = res.headers.get('x-command-center-request-id') || requestId;
        markFetchResponse(requestId, res.status, responseRequestId);
        return res;
      })
      .catch(function (err) {
        clearTimeout(timeoutId);
        markFetchError(requestId, err);
        throw err;
      });
  }

  global.CommandCenterHttpRoutingForensic = {
    CONTRACT_VERSION: CONTRACT_VERSION,
    PASS_TOKEN: PASS_TOKEN,
    REQUEST_HEADER: REQUEST_HEADER,
    LATEST_PATH: LATEST_PATH,
    REGISTRATION_PATH: REGISTRATION_PATH,
    BROWSER_EVENTS: BROWSER_EVENTS,
    createRequestId: createRequestId,
    beginFetch: beginFetch,
    wrapFetch: wrapFetch,
    setDiagnostics: setDiagnostics,
    renderDiagnosticsCard: renderDiagnosticsCard,
    pollForensicReport: pollForensicReport,
    getActiveRequestId: function () {
      return activeRequestId;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
