export {
  AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_PASS_TOKEN,
  AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_ARTIFACT_DIR,
  AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_REPORT_TITLE,
  MULTI_DOMAIN_LAUNCH_READY_MIN_COUNT,
  MULTI_DOMAIN_SCENARIO_COUNT,
} from './multi-domain-proof-bounds.js';

export type {
  DomainBehaviourSpec,
  DomainBehaviourEvidenceItem,
  DomainBehaviourEvidenceRecord,
  MultiDomainScenarioDefinition,
  MultiDomainScenarioResult,
  MultiDomainScenarioVerdict,
} from './multi-domain-scenario-types.js';

export {
  MULTI_DOMAIN_PROOF_SCENARIOS,
  buildScenarioEnrichedPrompt,
} from './multi-domain-scenario-registry.js';

export { inspectDomainBehaviours } from './domain-behaviour-inspector.js';
export { collectDomainProductArchitectureEvidence } from './domain-architecture-collector.js';
export { runDomainBoundedVisualRuntimeVerification } from './domain-visual-runtime-verifier.js';
export {
  applyMultiDomainLaunchEvidenceHandoff,
  previewArtifactPath,
} from './multi-domain-launch-handoff.js';
export { resetMultiDomainProofModules } from './reset-proof-modules.js';
export { runMultiDomainProofScenario } from './run-multi-domain-scenario.js';
