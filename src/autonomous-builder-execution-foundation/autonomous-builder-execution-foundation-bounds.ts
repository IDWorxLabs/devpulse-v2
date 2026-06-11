/**
 * Autonomous Builder Execution Foundation — runtime bounds (Phase 24B).
 */

export const AUTONOMOUS_BUILDER_EXECUTION_FOUNDATION_PASS_TOKEN =
  'AUTONOMOUS_BUILDER_EXECUTION_FOUNDATION_PASS';
export const AUTONOMOUS_BUILDER_EXECUTION_FOUNDATION_OWNER_MODULE =
  'aidevengine_autonomous_builder_execution_foundation';

export const MAX_ACTION_QUEUE_SIZE = 1000;
export const MAX_QUEUE_AUDIT_ENTRIES = 128;
export const MAX_EXECUTION_WORKSPACES = 16;
export const MAX_EXECUTION_EVIDENCE = 256;
export const MAX_EXECUTION_PLANS = 32;

/** World 2 isolation — never execute against DevPulse production workspace. */
export const WORLD2_ISOLATION_RULE =
  'Execution workspace must be isolated from DevPulse production workspace';
export const FORBIDDEN_EXECUTION_TARGET = 'DevPulse production workspace';
