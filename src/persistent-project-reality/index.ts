/**
 * Persistent Project Reality V1 — public API.
 */

export {
  PERSISTENT_PROJECT_REALITY_V1_PASS_TOKEN,
  PERSISTENT_PROJECTS_DIR,
  PROJECT_JSON_FILENAME,
  AIDEV_METADATA_DIR,
  SOURCE_DIR,
  AIDEV_MANIFEST_FILENAME,
  AIDEV_FEATURE_CONTRACT_FILENAME,
  AIDEV_PRODUCTION_VALIDATION_FILENAME,
  AIDEV_BUILD_HISTORY_LINKS_FILENAME,
  AIDEV_PROJECT_FILE_INDEX_FILENAME,
  AIDEV_EXPORT_METADATA_FILENAME,
  AIDEV_AUDIT_LOG_FILENAME,
  type PersistentProjectRealityStatus,
  type PromotionStatus,
  type PersistentProjectRecord,
  type PersistentProjectFileIndexEntry,
  type PersistentProjectFileIndex,
  type PersistentProjectExportMetadata,
  type PersistentProjectRealityEvidence,
  type PersistentProjectPromotionResult,
} from './persistent-project-reality-types.js';

export {
  persistentProjectRoot,
  persistentProjectSourceRoot,
  persistentProjectAidevDir,
  persistentProjectPaths,
  relativeFromProjectRoot,
} from './persistent-project-reality-paths.js';

export { buildProjectFileIndex } from './persistent-project-reality-file-index.js';
export { buildExportMetadata } from './persistent-project-reality-export-metadata.js';
export {
  syncBuildWorkspaceToPersistentSource,
  promotePersistentProjectReality,
  recordPersistentProjectFailureEvidence,
} from './persistent-project-reality-promoter.js';
export { updateProjectRegistryPersistentReality, ensureRegistryProjectRecord } from './persistent-project-reality-registry.js';
export { applyPersistentProjectRealityToManifest } from './persistent-project-reality-manifest.js';
export {
  buildPersistentProjectRealityTraceEvents,
  persistentProjectRealityTraceTitles,
} from './persistent-project-reality-trace-events.js';
export {
  verifyPersistentProjectReality,
  persistentProjectWorkspaceExists,
  type PersistentProjectRealityCheck,
} from './persistent-project-reality-validator.js';
export {
  recordPersistentProjectReality,
  buildFailurePersistentProjectEvidence,
} from './persistent-project-reality-recorder.js';
