/**
 * Engineering Intelligence Activation Authority V1 — main entry point.
 *
 * This is the single function AEO (or anything else) should call to ask "may we invoke the
 * Engineering Intelligence Runtime for this missing capability?". It composes evidence + policy +
 * decision + report. It never touches the filesystem, never generates code, and never installs
 * anything — it is a pure decision function.
 */

import { decideActivation } from './activation-decision-engine.js';
import { buildActivationReport } from './activation-report.js';
import { EIAA_DEFAULT_POLICY_CONFIG } from './engineering-intelligence-activation-types.js';
import type {
  EiaaActivationEvidence,
  EiaaActivationPolicyConfig,
  EiaaActivationReport,
} from './engineering-intelligence-activation-types.js';

export interface RunEngineeringIntelligenceActivationAuthorityInput {
  evidence: EiaaActivationEvidence;
  config?: Partial<EiaaActivationPolicyConfig>;
}

export function runEngineeringIntelligenceActivationAuthority(
  input: RunEngineeringIntelligenceActivationAuthorityInput,
): EiaaActivationReport {
  const config: EiaaActivationPolicyConfig = {
    readOnly: true,
    confidenceThreshold: input.config?.confidenceThreshold ?? EIAA_DEFAULT_POLICY_CONFIG.confidenceThreshold,
  };
  const decisionResult = decideActivation(input.evidence, config);
  return buildActivationReport(input.evidence, decisionResult);
}
