/**
 * Project Tab Context Switch V1 — full workspace switch on top project tab click.
 */

export {
  PROJECT_TAB_CONTEXT_SWITCH_PASS_TOKEN,
  type ProjectContextLoadStatus,
  type ProjectChatContextSnapshot,
  type ProjectLivePreviewStateSnapshot,
  type ProjectExecutionTraceStateSnapshot,
  type ProjectNotificationSnapshot,
  type ResolvedProjectContext,
  type ProjectTabSwitchResult,
  type ProjectContextTraceEvent,
} from './project-context-types.js';

export {
  LISA_ACCEPTED_TERMS,
  LISA_DOMAIN_LABEL,
  LISA_PROJECT_DISPLAY_NAME,
  isLisaProjectName,
  promptMentionsLisaOrAccessibility,
  promptMentionsActiveProjectName,
  resolveLisaProjectDomain,
  resolveLisaDisplayName,
  lisaKeywordsForProject,
  shouldSuppressTaskTrackingClassification,
  filterMisplacedTaskDomainIds,
  filterTaskTrackingKeywordsFromBoilerplate,
  proposedNameShouldNotBeTaskTracker,
  isRealTaskTrackerPrompt,
  isBuildBoilerplateTaskCue,
} from './project-context-classifier-guard.js';

export {
  loadProjectContext,
  loadActiveProjectContext,
  upgradeProjectContextForLisaIfNeeded,
} from './project-context-loader.js';

export {
  executeProjectTabContextSwitch,
  openProjectFromRegistry,
} from './project-tab-switch-controller.js';

export {
  buildProjectContextResetSnapshot,
  buildProjectContextResetTraceEvents,
  type ProjectContextResetSnapshot,
} from './project-context-reset.js';

export {
  traceProjectTabClicked,
  traceProjectContextLoadStarted,
  traceRegistryProjectRecordLoaded,
  tracePersistentProjectMetadataLoaded,
  traceProjectContextRestored,
  traceStaleProjectWarningsCleared,
  traceCommandCenterRenderStateReset,
  traceProjectTabContextSwitchCompleted,
  tracePromptClassificationUsedActiveProjectContext,
  traceProjectAlignmentPassed,
} from './project-context-trace-events.js';

export {
  isFullProjectContextLoaded,
  commandCenterShouldHideGreeting,
  greetingAndProjectWarningWouldOverlap,
  tabSwitchOnlyChangedVisualState,
  livePreviewLinkedToProject,
} from './project-context-validator.js';
