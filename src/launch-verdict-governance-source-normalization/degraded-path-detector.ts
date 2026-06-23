/**
 * Phase 27.06 — Degraded governance path detector (V1).
 */

import type {
  DegradedPathDetection,
  GovernanceSourceAudit,
  LaunchVerdictGovernanceUpstreamProducer,
} from './launch-verdict-governance-source-normalization-types.js';
import { LAUNCH_VERDICT_GOVERNANCE_CRASH_UPSTREAM_PRODUCER } from './launch-verdict-governance-source-normalization-registry.js';
import type { LaunchVerdictGovernanceAssessment } from '../launch-verdict-governance/launch-verdict-governance-types.js';

export function detectDegradedGovernancePath(input: {
  governance: Partial<LaunchVerdictGovernanceAssessment> | null | undefined;
  sourceAudit: GovernanceSourceAudit;
  degraded?: boolean;
  upstreamProducer?: LaunchVerdictGovernanceUpstreamProducer;
}): DegradedPathDetection {
  const governance = input.governance;
  const hasScalarsOnly =
    governance != null &&
    typeof governance === 'object' &&
    ('finalLaunchVerdict' in governance || 'governanceConfidence' in governance) &&
    input.sourceAudit.missingFields.length > 0;

  const partialGovernancePayload = hasScalarsOnly && input.sourceAudit.missingFields.length > 0;
  const skippedAuthorityInitialization =
    partialGovernancePayload &&
    input.upstreamProducer !== 'LAUNCH_VERDICT_GOVERNANCE_AUTHORITY';

  const upstreamProducer: LaunchVerdictGovernanceUpstreamProducer = skippedAuthorityInitialization
    ? (input.upstreamProducer ??
      (LAUNCH_VERDICT_GOVERNANCE_CRASH_UPSTREAM_PRODUCER as LaunchVerdictGovernanceUpstreamProducer))
    : (input.upstreamProducer ?? input.sourceAudit.producerAuthority);

  return {
    readOnly: true,
    degradedPath: input.degraded === true || partialGovernancePayload,
    warningPath: input.degraded === true,
    partialGovernancePayload,
    skippedAuthorityInitialization,
    upstreamProducer,
    reason: skippedAuthorityInitialization
      ? `${upstreamProducer} produced partial launchVerdictGovernance without requiredEvidenceMissing/blockingAuthorities arrays`
      : null,
  };
}
