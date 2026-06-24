/**
 * World2 Real Instantiation V1 — public API.
 */

export {
  WORLD2_REAL_INSTANTIATION_V1_PASS_TOKEN,
  WORLD2_REAL_INSTANTIATION_V1_FAIL_TOKEN,
  WORLD2_REAL_INSTANTIATION_V1_REPORT_TITLE,
  WORLD2_REAL_INSTANTIATION_V1_ARTIFACT_DIR,
  WORLD2_WORKSPACE_PREFIX,
  WORLD2_WORLDS_DIR,
  MAX_WORLD2_REGISTRY_SIZE,
  MIN_MULTI_WORLD_PROOF,
  WORLD2_PROOF_PROFILES,
  WORLD2_EXECUTION_MODES,
  WORLD1_SENTINEL_PATHS,
  PRIOR_PASS_TOKENS,
} from './world2-real-instantiation-v1-bounds.js';

export type {
  World2InstanceStatus,
  World2PromotionState,
  World2RuntimeState,
  World2Instance,
  World2VerificationProof,
  World2ProductAssessment,
  WorldIsolationProof,
  World2RegistrySnapshot,
  World2PromotionProof,
  World2DestructionProof,
  World2MultiWorldResult,
  World2RealInstantiationAssessment,
} from './world2-real-instantiation-v1-types.js';

export {
  resetWorld2RegistryForTests,
  registerWorld2Instance,
  getWorld2Instance,
  listWorld2Instances,
  buildWorld2RegistrySnapshot,
  persistWorld2Registry,
  loadWorld2RegistryFromDisk,
} from './world2-registry.js';

export {
  createWorld2Instance,
  executeWorld2Instance,
  buildWorld2CloudJob,
  buildWorld2WorkspacePath,
  buildWorld2ArtifactDirectory,
} from './world2-instance-lifecycle.js';

export { promoteWorld2Instance } from './world2-promotion.js';
export { destroyWorld2Instance } from './world2-destruction.js';
export { buildWorldIsolationProof, hashWorld1BeforeExecution } from './world2-isolation-proof.js';
export { hashWorld1Sentinels, world1SentinelsUnchanged } from './world2-world1-protection.js';
export { runWorld2RealInstantiationV1 } from './world2-real-instantiation-assessor.js';
export { buildWorld2RealInstantiationV1ReportMarkdown } from './world2-real-instantiation-report-builder.js';
export { writeWorld2RealInstantiationArtifacts } from './world2-artifact-writer.js';
export {
  isWorld2RealInstantiationProven,
  loadWorld2RealInstantiationAssessmentFromDisk,
} from './world2-evidence-loader.js';
