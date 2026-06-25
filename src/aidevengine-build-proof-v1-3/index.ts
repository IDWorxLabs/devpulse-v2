export {
  AIDEVENGINE_BUILD_PROOF_V1_3_PASS_TOKEN,
  AIDEVENGINE_BUILD_PROOF_V1_3_ARTIFACT_DIR,
  AIDEVENGINE_BUILD_PROOF_V1_3_REPORT_TITLE,
  AIDEVENGINE_BUILD_PROOF_V1_2_BASELINE,
} from './build-proof-v1-3-bounds.js';

export type {
  VisualRuntimeCheck,
  VisualRuntimeCheckCategory,
  VisualRuntimeEvidence,
  AuthorityPrerequisiteEntry,
  AuthorityPrerequisiteMap,
} from './visual-runtime-evidence-types.js';

export {
  TASK_TRACKER_PRODUCT_REQUEST,
  TASK_TRACKER_PROOF_SCENARIO_ANSWERS,
  buildEnrichedPrompt,
  countWorkspaceSourceFiles,
  inspectTaskTrackerBehaviours,
} from '../aidevengine-build-proof-v1-2/task-tracker-proof-scenario.js';

export type {
  AuthorityConsumptionEntry,
  AuthorityConsumptionMap,
  BuildMaterializationEvidence,
  BuildProofMaterializationHandoff,
  EnrichedRequirementsEvidence,
  LaunchEvidenceBundle,
  UvlBehaviourEvidenceItem,
  UvlBehaviourEvidenceRecord,
  UvlBehaviourKey,
} from '../aidevengine-build-proof-v1-2/launch-evidence-handoff-types.js';

export { buildLaunchEvidenceBundle } from '../aidevengine-build-proof-v1-2/launch-evidence-handoff-adapter.js';

export {
  runBoundedVisualRuntimeVerification,
  probePlaywrightAvailable,
} from './bounded-visual-runtime-verifier.js';

export {
  applyLaunchEvidenceHandoffV13,
  previewArtifactPath,
} from './launch-evidence-handoff-adapter-v1-3.js';

export { buildAuthorityPrerequisiteMap } from './authority-prerequisite-mapper.js';
