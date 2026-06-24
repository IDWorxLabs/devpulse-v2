/**
 * Production Readiness Gate V1 — launch flow integration.
 * Runs after AFLA in the Build → Preview → Verify → Review → Production chain.
 */

import type { ProductionReadinessGateV1Assessment } from './production-readiness-gate-v1-types.js';
import { runProductionReadinessGateV1 } from './production-readiness-gate-assessor.js';

export interface ProductionReadinessLaunchBridgeResult {
  readOnly: true;
  productionReadinessScore: number;
  productionVerdict: ProductionReadinessGateV1Assessment['productionReadinessVerdict'];
  productionPassToken: string;
  launchChainComplete: boolean;
  blocksProductionDeployment: boolean;
  summary: string;
}

export function assessProductionReadinessAfterLaunch(input: {
  projectRootDir?: string;
  profile?: string | null;
  productPrompt?: string | null;
  productName?: string | null;
}): ProductionReadinessLaunchBridgeResult {
  const assessment = runProductionReadinessGateV1({
    projectRootDir: input.projectRootDir,
    profiles: input.profile ? [input.profile] : undefined,
  });

  const blocksProductionDeployment =
    assessment.productionReadinessVerdict === 'NOT_PRODUCTION_READY' ||
    assessment.productionReadinessVerdict === 'NEEDS_PRODUCTION_HARDENING';

  const upstream = assessment.categoryResults[0]?.upstreamEvidence;

  return {
    readOnly: true,
    productionReadinessScore: assessment.productionReadinessScore,
    productionVerdict: assessment.productionReadinessVerdict,
    productionPassToken: assessment.passToken,
    launchChainComplete: Boolean(
      upstream?.buildProven &&
        upstream.previewProven &&
        upstream.verificationProven &&
        upstream.launchReady,
    ),
    blocksProductionDeployment,
    summary: `Production Readiness ${assessment.productionReadinessScore}/100 — ${assessment.productionReadinessVerdict.replaceAll('_', ' ')}`,
  };
}
