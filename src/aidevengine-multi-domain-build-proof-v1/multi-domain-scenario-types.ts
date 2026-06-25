/**
 * AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1 — scenario and result types.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ProductArchitectureEvidence } from '../aidevengine-build-proof-v1-4/product-architecture-evidence-types.js';
import type { VisualRuntimeEvidence } from '../aidevengine-build-proof-v1-3/visual-runtime-evidence-types.js';
import type {
  BuildMaterializationEvidence,
  EnrichedRequirementsEvidence,
  LaunchEvidenceBundle,
} from '../aidevengine-build-proof-v1-2/launch-evidence-handoff-types.js';
import type { applyMultiDomainLaunchEvidenceHandoff } from './multi-domain-launch-handoff.js';

export interface DomainBehaviourSpec {
  id: string;
  label: string;
  pattern: RegExp;
  critical: boolean;
  category: string;
}

export interface MultiDomainScenarioDefinition {
  id: string;
  productDomain: string;
  productRequest: string;
  clarificationAnswers: readonly string[];
  suiteProfile: string;
  productName: string;
  codegenProfile: GeneratedAppProfile;
  entityLabel: string;
  entitySlug: string;
  navLabel: string;
  behaviourSpecs: readonly DomainBehaviourSpec[];
  knownLimitations: readonly string[];
  domainDescription: string;
  hasSearch: boolean;
  runtimeFilterMode: 'search-only' | 'task-filters' | 'none';
}

export interface DomainBehaviourEvidenceItem {
  readOnly: true;
  id: string;
  label: string;
  category: string;
  critical: boolean;
  passed: boolean;
  detail: string;
  source: 'generated-source' | 'build-artifact';
}

export interface DomainBehaviourEvidenceRecord {
  readOnly: true;
  workspacePath: string | null;
  behaviours: readonly DomainBehaviourEvidenceItem[];
  passedCount: number;
  totalCount: number;
  allBehavioursPresent: boolean;
}

export type MultiDomainScenarioVerdict = 'LAUNCH_READY' | 'PARTIAL' | 'FAIL';

export interface MultiDomainScenarioResult {
  scenario: MultiDomainScenarioDefinition;
  enrichedRequirements: EnrichedRequirementsEvidence | null;
  buildMaterialization: BuildMaterializationEvidence | null;
  behaviourEvidence: DomainBehaviourEvidenceRecord | null;
  visualRuntime: VisualRuntimeEvidence | null;
  productArchitectureEvidence: ProductArchitectureEvidence | null;
  launchEvidenceBundle: LaunchEvidenceBundle | null;
  handoff: ReturnType<typeof applyMultiDomainLaunchEvidenceHandoff> | null;
  founderLaunchVerdict: string;
  launchBlockers: readonly string[];
  scenarioVerdict: MultiDomainScenarioVerdict;
  launchReady: boolean;
  failureReason: string | null;
  requirementCount: number;
  architectureScore: number | null;
  featureRealityScore: number | null;
  engineeringRealityScore: number | null;
  uvlCoverage: number | null;
  uvlConfidence: number | null;
  aflaVerdict: string | null;
  aflaScore: number | null;
}
