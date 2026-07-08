/**
 * Registry Sovereignty V1 — backward-compatible authority re-exports.
 */

export {
  assertUserRegistryContainsOnlyUserProjects,
  countRegistryTierProjects,
  listUserFacingActiveProjectIds,
  migratePollutedUserRegistry,
  rebuildUserWorkspaceCache,
} from '../project-registry-sovereignty/index.js';

export { enforceUserRegistrySovereigntyOnWrite } from '../project-registry-sovereignty/registry-sovereignty-engine.js';
