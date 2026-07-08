/**
 * Command Center Clean Startup V1 — browser bridge.
 */
(function commandCenterCleanStartup(global) {
  'use strict';

  var USER_SELECTED_PROJECT_SESSION_KEY = 'aidevengine.user-selected-project.v1';
  var RESUME_SESSION_REQUESTED_SESSION_KEY = 'aidevengine.resume-session-requested.v1';
  var FRESH_LOAD_SESSION_KEY = 'aidevengine.fresh-load-session.v1';

  function readSession(key) {
    try {
      return global.sessionStorage ? global.sessionStorage.getItem(key) : null;
    } catch (err) {
      return null;
    }
  }

  function writeSession(key, value) {
    try {
      if (!global.sessionStorage) return;
      if (value == null || value === '') global.sessionStorage.removeItem(key);
      else global.sessionStorage.setItem(key, value);
    } catch (err) {
      /* ignore */
    }
  }

  function readSessionFlags() {
    return {
      userExplicitlySelectedProjectId: readSession(USER_SELECTED_PROJECT_SESSION_KEY),
      resumeSessionRequested: readSession(RESUME_SESSION_REQUESTED_SESSION_KEY) === '1',
      freshLoadSession: readSession(FRESH_LOAD_SESSION_KEY) === '1',
    };
  }

  function markFreshLoadSession() {
    writeSession(FRESH_LOAD_SESSION_KEY, '1');
    writeSession(RESUME_SESSION_REQUESTED_SESSION_KEY, null);
  }

  function markUserSelectedProject(projectId) {
    writeSession(USER_SELECTED_PROJECT_SESSION_KEY, projectId || null);
    writeSession(FRESH_LOAD_SESSION_KEY, null);
  }

  function markResumeSessionRequested() {
    writeSession(RESUME_SESSION_REQUESTED_SESSION_KEY, '1');
    writeSession(FRESH_LOAD_SESSION_KEY, null);
  }

  function clearResumeSessionFlags() {
    writeSession(RESUME_SESSION_REQUESTED_SESSION_KEY, null);
    writeSession(FRESH_LOAD_SESSION_KEY, null);
  }

  function resolveStartupActiveProjectId(input) {
    input = input || {};
    var allowed = {};
    var ids = input.registryProjectIds || [];
    for (var i = 0; i < ids.length; i += 1) allowed[ids[i]] = true;
    if (input.resumeSessionRequested && input.registryActiveProjectId && allowed[input.registryActiveProjectId]) {
      return input.registryActiveProjectId;
    }
    if (input.userExplicitlySelectedProjectId && allowed[input.userExplicitlySelectedProjectId]) {
      return input.userExplicitlySelectedProjectId;
    }
    return null;
  }

  function shouldAutoHydrateProjectChat(input) {
    input = input || {};
    if (!input.activeProjectId) return false;
    if (input.resumeSessionRequested) return true;
    return input.userExplicitlySelectedProjectId === input.activeProjectId;
  }

  function shouldUseCachedRegistryFallback(flags) {
    flags = flags || readSessionFlags();
    return flags.resumeSessionRequested || Boolean(flags.userExplicitlySelectedProjectId);
  }

  function hasPersistedSessionStorageHints(storage) {
    storage = storage || {};
    return Boolean(storage.activeProjectId || storage.activeProjectName || storage.registryCachePresent);
  }

  function shouldShowResumePreviousSession(input) {
    input = input || {};
    if (input.resumeSessionRequested || input.activeProjectId) return false;
    return (input.registryProjectIds && input.registryProjectIds.length > 0) || input.hasPersistedSessionHints;
  }

  global.CommandCenterCleanStartup = {
    USER_SELECTED_PROJECT_SESSION_KEY: USER_SELECTED_PROJECT_SESSION_KEY,
    RESUME_SESSION_REQUESTED_SESSION_KEY: RESUME_SESSION_REQUESTED_SESSION_KEY,
    FRESH_LOAD_SESSION_KEY: FRESH_LOAD_SESSION_KEY,
    readSessionFlags: readSessionFlags,
    markFreshLoadSession: markFreshLoadSession,
    markUserSelectedProject: markUserSelectedProject,
    markResumeSessionRequested: markResumeSessionRequested,
    clearResumeSessionFlags: clearResumeSessionFlags,
    resolveStartupActiveProjectId: resolveStartupActiveProjectId,
    shouldAutoHydrateProjectChat: shouldAutoHydrateProjectChat,
    shouldUseCachedRegistryFallback: shouldUseCachedRegistryFallback,
    hasPersistedSessionStorageHints: hasPersistedSessionStorageHints,
    shouldShowResumePreviousSession: shouldShowResumePreviousSession,
  };
})(window);
