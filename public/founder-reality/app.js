/**
 * DevPulse V2 Command Center — Phase 11.1B UX Stabilization.
 * Chat-first layout. Local brain via POST /api/brain/respond. No persistence or execution.
 */

(function commandCenterShell() {
  'use strict';

  var FEED_STAGE_DELAY_MS = 180;
  var manifestData = null;
  var conversationStarted = false;
  var defaultFeedSections = ['Planning', 'Execution', 'Verification', 'Approvals', 'Learning'];
  var runtimeNotifications = [];
  var runtimeDiagnostics = {
    brainConnected: false,
    brainEndpointReachable: false,
    operatorFeedActive: false,
    chatIntegrationActive: true,
    lastRequestStatus: 'Not started',
    lastError: 'None',
  };

  function el(id) {
    return document.getElementById(id);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function scrollChatToBottom() {
    var history = el('chat-history');
    if (!history) return;
    history.scrollTop = history.scrollHeight;
  }

  function scrollFeedToLatest() {
    var body = el('operator-feed-body');
    if (body) body.scrollTop = body.scrollHeight;
    var log = el('feed-stream-log');
    if (log) log.scrollTop = log.scrollHeight;
  }

  function showWelcomeState() {
    var welcome = el('chat-welcome-state');
    var panel = el('chat-messages-panel');
    if (welcome) welcome.classList.remove('hidden');
    if (panel) panel.classList.remove('has-conversation');
  }

  function hideWelcomeState() {
    conversationStarted = true;
    var welcome = el('chat-welcome-state');
    var panel = el('chat-messages-panel');
    if (welcome) welcome.classList.add('hidden');
    if (panel) panel.classList.add('has-conversation');
  }

  function pushNotification(text) {
    if (runtimeNotifications.indexOf(text) === -1) {
      runtimeNotifications.unshift(text);
    }
    renderNotifications(runtimeNotifications);
  }

  function renderCrossSystemDiagnostics(diag) {
    var list = el('cross-system-diagnostics-list');
    if (!list || !diag) return;
    var rows = [
      { label: 'Relationship Count', ok: diag.relationshipCount > 0, value: String(diag.relationshipCount) },
      { label: 'Dependency Count', ok: diag.dependencyCount > 0, value: String(diag.dependencyCount) },
      { label: 'Impact Analysis Available', ok: diag.impactAnalysisAvailable === true, value: diag.impactAnalysisAvailable ? 'YES' : 'NO' },
    ];
    list.innerHTML = '';
    for (var i = 0; i < rows.length; i += 1) {
      var li = document.createElement('li');
      li.className = rows[i].ok ? 'ok' : 'fail';
      li.textContent = rows[i].label + ': ' + rows[i].value;
      list.appendChild(li);
    }
    if (el('last-query-type')) {
      el('last-query-type').textContent = diag.lastQueryType || 'None';
    }
    if (el('last-analyzer-used')) {
      el('last-analyzer-used').textContent = diag.lastAnalyzerUsed || 'None';
    }
    if (el('last-routing-result')) {
      el('last-routing-result').textContent = diag.lastRoutingResult || 'None';
    }
    if (el('last-relationship-query')) {
      el('last-relationship-query').textContent = diag.lastRelationshipQuery || 'None';
    }
    if (el('last-dependency-query')) {
      el('last-dependency-query').textContent = diag.lastDependencyQuery || 'None';
    }
    if (el('last-impact-query')) {
      el('last-impact-query').textContent = diag.lastImpactQuery || 'None';
    }
  }

  function renderRuntimeDiagnostics() {
    var list = el('runtime-diagnostics-list');
    if (!list) return;
    var rows = [
      { label: 'Brain Connected', ok: runtimeDiagnostics.brainConnected },
      { label: 'Brain Endpoint Reachable', ok: runtimeDiagnostics.brainEndpointReachable },
      { label: 'Operator Feed Active', ok: runtimeDiagnostics.operatorFeedActive },
      { label: 'Chat Integration Active', ok: runtimeDiagnostics.chatIntegrationActive },
    ];
    list.innerHTML = '';
    for (var i = 0; i < rows.length; i += 1) {
      var li = document.createElement('li');
      li.className = rows[i].ok ? 'ok' : 'fail';
      li.textContent = rows[i].label + ': ' + (rows[i].ok ? 'YES' : 'NO');
      list.appendChild(li);
    }
    if (el('last-request-status')) el('last-request-status').textContent = runtimeDiagnostics.lastRequestStatus;
    if (el('last-error')) el('last-error').textContent = runtimeDiagnostics.lastError;
  }

  function setLastError(reason) {
    runtimeDiagnostics.lastError = reason || 'None';
    renderRuntimeDiagnostics();
  }

  function setLastRequestStatus(status) {
    runtimeDiagnostics.lastRequestStatus = status;
    renderRuntimeDiagnostics();
  }

  function appendChatMessage(text, role) {
    var history = el('chat-history');
    if (!history) return;
    var div = document.createElement('div');
    div.className = 'chat-message ' + role;
    div.textContent = text;
    history.appendChild(div);
    scrollChatToBottom();
  }

  function removeThinkingMessage() {
    var thinking = el('brain-thinking');
    if (thinking && thinking.parentNode) thinking.parentNode.removeChild(thinking);
  }

  function showThinking() {
    removeThinkingMessage();
    var history = el('chat-history');
    if (!history) return;
    var div = document.createElement('div');
    div.className = 'chat-message thinking';
    div.id = 'brain-thinking';
    div.textContent = 'Brain is analyzing…';
    history.appendChild(div);
    scrollChatToBottom();
  }

  function switchView(viewId, label) {
    var commandView = el('view-command-center');
    var founderView = el('view-founder-reality');
    var placeholderView = el('view-placeholder');
    var centerTitle = el('center-title');

    if (commandView) commandView.classList.add('hidden');
    if (founderView) founderView.classList.add('hidden');
    if (placeholderView) placeholderView.classList.add('hidden');

    var navItems = document.querySelectorAll('.nav-item');
    for (var i = 0; i < navItems.length; i += 1) {
      navItems[i].classList.remove('active');
    }

    if (viewId === 'command-center') {
      if (commandView) commandView.classList.remove('hidden');
      if (centerTitle) centerTitle.textContent = 'DevPulse V2 Command Center';
    } else if (viewId === 'founder-reality') {
      if (founderView) founderView.classList.remove('hidden');
      if (centerTitle) centerTitle.textContent = 'Founder Reality Surface';
    } else if (viewId === 'placeholder') {
      if (placeholderView) placeholderView.classList.remove('hidden');
      if (centerTitle) centerTitle.textContent = label || 'Navigation Placeholder';
      var pTitle = el('placeholder-title');
      var pMsg = el('placeholder-message');
      if (pTitle) pTitle.textContent = label || 'Navigation Placeholder';
      if (pMsg) {
        pMsg.textContent =
          (label || 'This item') + ' is a navigation placeholder. No functionality is connected yet.';
      }
    }

    var activeNav = document.querySelector('.nav-item[data-view="' + viewId + '"]');
    if (viewId === 'placeholder' && label) {
      activeNav = document.querySelector('.nav-item[data-label="' + label + '"]');
    }
    if (activeNav) activeNav.classList.add('active');
  }

  function mapEventToSection(eventType) {
    if (eventType === 'Classifying Request') return 'Planning';
    if (eventType === 'Checking Systems') return 'Execution';
    if (eventType === 'Loading Relationships') return 'Verification';
    if (eventType === 'Checking Roadmap') return 'Verification';
    if (eventType === 'Checking Dependencies') return 'Approvals';
    if (eventType === 'Performing Impact Analysis') return 'Approvals';
    if (eventType === 'Generating Response') return 'Learning';
    if (eventType === 'Response Ready') return 'Learning';
    return 'Planning';
  }

  function completedSectionsFromEvents(completedEventTypes) {
    var sections = [];
    for (var i = 0; i < completedEventTypes.length; i += 1) {
      var sec = mapEventToSection(completedEventTypes[i]);
      if (sections.indexOf(sec) === -1) sections.push(sec);
    }
    return sections;
  }

  function clearFeedStreamLog() {
    var log = el('feed-stream-log');
    if (log) log.innerHTML = '';
  }

  function appendFeedStreamEvent(eventType, active) {
    var log = el('feed-stream-log');
    if (!log) return;
    var div = document.createElement('div');
    div.className = 'feed-event' + (active ? ' active-event' : '');
    div.textContent = (active ? '▸ ' : '✓ ') + eventType;
    log.appendChild(div);
    scrollFeedToLatest();
  }

  function renderOperatorFeed(sections, activeEvent, completedEventTypes) {
    var container = el('feed-sections');
    if (!container) return;
    var completedSections = completedSectionsFromEvents(completedEventTypes || []);
    container.innerHTML = '';
    for (var i = 0; i < sections.length; i += 1) {
      var section = sections[i];
      var div = document.createElement('div');
      var isActive = activeEvent && section === mapEventToSection(activeEvent);
      var isCompleted = completedSections.indexOf(section) !== -1;
      var isReady = activeEvent === 'Response Ready' && section === 'Learning';
      var isImpact = activeEvent === 'Performing Impact Analysis' && isActive;
      div.className =
        'feed-section' +
        (isActive ? ' active-feed' : '') +
        (isCompleted && !isActive ? ' completed-feed' : '') +
        (isReady ? ' ready-feed' : '') +
        (isImpact ? ' active-feed' : '');
      var statusText = 'Waiting for pipeline';
      if (isActive) statusText = activeEvent;
      else if (isCompleted) {
        for (var j = completedEventTypes.length - 1; j >= 0; j -= 1) {
          if (mapEventToSection(completedEventTypes[j]) === section) {
            statusText = completedEventTypes[j];
            break;
          }
        }
      }
      div.innerHTML = '<h3>' + escapeHtml(section) + '</h3><p>' + escapeHtml(statusText) + '</p>';
      container.appendChild(div);
    }
    scrollFeedToLatest();
  }

  function publishFeedFailure(reason) {
    runtimeDiagnostics.operatorFeedActive = false;
    renderOperatorFeed(defaultFeedSections, null, []);
    appendFeedStreamEvent('Feed failure: ' + reason, true);
    pushNotification('Brain Request Failed');
    setLastError(reason);
    renderRuntimeDiagnostics();
  }

  function streamOperatorFeedEvents(events, onComplete) {
    if (!events || !events.length) {
      publishFeedFailure('Operator Feed events missing');
      if (onComplete) onComplete();
      return;
    }

    clearFeedStreamLog();
    runtimeDiagnostics.operatorFeedActive = true;
    pushNotification('Operator Feed Active');
    renderRuntimeDiagnostics();

    var index = 0;
    var completedEventTypes = [];

    function tick() {
      if (index >= events.length) {
        runtimeDiagnostics.operatorFeedActive = true;
        renderRuntimeDiagnostics();
        scrollFeedToLatest();
        if (onComplete) onComplete();
        return;
      }

      var event = events[index];
      completedEventTypes.push(event.eventType);
      renderOperatorFeed(defaultFeedSections, event.eventType, completedEventTypes.slice());
      appendFeedStreamEvent(event.eventType, true);

      if (index > 0) {
        var prevLog = el('feed-stream-log');
        if (prevLog && prevLog.children.length > 1) {
          prevLog.children[prevLog.children.length - 2].className = 'feed-event';
          prevLog.children[prevLog.children.length - 2].textContent = '✓ ' + events[index - 1].eventType;
        }
      }

      index += 1;
      setTimeout(tick, FEED_STAGE_DELAY_MS);
    }

    renderOperatorFeed(defaultFeedSections, events[0].eventType, []);
    tick();
  }

  function renderStatusBar(items) {
    var list = el('status-items');
    if (!list) return;
    list.innerHTML = '';
    for (var i = 0; i < items.length; i += 1) {
      var li = document.createElement('li');
      li.textContent = items[i];
      list.appendChild(li);
    }
  }

  function renderNotifications(notifications) {
    var list = el('notification-list');
    if (!list) return;
    list.innerHTML = '';
    for (var i = 0; i < notifications.length; i += 1) {
      var li = document.createElement('li');
      li.textContent = notifications[i];
      list.appendChild(li);
    }
  }

  function interpretBrainFailure(status, bodyText) {
    if (status === 405 && bodyText.indexOf('read-only') !== -1) {
      return 'Stale DevPulse server — stop old process on port 4321 and run npm run dev';
    }
    if (status === 405) return 'Brain API unavailable — POST rejected (405). Restart npm run dev.';
    if (status === 404) return 'Brain API unavailable — /api/brain/respond not found.';
    if (status === 400) return 'Brain response malformed — ' + bodyText.slice(0, 120);
    if (status >= 500) return 'Brain API server error — check npm run dev terminal.';
    return 'Brain API request failed — HTTP ' + status;
  }

  function checkBrainHealth() {
    return fetch('/api/brain/health', { method: 'GET', cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Health check HTTP ' + res.status);
        return res.json();
      })
      .then(function (payload) {
        var ok =
          payload &&
          payload.postAllowed === true &&
          payload.serverCapability === 'command-center-brain-v11.1a';
        runtimeDiagnostics.brainEndpointReachable = ok;
        runtimeDiagnostics.brainConnected = ok;
        if (ok) {
          pushNotification('Unified Command Center Brain Active');
          setLastError('None');
        } else {
          setLastError('Brain health payload missing expected capability');
        }
        renderRuntimeDiagnostics();
        return ok;
      })
      .catch(function () {
        runtimeDiagnostics.brainEndpointReachable = false;
        runtimeDiagnostics.brainConnected = false;
        setLastError('Brain health endpoint unreachable — stale server or npm run dev not running');
        renderRuntimeDiagnostics();
        return false;
      });
  }

  function renderStacks(stacks) {
    var list = el('completed-stacks');
    if (!list) return;
    list.innerHTML = '';
    for (var i = 0; i < stacks.length; i += 1) {
      var stack = stacks[i];
      var li = document.createElement('li');
      li.className = 'stack-item';
      li.innerHTML =
        '<span class="stack-phase">' + escapeHtml(stack.phase) + '</span>' +
        '<span class="stack-name">' + escapeHtml(stack.name) +
        '<span class="badge-complete">' + escapeHtml(stack.status) + '</span></span>' +
        '<span class="stack-note">' + escapeHtml(stack.note) + '</span>';
      list.appendChild(li);
    }
  }

  function renderValidators(validators) {
    var list = el('validator-list');
    if (!list) return;
    list.innerHTML = '';
    for (var i = 0; i < validators.length; i += 1) {
      var li = document.createElement('li');
      li.textContent = 'npm run ' + validators[i];
      list.appendChild(li);
    }
  }

  function renderList(id, items) {
    var list = el(id);
    if (!list) return;
    list.innerHTML = '';
    for (var i = 0; i < items.length; i += 1) {
      var li = document.createElement('li');
      li.textContent = items[i];
      list.appendChild(li);
    }
  }

  function renderWarnings(warnings) {
    var list = el('reality-warnings');
    if (!list) return;
    list.innerHTML = '';
    for (var i = 0; i < warnings.length; i += 1) {
      var li = document.createElement('li');
      li.textContent = warnings[i].message;
      list.appendChild(li);
    }
  }

  function renderChecklist(items) {
    var list = el('founder-checklist');
    if (!list) return;
    list.innerHTML = '';
    for (var i = 0; i < items.length; i += 1) {
      var item = items[i];
      var li = document.createElement('li');
      var q = document.createElement('span');
      q.textContent = item.question;
      var a = document.createElement('span');
      a.textContent = item.answer;
      a.className = item.answer === 'YES' ? 'answer-yes' : 'answer-not-yet';
      li.appendChild(q);
      li.appendChild(a);
      list.appendChild(li);
    }
  }

  function applyManifest(data) {
    manifestData = data;
    var shell = data.runtimeShell || {};

    if (el('page-title')) el('page-title').textContent = data.title;
    if (el('page-subtitle')) el('page-subtitle').textContent = 'Command Center';
    if (el('phase-badge')) el('phase-badge').textContent = 'Phase 11.2 — Cross-System Awareness';
    if (el('current-status')) el('current-status').textContent = data.currentStatus;
    if (el('experience-placeholder')) el('experience-placeholder').textContent = data.experienceLayerPlaceholder;
    if (el('trust-placeholder')) el('trust-placeholder').textContent = data.trustEnginePlaceholder;
    if (el('next-step')) el('next-step').textContent = data.nextRecommendedStep;
    if (el('confirmation-text')) {
      el('confirmation-text').textContent =
        'Founder Reality Surface — visibility only. Brain provides intelligence only.';
    }

    if (!conversationStarted) {
      showWelcomeState();
      var history = el('chat-history');
      if (history) history.innerHTML = '';
    }

    defaultFeedSections = shell.operatorFeedSections || defaultFeedSections;
    runtimeNotifications = ['Unified Command Center Brain Connected'];
    renderOperatorFeed(defaultFeedSections);
    renderStatusBar(shell.statusBarItems || []);
    renderNotifications(runtimeNotifications);
    renderStacks(data.completedStacks);
    renderValidators(data.validators);
    renderList('exists-list', data.existsVsNotYet.exists);
    renderList('not-yet-list', data.existsVsNotYet.notYet);
    renderWarnings(data.realityWarnings);
    renderChecklist(data.founderChecklist);
    renderRuntimeDiagnostics();
  }

  function askBrain(message) {
    showThinking();
    setLastRequestStatus('In progress');
    pushNotification('Brain Request Started');
    clearFeedStreamLog();
    renderOperatorFeed(defaultFeedSections, 'Classifying Request', []);
    appendFeedStreamEvent('Classifying Request', true);

    fetch('/api/brain/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message, timestamp: Date.now() }),
    })
      .then(function (res) {
        return res.text().then(function (bodyText) {
          if (!res.ok) throw new Error(interpretBrainFailure(res.status, bodyText));
          var result;
          try {
            result = JSON.parse(bodyText);
          } catch (parseErr) {
            throw new Error('Brain response malformed — invalid JSON from server');
          }
          if (!result.brainResponse) {
            throw new Error('Brain response malformed — brainResponse field missing');
          }
          return result;
        });
      })
      .then(function (result) {
        streamOperatorFeedEvents(result.operatorFeedEvents, function () {
          removeThinkingMessage();
          appendChatMessage(result.brainResponse, 'brain');
          setLastRequestStatus('Completed');
          pushNotification('Brain Request Completed');
          setLastError('None');
          renderRuntimeDiagnostics();
          if (result.crossSystemDiagnostics) {
            renderCrossSystemDiagnostics(result.crossSystemDiagnostics);
          }
        });
      })
      .catch(function (err) {
        removeThinkingMessage();
        var reason = err && err.message ? err.message : 'Brain API unavailable';
        publishFeedFailure(reason);
        appendChatMessage('Brain could not respond — ' + reason, 'system');
        setLastRequestStatus('Failed');
      });
  }

  function bindEvents() {
    var nav = el('sidebar-nav');
    if (nav) {
      nav.addEventListener('click', function (e) {
        var target = e.target;
        if (!target || !target.classList.contains('nav-item')) return;
        var view = target.getAttribute('data-view');
        var label = target.getAttribute('data-label');
        if (view === 'founder-reality') switchView('founder-reality');
        else if (view === 'command-center') switchView('command-center');
        else if (view === 'placeholder') switchView('placeholder', label);
      });
    }

    var form = el('chat-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = el('chat-input');
        if (!input) return;
        var text = input.value.trim();
        if (!text) return;
        if (!conversationStarted) hideWelcomeState();
        appendChatMessage(text, 'user');
        input.value = '';
        askBrain(text);
      });
    }

    var notifToggle = el('notif-toggle');
    var drawer = el('notification-drawer');
    if (notifToggle && drawer) {
      notifToggle.addEventListener('click', function () {
        var open = drawer.hasAttribute('hidden');
        if (open) {
          drawer.removeAttribute('hidden');
          notifToggle.setAttribute('aria-expanded', 'true');
        } else {
          drawer.setAttribute('hidden', '');
          notifToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  bindEvents();
  switchView('command-center');
  showWelcomeState();
  renderRuntimeDiagnostics();
  renderCrossSystemDiagnostics({
    relationshipCount: 0,
    dependencyCount: 0,
    impactAnalysisAvailable: true,
    lastQueryType: null,
    lastAnalyzerUsed: null,
    lastRoutingResult: null,
    lastRelationshipQuery: null,
    lastDependencyQuery: null,
    lastImpactQuery: null,
  });

  fetch('/api/founder-reality.json')
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load manifest');
      return res.json();
    })
    .then(function (data) {
      applyManifest(data);
      return checkBrainHealth();
    })
    .catch(function () {
      if (!conversationStarted) hideWelcomeState();
      appendChatMessage('Could not load manifest — restart the DevPulse server.', 'system');
      if (el('current-status')) {
        el('current-status').textContent = 'Manifest load failed. Foundation architecture exists.';
      }
      setLastError('Manifest load failed');
    });
})();
