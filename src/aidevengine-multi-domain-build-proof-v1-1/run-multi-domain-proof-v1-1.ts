/**
 * AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_1 — scenario runner with CQI handoff repair.
 */

import { runMultiDomainProofScenario } from '../aidevengine-multi-domain-build-proof-v1/run-multi-domain-scenario.js';
import type { MultiDomainScenarioDefinition } from '../aidevengine-multi-domain-build-proof-v1/multi-domain-scenario-types.js';
import type { MultiDomainScenarioResult } from '../aidevengine-multi-domain-build-proof-v1/multi-domain-scenario-types.js';

export async function runMultiDomainProofScenarioV11(input: {
  scenario: MultiDomainScenarioDefinition;
  projectRootDir: string;
  artifactRootDir: string;
}): Promise<MultiDomainScenarioResult> {
  return runMultiDomainProofScenario({
    ...input,
    useRegisteredRequirementDiscovery: true,
  });
}
