/**
 * Connected Autonomous Build Execution Foundation — constants and registry.
 */

import type { BuildOutputState } from './connected-build-execution-types.js';

export const CONNECTED_BUILD_EXECUTION_FOUNDATION_PASS_TOKEN =
  'CONNECTED_BUILD_EXECUTION_FOUNDATION_PASS';
export const CONNECTED_BUILD_EXECUTION_OWNER_MODULE =
  'devpulse_connected_build_execution_foundation';
export const CONNECTED_BUILD_EXECUTION_PHASE =
  'Phase 25.20 — Connected Autonomous Build Execution Foundation';
export const CONNECTED_BUILD_EXECUTION_REPORT_TITLE =
  'CONNECTED_BUILD_EXECUTION_FOUNDATION_REPORT';
export const CONNECTED_BUILD_EXECUTION_CACHE_KEY_PREFIX =
  'connected-build-execution-foundation-v1';
export const MAX_CONNECTED_BUILD_EXECUTION_HISTORY = 16;
export const MAX_MANIFEST_ENTRIES = 32;
export const MAX_RECOMMENDED_ACTIONS = 12;
export const MAX_MISSING_COMPONENTS = 12;

export const CONNECTED_BUILD_EXECUTION_CORE_QUESTION =
  'Can AiDevEngine produce a verifiable build output from an approved execution plan?';

export const BUILD_OUTPUT_STATES: readonly BuildOutputState[] = [
  'BUILD_OUTPUT_PROVEN',
  'BUILD_OUTPUT_PARTIALLY_PROVEN',
  'BUILD_OUTPUT_NOT_PROVEN',
  'BUILD_OUTPUT_BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const REQUIRED_INPUT_AUTHORITIES = [
  'autonomous-repair-loop',
  'autonomous-builder-execution-planner',
  'world2-execution-engine',
  'world2-change-set-authority',
  'world2-workspace-population',
  'world2-workspace-materialization',
  'world2-repository-snapshot',
  'world2-change-set-materializer',
  'world2-dry-run-execution-composer',
] as const;

export const ORCHESTRATION_FLOW = [
  'Requirements',
  'Execution Plan',
  'Build Output Manifest',
  'Generated Artifact Set',
  'BUILD_OUTPUT_COMPLETE',
] as const;

export const BUILD_OUTPUT_SAFETY_GUARANTEES = [
  'Read-only orchestration only',
  'No file creation',
  'No workspace creation',
  'No repository copy',
  'No command execution',
  'No runtime launch',
  'No preview launch',
  'No deployment',
  'realFileMutationPerformed always false',
] as const;

export function isBuildOutputState(value: string): value is BuildOutputState {
  return (BUILD_OUTPUT_STATES as readonly string[]).includes(value);
}
