/**
 * AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_1 — launch handoff with registered requirement discovery.
 */

import { applyMultiDomainLaunchEvidenceHandoff } from '../aidevengine-multi-domain-build-proof-v1/multi-domain-launch-handoff.js';

export function applyMultiDomainLaunchEvidenceHandoffV1_1(
  input: Parameters<typeof applyMultiDomainLaunchEvidenceHandoff>[0],
): ReturnType<typeof applyMultiDomainLaunchEvidenceHandoff> {
  return applyMultiDomainLaunchEvidenceHandoff({
    ...input,
    useRegisteredRequirementDiscovery: true,
  });
}
