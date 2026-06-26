/**
 * Project Tab Context Switch — controller orchestrating full workspace switch.
 */

import { setRegistryActiveProject } from '../project-registry-v1/project-registry-v1-store.js';
import {
  resolveProjectContext,
  setActiveProjectId,
} from '../one-prompt-live-preview/workspace-tab-registry.js';
import {
  loadProjectContext,
  upgradeProjectContextForLisaIfNeeded,
} from './project-context-loader.js';
import { buildProjectContextResetTraceEvents } from './project-context-reset.js';
import {
  tracePersistentProjectMetadataLoaded,
  traceProjectContextLoadStarted,
  traceProjectContextRestored,
  traceProjectTabClicked,
  traceProjectTabContextSwitchCompleted,
  traceRegistryProjectRecordLoaded,
} from './project-context-trace-events.js';
import type { ProjectTabSwitchResult } from './project-context-types.js';

export function executeProjectTabContextSwitch(input: {
  projectId: string;
  rootDir?: string;
  source?: 'tab' | 'registry' | 'api';
}): ProjectTabSwitchResult {
  const projectId = input.projectId.trim();
  const events = [traceProjectTabClicked(projectId)];

  if (!projectId) {
    return {
      readOnly: true,
      ok: false,
      projectContext: null,
      executionTraceEvents: events,
      error: 'projectId is required',
    };
  }

  events.push(traceProjectContextLoadStarted(projectId));

  try {
    const record = setRegistryActiveProject({ projectId, rootDir: input.rootDir });
    resolveProjectContext({
      projectId: record.projectId,
      projectName: record.name,
      createIfMissing: true,
    });
    setActiveProjectId(record.projectId);
    events.push(traceRegistryProjectRecordLoaded(record.projectId, record.name));

    const loaded = loadProjectContext({ projectId, rootDir: input.rootDir });
    if (!loaded) {
      return {
        readOnly: true,
        ok: false,
        projectContext: null,
        executionTraceEvents: events,
        error: 'Project context could not be loaded',
      };
    }

    const projectContext = upgradeProjectContextForLisaIfNeeded(loaded);
    events.push(
      tracePersistentProjectMetadataLoaded(
        projectId,
        projectContext.persistentWorkspacePath,
      ),
    );
    events.push(traceProjectContextRestored(projectId, projectContext.domain));
    events.push(...buildProjectContextResetTraceEvents(projectId));
    events.push(traceProjectTabContextSwitchCompleted(projectId, projectContext.projectName));

    return {
      readOnly: true,
      ok: true,
      projectContext,
      executionTraceEvents: events,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'project context switch failed';
    return {
      readOnly: true,
      ok: false,
      projectContext: null,
      executionTraceEvents: events,
      error: message,
    };
  }
}

export function openProjectFromRegistry(input: {
  projectId: string;
  rootDir?: string;
}): ProjectTabSwitchResult {
  return executeProjectTabContextSwitch({
    projectId: input.projectId,
    rootDir: input.rootDir,
    source: 'registry',
  });
}
