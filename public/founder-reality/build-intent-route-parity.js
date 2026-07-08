/**
 * Build Intent Route Parity V1 — Command Center browser bridge.
 * Delegates to server shared classifier; no local duplicate heuristics.
 */
(function buildIntentRouteParity(global) {
  'use strict';

  var CONTRACT_VERSION = 'BUILD_INTENT_ROUTE_PARITY_V1';
  var CLASSIFY_PATH = '/api/brain/classify-build-intent';

  function classifyBuildIntentRequest(message) {
    var text = String(message || '').trim();
    return fetch(CLASSIFY_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ message: text }),
    }).then(function (res) {
      return res.text().then(function (bodyText) {
        if (!res.ok) {
          throw new Error('Build intent classification failed — HTTP ' + res.status);
        }
        var payload;
        try {
          payload = JSON.parse(bodyText);
        } catch (parseErr) {
          throw new Error('Build intent classification malformed — invalid JSON');
        }
        if (
          typeof payload.isBuildIntent !== 'boolean' ||
          !payload.route ||
          payload.contractVersion !== CONTRACT_VERSION
        ) {
          throw new Error('Build intent classification malformed — contract fields missing');
        }
        return payload;
      });
    });
  }

  function isBuildIntentClassification(classification) {
    return (
      classification &&
      classification.contractVersion === CONTRACT_VERSION &&
      classification.isBuildIntent === true
    );
  }

  global.BuildIntentRouteParity = {
    CONTRACT_VERSION: CONTRACT_VERSION,
    CLASSIFY_PATH: CLASSIFY_PATH,
    classifyBuildIntentRequest: classifyBuildIntentRequest,
    isBuildIntentClassification: isBuildIntentClassification,
  };
})(window);
