/**
 * Project Workspace Explorer V1 — client-side read-only IDE explorer.
 */
(function (global) {
  'use strict';

  var STATE_KEY = 'aidevengine.project-workspace-explorer-state.v1';
  var VIRTUAL_ROW_HEIGHT = 26;
  var VIRTUAL_OVERSCAN = 12;
  var LOADING_TIMEOUT_MS = 15000;

  var explorer = {
    activeProjectId: null,
    activeProjectName: null,
    listing: null,
    fileContent: null,
    fileMeta: null,
    searchResults: null,
    searchTimer: null,
    folderChildren: {},
    loadingFolders: {},
    loadToken: 0,
    lastDiagnostics: null,
  };

  function emitTrace(message, level) {
    if (global.emitProjectFilesTrace) {
      global.emitProjectFilesTrace(message, level || 'INFO');
    }
  }

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

  function loadStateStore() {
    try {
      var raw = global.localStorage.getItem(STATE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_e) {
      return {};
    }
  }

  function saveStateStore(store) {
    try {
      global.localStorage.setItem(STATE_KEY, JSON.stringify(store));
    } catch (_e) {
      /* ignore */
    }
  }

  function getProjectState(projectId) {
    var store = loadStateStore();
    if (!store[projectId]) {
      store[projectId] = {
        projectId: projectId,
        expandedFolders: [],
        scrollPosition: 0,
        openedFiles: [],
        selectedFile: null,
        searchQuery: '',
      };
    }
    return store[projectId];
  }

  function patchProjectState(projectId, patch) {
    var store = loadStateStore();
    var current = getProjectState(projectId);
    store[projectId] = Object.assign({}, current, patch, { projectId: projectId });
    saveStateStore(store);
    return store[projectId];
  }

  function apiUrl(projectId, kind, query) {
    var base = '/api/projects/' + encodeURIComponent(projectId) + '/' + kind;
    return query ? base + '?' + query : base;
  }

  function fetchWorkspaceFolder(projectId, folder) {
    var q = folder ? 'folder=' + encodeURIComponent(folder) : '';
    var endpoint = apiUrl(projectId, 'workspace', q);
    return fetch(endpoint, { cache: 'no-store' })
      .then(function (res) {
        return res.json().then(function (json) {
          json._httpStatus = res.status;
          json._endpoint = endpoint;
          return json;
        });
      })
      .catch(function (err) {
        return {
          ok: false,
          reason: 'WORKSPACE_LOAD_ERROR',
          message: err && err.message ? err.message : 'Network error while loading workspace.',
          endpointPath: endpoint,
          _endpoint: endpoint,
          _networkError: true,
        };
      });
  }

  function fetchWorkspaceFile(projectId, path) {
    return fetch(apiUrl(projectId, 'file', 'path=' + encodeURIComponent(path)), { cache: 'no-store' }).then(
      function (res) {
        return res.json();
      },
    );
  }

  function fetchWorkspaceSearch(projectId, query) {
    return fetch(apiUrl(projectId, 'workspace', 'q=' + encodeURIComponent(query)), { cache: 'no-store' }).then(
      function (res) {
        return res.json();
      },
    );
  }

  function iconGlyph(icon) {
    var map = {
      folder: '▸',
      source: '⌁',
      feature: '◆',
      component: '◇',
      service: '⚙',
      route: '↪',
      style: '◐',
      metadata: '◎',
      manifest: '☰',
      contract: '☷',
      audit: '✓',
      score: '★',
      history: '↺',
      package: '📦',
      readme: '📄',
      typescript: 'TS',
      javascript: 'JS',
      react: '⚛',
      json: '{}',
      html: '◇',
      markdown: 'M↓',
      file: '·',
      workspace: '⌂',
    };
    return map[icon] || map.file;
  }

  function flattenTree(projectId) {
    var state = getProjectState(projectId);
    var rows = [];
    var expanded = state.expandedFolders || [];

    function walk(folderPath, depth) {
      var cacheKey = folderPath || '/';
      var listing = explorer.folderChildren[cacheKey];
      if (!listing) return;

      var folders = listing.folders || [];
      var files = listing.files || [];
      for (var i = 0; i < folders.length; i += 1) {
        var folder = folders[i];
        var isExpanded = expanded.indexOf(folder.relativePath) >= 0;
        rows.push({
          type: 'folder',
          depth: depth,
          entry: folder,
          expanded: isExpanded,
        });
        if (isExpanded) walk(folder.relativePath, depth + 1);
      }
      for (var j = 0; j < files.length; j += 1) {
        rows.push({ type: 'file', depth: depth, entry: files[j] });
      }
    }

    walk('', 0);
    return rows;
  }

  function renderLoadingPanel(projectId, projectName) {
    return (
      '<section class="pwe-state-panel pwe-loading-panel card" data-state="loading">' +
      '<h2>Project Files</h2>' +
      '<p class="pwe-state-lead"><strong>Loading project workspace…</strong></p>' +
      '<p class="hint">Project: ' +
      escapeHtml(projectName || projectId) +
      '</p>' +
      '<p class="hint">Fetching <code>/api/projects/' +
      escapeHtml(projectId) +
      '/workspace</code></p>' +
      '</section>'
    );
  }

  function renderNotPromotedPanel(payload, projectId, projectName) {
    var expectedSource =
      payload.expectedSourceRoot || '.aidev-projects/' + projectId + '/source';
    return (
      '<section class="pwe-state-panel card" data-state="not-promoted">' +
      '<h2>Project Files</h2>' +
      '<p class="pwe-state-lead">This project does not have generated source files yet.</p>' +
      '<dl class="pwe-info-grid">' +
      '<div><dt>Project Name</dt><dd>' +
      escapeHtml(payload.projectName || projectName || projectId) +
      '</dd></div>' +
      '<div><dt>Project Id</dt><dd><code>' +
      escapeHtml(projectId) +
      '</code></dd></div>' +
      '<div><dt>Expected Workspace</dt><dd><code>' +
      escapeHtml(payload.expectedWorkspacePath || '.aidev-projects/' + projectId) +
      '</code></dd></div>' +
      '<div><dt>Expected Source Root</dt><dd><code>' +
      escapeHtml(expectedSource) +
      '</code></dd></div>' +
      '</dl>' +
      '<p class="hint">Run a build first. After a successful build, AiDevEngine will promote the generated app into a persistent project workspace.</p>' +
      '<div class="pwe-state-actions">' +
      '<button type="button" class="btn-primary" data-pwe-action="build-project">Build project</button>' +
      '<button type="button" class="btn-secondary" data-pwe-action="go-command-center">Go to Command Center</button>' +
      '</div>' +
      '</section>'
    );
  }

  function renderErrorPanel(payload, projectId, projectName) {
    explorer.lastDiagnostics = payload;
    return (
      '<section class="pwe-state-panel card" data-state="error">' +
      '<h2>Project workspace failed to load</h2>' +
      '<p class="pwe-state-lead">' +
      escapeHtml(payload.message || 'Unknown workspace error.') +
      '</p>' +
      '<dl class="pwe-info-grid">' +
      '<div><dt>Project</dt><dd>' +
      escapeHtml(projectName || projectId) +
      '</dd></div>' +
      '<div><dt>Endpoint</dt><dd><code>' +
      escapeHtml(payload.endpointPath || payload._endpoint || '/api/projects/' + projectId + '/workspace') +
      '</code></dd></div>' +
      '<div><dt>Error</dt><dd>' +
      escapeHtml(payload.reason || 'WORKSPACE_LOAD_ERROR') +
      '</dd></div>' +
      '</dl>' +
      '<div class="pwe-state-actions">' +
      '<button type="button" class="btn-primary" data-pwe-action="retry">Retry</button>' +
      '<button type="button" class="btn-secondary" data-pwe-action="copy-diagnostics">Copy diagnostics</button>' +
      '</div>' +
      '</section>'
    );
  }

  function renderEmptyPanel(payload, projectId, projectName) {
    return (
      '<section class="pwe-state-panel card" data-state="empty">' +
      '<h2>Workspace exists but no files were found</h2>' +
      '<p class="hint">Project: ' +
      escapeHtml(projectName || payload.projectName || projectId) +
      '</p>' +
      '<p><strong>Source root:</strong> <code>' +
      escapeHtml(payload.sourceRoot || payload.expectedSourceRoot || '') +
      '</code></p>' +
      '<div class="pwe-state-actions">' +
      '<button type="button" class="btn-primary" data-pwe-action="retry">Refresh workspace</button>' +
      '</div>' +
      '</section>'
    );
  }

  function renderTimeoutPanel(projectId, projectName) {
    return (
      '<section class="pwe-state-panel card" data-state="timeout">' +
      '<h2>Project workspace is taking longer than expected</h2>' +
      '<p class="hint">Project: ' +
      escapeHtml(projectName || projectId) +
      '</p>' +
      '<div class="pwe-state-actions">' +
      '<button type="button" class="btn-primary" data-pwe-action="retry">Retry</button>' +
      '<button type="button" class="btn-secondary" data-pwe-action="continue-wait">Continue waiting</button>' +
      '</div>' +
      '</section>'
    );
  }

  function wireStatePanelActions(projectId, projectName) {
    var container = el('project-files-surface');
    if (!container || container.getAttribute('data-pwe-state-bound') === 'true') return;
    container.setAttribute('data-pwe-state-bound', 'true');
    container.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('[data-pwe-action]') : null;
      if (!btn) return;
      var action = btn.getAttribute('data-pwe-action');
      if (action === 'retry' || action === 'continue-wait') {
        openProjectWorkspace(projectId, projectName);
        return;
      }
      if (action === 'copy-diagnostics' && explorer.lastDiagnostics) {
        var text = JSON.stringify(explorer.lastDiagnostics, null, 2);
        if (global.navigator && global.navigator.clipboard) {
          global.navigator.clipboard.writeText(text).catch(function () {});
        }
        return;
      }
      if (action === 'build-project' && global.openProjectBuildFromFiles) {
        global.openProjectBuildFromFiles(projectId);
        return;
      }
      if (action === 'go-command-center' && global.switchView) {
        global.switchView('command-center');
      }
    });
  }

  function ensureRootLoaded(projectId) {
    if (explorer.folderChildren['/'] && explorer.listing && explorer.listing.ok) {
      return Promise.resolve({ listing: explorer.listing, state: 'available' });
    }
    return fetchWorkspaceFolder(projectId, '').then(function (json) {
      explorer.listing = json;
      if (json.ok) {
        explorer.folderChildren['/'] = { files: json.files || [], folders: json.folders || [] };
        return { listing: json, state: 'available' };
      }
      if (json.reason === 'WORKSPACE_NOT_PROMOTED' || json.reason === 'SOURCE_ROOT_MISSING') {
        return { listing: json, state: 'not-promoted' };
      }
      if (json.reason === 'WORKSPACE_EMPTY') {
        explorer.folderChildren['/'] = { files: [], folders: [] };
        return { listing: json, state: 'empty' };
      }
      if (json._networkError || json.reason === 'WORKSPACE_LOAD_ERROR') {
        return { listing: json, state: 'error' };
      }
      if (json.reason === 'PROJECT_NOT_FOUND') {
        return { listing: json, state: 'error' };
      }
      return { listing: json, state: 'error' };
    });
  }

  function loadFolderChildren(projectId, folderPath) {
    var key = folderPath || '/';
    if (explorer.folderChildren[key]) return Promise.resolve(explorer.folderChildren[key]);
    if (explorer.loadingFolders[key]) return explorer.loadingFolders[key];
    explorer.loadingFolders[key] = fetchWorkspaceFolder(projectId, folderPath).then(function (json) {
      delete explorer.loadingFolders[key];
      if (!json.ok) throw new Error('Could not load folder');
      explorer.folderChildren[key] = { files: json.files, folders: json.folders };
      return explorer.folderChildren[key];
    });
    return explorer.loadingFolders[key];
  }

  function renderProjectInfo(info) {
    if (!info) return '<p class="hint">Project metadata loading…</p>';
    return (
      '<dl class="pwe-info-grid">' +
      '<div><dt>Project Name</dt><dd>' +
      escapeHtml(info.projectName) +
      '</dd></div>' +
      '<div><dt>Project Id</dt><dd><code>' +
      escapeHtml(info.projectId) +
      '</code></dd></div>' +
      '<div><dt>Workspace Path</dt><dd><code>' +
      escapeHtml(info.workspacePath) +
      '</code></dd></div>' +
      '<div><dt>Source Root</dt><dd><code>' +
      escapeHtml(info.sourceRoot) +
      '</code></dd></div>' +
      '<div><dt>Feature Count</dt><dd>' +
      String(info.featureCount) +
      '</dd></div>' +
      '<div><dt>Generated Files</dt><dd>' +
      String(info.generatedFiles) +
      '</dd></div>' +
      '<div><dt>Last Build</dt><dd>' +
      escapeHtml(info.lastBuild || '—') +
      '</dd></div>' +
      '<div><dt>Build Profile</dt><dd>' +
      escapeHtml(info.currentBuildProfile || '—') +
      '</dd></div>' +
      '<div><dt>Materialization Quality</dt><dd>' +
      escapeHtml(info.materializationQuality || '—') +
      (info.materializationQualityScore != null ? ' (' + info.materializationQualityScore + ')' : '') +
      '</dd></div>' +
      '<div><dt>Workspace Reality</dt><dd>' +
      escapeHtml(info.workspaceReality || '—') +
      '</dd></div>' +
      '<div><dt>Universal Production Proof</dt><dd>' +
      escapeHtml(info.universalProductionProof || '—') +
      '</dd></div>' +
      '</dl>'
    );
  }

  function renderMetadataShortcuts(shortcuts) {
    if (!shortcuts || !shortcuts.length) return '';
    var html = '<div class="pwe-metadata-shortcuts"><p><strong>Generated Metadata</strong></p><ul>';
    for (var i = 0; i < shortcuts.length; i += 1) {
      var item = shortcuts[i];
      html +=
        '<li><button type="button" class="pwe-meta-link" data-file-path="' +
        escapeHtml(item.relativePath) +
        '">' +
        escapeHtml(item.label) +
        '</button></li>';
    }
    html += '</ul></div>';
    return html;
  }

  function highlightCode(code, language) {
    var escaped = escapeHtml(code);
    if (language === 'json') {
      return escaped.replace(
        /("(?:\\.|[^"\\])*")\s*:/g,
        '<span class="pwe-hl-key">$1</span>:',
      );
    }
    if (language === 'typescript' || language === 'tsx' || language === 'javascript' || language === 'jsx') {
      return escaped
        .replace(/\b(const|let|var|function|export|import|from|return|if|else|class|interface|type)\b/g, '<span class="pwe-hl-kw">$1</span>')
        .replace(/('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g, '<span class="pwe-hl-str">$1</span>');
    }
    return escaped;
  }

  function renderFileViewer() {
    if (!explorer.fileContent) {
      return '<div class="pwe-viewer-empty"><p>Select a file to view its contents.</p></div>';
    }
    var lines = explorer.fileContent.split('\n');
    var lineHtml = '';
    for (var i = 0; i < lines.length; i += 1) {
      lineHtml +=
        '<div class="pwe-line"><span class="pwe-ln">' +
        String(i + 1) +
        '</span><span class="pwe-lc">' +
        highlightCode(lines[i], explorer.fileMeta ? explorer.fileMeta.language : 'text') +
        '</span></div>';
    }
    var truncated = explorer.fileMeta && explorer.fileMeta.truncated;
    return (
      '<div class="pwe-viewer-toolbar">' +
      '<code class="pwe-viewer-path">' +
      escapeHtml(explorer.fileMeta ? explorer.fileMeta.relativePath : '') +
      '</code>' +
      '<span class="pwe-viewer-meta">' +
      escapeHtml(explorer.fileMeta ? explorer.fileMeta.language : '') +
      ' · ' +
      (explorer.fileMeta ? explorer.fileMeta.size : 0) +
      ' bytes · modified ' +
      escapeHtml(explorer.fileMeta ? explorer.fileMeta.modifiedAt : '') +
      '</span>' +
      '<button type="button" class="btn-secondary pwe-copy-btn" id="pwe-copy-file">Copy</button>' +
      (truncated ? '<span class="badge">Truncated preview</span>' : '') +
      '</div>' +
      '<div class="pwe-viewer-body" id="pwe-viewer-body">' +
      lineHtml +
      '</div>'
    );
  }

  function renderTreeRows(projectId) {
    var rows = flattenTree(projectId);
    var state = getProjectState(projectId);
    var scrollTop = state.scrollPosition || 0;
    var viewport = el('pwe-tree-viewport');
    var viewportHeight = viewport ? viewport.clientHeight || 480 : 480;
    var start = Math.max(0, Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN);
    var visibleCount = Math.ceil(viewportHeight / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN * 2;
    var end = Math.min(rows.length, start + visibleCount);

    var html =
      '<div class="pwe-tree-spacer" style="height:' + rows.length * VIRTUAL_ROW_HEIGHT + 'px"></div>';
    html += '<div class="pwe-tree-window" style="transform:translateY(' + start * VIRTUAL_ROW_HEIGHT + 'px)">';

    for (var i = start; i < end; i += 1) {
      var row = rows[i];
      var pad = 12 + row.depth * 14;
      if (row.type === 'folder') {
        var folder = row.entry;
        html +=
          '<button type="button" class="pwe-tree-row pwe-tree-folder' +
          (row.expanded ? ' is-expanded' : '') +
          '" data-folder-path="' +
          escapeHtml(folder.relativePath) +
          '" style="padding-left:' +
          pad +
          'px">' +
          '<span class="pwe-tree-chevron">' +
          (row.expanded ? '▼' : '▶') +
          '</span>' +
          '<span class="pwe-tree-icon">' +
          iconGlyph(folder.icon) +
          '</span>' +
          '<span class="pwe-tree-label">' +
          escapeHtml(folder.name) +
          '</span>' +
          '<span class="pwe-tree-count">' +
          String(folder.childFileCount + folder.childFolderCount) +
          '</span>' +
          '</button>';
      } else {
        var file = row.entry;
        var selected = state.selectedFile === file.relativePath ? ' is-selected' : '';
        html +=
          '<button type="button" class="pwe-tree-row pwe-tree-file' +
          selected +
          '" data-file-path="' +
          escapeHtml(file.relativePath) +
          '" style="padding-left:' +
          pad +
          'px">' +
          '<span class="pwe-tree-chevron pwe-tree-chevron-empty"></span>' +
          '<span class="pwe-tree-icon">' +
          iconGlyph(file.icon) +
          '</span>' +
          '<span class="pwe-tree-label">' +
          escapeHtml(file.name) +
          '</span>' +
          '</button>';
      }
    }
    html += '</div>';
    return { html: html, rowCount: rows.length };
  }

  function renderExplorerShell(projectId, projectName) {
    var listing = explorer.listing;
    var info = listing && listing.projectInfo ? listing.projectInfo : null;
  var shortcuts = listing && listing.metadataShortcuts ? listing.metadataShortcuts : [];
    return (
      '<div class="pwe-shell" data-project-id="' +
      escapeHtml(projectId) +
      '">' +
      '<header class="pwe-header card">' +
      '<div class="pwe-header-top">' +
      '<div><p class="pwe-kicker">Project Workspace Explorer</p>' +
      '<h2>' +
      escapeHtml(projectName || (info && info.projectName) || projectId) +
      '</h2></div>' +
      '<div class="pwe-workspace-path"><strong>Workspace</strong><br><code>' +
      escapeHtml((listing && listing.workspacePath) || '.aidev-projects/' + projectId) +
      '</code></div>' +
      '</div>' +
      renderProjectInfo(info) +
      renderMetadataShortcuts(shortcuts) +
      '</header>' +
      '<div class="pwe-main">' +
      '<aside class="pwe-explorer card">' +
      '<div class="pwe-explorer-head">' +
      '<h3>Explorer</h3>' +
      '<input type="search" class="pwe-search" id="pwe-search" placeholder="Search files, folders, symbols…" value="' +
      escapeHtml(getProjectState(projectId).searchQuery || '') +
      '" />' +
      '</div>' +
      '<div class="pwe-search-results" id="pwe-search-results"></div>' +
      '<div class="pwe-tree-viewport" id="pwe-tree-viewport"></div>' +
      '</aside>' +
      '<section class="pwe-viewer card">' +
      renderFileViewer() +
      '</section>' +
      '</div>' +
      '</div>'
    );
  }

  function paintTree(projectId) {
    var viewport = el('pwe-tree-viewport');
    if (!viewport) return;
    var rendered = renderTreeRows(projectId);
    viewport.innerHTML = rendered.html;
    viewport.scrollTop = getProjectState(projectId).scrollPosition || 0;
  }

  function openFile(projectId, path) {
    return fetchWorkspaceFile(projectId, path).then(function (json) {
      if (!json.ok) throw new Error('Could not read file');
      explorer.fileContent = json.contents;
      explorer.fileMeta = json;
      var state = getProjectState(projectId);
      var opened = state.openedFiles ? state.openedFiles.slice() : [];
      if (opened.indexOf(path) < 0) opened.push(path);
      patchProjectState(projectId, { selectedFile: path, openedFiles: opened });
      var viewer = document.querySelector('.pwe-viewer');
      if (viewer) viewer.innerHTML = renderFileViewer();
      wireViewerActions();
    });
  }

  function wireViewerActions() {
    var copyBtn = el('pwe-copy-btn');
    if (!copyBtn || copyBtn.getAttribute('data-bound') === 'true') return;
    copyBtn.setAttribute('data-bound', 'true');
    copyBtn.addEventListener('click', function () {
      if (!explorer.fileContent) return;
      if (global.navigator && global.navigator.clipboard) {
        global.navigator.clipboard.writeText(explorer.fileContent).catch(function () {});
      }
    });
  }

  function renderSearchResults(projectId, results) {
    var container = el('pwe-search-results');
    if (!container) return;
    if (!results || !results.matches || !results.matches.length) {
      container.innerHTML = '';
      container.classList.remove('is-visible');
      return;
    }
    var html = '<ul class="pwe-search-list">';
    for (var i = 0; i < results.matches.length; i += 1) {
      var match = results.matches[i];
      html +=
        '<li><button type="button" class="pwe-search-hit" data-file-path="' +
        escapeHtml(match.relativePath) +
        '">' +
        '<span class="pwe-search-type">' +
        escapeHtml(match.matchType) +
        '</span> ' +
        escapeHtml(match.relativePath) +
        (match.preview ? '<span class="pwe-search-preview">' + escapeHtml(match.preview) + '</span>' : '') +
        '</button></li>';
    }
    html += '</ul>';
    container.innerHTML = html;
    container.classList.add('is-visible');
  }

  function wireExplorerEvents(projectId) {
    var shell = document.querySelector('.pwe-shell');
    if (!shell || shell.getAttribute('data-bound') === 'true') return;
    shell.setAttribute('data-bound', 'true');

    var viewport = el('pwe-tree-viewport');
    if (viewport) {
      viewport.addEventListener('scroll', function () {
        patchProjectState(projectId, { scrollPosition: viewport.scrollTop });
      });
      viewport.addEventListener('click', function (e) {
        var folderBtn = e.target && e.target.closest ? e.target.closest('[data-folder-path]') : null;
        if (folderBtn && folderBtn.classList.contains('pwe-tree-folder')) {
          var folderPath = folderBtn.getAttribute('data-folder-path') || '';
          var state = getProjectState(projectId);
          var expanded = (state.expandedFolders || []).slice();
          var idx = expanded.indexOf(folderPath);
          if (idx >= 0) {
            expanded.splice(idx, 1);
          } else {
            expanded.push(folderPath);
            loadFolderChildren(projectId, folderPath).then(function () {
              paintTree(projectId);
            });
          }
          patchProjectState(projectId, { expandedFolders: expanded });
          paintTree(projectId);
          return;
        }
        var fileBtn = e.target && e.target.closest ? e.target.closest('[data-file-path]') : null;
        if (fileBtn && fileBtn.classList.contains('pwe-tree-file')) {
          openFile(projectId, fileBtn.getAttribute('data-file-path') || '').catch(function () {});
        }
      });
    }

    var searchInput = el('pwe-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var query = searchInput.value.trim();
        patchProjectState(projectId, { searchQuery: query });
        if (explorer.searchTimer) clearTimeout(explorer.searchTimer);
        if (!query) {
          renderSearchResults(projectId, null);
          return;
        }
        explorer.searchTimer = setTimeout(function () {
          fetchWorkspaceSearch(projectId, query).then(function (json) {
            explorer.searchResults = json;
            renderSearchResults(projectId, json);
          });
        }, 180);
      });
    }

    shell.addEventListener('click', function (e) {
      var metaBtn = e.target && e.target.closest ? e.target.closest('.pwe-meta-link') : null;
      if (metaBtn) {
        openFile(projectId, metaBtn.getAttribute('data-file-path') || '').catch(function () {});
        return;
      }
      var searchHit = e.target && e.target.closest ? e.target.closest('.pwe-search-hit') : null;
      if (searchHit) {
        openFile(projectId, searchHit.getAttribute('data-file-path') || '').catch(function () {});
      }
    });
  }

  function resetExplorerData() {
    explorer.listing = null;
    explorer.fileContent = null;
    explorer.fileMeta = null;
    explorer.searchResults = null;
    explorer.folderChildren = {};
    explorer.loadingFolders = {};
  }

  function openProjectWorkspace(projectId, projectName) {
    if (!projectId) {
      var containerMissing = el('project-files-surface');
      if (containerMissing) {
        containerMissing.innerHTML =
          '<section class="pwe-state-panel card"><h2>Project Files</h2><p class="pwe-state-lead">Select a project from Projects to browse generated source files.</p></section>';
      }
      return Promise.resolve();
    }

    explorer.activeProjectId = projectId;
    explorer.activeProjectName = projectName || projectId;
    resetExplorerData();
    explorer.activeProjectId = projectId;
    explorer.activeProjectName = projectName || projectId;

    var container = el('project-files-surface');
    if (!container) return Promise.resolve();

    var loadToken = ++explorer.loadToken;
    container.removeAttribute('data-pwe-state-bound');
    container.removeAttribute('data-bound');
    container.innerHTML = renderLoadingPanel(projectId, projectName);
    emitTrace('Project files opened — ' + projectId);
    emitTrace('Workspace load started');

    var timedOut = false;
    var timeoutId = global.setTimeout(function () {
      if (loadToken !== explorer.loadToken) return;
      timedOut = true;
      container.innerHTML = renderTimeoutPanel(projectId, projectName);
      wireStatePanelActions(projectId, projectName);
      emitTrace('Workspace load timed out', 'WARN');
    }, LOADING_TIMEOUT_MS);

    return ensureRootLoaded(projectId)
      .then(function (result) {
        if (loadToken !== explorer.loadToken || timedOut) return null;

        if (result.state === 'not-promoted') {
          container.innerHTML = renderNotPromotedPanel(result.listing, projectId, projectName);
          wireStatePanelActions(projectId, projectName);
          emitTrace('Workspace unavailable — not promoted yet', 'WARN');
          emitTrace('Workspace empty state rendered');
          return null;
        }

        if (result.state === 'error') {
          container.innerHTML = renderErrorPanel(result.listing, projectId, projectName);
          wireStatePanelActions(projectId, projectName);
          emitTrace('Workspace load failed — ' + (result.listing.reason || 'error'), 'ERROR');
          emitTrace('Workspace empty state rendered');
          return null;
        }

        if (result.state === 'empty') {
          container.innerHTML = renderEmptyPanel(result.listing, projectId, projectName);
          wireStatePanelActions(projectId, projectName);
          emitTrace('Workspace empty — no files found', 'WARN');
          emitTrace('Workspace empty state rendered');
          return null;
        }

        emitTrace('Workspace available');
        var state = getProjectState(projectId);
        var expanded = state.expandedFolders || [];
        var loads = [];
        for (var i = 0; i < expanded.length; i += 1) {
          loads.push(loadFolderChildren(projectId, expanded[i]));
        }
        return Promise.all(loads).then(function () {
          return result;
        });
      })
      .then(function (result) {
        if (!result || loadToken !== explorer.loadToken || timedOut) return null;
        container.innerHTML = renderExplorerShell(projectId, projectName);
        paintTree(projectId);
        wireExplorerEvents(projectId);
        wireViewerActions();
        emitTrace('Workspace tree rendered');
        var state = getProjectState(projectId);
        if (state.selectedFile) {
          return openFile(projectId, state.selectedFile).catch(function () {});
        }
        return null;
      })
      .catch(function (err) {
        if (loadToken !== explorer.loadToken || timedOut) return;
        container.innerHTML = renderErrorPanel(
          {
            message: err && err.message ? err.message : 'Could not load project workspace.',
            reason: 'WORKSPACE_LOAD_ERROR',
            endpointPath: '/api/projects/' + projectId + '/workspace',
          },
          projectId,
          projectName,
        );
        wireStatePanelActions(projectId, projectName);
        emitTrace('Workspace tree render failed', 'ERROR');
        emitTrace('Workspace empty state rendered');
      })
      .finally(function () {
        global.clearTimeout(timeoutId);
      });
  }

  global.ProjectWorkspaceExplorer = {
    open: openProjectWorkspace,
    getActiveProjectId: function () {
      return explorer.activeProjectId;
    },
    refresh: function () {
      if (!explorer.activeProjectId) return Promise.resolve();
      var id = explorer.activeProjectId;
      var name = explorer.activeProjectName || id;
      resetExplorerData();
      return openProjectWorkspace(id, name);
    },
  };
})(window);
