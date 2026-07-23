/**
 * AiDevEngine V4 — Simplified Builder Home.
 *
 * One job: Prompt -> Build -> Watch real work -> See live preview -> See pass/fail -> Retry/repair.
 *
 * Calls the real build pipeline (POST /api/build/from-prompt) — the same execution path used by
 * the full Command Center. No fake progress, no simulated steps. Every step shown here comes from
 * the chat-to-build-execution-bridge engineering state machine and execution trace produced by the
 * engine while it actually plans, generates, builds, and previews the app.
 */
(function BuilderHome() {
  'use strict';

  var BUILD_API = '/api/build/from-prompt';
  var BUILD_READY_API = '/api/build/ready';
  var RUNTIME_AUTHORITY_API = '/api/runtime/authority';
  var STORAGE_KEY = 'aidevengine.builder.projectId';
  var PROMPT_STORAGE_KEY = 'aidevengine.builder.lastPrompt';

  var state = {
    projectId: null,
    lastPrompt: '',
    building: false,
    lastPayload: null,
    lastBuild: null,
    hasStartedAnyBuild: false,
    requestId: 0,
    abortController: null,
    apiReady: null,
    apiReadyDetail: null,
  };

  try {
    state.projectId = window.sessionStorage.getItem(STORAGE_KEY) || null;
    state.lastPrompt = window.sessionStorage.getItem(PROMPT_STORAGE_KEY) || '';
  } catch (storageErr) {
    /* sessionStorage unavailable — continue without persistence */
  }

  function el(id) {
    return document.getElementById(id);
  }

  function persistProjectId(projectId) {
    state.projectId = projectId || null;
    try {
      if (projectId) window.sessionStorage.setItem(STORAGE_KEY, projectId);
      else window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (storageErr) {
      /* ignore */
    }
  }

  function persistPrompt(prompt) {
    state.lastPrompt = prompt || '';
    try {
      window.sessionStorage.setItem(PROMPT_STORAGE_KEY, state.lastPrompt);
    } catch (storageErr) {
      /* ignore */
    }
  }

  // ---------------------------------------------------------------------
  // API readiness (submission path) + runtime status pill
  // ---------------------------------------------------------------------

  var RUNTIME_POLL_MAX_ATTEMPTS = 8;
  var RUNTIME_POLL_INTERVAL_MS = 1500;

  /**
   * Classifies transport / fetch failures so the UI never collapses every network problem into
   * the opaque browser message "Failed to fetch".
   */
  function classifyTransportError(err, httpStatus, payload) {
    var message = err && err.message ? String(err.message) : String(err || 'Unknown network failure');
    var lower = message.toLowerCase();
    var code = (payload && payload.code) || (err && err.code) || null;

    if (code === 'PAYLOAD_TOO_LARGE' || httpStatus === 413) {
      return {
        kind: 'PAYLOAD_TOO_LARGE',
        title: 'Prompt payload rejected (too large)',
        detail: (payload && payload.error) || message,
        recovery: (payload && payload.recoveryAction) || 'Shorten the prompt slightly and retry Build.',
      };
    }
    if (code === 'BUILD_REQUEST_REJECTED' || (httpStatus >= 400 && httpStatus < 500 && httpStatus !== 408)) {
      return {
        kind: 'BUILD_REQUEST_REJECTED',
        title: 'Build request rejected',
        detail: (payload && payload.error) || message,
        recovery: (payload && payload.recoveryAction) || 'Fix the reported issue, then retry Build.',
      };
    }
    if (httpStatus === 408 || /timeout|timed out|aborted/.test(lower)) {
      return {
        kind: 'REQUEST_TIMEOUT',
        title: 'Request timed out',
        detail: message,
        recovery: 'The API did not finish in time. Confirm AiDevEngine is running (`npm run dev`), then retry.',
      };
    }
    if (/failed to fetch|networkerror|load failed|err_connection_refused|connection refused|econnrefused/.test(lower)) {
      return {
        kind: 'BACKEND_UNAVAILABLE',
        title: 'Backend unavailable',
        detail: 'The browser could not reach the AiDevEngine API used for Build.',
        recovery: 'Start AiDevEngine with `npm run dev` (opens http://127.0.0.1:4321). Do not open the UI from a static file or a different port.',
      };
    }
    if (/cors|cross-origin|preflight/.test(lower)) {
      return {
        kind: 'CORS_OR_PREFLIGHT',
        title: 'CORS or preflight failure',
        detail: message,
        recovery: 'Use the same origin as the API (http://127.0.0.1:4321). Avoid mixing localhost and 127.0.0.1.',
      };
    }
    if (/unreadable response|invalid json|unexpected token/.test(lower)) {
      return {
        kind: 'INVALID_API_RESPONSE',
        title: 'Invalid API response',
        detail: message,
        recovery: 'The API returned a non-JSON body. Check server logs, then retry.',
      };
    }
    return {
      kind: 'UNKNOWN_NETWORK_FAILURE',
      title: 'Network failure',
      detail: message,
      recovery: 'Confirm `npm run dev` is healthy, open http://127.0.0.1:4321, then retry Build.',
    };
  }

  function formatTransportFailure(classified) {
    return classified.title + ': ' + classified.detail + ' — Recovery: ' + classified.recovery;
  }

  function setRuntimePill(text, tone) {
    var pill = el('builder-runtime-pill');
    if (!pill) return;
    pill.textContent = text;
    pill.className = 'builder-runtime-pill' + (tone ? ' ' + tone : '');
  }

  /**
   * Polls the exact build submission readiness endpoint (`/api/build/ready`).
   * Falls back to runtime authority only for supplemental messaging.
   */
  function checkRuntimeStatus(attempt) {
    attempt = attempt || 1;
    fetch(BUILD_READY_API, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Build readiness HTTP ' + res.status);
        return res.json().catch(function () { return {}; });
      })
      .then(function (payload) {
        if (payload && payload.ok && payload.submissionReady !== false) {
          state.apiReady = true;
          state.apiReadyDetail = payload;
          setRuntimePill('API ready · submission online', 'ready');
          return;
        }
        state.apiReady = false;
        if (attempt < RUNTIME_POLL_MAX_ATTEMPTS) {
          setRuntimePill('Waiting for build API…');
          setTimeout(function () { checkRuntimeStatus(attempt + 1); }, RUNTIME_POLL_INTERVAL_MS);
        } else {
          setRuntimePill('Build API not ready', 'down');
        }
      })
      .catch(function (err) {
        state.apiReady = false;
        // Supplemental: still probe runtime authority so the pill distinguishes startup vs down.
        fetch(RUNTIME_AUTHORITY_API, { cache: 'no-store' })
          .then(function (res) { return res.json().catch(function () { return {}; }); })
          .then(function (authority) {
            if (authority && authority.ok) {
              setRuntimePill('Runtime up · build ready route missing', 'down');
            } else if (attempt < RUNTIME_POLL_MAX_ATTEMPTS) {
              setRuntimePill('Starting AiDevEngine API…');
              setTimeout(function () { checkRuntimeStatus(attempt + 1); }, RUNTIME_POLL_INTERVAL_MS);
            } else {
              var classified = classifyTransportError(err);
              setRuntimePill(classified.title, 'down');
            }
          })
          .catch(function () {
            if (attempt < RUNTIME_POLL_MAX_ATTEMPTS) {
              setRuntimePill('Backend unreachable — retrying…', 'down');
              setTimeout(function () { checkRuntimeStatus(attempt + 1); }, RUNTIME_POLL_INTERVAL_MS);
            } else {
              setRuntimePill('Backend unavailable — run npm run dev', 'down');
            }
          });
      });
  }

  // ---------------------------------------------------------------------
  // Status badge + work log (BuildProgressPanel)
  // ---------------------------------------------------------------------

  function setStatusBadge(label, tone) {
    var badge = el('builder-status-badge');
    badge.textContent = label;
    badge.className = 'builder-status-badge' + (tone ? ' ' + tone : '');
  }

  function showProgressEmpty(show) {
    el('builder-progress-empty').hidden = !show;
    el('builder-worklog').hidden = show;
  }

  function stepStatusFromTraceEvent(ev) {
    if (ev.status === 'Failed') return 'failed';
    if (ev.status === 'Warning') return 'active';
    if (ev.status === 'Completed') return 'complete';
    return 'active';
  }

  function formatTime(ts) {
    if (!ts) return '';
    var date = typeof ts === 'number' ? new Date(ts) : new Date(String(ts));
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString();
  }

  /** Builds the step-by-step work log from canonical productionPath timeline when present. */
  function buildWorkLogSteps(payload) {
    if (payload && payload.productionPath && Array.isArray(payload.productionPath.progressItems) && payload.productionPath.progressItems.length) {
      return payload.productionPath.progressItems.map(function (item) {
        return {
          title: item.label || 'Build step',
          detail: item.detail || '',
          status: item.status || 'pending',
          timestamp: null,
        };
      });
    }

    var progressItems =
      (payload.chatToBuildExecutionBridge && payload.chatToBuildExecutionBridge.progressItems) ||
      payload.progressItems ||
      null;

    var traceById = {};
    if (Array.isArray(payload.executionTraceEvents)) {
      payload.executionTraceEvents.forEach(function (ev) {
        var key = (ev.eventTitle || ev.action || '').toLowerCase();
        if (key && !traceById[key]) traceById[key] = ev;
      });
    }

    if (Array.isArray(progressItems) && progressItems.length) {
      return progressItems.map(function (item) {
        var matchedTrace = traceById[(item.label || '').toLowerCase()] || null;
        return {
          title: item.label || 'Build step',
          detail: item.detail || (matchedTrace ? matchedTrace.technicalDetail : '') || '',
          status: item.status || 'pending',
          timestamp: matchedTrace ? matchedTrace.timestamp : null,
        };
      });
    }

    if (Array.isArray(payload.executionTraceEvents) && payload.executionTraceEvents.length) {
      return payload.executionTraceEvents.map(function (ev) {
        return {
          title: ev.eventTitle || ev.action || 'Engine step',
          detail: ev.technicalDetail || ev.detail || '',
          status: stepStatusFromTraceEvent(ev),
          timestamp: ev.timestamp,
        };
      });
    }

    return [];
  }

  function renderWorkLog(steps) {
    var list = el('builder-worklog');
    if (!steps || !steps.length) {
      showProgressEmpty(true);
      return;
    }
    showProgressEmpty(false);
    list.innerHTML = '';
    // Cockpit is compact — show the latest/most important stage first, not buried at the bottom.
    var latestFirst = steps.slice().reverse();
    latestFirst.forEach(function (step) {
      var li = document.createElement('li');
      li.className = 'builder-worklog-step ' + (step.status || 'pending');

      var icon = document.createElement('span');
      icon.className = 'builder-worklog-icon';
      icon.textContent =
        step.status === 'complete' ? '✓' :
        step.status === 'failed' || step.status === 'blocked' ? '✕' :
        step.status === 'active' ? '•' :
        step.status === 'skipped' ? '–' : '';

      var body = document.createElement('div');
      var title = document.createElement('div');
      title.className = 'builder-worklog-title';
      title.textContent = step.title;
      if (step.timestamp) {
        var time = document.createElement('span');
        time.className = 'builder-worklog-time';
        time.textContent = formatTime(step.timestamp);
        title.appendChild(time);
      }
      body.appendChild(title);

      if (step.detail) {
        var detail = document.createElement('div');
        detail.className = 'builder-worklog-detail';
        detail.textContent = step.detail;
        body.appendChild(detail);
      }

      li.appendChild(icon);
      li.appendChild(body);
      list.appendChild(li);
    });
  }

  // ---------------------------------------------------------------------
  // Live preview panel
  // ---------------------------------------------------------------------

  function renderPreview(build, productionPath) {
    var frame = el('builder-preview-frame');
    var empty = el('builder-preview-empty');
    var emptySub = el('builder-preview-empty-sub');
    var openLink = el('builder-preview-open-link');
    var previewBlocked = productionPath && productionPath.previewAvailable === false;
    var verifiedUrl = !previewBlocked && build && build.previewUrl ? build.previewUrl : null;
    var diagnosticUrl =
      build &&
      (build.diagnosticPreviewUrl ||
        (build.previewContract && build.previewContract.previewUrl) ||
        (build.livePreviewGate && build.livePreviewGate.previewUrl) ||
        null);
    // Prefer verified live preview; otherwise surface an unlocked diagnostic preview so a
    // PREVIEW_AUTHORITY / verification failure does not hide a running generated app.
    var url = verifiedUrl || diagnosticUrl || null;
    var isDiagnosticOnly = !verifiedUrl && Boolean(diagnosticUrl);

    if (url) {
      if (frame.getAttribute('src') !== url) frame.src = url;
      frame.hidden = false;
      frame.classList.remove('hidden');
      empty.classList.add('hidden');
      openLink.href = url;
      openLink.classList.remove('hidden');
      if (isDiagnosticOnly && emptySub) {
        emptySub.textContent =
          'Preview is running for this build but verification has not passed yet. You can still interact with the app below.';
      }
      return;
    }

    frame.hidden = true;
    frame.classList.add('hidden');
    frame.removeAttribute('src');
    empty.classList.remove('hidden');
    openLink.classList.add('hidden');

    if (build && build.status === 'BUILDING') {
      emptySub.textContent = 'AiDevEngine is building your app — the preview will appear here when ready.';
    } else if (build && build.diagnosticPreviewUrl) {
      emptySub.textContent = 'A preview is running but has not passed verification yet — see Advanced / Diagnostics.';
    } else if (build && build.failureReason) {
      emptySub.textContent = 'Preview unavailable — see the result summary for details.';
    } else if (build && build.cleared) {
      emptySub.textContent = 'Preview cleared. Click Refresh preview, or run a new build.';
    } else {
      emptySub.textContent = 'Build an app to see it running here.';
    }
  }

  /**
   * Reloads the preview iframe in place without touching the result/timeline/prompt. Falls back
   * to the last known build's preview URL if the iframe was previously cleared.
   */
  function refreshPreview() {
    var frame = el('builder-preview-frame');
    var src = frame.getAttribute('src') || (state.lastBuild && state.lastBuild.previewUrl) || null;
    if (!src) return;
    renderPreview(state.lastBuild || { previewUrl: src });
    frame.src = 'about:blank';
    setTimeout(function () {
      frame.src = src;
    }, 30);
  }

  /** Clears only the preview iframe — the build result, timeline, and prompt are untouched. */
  function clearPreviewOnly() {
    renderPreview({ cleared: true });
  }

  // ---------------------------------------------------------------------
  // Failure / decision panel (BuildFailurePanel)
  // ---------------------------------------------------------------------

  function renderFailureActions(actions) {
    var wrap = el('builder-failure-actions');
    wrap.hidden = false;
    wrap.innerHTML = '';
    actions.forEach(function (action) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = action.primary ? 'builder-retry-btn' : 'builder-fresh-retry-btn';
      btn.textContent = action.label;
      btn.addEventListener('click', action.onClick);
      wrap.appendChild(btn);
    });
  }

  function hideFailure() {
    var panel = el('builder-result-panel');
    panel.hidden = true;
    panel.classList.add('hidden');
    el('builder-proof-section').hidden = true;
    el('builder-workspace-section').hidden = true;
    el('builder-execution-section').hidden = true;
    el('builder-faithfulness-section').hidden = true;
    el('builder-generation-faithfulness').hidden = true;
  }

  function renderResultList(listId, wrapId, items) {
    var wrap = el(wrapId);
    var list = el(listId);
    list.innerHTML = '';
    if (items && items.length) {
      wrap.hidden = false;
      items.forEach(function (line) {
        var li = document.createElement('li');
        li.textContent = line;
        list.appendChild(li);
      });
    } else {
      wrap.hidden = true;
    }
  }

  var RESULT_TONE = {
    BUILT_SUCCESSFULLY: 'tone-success',
    BUILT_WITH_WARNINGS: 'tone-warning',
    BUILT_WITH_PRODUCT_MISMATCH: 'tone-mismatch',
    BUILT_WITH_LOW_FAITHFULNESS: 'tone-low-faithfulness',
    BUILT_AFTER_FAITHFULNESS_REPAIR: 'tone-repaired',
    FAILED_PRODUCT_DRIFT: 'tone-drift',
    FAILED_CONTRACT_INCONSISTENCY: 'tone-inconsistent',
    FAILED_WITH_REPAIR_AVAILABLE: 'tone-repair',
    FAILED_BLOCKED: 'tone-blocked',
  };

  var ALL_RESULT_TONES = [
    'tone-success',
    'tone-warning',
    'tone-mismatch',
    'tone-low-faithfulness',
    'tone-repaired',
    'tone-drift',
    'tone-inconsistent',
    'tone-repair',
    'tone-blocked',
  ];

  // Phase 5 wording hierarchy: the MAIN headline is always one of these short, calm phrases.
  // Deeper/secondary detail (preview availability, interaction proof, validation, product
  // faithfulness) is rendered separately below it — never mixed into the main headline.
  // Product Faithfulness Milestone 1 adds a distinct pair: the app CAN run and still not be the
  // right app — that must never be reported as plain "Built and running".
  var RESULT_TITLE = {
    BUILT_SUCCESSFULLY: 'Built and running',
    BUILT_WITH_WARNINGS: 'Built with warnings',
    BUILT_WITH_PRODUCT_MISMATCH: 'Runs, but wrong product',
    BUILT_WITH_LOW_FAITHFULNESS: 'Runs, but low match to request',
    BUILT_AFTER_FAITHFULNESS_REPAIR: 'Built — drift repaired during generation',
    FAILED_PRODUCT_DRIFT: 'Runs, but drifted from the request',
    FAILED_CONTRACT_INCONSISTENCY: 'Generation lost the requested product',
    FAILED_WITH_REPAIR_AVAILABLE: 'Build needs repair',
    FAILED_BLOCKED: 'Build blocked',
  };

  var RESULT_BADGE = {
    BUILT_SUCCESSFULLY: { label: 'Built', tone: 'ready' },
    BUILT_WITH_WARNINGS: { label: 'Built (warnings)', tone: 'warning' },
    BUILT_WITH_PRODUCT_MISMATCH: { label: 'Wrong product', tone: 'failed' },
    BUILT_WITH_LOW_FAITHFULNESS: { label: 'Low match', tone: 'repair' },
    BUILT_AFTER_FAITHFULNESS_REPAIR: { label: 'Built (repaired)', tone: 'ready' },
    FAILED_PRODUCT_DRIFT: { label: 'Product drift', tone: 'failed' },
    FAILED_CONTRACT_INCONSISTENCY: { label: 'Contract inconsistent', tone: 'failed' },
    FAILED_WITH_REPAIR_AVAILABLE: { label: 'Repair available', tone: 'repair' },
    FAILED_BLOCKED: { label: 'Failed', tone: 'failed' },
  };

  var PROOF_BADGE = {
    PREVIEW_INTERACTION_PASS: { label: 'Interaction proof passed', tone: 'proof-pass' },
    PREVIEW_INTERACTION_PARTIAL: { label: 'Interaction proof needs work', tone: 'proof-partial' },
    PREVIEW_INTERACTION_FAIL: { label: 'Interaction proof needs work', tone: 'proof-fail' },
    PREVIEW_INTERACTION_BLOCKED: { label: 'Interaction proof blocked', tone: 'proof-blocked' },
  };

  var WORKSPACE_BADGE = {
    WORKSPACE_COMPLETE: { label: '✓ Complete', tone: 'workspace-complete' },
    WORKSPACE_REPAIRED: { label: '⚠ Repaired', tone: 'workspace-repaired' },
    WORKSPACE_INCOMPLETE: { label: '✗ Incomplete', tone: 'workspace-incomplete' },
    WORKSPACE_CORRUPTED: { label: '✗ Corrupted', tone: 'workspace-corrupted' },
    WORKSPACE_BLOCKED: { label: '✗ Blocked', tone: 'workspace-blocked' },
  };

  /**
   * Renders the "Workspace" section — whether the generated workspace was complete and
   * internally consistent (or safely repaired) before npm install ever ran. Plain English only;
   * raw workspace audit evidence lives in Advanced Diagnostics.
   */
  function renderWorkspaceStatus(workspaceMaterialization) {
    var section = el('builder-workspace-section');
    if (!workspaceMaterialization) {
      section.hidden = true;
      return;
    }

    section.hidden = false;
    var badge = el('builder-workspace-badge');
    var info = WORKSPACE_BADGE[workspaceMaterialization.status] || { label: workspaceMaterialization.status, tone: '' };
    badge.textContent = info.label;
    badge.className = 'builder-workspace-badge' + (info.tone ? ' ' + info.tone : '');

    el('builder-workspace-headline').textContent = workspaceMaterialization.headline || '';

    renderResultList('builder-workspace-repaired-list', 'builder-workspace-repaired-list', workspaceMaterialization.repaired);
    renderResultList('builder-workspace-missing-list', 'builder-workspace-missing-list', workspaceMaterialization.stillMissing);
  }

  var EXECUTION_BADGE = {
    COMPLETED: { label: 'Completed', tone: 'execution-completed' },
    RECOVERED: { label: 'Recovered', tone: 'execution-recovered' },
    RUNNING: { label: 'Running', tone: 'execution-running' },
    WAITING: { label: 'Waiting', tone: 'execution-waiting' },
    STALL_DETECTED: { label: 'Paused', tone: 'execution-stall_detected' },
    RECOVERING: { label: 'Recovering', tone: 'execution-recovering' },
    FAILED: { label: 'Stopped', tone: 'execution-failed' },
    BLOCKED: { label: 'Blocked', tone: 'execution-blocked' },
  };

  /**
   * Renders the "Execution status" section — whether build EXECUTION (not generation) is
   * healthy, slow, stalled, recovering, or done, using real runtime evidence only. Plain English
   * only; the raw execution timeline (which is the closest thing to process logs here) lives in
   * Advanced Diagnostics.
   */
  function renderExecutionStatus(buildExecution, appIsRunning, productionPath) {
    var section = el('builder-execution-section');
    if (!buildExecution) {
      section.hidden = true;
      return;
    }

    section.hidden = false;
    var blockedByProductionPath =
      productionPath &&
      (productionPath.executionStatus === 'BLOCKED' || productionPath.previewAvailable === false);
    var info = EXECUTION_BADGE[buildExecution.state] || { label: buildExecution.state, tone: '' };
    var headlineText = buildExecution.headline || '';

    if (!blockedByProductionPath && appIsRunning && (buildExecution.state === 'FAILED' || buildExecution.state === 'BLOCKED')) {
      info = { label: 'Needs a look', tone: 'execution-recovering' };
      headlineText = 'The app is running in the live preview. One background build stage needed attention — see details below.';
    }

    var badge = el('builder-execution-badge');
    badge.textContent = info.label;
    badge.className = 'builder-execution-badge' + (info.tone ? ' ' + info.tone : '');

    el('builder-execution-headline').textContent = headlineText;
    el('builder-execution-stage').textContent = buildExecution.currentStageLabel || '—';
    el('builder-execution-elapsed').textContent = buildExecution.elapsedLabel || '—';
    el('builder-execution-heartbeat').textContent = buildExecution.heartbeatLabel || '—';
    el('builder-execution-next').textContent = buildExecution.nextStepLabel || '—';

    var recovery = el('builder-execution-recovery');
    if (buildExecution.recoveryLabel) {
      recovery.hidden = false;
      recovery.textContent = buildExecution.recoveryLabel;
    } else {
      recovery.hidden = true;
      recovery.textContent = '';
    }
  }

  /**
   * Renders the "Live Preview Proof" section — whether the generated app is actually usable
   * inside the live preview, not just that a previewUrl exists. Plain English only; raw proof
   * evidence lives in Advanced Diagnostics.
   */
  function renderInteractionProof(livePreviewProof) {
    var section = el('builder-proof-section');
    if (!livePreviewProof) {
      section.hidden = true;
      return;
    }

    section.hidden = false;
    var badge = el('builder-proof-badge');
    var info = PROOF_BADGE[livePreviewProof.result] || { label: livePreviewProof.result, tone: '' };
    badge.textContent = info.label;
    badge.className = 'builder-proof-badge' + (info.tone ? ' ' + info.tone : '');

    el('builder-proof-headline').textContent = livePreviewProof.headline || '';

    renderResultList('builder-proof-worked-list', 'builder-proof-worked-list', livePreviewProof.whatWorked);
    renderResultList('builder-proof-failed-list', 'builder-proof-failed-list', livePreviewProof.whatFailed);
    renderResultList('builder-proof-repair-list', 'builder-proof-repair-list', livePreviewProof.suggestedRepair);

    // Compact by default — one line (badge + headline); expand only when there's something to fix.
    var details = el('builder-proof-details');
    if (details) {
      details.open = livePreviewProof.result === 'PREVIEW_INTERACTION_FAIL' || livePreviewProof.result === 'PREVIEW_INTERACTION_PARTIAL';
    }
  }

  var FAITHFULNESS_BADGE = {
    PRODUCT_FAITHFUL: { label: 'Faithful', tone: 'faithfulness-faithful' },
    PRODUCT_MOSTLY_FAITHFUL: { label: 'Mostly faithful', tone: 'faithfulness-mostly' },
    PARTIALLY_FAITHFUL: { label: 'Partially faithful', tone: 'faithfulness-partial' },
    LOW_FAITHFULNESS: { label: 'Low faithfulness', tone: 'faithfulness-low' },
    PRODUCT_MISMATCH: { label: 'Product mismatch', tone: 'faithfulness-mismatch' },
  };

  /**
   * Renders the compact "Product Faithfulness" panel — a separate question from whether the
   * app runs: is it recognizably the product that was requested? Plain English score/verdict/
   * top concepts only; the full concept-level comparison lives in Advanced Diagnostics.
   */
  function renderFaithfulness(productFaithfulness) {
    var section = el('builder-faithfulness-section');
    if (!productFaithfulness) {
      section.hidden = true;
      return;
    }

    section.hidden = false;
    el('builder-faithfulness-score').textContent = productFaithfulness.score + '%';

    var badge = el('builder-faithfulness-badge');
    var info = FAITHFULNESS_BADGE[productFaithfulness.verdict] || { label: productFaithfulness.verdict, tone: '' };
    badge.textContent = info.label;
    badge.className = 'builder-faithfulness-badge' + (info.tone ? ' ' + info.tone : '');

    el('builder-faithfulness-headline').textContent = productFaithfulness.headline || '';
    el('builder-faithfulness-reason').textContent = productFaithfulness.reason || '';

    renderResultList('builder-faithfulness-matched-list', 'builder-faithfulness-matched-wrap', productFaithfulness.topMatched);
    renderResultList('builder-faithfulness-missing-list', 'builder-faithfulness-missing-wrap', productFaithfulness.topMissing);
    renderResultList('builder-faithfulness-unexpected-list', 'builder-faithfulness-unexpected-wrap', productFaithfulness.topUnexpected);

    // Compact by default — expand automatically only when there is a real problem to review.
    var details = el('builder-faithfulness-details');
    if (details) {
      details.open = productFaithfulness.verdict === 'PRODUCT_MISMATCH' || productFaithfulness.verdict === 'LOW_FAITHFULNESS';
    }
  }

  var GENERATION_FAITHFULNESS_BADGE = {
    CONSISTENT: { label: 'Consistent', tone: 'generation-consistent' },
    DRIFTED: { label: 'Drifted', tone: 'generation-drifted' },
    SUBSTITUTED: { label: 'Substituted', tone: 'generation-substituted' },
    INCONSISTENT: { label: 'Inconsistent', tone: 'generation-inconsistent' },
  };

  /**
   * Renders the Product Faithfulness Milestone 2 sub-panel — whether product identity survived
   * generation itself (not just the finished app): canonical product identity, concept
   * retention/drift, and any repairs AiDevEngine already applied. Raw per-stage evidence and the
   * concept graph live in Advanced Diagnostics only.
   */
  function renderGenerationFaithfulness(generationFaithfulness, productionPath) {
    var section = el('builder-generation-faithfulness');
    var rootCauseFindings =
      productionPath && Array.isArray(productionPath.canonicalRootCauseFindings)
        ? productionPath.canonicalRootCauseFindings
        : [];
    if (!generationFaithfulness && rootCauseFindings.length === 0) {
      section.hidden = true;
      return;
    }

    section.hidden = false;
    el('builder-generation-faithfulness-identity').textContent =
      (productionPath && productionPath.projectTitle) ||
      (generationFaithfulness && generationFaithfulness.productIdentity) ||
      '';

    var badge = el('builder-generation-faithfulness-badge');
    var verdict =
      rootCauseFindings.length > 0
        ? 'INCONSISTENT'
        : generationFaithfulness
          ? generationFaithfulness.verdict
          : 'CONSISTENT';
    var info = GENERATION_FAITHFULNESS_BADGE[verdict] || { label: verdict, tone: '' };
    badge.textContent = info.label;
    badge.className = 'builder-generation-faithfulness-badge' + (info.tone ? ' ' + info.tone : '');

    if (generationFaithfulness) {
      el('builder-generation-faithfulness-retention').textContent =
        'Concept retention: ' + generationFaithfulness.conceptRetentionPercent + '%';
      el('builder-generation-faithfulness-drift').textContent =
        'Concept drift: ' + generationFaithfulness.conceptDriftPercent + '%';
    }

    renderResultList('builder-generation-faithfulness-recovered-list', 'builder-generation-faithfulness-recovered-wrap', []);
    renderResultList(
      'builder-generation-faithfulness-missing-list',
      'builder-generation-faithfulness-missing-wrap',
      rootCauseFindings.length
        ? rootCauseFindings.map(function (finding) {
            return (
              finding.concept +
              ' — first broken at ' +
              finding.firstBrokenBoundary +
              '. ' +
              finding.requiredAction
            );
          })
        : generationFaithfulness
          ? generationFaithfulness.remainingMissingConcepts
          : [],
    );
    renderResultList('builder-generation-faithfulness-repairs-list', 'builder-generation-faithfulness-repairs-wrap', []);

    var details = el('builder-generation-faithfulness-details');
    if (details) {
      details.open = rootCauseFindings.length > 0 || verdict === 'SUBSTITUTED' || verdict === 'INCONSISTENT';
    }
  }

  /**
   * Builds the short secondary detail line shown under the main headline — plain, specific
   * facts (never the scary raw internal jargon), e.g. "Preview is available. Interaction
   * proof could not confirm one behavior."
   */
  function buildSecondaryDetailLine(normalized, productionPath) {
    if (productionPath && (productionPath.executionStatus === 'BLOCKED' || productionPath.previewAvailable === false)) {
      var diagnosticRoot =
        (productionPath.diagnostics && productionPath.diagnostics.rootCause) ||
        productionPath.completionMessage ||
        '';
      return diagnosticRoot;
    }
    var stages = normalized.stages || {};
    var lines = [];
    if (stages.previewReady) lines.push('Preview is available.');
    var proof = normalized.livePreviewProof;
    if (proof && (proof.result === 'PREVIEW_INTERACTION_FAIL' || proof.result === 'PREVIEW_INTERACTION_PARTIAL')) {
      lines.push('Interaction proof could not confirm one behavior.');
    }
    var faithfulness = normalized.productFaithfulness;
    if (faithfulness && (faithfulness.verdict === 'PRODUCT_MISMATCH' || faithfulness.verdict === 'LOW_FAITHFULNESS')) {
      lines.push('The app does not closely match what was requested — see Product Faithfulness below.');
    }
    var genFaithfulness = normalized.generationFaithfulness;
    if (genFaithfulness && (genFaithfulness.verdict === 'SUBSTITUTED' || genFaithfulness.verdict === 'INCONSISTENT')) {
      lines.push('Product identity drifted during generation — see Product Faithfulness below.');
    } else if (genFaithfulness && genFaithfulness.recoveredConcepts && genFaithfulness.recoveredConcepts.length) {
      lines.push('AiDevEngine repaired product drift detected during generation.');
    }
    if (stages.validationNeedsWork) lines.push('Deeper validation needs work.');
    if (!lines.length && !stages.previewReady) lines.push('No live preview is available yet.');
    return lines.join(' ');
  }

  /**
   * Renders exactly one clear result (BUILT_SUCCESSFULLY / BUILT_WITH_WARNINGS /
   * FAILED_WITH_REPAIR_AVAILABLE / FAILED_BLOCKED) using the server-computed normalizedBuild.
   * Raw JSON and internal authority names never appear here — only in Advanced Diagnostics.
   */
  function renderBuildResult(normalized, productionPath) {
    var panel = el('builder-result-panel');
    panel.hidden = false;
    panel.classList.remove('hidden');
    panel.classList.remove.apply(panel.classList, ALL_RESULT_TONES);
    panel.classList.add(RESULT_TONE[normalized.result] || 'tone-blocked');

    el('builder-result-title').textContent = RESULT_TITLE[normalized.result] || 'Build result';
    el('builder-result-detail-line').textContent = buildSecondaryDetailLine(normalized, productionPath);
    el('builder-result-headline').textContent =
      (productionPath && productionPath.completionMessage) || normalized.summary.headline;

    var whatFailed =
      productionPath && productionPath.diagnostics && Array.isArray(productionPath.diagnostics.summaryLines) && productionPath.diagnostics.summaryLines.length
        ? productionPath.diagnostics.summaryLines
        : normalized.summary.whatFailed;
    renderResultList('builder-result-worked-list', 'builder-result-worked-wrap', normalized.summary.whatWorked);
    renderResultList('builder-result-failed-list', 'builder-result-failed-wrap', whatFailed);
    renderResultList('builder-repair-attempts-list', 'builder-repair-attempts', normalized.summary.whatAiDevEngineTried);
    renderWorkspaceStatus(normalized.workspaceMaterialization);
    renderExecutionStatus(normalized.buildExecution, productionPath ? productionPath.previewAvailable === true : normalized.showLivePreview === true, productionPath);
    renderInteractionProof(normalized.livePreviewProof);
    renderFaithfulness(normalized.productFaithfulness);
    renderGenerationFaithfulness(normalized.generationFaithfulness, productionPath);

    el('builder-result-next').textContent =
      (productionPath && productionPath.nextStep) || normalized.summary.whatToDoNext;

    // Keep the summary short and calm by default; auto-expand full details only when there's
    // something the user should actually look at, so a clean success stays a one-glance panel.
    var moreDetails = el('builder-result-more');
    if (moreDetails) moreDetails.open = normalized.result !== 'BUILT_SUCCESSFULLY';

    if (normalized.result === 'BUILT_SUCCESSFULLY' || normalized.result === 'BUILT_AFTER_FAITHFULNESS_REPAIR') {
      el('builder-failure-actions').hidden = true;
    } else {
      renderFailureActions([
        {
          label: 'Retry build',
          primary: true,
          onClick: function () {
            runBuild(state.lastPrompt, { projectId: state.projectId });
          },
        },
        {
          label: 'Start fresh & retry',
          primary: false,
          onClick: function () {
            persistProjectId(null);
            runBuild(state.lastPrompt, {
              confirmFreshCopy: true,
              buildIntentOverride: 'START_NEW_BUILD',
            });
          },
        },
      ]);
    }

    var badge = RESULT_BADGE[normalized.result] || { label: normalized.result, tone: null };
    setStatusBadge(badge.label, badge.tone);
  }

  function describeRepairAttempts(build) {
    var lines = [];
    if (build && build.buildAutofixLoop && Array.isArray(build.buildAutofixLoop.attempts)) {
      build.buildAutofixLoop.attempts.forEach(function (attempt) {
        lines.push(
          'Attempt ' +
            attempt.attempt +
            ' — ' +
            (attempt.failureClass || 'build issue').toLowerCase().replace(/_/g, ' ') +
            ': ' +
            (attempt.repairApplied ? 'repair applied' : 'no repair applied') +
            (attempt.buildRerunOk ? ', rebuild passed afterward' : ', rebuild still failing'),
        );
      });
    }
    if (build && build.previewRecoveryAttempts) {
      lines.push('Live preview recovery attempted ' + build.previewRecoveryAttempts + ' time(s).');
    }
    return lines;
  }

  function resolveFailureReason(build, payload) {
    if (build && build.failureReason) return build.failureReason;
    if (payload && typeof payload.previewMissingReason === 'string' && payload.previewMissingReason) {
      return payload.previewMissingReason;
    }
    if (build && build.npmInstallOk === false) return 'Dependency installation did not complete successfully.';
    if (build && build.npmBuildOk === false) return 'The generated app did not compile successfully.';
    return 'AiDevEngine could not finish this build, and did not report a specific reason.';
  }

  /** Fallback for the rare case the server did not return normalizedBuild — never shows raw JSON. */
  function showFailure(reasonText, repairAttempts) {
    var panel = el('builder-result-panel');
    panel.hidden = false;
    panel.classList.remove('hidden');
    panel.classList.remove.apply(panel.classList, ALL_RESULT_TONES);
    panel.classList.add('tone-blocked');
    el('builder-result-title').textContent = 'Build blocked';
    el('builder-result-detail-line').textContent = '';
    el('builder-result-headline').textContent = reasonText;
    el('builder-result-worked-wrap').hidden = true;
    el('builder-result-failed-wrap').hidden = true;
    el('builder-proof-section').hidden = true;
    el('builder-workspace-section').hidden = true;
    el('builder-execution-section').hidden = true;
    el('builder-faithfulness-section').hidden = true;
    el('builder-generation-faithfulness').hidden = true;
    el('builder-result-next').textContent = 'Try Retry build, or simplify your prompt and build again.';
    var moreDetails1 = el('builder-result-more');
    if (moreDetails1) moreDetails1.open = true;

    renderResultList('builder-repair-attempts-list', 'builder-repair-attempts', repairAttempts);

    renderFailureActions([
      {
        label: 'Retry build',
        primary: true,
        onClick: function () {
          runBuild(state.lastPrompt, { projectId: state.projectId });
        },
      },
      {
        label: 'Start fresh & retry',
        primary: false,
        onClick: function () {
          persistProjectId(null);
          runBuild(state.lastPrompt, {
            confirmFreshCopy: true,
            buildIntentOverride: 'START_NEW_BUILD',
          });
        },
      },
    ]);
  }

  function showDecisionPanel(message, actions, opts) {
    opts = opts || {};
    var panel = el('builder-result-panel');
    panel.hidden = false;
    panel.classList.remove('hidden');
    panel.classList.remove.apply(panel.classList, ALL_RESULT_TONES);
    el('builder-result-title').textContent = opts.title || 'AiDevEngine needs a quick decision';
    el('builder-result-detail-line').textContent = opts.detailLine || '';
    el('builder-result-headline').textContent = message;
    el('builder-result-worked-wrap').hidden = true;
    el('builder-result-failed-wrap').hidden = true;
    el('builder-proof-section').hidden = true;
    el('builder-workspace-section').hidden = true;
    el('builder-execution-section').hidden = true;
    el('builder-faithfulness-section').hidden = true;
    el('builder-generation-faithfulness').hidden = true;
    el('builder-result-next').textContent = '';
    el('builder-repair-attempts').hidden = true;
    var moreDetails2 = el('builder-result-more');
    if (moreDetails2) moreDetails2.open = true;
    renderFailureActions(actions);
  }

  // ---------------------------------------------------------------------
  // Diagnostics drawer (advanced, hidden by default)
  // ---------------------------------------------------------------------

  function renderDiagnostics(payload, build) {
    var normalized = payload.normalizedBuild || null;

    el('diag-project-id').textContent = (build && build.projectId) || '—';
    el('diag-build-id').textContent = (build && build.buildId) || '—';
    el('diag-status').textContent = (build && build.status) || '—';
    el('diag-normalized-result').textContent = (normalized && normalized.result) || '—';
    el('diag-npm-install').textContent = build ? (build.npmInstallOk ? 'PASS' : 'FAIL') : '—';
    el('diag-npm-build').textContent = build ? (build.npmBuildOk ? 'PASS' : 'FAIL') : '—';
    el('diag-preview-status').textContent = (build && build.previewStatus) || (build && build.livePreviewAvailable ? 'UNLOCKED' : 'UNAVAILABLE');

    var stages = normalized && normalized.stages;
    el('diag-workspace-ready').textContent = stages ? (stages.workspaceReady ? 'YES' : 'NO') : '—';
    el('diag-dependencies-ready').textContent = stages ? (stages.dependenciesReady ? 'YES' : 'NO') : '—';
    el('diag-build-ready').textContent = stages ? (stages.buildReady ? 'YES' : 'NO') : '—';
    el('diag-build-output-ready').textContent = stages ? (stages.buildOutputReady ? 'YES' : 'NO') : '—';
    el('diag-preview-ready').textContent = stages ? (stages.previewReady ? 'YES' : 'NO') : '—';
    el('diag-validation-needs-work').textContent = stages ? (stages.validationNeedsWork ? 'YES' : 'NO') : '—';
    el('diag-launch-not-ready').textContent = stages ? (stages.launchNotReady ? 'YES' : 'NO') : '—';

    var workspaceReport = (build && build.workspaceStabilizerReport) || null;
    el('diag-workspace-status').textContent = workspaceReport ? workspaceReport.status : (payload.workspaceMaterializationStatus || '—');
    el('diag-workspace-files-checked').textContent = workspaceReport ? String(workspaceReport.evidence.filesChecked) : '—';
    el('diag-workspace-findings-count').textContent = workspaceReport ? String(workspaceReport.evidence.findings.length) : '—';
    el('diag-workspace-repairs-applied').textContent = workspaceReport
      ? String(workspaceReport.repairActions.filter(function (a) { return a.applied; }).length)
      : '—';
    el('builder-diagnostics-workspace-raw').textContent = workspaceReport ? JSON.stringify(workspaceReport, null, 2) : 'No workspace audit run yet.';

    var executionTimeline = payload.executionTimeline || (build && build.executionTimeline) || [];
    var executionRecovery = payload.executionRecovery || (build && build.executionRecovery) || [];
    var executionState = payload.buildExecutionStatus || (build && build.buildExecutionStatus) || null;
    el('diag-execution-state').textContent = executionState || '—';
    el('diag-execution-duration').textContent = executionTimeline.length
      ? String(executionTimeline.reduce(function (sum, entry) { return sum + (entry.durationMs || 0); }, 0))
      : '—';
    el('diag-execution-recovery-count').textContent = String(executionRecovery.length);
    el('diag-execution-stage-count').textContent = String(executionTimeline.length);
    el('builder-diagnostics-execution-raw').textContent = executionTimeline.length
      ? JSON.stringify({ state: executionState, timeline: executionTimeline, recovery: executionRecovery }, null, 2)
      : 'No build execution recorded yet.';

    var proof = payload.livePreviewInteractionProof || null;
    el('diag-proof-result').textContent = proof ? proof.result : '—';
    el('diag-proof-page-loaded').textContent = proof ? (proof.evidence.pageLoaded ? 'YES' : 'NO') : '—';
    el('diag-proof-root-ui').textContent = proof ? (proof.evidence.rootUiFound ? 'YES' : 'NO') : '—';
    el('diag-proof-primary-text').textContent = proof ? (proof.evidence.primaryFeatureTextFound || 'not found') : '—';
    el('diag-proof-fatal-error').textContent = proof ? (proof.evidence.fatalConsoleErrorDetected ? 'YES' : 'NO') : '—';
    el('diag-proof-duration').textContent = proof ? String(proof.evidence.durationMs) : '—';
    el('builder-diagnostics-proof-raw').textContent = proof ? JSON.stringify(proof, null, 2) : 'No proof run yet.';

    var faithfulness = payload.productFaithfulness || null;
    el('diag-faithfulness-score').textContent = faithfulness ? faithfulness.score + '%' : '—';
    el('diag-faithfulness-verdict').textContent = faithfulness ? faithfulness.verdict : '—';
    el('diag-faithfulness-domain').textContent = faithfulness ? (faithfulness.requested.domainLabel || 'not recognized') : '—';
    el('diag-faithfulness-counts').textContent = faithfulness
      ? (faithfulness.comparison.matched.length + ' / ' + faithfulness.comparison.missing.length + ' / ' + faithfulness.comparison.unexpected.length)
      : '—';
    el('builder-diagnostics-faithfulness-raw').textContent = faithfulness ? JSON.stringify(faithfulness, null, 2) : 'No faithfulness evaluation run yet.';

    var genFaithfulness = payload.generationFaithfulness || null;
    el('diag-generation-faithfulness-identity').textContent = genFaithfulness ? genFaithfulness.contract.productIdentity : '—';
    el('diag-generation-faithfulness-verdict').textContent = genFaithfulness ? genFaithfulness.verdict : '—';
    el('diag-generation-faithfulness-retention').textContent = genFaithfulness ? genFaithfulness.conceptRetentionPercent + '%' : '—';
    el('diag-generation-faithfulness-drift').textContent = genFaithfulness ? genFaithfulness.conceptDriftPercent + '%' : '—';
    el('diag-generation-faithfulness-repairs').textContent = genFaithfulness
      ? String(genFaithfulness.repairsPerformed.filter(function (a) { return a.applied; }).length) + ' / ' + String(genFaithfulness.repairsPerformed.length)
      : '—';
    el('diag-generation-faithfulness-dominant').textContent = genFaithfulness
      ? (genFaithfulness.unexpectedDominantConcepts.length ? genFaithfulness.unexpectedDominantConcepts.join(', ') : 'none')
      : '—';
    el('builder-diagnostics-generation-faithfulness-raw').textContent = genFaithfulness
      ? JSON.stringify(genFaithfulness, null, 2)
      : 'No generation faithfulness audit run yet.';

    var traceEl = el('builder-diagnostics-trace');
    if (Array.isArray(payload.executionTraceEvents) && payload.executionTraceEvents.length) {
      traceEl.textContent = JSON.stringify(payload.executionTraceEvents, null, 2);
    } else {
      traceEl.textContent = 'No execution trace returned for this build.';
    }

    el('builder-diagnostics-raw').textContent = JSON.stringify(payload, null, 2);
  }

  function openDiagnostics() {
    el('builder-diagnostics-drawer').hidden = false;
    el('builder-diagnostics-drawer').classList.remove('hidden');
    el('builder-diagnostics-drawer').setAttribute('aria-hidden', 'false');
    el('builder-diagnostics-backdrop').hidden = false;
    el('builder-diagnostics-backdrop').classList.remove('hidden');
    el('builder-advanced-toggle').setAttribute('aria-expanded', 'true');
  }

  function closeDiagnostics() {
    el('builder-diagnostics-drawer').hidden = true;
    el('builder-diagnostics-drawer').classList.add('hidden');
    el('builder-diagnostics-drawer').setAttribute('aria-hidden', 'true');
    el('builder-diagnostics-backdrop').hidden = true;
    el('builder-diagnostics-backdrop').classList.add('hidden');
    el('builder-advanced-toggle').setAttribute('aria-expanded', 'false');
  }

  // ---------------------------------------------------------------------
  // Build orchestration — calls the real build pipeline
  // ---------------------------------------------------------------------

  function extractBuild(payload) {
    if (!payload) return null;
    if (payload.build) return payload.build;
    if (payload.rawResponse && payload.rawResponse.build) return payload.rawResponse.build;
    return null;
  }

  function resolveProjectTitle(payload, build) {
    if (payload && payload.productionPath && payload.productionPath.projectTitle) {
      return payload.productionPath.projectTitle;
    }
    if (build && build.approvedProductIdentity && build.approvedProductIdentity.displayName) {
      return build.approvedProductIdentity.displayName;
    }
    if (build && build.projectName) return build.projectName;
    return 'Identity resolution failed — approved product identity missing.';
  }

  function applyBuildPayload(payload) {
    var build = extractBuild(payload);
    state.lastPayload = payload;
    state.lastBuild = build;

    if (build && build.projectId) persistProjectId(build.projectId);
    if (build && build.buildId && payload.productionPath && payload.productionPath.buildRequestId !== build.buildId) {
      return;
    }
    el('builder-prompt-hint').textContent = 'Project: ' + resolveProjectTitle(payload, build);

    var steps = buildWorkLogSteps(payload);
    renderWorkLog(steps);

    var status = (build && build.status) || payload.status || 'UNKNOWN';
    var normalized = payload.normalizedBuild || null;

    if (status === 'READY' || status === 'FAILED') {
      if (normalized) {
        renderBuildResult(normalized, payload.productionPath || null);
      } else {
        setStatusBadge('Failed', 'failed');
        showFailure(resolveFailureReason(build, payload), describeRepairAttempts(build));
      }
    } else if (status === 'BUILDING') {
      setStatusBadge('Building…', 'building');
      hideFailure();
    } else {
      setStatusBadge(status, null);
    }

    renderPreview(build, payload.productionPath || null);
    renderDiagnostics(payload, build);
  }

  function handleAlignmentRequired(payload, promptText) {
    setStatusBadge('Needs input', null);
    var message =
      (typeof payload.brainResponse === 'string' && payload.brainResponse) ||
      (typeof payload.message === 'string' && payload.message) ||
      'AiDevEngine wants to confirm which project this build belongs to.';
    showDecisionPanel(message, [
      {
        label: 'Continue in current project',
        primary: true,
        onClick: function () {
          runBuild(promptText, { projectId: state.projectId, confirmProjectContextAlignment: true });
        },
      },
      {
        label: 'Start a new project instead',
        primary: false,
        onClick: function () {
          persistProjectId(null);
          runBuild(promptText, { confirmFreshCopy: true });
        },
      },
    ]);
  }

  function handleResumeRequired(payload, promptText) {
    setStatusBadge('Needs input', null);
    var message =
      (typeof payload.message === 'string' && payload.message) ||
      'AiDevEngine found an existing, unfinished project that looks related to this prompt.';
    showDecisionPanel(message, [
      {
        label: 'Resume existing project',
        primary: true,
        onClick: function () {
          persistProjectId(payload.resumingProjectId || state.projectId);
          runBuild(promptText, { projectId: state.projectId, confirmProjectResume: true });
        },
      },
      {
        label: 'Create a fresh copy',
        primary: false,
        onClick: function () {
          persistProjectId(null);
          runBuild(promptText, { confirmFreshCopy: true });
        },
      },
    ]);
  }

  /**
   * NEW_BUILD_CONFIRMATION_REQUIRED UX V4 — Project Context Isolation correctly blocked ambiguous
   * build context (HTTP 409, outcome NEW_BUILD_CONFIRMATION_REQUIRED). Show a clear confirmation
   * panel instead of the generic "Build request failed (HTTP 409)." message, and resubmit the
   * same prompt with an explicit buildIntentOverride once the user picks a side.
   */
  function handleNewBuildConfirmationRequired(payload, promptText) {
    setStatusBadge('Needs input', null);
    var body = 'AiDevEngine needs to know whether this prompt should start a new app or continue the existing project.';
    var promptSummary = (typeof payload.currentPromptSummary === 'string' && payload.currentPromptSummary) || promptText;
    var projectSummary = typeof payload.activeProjectSummary === 'string' && payload.activeProjectSummary ? payload.activeProjectSummary : null;
    var contextIsolation = payload.contextIsolation || {};
    var reason = (typeof contextIsolation.reason === 'string' && contextIsolation.reason) ||
      (typeof payload.message === 'string' && payload.message) ||
      'AiDevEngine could not confidently tell whether this prompt continues the current project or starts a new one.';

    var detailLine = 'Current prompt: "' + promptSummary + '" · Existing project: ' +
      (projectSummary || 'none available') + ' · Why confirmation is required: ' + reason;

    showDecisionPanel(body, [
      {
        label: 'Start fresh app',
        primary: true,
        onClick: function () {
          persistProjectId(null);
          runBuild(promptText, { buildIntentOverride: 'START_NEW_BUILD' });
        },
      },
      {
        label: 'Continue existing project',
        primary: false,
        onClick: function () {
          runBuild(promptText, { projectId: state.projectId, buildIntentOverride: 'CONTINUE_EXISTING_PROJECT' });
        },
      },
    ], {
      title: 'Confirm build context',
      detailLine: detailLine,
    });
  }

  /**
   * Fresh Build Artifact Isolation V4 — clears every previously visible build-result surface
   * (Product Faithfulness panel, Live Preview Proof panel, engineering report / worklog, failure
   * summary, matched/missing/unexpected + recovered/missing concept lists, live preview
   * iframe/source, and the in-memory last-build/last-payload snapshot) before a build request is
   * even sent. Guarantees a fresh build can never keep showing a previous app's report/preview
   * while the new one is being computed, and that `state.lastBuild` cannot be read (e.g. by
   * refreshPreview()) as if it belonged to the build now in flight. Never touches the prompt text
   * or generated project files.
   */
  function clearPreviousBuildEvidenceForFreshBuild() {
    hideFailure();
    renderPreview({ status: 'BUILDING' });
    renderResultList('builder-faithfulness-matched-list', 'builder-faithfulness-matched-wrap', []);
    renderResultList('builder-faithfulness-missing-list', 'builder-faithfulness-missing-wrap', []);
    renderResultList('builder-faithfulness-unexpected-list', 'builder-faithfulness-unexpected-wrap', []);
    renderResultList('builder-generation-faithfulness-recovered-list', 'builder-generation-faithfulness-recovered-wrap', []);
    renderResultList('builder-generation-faithfulness-missing-list', 'builder-generation-faithfulness-missing-wrap', []);
    renderResultList('builder-proof-worked-list', 'builder-proof-worked-list', []);
    renderResultList('builder-proof-failed-list', 'builder-proof-failed-list', []);
    state.lastBuild = null;
    state.lastPayload = null;
  }

  function runBuild(promptText, options) {
    options = options || {};
    var trimmed = (promptText || '').trim();
    if (!trimmed) {
      el('builder-prompt-hint').textContent = 'Enter a build prompt first.';
      return;
    }
    if (state.building) return;

    // Do not begin a build while the submission API is known-down.
    if (state.apiReady === false) {
      setStatusBadge('Failed', 'failed');
      showFailure(
        formatTransportFailure({
          kind: 'BACKEND_UNAVAILABLE',
          title: 'Backend unavailable',
          detail: 'Build API readiness check has not succeeded yet.',
          recovery: 'Wait until the status pill shows “API ready”, or run `npm run dev` and reload http://127.0.0.1:4321.',
        }),
        [],
      );
      checkRuntimeStatus(1);
      return;
    }

    state.building = true;
    state.hasStartedAnyBuild = true;
    el('builder-reset-btn').disabled = false;
    state.requestId += 1;
    var thisRequestId = state.requestId;
    var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    state.abortController = controller;

    persistPrompt(trimmed);
    clearPreviousBuildEvidenceForFreshBuild();
    el('builder-build-btn').disabled = true;
    el('builder-build-btn').textContent = 'Building…';
    el('builder-prompt-hint').textContent = '';
    setStatusBadge('Building…', 'building');
    renderWorkLog([{ title: 'Sending prompt to AiDevEngine…', detail: '', status: 'active', timestamp: Date.now() }]);

    var body = { prompt: trimmed, forceBuildIntent: true };
    if (options.projectId) body.projectId = options.projectId;
    if (options.confirmFreshCopy) body.confirmFreshCopy = true;
    if (options.confirmProjectContextAlignment) body.confirmProjectContextAlignment = true;
    if (options.confirmProjectResume) body.confirmProjectResume = true;
    if (options.buildIntentOverride) body.buildIntentOverride = options.buildIntentOverride;

    var fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(body),
    };
    if (controller) fetchOptions.signal = controller.signal;

    // Reconfirm readiness immediately before submission (covers "backend becomes ready after UI load").
    var readyGate = fetch(BUILD_READY_API, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Build readiness HTTP ' + res.status);
        return res.json();
      })
      .then(function (readyPayload) {
        if (!readyPayload || readyPayload.ok !== true || readyPayload.submissionReady === false) {
          var gateErr = new Error('Build submission route is not ready');
          gateErr.code = 'BACKEND_UNAVAILABLE';
          throw gateErr;
        }
        state.apiReady = true;
        return fetch(BUILD_API, fetchOptions);
      });

    readyGate
      .then(function (res) {
        return res.text().then(function (text) {
          var payload = null;
          try {
            payload = text ? JSON.parse(text) : null;
          } catch (parseErr) {
            var invalid = new Error('AiDevEngine returned an unreadable response.');
            invalid.code = 'INVALID_API_RESPONSE';
            throw invalid;
          }
          return { res: res, payload: payload };
        });
      })
      .then(function (result) {
        // A Reset test / New prompt click may have already moved the UI on — ignore this
        // now-stale response instead of overwriting a state the user has already cleared.
        if (thisRequestId !== state.requestId) return;

        var res = result.res;
        var payload = result.payload || {};

        if (res.status === 409 && payload.resumeRequired) {
          handleResumeRequired(payload, trimmed);
          return;
        }
        if (res.status === 409 && payload.outcome === 'NEW_BUILD_CONFIRMATION_REQUIRED') {
          // Project Context Isolation V4 blocked ambiguous build context — this is a decision the
          // user needs to make, not a generic build failure, so it never falls through to the
          // "Build request failed (HTTP 409)" branch below.
          handleNewBuildConfirmationRequired(payload, trimmed);
          return;
        }
        if (res.status === 409 && payload.rejectDuplicates) {
          setStatusBadge('Failed', 'failed');
          showFailure(payload.error || 'A project with this name already exists.', []);
          return;
        }
        if (payload.projectContextAlignment) {
          handleAlignmentRequired(payload, trimmed);
          return;
        }
        if (!res.ok) {
          var rejected = new Error(payload.error || 'Build request failed (HTTP ' + res.status + ').');
          rejected.code = payload.code || (res.status === 413 ? 'PAYLOAD_TOO_LARGE' : 'BUILD_REQUEST_REJECTED');
          rejected.httpStatus = res.status;
          rejected.payload = payload;
          throw rejected;
        }

        applyBuildPayload(payload);
      })
      .catch(function (err) {
        if (thisRequestId !== state.requestId) return; // cancelled via Reset test / New prompt
        if (err && err.name === 'AbortError') return; // deliberate cancellation, not a real failure
        setStatusBadge('Failed', 'failed');
        var classified = classifyTransportError(err, err && err.httpStatus, err && err.payload);
        showFailure(formatTransportFailure(classified), []);
        if (classified.kind === 'BACKEND_UNAVAILABLE') {
          state.apiReady = false;
          checkRuntimeStatus(1);
        }
      })
      .finally(function () {
        if (thisRequestId !== state.requestId) return;
        state.building = false;
        state.abortController = null;
        el('builder-build-btn').disabled = false;
        el('builder-build-btn').textContent = 'Build';
      });
  }

  // ---------------------------------------------------------------------
  // Reset test / New prompt — Phase 5 cockpit controls
  // ---------------------------------------------------------------------

  /** If a build is currently in flight, cancel UI tracking of it and mark it stale. */
  function cancelActiveBuildTracking() {
    if (state.abortController) {
      try { state.abortController.abort(); } catch (abortErr) { /* ignore */ }
    }
    state.abortController = null;
    state.building = false;
    state.requestId += 1; // invalidates any in-flight .then()/.catch() from the old request
    el('builder-build-btn').disabled = false;
    el('builder-build-btn').textContent = 'Build';
  }

  /** Shared UI reset: clears result, preview, and timeline — never touches generated project files. */
  function clearResultPreviewAndTimeline() {
    hideFailure();
    showProgressEmpty(true);
    el('builder-worklog').innerHTML = '';
    renderPreview(null);
    setStatusBadge('Idle', null);
    state.lastPayload = null;
    state.lastBuild = null;
  }

  /**
   * Reset test — clears the result, preview, and timeline but keeps the current prompt text,
   * so the same idea can be tried again immediately. Cancels any in-flight build tracking first.
   */
  function resetTest() {
    cancelActiveBuildTracking();
    clearResultPreviewAndTimeline();
    el('builder-prompt-hint').textContent = 'Ready for another test with the same prompt.';
  }

  /**
   * New prompt — clears everything (prompt, result, preview, timeline, proof state) so the user
   * can start testing a completely different idea. Also starts a fresh project on the next build.
   */
  function newPrompt() {
    cancelActiveBuildTracking();
    clearResultPreviewAndTimeline();
    persistProjectId(null);
    el('builder-prompt-input').value = '';
    persistPrompt('');
    el('builder-reset-btn').disabled = true;
    state.hasStartedAnyBuild = false;
    el('builder-prompt-hint').textContent = 'Describe a new app above.';
    el('builder-prompt-input').focus();
  }

  // ---------------------------------------------------------------------
  // Wiring
  // ---------------------------------------------------------------------

  function init() {
    checkRuntimeStatus();

    if (state.lastPrompt) {
      el('builder-prompt-input').value = state.lastPrompt;
    }

    el('builder-build-btn').addEventListener('click', function () {
      var prompt = el('builder-prompt-input').value;
      runBuild(prompt, { projectId: state.projectId || undefined });
    });

    el('builder-prompt-input').addEventListener('keydown', function (event) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        el('builder-build-btn').click();
      }
    });

    el('builder-reset-btn').addEventListener('click', resetTest);
    el('builder-new-btn').addEventListener('click', newPrompt);

    el('builder-preview-refresh-btn').addEventListener('click', refreshPreview);
    el('builder-preview-clear-btn').addEventListener('click', clearPreviewOnly);

    el('builder-advanced-toggle').addEventListener('click', function () {
      var isOpen = !el('builder-diagnostics-drawer').hidden;
      if (isOpen) closeDiagnostics();
      else openDiagnostics();
    });
    el('builder-diagnostics-close').addEventListener('click', closeDiagnostics);
    el('builder-diagnostics-backdrop').addEventListener('click', closeDiagnostics);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeDiagnostics();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.AiDevEngineBuilderHome = {
    runBuild: runBuild,
    resetTest: resetTest,
    newPrompt: newPrompt,
    getState: function () { return state; },
  };
})();
