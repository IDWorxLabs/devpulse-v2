/**
 * Project Registry Startup Hydration — public API.
 */

export {
  PROJECT_REGISTRY_HYDRATION_TARGET_MS,
  PROJECT_REGISTRY_STARTUP_HYDRATION_PASS_TOKEN,
} from './project-registry-startup-hydration-types.js';
export type {
  PersistentProjectHydrationRecord,
  ProjectRegistryHydrationPhase,
  ProjectRegistryHydrationSnapshot,
} from './project-registry-startup-hydration-types.js';
export {
  getProjectRegistryHydrationSnapshot,
  isProjectRegistryHydrationReady,
  resetProjectRegistryStartupHydrationForTests,
  runProjectRegistryStartupHydration,
} from './project-registry-startup-hydrator.js';
