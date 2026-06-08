/**
 * DevPulse V2 Command Center Runtime Shell — client script.
 * UI shell only. Local chat append only. No intelligence, execution, or persistence.
 */

(function commandCenterShell() {
  'use strict';

  var manifestData = null;

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

  function appendChatMessage(text, role) {
    var history = el('chat-history');
    if (!history) return;
    var div = document.createElement('div');
    div.className = 'chat-message ' + role;
    div.textContent = text;
    history.appendChild(div);
    history.scrollTop = history.scrollHeight;
  }

  function initWelcomeMessages(messages) {
    var history = el('chat-history');
    if (!history) return;
    history.innerHTML = '';
    for (var i = 0; i < messages.length; i += 1) {
      appendChatMessage(messages[i], 'system');
    }
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

  function renderOperatorFeed(sections) {
    var container = el('feed-sections');
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < sections.length; i += 1) {
      var section = sections[i];
      var div = document.createElement('div');
      div.className = 'feed-section';
      div.innerHTML =
        '<h3>' + escapeHtml(section) + '</h3>' +
        '<p>Waiting for future intelligence systems</p>';
      container.appendChild(div);
    }
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
    if (el('phase-badge')) {
      el('phase-badge').textContent = 'Phase ' + (shell.phase || data.phase) + ' — Runtime Shell';
    }
    if (el('current-status')) el('current-status').textContent = data.currentStatus;
    if (el('experience-placeholder')) el('experience-placeholder').textContent = data.experienceLayerPlaceholder;
    if (el('trust-placeholder')) el('trust-placeholder').textContent = data.trustEnginePlaceholder;
    if (el('next-step')) el('next-step').textContent = data.nextRecommendedStep;
    if (el('confirmation-text')) {
      el('confirmation-text').textContent =
        'Founder Reality Surface — visibility only. No execution, no validator auto-run.';
    }

    initWelcomeMessages(shell.welcomeMessages || [
      'DevPulse V2 Command Center Runtime Shell',
      'Phase 11 intelligence has not been connected yet.',
      'Use this surface to host future Command Center intelligence.',
    ]);

    renderOperatorFeed(shell.operatorFeedSections || ['Planning', 'Execution', 'Verification', 'Approvals', 'Learning']);
    renderStatusBar(shell.statusBarItems || []);
    renderNotifications(shell.staticNotifications || []);
    renderStacks(data.completedStacks);
    renderValidators(data.validators);
    renderList('exists-list', data.existsVsNotYet.exists);
    renderList('not-yet-list', data.existsVsNotYet.notYet);
    renderWarnings(data.realityWarnings);
    renderChecklist(data.founderChecklist);
  }

  function bindEvents() {
    var nav = el('sidebar-nav');
    if (nav) {
      nav.addEventListener('click', function (e) {
        var target = e.target;
        if (!target || !target.classList.contains('nav-item')) return;
        var view = target.getAttribute('data-view');
        var label = target.getAttribute('data-label');
        if (view === 'founder-reality') {
          switchView('founder-reality');
        } else if (view === 'command-center') {
          switchView('command-center');
        } else if (view === 'placeholder') {
          switchView('placeholder', label);
        }
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
        appendChatMessage(text, 'user');
        input.value = '';
        /* No backend call — local shell only. No AI response. No persistence. */
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

  fetch('/api/founder-reality.json')
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load manifest');
      return res.json();
    })
    .then(applyManifest)
    .catch(function () {
      appendChatMessage('Could not load manifest — restart the DevPulse server.', 'system');
      if (el('current-status')) {
        el('current-status').textContent = 'Manifest load failed. Foundation architecture exists.';
      }
    });
})();
