/**
 * ASE — launch router.
 */

import type { LaunchReadinessPipelineResult } from '../launch-readiness-authority-v2/launch-readiness-types.js';

export function routeAseLaunch(input: {
  launchReadiness: LaunchReadinessPipelineResult;
}): {
  readOnly: true;
  launchReady: boolean;
  blocked: boolean;
  verdict: LaunchReadinessPipelineResult['verdict']['verdict'];
  nextAction: string;
  routingTarget: string | null;
} {
  return {
    readOnly: true,
    launchReady: input.launchReadiness.verdict.verdict === 'LAUNCH_READY',
    blocked: input.launchReadiness.verdict.verdict === 'BLOCKED',
    verdict: input.launchReadiness.verdict.verdict,
    nextAction: input.launchReadiness.verdict.requiredNextStep,
    routingTarget: input.launchReadiness.verdict.routingTarget,
  };
}
