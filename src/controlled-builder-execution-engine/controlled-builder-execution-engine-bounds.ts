/**
 * Controlled Builder Execution Engine — runtime bounds (Phase 24C).
 */

export const CONTROLLED_BUILDER_EXECUTION_ENGINE_PASS_TOKEN =
  'CONTROLLED_BUILDER_EXECUTION_ENGINE_PASS';
export const CONTROLLED_BUILDER_EXECUTION_ENGINE_OWNER_MODULE =
  'aidevengine_controlled_builder_execution_engine';

export const MAX_EXECUTION_SESSIONS = 32;
export const MAX_AUDIT_TRAIL_RECORDS = 5000;
export const MAX_SESSION_EVIDENCE = 512;
export const MAX_WORKSPACE_VIRTUAL_FILES = 256;

/** Phase 24C approved action types — no unrestricted shell or dependency install. */
export const PHASE_24C_ALLOWED_ACTION_TYPES = [
  'CREATE_FOLDER',
  'CREATE_FILE',
  'MODIFY_FILE',
  'GENERATE_CODE',
  'GENERATE_COMPONENT',
  'GENERATE_SCREEN',
] as const;

/** Blocked until later authority phases. */
export const PHASE_24C_BLOCKED_ACTION_TYPES = [
  'DELETE_FILE',
  'RUN_COMMAND',
  'INSTALL_DEPENDENCY',
  'UPDATE_CONFIGURATION',
  'GENERATE_API',
] as const;

/** Future mobile build session extension points — not implemented in 24C. */
export const FUTURE_MOBILE_BUILD_SESSION_TYPES = [
  'ANDROID_BUILD_SESSION',
  'IOS_BUILD_SESSION',
  'EXPO_BUILD_SESSION',
  'ANDROID_RUNTIME_START',
  'IOS_RUNTIME_START',
] as const;

export type FutureMobileBuildSessionType = (typeof FUTURE_MOBILE_BUILD_SESSION_TYPES)[number];
