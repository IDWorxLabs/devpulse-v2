/**
 * Code Generation Engine V1 — registry constants.
 */

export const CODE_GENERATION_ENGINE_V1_PASS_TOKEN = 'CODE_GENERATION_ENGINE_V1_PASS';
export const CODE_GENERATION_ENGINE_OWNER_MODULE = 'code_generation_engine';
export const CODE_GENERATION_ENGINE_PHASE = '27.1';
export const CODE_GENERATION_ENGINE_CORE_QUESTION =
  'Can AiDevEngine generate a real working browser app from a simple user idea?';

export const TASK_TRACKER_PROFILE_ID = 'TASK_TRACKER_WEB_V1';

export const TASK_TRACKER_DETECTION_PATTERNS = [
  /task tracker/i,
  /todo app/i,
  /todo list/i,
  /track tasks/i,
] as const;

export const TASK_TRACKER_FEATURE_PATTERNS = {
  add: /add tasks?|create tasks?|new tasks?/i,
  complete: /mark.*complete|complete tasks?|checkbox|toggle.*done/i,
  delete: /delete tasks?|remove tasks?/i,
  filter: /filter.*all|all\/active\/completed|active\/completed/i,
  activeCount: /active tasks? count|remaining active|count of remaining/i,
  browser: /browser|web/i,
  ui: /clean|modern|ui/i,
} as const;
