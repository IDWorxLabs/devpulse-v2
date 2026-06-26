/**
 * Workspace Navigation V1 — client-side back/forward history.
 */
(function (global) {
  'use strict';

  function entriesEqual(a, b) {
    return (
      a.surfaceId === b.surfaceId &&
      a.projectId === b.projectId &&
      JSON.stringify(a.params || {}) === JSON.stringify(b.params || {})
    );
  }

  function createState() {
    return { entries: [], index: -1 };
  }

  function push(state, entry) {
    var current = state.entries[state.index] || null;
    if (current && entriesEqual(current, entry)) return state;
    var trimmed = state.entries.slice(0, state.index + 1);
    trimmed.push(entry);
    return { entries: trimmed, index: trimmed.length - 1 };
  }

  function back(state) {
    if (state.index <= 0) return { state: state, entry: null };
    var nextIndex = state.index - 1;
    return { state: { entries: state.entries, index: nextIndex }, entry: state.entries[nextIndex] || null };
  }

  function forward(state) {
    if (state.index >= state.entries.length - 1) return { state: state, entry: null };
    var nextIndex = state.index + 1;
    return { state: { entries: state.entries, index: nextIndex }, entry: state.entries[nextIndex] || null };
  }

  function snapshot(state, surfaceTitles, projectNameResolver) {
    var current = state.entries[state.index] || null;
    var surfaceLabel = current ? surfaceTitles[current.surfaceId] || current.label : 'AiDevEngine';
    var projectName =
      current && current.projectId && projectNameResolver ? projectNameResolver(current.projectId) : null;
    return {
      canGoBack: state.index > 0,
      canGoForward: state.index < state.entries.length - 1 && state.entries.length > 0,
      current: current,
      breadcrumb: projectName ? surfaceLabel + ' / ' + projectName : surfaceLabel,
    };
  }

  var controller = {
    state: createState(),
    push: function (entry) {
      controller.state = push(controller.state, entry);
      return controller.state;
    },
    back: function () {
      var result = back(controller.state);
      controller.state = result.state;
      return result.entry;
    },
    forward: function () {
      var result = forward(controller.state);
      controller.state = result.state;
      return result.entry;
    },
    snapshot: function (surfaceTitles, projectNameResolver) {
      return snapshot(controller.state, surfaceTitles, projectNameResolver);
    },
    reset: function () {
      controller.state = createState();
    },
  };

  global.WorkspaceNavigation = controller;
})(window);
