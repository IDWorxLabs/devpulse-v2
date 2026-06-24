/**
 * UVL Verification Execution V1 — failure classification.
 */

import type { VerificationFailureClass } from './uvl-verification-execution-v1-types.js';
import type { WorkspaceValidationResults } from './workspace-verification-checks.js';

export function classifyVerificationFailure(input: {
  checks: WorkspaceValidationResults;
  executionSucceeded: boolean;
}): { failureClass: VerificationFailureClass; failureDetail: string } {
  if (!input.checks.buildSuccess) {
    return { failureClass: 'Build Failure', failureDetail: 'Application build output missing' };
  }
  if (!input.checks.previewLoads) {
    return { failureClass: 'Preview Failure', failureDetail: 'Preview did not load from live runtime' };
  }
  if (!input.executionSucceeded) {
    return { failureClass: 'Runtime Failure', failureDetail: 'Verification execution chain failed' };
  }
  if (!input.checks.navigationWorks) {
    return { failureClass: 'Navigation Failure', failureDetail: 'Navigation not proven in live preview' };
  }
  if (!input.checks.blueprintValidationPasses) {
    return { failureClass: 'Blueprint Failure', failureDetail: 'Blueprint validation failed' };
  }
  if (!input.checks.featureRealityPasses) {
    return { failureClass: 'Feature Failure', failureDetail: 'Feature reality validation failed' };
  }
  if (!input.checks.engineeringRealityPasses) {
    return { failureClass: 'Engineering Failure', failureDetail: 'Engineering reality validation failed' };
  }
  return { failureClass: 'None', failureDetail: '' };
}
