export {
  AIDEVENGINE_BUILD_PROOF_V1_4_PASS_TOKEN,
  AIDEVENGINE_BUILD_PROOF_V1_4_ARTIFACT_DIR,
  AIDEVENGINE_BUILD_PROOF_V1_4_REPORT_TITLE,
  AIDEVENGINE_BUILD_PROOF_V1_3_BASELINE,
} from './build-proof-v1-4-bounds.js';

export type {
  ProductArchitectureEvidenceCategory,
  ProductArchitectureEvidenceItem,
  ProductArchitectureEvidence,
  ArchitectureConsumptionEntry,
  ArchitectureConsumptionMap,
} from './product-architecture-evidence-types.js';

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
} from '../aidevengine-build-proof-v1-3/bounded-visual-runtime-verifier.js';

export type { VisualRuntimeEvidence } from '../aidevengine-build-proof-v1-3/visual-runtime-evidence-types.js';

export { collectBoundedProductArchitectureEvidence } from './bounded-product-architecture-collector.js';

export {
  applyLaunchEvidenceHandoffV14,
  previewArtifactPath,
} from './launch-evidence-handoff-adapter-v1-4.js';

export { buildArchitectureConsumptionMap } from './architecture-consumption-mapper.js';
