/**
 * World 2 Workspace Population — constants and population registry.
 */

import type {
  World2PopulationCategory,
  World2PopulationReadinessState,
} from './world2-workspace-population-types.js';

export const WORLD2_WORKSPACE_POPULATION_PASS_TOKEN = 'WORLD2_WORKSPACE_POPULATION_PASS';
export const WORLD2_WORKSPACE_POPULATION_OWNER_MODULE = 'devpulse_world2_workspace_population';
export const WORLD2_WORKSPACE_POPULATION_PHASE = 'Phase 24O — World 2 Workspace Population Authority';
export const WORLD2_WORKSPACE_POPULATION_REPORT_TITLE = 'WORLD2_WORKSPACE_POPULATION_REPORT';
export const WORLD2_POPULATION_CACHE_KEY_PREFIX = 'world2-workspace-population-v1';
export const MAX_POPULATION_HISTORY = 16;
export const MAX_POPULATION_REASONS = 12;
export const MAX_POPULATION_ARTIFACTS = 32;

export const WORLD2_POPULATION_CORE_QUESTION =
  'What must exist inside the disposable workspace before execution begins?';

export const WORLD2_POPULATION_CATEGORIES: readonly World2PopulationCategory[] = [
  'PROJECT_STRUCTURE',
  'PROJECT_FILES',
  'REQUIREMENTS',
  'ARCHITECTURE',
  'EXECUTION_CONTEXT',
  'VALIDATION_CONTEXT',
  'ROLLBACK_CONTEXT',
] as const;

export const WORLD2_POPULATION_READINESS_STATES: readonly World2PopulationReadinessState[] = [
  'READY',
  'READY_WITH_WARNINGS',
  'BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const REQUIRED_POPULATION_AUTHORITIES = [
  'world2-disposable-workspace',
  'world2-change-set-authority',
  'autonomous-builder-execution-planner',
  'founder-test-integration',
] as const;

/** Population must never require these. */
export const WORLD2_POPULATION_NEVER_REQUIRE: readonly string[] = [
  'Live workspace mutation',
  'Production resource access',
  'External destructive actions',
  'World 1 live project copy without isolation boundary',
  'Unbounded repository deletion',
] as const;

export const BASE_REQUIRED_DIRECTORIES: readonly string[] = [
  'src',
  'architecture',
  'audit',
  'validation',
  'rollback',
] as const;

export function isWorld2PopulationReadinessState(
  value: string,
): value is World2PopulationReadinessState {
  return (WORLD2_POPULATION_READINESS_STATES as readonly string[]).includes(value);
}

export function resolveWorld2PopulationPath(workspaceId: string, segment: string): string {
  return `/world2/disposable/${workspaceId}/${segment.replace(/^\/+/, '')}`;
}

export function clampPopulationReadinessPercent(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
