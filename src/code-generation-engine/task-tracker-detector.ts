/**
 * Task Tracker idea detection for Code Generation Engine V1.
 */

import {
  TASK_TRACKER_DETECTION_PATTERNS,
  TASK_TRACKER_FEATURE_PATTERNS,
  TASK_TRACKER_PROFILE_ID,
} from './code-generation-engine-registry.js';
import type { GeneratedAppProfile, TaskTrackerRequirements } from './code-generation-engine-types.js';

function normalizePrompt(rawPrompt: string): string {
  return rawPrompt.trim().replace(/\s+/g, ' ');
}

export function detectTaskTrackerIdea(rawPrompt: string): boolean {
  const normalized = normalizePrompt(rawPrompt);
  if (normalized.length < 20) return false;

  const hasProductSignal = TASK_TRACKER_DETECTION_PATTERNS.some((pattern) => pattern.test(normalized));
  const hasTaskFlow =
    TASK_TRACKER_FEATURE_PATTERNS.add.test(normalized) &&
    (TASK_TRACKER_FEATURE_PATTERNS.complete.test(normalized) ||
      TASK_TRACKER_FEATURE_PATTERNS.delete.test(normalized));

  return hasProductSignal || (hasTaskFlow && /tasks?/i.test(normalized));
}

export function extractTaskTrackerRequirements(rawPrompt: string): TaskTrackerRequirements {
  const normalized = normalizePrompt(rawPrompt);
  return {
    readOnly: true,
    profile: TASK_TRACKER_PROFILE_ID,
    addTask: TASK_TRACKER_FEATURE_PATTERNS.add.test(normalized) || /tasks?/i.test(normalized),
    completeTask:
      TASK_TRACKER_FEATURE_PATTERNS.complete.test(normalized) || /complete|done|checkbox/i.test(normalized),
    deleteTask: TASK_TRACKER_FEATURE_PATTERNS.delete.test(normalized) || /delete|remove/i.test(normalized),
    filterAllActiveCompleted:
      TASK_TRACKER_FEATURE_PATTERNS.filter.test(normalized) || /filter|all.*active|active.*completed/i.test(normalized),
    activeTaskCount:
      TASK_TRACKER_FEATURE_PATTERNS.activeCount.test(normalized) || /remaining|active count|count/i.test(normalized),
    cleanModernUi: TASK_TRACKER_FEATURE_PATTERNS.ui.test(normalized) || /clean|modern|ui/i.test(normalized),
    browserRuntime: TASK_TRACKER_FEATURE_PATTERNS.browser.test(normalized) || /browser|web/i.test(normalized),
  };
}

export function resolveGeneratedAppProfile(rawPrompt: string): GeneratedAppProfile | null {
  return detectTaskTrackerIdea(rawPrompt) ? TASK_TRACKER_PROFILE_ID : null;
}
